---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "shipglows_app"
created: "2026-08-03"
updated: "2026-08-11"
status: reviewed
source_skill: 300-sg-docs
scope: operator-workspace
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/operator-workspace/"
  - "runner/src/app.ts"
  - "runner/src/config.ts"
  - "runner/scripts/operator-workspace-smoke.ts"
  - "app/lib/shipglows/presentation/screens/operator_workspace_screen.dart"
  - "app/lib/shipglows/data/managed_runner_api.dart"
depends_on:
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "1.6.0"
    required_status: draft
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.4.0"
    required_status: ready
supersedes: []
evidence:
  - "Runner and Flutter operator Workspace implementation completed on 2026-08-03."
  - "Real managed-server smoke passed for PTY, isolated tmux, resize, input/output, Codex executable, and cleanup."
next_review: "2026-08-17"
next_step: "Complete public TLS and authenticated actor/project provisioning, then capture browser reconnect and Neovim proof."
---

# Operator Workspace Guide

## Current Status

- Implemented: protected capability discovery, idempotent session creation, short-lived capability, owner-only closure, dedicated WebSocket stream, allowlisted tmux PTY, bounded input/resize, Flutter `xterm` rendering, and explicit unavailable/interrupted states.
- Server-smoke proven: real PTY, isolated tmux, resize, terminal input/output, installed Codex executable, no obvious secret markers in the bounded transcript, and temporary-session cleanup.
- Last loopback proof: the supervised runner was healthy with its previous Supabase deployment and one server-owned Workspace allowlist. Repository source now targets Firebase, but the server migration and Firebase-authenticated smoke are still pending.
- Not yet publicly proven: HTTPS reverse proxy for `runner.shipglows.com`, provisioned authenticated actor/project, Flutter Web connection, long reconnect, Neovim, Android, and Windows rendering.

## Security Contract

- The end user receives no SSH credential, host path, PTY handle, tmux name, runtime credential, or general shell selector.
- Flutter supplies only an opaque project id and bounded terminal frames.
- The server chooses the working directory and tmux session from `RUNNER_OPERATOR_WORKSPACES`.
- The short-lived capability is carried as a WebSocket subprotocol, not in the URL.
- PTY output is live-only and must not enter conversation persistence, routine diagnostics, Sentry, or proxy logs.
- One actor/project session may be attached at a time; invalid, expired, concurrent, cross-owner, and unavailable access fails closed.

## Server Configuration

Store the real mapping only in the server-owned runtime environment. Do not commit actual paths or session names.

```text
RUNNER_OPERATOR_WORKSPACES={"<opaque-project-id>":{"cwd":"<absolute-server-owned-project-path>","tmuxSession":"<allowlisted-session-name>"}}
```

Configuration validation rejects relative paths, malformed project ids, malformed tmux names, and non-object shapes. Restart the supervised runner while preserving its existing secret environment, then confirm:

- process state is online and stable;
- Firebase authentication is enabled after the deployment migration (the previous Supabase deployment is not sufficient proof);
- Workspace allowlist count is expected;
- `GET /v1/version` returns `200` on loopback;
- an unauthenticated protected Workspace request returns `401`;
- runtime logs contain no startup error or sensitive value.

## Public Delivery Gate

The runner stays bound to loopback. Public delivery requires a root-managed HTTPS reverse proxy that:

- owns `runner.shipglows.com`;
- proxies HTTP and WebSocket upgrades to the loopback runner;
- presents a valid certificate;
- preserves the configured browser Origin boundary;
- does not log authorization headers, WebSocket capability values, or terminal frames.

A DNS record alone is insufficient. If TLS fails before the runner, do not weaken authentication or expose the loopback port directly.

## Identity Provisioning Gate

Every valid Firebase identity may enter its own isolated personal space. Access to each managed project remains separate and must come from `RUNNER_PERSONAL_CLOUD_PROJECT_MEMBERS`, a server-owned UID-to-project-to-capability map. `mutate` includes read access and is required for Éditeur and Terminal. Before browser proof, provision through the server-owned flow:

1. tenant and authenticated Firebase subject mapping;
2. actor/user membership;
3. opaque runner project;
4. project membership with the required capability;
5. canonical source-project identity binding when the Flutter project namespace differs;
6. matching server-only Workspace allowlist entry.

When a UID was first seen before it was added to the project map, the runner keeps its stable internal user identity, adds the configured shared-tenant membership transactionally, and then reconciles only the declared project capability. It never copies another user's membership or trusts a tenant supplied by Flutter.

Never let Flutter write these authority records directly.

## Verification

Local contracts and isolated real-server smoke:

```bash
cd runner
npm run typecheck
npm run lint
npm test
npm audit --audit-level=high
npm run smoke:operator-workspace
```

Hosted proof must additionally verify:

- authenticated capability discovery and session creation;
- WebSocket connection without a capability in the URL;
- terminal input/output and resize in Flutter Web;
- disconnect and reconnect to the same allowlisted tmux session;
- explicit close and server cleanup;
- inaccessible/cross-project denial;
- no host path, tmux identifier, credential, or terminal transcript in API payloads and diagnostics;
- Neovim launch and recovery;
- Android and Windows rendering before parity is claimed.

## Recovery

- TLS failure: inspect the HTTPS reverse-proxy ownership and certificate path; keep the runner loopback-only.
- `401`: repair authentication/session provisioning; do not bypass the guard.
- `403` or unavailable capability: repair tenant/project membership or the server allowlist; do not accept a client path.
- expired capability: create a new operator session through authenticated HTTP.
- interrupted WebSocket: reconnect only while the capability remains valid; otherwise create a new session and reattach to the allowlisted tmux session.
- stuck operator process: close the actor-owned session through the API; use server administration only as incident recovery.

## Maintenance Rule

Update this guide whenever capability lifetime, WebSocket framing, allowlist configuration, tmux attachment, public proxying, identity provisioning, platform support, smoke proof, or recovery behavior changes.
