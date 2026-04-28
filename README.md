# ShipFlow Operations Dashboard App

Local-first Flutter desktop app for ShipFlow operational visibility.

## Scope (V1)

- Read-only dashboard for ShipFlow evidence sources.
- Linux desktop target (`flutter run -d linux`).
- No write-back into ShipFlow trackers or ledgers.
- No auth, no cloud sync, no backend service.

## Source Inputs

The app reads:

- `/home/claude/shipflow_data/PROJECTS.md`
- `/home/claude/shipflow_data/AUDIT_LOG.md`
- `/home/claude/shipflow_data/TASKS.md`
- `/home/claude/shipflow_data/OPERATIONS_LOG.md`
- `/home/claude/shipflow_data/DEPENDENCY_LOG.md`
- `/home/claude/shipflow/specs/*.md`
- Project-local docs (`AUDIT_LOG.md`, `TASKS.md`, `CHANGELOG.md`, `BUSINESS.md`, `PRODUCT.md`, `GUIDELINES.md`, `ARCHITECTURE.md`) when listed in `PROJECTS.md`

## Security and File Access

- Reads are restricted to allowlisted roots from `source_path_policy.dart`.
- Symlink escapes outside allowed roots are denied.
- Sensitive path segments are redacted in diagnostics.
- File size limits: `2 MB` per file, `20 MB` per refresh.

## Unsupported Target Behavior

Web builds are unsupported for direct local file reads. The app surfaces an explicit `unsupported_source` diagnostic instead of attempting a fake fallback.

## Tracker vs Ledger Model

- `TASKS.md` and `AUDIT_LOG.md` remain human trackers.
- `OPERATIONS_LOG.md` and `DEPENDENCY_LOG.md` are machine-readable append-only ledgers.
- Event writes must go through `/home/claude/shipflow/tools/append_shipflow_event.py`.

## Run

```bash
cd /home/claude/shipflow_app
flutter pub get
flutter run -d linux
```

## Validation

```bash
python3 /home/claude/shipflow/tools/append_shipflow_event.py --help
flutter test test/data/shipflow_sources/source_path_policy_test.dart test/data/shipflow_sources/source_file_reader_test.dart
flutter analyze
```

## V2 Note

Future auth/sync work must preserve local ledger inputs and enforce explicit user/project ownership with RLS. Never place Supabase service-role keys in Flutter/client code.

See `docs/auth-sync-v2.md`.
