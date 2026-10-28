"""Settings read from environment variables only (no secrets on disk)."""
import os
from dataclasses import dataclass, field
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent


@dataclass
class Settings:
    llm_base_url: str = field(default_factory=lambda: os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1"))
    llm_api_key: str = field(default_factory=lambda: os.getenv("LLM_API_KEY", ""))
    llm_model: str = field(default_factory=lambda: os.getenv("LLM_MODEL", "llama-3.1-8b-instant"))
    llm_provider: str = field(default_factory=lambda: os.getenv("LLM_PROVIDER", "openai"))  # openai | fake
    embedder: str = field(default_factory=lambda: os.getenv("EMBED_BACKEND", "model2vec"))  # model2vec | hash (tests) | fastembed (local only; legacy EMBEDDER var is ignored)
    embed_model: str = field(default_factory=lambda: os.getenv("EMBED_MODEL", "minishlab/potion-base-8M"))
    knowledge_dir: Path = field(default_factory=lambda: Path(os.getenv("KNOWLEDGE_DIR", BASE / "data" / "knowledge")))
    top_k: int = field(default_factory=lambda: int(os.getenv("TOP_K", "3")))
    min_score: float = field(default_factory=lambda: float(os.getenv("MIN_SCORE", "0.15")))
    cors_origins: list[str] = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173").split(","))
