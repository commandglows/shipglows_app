---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.5.0"
project: "shipglows_app"
created: "2026-07-18"
created_at: "2026-07-18 08:20:45 UTC"
updated: "2026-08-03"
updated_at: "2026-08-03 08:47:00 UTC"
status: draft
source_skill: "100-sg-spec"
source_model: "GPT-5 Codex"
scope: "managed-agent-cockpit-mvp"
owner: "Diane"
confidence: high
user_story: "En tant qu'utilisatrice de ShipGlows, je veux voir la santé de tous mes projets, piloter l'agent de code adapté à chaque tâche et, lorsque je l'autorise explicitement, ouvrir un espace opérateur terminal dans la même application, afin de travailler depuis mon navigateur sans administrer l'infrastructure."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Flutter Web"
  - "Flutter Android"
  - "Flutter Windows"
  - "ShipGlows managed runner"
  - "ShipGlows AgentRuntime contract"
  - "OpenAI Codex app-server adapter"
  - "OpenCode / ACP adapter path"
  - "Kilo Code adapter path"
  - "Supabase Auth"
  - "GitHub App"
  - "GitHub repositories"
  - "managed repository workspaces"
  - "SQLite runner projection"
  - "Sentry"
  - "ShipGlows Markdown artifacts"
  - "just-bash skill sandbox"
  - "authenticated PTY/tmux gateway"
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
    artifact_version: "1.0.0"
    required_status: "draft"
  - artifact: "/home/claude/shipglowz/skills/references/preferred-stacks.md"
    artifact_version: "1.1.0"
    required_status: "active"
  - artifact: "https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://supabase.com/docs/guides/getting-started/quickstarts/flutter"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
  - artifact: "https://supabase.com/docs/guides/auth"
    artifact_version: "checked-2026-08-01"
    required_status: "active"
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
  - "Repository inspection 2026-07-18: legacy auth and GitHub service code currently belong to the legacy runtime and are not yet wired into the active ShipGlows runtime."
  - "Fresh OpenAI documentation check 2026-07-18: Codex app-server exposes threads, turns, items, approvals, authentication state, and streamed events for rich clients over a local process transport."
  - "Fresh GitHub documentation check 2026-07-18: installation access tokens are short-lived, server-side, repository-scopable, and can authenticate HTTP Git when the GitHub App has Contents permission."
  - "Repository inspection 2026-08-01: the Flutter prototype already exists under `app/lib/shipglows/`, including overview, project detail, settings, health models, repositories, providers, and tests; this spec extends that prototype rather than creating a new app."
  - "Fresh external documentation check 2026-08-01: xterm.dart supports Flutter Web, Android, and Windows terminal rendering; just-bash provides a TypeScript virtual Bash sandbox with bounded filesystem and network capabilities."
  - "CTO architecture reframe 2026-08-01: ShipGlows owns the multi-agent control plane; Codex app-server is the first runtime adapter, while OpenCode, Kilo and ACP must remain possible behind the same normalized contract."
  - "Warp Oz review 2026-08-03: cloud-agent orchestration, run observability, controlled triggers and team-scoped memory are useful patterns; ShipGlows retains the product control plane and does not adopt Oz as an MVP dependency."
next_step: "/101-sg-ready ShipGlows Managed Agent Cockpit MVP"
---

# Spec: ShipGlows Managed Agent Cockpit MVP

🟢 [shipglows_app] spec: ShipGlows Managed Agent Cockpit MVP | status: ready | path: shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md | next: /102-sg-start ShipGlows Managed Agent Cockpit MVP

# Title

ShipGlows Managed Agent Cockpit MVP

# Status

Amended on 2026-08-03 after the Warp Oz review; a focused readiness review is required before the next implementation slice. The existing Flutter prototype is the implementation base. The product has three deliberately separated surfaces: the health Cockpit, semantic agent work for normal use, and a separately authorized operator Workspace for a real PTY/tmux/Neovim session. ShipGlows owns a runtime-neutral control plane: Codex app-server is the first complete adapter, while OpenCode, Kilo and ACP remain possible through the same `AgentRuntime` contract. `just-bash` remains only an optional sandbox for bounded ShipGlows skill checks; it is not the real terminal. Supabase Auth is the recommended cross-platform identity baseline behind a portable provider boundary.

# User Story

En tant qu'utilisatrice de ShipGlows, je veux voir la santé de tous mes projets, piloter des conversations avec l'agent de code adapté à chaque tâche et, lorsque je l'autorise explicitement, ouvrir un espace opérateur terminal dans la même application, afin de travailler depuis mon navigateur sans administrer l'infrastructure.

# Minimal Behavior Contract

After signing in, the user sees one Cockpit summarizing every authorized GitHub repository across tech, content, SEO, performance, and security. Opening a project reveals agent conversations as child tabs; semantic messages, tools, plans, approvals and results remain the default interaction. A separately protected Workspace tab may open a real server-side PTY attached only to an allowlisted tmux session, allowing terminal use and Neovim without exposing credentials, clone paths or raw control protocols. Audit and fix actions use the ShipGlows-managed control plane, which verifies access, selects an authorized runtime and execution environment, prepares isolated repository workspaces, runs ShipGlows skills and records durable evidence. A failed, interrupted, stale, unauthorized or disconnected action remains visible with a recoverable state. The primary edge case is a selected runtime that cannot satisfy the requested capabilities: ShipGlows must reject it before work begins, explain the missing capability, and never silently broaden permissions or fall back to another runtime.

# Success Behavior

