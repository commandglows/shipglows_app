---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "shipglows_app"
created: "2026-08-18"
created_at: "2026-08-17 22:23:23 UTC"
updated: "2026-08-18"
updated_at: "2026-08-17 22:45:49 UTC"
status: ready
source_skill: "101-sg-ready"
source_model: "GPT-5 Codex"
scope: "shipglows-cloud-dev-gateway-foundation"
owner: "Diane"
confidence: high
user_story: "En tant qu'operatrice unique de ShipGlows, je veux que l'application decouvre de facon sure les projets et services deja geres par mon CLI Linux sur Hetzner, afin d'y acceder dans le cloud sans remplacer PM2, tmux, Neovim ni mon workflow Codex."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "ShipGlows Linux CLI"
  - "ShipGlows managed runner"
  - "Flutter Web"
  - "Firebase Auth"
  - "SQLite operational projection"
  - "PM2"
  - "tmux"
  - "Caddy"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.31.3"
    required_status: "ready"
supersedes: []
evidence:
  - "Operator decision 2026-08-18: preserve the existing Linux CLI, PM2, tmux, Neovim and Codex workflow; ShipGlows App is a remote window onto that environment."
  - "Repository inspection 2026-08-18: the Linux CLI already projects PM2 name, status, port and cwd, maintains a private Flutter Web tmux registry, and regenerates a user-mode Caddy proxy."
  - "Repository inspection 2026-08-18: the production runner already provides Fastify, Firebase JWT verification, SQLite v8, project authorization boundaries and a loopback PM2 deployment, but lacks production project provisioning and a CLI-backed project catalog."
  - "Operator decision 2026-08-18: SQLite is sufficient for the personal-cloud milestone; Convex and Docker are deferred until a multi-user service proves their need."
next_step: "/102-sg-start ShipGlows Cloud Dev Gateway Foundation"
---

# Spec: ShipGlows Cloud Dev Gateway Foundation

🟢 [shipglows_app] spec: ShipGlows Cloud Dev Gateway Foundation | status: ready | path: shipglows_data/workflow/specs/shipglows-cloud-dev-gateway-foundation.md | next: /102-sg-start ShipGlows Cloud Dev Gateway Foundation

## Title

ShipGlows Cloud Dev Gateway Foundation

## Status

Ready architecture contract after a SAFE `/101-sg-ready` verdict on 2026-08-18. Catalog authority, fixed single-user Firebase provisioning, SQLite projection limits and the single sequential PC-A CLI write set are complete and executable. Implementation still requires `/102-sg-start`; any CAX11 mutation remains governed by the separate rollout and approval gate.

## User Story

En tant qu'operatrice unique de ShipGlows, je veux que l'application decouvre de facon sure les projets et services deja geres par mon CLI Linux sur Hetzner, afin d'y acceder dans le cloud sans remplacer PM2, tmux, Neovim ni mon workflow Codex.

## Minimal Behavior Contract

Given one Firebase-authenticated allowlisted operator and one CAX11 where the ShipGlows CLI already manages projects, the CLI publishes one versioned server-private catalog and the loopback runner projects only authorized, redacted project capabilities to Flutter. Empty or stale catalogs remain explicit and non-executable; invalid identity, catalog schema, path, port or project mapping fails closed. The easiest missed edge case is authority duplication: PM2/tmux/CLI live state remains canonical and SQLite must never become a competing process registry.

## Success Behavior

- One signed-in allowlisted Firebase UID resolves to one fixed server-owned tenant and owner membership without a client-selected tenant header.
- The CLI emits one atomic `shipglows.cli-project-catalog.v1` snapshot aggregating PM2 projects and registered Flutter Web sessions.
- Each catalog entry has a stable opaque project id, display name, normalized preview slug, runtime status and server-private cwd/port/tmux mapping.
- The runner reads the catalog through a typed read-only adapter and returns only opaque ids, display metadata, health/readiness and capabilities.
- Flutter remote mode lists projects automatically and never asks for an absolute server path.
- SQLite persists identity, membership, project bindings, conversations and operational events only; it does not own PM2 status, ports, paths or tmux state.
- Missing Convex and Docker have no effect on this milestone.

