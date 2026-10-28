# GlosSub — Architecture & how it was built

## Pipeline

extract (FFmpeg, selected track → 16 kHz mono) → transcribe (MLX Whisper, word timestamps, hallucination filters) → segment (pauses, punctuation, length, duration) → translate (LLM in batches with context, validation and retries) → align (optional, LLM links phrases across languages) → render (ASS with colors, SRT, JSON). Each stage's result is cached and reused. Both a CLI and a local FastAPI web UI drive the same pipeline.

## Modules

- CLI: Typer commands to run the pipeline, render, manage the cache and serve the web UI.
- Pipeline: stage orchestration, restart from a given stage, force recomputation, skip if cached.
- Stages: extract, transcribe, segment, translate, align, layout, render.
- Providers: transcriber and translator interfaces; MLX Whisper and OpenAI-compatible LLM implementations.
- Prompts for translation and alignment kept outside the code.
- Pydantic models for words, cues, alignment groups and jobs.
- Web: FastAPI server with a static UI, loopback by default, with path validation.

## How it was built

1. Spec first: a written plan and a decisions document that every implementer, human or AI coding agent, follows.
2. Assumptions checked on real data before building on them (word timestamps, structured JSON from the LLM).
3. Hardware-driven choice: on an Apple Silicon Mac, transcription uses MLX Whisper.
4. Milestones measured on a real sample episode.
5. AI-assisted workflow: implementation driven with AI coding agents using written briefs and handoff notes; Lian defined scope, reviewed results in the player and steered fixes.

## Lessons learned

- Batch size matters: larger alignment batches produced truncated JSON in testing, so smaller batches were used.
- Translation-length guards had to be set per language, because valid Japanese→Spanish output is much longer than the source.
- Fill color reads better than colored outlines for the aligned words.
