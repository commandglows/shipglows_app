---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-04-26"
updated: "2026-05-10"
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
  - "lib/shipflow/"
  - "lib/data/shipflow_sources/"
  - "docs/technical/code-docs-map.md"
  - "docs/technical/legacy-contentflow-inventory.md"
  - "docs/technical/legacy-file-migration-tracker.md"
depends_on:
  - "specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
  - "docs/technical/code-docs-map.md@0.1.0"
supersedes:
  - "CONTENT_MAP.md@1.0.0 contentflow_app map"
content_surfaces:
  - "ShipFlow Flutter dashboard runtime"
  - "ShipFlow Markdown/source readers"
  - "Project technical governance docs"
  - "Specs and exploration reports"
  - "Legacy ContentFlow runtime retained for classification"
next_review: "2026-06-08"
next_step: "/sf-docs update"
---

# Content Map - shipflow_app

## Purpose Of This Map

`shipflow_app` is the Flutter app repository for ShipFlow operational visibility. ShipFlow is the active product. Legacy ContentFlow code and docs remain in the repository as migration/reference material until each area is classified.

## Active Runtime Surfaces

### ShipFlow App

- `lib/main.dart`: root app selection. Defaults to `APP_TARGET=shipflow`.
- `lib/shipflow/app.dart`: active ShipFlow app shell.
- `lib/shipflow/router.dart`: active ShipFlow routes.
- `lib/shipflow/presentation/**`: active ShipFlow dashboard screens and widgets.
- `lib/shipflow/providers/dashboard_provider.dart`: active dashboard state boundary.

### ShipFlow Source And Domain Surfaces

- `lib/data/shipflow_sources/**`: Markdown and ledger source readers/parsers.
- `lib/domain/project_health/**`: project posture and health model.
- `test/data/shipflow_sources/**`: source reader/parser tests.
- `test/domain/project_health/**`: project health tests.

## Governance Surfaces

- `README.md`: public-ish local setup and current product scope.
- `CONTENT_MAP.md`: this map.
- `docs/technical/README.md`: technical documentation entrypoint.
- `docs/technical/code-docs-map.md`: code area to documentation map.
- `docs/technical/runtime-boundary.md`: active versus legacy runtime rule.
- `docs/technical/markdown-source-of-truth.md`: Markdown canonical data contract.
- `docs/technical/legacy-contentflow-inventory.md`: classification table for retained legacy areas.
- `docs/technical/legacy-file-migration-tracker.md`: operational tracker for legacy file keep/adapt/move/archive/delete status.
- `docs/technical/shipflow-legacy-reuse-roadmap.md`: decision aid for reusing legacy ideas safely.
- `docs/technical/recovered-branch-reality.md`: durable memory of branch reality and Supabase WIP to Firebase/Firestore translation.
- `docs/technical/supabase-to-firebase-contract-map.md`: contract map for translating Supabase WIP into Firebase/Firestore architecture.
- `docs/technical/shipflow-foundational-architecture.md`: canonical architecture decisions for GitHub projects, managed clones, Firestore projection, and read-only V1.
- `docs/technical/foundational-specs-handoff.md`: close-context handoff for the foundational specs and the next coherence review.
- `docs/explorations/2026-05-08-legacy-contentflow-shipflow-inventory.md`: source exploration report.
- `specs/shipflow-legacy-contentflow-fusion.md`: active migration/fusion chantier spec.
- `specs/firebase-firestore-projection-migration.md`: active Firebase/Firestore translation spec for recovered Supabase WIP.
- `specs/shipflow-github-managed-clone-indexer.md`: runner/indexer spec for GitHub access, managed clone materialization, Markdown indexing, and Firestore projection.
- `specs/shipflow-firestore-data-model.md`: foundational Firestore schema spec for users, shared GitHub projects, memberships, Markdown projections, index runs, diagnostics, and cross-project views.
- `specs/shipflow-auth-github-access.md`: foundational auth/access spec separating Firebase Auth identity from GitHub App repository authorization.
- `specs/shipflow-project-onboarding-flow.md`: foundational user flow for Firebase sign-in, GitHub App connection, repository selection, project create-or-join, and indexing progress.
- `specs/shipflow-markdown-artifact-governance.md`: foundational corpus spec for `shipflow_data/`, artifact families, tracker parsing, frontmatter extraction, and safe Markdown indexing.
- `specs/shipflow-dashboard-readonly-projection.md`: foundational dashboard read model for consuming Firestore project refs, artifact projection, freshness, access warnings, diagnostics, and index status without making Firestore canonical.

## Legacy And Reference Surfaces

These surfaces are not active ShipFlow product contracts. They are retained for review and possible reuse.

- `lib/router.dart`: legacy ContentFlow route graph, only selected by `APP_TARGET=legacy` or `APP_TARGET=contentflow`.
- `lib/providers/providers.dart`: legacy provider graph.
- `lib/presentation/**`: legacy ContentFlow UI plus some reusable primitives.
- `lib/data/services/**`: legacy service layer including API, auth, feedback, offline/cache, notifications.
- `lib/data/models/**`: mixed legacy and reusable model shapes.
- `lib/core/**`: mixed shared utilities and legacy guards.
- `web_auth/**`: legacy Clerk web auth pages.
- `specs/*.md`: mixed legacy specs; active status must be classified before implementation.
- `docs/auth-sync-v2.md`: legacy/future auth-sync note, not an active implementation contract.

The canonical classification source is `docs/technical/legacy-contentflow-inventory.md`. The operational move/archive/delete tracker is `docs/technical/legacy-file-migration-tracker.md`.

## Source Inputs

ShipFlow currently reads local Markdown and ledger sources, including:

- `/home/claude/shipflow_data/PROJECTS.md`
- `/home/claude/shipflow_data/AUDIT_LOG.md`
- `/home/claude/shipflow_data/TASKS.md`
- `/home/claude/shipflow_data/OPERATIONS_LOG.md`
- `/home/claude/shipflow_data/DEPENDENCY_LOG.md`
- `/home/claude/shipflow/specs/*.md`
- Project-local docs when listed in ShipFlow project registries.

Markdown and repository files are the source of truth. Future database work is a projection/index/sync layer unless a later reviewed spec supersedes that contract.

## Public And Editorial Surfaces

This repository currently has no separate marketing site, blog, pricing page, or public content collection. `README.md` is the main public-facing documentation surface. If public pages are added, run `/sf-docs editorial`.

## Security-Sensitive Surfaces

- Path allowlists and diagnostics in `lib/data/shipflow_sources/**`.
- Future auth surfaces in legacy `web_auth/**` and `lib/data/services/clerk_auth_service*`.
- Future BYOK/OpenRouter surfaces in `lib/core/openrouter_guard.dart`, `lib/data/models/openrouter_credential.dart`, and `lib/data/models/ai_runtime.dart`.
- Future terminal and agent-runner surfaces are not implemented and require a separate high-risk spec.

## Maintenance Rule

Update this file when a route, docs surface, source input, public surface, or active/legacy ownership boundary changes.
