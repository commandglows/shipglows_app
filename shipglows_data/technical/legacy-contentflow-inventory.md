---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "shipglows_app"
created: "2026-05-08"
updated: "2026-08-17"
status: superseded
source_skill: 300-sg-docs
scope: "legacy-contentflow-inventory"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/presentation/"
  - "lib/data/services/"
  - "lib/data/models/"
  - "lib/core/"
  - "web_auth/"
  - "shipglows_data/workflow/specs/"
  - "shipglows_data/technical/legacy-file-migration-tracker.md"
depends_on:
  - "shipglows_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipglows-inventory.md@1.0.0"
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
superseded_by: "shipglows_data/technical/runtime-boundary.md"
evidence:
  - "Exploration report created on 2026-05-08."
  - "app/lib/main.dart always launches ShipGlowsApp; the former alternate target was removed on 2026-08-11."
next_review: "2026-09-03"
next_step: "Use runtime-boundary.md for current behavior; consult this inventory only before a destructive dormant-module cleanup."
---

# Historical Dormant Module Inventory

## Purpose

This historical inventory prevents destructive cleanup of dormant modules. It is not a product architecture: ShipGlows has one runtime, and no ContentFlow runtime remains selectable.

## Migration Tracking

Operational move/archive/delete status is tracked in `shipglows_data/technical/legacy-file-migration-tracker.md`.

Before any future dormant-module cleanup moves, archives, renames, or deletes a path, the path must have:

- a tracker row or explicit grouped row;
- a `Migration status`;
- a `Target path` or deletion condition;
- a `Decision source`;
- a validation command or manual review check.

This inventory remains the classification source. The migration tracker is the operational ledger for movement status.

## Owned Files

- `lib/presentation/**`
- `lib/providers/providers.dart`
- former `lib/router.dart` deletion record
- `lib/data/services/**`
- `lib/data/models/**`
- `lib/core/**`
- `web_auth/**`
- `shipglows_data/workflow/specs/*.md`
- historical references in repository guidance and workflow records
- `shipglows_data/technical/legacy-file-migration-tracker.md`

## Entrypoints

- `lib/main.dart` always starts `ShipGlowsApp`.
- `lib/providers/providers.dart` remains dormant outside the product entrypoint. The former `lib/router.dart` route graph was removed on 2026-08-17 after import proof.

## Inventory

| Path or area | Current role | ShipGlows decision | Risk | Next action |
| --- | --- | --- | --- | --- |
| `lib/shipglows/` | Active ShipGlows dashboard | keep | low | Keep as active runtime surface |
| `lib/data/shipglows_sources/` | Active Markdown readers/parsers | keep | medium | Preserve source allowlists and diagnostics |
| `lib/domain/project_health/` | Active project health logic | keep | medium | Preserve as active domain layer |
| `lib/main.dart` | Single product entrypoint | keep | low | Keep `ShipGlowsApp` as the only root |
| `lib/presentation/theme/` | Legacy/shared UI theme | adapt-candidate | low | Review for shared design tokens later |
| `lib/presentation/widgets/app_error_view.dart` | Generic error primitive | adapt-candidate | low | Consider moving to ShipGlows widgets after review |
| `lib/presentation/widgets/skeleton_loader.dart` | Generic loading primitive | adapt-candidate | low | Consider moving to ShipGlows widgets after review |
| `lib/core/app_diagnostics.dart` | Diagnostics utility | adapt-candidate | medium | Check current ShipGlows dependencies before rename |
| `lib/core/app_language.dart` | Locale setting | needs-decision | low | Keep until i18n direction is known |
| `lib/core/app_theme_preference.dart` | Theme preference | adapt-candidate | low | Keep if ShipGlows keeps user settings |
| `lib/core/openrouter_guard.dart` | BYOK/OpenRouter guard | keep-concept | high | Do not activate without BYOK spec |
| `lib/data/models/ai_runtime.dart` | Runtime/model mode | keep-concept | medium | Reuse only with BYOK/OpenRouter spec |
| `lib/data/models/openrouter_credential.dart` | BYOK credential model | keep-concept | high | Preserve as reference; no client secrets expansion |
| `lib/data/models/auth_session.dart` | Auth session model | keep-concept | high | Redesign with future auth provider spec |
| `lib/data/models/app_settings.dart` | Mixed app settings | split-candidate | medium | Separate ShipGlows settings from ContentFlow settings later |
| `lib/data/models/project.dart` | Legacy project model | adapt-candidate | medium | Compare with ShipGlows project/source model before reuse |
| `lib/data/models/feedback_entry.dart` | Feedback data shape | keep-concept | medium | Use for future text-only feedback spec if useful |
| `lib/data/services/api_service.dart` | Legacy FastAPI facade | park | high | Do not use as product backend without architecture spec |
| `lib/data/services/clerk_auth_service*` | Legacy Clerk auth | reference-only | high | Keep until auth provider decision; do not wire by default |
| `lib/data/services/feedback_service.dart` | Legacy feedback service | keep-concept | medium | Redesign for ShipGlows feedback spec |
| `lib/data/services/offline_storage_service.dart` | Legacy offline/cache | adapt-candidate | medium | Review if projection/sync needs local cache |
| `lib/data/services/notification_service.dart` | Legacy notification scaffold | park | medium | Keep parked until notification need exists |
| `lib/providers/providers.dart` | Legacy provider graph | park | high | Split only when specific reused module is selected |
| `lib/router.dart` | Removed route graph | deleted | low | Import-boundary test prevents restoration as an alternate runtime |
| `lib/presentation/screens/auth/` | Legacy auth UI | reference-only | high | Do not choose Clerk by default |
| `lib/presentation/screens/feedback/` | Legacy feedback UI | keep-concept | medium | Future text feedback spec decides reuse |
| `lib/presentation/screens/settings/` | Legacy settings/integrations | adapt-candidate | medium | Review for BYOK/source settings later |
| `lib/presentation/screens/projects/` | Legacy project UI | adapt-candidate | medium | Compare with ShipGlows source/project onboarding needs |
| `lib/presentation/screens/onboarding/` | Legacy onboarding | adapt-candidate | medium | Reuse only after ShipGlows onboarding spec |
| `lib/presentation/screens/drip/` | Legacy pipeline | park | medium | Do not delete; user wants pipeline untouched for now |
| `lib/presentation/screens/feed/`, `editor`, `history`, `calendar` | Legacy content workflow | park | medium | Revisit if ShipGlows indexes content assets |
| `lib/presentation/screens/angles/`, `personas`, `ritual`, `seo`, `newsletter`, `research`, `reels` | ContentFlow pipeline | park | low | Treat as product idea archive |
| `lib/presentation/screens/activity/`, `runs`, `analytics`, `performance`, `uptime`, `work_domains` | Operational views | needs-decision | medium | Some concepts may fit ShipGlows operations |
| `web_auth/` | Legacy Clerk web auth pages | reference-only | high | Archive after auth provider decision if not Clerk |
| `shipglows_data/workflow/specs/*contentflow*`, FastAPI shipglows_data/workflow/specs | Legacy shipglows_data/workflow/specs | classify | medium | Mark active, reference, archive, or superseded one by one |
| `README.md`, `CLAUDE.md`, `AGENT.md`, `shipglows_data/workflow/TASKS.md` | Historical guidance records | rewrite | high | Keep one ShipGlows runtime and label history as history |

