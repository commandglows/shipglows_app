---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.2.0"
project: shipflow_app
created: "2026-04-26"
updated: "2026-05-08"
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
  - "docs/technical/runtime-boundary.md"
  - "docs/technical/markdown-source-of-truth.md"
  - "docs/technical/legacy-contentflow-inventory.md"
depends_on:
  - "specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
  - "docs/technical/code-docs-map.md@0.1.0"
supersedes:
  - "CLAUDE.md@1.1.0 contentflow_app guidance"
linked_systems:
  - "Flutter"
  - "Riverpod"
  - "GoRouter"
  - "Markdown source readers"
next_review: "2026-06-08"
next_step: "/sf-docs update"
---

# CLAUDE.md

## Project Overview

`shipflow_app` is the Flutter application for ShipFlow operational visibility. The active runtime is a local-first ShipFlow dashboard that reads Markdown and ledger files from ShipFlow repositories and registries.

The repository still contains a legacy ContentFlow runtime. Treat it as migration/reference material unless a ready ShipFlow spec explicitly adapts it.

## Current Product Contract

- Active product: ShipFlow.
- Active default runtime: `APP_TARGET=shipflow`.
- Temporary legacy runtimes: `APP_TARGET=legacy` and `APP_TARGET=contentflow`.
- Current V1 mode: local-first, read-oriented, Linux desktop target.
- Source of truth: Markdown and repository files.
- Future database role: projection, index, cache, or sync layer unless a later reviewed spec supersedes this.

## Tech Stack

- Flutter / Dart
- Riverpod
- GoRouter
- Shared preferences for local settings
- Markdown/source parsers under `lib/data/shipflow_sources/`

Do not infer that FastAPI, Clerk, Supabase, Firebase, Firestore, or OpenRouter are active product dependencies just because legacy files mention them.

## Common Commands

```bash
flutter pub get
flutter run -d linux
flutter test
flutter analyze
```

Focused checks:

```bash
flutter test test/data/shipflow_sources
flutter test test/domain/project_health
rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib test
```

## ARM64 Android Release Guardrail

On Linux ARM64 (`aarch64`/`arm64`), do not run Android release builds locally: no `flutter build apk --release`, `flutter build appbundle --release`, `./gradlew assembleRelease`, or `./gradlew bundleRelease`. Route APK/AAB release builds to a Linux x64 CI runner. Local Flutter work is limited to `flutter analyze`, `flutter test`, desktop runs, and web builds when explicitly needed.

## Active App Structure

- `lib/main.dart`: root app target switch.
- `lib/shipflow/`: active ShipFlow UI runtime.
- `lib/data/shipflow_sources/`: active source readers and parsers.
- `lib/domain/project_health/`: active project posture model.
- `docs/technical/`: technical governance for active and legacy boundaries.
- `specs/shipflow-legacy-contentflow-fusion.md`: active migration/fusion chantier.

## Legacy Structure

These areas are retained for classification, not as active product direction:

- `lib/router.dart`
- `lib/providers/providers.dart`
- `lib/presentation/**`
- `lib/data/services/**`
- `lib/data/models/**`
- `lib/core/**` when tied to ContentFlow assumptions
- `web_auth/**`
- legacy `specs/*.md`

Use `docs/technical/legacy-contentflow-inventory.md` before moving or deleting any of them.

## Data Rules

- Markdown/repo files are canonical.
- A database may be introduced later only as a projection/sync/index unless a future spec changes the contract.
- If the app changes data that belongs in a user's project, the intended write path is to update the relevant Markdown/repo file.
- Do not place privileged service-role keys, API secrets, BYOK provider keys, or terminal capabilities in Flutter client code.

## Future Features Requiring Dedicated Specs

- Firebase/Firestore or any database projection.
- Firebase Auth, Clerk, or another auth provider.
- BYOK/OpenRouter.
- Text feedback.
- Terminal access from web UI.
- Agent runner/orchestration from the interface.
- FastAPI/local service runner.

## Documentation Rule

Before broad implementation work, keep these in sync:

- `CONTENT_MAP.md`
- `docs/technical/code-docs-map.md`
- `docs/technical/runtime-boundary.md`
- `docs/technical/markdown-source-of-truth.md`
- `docs/technical/legacy-contentflow-inventory.md`
