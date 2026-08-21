---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.37.0"
project: "shipglows_app"
created: "2026-07-18"
created_at: "2026-07-18 08:20:45 UTC"
updated: "2026-08-21"
updated_at: "2026-08-21 20:28:03 UTC"
status: ready
source_skill: "101-sg-ready"
source_model: "GPT-5 Codex"
scope: "managed-agent-cockpit-mvp"
owner: "Diane"
confidence: high
user_story: "En tant qu'utilisatrice authentifiée de ShipGlows, je veux entrer dans mon espace isolé et accéder uniquement aux projets dont le serveur m'accorde explicitement les capacités, y compris Éditeur et Terminal lorsque j'ai le droit mutate."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Flutter Web"
  - "Flutter Android"
  - "Flutter Windows"
  - "ShipGlows managed runner"
  - "ShipGlows AgentRuntime contract"
  - "ACP TypeScript SDK and local stdio adapter"
  - "Codex ACP agent"
  - "Kilo Code adapter path"
  - "Firebase Auth"
  - "Convex target product data layer"
  - "GitHub App"
  - "GitHub repositories"
  - "managed repository workspaces"
  - "SQLite runner projection"
  - "Sentry"
  - "ShipGlows Markdown artifacts"
  - "just-bash skill sandbox"
  - "authenticated PTY/tmux gateway"
  - "ShipGlows CLI project catalog v1"
  - "persistent preview ingress"
  - "ExecutionProvider contract"
  - "CapabilityBroker contract"
  - "Warp Oz orchestration patterns (inspiration only)"
depends_on:
  - artifact: "shipglows_data/technical/shipglows-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-auth-github-access.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.3.1"
    required_status: "active"
  - artifact: "skills/references/preferred-stacks.md"
    artifact_version: "1.4.0"
    required_status: "active"
  - artifact: "https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "shipglows_data/workflow/specs/firebase-auth-convex-alignment.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app"
    artifact_version: "checked-2026-07-18"
    required_status: "active"
  - artifact: "https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation"
    artifact_version: "checked-2026-07-18"
    required_status: "active"
  - artifact: "shipglows_data/workflow/research/flutter-codex-cockpit-open-source-architecture.md"
    artifact_version: "1.5.0"
    required_status: "reviewed"
  - artifact: "https://pub.dev/packages/xterm"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://github.com/vercel-labs/just-bash"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://vercel.com/changelog/program-agent-harnesses-with-ai-sdk"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://dev.opencode.ai/docs/acp/"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://kilo.ai/docs/contributing/architecture/cli-runtime"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://www.warp.dev/oz"
    artifact_version: "checked-2026-08-03"
    required_status: "active"
supersedes:
  - artifact: "shipglows_data/technical/shipglows-foundational-architecture.md"
    scope: "The V1 read-only and agent/terminal-out-of-scope decisions only; repository authority, hidden managed clones, and GitHub-wins invariants remain active."
  - artifact: "shipglows_data/workflow/specs/shipglows-auth-github-access.md"
    scope: "The Firebase Auth identity and direct Firestore-client assumptions only; identity moves behind the portable AuthProvider boundary and GitHub App repository authorization remains active."
  - artifact: "shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md"
    scope: "The Firestore-only active client data source and read-only action limit only; membership, stale/access-lost visibility, redaction, and repository-authority semantics remain active."
evidence:
  - "Operator validation 2026-07-18: ShipGlows provides and manages the server; the end user should not administer SSH, tmux, PTY, terminal, or server operations."
  - "Operator validation 2026-07-18: the product has a global visual Cockpit, a parent tab per project, and a child tab per Codex conversation."
  - "Operator correction 2026-08-01: a privileged operator workspace for real terminal/tmux/Neovim access remains required as a separate surface, while semantic Codex remains the default surface."
  - "Operator validation 2026-07-18: conversations launch audits or fixes and improve project trackers across tech, content, SEO, performance, and security."
  - "Operator validation 2026-07-18: the MVP must reuse useful current code, including the interface, auth concepts, and GitHub integration concepts."
  - "Repository inspection 2026-07-18: the active ShipGlows runtime already has Riverpod, go_router, project health parsing, local source redaction, projection contracts, and responsive Flutter widgets."
  - "Operator correction 2026-08-11: ShipGlows App has one product runtime; dormant repository modules are not a legacy product or compatibility target."
  - "Fresh OpenAI documentation check 2026-07-18: Codex app-server exposes threads, turns, items, approvals, authentication state, and streamed events for rich clients over a local process transport."
  - "Fresh GitHub documentation check 2026-07-18: installation access tokens are short-lived, server-side, repository-scopable, and can authenticate HTTP Git when the GitHub App has Contents permission."
  - "Repository inspection 2026-08-01: the Flutter prototype already exists under `app/lib/shipglows/`, including overview, project detail, settings, health models, repositories, providers, and tests; this spec extends that prototype rather than creating a new app."
  - "Fresh external documentation check 2026-08-01: xterm.dart supports Flutter Web, Android, and Windows terminal rendering; just-bash provides a TypeScript virtual Bash sandbox with bounded filesystem and network capabilities."
  - "CTO architecture reframe 2026-08-01: ShipGlows owns the multi-agent control plane; Codex app-server is the first runtime adapter, while OpenCode, Kilo and ACP must remain possible behind the same normalized contract."
  - "Operator validation 2026-08-17: keep the product/runtime boundary agent-agnostic, implement only ACP for now, and use Codex as the first pinned ACP agent."
  - "Warp Oz review 2026-08-03: cloud-agent orchestration, run observability, controlled triggers and team-scoped memory are useful patterns; ShipGlows retains the product control plane and does not adopt Oz as an MVP dependency."
  - "Warp oz-agent-worker review 2026-08-07: adopt only a ShipGlows-owned resolved execution envelope, provider preflight and explicit execution outcomes; distributed worker transport, Kubernetes, and durable reattach remain outside this MVP slice."
  - "Local integration proof 2026-08-17: the new Flutter runtime exposes one persistent global project selector and one visual Settings project panel backed by a closed, in-memory development catalog containing exactly `shipglows_app` and `gocharbon`; no database provisioning, GitHub access, or mutation capability is granted."
  - "Local project-management proof 2026-08-17: the loopback runner owns one persistent workspace-bounded registry and redacted management API; the Flutter runtime exposes one Projects page for connect, activate, default, rename, archive/restore, and disconnect. Repository paths remain private, generic project mutation remains denied, and disconnect never deletes or changes Git files."
  - "Operator decision 2026-08-18: the current Personal Cloud milestone is Projects plus persistent Preview plus reconnectable Workspace; semantic Conversations and Studio remain available but are non-blocking for this milestone."
  - "Operator decision 2026-08-18: Neovim is the primary Personal Cloud work surface; first ship a persistent server-selected tmux/PTY editor, then evolve behind a private runner gateway toward the official Neovim UI RPC protocol."
next_step: "/102-sg-start ShipGlows Managed Agent Cockpit MVP"
---

# Spec: ShipGlows Managed Agent Cockpit MVP

🟢 [shipglows_app] spec: ShipGlows Managed Agent Cockpit MVP | status: ready | path: shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md | next: /102-sg-start ShipGlows Managed Agent Cockpit MVP

# Title

ShipGlows Managed Agent Cockpit MVP

# Status

Workspace excellence amendment, 2026-08-18: opening Éditeur or Terminal is a mutating project capability, not a read capability. Production Personal Cloud must launch tmux/Neovim as a dedicated non-login Unix account through a fixed, non-interactive sudo boundary and a minimal allowlisted environment; the runner identity and its credentials never enter the PTY. Workspace protocol v2 is negotiated before session creation. Browser leases, unattached capabilities, PTY output and WebSocket buffering are bounded, and cleanup failure cannot wedge reconnection. Flutter replaces terminal-shaped dead canvases with a recovery surface, redacted diagnostic ID and explicit reconnect/report actions, and expanded layouts provide a Neovim focus mode while preserving the active Workspace session.

Neovim editor amendment, 2026-08-18: the Personal Cloud Workspace now distinguishes the closed server-owned surfaces `editor` and `terminal`. `editor` attaches to a stable derived tmux session and launches only the fixed `nvim` executable in the allowlisted project cwd; `terminal` preserves the existing allowlisted shell tmux session. Flutter presents Preview, Éditeur and Terminal while keeping at most one Workspace connection active. The later native Flutter renderer may consume normalized Neovim UI RPC events only through a private runner gateway; the raw Neovim socket and arbitrary RPC methods must never reach the client.

Multi-user amendment, 2026-08-21: every valid Firebase subject may enter a deterministic isolated personal space. Authentication never grants access to a managed project: only the private server-owned UID-to-project-to-capability map admits a subject to the shared project tenant, with exact per-project `read` or `mutate` reconciliation. A subject authorized after an earlier sign-in keeps its stable internal user identity while gaining only the declared tenant/project memberships. The existing CLI/tmux/Neovim workflow remains authoritative; SQLite remains an operational projection, and Convex and Docker remain deferred.

Amended on 2026-08-17 after the local project-management integration and ACP runtime decision. The existing Flutter prototype is the implementation base. Its active runtime owns one persistent global project selector, one complete Projects page, and a Settings entry point. In the loopback-only development pilot, the runner owns a persistent workspace-bounded registry seeded with `shipglows_app` and `gocharbon`; it supports connect, active/default selection, rename, reversible archive, and registry-only disconnect through exact-origin authenticated routes. Local repository paths are never returned to Flutter, Git content is never changed by registry actions, built-ins cannot be disconnected, and generic project mutation remains denied. Studio availability is declared per project instead of inferred. The product has three deliberately separated surfaces: the health Cockpit, semantic agent work for normal use, and a separately authorized operator Workspace for a real PTY/tmux/Neovim session. ShipGlows owns a runtime-neutral control plane and exposes only its normalized `AgentRuntime` contract to product code. The runner uses one generic local-stdio ACP adapter with pinned Codex ACP as its first configured agent; provider wire types remain private, unsupported capabilities fail closed, and the previous Codex app-server adapter stays frozen as a local rollback until ACP proof is complete. `just-bash` remains only an optional sandbox for bounded ShipGlows skill checks; it is not the real terminal. Firebase Auth is the cross-platform identity baseline behind a portable provider boundary; Convex is the target product data layer, while Fastify/SQLite remains the documented execution-plane exception.

# User Story

En tant qu'utilisatrice de ShipGlows, je veux voir la santé de tous mes projets, piloter des conversations avec l'agent de code adapté à chaque tâche et, lorsque je l'autorise explicitement, ouvrir un espace opérateur terminal dans la même application, afin de travailler depuis mon navigateur sans administrer l'infrastructure.

# Minimal Behavior Contract

After signing in, the user sees the runner-owned project catalog, can open each project's stable preview, and can enter an explicitly protected Workspace attached to the same server-owned tmux session used by the existing CLI workflow. Each reconnect obtains a fresh short-lived capability; no capability is reused or placed in a URL. Semantic Conversations, health, audit/fix work and Studio remain available when configured, but they do not block this Personal Cloud milestone. A failed, interrupted, stale, unauthorized or disconnected action remains visible with a recoverable state. The primary Workspace edge case is a lost browser bridge while tmux continues: the UI must stop the stale socket, request a fresh capability, reattach to the same allowlisted tmux session, and never spawn a duplicate tmux session or silently broaden permissions.

# Success Behavior

- An authenticated user lands on a responsive Cockpit containing only projects they are allowed to see.
- Every project row/card exposes five independent health dimensions: `tech`, `content`, `seo`, `performance`, and `security`.
- Missing evidence is rendered as `notReported` or `unknown`, never silently converted to healthy.
- Selecting a project opens a stable project workspace with child tabs for its agent conversations.
- Creating a conversation selects an authorized `AgentRuntime`, creates or resumes its thread/session on the managed server, and makes the new tab observable immediately.
- The conversation view renders normalized semantic events: user messages, assistant messages, reasoning summaries when available, command/tool activity, file changes, plans, approvals, warnings, errors, usage/status metadata, completion, runtime identity, and capability limitations.
- The user can submit a message, launch a predefined audit, launch a proposed fix, interrupt an active turn, resume a thread, and answer a required approval from dedicated controls.
- Read-only audits run against a managed clone without write permission to the canonical branch.
- Each project has exactly one open semantic conversation and one server-configured delivery branch, `main` or `preview`. Fixes use the canonical clean checkout and finish with one non-force push to that branch; no worktree, temporary branch, merge, deploy, reset, rebase or force-push is available.
- Completed audits and fixes produce a normalized result that can update Cockpit evidence and propose tracker changes while GitHub/Markdown remains canonical.
- Refreshing or reopening the Flutter app restores project, conversation, and run state from the managed server without requiring terminal attachment.
- Web, Android and Windows use the same Flutter domain, state, API and UI modules. Flutter Web is the first end-to-end deployment proof; Android and Windows receive platform, contract and Workspace rendering proof in the MVP.
- Windows uses the same Flutter domain, state, API and Workspace contracts; the MVP proves the Windows shell and terminal rendering contract without requiring WSL on the user's machine.
- The operator Workspace can reconnect to an existing tmux session, resize the PTY, display terminal output, and launch Neovim; it is never silently opened from a normal agent conversation.
- Personal Cloud exposes Preview, Éditeur and Terminal as distinct surfaces; Éditeur opens a persistent server-selected Neovim tmux session without showing or accepting a client-selected shell command.
- Every Workspace reconnect uses a fresh project/actor capability and reattaches to the same server-owned tmux session after the previous socket lease has ended; terminal scrollback persistence remains owned by tmux, not Flutter or SQLite.
- The runner accepts a Workspace WebSocket only when the authenticated request `Origin` exactly equals the configured ShipGlows application origin; prefix, suffix, wildcard, missing and `null` origins are rejected.
- Client and runner exchange bounded heartbeat frames; a missed-heartbeat lease closes the WebSocket and releases the active attachment without killing tmux.
- One actor/project/tmux tuple has at most one active WebSocket. A second attach returns `409 operatorSessionActive`; takeover is never implicit.
- Read-only project members cannot create a Workspace session or submit Workspace diagnostics; both require the project mutation capability.
- A protocol-v1 or otherwise incompatible runner is rejected before PTY allocation with a visible update-required state.
- Expanded layouts can focus Éditeur or Terminal without creating a second Workspace connection; restoring the split returns Preview beside the same active Workspace.

# Error Behavior

- Missing or invalid identity-provider session returns an authenticated-app sign-in state; no project or conversation data leaks.
- Missing, revoked, suspended, or insufficient GitHub App access keeps the last allowed projection visible with an access warning but disables audit/fix actions and all repository-sensitive refreshes.
- If the managed server cannot start or authenticate the selected runtime, the conversation reports `runtimeUnavailable` with a redacted diagnostic and retry action; it does not fall back to an exposed terminal or silently change provider.
- If the event stream disconnects, the UI shows `reconnecting`, resumes from the last acknowledged event cursor, and reconciles from persisted conversation state before accepting a duplicate action.
- Duplicate command submissions with the same idempotency key return the original action/run instead of starting a second run.
- A second conversation for the same project is rejected with HTTP `409` and code `projectBusy`, including after runner restart. The existing conversation must be closed explicitly after active work ends before another can start.
- A timeout or user interrupt ends the active turn, keeps prior events, marks the result `interrupted` or `timedOut`, and permits a deliberate resume.
- An approval timeout or denial blocks the requested privileged action and leaves an explicit denied/expired approval event.
- Until provider-neutral proposed-action metadata can be verified, only an isolated `fix` run may approve a privileged runtime request; audit and ordinary conversation approvals fail closed without calling the runtime.
- Adversarial regression tests must prove that repository prompt injection, secret-access wording, exfiltration wording and cross-project approval references cannot widen that policy; denial must remain available.
- Invalid identifiers, cross-tenant references, unsupported action types, oversized prompts, excessive event payloads, and path traversal attempts are rejected server-side with stable error codes.
- A projection refresh failure never erases the last known Cockpit evidence; affected dimensions become stale or unknown with a timestamp and source diagnostic.
- Repository content that attempts prompt injection cannot expand server permissions, reveal secrets, alter tenant/project selection, or bypass approval and sandbox policies.
- Operator terminal failure, tmux loss, PTY disconnect or unsupported resize leaves the semantic Cockpit usable and shows a recoverable Workspace state; it never falls back to unbounded shell execution.
- Workspace connection, stream, cleanup and retry exhaustion failures produce bounded redacted diagnostics keyed by a user-visible `wd_*` identifier; PTY bytes, commands, tokens, paths and raw exception text are excluded.
- Slow WebSocket clients, oversized PTY chunks, expired unattached capabilities and missed heartbeat leases retire the browser/PTy attachment before accepting a replacement; tmux remains server-owned and persistent.
- A Workspace disconnect transitions the client to a retryable state, clears its stale channel, and requests a fresh capability before reconnecting to the same tmux session.
- Missing, `null`, wildcard, prefix-matched, suffix-matched or otherwise non-exact Workspace `Origin` is rejected before PTY attachment.
- A missed heartbeat closes only the abandoned WebSocket/PTY attachment. It does not kill tmux, create a second session or expose a takeover path.
- A concurrent Workspace attach is rejected with `409 operatorSessionActive`; the UI explains that another attachment is active and offers retry only after that lease closes.
- Missing, unknown or conflicting Workspace surface values fail closed; reusing one idempotency key across `editor` and `terminal` returns a conflict instead of changing the process behind an issued capability.

# Problem

The active ShipGlows runtime now contains the Flutter Cockpit, server-backed project health, durable conversation tabs, managed-runner API client, semantic event rendering, and the separately protected operator terminal. The control-plane and Workspace foundations are implemented and locally/server-smoke proven, but the complete hosted journey is not yet wired end to end: public runner TLS, actor/project provisioning, provider-configured GitHub/Codex flows, browser reconnect, Neovim, and platform proof remain. A real terminal is an operator-only capability, not a replacement for the semantic Cockpit and not an obligation for ordinary users.

# Solution

Build a semantic multi-agent client inside the active Flutter runtime and a dedicated ShipGlows control plane beside it:

1. The Flutter app authenticates the user, displays the Cockpit and conversation tabs, sends typed commands, and consumes normalized server events.
2. A Node.js/TypeScript Fastify service validates identity and project authorization, owns the canonical server checkout and fixed delivery-branch policy, persists durable run/conversation projections, and selects an agent runtime and execution provider from server-owned policy.
3. `AgentRuntime` is a ShipGlows-owned port for runtime capability discovery, sessions/threads, turns, interruption, approvals, normalized events and redacted diagnostics. One generic ACP adapter runs local stdio agents behind that port; pinned Codex ACP is the first configured agent. ACP is never a direct public endpoint.
4. The public app protocol uses authenticated HTTP commands plus Server-Sent Events with resumable cursors for semantic work. The operator Workspace uses a separate short-lived authenticated PTY capability; raw runtime transports, SSH credentials, host paths and tmux control stay internal.
5. GitHub repositories and ShipGlows Markdown remain canonical. SQLite on the managed runner stores operational projections such as users, project bindings, runtime/session mappings, run states/checkpoints, event cursors, approvals, capability decisions and idempotency records; it does not become the canonical repository-content store.
6. Audits and conversations use the canonical clean checkout. Fixes may write only there after exact branch/remote admission and deliver only through a non-force push to the configured `main` or `preview` branch.
7. `ExecutionProvider` keeps disposable agent/audit work separate from persistent operator work: `just-bash` may execute bounded read-only skill checks against a controlled snapshot, a future sandbox may execute disposable code-agent work, and only the operator Workspace may attach persistent tmux/Neovim. Real repository mutations and provider actions stay in the managed runner policy boundary.
8. The operator Workspace uses a separately authenticated, short-lived capability to a server-side PTY/tmux gateway. Flutter renders it; Flutter Web/Android/Windows never receive SSH credentials or direct host access.

# Orchestration And Context Contract

Warp Oz informs this contract as an external pattern only. ShipGlows remains the authority for project health, policy, evidence, identity and user experience; no Warp SDK, API, hosted service or agent memory is required for this MVP.

- Every run records an immutable `RunIntent`: `manual` is the only enabled trigger in the MVP; `schedule`, `githubEvent` and `systemRecommendation` are reserved values that must be rejected until separately enabled by server policy.
- The Cockpit exposes a redacted operations summary alongside health: active, queued, awaiting approval, recently failed and last completed run per authorized project. It never exposes prompts, paths, credentials, raw logs, tenant-internal totals or another tenant's activity.
- A server-owned `RunPolicy` selects runtime, execution provider, capability set, quota and approval boundary before a run begins. Runtime/model routing can optimize quality, latency or cost inside this policy, but never changes a selected provider, permission set or user-visible execution mode silently.
- A `ProjectContextBundle` is an explicit, size-bounded, versioned set of approved project instructions, evidence references and skill outputs. It is tenant/project scoped, redacted, attributable to producers and source commits, and passed to a runtime only through the server. The MVP has no opaque cross-project, cross-tenant or self-modifying agent memory.
- The first `ExecutionProvider` implementation is local and managed. Before it has any side effect, the runner resolves and persists one secret-safe execution envelope containing only opaque IDs, manual intent, selected provider/runtime/capabilities, resource budget, deadline and an opaque workspace reference. A provider preflight failure produces a stable safe error and never falls back to another provider, runtime, policy, workspace, or permission set.
- An execution result is explicitly `completed`, `failed`, or `delegated`; only a future remote provider may use `delegated`. Cancellation receives only opaque run/execution identifiers. Raw workspace roots, prompts, environment variables, tokens and provider secrets never appear in the persisted envelope, public event stream, API response, diagnostics or logs.
- Restart recovery remains fail-closed in this MVP: active local executions become `interrupted` with a bounded recovery reason. Drain, remote task preservation and reattach/reconciliation require a separate ready specification with durable execution ownership and distributed-lease semantics.
- Future automatic triggers require their own ready specification covering trigger authorization, deduplication, rate limits, approval policy, delivery retries, auditability and an operator-visible disable control. They are not enabled by this amendment.

# Product And Platform Footprint

- Launch application surfaces: Flutter Web, Flutter Android and Flutter Windows from the existing codebase.
- First-class shared surface: Flutter Windows, using the existing Flutter domain and the same authenticated API.
- First complete hosted proof: Flutter Web on the current Vercel-oriented web path, connected to the managed runner over HTTPS.
- Android and Windows MVP proof: build, Firebase session/authentication adapter contract, deep-link/session handling where applicable, responsive UI tests, terminal rendering tests, and live API compatibility against the same runner.
- Roadmap: iOS can use the same Flutter domain/UI code after adding the platform shell and identity adapter; it is not an MVP launch gate.
- Linux desktop is not an MVP launch gate, but the Web contract must remain usable from Linux browsers.
- End-user terminal surface: semantic agent work by default; real terminal/tmux/Neovim only inside the explicit operator Workspace.

# Preferred Stack Resolution

- Flutter is applied as the canonical authenticated application stack.
- Firebase Auth is the current identity baseline behind a portable `AuthProvider` interface. Dormant Clerk code is not a product runtime and may only contribute a narrowly reviewed concept if directly integrated into ShipGlows.
- GitHub App remains the repository authorization authority from the ready foundational specifications.
- The Convex backend baseline is intentionally not used for the runtime executor because this feature requires supervised agent runtimes, canonical Git checkout admission, local filesystem isolation, resumable event streaming, and bounded OS-level execution. A dedicated Node.js/TypeScript Fastify server is the documented exception.
- TypeScript is selected because it fits the event-heavy Fastify control plane, supports server-side JWT/JWKS validation for the selected identity provider, and typed adapters can isolate every runtime transport from the Flutter contract.
- SQLite is selected for the MVP runner's operational projection because the managed server is the execution authority, the data is reconstructable from runtime/repository state, and a transactional local store avoids adding a second remote control plane before behavior is proven. The repository/Markdown authority rule remains unchanged.
- Hosted Firestore is not an MVP runner dependency. The Flutter Cockpit reads the versioned runner API and the runner owns its SQLite operational projection. Any later Firestore synchronization must stay a rebuildable projection behind a separate contract.
- Python remains available for bounded audit helpers invoked by approved server workflows, not as the public API or agent-runtime orchestration layer.
- `xterm.dart` is the implemented Flutter terminal renderer for Web, Android and Windows, and `web_socket_channel` carries the dedicated stream. The runner uses `node-pty` with fixed server-owned tmux arguments. Local contracts and an isolated real server smoke pass; hosted and per-platform rendering proof remain.
- `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker` and `ModelGateway` are ShipGlows-owned ports. They preserve the choice of Codex, OpenCode, Kilo, ACP, self-hosted sandbox, Vercel sandbox, direct model provider or future runtime without changing Flutter, health or authorization contracts.
- Warp Oz is a reference for cloud-agent orchestration and fleet observability only. Its trigger, memory and model-routing patterns are represented by ShipGlows-owned `RunIntent`, `RunPolicy` and `ProjectContextBundle` contracts; no Oz client, hosted control plane or proprietary runtime API is a dependency.
- ACP is the only actively developed runtime adapter for this MVP slice. Codex ACP is the first pinned agent; additional agents remain configuration-and-capability work only after the Codex path is proven. The frozen Codex app-server adapter is rollback code, not an independently evolving product path.
- `just-bash` is an optional sandbox for safe skill checks and previews. It cannot provide SSH, tmux, Neovim or a real server filesystem, and it must not be presented as the operator terminal.

# Scope In

- Active Flutter Cockpit for all authorized projects.
- Five-dimensional project health projection with explicit freshness, source, status, and evidence counts.
- Parent project selection and child agent conversation tabs.
- Structured agent conversation rendering without terminal emulation.
- Conversation create, list, open, resume, message, interrupt, and approval flows.
- Predefined read-only audit actions and isolated proposed-fix actions.
- Managed runner API, SSE event stream, persistence, idempotency, quotas, and diagnostics.
- Redacted operations summary and explicit manual `RunIntent` records for authorized project runs.
- Tenant/project-scoped, versioned `ProjectContextBundle` provenance for server-supplied runtime context.
- ShipGlows `AgentRuntime` capability contract, generic ACP local-stdio adapter, pinned Codex ACP agent and normalized event mapping.
- Fake second-runtime conformance fixture proving Flutter and policy do not branch on Codex-only wire types.
- Firebase Auth authentication for Web, Android and Windows through one Dart adapter; server-side ID-token/JWKS validation behind the runner's `AuthProvider` interface.
- GitHub App repository authorization and short-lived installation-token use on the server.
- Canonical checkout reuse with a server-owned `main|preview` delivery branch, durable one-conversation admission, clean/divergence guards, and non-force push.
- Read-only ingestion of existing ShipGlows Markdown and GitHub evidence into Cockpit health.
- Safe generation of proposed tracker updates as run artifacts; canonical write-back requires an explicit user-approved later operation.
- Sentry-backed client/server runtime diagnostics with redaction, release identity, and environment tags.
- Separately authorized operator Workspace with one allowlisted tmux attachment, PTY resize/reconnect, terminal rendering and Neovim launch proof.
- Bounded `just-bash` integration proof for at least one read-only ShipGlows skill against a controlled repository snapshot.
- Automated unit, contract, widget, integration, security, and reconnect/idempotency tests.

# Scope Out

- Exposing a general-purpose unrestricted terminal, raw SSH credentials, root shell, arbitrary command execution, or arbitrary tmux session to users.
- Asking end users to install, configure, update, or monitor any agent runtime, tmux, Git, GitHub credentials, or the ShipGlows server.
- Pull-request creation, merge, deployment, production mutation outside the configured checkout, force-push, arbitrary branches, and client-selected delivery targets.
- Fully autonomous self-improvement without observable run state, bounded permissions, and human-controlled mutation gates.
- Billing, metering plans, marketplace packaging, and organization administration beyond project authorization.
- Public/SEO marketing-site changes.
- Linux desktop application launch work.
- iOS shell and store-release proof in this MVP; the shared Flutter modules must remain portable.
- Pixel-for-pixel reproduction of a runtime terminal UI or tmux; functional event parity and clear native-app UX are required instead.
- Multi-host runner scheduling and horizontal orchestration; the MVP supports one managed runner deployment with tenant-isolated records/workspaces.
- Multiple simultaneous operator terminals per user/project; the MVP proves one bounded session attachment before expanding concurrency.
- Scheduled, webhook-triggered or autonomous agent runs, shared opaque memory, self-improving prompts, and automatic runtime/provider switching.

# Constraints

- The app must never expose a server terminal or require SSH knowledge.
- Every runtime transport runs on the managed server or inside a server-selected execution provider; ACP local stdio is the only active adapter transport and Codex ACP is the first configured agent. No ACP message, runtime HTTP/SSE endpoint, Unix socket, experimental WebSocket transport or user-provided agent endpoint is a public API dependency.
- Public communication is HTTPS plus authenticated SSE. State-changing actions use HTTP requests with idempotency keys and CSRF/origin protection appropriate to the client surface.
- Interactive terminal communication uses a separate authenticated WebSocket/PTY channel with a short-lived, single-purpose capability. The semantic SSE channel and PTY channel must never share authorization or raw protocol payloads.
- Every request is authorized server-side from the selected AuthProvider identity, ShipGlows project membership, and fresh GitHub App access when repository-sensitive.
- No client-supplied repository path, clone path, branch, thread id, or filesystem identifier is trusted without server lookup and ownership validation.
- GitHub App installation tokens are short-lived, scoped to the required repository/permissions, generated server-side, and never persisted in SQLite or sent to Flutter.
- Runtime credentials and login state are managed server secrets and never cross the runner boundary.
- Audit prompts and fix prompts have server-owned templates, bounded user additions, maximum sizes, and explicit permission profiles.
- Audit work is read-only. Fix work targets only the server-configured canonical `main` or `preview` checkout and pushes only after clean-tree and unchanged-remote verification.
- One conversation per project may be open. SQLite enforces this across concurrent requests and restarts; no read-only conversation bypass exists.
- `manual` is the only accepted `RunIntent` trigger in the MVP. Reserved automatic trigger values are rejected until a separate approved specification enables them.
- A `ProjectContextBundle` is server-built from approved, versioned and redacted tenant/project evidence. A runtime receives no arbitrary client-selected context, no cross-tenant bundle and no untracked persistent memory.
- Raw command output and file content are size-limited, redacted, and normalized before streaming or persistence.
- PTY output is streamed only to the authorized live Workspace, is not persisted as conversation events, and is excluded from Sentry and routine diagnostics.
- Cockpit health never infers healthy from absent evidence.
- Repository/Markdown content remains canonical; SQLite and UI state are projections.
- UI work must use the declared Flutter design-system authority. The active ShipGlows private theme must be reconciled with `app/lib/presentation/theme/app_theme.dart` before new visual tokens are introduced.
- ShipGlows App has one executable product runtime. Dormant modules outside `lib/shipglows/**` are not compatibility constraints and may be integrated only through a narrow reviewed change.

# Dependencies

- Codex CLI `0.144.5`, Node.js `22.22.2`, npm `11.17.0`, Flutter `3.41.7`, and Dart `3.11.5` are available in the current implementation environment.
- Official Codex app-server documentation checked 2026-07-18 defines rich-client primitives for threads, turns, items, approvals, authentication, and streamed events over a local process transport; it informs the first adapter only.
- Fresh docs checked 2026-08-01: Vercel AI SDK's HarnessAgent can normalize several agent harnesses but is experimental; OpenCode ACP is editor-to-subprocess JSON-RPC over stdio, while Kilo documents local HTTP/SSE runtime surfaces. ShipGlows therefore keeps its own remote contract and capability matrix.
- Fresh Warp Oz documentation checked 2026-08-03 describes cloud-agent triggers, scheduling, parallelism, observability, multiple harnesses and persistent team memory. This spec adopts only bounded orchestration requirements; Warp/Oz remains outside the runtime dependency graph.
- The current Firebase Auth and Convex boundary is owned by `firebase-auth-convex-alignment.md`; server-side ID-token/JWKS verification remains behind the runner AuthProvider adapter.
- Official GitHub App documentation checked 2026-07-18 supports short-lived installation access tokens, narrowed repository/permission scope, and HTTP Git authentication when Contents permission is granted.
- Official `just-bash` repository and threat model rechecked 2026-08-11: 3.2.0 supports an in-memory filesystem, disabled-by-default network/JavaScript/Python, a restricted command registry, abort signals and execution limits. Its npm tarball currently omits several declaration files referenced by the package entrypoint, so ShipGlows isolates the runtime behind a narrow local typed adapter without enabling `skipLibCheck`.
- Existing code foundations include `lib/shipglows/**`, `lib/data/shipglows_sources/**`, `lib/domain/project_health/**`, and Firestore-shaped projection DTOs/validators. Dormant Clerk/GitHub modules are not current integration proof.
- Canonical design-system authority is `shipglows_data/technical/design-system-authority.md` with Flutter carrier `lib/presentation/theme/app_theme.dart`.

# Invariants

- One ShipGlows project equals exactly one GitHub repository.
- One project may retain many closed conversations in history but has exactly one open conversation; each conversation belongs to exactly one project and one tenant.
- One ShipGlows conversation maps to one selected-runtime thread/session identifier stored server-side; raw runtime identifiers are never authorization proof.
- One open conversation owns the project delivery lease and uses its server-configured canonical checkout and `main|preview` branch.
- The normal agent surface shows semantic conversation events. The separately gated operator Workspace may show a live PTY terminal.
- GitHub decides repository access for repository-sensitive actions.
- Repository/Markdown files decide canonical project and tracker content.
- SQLite stores reconstructable operational state and cannot silently overwrite canonical repository content.
- Every mutating command has an idempotency key, actor, project, conversation, timestamp, lifecycle state, and redacted outcome.
- Every run has one immutable `RunIntent`, one resolved `RunPolicy` and an attributable `ProjectContextBundle` version or an explicit empty-context marker.
- Every run execution has exactly one server-resolved `ExecutionProvider`, opaque execution identifier and secret-safe immutable envelope. Preflight completes before workspace creation or runtime session/turn start; selection failure has no execution side effect and never triggers fallback.
- Every streamed event has a monotonically increasing conversation cursor and stable event identifier.
- Reconnect reconciliation cannot duplicate a message, run, approval decision, or tracker proposal.
- Missing evidence is unknown/not reported, not healthy.
- Secrets, tokens, private keys, cookies, authorization headers, tokenized clone URLs, local clone paths, environment variables, and unrestricted raw logs never reach Flutter, Sentry, or user-visible diagnostics.
- Server policy, runtime choice, capability matrix, sandbox mode, approval policy, timeout, and allowed tools cannot be expanded by repository content or a client message.
- A Workspace capability grants only one project-scoped operator session; it is not proof of general server access and cannot select arbitrary host paths or tmux sessions.

# API And Event Contract

The public runner API is versioned under `/v1` and returns opaque identifiers only.

## Query endpoints

- `GET /v1/cockpit`: authorized projects with aggregate and five-dimensional health.
- `GET /v1/cockpit` includes only the caller-authorized redacted operations summary: active, queued, awaiting approval, recently failed and last completed run state per project.
- `GET /v1/projects/:projectId`: project summary, access state, health evidence, and action availability.
- `GET /v1/projects/:projectId/conversations`: project-scoped conversation summaries.
- `GET /v1/conversations/:conversationId`: persisted normalized conversation and active run state.
- `GET /v1/projects/:projectId/conversations/:conversationId/events?after=:cursor`: SSE replay stream with heartbeat, cursor resume, and project authorization recheck.
- `GET /v1/projects/:projectId/operator-sessions`: operator sessions visible to the authorized actor, without host paths or SSH details.

## Command endpoints

- `POST /v1/projects/:projectId/conversations`: create a ShipGlows conversation and selected-runtime thread/session after capability validation.
- `POST /v1/conversations/:conversationId/messages`: start a turn from user input.
- `POST /v1/projects/:projectId/audits`: create a read-only audit conversation/run from an allowlisted audit type.
- `POST /v1/projects/:projectId/fixes`: create an isolated proposed-fix conversation/run from a finding or allowlisted fix type.
- `POST /v1/conversations/:conversationId/interrupt`: interrupt the active turn.
  - `POST /v1/projects/:projectId/approvals/:approvalId`: approve or deny one pending action after server validation; the conversation is resolved server-side from the approval's run, every decision carries a durable `Idempotency-Key`, and a duplicate key replays the original resolution.
- `POST /v1/conversations/:conversationId/resume`: reconcile and resume an interrupted/restartable thread.
- `POST /v1/projects/:projectId/operator-sessions`: create one short-lived, project-scoped Workspace capability for an allowlisted tmux session.
- `POST /v1/operator-sessions/:sessionId/close`: close the PTY capability and release the attachment.
- `WS /v1/operator-sessions/:sessionId/stream`: authenticated bidirectional PTY bytes, resize events and bounded session status; never a runtime protocol or host credentials.

All command endpoints require `Idempotency-Key`, authenticated actor context, project/conversation ownership validation, stable machine-readable error codes, and an observable returned state.

## Normalized event families

