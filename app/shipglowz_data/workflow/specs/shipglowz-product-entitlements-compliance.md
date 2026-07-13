---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.7"
project: "shipglowz_app"
created: "2026-05-30"
created_at: "2026-05-30 18:53:35 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 21:04:26 UTC"
status: active
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "product-entitlements-compliance"
owner: "Diane"
confidence: high
user_story: "En tant qu'operatrice de ShipGlowz App, je veux que l'acces produit soit verifie par un entitlement serveur pour product_id=shipglowz_app, afin qu'une session authentifiee, un acces GitHub ou un cache local ne puisse jamais accorder a lui seul l'acces aux donnees protegees."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "ShipGlowz App Flutter"
  - "ShipGlowz app access state"
  - "AppBootstrap"
  - "OPEN_ACCESS"
  - "Firestore projection target"
  - "WinFlowz suite ledger"
  - "suiteAccess mirror"
depends_on:
  - artifact: "/home/claude/shipglowz/skills/references/product-entitlements-playbook.md"
    artifact_version: "1.0.1"
    required_status: "active"
  - artifact: "/home/claude/winflowz/shipglowz_data/workflow/specs/unified-suite-authentication.md"
    artifact_version: "1.0.25"
    required_status: "active"
  - artifact: "shipglowz_data/workflow/specs/shipglowz-auth-github-access.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md"
    artifact_version: "1.0.0"
    required_status: "ready"
supersedes: []
evidence:
  - "Audit finding: open access/demo and cached bootstrap could previously imply usable workspace data."
  - "Local preflight: ShipGlowz App has no product entitlement ledger."
  - "Suite preflight: WinFlowz owns productEntitlements, productAccessEvents, and suiteAccess-style mirror patterns."
next_step: "/sf-ship ShipGlowz Product Entitlements Compliance verification trace"
---
# Spec: ShipGlowz Product Entitlements Compliance
🔴 [shipglowz_app] spec: ShipGlowz Product Entitlements Compliance | status: active | path: shipglowz_data/workflow/specs/shipglowz-product-entitlements-compliance.md | next: /sf-ship ShipGlowz Product Entitlements Compliance verification trace

# Title

ShipGlowz Product Entitlements Compliance

# Status

Implemented locally after `/sf-ready` and `/sf-start`. This chantier remains local-contract-first: it adds the entitlement contract, Flutter models, access-state gates, routing/UI states, docs, and tests. It does not implement checkout, billing, hosted suite bridge, Firebase/Firestore rules, Clerk migration, Convex, Vercel runtime changes, or production entitlement proof.

# User Story

En tant qu'operatrice de ShipGlowz App, je veux que l'acces produit soit verifie par un entitlement serveur pour `product_id=shipglowz_app`, afin qu'une session authentifiee, un acces GitHub ou un cache local ne puisse jamais accorder a lui seul l'acces aux donnees protegees.

# Minimal Behavior Contract

ShipGlowz App accepte une session d'identite valide, lit un snapshot d'entitlement serveur pour `product_id=shipglowz_app` dans le bootstrap, et n'autorise les donnees protegees que si ce snapshot est actif ou trialing non expire, `grants_access=true`, et dans le bon environnement. Sans snapshot, avec snapshot malformed, inactive, expired, revoked, refunded, pending review, unavailable, ou avec cache seulement, l'app fail closed et affiche un etat recuperable.

# Success Behavior

- Given un bootstrap contient un snapshot `active` ou `trialing` non expire pour `shipglowz_app`, with `grants_access=true` et environnement courant, when access is resolved, then `AppAccessState` devient `ready` ou `needsOnboarding`.
- Given un utilisateur est authentifie mais sans entitlement, when access is resolved, then the app shows an account-recognized/no-entitlement state and protected data remains denied.
- Given a stale cached bootstrap exists and the backend is unavailable, when access is resolved, then cache is diagnostic only and `canUseWorkspaceData=false`.
- Given `OPEN_ACCESS` starts demo mode, when protected access is checked, then demo/open access does not become product entitlement.

