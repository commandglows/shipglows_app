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
scope: "shipglows-personal-cloud-rollout"
owner: "Diane"
confidence: high
user_story: "En tant qu'operatrice unique, je veux deployer de facon controlable ShipGlows App, son runner et ses previews sur Vercel et mon CAX11, afin de retrouver apres reboot une experience cloud authentifiee, permanente et verifiee dans le navigateur."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Vercel project and DNS"
  - "Hetzner CAX11"
  - "Caddy"
  - "PM2"
  - "Linux firewall"
  - "Firebase Auth"
  - "SQLite backup"
  - "Flutter Web"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-cloud-dev-gateway-foundation.md"
    artifact_version: "1.0.1"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-persistent-dev-preview-ingress.md"
    artifact_version: "1.0.1"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.31.3"
    required_status: "ready"
supersedes: []
evidence:
  - "Operator statement 2026-08-18: Vercel CLI already has DNS access; CAX11 access will be granted separately."
  - "Repository inspection 2026-08-18: runner PM2 and Caddy templates exist, but current docs explicitly state public TLS, Firebase actor/project provisioning and browser Workspace proof are unproven."
  - "Operator decision 2026-08-18: waiting for a better durable experience is acceptable; deployment must preserve the existing CLI/PM2/tmux workflow."
next_step: "/102-sg-start ShipGlows Personal Cloud Rollout"
---

# Spec: ShipGlows Personal Cloud Rollout

🟢 [shipglows_app] spec: ShipGlows Personal Cloud Rollout | status: ready | path: shipglows_data/workflow/specs/shipglows-personal-cloud-rollout.md | next: /102-sg-start ShipGlows Personal Cloud Rollout

## Title

ShipGlows Personal Cloud Rollout

## Status

Ready deployment contract after a SAFE `/101-sg-ready` verdict on 2026-08-18. Its ordered Vercel/DNS/CAX11/Caddy/firewall/PM2/SQLite/reboot/browser proof and rollback gates are executable, but readiness authorizes no remote mutation. Every external action still waits for separate operator authority after exact targets and rollback are resolved.

## User Story

En tant qu'operatrice unique, je veux deployer de facon controlable ShipGlows App, son runner et ses previews sur Vercel et mon CAX11, afin de retrouver apres reboot une experience cloud authentifiee, permanente et verifiee dans le navigateur.

## Minimal Behavior Contract

After the gateway, preview and Workspace contracts are locally green and separate remote authority is granted, the release publishes Flutter Web at the canonical app host, installs the loopback runner and two-layer Caddy ingress on the named CAX11, configures only required DNS/firewall exposure, and proves login, project discovery, preview/HMR and tmux reconnect before declaring availability. Any failed DNS, TLS, auth, process, reboot or browser gate stops the rollout and restores the last known configuration without opening internal ports. The easiest missed edge case is reboot recovery: PM2, SQLite, Caddy, CLI catalog and tmux-dependent capabilities must reconcile honestly after process order changes.

## Success Behavior

- `app.shipglows.com` serves the exact approved Flutter release with Firebase public configuration and runner base URL.
- `runner.shipglows.com` terminates current HTTPS and proxies HTTP/WebSocket only to loopback runner port 3210.
- The preview DNS namespace resolves to the CAX11 and certificate admission accepts only catalog-known preview hosts.
- Firewall exposes only required SSH administration and public HTTP/HTTPS; runner/devserver/user-Caddy ports remain private.
- Runner, user-mode Caddy and project processes are supervised by the existing PM2/CLI design; system Caddy owns public ingress.
- SQLite has a verified pre-change backup and fixed operator/project provisioning.
- One authenticated browser journey proves Projects -> Preview with assets/HMR -> Workspace -> disconnect/reconnect to the same tmux/Neovim state.
- A controlled reboot proves services recover or report explicit unavailable states without manual port recreation.

## Error Behavior

