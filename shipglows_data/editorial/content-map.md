---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "0.2.0"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-02"
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
  - "lib/shipglows/"
  - "lib/data/shipglows_sources/"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/technical/legacy-contentflow-inventory.md"
  - "shipglows_data/technical/legacy-file-migration-tracker.md"
  - "shipglows_data/technical/product-entitlements.md"
depends_on:
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md@0.1.0"
  - "shipglows_data/technical/code-docs-map.md@0.1.0"
supersedes:
  - "shipglows_data/editorial/content-map.md@1.0.0 contentflow_app map"
content_surfaces:
  - "ShipGlows Flutter dashboard runtime"
  - "ShipGlows Markdown/source readers"
  - "Project technical governance shipglows_data"
  - "Specs and exploration reports"
  - "Canonical ShipGlows public site under site/"
  - "Legacy ContentFlow runtime retained for classification"
next_review: "2026-09-02"
next_step: "/sf-docs update"
---

# Content Map - shipglows_app

## Purpose Of This Map

`shipglows_app` is the Flutter app repository for ShipGlows operational visibility. ShipGlows is the active product. Legacy ContentFlow code and docs remain in the repository as migration/reference material until each area is classified.

## Active Runtime Surfaces

### ShipGlows App

- `lib/main.dart`: root app selection. Defaults to `APP_TARGET=shipglows`.
- `lib/shipglows/app.dart`: active ShipGlows app shell.
- `lib/shipglows/router.dart`: active ShipGlows routes.
- `lib/shipglows/presentation/**`: active ShipGlows dashboard screens and widgets.
- `lib/shipglows/providers/dashboard_provider.dart`: active dashboard state boundary.

### ShipGlows Source And Domain Surfaces

- `lib/data/shipglows_sources/**`: Markdown and ledger source readers/parsers.
- `lib/domain/project_health/**`: project posture and health model.
- `test/data/shipglows_sources/**`: source reader/parser tests.
- `test/domain/project_health/**`: project health tests.

## Governance Surfaces

- `README.md`: public-ish local setup and current product scope.
- `shipglows_data/editorial/content-map.md`: this map.
- `shipglows_data/technical/README.md`: technical documentation entrypoint.
- `shipglows_data/technical/code-docs-map.md`: code area to documentation map.
- `shipglows_data/technical/runtime-boundary.md`: active versus legacy runtime rule.
- `shipglows_data/technical/markdown-source-of-truth.md`: Markdown canonical data contract.
- `shipglows_data/technical/legacy-contentflow-inventory.md`: classification table for retained legacy areas.
- `shipglows_data/technical/legacy-file-migration-tracker.md`: operational tracker for legacy file keep/adapt/move/archive/delete status.
- `shipglows_data/technical/shipglows-legacy-reuse-roadmap.md`: decision aid for reusing legacy ideas safely.
- `shipglows_data/technical/recovered-branch-reality.md`: durable memory of branch reality and Supabase WIP to Firebase/Firestore translation.
- `shipglows_data/technical/supabase-to-firebase-contract-map.md`: contract map for translating Supabase WIP into Firebase/Firestore architecture.
- `shipglows_data/technical/shipglows-foundational-architecture.md`: canonical architecture decisions for GitHub projects, managed clones, Firestore projection, and read-only V1.
- `shipglows_data/technical/firestore-data-model.md`: Firestore schema contract for user/project records, memberships, indexed file projection, index runs, diagnostics, and user-scoped views.
- `shipglows_data/technical/github-managed-clone-indexer.md`: trusted runner contract for GitHub App access, managed clone indexing, local fake runner behavior, diagnostics, and production security requirements.
- `shipglows_data/technical/dashboard-readonly-projection.md`: dashboard read-model contract for user-scoped project refs, artifact summaries, diagnostics, index runs, filters, sorting, and no-write projection behavior.
- `shipglows_data/technical/product-entitlements.md`: product access contract for `product_id=shipglows_app`, suite ledger adaptation, fail-closed cache/open-access rules, and support-safe diagnostics.
- `shipglows_data/technical/product-entitlement-bridge-contract.md`: future trusted backend to WinFlowz suite entitlement snapshot contract.
- `shipglows_data/technical/product-entitlements-support-runbook.md`: support flow for recognized users without active ShipGlows access, revoked/refunded/expired/pending states, wrong environment, and redaction.
- `shipglows_data/technical/foundational-specs-handoff.md`: close-context handoff for the foundational specs and the next coherence review.
- `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`: canonical cross-spec readiness gate for foundational auth, onboarding, indexer, Markdown governance, Firestore projection, dashboard, security controls, and state vocabulary.
- `shipglows_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipglows-inventory.md`: source exploration report.
- `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md`: active migration/fusion chantier spec.
- `shipglows_data/workflow/specs/firebase-firestore-projection-migration.md`: active Firebase/Firestore translation spec for recovered Supabase WIP.
- `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md`: runner/indexer spec for GitHub access, managed clone materialization, Markdown indexing, and Firestore projection.
- `shipglows_data/workflow/specs/shipglows-firestore-data-model.md`: foundational Firestore schema chantier spec that owns model decisions and implementation tasks.
- `shipglows_data/workflow/specs/shipglows-auth-github-access.md`: foundational auth/access spec separating Firebase Auth identity from GitHub App repository authorization.
- `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md`: foundational user flow for Firebase sign-in, GitHub App connection, repository selection, project create-or-join, and indexing progress.
- `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md`: foundational corpus spec for `shipglows_data/`, artifact families, tracker parsing, frontmatter extraction, and safe Markdown indexing.
- `shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md`: foundational dashboard read model for consuming Firestore project refs, artifact projection, freshness, access warnings, diagnostics, and index status without making Firestore canonical.