- `conversation.created`, `conversation.titleChanged`, `conversation.stateChanged`
- `turn.started`, `turn.interrupted`, `turn.completed`, `turn.failed`
- `message.user`, `message.assistant.delta`, `message.assistant.completed`
- `plan.updated`
- `tool.started`, `tool.output.delta`, `tool.completed`, `tool.failed`
- `file.changeProposed`, `file.changed`
- `approval.requested`, `approval.resolved`, `approval.expired`
- `run.queued`, `run.started`, `run.progress`, `run.completed`, `run.failed`
- `run.policyResolved`, `run.contextAttached`, `run.triggerRejected`
- `health.evidenceProduced`, `tracker.changeProposed`
- `diagnostic.warning`, `diagnostic.error`, `stream.heartbeat`

Unknown upstream runtime event types are stored as redacted diagnostics and ignored safely by older clients; they never become arbitrary executable UI instructions.

# Health Projection Contract

Each dimension carries:

- `status`: `healthy`, `warning`, `critical`, `unknown`, `notReported`, or `stale`.
- `score`: optional integer from 0 to 100 only when a named producer supplies a documented scoring rule.
- `checkedAt`, `sourceCommit`, `producer`, `freshness`, `summary`, and evidence counters.
- links to normalized findings and the conversation/run that produced them.

Dimension intent:

- `tech`: build, tests, type/lint, dependencies, architecture, and maintainability.
- `content`: content completeness, claims, freshness, editorial quality, and conversion clarity.
- `seo`: crawl/indexability, metadata, structured data, internal links, and search-oriented content gaps.
- `performance`: measured or reproducible runtime/build performance evidence; no score from guesswork.
- `security`: dependency, secret, configuration, authz, input, and workflow risks; sensitive evidence is redacted.

The overall project state is the worst trustworthy reported state plus an explicit coverage indicator. Unknown dimensions lower coverage but do not fabricate a critical or healthy result.

ShipGlows skills are the health authority. Each skill run records its skill identity/version, source commit, evidence artifacts, freshness, findings and evaluator outcome. `just-bash` may provide the safe execution environment for read-only or preview checks, but it does not define health and cannot replace the ShipGlows evaluator or the real operator Workspace.

# Auth And Authorization Contract

- Firebase Auth establishes ShipGlows identity; GitHub App establishes repository authority. They remain distinct.
- Flutter Web, Android and Windows use one Dart `AuthProvider` interface with Firebase session refresh and deep-link handling where applicable.
- Fastify validates the Firebase ID token through server-side issuer, audience, algorithm, and JWKS checks on every request and never trusts client-decoded claims alone. No alternate auth runtime is supported.
- Runner data access is filtered by tenant and user membership before any project/conversation lookup result is returned.
- Repository-sensitive actions revalidate GitHub App installation access and required permissions immediately before clone, refresh, audit, or fix setup.
- GitHub Contents read access permits projection and audit. Configured fix delivery requires the server's existing write-capable Git remote; pull requests and broader GitHub mutations remain separate capabilities.
- Approval authorization is scoped to the requesting tenant/project/conversation and one pending approval. Replays return the prior resolution.
- Workspace authorization is a separate capability from agent conversation access. It requires an explicit operator role/flag, fresh project membership, and a server-owned allowlist of tmux session identifiers.

# Security And Abuse Contract

- Treat user prompts, GitHub metadata, repository files, Markdown/frontmatter, runtime events, tool output, and GitHub responses as untrusted input.
- Validate identifiers, enums, lengths, UTF-8 payloads, content types, pagination bounds, cursor values, and request body sizes with shared schemas.
- Resolve workspaces from server-owned opaque IDs. Reject absolute paths, traversal segments, symlink escapes, alternate Git directories, and client-selected worktree locations.
- Run every local agent runtime as a dedicated low-privilege service account with per-workspace filesystem boundaries and no access to the runner's secret store.
- Keep app-server private to the process host. No direct public port, shared network socket, or user-provided app-server endpoint is supported.
- Keep the PTY/tmux gateway private behind the runner. A client receives only a short-lived, single-purpose session capability; it cannot choose a host path, shell executable, tmux target or environment.
- Apply per-user, per-project, and global limits for concurrent turns, queued jobs, event bytes, prompt bytes, duration, and daily cost. Limits return recoverable states instead of unbounded fan-out.
- Audit logs record actor, action, target, decision, lifecycle, model/config identity, source commit, and redacted outcome. They exclude prompt secrets, credentials, environment values, full command output, and private file bodies.
- Project-context bundles and operations summaries are tenant/project scoped and redacted before persistence. They record provenance and version only; they never become an unbounded prompt transcript, a hidden memory store or a cross-project retrieval surface.
- Sentry receives stable error codes, release/commit identity, environment, platform, route/action class, and opaque project/conversation/run IDs. It never receives auth headers, tokens, cookies, raw prompts, repository file content, clone paths, or command output.
- PTY bytes, terminal scrollback, Neovim buffers and shell commands are never persisted as conversation events or sent to Sentry. `just-bash` runs use bounded filesystem/network policies and are treated as untrusted execution output.
- The app and runner expose a safe diagnostics/log-copy surface whose first lines include commit/build identity plus Paris and UTC build timestamps; copied diagnostics contain only redacted summaries and never raw terminal, prompt, token or private-file content.
- Any future automatic push, PR, merge, deploy, permission expansion, or production action requires a separate ready high-risk specification.

# Links & Consequences

- Active runtime: `lib/shipglows/**` becomes server-backed and no longer depends on browser-inaccessible local filesystem reads for the primary Cockpit.
- Local source readers: remain useful for managed runner parsing and local diagnostics but are not the Web authority.
- Project health: current dependency posture evolves into the five-dimension contract while preserving explicit source-gap states.
- Runtime boundary: `lib/main.dart` always launches `ShipGlowsApp`; dormant routes, providers, and service graphs remain outside the product entrypoint.
- Foundational architecture: hidden managed clone, GitHub-wins, repository/Markdown authority, opaque project IDs, and redaction remain active; the read-only/agent-excluded V1 limit is superseded only by this bounded runner contract.
- Dashboard projection: existing DTO/validator patterns remain reusable, but the active client consumes a versioned runner API rather than assuming hosted Firestore is already wired.
- Future trackers: completed runs produce proposed normalized tracker changes; a later write-back/PR contract decides how they become canonical.
- Operations: ShipGlows owns runtime installation/authentication/upgrade policy, process health, workspace cleanup, quotas, backups of operational projection, capability reporting and incident diagnostics. Codex is the first operated runtime, not the only supported one.
- Product: the normal user experiences conversations and actions; the operator can deliberately open the Workspace without being asked to install infrastructure locally.

# Documentation Coherence

- Update `shipglows_data/technical/runtime-boundary.md` to name the managed runner and remove claims that the active Web runtime is only a local-reader dashboard.
- Update `shipglows_data/technical/shipglows-foundational-architecture.md` with a dated supersession note for the old read-only/agent-out decision while retaining canonical-data and GitHub invariants.
- Update `shipglows_data/technical/code-docs-map.md` with runner, API/event, Cockpit, conversation, and health-projection ownership.
- Add `shipglows_data/technical/operator-guides/managed-agent-workspace.md` covering runtime capability selection, PTY/tmux capability, Neovim session policy, reconnect/cleanup, and incident recovery.
- Add runner-owned `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker` and health-evaluator contracts. Document that portable ShipGlows skills produce versioned evidence and dimension outcomes; do not delegate this authority to a runtime, just-bash or a generic dashboard.
- Add the `RunIntent`, `RunPolicy`, `ProjectContextBundle` and redacted operations-summary contracts to the runner/API ownership map, documenting manual-only MVP admission and the separate future-trigger specification gate.
- Update `shipglows_data/technical/design-system-authority.md` if the active ShipGlows theme carrier is consolidated.
- Update `README.md` only with behavior that has passed implementation proof; do not claim live Codex/GitHub/auth integration from contracts alone.
- Update `shipglows_data/workflow/TASKS.md`, verification artifact, and `CHANGELOG.md` during implementation closure without rewriting unrelated operator edits.
- Create an operator runbook for server provisioning, runtime auth health/capability diagnostics, workspace cleanup, SQLite migration/backup, GitHub App permissions, Firebase configuration, Sentry redaction, and incident recovery.

# Edge Cases

- User opens the same conversation in Web and Android simultaneously.
- SSE reconnects after the server persisted some events but before the client acknowledged them.
- A message request succeeds but its HTTP response is lost and the client retries.
- Selected runtime process restarts while a turn is active.
- Conversation exists but the corresponding runtime thread/session cannot be resumed.
- A selected runtime lacks a requested capability such as approvals, resume, isolated workspace, tool event stream or interrupt.
- A runtime claims a capability but returns an event that cannot be safely normalized.
- The runtime selection changes between retries, or an unavailable runtime would otherwise tempt an implicit fallback.
- GitHub access is revoked between Cockpit load and audit/fix launch.
- Repository is renamed, transferred, archived, deleted, made private, or removed from the installation.
- Default branch advances after audit checkout but before a proposed fix starts.
- Two users request fixes for the same project at once.
- A conversation is interrupted by restart while its canonical checkout contains an incomplete or dirty change.
- Repository content contains instructions to exfiltrate secrets or alter runner policy.
- Tool output contains ANSI controls, binary data, huge lines, token-like values, or private filesystem paths.
- An approval is denied, expires, is replayed, or arrives after interruption.
- A health producer reports a score without a documented scoring rule.
- No repository has reportable evidence for one or more dimensions.
- User loses membership but retains an open browser tab and event stream.
- Clock skew affects token expiry, event order, or stale-evidence calculations.
- SQLite migration fails or the database is temporarily read-only.
- Server reaches concurrency, duration, event-volume, or cost quota.
- A client or repository attempts to submit a scheduled, webhook or system-recommended trigger before that policy exists.
- A runtime request attempts to reuse untracked context from another project, tenant or historical run.

# Implementation Tasks

- [ ] Task 1: Establish the ShipGlows control-plane contracts, runner package, and secure configuration.
  - Files: `runner/package.json`, `runner/tsconfig.json`, `runner/src/config.ts`, `runner/src/contracts/**`, `runner/test/contracts/**`.
  - Action: Scaffold Node.js/TypeScript/Fastify with strict validation, typed IDs, API/error/event schemas, secret-safe config loading, and version endpoint. Define versioned `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker`, `ModelGateway`, runtime capability matrix and durable `Run` schemas before choosing an implementation package. Add exact dependencies only after official compatibility checks.
  - User story link: Creates the managed boundary that replaces end-user SSH/terminal administration.
  - Depends on: this spec passing `/101-sg-ready`.
  - Validate with: runner unit tests, typecheck, lint, dependency audit, config-secret scan, API schema snapshots, and a fake second-runtime conformance fixture proving no Codex wire type escapes the port.
- [~] Task 2: Implement portable Firebase Auth authentication and tenant/project authorization middleware.
  - Files: `runner/src/auth/**`, `runner/src/projects/projectAccess.ts`, `runner/test/auth/**`, `app/lib/shipglows/auth/**`, `app/test/shipglows/auth/**`.
  - Action: Implement one Firebase-backed Dart/server identity contract, verify ID tokens/JWKS server-side, derive opaque actor context, enforce tenant/project membership, origin/CSRF controls, session refresh and stable unauthorized/forbidden errors. Keep provider types out of feature code.
  - User story link: Ensures users see and control only their authorized projects.
  - Depends on: Task 1.
  - Validate with: missing/expired/forged/cross-tenant token tests and redaction assertions.
  - Implementation note (2026-08-11): runner Firebase ID-token/JWKS verification, subject-to-tenant actor resolution, malformed/invalid/cross-tenant fail-closed tests, a protected read-only authorization-route fixture, and the Flutter provider-neutral Firebase session/refresh adapter are complete. The task remains in progress until Linux REST/OIDC support and a provider-configured runner deployment prove the same boundary end-to-end.
- [~] Task 3: Implement GitHub App access and managed workspace lifecycle.
  - Files: `runner/src/github/**`, `runner/src/workspaces/**`, `runner/test/github/**`, `runner/test/workspaces/**`.
  - Action: Generate narrowed short-lived installation tokens for read operations, verify repository permissions, resolve canonical checkouts from the server catalog, enforce path/symlink and exact `main|preview` boundaries, serialize conversations durably, and deliver fixes by unchanged-remote non-force push.
  - User story link: Lets ShipGlows operate repositories while hiding server and Git mechanics.
  - Depends on: Tasks 1-2.
  - Validate with: fake GitHub contract tests, local Git fixtures, path traversal/symlink tests, concurrency tests, cleanup tests, and forbidden-token scans.
  - Implementation note (2026-08-02): the runner now has a concrete GitHub App JWT/install-token issuer, immutable-repository REST revalidation, a narrowed `Contents: read` token boundary, a tenant-scoped persisted repository binding, and a fixed-argument Git transport. Local Git fixtures prove detached audit worktrees, isolated local fix branches, path/symlink containment, mutation locking and abandoned-worktree cleanup. This task remains in progress until a provider-configured GitHub App smoke validates an actual installation without exposing a token.
- [ ] Task 4: Implement SQLite operational projection, durable-run checkpoints, and migrations.
  - Files: `runner/src/db/**`, `runner/migrations/**`, `runner/test/db/**`.
  - Action: Persist users/tenants, project bindings, conversations, runtime/session mappings, selected runtime/capability decisions, immutable `RunIntent`/`RunPolicy` summaries, context-bundle provenance/version, runs/checkpoints, normalized events, cursors, approvals, idempotency records, health evidence, cost/usage summaries, and cleanup state with tenant-scoped queries.
  - User story link: Restores conversations and Cockpit state without requiring tmux attachment.
  - Depends on: Task 1; schemas must align with Tasks 2-3.
  - Validate with: migration up/down policy tests, transaction/idempotency tests, tenant-isolation tests, restart recovery tests, context-bundle provenance/redaction tests, manual-trigger rejection tests, and backup/restore fixture proof.
  - Implementation note (2026-08-11): schema v8 persists tenant-scoped runs with redacted checkpoints and explicit state transitions, recovers in-flight runs as `interrupted` after restart, tracks workspace cleanup retries without storing local paths, projects runtime sessions, capability decisions, approvals, source-attributed skill runs and health evidence, bounded usage summaries, and server-owned cross-namespace project identity bindings. A validated context/run/evidence envelope is atomic and rolls back completely on insertion failure. Backup/restore fixture proof and broader route integration remain.
- [~] Task 5: Implement Codex as the first `AgentRuntime` adapter and normalize semantic events.
  - Files: `runner/src/agent-runtime/**`, `runner/src/events/**`, `runner/test/agent-runtime/**`, `runner/test/events/**`.
  - Action: Spawn an allowlisted, pinned ACP agent as a supervised child process and map ACP initialization/capabilities, session create/resume, prompts, cancellation, permissions and updates to the neutral port. Cap/redact payloads, reject unsupported capabilities and keep ACP wire types private to the runner adapter.
  - User story link: Displays real agent work directly in the app without exposing a terminal or vendor protocol.
  - Depends on: Tasks 1 and 4.
  - Validate with: fake ACP transport transcripts, capability-denial tests, reconnect/order tests, unknown-update tests, output sanitization tests, process restart tests, and one local Codex ACP smoke test with no repository mutation.
  - Implementation note (2026-08-02): a server-owned stdio JSONL adapter now performs the initialize/initialized handshake, starts/resumes threads, starts/interrupts turns, maps safe semantic events, and resolves command/file approvals without forwarding raw app-server payloads. Provider-configured Codex smoke, reconnect/order hardening, and the fake second-adapter conformance fixture remain.
  - Implementation note (2026-08-17): the runner now selects a generic ACP adapter under the unchanged `AgentRuntime` product boundary and launches pinned `@agentclientprotocol/codex-acp` over local stdio. Every session carries a trusted project/isolated workspace descriptor and explicit read-only/workspace-write policy; the adapter confirms `session/set_mode` and denies broad or unbound workspace fallback. Approval requests are persisted against the active run before publication, expire durably on cancellation/terminal outcomes, and approval maps only to ACP `allow_once`. Raw NDJSON lines, provider updates and retained identifiers are bounded before parsing or projection, with path/token sanitization and normalized events; a framing violation idempotently closes the SDK connection and terminates the child. Overflow uses the same bounded hard-stop primitive as interrupt, closes and removes the session before terminal acknowledgement, preserves approval-expiry and terminal control events, and rejects later prompts/callbacks. Non-`end_turn` stop reasons cannot become successful completion. Child exit/error, bounded interruption, runtime shutdown, startup reconciliation and session cleanup are supervised. A real local Codex ACP smoke proved session creation, one no-tool prompt, streamed agent update and `end_turn`; it did not prove restart resume. The ACP adapter deliberately does not advertise public resume and rejects unsafe cold resume. Durable workspace descriptors across runner restarts require a separately approved data migration. The previous Codex app-server adapter is unchanged and retained only as rollback.
  - Implementation note (2026-08-21): ACP notifications and permission requests are fenced to an active turn, so idle and post-terminal provider traffic cannot enter the next persisted event stream. A fresh runtime instance rejects cold resume before creating a provider connection when no trusted workspace descriptor exists; durable cross-process resume remains intentionally unavailable.
- [~] Task 6: Implement command API, SSE resume, audit/fix policy, and run orchestration.
  - Files: `runner/src/routes/**`, `runner/src/runs/**`, `runner/src/policies/**`, `runner/test/routes/**`, `runner/test/runs/**`.
  - Action: Add the versioned endpoints, redacted Cockpit operations summary, idempotency, event cursors, heartbeat, quotas, timeout/interrupt behavior, approval flow, server-owned `RunPolicy`, manual-only `RunIntent`, explicit context attachment, allowlisted audit/fix templates, one-conversation admission, fixed delivery-branch guards, and explicit no-merge/no-deploy/no-force gates.
  - User story link: Turns buttons and conversation input into safe, observable agent work.
  - Depends on: Tasks 2-5.
  - Validate with: API integration tests for success, disconnect, replay, denial, timeout, project-busy, quota, access-loss, stale-state reconciliation, tenant-safe operations summaries, rejected automatic triggers, and no implicit runtime/provider change.
  - Implementation note (2026-08-21): schema v9 and a partial unique index enforce one open conversation per tenant/project across concurrency and restart. Create/audit/fix share the canonical project resolver and exact `main|preview` delivery guard. The runner rejects dirty, mismatched, advanced or divergent checkouts without mutation; completed fixes must be committed and clean, recheck the admitted remote head, and use one ordinary non-force push. `main.ts` no longer creates managed worktrees or starts their cleanup worker. Flutter restores one open conversation, removes multi-tab creation, closes through the authenticated idempotent server route, and maps busy/delivery failures visibly. Historical worktree code and physical directories are preserved but inactive.
