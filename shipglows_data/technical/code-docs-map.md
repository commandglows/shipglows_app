---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-08"
updated: "2026-08-11"
status: active
source_skill: 300-sg-docs
scope: "code-docs-map"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/lib/"
  - "app/test/"
  - "shipglows_data/technical/"
  - "shipglows_data/workflow/specs/"
depends_on: []
supersedes:
  - "shipglows_data/technical/code-docs-map.md@0.14.0"
evidence:
  - "app/lib/main.dart has one product entrypoint: ShipGlowsApp."
  - "Task 9-10 Cockpit and semantic conversation surfaces are covered by Flutter tests."
next_review: "2026-09-11"
next_step: "/sg-docs technical audit"
---

# Code Docs Map

## Purpose

This map links current ShipGlows code areas to their primary technical documentation, validation commands, and documentation update triggers. Files outside the product entrypoint are not treated as a second runtime.

## Owned Files

- `shipglows_data/technical/code-docs-map.md`

## Entrypoints

- `app/lib/main.dart`
- `app/lib/shipglows/router.dart`
- `app/test/widget_test.dart`

## Map

| Code area | Current role | Primary doc | Validation | Update trigger |
| --- | --- | --- | --- | --- |
| `app/lib/main.dart` | Single ShipGlows product entrypoint and optional public Firebase bootstrap | `shipglows_data/technical/runtime-boundary.md` | `cd app && flutter analyze && flutter test test/widget_test.dart test/shipglows/auth/auth_provider_test.dart` | Any change to app boot, public auth configuration, or provider overrides |
| `app/lib/shipglows/` | ShipGlows Cockpit, project, conversation, and operator Workspace product runtime | `shipglows_data/technical/runtime-boundary.md` and `shipglows_data/technical/managed-runner-foundation.md` | `cd app && flutter test test/shipglows` | Any product route, screen, provider, managed API, Cockpit, conversation, or Workspace behavior change |
| `app/lib/shipglows/auth/**` + `app/test/shipglows/auth/**` | Provider-neutral identity/session adapter; Firebase Auth is the active implementation | `shipglows_data/technical/managed-runner-foundation.md` and `shipglows_data/technical/runtime-boundary.md` | `flutter analyze && flutter test app/test/shipglows/auth/auth_provider_test.dart` | Any authentication provider, session refresh, compile-time configuration, identity mapping, token use, or platform auth behavior change |
| `app/lib/shipglows/data/managed_runner_api.dart` + Cockpit/conversation/Workspace providers, screens, widgets, and matching tests | Typed server-first Cockpit, normalized semantic conversations with audit/fix controls, and a separate authorized operator Workspace; explicit local-only, empty, stale, access-lost, session-expired, reconnect, and error states | `shipglows_data/technical/managed-runner-foundation.md` and `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md` | `cd app && flutter analyze && flutter test` | Any runner API path, Cockpit projection, conversation event/action, approval UX, auth-token attachment, SSE/WebSocket behavior, project identity mapping, or interactive terminal rendering change |
| `app/lib/data/shipglows_sources/` | Active Markdown/source readers | `shipglows_data/technical/markdown-source-of-truth.md` | `flutter test app/test/data/shipglows_sources` | Any parser, allowlist, diagnostics, source file rule, or operational record grammar change |
| `app/lib/domain/project_health/` | Active project health model | `shipglows_data/technical/markdown-source-of-truth.md` | `flutter test app/test/domain/project_health` | Any project posture, next-command, or health scoring change |
| `runner/src/` + `runner/test/` + `runner/scripts/` | Managed TypeScript control plane, including JWKS auth, project authorization, runtime/repository orchestration, versioned skill/context provenance, durable projections, the authoritative five-dimensional health evaluator, closed liveness/authenticated diagnostics, online SQLite backup, semantic HTTP/SSE, and the separate short-lived operator gateway with fixed allowlisted tmux PTY, bounded WebSocket frames, owner-only closure and real Codex smoke | `shipglows_data/technical/managed-runner-foundation.md` and `shipglows_data/technical/operator-guides/managed-agent-runner.md` | `cd runner && npm test && npm run typecheck && npm run lint && npm run audit && npm run smoke:operator-workspace` | Any runtime adapter, API/event schema, diagnostic/build identity, backup/recovery procedure, skill/context contract, health evidence/projection rule, identity-directory binding, auth/access rule, GitHub App policy, PTY/operator-session capability, persistence, secret/redaction, or execution-provider change |
| Operator Workspace deployment and recovery | Server-only allowlist, loopback deployment, HTTPS/WebSocket publication, actor/project provisioning, smoke proof, reconnect and recovery | `shipglows_data/technical/operator-guides/operator-workspace.md` | `cd runner && npm run smoke:operator-workspace` plus hosted authenticated browser proof | Any Workspace environment variable, reverse-proxy route, capability lifetime, identity provisioning, reconnect, Neovim, platform proof, or incident procedure change |
| `/home/claude/shipglowz/tui` | ShipGlows-owned terminal dashboard (Bun/OpenTUI), read-only V1 | `/home/claude/shipglowz/shipglows_data/technical/terminal-tui.md` | `cd /home/claude/shipglowz/tui && bun run typecheck && bun test` | Any source policy, reader/parser, operational record grammar, view-model, OpenTUI lifecycle, or keyboard navigation change |
| Operational record grammar | Shared task/audit/spec source-line contract | `/home/claude/shipglowz/skills/references/operational-record-format.md` and `shipglows_data/technical/markdown-source-of-truth.md` | `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py /home/claude/shipglowz/skills/references/operational-record-format.md shipglows_data/technical/markdown-source-of-truth.md shipglows_data/technical/code-docs-map.md` | Any change to traffic markers, required fields, escaping, dedupe, diagnostics, legacy compatibility, or writer obligations |
| Operational record migration + web-reader contract | Live canonicalization and shared web-read model for future projections | `shipglows_data/technical/operational-record-web-reader-contract.md` | `python3 app/scripts/migrate_operational_records.py --dry-run` and `python3 app/scripts/migrate_operational_records.py --write --check-only` | Any change to live migration gates, zero-unmapped/duplicate policy, legacy-table removal behavior, or `app/scripts/migrate_operational_records.py` |
| Flutter operational record parsers | Canonical-first parsing for task, audit, and spec summary records | `shipglows_data/technical/markdown-source-of-truth.md` | `flutter test app/test/data/shipglows_sources` | Any change under `app/lib/data/shipglows_sources/parsers/` that parses traffic-first records, fallback legacy tables, diagnostics, source locations, or dedupe |
| TUI operational record readers | Read-only terminal consumption of canonical records plus legacy fallback | `/home/claude/shipglowz/shipglows_data/technical/terminal-tui.md` and `/home/claude/shipglowz/skills/references/operational-record-format.md` | `cd /home/claude/shipglowz/tui && bun test && bun run typecheck` | Any change under `/home/claude/shipglowz/tui/src/sources/` that reads, filters, dedupes, displays, or normalizes task/audit/spec records |
| Operational record migration tooling | Deterministic conversion of legacy trackers and active spec summaries | `shipglows_data/technical/markdown-source-of-truth.md` and `/home/claude/shipglowz/skills/references/operational-record-format.md` | `python3 app/scripts/migrate_operational_records.py --dry-run` | Any migration script, checklist, dry-run report, record-count proof, duplicate handling, or live tracker migration |
| ShipGlows writer-skill references | Shared writer instructions for task, audit, and spec operational records | `/home/claude/shipglowz/skills/references/operational-record-format.md` | `rg -n "operational-record-format|task:|audit:|spec:" /home/claude/shipglowz/skills` | Any skill or skill reference that creates or mutates `TASKS.md`, `AUDIT_LOG.md`, spec summaries, spec status, or chantier flow records |
| `app/lib/core/` | Shared utilities used only when imported by the ShipGlows entrypoint | `shipglows_data/technical/runtime-boundary.md` | `cd app && flutter test test/core` | Any diagnostics, settings, preference, or validation utility imported by ShipGlows |
| Product entitlement gate | Local product-access contract separating identity, GitHub access, cache, and entitlement truth | `shipglows_data/technical/product-entitlements.md`, `shipglows_data/technical/product-entitlement-bridge-contract.md`, and `shipglows_data/technical/product-entitlements-support-runbook.md` | `flutter test app/test/data/models/app_entitlement_test.dart app/test/core/app_access_resume_test.dart` | Any `shipglows_app` entitlement snapshot, `AppAccessState`, bootstrap parsing, open-access, cache authorization, support diagnostics, or suite bridge contract change |
| `app/lib/data/models/` | Dormant or narrowly shared models; not a parallel product model graph | `shipglows_data/technical/runtime-boundary.md`; entitlement-specific model owned by `shipglows_data/technical/product-entitlements.md` | `cd app && flutter test test/data test/core` | Any model integrated into ShipGlows |
| `app/lib/data/services/` | Dormant service modules outside the product entrypoint | `shipglows_data/technical/runtime-boundary.md`; bootstrap entitlement boundary owned by `shipglows_data/technical/product-entitlement-bridge-contract.md` | `cd app && flutter test test/data` | Any service proposed for direct ShipGlows integration |
| `app/lib/presentation/` | Canonical Flutter theme plus dormant UI modules outside the product entrypoint | `shipglows_data/technical/design-system-authority.md` and `shipglows_data/technical/runtime-boundary.md` | `cd app && flutter test test/presentation test/shipglows/theme` | Any shared theme change or dormant UI integration into ShipGlows |
| `site` + `app UI` | Separate platform carriers under one documented product/design direction | `shipglows_data/technical/design-system-authority.md` | `python3 /home/claude/shipglows/tools/design_system_drift_check.py --changed --warn-only --root /home/claude/shipglows_app` puis `rg -n "design_system_authority" shipglows_data/technical/design-system-authority.md` | Toute évolution visuelle production ou des carriers de tokens |
| `app/lib/providers/providers.dart`, `app/lib/router.dart`, `app/web_auth/` | Dormant modules outside the single ShipGlows entrypoint | `shipglows_data/technical/runtime-boundary.md` | `rg -n "providers/providers|appRouterProvider|web_auth" app/lib/main.dart app/lib/shipglows` | Any proposal to integrate one of these modules into ShipGlows |
| `shipglows_data/workflow/specs/` | Active ShipGlows chantier registry plus retained cross-product maintenance specs; archived ContentFlow contracts live outside this directory | `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md` and `shipglows_data/workflow/archives/contentflow-specs/README.md` | `rg -n "contentflow|ContentFlow|ShipGlows" shipglows_data/workflow/specs shipglows_data/workflow/archives/contentflow-specs/README.md` | Any spec archive, rename, or activation decision |
| Recovered branch reality | Branch and stack decision memory | `shipglows_data/technical/recovered-branch-reality.md` | `git show --stat backup/local-supabase-wip-2026-05-08` | Any decision about Supabase WIP, Firebase/Firestore migration, or project identity |
| Firebase/Firestore translation | Target remote projection architecture | `shipglows_data/workflow/specs/firebase-firestore-projection-migration.md` | `rg -n "Supabase|Firebase|Firestore|Cloud Functions|GitHub repository|local clone" shipglows_data/workflow/specs shipglows_data/technical README.md` | Any Firebase/Auth/Firestore/Cloud Functions implementation or Supabase WIP recovery |
| Supabase-to-Firebase contract map | Recovered WIP contract extraction | `shipglows_data/technical/supabase-to-firebase-contract-map.md` | `rg -n "Contract Mapping|Security Rule Requirements|Cloud Function Requirements" shipglows_data/technical/supabase-to-firebase-contract-map.md` | Any recovery of Supabase WIP behavior into Firebase architecture |
| Foundational architecture | Canonical project/clone/projection decisions | `shipglows_data/technical/shipglows-foundational-architecture.md` | `rg -n "project.*GitHub|managed clone|Firestore|GitHub wins" shipglows_data/technical/shipglows-foundational-architecture.md` | Any project onboarding, indexing, Firestore, GitHub auth, clone management, or write-back design |
| Foundational specs handoff | Close-context summary and coherence-review checklist for foundational specs | `shipglows_data/technical/foundational-specs-handoff.md` | `rg -n "Current Decision Set|Foundational Specs|Coherence Review Checklist" shipglows_data/technical/foundational-specs-handoff.md` | Any foundational spec added, superseded, or materially changed before coherence review |
| Foundational coherence gate | Canonical cross-spec gate for auth, onboarding, indexer, Markdown governance, Firestore projection, dashboard, security controls, and state vocabulary | `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md` | `rg -n "Coherence Contract Matrix|Canonical State Vocabulary|Mandatory Security Controls|Coherence Failure Gates" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md` | Any foundational implementation, readiness decision, state vocabulary change, auth/access contract change, dashboard projection change, or cross-spec security correction |
| GitHub managed clone indexer | Runner/indexer boundary for GitHub access, clone materialization, Markdown indexing, local fake runner tests, and Firestore projection | `shipglows_data/technical/github-managed-clone-indexer.md` | `flutter test app/test/data/firestore_projection app/test/data/shipglows_sources app/test/shipglows/data` | Any Cloud Functions, GitHub App, clone runner, Markdown indexer, local fake runner, repository interface, or Firestore projection implementation |
| Firestore data model | Foundational Firestore schema and Dart projection contracts for users, shared GitHub projects, memberships, Markdown projections, index runs, diagnostics, and cross-project views | `shipglows_data/technical/firestore-data-model.md` | `rg -n "users/\\{uid\\}|projects/\\{projectId\\}|sourceCommit|owner|viewer|indexRuns|projectRefs|feedItems" shipglows_data/technical/firestore-data-model.md app/lib/data/firestore_projection app/test/data/firestore_projection` | Any Firestore schema, Firebase Auth identity, project membership, projection, dashboard feed, path builders, or security-rule implementation |
| Product access mirror | Future server-owned `suiteAccess` or equivalent mirror for product entitlement checks before protected Firestore data | `shipglows_data/technical/product-entitlements.md` and `shipglows_data/technical/firestore-data-model.md` | `rg -n "suiteAccess|product entitlement|shipglows_app|server-owned mirror|grantsAccess" shipglows_data/technical/firestore-data-model.md shipglows_data/technical/product-entitlements.md` | Any Firestore rules, mirror schema, product access projection, or dashboard protected read/write implementation |
| Auth and GitHub access | Separation of Firebase Auth identity, GitHub App repository authorization, backend-only installations, and access-loss behavior | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | `rg -n "Firebase Auth|GitHub App|githubInstallations|installation token|github_access_lost|trusted backend" shipglows_data/workflow/specs/shipglows-auth-github-access.md shipglows_data/technical` | Any auth provider, GitHub App, repository access, installation metadata, membership sync, or access-loss UI implementation |
| Project onboarding flow | User-visible flow for sign-in, GitHub App connection, repo selection, project create-or-join, indexing progress, and recoverable setup errors | `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md` | `rg -n "needs_github_connection|select_repository|creating_or_joining_project|indexing_project|ready|createOrJoinProject" shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md shipglows_data/technical` | Any onboarding route, first-run UI, repo picker, setup progress, project creation/join, or setup error behavior |
| Markdown artifact governance | Canonical `shipglows_data/` corpus, artifact families, tracker/frontmatter parsing, ignore rules, and safe Markdown indexing | `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md` | `rg -n "shipglows_data|ShipGlows_Data|artifactFamily|tracker|frontmatter|governance_corpus_missing" shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md shipglows_data/technical` | Any Markdown source reader, artifact classifier, tracker parser, shipglows_data corpus bootstrap, projection metadata, or ignore/redaction policy |
| Dashboard read-only projection | Dashboard read model for user-scoped Firestore projection, artifact groups, freshness, access warnings, diagnostics, and index status | `shipglows_data/technical/dashboard-readonly-projection.md` and `shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md` | `flutter test app/test/shipglows/data/dashboard_readonly_projection_repository_test.dart` | Any ShipGlows dashboard route, provider, Firestore query, projection DTO, artifact detail, diagnostics panel, stale/access-lost state, or refresh affordance |

## Non-Coverage

- Firebase, Firestore, BYOK OpenRouter, and feedback implementation are not covered by current managed-runner truth unless explicitly wired through the ShipGlows runtime. The operator terminal capability is active on the loopback runner and server-smoke proven, but public authenticated browser delivery still lacks TLS routing and actor/project provisioning proof.
- Archived ContentFlow specs are historical references and cannot become active ShipGlows implementation contracts without a current adoption decision.

## Invariants

- Each broad code mutation must update this map when it changes ownership, runtime exposure, validation, or documentation triggers.
- Dormant code does not become a supported runtime through presence alone.

## Validation

```bash
rg -n "Maintenance Rule|Validation|Owned Files|Entrypoints" shipglows_data/technical
rg -n "APP_TARGET|LegacyShipGlowsApp" app/lib app/test
flutter test
flutter analyze
```

## Reader Checklist

- Is every major code area represented or explicitly excluded?
- Does every mapped area have a primary doc?
- Are validation commands scoped enough to run during normal chantier work?
- Is the single product entrypoint unambiguous?

## Maintenance Rule

Update this file whenever a code path becomes part of ShipGlows, becomes dormant, is archived, or is removed.
