# Retrieval evaluation (2026-11-11)

20 questions with a known source document, 12 that should not be answered from the docs, 62 chunks, embedder Model2VecEmbedder. Searches use the raw question (production rewrites it first).

| method | hit@1 | hit@3 | MRR | separation (AUC) |
|---|---|---|---|---|
| keywords only (BM25) | 95% | 100% | 0.97 | 0.88 |
| embeddings only | 75% | 90% | 0.85 | 0.65 |
| hybrid (0.6 BM25 + 0.4 embeddings) | 95% | 100% | 0.97 | 0.85 |

Hybrid with the live minimum score 0.25: 100% of answerable questions keep their top chunk and 33% of off-topic ones are filtered before the model sees them.

- Misses outside the top 3, keywords only (BM25): none
- Misses outside the top 3, embeddings only: profile-stack (top: elf-reader, expected rank 4); profile-years (top: codex-stickman-how-it-was-built, expected rank 5)
- Misses outside the top 3, hybrid (0.6 BM25 + 0.4 embeddings): none

Run: GitHub Actions "Assistant evaluation", retrieval job on PR #7 (commit ecc62ca), minishlab/potion-base-8M.