- Missing remote authority, credentials, exact host/IP, backup destination or rollback access stops before mutation.
- DNS/TLS mismatch, unauthorized preview exposure, CORS/cookie failure, public internal port or wrong Firebase project aborts the rollout.
- Caddy validation failure preserves the last active config; reload is never attempted with invalid configuration.
- Failed PM2 restart or SQLite migration restores the prior release/database under the approved rollback path.
- Reboot failure does not weaken firewall/auth or publish raw devservers; services remain unavailable until repaired.
- Browser proof failure keeps availability unclaimed even if health endpoints are green.

## Problem

Local components are substantially implemented, but deployment evidence is historical and incomplete. DNS alone cannot provide TLS routing; the runner identity database lacks the fixed live actor/project; and no current browser proof covers authenticated preview plus Workspace reconnect. Ad-hoc server changes would recreate the management burden this product is meant to remove.

## Solution

Treat deployment as a gated rollout consuming already-reviewed code artifacts. Capture immutable release/build identity and backups, configure Vercel and DNS, install root-managed Caddy/firewall once, keep the runner and project services loopback/private under existing PM2/CLI ownership, then execute ordered smoke, browser and reboot proofs. Record exact rollback and redacted evidence after each phase.

## Scope In

- Vercel Flutter Web build configuration, preview then production promotion.
- DNS records for app, runner and preview namespace.
- CAX11 inventory, backups, filesystem ownership and release placement.
- System Caddy public runner/preview ingress plus CLI user-Caddy handoff.
- Firewall verification and negative direct-port probes.
- PM2 runner startup/save/recovery aligned with the existing CLI.
- Fixed Firebase operator provisioning and SQLite backup/restore drill.
- Authenticated browser, HMR, Workspace reconnect and controlled reboot proof.
- Rollback and private operator runbook updates.

## Scope Out

- Writing gateway, preview or Workspace product code.
- Docker, containers, orchestration platforms, Convex or multi-user SaaS provisioning.
- Public preview sharing, billing, teams, customer isolation or support promises.
- Git push, production deploy or remote mutation before separate explicit authority.
- Studio compile/provider rollout.

## Constraints

- Remote writes use exact approved targets and preserve unrelated CAX11 services/configuration.
- Secrets live only in server/Vercel/Firebase secret stores with least privilege and never in Git, command output or evidence.
- Public Caddy is root-managed; user Caddy and PM2 remain unprivileged and loopback-bound.
- Every config file is backed up before replacement and validated before reload.
- No destructive cleanup, force operation, database overwrite or firewall lockout.
- Production claims require both authorized success and unauthenticated denial from an external browser/network.
- Deployment uses current official Vercel, Caddy, Firebase and Hetzner/firewall guidance checked immediately before execution.

## Test Contract

- Preconditions: all dependent specs readiness-approved and local gates green; exact Vercel project/domain, CAX11 host/user, Firebase project/UID and rollback path resolved.
- Order: read-only inventory -> backup -> staging config validation -> app preview deploy -> DNS/TLS -> runner auth -> preview denial/authorization/HMR -> Workspace reconnect -> reboot -> final browser proof.
- Automated proof: build identity, health/diagnostics, SQLite integrity/schema, Caddy validate, PM2 status, firewall listeners and DNS/TLS probes.
- Browser proof: signed-out denial, signed-in project list, preview/HMR, Workspace input/resize, Neovim state, disconnect/reconnect and session expiry recovery.
- Manual proof: operator confirms the correct personal Firebase account and final usability; no customer/public claim is inferred.

## Dependencies

- Readiness-approved gateway, preview ingress and amended Cockpit/Workspace specs.
- Explicit Vercel/DNS authority already configured but re-confirmed for exact records.
- Separate CAX11 access/privilege authority supplied later by the operator.
- Current official provider documentation and a recoverable release artifact.

## Invariants

