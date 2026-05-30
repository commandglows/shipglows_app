---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-08"
updated: "2026-05-22"
status: draft
source_skill: sf-docs
scope: "code-docs-map"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/"
  - "test/"
  - "shipflow_data/technical/"
  - "shipflow_data/workflow/specs/"
depends_on:
  - "shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "Repo scan on 2026-05-08"
  - "shipflow_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipflow-inventory.md"
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Code Docs Map

## Purpose

This map links code areas to their primary technical documentation, validation commands, and documentation update triggers. It is intentionally conservative while the ContentFlow legacy runtime is still embedded.

## Owned Files

- `shipflow_data/technical/code-docs-map.md`

## Entrypoints

- `lib/main.dart`
- `lib/shipflow/app.dart`
- `lib/shipflow/router.dart`
- `lib/router.dart`
- `test/widget_test.dart`

## Map

| Code area | Current role | Primary doc | Validation | Update trigger |
| --- | --- | --- | --- | --- |
| `lib/main.dart` | Runtime target switch | `shipflow_data/technical/runtime-boundary.md` | `rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib test` | Any change to app boot, target names, or provider overrides |
| `lib/shipflow/` | Active ShipFlow UI runtime | `shipflow_data/technical/runtime-boundary.md` | `flutter test test/widget_test.dart` | Any dashboard route, screen, or provider behavior change |
| `lib/data/shipflow_sources/` | Active Markdown/source readers | `shipflow_data/technical/markdown-source-of-truth.md` | `flutter test test/data/shipflow_sources` | Any parser, allowlist, diagnostics, source file rule, or operational record grammar change |
| `lib/domain/project_health/` | Active project health model | `shipflow_data/technical/markdown-source-of-truth.md` | `flutter test test/domain/project_health` | Any project posture, next-command, or health scoring change |
| `/home/claude/shipflow/tui` | ShipFlow-owned terminal dashboard (Bun/OpenTUI), read-only V1 | `/home/claude/shipflow/shipflow_data/technical/terminal-tui.md` | `cd /home/claude/shipflow/tui && bun run typecheck && bun test` | Any source policy, reader/parser, operational record grammar, view-model, OpenTUI lifecycle, or keyboard navigation change |
| Operational record grammar | Shared task/audit/spec source-line contract | `/home/claude/shipflow/skills/references/operational-record-format.md` and `shipflow_data/technical/markdown-source-of-truth.md` | `python3 /home/claude/shipflow/tools/shipflow_metadata_lint.py /home/claude/shipflow/skills/references/operational-record-format.md shipflow_data/technical/markdown-source-of-truth.md shipflow_data/technical/code-docs-map.md` | Any change to traffic markers, required fields, escaping, dedupe, diagnostics, legacy compatibility, or writer obligations |
| Operational record migration + web-reader contract | Live canonicalization and shared web-read model for future projections | `shipflow_data/technical/operational-record-web-reader-contract.md` | `python3 scripts/migrate_operational_records.py --dry-run` and `python3 scripts/migrate_operational_records.py --write --check-only` | Any change to live migration gates, zero-unmapped/duplicate policy, legacy-table removal behavior, or `scripts/migrate_operational_records.py` |
| Flutter operational record parsers | Canonical-first parsing for task, audit, and spec summary records | `shipflow_data/technical/markdown-source-of-truth.md` | `flutter test test/data/shipflow_sources` | Any change under `lib/data/shipflow_sources/parsers/` that parses traffic-first records, fallback legacy tables, diagnostics, source locations, or dedupe |
| TUI operational record readers | Read-only terminal consumption of canonical records plus legacy fallback | `/home/claude/shipflow/shipflow_data/technical/terminal-tui.md` and `/home/claude/shipflow/skills/references/operational-record-format.md` | `cd /home/claude/shipflow/tui && bun test && bun run typecheck` | Any change under `/home/claude/shipflow/tui/src/sources/` that reads, filters, dedupes, displays, or normalizes task/audit/spec records |
| Operational record migration tooling | Deterministic conversion of legacy trackers and active spec summaries | `shipflow_data/technical/markdown-source-of-truth.md` and `/home/claude/shipflow/skills/references/operational-record-format.md` | `python3 scripts/migrate_operational_records.py --dry-run` | Any migration script, checklist, dry-run report, record-count proof, duplicate handling, or live tracker migration |
| ShipFlow writer-skill references | Shared writer instructions for task, audit, and spec operational records | `/home/claude/shipflow/skills/references/operational-record-format.md` | `rg -n "operational-record-format|task:|audit:|spec:" /home/claude/shipflow/skills` | Any skill or skill reference that creates or mutates `TASKS.md`, `AUDIT_LOG.md`, spec summaries, spec status, or chantier flow records |
| `lib/core/` | Mixed shared and legacy utilities | `shipflow_data/technical/legacy-contentflow-inventory.md` | `flutter test test/core` | Any auth, BYOK, diagnostics, settings, or validation change |
| `lib/data/models/` | Mixed shared and legacy models | `shipflow_data/technical/legacy-contentflow-inventory.md` | `flutter test test/data test/core` | Any model reused by active ShipFlow or future features |
| `lib/data/services/` | Mostly legacy service layer | `shipflow_data/technical/legacy-contentflow-inventory.md` | `flutter test test/data` | Any API, auth, feedback, storage, offline, or notification change |
| `lib/presentation/` | Legacy ContentFlow UI runtime plus reusable primitives | `shipflow_data/technical/legacy-contentflow-inventory.md` | `flutter test test/presentation` | Any route, screen, theme, widget, or product flow classification |
| `lib/providers/providers.dart` | Legacy provider graph | `shipflow_data/technical/legacy-contentflow-inventory.md` | `flutter test test/core test/presentation` | Any provider split, archive, or future ShipFlow reuse |
| `lib/router.dart` | Legacy route graph | `shipflow_data/technical/runtime-boundary.md` | `rg -n "GoRoute|appRouterProvider|LegacyShipFlowApp" lib/router.dart lib/main.dart` | Any route added, removed, or exposed from the legacy target |
| `web_auth/` | Legacy Clerk web auth assets | `shipflow_data/technical/legacy-contentflow-inventory.md` | `rg -n "CLERK|sign-in|sso-callback" web_auth scripts README.md` | Any auth provider decision or web build route change |
| `shipflow_data/workflow/specs/` | Mixed active and legacy specs | `shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md` | `rg -n "contentflow|ContentFlow|ShipFlow" shipflow_data/workflow/specs` | Any spec archive, rename, or activation decision |
| Legacy reuse roadmap | Product/technical decision aid | `shipflow_data/technical/shipflow-legacy-reuse-roadmap.md` | `rg -n "Decision question|Recommended direction" shipflow_data/technical/shipflow-legacy-reuse-roadmap.md` | Any user decision about auth, feedback, BYOK, onboarding, FastAPI, runner, or pipeline |
| Legacy file migration tracking | Operational tracker for keep/adapt/move/archive/delete status across legacy files and shipflow_data/workflow/specs | `shipflow_data/technical/legacy-file-migration-tracker.md` | `rg -n "Current path|Target path|Migration status|Decision source|Validation|blocked-needs-spec" shipflow_data/technical/legacy-file-migration-tracker.md` | Any legacy path move, archive, delete, target-path decision, or classification change |
| Recovered branch reality | Branch and stack decision memory | `shipflow_data/technical/recovered-branch-reality.md` | `git show --stat backup/local-supabase-wip-2026-05-08` | Any decision about Supabase WIP, Firebase/Firestore migration, or project identity |
| Firebase/Firestore translation | Target remote projection architecture | `shipflow_data/workflow/specs/firebase-firestore-projection-migration.md` | `rg -n "Supabase|Firebase|Firestore|Cloud Functions|GitHub repository|local clone" shipflow_data/workflow/specs shipflow_data/technical README.md` | Any Firebase/Auth/Firestore/Cloud Functions implementation or Supabase WIP recovery |
| Supabase-to-Firebase contract map | Recovered WIP contract extraction | `shipflow_data/technical/supabase-to-firebase-contract-map.md` | `rg -n "Contract Mapping|Security Rule Requirements|Cloud Function Requirements" shipflow_data/technical/supabase-to-firebase-contract-map.md` | Any recovery of Supabase WIP behavior into Firebase architecture |
| Foundational architecture | Canonical project/clone/projection decisions | `shipflow_data/technical/shipflow-foundational-architecture.md` | `rg -n "project.*GitHub|managed clone|Firestore|GitHub wins" shipflow_data/technical/shipflow-foundational-architecture.md` | Any project onboarding, indexing, Firestore, GitHub auth, clone management, or write-back design |
| Foundational specs handoff | Close-context summary and coherence-review checklist for foundational specs | `shipflow_data/technical/foundational-specs-handoff.md` | `rg -n "Current Decision Set|Foundational Specs|Coherence Review Checklist" shipflow_data/technical/foundational-specs-handoff.md` | Any foundational spec added, superseded, or materially changed before coherence review |
| Foundational coherence gate | Canonical cross-spec gate for auth, onboarding, indexer, Markdown governance, Firestore projection, dashboard, security controls, and state vocabulary | `shipflow_data/workflow/specs/shipflow-foundational-coherence-review.md` | `rg -n "Coherence Contract Matrix|Canonical State Vocabulary|Mandatory Security Controls|Coherence Failure Gates" shipflow_data/workflow/specs/shipflow-foundational-coherence-review.md` | Any foundational implementation, readiness decision, state vocabulary change, auth/access contract change, dashboard projection change, or cross-spec security correction |
| GitHub managed clone indexer | Runner/indexer boundary for GitHub access, clone materialization, Markdown indexing, local fake runner tests, and Firestore projection | `shipflow_data/technical/github-managed-clone-indexer.md` | `flutter test test/data/firestore_projection test/data/shipflow_sources test/shipflow/data` | Any Cloud Functions, GitHub App, clone runner, Markdown indexer, local fake runner, repository interface, or Firestore projection implementation |
| Firestore data model | Foundational Firestore schema and Dart projection contracts for users, shared GitHub projects, memberships, Markdown projections, index runs, diagnostics, and cross-project views | `shipflow_data/technical/firestore-data-model.md` | `rg -n "users/\\{uid\\}|projects/\\{projectId\\}|sourceCommit|owner|viewer|indexRuns|projectRefs|feedItems" shipflow_data/technical/firestore-data-model.md lib/data/firestore_projection test/data/firestore_projection` | Any Firestore schema, Firebase Auth identity, project membership, projection, dashboard feed, path builders, or security-rule implementation |
| Auth and GitHub access | Separation of Firebase Auth identity, GitHub App repository authorization, backend-only installations, and access-loss behavior | `shipflow_data/workflow/specs/shipflow-auth-github-access.md` | `rg -n "Firebase Auth|GitHub App|githubInstallations|installation token|github_access_lost|trusted backend" shipflow_data/workflow/specs/shipflow-auth-github-access.md shipflow_data/technical` | Any auth provider, GitHub App, repository access, installation metadata, membership sync, or access-loss UI implementation |
| Project onboarding flow | User-visible flow for sign-in, GitHub App connection, repo selection, project create-or-join, indexing progress, and recoverable setup errors | `shipflow_data/workflow/specs/shipflow-project-onboarding-flow.md` | `rg -n "needs_github_connection|select_repository|creating_or_joining_project|indexing_project|ready|createOrJoinProject" shipflow_data/workflow/specs/shipflow-project-onboarding-flow.md shipflow_data/technical` | Any onboarding route, first-run UI, repo picker, setup progress, project creation/join, or setup error behavior |
| Markdown artifact governance | Canonical `shipflow_data/` corpus, artifact families, tracker/frontmatter parsing, ignore rules, and safe Markdown indexing | `shipflow_data/workflow/specs/shipflow-markdown-artifact-governance.md` | `rg -n "shipflow_data|ShipFlow_Data|artifactFamily|tracker|frontmatter|governance_corpus_missing" shipflow_data/workflow/specs/shipflow-markdown-artifact-governance.md shipflow_data/technical` | Any Markdown source reader, artifact classifier, tracker parser, shipflow_data corpus bootstrap, projection metadata, or ignore/redaction policy |
| Dashboard read-only projection | Dashboard read model for user-scoped Firestore projection, artifact groups, freshness, access warnings, diagnostics, and index status | `shipflow_data/workflow/specs/shipflow-dashboard-readonly-projection.md` | `rg -n "projectRefs|feedItems|indexedFiles|indexRuns|diagnostics|access-lost|read-only" shipflow_data/workflow/specs/shipflow-dashboard-readonly-projection.md shipflow_data/technical` | Any ShipFlow dashboard route, provider, Firestore query, projection DTO, artifact detail, diagnostics panel, stale/access-lost state, or refresh affordance |

## Non-Coverage

- Firebase, Firestore, Firebase Auth, FastAPI, terminal web, agent runner, BYOK OpenRouter, and feedback implementation are not covered by active technical docs yet because they are future specs.
- Existing ContentFlow specs are not active ShipFlow implementation contracts until classified.

## Invariants

- Each broad code mutation must update this map when it changes ownership, runtime exposure, validation, or documentation triggers.
- Legacy code remains visible in the map until it is archived or removed by a later ready spec.

## Validation

```bash
rg -n "Maintenance Rule|Validation|Owned Files|Entrypoints" shipflow_data/technical
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipflow_data/workflow/TASKS.md shipflow_data/editorial/content-map.md shipflow_data/technical shipflow_data/workflow/specs lib test
flutter test
flutter analyze
```

## Reader Checklist

- Is every major code area represented or explicitly excluded?
- Does every mapped area have a primary doc?
- Are validation commands scoped enough to run during normal chantier work?
- Are legacy and active runtime areas clearly separated?

## Maintenance Rule

Update this file whenever a code path changes status between active ShipFlow, shared/adapted, legacy reference, parked, archived, or removed.
