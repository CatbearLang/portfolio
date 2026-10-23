"""Local knowledge base: markdown -> chunks -> embeddings -> FAISS index."""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import faiss
import numpy as np


@dataclass
class Chunk:
    source: str   # file stem, e.g. "glossub"
    title: str    # section heading
    text: str


class Embedder(Protocol):
    def embed(self, texts: list[str]) -> np.ndarray: ...


class HashEmbedder:
    """Deterministic bag-of-words hashing embedder. No downloads; used in tests/offline."""

    def __init__(self, dim: int = 512):
        self.dim = dim

    def embed(self, texts: list[str]) -> np.ndarray:
        out = np.zeros((len(texts), self.dim), dtype="float32")
        for i, t in enumerate(texts):
            for w in re.findall(r"[a-z0-9áéíóúñ]+", t.lower()):
                if len(w) < 3:
                    continue
                h = int(hashlib.md5(w.encode()).hexdigest(), 16)
                out[i, h % self.dim] += 1.0
        return out


class FastEmbedder:
    """Free local embeddings via fastembed (ONNX, no API key)."""

    def __init__(self, model: str):
        from fastembed import TextEmbedding
        self.model = TextEmbedding(model_name=model)

    def embed(self, texts: list[str]) -> np.ndarray:
        return np.array(list(self.model.embed(texts)), dtype="float32")


def chunk_markdown(path: Path, max_chars: int = 1200) -> list[Chunk]:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"<img[^>]*>", "", text)
    parts = re.split(r"\n(?=#{1,3} )", text)
    doc_title = parts[0].splitlines()[0].lstrip("# ").strip() if parts else path.stem
    chunks: list[Chunk] = []
    for part in parts:
        lines = part.strip().splitlines()
        if not lines:
            continue
        heading = lines[0].lstrip("# ").strip()
        body = part.strip()
        for i in range(0, len(body), max_chars):
            piece = body[i:i + max_chars].strip()
            if len(piece) > 40:
                chunks.append(Chunk(path.stem, f"{doc_title} › {heading}", piece))
    return chunks


class KnowledgeBase:
    def __init__(self, embedder: Embedder, chunks: list[Chunk]):
        self.embedder = embedder
        self.chunks = chunks
        vecs = embedder.embed([f"{c.title}\n{c.text}" for c in chunks])
        faiss.normalize_L2(vecs)
        self.index = faiss.IndexFlatIP(vecs.shape[1])
        self.index.add(vecs)

    @classmethod
    def from_dir(cls, folder: Path, embedder: Embedder) -> "KnowledgeBase":
        chunks = [c for p in sorted(folder.glob("*.md")) for c in chunk_markdown(p)]
        return cls(embedder, chunks)

    def search(self, query: str, k: int = 4) -> list[tuple[Chunk, float]]:
        q = self.embedder.embed([query])
        faiss.normalize_L2(q)
        scores, idx = self.index.search(q, min(k, len(self.chunks)))
        return [(self.chunks[i], float(s)) for s, i in zip(scores[0], idx[0]) if i >= 0]


def make_embedder(kind: str, model: str) -> Embedder:
    return HashEmbedder() if kind == "hash" else FastEmbedder(model)
