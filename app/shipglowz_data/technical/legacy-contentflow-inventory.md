---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-08"
updated: "2026-05-10"
status: draft
source_skill: sf-docs
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
  - "shipglowz_data/workflow/specs/"
  - "shipglowz_data/technical/legacy-file-migration-tracker.md"
depends_on:
  - "shipglowz_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipglowz-inventory.md@1.0.0"
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "Exploration report created on 2026-05-08."
  - "Repo scan found active ShipGlowz and embedded legacy ContentFlow runtime."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Legacy ContentFlow Inventory

## Purpose

This inventory prevents destructive cleanup while ShipGlowz absorbs useful ContentFlow ideas. A path can be renamed, moved, or removed only after its decision is recorded here or in a later spec that supersedes this inventory.

## Migration Tracking

Operational move/archive/delete status is tracked in `shipglowz_data/technical/legacy-file-migration-tracker.md`.

Before any future legacy cleanup moves, archives, renames, or deletes a path, the path must have:

- a tracker row or explicit grouped row;
- a `Migration status`;
- a `Target path` or deletion condition;
- a `Decision source`;
- a validation command or manual review check.

This inventory remains the classification source. The migration tracker is the operational ledger for movement status.

## Owned Files

- `lib/presentation/**`
- `lib/providers/providers.dart`
- `lib/router.dart`
- `lib/data/services/**`
- `lib/data/models/**`
- `lib/core/**`
- `web_auth/**`
- `shipglowz_data/workflow/specs/*.md`
- legacy sections in `README.md`, `CLAUDE.md`, `AGENT.md`, and `shipglowz_data/workflow/TASKS.md`
- `shipglowz_data/technical/legacy-file-migration-tracker.md`

## Entrypoints

- `lib/main.dart` selects `LegacyShipGlowzApp` only for `APP_TARGET=legacy` or `APP_TARGET=contentflow`.
- `lib/router.dart` owns the legacy ContentFlow route graph.
- `lib/providers/providers.dart` wires most legacy runtime state.

## Inventory

| Path or area | Current role | ShipGlowz decision | Risk | Next action |
| --- | --- | --- | --- | --- |
| `lib/shipglowz/` | Active ShipGlowz dashboard | keep | low | Keep as active runtime surface |
| `lib/data/shipglowz_sources/` | Active Markdown readers/parsers | keep | medium | Preserve source allowlists and diagnostics |
| `lib/domain/project_health/` | Active project health logic | keep | medium | Preserve as active domain layer |
| `lib/main.dart` | Runtime selector | keep-temporary | medium | Document and avoid expanding target names |
| `lib/presentation/theme/` | Legacy/shared UI theme | adapt-candidate | low | Review for shared design tokens later |
| `lib/presentation/widgets/app_error_view.dart` | Generic error primitive | adapt-candidate | low | Consider moving to ShipGlowz widgets after review |
| `lib/presentation/widgets/skeleton_loader.dart` | Generic loading primitive | adapt-candidate | low | Consider moving to ShipGlowz widgets after review |
| `lib/core/app_diagnostics.dart` | Diagnostics utility | adapt-candidate | medium | Check current ShipGlowz dependencies before rename |
| `lib/core/app_language.dart` | Locale setting | needs-decision | low | Keep until i18n direction is known |
| `lib/core/app_theme_preference.dart` | Theme preference | adapt-candidate | low | Keep if ShipGlowz keeps user settings |
| `lib/core/openrouter_guard.dart` | BYOK/OpenRouter guard | keep-concept | high | Do not activate without BYOK spec |
| `lib/data/models/ai_runtime.dart` | Runtime/model mode | keep-concept | medium | Reuse only with BYOK/OpenRouter spec |
| `lib/data/models/openrouter_credential.dart` | BYOK credential model | keep-concept | high | Preserve as reference; no client secrets expansion |
| `lib/data/models/auth_session.dart` | Auth session model | keep-concept | high | Redesign with future auth provider spec |
| `lib/data/models/app_settings.dart` | Mixed app settings | split-candidate | medium | Separate ShipGlowz settings from ContentFlow settings later |
| `lib/data/models/project.dart` | Legacy project model | adapt-candidate | medium | Compare with ShipGlowz project/source model before reuse |
| `lib/data/models/feedback_entry.dart` | Feedback data shape | keep-concept | medium | Use for future text-only feedback spec if useful |
| `lib/data/services/api_service.dart` | Legacy FastAPI facade | park | high | Do not use as product backend without architecture spec |
| `lib/data/services/clerk_auth_service*` | Legacy Clerk auth | reference-only | high | Keep until auth provider decision; do not wire by default |
| `lib/data/services/feedback_service.dart` | Legacy feedback service | keep-concept | medium | Redesign for ShipGlowz feedback spec |
| `lib/data/services/offline_storage_service.dart` | Legacy offline/cache | adapt-candidate | medium | Review if projection/sync needs local cache |
| `lib/data/services/notification_service.dart` | Legacy notification scaffold | park | medium | Keep parked until notification need exists |
| `lib/providers/providers.dart` | Legacy provider graph | park | high | Split only when specific reused module is selected |
| `lib/router.dart` | Legacy route graph | archive-later | high | Keep while legacy target exists |
| `lib/presentation/screens/auth/` | Legacy auth UI | reference-only | high | Do not choose Clerk by default |
| `lib/presentation/screens/feedback/` | Legacy feedback UI | keep-concept | medium | Future text feedback spec decides reuse |
| `lib/presentation/screens/settings/` | Legacy settings/integrations | adapt-candidate | medium | Review for BYOK/source settings later |
| `lib/presentation/screens/projects/` | Legacy project UI | adapt-candidate | medium | Compare with ShipGlowz source/project onboarding needs |
| `lib/presentation/screens/onboarding/` | Legacy onboarding | adapt-candidate | medium | Reuse only after ShipGlowz onboarding spec |
| `lib/presentation/screens/drip/` | Legacy pipeline | park | medium | Do not delete; user wants pipeline untouched for now |
| `lib/presentation/screens/feed/`, `editor`, `history`, `calendar` | Legacy content workflow | park | medium | Revisit if ShipGlowz indexes content assets |
| `lib/presentation/screens/angles/`, `personas`, `ritual`, `seo`, `newsletter`, `research`, `reels` | ContentFlow pipeline | park | low | Treat as product idea archive |
| `lib/presentation/screens/activity/`, `runs`, `analytics`, `performance`, `uptime`, `work_domains` | Operational views | needs-decision | medium | Some concepts may fit ShipGlowz operations |
| `web_auth/` | Legacy Clerk web auth pages | reference-only | high | Archive after auth provider decision if not Clerk |
| `shipglowz_data/workflow/specs/*contentflow*`, FastAPI shipglowz_data/workflow/specs | Legacy shipglowz_data/workflow/specs | classify | medium | Mark active, reference, archive, or superseded one by one |
| `README.md`, `CLAUDE.md`, `AGENT.md`, `shipglowz_data/workflow/TASKS.md` | Mixed product guidance | rewrite | high | Make ShipGlowz active and preserve legacy decisions as archive |

