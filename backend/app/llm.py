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
    def __init__(self, base_url: str, api_key: str, model: str, timeout: float = 40.0):
        from langchain_openai import ChatOpenAI
        self.chat = ChatOpenAI(base_url=base_url, api_key=api_key or "none", model=model, temperature=0.2,
                               timeout=timeout, max_retries=1)

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
            if "rewritten query:" in q:
                query = q.split("rewritten query:")[-1].strip()[:200]
            else:
                query = " ".join(str(m.content) for m in messages[1:]).lower()
                query = re.sub(r"<[^>]+>|visitor:|assistant:", " ", query).strip()[:300]
            return AIMessage("", tool_calls=[{"name": tools[0].name, "args": {"query": query}, "id": "call_1", "type": "tool_call"}])
        return RunnableLambda(run)


def make_llm(provider: str, base_url: str, api_key: str, model: str) -> ChatLLM:
    return FakeLLM() if provider == "fake" else LangChainLLM(base_url, api_key, model)
