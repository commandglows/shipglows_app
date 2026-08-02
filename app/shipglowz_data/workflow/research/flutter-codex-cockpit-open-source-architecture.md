---
artifact: research
metadata_schema_version: "1.0"
artifact_version: "1.5.0"
project: "shipglowz_app"
created: "2026-08-01"
created_at: "2026-08-01 21:20:18 UTC"
updated: "2026-08-01"
updated_at: "2026-08-01 22:36:56 UTC"
status: reviewed
source_skill: "203-sg-research"
source_model: "GPT-5 Codex"
scope: "flutter-agent-cockpit-open-source-architecture"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Flutter Web"
  - "Flutter Android"
  - "Flutter Windows"
  - "ShipGlowz managed runner"
  - "OpenAI Codex app-server"
  - "T3 Code"
  - "Maestro"
  - "just-bash"
  - "Vercel Agent Stack"
  - "Vercel Open Agents"
  - "Vercel Sandbox"
  - "Vercel Workflow"
  - "AI SDK 7 HarnessAgent"
  - "Vercel Connect"
  - "Vercel AI Gateway"
  - "Agent Client Protocol (ACP)"
  - "OpenCode"
  - "Kilo Code"
  - "Webmux"
  - "Happier"
  - "Handler"
  - "CloudCLI"
  - "xterm.dart"
  - "ttyd"
  - "Supabase Auth"
  - "GitHub App"
source_count: 44
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-managed-codex-cockpit-mvp.md"
  - "runner/"
supersedes: []
evidence:
  - "Official OpenAI Codex app-server documentation checked 2026-08-01."
  - "T3 Code MIT repository inspected at commit 5192f777fe54c2a2a359f6c25ecf5fbde46d49b0."
  - "Current ShipGlowz Flutter application, ready specification, and 798-line runner skeleton inspected locally."
  - "Current Flutter, Supabase, Clerk, Firebase, Auth0, Flyer Chat, and Dart WebSocket platform documentation checked 2026-08-01."
  - "Expanded ecosystem scan 2026-08-01: Webmux, Happier, Handler, CloudCLI, Yep Anywhere, Harnss, OpenTag, xterm.dart, xterm.js, ttyd, and code-server inspected after operator challenged the initial T3-Code-heavy conclusion."
  - "Additional 2026-08-01 scan checked Maestro's supervised agent workflow, the local Maestro CLI, and GitHub's native code-quality surfaces."
  - "just-bash checked 2026-08-01 as a possible sandbox for ShipGlowz skill execution; it is not a replacement for a real PTY/tmux/Neovim workspace."
  - "Vercel Ship 2026 recap and official Vercel documentation checked 2026-08-01: agent harnesses, durable workflows, isolated sandboxes, scoped credentials, and an open-source Web → workflow → sandbox reference architecture."
  - "CTO reframe 2026-08-01: Codex is the first proven runtime adapter, not the product boundary; ShipGlowz skills can run with multiple coding-agent runtimes and the control plane owns portable policy, evidence, health, permissions, costs, and UX."
  - "Operator correction 2026-08-01: ShipGlowz must include an authenticated operator terminal capable of attaching tmux and running Neovim inside the Flutter product."
next_step: "Implement the ShipGlowz control-plane foundation: prove Codex first and use a second adapter fixture before integrating any Vercel runtime dependency."
---

# Flutter Agent Cockpit: open-source architecture research

## Executive verdict

The requested product is feasible, including the terminal and Neovim requirement. ShipGlowz can be a Flutter application on Web, Android, and Windows, hosted on a ShipGlowz-owned domain, that combines repository health, structured agent conversations, and a privileged operator workspace. The key correction to the initial report is that semantic agent work and terminal access are complementary surfaces, not mutually exclusive architectures.

The preferred route is:

1. Keep the existing Flutter product and project-health domain.
2. Keep a small ShipGlowz-owned TypeScript control plane on the managed host.
3. Put Codex, OpenCode, Kilo and future agent runtimes behind a ShipGlowz-owned `AgentRuntime` contract; Codex app-server is the first adapter, not the product's sole execution model.
4. Expose only a normalized, authenticated ShipGlowz API to Flutter.
5. Add a separately authorized terminal surface that attaches allowlisted tmux/Neovim sessions through a private PTY gateway.
6. Keep agent workspaces separate from the control plane: sandboxed and disposable for automated work, persistent only for explicitly authorized operator tmux sessions.
7. Borrow narrowly selected patterns or code from several open-source projects rather than treating T3 Code or Vercel as the single reference.
8. Replace the current cross-platform Clerk assumption with a portable identity boundary, with Supabase Auth as the leading MVP candidate.