- An authenticated user lands on a responsive Cockpit containing only projects they are allowed to see.
- Every project row/card exposes five independent health dimensions: `tech`, `content`, `seo`, `performance`, and `security`.
- Missing evidence is rendered as `notReported` or `unknown`, never silently converted to healthy.
- Selecting a project opens a stable project workspace with child tabs for its agent conversations.
- Creating a conversation selects an authorized `AgentRuntime`, creates or resumes its thread/session on the managed server, and makes the new tab observable immediately.
- The conversation view renders normalized semantic events: user messages, assistant messages, reasoning summaries when available, command/tool activity, file changes, plans, approvals, warnings, errors, usage/status metadata, completion, runtime identity, and capability limitations.
- The user can submit a message, launch a predefined audit, launch a proposed fix, interrupt an active turn, resume a thread, and answer a required approval from dedicated controls.
- Read-only audits run against a managed clone without write permission to the canonical branch.
- Fixes run in one isolated worktree and branch per mutating conversation; they never push, merge, or modify the canonical branch automatically in this MVP.
- Completed audits and fixes produce a normalized result that can update Cockpit evidence and propose tracker changes while GitHub/Markdown remains canonical.
- Refreshing or reopening the Flutter app restores project, conversation, and run state from the managed server without requiring terminal attachment.
- Web, Android and Windows use the same Flutter domain, state, API and UI modules. Flutter Web is the first end-to-end deployment proof; Android and Windows receive platform, contract and Workspace rendering proof in the MVP.
- Windows uses the same Flutter domain, state, API and Workspace contracts; the MVP proves the Windows shell and terminal rendering contract without requiring WSL on the user's machine.
- The operator Workspace can reconnect to an existing tmux session, resize the PTY, display terminal output, and launch Neovim; it is never silently opened from a normal agent conversation.

# Error Behavior

- Missing or invalid identity-provider session returns an authenticated-app sign-in state; no project or conversation data leaks.
- Missing, revoked, suspended, or insufficient GitHub App access keeps the last allowed projection visible with an access warning but disables audit/fix actions and all repository-sensitive refreshes.
- If the managed server cannot start or authenticate the selected runtime, the conversation reports `runtimeUnavailable` with a redacted diagnostic and retry action; it does not fall back to an exposed terminal or silently change provider.
- If the event stream disconnects, the UI shows `reconnecting`, resumes from the last acknowledged event cursor, and reconciles from persisted conversation state before accepting a duplicate action.
- Duplicate command submissions with the same idempotency key return the original action/run instead of starting a second run.
- A second mutating run for the same project is rejected with HTTP `409` and code `projectBusy`; the user may retry after the active run ends, and no second writable worktree starts.
- A timeout or user interrupt ends the active turn, keeps prior events, marks the result `interrupted` or `timedOut`, and permits a deliberate resume.
- An approval timeout or denial blocks the requested privileged action and leaves an explicit denied/expired approval event.
- Invalid identifiers, cross-tenant references, unsupported action types, oversized prompts, excessive event payloads, and path traversal attempts are rejected server-side with stable error codes.
- A projection refresh failure never erases the last known Cockpit evidence; affected dimensions become stale or unknown with a timestamp and source diagnostic.
- Repository content that attempts prompt injection cannot expand server permissions, reveal secrets, alter tenant/project selection, or bypass approval and sandbox policies.
- Operator terminal failure, tmux loss, PTY disconnect or unsupported resize leaves the semantic Cockpit usable and shows a recoverable Workspace state; it never falls back to unbounded shell execution.

# Problem

The active ShipGlows runtime already contains the Flutter prototype: project overview/detail screens, health models and aggregation, source readers, repositories, providers, routing, settings and tests. It remains a local/read-only prototype: authentication, hosted project source, runner API, agent conversations, streamed runtime and audit/fix execution are not yet wired end to end. The missing product is therefore the managed control plane and the integration of this existing UI foundation. A real terminal is an operator-only capability, not a replacement for the semantic Cockpit and not an obligation for ordinary users.

# Solution

Build a semantic multi-agent client inside the active Flutter runtime and a dedicated ShipGlows control plane beside it:

1. The Flutter app authenticates the user, displays the Cockpit and conversation tabs, sends typed commands, and consumes normalized server events.
2. A Node.js/TypeScript Fastify service validates the selected identity-provider session, verifies project authorization with the GitHub App, owns managed clones/worktrees, persists durable run projections, and selects an agent runtime and execution provider from server-owned policy.
3. `AgentRuntime` is a ShipGlows-owned port for runtime capability discovery, sessions/threads, turns, interruption, approvals, normalized events and redacted diagnostics. `codex app-server` over local stdio is the first complete adapter; OpenCode, Kilo and ACP are staged adapters, never direct public endpoints.
4. The public app protocol uses authenticated HTTP commands plus Server-Sent Events with resumable cursors for semantic work. The operator Workspace uses a separate short-lived authenticated PTY capability; raw runtime transports, SSH credentials, host paths and tmux control stay internal.
5. GitHub repositories and ShipGlows Markdown remain canonical. SQLite on the managed runner stores operational projections such as users, project bindings, runtime/session mappings, run states/checkpoints, event cursors, approvals, capability decisions and idempotency records; it does not become the canonical repository-content store.
6. Read-only audits use managed clones. Fixes use isolated worktrees/branches and stop at a reviewable local result in this MVP.
7. `ExecutionProvider` keeps disposable agent/audit work separate from persistent operator work: `just-bash` may execute bounded read-only skill checks against a controlled snapshot, a future sandbox may execute disposable code-agent work, and only the operator Workspace may attach persistent tmux/Neovim. Real repository mutations and provider actions stay in the managed runner policy boundary.
8. The operator Workspace uses a separately authenticated, short-lived capability to a server-side PTY/tmux gateway. Flutter renders it; Flutter Web/Android/Windows never receive SSH credentials or direct host access.

# Orchestration And Context Contract

Warp Oz informs this contract as an external pattern only. ShipGlows remains the authority for project health, policy, evidence, identity and user experience; no Warp SDK, API, hosted service or agent memory is required for this MVP.

