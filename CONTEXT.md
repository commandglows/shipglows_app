---
artifact: technical_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
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
  - "specs/architecture-cible-fastapi-clerk-flutter.md"
  - "specs/SPEC-offline-sync-v2.md"
depends_on:
  - artifact: "README.md"
    artifact_version: "0.1.0"
    required_status: "reviewed"
  - artifact: "CLAUDE.md"
    artifact_version: "0.1.0"
    required_status: "reviewed"
supersedes: []
linked_systems:
  - "contentflow_lab FastAPI"
  - "Clerk"
next_review: "2026-07-26"
next_step: "/sf-docs update CONTEXT.md"
---

# CONTEXT.md — contentflow_app

## Product technical context
`contentflow_app` is the primary Flutter application for ContentFlow. It hosts:
- Entry/auth gate (`/entry`, `/auth`).
- Authenticated shell and feature screens (`/feed`, `/projects`, `/drip`, `/settings`, etc.).
- Feature state orchestration via Riverpod providers and a FastAPI-backed `ApiService`.

## Source-of-truth stack
- **UI framework:** Flutter 3.11+
- **State layer:** Flutter Riverpod (single `providers.dart` root)
- **Routing:** GoRouter with refreshable auth redirect gate
- **Backend transport:** Dio client in `lib/data/services/api_service.dart`
- **Identity/auth:** Clerk web bridge (`contentflowClerkBridge`) and tokens forwarded to FastAPI
- **Persistence:** SharedPreferences for prefs + offline cache/queue/id-mapping stores
- **Build chain:** Flutter web -> injected Clerk keys/runtime metadata via `build.sh` and `scripts/*`

## Runtime domains
- **Authentication/session domain:**
  - Session restoration, token fetch, sign-out, and unauthorized response handling are centralized in provider notifiers.
- **Bootstrap/access domain:**
  - `AppAccessNotifier` computes stages (`restoringSession`, `signedOut`, `demo`, `apiUnavailable`, `bootstrapFailed`, `needsOnboarding`, `ready`).
- **Feature domains:**
  - Projects, workspace/settings, creator profile, personas, content pipeline, integrations, analytics-like views, feedback.
- **Offline domain:**
  - Read-through cache + mutation queue + temp-ID reconciliation via offline stores and queue controller.

## Build/runtime environment matrix
- Required (or optional) defines and env:
  - Required for release flow: `API_BASE_URL`, `CLERK_PUBLISHABLE_KEY`.
  - App/marketing links: `APP_SITE_URL`, `APP_WEB_URL`.
  - Optional for feedback/admin logic: `FEEDBACK_ADMIN_EMAILS`.
  - Build metadata (defined in scripts and README): `BUILD_COMMIT_SHA`, `BUILD_ENVIRONMENT`, `BUILD_TIMESTAMP`.
- `server.js` serves SPA fallback plus `/sign-in|/sign-up|/sso-callback` directories.
- Vercel rewrites preserve auth and SPA paths; build scripts inject Dart defines and Clerk runtime assets.

## Architecture flow (inferred)
1. App bootstrap (`main`) wires diagnostics + preference providers.
2. Router reads `appAccessStateProvider` and redirects based on auth/session stage.
3. Feature screens consume providers for typed async data.
4. Mutating actions go through `ApiService` (`_enqueueOfflineAction` or direct call depending connectivity/offline policy).
5. Offline controller schedules replay on startup, resume, login and manual trigger.
6. Diagnostics and diagnostics reports support incident copy/paste.

## Offline sync + queue context
- Store keys:
  - `offline_cache_v1`
  - `offline_queue_v1`
  - `offline_id_mappings_v1`
- Behavior:
  - Cache is user-scoped and stale-state visible in UI when fallback is active.
  - Queue actions are deduplicated and rewritten with temp-ID mappings on successful create responses.
  - Replay is best-effort with status transitions (`pending`, `retrying`, `blockedDependency`, `pausedAuth`, `failed`).

## External integration boundaries
- **ClerkJS routes** are generated in `web_auth/*` and injected into build output by scripts.
- **FastAPI** remains backend contract boundary; mobile/desktop-specific auth branches are not currently enabled by production code.
- **Feedback admin** uses backend endpoints with optional local draft/submission cache.

## Testing references
- `test/core` validates providers, retry behavior, queue mapping, project onboarding validation, AI guards.
- `test/presentation` validates selected UI/setting behavior and picker controller interactions.
- `flutter test` is the project-wide check for behavioral stability.