## Error Behavior

- Missing/invalid Firebase token or a subject different from the configured UID returns `401` and no catalog data.
- A missing fixed-tenant provisioning record returns a bounded unavailable state; startup or a dedicated provisioning command repairs it idempotently only from server-owned configuration.
- Invalid, partial, duplicate or boundary-escaping catalog entries reject the complete new snapshot while preserving the last valid in-memory projection.
- A missing/stale catalog returns explicit `catalogUnavailable` or `catalogStale`; it never scans arbitrary filesystem roots or guesses ports.
- A stopped PM2 app or absent tmux session remains visible with unavailable capabilities and cannot be started by this read-only foundation.
- No API, diagnostic or log includes cwd, internal port, tmux name, Firebase token or catalog file contents.

## Problem

The cloud runner and the Linux service manager currently know different project worlds. Production runner authorization expects pre-provisioned SQLite actors/projects, while the only complete local project registry is a development-only JSON catalog with hard-coded local actors. Replacing the CLI would discard a working PM2/tmux workflow; duplicating its state in SQLite would create drift.

## Solution

Define one narrow machine-readable CLI catalog contract. The CLI remains the live authority and writes a private atomic snapshot after PM2 or Flutter-session lifecycle changes. A new runner adapter validates and redacts that snapshot, reconciles stable project identity/membership into SQLite, and exposes project capabilities through existing authenticated runner boundaries. Firebase runs in fixed single-tenant/single-UID mode for the personal cloud; later multi-user evolution may add a tenant selector without weakening this boundary.

## Scope In

- Versioned CLI project catalog schema, atomic writer and read-only inspection command.
- Aggregation of PM2 and the private Flutter Web session registry.
- Stable opaque project identity and deterministic DNS-safe preview slug policy.
- Runner catalog validation, freshness, redaction and project-access adapter.
- Fixed single-tenant Firebase UID allowlist and idempotent initial provisioning.
- SQLite project/source binding and owner membership projection.
- Remote-mode Flutter project list contract that hides local path onboarding.
- Loopback-only runner composition compatible with existing PM2 supervision.

## Scope Out

- Public preview proxying, cookie issuance or wildcard TLS.
- Workspace WebSocket reconnect implementation.
- Studio semantic preview, Laboratory or compile execution.
- Project start/stop/restart/log commands from Flutter.
- Convex, Firestore product projection, Docker, containers or multi-user tenancy.
- DNS, firewall, CAX11 mutation, deployment or public availability claims.

## Constraints

- CLI/PM2/tmux are operational authorities; the runner is an authenticated adapter, not a replacement supervisor.
- The client never supplies or receives cwd, port, tmux name, process command or catalog path.
- The catalog file is owner-readable only, atomically replaced, size-bounded and schema-closed.
- Project ids and preview slugs are immutable once exposed; display names may change.
- One fixed tenant is server configuration, never a trusted client header.
- Existing local loopback project onboarding may remain for development but is hidden in remote mode.
- SQLite migrations remain additive, backed up and reversible; no repository content is stored.

## Test Contract

- Surface/profile: Linux CLI contract tests, runner TypeScript tests, SQLite migration/backup fixtures and Flutter provider/widget tests without a public server.
- Automated order: CLI schema/atomicity -> runner parser/redaction/auth -> SQLite provisioning/idempotency -> Flutter remote catalog states -> complete local quality gates.
- Integration proof: a fixture PM2/Flutter catalog reconciles exactly once and returns the expected redacted projects to a fake authenticated Flutter client.
- Security proof: hostile paths, ports, ids, duplicate slugs, stale snapshots, wrong UID, missing provisioning and cross-project references fail closed.
- Exception: no DNS, CAX11, Firebase live-provider or browser availability claim is permitted under this spec.

## Dependencies

- Existing Linux `pm2_data_load`, Flutter Web session registry and user-mode Caddy lifecycle.
- Existing runner `AuthenticationAdapter`, `ProjectAccessRepository`, `OperationalStore` and Fastify composition root.
- Existing Flutter managed project models/providers and canonical design-system authority.
- `shipglows-managed-codex-cockpit-mvp.md` for the broader project/Workspace contract.