- Every run records an immutable `RunIntent`: `manual` is the only enabled trigger in the MVP; `schedule`, `githubEvent` and `systemRecommendation` are reserved values that must be rejected until separately enabled by server policy.
- The Cockpit exposes a redacted operations summary alongside health: active, queued, awaiting approval, recently failed and last completed run per authorized project. It never exposes prompts, paths, credentials, raw logs, tenant-internal totals or another tenant's activity.
- A server-owned `RunPolicy` selects runtime, execution provider, capability set, quota and approval boundary before a run begins. Runtime/model routing can optimize quality, latency or cost inside this policy, but never changes a selected provider, permission set or user-visible execution mode silently.
- A `ProjectContextBundle` is an explicit, size-bounded, versioned set of approved project instructions, evidence references and skill outputs. It is tenant/project scoped, redacted, attributable to producers and source commits, and passed to a runtime only through the server. The MVP has no opaque cross-project, cross-tenant or self-modifying agent memory.
- Future automatic triggers require their own ready specification covering trigger authorization, deduplication, rate limits, approval policy, delivery retries, auditability and an operator-visible disable control. They are not enabled by this amendment.

# Product And Platform Footprint

- Launch application surfaces: Flutter Web, Flutter Android and Flutter Windows from the existing codebase.
- First-class shared surface: Flutter Windows, using the existing Flutter domain and the same authenticated API.
- First complete hosted proof: Flutter Web on the current Vercel-oriented web path, connected to the managed runner over HTTPS.
- Android and Windows MVP proof: build, Supabase session/authentication adapter contract, deep-link/session handling where applicable, responsive UI tests, terminal rendering tests, and live API compatibility against the same runner.
- Roadmap: iOS can use the same Flutter domain/UI code after adding the platform shell and identity adapter; it is not an MVP launch gate.
- Linux desktop is not an MVP launch gate, but the Web contract must remain usable from Linux browsers.
- End-user terminal surface: semantic agent work by default; real terminal/tmux/Neovim only inside the explicit operator Workspace.

# Preferred Stack Resolution

- Flutter is applied as the canonical authenticated application stack.
- Supabase Auth is the MVP identity baseline because its official Flutter integration covers Web, Android and Windows. A portable `AuthProvider` interface isolates the choice; existing Clerk concepts remain migration material and may only be retained behind a compatibility adapter.
- GitHub App remains the repository authorization authority from the ready foundational specifications.
- The Convex backend baseline is intentionally not used for the runtime executor because this feature requires supervised agent runtimes, managed Git clones/worktrees, local filesystem isolation, resumable event streaming, and bounded OS-level execution. A dedicated Node.js/TypeScript Fastify server is the documented exception.
- TypeScript is selected because it fits the event-heavy Fastify control plane, supports server-side JWT/JWKS validation for the selected identity provider, and typed adapters can isolate every runtime transport from the Flutter contract.
- SQLite is selected for the MVP runner's operational projection because the managed server is the execution authority, the data is reconstructable from runtime/repository state, and a transactional local store avoids adding a second remote control plane before behavior is proven. The repository/Markdown authority rule remains unchanged.
- Hosted Firestore is not an MVP runtime dependency. Its existing contracts remain useful migration/reference material, but the Flutter client reads the versioned runner API and the runner owns its SQLite projection. Any later Firestore synchronization must stay a rebuildable projection behind a separate contract.
- Python remains available for bounded audit helpers invoked by approved server workflows, not as the public API or agent-runtime orchestration layer.
- `xterm.dart` is the Flutter terminal-rendering candidate for Web, Android and Windows. The server PTY/tmux gateway remains an implementation boundary and must be selected through a disposable proof before production use.
- `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker` and `ModelGateway` are ShipGlows-owned ports. They preserve the choice of Codex, OpenCode, Kilo, ACP, self-hosted sandbox, Vercel sandbox, direct model provider or future runtime without changing Flutter, health or authorization contracts.
- Warp Oz is a reference for cloud-agent orchestration and fleet observability only. Its trigger, memory and model-routing patterns are represented by ShipGlows-owned `RunIntent`, `RunPolicy` and `ProjectContextBundle` contracts; no Oz client, hosted control plane or proprietary runtime API is a dependency.
- Codex app-server is the first production adapter. The MVP must prove a fake second adapter contract before a real OpenCode/Kilo adapter is claimed; AI SDK HarnessAgent and eve are optional experimental spikes behind the same port, not baseline dependencies.
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
- ShipGlows `AgentRuntime` capability contract, Codex app-server first adapter and normalized event mapping.
- Fake second-runtime conformance fixture proving Flutter and policy do not branch on Codex-only wire types.
- Supabase Auth authentication for Web, Android and Windows through one Dart adapter; server-side JWT/JWKS validation behind the runner's `AuthProvider` interface.
- GitHub App repository authorization and short-lived installation-token use on the server.
- Managed clone reuse for audits and isolated worktree/branch creation for fixes, selected through server-owned `ExecutionProvider` policy.
- Read-only ingestion of existing ShipGlows Markdown and GitHub evidence into Cockpit health.
- Safe generation of proposed tracker updates as run artifacts; canonical write-back requires an explicit user-approved later operation.
- Sentry-backed client/server runtime diagnostics with redaction, release identity, and environment tags.
- Separately authorized operator Workspace with one allowlisted tmux attachment, PTY resize/reconnect, terminal rendering and Neovim launch proof.
- Bounded `just-bash` integration proof for at least one read-only ShipGlows skill against a controlled repository snapshot.
- Automated unit, contract, widget, integration, security, and reconnect/idempotency tests.

# Scope Out

