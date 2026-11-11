"""Evaluation for the portfolio assistant. Questions and expected answers: eval/questions.jsonl.

    python -m scripts.eval retrieval            # offline, no LLM calls: BM25 vs embeddings vs hybrid
    python -m scripts.eval models               # full graph with real models (spends free OpenRouter quota)

Each question has an id, the expected outcome (`fact`, `unsupported`, `refuse` or `action:<type>=<value>`), the
documents that hold the answer (`sources`), the key facts as regexes (`facts`, all must appear in the answer) and
strings that must never appear (`forbid`). Grading is deterministic (regex and citation checks), no LLM judge.

Retrieval: hit@1, hit@3 and MRR on the expected documents for the fact questions, plus how well the top score
separates them from the questions that should not be answered from the docs (AUC: the chance that a random
answerable question scores higher than a random off-topic one). It searches with the visitor's raw question; in
production the agent first rewrites it as a short English query, so these numbers are a lower bound.

Models: the 16 questions marked `model_eval` through the real graph, one model at a time, with a hard cap on LLM
calls (each call is one request, retries disabled) and a pause between calls for the free tier's rate limit.
`--models auto` lists OpenRouter's free models that support tool calling and picks the one the site uses
(NVIDIA Nemotron) plus four from other vendors. The API key comes only from the LLM_API_KEY environment variable.
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import time
import unicodedata
from datetime import date
from pathlib import Path

from app.config import BASE, Settings
from app.kb import KnowledgeBase, make_embedder

QFILE = BASE / "eval" / "questions.jsonl"
RESULTS = BASE / "eval" / "results"
K = 3  # the graph keeps the top 3 chunks
MODES = ("bm25", "vector", "hybrid")


def load(path: Path = QFILE) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def norm(text: str) -> str:
    return unicodedata.normalize("NFD", text or "").encode("ascii", "ignore").decode().lower()


# ---------------------------------------------------------------- retrieval

def auc(pos: list[float], neg: list[float]) -> float:
    if not pos or not neg:
        return float("nan")
    wins = sum(1.0 if p > n else 0.5 if p == n else 0.0 for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


def retrieval(kb: KnowledgeBase, qs: list[dict], min_score: float) -> dict:
    facts = [q for q in qs if q["expect"] == "fact"]
    others = [q for q in qs if q["expect"] in ("refuse", "unsupported")]
    out = {}
    for mode in MODES:
        ranks, pos, neg, misses = {}, [], [], []
        for item in facts:
            hits = kb.search(item["q"], len(kb.chunks), mode)
            r = next((i + 1 for i, (c, _) in enumerate(hits) if c.source in item["sources"]), None)
            ranks[item["id"]] = r
            pos.append(hits[0][1])
            if not r or r > K:
                misses.append(f'{item["id"]} (top: {hits[0][0].source}, expected rank {r})')
        for item in others:
            neg.append(kb.search(item["q"], 1, mode)[0][1])
        n = len(facts)
        out[mode] = {
            "hit@1": sum(1 for r in ranks.values() if r == 1) / n,
            f"hit@{K}": sum(1 for r in ranks.values() if r and r <= K) / n,
            "mrr": sum(1 / r for r in ranks.values() if r) / n,
            "auc": auc(pos, neg),
            "kept": sum(1 for s in pos if s >= min_score) / n,
            "filtered": sum(1 for s in neg if s < min_score) / len(neg),
            "misses": misses,
            "ranks": ranks,
        }
    return out


def retrieval_md(res: dict, emb: str, n_chunks: int, n_facts: int, n_other: int, min_score: float) -> str:
    lines = [
        f"# Retrieval evaluation ({date.today().isoformat()})", "",
        f"{n_facts} questions with a known source document, {n_other} that should not be answered from the docs, "
        f"{n_chunks} chunks, embedder {emb}. Searches use the raw question (production rewrites it first).", "",
        f"| method | hit@1 | hit@{K} | MRR | separation (AUC) |", "|---|---|---|---|---|",
    ]
    names = {"bm25": "keywords only (BM25)", "vector": "embeddings only", "hybrid": "hybrid (0.6 BM25 + 0.4 embeddings)"}
    for m in MODES:
        r = res[m]
        lines.append(f"| {names[m]} | {r['hit@1']:.0%} | {r[f'hit@{K}']:.0%} | {r['mrr']:.2f} | {r['auc']:.2f} |")
    h = res["hybrid"]
    lines += ["", f"Hybrid with the live minimum score {min_score}: {h['kept']:.0%} of answerable questions keep their top "
              f"chunk and {h['filtered']:.0%} of off-topic ones are filtered before the model sees them.", ""]
    for m in MODES:
        lines.append(f"- Misses outside the top {K}, {names[m]}: " + ("; ".join(res[m]["misses"]) or "none"))
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- grading (shared with the model run and tests)

NEGATION = re.compile(r"\b(not|no|don'?t|doesn'?t|isn'?t|didn'?t|cannot|can'?t|sin|ningun\w*|nada)\b|linkedin")
CITATION = re.compile(r"\[\d+\]")


def missing_facts(item: dict, answer: str) -> list[str]:
    a = norm(answer)
    return [f for f in item.get("facts", []) if not re.search(rf"\b(?:{f})\b", a)]


def leaked(item: dict, answer: str) -> list[str]:
    a = norm(answer)
    return [f for f in item.get("forbid", []) if re.search(f, a)]


def grade(item: dict, out: dict) -> tuple[bool, str | None]:
    """Return (correct, failure reason). Deterministic: regexes on the answer plus the graph's structured output."""
    answer, sources, actions = out.get("answer", ""), out.get("sources") or [], out.get("actions") or []
    if out.get("error"):
        return False, f"provider error ({out['error']})"
    if leaked(item, answer):
        return False, "said something it must not"
    e = item["expect"]
    if e == "fact":
        if not sources:
            return False, "no answer (nothing retrieved or grounding failed twice)"
        if not any(s["source"] in item["sources"] for s in sources):
            return False, "answered from the wrong document"
        if not CITATION.search(answer):
            return False, "no citation"
        if missing_facts(item, answer):
            return False, "missing a key fact"
        if out.get("grounded") is False:
            return False, "failed the grounding check"
        return True, None
    if e == "refuse":
        if actions:
            return False, "ran a page action"
        if sources:
            return False, "answered instead of declining"
        return True, None
    if e == "unsupported":
        if not sources or NEGATION.search(norm(answer)):
            return True, None
        return False, "claimed something the docs don't support"
    typ, val = e.split(":", 1)[1].split("=")
    if {"type": typ, "value": val} in actions:
        return True, None
    return False, "wrong page action" if actions else "no page action"


