# GlosSub — Bilingual subtitles for language learning

> Local CLI + web tool that turns any video in the language you're learning into **two-line, color-aligned bilingual subtitles** (`.ass` / `.srt` / `.json`) for VLC — without re-rendering or uploading the video.

🇪🇸 [Leer en español](README.es.md) · 🧭 [Architecture](docs/ARCHITECTURE.md)

## What it's for

Watching series in a foreign language with only native subtitles teaches little; with only original subtitles it's too hard. GlosSub shows both at once:

```
彼は先生に本をあげた          ← original (top, smaller)
Él le dio un libro al profesor ← translation (bottom, larger)
```

Matching words/phrases share the **same color** in both lines, so the learner sees which piece of the original means which piece of the translation. Optional **romaji** (Japanese transliteration) as a third line or replacing kanji.

## How it works

A pipeline of six pure, cached stages:

| # | Stage | What it does |
|---|---|---|
| 1 | `extract` | ffmpeg → 16 kHz mono WAV |
| 2 | `transcribe` | Whisper (MLX on Apple Silicon, faster-whisper CPU fallback) with word timestamps |
| 3 | `segment` | Groups words into readable subtitle cues |
| 4 | `translate` | LLM (any OpenAI-compatible endpoint) with structured JSON, batching and retries |
| 5 | `align` | LLM maps original ↔ translation phrase groups; strictly validated |
| 6 | `render` | Writes `.ass` (stacked or column-aligned layouts, colors, romaji), `.srt`, `.json` |

Each stage writes a JSON artifact to a content-addressed cache (`~/.glossub/cache/<fingerprint>/`), so re-rendering a different layout is offline and takes under a second; translations are cached per target language.

## Features

- CLI (Typer): `run`, `transcribe`, `render`, `cache`, `doctor`, `serve`, `tracks`; `--from-stage`, `--force`, `--repair-align`
- Layouts: `stacked` (default, keeps original word order) and `aligned` (each original chunk positioned above its meaning with `\an8\pos`)
- 8-color shared palette, Japanese particles inherit their neighbor's color
- Local web UI (FastAPI) that browses files on disk — the video is never uploaded
- `doctor` command that verifies ffmpeg/ffprobe actually work, not just exist

## Security by design

- Server binds to `127.0.0.1` only; path-traversal protection with `Path.resolve()` + `is_relative_to` (symlinks included, fail-closed)
- API key only from environment variables; never written to config, cache or logs
- ffmpeg called with argument lists (no `shell=True`)
- LLM output treated as untrusted: validated with Pydantic plus semantic checks (indices in range, target text literally present); invalid groups are dropped, not trusted
- Exact pinned dependencies; atomic artifact writes (`temp + os.replace`)

## Tech stack

Python 3.12 · mlx-whisper / faster-whisper · ffmpeg · Pydantic v2 · Typer · Rich · httpx · FastAPI + Uvicorn · pykakasi · pytest + pysubs2

## Quick start

```bash
uv venv && source .venv/bin/activate
uv pip install -e ".[dev]"        # add ".[cpu-asr]" on non-Apple-Silicon machines
export GLOSSUB_LLM_API_KEY=...     # key for your OpenAI-compatible endpoint
glossub doctor
glossub run "episode.mp4" --to es --align
glossub run "episode.mp4" --to es --align --layout aligned --romaji extra
glossub serve --media-root ~/Movies   # http://127.0.0.1:8756
```

## Results (real 23.7-min Japanese episode, Apple M2)

| Run | Translated cues | Phrase groups | Time |
|---|---|---|---|
| Translation, turbo model, 6× length guard | 253/254 (99%) | — | 3m11s (ASR cached) |
| Alignment, batch 20, concurrency 3 | 227/254 colored (89%) | 688 | 11m08s |
| Re-render from cache | — | — | < 1 s |

QA with libass over 254 cues × 6 layout/romaji combinations (1,524 frames): no clipping.

## Tests

```bash
pytest tests/ -q     # segmentation, layout, rendering, alignment regressions
```

## Status

Working v0.1 MVP, used daily for Japanese → Spanish. Next: measure cheaper LLM tiers, finish repair runs, polish the web UI.

## Author

**Lian Yang** — Full-Stack Developer.
