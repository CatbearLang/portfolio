"""Fallback order across models: provider errors move to the next model, real bugs don't, rate-limited models cool down."""
import httpx
import openai
import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.graph import build_graph
from app.kb import HashEmbedder, KnowledgeBase
from app.config import BASE
from app.llm import FakeLLM, FallbackLLM, LangChainLLM, make_llm

REQ = httpx.Request("POST", "https://example.invalid/v1/chat/completions")


def rate_limit():
    return openai.RateLimitError("rate limited", response=httpx.Response(429, request=REQ), body=None)


def timeout():
    return openai.APITimeoutError(request=REQ)


def rejected():
    return openai.PermissionDeniedError("forbidden", response=httpx.Response(403, request=REQ), body=None)


class Scripted:
    """Raises the given errors in order, then answers with its name. Counts calls."""

    def __init__(self, name, errors=()):
        self.name, self.errors, self.calls = name, list(errors), 0

    def _next(self):
        self.calls += 1
        if self.errors:
            raise self.errors.pop(0)

    def complete(self, system, user):
        self._next()
        return self.name

    def with_tools(self, tools):
        def run(messages):
            self._next()
            return AIMessage("", tool_calls=[{"name": "search_portfolio_docs", "args": {"query": self.name}, "id": "c1", "type": "tool_call"}])
        return RunnableLambda(run)


class Clock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t


def chain(*models, clock=None):
    return FallbackLLM([(m.name, m) for m in models], cooldown=60, clock=clock or Clock())


def test_main_model_answers_and_fallbacks_are_not_called():
    a, b, c = Scripted("main"), Scripted("dots"), Scripted("lfm")
    llm = chain(a, b, c)
    assert llm.complete("s", "u") == "main"
    assert (a.calls, b.calls, c.calls) == (1, 0, 0) and llm.last_model == "main"


@pytest.mark.parametrize("error", [rate_limit, timeout, rejected])
def test_provider_error_moves_to_the_next_model_in_order(error):
    a, b, c = Scripted("main", [error()]), Scripted("dots", [error()]), Scripted("lfm")
    llm = chain(a, b, c)
    assert llm.complete("s", "u") == "lfm"
    assert (a.calls, b.calls, c.calls) == (1, 1, 1) and llm.last_model == "lfm"


def test_rate_limited_model_is_skipped_until_its_cooldown_ends():
    clock = Clock()
    a, b = Scripted("main", [rate_limit()]), Scripted("dots")
    llm = chain(a, b, clock=clock)
    assert llm.complete("s", "u") == "dots"
    assert llm.complete("s", "u") == "dots" and a.calls == 1  # main skipped while cooling down
    clock.t = 61
    assert llm.complete("s", "u") == "main" and a.calls == 2


def test_timeout_does_not_start_a_cooldown():
    a, b = Scripted("main", [timeout()]), Scripted("dots")
    llm = chain(a, b)
    assert llm.complete("s", "u") == "dots"
    assert llm.complete("s", "u") == "main"


def test_every_model_failing_raises_the_last_provider_error():
    llm = chain(Scripted("main", [rate_limit()]), Scripted("dots", [timeout()]))
    with pytest.raises(openai.APITimeoutError):
        llm.complete("s", "u")


def test_a_bug_is_not_hidden_by_trying_another_model():
    a, b = Scripted("main", [ValueError("bug")]), Scripted("dots")
    with pytest.raises(ValueError):
        chain(a, b).complete("s", "u")
    assert b.calls == 0


def test_tool_calls_fall_back_too():
    a, b = Scripted("main", [timeout()]), Scripted("dots")
    ai = chain(a, b).with_tools([]).invoke([HumanMessage("hi")])
    assert ai.tool_calls[0]["args"]["query"] == "dots"


def test_make_llm_builds_the_chain_in_order_without_duplicates():
    llm = make_llm("openai", "https://example.invalid/v1", "", "nvidia/main:free",
                   ["dots/one:free", "nvidia/main:free", "liquid/two:free"])
    assert [n for n, _ in llm.models] == ["nvidia/main:free", "dots/one:free", "liquid/two:free"]
    assert all(isinstance(m, LangChainLLM) and m.chat.max_retries == 0 for _, m in llm.models)
    assert isinstance(make_llm("openai", "https://example.invalid/v1", "", "nvidia/main:free", []), LangChainLLM)
    assert isinstance(make_llm("fake", "", "", "x", ["y"]), FakeLLM)


class Down:
    """A main model that is always rate limited."""

    def complete(self, system, user):
        raise rate_limit()

    def with_tools(self, tools):
        def run(messages):
            raise rate_limit()
        return RunnableLambda(run)


def test_graph_answers_with_the_fallback_when_the_main_model_is_down():
    kb = KnowledgeBase.from_dir(BASE / "data" / "knowledge", HashEmbedder())
    g = build_graph(kb, FallbackLLM([("main", Down()), ("fake", FakeLLM())]), top_k=3, min_score=0.05)
    out = g.invoke({"question": "How does GlosSub align subtitles?", "lang": "en"})
    assert "[1]" in out["answer"] and out["sources"]
    out = g.invoke({"question": "switch to dark mode", "lang": "en"})
    assert out["actions"] == [{"type": "set_theme", "value": "dark"}]