- [x] Task 6a: Make provider admission and execution an explicit, durable runner boundary.
  - Files: `runner/src/contracts/index.ts`, `runner/src/runs/execution.ts`, `runner/src/runs/{audit,fix,conversation}.ts`, `runner/src/db/index.ts`, `runner/src/main.ts`, `runner/src/app.ts`, `runner/test/contracts/**`, `runner/test/runs/**`, `runner/test/db/**`.
  - Action: Replace the marker-only `ExecutionProvider` with a typed registry, server-owned policy resolver and local managed provider. Resolve and persist an immutable secret-safe envelope before preflight; require manual-only intent, selected runtime/provider/capabilities, bounded resource budget and deadline. Preflight must precede workspace/session/turn creation. Persist one tenant-scoped opaque execution record with additive migration; return explicit completed/failed/delegated outcomes; cancel using only opaque run/execution identifiers. Preserve existing fail-closed restart interruption rather than claiming recovery until a future distributed-execution contract exists.
  - User story link: Makes each visible agent action explainable, policy-bound and safely extensible to future execution environments without exposing infrastructure.
  - Depends on: Tasks 1, 4, 5 and the existing Task 6 routes.
  - Validate with: contract/registry tests; manual-only/no-fallback/preflight-before-side-effects tests; audit/fix/conversation regression tests; SQLite v6-to-v7 migration, tenant-isolation, state-transition and secret-redaction tests; typecheck, full runner test suite and diff hygiene.
  - Implementation note (2026-08-07): the local `managed-disposable` registry, immutable execution admission, schema v7 envelope persistence, preflight ordering, opaque cancellation and terminal execution-state synchronization are implemented and locally verified. A restart interrupts both the active run and matching admitted execution. Remote dispatch, drain and reattach remain explicitly out of scope.
- [x] Task 7: Establish the proprietary ShipGlows health evaluator and five-dimensional Cockpit projection.
  - Files: `runner/src/skills/**`, `runner/src/health/**`, `runner/test/skills/**`, `runner/test/health/**`, `app/lib/domain/project_health/**`, `app/lib/shipglows/data/cockpit/**`, `app/test/domain/project_health/**`, `app/test/shipglows/data/cockpit/**`.
  - Action: Define versioned skill-run/evidence and `ProjectContextBundle` contracts, execute one bounded read-only skill through `just-bash` against a controlled snapshot, map evaluator outcomes into tech/content/SEO/performance/security models, preserve explicit unknown/not-reported states, and link each result to its producing run and context provenance.
  - User story link: Provides the global visual health view across tech, content, SEO, performance, and security.
  - Depends on: Task 1 contracts; can use fixtures before Task 6 is live.
  - Validate with: deterministic evaluator fixtures, sandbox limits, coverage, stale evidence, source-gap, malformed payload, and worst-state tests; prove that no absent evidence becomes healthy.
  - Implementation note (2026-08-11): complete for the MVP contract. The runner-owned evaluator emits all five dimensions, distinguishes `notReported`, `unknown` and `stale`, rejects malformed or secret-bearing payloads, and computes conservative coverage plus worst state. Versioned skill-run/evidence and `ProjectContextBundle` contracts bind accepted results to one tenant, project, source commit, bounded source set and valid chronology; schema v8 persists that envelope atomically and returns its run/context provenance through the Cockpit. The first fixed read-only tech audit executes through `just-bash` 3.2.0 against a controlled in-memory snapshot with no host filesystem, network, JavaScript or Python capability, bounded commands/resources/output, and normalized evidence only.
- [~] Task 8: Integrate the active-runtime identity and runner API adapters.
  - Files: `app/lib/shipglows/auth/**`, `app/lib/shipglows/data/api/**`, `app/lib/shipglows/providers/**`, `app/web_auth/**`, `app/android/**`, `app/windows/**`, `app/test/shipglows/auth/**`, `app/test/shipglows/data/api/**`.
  - Action: Keep one provider-neutral Dart auth interface, integrate Firebase Flutter sessions across Web/Android/Windows, add typed Dio API clients plus authenticated fetch-style SSE/PTY streaming, proactive token refresh and one bounded `401` refresh retry, `Last-Event-ID` cursor resume, stable error mapping, idempotent command retries and Riverpod state ownership. Do not use browser `EventSource`, because the stream requires an authorization header.
  - User story link: Makes sign-in and managed server conversations available in the active Flutter app.
  - Depends on: Tasks 1-2 and API fixtures from Task 6.
  - Validate with: Web bridge tests, Android adapter contract tests, token-refresh tests, reconnect/idempotency tests, and single-entrypoint dependency scan.
  - Implementation note (2026-08-11): the local Web/Android/Windows contract is implemented behind Firebase-neutral interfaces. Startup session restoration, expiry-skew refresh, coalesced refresh, one bounded `401` retry, stable idempotency keys across transient retries, authenticated SSE resume with query cursor plus `Last-Event-ID`, bounded conversation reconnect and duplicate-event suppression are covered locally. Linux REST/OIDC and live Firebase authentication remain owned by `firebase-auth-convex-alignment.md`; Task 8 stays partial until those external/platform proofs complete.
- [x] Task 9: Reconcile the Flutter design authority and implement the Cockpit shell.
  - Files: `app/lib/presentation/theme/app_theme.dart`, `app/lib/shipglows/app.dart`, `app/lib/shipglows/router.dart`, `app/lib/shipglows/presentation/screens/cockpit_screen.dart`, `app/lib/shipglows/presentation/widgets/cockpit/**`, corresponding widget/golden tests.
  - Action: Make the active ShipGlows theme consume canonical semantic tokens; implement responsive Cockpit navigation, health matrix, redacted per-project run-state summary, project parent tabs, loading/empty/stale/access-lost/error states, keyboard/focus behavior, and accessible labels.
  - User story link: Gives the user one visual command center for every repository.
  - Depends on: Tasks 7-8.
  - Validate with: widget tests at phone/tablet/desktop widths, contrast/focus/semantics checks, golden snapshots, and design-system drift check.
  - Implementation note (2026-08-11): complete for the Task 9 contract. The single Flutter theme authority, system light/dark mode, semantic/layout/responsive tokens and server-first Cockpit cover runner-authoritative projects, local fallback, empty, stale, access-lost, session-expired and error/retry states. Three deterministic goldens cover compact light managed, medium dark stale/suspended and expanded light fallback composition. Widget proof now includes 320x568 with 2x text, 390x844, 768x1024 and 1440x900, per-dimension semantics, rendered-surface contrast, canonical focus borders and minimum action targets. Release-build Chrome proof passes at 390x844 and 1440x900 with responsive accessible navigation and zero console errors; the obsolete Clerk Web bootstrap was removed. Changed-file design drift is zero. Live Firebase/runner proof remains with Tasks 8, 10 and 13, not Task 9.
- [~] Task 10: Implement agent conversation tabs and action controls.
  - Files: `app/lib/shipglows/presentation/screens/project_workspace_screen.dart`, `app/lib/shipglows/presentation/widgets/conversations/**`, `app/lib/shipglows/providers/conversations/**`, corresponding tests.
  - Action: Render normalized messages/tools/plans/approvals/progress/results plus runtime identity and capability limits; create/open/close tabs, audit/fix buttons, message composer, interrupt/resume/approve/deny controls, auto-scroll rules, unread indicators and reconnection. Keep semantic agent work separate from the operator Workspace and never expose a runtime-specific protocol.
  - User story link: Lets users work with the selected agent directly inside each project tab.
  - Depends on: Tasks 6, 8, and 9.
  - Validate with: widget/state tests for event order, streaming deltas, reconnect, denial, interruption, long output, inaccessible action, concurrent device update, and zero ANSI/terminal rendering in the semantic conversation surface.
  - Implementation note (2026-08-11): the local semantic conversation surface is implemented with typed event mapping, coalesced deltas, ANSI/control sanitization, monotonic cursors, ID/cursor dedupe, bounded timeline/reconnect, atomic tab replacement, unread/pause behavior and conditional auto-scroll. Create/send/interrupt/resume/approve/deny plus audit and proposed-fix controls use the verified runner routes and stable idempotency keys. Local Flutter proof passes; live Firebase/runner and concurrent-device integration proof remain, so Task 10 stays partial.
- [~] Task 11: Implement the separately authorized operator Workspace.
  - Files: `runner/src/operator-workspace/**`, `runner/src/pty/**`, `runner/test/operator-workspace/**`, `runner/test/pty/**`, `app/lib/shipglows/presentation/screens/operator_workspace_screen.dart`, `app/lib/shipglows/presentation/widgets/operator_workspace/**`, `app/lib/shipglows/providers/operator_workspace/**`, `app/test/shipglows/operator_workspace/**`, platform runner files for Web/Android/Windows.
  - Action: Issue one project-scoped short-lived capability per initial attach or reconnect, validate the WebSocket `Origin` by exact equality against the configured application origin, attach only to the existing allowlisted tmux session, bridge bounded PTY input/output/resize and heartbeat frames through the separate channel, and launch Neovim without persisting scrollback or exposing host paths/credentials. A disconnect releases only the browser attachment; tmux persists. One actor/project/tmux tuple has one active attachment, and a concurrent attach fails with `409 operatorSessionActive` rather than taking over silently.
  - User story link: Gives the operator the requested browser-accessible tmux/Neovim workspace without making terminal administration part of ordinary use.
  - Depends on: Tasks 2-4, 6, 8, and 9; the semantic agent surface must remain usable if Workspace is unavailable.
  - Validate with: authorization/expiry and capability-reuse rejection tests, exact-Origin negative matrix, tmux identity/allowlist tests, heartbeat expiry, PTY resize/fresh-capability reconnect tests, Web/Android/Windows rendering proof, Neovim launch fixture, disconnect cleanup, no-host-path/secret assertions, and deterministic concurrent-session rejection.
  - Implementation note (2026-08-03): the runner now issues one idempotent, short-lived project/actor capability, spawns only a server-allowlisted tmux session through a PTY, rejects invalid/expired/concurrent attachments, bounds input and resize frames, and closes by actor ownership. Flutter creates the capability, connects through the dedicated WebSocket channel, renders PTY output with `xterm`, forwards input/resize, and closes on disposal. Hosted reconnect, Neovim, and Web/Android/Windows rendering proof remain.
  - Implementation note (2026-08-18): the local contract adds the closed `editor|terminal` surface. The runner derives a separate stable tmux name for Éditeur and passes fixed argv ending in `nvim`; Flutter defaults the Workspace to Éditeur, provides Preview/Éditeur/Terminal selection and disposes the previous Workspace before opening another. Direct Neovim UI RPC remains a later bounded batch behind a private normalized gateway, not part of this PTY slice.
- [~] Task 12: Add observability, operational controls, and secure runbook.
  - Files: `runner/src/observability/**`, `app/lib/shipglows/observability/**`, `shipglows_data/technical/operator-guides/managed-agent-runner.md`, related tests.
  - Action: Integrate Sentry with strict before-send redaction, early Flutter/server initialization, release/build identity, safe diagnostics/log-copy with Paris/UTC headers, health endpoints, runtime auth/process/capability checks, workspace cleanup, quotas, SQLite backup/migration procedures, and incident recovery.
  - User story link: Enables ShipGlows to own the server so the user does not have to.
  - Depends on: Tasks 4-6, 8, and 11.
  - Validate with: redaction fixtures, synthetic health failures, release tags, cleanup dry-run, backup/restore proof, and runbook command review with no secret output.
  - Implementation note (2026-08-11): the local runner reliability slice is implemented. Public `GET /health/live` returns only a closed `status` payload; authenticated `GET /v1/diagnostics` exposes bounded build identity, UTC/Europe-Paris timestamps and normalized dependency states without reflecting errors, paths or configuration. The schema-v9 SQLite store supports non-overwriting online backup through Node's supported `node:sqlite.backup` API, validates integrity/schema on the copy, and has migration-plus-restore proof. The operator script refuses a missing/non-file source and prints only a generated basename plus bounded metadata. Sentry initialization, cleanup dry-run and hosted incident proof remain open, so Task 12 stays partial.
  - Implementation note (2026-08-21): optional Sentry reporting is disabled by default, validates an HTTPS DSN and bounded release, disables automatic integrations/tracing/breadcrumbs/default PII, and scrubs every captured event to a stable failure code plus bounded release/environment identity. Unexpected HTTP failures are wired through this adapter without allowing SDK failure to affect requests. Provider-configured ingestion proof remains open.
- [ ] Task 13: Complete end-to-end proof and documentation coherence.
  - Files: `shipglows_data/workflow/verification/shipglows-managed-agent-cockpit-mvp.md`, impacted technical maps/docs, `app/README.md`, `app/CHANGELOG.md`, and `app/.github/workflows/**`.
  - Action: Run runner checks, Flutter tests/analyze/build Web/build Android/build Windows where supported, authenticated browser scenarios, managed clone/Codex-first-adapter smoke scenarios, fake-second-adapter conformance scenarios, Workspace tmux/PTY/Neovim scenarios, access-loss and reconnect tests, just-bash sandbox tests, diagnostics/Sentry redaction, secret scans, metadata lint, and diff hygiene. Update docs only to the proven behavior.
  - User story link: Proves that a normal user can operate the Cockpit and agent sessions without infrastructure knowledge.
  - Depends on: Tasks 1-12.
  - Validate with: every required Test Contract scenario recorded with command/result/evidence and no unsupported production claim.

# Execution Batches

- Batch A — runner foundation: Tasks 1-4. Ownership is limited to `runner/**`; no Flutter mutation.
- Batch B — runtime protocol and policy: Tasks 5-6 after shared schemas and persistence exist. Ownership is limited to `runner/src/agent-runtime/**`, `runner/src/events/**`, `runner/src/routes/**`, `runner/src/runs/**`, and tests.
- Batch C — Flutter data foundation: Tasks 7-8 against frozen API fixtures. Ownership is limited to the listed Dart auth/data/domain/provider files plus platform bridge files.
- Batch D — Flutter product UI: Tasks 9-10 after the health/auth/API state contracts are stable. Ownership is limited to theme/router/screens/widgets and their tests.
- Batch E — operator Workspace: Task 11 after authorization, runner policy and Flutter API contracts are stable. Ownership is limited to the operator PTY/session surfaces and their tests.
- Batch F — operations and proof: Tasks 12-13 after both semantic and operator slices integrate.

The default execution order is sequential by batch. Parallel work is allowed only inside a batch when write sets are disjoint, contracts are frozen, and each worker has a dedicated validation command.

Personal Cloud follow-up batches are non-overlapping and override broader batch ownership only for the companion-spec implementation:

- Batch PC-A — single sequential CLI writer: after the foundation and preview contracts are frozen, one writer owns both catalog v1 export and exact-Host user-mode Caddy routing, including HMR/lifecycle behavior. Its complete write set is `cli/config.sh`, `cli/lib.sh`, `cli/install.sh`, and `tests/cli/**` in the ShipGlows CLI repository; no companion batch or parallel writer may edit any CLI file.
- Batch PC-B — runner discovery and preview: owns only new `runner/src/cloud-projects/**`, `runner/src/preview/**`, `runner/test/cloud-projects/**`, and `runner/test/preview/**` files.
- Batch PC-C — Workspace reconnect: owns only `runner/src/operator-workspace/**`, `runner/src/pty/**`, `runner/test/operator-workspace/**`, and `runner/test/pty/**`.
- Batch PC-D — Flutter Personal Cloud surfaces: owns only new preview/workspace feature, provider, widget, screen and matching test files; it does not modify shared navigation or API clients.
- Batch PC-I — sequential integration: runs after PC-A through PC-D and exclusively owns shared configuration, application bootstrap, `main`, database/migrations, common API client/types, router/navigation, and documentation files. No parallel writer may touch those shared files.

# Acceptance Criteria

- `AC-001`: A signed-in user sees only authorized projects in one Cockpit.
- `AC-002`: Every project displays tech, content, SEO, performance, and security with explicit evidence/freshness; absent evidence is not reported as healthy.
- `AC-003`: Projects are parent workspaces and agent conversations are child tabs with restorable state.
- `AC-004`: A user can create/resume a semantic conversation, send a message, and observe real normalized events from the selected runtime without needing a terminal, SSH, tmux, PTY, ANSI emulator, or server path.
- `AC-004a`: Codex ACP passes the first complete `AgentRuntime` adapter smoke; normalized contract tests prove Flutter, health, authorization and public API behavior do not depend on ACP or Codex wire types.
- `AC-004b`: A request whose selected runtime lacks a required capability is rejected before execution with a stable, user-visible capability error; ShipGlows never silently changes runtime or expands permissions.
- `AC-005`: A user can launch a read-only audit and see queued, running, progress, result, error, interrupted, and retry states.
- `AC-006`: A user can launch a fix only from the clean canonical checkout on its server-configured `main|preview` branch; success performs one non-force push, while dirty/diverged/advanced/rejected delivery fails without reset, rebase, merge, deploy, force or fallback branch.
- `AC-007`: Approval requests are visible and can be approved/denied only by an authorized actor; denial, expiry, replay, and disconnect are recoverable and audited.
- `AC-008`: GitHub access is revalidated server-side before repo-sensitive work; revoked access blocks action while preserving stale readable projection.
- `AC-009`: HTTP retry and SSE reconnect cannot duplicate conversations, turns, runs, approvals, or tracker proposals.
- `AC-010`: Cross-tenant/project identifiers, traversal paths, oversized payloads, prompt-injection attempts, and client-selected policies are rejected server-side.
- `AC-011`: No GitHub/runtime/Firebase secret, token, cookie, tokenized URL, local path, environment value, raw private file, or unrestricted command output appears in client payloads, persisted events, logs, or Sentry.
- `AC-012`: Web passes a complete authenticated end-to-end scenario; Android and Windows pass platform, responsive UI, terminal-rendering contract, and API compatibility proof.
- `AC-013`: Server restart, selected-runtime failure, event disconnect, timeout, project-busy, quota, SQLite failure, dirty checkout, divergence and rejected-push scenarios preserve understandable state and bounded recovery.
- `AC-014`: Completed run evidence can update the Cockpit and create a proposed tracker change while repository/Markdown remains canonical.
- `AC-015`: A non-technical user can complete sign-in, select a project, launch an audit, inspect progress/result, and start a follow-up conversation without infrastructure instructions.
- `AC-016`: An explicitly authorized operator can open one Workspace, attach to one allowlisted tmux session, resize/reconnect the PTY, launch Neovim, and close the session without exposing host paths, credentials, or arbitrary shell selection.
- `AC-016a`: Every Workspace reconnect obtains a fresh one-time capability and reattaches to the same tmux session; neither Flutter nor SQLite persists terminal scrollback.
- `AC-016b`: Workspace WebSocket admission requires exact configured `Origin`; missing, `null`, wildcard, prefix and suffix variants fail before PTY creation.
- `AC-016c`: Bounded heartbeat expiry releases the abandoned browser attachment without killing tmux, and a concurrent attach deterministically returns `409 operatorSessionActive` with no implicit takeover.
- `AC-016d`: Projects + persistent Preview + reconnectable Workspace is the current Personal Cloud completion gate; semantic Conversations and Studio remain usable when available but are not blocking dependencies for that gate.
- `AC-016e`: The client may request only `editor` or `terminal`; the runner selects cwd, tmux identity and executable. Éditeur reconnects to one stable derived tmux session running fixed `nvim`, Terminal retains the allowlisted shell session, and one idempotency key cannot switch between them.
- `AC-017`: At least one proprietary ShipGlows skill can run through bounded `just-bash` against a controlled snapshot, produce versioned evidence, and update health without accessing secrets or unrestricted network/filesystem state.
- `AC-018`: Copied diagnostics begin with commit/build identity and Paris/UTC build timestamps, remain redacted, and are useful without direct Sentry dashboard access.
- `AC-019`: The Cockpit shows only caller-authorized redacted run-state supervision; every MVP run records `manual`, and schedule/webhook/system-recommendation triggers are rejected without starting work.
- `AC-020`: Every runtime context has an explicit versioned ShipGlows provenance bundle or an empty-context marker; no opaque, cross-project, cross-tenant or self-modifying memory is used.
- `AC-021`: Every execution is admitted through one persisted, immutable, secret-safe server-resolved envelope; unsupported or unavailable provider capability fails before a workspace or runtime turn exists, with no fallback. Restart of a local execution is visibly interrupted rather than falsely represented as recovered.

