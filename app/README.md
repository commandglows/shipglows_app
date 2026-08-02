# ShipGlows Operations Dashboard App

Local-first Flutter app for ShipGlows operational visibility.

## Scope (V1)

- Read-only dashboard for ShipGlows evidence sources.
- Android and Web targets.
- No write-back into ShipGlows trackers or ledgers.
- No auth, no cloud sync, no backend service.
- Legacy ContentFlow code remains in the repo only as migration/reference material.

## Source Inputs

The app reads:

- `/home/claude/shipglows_data/PROJECTS.md`
- `/home/claude/shipglows_data/AUDIT_LOG.md`
- `/home/claude/shipglows_data/TASKS.md`
- `/home/claude/shipglows_data/OPERATIONS_LOG.md`
- `/home/claude/shipglows_data/DEPENDENCY_LOG.md`
- `/home/claude/shipglowz/shipglows_data/workflow/specs/*.md`
- Project-local governance docs (`shipglows_data/workflow/AUDIT_LOG.md`, `shipglows_data/workflow/TASKS.md`, `CHANGELOG.md`, `shipglows_data/business/business.md`, `shipglows_data/business/product.md`, `shipglows_data/technical/guidelines.md`, `shipglows_data/technical/architecture.md`) when listed in `PROJECTS.md`

## Security and File Access

- Reads are restricted to allowlisted roots from `source_path_policy.dart`.
- Symlink escapes outside allowed roots are denied.
- Sensitive path segments are redacted in diagnostics.
- File size limits: `2 MB` per file, `20 MB` per refresh.

## Unsupported Target Behavior

Web builds are unsupported for direct local file reads. The app surfaces an explicit `unsupported_source` diagnostic instead of attempting a fake fallback.

## Tracker vs Ledger Model

- `shipglows_data/workflow/TASKS.md` and `shipglows_data/workflow/AUDIT_LOG.md` remain human trackers.
- `OPERATIONS_LOG.md` and `DEPENDENCY_LOG.md` are machine-readable append-only ledgers.
- Event writes must go through `/home/claude/shipglowz/tools/append_shipglows_event.py`.

## Run

```bash
cd /home/claude/shipglowz_app/app
flutter pub get
flutter run -d chrome
```

## Terminal TUI

The ShipGlows terminal dashboard is maintained with the ShipGlows skills under `/home/claude/shipglowz/tui`, not in this Flutter app repo.

One-time command install:

```bash
/home/claude/shipglowz/tui/scripts/install-shipglows-tui.sh
sftui
```

```bash
cd /home/claude/shipglowz/tui
bun install
bun run dev
```

- Requires Bun (OpenTUI is Bun-only for this V1).
- Isolated dependency boundary: no OpenTUI dependency is added to this Flutter root.
- Scope is read-only inspection of ShipGlows sources; no write-back/actions.

## Runtime Targets

The default runtime is ShipGlows:

```bash
flutter run -d chrome
```

The repository still exposes the old ContentFlow runtime for migration audit:

```bash
flutter run -d chrome --dart-define=APP_TARGET=legacy
flutter run -d chrome --dart-define=APP_TARGET=contentflow
```

Do not use the legacy target as the product direction. Its modules are classified
in `shipglows_data/technical/legacy-contentflow-inventory.md`.

## Future Auth, Sync, And Backend Work

ShipGlows will likely need multi-user auth, feedback, BYOK/OpenRouter, and a
projection database later. Those are future specs under `shipglows_data/workflow/specs/`, not active V1 behavior.

Current data rule:

- Markdown and repository files are the source of truth.
- A future database is a projection/index/sync layer unless a later reviewed
  spec supersedes this.
- If the app changes project state, the intended write path is to update the
  relevant Markdown/repository file.
- No privileged service-role keys or BYOK secrets belong in Flutter client code.

## Validation

```bash
python3 /home/claude/shipglowz/tools/append_shipglows_event.py --help
flutter test test/data/shipglows_sources/source_path_policy_test.dart test/data/shipglows_sources/source_file_reader_test.dart
flutter analyze
```

## V2 Note

Future auth/sync work must preserve local ledger inputs and enforce explicit
user/project ownership. The provider is not final; Firebase/Firestore and
Firebase Auth are candidates to be reviewed per dedicated spec. FastAPI is kept
as legacy context and is not active in V1.

See `shipglows_data/technical/auth-sync-v2.md`.
