---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-10"
updated: "2026-05-10"
status: draft
source_skill: sf-start
scope: "legacy-file-migration-tracker"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "shipflow_data/technical/legacy-contentflow-inventory.md"
  - "shipflow_data/technical/runtime-boundary.md"
  - "shipflow_data/technical/code-docs-map.md"
  - "shipflow_data/editorial/content-map.md"
  - "shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md"
  - "shipflow_data/workflow/specs/shipflow-legacy-file-migration-tracker.md"
  - "lib/"
  - "web_auth/"
  - "shipflow_data/workflow/specs/"
depends_on:
  - "shipflow_data/workflow/specs/shipflow-legacy-file-migration-tracker.md@0.1.0"
  - "shipflow_data/technical/legacy-contentflow-inventory.md@0.1.0"
  - "shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md@0.4.0"
supersedes: []
evidence:
  - "User request 2026-05-10: create explicit tracking for old files to keep, adapt, move to legacy, or delete later."
  - "Legacy inventory classifies areas but did not track target path, migration status, decision source, and validation per row."
next_review: "2026-06-10"
next_step: "/sf-verify ShipFlow Legacy File Migration Tracker"
---

# Legacy File Migration Tracker

## Purpose

This tracker is the operational ledger for legacy ContentFlow files during the ShipFlow migration. It tells future agents which files are active, which are legacy references, which need a future owner spec, and which may eventually move to a legacy/archive path or be deleted.

This document is not a deletion approval. Any move, archive, or delete action must cite a tracker row and still pass the owner spec or explicit user-decision gate named by that row.

## Status Taxonomy

| Status | Meaning | Move/delete allowed now |
| --- | --- | --- |
| `active-keep` | Active ShipFlow surface. | No |
| `keep-temporary` | Needed temporarily for runtime or inspection. | No |
| `adapt-candidate` | Could become active ShipFlow code after a ready owner spec. | No |
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
- `future ShipFlow path by owner spec` means the target path is chosen only by a later ready feature spec.
- `future legacy/contentflow/...` is the default future code/archive target for legacy runtime code if a cleanup spec approves movement.
- `future shipflow_data/workflow/specs/legacy/contentflow/...` is the default future target for legacy specs if a cleanup spec approves movement.
- `future shipflow_data/legacy/contentflow/...` is the default future target for legacy shipflow_data or root-guide excerpts if a cleanup spec approves movement.
- Target directories are not created by this tracker.

## Migration Table Schema

Each row must answer:

| Column | Required meaning |
| --- | --- |
| Current path | Current path or grouped path pattern. |
| Current role | What the path does today. |
| Decision | ShipFlow migration decision. |
| Migration status | One taxonomy value from this document. |
| Target path | Current location, future target, deletion condition, or blocking state. |
| Decision source | Spec, doc, or user decision that owns the row. |
| Risk | `low`, `medium`, or `high`. |
| Validation | Command or review check before any future mutation. |
| Next action | Concrete next step or blocking question. |

## Code And Runtime Rows

