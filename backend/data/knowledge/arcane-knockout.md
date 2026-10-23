# Arcane Knockout

> 3D wizard-duel arena game built with **Godot 4.7 (GDScript)**, now being ported to **Unity 6 (C#)**, inspired by the *Warlock* custom map from Warcraft III. Desktop (Windows) and Android, with online multiplayer.

🇪🇸 [Leer en español](README.es.md)

## What it is

There is no health bar. Every hit raises your **Instability**, so the next push throws you farther. The last wizard standing wins while the platform crumbles into the lava. Between rounds players spend gold in a shop (upgrades, spells, mobility, passive items).

## Features (v1.3.1)

- 1–6 wizards: player vs. bots, with per-bot personality, perception and shop logic
- **Online multiplayer** (2–4 players + bots): ENet over UDP, create/join room by code or IP, LAN discovery, UPnP; spells synchronized over the network
- Spell system with data-driven catalog, projectiles, zones, a 10-power "Grimoire", three-rank mobility (Dash) and 6 passive items
- Four randomly selected arenas with destructible structures (cracks accumulate; the last hit decides the fall direction)
- Keyboard/mouse and touch controls with aim assist; quality presets and FPS cap for low-end phones; shader warm-up to avoid stutter

## How it works (code architecture)

| Folder | Responsibility |
|---|---|
| `core/` | Game rules, match/round state, Instability math, scoring, shop logic, settings, quality |
| `spells/` | Spell catalog/data, spell system, projectiles, zone and terrain effects |
| `ai/` | Bot brain (decision making), perception, profiles, bot shopping |
| `net/` | Multiplayer session and match synchronization |
| `input/` | Combat commands abstracted from keyboard/mouse and touch, aim assist |
| `combatants/` | Combatant logic, locomotion animation, retargeting |
| `arena/`, `ui/`, `scenes/` | Arena generation/destruction, HUD, menus, game scene |
| `tests/` | Headless test runner and suites |

~190 GDScript files (~41k lines including tools and tests).

## How it was built

- **Role:** Lian built the game logic and code — rules, combat, Instability, AI bots, economy/shop, input, networking, testing and builds — using an AI-assisted workflow. The art, textures and 3D models were AI-generated; visual scene design and 3D modeling were not part of this role.
- **AI-assisted workflow:** development was driven with AI coding agents using written decision records (`DECISIONS.md`), status/handoff docs and per-version delivery notes; every change was specified, implemented, then verified.
- **Automated, headless testing:** `godot --headless` test runner checks that every script compiles and runs suites for rules, economy, Grimoire, UI, camera, structures, maps and stress (e.g. v1.3.1 suite: main runner 519 checks / 0 failures, economy 349/0). Tests are mandatory before exporting an APK.

## In progress: Unity 6 port (build 0.0.9, Oct 20, 2026)

The game is being ported from Godot to **Unity 6 (6000.6.5f1, C#, Mono backend)**; the latest Windows build is 0.0.9.

- One runtime assembly (`ArcaneKnockout.Runtime`, ~410 types, ~3.6k methods) organized into `Gameplay`, `Net`, `Core`, `Arena`, `Rendering`, `UI`, `Audio` and `Input` namespaces
- Gameplay rewritten in C#: `MatchController`, `CombatMath`, `SpellClashRules` (elemental spell clashes), `ElementalStatus`, bots (`BotBrain`, `BotPersonality`, `BotShopper`, `GridNavigation`), shop, titles and mastery
- Networking: online sessions with snapshot frames and history buffer (`NetFrame`, `NetFrameHistory`), LAN room discovery and a relay/NAT-punch transport (`NorayTransport`), on Unity Netcode/Transport packages
- Procedural arena: platform graph and collapse planner (`PlatformCollapseDirector`, `CollapsePlanner`), procedural props
- Stack additions: Unity Input System, ProBuilder, Unity Netcode/Transport

The Godot version (v1.3.1) described above remains the most complete release.

## Tech stack

Godot 4.7 · GDScript · Unity 6 · C# · ENet (UDP) · Forward+ (desktop) / Compatibility (Android) renderers · headless CI-style test scripts

## Author

**Lian Yang** — Informatics Engineer.