- Runner and every devserver remain unreachable on direct public ports.
- Existing CLI, PM2, tmux and Neovim state is preserved.
- No remote mutation occurs before separate authority.
- A green health endpoint alone is not user-journey proof.
- Rollback never discards a live SQLite database or unrelated Caddy/PM2 configuration.
- Docker/Convex remain absent from this personal-cloud rollout.

## Links & Consequences

- Upstream: exact artifacts from the three implementation chantiers.
- Downstream: operator can use one app URL for Projects, Preview and Workspace.
- Operations: future releases repeat the same backup/validate/reload/browser/reboot gates proportionally.
- Security: system ingress and firewall become critical owned configuration requiring documented rollback.
- Product before -> after: fragile tunnels and manual tabs -> durable authenticated personal cloud after verified reboot.

## Documentation Coherence

- Update managed runner, operator Workspace and preview ingress runbooks with exact redacted deployment procedures.
- Update architecture/context with the observed production topology and evidence limits.
- Add a public availability statement only after the complete browser and denial proof passes; otherwise public editorial content is not impacted.

## Edge Cases

- Zero: no remote authority or no eligible project; rollout performs no mutation.
- One: one app, runner, project preview and operator account prove the minimal journey.
- Many: several preview hosts route independently without certificate or cookie cross-project confusion.
- Boundaries: DNS TTL, certificate issuance rate, firewall ports, disk space, SQLite backup size, PM2 restart count and reboot timeouts.
- Interfaces: Vercel->DNS, browser->Caddy, Caddy->runner/user-Caddy, runner->SQLite/catalog and PTY->tmux are verified separately.
- Exceptions: partial DNS propagation, invalid certificate, expired Firebase token, Caddy reload failure, PM2 crash loop, database restore and reboot ordering all stop with rollback or explicit degraded state.

## Implementation Tasks

1. Re-read provider documentation and inventory exact Vercel, DNS, CAX11, Firebase, PM2, Caddy, listener and database state without mutation.
2. Produce an exact remote mutation plan, backups and rollback commands; obtain separate operator approval.
3. Build and deploy the approved Flutter Web artifact to Vercel preview; verify build identity and auth configuration before production promotion.
4. Apply DNS and root Caddy/firewall configuration in bounded validated steps; prove direct-port denial.
5. Install/restart the runner under existing PM2 ownership and provision the fixed Firebase owner/project bindings idempotently.
6. Validate authorized runner/project/preview/Workspace flows and hostile denial from an external browser.
7. Perform an approved controlled reboot and repeat health, PM2, Caddy, catalog, preview/HMR and Workspace reconnect proof.
8. Record redacted evidence, rollback status and documentation; declare availability only if every blocking row passes.

## Acceptance Criteria

- `PCR-001`: no remote mutation occurs before exact-target approval.
- `PCR-002`: app, runner and preview DNS/TLS resolve to the intended services with valid current certificates.
- `PCR-003`: direct runner, user-Caddy and devserver ports are externally denied.
- `PCR-004`: wrong/no Firebase identity cannot list projects, bootstrap preview or open Workspace.
- `PCR-005`: authorized browser completes Projects -> Preview assets/HMR -> Workspace -> same-tmux reconnect.
- `PCR-006`: SQLite backup integrity and restore drill pass before availability.
- `PCR-007`: controlled reboot restores the approved experience or yields explicit bounded degraded state without security fallback.
- `PCR-008`: Caddy/PM2 rollback preserves unrelated services and the prior database.
- `PCR-009`: Docker, Convex and Studio compile providers are not introduced.
- ZOMBIES coverage: zero-authority no-op; one minimal project journey; many-host isolation; DNS/TLS/firewall/storage/time boundaries; provider/process/browser interfaces; exceptional rollback/reboot/auth expiry; simplest rollout uses existing PM2/CLI/Caddy layers.

## Test Strategy