## Invariants

- PM2 and tmux live state is never reconstructed from SQLite.
- A catalog entry is data, not authorization; authenticated project membership remains required.
- Fixed single-user convenience cannot admit a second Firebase subject.
- Invalid new catalog state never erases the last valid projection or widens capabilities.
- No source, Git history, server path, port, tmux name or credential crosses into Flutter.
- Convex and Docker remain deferred, not silently introduced.

## Links & Consequences

- Upstream: Linux CLI lifecycle changes must refresh the catalog atomically.
- Downstream: persistent preview and operator Workspace consume the same stable project ids but own their own authorization and transport contracts.
- Data: SQLite gains only bounded identity/binding state and remains an operational projection.
- UI: remote project discovery replaces path entry; visual changes must consume the Flutter design-system tokens and preserve accessibility.
- Product before -> after: manual server paths and disconnected registries -> one automatic redacted cloud project catalog.

## Documentation Coherence

- Update `shipglows_data/technical/architecture.md`, `context.md`, `managed-runner-foundation.md`, `runtime-boundary.md` and the CLI operator documentation when implemented.
- Update the code-docs map for the catalog schema and runner adapter.
- Public/editorial documentation remains unchanged until hosted proof exists.

## Edge Cases

- Zero: catalog absent or empty; UI shows no managed projects and no guessed fallback.
- One: one PM2 project provisions one stable project/membership exactly once.
- Many: PM2 and Flutter registries merge deterministically; duplicate cwd/port/slug conflicts reject the snapshot.
- Boundaries: maximum entries, file bytes, id/name/slug lengths, port range, freshness age and canonical path containment.
- Interfaces: CLI schema, runner adapter, SQLite binding and Flutter DTO versions reject unknown incompatible versions.
- Exceptions: interrupted atomic write, malformed JSON, PM2 unavailable, stale tmux registration and database rollback keep a recoverable prior state.

## Implementation Tasks

1. Define `shipglows.cli-project-catalog.v1` fixtures and validators in the CLI repository; prove zero/one/many, atomic replacement and private permissions.
2. Add the CLI aggregator for PM2 and Flutter Web registries without changing their lifecycle authority; prove stable identities and conflicts.
3. Add runner cloud-project catalog and provisioning ports behind new modules; prove schema, redaction, UID allowlist and fixed-tenant behavior.
4. Add additive SQLite bindings/provisioning only where existing store contracts cannot express the fixed owner; prove migration, rollback, backup and restart.
5. Add remote-mode Flutter project projection and hide server-path onboarding; prove loading/empty/stale/unauthorized states and tokenized UI.
6. Integrate shared runner/Flutter composition files sequentially after the isolated batches pass.
7. Reconcile internal technical documentation without making a hosted availability claim.

## Acceptance Criteria

- `CGF-001`: one valid CLI snapshot yields the same stable redacted project ids after runner restart.
- `CGF-002`: wrong UID, missing auth or a second UID cannot read any project.
- `CGF-003`: Flutter sends no tenant selector in fixed-tenant mode and still resolves the authorized actor.
- `CGF-004`: cwd, internal ports and tmux names are absent from all public DTOs, errors, diagnostics and logs.
- `CGF-005`: stale/invalid catalogs cannot widen access or replace the last valid projection.
- `CGF-006`: remote Flutter mode never requests an absolute project path.
- `CGF-007`: SQLite contains identity/bindings but no PM2/tmux live-state authority.
- `CGF-008`: no Docker/Convex dependency or service is added.
- ZOMBIES coverage: Z/O/M catalog cardinality; boundary file/field/port/freshness limits; interface version/redaction; exceptional auth/write/rollback/restart; simplest valid case is one operator and one existing project.

## Test Strategy

- CLI shell tests with fixture `pm2 jlist` and Flutter TSV inputs; validate permissions and atomic rename behavior.
- Runner unit/route tests with fake catalog reader and Firebase verifier; secret/path marker scans.
- SQLite v8-forward migration, transaction rollback, idempotent provisioning, backup/restore and wrong-tenant fixtures.
- Flutter repository/provider/widget tests for remote catalog states and absence of path onboarding.
- Run typecheck, lint, focused suites, complete runner/Flutter regression, metadata lint and `git diff --check` before readiness evidence is accepted.

