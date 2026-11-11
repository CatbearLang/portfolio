"""LLM layer on langchain-core: ChatOpenAI against any OpenAI-compatible endpoint (OpenRouter), or a fake for tests.

Two capabilities are used by the graph:
- complete(system, user) -> str            plain prompts (grading, rewriting, answering, checking)
- with_tools(tools) -> Runnable             tool-calling model for the generate_query_or_respond node
"""
from __future__ import annotations

import re

from typing import Protocol

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda


class ChatLLM(Protocol):
    def complete(self, system: str, user: str) -> str: ...
    def with_tools(self, tools: list): ...


class LangChainLLM:
    def __init__(self, base_url: str, api_key: str, model: str, timeout: float = 40.0, max_retries: int = 1):
        from langchain_openai import ChatOpenAI
        self.chat = ChatOpenAI(base_url=base_url, api_key=api_key or "none", model=model, temperature=0.2,
                               timeout=timeout, max_retries=max_retries)

    def complete(self, system: str, user: str) -> str:
        return str(self.chat.invoke([SystemMessage(system), HumanMessage(user)]).content).strip()

    def with_tools(self, tools: list):
        return self.chat.bind_tools(tools)


class FakeLLM:
    """Deterministic stand-in for tests/demos (no network)."""

    OFF = ["weather", "recipe", "bitcoin", "joke", "president", "clima", "receta", "calculadora", "calculator"]

    def complete(self, system: str, user: str) -> str:
        if "grade retrieved" in system:
            return "1,2,3,4"
        if "Rewrite the visitor" in system:
            return "GlosSub subtitles"
        if "fact-checker" in system:
            return "SUPPORTED"
        if "You route" in system:
            q = user.rsplit("New message:", 1)[-1].lower()
            off = any(w in q for w in self.OFF)
            code = any(w in q for w in ["code", "codigo", "código"]) and not off
            return "OFF_TOPIC" if off else "CODE_REQUEST" if code else "ABOUT_LIAN"
        import re
        block = user.split('<document id="1"', 1)[1].split("</document>", 1)[0] if '<document id="1"' in user else ""
        lines = [l for l in block.splitlines()[1:] if l.strip() and not l.lstrip().startswith(("#", "|", "```", ">"))]
        snippet = re.sub(r"[*`]", "", " ".join(lines))[:260].strip()
        return f"(demo mode) From the project docs: {snippet} [1]"

    def with_tools(self, tools: list):
        def run(messages):
            q = str(messages[-1].content).lower()
            if any(w in q for w in self.OFF):
                return AIMessage("Sorry, I can only answer questions about Lian and his projects.")
            names = {t.name for t in tools}
            ui = []
            if "set_theme" in names and any(w in q for w in ("dark mode", "modo oscuro", "light mode", "modo claro")):
                ui.append(("set_theme", {"theme": "dark" if ("dark" in q or "oscuro" in q) else "light"}))
            if "open_project" in names and any(w in q for w in ("open ", "show me", "abrí", "abri ", "mostrame", "quiero ver")):
                for alias, slug in (("glossub", "glossub"), ("elf", "elf-reader"), ("arcane", "arcane-knockout"),
                                    ("stickman", "codex-stickman-pipeline"), ("bogus", "../../etc")):
                    if alias in q:
                        ui.append(("open_project", {"project": slug}))
            if ui:
                return AIMessage("", tool_calls=[{"name": n, "args": a, "id": f"call_{i}", "type": "tool_call"} for i, (n, a) in enumerate(ui)])
            if "rewritten query:" in q:
                query = q.split("rewritten query:")[-1].strip()[:200]
            else:
                query = " ".join(str(m.content) for m in messages[1:]).lower()
                query = re.sub(r"<[^>]+>|visitor:|assistant:", " ", query).strip()[:300]
            return AIMessage("", tool_calls=[{"name": tools[0].name, "args": {"query": query}, "id": "call_1", "type": "tool_call"}])
        return RunnableLambda(run)


def is_provider_error(e: Exception) -> bool:
    """Errors that say "this model can't answer right now" (rate limit, timeout, connection, 4xx/5xx from the
    provider), as opposed to bugs in our code, which must not be hidden by trying another model."""
    try:
        import openai
    except ImportError:  # pragma: no cover
        return False
    return isinstance(e, openai.APIError)


class FallbackLLM:
    """Tries models in order. When one fails with a provider error, the same call goes to the next one.
    A model that hit a rate limit is skipped for `cooldown` seconds, so the rest of the question (and the next
    visitors) don't spend a request and a timeout on it first. Logs which model answered, never keys or prompts."""

    def __init__(self, models: list[tuple[str, ChatLLM]], cooldown: float = 60.0, clock=None):
        import time
        assert models, "at least one model"
        self.models, self.cooldown, self.clock = models, cooldown, clock or time.monotonic
        self.until: dict[str, float] = {}
        self.last_model: str | None = None

    def _order(self) -> list[tuple[str, ChatLLM]]:
        now = self.clock()
        ready = [m for m in self.models if self.until.get(m[0], 0) <= now]
        return ready or self.models  # everything cooling down: try them all anyway

    def _run(self, call):
        import logging
        log = logging.getLogger("portfolio")
        failed: list[str] = []
        last: Exception | None = None
        for name, llm in self._order():
            try:
                out = call(name, llm)
            except Exception as e:
                if not is_provider_error(e):
                    raise
                last = e
                failed.append(f"{name} ({type(e).__name__})")
                if getattr(e, "status_code", None) == 429 or type(e).__name__ == "RateLimitError":
                    self.until[name] = self.clock() + self.cooldown
                continue
            self.last_model = name
            if failed:
                log.info("llm fallback: answered by %s after %s", name, ", ".join(failed))
            return out
        log.warning("llm fallback: every model failed: %s", ", ".join(failed))
        raise last  # type: ignore[misc]

    def complete(self, system: str, user: str) -> str:
        return self._run(lambda name, llm: llm.complete(system, user))

    def with_tools(self, tools: list):
        bound: dict[str, object] = {}

        def invoke(messages):
            def call(name, llm):
                if name not in bound:
                    bound[name] = llm.with_tools(tools)
                return bound[name].invoke(messages)
            return self._run(call)
        return RunnableLambda(invoke)


def make_llm(provider: str, base_url: str, api_key: str, model: str, fallbacks: list[str] | None = None) -> ChatLLM:
    if provider == "fake":
        return FakeLLM()
    names = [model, *[m for m in (fallbacks or []) if m and m != model]]
    if len(names) == 1:
        return LangChainLLM(base_url, api_key, model)
    # With fallbacks, no retry on the same model: the next model is a faster way out of a rate limit.
    return FallbackLLM([(m, LangChainLLM(base_url, api_key, m, max_retries=0)) for m in names])