- Provider CLI/API read-only inventories followed by exact scoped mutation receipts.
- DNS resolution and TLS chain/hostname probes from outside the CAX11.
- Listener/firewall matrix proving only 22/80/443 as approved and private loopback upstreams.
- PM2 status/log/restart counters, runner diagnostics and SQLite integrity/backup/restore evidence.
- Authenticated and unauthenticated browser automation at desktop/mobile widths, including HMR and Workspace reconnect.
- Post-reboot repetition plus diff/secret scans on deployment artifacts and documentation.

## Risks

- SSH/firewall lockout: preserve active session, staged rules and provider console recovery.
- DNS/certificate downtime: low-TTL staging, exact validation and rollback records.
- Database loss: online backup, integrity check and non-overwriting restore.
- Cookie/auth mismatch: same-site custom domains and exact Firebase configuration proved before promotion.
- PM2/Caddy ownership conflict: one public system Caddy and one loopback CLI Caddy with explicit boundaries.
- False availability claim: browser success and unauthorized denial are mandatory after reboot.

## OWASP Security Gate

- Top 10 considered: A01 public access controls, A02 Caddy/firewall/DNS configuration, A03 release/provider supply chain, A04 TLS/secrets/backups, A05 config/host injection, A06 rollout/reboot abuse cases, A07 Firebase session, A08 artifact/config integrity, A09 redacted operational evidence and A10 rollback/recovery.
- Trust/data boundaries: Vercel artifact/domain; public internet->Caddy; Caddy->loopback services; Firebase->runner; runner->SQLite/catalog; PTY->tmux.
- Selected ASVS v5.0.0: `v5.0.0-1.2.2`, `v5.0.0-3.3.1`, `v5.0.0-3.4.2`, `v5.0.0-7.4.1`, `v5.0.0-12.1.1` and `v5.0.0-14.2.1`; readiness rechecks exact current requirements and provider guidance.
- Proof: external denial/listener probes, TLS/browser tests, least-privilege secret inventory, artifact/build identity, backup/restore and reboot recovery.
- Residual gap/owner: external credentials, privilege, provider cost and maintenance windows remain operator-owned decisions at deployment time.

## Execution Notes

- This spec is sequential and remote-authority-gated; it does not join the code swarm.
- Vercel/DNS and CAX11 actions are separate approval checkpoints if their exact targets or rollback differ.
- Preserve unrelated dirty worktrees, Caddy sites, PM2 processes, secrets and databases.
- No code, `TASKS.md`, push or deployment is authorized by this spec creation.

## Open Questions

None. Host addresses, credentials and access are runtime inputs resolved under the separate remote approval gate, not hidden design decisions.

## Skill Run History

| Timestamp (UTC) | Skill | Model | Action | Result | Next |
| --- | --- | --- | --- | --- | --- |
| 2026-08-17 22:45:49 UTC | 101-sg-ready | GPT-5 Codex | Rechecked dependency readiness, exact remote authority boundaries, backup/rollback, TLS/firewall/PM2/SQLite/reboot/browser proof, OWASP, ZOMBIES and no-deploy-without-approval invariants. | SAFE; metadata 4/4, structural and diff checks passed, while remote execution remains separately approval-gated | /102-sg-start ShipGlows Personal Cloud Rollout |
| 2026-08-17 22:23:23 UTC | 100-sg-spec | GPT-5 Codex | Defined the gated Vercel/DNS/CAX11 rollout, rollback and reboot/browser proof contract. | reviewed; no remote authority granted | /101-sg-ready ShipGlows Personal Cloud Rollout |

## Current Chantier Flow

`100-sg-spec` (reviewed) -> `101-sg-ready` (SAFE; ready) -> `102-sg-start` (next; local/read-only preparation only until remote authority) -> dependent implementation/verification (pending) -> `004-sg-deploy` (blocked until separate exact-target authority) -> external browser/reboot proof (not started) -> `104-sg-end` (not started) -> `005-sg-ship` (not authorized)