# Error Behavior

- Missing snapshot: `noEntitlement`.
- Malformed, unknown, unavailable, missing environment, or environment mismatch: `entitlementUnavailable`.
- `inactive`, `expired`, `revoked`, or `refunded`: `entitlementInactive`.
- `pending_review`: `pendingReview`.
- Missing backend health or bootstrap failure: degraded state without protected workspace access.
- Client-supplied top-level entitlement-like fields are ignored by bootstrap parsing.

# Problem

Before this chantier, identity, workspace readiness, demo/open access, and cached bootstrap state could be confused with product authorization. That violated the product-entitlements playbook and made future GitHub/Firebase/Firestore work unsafe.

# Solution

Add a local entitlement gate:

- canonical product id `shipglowz_app`;
- suite ledger as durable source of truth;
- `ProductEntitlementSnapshot` model;
- entitlement in `AppBootstrap`;
- fail-closed `AppAccessState` stages;
- route and entry-screen states for denied/unavailable access;
- docs for product entitlement, bridge, Firestore mirror, support, and verification.

# Scope In

- Local Flutter entitlement model and tests.
- Bootstrap snapshot parsing.
- Access-state mapping and `canUseWorkspaceData` fail-closed policy.
- Entry and redirect behavior for no entitlement, unavailable, inactive, and pending review.
- Product entitlement docs, bridge contract, Firestore mirror docs, support runbook, verification checklist, and docs maps.

# Scope Out

- Hosted suite bridge implementation.
- Checkout, billing providers, redemption codes, refunds, webhooks, and customer portal.
- Firebase Auth, Firestore Security Rules, Cloud Functions, Clerk migration, Convex integration, or Vercel env/runtime changes.
- GitHub App access implementation.
- Any second durable ShipGlowz-local entitlement ledger.

# Constraints

- Authentication proves identity; it does not grant product access.
- GitHub App access proves repository permission; it does not grant product access.
- Firestore projection and cached bootstrap are not product access truth.
- Durable entitlement truth is suite-owned by default.
- `active` and non-expired `trialing` can grant access; every other status maps to denied.
- Entitlement snapshots are environment-scoped.
- Client-supplied identity, product id, plan id, role, quota, or entitlement values are untrusted.
- Raw activation codes, provider secrets, session tokens, cookies, webhook payloads and service credentials must not appear in docs, logs, support output or client payloads.

# Test Contract

- `surface`: entitlement model, bootstrap model, app access state, redirect rules, entry UI states, cache/degraded behavior, Firestore docs, support docs.
- `proof_profile`: high-security local contract proof first; hosted/provider proof remains out of scope.
- `proof_order`: model tests, access tests, cache tests, redirect tests, metadata lint, analyzer.
- `checklist_path`: `shipglowz_data/workflow/verification/shipglowz-product-entitlements-compliance.md`.
- `required_scenario_ids`: `ENT-PREFLIGHT-001`, `ENT-PRODUCT-001`, `ENT-SNAPSHOT-001`, `ENT-AUTH-001`, `ENT-GITHUB-001`, `ENT-CACHE-001`, `ENT-OPEN-001`, `ENT-ENV-001`, `ENT-CLIENT-001`, `ENT-SUPPORT-001`.
- `required_results`: no protected access from auth alone, GitHub alone, stale cache, open access, or client-supplied entitlement fields.
- `exception_with_proof`: hosted proof is deferred because this implementation is local-contract-first.
- `exception_without_proof`: none for local fail-closed behavior.

# Dependencies

- Product entitlement doctrine: `/home/claude/shipglowz/skills/references/product-entitlements-playbook.md`.
- Suite architecture: `/home/claude/winflowz/shipglowz_data/workflow/specs/unified-suite-authentication.md`.
- Local access code: `lib/data/models/app_entitlement.dart`, `lib/data/models/app_bootstrap.dart`, `lib/data/models/app_access_state.dart`, `lib/providers/providers.dart`, `lib/presentation/navigation/app_redirect_rules.dart`, `lib/presentation/screens/entry/entry_screen.dart`.
- Fresh-docs verdict: Vercel docs were checked during readiness for environment-variable risk; no hosted runtime implementation was added in this slice.

