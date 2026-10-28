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

# Obvious prompt-injection / jailbreak attempts (a cheap first layer, not a guarantee).
INJECTION = re.compile(
    r"(ignore|disregard|forget|override)\b.{0,30}\b(instruction|instructions|rules|prompt|above|previous)"
    r"|(ignora|olvida|olvidate|omite|anula)\w*\b.{0,30}\b(instruccion\w*|reglas|prompt|anterior\w*)"
    r"|system prompt|prompt del sistema|prompt de sistema|tus instrucciones|your instructions|initial prompt"
    r"|\b(jailbreak|dan mode|developer mode|modo desarrollador)\b"
    r"|\b(act as|actua como|pretend to be|finge que|you are now|ahora eres|ahora sos)\b"
    r"|<\s*/?\s*(system|user_question|document|conversation)\b|\[/?inst\]|<\|im_(start|end)\|>"
    r"|(reveal|show|print|leak|dime|mostra\w*|revela\w*)\b.{0,30}\b(key|clave|secret\w*|secreto\w*|env\w*|config\w*)"
)

MSG = {
    "injection": {
        "en": "I can't follow instructions that try to change how I work. I can answer questions about Lian and his projects.",
        "es": "No puedo seguir instrucciones que intentan cambiar cómo funciono. Puedo responder preguntas sobre Lian y sus proyectos.",
    },
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
    """Return 'injection', 'private', 'code_request' or None (= let the LLM router decide)."""
    q = norm(question)
    if INJECTION.search(q):
        return "injection"
    if PRIVATE.search(q):
        return "private"
    if CODE_REQUEST.search(q):
        return "code_request"
    return None
