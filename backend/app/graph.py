"""LangGraph agent for the portfolio assistant.

    START -> prefilter --(private)--------------------------> decline -> END
                       --(code_request)--> retrieve
                       --(unsure)--> route (LLM) --(off_topic)--> decline -> END
                                                 --(about_lian | code_request)--> retrieve
    retrieve -> answer (LLM, cites [n]) -> check (LLM grounding judge)
    check --(supported)--> END
          --(unsupported, 1st time)--> answer (retry, stricter)
          --(unsupported again / no sources)--> no_info -> END

Conversation memory: the frontend sends the last few turns (`history`); they are used by the
router, to expand the retrieval query for follow-ups, and as context for the answer.
"""
from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph

from .guard import LINKEDIN, MSG, PUBLIC_REPOS, prefilter as regex_prefilter
from .kb import KnowledgeBase
from .llm import ChatLLM

ROUTER_SYSTEM = (
    "You route messages sent to the portfolio assistant of Lian Yang, a software developer. "
    "Use the conversation so far to resolve follow-ups like 'and that one?'. Reply with exactly one label:\n"
    "ABOUT_LIAN - about Lian, his skills, stack, experience, education, availability, contact, his projects "
    "(GlosSub, Codex Stickman Pipeline, Arcane Knockout, this portfolio/assistant) or how they work.\n"
    "CODE_REQUEST - asks to get, see or download the source code / repositories of Lian's projects.\n"
    "OFF_TOPIC - anything else, including asking the assistant to write code, do homework, general knowledge, chit-chat."
)

ANSWER_SYSTEM = (
    "You are the assistant on Lian Yang's developer portfolio, answering recruiters. "
    "Answer ONLY with facts from the numbered sources; if they don't cover the question, say so briefly and suggest LinkedIn. "
    "Never invent facts, numbers, dates or employers. Cite sources inline like [1]. "
    "Never share personal data (email, phone, address, salary). "
    "Be concise: 2-4 sentences, optionally one short bullet list. Plain text, no markdown headings. "
    "Reply in {lang_name}."
)
CODE_POLICY = (
    " The visitor is asking for source code. GlosSub and Arcane Knockout are private: politely say their code "
    "can't be shared and offer to explain how they work. Public repositories you may link: "
    f"Codex Stickman Pipeline {PUBLIC_REPOS['stickman']} and this portfolio {PUBLIC_REPOS['portfolio']}."
)
STRICT = " IMPORTANT: your previous draft contained claims not in the sources. Only state what the sources literally say."

CHECK_SYSTEM = (
    "You are a strict fact-checker. Given SOURCES and an ANSWER, reply SUPPORTED if every factual claim in the "
    "answer is backed by the sources (links to the listed public repositories and polite refusals count as supported), "
    "otherwise reply UNSUPPORTED. Reply with one word."
)

NO_INFO = {
    "en": f"I don't have that information in Lian's project docs. You can ask him on LinkedIn ({LINKEDIN}).",
    "es": f"No tengo esa información en la documentación de Lian. Podés preguntarle por LinkedIn ({LINKEDIN}).",
}
REFUSAL = MSG["off_topic"]


class ChatState(TypedDict, total=False):
    question: str
    lang: str
    history: list[dict]  # [{"role": "user"|"assistant", "text": str}], last few turns
    intent: str          # about_lian | code_request | off_topic | private
    route: str           # kept for API/tests: on_topic | off_topic | guarded
    sources: list[dict]
    answer: str
    attempts: int
    grounded: bool


def _history_text(state: ChatState, n: int = 6) -> str:
    h = state.get("history") or []
    return "\n".join(f"{'Visitor' if t.get('role') == 'user' else 'Assistant'}: {t.get('text', '')[:400]}" for t in h[-n:])


def build_graph(kb: KnowledgeBase, llm: ChatLLM, top_k: int = 3, min_score: float = 0.15):
    def lang_of(state):
        return "es" if state.get("lang") == "es" else "en"

    def prefilter(state: ChatState) -> ChatState:
        hit = regex_prefilter(state["question"])
        return {"intent": hit or "unsure", "attempts": 0}

    def route(state: ChatState) -> ChatState:
        hist = _history_text(state)
        user = (f"Conversation so far:\n{hist}\n\n" if hist else "") + f"New message: {state['question']}"
        v = llm.complete(ROUTER_SYSTEM, user).upper()
        intent = "code_request" if "CODE" in v else "off_topic" if "OFF" in v else "about_lian"
        return {"intent": intent}

    def decline(state: ChatState) -> ChatState:
        kind = "private" if state["intent"] == "private" else "off_topic"
        return {"answer": MSG[kind][lang_of(state)], "sources": [],
                "route": "off_topic" if kind == "off_topic" else "guarded"}

    def retrieve(state: ChatState) -> ChatState:
        q = state["question"]
        prev = [t.get("text", "") for t in (state.get("history") or []) if t.get("role") == "user"][-1:]
        if prev:  # follow-up questions ("and how does it work?") inherit the previous topic
            q = f"{q} {prev[0]}"
        if state["intent"] == "code_request":
            q += " public code repository github private"
        hits = [(c, s) for c, s in kb.search(q, top_k) if s >= min_score]
        return {"route": "on_topic", "sources": [
            {"id": i + 1, "source": c.source, "title": c.title, "text": c.text, "score": round(s, 3)}
            for i, (c, s) in enumerate(hits)]}

    def answer(state: ChatState) -> ChatState:
        lang = lang_of(state)
        system = ANSWER_SYSTEM.format(lang_name="Spanish (rioplatense voseo)" if lang == "es" else "English")
        if state["intent"] == "code_request":
            system += CODE_POLICY
        if state.get("attempts", 0) > 0:
            system += STRICT
        ctx = "\n\n".join(f"[{s['id']}] {s['title']}\n{s['text']}" for s in state["sources"])
        hist = _history_text(state)
        user = (f"Conversation so far:\n{hist}\n\n" if hist else "") + f"Question: {state['question']}\n\nSources:\n{ctx}"
        return {"answer": llm.complete(system, user), "attempts": state.get("attempts", 0) + 1}

    def check(state: ChatState) -> ChatState:
        ctx = "\n\n".join(f"[{s['id']}] {s['text']}" for s in state["sources"])
        v = llm.complete(CHECK_SYSTEM, f"SOURCES:\n{ctx}\n\nANSWER:\n{state['answer']}").upper()
        return {"grounded": "UNSUPPORTED" not in v}

    def no_info(state: ChatState) -> ChatState:
        return {"answer": NO_INFO[lang_of(state)], "sources": []}

    g = StateGraph(ChatState)
    for name, fn in [("prefilter", prefilter), ("route", route), ("decline", decline), ("retrieve", retrieve),
                     ("answer", answer), ("check", check), ("no_info", no_info)]:
        g.add_node(name, fn)
    g.add_edge(START, "prefilter")
    g.add_conditional_edges("prefilter", lambda s: {"private": "decline", "code_request": "retrieve"}.get(s["intent"], "route"),
                            ["decline", "retrieve", "route"])
    g.add_conditional_edges("route", lambda s: "decline" if s["intent"] == "off_topic" else "retrieve", ["decline", "retrieve"])
    g.add_conditional_edges("retrieve", lambda s: "answer" if s["sources"] else "no_info", ["answer", "no_info"])
    g.add_edge("answer", "check")
    g.add_conditional_edges("check", lambda s: END if s["grounded"] else ("answer" if s["attempts"] < 2 else "no_info"),
                            ["answer", "no_info", END])
    g.add_edge("decline", END)
    g.add_edge("no_info", END)
    return g.compile()
