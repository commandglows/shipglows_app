---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_app
created: "2026-04-25"
updated: "2026-04-26"
status: reviewed
source_skill: sf-docs
scope: guidelines
owner: "Diane"
confidence: low
risk_level: medium
security_impact: none
docs_impact: yes
linked_systems: []
evidence:
  - CLAUDE.md
  - BUSINESS.md
  - BRANDING.md
depends_on:
  - BUSINESS.md@0.1.0
  - BRANDING.md@0.1.0
supersedes: []
next_review: "2026-07-26"
next_step: /sf-docs audit GUIDELINES.md
---
# Development Guidelines

## Scope

This document describes conventions for working in `contentflow_app`, the Flutter user-facing application in the ContentFlow ecosystem.

## Tech Stack

- **Flutter** (Dart 3.11+)
- **Riverpod** for state management
- **GoRouter** for navigation and guarded routes
- **Dio** for HTTP + FastAPI API calls
- **Clerk** for session tokens on web auth
- **SharedPreferences** for local cache and offline state

## Source Layout

- `lib/core/`: shared app primitives (app config, diagnostics, prefs providers, localization helpers).
- `lib/data/`: service layer and models (API clients, offline storage/queue, typed domain objects).
- `lib/providers/`: Riverpod providers/notifiers and cross-feature state composition.
- `lib/presentation/`: screens, widgets, theme, and route-facing UI.
- `test/`: unit and widget tests focused on routing, offline behavior, and critical state transitions.
- `specs/`: product/engineering specs and migration notes.
- `web_auth/`: Clerk runtime assets copied into web builds.

## Architecture Rules

1. Keep API/state logic outside widgets where practical.
2. Prefer feature-level services and models in `lib/data` over ad-hoc `http` calls.
3. Use Riverpod providers for cross-feature side effects and cache lifecycles.
4. Never bypass `AppAccessState` for route gating; routing decisions should stay centralized.
5. Any mutation that has an offline path must explicitly define:
   - queue payload shape,
   - conflict/dependency behavior,
   - reconciliation strategy,
   - user-visible error status.

## Riverpod Migration Policy

- Keep existing manual providers (`StateProvider`, `StateNotifierProvider`) on Riverpod 3 legacy imports (`package:flutter_riverpod/legacy.dart`) unless a dedicated refactor is explicitly scoped.
- Do not introduce new Riverpod codegen (`@riverpod` + generated `.g.dart`) opportunistically during dependency bumps; treat codegen adoption as a separate planned migration.

## Offline and Sync Rules (Mandatory)

- Do not remove or bypass local cache reads when API data is unavailable for read operations.
- Respect sync status states and expose clear labels in UI surfaces.
- Queue entries that depend on unresolved IDs must remain blocked until mapping exists.
- Maintain idempotence and safe retries for local queue replay.
- Keep `OfflineQueueStorage`, `OfflineStorageService`, and local ID mapping logic aligned when changing action schemas.

## Authentication and Access

- Entry/auth routing is controlled by route guards (`AppAccessStage` transitions) and must stay consistent across shell and auth-related screens.
- Avoid forcing navigation into full app flows when bootstrap fails for non-recoverable reasons.
- Preserve the explicit separation between authenticated app mode, demo mode, and entry/auth screens.

## UX and Copy Standards

- Surface backend availability state early in flows where users may expect immediate write confirmation.
- Never hide failure states behind generic toasts; show actionable state in-context.
- Use explicit labels on retry/pause/dependency waits.
- Keep loading states concise and specific.

## Testing Requirements

- Add/adjust tests for:
  - provider state transitions,
  - routing guard behavior for access states,
  - offline queueing/replay behavior,
  - bootstrap edge cases.
- Keep tests deterministic by stubbing API/queue/storage boundaries.

## Release Notes

- Update `CHANGELOG.md` for behavior changes, especially around auth and offline capabilities.
- Document newly introduced env vars and migration notes in `README.md` and `.env.example` (or supporting docs).

## Related Files

- `README.md` for quick start and runtime behavior summary.
- `SPEC-offline-sync-v2.md` for replay architecture and acceptance criteria.
- `CHANGELOG.md` for historical context.