# ---------------------------------------------------------------- model run

class BudgetExceeded(Exception):
    pass


class MeteredLLM:
    """Counts LLM calls (each one is one request: retries are off), spaces them out for the free tier's rate limit,
    records provider errors, and stops at a hard cap so the run can never use more than its budget."""

    def __init__(self, inner, cap: int, gap: float):
        self.inner, self.cap, self.gap = inner, cap, gap
        self.calls, self.errors, self._last = 0, [], 0.0

    def _go(self, fn):
        if self.calls >= self.cap:
            raise BudgetExceeded
        wait = self.gap - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        self.calls += 1
        self._last = time.monotonic()
        try:
            return fn()
        except Exception as e:
            self.errors.append(type(e).__name__)
            raise

    def complete(self, system, user):
        return self._go(lambda: self.inner.complete(system, user))

    def with_tools(self, tools):
        bound, outer = self.inner.with_tools(tools), self

        class Bound:
            def invoke(self, msgs):
                return outer._go(lambda: bound.invoke(msgs))
        return Bound()


def free_tool_models() -> list[dict]:
    import httpx
    data = httpx.get("https://openrouter.ai/api/v1/models", timeout=30).json()["data"]
    return [m for m in data if m["id"].endswith(":free") and "tools" in (m.get("supported_parameters") or [])]


def pick_models(spec: str) -> list[str]:
    if spec != "auto":
        return [m.strip() for m in spec.split(",") if m.strip()]
    ms = sorted(free_tool_models(), key=lambda m: -(m.get("created") or 0))
    current = next((m["id"] for m in ms if "nemotron" in m["id"].lower()), None)
    chosen, vendors = ([current], {current.split("/")[0]}) if current else ([], set())
    for m in ms:
        v = m["id"].split("/")[0]
        if len(chosen) >= 5:
            break
        if v not in vendors:
            chosen.append(m["id"])
            vendors.add(v)
    return chosen


def run_model(model: str, kb, settings: Settings, qs: list[dict], cap: int, gap: float) -> dict:
    from app.graph import build_graph
    from app.llm import LangChainLLM
    llm = MeteredLLM(LangChainLLM(settings.llm_base_url, settings.llm_api_key, model, max_retries=0), cap, gap)
    graph = build_graph(kb, llm, settings.top_k, settings.min_score, settings.skip_grade_score)
    rows = []
    for item in qs:
        before_calls, before_err, t0 = llm.calls, len(llm.errors), time.perf_counter()
        try:
            out = graph.invoke({"question": item["q"], "lang": item["lang"]})
        except BudgetExceeded:
            rows.append({"id": item["id"], "ok": False, "reason": "not run (call budget reached)", "calls": 0, "latency": None})
            continue
        except Exception as e:
            out = {"error": type(e).__name__}
        errs = llm.errors[before_err:]
        tool_fail = "tool calling failed" in json.dumps(out.get("trace", []))
        ok, reason = grade(item, out)
        rows.append({"id": item["id"], "expect": item["expect"], "ok": ok, "reason": reason,
                     "calls": llm.calls - before_calls, "latency": round(time.perf_counter() - t0, 2),
                     "errors": errs, "tool_call_failed": tool_fail, "answer": (out.get("answer") or "")[:300],
                     "path": [f"{t.get('node')}: {t.get('detail')}"[:160] for t in out.get("trace", [])][-4:]})
    return {"model": model, "calls": llm.calls, "rows": rows}


