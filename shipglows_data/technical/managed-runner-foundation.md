---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "3.6.0"
project: "shipglows_app"
created: "2026-08-01"
updated: "2026-08-21"
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
  - "app/lib/shipglows/data/conversations/**"
  - "app/lib/shipglows/providers/managed_runner_provider.dart"
  - "app/lib/shipglows/providers/managed_cockpit_provider.dart"
  - "app/lib/shipglows/providers/managed_conversation_provider.dart"
  - "app/lib/shipglows/presentation/screens/cockpit_screen.dart"
  - "app/lib/shipglows/presentation/widgets/cockpit/**"
  - "app/lib/shipglows/presentation/widgets/conversations/**"
  - "runner/src/workspaces/cleanup.ts"
  - "runner/src/db/index.ts"
  - "runner/src/health/index.ts"
  - "runner/src/observability/index.ts"
  - "runner/scripts/backup-operational-store.ts"
  - "runner/src/skills/contracts.ts"
  - "runner/src/skills/sandbox.ts"
  - "runner/src/auth/index.ts"
  - "runner/src/github/index.ts"
  - "runner/src/workspaces/index.ts"
  - "runner/src/operator-workspace/index.ts"
  - "runner/src/studio/contracts.ts"
  - "runner/src/studio/capability.ts"
  - "runner/src/studio/previewRuntimeProvider.ts"
  - "runner/src/studio/routes.ts"
  - "runner/src/studio/session.ts"
  - "runner/src/studio/workerProvider.ts"
  - "runner/src/studio/providers/managedSandbox.ts"
  - "runner/src/studio/providers/attestation.ts"
  - "runner/src/studio/providers/evidenceVerifier.ts"
  - "runner/src/studio/providers/vercelSandboxProvider.ts"
  - "runner/src/studio/projectTargetDetector.ts"
  - "runner/src/studio/compilationRouter.ts"
  - "runner/src/studio/compilationRoutingRoutes.ts"
  - "runner/test/studio/compilationRoutingRoute.test.ts"
  - "app/lib/domain/studio/studio_compilation_routing.dart"
  - "runner/scripts/operator-workspace-smoke.ts"
  - "app/lib/shipglows/presentation/screens/operator_workspace_screen.dart"
  - "app/lib/shipglows/providers/managed_workspace_provider.dart"
  - "lib/shipglows/auth/**"
  - "Flutter Web"
  - "OpenAI Codex app-server"
  - "eve"
  - "shipglows_data/technical/platforms/vercel.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.21.0"
    required_status: "ready"
supersedes:
  - "shipglows_data/technical/managed-runner-foundation.md@3.2.0"
  - "shipglows_data/technical/managed-runner-foundation.md@3.1.1"
  - "shipglows_data/technical/managed-runner-foundation.md@3.1.0"
  - "shipglows_data/technical/managed-runner-foundation.md@3.0.0"
  - "shipglows_data/technical/managed-runner-foundation.md@2.8.0"
  - "shipglows_data/technical/managed-runner-foundation.md@2.7.0"
