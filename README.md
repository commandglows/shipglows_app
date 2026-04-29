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

## Vercel Deployment

The web build can run in open access mode without Clerk. In Vercel, set these
project environment variables before redeploying:

```bash
API_BASE_URL=https://api.winflowz.com
APP_SITE_URL=https://contentflow.winflowz.com
APP_WEB_URL=https://app.contentflow.winflowz.com
OPEN_ACCESS=true
```

`OPEN_ACCESS=true` lets the app start without auth. If `OPEN_ACCESS` is omitted,
the Vercel build also enables open access automatically when
`CLERK_PUBLISHABLE_KEY` is missing.

To re-enable Clerk auth flows, add:

```bash
CLERK_PUBLISHABLE_KEY=pk_live_xxx
```

The `/sign-in`, `/sign-up`, and `/sso-callback` routes are still generated in
open access builds, but they remain disabled until a Clerk publishable key is
configured.

## Validation

```bash
python3 /home/claude/shipflow/tools/append_shipflow_event.py --help
flutter test test/data/shipflow_sources/source_path_policy_test.dart test/data/shipflow_sources/source_file_reader_test.dart
flutter analyze
```

## V2 Note

Future auth/sync work must preserve local ledger inputs and enforce explicit user/project ownership with RLS. Never place Supabase service-role keys in Flutter/client code.

See `docs/auth-sync-v2.md`.
