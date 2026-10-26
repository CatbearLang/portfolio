"""LangGraph agent: route -> retrieve -> answer (with citations) | refuse."""
from __future__ import annotations

from typing import Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from .kb import KnowledgeBase
from .llm import ChatLLM

ROUTER_SYSTEM = (
    "Classify the visitor question for a developer-portfolio assistant about Lian Yang. "
    "Reply ON_TOPIC if it is about Lian, his skills, experience, education, projects (GlosSub, "
    "Codex Stickman Pipeline, Arcane Knockout, n8n pilots, this portfolio), availability or contact. "
    "Otherwise reply OFF_TOPIC. Reply with one word."
)

ANSWER_SYSTEM = (
    "You are the portfolio assistant for Lian Yang, answering recruiters. Use ONLY the numbered sources. "
    "If the sources do not contain the answer, say you don't have that information and suggest contacting "
    "Lian at Catbeardarkworld@gmail.com. Never invent facts, numbers, dates or employers. Cite sources "
    "inline like [1], [2]. Be concise (max ~120 words). Reply in the same language as the question."
)

REFUSAL = {
    "en": "I can only answer questions about this portfolio: skills, experience and projects. Try asking about GlosSub, Codex Stickman Pipeline or Arcane Knockout.",
    "es": "Solo puedo responder preguntas sobre este portfolio: habilidades, experiencia y proyectos. Probá preguntar por GlosSub, Codex Stickman Pipeline o Arcane Knockout.",
}
NO_INFO = {
    "en": "I don't have that information in the project docs. You can ask directly at Catbeardarkworld@gmail.com.",
    "es": "No tengo esa información en la documentación de los proyectos. Podés escribir a Catbeardarkworld@gmail.com.",
}


class ChatState(TypedDict, total=False):
    question: str
    lang: str
    route: Literal["on_topic", "off_topic"]
    sources: list[dict]
    answer: str


def build_graph(kb: KnowledgeBase, llm: ChatLLM, top_k: int = 4, min_score: float = 0.35):
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
    g.add_node("route", route)
    g.add_node("retrieve", retrieve)
    g.add_node("answer", answer)
    g.add_node("refuse", refuse)
    g.add_edge(START, "route")
    g.add_conditional_edges("route", lambda s: s["route"], {"on_topic": "retrieve", "off_topic": "refuse"})
    g.add_edge("retrieve", "answer")
    g.add_edge("answer", END)
    g.add_edge("refuse", END)
    return g.compile()