- Exposing a general-purpose unrestricted terminal, raw SSH credentials, root shell, arbitrary command execution, or arbitrary tmux session to users.
- Asking end users to install, configure, update, or monitor any agent runtime, tmux, Git, GitHub credentials, or the ShipGlows server.
- Automatic push, pull-request creation, merge, deployment, production mutation, or direct write to a default branch.
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
- Every runtime transport runs on the managed server or inside a server-selected execution provider; Codex app-server local stdio is the first implementation. No ACP stdio, runtime HTTP/SSE endpoint, Unix socket, experimental WebSocket transport or user-provided agent endpoint is a public API dependency.
- Public communication is HTTPS plus authenticated SSE. State-changing actions use HTTP requests with idempotency keys and CSRF/origin protection appropriate to the client surface.
- Interactive terminal communication uses a separate authenticated WebSocket/PTY channel with a short-lived, single-purpose capability. The semantic SSE channel and PTY channel must never share authorization or raw protocol payloads.
- Every request is authorized server-side from the selected AuthProvider identity, ShipGlows project membership, and fresh GitHub App access when repository-sensitive.
- No client-supplied repository path, clone path, branch, thread id, or filesystem identifier is trusted without server lookup and ownership validation.
- GitHub App installation tokens are short-lived, scoped to the required repository/permissions, generated server-side, and never persisted in SQLite or sent to Flutter.
- Runtime credentials and login state are managed server secrets and never cross the runner boundary.
- Audit prompts and fix prompts have server-owned templates, bounded user additions, maximum sizes, and explicit permission profiles.
- Audit work is read-only. Fix work uses one isolated worktree/branch per conversation and cannot target the canonical branch directly.
- One mutating run per project may be active; read-only concurrency is bounded by server capacity and per-user/project quotas.
- `manual` is the only accepted `RunIntent` trigger in the MVP. Reserved automatic trigger values are rejected until a separate approved specification enables them.
- A `ProjectContextBundle` is server-built from approved, versioned and redacted tenant/project evidence. A runtime receives no arbitrary client-selected context, no cross-tenant bundle and no untracked persistent memory.
- Raw command output and file content are size-limited, redacted, and normalized before streaming or persistence.
- PTY output is streamed only to the authorized live Workspace, is not persisted as conversation events, and is excluded from Sentry and routine diagnostics.
- Cockpit health never infers healthy from absent evidence.
- Repository/Markdown content remains canonical; SQLite and UI state are projections.
- UI work must use the declared Flutter design-system authority. The active ShipGlows private theme must be reconciled with `app/lib/presentation/theme/app_theme.dart` before new visual tokens are introduced.
- The implementation cannot import the legacy runtime wholesale. Reuse is limited to reviewed concepts or narrowly extracted adapters.

# Dependencies

- Codex CLI `0.144.5`, Node.js `22.22.2`, npm `11.17.0`, Flutter `3.41.7`, and Dart `3.11.5` are available in the current implementation environment.
- Official Codex app-server documentation checked 2026-07-18 defines rich-client primitives for threads, turns, items, approvals, authentication, and streamed events over a local process transport; it informs the first adapter only.
- Fresh docs checked 2026-08-01: Vercel AI SDK's HarnessAgent can normalize several agent harnesses but is experimental; OpenCode ACP is editor-to-subprocess JSON-RPC over stdio, while Kilo documents local HTTP/SSE runtime surfaces. ShipGlows therefore keeps its own remote contract and capability matrix.
- Fresh Warp Oz documentation checked 2026-08-03 describes cloud-agent triggers, scheduling, parallelism, observability, multiple harnesses and persistent team memory. This spec adopts only bounded orchestration requirements; Warp/Oz remains outside the runtime dependency graph.
- Official Supabase Flutter and Auth documentation checked 2026-08-01 supports the selected cross-platform session baseline; server-side JWT/JWKS verification remains behind the runner AuthProvider adapter.
- Official GitHub App documentation checked 2026-07-18 supports short-lived installation access tokens, narrowed repository/permission scope, and HTTP Git authentication when Contents permission is granted.
- Existing code foundations include `lib/shipglows/**`, `lib/data/shipglows_sources/**`, `lib/domain/project_health/**`, Firestore-shaped projection DTOs/validators, and legacy Clerk/GitHub service concepts.
- Canonical design-system authority is `shipglows_data/technical/design-system-authority.md` with Flutter carrier `lib/presentation/theme/app_theme.dart`.

# Invariants

- One ShipGlows project equals exactly one GitHub repository.
- One project may have many conversations; one conversation belongs to exactly one project and one tenant.
- One ShipGlows conversation maps to one selected-runtime thread/session identifier stored server-side; raw runtime identifiers are never authorization proof.
- One mutating conversation owns one isolated worktree and branch for its lifetime.
- The normal agent surface shows semantic conversation events. The separately gated operator Workspace may show a live PTY terminal.
- GitHub decides repository access for repository-sensitive actions.
- Repository/Markdown files decide canonical project and tracker content.
- SQLite stores reconstructable operational state and cannot silently overwrite canonical repository content.
- Every mutating command has an idempotency key, actor, project, conversation, timestamp, lifecycle state, and redacted outcome.
- Every run has one immutable `RunIntent`, one resolved `RunPolicy` and an attributable `ProjectContextBundle` version or an explicit empty-context marker.
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

- Supabase Auth establishes ShipGlows identity; GitHub App establishes repository authority. They remain distinct.
- Flutter Web, Android and Windows use one Dart `AuthProvider` interface with Supabase session refresh and deep-link handling where applicable.
- Fastify validates the Supabase-issued JWT through server-side signature/JWKS checks on every request and never trusts client-decoded claims alone. A Clerk compatibility adapter is allowed only behind the same interface and must not create a second authorization model.
- Runner data access is filtered by tenant and user membership before any project/conversation lookup result is returned.
- Repository-sensitive actions revalidate GitHub App installation access and required permissions immediately before clone, refresh, audit, or fix setup.
- GitHub Contents read access permits projection, audit, and local isolated fix work. A future push or pull-request feature must separately require and verify the necessary write permissions before that capability is added.
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
- Legacy runtime: Clerk/GitHub/API concepts can be extracted narrowly; legacy ContentFlow routes and state graphs remain excluded.
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
- Create an operator runbook for server provisioning, runtime auth health/capability diagnostics, workspace cleanup, SQLite migration/backup, GitHub App permissions, Supabase configuration, Sentry redaction, and incident recovery.

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
- A worktree remains after a crash or timeout.
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
- [~] Task 2: Implement portable Supabase Auth authentication and tenant/project authorization middleware.
  - Files: `runner/src/auth/**`, `runner/src/projects/projectAccess.ts`, `runner/test/auth/**`, `app/lib/shipglows/auth/**`, `app/test/shipglows/auth/**`.
  - Action: Implement one Supabase-backed Dart/server identity contract, verify JWT/JWKS server-side, derive opaque actor context, enforce tenant/project membership, origin/CSRF controls, session refresh and stable unauthorized/forbidden errors. Keep any Clerk bridge behind the same interface and out of feature code.
  - User story link: Ensures users see and control only their authorized projects.
  - Depends on: Task 1.
  - Validate with: missing/expired/forged/cross-tenant token tests and redaction assertions.
  - Implementation note (2026-08-01): runner JWT/JWKS verification, subject-to-tenant actor resolution, malformed/invalid/cross-tenant fail-closed tests, a protected read-only authorization-route fixture, and the Flutter provider-neutral Supabase session/refresh adapter are complete. The task remains in progress until the first state-changing route adds origin/CSRF controls and a provider-configured runner deployment proves the same boundary end-to-end.
