"""LangGraph agent: classify (guard) -> refuse | route -> retrieve -> answer (with citations)."""
from __future__ import annotations

from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from .guard import MSG, classify as guard_classify
from .kb import KnowledgeBase
from .llm import ChatLLM

ROUTER_SYSTEM = (
    "Classify the visitor question for a developer-portfolio assistant about Lian Yang. "
    "Reply ON_TOPIC if it is about Lian, his skills, experience, education, projects (GlosSub, "
    "Codex Stickman Pipeline, Arcane Knockout, this portfolio), availability or contact. "
    "Otherwise reply OFF_TOPIC. Reply with one word."
)

ANSWER_SYSTEM = (
    "You are the portfolio assistant for Lian Yang, answering recruiters. Use ONLY the numbered sources. "
    "If the sources do not contain the answer, say you don't have that information and suggest LinkedIn. "
    "Never share source code of private projects (GlosSub, Arcane Knockout) or personal data (email, phone, address, salary). "
    "Never invent facts, numbers, dates or employers. Cite sources inline like [1], [2]. "
    "Be concise: 2-4 sentences plus at most one short bullet list. Reply in the same language as the question."
)

REFUSAL = {
    "en": MSG["off_topic"]["en"],
    "es": MSG["off_topic"]["es"],
}
NO_INFO = {
    "en": "I don't have that information in the project docs. You can ask Lian on LinkedIn (https://www.linkedin.com/in/lianyang-dev).",
    "es": "No tengo esa información en la documentación de los proyectos. Podés preguntarle a Lian por LinkedIn (https://www.linkedin.com/in/lianyang-dev).",
}


class ChatState(TypedDict, total=False):
    question: str
    lang: str
    route: str
    guard: str
    sources: list[dict]
    answer: str


def build_graph(kb: KnowledgeBase, llm: ChatLLM, top_k: int = 3, min_score: float = 0.35):
    def classify(state: ChatState) -> ChatState:
        return {"guard": guard_classify(state["question"])}

    def guard_refuse(state: ChatState) -> ChatState:
        lang = state.get("lang", "en")
        msgs = MSG[state["guard"]]
        return {"route": "off_topic" if state["guard"] == "off_topic" else "guarded",
                "answer": msgs.get(lang, msgs["en"]), "sources": []}

    def route(state: ChatState) -> ChatState:
        verdict = llm.complete(ROUTER_SYSTEM, state["question"]).upper()
        return {"route": "off_topic" if "OFF" in verdict else "on_topic"}

    def retrieve(state: ChatState) -> ChatState:
        hits = [(c, s) for c, s in kb.search(state["question"], top_k) if s >= min_score]
        return {"sources": [{"id": i + 1, "source": c.source, "title": c.title, "text": c.text, "score": round(s, 3)}
                            for i, (c, s) in enumerate(hits)]}

    def answer(state: ChatState) -> ChatState:
        lang = state.get("lang", "en")
        if not state.get("sources"):
            return {"answer": NO_INFO.get(lang, NO_INFO["en"])}
        ctx = "\n\n".join(f"[{s['id']}] {s['title']}\n{s['text']}" for s in state["sources"])
        user = f"Question: {state['question']}\n\nSources:\n{ctx}"
        return {"answer": llm.complete(ANSWER_SYSTEM, user)}

    def refuse(state: ChatState) -> ChatState:
        lang = state.get("lang", "en")
        return {"answer": REFUSAL.get(lang, REFUSAL["en"]), "sources": []}

    g = StateGraph(ChatState)
    g.add_node("classify", classify)
    g.add_node("guard_refuse", guard_refuse)
    g.add_node("route", route)
    g.add_node("retrieve", retrieve)
    g.add_node("answer", answer)
    g.add_node("refuse", refuse)
    g.add_edge(START, "classify")
    # Guard first: sensitive/off-topic never reaches retrieval; ambiguous on-topic still gets the LLM router.
    g.add_conditional_edges("classify", lambda s: "route" if s["guard"] == "on_topic" else "guard_refuse",
                            {"route": "route", "guard_refuse": "guard_refuse"})
    g.add_edge("guard_refuse", END)
    g.add_conditional_edges("route", lambda s: s["route"], {"on_topic": "retrieve", "off_topic": "refuse"})
    g.add_edge("retrieve", "answer")
    g.add_edge("answer", END)
    g.add_edge("refuse", END)
    return g.compile()
