---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
draft: false
project: contentflow_app
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
evidence:
  - "README.md"
  - "CLAUDE.md"
  - "lib/main.dart"
  - "lib/router.dart"
  - "lib/providers/providers.dart"
  - "lib/data/services/api_service.dart"
  - "lib/data/services/offline_storage_service.dart"
depends_on: []
supersedes: []
linked_systems:
  - "contentflow_lab FastAPI backend"
  - "ClerkJS auth assets"
next_review: "2026-07-26"
next_step: "/sf-docs update AGENT.md"
---

# AGENT — contentflow_app

## Mission
- Keep this repository as the Flutter product application for ContentFlow and maintain all technical decisions described in this artifact and aligned artifacts (`README.md`, `CLAUDE.md`, `specs/*.md`).
- Ensure all future edits preserve explicit Flutter + FastAPI + Clerk behavior and the offline-sync queue contract.

## Technical mandate for contributors
- Flutter web app is the only runtime client for this repo.
- All durable product data for authenticated features must come from the FastAPI backend behind `API_BASE_URL`.
- Clerk is the only source of session identity for web auth flow.
- Native Flutter auth flows using password SDK entrypoints are intentionally removed from production usage.

## Authoritative stack (inferred)
- Flutter SDK 3.11+.
- State: `flutter_riverpod` + GoRouter.
- HTTP/data transport: `dio` + custom `ApiService`.
- Local store/cache: `shared_preferences`.
- Offline queue/cache/id mapping keys are local, user-scoped.
- Optional localizations via `app_localizations`.

## Required architecture conventions
1. **Single backend path for business data**
   - Read/write operations should route through `ApiService` providers.
   - Avoid introducing direct API HTTP calls from presentation widgets without explicit reason.

2. **Router-driven access contract**
   - Routing changes should preserve `resolveAppRedirect` stage-based behavior in `lib/router.dart`.
   - Stage transitions come from `AppAccessState` and `AuthSession` state in providers.

3. **Offline-first degraded mode**
   - Keep authenticated shell available when FastAPI is unavailable.
   - Use `offline_cache_v1`, `offline_queue_v1`, `offline_id_mappings_v1`.
   - Apply queued mutation + replay semantics for supported flows only.
   - Never reclassify unsupported actions (publish, audio upload, deletes) as offline-capable.

4. **Error and security hygiene**
   - Do not persist sensitive tokens in artifacts.
   - Preserve 401/403 handling (`AuthSession.handleUnauthorized`) and avoid bypassing forced re-auth.
   - Keep `demo` mode behaviors explicit and isolated from authenticated API state.

## Canonical sources and ownership
- If behavior appears to contradict code, update this file first and then `README.md`/`CONTEXT*`.
- For any API/behavior inference, prefer:
  - `README.md`
  - `specs/` (especially `SPEC-offline-sync-v2.md`, `architecture-cible-fastapi-clerk-flutter.md`)
  - concrete Dart sources in `lib/`
  - `_test` coverage.

## Build and validation references
- App bundle: `./build.sh`
- Server-assisted build+serve: `./pm2-web.sh`
- Clerk runtime smoke check: `./scripts/validate-clerk-runtime.sh`
- Vercel paths: `scripts/vercel-install.sh`, `scripts/vercel-build.sh`, `vercel.json`

## Invariant checks before edits
- Auth/session flow remains Clerk-first for web.
- `AppAccessState` stages continue to govern route gates.
- Offline replay remains user-scoped and id-mapping-safe.
- Existing queue metadata and cache keys remain compatible.

## Collaboration/risk guidance
- This document is intentionally `draft` until parity with code is validated.
- Any change to auth boundaries, offline replay policy, or API domain mapping must be reflected here before release.