| Current path | Current role | Decision | Migration status | Target path | Decision source | Risk | Validation | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `lib/shipflow/` | Active ShipFlow dashboard runtime | keep | `active-keep` | `stay-current` | `shipflow_data/editorial/content-map.md`; `runtime-boundary.md` | low | `rg -n "ShipFlowApp|shipflow" lib/shipflow lib/main.dart` | Protect from legacy cleanup |
| `lib/data/shipflow_sources/` | Active Markdown readers/parsers | keep | `active-keep` | `stay-current` | `markdown-source-of-truth.md` | medium | `flutter test test/data/shipflow_sources` | Protect source allowlists and diagnostics |
| `lib/domain/project_health/` | Active project health logic | keep | `active-keep` | `stay-current` | `markdown-source-of-truth.md`; `shipflow_data/editorial/content-map.md` | medium | `flutter test test/domain/project_health` | Protect active domain layer |
| `lib/main.dart` | Runtime selector | keep temporary | `keep-temporary` | `stay-current` until legacy target removal gate passes | `runtime-boundary.md` | medium | `rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib/main.dart lib test` | Keep target split stable |
| `lib/presentation/theme/` | Legacy/shared UI theme | adapt candidate | `adapt-candidate` | future ShipFlow path by owner spec or `future legacy/contentflow/presentation/theme/` | `legacy-contentflow-inventory.md` | low | `rg -n "presentation/theme|ThemeData|AppTheme" lib test` | Review during design-token/spec work |
| `lib/presentation/widgets/app_error_view.dart` | Generic error primitive | adapt candidate | `adapt-candidate` | future ShipFlow widget path by owner spec or `future legacy/contentflow/presentation/widgets/` | `legacy-contentflow-inventory.md` | low | `rg -n "AppErrorView" lib test` | Move only with import impact proven |
| `lib/presentation/widgets/skeleton_loader.dart` | Generic loading primitive | adapt candidate | `adapt-candidate` | future ShipFlow widget path by owner spec or `future legacy/contentflow/presentation/widgets/` | `legacy-contentflow-inventory.md` | low | `rg -n "SkeletonLoader|skeleton_loader" lib test` | Move only with import impact proven |
| `lib/core/app_diagnostics.dart` | Diagnostics utility | adapt candidate | `adapt-candidate` | future ShipFlow diagnostics path by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "AppDiagnostics|app_diagnostics" lib test` | Check active dependencies before rename |
| `lib/core/app_language.dart` | Locale setting | needs decision | `needs-decision` | `stay-current` until i18n direction is decided | `legacy-contentflow-inventory.md` | low | `rg -n "AppLanguage|app_language" lib test` | Decide device/user/project language model |
| `lib/core/app_theme_preference.dart` | Theme preference | adapt candidate | `adapt-candidate` | future ShipFlow settings path by owner spec | `legacy-contentflow-inventory.md` | low | `rg -n "AppThemePreference|app_theme_preference" lib test` | Reuse only with settings spec |
| `lib/core/openrouter_guard.dart` | BYOK/OpenRouter guard | keep concept | `blocked-needs-spec` | `stay-current` until BYOK security spec | `legacy-contentflow-inventory.md`; `shipflow-legacy-reuse-roadmap.md` | high | `rg -n "OpenRouter|openrouter|BYOK" lib test shipflow_data/technical shipflow_data/workflow/specs` | No activation or deletion before BYOK spec |
| `lib/data/models/ai_runtime.dart` | AI runtime/model mode | keep concept | `blocked-needs-spec` | `stay-current` until BYOK/AI runtime spec | `legacy-contentflow-inventory.md` | medium | `rg -n "AiRuntime|ai_runtime" lib test` | Preserve as concept |
| `lib/data/models/openrouter_credential.dart` | BYOK credential model | keep concept | `blocked-needs-spec` | `stay-current` until BYOK security spec | `legacy-contentflow-inventory.md` | high | `rg -n "OpenRouterCredential|openrouter_credential" lib test` | Do not expand client secret handling |
| `lib/data/models/auth_session.dart` | Auth session model | keep concept | `blocked-needs-spec` | `stay-current` until auth provider spec | `legacy-contentflow-inventory.md` | high | `rg -n "AuthSession|auth_session" lib test` | Redesign with future auth spec |
| `lib/data/models/app_settings.dart` | Mixed app settings | split candidate | `adapt-candidate` | future ShipFlow settings model by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "AppSettings|app_settings" lib test` | Split only with settings spec |
| `lib/data/models/project.dart` | Legacy project model | adapt candidate | `adapt-candidate` | future ShipFlow project model by owner spec | `legacy-contentflow-inventory.md`; foundational project shipflow_data/workflow/specs | medium | `rg -n "class Project|data/models/project" lib test` | Compare against GitHub repo project model |
| `lib/data/models/feedback_entry.dart` | Feedback data shape | keep concept | `blocked-needs-spec` | `stay-current` until feedback spec | `legacy-contentflow-inventory.md` | medium | `rg -n "FeedbackEntry|feedback_entry" lib test` | Reuse only through text feedback spec |
| `lib/data/services/api_service.dart` | Legacy FastAPI facade | park | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/data/services/api_service.dart` only after cleanup spec | `legacy-contentflow-inventory.md` | high | `rg -n "ApiService|FastAPI|api_service" lib test shipflow_data/technical shipflow_data/workflow/specs` | Do not adopt as backend default |
| `lib/data/services/clerk_auth_service*` | Legacy Clerk auth | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/data/services/` only after auth decision | `legacy-contentflow-inventory.md` | high | `rg -n "Clerk|clerk_auth_service" lib web_auth test shipflow_data/technical shipflow_data/workflow/specs` | Archive only after auth provider decision |
| `lib/data/services/feedback_service.dart` | Legacy feedback service | keep concept | `blocked-needs-spec` | `stay-current` until feedback spec | `legacy-contentflow-inventory.md` | medium | `rg -n "FeedbackService|feedback_service" lib test` | Redesign before reuse |
| `lib/data/services/offline_storage_service.dart` | Legacy offline/cache | adapt candidate | `adapt-candidate` | future projection/cache path by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "OfflineStorage|offline_storage" lib test` | Review after projection/sync spec |
| `lib/data/services/notification_service.dart` | Legacy notification scaffold | park | `park` | `stay-current`; future `legacy/contentflow/data/services/notification_service.dart` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "NotificationService|notification_service" lib test` | Keep parked until notification need exists |
| `lib/providers/providers.dart` | Legacy provider graph | park | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/providers/providers.dart` only after runtime removal plan | `legacy-contentflow-inventory.md`; `runtime-boundary.md` | high | `rg -n "providers.dart|ProviderScope|LegacyShipFlowApp" lib test` | Split only when reused module is selected |
| `lib/router.dart` | Legacy route graph | archive later | `archive-later` | `stay-current` until legacy runtime removal; future `legacy/contentflow/router.dart` | `runtime-boundary.md` | high | `rg -n "GoRoute|LegacyShipFlowApp|APP_TARGET" lib/router.dart lib/main.dart test` | Remove/archive only after runtime removal conditions |
| `lib/presentation/screens/auth/` | Legacy auth UI | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/presentation/screens/auth/` after auth decision | `legacy-contentflow-inventory.md` | high | `rg -n "Auth|Clerk|auth" lib/presentation/screens/auth lib test` | Do not choose Clerk by default |
| `lib/presentation/screens/feedback/` | Legacy feedback UI | keep concept | `blocked-needs-spec` | `stay-current` until feedback spec | `legacy-contentflow-inventory.md` | medium | `rg -n "feedback" lib/presentation/screens/feedback lib test` | Future text feedback spec decides reuse |
| `lib/presentation/screens/settings/` | Legacy settings/integrations | adapt candidate | `adapt-candidate` | future ShipFlow settings path by owner spec | `legacy-contentflow-inventory.md` | medium | `rg -n "settings|OpenRouter|integrations" lib/presentation/screens/settings lib test` | Review for BYOK/source settings |
| `lib/presentation/screens/projects/` | Legacy project UI | adapt candidate | `adapt-candidate` | future ShipFlow project UI by owner spec | `legacy-contentflow-inventory.md`; project onboarding specs | medium | `rg -n "ProjectsScreen|projects_screen|project" lib/presentation/screens/projects lib test` | Compare with GitHub project onboarding |
| `lib/presentation/screens/onboarding/` | Legacy onboarding | adapt candidate | `adapt-candidate` | future ShipFlow onboarding path by owner spec | `legacy-contentflow-inventory.md`; project onboarding specs | medium | `rg -n "onboarding" lib/presentation/screens/onboarding lib test` | Reuse only after onboarding spec |
| `lib/presentation/screens/drip/` | Legacy pipeline | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/drip/` if cleanup spec approves | `legacy-contentflow-inventory.md`; user direction | medium | `rg -n "drip" lib/presentation/screens/drip lib test` | Do not delete; pipeline remains parked |
| `lib/presentation/screens/feed/`, `editor`, `history`, `calendar` | Legacy content workflow | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/` grouping after cleanup spec | `legacy-contentflow-inventory.md` | medium | `rg -n "FeedScreen|Editor|History|Calendar" lib/presentation/screens test` | Revisit only if content workflow returns |
| `lib/presentation/screens/angles/`, `personas`, `ritual`, `seo`, `newsletter`, `research`, `reels` | ContentFlow pipeline/product ideas | park | `park` | `stay-current`; future `legacy/contentflow/presentation/screens/` grouping after cleanup spec | `legacy-contentflow-inventory.md` | low | `rg -n "angles|personas|ritual|seo|newsletter|research|reels" lib/presentation/screens test` | Treat as product idea archive |
| `lib/presentation/screens/activity/`, `runs`, `analytics`, `performance`, `uptime`, `work_domains` | Operational views | needs decision | `needs-decision` | `stay-current` until operations dashboard decision | `legacy-contentflow-inventory.md` | medium | `rg -n "activity|runs|analytics|performance|uptime|work_domains" lib/presentation/screens test` | Decide which concepts fit ShipFlow ops |
| `web_auth/` | Legacy Clerk web auth pages | reference only | `blocked-needs-spec` | `stay-current`; future `legacy/contentflow/web_auth/` after auth provider decision | `legacy-contentflow-inventory.md` | high | `rg -n "CLERK|sign-in|sso-callback|web_auth" web_auth scripts README.md shipflow_data/technical shipflow_data/workflow/specs` | Archive only after auth provider is chosen |
| `README.md`, `CLAUDE.md`, `AGENT.md`, `shipflow_data/workflow/TASKS.md` legacy sections | Mixed product guidance | rewrite/preserve archive decisions | `needs-decision` | `stay-current`; future excerpts under `shipflow_data/legacy/contentflow/` only after docs cleanup spec | `legacy-contentflow-inventory.md` | high | `rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipflow_data/workflow/TASKS.md` | Keep ShipFlow active, preserve useful legacy decisions |

