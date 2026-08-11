---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-10"
updated: "2026-08-11"
status: superseded
source_skill: 300-sg-docs
scope: "legacy-file-migration-tracker"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "shipglows_data/technical/legacy-contentflow-inventory.md"
  - "shipglows_data/technical/runtime-boundary.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/editorial/content-map.md"
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md"
  - "shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md"
  - "lib/"
  - "web_auth/"
  - "shipglows_data/workflow/specs/"
depends_on:
  - "shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md@0.1.0"
  - "shipglows_data/technical/legacy-contentflow-inventory.md@0.1.0"
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md@0.4.0"
supersedes: []
superseded_by: "shipglows_data/technical/runtime-boundary.md"
evidence:
  - "User request 2026-05-10: create explicit tracking for old files to keep, adapt, move to legacy, or delete later."
  - "Legacy inventory classifies areas but did not track target path, migration status, decision source, and validation per row."
next_review: "2026-06-10"
next_step: "Use only for a destructive dormant-module cleanup; runtime-boundary.md owns current behavior."
---

# Historical Dormant Module Cleanup Tracker

## Purpose

This historical tracker is the operational ledger for dormant modules during cleanup. It does not describe a second application or compatibility runtime: `lib/main.dart` only starts ShipGlows.

This document is not a deletion approval. Any move, archive, or delete action must cite a tracker row and still pass the owner spec or explicit user-decision gate named by that row.

## Status Taxonomy

| Status | Meaning | Move/delete allowed now |
| --- | --- | --- |
| `active-keep` | Active ShipGlows surface. | No |
| `keep-temporary` | Needed temporarily for runtime or inspection. | No |
| `adapt-candidate` | Could become active ShipGlows code after a ready owner spec. | No |
| `keep-concept` | Product/technical idea worth preserving, implementation may be replaced. | No |
| `park` | Preserve as parked product/reference material. | No |
| `reference-only` | Historical evidence or implementation reference, not active direction. | No |
| `move-to-legacy` | Future move candidate after import/test impact is proven. | Not in this chantier |
| `archive-later` | Future archive candidate after explicit cleanup scope. | Not in this chantier |
| `delete-later` | Future deletion candidate after no active/reference value remains. | Not in this chantier |
| `already-removed` | Path is gone; keep row as audit evidence. | Already done |
| `not-found` | Expected path not found during validation. | No, investigate |
| `superseded-by` | Replaced by a named ready spec or active doc. | No, until archive/delete gate |
| `blocked-needs-spec` | Security/product/data risk requires a dedicated ready spec. | No |
| `needs-decision` | User or owner decision is missing. | No |

## Target Path Rules

- `stay-current` means no move is planned now.
- `future ShipGlows path by owner spec` means the target path is chosen only by a later ready feature spec.
- `future archive/dormant-modules/...` is the default future target for dormant code if a cleanup spec approves movement.
- `future shipglows_data/workflow/archives/dormant-modules/...` is the default future target for historical specs if a cleanup spec approves movement.
- `future shipglows_data/workflow/archives/dormant-guidance/...` is the default future target for historical guidance excerpts if a cleanup spec approves movement.
- Target directories are not created by this tracker.

## Migration Table Schema

Each row must answer:

| Column | Required meaning |
| --- | --- |
| Current path | Current path or grouped path pattern. |
| Current role | What the path does today. |
| Decision | ShipGlows migration decision. |
| Migration status | One taxonomy value from this document. |
| Target path | Current location, future target, deletion condition, or blocking state. |
| Decision source | Spec, doc, or user decision that owns the row. |
| Risk | `low`, `medium`, or `high`. |
| Validation | Command or review check before any future mutation. |
| Next action | Concrete next step or blocking question. |

## Code And Runtime Rows