# Test Contract

- `surface`: Flutter Web, Android and Windows active ShipGlows runtime; Node.js/TypeScript managed control plane; `AgentRuntime`/`ExecutionProvider`/`CapabilityBroker` contracts; generic ACP local-stdio adapter with pinned Codex ACP first agent; Firebase Auth identity adapter; GitHub App access layer; canonical checkout/delivery guard; SQLite operational projection; authenticated SSE/HTTP API plus separate authenticated PTY channel; Cockpit health projection; semantic conversation UI; operator Workspace; Sentry diagnostics; operator docs; bounded just-bash skill execution. Convex is the target product data layer but its first projection is outside this proof. Marketing site, merge/deploy, iOS shell, Linux desktop application launch, additional live ACP agents, and unrestricted shell access are outside this proof.
- `proof_profile`: high-risk authenticated runtime and agent-execution proof. Required evidence combines official-doc freshness, runner unit/contract/integration/security tests, Flutter unit/widget/platform tests, authenticated Web browser proof, Android and Windows build/session/adapter proof, local managed Git/Codex-first-adapter smoke plus fake second-adapter conformance proof, restart/reconnect/idempotency proof, tenant isolation, secret/redaction scans, Sentry and diagnostics redaction, metadata lint, design-system drift check, dependency audit, and diff hygiene.
- `proof_order`:
  1. Freeze shared request/response/event/error schemas and threat boundaries.
  2. Prove auth, tenant isolation, GitHub access, workspace safety, persistence, and idempotency before enabling runtime execution.
  3. Prove Codex-first-adapter event normalization, second-adapter conformance and process recovery with fakes before a local live smoke.
  4. Prove one-conversation admission, audit read-only behavior, exact delivery branch, clean/divergence guards, and non-force push before wiring action buttons.
  5. Prove Flutter auth/API/reconnect state with fixtures before live integration.
  6. Prove Cockpit and conversation UX across responsive widths and failure states.
  7. Run authenticated Web end-to-end plus Android and Windows platform/API contract proof.
  8. Prove the separately authorized Workspace with tmux/PTY/Neovim fixtures and prove one bounded just-bash skill run.
  9. Prove Preview/Éditeur/Terminal selection, a single active Workspace connection, fixed Neovim argv/session derivation, surface-schema rejection and idempotency conflict behavior.
  9. Run observability redaction, secret scans, docs coherence, metadata lint, dependency audit, full test/analyze/build, and `git diff --check`.
- `checklist_path`: `shipglows_data/workflow/verification/shipglows-managed-agent-cockpit-mvp.md`.
- `required_scenario_ids`:
  - `MCC-001`: authorized Cockpit lists only the actor's projects and five explicit dimensions.
  - `MCC-002`: missing evidence becomes `unknown`/`notReported`, not healthy.
  - `MCC-003`: create/resume conversation maps to one server-owned selected-runtime thread/session and restores after app/server restart.
  - `MCC-004`: message streams normalized semantic agent events in order with no terminal/ANSI surface.
  - `MCC-004a`: Codex passes the first adapter smoke and a fake second adapter passes the same runtime conformance suite without Flutter/public-contract changes.
  - `MCC-004b`: an unavailable or under-capable runtime is rejected before execution; no implicit fallback or permission expansion occurs.
  - `MCC-005`: SSE cursor resume and duplicate HTTP retry produce exactly-once observable actions.
  - `MCC-006`: read-only audit cannot mutate repository state.
- `MCC-007`: one project conversation owns the canonical `main|preview` delivery lease; fix delivery is clean, remote-head-stable and non-force, with no worktree, temporary branch, merge, deploy or fallback.
  - `MCC-008`: approval approve/deny/expire/replay is authorized, idempotent, visible, and audited.
  - `MCC-009`: revoked/stale GitHub access blocks repo-sensitive action but preserves stale projection.
  - `MCC-010`: cross-tenant/project access and open-stream access after membership loss are denied.
  - `MCC-011`: traversal, symlink escape, oversized output, ANSI/binary content, and prompt-injection attempts remain contained and redacted.
  - `MCC-012`: interrupt, timeout, selected-runtime crash, runner restart, project-busy, and quota states are recoverable without duplicate work.
  - `MCC-013`: no secret/token/cookie/header/private path/raw private file leaks through API, SQLite events, logs, diagnostics, or Sentry.
  - `MCC-014`: Web authenticated end-to-end user journey succeeds without infrastructure knowledge.
  - `MCC-015`: Android and Windows build, Firebase adapter contract, deep-link/session handling where applicable, and runner API compatibility succeed.
  - `MCC-016`: completed evidence updates health projection and tracker proposal without making SQLite canonical.
  - `MCC-017`: design-system authority, keyboard/focus/semantics, responsive layout, and long-conversation behavior pass UI proof.
  - `MCC-018`: official OpenAI, OpenCode/Kilo/ACP, Firebase, Convex, and GitHub assumptions are rechecked immediately before dependency/runtime integration.
  - `MCC-019`: operator Workspace capability is project-scoped, one-time and fresh per reconnect; the socket requires exact configured `Origin`, heartbeat expiry releases only its attachment, reattachment targets the same allowlisted tmux session, concurrent attach returns `409 operatorSessionActive`, and no host path, credential or scrollback persistence escapes.
  - `MCC-020`: a just-bash skill run is bounded, produces versioned evidence, and cannot access secrets or unrestricted network/filesystem state.
  - `MCC-021`: diagnostics/log-copy exposes safe build identity and Paris/UTC timestamps without tokens, cookies, private text, terminal scrollback or raw payloads.
  - `MCC-022`: operations summaries remain tenant/project scoped and do not expose prompts, paths, secrets, raw logs or unauthorized run totals.
  - `MCC-023`: only a server-validated manual `RunIntent` starts MVP work; reserved automatic trigger values are rejected idempotently before runtime selection.
  - `MCC-024`: project context is bounded, redacted, attributable and tenant/project scoped; attempts to attach client-selected, cross-project or untracked memory fail closed.
  - `MCC-025`: provider admission resolves manual intent, runtime/provider/capabilities/resources/deadline once; preflight rejection starts no workspace/session/turn, stores no secret/path, and cannot silently fall back.
  - `MCC-026`: an active local execution becomes a bounded interrupted state after restart; the MVP never claims drain, remote preservation or reattach without a dedicated provider implementation.
- `required_results`: all scenario IDs pass or are explicitly blocked by unavailable external credentials under the narrow exception below; no critical/high security defect remains; no unsupported production claim is added; every failed external smoke retains complete fake/local contract proof and an exact operator follow-up; full Flutter and runner checks pass; changed governance artifacts pass metadata lint; design-system drift is addressed; working-tree changes remain scoped and preserve pre-existing operator edits.
- `exception_with_proof`: live Firebase, GitHub App, Sentry ingestion, and Codex-first-adapter authenticated smoke calls may be deferred only when credentials or provider configuration are unavailable in the local environment. The implementation must still provide complete fake/local contract tests, disabled-by-default secure adapters, redaction proof, exact configuration diagnostics, and a verification checklist that marks the live scenario blocked rather than passed. A live Codex smoke may use the server's existing authenticated Codex installation without exposing credentials. A live OpenCode/Kilo adapter is explicitly outside this MVP proof. No release may be described as production-ready until all required live provider scenarios pass.
- `exception_without_proof`: none for tenant isolation, authorization middleware, one-conversation admission, idempotency, event ordering/resume, audit read-only policy, exact delivery branch, clean/divergence/non-force gates, path/symlink containment, prompt/output bounds, secret redaction, health unknown semantics, accessible failure states, metadata lint, dependency audit, and diff hygiene.

# Test Strategy

- Unit tests for every schema, state transition, health aggregation rule, redactor, policy, and mapper.
- Contract tests with fake Firebase Auth, GitHub App, Codex adapter, second agent adapter, filesystem, clock, and Sentry transports.
- SQLite migration, transaction, tenant boundary, idempotency, restart, backup, and restore tests.
- Local Git fixtures for fetch, `main|preview`, dirty checkout, remote advance, divergence, non-force push, durable conversation serialization, symlink/traversal rejection, and inactive legacy-worktree bootstrap proof.
- API integration tests for auth, commands, approvals, quotas, timeouts, interruption, cursor resume, access loss, and malformed input.
- Contract tests for operations-summary tenant isolation, manual-only run admission, immutable policy resolution, bounded context provenance and forbidden automatic triggers.
- Contract and migration tests for immutable execution-envelope persistence, provider capability/preflight rejection, opaque cancellation, no-fallback behavior, v6-to-v7 compatibility, tenant isolation and restart interruption semantics.
- PTY/tmux integration fixtures for capability expiry, allowlists, resize, reconnect, cleanup, Neovim launch, and concurrent-session rejection.
- Workspace security/recovery fixtures for one-time capability reuse denial, exact-Origin positive and negative matrices, heartbeat expiry without tmux termination, fresh-capability reattachment to the same tmux session, stale Flutter channel disposal, and deterministic `409 operatorSessionActive` handling.
- just-bash contract fixtures for virtual filesystem bounds, network allowlists, execution limits, cancellation, and evidence capture.
- Flutter provider/widget tests for loading, empty, disconnected, stale, access-lost, project-busy, streaming, approval, error, long conversation, multi-device update, and retry states.
- Responsive and accessibility tests for keyboard navigation, focus order, semantics, contrast, reduced motion, screen widths, and unread/streaming announcements.
- Authenticated browser proof for the full Web journey with console and network checks.
- Android and Windows build plus platform-adapter, session and Workspace rendering proof on an emulator/device or supported host when available.
- Diagnostics/log-copy proof that build identity and Paris/UTC timestamps are present without sensitive data.
- Windows Flutter build and Workspace rendering proof on the supported Windows environment.
- Security scans for credentials, token-like values, raw protocol leakage, clone paths, authorization headers, terminal/ANSI rendering, and unrestricted dynamic execution.
- Performance checks for first Cockpit render, project switch, large conversation virtualization, SSE event bursts, and bounded memory growth.

# Risks

- High security risk: a managed agent runner can access private code and execute tools; isolation, authorization, redaction, and server-owned policy are release gates.
- High multi-tenant risk: an opaque ID or event stream bug could expose another user's repository or conversation.
- High prompt-injection risk: repository content can attempt to influence tools or exfiltrate secrets.
- High product-trust risk: presenting dormant auth/GitHub modules as live integration would mislead the operator and users.
- Medium architecture risk: raw app-server protocol coupling could make the Flutter client brittle; normalization isolates it.
- Medium operations risk: agent-runtime crashes, dirty canonical checkouts, remote divergence, SQLite corruption, and token expiry need explicit recovery.
- Medium architecture risk: distributed-worker recovery could be overstated before ShipGlows has a durable remote provider and distributed lease. This MVP records local execution truth and reports restart interruption; drain/reattach is deferred to a separately reviewed execution-provider slice.
- Medium cost/availability risk: unbounded turns, output, concurrency, or retries could exhaust server and model quotas.
- Medium UX risk: a terminal clone would be visually noisy and inaccessible; semantic event rendering requires careful progress/error design.
- Medium platform risk: Firebase session and deep-link behavior still needs Web/Android/Windows proof; Linux REST/OIDC support remains unimplemented.
- Medium data-coherence risk: operational projections could accidentally become canonical instead of GitHub/Markdown.
- High operator-surface risk: a PTY/tmux bridge can become a general server shell if capability scope, allowlists, cleanup and audit boundaries are weakened.
- Medium sandbox risk: just-bash is beta and simulated; its use must remain bounded and must not be mistaken for proof that real server commands are safe.
- Medium orchestration risk: copied trigger or memory patterns could create unbounded autonomous work or tenant-context leakage; manual-only admission, explicit policy/context provenance and a future-spec gate keep those patterns out of the MVP.

# OWASP Security Gate

- Top 10:2025 applicability: all categories apply to this internet-facing privileged control plane — `A01 Broken Access Control` covers actor/tenant/project/runtime/Workspace authorization; `A02 Security Misconfiguration` covers Firebase, CORS/Origin, cookies, Caddy, runner and diagnostics; `A03 Software Supply Chain Failures` covers pinned ACP/runtime packages, lockfiles and release provenance; `A04 Cryptographic Failures` covers TLS, token/capability secrecy and randomness; `A05 Injection` covers SQL, command, path, prompt, event, header and terminal input; `A06 Insecure Design` covers replay, concurrency, quotas, approvals, capability admission and abuse cases; `A07 Authentication Failures` covers Firebase token/session lifecycle and the fixed operator identity; `A08 Software or Data Integrity Failures` covers catalog/runtime events, SQLite transitions, idempotency and build artifacts; `A09 Security Logging and Alerting Failures` covers redacted denial, runtime, Workspace and provider evidence; `A10 Mishandling of Exceptional Conditions` covers timeout, interruption, crash, restart, partial failure, cleanup and fail-closed recovery.
- Trust and data boundaries: untrusted Flutter/browser/native client -> Firebase-authenticated runner API; GitHub/provider tokens -> server-only adapters; repository content/prompts -> policy/runtime/sandbox; CLI catalog and PM2/tmux state -> runner redacted projection; runner -> SQLite operational projection; normalized SSE -> Flutter; one-time Workspace capability plus exact `Origin` -> WebSocket/PTy -> allowlisted tmux; future public Caddy/TLS and hosted providers remain external boundaries. No client-selected tenant, filesystem path, command, runtime policy, upstream port or raw provider protocol crosses these boundaries.
- Selected exact ASVS v5.0.0 requirement identifiers: `v5.0.0-2.1.3` for documented resource limits; `v5.0.0-2.2.1` and `v5.0.0-2.2.2` for positive closed-schema validation; `v5.0.0-2.3.1` and `v5.0.0-2.3.4` for ordered state transitions and concurrency; `v5.0.0-3.3.1`, `v5.0.0-3.4.2` and `v5.0.0-3.4.3` for session, exact-origin and browser policy; `v5.0.0-5.3.2` for server-owned path containment; `v5.0.0-8.2.1`, `v5.0.0-8.2.2` and `v5.0.0-8.3.1` for function/object authorization; `v5.0.0-12.1.1` for hosted TLS; `v5.0.0-13.1.3`, `v5.0.0-13.2.4` and `v5.0.0-13.2.5` for service lifecycle, timeout/retry and outbound-resource policy; `v5.0.0-14.2.1`, `v5.0.0-14.2.4` and `v5.0.0-14.2.7` for sensitive-data classification, minimal retention and no URL secrets; `v5.0.0-15.2.5` for dangerous execution containment; `v5.0.0-16.3.3`, `v5.0.0-16.5.1` and `v5.0.0-16.5.3` for security logging, generic external errors and fail-closed exceptions. ASVS freshness recheck: `/101-sg-ready` must verify the identifiers, exact current wording and applicability against the official ASVS v5.0.0 source before accepting this gate.
- Existing proof contract: `MCC-005`, `MCC-008`, `MCC-010` and `MCC-019` cover replay, authorization and Workspace admission; `MCC-006`, `MCC-007`, `MCC-011`, `MCC-020`, `MCC-024` and `MCC-025` cover repository/runtime containment, injection and policy admission; `MCC-012` and `MCC-026` cover exceptional recovery; `MCC-013`, `MCC-021` and `MCC-022` cover secret-safe storage, diagnostics and operations visibility; `MCC-018` owns dependency/provider freshness. Passing lint, audit or fake adapters alone is supporting evidence, not a hosted security claim.
- Residual gaps and owners: the release/operations owner must prove public TLS/Caddy/firewall, exact production origins, Firebase provisioning, backups/reboot and browser denial under `shipglows-personal-cloud-rollout.md`; GitHub, Firebase, Sentry and ACP/provider owners must complete credentialed live proofs without exposing secrets; the product/security owner must separately approve any multi-user tenancy, automatic trigger, remote execution provider, Studio production bridge or broader terminal capability. Until those proofs pass, the runner and Workspace remain locally proven or deployment-blocked rather than production-secure.

# Execution Notes

