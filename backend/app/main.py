"""FastAPI entrypoint: POST /api/chat, GET /api/health."""
from __future__ import annotations

from functools import lru_cache

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import Settings
from .graph import build_graph
from .kb import KnowledgeBase, make_embedder
from .llm import make_llm

settings = Settings()
app = FastAPI(title="Lian Yang portfolio assistant")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST"], allow_headers=["*"])


class ChatIn(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    lang: str = Field(default="en", pattern="^(en|es)$")


class Source(BaseModel):
    id: int
    source: str
    title: str


class ChatOut(BaseModel):
    answer: str
    sources: list[Source]


@lru_cache
def get_graph():
    kb = KnowledgeBase.from_dir(settings.knowledge_dir, make_embedder(settings.embedder, settings.embed_model))
    llm = make_llm(settings.llm_provider, settings.llm_base_url, settings.llm_api_key, settings.llm_model)
    return build_graph(kb, llm, settings.top_k, settings.min_score)


@app.get("/api/health")
def health():
    return {"ok": True, "provider": settings.llm_provider}


@app.post("/api/chat", response_model=ChatOut)
def chat(body: ChatIn):
    try:
        out = get_graph().invoke({"question": body.question.strip(), "lang": body.lang})
    except Exception:  # never leak provider errors/keys to the browser
        raise HTTPException(status_code=502, detail="assistant_unavailable")
    return ChatOut(answer=out["answer"], sources=[Source(**{k: s[k] for k in ("id", "source", "title")}) for s in out.get("sources", [])])