## Risks

- Catalog drift: mitigated by atomic snapshots, freshness and CLI lifecycle refresh.
- Stable-id collision: mitigated by closed normalization and collision rejection before publication.
- Fixed-user misconfiguration: mitigated by exact UID equality and fail-closed provisioning.
- Split authority: mitigated by forbidding PM2/tmux status writes into SQLite.
- Path/command injection: mitigated by server-private closed fields, canonical containment and no shell composition in the runner adapter.

## OWASP Security Gate

- Top 10 considered: A01 access control, A02 configuration, A04 token/transport handling, A05 path/command injection, A06 fixed-user abuse cases, A07 authentication, A08 catalog integrity, A09 redacted security events and A10 fail-closed recovery.
- Trust/data boundaries: Firebase token -> runner actor; private CLI snapshot -> runner adapter; runner projection -> Flutter. PM2/cwd/port/tmux never cross the public boundary.
- Selected ASVS v5.0.0: `v5.0.0-1.2.2` server-side access control, `v5.0.0-3.2.1` trusted session binding, `v5.0.0-5.1.4` input validation, `v5.0.0-7.4.1` sensitive-data logging controls and `v5.0.0-14.2.1` secure configuration; readiness must verify exact applicability against current ASVS text.
- Proof: hostile catalog/auth fixtures, DTO marker scans, SQLite isolation/migration tests and exact-origin route tests.
- Residual gap/owner: live Firebase and CAX11 evidence belongs to the rollout spec and release/operations owner.

## Execution Notes

- Write Batch PC-A, single sequential CLI ownership: after both this foundation and the preview ingress contract are frozen, one writer owns catalog v1 export together with exact-Host user-mode Caddy routing and HMR/lifecycle tests. Its complete write set is `cli/config.sh`, `cli/lib.sh`, `cli/install.sh`, and `tests/cli/**` in the ShipGlows CLI repository; no separate companion CLI batch or parallel CLI writer exists.
- Write Batch B, runner foundation ownership: new `runner/src/cloud-projects/**` and focused tests only.
- Write Batch C, Flutter ownership: new cloud-project provider/view files and focused tests only.
- Sequential integration ownership: existing runner `config.ts`, `app.ts`, `main.ts`, `db/index.ts`; Flutter `managed_runner_api.dart`, providers/router; deployment templates and docs. No parallel agent edits these shared files.
- Do not edit `TASKS.md`; implementation, readiness, remote mutation and shipping remain separate approvals.

## Open Questions

None. Fixed single-user Firebase, CLI authority, SQLite-only projection and deferral of Convex/Docker are explicit decisions.

## Skill Run History

| Timestamp (UTC) | Skill | Model | Action | Result | Next |
| --- | --- | --- | --- | --- | --- |
| 2026-08-17 22:45:49 UTC | 101-sg-ready | GPT-5 Codex | Rechecked canonical structure, dependencies, ZOMBIES, OWASP, fixed-UID authorization, SQLite authority and non-overlapping PC-A/runner/Flutter/integration write sets. | SAFE; metadata 4/4, structural and diff checks passed, and no unresolved readiness blocker remains | /102-sg-start ShipGlows Cloud Dev Gateway Foundation |
| 2026-08-17 22:23:23 UTC | 100-sg-spec | GPT-5 Codex | Converted the validated personal-cloud architecture into a bounded CLI/runner identity and catalog foundation. | reviewed; readiness review required | /101-sg-ready ShipGlows Cloud Dev Gateway Foundation |

## Current Chantier Flow

`100-sg-spec` (reviewed) -> `101-sg-ready` (SAFE; ready) -> `102-sg-start` (next; not started) -> `103-sg-verify` (not started) -> `104-sg-end` (not started) -> `005-sg-ship` (not authorized) -> `004-sg-deploy` (owned by personal-cloud rollout after separate remote authority)