- Personal Cloud implementation reads this spec with `shipglows-cloud-dev-gateway-foundation.md`, `shipglows-persistent-dev-preview-ingress.md`, and `shipglows-personal-cloud-rollout.md`. Companion-spec batches PC-A through PC-D may proceed only on their disjoint write sets; PC-I integrates shared config/app/main/database/API/router/docs sequentially after them.
- The Personal Cloud milestone reuses the existing CLI/PM2/tmux/Neovim setup. It does not introduce Docker or Convex and does not make semantic Conversations or Studio a preview/Workspace dependency.
- Read order: this spec; `AGENT.md`; `technical/runtime-boundary.md`; foundational architecture; GitHub managed clone spec; dashboard projection spec; design-system authority; `lib/shipglows/**`; source reader/project-health modules; runner foundation; and current Firebase/Auth provider notes. Dormant modules are inspected only for a concrete, reviewed integration need.
- Start with Batch A. Do not wire UI action buttons to real execution until auth, tenant isolation, workspace containment, persistence, and idempotency tests pass.
- Keep every runtime transport behind `AgentRuntime` and keep Flutter behind the normalized ShipGlows event contract. No Flutter model may import a runtime wire type.
- Use the allowlisted, version-pinned `@agentclientprotocol/codex-acp` subprocess over local stdio as the active Codex adapter behind ShipGlows `AgentRuntime`. ACP transport, wire types, session identifiers and capabilities remain private to the adapter and cannot leak into routes, policy, health or Flutter; the fake second adapter remains mandatory proof. Keep the previous Codex app-server adapter strictly intact and rollback-only: it is neither an active implementation target nor an independently evolving path.
- Use authenticated fetch-style SSE from Flutter with `Authorization` and `Last-Event-ID` headers; do not use browser `EventSource` or base the public API on app-server's experimental WebSocket transport.
- Keep SQLite access behind repositories and explicit migrations; do not embed SQL in route handlers.
- Keep GitHub token generation inside a single server adapter with structured redaction and no persistence.
- Make audit/fix presets server-owned capabilities, not arbitrary client shell commands.
- Keep `just-bash` behind a `SkillSandbox` interface so it can be replaced by a stronger worker/process sandbox without changing health contracts.
- Keep the operator Workspace behind an `OperatorSession` interface; validate `xterm.dart` rendering and the server PTY implementation independently before choosing a production gateway.
- Virtualize or incrementally render long conversations; do not retain unbounded delta widgets in memory.
- Validation commands must include runner tests/typecheck/lint/audit, `flutter test`, `flutter analyze`, Web/Android/Windows build proof where available, metadata lint for changed artifacts, design-system drift check, secret/protocol scans, and `git diff --check`.
- Stop if a test reveals cross-tenant access, secret exposure, default-branch mutation, public app-server reachability, client-controlled filesystem/policy, non-idempotent replay, or silent healthy state from absent evidence.
- Stop before live provider calls if credentials are absent or if executing them could alter an external repository beyond a dedicated disposable fixture.
- Preserve all pre-existing user changes in `CLAUDE.md`, `README.md`, `technical/runtime-boundary.md`, and `workflow/repurpose-packs/`; reconcile overlapping docs deliberately during the documentation task.

# Open Questions

None. MVP product and architecture decisions are fixed by this specification. Provider credentials and deployment values are runtime configuration inputs, not unresolved product decisions.

# Skill Run History

