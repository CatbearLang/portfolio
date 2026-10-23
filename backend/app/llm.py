"""Pluggable chat LLM: any OpenAI-compatible endpoint (Groq, OpenRouter, Ollama...) or a fake for tests."""
from __future__ import annotations

from typing import Protocol

import httpx


class ChatLLM(Protocol):
    def complete(self, system: str, user: str) -> str: ...


class OpenAICompatLLM:
    def __init__(self, base_url: str, api_key: str, model: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    def complete(self, system: str, user: str) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        r = httpx.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json={"model": self.model, "temperature": 0.2,
                  "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]},
            timeout=self.timeout,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()


class FakeLLM:
    """Deterministic stand-in: routes by keywords and answers by quoting the first source."""

    def complete(self, system: str, user: str) -> str:
        if "Classify" in system:
            q = user.lower()
            off = any(w in q for w in ["weather", "recipe", "bitcoin", "joke", "president", "clima", "receta"])
            return "OFF_TOPIC" if off else "ON_TOPIC"
        import re
        block = user.split("[1]", 1)[1].split("\n[2]", 1)[0] if "[1]" in user else ""
        lines = [l for l in block.splitlines()[1:] if l.strip() and not l.lstrip().startswith(("#", "|", "```", ">"))]
        snippet = re.sub(r"[*`]", "", " ".join(lines))[:260].strip()
        return f"(demo mode) From Lian's docs: {snippet} [1]"


def make_llm(provider: str, base_url: str, api_key: str, model: str) -> ChatLLM:
    return FakeLLM() if provider == "fake" else OpenAICompatLLM(base_url, api_key, model)
