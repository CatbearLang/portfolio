"""Page-control tools for the assistant: the LLM picks them with tool calling, the backend validates them
against a whitelist, and the browser executes them visibly (moves a cursor to the real control and clicks it).

The backend never touches the page itself; it only returns a list of validated actions such as
{"type": "set_theme", "value": "dark"}. Anything outside the whitelist is dropped.
"""
from __future__ import annotations

from typing import Literal

from langchain_core.tools import tool

SECTIONS = ("top", "projects", "about", "skills", "experience", "education", "contact")
PROJECTS = ("portfolio-assistant", "elf-reader", "glossub", "codex-stickman-pipeline", "arcane-knockout")
MAX_ACTIONS = 3

# Loose names the model (or a visitor) may use for a project -> canonical slug.
PROJECT_ALIASES = {
    "assistant": "portfolio-assistant", "chatbot": "portfolio-assistant", "rag": "portfolio-assistant",
    "langgraph": "portfolio-assistant", "portfolio": "portfolio-assistant", "this assistant": "portfolio-assistant",
    "elf": "elf-reader", "elf reader": "elf-reader", "elfreader": "elf-reader", "reader": "elf-reader", "tts": "elf-reader",
    "glossub": "glossub", "glos sub": "glossub", "subtitles": "glossub",
    "stickman": "codex-stickman-pipeline", "codex": "codex-stickman-pipeline", "codex stickman": "codex-stickman-pipeline",
    "codex stickman pipeline": "codex-stickman-pipeline",
    "arcane": "arcane-knockout", "arcane knockout": "arcane-knockout", "game": "arcane-knockout",
}


@tool
def set_theme(theme: Literal["light", "dark"]) -> str:
    """Switch the website color theme to light or dark mode (the visitor asks for dark mode, light mode, night mode...)."""
    return theme


@tool
def set_language(lang: Literal["en", "es"]) -> str:
    """Switch the website language: "en" for English, "es" for Spanish."""
    return lang


@tool
def go_to_section(section: Literal["top", "projects", "about", "skills", "experience", "education", "contact"]) -> str:
    """Scroll the website to one of its sections."""
    return section


@tool
def open_project(project: Literal["portfolio-assistant", "elf-reader", "glossub", "codex-stickman-pipeline", "arcane-knockout"]) -> str:
    """Open the case-study page of one of Lian's projects: portfolio-assistant (this chatbot, LangGraph + RAG),
    elf-reader (Android e-book reader that reads aloud with on-device voices), glossub (bilingual subtitles to learn
    languages), codex-stickman-pipeline (topic to narrated explainer video), arcane-knockout (Unity multiplayer game)."""
    return project


@tool
def download_cv(lang: Literal["en", "es"]) -> str:
    """Download Lian's CV (PDF) in English ("en") or Spanish ("es")."""
    return lang


UI_TOOLS = [set_theme, set_language, go_to_section, open_project, download_cv]
UI_TOOL_NAMES = {t.name for t in UI_TOOLS}
_ARG = {"set_theme": "theme", "set_language": "lang", "go_to_section": "section", "open_project": "project", "download_cv": "lang"}
_ALLOWED = {"set_theme": ("light", "dark"), "set_language": ("en", "es"), "go_to_section": SECTIONS,
            "open_project": PROJECTS, "download_cv": ("en", "es")}


def validate(calls: list[dict], lang: str = "en") -> list[dict]:
    """Tool calls from the model -> whitelisted actions [{"type", "value"}]. Unknown tools/values are dropped."""
    out: list[dict] = []
    for c in calls:
        name = c.get("name")
        if name not in _ALLOWED:
            continue
        raw = str((c.get("args") or {}).get(_ARG[name], "") or "").strip().lower()
        if name == "open_project":
            raw = PROJECT_ALIASES.get(raw.replace("-", " "), raw)
        if name == "download_cv" and raw not in _ALLOWED[name]:
            raw = lang
        if raw in _ALLOWED[name]:
            a = {"type": name, "value": raw}
            if a not in out:
                out.append(a)
        if len(out) >= MAX_ACTIONS:
            break
    return out


_DONE = {
    "set_theme": {"en": "Switching to {v} mode.", "es": "Cambiando a modo {v}."},
    "set_language": {"en": "Switching the page language.", "es": "Cambiando el idioma de la página."},
    "go_to_section": {"en": "Taking you to that section.", "es": "Te llevo a esa sección."},
    "open_project": {"en": "Opening that project.", "es": "Abriendo ese proyecto."},
    "download_cv": {"en": "Downloading the CV.", "es": "Descargando el CV."},
}
_THEME_ES = {"dark": "oscuro", "light": "claro"}


def confirmation(actions: list[dict], lang: str) -> str:
    """Short fixed confirmation (no extra LLM call). The browser replaces it with what it actually did."""
    parts = []
    for a in actions:
        v = _THEME_ES.get(a["value"], a["value"]) if lang == "es" else a["value"]
        parts.append(_DONE[a["type"]][lang].format(v=v))
    return " ".join(parts)
