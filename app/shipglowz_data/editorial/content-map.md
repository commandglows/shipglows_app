---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-04-26"
updated: "2026-05-30"
status: "draft"
source_skill: sf-docs
scope: content_map
owner: "Diane"
confidence: "medium"
risk_level: "high"
docs_impact: "yes"
security_impact: "yes"
evidence:
  - "README.md"
  - "lib/main.dart"
  - "lib/shipglowz/"
  - "lib/data/shipglowz_sources/"
  - "shipglowz_data/technical/code-docs-map.md"
  - "shipglowz_data/technical/legacy-contentflow-inventory.md"
  - "shipglowz_data/technical/legacy-file-migration-tracker.md"
  - "shipglowz_data/technical/product-entitlements.md"
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
  - "shipglowz_data/technical/code-docs-map.md@0.1.0"
supersedes:
  - "shipglowz_data/editorial/content-map.md@1.0.0 contentflow_app map"
content_surfaces:
  - "ShipGlowz Flutter dashboard runtime"
  - "ShipGlowz Markdown/source readers"
  - "Project technical governance shipglowz_data"
  - "Specs and exploration reports"
  - "Legacy ContentFlow runtime retained for classification"
next_review: "2026-06-08"
next_step: "/sf-docs update"
---

# Content Map - shipglowz_app

## Purpose Of This Map

`shipglowz_app` is the Flutter app repository for ShipGlowz operational visibility. ShipGlowz is the active product. Legacy ContentFlow code and docs remain in the repository as migration/reference material until each area is classified.

## Active Runtime Surfaces

### ShipGlowz App

- `lib/main.dart`: root app selection. Defaults to `APP_TARGET=shipglowz`.
- `lib/shipglowz/app.dart`: active ShipGlowz app shell.
- `lib/shipglowz/router.dart`: active ShipGlowz routes.
- `lib/shipglowz/presentation/**`: active ShipGlowz dashboard screens and widgets.
- `lib/shipglowz/providers/dashboard_provider.dart`: active dashboard state boundary.

### ShipGlowz Source And Domain Surfaces

- `lib/data/shipglowz_sources/**`: Markdown and ledger source readers/parsers.
- `lib/domain/project_health/**`: project posture and health model.
- `test/data/shipglowz_sources/**`: source reader/parser tests.
- `test/domain/project_health/**`: project health tests.

## Governance Surfaces

- `README.md`: public-ish local setup and current product scope.
- `shipglowz_data/editorial/content-map.md`: this map.
- `shipglowz_data/technical/README.md`: technical documentation entrypoint.
- `shipglowz_data/technical/code-docs-map.md`: code area to documentation map.
- `shipglowz_data/technical/runtime-boundary.md`: active versus legacy runtime rule.
- `shipglowz_data/technical/markdown-source-of-truth.md`: Markdown canonical data contract.
- `shipglowz_data/technical/legacy-contentflow-inventory.md`: classification table for retained legacy areas.
- `shipglowz_data/technical/legacy-file-migration-tracker.md`: operational tracker for legacy file keep/adapt/move/archive/delete status.
- `shipglowz_data/technical/shipglowz-legacy-reuse-roadmap.md`: decision aid for reusing legacy ideas safely.
- `shipglowz_data/technical/recovered-branch-reality.md`: durable memory of branch reality and Supabase WIP to Firebase/Firestore translation.
- `shipglowz_data/technical/supabase-to-firebase-contract-map.md`: contract map for translating Supabase WIP into Firebase/Firestore architecture.
- `shipglowz_data/technical/shipglowz-foundational-architecture.md`: canonical architecture decisions for GitHub projects, managed clones, Firestore projection, and read-only V1.
- `shipglowz_data/technical/firestore-data-model.md`: Firestore schema contract for user/project records, memberships, indexed file projection, index runs, diagnostics, and user-scoped views.
- `shipglowz_data/technical/github-managed-clone-indexer.md`: trusted runner contract for GitHub App access, managed clone indexing, local fake runner behavior, diagnostics, and production security requirements.
- `shipglowz_data/technical/dashboard-readonly-projection.md`: dashboard read-model contract for user-scoped project refs, artifact summaries, diagnostics, index runs, filters, sorting, and no-write projection behavior.
- `shipglowz_data/technical/product-entitlements.md`: product access contract for `product_id=shipglowz_app`, suite ledger adaptation, fail-closed cache/open-access rules, and support-safe diagnostics.
- `shipglowz_data/technical/product-entitlement-bridge-contract.md`: future trusted backend to WinFlowz suite entitlement snapshot contract.
- `shipglowz_data/technical/product-entitlements-support-runbook.md`: support flow for recognized users without active ShipGlowz access, revoked/refunded/expired/pending states, wrong environment, and redaction.
- `shipglowz_data/technical/foundational-specs-handoff.md`: close-context handoff for the foundational specs and the next coherence review.
- `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md`: canonical cross-spec readiness gate for foundational auth, onboarding, indexer, Markdown governance, Firestore projection, dashboard, security controls, and state vocabulary.
- `shipglowz_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipglowz-inventory.md`: source exploration report.
- `shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md`: active migration/fusion chantier spec.
- `shipglowz_data/workflow/specs/firebase-firestore-projection-migration.md`: active Firebase/Firestore translation spec for recovered Supabase WIP.
- `shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md`: runner/indexer spec for GitHub access, managed clone materialization, Markdown indexing, and Firestore projection.
- `shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md`: foundational Firestore schema chantier spec that owns model decisions and implementation tasks.
- `shipglowz_data/workflow/specs/shipglowz-auth-github-access.md`: foundational auth/access spec separating Firebase Auth identity from GitHub App repository authorization.
- `shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md`: foundational user flow for Firebase sign-in, GitHub App connection, repository selection, project create-or-join, and indexing progress.
- `shipglowz_data/workflow/specs/shipglowz-markdown-artifact-governance.md`: foundational corpus spec for `shipglowz_data/`, artifact families, tracker parsing, frontmatter extraction, and safe Markdown indexing.
- `shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md`: foundational dashboard read model for consuming Firestore project refs, artifact projection, freshness, access warnings, diagnostics, and index status without making Firestore canonical.