| Timestamp (UTC) | Skill | Model | Action | Result | Next |
| --- | --- | --- | --- | --- | --- |
| 2026-08-21 20:28:03 UTC | shipglows + sg-development | GPT-5 Codex | Added disabled-by-default Sentry error reporting with strict HTTPS/release configuration, zero automatic integrations/tracing/breadcrumbs/data collection, stable-code-only HTTP failure capture, destructive event scrubbing and non-blocking SDK failure behavior. | local Task 12 slice verified: focused 48/48 and runner 404/404 tests, typecheck, lint and zero-vulnerability dependency audit pass; no provider call or deployment performed | Commit and push this bounded observability milestone; provider ingestion proof, cleanup dry-run and hosted recovery evidence remain |
| 2026-08-21 19:40:01 UTC | shipglows + sg-development | GPT-5 Codex | Fenced ACP notifications and permission requests to active turns and added explicit process-restart proof that cold resume is refused before any provider connection when the trusted workspace descriptor is absent. | local Task 5 hardening verified: ACP 18/18, runner 398/398, typecheck, lint and dependency audit pass; durable cross-process resume remains intentionally unavailable | Commit and push this bounded Task 5 milestone, then continue the Cockpit P0 from the next ready local boundary |
| 2026-08-21 18:19:37 UTC | sg-development | GPT-5 Codex | Replaced active managed worktrees with one durable open conversation and one server-owned canonical delivery branch per project; added fail-closed checkout/remote admission, non-force delivery, explicit close semantics and a single-conversation Flutter surface while preserving historical worktrees. | implementation verified locally: 396 runner tests, runner typecheck/lint/audit, 174 Flutter tests and Flutter analysis pass; no deployment performed | Commit and push the coherent slice to `origin/main`, then continue the next P0 without parallel project conversations |
| 2026-08-18 12:32:48 UTC | shipglows + sg-engineering + sg-design | GPT-5 Codex | Hardened the approved Neovim-first Workspace with mutation-only authorization, dedicated Unix execution identity, fixed PTY environment, protocol-v2 negotiation, bounded leases/backpressure, redacted diagnostics, non-wedging recovery and expanded Neovim focus mode. | local implementation verified: runner typecheck/lint/audit and 51 targeted tests pass; full runner suite is 376/377 with only the pre-existing Windows CRLF fixture mismatch; Flutter analysis, 24 targeted tests and the complete 163-test ShipGlows suite pass; no VM, deploy, commit or push action performed | Separately authorize hosted configuration and browser proof on the CAX11 |
| 2026-08-18 11:54:48 UTC | sg-development + sg-design | GPT-5 Codex | Implemented the approved Neovim-first Personal Cloud slice: closed editor/terminal capability, stable server-derived Neovim tmux session, one active Flutter Workspace, visible bounded reconnect failure and private future UI RPC boundary. | local implementation proven: Flutter 22/22, runner 372/373 with the sole known Windows CRLF fixture failure, typecheck/lint/analyze/design drift/metadata/diff checks pass; browser composition proven; no deploy or push performed | Authorize a separate hosted rollout, then prove the real CAX11 Neovim session through app.shipglows.com |
| 2026-08-17 22:45:49 UTC | 101-sg-ready | GPT-5 Codex | Rechecked the Personal Cloud priority, companion dependency versions, non-overlapping write ownership, Workspace reconnect policy, OWASP/ASVS gate and pinned ACP runtime authority after all P1 corrections. | SAFE; metadata, dependency, contradiction, canonical-structure and diff checks passed with no unresolved readiness blocker | /102-sg-start ShipGlows Managed Agent Cockpit MVP |
| 2026-08-17 22:44:00 UTC | 101-sg-ready correction | GPT-5 Codex | Replaced the obsolete active app-server execution note with the pinned allowlisted Codex ACP local-stdio subprocess behind `AgentRuntime`; retained the previous app-server adapter unchanged and rollback-only with no wire-type leakage. | runtime-authority P1 corrected; targeted contradiction checks required | Rerun metadata, contradiction, structure and diff checks |
| 2026-08-17 22:41:38 UTC | 101-sg-ready correction | GPT-5 Codex | Added the canonical OWASP Top 10:2025 and selected ASVS v5.0.0 security gate with trust boundaries, existing MCC evidence and hosted/provider residual owners. | security-gate P1 corrected; targeted checks required | Rerun metadata, structure and diff checks |
| 2026-08-17 22:38:29 UTC | 101-sg-ready correction | GPT-5 Codex | Removed false parallel CLI ownership by making PC-A the single sequential writer for catalog export and exact-Host Caddy/HMR lifecycle work; corrected design-system and preferred-stack dependencies to canonical active metadata. | P1 ownership and dependency blockers corrected; targeted readiness checks required | Rerun targeted metadata, structure and diff checks |
| 2026-08-17 22:23:23 UTC | 100-sg-spec | GPT-5 Codex | Amended the Cockpit around the Personal Cloud priority: Projects, persistent Preview and reconnectable Workspace; fixed fresh capability, exact-Origin, heartbeat and single-active contracts while keeping semantic Conversations and Studio available but non-blocking. | amended; companion specs drafted and readiness review required | Run `/101-sg-ready ShipGlows Managed Agent Cockpit MVP` with the three Personal Cloud companion specs |
| 2026-08-17 21:37:06 UTC | sg-development + sg-engineering | GPT-5 Codex | Unified ACP overflow and interrupt behind a bounded hard-stop, removed sessions before terminal acknowledgement, fenced late callbacks and second prompts, tolerated cancel transport rejection, bounded raw NDJSON framing and validated retained provider identifiers. Framing failure now closes the SDK connection and kills the producer idempotently. | focused ACP connection proof passes 16/16; full runner suite passes 354/355 with only the pre-existing Windows CRLF worktree fixture mismatch | Keep cold isolated resume denied until a separately specified durable workspace-descriptor migration exists |
| 2026-08-17 21:12:00 UTC | sg-development + sg-engineering | GPT-5 Codex | Hardened the ACP slice after independent review: explicit runtime modes and trusted workspaces, durable approval lifecycle, active-run fencing, one-shot approval only, bounded sanitized updates, safe stop reasons, supervised process shutdown and no advertised ACP resume. | ACP/security/app integration gates pass; complete runner suite passes 345/346 with only the pre-existing Windows CRLF worktree fixture mismatch | Keep cold isolated resume denied until a separately specified durable workspace-descriptor migration exists |
| 2026-08-17 20:31:58 UTC | sg-development + sg-engineering | GPT-5 Codex | Replaced the runner's active native-only selection with one generic ACP local-stdio runtime behind the unchanged `AgentRuntime` boundary; pinned ACP SDK and Codex ACP versions; normalized sessions, prompt lifecycle, cancellation, permissions and semantic updates without exposing raw provider data. | focused ACP tests, typecheck, lint, dependency audit and real create/prompt/stream smoke pass; the full suite has one unrelated Windows CRLF fixture failure | Resolve the independent workspace fixture normalization, then continue Task 5 process-restart/order hardening |
| 2026-07-18 08:20:45 UTC | 000-shipglows | GPT-5 Codex | Routed the validated non-trivial product vision to the build lifecycle. | routed | 001-sg-build |
| 2026-07-18 08:20:45 UTC | 001-sg-build | GPT-5 Codex | Classified the agent/server boundary as requiring a dedicated ready specification before implementation. | spec-required | 100-sg-spec |
| 2026-07-18 08:20:45 UTC | 100-sg-spec | GPT-5 Codex | Converted operator decisions, current code evidence, preferred stacks, and fresh official integration docs into an executable high-risk MVP contract. | drafted | /101-sg-ready ShipGlows Managed Codex Cockpit MVP |
| 2026-07-18 08:30:36 UTC | 101-sg-ready | GPT-5 Codex | Ran structure, user-story, stack, freshness, adversarial, security, linked-system, task-order, and proof-contract gates; fixed Android auth, Codex transport, mutation concurrency, and foundational supersession ambiguity. | ready | /102-sg-start ShipGlows Managed Codex Cockpit MVP |
| 2026-08-01 21:20:18 UTC | 203-sg-research | GPT-5 Codex | Researched official Codex rich-client contracts, T3 Code reuse boundaries, Flutter Web/Android/Windows UI and transport packages, and cross-platform identity providers. | research-complete; Windows and auth assumptions require amendment | Amend this spec, then rerun /101-sg-ready |
| 2026-08-01 21:31:59 UTC | 203-sg-research | GPT-5 Codex | Corrected the initial T3-Code-heavy conclusion through a broader scan of Webmux, Happier, Handler, CloudCLI, Yep Anywhere, Harnss, OpenTag, xterm.dart, xterm.js and ttyd; restored the operator requirement for terminal/tmux/Neovim inside Flutter. | research-corrected; dual-surface scope requires amendment | Amend this spec, then rerun /101-sg-ready |
| 2026-08-01 21:44:02 UTC | 203-sg-research | GPT-5 Codex | Added Maestro and a local Maestro CLI to the comparison as workflow/evidence references, documented that ShipGlows skills remain the proprietary health evaluator, and added GitHub code-quality surfaces as an adjacent baseline rather than a substitute. | research-expanded; skill/evidence boundary requires amendment | Amend this spec, then rerun /101-sg-ready |
| 2026-08-01 21:57:13 UTC | 203-sg-research | GPT-5 Codex | Added just-bash as a candidate sandbox for bounded ShipGlows skill runs; explicitly separated this simulated terminal from the real privileged PTY/tmux/Neovim workspace. | research-expanded; sandbox boundary requires amendment | Amend this spec, then rerun /101-sg-ready |
| 2026-08-01 22:04:58 UTC | 100-sg-spec | GPT-5 Codex | Amended the spec around the existing Flutter prototype: preserved the Cockpit/Codex core, added the separately authorized PTY/tmux/Neovim Workspace, added the proprietary ShipGlows health evaluator and bounded just-bash sandbox, and promoted Windows to a first-class shared surface. | amended; readiness review required | Rerun /101-sg-ready ShipGlows Managed Codex Cockpit MVP |
| 2026-08-01 22:12:51 UTC | 101-sg-ready | GPT-5 Codex | Reviewed structure, user-story fit, platform footprint, Supabase/Auth boundary, fresh external dependencies, task ordering, diagnostics, adversarial cases, and security/proof contracts. | ready; implementation may start from the existing Flutter prototype | Start the managed runner foundation, then integrate the Flutter surfaces |
| 2026-08-01 22:36:56 UTC | 203-sg-research | GPT-5 Codex | Reassessed Vercel's agent stack, eve, HarnessAgent, workflows, sandbox, Connect, AI Gateway, ACP, OpenCode and Kilo through a multi-agent product lens. | research-complete; Codex-only runtime assumption is invalid | Amend this spec, then rerun /101-sg-ready |
| 2026-08-01 22:36:56 UTC | 100-sg-spec | GPT-5 Codex | Reframed the MVP as a ShipGlows multi-agent control plane: introduced `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker`, runtime capability checks and durable run semantics; retained Codex app-server as the first full adapter and required a second-adapter conformance fixture. | amended; readiness review required | Rerun /101-sg-ready ShipGlows Managed Agent Cockpit MVP |
| 2026-08-01 22:43:43 UTC | 101-sg-ready | GPT-5 Codex | Rechecked structure, multi-agent user-story fit, provider-neutral runtime boundary, Vercel/ACP freshness, runtime capability errors, task ordering, adversarial cases, security boundaries and proof contract. | ready; Codex-first implementation may start without a Codex-only architecture | Start the managed control-plane foundation, then the Codex adapter and Flutter surfaces |
| 2026-08-01 23:09:28 UTC | 102-sg-start | GPT-5 Codex | Implemented the first runner foundation slice: loopback Fastify bootstrap, strict secret-safe configuration, versioned neutral control-plane contracts, runtime capability selection without fallback, SQLite projection hardening and fake second-runtime conformance proof. | partial; Task 1 implemented, remaining MVP tasks continue | Implement Supabase Auth and tenant/project authorization before protected routes |
| 2026-08-01 23:20:26 UTC | 102-sg-start | GPT-5 Codex | Added the first portable Supabase Auth foundation: runner JWKS verification and tenant actor resolution; provider-neutral Flutter session/refresh bootstrap disabled by default without public build configuration; protected tenant-scoped route fixture and fail-closed contract tests. | partial; Task 2 foundation implemented, state-route policy and live-provider proof remain | Build GitHub/workspace lifecycle while retaining the auth gate for each route |
| 2026-08-02 09:16:09 UTC | 102-sg-start | GPT-5 Codex | Implemented the GitHub App/workspace foundation: server-only App JWT and narrowed installation-token issuer, immutable-repository REST revalidation, tenant-scoped persisted repository binding, fixed-argument Git HTTPS transport, managed mirror/worktree lifecycle, path and symlink containment, project mutation lock, and stale-worktree cleanup. | partial; Task 3 foundation implemented, provider-configured smoke and durable run/workspace cleanup state remain | Persist durable run/workspace cleanup state before command routes |
| 2026-08-02 09:40:59 UTC | 102-sg-start | GPT-5 Codex | Added schema v3 durable run records, secret-safe checkpoints, legal state transitions, restart recovery for in-flight runs, and tenant-scoped workspace cleanup scheduling/retry state without local paths. | partial; Task 4 foundation implemented, runtime/session mappings, approvals, health/usage projections, migration fixtures, backup/restore proof, and provider-configured smoke remain | Complete the remaining operational projection slices before command routes |
| 2026-08-02 09:47:57 UTC | 102-sg-start | GPT-5 Codex | Extended schema v5 with tenant-scoped runtime session mappings, capability decisions, approvals, health evidence and bounded usage summaries; migration from v2 and restart/recovery proofs remain secret-safe. | partial; Task 4 persistence foundation implemented, protected route wiring, transaction/backup/restore fixtures, and provider-configured smoke remain | Wire the durable projection into protected command routes and the first agent runtime adapter |
| 2026-08-02 11:05:48 UTC | 102-sg-start | GPT-5 Codex | Added the first server-owned Codex app-server adapter and a protected audit command slice: initialize/initialized handshake, thread/turn lifecycle, semantic event normalization, approval responses, tenant/project mutate guard, durable run creation and safe failure projection. | partial; provider-configured Codex/GitHub smoke, SSE/replay, CSRF/origin state-route policy, fix orchestration, and full task proofs remain | Add event-stream persistence and provider-configured Codex smoke proof |
| 2026-08-02 11:35:36 UTC | 102-sg-start | GPT-5 Codex | Wired the runner composition root to the SQLite store, optional Supabase JWKS auth and Codex stdio runtime; persisted runtime events and added a tenant-scoped cursor-resumable SSE replay surface with heartbeat and redacted payloads. | partial; live fan-out, CSRF/origin state-route policy, fix orchestration, and provider-configured Codex/GitHub smoke remain | Add live event fan-out and provider-configured smoke proof |
| 2026-08-02 13:11:04 UTC | 102-sg-start | GPT-5 Codex | Added an in-process tenant/conversation event hub: runtime events are published only after durable persistence, `live=true` SSE subscribers receive new semantic events with replay deduplication, a bounded 30-second idle window, and disconnect cleanup; added cross-tenant isolation and hub contract tests. | partial; CSRF/origin state-route policy, fix orchestration, quotas/timeout reconciliation, Flutter integration, and provider-configured Codex/GitHub smoke remain | Add state-route policy and provider-configured smoke proof |
| 2026-08-02 13:18:39 UTC | 102-sg-start | GPT-5 Codex | Applied the existing normalized `RUNNER_ALLOWED_ORIGINS` allowlist to the protected audit command: present browser Origins must match exactly, Origin-less native Bearer clients remain supported, and read/SSE routes are unchanged; added policy, normalization, and route contract tests. | partial; fix orchestration, quotas/timeout reconciliation, Flutter integration, and provider-configured Codex/GitHub smoke remain | Add fix policy and provider-configured smoke proof |
| 2026-08-02 13:28:54 UTC | 102-sg-start | GPT-5 Codex | Added shared per-tenant run admission, bounded `RUNNER_MAX_CONCURRENT_RUNS_PER_TENANT` and `RUNNER_MAX_RUN_DURATION_MS` configuration, quota `429` handling, runtime interruption on timeout, and durable `interrupted`/bounded failure reconciliation; added admission and timeout contract tests. | partial; fix orchestration, durable/idempotent command coverage, Flutter integration, and provider-configured Codex/GitHub smoke remain | Add isolated fix command policy and provider-configured smoke proof |
| 2026-08-02 14:09:35 UTC | 102-sg-start | GPT-5 Codex | Added `POST /v1/projects/:projectId/fixes` with authentication, project mutation access, Origin policy, bounded issue/instruction schema, isolated-workspace capability policy, and explicit `503 fixUnavailable` until the GitHub/worktree executor is wired; added route and policy contract tests. | partial; GitHub/worktree fix executor, durable/idempotent command coverage, Flutter integration, and provider-configured Codex/GitHub smoke remain | Wire the server-owned GitHub/worktree executor without exposing paths or credentials |
| 2026-08-02 14:21:15 UTC | 102-sg-start | GPT-5 Codex | Wired the configured fix executor: GitHub App installation tokens are revalidated and scoped to one repository, a server-owned isolated fix worktree is created, Codex receives only the internal workspace cwd, run lifecycle/timeout/reconciliation is applied, and cleanup is scheduled without persisting a path; provider-disabled environments still return `503 fixUnavailable`. | partial; provider-configured smoke, durable/idempotent command coverage, Flutter integration, and production cleanup worker remain | Add provider-configured fix smoke and durable idempotency/cleanup worker proof |
| 2026-08-02 14:34:29 UTC | 102-sg-start | GPT-5 Codex | Added durable asynchronous idempotency for `POST /fixes` with concurrent-key coalescing and SQLite replay, required bounded `Idempotency-Key`, added tenant enumeration, and started a periodic cleanup worker that resolves due worktrees from server-owned run/binding metadata and marks completion/failure without persisting paths. | partial; provider-configured smoke, full command idempotency across all routes, Flutter integration, and cleanup retry/backoff policy remain | Add provider-configured fix smoke and broaden idempotency to all command routes |
| 2026-08-02 14:40:21 UTC | 102-sg-start | GPT-5 Codex | Extended the durable async idempotency boundary to `POST /audits`: the route now requires a bounded `Idempotency-Key`, coalesces concurrent duplicates, and replays the original accepted response from SQLite; added the real-store dependency to the audit command path. | partial; provider-configured smoke, remaining command-route idempotency, Flutter integration, and cleanup retry/backoff policy remain | Add provider-configured smoke and idempotency to future conversation/approval routes |
| 2026-08-02 15:03:01 UTC | 102-sg-start | GPT-5 Codex | Added the tenant/project-scoped approval decision route `POST /v1/projects/:projectId/approvals/:approvalId`: it resolves Codex approvals through the server-owned runtime, persists approved/denied state, publishes a safe semantic event, and replays duplicate keys through durable SQLite idempotency; added contract coverage proving one runtime call for repeated requests. | partial; conversation create/message/interrupt/resume routes, Flutter integration, provider-configured smoke, and cleanup retry/backoff policy remain | Integrate the approval/conversation API client in Flutter and run provider-configured smoke |
| 2026-08-02 15:11:09 UTC | 102-sg-start | GPT-5 Codex | Added the conversation command routes for create, message, interrupt and resume with server-resolved runtime sessions/runs, normalized event persistence, run admission/timeout handling, and durable idempotency; added contract coverage proving duplicate messages do not start a second turn. | partial; Flutter API integration, provider-configured smoke, and cleanup retry/backoff policy remain | Integrate the conversation/approval API client in Flutter and run provider-configured smoke |
| 2026-08-02 15:35:10 UTC | 107-sg-test | GPT-5 Codex | Added focused contract coverage for operator interrupt/resume: the API must call the server-owned runtime session, return interrupted/idle states, and keep the operation tenant/project scoped. Full runner validation remains green. | partial; Flutter API integration, provider-configured smoke, and cleanup retry/backoff policy remain | Integrate the conversation/approval API client in Flutter and run provider-configured smoke |
| 2026-08-02 15:41:08 UTC | 107-sg-test | GPT-5 Codex | Added tenant/project boundary coverage: a conversation from another project is indistinguishable from not found (`404`), and missing project mutation access is rejected before the command handler (`403`). Full runner validation remains green. | partial; Flutter API integration, provider-configured smoke, and cleanup retry/backoff policy remain | Integrate the conversation/approval API client in Flutter and run provider-configured smoke |
| 2026-08-02 15:59:39 UTC | 103-sg-verify | GPT-5 Codex | Prepared the guarded provider smoke harness: GitHub App repository revalidation, temporary detached audit worktree, read-only Codex turn, terminal-event assertion, and cleanup. It was checked only in refusal mode; real provider credentials and external smoke remain unrun. | partial; provider-configured smoke is still required, plus Flutter integration and cleanup retry/backoff policy | Run `npm run smoke:providers -- --confirm` in a configured isolated environment |
| 2026-08-02 16:10:34 UTC | 102-sg-start | GPT-5 Codex | Added the opt-in Flutter managed-runner client and provider: typed conversation/approval commands, explicit idempotency headers, current-session token attachment, authenticated chunked SSE parsing, safe error mapping, and contract tests. The existing dashboard remains unchanged when `MANAGED_RUNNER_BASE_URL` is absent. | partial; conversation UI/state integration, provider-configured smoke, and cleanup retry/backoff policy remain | Wire the conversation state/controllers and screens to the Flutter runner client |
| 2026-08-02 16:22:29 UTC | 102-sg-start | GPT-5 Codex | Connected the Flutter conversation controller and first project-detail panel: create/send/interrupt/resume/approval actions, live semantic event rendering, explicit disabled state without `MANAGED_RUNNER_BASE_URL`, and controller proof with a fake runner. The current detail route still supplies the project display name as a temporary project key; opaque dashboard-to-runner project mapping remains to be wired. | partial; provider-configured smoke, canonical project-id mapping, and cleanup retry/backoff policy remain | Map the dashboard project identity to the runner project id, then run configured provider smoke |
| 2026-08-02 16:28:10 UTC | 102-sg-start | GPT-5 Codex | Removed the unsafe display-name fallback: the conversation panel now accepts only an opaque `runnerProjectId`, the project route accepts it through `runnerProjectId`, and unresolved local-dashboard projects render a non-executable explanation instead of calling the runner with a name. The active local `OverviewScreen` still has no production projection provider capable of supplying that ID. | partial; activate the hosted/dashboard project projection mapping, then run configured provider smoke | Connect the active dashboard projection's opaque `projectId` to `/project/:project?runnerProjectId=...` |
| 2026-08-02 16:35:12 UTC | 102-sg-start | GPT-5 Codex | Connected project identity resolution to the existing authenticated `availableProjectsProvider`: project detail now derives the opaque project ID from a unique normalized project name, while unavailable or ambiguous matches fail closed; explicit `runnerProjectId` route parameters remain supported for hosted deep links. Added resolver contract tests. | partial; prove the active API project IDs are the same identity namespace as the managed runner, then run configured provider smoke | Validate one authenticated dashboard-to-runner project against the real runner and remove the temporary display-name join if the backend exposes a canonical binding |
| 2026-08-02 16:42:40 UTC | 102-sg-start | GPT-5 Codex | Added the canonical runner identity bridge `GET /v1/projects/resolve`: authenticated callers provide a bounded source system and source project ID, the server-owned tenant directory resolves the runner ID, and project access is rechecked before returning the mapping. Added Flutter response parsing and runner contract coverage for success, missing identity, unavailable directory, and tenant-scoped inputs. | partial; configure the production identity directory and switch Flutter to it when namespaces differ; provider smoke remains external | Provide the server-side identity directory adapter, then validate one real cross-namespace project mapping |
| 2026-08-02 16:47:33 UTC | 102-sg-start | GPT-5 Codex | Added the SQLite-backed production identity directory adapter: schema v6 stores tenant-scoped `(sourceSystem, sourceProjectId) -> runner projectId` bindings, `OperationalStore` resolves only bindings with read membership, and `main.ts` already passes the store as the runner project-access adapter. Same-namespace `shipglows-app` IDs resolve safely; cross-namespace bindings are server-provisioned through the store contract. Added migration and isolation coverage. | partial; invoke `bindProjectIdentity` from the real project provisioning flow, then validate one live mapping and provider smoke | Connect project creation/provisioning to the server-owned identity binding method |
| 2026-08-02 16:48:00 UTC | 102-sg-start | GPT-5 Codex | Traced the existing `/api/projects` provisioning client: the Flutter repository contains only the client and no FastAPI implementation or server-to-server runner credentials. The runner hook is therefore complete (`createProject` accepts source identity fields and `bindProjectIdentity` handles existing projects), but the external backend call cannot be added safely in this repository; direct Flutter binding is explicitly rejected. | blocked on the external `/api/projects` backend adapter, not on the runner contract | Add the server-to-server call from the FastAPI project-creation handler, then run one real cross-namespace mapping proof |
| 2026-08-02 21:43:08 UTC | 004-sg-deploy | GPT-5 Codex | Preflighted the requested `runner.shipglows.com` deployment directly on the Hetzner host, added loopback PM2/Caddy templates and production fail-closed configuration gates, and validated the runner locally. Caddy and PM2 are available, but the domain currently resolves away from this host and HTTPS is unavailable. | blocked before publication; no production process or Caddy mutation performed | Point `runner.shipglows.com` to the Hetzner public IP, then install the prepared Caddy/PM2 configuration with server-owned Supabase values |
| 2026-08-02 21:54:31 UTC | 004-sg-deploy | GPT-5 Codex | Confirmed that Vercel authoritative DNS now maps `runner.shipglows.com` to the Hetzner host; public recursive DNS still returns the prior Vercel address during propagation. Caddy/PM2 are active on Hetzner, but no ShipGlows Supabase project or runner production environment is configured, so the fail-closed runner was not started. | blocked on managed identity provisioning and DNS propagation; no insecure public endpoint created | Create or select the ShipGlows Supabase project, then provision its URL and server-owned runtime configuration before Caddy/PM2 publication |
| 2026-08-02 22:06:43 UTC | 004-sg-deploy | GPT-5 Codex | Created the dedicated Paris Supabase project and started the loopback-only authenticated runner under persisted PM2 supervision; its version route works and protected requests correctly return `401` without a session. DNS is still propagating publicly. Publishing the Caddy site requires root access to the existing system Caddy configuration, which this session does not have. | partial; private runner healthy, public TLS route blocked on DNS propagation and root-only Caddy change | Apply the prepared Caddy site with server administration, then validate `https://runner.shipglows.com/v1/version` |
| 2026-08-03 08:47:00 UTC | 205-sg-veille | GPT-5 Codex | Recorded Warp Oz as a bounded product and architecture inspiration for cloud-agent orchestration, multi-agent observability and model/harness flexibility. | inspiration retained; no MVP adoption or runtime dependency | Continue the ShipGlows-owned runner and Cockpit implementation |
| 2026-08-03 08:47:00 UTC | 100-sg-spec | GPT-5 Codex | Amended the current MVP contract with Warp Oz-informed, ShipGlows-owned orchestration patterns: manual-only run intents, redacted fleet supervision, immutable runtime policy resolution and attributed project context bundles. | amended; focused readiness review required before the next implementation slice | Rerun readiness against the orchestration/context additions |
| 2026-08-03 09:18:00 UTC | 101-sg-ready | GPT-5 Codex | Revalidated the amended multi-agent contract, manual-only admission, runtime-neutral boundaries, context provenance, security controls, task ordering and proof obligations. | ready; implementation may continue | Continue the Cockpit/UI integration and remaining MVP proofs |
| 2026-08-03 09:25:00 UTC | 006-sg-design | GPT-5 Codex | Integrated the five-dimensional health matrix into the active project Cockpit card using the existing Flutter theme tokens; missing evidence remains visibly non-reported and terminal-oriented copy was removed from the overview surface. | implemented; targeted Flutter analysis, tests and changed-file drift scan pass | Continue conversation tabs and remaining hosted/provider proofs |
| 2026-08-03 09:25:00 UTC | 102-sg-start | GPT-5 Codex | Continued the ready MVP implementation with the active Cockpit health slice: five dimensions are visible per project and the overview now presents user-facing actions without requiring terminal knowledge. | partial; Cockpit slice implemented, conversation tabs, Workspace and external proofs remain | Continue the semantic conversation workspace integration |
| 2026-08-03 09:42:00 UTC | 006-sg-design | GPT-5 Codex | Extended the project detail surface with tokenized conversation tabs and a separate add-conversation affordance; each tab retains its own managed conversation state and event stream. | implemented; targeted analysis, provider tests and changed-file drift scan pass | Continue with hosted/provider proof and operator Workspace boundaries |
| 2026-08-03 09:42:00 UTC | 102-sg-start | GPT-5 Codex | Added the project conversation workspace controller and tab UI: independent conversation notifiers, active-tab switching, new-tab creation, preserved approvals/events and regression coverage for tab isolation. | partial; conversation tabs implemented, server list/reconnect persistence and remaining MVP surfaces remain | Connect durable conversation listing/reconciliation, then continue Workspace and provider proof |
| 2026-08-03 10:06:00 UTC | 102-sg-start | GPT-5 Codex | Added the tenant/project-scoped conversation listing endpoint and Flutter reconciliation: persisted conversations restore as tabs, each existing conversation resumes its cursor-based SSE stream, and unavailable history fails soft without breaking local tab use. | partial; durable conversation restore implemented, Cockpit/Workspace and external provider proofs remain | Continue with server-backed Cockpit projection and provider proof |
| 2026-08-03 10:31:00 UTC | 102-sg-start | GPT-5 Codex | Added the authenticated `/v1/cockpit` projection backed by tenant-scoped projects, health evidence and active-run counts, plus the Flutter managed Cockpit provider and server-active indicator with explicit local fallback. | partial; server Cockpit projection implemented, operator Workspace, design cleanup and external provider proofs remain | Continue with full server-backed project cards and remaining MVP proof |
| 2026-08-03 10:52:00 UTC | 102-sg-start | GPT-5 Codex | Made the server projection the primary Cockpit card source when available: authorized projects now show runner identity, repository, five health states and active work, with a server-only project detail fallback for identities absent from the local Markdown index. | partial; server-backed Cockpit cards implemented, Workspace, design cleanup and external provider proofs remain | Continue with operator Workspace boundaries and external provider proof |
| 2026-08-03 11:00:00 UTC | 102-sg-start | GPT-5 Codex | Added the separately protected operator Workspace capability contract, a dedicated Flutter route/screen, and a project-detail entry point; unavailable capability is explicit and no PTY, tmux or SSH access is simulated. | partial; Workspace surface is implemented, authenticated PTY gateway and interactive terminal rendering remain | Implement the server-owned short-lived PTY gateway and terminal stream proof |
| 2026-08-03 12:03:48 UTC | 300-sg-docs | GPT-5 Codex | Aligned the managed runner foundation and code-docs map with the operator Workspace capability route, fail-closed Flutter surface, current validation contract and explicit absence of interactive PTY proof; moved the governance corpus to the monorepo root. | docs and canonical topology aligned; interactive PTY proof remains outstanding | Continue the PTY gateway documentation and implementation proof |
| 2026-08-03 12:08:08 UTC | 300-sg-docs | GPT-5 Codex | Completed the governance-topology migration from the nested app corpus to root `shipglows_data/`, repaired the operational-record migration helper and stale active references, and validated the local corpus readers. | topology compliant; interactive PTY proof remains outstanding | Continue the PTY gateway documentation and implementation proof |
| 2026-08-03 12:18:02 UTC | 300-sg-docs | GPT-5 Codex | Archived the former ContentFlow business and technical owner documents, replaced them with current ShipGlows Cockpit contracts, refreshed contributor entrypoints, and kept legacy runtime/spec material explicitly historical. | current owner docs cleaned; legacy implementation and historical specs intentionally retained for classified reuse | Continue the PTY gateway implementation and provider proof |
| 2026-08-03 12:30:17 UTC | 300-sg-docs | GPT-5 Codex | Removed ten classified ContentFlow specifications from the active chantier registry, preserved them in a dedicated archive with a reuse ledger, repaired inbound references, and updated the legacy migration trackers. | active spec registry cleaned; legacy code and migration-specific specs remain intentionally visible | Continue the PTY gateway implementation and provider proof |
| 2026-08-03 14:12:30 UTC | 102-sg-start | GPT-5 Codex | Implemented the first real operator Workspace gateway: project/actor-scoped expiring capabilities, allowlisted tmux PTY, bounded WebSocket input/output/resize, owner-only closure, Flutter `xterm` rendering, and fail-closed configuration with no host path exposure. | partial; Task 11 core stream implemented, hosted reconnect, Neovim and platform rendering proof remain | Verify the configured runner against one real tmux/Codex session, then add reconnect and Neovim proof |
| 2026-08-03 14:25:54 UTC | 004-sg-deploy | GPT-5 Codex | Restarted the supervised production runner with one server-owned ShipGlows Workspace allowlist while preserving Supabase authentication; proved the active source with an isolated real PTY/tmux session, resize and Codex executable, confirmed local `200`, protected-route `401`, clean logs and smoke cleanup. | partial; runner-side Workspace proof passes, but public HTTPS still fails because the root-owned system Caddy config has no `runner.shipglows.com` route and the identity database has no provisioned actor/project | Install the prepared public Caddy route with server administration, then provision one authenticated ShipGlows project and run the browser-to-runner proof |
| 2026-08-03 15:11:53 UTC | 300-sg-docs | GPT-5 Codex | Reconciled product, GTM, architecture, technical context, code navigation, contributor guidance, changelog and a new operator runbook with the implemented Workspace gateway, Flutter terminal, real managed-server PTY/tmux/Codex smoke, supervised runner allowlist, and exact public TLS/identity proof gaps. | documentation aligned; implementation and loopback proof are explicit without overstating public availability | Complete the root-managed HTTPS route and actor/project provisioning, then append browser reconnect and Neovim evidence |
| 2026-08-05 13:03:19 UTC | 706-continue | GPT-5 Codex | Resumed the active Cockpit MVP by repairing the runner Workspace lint gate without changing runtime policy or external infrastructure. | local runner validation green; public TLS and authenticated identity proof remain | Install the root-managed HTTPS route, provision an authorized actor/project, then run the authenticated browser Workspace proof |
| 2026-08-05 15:20:09 UTC | 706-continue | GPT-5 Codex | Confirmed the supervised private runner on loopback, its fail-closed unauthenticated response, and the real tmux/PTY/Codex Workspace smoke. Verified the public domain fails during TLS before reaching the runner; the operational database has no tenant, user, project, membership, or repository binding. | local runtime proof remains green; hosted authenticated proof is blocked by root-managed TLS and first identity/project provisioning | Obtain Caddy administration, publish the runner route, provision the first authorized identity/project, then run the browser proof |
| 2026-08-07 19:15:08 UTC | 100-sg-spec | GPT-5 Codex | Amended the ready MVP with the first Oz-inspired execution-provider slice: immutable server-resolved execution envelope, preflight-before-side-effects, explicit outcomes, opaque cancellation and fail-closed restart interruption. | amended; focused readiness review required | Revalidate the bounded runner slice, then implement Task 6a |
| 2026-08-07 19:17:28 UTC | 101-sg-ready | GPT-5 Codex | Revalidated the bounded provider-execution slice: it preserves manual-only admission, tenant isolation, opaque secrets/path boundaries, existing restart interruption, task ordering and proof obligations. | ready; Task 6a may start | Implement the execution-provider slice, then run the targeted runner proof |
| 2026-08-07 19:37:54 UTC | 300-sg-docs | GPT-5 Codex | Updated the managed runner contract documentation for the local execution-provider registry, schema v7 execution envelopes, preflight order, cancellation boundary and explicit no-reattach posture. | updated; existing nested site governance corpus remains unrelated migration debt | Continue Task 6a implementation proof |
| 2026-08-08 12:28:02 UTC | 010-sg-technical | GPT-5 Codex | Added the first agentic-security policy slice: privileged approvals fail closed outside isolated fix runs, with regression proof and a durable exploration of richer action metadata, capability sets, alignment critics and adversarial testing. | locally verified: 89 tests, typecheck and lint pass | Continue with provider-neutral proposed-action metadata before enabling broader approvals |
| 2026-08-08 15:40:08 UTC | 010-sg-technical | GPT-5 Codex | Added five bounded adversarial policy regressions for prompt injection, secret access, exfiltration wording, cross-project approval and safe denial. | locally verified: 94 tests and typecheck pass; focused lint passes; pre-existing execution-slice lint debt remains outside this bounded test slice | Keep the broader agentic architecture deferred until provider-neutral action metadata is available |
| 2026-08-08 16:01:35 UTC | 104-sg-end | GPT-5 Codex | Closed the bounded agentic-security slice after repairing the runner lint debt, synchronizing the exploration, specification and project changelog, and retaining richer action metadata as deferred future work. | locally closed: 94 tests, typecheck, full lint and metadata pass; broader Cockpit MVP remains active | Ship the bounded security and lint-hardening slice |
| 2026-08-08 16:01:35 UTC | 005-sg-ship | GPT-5 Codex | Prepared the bounded agentic-security and runner lint-hardening slice for shipment without including unrelated site work. | commit and push pending at the time of this record; broader Cockpit MVP remains active | Commit and push the scoped files to origin/main |
| 2026-08-07 19:40:23 UTC | 102-sg-start | GPT-5 Codex | Implemented Task 6a's local execution-provider boundary: typed registry, immutable manual-only envelope, SQLite v7 persistence, preflight-before-side-effects, no fallback and opaque cancellation. | implemented; remote/distributed execution remains deliberately deferred | Verify the focused runner slice and retain MVP-wide hosted proof limits |
| 2026-08-07 19:40:23 UTC | 103-sg-verify | GPT-5 Codex | Verified the Task 6a local scope against the durable contract, secret/path boundary, restart posture, runner typecheck and full local test suite. | verified for this local slice; no hosted provider or reattach claim | Continue remaining MVP tasks and route distributed execution to a separate ready specification |
| 2026-08-07 19:50:52 UTC | 103-sg-verify (mode=excellence) | GPT-5 Codex | Excellence review found and repaired the missing terminal synchronization between admitted executions and runs; completion, failure, interruption and restart are now monotonic, durable and locally proven. | excellent for Task 6a's local execution boundary; remote-provider proof remains outside this slice | Continue the broader MVP without claiming hosted provider or reattach readiness |
| 2026-08-07 19:52:30 UTC | 104-sg-end | GPT-5 Codex | Closed the Task 6a work session only: its implementation, local proof and internal documentation are synchronized. The broader Cockpit MVP remains active and no public-release claim is made. | locally closed; documentation reflection updated; no TASKS or changelog delta because the active MVP row remains in progress | Ship the scoped runner slice for iteration |
| 2026-08-07 19:55:18 UTC | 005-sg-ship | GPT-5 Codex | Shipped the scoped Task 6a runner execution-provider slice for iteration. | commit created; push pending at the time of this record; MVP and hosted-provider proof remain open | Confirm remote push, then continue the broader MVP |
| 2026-08-09 20:49:25 UTC | sg-planning | GPT-5 Codex | Recorded the public Workspace proof as a dedicated blocked execution item while preserving the broader Cockpit MVP as active. | planning synchronized; local runner proof retained and sudo-dependent Caddy publication paused | Resume the hosted proof when sudo access is available |
| 2026-08-11 15:25:57 UTC | 001-sg-build | GPT-5 Codex | Continued Task 7 with the runner-owned five-dimensional health evaluator and wired the authenticated Cockpit projection directly to its deterministic evidence, freshness, coverage and worst-state result. | local foundation implemented; versioned skill-run/context provenance and bounded sandbox production remain | Validate and commit this bounded evaluator slice, then continue the versioned evidence producer |
| 2026-08-11 15:27:25 UTC | 103-sg-verify | GPT-5 Codex | Verified the bounded evaluator slice against deterministic runner fixtures, the complete runner suite, typecheck, lint, dependency audit, Flutter health/Cockpit contracts, full Flutter analysis, metadata and diff hygiene. | locally verified: 99 runner tests, 8 targeted Flutter tests, zero high dependency vulnerabilities and no analysis or metadata errors | Commit the scoped evaluator slice without the unrelated site work |
| 2026-08-11 15:30:36 UTC | 001-sg-build | GPT-5 Codex | Continued Task 7 after commit `237dd14` by adding versioned project-context, skill-run and health-evidence contracts with tenant/project provenance, bounded sources, chronology and fail-closed publication rules. | contract foundation implemented; persistence linkage and bounded sandbox producer remain | Verify and commit the versioned provenance contract slice |
| 2026-08-11 15:31:57 UTC | 103-sg-verify | GPT-5 Codex | Verified the versioned provenance contracts against acceptance, cross-project, detached-evidence, chronology, source-bound, duplicate-dimension, failed-run and secret-bearing fixtures plus the complete runner quality gates. | locally verified: 104 runner tests, typecheck, lint, zero high dependency vulnerabilities, metadata and diff hygiene pass | Commit the scoped provenance-contract slice |
| 2026-08-11 15:37:40 UTC | 001-sg-build | GPT-5 Codex | Added SQLite schema v8 and atomic persistence for project context, versioned skill run and linked health evidence; exposed tenant-scoped provenance through the evaluator-owned Cockpit projection and kept the legacy writer unable to fabricate provenance. | persistence linkage implemented; bounded sandbox producer remains | Verify the migration, rollback, tenant-isolation and Flutter compatibility gates, then commit this slice |
| 2026-08-11 15:38:59 UTC | 103-sg-verify | GPT-5 Codex | Verified schema v8 migration, atomic rollback, tenant-isolated provenance, legacy-writer restrictions and Cockpit propagation against the complete runner gates plus Flutter health compatibility. | locally verified: 105 runner tests, 8 targeted Flutter tests, typecheck, lint, audit, analysis, metadata and diff hygiene pass | Commit the scoped persistence slice, then continue the bounded producer |
| 2026-08-11 15:46:38 UTC | 001-sg-build | GPT-5 Codex | Implemented the first fixed read-only ShipGlows tech audit through `just-bash` 3.2.0 using only a bounded in-memory snapshot, normalized its result into the versioned evidence envelope and connected the producer to atomic persistence. | Task 7 implementation complete; full quality gates pending for this final slice | Verify sandbox isolation, deterministic outcomes, dependency health and the complete runner regression suite, then commit Task 7 closure |
| 2026-08-11 15:48:05 UTC | 103-sg-verify | GPT-5 Codex | Verified the bounded producer against healthy/warning fixtures, traversal/empty/oversize rejection, normalized-output secrecy, exact persistence handoff, complete runner regression, strict typecheck/lint, dependency audit and metadata hygiene. | Task 7 locally verified: 109 runner tests pass and `just-bash` 3.2.0 has zero reported high vulnerabilities; published declaration gap remains isolated locally without weakening strict checks | Commit the scoped Task 7 closure; continue the broader MVP from the next ready task |
| 2026-08-11 16:04:33 UTC | 001-sg-build | GPT-5 Codex + delegated Flutter sub-agent | Completed the agent-runnable Task 8 slice: Firebase startup/refresh handling, typed runner authorization retry, idempotent transient retry, SSE cursor resume and bounded conversation reconnect for the active Flutter runtime. | local Flutter slice implemented and sub-agent verified; Linux REST/OIDC and live Firebase proof remain external/separate | Integrate the scoped Flutter changes, then continue server reliability through a disjoint delegated slice |
| 2026-08-11 16:05:15 UTC | 103-sg-verify | GPT-5 Codex | Reviewed the delegated Flutter patch, hardened immediate failure for any HTTP `401` stream error, reran the focused auth/API/reconnect suite and full Flutter analysis, and checked metadata/diff hygiene. | locally verified: delegated regression 35/35 plus integrator-focused 16/16 and zero analysis errors | Commit the bounded Flutter slice, then launch the disjoint server-reliability sub-agent |
| 2026-08-11 16:13:20 UTC | 001-sg-build | GPT-5 Codex + delegated server sub-agent | Implemented Task 12's bounded local reliability slice: minimal liveness, authenticated secret-safe diagnostics, build/commit identity, UTC/Europe-Paris timestamps, online SQLite backup, integrity/schema verification and migration/restore proof. | local operations slice implemented; Sentry, cleanup dry-run and hosted recovery proof remain | Review the delegated security boundaries and run the complete runner gates |
| 2026-08-11 16:13:20 UTC | 103-sg-verify | GPT-5 Codex | Reviewed authentication and closed schemas, hardened the backup CLI against missing/non-file databases, and independently reran the complete runner regression, typecheck, lint, audit, metadata and diff-hygiene gates. | local Task 12 slice verified; no production/Sentry claim | Commit the scoped reliability slice without unrelated site or tracker work |
| 2026-08-11 17:27:11 UTC | 001-sg-build | GPT-5 Codex + 5 delegated agents | Implemented the Task 9-10 local Flutter slice: one design authority, responsive server-first Cockpit, typed semantic conversation timeline/tabs and the complete audit/fix/approval action surface. Removed the alternate `APP_TARGET` entrypoint after the operator confirmed there is one ShipGlows product runtime. | local UI slice implemented; live Firebase/runner, concurrent-device, golden and authenticated browser proof remain | Run the complete Flutter and documentation gates, then commit the scoped slice |
| 2026-08-11 17:27:11 UTC | 103-sg-verify | GPT-5 Codex | Verified the integrated Flutter slice across 194 tests, clean analysis, a release Web build, responsive/accessibility coverage, metadata/diff hygiene and design drift reduced from 134 to 56 findings. | local Tasks 9-10 proof passes; residual drift is confined to untouched screens and hosted proof remains open | Commit without unrelated site or TASKS changes |
| 2026-08-11 17:27:11 UTC | 300-sg-docs | GPT-5 Codex | Reconciled the single-runtime boundary, code map, runner contract, design authority and active spec with the implemented Cockpit and conversations. | internal contracts aligned; no second or legacy app is part of the product architecture | Keep Tasks 9-10 partial until live and visual evidence exists |
| 2026-08-11 17:31:41 UTC | 005-sg-ship | GPT-5 Codex | Created the scoped local Task 9-10 commit after complete Flutter and documentation gates, excluding unrelated `site/` and `TASKS.md` changes. | local commit created; push not authorized | Continue hosted and visual proof from the committed baseline |
| 2026-08-11 17:46:09 UTC | 006-sg-design | GPT-5 Codex + 2 delegated read-only auditors | Audited the Cockpit visual contract, corrected per-dimension semantics, 320dp reflow, rendered-surface contrast, canonical focus treatment and duplicate status announcements, then established three deterministic light/dark responsive goldens. | Task 9 design and accessibility contract passes locally; native goldens remain composition proof rather than production-font proof | Collect release-build Chrome evidence before closing Task 9 |
| 2026-08-11 17:46:09 UTC | 001-sg-build | GPT-5 Codex | Integrated the visual corrections, 320x568 at 2x text proof, three golden fixtures and the single-runtime Web bootstrap cleanup. | implementation complete for Task 9; full Flutter and browser gates pass | Record browser evidence and documentation coherence, then create the scoped local commit |
| 2026-08-11 17:46:09 UTC | 108-sg-browser | GPT-5 Codex | Served the release Web build locally and verified the real Flutter canvas in Chrome at 390x844 and 1440x900. Enabled semantics to inspect heading, recovery panel, 48px mobile controls, bottom navigation and expanded rail. Removed the obsolete Clerk script after its initial 404 and repeated the proof with zero errors or warnings. | non-authenticated responsive Web shell proof passes; live Firebase/runner remains outside Task 9 | Keep authenticated hosted proof in Tasks 8, 10 and 13 |
| 2026-08-11 17:46:09 UTC | 103-sg-verify | GPT-5 Codex | Verified 200 Flutter tests, clean analysis, release Web build, three stable goldens, zero changed-file design drift, metadata/diff hygiene and clean Chrome console after Web bootstrap cleanup. | Task 9 complete; broader MVP remains active | Commit the scoped visual-proof slice without unrelated site or TASKS changes |
| 2026-08-11 17:46:09 UTC | 300-sg-docs | GPT-5 Codex | Updated the design authority, runtime boundary, code map and active MVP contract with the exact local visual, accessibility and browser proof boundary. | internal documentation aligned; no hosted authentication claim added | Preserve Task 9 closure while continuing Tasks 8, 10-13 |
| 2026-08-11 17:47:40 UTC | 005-sg-ship | GPT-5 Codex | Created the scoped local Task 9 visual-contract commit with code, deterministic goldens and internal proof documentation, excluding unrelated `site/` and `TASKS.md` changes. | local commit created; push not authorized | Continue the broader MVP from the committed Task 9 baseline |
| 2026-08-11 17:57:13 UTC | 300-sg-docs | GPT-5 Codex | Audited documentation freshness after the Cockpit commits. The active spec, runtime boundary, design authority and code map are aligned; the app contributor entrypoints and migration trackers still describe removed `APP_TARGET`/ContentFlow runtime behavior. | documentation is only partially current; no product claim changed and no unrelated worktree changes were touched | Reconcile the stale contributor and migration documents in a scoped documentation pass before any new implementation work |
| 2026-08-11 18:26:17 UTC | 300-sg-docs + 007-sg-content | GPT-5 Codex | Reconciled contributor guidance, public app README, technical context, runtime/code maps, the active MVP contract, and historical migration records with one ShipGlows runtime, Firebase Auth, Convex target data plane, and Fastify/SQLite execution-plane exception. Historical cleanup documents and their two originating specs are now explicitly superseded. | documentation is current for the implemented Cockpit baseline; live Firebase, hosted runner, Sentry and public Workspace proof remain open and are not claimed complete | Continue the hosted Firebase/Runner proof from the documented single-runtime baseline |