| Current path | Current role | Decision | Migration status | Target path | Decision source | Risk | Validation | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/shipglows/` | Active ShipGlows dashboard runtime | keep | `active-keep` | `stay-current` | `shipglows_data/editorial/content-map.md`; `runtime-boundary.md` | low | `rg -n "ShipGlowsApp|shipglows" lib/shipglows lib/main.dart` | Protect from legacy cleanup |
| `lib/data/shipglows_sources/` | Active Markdown readers/parsers | keep | `active-keep` | `stay-current` | `markdown-source-of-truth.md` | medium | `flutter test test/data/shipglows_sources` | Protect source allowlists and diagnostics |
| `lib/domain/project_health/` | Active project health logic | keep | `active-keep` | `stay-current` | `markdown-source-of-truth.md`; `shipglows_data/editorial/content-map.md` | medium | `flutter test test/domain/project_health` | Protect active domain layer |
| `lib/main.dart` | Single ShipGlows entrypoint | keep | `active-keep` | `stay-current` | `runtime-boundary.md` | low | `! rg -n "APP_TARGET|LegacyShipGlowsApp" lib/main.dart` | Keep one product runtime |
| `lib/presentation/theme/` | Legacy/shared UI theme | adapt candidate | `adapt-candidate` | future ShipGlows path by owner spec or `future legacy/contentflow/presentation/theme/` | `legacy-contentflow-inventory.md` | low | `rg -n "presentation/theme|ThemeData|AppTheme" lib test` | Review during design-token/spec work |
| `lib/presentation/widgets/app_error_view.dart` | Generic error primitive | adapt candidate | `adapt-candidate` | future ShipGlows widget path by owner spec or `future legacy/contentflow/presentation/widgets/` | `legacy-contentflow-inventory.md` | low | `rg -n "AppErrorView" lib test` | Move only with import impact proven |
| `lib/presentation/widgets/skeleton_loader.dart` | Generic loading primitive | adapt candidate | `adapt-candidate` | future ShipGlows widget path by owner spec or `future legacy/contentflow/presentation/widgets/` | `legacy-contentflow-inventory.md` | low | `rg -n "SkeletonLoader|skeleton_loader" lib test` | Move only with import impact proven |
| `lib/core/app_diagnostics.dart` | Diagnostics utility | adapt candidate | `adapt-candidate` | future ShipGlows diagnostics path by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "AppDiagnostics|app_diagnostics" lib test` | Check active dependencies before rename |
| `lib/core/app_language.dart` | Locale setting | needs decision | `needs-decision` | `stay-current` until i18n direction is decided | `legacy-contentflow-inventory.md` | low | `rg -n "AppLanguage|app_language" lib test` | Decide device/user/project language model |
| `lib/core/app_theme_preference.dart` | Theme preference | adapt candidate | `adapt-candidate` | future ShipGlows settings path by owner spec | `legacy-contentflow-inventory.md` | low | `rg -n "AppThemePreference|app_theme_preference" lib test` | Reuse only with settings spec |
| `lib/core/openrouter_guard.dart` | BYOK/OpenRouter guard | keep concept | `blocked-needs-spec` | `stay-current` until BYOK security spec | `legacy-contentflow-inventory.md`; `shipglows-legacy-reuse-roadmap.md` | high | `rg -n "OpenRouter|openrouter|BYOK" lib test shipglows_data/technical shipglows_data/workflow/specs` | No activation or deletion before BYOK spec |
| `lib/data/models/ai_runtime.dart` | AI runtime/model mode | keep concept | `blocked-needs-spec` | `stay-current` until BYOK/AI runtime spec | `legacy-contentflow-inventory.md` | medium | `rg -n "AiRuntime|ai_runtime" lib test` | Preserve as concept |
| `lib/data/models/openrouter_credential.dart` | BYOK credential model | keep concept | `blocked-needs-spec` | `stay-current` until BYOK security spec | `legacy-contentflow-inventory.md` | high | `rg -n "OpenRouterCredential|openrouter_credential" lib test` | Do not expand client secret handling |
| `lib/data/models/auth_session.dart` | Auth session model | keep concept | `blocked-needs-spec` | `stay-current` until auth provider spec | `legacy-contentflow-inventory.md` | high | `rg -n "AuthSession|auth_session" lib test` | Redesign with future auth spec |
| `lib/data/models/app_settings.dart` | Mixed app settings | split candidate | `adapt-candidate` | future ShipGlows settings model by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "AppSettings|app_settings" lib test` | Split only with settings spec |
| `lib/data/models/project.dart` | Legacy project model | adapt candidate | `adapt-candidate` | future ShipGlows project model by owner spec | `legacy-contentflow-inventory.md`; foundational project shipglows_data/workflow/specs | medium | `rg -n "class Project|data/models/project" lib test` | Compare against GitHub repo project model |
| `lib/data/models/feedback_entry.dart` | Feedback data shape | keep concept | `blocked-needs-spec` | `stay-current` until feedback spec | `legacy-contentflow-inventory.md` | medium | `rg -n "FeedbackEntry|feedback_entry" lib test` | Reuse only through text feedback spec |
| `lib/data/services/api_service.dart` | Legacy FastAPI facade | park | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/data/services/api_service.dart` only after cleanup spec | `legacy-contentflow-inventory.md` | high | `rg -n "ApiService|FastAPI|api_service" lib test shipglows_data/technical shipglows_data/workflow/specs` | Do not adopt as backend default |
| `lib/data/services/feedback_service.dart` | Legacy feedback service | keep concept | `blocked-needs-spec` | `stay-current` until feedback spec | `legacy-contentflow-inventory.md` | medium | `rg -n "FeedbackService|feedback_service" lib test` | Redesign before reuse |
| `lib/data/services/feedback_local_store.dart` | Legacy feedback local cache/store | keep concept | `blocked-needs-spec` | `stay-current`; align with future feedback spec | `legacy-contentflow-inventory.md` | medium | `rg -n "feedback_local_store|LocalFeedback|feedback store" lib test` | Decide if this cache can be reused in ShipGlows feedback phase |
| `lib/data/services/clerk_auth_service.dart` | Legacy Clerk auth export shim | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/data/services/` only after auth decision | `legacy-contentflow-inventory.md` | high | `rg -n "clerk_auth_service.dart|export 'clerk_auth_service_stub.dart'|clerk_auth_service_web.dart" lib web_auth` | Archive only after auth provider decision |
| `lib/data/services/clerk_auth_service_stub.dart` | Legacy Clerk auth stub (non-web / placeholder) | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/data/services/` only after auth decision | `legacy-contentflow-inventory.md` | high | `rg -n "clerk_auth_service_stub|UnsupportedError|NotImplementedError" lib/data/services` | Archive only after auth provider decision |
| `lib/data/services/clerk_auth_service_web.dart` | Legacy Clerk auth web integration | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/data/services/` only after auth decision | `legacy-contentflow-inventory.md` | high | `rg -n "clerk_auth_service_web|clerk-runtime|sso-callback" lib web_auth` | Archive only after auth provider decision |
| `lib/data/services/offline_storage_service.dart` | Legacy offline/cache | adapt candidate | `adapt-candidate` | future projection/cache path by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "OfflineStorage|offline_storage" lib test` | Review after projection/sync spec |
| `lib/data/services/notification_service.dart` | Legacy notification scaffold | park | `park` | `stay-current`; future `legacy/contentflow/data/services/notification_service.dart` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "NotificationService|notification_service" lib test` | Keep parked until notification need exists |
| `lib/providers/providers.dart` | Dormant provider graph | park | `blocked-needs-spec` | `stay-current`; future archive path only after a cleanup spec | `legacy-contentflow-inventory.md`; `runtime-boundary.md` | high | `rg -n "providers.dart|ProviderScope" lib test` | Split only when a current spec selects a module |
| `lib/router.dart` | Dormant route graph | archive later | `archive-later` | `stay-current`; future archive path after cleanup proof | `runtime-boundary.md` | high | `rg -n "GoRoute" lib/router.dart` | Remove/archive only after import proof |
| `lib/presentation/screens/auth/` | Legacy auth UI | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/presentation/screens/auth/` after auth decision | `legacy-contentflow-inventory.md`; `shipglows_legacy-reuse-roadmap.md` | high | `rg -n "Auth|Clerk|auth" lib/presentation/screens/auth lib test` | Do not choose Clerk by default |
| `lib/presentation/screens/projects/` | Legacy project UI | adapt candidate | `adapt-candidate` | future ShipGlows project UI by owner spec | `legacy-contentflow-inventory.md`; project onboarding specs | medium | `rg -n "ProjectsScreen|projects_screen|project" lib/presentation/screens/projects lib test` | Compare with GitHub project onboarding |
| `lib/presentation/screens/onboarding/` | Legacy onboarding | adapt candidate | `adapt-candidate` | future ShipGlows onboarding path by owner spec | `legacy-contentflow-inventory.md`; project onboarding specs | medium | `rg -n "onboarding" lib/presentation/screens/onboarding lib test` | Reuse only after onboarding spec |
| `lib/presentation/screens/settings/` | Legacy settings/integrations | adapt candidate | `adapt-candidate` | future ShipGlows settings path by owner spec | `legacy-contentflow-inventory.md`; `shipglows_legacy-reuse-roadmap.md` | medium | `rg -n "settings|OpenRouter|integrations" lib/presentation/screens/settings lib test` | Review for BYOK/source settings |
| `lib/presentation/screens/feedback/` | Legacy feedback UI | keep concept | `blocked-needs-spec` | `stay-current`; future ShipGlows feedback concept path by owner spec | `legacy-contentflow-inventory.md`; `shipglows_legacy-reuse-roadmap.md` | medium | `rg -n "feedback" lib/presentation/screens/feedback lib test` | Future text feedback spec decides reuse |
| `lib/presentation/screens/drip/` | Legacy pipeline UI | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/drip/` if cleanup spec approves | `legacy-contentflow-inventory.md`; user direction | medium | `rg -n "drip" lib/presentation/screens/drip lib test` | Do not delete; pipeline remains parked |
| `lib/presentation/screens/feed/` | Legacy content workflow screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/feed/` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "FeedScreen|feed" lib/presentation/screens/feed lib test` | Revisit only if content workflow returns |
| `lib/presentation/screens/editor/` | Legacy editor screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/editor/` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "EditorScreen|editor" lib/presentation/screens/editor lib test` | Revisit only if content workflow returns |
| `lib/presentation/screens/history/` | Legacy history screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/history/` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "HistoryScreen|history" lib/presentation/screens/history lib test` | Revisit only if content workflow returns |
| `lib/presentation/screens/calendar/` | Legacy calendar screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/calendar/` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "CalendarScreen|calendar" lib/presentation/screens/calendar lib test` | Revisit only if content workflow returns |
| `lib/presentation/screens/angles/` | Legacy content ideas screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/angles/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "angles" lib/presentation/screens/angles lib test` | Treat as product idea archive |
| `lib/presentation/screens/personas/` | Legacy personas screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/personas/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "personas|Persona" lib/presentation/screens/personas lib test` | Treat as product idea archive |
| `lib/presentation/screens/ritual/` | Legacy ritual screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/ritual/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "ritual" lib/presentation/screens/ritual lib test` | Treat as product idea archive |
| `lib/presentation/screens/seo/` | Legacy SEO screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/seo/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "SEO|seo" lib/presentation/screens/seo lib test` | Treat as product idea archive |
| `lib/presentation/screens/newsletter/` | Legacy newsletter screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/newsletter/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "newsletter" lib/presentation/screens/newsletter lib test` | Treat as product idea archive |
| `lib/presentation/screens/research/` | Legacy research screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/research/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "research" lib/presentation/screens/research lib test` | Treat as product idea archive |
| `lib/presentation/screens/reels/` | Legacy reels screen | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/reels/` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "reels" lib/presentation/screens/reels lib test` | Treat as product idea archive |
| `lib/presentation/screens/activity/` | Legacy operational activity view | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md`; operations backlog hypothesis | medium | `rg -n "activity|Activity" lib/presentation/screens/activity lib test` | Decide if useful for ShipGlows operations |
| `lib/presentation/screens/runs/` | Legacy operational runs view | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md`; operations backlog hypothesis | medium | `rg -n "RunsScreen|run" lib/presentation/screens/runs lib test` | Decide if useful for ShipGlows operations |
| `lib/presentation/screens/analytics/` | Legacy analytics view | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md`; operations backlog hypothesis | medium | `rg -n "analytics" lib/presentation/screens/analytics lib test` | Decide if useful for ShipGlows operations |
| `lib/presentation/screens/performance/` | Legacy performance view | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md`; operations backlog hypothesis | medium | `rg -n "performance" lib/presentation/screens/performance lib test` | Decide if useful for ShipGlows operations |
| `lib/presentation/screens/uptime/` | Legacy uptime view | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md`; operations backlog hypothesis | medium | `rg -n "uptime" lib/presentation/screens/uptime lib test` | Decide if useful for ShipGlows operations |
| `lib/presentation/screens/work_domains/` | Legacy domain/workspaces view | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md`; operations backlog hypothesis | medium | `rg -n "work_domains" lib/presentation/screens/work_domains lib test` | Decide if useful for ShipGlows operations |
| `web_auth/` | Legacy Clerk web auth pages | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/web_auth/` after auth provider decision | `legacy-contentflow-inventory.md` | high | `rg -n "CLERK|sign-in|sso-callback|web_auth" web_auth scripts README.md shipglows_data/technical shipglows_data/workflow/specs` | Archive only after auth provider is chosen |
| `README.md`, `CLAUDE.md`, `AGENT.md`, `shipglows_data/workflow/TASKS.md` legacy sections | Mixed product guidance | rewrite/preserve archive decisions | `needs-decision` | `stay-current`; future excerpts under `shipglows_data/legacy/contentflow/` only after docs cleanup spec | `legacy-contentflow-inventory.md` | high | `rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglows_data/workflow/TASKS.md` | Keep ShipGlows active, preserve useful legacy decisions |

