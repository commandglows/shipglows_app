---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "2.3.0"
project: "shipglows_app"
created: "2026-08-01"
updated: "2026-08-11"
status: draft
source_skill: "102-sg-start"
scope: "managed-runner-foundation"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/config.ts"
  - "runner/src/contracts/index.ts"
  - "runner/src/app.ts"
  - "runner/src/main.ts"
  - "runner/src/events/index.ts"
  - "runner/src/runs/limits.ts"
  - "runner/src/runs/execution.ts"
  - "runner/src/runs/fix.ts"
  - "runner/src/runs/approval.ts"
  - "runner/src/runs/conversation.ts"
  - "runner/scripts/provider-smoke.ts"
  - "app/lib/shipglows/data/managed_runner_api.dart"
  - "app/lib/shipglows/providers/managed_runner_provider.dart"
  - "runner/src/workspaces/cleanup.ts"
  - "runner/src/db/index.ts"
  - "runner/src/health/index.ts"
  - "runner/src/auth/index.ts"
  - "runner/src/github/index.ts"
  - "runner/src/workspaces/index.ts"
  - "runner/src/operator-workspace/index.ts"
  - "runner/scripts/operator-workspace-smoke.ts"
  - "app/lib/shipglows/presentation/screens/operator_workspace_screen.dart"
  - "app/lib/shipglows/providers/managed_workspace_provider.dart"
  - "lib/shipglows/auth/**"
  - "Flutter Web"
  - "OpenAI Codex app-server"
  - "eve"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.15.0"
    required_status: "ready"
supersedes: []
evidence:
  - "Managed Agent Cockpit MVP Tasks 1-3 foundation implementation"
  - "Fastify v5 current documentation check on 2026-08-01"
  - "Node.js sqlite API availability from Node.js v22.5.0"
  - "eve Apache-2.0 beta repository review on 2026-08-01"
  - "GitHub App and Git worktree official documentation check on 2026-08-02"
next_review: "2026-08-16"
next_step: "Complete public Caddy/TLS routing and actor/project provisioning, then prove the Workspace from Flutter Web."
---

# Managed Runner Foundation

## Purpose

The managed runner is ShipGlows's private control-plane service. It gives the Flutter application one versioned API boundary while keeping agent processes, repository workspaces, credentials, filesystem locations, PTY/tmux control and provider transports on the server.

## Owned Files

- `runner/src/config.ts`
- `runner/src/contracts/index.ts`
- `runner/src/app.ts`
- `runner/src/main.ts`
- `runner/src/events/index.ts`
- `runner/src/runs/limits.ts`
- `runner/src/runs/fix.ts`
- `runner/src/workspaces/cleanup.ts`
- `runner/src/db/index.ts`
- `runner/src/health/**`
- `runner/src/auth/**`
- `runner/src/projects/**`
- `runner/src/github/**`
- `runner/src/workspaces/**`
- `runner/src/operator-workspace/**`
- `runner/scripts/operator-workspace-smoke.ts`
- `runner/test/**`

## Entrypoints

- `npm start` starts the runner on loopback by default.
- `GET /v1/version` returns no filesystem paths, credentials or provider configuration. `GET /v1/projects/:projectId/authorization` is a read-only protected-route probe: it proves authentication plus tenant-scoped project membership and returns only the opaque project id and granted read capability.
- `loadConfig` refuses flags that would expose a public app-server, accept client-selected paths, or enable an unsafe shell.
- `RUNNER_OPERATOR_WORKSPACES` accepts only a server-owned JSON map from bounded project ids to absolute working directories and bounded tmux names. Neither value is returned to Flutter.
- `npm run smoke:operator-workspace` creates an isolated real PTY/tmux session, proves resize and input/output with the installed Codex executable, scans the bounded transcript for obvious secret markers, and cleans the temporary tmux session.

## Current Foundation

