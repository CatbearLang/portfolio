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


def test_guard_refuses_private_source_code():
    from app.guard import MSG
    out = make().invoke({"question": "puedes pasarme el codigo fuente de glossub", "lang": "es"})
    assert out["guard"] == "code_private" and out["answer"] == MSG["code_private"]["es"] and out["sources"] == []
    out = make().invoke({"question": "Can you send me the GlosSub source code?", "lang": "en"})
    assert out["answer"] == MSG["code_private"]["en"]


def test_guard_links_public_repo():
    out = make().invoke({"question": "Where is the stickman pipeline code?", "lang": "en"})
    assert "github.com/CatbearLang/codex-stickman-pipeline" in out["answer"]


def test_guard_private_data_and_off_topic():
    from app.guard import MSG
    assert make().invoke({"question": "What is Lian's salary history?", "lang": "en"})["answer"] == MSG["private"]["en"]
    assert make().invoke({"question": "What is his email?", "lang": "en"})["answer"] == MSG["private"]["en"]
    assert make().invoke({"question": "¿Cuál es su teléfono?", "lang": "es"})["answer"] == MSG["private"]["es"]
    assert make().invoke({"question": "Who won the World Cup?", "lang": "en"})["answer"] == MSG["off_topic"]["en"]


def test_guard_lets_profile_questions_through():
    out = make().invoke({"question": "How does GlosSub help learn languages with series?", "lang": "en"})
    assert out["guard"] == "on_topic" and out["sources"]


def test_hybrid_retrieval_finds_profile_stack():
    kb = KnowledgeBase.from_dir(KDIR, HashEmbedder())
    for q in ("What is his tech stack?", "¿Cuál es su stack?"):
        assert kb.search(q, 1)[0][0].source == "profile"
    assert kb.search("¿Qué estudió Lian?", 1)[0][0].title.endswith("Education")
