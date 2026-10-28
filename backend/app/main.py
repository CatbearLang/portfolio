"""FastAPI entrypoint: POST /api/chat, GET /api/health."""
from __future__ import annotations

import os
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import BASE, Settings
from .graph import build_graph
from .kb import KnowledgeBase, make_embedder
from .limits import MSG as LIMIT_MSG, AnswerCache, Quotas, cache_key, client_ip
from .llm import make_llm

MAX_Q = 300          # visible limit for questions
MAX_TURNS = 6        # history turns kept
MAX_TURN_CHARS = 500  # each history turn truncated

settings = Settings()
app = FastAPI(title="Lian Yang portfolio assistant")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST"], allow_headers=["*"])
quotas = Quotas(per_ip_day=int(os.getenv("IP_DAILY", "8")), burst=int(os.getenv("IP_BURST", "3")),
                global_day=int(os.getenv("GLOBAL_DAILY", "40")))
cache = AnswerCache(BASE / "data" / "suggested.json")


class Turn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    text: str = Field(max_length=5000)


class ChatIn(BaseModel):
    question: str = Field(min_length=2, max_length=2000)  # >MAX_Q gets a polite message, not a 422
    lang: str = Field(default="en", pattern="^(en|es)$")
    history: list[Turn] = Field(default_factory=list, max_length=40)


class Source(BaseModel):
    id: int
    source: str
    title: str
    snippet: str = ""
    score: float = 0.0


class Step(BaseModel):
    node: str
    detail: str
    hits: list[dict] = []


class ChatOut(BaseModel):
    answer: str
    sources: list[Source]
    trace: list[Step] = []
    cached: str | None = None   # "suggested" | "lru" | None
    limited: str | None = None  # quota reason, if refused


@lru_cache
def get_graph():
    kb = KnowledgeBase.from_dir(settings.knowledge_dir, make_embedder(settings.embedder, settings.embed_model))
    llm = make_llm(settings.llm_provider, settings.llm_base_url, settings.llm_api_key, settings.llm_model)
    return build_graph(kb, llm, settings.top_k, settings.min_score)


def run_graph(question: str, lang: str, history: list[dict]) -> dict:
    out = get_graph().invoke({"question": question, "lang": lang, "history": history})
    return {"answer": out["answer"], "trace": out.get("trace", []),
            "sources": [{"id": s["id"], "source": s["source"], "title": s["title"], "snippet": s["text"][:400], "score": s.get("score", 0)}
                        for s in out.get("sources", [])]}


def notice(kind: str, lang: str, node: str, **fmt) -> ChatOut:
    return ChatOut(answer=LIMIT_MSG[kind][lang].format(**fmt), sources=[], limited=kind,
                   trace=[Step(node=node, detail=kind)])


@app.get("/api/health")
def health():
    return {"ok": True, "provider": settings.llm_provider, "graph": "prefilter>route>retrieve>answer>check",
            "memory": True, "max_question": MAX_Q, "suggested": len(cache.suggested)}


@app.post("/api/chat", response_model=ChatOut)
def chat(body: ChatIn, request: Request):
    q, lang = body.question.strip(), body.lang
    if len(q) > MAX_Q:
        return notice("too_long", lang, "input_limit", n=MAX_Q)
    history = [{"role": t.role, "text": t.text[:MAX_TURN_CHARS]} for t in body.history[-MAX_TURNS:]]
    key = cache_key(q, lang)
    hit = None if history else cache.get(key)  # follow-ups depend on context: never cached
    if hit:
        return ChatOut(**hit[0], cached=hit[1])
    refused = quotas.check(client_ip(request.headers, request.client.host if request.client else None))
    if refused:
        return notice(refused, lang, "rate_limit", n=quotas.per_ip_day)
    try:
        res = run_graph(q, lang, history)
    except Exception:  # never leak provider errors/keys to the browser
        raise HTTPException(status_code=502, detail="assistant_unavailable")
    if not history:
        cache.put(key, res)
    return ChatOut(**res)
