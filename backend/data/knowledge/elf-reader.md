# ELF Reader — Android e-book reader with on-device voices

> ELF Reader is an Android app by Lian Yang, written in Kotlin with Jetpack Compose. It opens e-books and documents and reads them aloud in the background, with voices generated on the phone itself instead of on a server. It adds animated backgrounds, ambient sounds, an illustration gallery and a sleep timer for a calmer reading and listening experience.

## What it does

- Opens EPUB, Markdown, Word documents, plain text (TXT), PDFs with selectable text, and HTML.
- Reads the book aloud and keeps reading in the background, so the visitor can listen like an audiobook.
- Generates the voice on the device with Supertonic, an on-device text-to-speech model; on phones with a Snapdragon 8 Elite chip, generation can use the NPU (the phone's AI accelerator).
- Reading extras: animated backgrounds, ambient sounds, a gallery for the book's illustrations, and a sleep timer.

## Why on-device voices

Speech is synthesized on the phone, so reading aloud does not depend on a server or an internet connection for the voice, and there is no per-minute cloud TTS cost.

## Tech stack

Kotlin · Jetpack Compose · Android · Supertonic (on-device TTS) · Snapdragon NPU acceleration

## Availability

The portfolio documents the project. The app package (APK) and its source code are not distributed on the portfolio.
