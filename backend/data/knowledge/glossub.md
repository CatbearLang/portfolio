# GlosSub — learn languages by watching series

> GlosSub helps people learn languages by watching series. It captures and understands the audio with Whisper, an LLM translates it and generates the subtitles, and then it aligns the words between the original and the translation (color-coded) so learners understand the translation better. Technically, it is a bilingual subtitle generator with cross-language alignment: a command-line and local web tool (Python, FastAPI) that turns videos into bilingual subtitles. It uses FFmpeg to extract audio, Whisper to transcribe with timestamps, and a configurable LLM to translate the dialogue and, optionally, link fragments across languages. It exports ASS with color-coded correspondences, plus SRT and JSON, and reuses intermediate results through caching. Video is processed locally; text may be sent to an external provider depending on the configuration.

## What it's for

Language learners watching real video see the original line and its translation together. In the ASS output, matching words or phrases can share the same color, so the learner sees which part of the original corresponds to which part of the translation. Optional romaji for Japanese.

## How it works

1. Extract: FFmpeg converts the selected audio track to 16 kHz mono audio for speech recognition. Input must be a format FFmpeg can read.
2. Transcribe: on Mac, MLX Whisper produces the dialogue with word-level timestamps, with filters that discard some likely hallucinations.
3. Segment: words are grouped into subtitle cues using pauses, punctuation, length and duration, which decides what text appears together and for how long.
4. Translate: cues are sent in batches, with context, to a configurable LLM over an OpenAI-compatible API. Responses are validated and retried; translation is not guaranteed to be complete, and untranslated cues can remain, flagged as low confidence.
5. Align (optional): the LLM links words or phrases of the original to the translation. This is meaning alignment shown as colors, not audio sync (timing comes from the transcription), and it can be partial.
6. Export and reuse: ASS (bilingual layout, colors when aligned), SRT (plain text, no colors) and JSON (structured data). Intermediate results are cached so stages are not repeated on the same material.

## Engineering story

The interesting part is the orchestration: transcription, segmentation, contextual translation, bilingual alignment and rendering, each as a separate stage with validation of LLM output and reuse of cached stage results.

## Privacy and security

- Video and audio are processed locally. Translation and alignment send text and context to the configured LLM endpoint; if that is a cloud provider, the text leaves the machine, and cost depends on the provider.
- The local web UI binds to loopback by default and validates file paths. It has no authentication; it is a local tool, not meant for public exposure.
- The API key is read from environment variables. LLM output is treated as untrusted and validated before use.

## Known limits

- The cache key does not include every processing option; changing some parameters (for example model or audio track) may reuse earlier results unless recomputation is forced.
- Transcription is set up for MLX Whisper on Mac; other platforms are not verified.

## Sample run (one episode, not a guarantee)

On one sample run with a 23.7-minute Japanese episode: 253 of 254 cues were translated and 227 of 254 were colored by alignment (688 alignment groups). These numbers describe that run only and do not measure translation accuracy.

## Tech stack

Python · FastAPI · Typer · Pydantic · MLX Whisper · FFmpeg · OpenAI-compatible LLM API · pytest

## Author

Lian Yang — Full-Stack Developer.

## Web app (from Lian's CV)

GlosSub is shipped as a web app (glossub.shop) supporting five languages in both directions, with sentence replay, a subtitle editor and ASS/SRT export. LLM output is validated with Pydantic and semantic checks before use. On the 23.7-minute sample episode, re-rendering from cache takes under 1 second (99% of cues translated, 89% phrase-alignment coverage).

## Demo account for reviewers

Lian created a public demo account specifically so recruiters and evaluators can try GlosSub. These credentials are meant to be shared:

- Site: https://glossub.shop
- Email: reviewer@glossub.example
- Password: GlosSub-Demo-2933c057e4e0
