---
artifact: architecture_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_app
created: "2026-04-26"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: architecture
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
  - artifact: "specs/architecture-cible-fastapi-clerk-flutter.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/SPEC-offline-sync-v2.md"
    artifact_version: "0.1.0"
    required_status: "draft"
supersedes: []
linked_systems:
  - "contentflow_lab FastAPI services"
  - "contentflow_site marketing surface"
  - "ClerkJS auth"
external_dependencies:
  - "Flutter SDK 3.11+"
  - "GoRouter"
  - "flutter_riverpod"
  - "Dio"
  - "contentflow FastAPI backend"
invariants:
  - "App shell remains available in degraded mode when API is unavailable."
  - "Auth/session stage in providers remains authoritative for route decisions."
  - "Offline replay and temp-id reconciliation preserve idempotence and avoid duplicate writes."
next_review: "2026-07-26"
next_step: "/sf-docs update ARCHITECTURE.md"
---

# ARCHITECTURE.md — contentflow_app (Flutter + FastAPI + Clerk)

## 1) High-level architecture

```text
[Flutter UI + GoRouter]
        |
        v
[Riverpod Providers: session/access/domain state]
        |
        v
[ApiService + Offline Middleware]
        |
        +--> [FastAPI /api/*] <--> [DB/Turso via backend]
        |
        +--> [Clerk (session restore + token + user identity)]
```

The app is structured as a **single Flutter client boundary** with backend data operations delegated to FastAPI, while Clerk remains the session authority. Offline support uses a local cache/queue layer and user-scoped local persistence.

## 2) Runtime layers

### 2.1 Presentation layer (`lib/presentation`)
- Route shell and protected layout in `screens/app_shell.dart`.
- Route graph in `lib/router.dart`.
- Screen modules for workflows: feed/review, onboarding, projects, settings, drip, content tools, research/seo/analytics, uptime.

### 2.2 State layer (`lib/providers/providers.dart`)
- Single-provider root controls:
  - auth/session state
  - app access stage
  - project selection
  - user settings
  - feature caches/lists
  - offline queue controller and sync status
- Access state drives router redirects and degraded-mode behavior.

### 2.3 Data layer (`lib/data/services`, `lib/data/models`)
- `ApiService` owns HTTP transport, endpoint mapping, demo fallback and caching/replay hooks.
- `offline_storage_service.dart` stores:
  - `offline_cache_v1`
  - `offline_queue_v1`
  - `offline_id_mappings_v1`
- Clerk auth service implementations are split by target environment (web bridge + stub).

### 2.4 Core layer (`lib/core`)
- `AppConfig` holds compile-time env defines.
- `AppDiagnostics` centralizes structured diagnostics and report generation.
- Shared preference provider + localization/theme/language helpers.

## 3) Auth architecture: Flutter + Clerk + FastAPI

1. Flutter app restores session from Clerk bridge on startup (when configured).
2. Auth state (`AuthSession`) decides whether session is demo, signed out, or authenticated.
3. Authenticated state triggers backend access resolve in `AppAccessNotifier`:
   - `GET /api/health`-like check
   - `GET /api/bootstrap`
4. Route redirection enforces:
   - unauthenticated users to `/entry`
   - signed-in users without workspace to `/onboarding`
   - valid users to `/feed`
5. API calls carry `Authorization: Bearer <token>` with backend-validated token handling.

Notes:
- Native password auth methods are present in type definitions but are intentionally not production enabled (web path is canonical).
- `CLERK_PUBLISHABLE_KEY` must be present for normal auth-enabled builds.

## 4) Offline architecture and queue model

### 4.1 Stores
- `offline_cache_v1`: read-through response cache per scope.
- `offline_queue_v1`: queued mutations while offline or unrecoverable failures.
- `offline_id_mappings_v1`: temporary ID to real backend ID rewriting map.

### 4.2 Offline flow
- Writes for supported flows are enqueued as `QueuedOfflineAction`.
- Replay is triggered automatically and manually (`/uptime`).
- Replay applies temp-ID rewrites before dispatch.
- Queue statuses are surfaced to UI:
  - `pending`
  - `retrying`
  - `blockedDependency`
  - `pausedAuth`
  - `failed`

### 4.3 Explicitly supported offline creates/updates
- projects create/update
- settings update
- creator profile save
- personas create/update
- affiliations create/update
- content create from angle fallback, updates, scheduling transitions
- drip plan create/update/activate/pause/resume/cancel

### 4.4 Explicitly blocked while offline
- publish operations
- binary/audio uploads
- destructive deletes
- complex server-first jobs (queue/execute/tick/import-like operations)

## 5) Build/deployment topology

### 5.1 Local/web artifacts
- `build.sh`: Flutter release build + `install-web-auth.sh`.
- `pm2-web.sh`: build + immediate serve with `server.js`.
- `server.js`: SPA fallback, directory index handling for `/sign-in|/sign-up|/sso-callback`.
- `scripts/validate-clerk-runtime.sh`: static validation flow.

### 5.2 Vercel
- `scripts/vercel-install.sh` installs Flutter.
- `scripts/vercel-build.sh` sets Dart defines and injects Clerk runtime assets.
- `vercel.json` rewrites auth routes and SPA fallback.

## 6) Test and observation
- Behavioral tests are present in `test/` (core + presentation) and should remain aligned with this architecture.
- `AppDiagnostics` + offline diagnostics context are expected user-facing debugging surfaces.

## 7) Risks and constraints
- Offline behavior is intentionally partial; unsupported flows must fail safely, not silently.
- Auth/session transitions depend on Clerk configuration and backend availability.
- Changing queue semantics has high risk and requires synchronized spec + docs + provider updates.
