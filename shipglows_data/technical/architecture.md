---
artifact: technical_architecture
metadata_schema_version: "1.0"
artifact_version: "2.1.0"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-03"
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
  - "runner/src/"
  - "shipglows_data/technical/managed-runner-foundation.md"
depends_on:
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "2.1.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.4.0"
    required_status: ready
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/architecture.md"
evidence:
  - "Implemented runner contracts, Flutter managed surfaces, and current ready specification."
next_review: "2026-09-03"
next_step: "Publish the existing OperatorSession gateway through authenticated HTTPS and prove browser reconnect."
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

## Runtime Neutrality

`AgentRuntime` owns sessions, turns, interruption, approvals, normalized events, and capabilities. Codex app-server is an adapter, not the public API. Unsupported capabilities fail explicitly and do not silently select another runtime.

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

Update this document when trust boundaries, runtime contracts, data authority, repository mutation policy, supported platforms, or operator-session architecture changes.