## Legacy And Reference Surfaces

These surfaces are not active ShipGlows product contracts. They are retained for review and possible reuse.

- `lib/router.dart`: legacy ContentFlow route graph, only selected by `APP_TARGET=legacy` or `APP_TARGET=contentflow`.
- `lib/providers/providers.dart`: legacy provider graph.
- `lib/presentation/**`: legacy ContentFlow UI plus some reusable primitives.
- `lib/data/services/**`: legacy service layer including API, auth, feedback, offline/cache, notifications.
- `lib/data/models/**`: mixed legacy and reusable model shapes.
- `lib/core/**`: mixed shared utilities and legacy guards.
- `web_auth/**`: legacy Clerk web auth pages.
- `shipglows_data/workflow/specs/*.md`: mixed legacy specs; active status must be classified before implementation.
- `shipglows_data/technical/auth-sync-v2.md`: legacy/future auth-sync note, not an active implementation contract.

The canonical classification source is `shipglows_data/technical/legacy-contentflow-inventory.md`. The operational move/archive/delete tracker is `shipglows_data/technical/legacy-file-migration-tracker.md`.

## Source Inputs

ShipGlows currently reads local Markdown and ledger sources, including:

- `/home/claude/shipglows_data/PROJECTS.md`
- `/home/claude/shipglows_data/AUDIT_LOG.md`
- `/home/claude/shipglows_data/TASKS.md`
- `/home/claude/shipglows_data/OPERATIONS_LOG.md`
- `/home/claude/shipglows_data/DEPENDENCY_LOG.md`
- `/home/claude/shipglowz/shipglows_data/workflow/specs/*.md`
- Project-local shipglows_data when listed in ShipGlows project registries.

Markdown and repository files are the source of truth. Future database work is a projection/index/sync layer unless a later reviewed spec supersedes that contract.

## Public And Editorial Surfaces

`site/` is the only canonical source for the ShipGlows public website. It owns the landing page, public documentation, FAQ, pricing hypothesis, contact and trust pages, install guidance, bilingual routes, blog articles, and public skill discovery.

The former `/home/claude/shipglowz/shipglows-site` source was moved into this repository on 2026-08-02. It is not a second authority and must not be recreated. The Vercel project metadata travels with `site/`; deployment configuration never changes source ownership by itself.

Public claims must remain aligned with reviewed ShipGlows business, product, GTM, and brand contracts. Roadmap capabilities must be labeled as in development rather than shipped behavior.

## Security-Sensitive Surfaces

- Path allowlists and diagnostics in `lib/data/shipglows_sources/**`.
- Future auth surfaces in legacy `web_auth/**` and `lib/data/services/clerk_auth_service*`.
- Product entitlement surfaces in `AppAccessState`, bootstrap parsing, `OPEN_ACCESS`, Firestore `suiteAccess` mirror docs, and support diagnostics.
- Future BYOK/OpenRouter surfaces in `lib/core/openrouter_guard.dart`, `lib/data/models/openrouter_credential.dart`, and `lib/data/models/ai_runtime.dart`.
- Future terminal and agent-runner surfaces are not implemented and require a separate high-risk spec.

## Maintenance Rule

Update this file when a route, docs surface, source input, public surface, or active/legacy ownership boundary changes.
