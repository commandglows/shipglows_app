---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.6.0"
project: "shipglowz_app"
created: "2026-05-08"
updated: "2026-08-02"
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
  - "shipglowz_data/technical/"
  - "shipglowz_data/workflow/specs/"
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "Repo scan on 2026-05-08"
  - "shipglowz_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipglowz-inventory.md"
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Code Docs Map

## Purpose

This map links code areas to their primary technical documentation, validation commands, and documentation update triggers. It is intentionally conservative while the ContentFlow legacy runtime is still embedded.

## Owned Files

- `shipglowz_data/technical/code-docs-map.md`

## Entrypoints

- `lib/main.dart`
- `lib/shipglowz/app.dart`
- `lib/shipglowz/router.dart`
- `lib/router.dart`
- `test/widget_test.dart`

## Map

| Code area | Current role | Primary doc | Validation | Update trigger |
| --- | --- | --- | --- | --- |
| `lib/main.dart` | Runtime target switch and optional public Supabase bootstrap | `shipglowz_data/technical/runtime-boundary.md` | `flutter analyze && flutter test test/shipglowz/auth/auth_provider_test.dart` | Any change to app boot, target names, public auth configuration, or provider overrides |
| `lib/shipglowz/` | Active ShipGlowz UI runtime | `shipglowz_data/technical/runtime-boundary.md` | `flutter test test/widget_test.dart` | Any dashboard route, screen, or provider behavior change |
| `lib/shipglowz/auth/**` + `test/shipglowz/auth/**` | Provider-neutral identity/session adapter; Supabase is optional first implementation | `shipglowz_data/technical/managed-runner-foundation.md` and `shipglowz_data/technical/runtime-boundary.md` | `flutter analyze && flutter test test/shipglowz/auth/auth_provider_test.dart` | Any authentication provider, session refresh, compile-time configuration, identity mapping, token use, or platform auth behavior change |
| `lib/shipglowz/data/managed_runner_api.dart` + `lib/shipglowz/providers/managed_runner_provider.dart` + `lib/shipglowz/providers/managed_conversation_provider.dart` + `lib/shipglowz/providers/managed_project_identity_provider.dart` + `lib/shipglowz/presentation/widgets/managed_conversation_panel.dart` + `lib/shipglowz/presentation/screens/project_detail_screen.dart` + `lib/shipglowz/router.dart` + matching tests | Typed Flutter client and first project-detail conversation surface for the managed runner: authenticated commands, durable idempotency headers, approval decisions, semantic event state, authenticated cursor/SSE parsing, and fail-closed opaque project identity routing resolved from the authenticated project projection | `shipglowz_data/technical/managed-runner-foundation.md` and `shipglowz_data/workflow/specs/shipglowz-managed-codex-cockpit-mvp.md` | `flutter analyze && flutter test test/shipglowz/data/managed_runner_api_test.dart test/shipglowz/providers/managed_conversation_provider_test.dart test/shipglowz/providers/managed_project_identity_provider_test.dart` | Any runner API path, conversation state/action, approval UX, auth-token attachment, SSE resume behavior, or project identity mapping change |
| `lib/data/shipglowz_sources/` | Active Markdown/source readers | `shipglowz_data/technical/markdown-source-of-truth.md` | `flutter test test/data/shipglowz_sources` | Any parser, allowlist, diagnostics, source file rule, or operational record grammar change |
| `lib/domain/project_health/` | Active project health model | `shipglowz_data/technical/markdown-source-of-truth.md` | `flutter test test/domain/project_health` | Any project posture, next-command, or health scoring change |
| `runner/src/` + `runner/test/` | Managed TypeScript control-plane foundation: neutral agent contracts, loopback API bootstrap, JWKS-backed Supabase auth, tenant-scoped canonical project identity resolution, GitHub App repository revalidation, secret-safe Git mirrors/worktrees, durable projections and async idempotency for conversation/audit/fix/approval commands, Codex app-server adapter, conversation command service, audit command, isolated GitHub/worktree fix executor, approval decision service, cleanup worker, cursor-based SSE replay, tenant-scoped live fan-out, Origin policy, run admission and timeout reconciliation | `shipglowz_data/technical/managed-runner-foundation.md` | `cd ../runner && npm test && npm run typecheck && npm run lint && npm run audit` | Any runtime adapter, API/event schema, identity-directory binding, auth/access rule, GitHub App policy, workspace capability, persistence, secret/redaction, or execution-provider change |
| `/home/claude/shipglowz/tui` | ShipGlowz-owned terminal dashboard (Bun/OpenTUI), read-only V1 | `/home/claude/shipglowz/shipglowz_data/technical/terminal-tui.md` | `cd /home/claude/shipglowz/tui && bun run typecheck && bun test` | Any source policy, reader/parser, operational record grammar, view-model, OpenTUI lifecycle, or keyboard navigation change |
| Operational record grammar | Shared task/audit/spec source-line contract | `/home/claude/shipglowz/skills/references/operational-record-format.md` and `shipglowz_data/technical/markdown-source-of-truth.md` | `python3 /home/claude/shipglowz/tools/shipglowz_metadata_lint.py /home/claude/shipglowz/skills/references/operational-record-format.md shipglowz_data/technical/markdown-source-of-truth.md shipglowz_data/technical/code-docs-map.md` | Any change to traffic markers, required fields, escaping, dedupe, diagnostics, legacy compatibility, or writer obligations |
| Operational record migration + web-reader contract | Live canonicalization and shared web-read model for future projections | `shipglowz_data/technical/operational-record-web-reader-contract.md` | `python3 scripts/migrate_operational_records.py --dry-run` and `python3 scripts/migrate_operational_records.py --write --check-only` | Any change to live migration gates, zero-unmapped/duplicate policy, legacy-table removal behavior, or `scripts/migrate_operational_records.py` |
| Flutter operational record parsers | Canonical-first parsing for task, audit, and spec summary records | `shipglowz_data/technical/markdown-source-of-truth.md` | `flutter test test/data/shipglowz_sources` | Any change under `lib/data/shipglowz_sources/parsers/` that parses traffic-first records, fallback legacy tables, diagnostics, source locations, or dedupe |
| TUI operational record readers | Read-only terminal consumption of canonical records plus legacy fallback | `/home/claude/shipglowz/shipglowz_data/technical/terminal-tui.md` and `/home/claude/shipglowz/skills/references/operational-record-format.md` | `cd /home/claude/shipglowz/tui && bun test && bun run typecheck` | Any change under `/home/claude/shipglowz/tui/src/sources/` that reads, filters, dedupes, displays, or normalizes task/audit/spec records |
| Operational record migration tooling | Deterministic conversion of legacy trackers and active spec summaries | `shipglowz_data/technical/markdown-source-of-truth.md` and `/home/claude/shipglowz/skills/references/operational-record-format.md` | `python3 scripts/migrate_operational_records.py --dry-run` | Any migration script, checklist, dry-run report, record-count proof, duplicate handling, or live tracker migration |
| ShipGlowz writer-skill references | Shared writer instructions for task, audit, and spec operational records | `/home/claude/shipglowz/skills/references/operational-record-format.md` | `rg -n "operational-record-format|task:|audit:|spec:" /home/claude/shipglowz/skills` | Any skill or skill reference that creates or mutates `TASKS.md`, `AUDIT_LOG.md`, spec summaries, spec status, or chantier flow records |
| `lib/core/` | Mixed shared and legacy utilities | `shipglowz_data/technical/legacy-contentflow-inventory.md` | `flutter test test/core` | Any auth, BYOK, diagnostics, settings, or validation change |
| Product entitlement gate | Local product-access contract separating identity, GitHub access, cache, and entitlement truth | `shipglowz_data/technical/product-entitlements.md`, `shipglowz_data/technical/product-entitlement-bridge-contract.md`, and `shipglowz_data/technical/product-entitlements-support-runbook.md` | `flutter test test/data/models/app_entitlement_test.dart test/core/app_access_resume_test.dart` | Any `shipglowz_app` entitlement snapshot, `AppAccessState`, bootstrap parsing, open-access, cache authorization, support diagnostics, or suite bridge contract change |
| `lib/data/models/` | Mixed shared and legacy models | `shipglowz_data/technical/legacy-contentflow-inventory.md`; entitlement-specific model owned by `shipglowz_data/technical/product-entitlements.md` | `flutter test test/data test/core` | Any model reused by active ShipGlowz or future features |
| `lib/data/services/` | Mostly legacy service layer | `shipglowz_data/technical/legacy-contentflow-inventory.md`; bootstrap entitlement boundary owned by `shipglowz_data/technical/product-entitlement-bridge-contract.md` | `flutter test test/data` | Any API, auth, feedback, storage, offline, notification, bootstrap, or entitlement snapshot parsing change |
| `lib/presentation/` | Legacy ContentFlow UI runtime plus reusable primitives | `shipglowz_data/technical/legacy-contentflow-inventory.md` | `flutter test test/presentation` | Any route, screen, theme, widget, or product flow classification |
| `site` + `app UI` | Shared visual governance for both website and Flutter UI | `shipglowz_data/technical/design-system-authority.md` | `python3 /home/claude/shipglowz/tools/design_system_drift_check.py --changed --warn-only --root /home/claude/shipglowz_app` puis `rg -n "design_system_authority" shipglowz_data/technical/design-system-authority.md` | Toute évolution visuelle production, tokens, ou migration vers token carriers |
| `lib/providers/providers.dart` | Legacy provider graph | `shipglowz_data/technical/legacy-contentflow-inventory.md` | `flutter test test/core test/presentation` | Any provider split, archive, or future ShipGlowz reuse |
| `lib/router.dart` | Legacy route graph | `shipglowz_data/technical/runtime-boundary.md` | `rg -n "GoRoute|appRouterProvider|LegacyShipGlowzApp" lib/router.dart lib/main.dart` | Any route added, removed, or exposed from the legacy target |
| `web_auth/` | Legacy Clerk web auth assets | `shipglowz_data/technical/legacy-contentflow-inventory.md` | `rg -n "CLERK|sign-in|sso-callback" web_auth scripts README.md` | Any auth provider decision or web build route change |
| `shipglowz_data/workflow/specs/` | Mixed active and legacy specs | `shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md` | `rg -n "contentflow|ContentFlow|ShipGlowz" shipglowz_data/workflow/specs` | Any spec archive, rename, or activation decision |
| Legacy reuse roadmap | Product/technical decision aid | `shipglowz_data/technical/shipglowz-legacy-reuse-roadmap.md` | `rg -n "Decision question|Recommended direction" shipglowz_data/technical/shipglowz-legacy-reuse-roadmap.md` | Any user decision about auth, feedback, BYOK, onboarding, FastAPI, runner, or pipeline |
| Legacy file migration tracking | Operational tracker for keep/adapt/move/archive/delete status across legacy files and shipglowz_data/workflow/specs | `shipglowz_data/technical/legacy-file-migration-tracker.md` | `rg -n "Current path|Target path|Migration status|Decision source|Validation|blocked-needs-spec" shipglowz_data/technical/legacy-file-migration-tracker.md` | Any legacy path move, archive, delete, target-path decision, or classification change |
| Recovered branch reality | Branch and stack decision memory | `shipglowz_data/technical/recovered-branch-reality.md` | `git show --stat backup/local-supabase-wip-2026-05-08` | Any decision about Supabase WIP, Firebase/Firestore migration, or project identity |
| Firebase/Firestore translation | Target remote projection architecture | `shipglowz_data/workflow/specs/firebase-firestore-projection-migration.md` | `rg -n "Supabase|Firebase|Firestore|Cloud Functions|GitHub repository|local clone" shipglowz_data/workflow/specs shipglowz_data/technical README.md` | Any Firebase/Auth/Firestore/Cloud Functions implementation or Supabase WIP recovery |
| Supabase-to-Firebase contract map | Recovered WIP contract extraction | `shipglowz_data/technical/supabase-to-firebase-contract-map.md` | `rg -n "Contract Mapping|Security Rule Requirements|Cloud Function Requirements" shipglowz_data/technical/supabase-to-firebase-contract-map.md` | Any recovery of Supabase WIP behavior into Firebase architecture |
| Foundational architecture | Canonical project/clone/projection decisions | `shipglowz_data/technical/shipglowz-foundational-architecture.md` | `rg -n "project.*GitHub|managed clone|Firestore|GitHub wins" shipglowz_data/technical/shipglowz-foundational-architecture.md` | Any project onboarding, indexing, Firestore, GitHub auth, clone management, or write-back design |
| Foundational specs handoff | Close-context summary and coherence-review checklist for foundational specs | `shipglowz_data/technical/foundational-specs-handoff.md` | `rg -n "Current Decision Set|Foundational Specs|Coherence Review Checklist" shipglowz_data/technical/foundational-specs-handoff.md` | Any foundational spec added, superseded, or materially changed before coherence review |
| Foundational coherence gate | Canonical cross-spec gate for auth, onboarding, indexer, Markdown governance, Firestore projection, dashboard, security controls, and state vocabulary | `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md` | `rg -n "Coherence Contract Matrix|Canonical State Vocabulary|Mandatory Security Controls|Coherence Failure Gates" shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md` | Any foundational implementation, readiness decision, state vocabulary change, auth/access contract change, dashboard projection change, or cross-spec security correction |
| GitHub managed clone indexer | Runner/indexer boundary for GitHub access, clone materialization, Markdown indexing, local fake runner tests, and Firestore projection | `shipglowz_data/technical/github-managed-clone-indexer.md` | `flutter test test/data/firestore_projection test/data/shipglowz_sources test/shipglowz/data` | Any Cloud Functions, GitHub App, clone runner, Markdown indexer, local fake runner, repository interface, or Firestore projection implementation |
| Firestore data model | Foundational Firestore schema and Dart projection contracts for users, shared GitHub projects, memberships, Markdown projections, index runs, diagnostics, and cross-project views | `shipglowz_data/technical/firestore-data-model.md` | `rg -n "users/\\{uid\\}|projects/\\{projectId\\}|sourceCommit|owner|viewer|indexRuns|projectRefs|feedItems" shipglowz_data/technical/firestore-data-model.md lib/data/firestore_projection test/data/firestore_projection` | Any Firestore schema, Firebase Auth identity, project membership, projection, dashboard feed, path builders, or security-rule implementation |
| Product access mirror | Future server-owned `suiteAccess` or equivalent mirror for product entitlement checks before protected Firestore data | `shipglowz_data/technical/product-entitlements.md` and `shipglowz_data/technical/firestore-data-model.md` | `rg -n "suiteAccess|product entitlement|shipglowz_app|server-owned mirror|grantsAccess" shipglowz_data/technical/firestore-data-model.md shipglowz_data/technical/product-entitlements.md` | Any Firestore rules, mirror schema, product access projection, or dashboard protected read/write implementation |
| Auth and GitHub access | Separation of Firebase Auth identity, GitHub App repository authorization, backend-only installations, and access-loss behavior | `shipglowz_data/workflow/specs/shipglowz-auth-github-access.md` | `rg -n "Firebase Auth|GitHub App|githubInstallations|installation token|github_access_lost|trusted backend" shipglowz_data/workflow/specs/shipglowz-auth-github-access.md shipglowz_data/technical` | Any auth provider, GitHub App, repository access, installation metadata, membership sync, or access-loss UI implementation |
| Project onboarding flow | User-visible flow for sign-in, GitHub App connection, repo selection, project create-or-join, indexing progress, and recoverable setup errors | `shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md` | `rg -n "needs_github_connection|select_repository|creating_or_joining_project|indexing_project|ready|createOrJoinProject" shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md shipglowz_data/technical` | Any onboarding route, first-run UI, repo picker, setup progress, project creation/join, or setup error behavior |
| Markdown artifact governance | Canonical `shipglowz_data/` corpus, artifact families, tracker/frontmatter parsing, ignore rules, and safe Markdown indexing | `shipglowz_data/workflow/specs/shipglowz-markdown-artifact-governance.md` | `rg -n "shipglowz_data|ShipGlowz_Data|artifactFamily|tracker|frontmatter|governance_corpus_missing" shipglowz_data/workflow/specs/shipglowz-markdown-artifact-governance.md shipglowz_data/technical` | Any Markdown source reader, artifact classifier, tracker parser, shipglowz_data corpus bootstrap, projection metadata, or ignore/redaction policy |
| Dashboard read-only projection | Dashboard read model for user-scoped Firestore projection, artifact groups, freshness, access warnings, diagnostics, and index status | `shipglowz_data/technical/dashboard-readonly-projection.md` and `shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md` | `flutter test test/shipglowz/data/dashboard_readonly_projection_repository_test.dart` | Any ShipGlowz dashboard route, provider, Firestore query, projection DTO, artifact detail, diagnostics panel, stale/access-lost state, or refresh affordance |

## Non-Coverage

- Firebase, Firestore, terminal web, BYOK OpenRouter, and feedback implementation are not covered by active technical docs yet because they are future specs. The managed runner foundation is documented separately; no live provider or terminal capability is active yet.
- Existing ContentFlow specs are not active ShipGlowz implementation contracts until classified.

## Invariants

- Each broad code mutation must update this map when it changes ownership, runtime exposure, validation, or documentation triggers.
- Legacy code remains visible in the map until it is archived or removed by a later ready spec.

## Validation

```bash
rg -n "Maintenance Rule|Validation|Owned Files|Entrypoints" shipglowz_data/technical
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglowz_data/workflow/TASKS.md shipglowz_data/editorial/content-map.md shipglowz_data/technical shipglowz_data/workflow/specs lib test
flutter test
flutter analyze
```

## Reader Checklist

- Is every major code area represented or explicitly excluded?
- Does every mapped area have a primary doc?
- Are validation commands scoped enough to run during normal chantier work?
- Are legacy and active runtime areas clearly separated?

## Maintenance Rule

Update this file whenever a code path changes status between active ShipGlowz, shared/adapted, legacy reference, parked, archived, or removed.
