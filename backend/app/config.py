"""Settings read from environment variables only (no secrets on disk)."""
import os
from dataclasses import dataclass, field
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent


DEFAULT_M2V = "minishlab/potion-base-8M"


def _model2vec_name() -> str:
    name = os.getenv("MODEL2VEC_MODEL") or os.getenv("EMBED_MODEL") or DEFAULT_M2V
    return name if ("potion" in name.lower() or "m2v" in name.lower()) else DEFAULT_M2V


@dataclass
class Settings:
    llm_base_url: str = field(default_factory=lambda: os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1"))
    llm_api_key: str = field(default_factory=lambda: os.getenv("LLM_API_KEY", ""))
    llm_model: str = field(default_factory=lambda: os.getenv("LLM_MODEL", "llama-3.1-8b-instant"))
    llm_provider: str = field(default_factory=lambda: os.getenv("LLM_PROVIDER", "openai"))  # openai | fake
    embedder: str = field(default_factory=lambda: os.getenv("EMBED_BACKEND", "model2vec"))  # model2vec | hash (tests) | fastembed (local only; legacy EMBEDDER var is ignored)
    # Only model2vec static models are valid here. A leftover EMBED_MODEL from the old fastembed setup
    # (e.g. BAAI/bge-small-en-v1.5) is ignored instead of crashing every request.
    embed_model: str = field(default_factory=lambda: _model2vec_name())
    knowledge_dir: Path = field(default_factory=lambda: Path(os.getenv("KNOWLEDGE_DIR", BASE / "data" / "knowledge")))
    top_k: int = field(default_factory=lambda: int(os.getenv("TOP_K", "3")))
    min_score: float = field(default_factory=lambda: float(os.getenv("MIN_SCORE", "0.15")))
    cors_origins: list[str] = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173").split(","))
