# Retrieval evaluation (2026-11-11)

20 questions with a known source document, 12 that should not be answered from the docs, 62 chunks, embedder Model2VecEmbedder. Searches use the raw question (production rewrites it first).

| method | hit@1 | hit@3 | MRR | separation (AUC) |
|---|---|---|---|---|
| keywords only (BM25) | 95% | 100% | 0.97 | 0.88 |
| embeddings only | 90% | 100% | 0.95 | 0.65 |
| hybrid (0.6 BM25 + 0.4 embeddings) | 100% | 100% | 1.00 | 0.85 |

Hybrid with the live minimum score 0.25: 100% of answerable questions keep their top chunk and 33% of off-topic ones are filtered before the model sees them.

- Misses outside the top 3, keywords only (BM25): none
- Misses outside the top 3, embeddings only: none
- Misses outside the top 3, hybrid (0.6 BM25 + 0.4 embeddings): none

Run: GitHub Actions "Assistant evaluation", retrieval job on PR #7 (commit 9b855d4), minishlab/potion-base-8M.

The previous run (commit ecc62ca) used "he/his" instead of "Lian" in three questions. With that wording, embeddings only scored hit@1 75%, hit@3 90%, MRR 0.85 and missed profile-stack (rank 4) and profile-years (rank 5); hybrid scored hit@1 95%, MRR 0.97. BM25 was the same, since it drops those words.
