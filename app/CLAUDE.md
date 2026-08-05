---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.3.0"
project: shipglows_app
created: "2026-04-26"
updated: "2026-08-03"
status: draft
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
evidence:
  - "README.md"
  - "lib/main.dart"
  - "shipglows_data/technical/runtime-boundary.md"
  - "shipglows_data/technical/markdown-source-of-truth.md"
  - "shipglows_data/technical/legacy-contentflow-inventory.md"
depends_on:
  - "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md@1.4.0"
  - "shipglows_data/technical/code-docs-map.md@0.8.0"
supersedes:
  - "CLAUDE.md@1.1.0 contentflow_app guidance"
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

The repository still contains a legacy ContentFlow runtime. Treat it as migration/reference material unless a ready ShipGlows spec explicitly adapts it.

## Current Product Contract

- Active product: ShipGlows.
- Active default runtime: `APP_TARGET=shipglows`.
- Temporary legacy runtimes: `APP_TARGET=legacy` and `APP_TARGET=contentflow`.
- Current MVP mode: authenticated Cockpit plus managed semantic conversations; Web, Android, and Windows are the target platforms.
- Current validation loop: push to Git, let Vercel build the Flutter web app, then validate the served web version.
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
- Supabase first auth adapter behind provider-neutral contracts
- GitHub App repository authorization and managed worktrees
- Codex app-server first agent adapter behind `AgentRuntime`
- The existing ShipGlows read-only terminal TUI lives in `/home/claude/shipglowz/tui`; this Flutter app does not own the Bun/OpenTUI package.
- The authenticated operator workspace—implemented terminal rendering, allowlisted tmux attachment, planned Neovim proof, and bounded file operations—belongs to this repository's Flutter `app/` plus managed `runner/`, and remains separate from the read-only TUI and ordinary customer permissions.
- Vercel builds and serves the Flutter web output
- Shared preferences for local settings
- Markdown/source parsers under `lib/data/shipglows_sources/`

Do not infer that FastAPI, Clerk, Firebase, Firestore, or OpenRouter are active product dependencies just because legacy files mention them. Supabase is the current first identity adapter and must remain behind the portable auth boundary.

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
rg -n "APP_TARGET|LegacyShipGlowsApp|ShipGlowsApp" lib test
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

- `lib/main.dart`: root app target switch.
- `lib/shipglows/`: active ShipGlows UI runtime.
- `lib/data/shipglows_sources/`: active source readers and parsers.
- `lib/domain/project_health/`: active project posture model.
- `tui/`: optional ShipGlows terminal dashboard runtime (Bun/OpenTUI), read-only V1.
- `shipglows_data/technical/`: technical governance for active and legacy boundaries.
- `../runner/`: active managed control plane.
- `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md`: active product chantier.

## Legacy Structure

These areas are retained for classification, not as active product direction:

- `lib/router.dart`
- `lib/providers/providers.dart`
- `lib/presentation/**`
- `lib/data/services/**`
- `lib/data/models/**`
- `lib/core/**` when tied to ContentFlow assumptions
- `web_auth/**`
- legacy `shipglows_data/workflow/specs/*.md`

Use `shipglows_data/technical/legacy-contentflow-inventory.md` before moving or deleting any of them.

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
- FastAPI/local service runner.

## Documentation Rule

Before broad implementation work, keep these in sync:

- `shipglows_data/editorial/content-map.md`
- `shipglows_data/technical/code-docs-map.md`
- `shipglows_data/technical/runtime-boundary.md`
- `shipglows_data/technical/markdown-source-of-truth.md`
- `shipglows_data/technical/legacy-contentflow-inventory.md`