## Legacy And Reference Surfaces

These surfaces are not active ShipGlowz product contracts. They are retained for review and possible reuse.

- `lib/router.dart`: legacy ContentFlow route graph, only selected by `APP_TARGET=legacy` or `APP_TARGET=contentflow`.
- `lib/providers/providers.dart`: legacy provider graph.
- `lib/presentation/**`: legacy ContentFlow UI plus some reusable primitives.
- `lib/data/services/**`: legacy service layer including API, auth, feedback, offline/cache, notifications.
- `lib/data/models/**`: mixed legacy and reusable model shapes.
- `lib/core/**`: mixed shared utilities and legacy guards.
- `web_auth/**`: legacy Clerk web auth pages.
- `shipglowz_data/workflow/specs/*.md`: mixed legacy specs; active status must be classified before implementation.
- `shipglowz_data/technical/auth-sync-v2.md`: legacy/future auth-sync note, not an active implementation contract.

The canonical classification source is `shipglowz_data/technical/legacy-contentflow-inventory.md`. The operational move/archive/delete tracker is `shipglowz_data/technical/legacy-file-migration-tracker.md`.

## Source Inputs

ShipGlowz currently reads local Markdown and ledger sources, including:

- `/home/claude/shipglowz_data/PROJECTS.md`
- `/home/claude/shipglowz_data/AUDIT_LOG.md`
- `/home/claude/shipglowz_data/TASKS.md`
- `/home/claude/shipglowz_data/OPERATIONS_LOG.md`
- `/home/claude/shipglowz_data/DEPENDENCY_LOG.md`
- `/home/claude/shipglowz/shipglowz_data/workflow/specs/*.md`
- Project-local shipglowz_data when listed in ShipGlowz project registries.

Markdown and repository files are the source of truth. Future database work is a projection/index/sync layer unless a later reviewed spec supersedes that contract.

## Public And Editorial Surfaces

This repository currently has no separate marketing site, blog, pricing page, or public content collection. `README.md` is the main public-facing documentation surface. If public pages are added, run `/sf-docs editorial`.

## Security-Sensitive Surfaces

- Path allowlists and diagnostics in `lib/data/shipglowz_sources/**`.
- Future auth surfaces in legacy `web_auth/**` and `lib/data/services/clerk_auth_service*`.
- Product entitlement surfaces in `AppAccessState`, bootstrap parsing, `OPEN_ACCESS`, Firestore `suiteAccess` mirror docs, and support diagnostics.
- Future BYOK/OpenRouter surfaces in `lib/core/openrouter_guard.dart`, `lib/data/models/openrouter_credential.dart`, and `lib/data/models/ai_runtime.dart`.
- Future terminal and agent-runner surfaces are not implemented and require a separate high-risk spec.

## Maintenance Rule

Update this file when a route, docs surface, source input, public surface, or active/legacy ownership boundary changes.