- The public API is versioned under `v1` and uses closed schemas.
- A production runner is loopback-only behind Caddy. It refuses to start unless Firebase authentication and an explicit `RUNNER_ALLOWED_ORIGINS` allowlist are configured; GitHub App and Codex remain separately opt-in server integrations. The deployment templates reserve `runner.shipglows.com` and port `3210` without committing secrets or a SQLite projection.
- `GET /v1/projects/resolve?sourceSystem=...&sourceProjectId=...` is the canonical read-only identity bridge for deployments where the existing app project namespace differs from runner project IDs. It requires authentication, resolves through a server-owned tenant-scoped directory, rechecks read access on the resolved runner project, and returns only bounded opaque identifiers; it returns `503 identityUnavailable` until that directory is configured.
- Server-side project provisioning can persist the bridge atomically by calling `OperationalStore.createProject` with `sourceSystem` and `sourceProjectId`, or by calling `bindProjectIdentity` for an existing runner project. The Flutter `/api/projects` client is not allowed to perform this write; its FastAPI implementation is outside this repository and must call the runner through a server-to-server deployment adapter.
- `AgentRuntime` is the product-owned contract for sessions, turns, interruption, approval support and semantic event streams.
- `ExecutionProvider`, `CapabilityBroker` and `ModelGateway` are separate ports. The local `managed-disposable` provider is selected through a registry and validates required capabilities without fallback. Every audit, conversation turn and fix now persists a server-resolved, manual-only execution envelope before provider preflight; it contains only opaque identifiers, provider/runtime selection, bounded capabilities, duration budget and deadline.
- Codex is now the first contract-tested adapter behind `AgentRuntime`, using a server-owned local JSONL app-server connection; Eve remains a future adapter while its beta API and deployment posture remain in flux.
- The SQLite store holds a reconstructable operational projection: tenants, memberships, projects, canonical cross-namespace project identity bindings, GitHub repository bindings, conversations, durable run states/checkpoints, secret-safe execution envelopes, runtime session mappings, capability decisions, approvals, health evidence, usage summaries, event cursors, idempotency records and workspace-cleanup state. Schema v7 stores operational metadata only; repository and Markdown content remain canonical.
- Provider preflight always occurs before a worktree, runtime session or turn is created. A failed preflight has a stable bounded execution failure and cannot change provider, runtime, policy or permission. The envelope excludes prompts, environment variables, tokens and workspace paths; cancellation accepts only opaque run and execution identifiers. Its state moves monotonically from preflight to the same terminal outcome as the run.
- Run checkpoints are secret-safe and tenant-scoped. A runner restart marks in-flight `running` records and their matching preflight-passed executions as `interrupted` with a bounded recovery reason. The local provider does not claim drain, remote task preservation or reattachment; those need a separate distributed-execution contract.
- Workspace cleanup records contain only an opaque run id, state, due time, attempt count and bounded error code; managed filesystem paths remain exclusively inside the workspace manager.
- Runtime sessions, capability decisions, approvals, health evidence and usage summaries are tenant-scoped projections. Health summaries pass the same secret-safety checks as event payloads, and usage values are bounded non-negative counters.
- `ShipGlowsHealthEvaluator` is the single runner authority for the five-dimensional Cockpit projection. It always emits tech, content, SEO, performance and security; absent evidence is `notReported`, malformed or secret-bearing evidence fails closed, and healthy evidence older than 30 days becomes `stale` without downgrading older warning or critical findings. Coverage excludes `unknown` and `notReported`, while the overall status retains the worst reported state.
- The first protected audit command creates a durable conversation/run, initializes the selected runtime, starts a turn, and records a safe running/failed projection. Event-stream persistence, bounded live fan-out, the state-changing Origin policy, per-tenant admission quota and bounded timeout/interruption reconciliation are implemented. The `POST /fixes` path now validates bounded issue/instruction input, requires a durable `Idempotency-Key`, and, when GitHub App configuration is enabled, revalidates the binding, creates a server-owned isolated fix worktree, starts Codex with that internal workspace, and schedules cleanup without exposing its path; it remains unavailable when the provider is not configured.
- The operational store replays completed asynchronous audit/fix commands from SQLite and coalesces concurrent duplicate keys inside one process. Both state-changing command routes require a bounded `Idempotency-Key`. The cleanup worker scans all tenant cleanup records every minute, resolves run/project/binding context server-side, removes managed worktrees, and marks bounded success/failure states; no local path is persisted.
- Conversation commands now use `POST /v1/projects/:projectId/conversations`, `/messages`, `/interrupt` and `/resume`. They resolve sessions and runs server-side, pass message turns through the neutral runtime port, persist normalized events, enforce the shared run quota/timeout boundary, and require durable idempotency keys. Approval decisions use `POST /v1/projects/:projectId/approvals/:approvalId` with the same contract: the runner verifies the tenant/project/run/session boundary, resolves the provider approval, persists the approved/denied projection, publishes a safe `approval.resolved` event, and replays duplicate decisions without calling the runtime twice.
- The authenticated `GET /v1/projects/:projectId/operator-workspace` capability route is the discovery boundary for the optional advanced operator surface. It requires project read access and reports unavailable when the project has no server-owned allowlist entry.
- `POST /v1/projects/:projectId/operator-sessions` requires authentication, project access, trusted Origin policy and a bounded idempotency key. It returns one opaque project/actor-scoped session capability with a one-minute attachment lifetime; duplicate keys replay the live capability and creating a different session replaces the previous actor/project session.
- `WS /v1/operator-sessions/:sessionId/stream` carries only bounded PTY input, output, resize and status frames. The capability travels as a WebSocket subprotocol rather than in the URL. Invalid, expired and concurrent attachments close with a bounded denial; disconnect permits bounded reconnect to the same server PTY, and the authenticated close route releases only an actor-owned session.
- The gateway spawns `tmux new-session -A` with fixed arguments from the server allowlist through `node-pty`. Flutter cannot select a shell command, filesystem path, tmux name, host, or execution permission.
- Flutter now has an opt-in `ManagedRunnerApi`, a provider-neutral `ManagedRunnerClient`, Riverpod conversation state, and a first managed-agent panel on project detail. `MANAGED_RUNNER_BASE_URL` enables it; the client obtains the current provider-neutral auth token, sends explicit `Idempotency-Key` values for commands, maps safe runner errors, parses chunked authenticated SSE frames, and remains visibly disabled when the runner URL is not configured. The panel supports create/send/interrupt/resume and approval decisions, accepts only an opaque `runnerProjectId`, and now resolves it from the existing authenticated `availableProjectsProvider` by normalized unique project name; ambiguous or unavailable matches remain non-executable.
- Flutter now exposes a dedicated operator Workspace route from a server-backed project detail. It creates the short-lived session over authenticated HTTP, connects through `web_socket_channel`, renders output and captures keyboard input with `xterm`, forwards bounded resize frames, and closes the session on screen disposal. Unavailable and interrupted states remain explicit; no SSH credential, server path, PTY handle or tmux identifier is presented. Cockpit and semantic Codex conversations remain the normal user surface.
- The composition root now opens the server-owned SQLite projection, optionally enables Firebase ID-token authentication and Codex stdio, and closes the store with the app lifecycle. The protected event route emits a bounded, tenant-scoped SSE replay with cursor resume and heartbeat; `live=true` adds tenant/conversation-scoped in-process fan-out, a 30-second idle bound, and disconnect cleanup.
- All persisted event, run checkpoint, and idempotency payloads are checked for credentials, cookies, authorization material, clone paths and recognizable token values.
- Firebase Auth is the identity adapter. The runner verifies an access token with the project's JWKS, accepts only RS256 ID tokens with its expected issuer and audience, then resolves the JWT subject through a tenant membership lookup.
- Flutter exposes a provider-neutral `ShipGlowsAuthProvider`. The optional Firebase adapter maps only `userId`, access token and expiry into that contract; no Firebase wire type reaches feature code.
- A Flutter build without both `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID` and `FIREBASE_PROJECT_ID` keeps the local dashboard available with an explicitly disabled auth adapter. The Firebase client configuration is public application metadata; privileged Firebase service-account credentials remain server-only.
- GitHub access uses a GitHub App rather than OAuth or a personal access token. Enabling it requires the server-only `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY`; classic `GITHUB_TOKEN` configuration is rejected.
- A GitHub App issuer signs a short app JWT, requests one installation token limited to one repository and `Contents: read`, and refuses expired, long-lived, widened, or permission-expanded responses. The token is scoped to one internal callback and is never cached, returned, logged, or persisted.
- Repository-sensitive work rechecks the immutable repository id, full name, default branch, and archived state with GitHub before Git runs. The resulting internal binding contains repository metadata only, never a credential.
- The workspace manager owns opaque mirror, audit and fix paths. It rejects traversal and escaping symlinks, creates detached audit worktrees, creates one local `shipglows/fix/...` branch per fix conversation, serializes mutation per project, and can remove stale worktrees.
- The guarded provider smoke harness runs with `cd runner && npm run smoke:providers -- --confirm` only after review. It requires `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`, `RUNNER_SMOKE_GITHUB_INSTALLATION_ID`, `RUNNER_SMOKE_GITHUB_REPOSITORY_ID`, `RUNNER_SMOKE_GITHUB_FULL_NAME` and `RUNNER_SMOKE_GITHUB_DEFAULT_BRANCH`; it revalidates the GitHub App binding, creates only a temporary detached audit worktree, starts Codex with a read-only prompt, requires a terminal turn event, removes the temporary workspace, and never prints credentials.
- The operator smoke passed on the managed server with a real PTY, isolated tmux session, resize, terminal input/output, installed Codex executable, and cleanup. That proof used the previously provisioned Supabase deployment. Repository source and templates now target Firebase Auth, but the managed server has not yet been reconfigured or re-proven with Firebase; the old loopback evidence must not be presented as Firebase deployment proof.
- This is not public end-to-end proof. `runner.shipglows.com` resolves to the managed host, but the root-owned system Caddy configuration has no route for it and TLS fails before the runner. The operational identity database also has no provisioned actor/project, so the Flutter browser flow cannot yet receive an authorized capability.
- The production Git transport executes fixed Git argument lists without a shell. Its HTTP authorization lives only in the child process environment; it is never embedded in a clone URL or command argument and Git output is not surfaced.