## Legacy Spec Rows

| Current path | Current role | Decision | Migration status | Target path | Decision source | Risk | Validation | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md` | Active ShipGlows migration/fusion chantier | active | `active-keep` | `stay-current` | self; `legacy-contentflow-inventory.md` | high | `rg -n "ShipGlows Legacy ContentFlow Fusion|Current Chantier Flow" shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md` | Keep as active parent chantier |
| `shipglows_data/workflow/archives/contentflow-specs/SPEC-offline-sync-v2.md` | ContentFlow offline/sync reference | archived reference | `archived` | `shipglows_data/workflow/archives/contentflow-specs/SPEC-offline-sync-v2.md` | `legacy-contentflow-inventory.md` | medium | `rg -n "offline|sync" shipglows_data/workflow/archives/contentflow-specs/SPEC-offline-sync-v2.md` | Preserve concepts only through a current spec |
| `shipglows_data/workflow/archives/contentflow-specs/architecture-cible-fastapi-clerk-flutter.md` | ContentFlow FastAPI/Clerk architecture | archived reference | `archived` | `shipglows_data/workflow/archives/contentflow-specs/architecture-cible-fastapi-clerk-flutter.md` | `legacy-contentflow-inventory.md` | high | `rg -n "FastAPI|Clerk|Flutter" shipglows_data/workflow/archives/contentflow-specs/architecture-cible-fastapi-clerk-flutter.md` | Not ShipGlows architecture |
| `shipglows_data/workflow/archives/contentflow-specs/feedback-admin-v1-contentflow.md` | ContentFlow feedback admin idea | archived concept | `archived` | `shipglows_data/workflow/archives/contentflow-specs/feedback-admin-v1-contentflow.md` | `legacy-contentflow-inventory.md` | medium | `rg -n "feedback|admin" shipglows_data/workflow/archives/contentflow-specs/feedback-admin-v1-contentflow.md` | Mine only through a current feedback spec |
| `shipglows_data/workflow/archives/contentflow-specs/feedback-backend-contract-fastapi.md` | FastAPI feedback backend contract | archived reference | `archived` | `shipglows_data/workflow/archives/contentflow-specs/feedback-backend-contract-fastapi.md` | `legacy-contentflow-inventory.md` | high | `rg -n "FastAPI|feedback|backend" shipglows_data/workflow/archives/contentflow-specs/feedback-backend-contract-fastapi.md` | Do not adopt without a current spec |
| `shipglows_data/workflow/archives/contentflow-specs/SPEC-content-pipeline-unification.md` | ContentFlow pipeline spec | archived parked | `archived` | `shipglows_data/workflow/archives/contentflow-specs/SPEC-content-pipeline-unification.md` | `legacy-contentflow-inventory.md` | medium | `rg -n "pipeline|content" shipglows_data/workflow/archives/contentflow-specs/SPEC-content-pipeline-unification.md` | Historical pipeline reference |
| `shipglows_data/workflow/archives/contentflow-specs/SPEC-project-flows-selection-onboarding-archive.md` | ContentFlow project flow reference | archived adapt candidate | `archived` | `shipglows_data/workflow/archives/contentflow-specs/SPEC-project-flows-selection-onboarding-archive.md` | `legacy-contentflow-inventory.md` | medium | `rg -n "project|onboarding|archive" shipglows_data/workflow/archives/contentflow-specs/SPEC-project-flows-selection-onboarding-archive.md` | Current ShipGlows onboarding contracts win |
| `shipglows_data/workflow/archives/contentflow-specs/spec-no-ui-jump-on-resume.md` | UX reliability reference | archived adapt candidate | `archived` | `shipglows_data/workflow/archives/contentflow-specs/spec-no-ui-jump-on-resume.md` | `legacy-contentflow-inventory.md` | medium | `rg -n "resume|jump|route" shipglows_data/workflow/archives/contentflow-specs/spec-no-ui-jump-on-resume.md` | UX reliability reference only |
| `shipglows_data/workflow/archives/contentflow-specs/foundation-scrollable-nav-affiliations.md` | ContentFlow UI/domain reference | archived parked | `archived` | `shipglows_data/workflow/archives/contentflow-specs/foundation-scrollable-nav-affiliations.md` | `legacy-contentflow-inventory.md` | low | `rg -n "Affiliations|Navigation|ContentFlow" shipglows_data/workflow/archives/contentflow-specs/foundation-scrollable-nav-affiliations.md` | Historical UI/domain reference |
| `shipglows_data/workflow/archives/contentflow-specs/late-integration-finalization.md` | Legacy integration spec | archived reference | `archived` | `shipglows_data/workflow/archives/contentflow-specs/late-integration-finalization.md` | `legacy-contentflow-inventory.md` | medium | `rg -n "integration|LATE|Zernio" shipglows_data/workflow/archives/contentflow-specs/late-integration-finalization.md` | No current integration is inferred |
| `shipglows_data/workflow/specs/migrate-flutter-core-majors-baseline.md` | Flutter maintenance baseline | keep concept | `keep-concept` | `stay-current` | `legacy-contentflow-inventory.md` | medium | `rg -n "Flutter|dependencies|baseline" shipglows_data/workflow/specs/migrate-flutter-core-majors-baseline.md` | Keep for maintenance history |
| `shipglows_data/workflow/specs/SPEC-migrate-flutter-core-majors.md` | Flutter maintenance chantier | keep concept | `keep-concept` | `stay-current` | `legacy-contentflow-inventory.md` | medium | `rg -n "Flutter|Riverpod|migration" shipglows_data/workflow/specs/SPEC-migrate-flutter-core-majors.md` | Keep for dependency/runtime maintenance |
| `shipglows_data/workflow/archives/contentflow-specs/PRD-lifetime-deal-early-bird-payg.md` | ContentFlow business PRD | archived reference | `archived` | `shipglows_data/workflow/archives/contentflow-specs/PRD-lifetime-deal-early-bird-payg.md` | `legacy-contentflow-inventory.md` | low | `rg -n "ContentFlow|Lifetime|BYOK" shipglows_data/workflow/archives/contentflow-specs/PRD-lifetime-deal-early-bird-payg.md` | Not active ShipGlows product scope |

## Consistency Validation

Use these checks before and after any future legacy cleanup slice:

```bash
rg -n "Current path|Target path|Migration status|Decision source|Validation|blocked-needs-spec" shipglows_data/technical/legacy-file-migration-tracker.md
rg -n "lib/router.dart|lib/providers/providers.dart|web_auth|feedback|OpenRouter|pipeline|FastAPI|SPEC-offline-sync-v2" shipglows_data/technical/legacy-file-migration-tracker.md
rg -n "legacy-file-migration-tracker" shipglows_data/editorial/content-map.md shipglows_data/technical/code-docs-map.md shipglows_data/technical/legacy-contentflow-inventory.md shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md
rg --files lib web_auth shipglows_data/workflow/specs shipglows_data | rg "router.dart|providers.dart|web_auth|feedback|openrouter|clerk|drip|SPEC-offline-sync-v2|PRD-lifetime"
git diff --name-status -- shipglows_data/technical/legacy-file-migration-tracker.md shipglows_data/technical/legacy-contentflow-inventory.md shipglows_data/technical/code-docs-map.md shipglows_data/editorial/content-map.md shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md
```

Manual review rule: if a path appears in the filesystem scan and is not represented by a tracker row or grouped row, add it before moving or deleting anything.

## Maintenance Rule

Every future legacy cleanup PR or chantier must update this tracker before moving, archiving, or deleting files. If a cleanup changes runtime ownership, update `shipglows_data/technical/runtime-boundary.md`, `shipglows_data/technical/code-docs-map.md`, and `shipglows_data/editorial/content-map.md` in the same chantier.