evidence:
  - "Managed Agent Cockpit MVP Tasks 1-3 foundation implementation"
  - "Fastify v5 current documentation check on 2026-08-01"
  - "Node.js sqlite API availability from Node.js v22.5.0"
  - "Node.js sqlite backup API availability from Node.js v22.16.0"
  - "eve Apache-2.0 beta repository review on 2026-08-01"
  - "GitHub App and Git worktree official documentation check on 2026-08-02"
  - "Flutter Task 9-10 local proof on 2026-08-11: 194 tests, clean analysis, and release Web build."
  - "Final runner Studio proof on 2026-08-16: 35/35 focused tests, TypeScript typecheck, and full lint pass; no OCI worker was provisioned or invoked."
  - "Earlier trusted-base cross-surface proof on 2026-08-16: site 13/13 with check/build/exclusion and Flutter 24 Studio plus five theme tests (29/29 combined) with clean analysis/format."
  - "Five focused defects are closed: exact handshake validation, loop/revision ordering, atomic idempotency, distinct 256 KiB total-message and 16 KiB command limits, and late provider cleanup after timeout."
  - "Earlier provider-neutral managed-sandbox admission and account-free injected Vercel adapter conformance passed independent verification on 2026-08-16: 48/48 focused tests, 73/73 then-current Studio tests, typecheck, lint, diff check, and zero high-severity findings in the offline dependency audit."
  - "No Vercel SDK/package, account, credential, provider/network call, production wiring, generated execution, preview, persistence, artifact export, or availability proof exists."
  - "Universal routing local proof on 2026-08-16: five closed targets, authenticated revision/digest-bound projection, canonical artifact evidence, independent worker-evidence verification, Runner 96 pass/1 Windows symlink skip, Flutter Studio 32/32, clean static/offline-audit gates, and independent P0/P1/P2=0."
next_review: "2026-09-13"
next_step: "Keep all compilation unavailable until separately authorized real Linux, Windows, and macOS execution-class proofs exist."
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
- `runner/src/observability/**`
- `runner/src/skills/**`
- `runner/src/auth/**`
- `runner/src/projects/**`
- `runner/src/github/**`
- `runner/src/workspaces/**`
- `runner/src/operator-workspace/**`
- `runner/src/studio/**`
- `runner/scripts/operator-workspace-smoke.ts`
- `runner/scripts/backup-operational-store.ts`
- `runner/test/**`

## Studio Contract Foundation

The runner owns the versioned Studio contract, repository/runtime identity, session journal, Laboratory policy, and compile-admission boundary. Target negotiation admits only `shipglows.astro.hero.v1`, the exact configured clean Git HEAD/tree digest, an HTTP loopback origin, bridge v1, all eight reviewed anchors, and the read-only `inspect` capability. Exact handshake validation and loop/revision ordering are covered by the final focused pass. Repository dirtiness, revision/digest drift, runtime health failure, origin credentials, bridge/profile/anchor mismatch, timeout, or resolver exception returns unavailable without fallback.

`GET /v1/projects/:projectId/studio/capability` is the authenticated discovery boundary for the inspect-only Astro pilot. It requires project read authorization and returns only the exact contract/profile/bridge versions, runner-attested source revision and repository digest, loopback preview origin, `inspect`, and eight semantic surface summaries. The site is not trusted to declare repository identity and provides no revision/digest header.

Authenticated project-mutation routes now create actor/tenant/project-scoped ephemeral sessions, apply closed semantic `VisualCommand` schemas, compact compatible commands, preserve ordered undo/redo, expose bounded events, enforce 30-minute idle and four-hour absolute expiry, manage up to eight variants, and activate Laboratory from hard/soft policy triggers. Commands, events, and projections contain no host path, raw project content, prompt, credential, provider event, or executable text.

Session creation idempotency is serialized and replayed atomically under concurrency. Studio enforces separate bounds of 16 KiB per semantic command and 256 KiB for the complete bridge message. Preview-start and worker-preflight timeouts attach late cleanup/release handlers so a provider that resolves after the timeout does not leak an admitted resource.

The compile route freezes one accepted variant into an immutable `CompileIntent`, reattests the base identity, and permits only one idempotent attempt. `StudioCompileAdmissionService` now validates a provider-neutral managed-sandbox envelope against immutable policy, image, phase, expiry, resource/cost budgets, and independently verified capability evidence. Provider self-attestation is insufficient: evidence must bind the provider, adapter, account/project/configuration digests, exact scenario, resource identity, budget, observation and expiry before admission. This is an admission implementation only. `main.ts` injects no managed provider, so compile returns bounded `studioCompileUnavailable`/`503`, creates no worktree, invokes no agent, executes no generated code on the host, produces no patch, and reloads no runtime.