## Invariants

- The runner binds to `127.0.0.1` or `::1` unless an explicit public-binding flag is set.
- No raw Codex, ACP, PTY, tmux, SSH, filesystem or model-provider transport is a public endpoint.
- Flutter does not import runtime-specific types or use runtime session identifiers as authorization proof.
- A missing capability returns `runtimeCapabilityUnavailable`; it never causes a different runtime or broader permission to be selected.
- Firebase Auth is the source-code identity adapter. Retired Clerk and Supabase configuration is rejected before startup.
- Authentication fails closed for a malformed token, failed signature/claim validation, invalid tenant header, missing tenant membership or unavailable auth adapter.
- State-changing routes reject a present `Origin` unless it exactly matches the normalized `RUNNER_ALLOWED_ORIGINS` allowlist. Native clients may omit `Origin`; reads and SSE are not blocked by this state-changing policy.
- The runner, not the Flutter client, maps a Firebase subject to a ShipGlows actor and tenant. A bearer token alone never selects a project or expands permissions.
- SQLite is an operational projection and cannot overwrite repository/Markdown authority. GitHub bindings are read only through their owning tenant and contain no token or private key.
- GitHub App private keys and installation tokens are server-only. A public API response, SQLite event, diagnostic, log, Git URL, Git argument or Flutter payload must not contain either.
- A managed audit always uses a detached worktree. A managed fix creates a local isolated branch only; it has no push, merge, deploy, or canonical-branch mutation path.
- Active runs are admitted through a shared per-tenant limit and released on terminal event, timeout, or startup failure. The configured maximum duration interrupts the selected runtime; a failed interrupt is projected as a bounded failure code.
- Every admitted execution is manual-only and immutable after persistence. Provider capability or preflight rejection occurs before side effects and cannot silently fall back to another provider or runtime.
- The optional operator Workspace is a separate capability from semantic Codex conversations. It remains server-owned, tenant/project-scoped, allowlisted, short-lived, and unavailable by default for projects without an explicit server mapping.