## Legacy Spec Rows

| Current path | Current role | Decision | Migration status | Target path | Decision source | Risk | Validation | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md` | Active ShipFlow migration/fusion chantier | active | `active-keep` | `stay-current` | self; `legacy-contentflow-inventory.md` | high | `rg -n "ShipFlow Legacy ContentFlow Fusion|Current Chantier Flow" shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md` | Keep as active parent chantier |
| `shipflow_data/workflow/specs/SPEC-offline-sync-v2.md` | ContentFlow offline/sync reference | reference only | `reference-only` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/SPEC-offline-sync-v2.md` after cleanup spec | `legacy-contentflow-inventory.md` | medium | `rg -n "offline|sync" shipflow_data/workflow/specs/SPEC-offline-sync-v2.md` | Preserve concepts for future sync/projection spec |
| `shipflow_data/workflow/specs/architecture-cible-fastapi-clerk-flutter.md` | ContentFlow FastAPI/Clerk architecture | reference only | `blocked-needs-spec` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/architecture-cible-fastapi-clerk-flutter.md` after auth/backend decisions | `legacy-contentflow-inventory.md` | high | `rg -n "FastAPI|Clerk|Flutter" shipflow_data/workflow/specs/architecture-cible-fastapi-clerk-flutter.md` | Do not treat as ShipFlow architecture |
| `shipflow_data/workflow/specs/feedback-admin-v1-contentflow.md` | ContentFlow feedback admin idea | keep concept | `blocked-needs-spec` | `stay-current`; future owner spec decides reuse/archive | `legacy-contentflow-inventory.md` | medium | `rg -n "feedback|admin" shipflow_data/workflow/specs/feedback-admin-v1-contentflow.md` | Mine later for text feedback spec |
| `shipflow_data/workflow/specs/feedback-backend-contract-fastapi.md` | FastAPI feedback backend contract | reference only | `blocked-needs-spec` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/feedback-backend-contract-fastapi.md` after feedback/backend decisions | `legacy-contentflow-inventory.md` | high | `rg -n "FastAPI|feedback|backend" shipflow_data/workflow/specs/feedback-backend-contract-fastapi.md` | Do not adopt FastAPI backend without new spec |
| `shipflow_data/workflow/specs/SPEC-content-pipeline-unification.md` | ContentFlow pipeline spec | park | `park` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/SPEC-content-pipeline-unification.md` if cleanup spec approves | `legacy-contentflow-inventory.md` | medium | `rg -n "pipeline|content" shipflow_data/workflow/specs/SPEC-content-pipeline-unification.md` | Keep parked; do not touch pipeline now |
| `shipflow_data/workflow/specs/SPEC-project-flows-selection-onboarding-archive.md` | ContentFlow project flow reference | adapt candidate | `adapt-candidate` | `stay-current` until project/onboarding owner spec supersedes or archives | `legacy-contentflow-inventory.md` | medium | `rg -n "project|onboarding|archive" shipflow_data/workflow/specs/SPEC-project-flows-selection-onboarding-archive.md` | Review against ShipFlow onboarding shipflow_data/workflow/specs |
| `shipflow_data/workflow/specs/spec-no-ui-jump-on-resume.md` | UX reliability reference | adapt candidate | `adapt-candidate` | `stay-current` until UX reliability owner spec supersedes or archives | `legacy-contentflow-inventory.md` | medium | `rg -n "resume|jump|route" shipflow_data/workflow/specs/spec-no-ui-jump-on-resume.md` | Keep as UX reliability reference |
| `shipflow_data/workflow/specs/foundation-scrollable-nav-affiliations.md` | ContentFlow UI/domain reference | park | `park` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/foundation-scrollable-nav-affiliations.md` if cleanup spec approves | `legacy-contentflow-inventory.md` | low | `rg -n "Affiliations|Navigation|ContentFlow" shipflow_data/workflow/specs/foundation-scrollable-nav-affiliations.md` | Keep parked |
| `shipflow_data/workflow/specs/late-integration-finalization.md` | Legacy integration spec | reference only | `reference-only` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/late-integration-finalization.md` after integrations decision | `legacy-contentflow-inventory.md` | medium | `rg -n "integration|LATE|Zernio" shipflow_data/workflow/specs/late-integration-finalization.md` | Review only if integrations become active |
| `shipflow_data/workflow/specs/migrate-flutter-core-majors-baseline.md` | Flutter maintenance baseline | keep concept | `keep-concept` | `stay-current` | `legacy-contentflow-inventory.md` | medium | `rg -n "Flutter|dependencies|baseline" shipflow_data/workflow/specs/migrate-flutter-core-majors-baseline.md` | Keep for maintenance history |
| `shipflow_data/workflow/specs/SPEC-migrate-flutter-core-majors.md` | Flutter maintenance chantier | keep concept | `keep-concept` | `stay-current` | `legacy-contentflow-inventory.md` | medium | `rg -n "Flutter|Riverpod|migration" shipflow_data/workflow/specs/SPEC-migrate-flutter-core-majors.md` | Keep for dependency/runtime maintenance |
| `shipflow_data/workflow/specs/PRD-lifetime-deal-early-bird-payg.md` | ContentFlow business PRD | archive later | `archive-later` | `stay-current`; future `shipflow_data/workflow/specs/legacy/contentflow/PRD-lifetime-deal-early-bird-payg.md` after business archive decision | `legacy-contentflow-inventory.md` | low | `rg -n "ContentFlow|Lifetime|BYOK" shipflow_data/workflow/specs/PRD-lifetime-deal-early-bird-payg.md` | Not active ShipFlow product scope |

## Consistency Validation

Use these checks before and after any future legacy cleanup slice:

```bash
rg -n "Current path|Target path|Migration status|Decision source|Validation|blocked-needs-spec" shipflow_data/technical/legacy-file-migration-tracker.md
rg -n "lib/router.dart|lib/providers/providers.dart|web_auth|feedback|OpenRouter|pipeline|FastAPI|SPEC-offline-sync-v2" shipflow_data/technical/legacy-file-migration-tracker.md
rg -n "legacy-file-migration-tracker" shipflow_data/editorial/content-map.md shipflow_data/technical/code-docs-map.md shipflow_data/technical/legacy-contentflow-inventory.md shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md
rg --files lib web_auth shipflow_data/workflow/specs shipflow_data | rg "router.dart|providers.dart|web_auth|feedback|openrouter|clerk|drip|SPEC-offline-sync-v2|PRD-lifetime"
git diff --name-status -- shipflow_data/technical/legacy-file-migration-tracker.md shipflow_data/technical/legacy-contentflow-inventory.md shipflow_data/technical/code-docs-map.md shipflow_data/editorial/content-map.md shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md shipflow_data/workflow/specs/shipflow-legacy-file-migration-tracker.md
```

Manual review rule: if a path appears in the filesystem scan and is not represented by a tracker row or grouped row, add it before moving or deleting anything.

## Maintenance Rule

Every future legacy cleanup PR or chantier must update this tracker before moving, archiving, or deleting files. If a cleanup changes runtime ownership, update `shipflow_data/technical/runtime-boundary.md`, `shipflow_data/technical/code-docs-map.md`, and `shipflow_data/editorial/content-map.md` in the same chantier.