- [~] Task 3: Implement GitHub App access and managed workspace lifecycle.
  - Files: `runner/src/github/**`, `runner/src/workspaces/**`, `runner/test/github/**`, `runner/test/workspaces/**`.
  - Action: Generate narrowed short-lived installation tokens, verify repo permissions, clone/fetch managed repos, create isolated fix worktrees/branches, enforce path/symlink boundaries, lock project mutation, and clean abandoned workspaces.
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
  - Implementation note (2026-08-02): schema v6 now persists tenant-scoped runs with redacted checkpoints and explicit state transitions, recovers in-flight runs as `interrupted` after restart, tracks workspace cleanup retries without storing local paths, projects runtime sessions, capability decisions, approvals, health evidence, bounded usage summaries, and server-owned cross-namespace project identity bindings. Transaction/backup/restore fixtures, a full migration harness, and broader route integration remain to be implemented.
- [~] Task 5: Implement Codex as the first `AgentRuntime` adapter and normalize semantic events.
  - Files: `runner/src/agent-runtime/**`, `runner/src/agent-runtime/codex/**`, `runner/src/events/**`, `runner/test/agent-runtime/**`, `runner/test/events/**`.
  - Action: Spawn `codex app-server` as a supervised child process and map its JSON-RPC-over-stdio lifecycle for initialization, capability discovery, thread create/resume, turns, interruption, approvals, authentication state and event streaming to the neutral port. Cap/redact payloads, reject unknown executable semantics, and test a fake second adapter against the same conformance suite.
  - User story link: Displays real agent work directly in the app without exposing a terminal or vendor protocol.
  - Depends on: Tasks 1 and 4.
  - Validate with: fake app-server transcripts, second-adapter conformance tests, reconnect/order tests, unknown-event tests, output sanitization tests, process restart tests, and one local Codex smoke test with no repository mutation.
  - Implementation note (2026-08-02): a server-owned stdio JSONL adapter now performs the initialize/initialized handshake, starts/resumes threads, starts/interrupts turns, maps safe semantic events, and resolves command/file approvals without forwarding raw app-server payloads. Provider-configured Codex smoke, reconnect/order hardening, and the fake second-adapter conformance fixture remain.
- [~] Task 6: Implement command API, SSE resume, audit/fix policy, and run orchestration.
  - Files: `runner/src/routes/**`, `runner/src/runs/**`, `runner/src/policies/**`, `runner/test/routes/**`, `runner/test/runs/**`.
  - Action: Add the versioned endpoints, redacted Cockpit operations summary, idempotency, event cursors, heartbeat, quotas, timeout/interrupt behavior, approval flow, server-owned `RunPolicy` resolution, manual-only `RunIntent` validation, explicit context-bundle attachment, allowlisted audit templates, isolated fix templates, and explicit no-push/no-merge gates.
  - User story link: Turns buttons and conversation input into safe, observable agent work.
  - Depends on: Tasks 2-5.
  - Validate with: API integration tests for success, disconnect, replay, denial, timeout, project-busy, quota, access-loss, stale-state reconciliation, tenant-safe operations summaries, rejected automatic triggers, and no implicit runtime/provider change.
  - Implementation note (2026-08-02): the first tenant/project-protected audit route now creates a durable run and invokes the selected runtime through the neutral command service; runtime events are persisted and exposed through a bounded cursor-based SSE replay route, with optional tenant/conversation-scoped live fan-out after persistence and a bounded idle window. State-changing Origin policy is implemented from `RUNNER_ALLOWED_ORIGINS`; per-tenant admission, maximum duration and interrupt reconciliation are implemented for the current audit command. Conversation create/message/interrupt/resume routes now use the same server-owned session/run boundary and durable idempotency contract. Both `POST /audits` and `POST /fixes` require durable idempotency and replay from SQLite; fixes additionally revalidate a tenant-owned GitHub binding, create an isolated server-owned worktree, start Codex with its internal workspace when GitHub/Codex are configured, and fail closed otherwise. A periodic cleanup worker reconciles due worktrees without exposing paths. Flutter integration and real-provider proof remain.
- [ ] Task 7: Establish the proprietary ShipGlows health evaluator and five-dimensional Cockpit projection.
  - Files: `runner/src/skills/**`, `runner/src/health/**`, `runner/test/skills/**`, `runner/test/health/**`, `app/lib/domain/project_health/**`, `app/lib/shipglows/data/cockpit/**`, `app/test/domain/project_health/**`, `app/test/shipglows/data/cockpit/**`.
  - Action: Define versioned skill-run/evidence and `ProjectContextBundle` contracts, execute one bounded read-only skill through `just-bash` against a controlled snapshot, map evaluator outcomes into tech/content/SEO/performance/security models, preserve explicit unknown/not-reported states, and link each result to its producing run and context provenance.
  - User story link: Provides the global visual health view across tech, content, SEO, performance, and security.
  - Depends on: Task 1 contracts; can use fixtures before Task 6 is live.
  - Validate with: deterministic evaluator fixtures, sandbox limits, coverage, stale evidence, source-gap, malformed payload, and worst-state tests; prove that no absent evidence becomes healthy.
