---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_app
created: "2026-04-26"
updated: "2026-04-26"
status: reviewed
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence: []
depends_on: []
supersedes: none
linked_systems: []
next_review: "2026-07-26"
next_step: /sf-ready claude-instructions
---

# CLAUDE.md

## Project Overview

`contentflow_app` is the Flutter product application for ContentFlow, handling authenticated user onboarding, content operations, workspace management, review flows, scheduling, and diagnostics.

Backend and auth dependencies:

- **FastAPI** service (`API_BASE_URL`) for workspace/content/projects data
- **Clerk** for authentication/session validation (`CLERK_PUBLISHABLE_KEY`)
- **Site handoff** URLs from `contentflow_site` and mobile/web launcher (`APP_SITE_URL`, `APP_WEB_URL`)

## Tech Stack

- Flutter (Dart 3.11+)
- Riverpod + GoRouter
- Dio (`shared_preferences` + offline storage for degraded mode)
- Clerk web runtime for auth handoff

## Common Commands

- `./build.sh --serve` (local build + serve)
- `./pm2-web.sh` (build + run production-style web server)
- `./scripts/validate-clerk-runtime.sh` (auth runtime smoke check)

## App Structure

- `lib/main.dart`: app bootstrap + offline sync bridge
- `lib/router.dart`: route definitions and access-guarded redirects
- `lib/data/services/`: API client, offline storage, queue, auth adapters
- `lib/presentation/`: app shell and screen hierarchy
- `lib/core/`: diagnostics, preferences, localization helpers
- `lib/providers/`: Riverpod providers/notifiers
- `specs/`: implementation and migration specs
- `web_auth/`: Clerk auth assets injected into web builds

## State and Error Handling

- Do not hard-fail access to the app when FastAPI is unavailable.
- Keep authenticated users in app/degraded mode with cached reads where possible.
- Queue supported writes locally and replay when backend is reachable.
- Replay should stop for invalid auth states and resume on re-auth.

## Local-First Conventions

- Respect the offline storage schema in queue/cache docs and specs.
- Preserve `tempId` reconciliation patterns for writes that need real backend IDs.
- Keep dependency ordering in replay logic explicit (upstream create before dependent updates).
- Expose clear sync status for supported flows in UI.

## Integration Notes

- Related repos:
  - `contentflow_site` (landing, auth handoff entrypoint, public docs)
  - `contentflow_lab` (AI agents and backend services)
- Prefer consistency with project-wide terminology:
  - **feed**, **onboarding**, **drip**, **workspace**, **angle**, **idea**

## Backend Data Changes (Turso / libSQL)

- Production backend data lives in Turso at `libsql://contentflow-prod2-dianedef.aws-eu-west-1.turso.io`.
- If an app change touches backend API contracts, onboarding, workspace/project data, feedback, jobs, status, offline replay, or any Turso-backed persistence path, always verify whether a SQL migration is required or not.
- Use the **Turso CLI** for schema checks against the real database; do not decide from code reading alone. Example: `turso db shell contentflow-prod2 ".schema"` or targeted `PRAGMA table_info(...)` queries.
- State the migration conclusion explicitly in task notes or the final response, even when no migration is needed.
- **Mandatory before every commit/push**: explicitly decide and state whether a Turso migration is required (`yes/no`), with a short reason.
