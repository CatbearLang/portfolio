# Arcane Knockout

> 3D wizard-duel arena game built with **Unity 6 (C#)**, inspired by the *Warlock* custom map from Warcraft III. Online multiplayer, Windows build 0.0.9 (Oct 20, 2026). It was migrated to Unity 6 from an earlier prototype.

## What it is

There is no health bar. Every hit raises your **Instability**, so the next push throws you farther. The last wizard standing wins while the platform crumbles into the lava. Between rounds players spend gold in a shop. Arenas include a grassy island and a volcanic lava arena that collapses during the match.

## How it works (code architecture)

- Engine: Unity 6 (6000.6.5f1), C#, Mono backend.
- One runtime assembly (`ArcaneKnockout.Runtime`, ~410 types, ~3.6k methods) organized into `Gameplay`, `Net`, `Core`, `Arena`, `Rendering`, `UI`, `Audio` and `Input` namespaces.
- Gameplay in C#: `MatchController`, `CombatMath`, `SpellClashRules` (elemental spell clashes), `ElementalStatus`, bots (`BotBrain`, `BotPersonality`, `BotShopper`, `GridNavigation`), shop, titles and mastery.
- Networking: online sessions with snapshot frames and a history buffer (`NetFrame`, `NetFrameHistory`), LAN room discovery and a relay/NAT-punch transport (`NorayTransport`), on Unity Netcode/Transport packages.
- Procedural arena: platform graph and collapse planner (`PlatformCollapseDirector`, `CollapsePlanner`), procedural props.
- Stack: Unity 6, C#, Unity Input System, ProBuilder, Unity Netcode/Transport.

## How it was built

- **Role:** Lian built the game logic and code — rules, combat, Instability, AI bots, shop, input, networking and builds — using an AI-assisted workflow. The art, textures and 3D models were AI-generated; visual scene design and 3D modeling were not part of this role.
- **AI-assisted workflow:** development was driven with AI coding agents using written decision records, status/handoff docs and per-version delivery notes; every change was specified, implemented, then verified.

## Author

**Lian Yang** — Full-Stack Developer.
