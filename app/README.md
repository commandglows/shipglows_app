# ShipFlow Operations Dashboard App

Local-first Flutter desktop app for ShipFlow operational visibility.

## Scope (V1)

- Read-only dashboard for ShipFlow evidence sources.
- Linux desktop target (`flutter run -d linux`).
- No write-back into ShipFlow trackers or ledgers.
- No auth, no cloud sync, no backend service.
- Legacy ContentFlow code remains in the repo only as migration/reference material.

## Source Inputs

The app reads:

- `/home/claude/shipflow_data/PROJECTS.md`
- `/home/claude/shipflow_data/AUDIT_LOG.md`
- `/home/claude/shipflow_data/TASKS.md`
- `/home/claude/shipflow_data/OPERATIONS_LOG.md`
- `/home/claude/shipflow_data/DEPENDENCY_LOG.md`
- `/home/claude/shipflow/shipflow_data/workflow/specs/*.md`
- Project-local governance docs (`shipflow_data/workflow/AUDIT_LOG.md`, `shipflow_data/workflow/TASKS.md`, `CHANGELOG.md`, `shipflow_data/business/business.md`, `shipflow_data/business/product.md`, `shipflow_data/technical/guidelines.md`, `shipflow_data/technical/architecture.md`) when listed in `PROJECTS.md`

## Security and File Access

- Reads are restricted to allowlisted roots from `source_path_policy.dart`.
- Symlink escapes outside allowed roots are denied.
- Sensitive path segments are redacted in diagnostics.
- File size limits: `2 MB` per file, `20 MB` per refresh.

## Unsupported Target Behavior

Web builds are unsupported for direct local file reads. The app surfaces an explicit `unsupported_source` diagnostic instead of attempting a fake fallback.

## Tracker vs Ledger Model

- `shipflow_data/workflow/TASKS.md` and `shipflow_data/workflow/AUDIT_LOG.md` remain human trackers.
- `OPERATIONS_LOG.md` and `DEPENDENCY_LOG.md` are machine-readable append-only ledgers.
- Event writes must go through `/home/claude/shipflow/tools/append_shipflow_event.py`.

## Run

```bash
cd /home/claude/shipflow_app
flutter pub get
flutter run -d linux
```

## Runtime Targets

The default runtime is ShipFlow:

```bash
flutter run -d linux
```

The repository still exposes the old ContentFlow runtime for migration audit:

```bash
flutter run -d linux --dart-define=APP_TARGET=legacy
flutter run -d linux --dart-define=APP_TARGET=contentflow
```

Do not use the legacy target as the product direction. Its modules are classified
in `shipflow_data/technical/legacy-contentflow-inventory.md`.

## Future Auth, Sync, And Backend Work

ShipFlow will likely need multi-user auth, feedback, BYOK/OpenRouter, and a
projection database later. Those are future specs under `shipflow_data/workflow/specs/`, not active V1 behavior.

Current data rule:

- Markdown and repository files are the source of truth.
- A future database is a projection/index/sync layer unless a later reviewed
  spec supersedes this.
- If the app changes project state, the intended write path is to update the
  relevant Markdown/repository file.
- No privileged service-role keys or BYOK secrets belong in Flutter client code.

## Validation

```bash
python3 /home/claude/shipflow/tools/append_shipflow_event.py --help
flutter test test/data/shipflow_sources/source_path_policy_test.dart test/data/shipflow_sources/source_file_reader_test.dart
flutter analyze
```

## V2 Note

Future auth/sync work must preserve local ledger inputs and enforce explicit
user/project ownership. The provider is not final; Firebase/Firestore and
Firebase Auth are candidates, while FastAPI may still be useful for local
runner/terminal/agent orchestration.

See `shipflow_data/technical/auth-sync-v2.md`.