- [ ] Task 8: Integrate the active-runtime identity and runner API adapters.
  - Files: `app/lib/shipglows/auth/**`, `app/lib/shipglows/data/api/**`, `app/lib/shipglows/providers/**`, `app/web_auth/**`, `app/android/**`, `app/windows/**`, `app/test/shipglows/auth/**`, `app/test/shipglows/data/api/**`.
  - Action: Define one Dart auth interface, integrate the Supabase Flutter session contract across Web/Android/Windows, retain legacy auth only behind an adapter, add typed Dio API clients plus authenticated fetch-style SSE/PTY streaming, token refresh, `Last-Event-ID` cursor resume, error mapping, and Riverpod state ownership. Do not use browser `EventSource`, because the stream requires an authorization header.
  - User story link: Makes sign-in and managed server conversations available in the active Flutter app.
  - Depends on: Tasks 1-2 and API fixtures from Task 6.
  - Validate with: Web bridge tests, Android adapter contract tests, token-refresh tests, reconnect/idempotency tests, and no-legacy-route dependency scan.
- [ ] Task 9: Reconcile the Flutter design authority and implement the Cockpit shell.
  - Files: `app/lib/presentation/theme/app_theme.dart`, `app/lib/shipglows/app.dart`, `app/lib/shipglows/router.dart`, `app/lib/shipglows/presentation/screens/cockpit_screen.dart`, `app/lib/shipglows/presentation/widgets/cockpit/**`, corresponding widget/golden tests.
  - Action: Make the active ShipGlows theme consume canonical semantic tokens; implement responsive Cockpit navigation, health matrix, redacted per-project run-state summary, project parent tabs, loading/empty/stale/access-lost/error states, keyboard/focus behavior, and accessible labels.
  - User story link: Gives the user one visual command center for every repository.
  - Depends on: Tasks 7-8.
  - Validate with: widget tests at phone/tablet/desktop widths, contrast/focus/semantics checks, golden snapshots, and design-system drift check.
- [ ] Task 10: Implement agent conversation tabs and action controls.
  - Files: `app/lib/shipglows/presentation/screens/project_workspace_screen.dart`, `app/lib/shipglows/presentation/widgets/conversations/**`, `app/lib/shipglows/providers/conversations/**`, corresponding tests.
  - Action: Render normalized messages/tools/plans/approvals/progress/results plus runtime identity and capability limits; create/open/close tabs, audit/fix buttons, message composer, interrupt/resume/approve/deny controls, auto-scroll rules, unread indicators and reconnection. Keep semantic agent work separate from the operator Workspace and never expose a runtime-specific protocol.
  - User story link: Lets users work with the selected agent directly inside each project tab.
  - Depends on: Tasks 6, 8, and 9.
  - Validate with: widget/state tests for event order, streaming deltas, reconnect, denial, interruption, long output, inaccessible action, concurrent device update, and zero ANSI/terminal rendering in the semantic conversation surface.
- [ ] Task 11: Implement the separately authorized operator Workspace.
  - Files: `runner/src/operator-workspace/**`, `runner/src/pty/**`, `runner/test/operator-workspace/**`, `runner/test/pty/**`, `app/lib/shipglows/presentation/screens/operator_workspace_screen.dart`, `app/lib/shipglows/presentation/widgets/operator_workspace/**`, `app/lib/shipglows/providers/operator_workspace/**`, `app/test/shipglows/operator_workspace/**`, platform runner files for Web/Android/Windows.
  - Action: Issue one project-scoped short-lived capability, attach only to an allowlisted tmux session, bridge PTY input/output and resize through the separate channel, render with the selected Flutter terminal package, reconnect safely, and launch Neovim without persisting scrollback or exposing host paths/credentials.
  - User story link: Gives the operator the requested browser-accessible tmux/Neovim workspace without making terminal administration part of ordinary use.
  - Depends on: Tasks 2-4, 6, 8, and 9; the semantic agent surface must remain usable if Workspace is unavailable.
  - Validate with: authorization/expiry tests, tmux allowlist tests, PTY resize/reconnect tests, Web/Android/Windows rendering proof, Neovim launch fixture, disconnect cleanup, no-host-path/secret assertions, and concurrent-session rejection.
- [ ] Task 12: Add observability, operational controls, and secure runbook.
  - Files: `runner/src/observability/**`, `app/lib/shipglows/observability/**`, `app/shipglows_data/technical/operator-guides/managed-agent-runner.md`, related tests.
  - Action: Integrate Sentry with strict before-send redaction, early Flutter/server initialization, release/build identity, safe diagnostics/log-copy with Paris/UTC headers, health endpoints, runtime auth/process/capability checks, workspace cleanup, quotas, SQLite backup/migration procedures, and incident recovery.
  - User story link: Enables ShipGlows to own the server so the user does not have to.
  - Depends on: Tasks 4-6, 8, and 11.
  - Validate with: redaction fixtures, synthetic health failures, release tags, cleanup dry-run, backup/restore proof, and runbook command review with no secret output.
- [ ] Task 13: Complete end-to-end proof and documentation coherence.
  - Files: `app/shipglows_data/workflow/verification/shipglows-managed-agent-cockpit-mvp.md`, impacted technical maps/docs, `app/README.md`, `app/CHANGELOG.md`, and `app/.github/workflows/**`.
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

# Acceptance Criteria

