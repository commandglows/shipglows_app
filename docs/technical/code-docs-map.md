---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-08"
updated: "2026-05-10"
status: draft
source_skill: sf-docs
scope: "code-docs-map"
owner: "Diane"
confidence: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/"
  - "test/"
  - "docs/technical/"
  - "specs/"
depends_on:
  - "specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "Repo scan on 2026-05-08"
  - "docs/explorations/2026-05-08-legacy-contentflow-shipflow-inventory.md"
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Code Docs Map

## Purpose

This map links code areas to their primary technical documentation, validation commands, and documentation update triggers. It is intentionally conservative while the ContentFlow legacy runtime is still embedded.

## Owned Files

- `docs/technical/code-docs-map.md`

## Entrypoints

- `lib/main.dart`
- `lib/shipflow/app.dart`
- `lib/shipflow/router.dart`
- `lib/router.dart`
- `test/widget_test.dart`

## Map

| Code area | Current role | Primary doc | Validation | Update trigger |
| --- | --- | --- | --- | --- |
| `lib/main.dart` | Runtime target switch | `docs/technical/runtime-boundary.md` | `rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib test` | Any change to app boot, target names, or provider overrides |
| `lib/shipflow/` | Active ShipFlow UI runtime | `docs/technical/runtime-boundary.md` | `flutter test test/widget_test.dart` | Any dashboard route, screen, or provider behavior change |
| `lib/data/shipflow_sources/` | Active Markdown/source readers | `docs/technical/markdown-source-of-truth.md` | `flutter test test/data/shipflow_sources` | Any parser, allowlist, diagnostics, or source file rule change |
| `lib/domain/project_health/` | Active project health model | `docs/technical/markdown-source-of-truth.md` | `flutter test test/domain/project_health` | Any project posture, next-command, or health scoring change |
| `lib/core/` | Mixed shared and legacy utilities | `docs/technical/legacy-contentflow-inventory.md` | `flutter test test/core` | Any auth, BYOK, diagnostics, settings, or validation change |
| `lib/data/models/` | Mixed shared and legacy models | `docs/technical/legacy-contentflow-inventory.md` | `flutter test test/data test/core` | Any model reused by active ShipFlow or future features |
| `lib/data/services/` | Mostly legacy service layer | `docs/technical/legacy-contentflow-inventory.md` | `flutter test test/data` | Any API, auth, feedback, storage, offline, or notification change |
| `lib/presentation/` | Legacy ContentFlow UI runtime plus reusable primitives | `docs/technical/legacy-contentflow-inventory.md` | `flutter test test/presentation` | Any route, screen, theme, widget, or product flow classification |
| `lib/providers/providers.dart` | Legacy provider graph | `docs/technical/legacy-contentflow-inventory.md` | `flutter test test/core test/presentation` | Any provider split, archive, or future ShipFlow reuse |
| `lib/router.dart` | Legacy route graph | `docs/technical/runtime-boundary.md` | `rg -n "GoRoute|appRouterProvider|LegacyShipFlowApp" lib/router.dart lib/main.dart` | Any route added, removed, or exposed from the legacy target |
| `web_auth/` | Legacy Clerk web auth assets | `docs/technical/legacy-contentflow-inventory.md` | `rg -n "CLERK|sign-in|sso-callback" web_auth scripts README.md` | Any auth provider decision or web build route change |
| `specs/` | Mixed active and legacy specs | `specs/shipflow-legacy-contentflow-fusion.md` | `rg -n "contentflow|ContentFlow|ShipFlow" specs` | Any spec archive, rename, or activation decision |
| Legacy reuse roadmap | Product/technical decision aid | `docs/technical/shipflow-legacy-reuse-roadmap.md` | `rg -n "Decision question|Recommended direction" docs/technical/shipflow-legacy-reuse-roadmap.md` | Any user decision about auth, feedback, BYOK, onboarding, FastAPI, runner, or pipeline |
| Legacy file migration tracking | Operational tracker for keep/adapt/move/archive/delete status across legacy files and specs | `docs/technical/legacy-file-migration-tracker.md` | `rg -n "Current path|Target path|Migration status|Decision source|Validation|blocked-needs-spec" docs/technical/legacy-file-migration-tracker.md` | Any legacy path move, archive, delete, target-path decision, or classification change |
| Recovered branch reality | Branch and stack decision memory | `docs/technical/recovered-branch-reality.md` | `git show --stat backup/local-supabase-wip-2026-05-08` | Any decision about Supabase WIP, Firebase/Firestore migration, or project identity |
| Firebase/Firestore translation | Target remote projection architecture | `specs/firebase-firestore-projection-migration.md` | `rg -n "Supabase|Firebase|Firestore|Cloud Functions|GitHub repository|local clone" specs docs/technical README.md` | Any Firebase/Auth/Firestore/Cloud Functions implementation or Supabase WIP recovery |
| Supabase-to-Firebase contract map | Recovered WIP contract extraction | `docs/technical/supabase-to-firebase-contract-map.md` | `rg -n "Contract Mapping|Security Rule Requirements|Cloud Function Requirements" docs/technical/supabase-to-firebase-contract-map.md` | Any recovery of Supabase WIP behavior into Firebase architecture |
| Foundational architecture | Canonical project/clone/projection decisions | `docs/technical/shipflow-foundational-architecture.md` | `rg -n "project.*GitHub|managed clone|Firestore|GitHub wins" docs/technical/shipflow-foundational-architecture.md` | Any project onboarding, indexing, Firestore, GitHub auth, clone management, or write-back design |
| Foundational specs handoff | Close-context summary and coherence-review checklist for foundational specs | `docs/technical/foundational-specs-handoff.md` | `rg -n "Current Decision Set|Foundational Specs|Coherence Review Checklist" docs/technical/foundational-specs-handoff.md` | Any foundational spec added, superseded, or materially changed before coherence review |
| GitHub managed clone indexer | Runner/indexer boundary for GitHub access, clone materialization, Markdown indexing, and Firestore projection | `specs/shipflow-github-managed-clone-indexer.md` | `rg -n "managed clone|indexRepository|Firestore projection|GitHub wins|sourceCommit" specs/shipflow-github-managed-clone-indexer.md docs/technical` | Any Cloud Functions, GitHub App, clone runner, Markdown indexer, or Firestore projection implementation |
| Firestore data model | Foundational Firestore schema for users, shared GitHub projects, memberships, Markdown projections, index runs, diagnostics, and cross-project views | `specs/shipflow-firestore-data-model.md` | `rg -n "users/\\{uid\\}|projects/\\{projectId\\}|sourceCommit|owner|viewer|indexRuns|projectRefs|feedItems" specs/shipflow-firestore-data-model.md docs/technical` | Any Firestore schema, Firebase Auth identity, project membership, projection, dashboard feed, or security-rule implementation |
| Auth and GitHub access | Separation of Firebase Auth identity, GitHub App repository authorization, backend-only installations, and access-loss behavior | `specs/shipflow-auth-github-access.md` | `rg -n "Firebase Auth|GitHub App|githubInstallations|installation token|github_access_lost|trusted backend" specs/shipflow-auth-github-access.md docs/technical` | Any auth provider, GitHub App, repository access, installation metadata, membership sync, or access-loss UI implementation |
| Project onboarding flow | User-visible flow for sign-in, GitHub App connection, repo selection, project create-or-join, indexing progress, and recoverable setup errors | `specs/shipflow-project-onboarding-flow.md` | `rg -n "needs_github_connection|select_repository|creating_or_joining_project|indexing_project|ready|createOrJoinProject" specs/shipflow-project-onboarding-flow.md docs/technical` | Any onboarding route, first-run UI, repo picker, setup progress, project creation/join, or setup error behavior |
| Markdown artifact governance | Canonical `shipflow_data/` corpus, artifact families, tracker/frontmatter parsing, ignore rules, and safe Markdown indexing | `specs/shipflow-markdown-artifact-governance.md` | `rg -n "shipflow_data|ShipFlow_Data|artifactFamily|tracker|frontmatter|governance_corpus_missing" specs/shipflow-markdown-artifact-governance.md docs/technical` | Any Markdown source reader, artifact classifier, tracker parser, docs corpus bootstrap, projection metadata, or ignore/redaction policy |
| Dashboard read-only projection | Dashboard read model for user-scoped Firestore projection, artifact groups, freshness, access warnings, diagnostics, and index status | `specs/shipflow-dashboard-readonly-projection.md` | `rg -n "projectRefs|feedItems|indexedFiles|indexRuns|diagnostics|access-lost|read-only" specs/shipflow-dashboard-readonly-projection.md docs/technical` | Any ShipFlow dashboard route, provider, Firestore query, projection DTO, artifact detail, diagnostics panel, stale/access-lost state, or refresh affordance |

## Non-Coverage

- Firebase, Firestore, Firebase Auth, FastAPI, terminal web, agent runner, BYOK OpenRouter, and feedback implementation are not covered by active technical docs yet because they are future specs.
- Existing ContentFlow specs are not active ShipFlow implementation contracts until classified.

## Invariants

- Each broad code mutation must update this map when it changes ownership, runtime exposure, validation, or documentation triggers.
- Legacy code remains visible in the map until it is archived or removed by a later ready spec.

## Validation

```bash
rg -n "Maintenance Rule|Validation|Owned Files|Entrypoints" docs/technical
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md TASKS.md CONTENT_MAP.md docs specs lib test
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