The first adapter, `VercelSandboxProvider`, uses an injected narrow client facade and deterministic local fakes. It adds no Vercel SDK/package or import. The adapter starts each allocation non-persistent with zero ports and deny-all networking; generation can move only to one exact HTTPS root broker policy, while verification stays deny-all without a model capability. It enforces complete immutable budgets, atomic lifecycle-call reservations, shared active/pending/quarantine capacity, provider-wide sliding API limits, same-key preflight coalescing, exact evidence/lease correlation, idempotent release, orphan reconciliation, and quarantine on cleanup uncertainty. No command, source transfer, snapshot, provider preview, persistence, or artifact export method is implemented.

Studio is disabled by default. Configuration rejects partial enablement and refuses Studio enablement in production. No customer-controlled preview, hosted end-to-end proof, or public availability claim exists.

### Universal routing projection

`projectTargetDetector.ts` parses repository evidence as bounded data without executing manifests or project commands. Its capability digest covers the exact source revision, repository digest, declared targets, and sorted artifact digests. Astro requires `site/package.json` plus `site/pnpm-lock.yaml`. Flutter requires `app/pubspec.yaml`, `app/pubspec.lock`, and exactly the platform markers corresponding to advertised Web, Android, Windows, and iOS targets; Android accepts exactly one server-detected Gradle settings form.

`compilationRouter.ts` owns the exhaustive target-to-execution-class/toolchain table. `compilationRoutingRoutes.ts` exposes the separate authenticated read-only `GET /v1/projects/:projectId/studio/compilation-routing` projection with `private, no-store`. Its optional resolver must provide an independent `CompilationWorkerEvidenceVerifier`; absence, exception, stale evidence, cross-tenant/project/target replay, artifact drift, ambiguity, or mismatch produces unavailable and never falls back to the runner host. The Dart parser applies the same closed five-route and artifact-evidence invariants before the Flutter provider displays them.

The endpoint is not registered with a resolver in `main.ts`. Its local fake-verifier success proves contract correlation only, not a real worker or compiler. The existing Astro capability route and compile-intent body remain unchanged, and compilation still accepts no client-selected artifact target.

## Entrypoints

- `npm start` starts the runner on loopback by default.
- `GET /v1/version` returns no filesystem paths, credentials or provider configuration. `GET /v1/projects/:projectId/authorization` is a read-only protected-route probe: it proves authentication plus tenant-scoped project membership and returns only the opaque project id and granted read capability.
- `GET /v1/projects/:projectId/studio/capability` is a read-only authenticated projection. It returns `503 studioUnavailable` unless a server-owned resolver admits the exact trusted Astro base revision and loopback origin.
- `POST /v1/projects/:projectId/studio-sessions` and its command, undo/redo, variant, event, interrupt, close, and compile-intent routes require authenticated project scope; mutations also require the trusted-Origin policy and bounded idempotency.
- `loadConfig` refuses flags that would expose a public app-server, accept client-selected paths, or enable an unsafe shell.
- `RUNNER_OPERATOR_WORKSPACES` accepts only a server-owned JSON map from bounded project ids to absolute working directories and bounded tmux names. Neither value is returned to Flutter.
- `npm run smoke:operator-workspace` creates an isolated real PTY/tmux session, proves resize and input/output with the installed Codex executable, scans the bounded transcript for obvious secret markers, and cleans the temporary tmux session.
- `GET /health/live` is the public, dependency-free liveness probe and returns only `{ "status": "ok" }`. `GET /v1/diagnostics` is authenticated and returns only bounded build identity, UTC/Europe-Paris timestamps and normalized probe states.
- `npm run backup:sqlite -- --database <live.sqlite> --destination-dir <backup-dir>` creates a uniquely named online backup, refuses a missing/non-file source or existing destination, and validates SQLite integrity plus the current schema before reporting success.

## Current Foundation

