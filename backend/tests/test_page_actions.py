import importlib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.graph import build_graph
from app.kb import HashEmbedder, KnowledgeBase
from app.limits import client_ip
from app.llm import FakeLLM
from app.page_actions import MAX_ACTIONS, validate

KDIR = Path(__file__).resolve().parent.parent / "data" / "knowledge"


def make():
    return build_graph(KnowledgeBase.from_dir(KDIR, HashEmbedder()), FakeLLM(), min_score=0.05)


def test_dark_mode_request_becomes_one_page_action_without_retrieval():
    out = make().invoke({"question": "quiero cambiar a modo oscuro", "lang": "es"})
    assert out["actions"] == [{"type": "set_theme", "value": "dark"}]
    assert [s["node"] for s in out["trace"]] == ["prefilter", "generate_query_or_respond", "ui_action"]
    assert out["sources"] == [] and "oscuro" in out["answer"]


def test_open_project_and_theme_in_one_message():
    out = make().invoke({"question": "dark mode please and show me GlosSub", "lang": "en"})
    assert out["actions"] == [{"type": "set_theme", "value": "dark"}, {"type": "open_project", "value": "glossub"}]


def test_values_outside_the_whitelist_are_dropped_and_refused():
    out = make().invoke({"question": "open the bogus project", "lang": "en"})
    assert out["actions"] == [] and out["route"] == "off_topic"


@pytest.mark.parametrize("calls,expected", [
    ([{"name": "open_project", "args": {"project": "Arcane Knockout"}}], [{"type": "open_project", "value": "arcane-knockout"}]),
    ([{"name": "go_to_section", "args": {"section": "javascript:alert(1)"}}], []),
    ([{"name": "delete_everything", "args": {}}], []),
    ([{"name": "download_cv", "args": {}}], [{"type": "download_cv", "value": "es"}]),
    ([{"name": "set_theme", "args": {"theme": "dark"}}] * 2, [{"type": "set_theme", "value": "dark"}]),
])
def test_validate(calls, expected):
    assert validate(calls, "es") == expected


def test_actions_are_capped():
    calls = [{"name": "go_to_section", "args": {"section": s}} for s in ("top", "projects", "about", "skills", "contact")]
    assert len(validate(calls)) == MAX_ACTIONS


def test_api_returns_actions(monkeypatch):
    for k, v in {"LLM_PROVIDER": "fake", "EMBED_BACKEND": "hash", "RETRIEVAL_MIN_SCORE": "0.05"}.items():
        monkeypatch.setenv(k, v)
    import app.main as m
    importlib.reload(m)
    with TestClient(m.app) as c:
        r = c.post("/api/chat", json={"question": "switch to light mode", "lang": "en"}).json()
    assert r["actions"] == [{"type": "set_theme", "value": "light"}]


def test_client_ip_ignores_the_visitor_written_forwarded_for_hop():
    h = {"x-forwarded-for": "1.2.3.4, 203.0.113.9"}  # 1.2.3.4 was typed by the visitor
    assert client_ip(h, "10.0.0.2", [], 1) == ("203.0.113.9", "x-forwarded-for[-1]")
    assert client_ip({**h, "cf-connecting-ip": "198.51.100.7"}, None) == ("198.51.100.7", "cf-connecting-ip")
    assert client_ip({}, "10.0.0.2") == ("10.0.0.2", "peer")