- `AC-001`: A signed-in user sees only authorized projects in one Cockpit.
- `AC-002`: Every project displays tech, content, SEO, performance, and security with explicit evidence/freshness; absent evidence is not reported as healthy.
- `AC-003`: Projects are parent workspaces and agent conversations are child tabs with restorable state.
- `AC-004`: A user can create/resume a semantic conversation, send a message, and observe real normalized events from the selected runtime without needing a terminal, SSH, tmux, PTY, ANSI emulator, or server path.
- `AC-004a`: Codex app-server passes the first complete `AgentRuntime` adapter smoke; a fake second adapter passes the same contract suite, proving Flutter, health, authorization and public API behavior do not depend on Codex wire types.
- `AC-004b`: A request whose selected runtime lacks a required capability is rejected before execution with a stable, user-visible capability error; ShipGlows never silently changes runtime or expands permissions.
- `AC-005`: A user can launch a read-only audit and see queued, running, progress, result, error, interrupted, and retry states.
- `AC-006`: A user can launch a proposed fix only in an isolated worktree/branch; the MVP cannot automatically push, merge, deploy, or mutate the default branch.
- `AC-007`: Approval requests are visible and can be approved/denied only by an authorized actor; denial, expiry, replay, and disconnect are recoverable and audited.
- `AC-008`: GitHub access is revalidated server-side before repo-sensitive work; revoked access blocks action while preserving stale readable projection.
- `AC-009`: HTTP retry and SSE reconnect cannot duplicate conversations, turns, runs, approvals, or tracker proposals.
- `AC-010`: Cross-tenant/project identifiers, traversal paths, oversized payloads, prompt-injection attempts, and client-selected policies are rejected server-side.
- `AC-011`: No GitHub/runtime/Supabase secret, token, cookie, tokenized URL, local path, environment value, raw private file, or unrestricted command output appears in client payloads, persisted events, logs, or Sentry.
- `AC-012`: Web passes a complete authenticated end-to-end scenario; Android and Windows pass platform, responsive UI, terminal-rendering contract, and API compatibility proof.
- `AC-013`: Server restart, selected-runtime process failure, event disconnect, timeout, project-busy, quota, SQLite failure, and abandoned-worktree scenarios preserve understandable state and bounded recovery.
- `AC-014`: Completed run evidence can update the Cockpit and create a proposed tracker change while repository/Markdown remains canonical.
- `AC-015`: A non-technical user can complete sign-in, select a project, launch an audit, inspect progress/result, and start a follow-up conversation without infrastructure instructions.
- `AC-016`: An explicitly authorized operator can open one Workspace, attach to one allowlisted tmux session, resize/reconnect the PTY, launch Neovim, and close the session without exposing host paths, credentials, or arbitrary shell selection.
- `AC-017`: At least one proprietary ShipGlows skill can run through bounded `just-bash` against a controlled snapshot, produce versioned evidence, and update health without accessing secrets or unrestricted network/filesystem state.
- `AC-018`: Copied diagnostics begin with commit/build identity and Paris/UTC build timestamps, remain redacted, and are useful without direct Sentry dashboard access.
- `AC-019`: The Cockpit shows only caller-authorized redacted run-state supervision; every MVP run records `manual`, and schedule/webhook/system-recommendation triggers are rejected without starting work.
- `AC-020`: Every runtime context has an explicit versioned ShipGlows provenance bundle or an empty-context marker; no opaque, cross-project, cross-tenant or self-modifying memory is used.

# Test Contract

- `surface`: Flutter Web, Android and Windows active ShipGlows runtime; Node.js/TypeScript managed control plane; `AgentRuntime`/`ExecutionProvider`/`CapabilityBroker` contracts; Codex app-server first adapter plus fake second-adapter conformance proof; Supabase Auth identity adapter; GitHub App access layer; managed clone/worktree layer; SQLite operational projection; authenticated SSE/HTTP API plus separate authenticated PTY channel; Cockpit health projection; semantic conversation UI; operator Workspace; Sentry diagnostics; operator docs; bounded just-bash skill execution. Marketing site, production push/merge/deploy, iOS shell, Linux desktop application launch, a live OpenCode/Kilo adapter, and unrestricted shell access are outside this proof.
- `proof_profile`: high-risk authenticated runtime and agent-execution proof. Required evidence combines official-doc freshness, runner unit/contract/integration/security tests, Flutter unit/widget/platform tests, authenticated Web browser proof, Android and Windows build/session/adapter proof, local managed Git/Codex-first-adapter smoke plus fake second-adapter conformance proof, restart/reconnect/idempotency proof, tenant isolation, secret/redaction scans, Sentry and diagnostics redaction, metadata lint, design-system drift check, dependency audit, and diff hygiene.
- `proof_order`:
  1. Freeze shared request/response/event/error schemas and threat boundaries.
  2. Prove auth, tenant isolation, GitHub access, workspace safety, persistence, and idempotency before enabling runtime execution.
  3. Prove Codex-first-adapter event normalization, second-adapter conformance and process recovery with fakes before a local live smoke.
  4. Prove audit read-only and fix isolation/no-push gates before wiring action buttons.
  5. Prove Flutter auth/API/reconnect state with fixtures before live integration.
  6. Prove Cockpit and conversation UX across responsive widths and failure states.
  7. Run authenticated Web end-to-end plus Android and Windows platform/API contract proof.
  8. Prove the separately authorized Workspace with tmux/PTY/Neovim fixtures and prove one bounded just-bash skill run.
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
  - `MCC-007`: fix uses an isolated worktree/branch and cannot push, merge, deploy, or target the default branch.
  - `MCC-008`: approval approve/deny/expire/replay is authorized, idempotent, visible, and audited.
  - `MCC-009`: revoked/stale GitHub access blocks repo-sensitive action but preserves stale projection.
  - `MCC-010`: cross-tenant/project access and open-stream access after membership loss are denied.
  - `MCC-011`: traversal, symlink escape, oversized output, ANSI/binary content, and prompt-injection attempts remain contained and redacted.
  - `MCC-012`: interrupt, timeout, selected-runtime crash, runner restart, project-busy, and quota states are recoverable without duplicate work.
  - `MCC-013`: no secret/token/cookie/header/private path/raw private file leaks through API, SQLite events, logs, diagnostics, or Sentry.
  - `MCC-014`: Web authenticated end-to-end user journey succeeds without infrastructure knowledge.
  - `MCC-015`: Android and Windows build, Supabase adapter contract, deep-link/session handling where applicable, and runner API compatibility succeed.
  - `MCC-016`: completed evidence updates health projection and tracker proposal without making SQLite canonical.
  - `MCC-017`: design-system authority, keyboard/focus/semantics, responsive layout, and long-conversation behavior pass UI proof.
  - `MCC-018`: official OpenAI, OpenCode/Kilo/ACP, Supabase and GitHub assumptions are rechecked immediately before dependency/runtime integration.
  - `MCC-019`: operator Workspace capability is project-scoped, expires, attaches only to an allowlisted tmux session, reconnects safely, and cannot expose host paths or credentials.
  - `MCC-020`: a just-bash skill run is bounded, produces versioned evidence, and cannot access secrets or unrestricted network/filesystem state.
  - `MCC-021`: diagnostics/log-copy exposes safe build identity and Paris/UTC timestamps without tokens, cookies, private text, terminal scrollback or raw payloads.
  - `MCC-022`: operations summaries remain tenant/project scoped and do not expose prompts, paths, secrets, raw logs or unauthorized run totals.
  - `MCC-023`: only a server-validated manual `RunIntent` starts MVP work; reserved automatic trigger values are rejected idempotently before runtime selection.
  - `MCC-024`: project context is bounded, redacted, attributable and tenant/project scoped; attempts to attach client-selected, cross-project or untracked memory fail closed.
