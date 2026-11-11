"""Evaluation for the portfolio assistant (eval/questions.jsonl).

    python -m scripts.eval                 # retrieval only: offline, no LLM calls, uses the configured embedder
    python -m scripts.eval --e2e --limit 10   # full graph with the configured LLM (spends real quota!)

Retrieval metrics (questions that expect a document): hit@1, hit@k and MRR over the hybrid search, plus how well the
minimum score separates answerable questions from off-topic ones (the threshold is only useful if it does).
End-to-end metrics: correct outcome (answer from the right document / refusal / page action), grounding verdict,
latency p50/p95 and LLM calls per question. Results are printed and written to eval/results.md.
"""
from __future__ import annotations

import argparse
import json
import statistics
import time
from pathlib import Path

from app.config import BASE, Settings
from app.graph import build_graph
from app.kb import KnowledgeBase, make_embedder
from app.llm import make_llm

QFILE = BASE / "eval" / "questions.jsonl"
OUT = BASE / "eval" / "results.md"


def load() -> list[dict]:
    return [json.loads(line) for line in QFILE.read_text(encoding="utf-8").splitlines() if line.strip()]


def retrieval(kb: KnowledgeBase, qs: list[dict], k: int, min_score: float) -> list[str]:
    ranks, pos_top, neg_top = [], [], []
    for item in qs:
        hits = kb.search(item["q"], len(kb.chunks))
        top = hits[0][1]
        if item["expect"].startswith("source:"):
            want = item["expect"].split(":", 1)[1]
            r = next((i + 1 for i, (c, _) in enumerate(hits) if c.source == want), None)
            ranks.append(r)
            pos_top.append(top)
        elif item["expect"] == "refuse":
            neg_top.append(top)
    n = len(ranks)
    hit1 = sum(1 for r in ranks if r == 1) / n
    hitk = sum(1 for r in ranks if r and r <= k) / n
    mrr = sum(1 / r for r in ranks if r) / n
    kept = sum(1 for s in pos_top if s >= min_score) / len(pos_top)
    dropped = sum(1 for s in neg_top if s < min_score) / max(1, len(neg_top))
    return [
        f"| Retrieval ({n} questions with an expected document) | |",
        "|---|---|",
        f"| hit@1 | {hit1:.0%} |",
        f"| hit@{k} | {hitk:.0%} |",
        f"| MRR | {mrr:.2f} |",
        f"| answerable questions above min score {min_score} | {kept:.0%} |",
        f"| off-topic questions filtered by min score | {dropped:.0%} |",
        f"| top score, answerable (median) | {statistics.median(pos_top):.2f} |",
        f"| top score, off-topic (median) | {statistics.median(neg_top) if neg_top else 0:.2f} |",
    ]


class CountingLLM:
    """Wraps the real LLM and counts calls (plain completions + tool-calling invocations)."""

    def __init__(self, inner):
        self.inner, self.calls = inner, 0

    def complete(self, system, user):
        self.calls += 1
        return self.inner.complete(system, user)

    def with_tools(self, tools):
        bound, outer = self.inner.with_tools(tools), self

        class Bound:
            def invoke(self, msgs):
                outer.calls += 1
                return bound.invoke(msgs)
        return Bound()


def outcome_ok(item: dict, out: dict) -> bool:
    e = item["expect"]
    if e.startswith("source:"):
        return any(s["source"] == e.split(":", 1)[1] for s in out.get("sources", [])) and bool(out.get("grounded", True))
    if e == "refuse":
        return not out.get("sources") and not out.get("actions")
    typ, val = e.split(":", 1)[1].split("=")
    return {"type": typ, "value": val} in (out.get("actions") or [])


def e2e(kb, settings: Settings, qs: list[dict]) -> list[str]:
    llm = CountingLLM(make_llm(settings.llm_provider, settings.llm_base_url, settings.llm_api_key, settings.llm_model))
    graph = build_graph(kb, llm, settings.top_k, settings.min_score, settings.skip_grade_score)
    rows, lat, calls, ok, grounded, answered = [], [], [], 0, 0, 0
    for item in qs:
        before, t0 = llm.calls, time.perf_counter()
        try:
            out = graph.invoke({"question": item["q"], "lang": item["lang"]})
        except Exception as e:  # quota or provider error: record and keep going
            out = {"answer": f"error: {type(e).__name__}"}
        dt = time.perf_counter() - t0
        n = llm.calls - before
        good = outcome_ok(item, out)
        ok += good
        lat.append(dt)
        calls.append(n)
        if out.get("sources"):
            answered += 1
            grounded += bool(out.get("grounded"))
        rows.append(f"| {item['q'][:60]} | {item['expect']} | {'ok' if good else 'MISS'} | {n} | {dt:.1f}s |")
    lat_sorted = sorted(lat)
    p95 = lat_sorted[min(len(lat_sorted) - 1, int(round(0.95 * (len(lat_sorted) - 1))))]
    return [
        f"| End to end ({len(qs)} questions, {settings.llm_provider}: {settings.llm_model}) | |",
        "|---|---|",
        f"| correct outcome | {ok / len(qs):.0%} |",
        f"| answers that passed the grounding check | {grounded}/{answered} |",
        f"| latency p50 / p95 | {statistics.median(lat):.1f}s / {p95:.1f}s |",
        f"| LLM calls per question (mean / max) | {statistics.mean(calls):.1f} / {max(calls)} |",
        "",
        "| question | expected | result | LLM calls | latency |",
        "|---|---|---|---|---|",
        *rows,
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--e2e", action="store_true", help="run the full graph with the configured LLM (spends quota)")
    ap.add_argument("--limit", type=int, default=0, help="only the first N questions in --e2e mode")
    a = ap.parse_args()
    settings = Settings()
    emb = make_embedder(settings.embedder, settings.embed_model)
    kb = KnowledgeBase.from_dir(settings.knowledge_dir, emb)
    qs = load()
    lines = [f"# Assistant evaluation\n\nEmbedder: {type(emb).__name__}, top_k={settings.top_k}, "
             f"min score {settings.min_score}, {len(kb.chunks)} chunks.\n", *retrieval(kb, qs, settings.top_k, settings.min_score)]
    if a.e2e:
        lines += ["", *e2e(kb, settings, qs[: a.limit] if a.limit else qs)]
    text = "\n".join(lines) + "\n"
    print(text)
    OUT.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