This keeps the product proprietary in the useful sense: ShipGlowz owns its domain, UX, product model, API contract, data model, deployment, and customer relationship. Open-source dependencies remain replaceable implementation details.

## Agent runtime neutrality: Codex is the first adapter, not the product

The official Codex app-server is explicitly intended for rich clients. Its API lists and resumes durable threads, starts and interrupts turns, streams assistant text and tool activity, exposes plans and file changes, and sends approval requests that a UI can render inline. That makes it an excellent first ShipGlowz adapter. [`thread/list` is documented as suitable for a history UI](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md#example-list-threads-with-pagination--filters), while `turn/start` streams semantic item events and `thread/resume` restores stored conversations. [OpenAI's approval contract](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md#approvals) also tells rich clients how to present command and file-change decisions.

It must not, however, define ShipGlowz's product contract. `AgentRuntime` should expose ShipGlowz-owned concepts such as capability discovery, create/resume/cancel run, normalized semantic events, approval requests, workspace requirements, model/config identity, and redacted diagnostics. A Codex adapter maps app-server JSON-RPC to that contract; an OpenCode/Kilo adapter may map a local server or CLI to the same contract. Flutter never imports a runtime wire protocol.

The [Agent Client Protocol](https://dev.opencode.ai/docs/acp/) is useful for editor interoperability, but it is not ShipGlowz's remote API: OpenCode starts ACP as a local JSON-RPC-over-stdio subprocess for an editor. Kilo instead documents a local HTTP/SSE serving model for editor and console clients. ACP can become one adapter transport, but ShipGlowz still owns remote identity, project authorization, durable runs, evidence, policy, browser/mobile reconnection and audit history.

## Correction: T3 Code is one reference, not the best single answer

T3 Chat remains useful as interaction inspiration. [T3 Code](https://github.com/pingdotgg/t3code) is an important MIT-licensed reference for the Codex protocol boundary, remote clients, authorization scopes, and session lifecycle, but the initial report overweighted it and did not scan enough adjacent products.

T3 Code proves almost the exact backend split ShipGlowz needs: clients are presentation layers, while a server owns provider processes, workspaces, Git, filesystem operations, durable events, authorization, and reconnection. Its [public architecture](https://github.com/pingdotgg/t3code/blob/main/docs/internals/overview.md) and [remote-access model](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md) are strong primary references.

It is not, however, a small drop-in backend. At the inspected commit, `apps/server/src` contains about 180,545 lines across 520 files; its internal contracts add about 16,132 lines and its private Codex protocol package about 45,985 lines. It also carries five agent providers, terminal control, relay/Tailscale/SSH access, an Effect-based event-sourced runtime, Git checkpoints, React clients, and a TypeScript-only private monorepo contract. By contrast, ShipGlowz already has a focused 798-line Fastify runner skeleton.

Therefore:

- reuse T3 Code's threat model, capability scopes, short-lived WebSocket-ticket pattern, event idempotency, provider supervision, and selected Codex normalization ideas;
- copy or adapt code only after tracing its dependencies and preserving MIT attribution;
- do not port its React UI into Flutter;
- do not inherit its terminal, relay, multi-provider, or Effect RPC stack unless a spike proves a specific module saves more work than it creates.

## Broader open-source landscape

No single project is the complete ShipGlowz blueprint. The strongest references divide by problem:

| Project | Strongest reusable lesson | Fit for ShipGlowz | Material limit |
| --- | --- | --- | --- |
| [Webmux](https://github.com/windmill-labs/webmux) | One dashboard for many projects, worktrees, embedded terminals, agent chat, PR/CI status, service health, tmux and Docker | Closest product inspiration for the combined Cockpit + agent + terminal vision | Bun/React implementation and project-local config are not Flutter-native |
| [Happier](https://github.com/happier-dev/happier) | Follow, resume and take over existing Codex sessions from web/mobile/desktop through an end-to-end encrypted relay | Best reference for remote continuity and multi-device session ownership | Large multi-agent product and relay architecture |
| [Handler](https://github.com/Launchable-AI/handler.dev) | Persistent tmux terminals, file browser, agent-status classification, worktree forks and Docker/Firecracker isolation | Best reference for privileged operator workspace and later sandboxing | Much broader infrastructure control plane than the first MVP needs |
| [CloudCLI](https://github.com/siteboon/claudecodeui) | Chat, shell terminal, file editor, Git explorer, sessions and plugins in one responsive web UI | Strong UX proof that the combined product is practical | AGPL-3.0 network-service obligations make code reuse incompatible with a closed proprietary server unless those obligations are accepted |
| [Yep Anywhere](https://github.com/kzahel/yepanywhere) | Lightweight self-hosted remote agent UI, existing session discovery, E2E relay and mobile ergonomics | Good reference for a small personal-first deployment | Less repository-health and workspace orchestration depth |
| [Harnss](https://github.com/OpenSource03/harnss) | Rich Codex tool cards, diffs, built-in terminal, Git, browser and MCP | Strong desktop interaction reference | Desktop-first rather than browser-first |
| [OpenTag](https://getopentag.com/) | Unified multi-agent inbox and Codex app-server adapter | Useful future collaboration model | Broader team/messaging product than the current goal |
| [Maestro](https://www.maestrodev.ai/) | Supervised creator/reviewer/conductor workflow with plans, approvals, validation and source-linked findings | Closest conceptual reference for turning proprietary ShipGlowz skills into visible gates and evidence | Desktop/local-first alpha; its repository is AGPL-3.0, so it is a workflow reference rather than an automatic code base |
| [Maestro CLI](https://github.com/ReinaMacCredy/maestro) | Missions, milestones, assertions, evidence, handoffs and skill synchronization | Useful reference for evidence-first agent runs and resumable work | Local CLI/TUI, not a browser/mobile product |
| [just-bash](https://github.com/vercel-labs/just-bash) | Simulated Bash with virtual filesystem, command allow-list, network filtering and execution limits | Candidate sandbox for running ShipGlowz health skills against a bounded repository snapshot | Not a real server terminal: no direct Hetzner/tmux/Neovim workflow; beta and optional runtimes have platform limits |
| [T3 Code](https://github.com/pingdotgg/t3code) | Typed Codex control plane, scoped authorization, reconnect and multi-client runtime | Best protocol/runtime reference | Full stack is too large to adopt wholesale |

The new synthesis is therefore a portfolio: Webmux for the product layout, Happier for remote continuity, Handler for terminal and isolation, T3 Code for Codex runtime contracts, Maestro for supervised evidence/gates, and CloudCLI/Harnss for interaction patterns.

## The ShipGlowz health engine remains proprietary

The products above can inspire the shell around the work, but they do not know what a healthy ShipGlowz project means. GitHub can expose repository and code-quality signals, and agent workspaces can expose runs, files, terminals and diffs; neither replaces the private ShipGlowz skill contracts, Markdown governance, freshness rules, evidence requirements or dimension model.

The product boundary should therefore be explicit:

```text
ShipGlowz skills + repository evidence + governance rules
                         |
              versioned ShipGlowz health evaluator
                         |
       project health dimensions, findings, freshness, next actions
                         |
       Flutter Cockpit / Codex / Workspace presentation surfaces
```

This is the durable differentiation. Open-source projects can supply terminal transport, session continuity, agent events and UI patterns; the ShipGlowz runner remains the authority that computes project health.

`just-bash` may become one implementation detail inside that evaluator: a sandboxed “safe terminal” for read-only or preview skill runs. The real operator terminal remains a separate PTY/tmux/Neovim capability on the managed host.

## What Vercel Ship 2026 adds to the comparison

The [Vercel Ship 2026 recap](https://vercel.com/blog/vercel-ship-2026-recap) confirms a useful architecture family for ShipGlowz, but not a reason to replace Flutter. The strongest reference is [Open Agents](https://github.com/vercel-labs/open-agents), whose explicit split is `Web -> Agent workflow -> Sandbox VM`: the agent/control plane stays separate from the filesystem and shell execution environment, and a run can resume independently of a sandbox. That maps cleanly to our Flutter client, managed runner, Codex process, and future isolated workspace.

The reusable lessons are:

- [AI SDK 7](https://vercel.com/changelog/ai-sdk-7) gives a provider-neutral agent/harness boundary and explicitly lists Codex, Claude Code, OpenCode and other runtimes as adapters. We should treat this as an optional TypeScript adapter experiment, not as a Flutter dependency or a replacement for the official Codex app-server contract.
- [Vercel Workflow](https://vercel.com/kb/guide/what-is-workflowagent) reinforces the need for durable runs: retries, persisted steps, reconnect and human approval must survive a dropped request or process restart. Our runner should keep this contract even if its first implementation uses SQLite plus a supervised worker rather than Vercel Workflow.
- [Vercel Sandbox](https://vercel.com/docs/sandbox) is a strong model for ephemeral Firecracker-isolated execution of generated or untrusted code, with snapshots and bounded runtime/network access. It is a possible later execution provider for Codex previews or skill checks, but it is not the right first answer for persistent tmux/Neovim sessions and its hosted runtime creates a provider dependency.
- [Vercel Connect](https://vercel.com/blog/vercel-ship-2026-recap) makes short-lived, task-scoped credentials the default mental model. ShipGlowz should apply the same principle to GitHub installation access, Codex approvals and terminal connection tickets; no long-lived provider secret should enter Flutter.
- [Vercel Agent](https://vercel.com/docs/agent) demonstrates the product value of turning observability into investigations and reviewable pull requests. ShipGlowz can apply that shape to proprietary health findings, but must keep its own skill/evidence evaluator as the authority.

The practical conclusion is a three-layer execution model:

```text
Flutter Cockpit / Codex / Workspace
              |
       ShipGlowz runner
   identity, policy, events, evidence
        /             \
 Codex app-server     bounded sandbox
 semantic work        audits/previews
              \
        persistent PTY/tmux
        operator-only Workspace
```

The hosted Vercel pieces are therefore candidates for isolated spikes, not a wholesale platform choice. We should first prove the runner and Flutter contracts on ShipGlowz infrastructure, then compare a self-managed worker/sandbox with Vercel Sandbox on security, persistence, cost and operational effort.

## CTO decision: make ShipGlowz a control plane, not a Codex client

The product's durable core is not Codex and not a particular implementation of the ShipGlowz skills. It is the control plane that lets a person safely use any suitable agent against her projects: project identity, policy, skills/evidence packs, run history, health semantics, approval rules, cost limits, workspace choice and the Flutter experience. Skills remain portable domain assets; they must be runnable by more than one agent rather than being fused to one vendor runtime.

```text
Flutter Web / Android / Windows
     Cockpit · conversations · operator Workspace
                         |
              ShipGlowz Control Plane
 identity · project graph · policy · evidence · health
 approvals · durable runs · cost/usage · redacted events
        /                 |                  \
AgentRuntime port   ExecutionProvider port    Integration port
Codex | OpenCode    sandbox | worktree        GitHub App | MCP | future OAuth
Kilo | ACP | future tmux operator workspace
```

This is the key correction to the previous specification: **Codex is the first implementation, not the center of gravity.** The Flutter application speaks only ShipGlowz contracts. The control plane chooses a runtime only after checking the action, repository, model policy, cost allowance, required capabilities and security profile.

### What I would adopt now

| Vercel idea | ShipGlowz implementation decision | Why |
| --- | --- | --- |
| AI SDK harness abstraction | Define our own stable `AgentRuntime` port, inspired by the idea but not coupled to the current package | Vercel's `HarnessAgent` can normalize Codex/Claude Code/Pi and is explicitly experimental; our public product contract must not inherit canary churn. |
| WorkflowAgent | Make every audit, fix and conversation turn a durable `Run` state machine with checkpoints, cancellation, approval waits and idempotency | The capability is non-negotiable; the first implementation can stay on the managed runner with SQLite/worker supervision. |
| Open Agents' `Web -> workflow -> sandbox` split | Adopt the architecture directly, not the React/Vercel application | It keeps agent/provider choice and sandbox lifecycle independent. |
| Connect's short-lived credentials | Add a ShipGlowz capability broker | GitHub App tokens, MCP/OAuth grants and terminal tickets should be narrow, expiring, auditable and never reach Flutter. |
| AI Gateway's usage model | Add a `ModelGateway` port and a per-run cost ledger | A central point for model policy, attribution, budgets and fallbacks is valuable when ShipGlowz makes native model calls; choosing Vercel's gateway stays optional. |
| Sandbox | Add an `ExecutionProvider` port with two explicit modes | Ephemeral sandbox for autonomous/audit work; persistent PTY/tmux only for a human-authorized operator Workspace. |
| Vercel Agent | Reuse the product pattern, not the service | A health signal should start an evidence-backed investigation and a reviewable proposed change, never an invisible autonomous production edit. |

### What I would not adopt as the foundation

- **eve, immediately:** it is a strong Apache-2.0 reference for filesystem-first agent authoring — instructions, tools, skills, channels and schedules — but it is still beta. I would borrow its folder conventions in a ShipGlowz `agent-packs/` format and run one isolated compatibility spike later; I would not let a beta framework own our product policy or data model. [eve repository](https://github.com/vercel/eve)
- **AI SDK HarnessAgent as the public interface:** it currently ships through an experimental/canary surface. Use it only behind our adapter in a non-production spike. [Harness announcement](https://vercel.com/changelog/program-agent-harnesses-with-ai-sdk)
- **Vercel Connect for the GitHub App:** it solves a similar problem, but GitHub App installation tokens already provide the correct ShipGlowz-owned, repository-scoped mechanism. Connect could be useful later for user-linked SaaS/MCP providers, not as our identity or GitHub authority.
- **Vercel Sandbox for tmux/Neovim:** a sandbox is disposable agent compute; it must not replace the deliberately persistent operator environment.
- **Chat SDK, AI Elements or a Vercel web UI:** they are JavaScript UI accelerators and do not improve Flutter. We keep a native Flutter presentation layer.
- **Vercel Agent/Passport as customer-facing dependencies:** copy their least-privilege and investigation patterns, but keep authentication, authorization and auditability in ShipGlowz.

### Recommended runtime roadmap

1. Build the runtime-neutral contracts first: `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker`, `Run` and a capability matrix.
2. Deliver Codex app-server as the first complete adapter because it is already available on the managed server.
3. Add a fake second adapter in automated tests, proving no Flutter, health or authorization code assumes Codex wire types.
4. Spike one real non-Codex path: OpenCode is the best first candidate because it documents both an ACP subprocess and a local serving model. Do not promise a full Kilo/OpenCode feature matrix until the capability matrix is measured.
5. Only then evaluate AI SDK 7 or eve as implementation accelerators behind the stable ShipGlowz port.
6. Evaluate Vercel Sandbox only for disposable agent work; retain self-hosted execution as the default for private worktrees and persistent operator sessions.

## Recommended architecture

```text
Flutter Web / Android / Windows
  Cockpit: repository health, projects, alerts
  Agent work: threads, messages, tools, plans, diffs, approvals
  Workspace: terminal, tmux, Neovim, bounded file access
  local cache + reconnect state
                    |
           HTTPS + authenticated stream
                    |
ShipGlowz control plane on ShipGlowz infrastructure
  identity and per-project authorization
  GitHub App and repository registry
  conversation/event projection and idempotency
  managed clones/worktrees and bounded actions
  AgentRuntime adapters and capability matrix
  privileged PTY/tmux gateway with separate capability
                    |
 private runtime transports                 private PTY
 Codex app-server | OpenCode | Kilo         tmux -> Neovim/shell
```

HTTP commands plus fetch-based SSE remain a reasonable first ShipGlowz protocol because they fit the existing spec and avoid exposing a TypeScript-specific RPC framework to Dart. An authenticated WebSocket can be introduced when bidirectional latency or subscription fan-out justifies it. Dart's maintained [`web_socket_channel`](https://pub.dev/packages/web_socket_channel) already supports Android, Web, and Windows, so this is not a platform blocker.

## Flutter and reusable UI bricks

[Flutter officially targets browser and Windows desktop](https://docs.flutter.dev/reference/supported-platforms), in addition to Android. A single Flutter domain and component system can therefore support all three requested surfaces, with small platform adapters for authentication callbacks, secure storage, notifications, and packaging.

For the chat shell, [`flutter_chat_ui`](https://pub.dev/packages/flutter_chat_ui) is an Apache-2.0, backend-agnostic package supporting Android, Web, and Windows. It can save work on virtualization, message lists, composition, theming, and common interactions. It should be treated as a replaceable presentation component: agent tool calls, plans, approvals, diffs, run states, runtime capability limits and repository artifacts still need ShipGlowz widgets and domain models.

For the operator workspace, [`xterm.dart`](https://pub.dev/packages/xterm) is MIT-licensed and explicitly lists Android, Web, and Windows. It supports IMEs, wide characters, mobile input, Flutter shortcuts and terminal rendering. This means Flutter can contain a real terminal widget without embedding VS Code or rebuilding ANSI rendering from scratch. The terminal still needs a server-side PTY transport. [`ttyd`](https://github.com/tsl0922/ttyd) proves the shortest browser path and supports custom commands, reverse-proxy auth headers, origin checks, Unix sockets and writable sessions. [`xterm.js`](https://github.com/xtermjs/xterm.js) is the mature web reference used by VS Code and explicitly supports `vim` and `tmux`.

The preferred product implementation is `xterm.dart` connected to a ShipGlowz-owned authenticated PTY WebSocket so all Flutter targets share one terminal domain. The fastest disposable proof may use ttyd behind ShipGlowz authentication to validate keyboard, Unicode, resize, reconnect, tmux and Neovim before building the final gateway.

A WebView containing a complete third-party agent application is not recommended. A narrowly embedded ttyd proof is acceptable as a temporary terminal experiment, but the final application should keep conversation, terminal and project state in ShipGlowz-owned Flutter models.

## Authentication conclusion

The ready spec's Clerk assumption is no longer strong enough for the expanded platform target. Clerk announced a Flutter beta for iOS, Android, and Web, but the current package describes itself as community-maintained, beta, and lists Android, iOS, and macOS rather than Windows. [The current package metadata](https://pub.dev/packages/clerk_flutter) therefore does not establish the required Windows parity.

[Supabase's official Flutter client](https://supabase.com/docs/guides/getting-started/quickstarts/flutter) supports Web, Android, macOS, and Windows, and its Flutter auth documentation supports OAuth/deep-link flows. Supabase is also open source and can be self-hosted later, while using its managed service initially remains possible. It is the leading low-work MVP identity candidate, provided a live Windows OAuth/deep-link spike succeeds.

Firebase Auth supports Windows only in beta, according to the [official Flutter plugin matrix](https://firebase.google.com/docs/flutter/setup). Auth0's Windows Flutter SDK and credential handling are also beta and require additional Windows runner plumbing, according to its [official Windows quickstart](https://auth0.com/docs/quickstart/native/flutter-windows). Neither is a better default for this three-platform MVP.

Identity and repository permission must remain separate. Supabase (or another OIDC-compatible provider) authenticates the person; the GitHub App authorizes which repositories ShipGlowz may read or modify. A GitHub login token must not silently become the runner's repository authority.

## Security baseline

The minimum safe boundary is:

- runtime credentials, GitHub App private keys, clone paths, and raw runtime events never reach Flutter;
- every project/thread/action id is resolved and authorized server-side;
- read audits and mutating fixes use different permission profiles;
- mutating conversations get isolated worktrees and never push or merge automatically;
- commands are idempotent and streamed state can reconcile after reconnect;
- approvals show the proposed command or diff before execution;
- secrets and absolute server paths are redacted before persistence and streaming;
- app-server is bound privately and supervised; only ShipGlowz's authenticated API is public;
- browser sessions use secure, HTTP-only cookies or short-lived connection tickets, with origin and CSRF checks appropriate to the transport.
- terminal access has a distinct `terminal:operate`-style capability, short-lived connection ticket and explicit operator role;
- PTY commands are selected server-side from allowlisted profiles such as `tmux attach` or `nvim`, with no client-supplied executable, working directory or shell interpolation;
- the terminal runs as a dedicated non-root Unix identity, ideally inside a project worktree/container, and is never enabled for ordinary read-only customers by default;
- a dropped browser connection does not kill the tmux session, and reconnect cannot create duplicate writers accidentally.

T3 Code's [capability-scoped environment authentication](https://github.com/pingdotgg/t3code/blob/main/docs/internals/environment-auth.md) is a useful reference: socket authentication is not treated as permission to call every method, and WebSocket tickets are short-lived and single-purpose.

## Routes to keep, use only as references, or abandon

| Route | Decision | Reason |
| --- | --- | --- |
| Native Flutter semantic agent UI + ShipGlowz control plane | Keep | Best fit for own product/domain, all requested platforms, repository cockpit, and secure abstractions. |
| Official Codex app-server behind the control plane | Keep first | Supported rich-client primitive; first full `AgentRuntime` adapter, not a permanent monopoly. |
| OpenCode/Kilo/ACP behind the same runtime port | Keep as staged adapters | Their local transports and capabilities differ; normalize only the ShipGlowz subset that is proven and permission-safe. |
| T3 Code as architecture/code reference | Keep narrowly | MIT and highly relevant, but the complete runtime is much larger and broader than ShipGlowz needs. |
| T3 Code as temporary personal benchmark | Useful | Can validate interaction expectations immediately without becoming the product architecture. |
| Full T3 Code fork | Defer/likely reject | Large Effect/React/multi-agent/terminal inheritance and private monorepo packages create substantial maintenance. |
| Flutter WebView around T3 Code/T3 Chat | Reject | Fast-looking shortcut that produces two apps, two auth models, and weak native integration. |
| Authenticated terminal/tmux inside Flutter | Keep as operator mode | Delivers exact workspace continuity and Neovim access; must remain a separately authorized privileged capability. |
| Neovim inside the ShipGlowz terminal | Keep | Gives the requested file-editing workflow without making Neovim responsible for browser delivery or product navigation. |
| Neovim application as the whole product | Reject | It cannot replace the repository Cockpit, mobile chat UX, identity and browser delivery layers. |
| VS Code cloud/tunnels as product backend | Reject | Useful internal emergency access, not the owned product model or UI. |
| Direct public access to Codex app-server | Reject | Leaks a low-level privileged execution protocol and bypasses tenant/project policy. |
| Vercel Open Agents as a full product fork | Defer/reject for MVP | Excellent reference architecture, but it assumes a web/TypeScript/Vercel control plane and does not solve Flutter-native terminal or ShipGlowz health semantics. |
| Vercel AI SDK 7 as a runner adapter | Spike only | Potentially reduces harness/provider integration work; the current harness surface is experimental/canary and must remain behind ShipGlowz's stable adapter. |
| eve as the ShipGlowz control plane | Reject for now | Excellent filesystem-first agent authoring reference, but beta framework ownership would invert our architecture: ShipGlowz must own policy, evidence and product state. |
| Vercel Sandbox as the persistent operator workspace | Reject | Ephemeral isolated compute is suitable for bounded runs, not for the user's long-lived tmux/Neovim session. |
| Vercel Sandbox for bounded skill/audit execution | Keep as comparison | Strong isolation model; compare later against self-managed sandboxing and `just-bash` without changing the ShipGlowz health contract. |

## Recommended implementation decision

Do not restart the product around T3 Code, Vercel or Codex, and do not make the Flutter prototype a webview around any runtime. The product contract is a multi-agent ShipGlowz control plane; Vercel adds implementation options to evaluate behind that contract:

1. Windows as a first-class shared Flutter target.
2. An identity-provider interface and a Supabase Auth Web/Android/Windows proof before provider lock-in.
3. A dual-surface contract: semantic agent work for ordinary use plus a separately authorized operator workspace for terminal/tmux/Neovim.
4. A stable ShipGlowz `AgentRuntime`/capability matrix with Codex as the first adapter; OpenCode/Kilo/ACP remain deliberate staged adapters rather than untested promises.
5. A bounded reuse spike across Webmux, Happier, Handler, T3 Code, Maestro, Vercel Open Agents, eve, AI SDK 7 and Vercel Sandbox, covering runtime normalization, remote continuity, PTY supervision, authorization scopes, reconnect/idempotency, workspace isolation, evidence display and workflow gates.
6. An explicit decision after the spike: adapt small attributed permissive-license subsets or retain independent ShipGlowz implementations; AGPL sources remain interaction references unless ShipGlowz accepts their source-sharing obligations.
7. `flutter_chat_ui` and `xterm.dart` as replaceable UI accelerators, not as the ShipGlowz conversation or authorization domains.
8. A small runner comparison proof: current SQLite/supervised worker versus a Vercel Workflow/Sandbox adapter, measured on resume, approval, isolation, cost and persistent operator-session needs.

The first proofs should be deliberately small and separate. Terminal proof: sign in, open one operator-only Workspace tab, attach one existing tmux session, launch/use Neovim, resize, refresh and reconnect from Flutter Web and Windows. Semantic proof: list one repository and its first-agent threads, send one message, stream tool events, answer one approval and reconnect. Compatibility proof: run the same normalized fixture against a fake second agent adapter and verify that no Cockpit, health, authorization or API code branches on `codex`. Once those boundaries work independently, ShipGlowz can place them side by side without merging their permissions or protocols.

## Freshness and confidence

Fresh-docs checked on 2026-08-01. Confidence is high for product feasibility, Flutter terminal rendering and the dual client/server boundary; medium-high for the multi-project inspiration ranking; and medium for the final identity and PTY gateway choices until real Windows/Web keyboard, OAuth, tmux and reconnect tests are completed.

## Chantier routing

Chantier potentiel: non. The existing `ShipGlowz Managed Agent Cockpit MVP` specification already owns this work. This research changes its runtime boundary and dependency assumptions and requires a spec amendment plus readiness recheck, not a second competing chantier.

## Sources

1. [OpenAI Codex app-server README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md)
2. [T3 Code repository and MIT license](https://github.com/pingdotgg/t3code)
3. [T3 Code architecture](https://github.com/pingdotgg/t3code/blob/main/docs/internals/overview.md)
4. [T3 Code remote access](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md)
5. [T3 Code environment authentication](https://github.com/pingdotgg/t3code/blob/main/docs/internals/environment-auth.md)
6. [Flutter supported deployment platforms](https://docs.flutter.dev/reference/supported-platforms)
7. [Flutter Web support](https://docs.flutter.dev/platform-integration/web)
8. [Flutter Windows deployment](https://docs.flutter.dev/deployment/windows)
9. [`flutter_chat_ui` package](https://pub.dev/packages/flutter_chat_ui)
10. [`web_socket_channel` package](https://pub.dev/packages/web_socket_channel)
11. [Supabase Flutter quickstart and platform support](https://supabase.com/docs/guides/getting-started/quickstarts/flutter)
12. [Clerk Flutter package](https://pub.dev/packages/clerk_flutter)
13. [Firebase Flutter platform matrix](https://firebase.google.com/docs/flutter/setup)
14. [Auth0 Flutter Windows quickstart](https://auth0.com/docs/quickstart/native/flutter-windows)
15. [Webmux repository](https://github.com/windmill-labs/webmux)
16. [Happier repository](https://github.com/happier-dev/happier)
17. [Handler repository](https://github.com/Launchable-AI/handler.dev)
18. [CloudCLI repository](https://github.com/siteboon/claudecodeui)
19. [Yep Anywhere repository](https://github.com/kzahel/yepanywhere)
20. [Harnss repository](https://github.com/OpenSource03/harnss)
21. [OpenTag](https://getopentag.com/)
22. [`xterm.dart` Flutter package](https://pub.dev/packages/xterm)
23. [xterm.js repository](https://github.com/xtermjs/xterm.js)
24. [ttyd repository](https://github.com/tsl0922/ttyd)
25. [Maestro product](https://www.maestrodev.ai/)
26. [RunMaestro/Maestro repository](https://github.com/RunMaestro/Maestro)
27. [Maestro workflow overview](https://docs.runmaestro.ai/about/overview)
28. [ReinaMacCredy/maestro CLI](https://github.com/ReinaMacCredy/maestro)
29. [GitHub code-quality surfaces](https://docs.github.com/en/code-security/how-tos/maintain-quality-code/explore-code-quality)
30. [just-bash repository and security model](https://github.com/vercel-labs/just-bash)
31. [Vercel Ship 2026 recap](https://vercel.com/blog/vercel-ship-2026-recap)
32. [Vercel Open Agents reference app](https://github.com/vercel-labs/open-agents)
33. [AI SDK 7 changelog](https://vercel.com/changelog/ai-sdk-7)
34. [Vercel Sandbox documentation](https://vercel.com/docs/sandbox)
35. [WorkflowAgent overview](https://vercel.com/kb/guide/what-is-workflowagent)
36. [Vercel HarnessAgent announcement](https://vercel.com/changelog/program-agent-harnesses-with-ai-sdk)
37. [Vercel Connect short-lived credential guide](https://vercel.com/kb/guide/vercel-connect)
38. [Vercel AI Gateway model and provider documentation](https://vercel.com/docs/ai-gateway/models-and-providers)
39. [Vercel AI Gateway coding-agent documentation](https://vercel.com/docs/ai-gateway/coding-agents)
40. [Vercel AI Gateway budget controls](https://vercel.com/changelog/budgets-for-api-keys-on-ai-gateway)
41. [OpenCode ACP documentation](https://dev.opencode.ai/docs/acp/)
42. [Kilo CLI runtime architecture](https://kilo.ai/docs/contributing/architecture/cli-runtime)
43. [ACP registry](https://agentclientprotocol.com/get-started/registry)
44. [Vercel Agent documentation](https://vercel.com/docs/agent)
