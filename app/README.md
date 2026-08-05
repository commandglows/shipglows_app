# ShipGlows Operations Dashboard App

Flutter application for the ShipGlows managed repository-health and agent Cockpit.

## Current MVP Scope

- Cross-project Cockpit with technical, content, SEO, performance, and security health.
- Authenticated server-backed project projection with explicit local-source fallback.
- Project-scoped managed agent conversations, approvals, interruption, and resume.
- Server-owned GitHub App, worktree, persistence, and agent-runtime boundaries.
- Web, Android, and Windows product architecture; Web is the first hosted proof surface.
- Optional operator Workspace surface backed by a short-lived, project-scoped PTY/tmux capability when configured on the runner.
- Legacy ContentFlow code remains in the repo only as migration/reference material.

## Data Sources

The active Cockpit can consume the managed runner projection. The local compatibility reader also supports:

- `/home/claude/shipglows_data/PROJECTS.md`
- `/home/claude/shipglows_data/AUDIT_LOG.md`
- `/home/claude/shipglows_data/TASKS.md`
- `/home/claude/shipglows_data/OPERATIONS_LOG.md`
- `/home/claude/shipglows_data/DEPENDENCY_LOG.md`
- `/home/claude/shipglows/shipglows_data/workflow/specs/*.md`
- Project-local governance docs (`shipglows_data/workflow/AUDIT_LOG.md`, `shipglows_data/workflow/TASKS.md`, `CHANGELOG.md`, `shipglows_data/business/business.md`, `shipglows_data/business/product.md`, `shipglows_data/technical/guidelines.md`, `shipglows_data/technical/architecture.md`) when listed in `PROJECTS.md`

## Security and File Access

- Reads are restricted to allowlisted roots from `source_path_policy.dart`.
- Symlink escapes outside allowed roots are denied.
- Sensitive path segments are redacted in diagnostics.
- File size limits: `2 MB` per file, `20 MB` per refresh.

## Local Reader Boundary

Web builds cannot read arbitrary local files. Hosted Web uses the managed runner projection; unsupported local-source access surfaces an explicit diagnostic rather than a fake fallback.

## Tracker vs Ledger Model

- `shipglows_data/workflow/TASKS.md` and `shipglows_data/workflow/AUDIT_LOG.md` remain human trackers.
- `OPERATIONS_LOG.md` and `DEPENDENCY_LOG.md` are machine-readable append-only ledgers.
- Event writes must go through `/home/claude/shipglowz/tools/append_shipglows_event.py`.

## Run

```bash
cd /home/claude/shipglows_app/app
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

## Managed Runner

The TypeScript runner under `../runner/` now owns authentication, tenant/project authorization, agent-runtime selection, GitHub workspaces, SQLite operational projections, idempotent commands, semantic event streaming, and the separately authorized PTY/tmux gateway. The supervised runner and real PTY/tmux/Codex smoke pass on the managed server; public authenticated proof remains incomplete.

Current data rule:

- Markdown and repository files are the source of truth.
- The runner database is a projection/index/sync layer unless a later reviewed spec supersedes this.
- If the app changes project state, the intended write path is to update the
  relevant Markdown/repository file.
- No privileged service-role keys or BYOK secrets belong in Flutter client code.

## Validation

```bash
python3 /home/claude/shipglowz/tools/append_shipglows_event.py --help
flutter test test/data/shipglows_sources/source_path_policy_test.dart test/data/shipglows_sources/source_file_reader_test.dart
flutter analyze
```

## Current Limits

- No automatic push, merge, deployment, or canonical-branch mutation.
- Interactive PTY/tmux rendering is implemented and the managed runner has one server-owned ShipGlows allowlist. Public use remains unavailable until `runner.shipglows.com` has its HTTPS reverse-proxy route and an authenticated actor/project is provisioned.
- No claim of complete Web/Android/Windows parity until platform proof passes.
- FastAPI, Clerk, Firebase, and the older ContentFlow product remain legacy context unless a current ShipGlows contract explicitly adopts them.

See `shipglows_data/technical/managed-runner-foundation.md` and the managed Cockpit MVP specification.