# Current Chantier Flow

## Single-conversation delivery amendment — 2026-08-21

The operator replaced the managed-worktree model with a deliberately simpler project invariant: one open conversation, one canonical checkout, and one server-owned `main` or `preview` delivery branch per project. SQLite schema v9 is the durable conversation lease. Admission fetches without changing the checkout, requires the exact branch and a clean non-divergent tree, and captures the remote head. A successful fix must leave a clean commit and is delivered by one non-force push only if the remote head is unchanged. Any dirty tree, branch mismatch, remote advance, divergence, or push rejection is explicit and non-destructive.

The active runner bootstrap no longer instantiates the worktree manager or cleanup worker. Historical worktree utilities, tests, records, and physical directories are retained as history and compatibility evidence; they are not an active execution fallback. Flutter exposes one conversation tab, restores only the open conversation, and requires an authenticated idempotent close before a replacement conversation can begin.

`102-sg-start` (implemented locally) -> `103-sg-verify` (runner concurrency/restart/Git guards plus Flutter one-conversation regression) -> `005-sg-ship` (authorized non-force push to `origin/main`) -> no deployment in this slice.

## Personal Cloud amendment — 2026-08-18

The active local slice adds `Preview -> Éditeur -> Terminal` on top of the reconnectable Workspace. The first delivery uses the existing PTY boundary with fixed server-selected Neovim startup and one active Workspace connection. A later ready batch may replace only the editor rendering transport with normalized Neovim UI RPC while retaining PTY/tmux Terminal as fallback and never exposing raw RPC.

The excellence pass adds `Workspace protocol v2 -> mutate authorization -> dedicated Unix identity -> fixed environment -> bounded PTY/WebSocket lease -> recoverable Flutter state`. A compact or expanded client never receives paths, tmux names, raw diagnostics or runner credentials. The expanded focus control changes composition only and does not allocate another Workspace capability.

The active milestone is now `Projects -> persistent Preview -> reconnectable Workspace`. It preserves the existing CLI/PM2/tmux/Neovim workflow and adds an authenticated Flutter window onto it. Semantic Conversations and Studio remain valid independent surfaces, but neither blocks this milestone. The companion specs own the catalog/auth/SQLite foundation, preview ingress and later CAX11 rollout; no Docker or Convex dependency is introduced.

`100-sg-spec` (Personal Cloud amendment reviewed) -> `101-sg-ready` (SAFE across this spec and all three companion specs; ready) -> `102-sg-start` (next: PC-A through PC-D on disjoint files, then PC-I sequential integration) -> `103-sg-verify` (exact-Origin, ticket/cookie, HTTP+WS preview, tmux reconnect/heartbeat/single-active, reboot/browser proof) -> `004-sg-deploy` (only after separate exact-target remote authority)

## Architecture amendment — 2026-08-11

The portfolio architecture decision now supersedes this spec's original Supabase identity recommendation. New Cockpit source uses Firebase Auth behind the existing provider-neutral Flutter and runner contracts. Convex is the target product backend/data layer, while Fastify/SQLite remains a justified execution-plane exception for PTY/tmux, local processes, managed workspaces, admission and operational events.

Historical Supabase task text and run-history evidence below remains a record of what was decided, implemented or deployed at that time; it is not current implementation guidance. The last managed-server proof still used the Supabase deployment and cannot be claimed as Firebase proof. Current completion requirements are owned by `firebase-auth-convex-alignment.md`: Linux REST/OIDC support, live Firebase authentication, deployment migration and a separately specified first Convex product projection remain open.

`100-sg-spec` (amended; agentic-security, health evaluator, Firebase, single-runtime and ACP-only adapter decisions) -> `101-sg-ready` (existing MVP contract ready) -> `001-sg-build` (generic ACP runner slice implemented locally; Tasks 7 and 9 complete; Tasks 5, 8, 10 and 12 locally partial) -> `103-sg-verify` (ACP-focused proof, typecheck, lint, audit and real create/prompt/stream smoke pass; no restart-resume claim, and one unrelated Windows CRLF suite failure remains) -> `005-sg-ship` (not authorized for this ACP slice) -> `004-sg-deploy` (live Firebase, hosted runner, Sentry and public Workspace proofs remain partial or externally blocked)