## Spec Classification

| Spec | Current origin | ShipGlows decision | Risk | Next action |
| --- | --- | --- | --- | --- |
| `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md` | Historical migration premise | superseded | high | The managed Cockpit MVP and runtime boundary now own current product behavior |
| `shipglows_data/workflow/archives/contentflow-specs/SPEC-offline-sync-v2.md` | ContentFlow | archived-reference | medium | Preserve cache, queue, replay, and recovery concepts only |
| `shipglows_data/workflow/archives/contentflow-specs/architecture-cible-fastapi-clerk-flutter.md` | ContentFlow | archived-reference | high | FastAPI and Clerk are not active ShipGlows decisions |
| `shipglows_data/workflow/archives/contentflow-specs/feedback-admin-v1-contentflow.md` | ContentFlow | archived-concept | medium | Mine only through a current feedback specification |
| `shipglows_data/workflow/archives/contentflow-specs/feedback-backend-contract-fastapi.md` | ContentFlow | archived-reference | high | Do not adopt the backend contract without a current spec |
| `shipglows_data/workflow/archives/contentflow-specs/SPEC-content-pipeline-unification.md` | ContentFlow | archived-parked | medium | Historical pipeline concepts only |
| `shipglows_data/workflow/archives/contentflow-specs/SPEC-project-flows-selection-onboarding-archive.md` | ContentFlow | archived-adapt-candidate | medium | Current ShipGlows project/onboarding contracts win |
| `shipglows_data/workflow/archives/contentflow-specs/spec-no-ui-jump-on-resume.md` | ContentFlow | archived-adapt-candidate | medium | UX reliability reference only |
| `shipglows_data/workflow/archives/contentflow-specs/foundation-scrollable-nav-affiliations.md` | ContentFlow | archived-parked | low | Historical UI/domain reference only |
| `shipglows_data/workflow/archives/contentflow-specs/late-integration-finalization.md` | ContentFlow | archived-reference | medium | No current integration is inferred |
| `shipglows_data/workflow/specs/migrate-flutter-core-majors-baseline.md` | Flutter maintenance | keep-concept | medium | Useful for dependency/runtime maintenance |
| `shipglows_data/workflow/specs/SPEC-migrate-flutter-core-majors.md` | Flutter maintenance | keep-concept | medium | Useful for dependency/runtime maintenance |
| `shipglows_data/workflow/archives/contentflow-specs/PRD-lifetime-deal-early-bird-payg.md` | ContentFlow business | archived-reference | low | Not active ShipGlows product scope |

## Archived Governance Sources

The former canonical ContentFlow business and technical owner documents were preserved on 2026-08-03 under `shipglows_data/workflow/archives/contentflow-governance/`. Their replacements at `shipglows_data/business/` and `shipglows_data/technical/` now describe ShipGlows. Archived files remain historical evidence and must not be used as current product truth.

## Invariants

- `keep-concept`, `adapt-candidate`, `park`, `reference-only`, and `needs-decision` are not deletion approvals.
- Any future delete must cite a later spec or explicit user decision.
- Security-sensitive areas need a fresh spec before activation.

## Validation

```bash
! rg -n "APP_TARGET|LegacyShipGlowsApp" app/lib/main.dart app/lib/shipglows app/web/index.html
rg -n "Clerk|OpenRouter|FastAPI|Supabase|Firebase|Firestore|feedback|pipeline" lib shipglows_data/technical shipglows_data/workflow/specs README.md
```

## Reader Checklist

- Is the path still present and correctly classified?
- Did a product decision change a `park` or `needs-decision` item?
- Is a future feature being inferred from dormant code instead of a ready spec?
- Would deleting this path lose a confirmed ShipGlows idea?

## Maintenance Rule

Every destructive dormant-module cleanup must update this inventory and `shipglows_data/technical/legacy-file-migration-tracker.md` before moving or removing files.
