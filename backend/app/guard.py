"""Fast regex pre-filter run before the LLM router (mirrors frontend/src/localAssistant.js).

It only catches *obvious* cases (requests for repositories/source code, personal data, secrets).
Everything ambiguous (e.g. "write me a calculator in code") goes to the LLM router.
"""
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


# Request for Lian's code/repos (not "write me some code").
CODE_REQUEST = re.compile(r"\b(source code|codigo fuente|repo|repos|repositorio\w*|github|clonar|clone|descargar el codigo|download the code)\b"
                          r"|\b(su|sus|tu|tus|el|del|his|your)\s+(codigo|code)\b(?!\s+(de|para|for|to)\s+(una?|an?)\b)")
PRIVATE = re.compile(r"\b(e-?mail|correo|phone|telefono|celular|whatsapp|address|direccion|domicilio|salar\w*|sueldo|password\w*|contrasena\w*|cedula|dni|id card|api key|token)\b")

MSG = {
    "private": {
        "en": f"I can't share personal data. To contact Lian, use LinkedIn ({LINKEDIN}).",
        "es": f"No puedo compartir datos personales. Para contactar a Lian, usá LinkedIn ({LINKEDIN}).",
    },
    "off_topic": {
        "en": "Sorry, I can only answer questions about Lian, his experience and his projects (GlosSub, Codex Stickman Pipeline, Arcane Knockout, this portfolio).",
        "es": "Perdón, solo puedo responder sobre Lian, su experiencia y sus proyectos (GlosSub, Codex Stickman Pipeline, Arcane Knockout, este portfolio).",
    },
}


def prefilter(question: str) -> str | None:
    """Return 'code_request', 'private' or None (= let the LLM router decide)."""
    q = norm(question)
    if PRIVATE.search(q):
        return "private"
    if CODE_REQUEST.search(q):
        return "code_request"
    return None