## Validation

```bash
cd runner
npm test
npm run typecheck
npm run lint
npm run audit
rg -n "@clerk/fastify|RUNNER_UNSAFE_SHELL|RUNNER_PUBLIC_APP_SERVER|RUNNER_ALLOW_CLIENT_PATHS|GITHUB_TOKEN" src test package.json
cd ../app && flutter analyze && flutter test test/shipglows/auth/auth_provider_test.dart
```

## Reader Checklist

- Does a new adapter implement `AgentRuntime` without leaking its wire protocol?
- Does a new action install the authentication guard and validate actor, tenant, project and capability server-side?
- Does repository work revalidate the GitHub App binding immediately before a mirror/fetch/worktree operation?
- Does new persisted or streamed data remain redacted and bounded?
- Does a new execution provider remain disposable or explicitly operator-persistent?
- Does the public route schema omit host paths, raw credentials and terminal output?
- Does the operator Workspace remain fail-closed for missing authorization, allowlist, capability, TLS, or identity provisioning?

## Maintenance Rule

Update this document whenever the runner gains an adapter, route family, auth provider, persistence schema, execution provider, capability rule or public diagnostic surface. Distinguish contract proof, isolated real-server smoke, loopback deployment, and public authenticated proof. The operator PTY has isolated real-server proof and the runner is supervised on loopback; GitHub App/provider execution and the browser-to-runner Workspace journey remain unproven.
