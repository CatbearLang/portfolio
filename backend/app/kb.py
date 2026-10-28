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
            if len(piece) > 40 and heading.lower() != "author":
                chunks.append(Chunk(path.stem, f"{doc_title} › {heading}", piece))
    return chunks


_STOP = set("what which who how does did the and for are his her him its this that with from about tell can you your que cual como del las los una por para con sus hace tiene sobre esta este son ser fue lian yang".split())
# Small bilingual expansion so Spanish / generic questions hit the right English docs.
_EXPAND = {
    "stack": "technical skills frontend backend react postgresql python", "tech": "technical skills", "tecnologias": "technical skills",
    "skills": "technical skills", "habilidades": "technical skills", "estudio": "education degree university thesis",
    "estudios": "education", "formacion": "education", "universidad": "education university", "tesis": "thesis education",
    "experiencia": "experience", "trabajo": "experience freelance", "idiomas": "languages learning", "aprender": "learn learning",
    "series": "series watching learn", "juego": "game arcane", "subtitulos": "subtitles", "remoto": "remote roles",
    "disponible": "remote roles looking", "proyectos": "projects",
}


def _tokens(text: str) -> list[str]:
    import unicodedata
    t = unicodedata.normalize("NFD", text.lower()).encode("ascii", "ignore").decode()
    return [w for w in re.findall(r"[a-z0-9]+", t) if len(w) > 2 and w not in _STOP]


class KnowledgeBase:
    def __init__(self, embedder: Embedder, chunks: list[Chunk]):
        self.embedder = embedder
        self.chunks = chunks
        # BM25 lexical index (pure Python, tiny memory) for a hybrid with the vector search.
        import math
        from collections import Counter
        self._tf = [Counter(_tokens(f"{c.title} {c.title} {c.text}")) for c in chunks]
        self._len = [sum(tf.values()) for tf in self._tf]
        self._avg = sum(self._len) / max(1, len(self._len))
        df = Counter(w for tf in self._tf for w in tf)
        n = len(chunks)
        self._idf = {w: math.log(1 + (n - d + 0.5) / (d + 0.5)) for w, d in df.items()}
        vecs = embedder.embed([f"{c.title}\n{c.text}" for c in chunks])
        faiss.normalize_L2(vecs)
        self.index = faiss.IndexFlatIP(vecs.shape[1])
        self.index.add(vecs)

    @classmethod
    def from_dir(cls, folder: Path, embedder: Embedder) -> "KnowledgeBase":
        chunks = [c for p in sorted(folder.glob("*.md")) for c in chunk_markdown(p)]
        return cls(embedder, chunks)

    def _bm25(self, query: str) -> np.ndarray:
        terms = _tokens(query)
        terms += [x for t in list(terms) for x in _EXPAND.get(t, "").split()]
        out = np.zeros(len(self.chunks), dtype="float32")
        for i, tf in enumerate(self._tf):
            for w in set(terms):
                f = tf.get(w, 0)
                if f:
                    out[i] += self._idf[w] * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * self._len[i] / self._avg))
        return out

    def search(self, query: str, k: int = 4) -> list[tuple[Chunk, float]]:
        """Hybrid: 0.4 * cosine (vector) + 0.6 * BM25 normalized to the best match."""
        q = self.embedder.embed([query])
        faiss.normalize_L2(q)
        scores, idx = self.index.search(q, len(self.chunks))
        vec = np.zeros(len(self.chunks), dtype="float32")
        for s_, i in zip(scores[0], idx[0]):
            if i >= 0:
                vec[i] = s_
        bm = self._bm25(query)
        bm = bm / bm.max() if bm.max() > 0 else bm
        total = 0.4 * vec + 0.6 * bm
        order = np.argsort(-total)[:k]
        return [(self.chunks[i], float(total[i])) for i in order]


def make_embedder(kind: str, model: str) -> Embedder:
    return HashEmbedder() if kind == "hash" else FastEmbedder(model)
