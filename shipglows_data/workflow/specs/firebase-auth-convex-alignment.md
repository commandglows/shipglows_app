---
artifact: specification
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglows_app"
created: "2026-08-11"
updated: "2026-08-11"
status: draft
source_skill: sg-engineering
scope: "firebase-auth-convex-alignment"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems: ["app/lib/shipglows/auth/", "runner/src/auth/", "runner/src/config.ts", "shipglows_data/technical/managed-runner-foundation.md"]
depends_on: ["/home/claude/shipglows/shipglows_data/workflow/specs/portfolio-backend-auth-decision-matrices.md"]
supersedes: ["Supabase identity decisions in shipglows-managed-codex-cockpit-mvp.md"]
evidence: ["User decision to align shipglows_app with the portfolio Firebase Auth and Convex baseline", "Active provider-neutral Flutter and runner authentication contracts"]
next_step: "Complete live Firebase and Linux REST/OIDC authentication proof, then integrate the first Convex-backed product projection."
---

# Firebase Auth And Convex Alignment

## Outcome

ShipGlows uses Firebase Auth as its identity authority without leaking provider types into feature code. Convex is the target product backend and data layer. The managed Fastify/SQLite runner remains a separate, justified execution-plane exception because it owns local processes, PTY/tmux sessions, workspaces, admission limits and operational event persistence.

## Current implementation truth

- Flutter's active Cockpit boundary consumes Firebase ID tokens through `ShipGlowsAuthProvider`.
- FlutterFire initializes Web, Android, iOS, macOS and Windows clients from public compile-time Firebase options.
- The runner verifies Firebase ID tokens server-side using the Firebase issuer, project audience, Google Secure Token JWKS and RS256 before resolving tenant membership.
- The runner remains Fastify/SQLite; this migration does not pretend that Convex already stores product projections.
- Linux does not yet have a complete sign-in/session adapter. It requires a REST/OIDC implementation behind the same provider-neutral contract and live proof.
- Historical Supabase and Firestore documents remain migration evidence, not active runtime truth.

## Security invariants

- Flutter receives only public Firebase client configuration; no service-account credential enters a build.
- The runner trusts neither client-decoded claims nor a tenant header by itself.
- Token issuer and audience must match the configured Firebase project and the accepted algorithm is RS256.
- Firebase identity, GitHub repository authority, ShipGlows tenant membership and product entitlement remain separate checks.
- Convex adoption must not move PTY, filesystem paths, runtime credentials or unrestricted execution into the client/data plane.

## Acceptance

- [x] Supabase Flutter dependency removed from the active Cockpit boundary.
- [x] Firebase Flutter session and refresh mapping implemented behind the neutral interface.
- [x] Runner Firebase token verifier and fail-closed tenant resolution implemented.
- [x] Production configuration renamed to `FIREBASE_AUTH_ENABLED` and `FIREBASE_PROJECT_ID`.
- [x] Active technical docs distinguish current code from the Convex target.
- [ ] Linux REST/OIDC adapter and tests implemented.
- [ ] Live Firebase project authentication proven end to end.
- [ ] First Convex product projection specified and implemented separately.

## Skill Run History

| Timestamp UTC | Skill | Agent | Result | Confidence | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-11 | sg-engineering | GPT-5 Codex | Migrated the active Flutter and runner auth boundaries from Supabase to Firebase, preserving provider-neutral contracts. | high for local contracts; live provider proof pending | Add Linux REST/OIDC adapter and live Firebase proof |
| 2026-08-11 | sg-docs | GPT-5 Codex | Reconciled source, deployment and target truth; recorded the Convex data-plane target, the runner exception and the still-Supabase deployed baseline. | high | Prove the future Firebase deployment and Linux adapter before closing the spec |
