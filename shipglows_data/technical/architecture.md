---
artifact: technical_architecture
metadata_schema_version: "1.0"
artifact_version: "2.4.0"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-16"
status: reviewed
source_skill: 300-sg-docs
scope: architecture
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/lib/shipglows/"
  - "app/lib/domain/studio/"
  - "runner/src/"
  - "runner/src/studio/"
  - "runner/src/studio/providers/vercelSandboxProvider.ts"
  - "site/src/studio/"
  - "site/src/integrations/studioPreview.ts"
  - "shipglows_data/technical/managed-runner-foundation.md"
  - "shipglows_data/technical/platforms/vercel.md"
depends_on:
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "2.1.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.4.0"
    required_status: ready
supersedes:
  - "shipglows_data/technical/architecture.md@2.3.0"
  - "shipglows_data/technical/architecture.md@2.2.0"
  - "shipglows_data/technical/architecture.md@2.1.0"
  - "shipglows_data/workflow/archives/contentflow-governance/architecture.md"
evidence:
  - "Implemented runner contracts, Flutter managed surfaces, and current ready specification."
  - "The trusted Astro hero now exposes eight development-only semantic anchors through an exact-origin bridge; the production build contains no Studio marker."
  - "Flutter has an authenticated runner-gated, read-only Studio route and inspector; local browser proof remains fail-closed until a capability resolver is deployed."
  - "Provider-neutral managed-sandbox admission plus an account-free injected Vercel facade passed independent local verification on 2026-08-16; no SDK, provider call, production wiring, execution, preview, persistence, export, or availability proof exists."
next_review: "2026-09-03"
next_step: "Obtain separate credential and cost approval for inert real-provider admission/probe/release proof before wiring Studio compilation."
---

# Architecture

## Architectural Shape

ShipGlows is a managed control-plane product with a Flutter client and a server-owned runner.

```text
Flutter Cockpit
  ├── authenticated HTTP commands
  ├── authenticated SSE semantic events
  └── short-lived WebSocket Workspace stream
          │
          ▼
Managed Runner
  ├── AuthProvider / tenant membership
  ├── project authorization
  ├── AgentRuntime + CapabilityBroker
  ├── GitHub App + managed worktrees
  ├── SQLite operational projection
  ├── event persistence and fan-out
  └── allowlisted PTY/tmux gateway
          │
          ▼
GitHub repositories + ShipGlows Markdown
```

## Client Boundary

Flutter consumes normalized ShipGlows contracts. It does not receive provider credentials, host paths, runtime transport objects, GitHub installation tokens, or raw tmux identifiers. Web, Android, and Windows share domain/state/API modules while platform adapters remain replaceable.

## Runner Boundary

The runner is the authority for:

- authentication and tenant/project authorization;
- runtime selection and capability checks;
- repository credential issuance and revalidation;
- managed clone/worktree paths;
- run admission, timeout, interruption, approvals, and idempotency;
- redacted event persistence and health projections;
- project/actor-scoped operator capability issuance and owner-only session closure;
- allowlisted tmux PTY creation, bounded input/resize frames, reconnect, and cleanup.
- managed-sandbox capability admission, independent evidence validation, resource/cost budgets, lifecycle reservations, release, and reconciliation.

## Runtime Neutrality

`AgentRuntime` owns sessions, turns, interruption, approvals, normalized events, and capabilities. Codex app-server is an adapter, not the public API. Unsupported capabilities fail explicitly and do not silently select another runtime.

Studio follows the same separation. Flutter and the runner share a versioned semantic vocabulary, while the runner owns exact target-profile admission, the preview-runtime provider port, and the provider-neutral managed-sandbox boundary. The first trusted-base slice exposes an authenticated read-only capability route, a Flutter Web preview/inspector shell, and eight development-only semantic anchors over the real Astro hero. The client cannot choose selectors, paths, commands, revisions, providers, images, budgets, credentials, or broader capabilities; a missing or mismatched resolver keeps Studio unavailable. Generated and customer-controlled work remain unavailable until a managed provider is independently proved.

## Managed-Sandbox Boundary

The Studio domain admits capability outcomes, not Vercel wire types or a specific hypervisor/container-runtime brand. Admission requires an immutable phase envelope, complete resource and USD spend reservation, exact policy/image identity, expiring lease, and independently verified evidence bound to the provider, adapter, account/project/configuration scope, scenario, resource, budget, observation, and expiry. Provider self-attestation, product documentation, or a successful fake cannot satisfy real admission.

`VercelSandboxProvider` is the first adapter, implemented against an injected narrow facade without a Vercel SDK/package. Account-free conformance proves fail-closed orchestration only: non-persistent zero-port creation, initial deny-all networking, a single exact generation broker rule, verification deny-all, atomic complete lifecycle-call reservations, shared capacity, idempotent release, reconciliation, and quarantine. The composition root does not inject it, and no execution, source transfer, snapshot, preview, persistence, export, provider/network call, credential, or billable action exists.

The former self-hosted containerd/gVisor worker direction was superseded before provisioning. It remains architecture history for future adapter comparison and is not an operative deployment instruction.

## Studio Trusted-base Preview

The Astro adapter exists only during `astro dev`. It injects a fixed bridge for the exact Flutter parent origin and emits semantic selection messages from reviewed anchors; Astro production output is scanned to ensure the bridge and anchor markers are absent. Flutter embeds the admitted loopback origin with `HtmlElementView`, a sandboxed iframe, no referrer, exact source/origin/channel checks, and a server-projected anchor allowlist. This slice is inspect-only: it performs no preview mutation, source write, worktree creation, generation, commit, push, merge, or deployment.

The capability route still requires ordinary runner authentication and project-read authorization. Its resolver must bind the exact first-party project, source revision, repository digest, origin, and `inspect` capability. The local browser currently proves the Flutter product remains healthy and fail-closed without that deployment configuration; authenticated embedded-preview proof remains a separate gate.

## Repository Safety

- Audits use detached read-only worktrees.
- Fixes use isolated local branches/worktrees.
- No MVP route pushes, merges, deploys, or writes directly to a canonical branch.
- Project mutation is serialized and every command is tenant/project scoped.

## Operator Workspace

The advanced Workspace is separate from semantic conversations. The runner issues a short-lived project/actor-scoped opaque capability, opens only the tmux session selected by the server allowlist, and carries bounded PTY input/output and resize frames over a dedicated WebSocket. Flutter renders the stream with `xterm`; it never receives a host path, raw tmux identifier, SSH credential, or general server-selection control. Invalid, expired, concurrent, unavailable, and cross-owner access fail closed. The implementation and isolated server smoke pass; public authenticated browser proof still depends on TLS routing and identity/project provisioning.

## Legacy Runtime

ContentFlow modules are retained for classification and selective reuse only. They may not define current authentication, data authority, routing, or product behavior unless a current ShipGlows contract explicitly adopts them.

## Validation

```bash
cd runner && npm run typecheck && npm test
cd ../app && flutter analyze && flutter test
```

## Maintenance Rule

Update this document when trust boundaries, runtime contracts, managed-provider admission/evidence, resource/cost policy, data authority, repository mutation policy, supported platforms, or operator-session architecture changes. Do not represent local fake-provider conformance as account, containment, availability, or execution proof.