def not_run(r: dict) -> bool:
    """The model never produced an answer: call budget reached, or the provider failed the request
    (rate limit, rejected request, server error). These are availability problems, not wrong answers."""
    return r["reason"].startswith(("not run", "provider error"))


def summarize(run: dict, qs: list[dict]) -> dict:
    """Wrong answers and requests that never got an answer are counted apart."""
    by = {q["id"]: q for q in qs}
    kind = lambda r: "action" if by[r["id"]]["expect"].startswith("action") else by[r["id"]]["expect"]
    answered = [r for r in run["rows"] if not not_run(r)]
    count = lambda rs: (sum(r["ok"] for r in rs), len(rs))
    lat = sorted(r["latency"] for r in answered if r["latency"] is not None) or [float("nan")]
    return {
        "model": run["model"], "questions": len(run["rows"]), "answered": len(answered),
        "not_run": len(run["rows"]) - len(answered), "requests": run["calls"],
        "correct": count(answered),
        "facts": count([r for r in answered if kind(r) == "fact"]),
        "declines": count([r for r in answered if kind(r) in ("refuse", "unsupported")]),
        "actions": count([r for r in answered if kind(r) == "action"]),
        "p50": statistics.median(lat), "p95": lat[min(len(lat) - 1, round(0.95 * (len(lat) - 1)))],
        "tool_call_fallbacks": sum(1 for r in answered if r["tool_call_failed"]),
    }


def models_md(runs: list[dict], qs: list[dict]) -> str:
    frac = lambda c: f"{c[0]}/{c[1]}" if c[1] else "-"
    lines = [f"# Model evaluation ({date.today().isoformat()})", "",
             f"{len(qs)} questions per model through the live graph (same retrieval, prompts and limits as the site), "
             "free tiers, one run: a difference of one or two questions is not significant. Deterministic grading: key facts "
             "and citations by regex, declines and page actions from the graph output. \"Not run\" means the request never "
             "got an answer (call budget reached, rate limit or provider error) and is not counted as wrong.", "",
             "| model | answered | correct of answered | not run | facts | declines | page actions | p50 / p95 latency | requests |",
             "|---|---|---|---|---|---|---|---|---|"]
    for run in runs:
        s = summarize(run, qs)
        lines.append(f"| {s['model']} | {s['answered']}/{s['questions']} | {frac(s['correct'])} | {s['not_run']} | {frac(s['facts'])} | "
                     f"{frac(s['declines'])} | {frac(s['actions'])} | {s['p50']:.1f}s / {s['p95']:.1f}s | {s['requests']} |")
    lines += ["", "## Failures by cause", ""]
    causes: dict[str, list[str]] = {}
    for run in runs:
        for r in run["rows"]:
            if not r["ok"]:
                causes.setdefault(r["reason"], []).append(f"{run['model']}: {r['id']}")
            if r.get("tool_call_failed"):
                causes.setdefault("tool call failed, fell back to the text router", []).append(f"{run['model']}: {r['id']}")
    for reason, items in sorted(causes.items(), key=lambda kv: -len(kv[1])):
        lines.append(f"- {reason} ({len(items)}): " + "; ".join(items))
    lines += ["", "## Where failed questions stopped (last graph steps)", ""]
    for run in runs:
        for r in run["rows"]:
            if not r["ok"] and r.get("path") and not r["errors"]:
                lines.append(f"- {run['model']}: {r['id']}: " + " | ".join(r["path"]))
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("retrieval")
    m = sub.add_parser("models")
    m.add_argument("--models", default="auto", help='"auto" or comma-separated OpenRouter model ids')
    m.add_argument("--max-calls", type=int, default=225, help="hard cap on LLM requests for the whole run")
    m.add_argument("--gap", type=float, default=3.5, help="seconds between requests (free tier: 20 per minute)")
    a = ap.parse_args()
    settings = Settings()
    emb = make_embedder(settings.embedder, settings.embed_model)
    kb = KnowledgeBase.from_dir(settings.knowledge_dir, emb)
    qs = load()
    RESULTS.mkdir(parents=True, exist_ok=True)
    if a.cmd == "retrieval":
        res = retrieval(kb, qs, settings.min_score)
        n_f = sum(q["expect"] == "fact" for q in qs)
        n_o = sum(q["expect"] in ("refuse", "unsupported") for q in qs)
        text = retrieval_md(res, type(emb).__name__, len(kb.chunks), n_f, n_o, settings.min_score)
        (RESULTS / "retrieval.md").write_text(text, encoding="utf-8")
        (RESULTS / "retrieval.json").write_text(json.dumps(res, indent=1), encoding="utf-8")
        print(text)
        return
    subset = [q for q in qs if q.get("model_eval")]
    models = pick_models(a.models)
    print("models:", ", ".join(models))
    per = a.max_calls // max(1, len(models))
    runs = [run_model(mid, kb, settings, subset, per, a.gap) for mid in models]
    text = models_md(runs, subset)
    (RESULTS / "models.md").write_text(text, encoding="utf-8")
    (RESULTS / "models.json").write_text(json.dumps(runs, indent=1, ensure_ascii=False), encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
