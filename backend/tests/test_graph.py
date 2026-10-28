from pathlib import Path

from fastapi.testclient import TestClient

from app.graph import NO_INFO, REFUSAL, build_graph
from app.kb import HashEmbedder, KnowledgeBase, chunk_markdown
from app.llm import FakeLLM

KDIR = Path(__file__).resolve().parent.parent / "data" / "knowledge"


def make(min_score=0.1):
    kb = KnowledgeBase.from_dir(KDIR, HashEmbedder())
    return build_graph(kb, FakeLLM(), top_k=4, min_score=min_score)


def test_chunking_keeps_headings():
    chunks = chunk_markdown(KDIR / "glossub.md")
    assert chunks and all(c.source == "glossub" for c in chunks)
    assert any("How it works" in c.title for c in chunks)


def test_on_topic_retrieves_and_cites():
    out = make().invoke({"question": "How does GlosSub align bilingual subtitles?", "lang": "en"})
    assert out["route"] == "on_topic"
    assert out["sources"] and out["sources"][0]["source"].startswith("glossub")
    assert "[1]" in out["answer"]


def test_off_topic_is_refused():
    out = make().invoke({"question": "What's the weather tomorrow?", "lang": "es"})
    assert out["route"] == "off_topic"
    assert out["answer"] == REFUSAL["es"] and out["sources"] == []


def test_no_sources_means_no_invention():
    out = make(min_score=0.99).invoke({"question": "What is Lian's favorite programming book?", "lang": "en"})
    assert out["answer"] == NO_INFO["en"]


def test_knowledge_has_no_private_data():
    # Blocked terms are stored as sha256 hashes so the test itself leaks nothing.
    import hashlib, re
    blocked = {'f4d309020e699d38db16e8159fb96996d3c9fabc6063c87b91c0781f6bd8bc08', '7a94b114da6dd61ecf9beb7bc7fb03f37196fbb6063c95c413ac221a6cdb75e2', '638d5b3d57e66a031f8aa0e578a375b5f9bc54716052c7e7b44af6a66a4b2cac', 'd1a13d29180ee45ef9c037de3cb69cd89a8a7332eb6ebd11dad239db4d92cd99', '39e05c9de83d00d36d512ddf7a8abe009a2bf3c2b27fb802c6b9f32a67def0eb'}
    for p in KDIR.glob("*.md"):
        words = re.findall(r"[\w.]+", p.read_text().lower())
        grams = words + [" ".join(words[i:i + 2]) for i in range(len(words) - 1)]
        assert not blocked & {hashlib.sha256(g.encode()).hexdigest() for g in grams}, p.name


def test_api(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "fake")
    monkeypatch.setenv("EMBEDDER", "hash")
    monkeypatch.setenv("MIN_SCORE", "0.05")
    import importlib
    import app.main as m
    importlib.reload(m)
    c = TestClient(m.app)
    assert c.get("/api/health").json()["ok"]
    r = c.post("/api/chat", json={"question": "What did Lian build in Arcane Knockout?", "lang": "en"})
    assert r.status_code == 200 and r.json()["sources"]
    assert c.post("/api/chat", json={"question": "x", "lang": "en"}).status_code == 422


def test_private_source_code_is_answered_by_llm_path():
    out = make().invoke({"question": "puedes pasarme su codigo fuente", "lang": "es"})
    assert out["intent"] == "code_request" and out["sources"]


def test_write_me_code_is_off_topic_not_code_request():
    out = make().invoke({"question": "podrias hacerme el codigo de una calculadora", "lang": "es"})
    assert out["intent"] == "off_topic" and out["answer"] == REFUSAL["es"]


def test_private_data_is_declined():
    from app.guard import MSG
    assert make().invoke({"question": "What is Lian's salary history?", "lang": "en"})["answer"] == MSG["private"]["en"]


def test_grounding_retry_then_no_info():
    from app.kb import HashEmbedder, KnowledgeBase
    class Liar(FakeLLM):
        def complete(self, system, user):
            return "UNSUPPORTED" if "fact-checker" in system else super().complete(system, user)
    g = build_graph(KnowledgeBase.from_dir(KDIR, HashEmbedder()), Liar(), top_k=3, min_score=0.05)
    out = g.invoke({"question": "How does GlosSub work?", "lang": "en"})
    assert out["attempts"] == 2 and out["answer"] == NO_INFO["en"]


def test_history_is_accepted():
    out = make().invoke({"question": "and how does it work?", "lang": "en",
                         "history": [{"role": "user", "text": "Tell me about GlosSub"}, {"role": "assistant", "text": "GlosSub is..."}]})
    assert any(s["source"].startswith("glossub") for s in out["sources"])
