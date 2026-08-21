---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: shipglows_app
created: "2026-04-26"
updated: "2026-08-11"
status: active
source_skill: 300-sg-docs
scope: technical
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
evidence:
  - "README.md"
  - "lib/main.dart"
  - "shipglows_data/technical/runtime-boundary.md"
  - "shipglows_data/technical/markdown-source-of-truth.md"
  - "shipglows_data/technical/managed-runner-foundation.md"
depends_on:
  - "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md@1.25.0"
  - "shipglows_data/technical/code-docs-map.md@1.1.0"
supersedes:
  - "CLAUDE.md@0.3.0 historical contributor guidance"
linked_systems:
  - "Flutter"
  - "Riverpod"
  - "GoRouter"
  - "Markdown source readers"
  - "Vercel Flutter web deployment"
next_review: "2026-09-03"
next_step: "Complete public TLS and authenticated browser proof for the implemented Workspace gateway."
---

# CLAUDE.md

## Project Overview

`shipglows_app` is the Flutter application and managed runner for the ShipGlows repository-health and agent Cockpit. The active runtime combines server-backed project/health projections with a local Markdown compatibility source.

There is one product runtime. Modules outside it are dormant code, not a compatibility target or a second application.

## Current Product Contract

- Active product: ShipGlows.
- Active runtime: `ShipGlowsApp` from `lib/main.dart`.
- Current MVP mode: authenticated Cockpit plus managed semantic conversations; Web, Android, and Windows are the target platforms.
- Deployment state is not inferred from this file; verify the configured Web deployment before making a hosted claim.
- Source of truth: Markdown and repository files.
- Runner database role: operational projection, index, cache, or sync layer unless a later reviewed spec supersedes this.

## ShipGlows Development Mode

- development_mode: vercel-preview-push
- validation_surface: vercel-preview
- ship_before_preview_test: yes
- post_ship_verification: sf-prod
- deployment_provider: vercel
- preview_source: Vercel deployment URL confirmed by `/sf-prod`
- production_url: https://shipglowsapp.vercel.app/
- notes: Push first, wait for Vercel to build the Flutter web app, then validate the matching served web deployment. Local Flutter checks are useful, but browser/user-flow proof comes from the Vercel URL.
- last_reviewed: 2026-05-14

## Tech Stack

- Flutter / Dart
- Riverpod
- GoRouter
- TypeScript / Fastify managed runner
- SQLite operational projection
- Firebase Auth identity adapter behind provider-neutral contracts
- Server-owned canonical project checkout with one fixed `main` or `preview` delivery branch
- Codex app-server first agent adapter behind `AgentRuntime`
- The existing ShipGlows read-only terminal TUI lives in `/home/claude/shipglowz/tui`; this Flutter app does not own the Bun/OpenTUI package.
- The authenticated operator workspace—implemented terminal rendering, allowlisted tmux attachment, planned Neovim proof, and bounded file operations—belongs to this repository's Flutter `app/` plus managed `runner/`, and remains separate from the read-only TUI and ordinary customer permissions.
- Vercel builds and serves the Flutter web output
- Shared preferences for local settings
- Markdown/source parsers under `lib/data/shipglows_sources/`

Do not infer that FastAPI, Clerk, Firestore, or OpenRouter are active product dependencies just because legacy files mention them. Firebase Auth is the current source-code identity adapter behind the portable auth boundary; Convex is the target product backend/data layer, while the managed Fastify/SQLite runner remains a justified execution-plane exception. Deployment state must be documented separately from source-code state.

## Common Commands

```bash
flutter pub get
flutter run -d chrome
flutter test
flutter analyze
```

Focused checks:

```bash
flutter test test/data/shipglows_sources
flutter test test/domain/project_health
! rg -n "APP_TARGET|LegacyShipGlowsApp" lib/main.dart lib/shipglows web/index.html
rg -n "ShipGlowsApp" lib/main.dart lib/shipglows
```

Optional TUI checks:

```bash
cd tui
bun run typecheck
bun test
```

## ARM64 Android Release Guardrail

On Linux ARM64 (`aarch64`/`arm64`), do not run Android release builds locally: no `flutter build apk --release`, `flutter build appbundle --release`, `./gradlew assembleRelease`, or `./gradlew bundleRelease`. Route APK/AAB release builds to a Linux x64 CI runner. Local Flutter work is limited to `flutter analyze`, `flutter test`, development runs, and web builds when explicitly needed.

## Active App Structure

- `lib/main.dart`: single ShipGlows composition root.
- `lib/shipglows/`: active ShipGlows UI runtime.
- `lib/data/shipglows_sources/`: active source readers and parsers.
- `lib/domain/project_health/`: active project posture model.
- `tui/`: optional ShipGlows terminal dashboard runtime (Bun/OpenTUI), read-only V1.
- `shipglows_data/technical/`: technical governance for active and dormant-module boundaries.
- `../runner/`: active managed control plane.
- `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md`: active product chantier.

## Dormant Modules

These areas are outside the product entrypoint. They must not be exposed or reused without a current ShipGlows spec:

- `lib/router.dart`
- `lib/providers/providers.dart`
- `lib/presentation/**`
- `lib/data/services/**`
- `lib/data/models/**`
- `lib/core/**` when not imported by ShipGlows
- `web_auth/**`
- historical workflow records outside the active MVP contract

Use `shipglows_data/technical/runtime-boundary.md` before moving, deleting, or integrating any of them.

## Data Rules

- Markdown/repo files are canonical.
- A database may be introduced later only as a projection/sync/index unless a future spec changes the contract.
- If the app changes data that belongs in a user's project, the intended write path is to update the relevant Markdown/repo file.
- Do not place privileged service-role keys, API secrets, BYOK provider keys, or terminal capabilities in Flutter client code.

## Current High-Risk Boundaries

- Any auth provider replacement or new database authority.
- BYOK/OpenRouter.
- Text feedback.
- Interactive terminal/tmux operator access from Flutter Web, Android, or Windows is implemented behind an allowlisted short-lived capability. Real server PTY/tmux/Codex smoke passes; public HTTPS/authenticated reconnect and Neovim proof remain.
- New automatic agent triggers, push, merge, deployment, or canonical write-back.
- Any new backend authority beyond the documented Convex target and Fastify/SQLite execution-plane exception.

## Documentation Rule

Before broad implementation work, keep these in sync:

- `shipglows_data/editorial/content-map.md`
- `shipglows_data/technical/code-docs-map.md`
- `shipglows_data/technical/runtime-boundary.md`
- `shipglows_data/technical/markdown-source-of-truth.md`
- `shipglows_data/technical/managed-runner-foundation.md`