# Invariants

- Identity, GitHub repository authorization, and product entitlement are separate gates.
- Product access is denied by default.
- `shipglowz_app` is the product namespace.
- Demo/local mode cannot be a production entitlement substitute.
- Support diagnostics are redacted.

# Links & Consequences

- Auth: signed-in does not imply product access.
- Firestore: future rules/mirrors must check suite-owned product access before protected data.
- GitHub: repository access cannot bypass product entitlement.
- Dashboard: protected dashboard data depends on entitlement first.
- Vercel: preview/production open access cannot grant protected workspace data.

# Documentation Coherence

Updated:

- `shipglowz_data/technical/product-entitlements.md`
- `shipglowz_data/technical/product-entitlement-bridge-contract.md`
- `shipglowz_data/technical/product-entitlements-support-runbook.md`
- `shipglowz_data/technical/firestore-data-model.md`
- `shipglowz_data/technical/code-docs-map.md`
- `shipglowz_data/editorial/content-map.md`
- `shipglowz_data/workflow/verification/shipglowz-product-entitlements-compliance.md`

# Edge Cases

- No entitlement snapshot.
- Snapshot status unknown or malformed.
- Snapshot for another product.
- Snapshot for another environment.
- Active status with `grants_access=false`.
- Expired trial.
- Pending review.
- Cached bootstrap when backend is down.
- Top-level forged entitlement-like fields in bootstrap payload.

# Implementation Tasks

- [x] Task 1: Create ShipGlowz product entitlement contract doc.
- [x] Task 2: Define backend/suite bridge contract.
- [x] Task 3: Update Firestore/projection docs for product access.
- [x] Task 4: Add pure Dart entitlement model and validators.
- [x] Task 5: Extend bootstrap and access state without broadening access.
- [x] Task 6: Make open-access and cached bootstrap fail closed for protected data.
- [x] Task 7: Update API bootstrap parsing and access request boundaries.
- [x] Task 8: Add user-visible entitlement states.
- [x] Task 9: Add verification checklist and support runbook.
- [x] Task 10: Update docs maps. Changelog remains for end/ship flow.

# Acceptance Criteria

- [x] AC 1: Signed-in user without `shipglowz_app` entitlement is denied protected data.
- [x] AC 2: Active non-expired entitlement can reach ready/onboarding state.
- [x] AC 3: GitHub access cannot bypass product entitlement; documented as invariant.
- [x] AC 4: Cached bootstrap remains denied when backend is unavailable.
- [x] AC 5: Expired, revoked, refunded, inactive, and pending states deny access.
- [x] AC 6: `OPEN_ACCESS` does not grant protected workspace access through `canUseWorkspaceData`.
- [x] AC 7: Demo mode remains explicit and separate from entitlement.
- [x] AC 8: Offline/cache tests cover degraded cache behavior.
- [x] AC 9: Client top-level entitlement-like fields are ignored.
- [x] AC 10: Firestore docs require server-owned product access mirror.
- [x] AC 11: Support runbook names safe identifiers and redaction policy.
- [x] AC 12: Hosted provider runtime remains gated by fresh docs.

# Test Strategy

Automated tests cover entitlement parsing, grants mapping, expiration, malformed payloads, no entitlement, pending review, degraded cache denial, and redirects. Metadata lint and analyzer cover docs and code hygiene. Hosted Vercel/browser proof is deferred until `/sf-ship` and `/sf-prod` if a later slice claims hosted behavior.

# Risks

- High security risk if future backend code treats identity, GitHub access, or cache as entitlement.
- High product risk if ShipGlowz creates a second durable ledger.
- Medium UX risk from legacy ContentFlow copy still present on entry states.
- Hosted proof remains absent by design.

