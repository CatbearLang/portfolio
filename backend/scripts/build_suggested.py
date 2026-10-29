"""Run the real graph once for the suggested questions and store answers + trace + sources.

Usage (needs LLM_* env vars): python -m scripts.build_suggested
Output: data/suggested.json (served by the API and bundled in the frontend, zero API calls at runtime).
"""
import json
from pathlib import Path

from app.main import run_graph

QUESTIONS = [
    ("es", "¿Qué proyecto de LangGraph hizo y cómo funciona?"),
    ("es", "¿Cuál es su stack?"),
    ("es", "¿Cómo ayuda GlosSub a aprender idiomas?"),
    ("es", "¿Cómo puedo probar GlosSub?"),
    ("en", "What LangGraph project did he build and how does it work?"),
    ("en", "What is his tech stack?"),
    ("en", "How does GlosSub help you learn languages?"),
    ("en", "How can I try GlosSub?"),
]

out_file = Path(__file__).resolve().parent.parent / "data" / "suggested.json"
existing = {(i["lang"], i["question"]): i for i in json.loads(out_file.read_text())} if out_file.exists() else {}
items = []
for lang, q in QUESTIONS:
    item = existing.get((lang, q)) or {"lang": lang, "question": q, "response": run_graph(q, lang, [])}
    items.append(item)
    print(lang, q, "->", item["response"]["answer"][:80].replace("\n", " "))
out_file.write_text(json.dumps(items, ensure_ascii=False, indent=1))