- `required_results`: all scenario IDs pass or are explicitly blocked by unavailable external credentials under the narrow exception below; no critical/high security defect remains; no unsupported production claim is added; every failed external smoke retains complete fake/local contract proof and an exact operator follow-up; full Flutter and runner checks pass; changed governance artifacts pass metadata lint; design-system drift is addressed; working-tree changes remain scoped and preserve pre-existing operator edits.
- `exception_with_proof`: live Supabase, GitHub App, Sentry ingestion, and Codex-first-adapter authenticated smoke calls may be deferred only when credentials or provider configuration are unavailable in the local environment. The implementation must still provide complete fake/local contract tests, disabled-by-default secure adapters, redaction proof, exact configuration diagnostics, and a verification checklist that marks the live scenario blocked rather than passed. A live Codex smoke may use the server's existing authenticated Codex installation without exposing credentials. A live OpenCode/Kilo adapter is explicitly outside this MVP proof. No release may be described as production-ready until all required live provider scenarios pass.
- `exception_without_proof`: none for tenant isolation, authorization middleware, idempotency, event ordering/resume, audit read-only policy, fix worktree isolation, no-push/no-merge gates, path/symlink containment, prompt/output bounds, secret redaction, health unknown semantics, accessible failure states, metadata lint, dependency audit, and diff hygiene.

# Test Strategy

- Unit tests for every schema, state transition, health aggregation rule, redactor, policy, and mapper.
- Contract tests with fake Supabase Auth, GitHub App, Codex adapter, second agent adapter, filesystem, clock, and Sentry transports.
- SQLite migration, transaction, tenant boundary, idempotency, restart, backup, and restore tests.
- Local Git fixtures for clone/fetch, renamed default branch, worktree isolation, concurrent mutation lock, symlink/traversal rejection, and abandoned-worktree cleanup.
- API integration tests for auth, commands, approvals, quotas, timeouts, interruption, cursor resume, access loss, and malformed input.
- Contract tests for operations-summary tenant isolation, manual-only run admission, immutable policy resolution, bounded context provenance and forbidden automatic triggers.
- PTY/tmux integration fixtures for capability expiry, allowlists, resize, reconnect, cleanup, Neovim launch, and concurrent-session rejection.
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
- High product-trust risk: presenting legacy auth/GitHub concepts as live integration would mislead the operator and users.
- Medium architecture risk: raw app-server protocol coupling could make the Flutter client brittle; normalization isolates it.
- Medium operations risk: agent-runtime process crashes, stale worktrees, SQLite corruption, and token expiry need explicit recovery.
- Medium cost/availability risk: unbounded turns, output, concurrency, or retries could exhaust server and model quotas.
- Medium UX risk: a terminal clone would be visually noisy and inaccessible; semantic event rendering requires careful progress/error design.
- Medium platform risk: Supabase session and deep-link behavior still needs Web/Android/Windows proof; a Clerk compatibility path must not silently become a second identity model.
- Medium data-coherence risk: operational projections could accidentally become canonical instead of GitHub/Markdown.
- High operator-surface risk: a PTY/tmux bridge can become a general server shell if capability scope, allowlists, cleanup and audit boundaries are weakened.
- Medium sandbox risk: just-bash is beta and simulated; its use must remain bounded and must not be mistaken for proof that real server commands are safe.
- Medium orchestration risk: copied trigger or memory patterns could create unbounded autonomous work or tenant-context leakage; manual-only admission, explicit policy/context provenance and a future-spec gate keep those patterns out of the MVP.

# Execution Notes

- Read order: this spec; `AGENT.md`; `technical/runtime-boundary.md`; foundational architecture; GitHub managed clone spec; dashboard projection spec; design-system authority; active `lib/shipglows/**`; source reader/project-health modules; runner foundation; Supabase/Auth provider notes; legacy inventory; only then narrow legacy auth/GitHub files selected for extraction.
- Start with Batch A. Do not wire UI action buttons to real execution until auth, tenant isolation, workspace containment, persistence, and idempotency tests pass.
- Keep every runtime transport behind `AgentRuntime` and keep Flutter behind the normalized ShipGlows event contract. No Flutter model may import a runtime wire type.
- Use supervised `codex app-server` stdio locally for the first MVP adapter. Do not let its transport, session identifiers or capabilities leak into routes, policy, health or Flutter; the fake second adapter is mandatory proof.
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

# Current Chantier Flow

`100-sg-spec` (amended; orchestration/context review required) -> `101-sg-ready` (pending focused review) -> `102-sg-start` (in progress; Tasks 1-6 first slices implemented) -> `004-sg-deploy` (partial; private runner active, public Caddy/DNS pending) -> `103-sg-verify` -> `104-sg-end` -> `005-sg-ship`