# Execution Notes

Proof path: test-first for Dart/access logic, evidence-first for docs/governance. Project mode is `vercel-preview-push`, so browser/user-flow proof must happen only after `/sf-ship` and `/sf-prod` if required. Do not add hosted provider behavior without a new ready scope and current official docs.

# Open Questions

None for the local-contract-first slice. Hosted suite bridge implementation remains a later explicit chantier.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-30 18:53:35 UTC | sf-spec | GPT-5 Codex | Created product entitlements compliance spec from audit findings, product-entitlements playbook, local ShipGlowz App scan, and suite ledger preflight. | draft saved | /sf-ready ShipGlowz Product Entitlements Compliance |
| 2026-05-30 18:58:26 UTC | sf-ready | GPT-5 Codex | Reviewed structure, metadata, user-story alignment, product-entitlements doctrine, suite ledger preflight, adversarial/security readiness, language doctrine, fresh-doc gate, and proof contract. | ready | /sf-start ShipGlowz Product Entitlements Compliance |
| 2026-05-30 20:44:06 UTC | sf-start | GPT-5.3 Codex Spark subagent plus GPT-5 Codex integration | Implemented local-contract-first entitlement model, access gates, route/UI states, docs, support runbook, verification checklist, and focused tests. | implemented | /sf-verify ShipGlowz Product Entitlements Compliance |
| 2026-05-30 20:46:31 UTC | sf-verify | GPT-5 Codex | Verified user story, success/error behavior, fail-closed security gates, local Flutter tests, analyzer, metadata lint, docs coherence, project development mode, and checklist scenarios. | verified | /sf-end ShipGlowz Product Entitlements Compliance |
| 2026-05-30 20:47:08 UTC | sf-end | GPT-5 Codex | Closed local-contract-first implementation with TASKS and CHANGELOG bookkeeping; no commit or push performed. | closed | /sf-ship ShipGlowz Product Entitlements Compliance |
| 2026-05-30 20:47:50 UTC | sf-ship | GPT-5 Codex | Prepared commit and push for local-contract-first entitlement gate after focused tests, full analyzer, metadata lint, and diff hygiene passed. | shipped | /sf-prod shipglowz_app |
| 2026-05-30 20:59:30 UTC | sf-verify | GPT-5 Codex | Re-verified post-ship local contract, focused tests, full analyzer, metadata lint, GitHub commit status, Vercel production deployment readiness, prod alias HTTP 200, and proof gaps. | partial | /sf-browser https://shipglowzapp.vercel.app verify Flutter web render and absence of gray page |
| 2026-05-30 21:01:09 UTC | sf-browser | GPT-5 Codex | Captured production Chromium headless screenshot and DOM proof for `https://shipglowzapp.vercel.app/`; confirmed Flutter UI renders and is not a gray page. | pass | /sf-verify ShipGlowz Product Entitlements Compliance close browser proof gap |
| 2026-05-30 21:04:26 UTC | sf-verify | GPT-5 Codex | Reconciled browser proof gap with sf-browser evidence, metadata lint, production deploy proof, local test/analyzer evidence, and contract gates. | verified | /sf-ship ShipGlowz Product Entitlements Compliance verification trace |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Spec created and restored as the chantier source of truth. |
| sf-ready | ready | Product id, suite bridge ownership, fail-closed scope, language doctrine, security stance, and fresh-doc requirements reviewed. |
| sf-start | implemented | Local-contract-first implementation complete; hosted/provider runtime is still out of scope. |
| sf-verify | verified | Local contract, GitHub status, Vercel deployment readiness, prod alias HTTP 200, and browser-render proof are complete for this chantier. |
| sf-end | closed | TASKS and CHANGELOG bookkeeping updated; hosted/provider proof remains out of scope. |
| sf-ship | shipped | Commit `1e835bb` pushed to origin/main and deployed by Vercel production deployment `dpl_491rXUVf8JMBvUiU5PNFC95q5mMi`. |