- The public API is versioned under `v1` and uses closed schemas.
- A production runner is loopback-only behind Caddy. It refuses to start unless Firebase authentication and an explicit `RUNNER_ALLOWED_ORIGINS` allowlist are configured; GitHub App and Codex remain separately opt-in server integrations. The deployment templates reserve `runner.shipglows.com` and port `3210` without committing secrets or a SQLite projection.
- `GET /v1/projects/resolve?sourceSystem=...&sourceProjectId=...` is the canonical read-only identity bridge for deployments where the existing app project namespace differs from runner project IDs. It requires authentication, resolves through a server-owned tenant-scoped directory, rechecks read access on the resolved runner project, and returns only bounded opaque identifiers; it returns `503 identityUnavailable` until that directory is configured.
- Server-side project provisioning can persist the bridge atomically by calling `OperationalStore.createProject` with `sourceSystem` and `sourceProjectId`, or by calling `bindProjectIdentity` for an existing runner project. The Flutter `/api/projects` client is not allowed to perform this write; its FastAPI implementation is outside this repository and must call the runner through a server-to-server deployment adapter.
- `AgentRuntime` is the product-owned contract for sessions, turns, interruption, approval support and semantic event streams.
- `ExecutionProvider`, `CapabilityBroker` and `ModelGateway` are separate ports. The local `managed-disposable` provider is selected through a registry and validates required capabilities without fallback. Every audit, conversation turn and fix now persists a server-resolved, manual-only execution envelope before provider preflight; it contains only opaque identifiers, provider/runtime selection, bounded capabilities, duration budget and deadline.
- Codex is the first contract-tested adapter behind `AgentRuntime`, using the pinned server-owned ACP subprocess over local stdio; the previous app-server adapter remains rollback-only. ACP notifications and permission requests are accepted only during an active turn, idle or post-terminal traffic is discarded, and a fresh runner instance refuses cold resume because its trusted workspace binding is intentionally process-local.
- The SQLite store holds a reconstructable operational projection: tenants, memberships, projects, canonical cross-namespace project identity bindings, GitHub repository bindings, conversations, durable run states/checkpoints, secret-safe execution envelopes, runtime session mappings, capability decisions, approvals, project-context bundles, versioned skill runs, health evidence, usage summaries, event cursors, idempotency records and historical workspace-cleanup state. Schema v9 stores operational metadata only; repository and Markdown content remain canonical.
- Operational diagnostics never include probe exceptions, filesystem paths, credentials or runtime configuration. Invalid build metadata becomes `unknown`; synthetic dependency failures become the fixed `dependencyFailure` code. The public liveness route is deliberately separate from this authenticated surface.
- Sentry error reporting is disabled by default and requires an explicit HTTPS DSN plus bounded release identity. It disables automatic integrations, tracing, breadcrumbs and default PII, scrubs every event to a stable runner failure code with bounded release/environment identity, and cannot fail the request path if the SDK is unavailable.
- Online SQLite backup uses the Node-supported `node:sqlite.backup` API and therefore raises the runner floor to Node 22.16.0. The backup is non-overwriting, checked with `PRAGMA integrity_check`, checked against schema v9, and covered by a v2-to-v9 migration/restore fixture. This is local recovery proof, not a hosted retention or disaster-recovery claim.
- Provider preflight always occurs before a worktree, runtime session or turn is created. A failed preflight has a stable bounded execution failure and cannot change provider, runtime, policy or permission. The envelope excludes prompts, environment variables, tokens and workspace paths; cancellation accepts only opaque run and execution identifiers. Its state moves monotonically from preflight to the same terminal outcome as the run.
- Run checkpoints are secret-safe and tenant-scoped. A runner restart marks in-flight `running` records and their matching preflight-passed executions as `interrupted` with a bounded recovery reason. The local provider does not claim drain, remote task preservation or reattachment; those need a separate distributed-execution contract.
- Workspace cleanup records contain only an opaque run id, state, due time, attempt count and bounded error code; managed filesystem paths remain exclusively inside the workspace manager.
- Runtime sessions, capability decisions, approvals, health evidence and usage summaries are tenant-scoped projections. Health summaries pass the same secret-safety checks as event payloads, and usage values are bounded non-negative counters.
- `ShipGlowsHealthEvaluator` is the single runner authority for the five-dimensional Cockpit projection. It always emits tech, content, SEO, performance and security; absent evidence is `notReported`, malformed or secret-bearing evidence fails closed, and healthy evidence older than 30 days becomes `stale` without downgrading older warning or critical findings. Coverage excludes `unknown` and `notReported`, while the overall status retains the worst reported state.
- `BoundedProjectAiReadinessEvaluator` adds a separate advisory projection for catalog-backed projects. Version 1 scores structure, machine-readable schemas/contracts, agent guidance, `llms.txt`, web sitemap/indexability when applicable, and fast feedback from lockfiles plus standard validation entry points. It streams directory entries under a fixed global entry/depth/file-size budget, rejects non-canonical and observed symlink paths, coalesces concurrent work per root, and admits at most four scans at once. Entry or manifest-budget exhaustion returns only conclusive partial evidence without a score; malformed or contradictory evaluator output becomes a project-local unavailable result. `ready` requires at least 80 plus passed structure, agent-guidance, and fast-feedback checks. The Flutter Cockpit validates score-to-evidence invariants, tolerates a pre-feature runner as unavailable, and renders score, evidence coverage and accessible check outcomes separately from project health; none grants execution or trust authority.
- Versioned `ProjectContextBundle`, skill-run and skill-evidence contracts bind every accepted result to one tenant, project, source commit and bounded redacted source set. Validation rejects unsupported versions, cross-project or detached provenance, invalid chronology, secret-bearing summaries, failed runs that publish evidence, unknown source kinds and duplicate dimension results before persistence.
- `GET /v1/projects/:projectId/context` projects only the latest authorized bundle’s observation date, source commit, bounded source-kind counts and redaction count. It never returns tenant/bundle identifiers, source references, source hashes, local paths or source content; missing storage, missing context, stale context and lost access remain distinct states.
- `POST /v1/projects/:projectId/context/refresh` is the explicit local-only producer boundary. It requires authentication, project read access, the trusted state-changing Origin and a bounded `Idempotency-Key`; the runner resolves the registered local path and Git `HEAD`, scans only fixed root manifests plus `.md`/`.json`/`.yaml`/`.yml` files below `shipglows_data`, rejects symlinks and boundary drift, caps traversal/files/per-file/total bytes, hashes source bytes into private opaque references, coalesces concurrent work per tenant/project and reuses an unchanged latest bundle. It never writes to the indexed repository and returns only the same redacted projection as the read route.
- Schema v9 adds a durable partial uniqueness constraint for one open conversation per tenant/project. Migration keeps the newest conversation open and closes older projections; explicit close is rejected while a run is queued or running. The schema retains v8's atomic context, skill-run and evidence persistence.
- The first real health producer runs the fixed `shipglows.tech.snapshot@1.0.0` read-only audit in `just-bash` 3.2.0 against an in-memory, pre-redacted snapshot only. Host filesystem access, network, JavaScript and Python are not enabled; the command registry, file/byte counts, output grammar, execution count/depth and wall-clock duration are bounded. Only a normalized status, issue count, source hashes and opaque provenance are persisted. Because the published 3.2.0 npm tarball omits several declaration files re-exported by its public types, the adapter uses one local minimal CommonJS type boundary rather than disabling project-wide library checking.
- The protected conversation, audit and fix commands all resolve one canonical server-owned repository checkout. Before runtime creation the delivery guard requires the exact configured `main` or `preview` branch, a clean tree, and a fetched remote that has not advanced or diverged. It never resets, rebases, switches branch, creates a worktree, or falls back to another target.
- A completed fix must leave the canonical checkout clean and committed. The runner re-fetches the configured branch, verifies that its remote head is unchanged since admission, then performs one ordinary non-force `HEAD:refs/heads/<deliveryBranch>` push. Dirty, mismatched, advanced, divergent, unavailable, or rejected delivery becomes a stable failed run; merge, deploy and force-push remain absent.
- Conversation commands use create, message, interrupt, resume, and explicit close routes. SQLite admits only one open conversation per tenant/project across concurrent requests and restarts; close releases it only after active work ends. Flutter presents one tab, restores only the open conversation, and explains `projectBusy` and delivery-guard failures. Approval decisions retain their tenant/project/run/session and idempotency boundaries.
- The authenticated `GET /v1/projects/:projectId/operator-workspace` capability route is the discovery boundary for the optional advanced operator surface. It requires project read access and reports unavailable when the project has no server-owned allowlist entry.
- `POST /v1/projects/:projectId/operator-sessions` requires authentication, project access, trusted Origin policy and a bounded idempotency key. It returns one opaque project/actor-scoped session capability with a one-minute attachment lifetime; duplicate keys replay the live capability and creating a different session replaces the previous actor/project session.
- `WS /v1/operator-sessions/:sessionId/stream` carries only bounded PTY input, output, resize and status frames. The capability travels as a WebSocket subprotocol rather than in the URL. Invalid, expired and concurrent attachments close with a bounded denial; disconnect permits bounded reconnect to the same server PTY, and the authenticated close route releases only an actor-owned session.
- The gateway spawns `tmux new-session -A` with fixed arguments from the server allowlist through `node-pty`. Flutter cannot select a shell command, filesystem path, tmux name, host, or execution permission.
- Flutter now has an opt-in `ManagedRunnerApi`, a provider-neutral `ManagedRunnerClient`, and bounded Riverpod state. `MANAGED_RUNNER_BASE_URL` enables it; the client obtains the current provider-neutral auth token, sends stable `Idempotency-Key` values across retries, maps safe runner errors, parses chunked authenticated SSE frames, and remains visibly disabled when the runner URL is not configured.
- The server-first Cockpit treats the runner project list as authoritative and keeps local Markdown health as a bounded fallback. It renders explicit loading, empty, local-only, stale, access-lost, session-expired, fallback and failure states across compact, medium and expanded layouts.
- Semantic conversations map normalized runner events into typed message, tool, plan, approval, progress and result items; assistant deltas coalesce, ANSI/control bytes are removed, cursors remain monotonic, duplicate events are suppressed and retained timelines are bounded. Each project exposes one conversation tab; closing it is server-confirmed before the client replaces it atomically.
- Conversation controls cover create, message, interrupt, resume, approve, deny, audit and proposed fix. Audit/fix routes use the verified runner payloads and stable idempotency keys. Runtime identity and capability limits appear only when represented by safe typed values; the semantic surface never renders PTY or terminal output.
- Flutter now exposes a dedicated operator Workspace route from a server-backed project detail. It creates the short-lived session over authenticated HTTP, connects through `web_socket_channel`, renders output and captures keyboard input with `xterm`, forwards bounded resize frames, and closes the session on screen disposal. Unavailable and interrupted states remain explicit; no SSH credential, server path, PTY handle or tmux identifier is presented. Cockpit and semantic Codex conversations remain the normal user surface.
- Flutter now exposes a capability-gated Studio route for the trusted Astro base. It parses the exact inspect-only projection, embeds the admitted origin in a sandboxed Web iframe, accepts only exact-origin/source/channel bridge messages and server-projected surfaces, and synchronizes semantic commands, ephemeral session state, undo/redo, Laboratory reasons, and variants with the runner. Compile submission now sends only `{variantId}` with a stable `Idempotency-Key` and parses the runner's closed immutable `CompileIntent`; worker admission still fails closed because no real provider is injected.
- The composition root now opens the server-owned SQLite projection, optionally enables Firebase ID-token authentication and Codex stdio, and closes the store with the app lifecycle. The protected event route emits a bounded, tenant-scoped SSE replay with cursor resume and heartbeat; `live=true` adds tenant/conversation-scoped in-process fan-out, a 30-second idle bound, and disconnect cleanup.
- All persisted event, run checkpoint, and idempotency payloads are checked for credentials, cookies, authorization material, clone paths and recognizable token values.
- Firebase Auth is the identity adapter. The runner verifies an access token with the project's JWKS, accepts only RS256 ID tokens with its expected issuer and audience, then resolves the JWT subject through a tenant membership lookup.
- Personal Cloud provisions every valid Firebase subject into a deterministic isolated personal tenant. A private server-owned UID-to-project-to-capability map alone admits selected subjects to the shared managed-project tenant; reconciliation grants only each project's declared `read` or `mutate` membership, and a stale prior personal binding is extended transactionally without changing the stable internal user identity.
- Flutter exposes a provider-neutral `ShipGlowsAuthProvider`. The optional Firebase adapter maps only `userId`, access token and expiry into that contract; no Firebase wire type reaches feature code.
- A Flutter build without both `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID` and `FIREBASE_PROJECT_ID` keeps the local dashboard available with an explicitly disabled auth adapter. The Firebase client configuration is public application metadata; privileged Firebase service-account credentials remain server-only.
- GitHub access uses a GitHub App rather than OAuth or a personal access token. Enabling it requires the server-only `GITHUB_APP_ID` and `GITHUB_PRIVATE_KEY`; classic `GITHUB_TOKEN` configuration is rejected.
- A GitHub App issuer signs a short app JWT, requests one installation token limited to one repository and `Contents: read`, and refuses expired, long-lived, widened, or permission-expanded responses. The token is scoped to one internal callback and is never cached, returned, logged, or persisted.
- Repository-sensitive work rechecks the immutable repository id, full name, default branch, and archived state with GitHub before Git runs. The resulting internal binding contains repository metadata only, never a credential.
- Legacy mirror/worktree utilities remain only for historical compatibility and provider-smoke fixtures. `main.ts` does not instantiate them or their cleanup worker. Existing physical worktrees are preserved for operator inspection and are not deleted by this migration.
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
- Studio never starts generated code on the runner host. Missing or incomplete independently verified managed-sandbox evidence keeps compile unavailable; a provider name, marketing claim, SDK response, local fake, or self-reported attestation cannot satisfy admission.
- Studio repository/runtime identity is server-owned. The target site may prove only its public profile, bridge version, and anchors; it cannot choose or attest the Git revision/digest, path, runtime, provider, image, policy, command, prompt, or proof bypass.