## Spec Classification

| Spec | Current origin | ShipGlowz decision | Risk | Next action |
| --- | --- | --- | --- | --- |
| `shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md` | ShipGlowz | active | high | Use as current migration/fusion chantier |
| `shipglowz_data/workflow/specs/SPEC-offline-sync-v2.md` | ContentFlow | reference-only | medium | Preserve concepts for future sync/projection spec |
| `shipglowz_data/workflow/specs/architecture-cible-fastapi-clerk-flutter.md` | ContentFlow | reference-only | high | Do not treat FastAPI or Clerk as active ShipGlowz decisions |
| `shipglowz_data/workflow/specs/feedback-admin-v1-contentflow.md` | ContentFlow | keep-concept | medium | Mine later for text-only feedback spec |
| `shipglowz_data/workflow/specs/feedback-backend-contract-fastapi.md` | ContentFlow | reference-only | high | Do not adopt FastAPI feedback backend without new spec |
| `shipglowz_data/workflow/specs/SPEC-content-pipeline-unification.md` | ContentFlow | park | medium | User asked not to touch pipeline for now |
| `shipglowz_data/workflow/specs/SPEC-project-flows-selection-onboarding-archive.md` | ContentFlow | adapt-candidate | medium | Review later for ShipGlowz project/source onboarding |
| `shipglowz_data/workflow/specs/spec-no-ui-jump-on-resume.md` | ContentFlow | adapt-candidate | medium | Keep as UX reliability reference |
| `shipglowz_data/workflow/specs/foundation-scrollable-nav-affiliations.md` | ContentFlow | park | low | ContentFlow UI/domain reference only |
| `shipglowz_data/workflow/specs/late-integration-finalization.md` | ContentFlow | reference-only | medium | Review only if integrations become active ShipGlowz scope |
| `shipglowz_data/workflow/specs/migrate-flutter-core-majors-baseline.md` | Flutter maintenance | keep-concept | medium | Useful for dependency/runtime maintenance |
| `shipglowz_data/workflow/specs/SPEC-migrate-flutter-core-majors.md` | Flutter maintenance | keep-concept | medium | Useful for dependency/runtime maintenance |
| `shipglowz_data/workflow/specs/PRD-lifetime-deal-early-bird-payg.md` | ContentFlow business | archive-later | low | Not active ShipGlowz product scope |

## Invariants

- `keep-concept`, `adapt-candidate`, `park`, `reference-only`, and `needs-decision` are not deletion approvals.
- Any future delete must cite a later spec or explicit user decision.
- Security-sensitive areas need a fresh spec before activation.

## Validation

```bash
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglowz_data/workflow/TASKS.md shipglowz_data/editorial/content-map.md shipglowz_data/technical shipglowz_data/workflow/specs lib test
rg -n "Clerk|OpenRouter|FastAPI|Supabase|Firebase|Firestore|feedback|pipeline" lib shipglowz_data/technical shipglowz_data/workflow/specs README.md
```

## Reader Checklist

- Is the path still present and correctly classified?
- Did a product decision change a `park` or `needs-decision` item?
- Is a future feature being inferred from legacy code instead of a ready spec?
- Would deleting this path lose a confirmed ShipGlowz idea?

## Maintenance Rule

Every legacy cleanup PR or chantier must update this inventory and `shipglowz_data/technical/legacy-file-migration-tracker.md` before moving or removing files.
