"""Deterministic guard run before retrieval (mirrors frontend/src/localAssistant.js)."""
from __future__ import annotations

import re
import unicodedata

PUBLIC_REPOS = {
    "stickman": "https://github.com/CatbearLang/codex-stickman-pipeline",
    "portfolio": "https://github.com/CatbearLang/portfolio",
}
LINKEDIN = "https://www.linkedin.com/in/lianyang-dev"
GITHUB = "https://github.com/CatbearLang"


def norm(s: str) -> str:
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()


CODE = re.compile(r"\b(source|codigo|code|repo|repositorio|github|descargar|download|clonar|clone)\b")
PRIVATE = re.compile(r"\b(e-?mail|correo|mail|phone|telefono|celular|whatsapp|numero|address|direccion|domicilio|salar\w*|sueldo|pay|password\w*|contrasena\w*|clave|cedula|dni|id card|api key|token)\b")
PROFILE = re.compile(r"\b(lian|glossub|stickman|codex|arcane|knockout|portfolio|project\w*|proyecto\w*|stack|skill\w*|habilidad\w*|tecnolog\w*|experien\w*|educa\w*|formacion|estudi\w*|universidad|university|tesis|thesis|work\w*|trabaj\w*|remot\w*|disponib\w*|availab\w*|contact\w*|linkedin|cv|resume|curriculum|ingles|english|idioma\w*|language\w*|serie\w*|subtit\w*|whisper|llm|rag|langgraph|react|python|fastapi|unity|game|juego|assistant|asistente|chatbot|hire|contratar|freelance|role\w*|rol)\b")

MSG = {
    "code_private": {
        "en": "I can't share GlosSub's source code: it's a private project. I can tell you how it works or which technologies it uses.",
        "es": "No puedo compartir el código fuente de GlosSub: es un proyecto privado. Puedo contarte cómo funciona o qué tecnologías usa.",
    },
    "code_arcane": {
        "en": "I can't share Arcane Knockout's source code: it's a private project. I can tell you how it works or what Lian built.",
        "es": "No puedo compartir el código fuente de Arcane Knockout: es un proyecto privado. Puedo contarte cómo funciona o qué hizo Lian.",
    },
    "code_public": {
        "en": f"Public code: Codex Stickman Pipeline ({PUBLIC_REPOS['stickman']}) and this portfolio ({PUBLIC_REPOS['portfolio']}). GlosSub and Arcane Knockout are private.",
        "es": f"Código público: Codex Stickman Pipeline ({PUBLIC_REPOS['stickman']}) y este portfolio ({PUBLIC_REPOS['portfolio']}). GlosSub y Arcane Knockout son privados.",
    },
    "private": {
        "en": f"I can't share personal data. To contact Lian, use LinkedIn ({LINKEDIN}).",
        "es": f"No puedo compartir datos personales. Para contactar a Lian, usá LinkedIn ({LINKEDIN}).",
    },
    "off_topic": {
        "en": "I can only answer about Lian's projects and professional profile.",
        "es": "Solo puedo responder sobre los proyectos y el perfil profesional de Lian.",
    },
}


def classify(question: str) -> str:
    """Return one of: code_private, code_arcane, code_public, private, off_topic, on_topic."""
    q = norm(question)
    if CODE.search(q):
        if "stickman" in q or "codex" in q or "portfolio" in q:
            return "code_public"
        if "arcane" in q or "knockout" in q:
            return "code_arcane"
        if "glossub" in q:
            return "code_private"
        return "code_public"
    if PRIVATE.search(q):
        return "private"
    return "on_topic" if PROFILE.search(q) else "off_topic"