## Validation

```bash
cd runner
npm test
npm run typecheck
npm run lint
npx tsx --test test/studio/*.test.ts
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
- Does Studio remain disabled in production and unavailable for a dirty repository, identity/runtime mismatch, unsupported capability, expired session, or missing independently verified managed provider?
- Does a compile-related change preserve the no-host-execution invariant, exact evidence binding, complete budget/cost admission, phase separation, and cleanup reservation before allocation?

## Maintenance Rule

Update this document whenever the runner gains an adapter, route family, auth provider, persistence schema, execution provider, capability rule or public diagnostic surface. Distinguish contract proof, account-free adapter conformance, independently observed real-provider proof, isolated execution proof, hosted authenticated proof, and public availability. Studio currently has provider-neutral contract and local fake-adapter proof only; its Vercel account/configuration, managed-microVM containment, private ingress, effective network/credential policy, quotas/cost, provider cleanup, generated compile, patch/reload evidence, browser visual proof, and hosted journey remain unproven.

The universal routing contract must be updated whenever project evidence, target names, execution classes, toolchains, route schemas, verifier correlation, or Flutter parsing changes. Platform prerequisites are sourced from official [Flutter deployment documentation](https://docs.flutter.dev/deployment) and [Astro build documentation](https://docs.astro.build/en/guides/deploy/); those references never substitute for ShipGlows runtime evidence.
