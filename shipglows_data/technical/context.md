---
artifact: technical_context
metadata_schema_version: "1.0"
artifact_version: "2.2.0"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-11"
status: reviewed
source_skill: 300-sg-docs
scope: technical
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/"
  - "runner/"
  - "site/"
  - "shipglows_data/"
depends_on:
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "1.6.0"
    required_status: draft
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.4.0"
    required_status: ready
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/technical-context.md"
evidence:
  - "Current Flutter ShipGlows runtime and TypeScript managed runner."
  - "Managed Agent Cockpit MVP implementation history."
next_review: "2026-09-03"
next_step: "Complete public TLS and authenticated project provisioning, then run browser-to-runner proof."
---

# Technical Context

## System Orientation

This monorepo contains three active product surfaces:

- `app/`: Flutter application for Cockpit, projects, managed conversations, auth, and the optional operator Workspace.
- `runner/`: TypeScript/Fastify managed control plane for authentication, project authorization, agent runtimes, GitHub workspaces, persistence, and event delivery.
- `site/`: Astro public site and product documentation surface.

The canonical governance corpus lives at root `shipglows_data/`.

## Runtime Flow

1. Flutter obtains a provider-neutral authenticated session.
2. The managed runner resolves the user, tenant, and project authorization.
3. Cockpit reads return tenant-scoped project and health projections.
4. Conversation commands select a server-owned agent runtime and repository workspace.
5. Semantic events are persisted and streamed to Flutter with resumable cursors.
6. An authorized operator may request one short-lived Workspace capability; Flutter connects through a separate WebSocket and renders the server-owned PTY with `xterm`.
7. GitHub credentials, paths, runtime transports, PTY handles, tmux identifiers, and SSH access stay server-side.

## Source Of Truth

- GitHub repositories and project Markdown remain canonical for repository content and governance.
- SQLite stores reconstructable operational projections such as runs, conversations, events, approvals, usage, and health evidence.
- Flutter state is a client projection and never grants authorization by itself.

## Current Boundaries

- Codex app-server is the first complete runtime adapter; the product contract remains runtime-neutral.
- Firebase Auth is the identity adapter behind a provider-neutral Flutter/server boundary.
- GitHub App access is server-only and narrowed per repository.
- Audits are read-only; fixes use isolated worktrees and stop before push, merge, or deployment.
- The operator Workspace PTY/tmux gateway and Flutter terminal rendering are implemented. A real isolated server smoke has proved PTY input/output, resize, tmux attachment, Codex execution, and cleanup.
- The supervised runner last proved on loopback still uses its previously provisioned Supabase authentication configuration and one server-owned Workspace allowlist. The repository source now targets Firebase Auth, but that deployment has not been reconfigured or re-proven. Public access is also unproven because `runner.shipglows.com` lacks its root-owned Caddy route and the runner identity database has no provisioned actor/project.
- Legacy ContentFlow code remains behind explicit legacy targets and is not current product truth.

## Validation

```bash
cd app && flutter analyze && flutter test
cd ../runner && npm run typecheck && npm test
```

## Maintenance Rule

Update this document when a major surface, source-of-truth rule, provider boundary, runtime flow, or security invariant changes.
