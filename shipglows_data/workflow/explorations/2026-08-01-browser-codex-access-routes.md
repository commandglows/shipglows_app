---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "shipglows_app"
created: "2026-08-01"
updated: "2026-08-01"
status: superseded
source_skill: "700-sg-explore"
scope: "browser-codex-access-routes"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "tmux"
  - "Codex CLI"
  - "ttyd"
  - "Caddy"
  - "Hetzner Cloud Console"
  - "Flutter Web"
  - "Flutter Android"
  - "ShipGlows managed runner"
  - "OpenAI Codex app-server"
  - "Neovim"
  - "code-server"
  - "VS Code Remote Tunnels"
  - "Microsoft dev tunnels"
  - "Warp"
  - "Coder"
evidence:
  - "The current Hetzner host has tmux, Caddy, and Neovim; ttyd and code-server are not installed."
  - "The operator's active tmux session contains ten windows and is the immediate remote-access target."
  - "shipglows_app already contains a ready Managed Codex Cockpit MVP specification plus partially started Flutter projection and runner foundation work."
  - "Official ttyd documentation supports browser terminals, custom commands, reverse-proxy authentication headers, origin checks, and writable sessions."
  - "Official OpenAI documentation positions codex app-server as the rich-client interface for durable threads, turns, typed items, streaming events, interruption, and approvals."
  - "Operator correction 2026-08-01: the Hetzner provider console is unusable for daily work because of keyboard mapping, zoom, and terminal rendering problems."
  - "Official VS Code documentation supports a zero-install vscode.dev client connected to the existing Hetzner compute through an authenticated outbound Remote Tunnel, including a remote integrated terminal."
  - "The current host is Ubuntu 24.04 AArch64 with glibc 2.39 and an active user service manager, matching Microsoft's documented Ubuntu 20.04+ AArch64 and glibc 2.28+ remote-host baseline."
  - "Official Warp documentation says its normal web surface can view shared sessions and objects but cannot execute shell commands; the open-source client and Warp-hosted agent platform do not provide a drop-in self-hosted backend for this use case."
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes: []
superseded_by: "shipglows_data/workflow/research/flutter-codex-cockpit-open-source-architecture.md"
next_step: "Use the expanded research report flutter-codex-cockpit-open-source-architecture.md; the proprietary VS Code Remote Tunnels recommendation is withdrawn."
---

# Exploration Report: Browser Access To tmux And Managed Codex

> Superseded on 2026-08-01 after a broader open-source scan and operator correction. The VS Code Remote Tunnels recommendation and the rejection of a Flutter terminal are withdrawn. The current decision lives in `shipglows_data/workflow/research/flutter-codex-cockpit-open-source-architecture.md`: one ShipGlows Flutter product may safely combine a semantic Codex Cockpit with a separately authorized terminal/tmux/Neovim operator workspace.

## Starting Question

Which route should be built first to make current tmux panes containing Codex accessible from any modern browser without a client install, while preserving the longer-term ShipGlows Flutter application that manages Codex conversations across projects? Which routes should be abandoned?

## Context Read

- `shipglows/CLAUDE.md` - confirmed the existing server-first PM2 and Caddy operating model.
- `shipglows_data/technical/local-tunnels-and-mcp-login.md` - confirmed that native Windows currently exposes only a selected SSH tunnel and that the Hetzner browser console is the immediate no-install fallback.
- `shipglows_app/app/CLAUDE.md` and `AGENT.md` - confirmed the Flutter Web/Android product boundary and the high-risk terminal/agent security rules.
- `shipglows-managed-codex-cockpit-mvp.md` - found an existing ready specification that already chooses a semantic Codex client over terminal emulation.
- `shipglows_app/runner/**` and active Flutter Cockpit files - confirmed that runner scaffolding and five-dimensional Cockpit projection work have started but the Codex adapter and conversation interface are not yet implemented.
- Host checks - found Caddy, Neovim, one attached tmux session with ten windows, and no current ttyd or code-server installation.

## Internet Research

- [ttyd official repository](https://github.com/tsl0922/ttyd) - Accessed 2026-08-01 - established that ttyd can expose a custom command in modern browsers, defaults to read-only, supports explicit writable mode, origin checks, TLS, basic authentication, and reverse-proxy authentication headers.
- [Caddy reverse_proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy) - Accessed 2026-08-01 - confirmed native WebSocket upgrade and bidirectional tunnel support.
- [Caddy basic_auth documentation](https://caddyserver.com/docs/caddyfile/directives/basic_auth) - Accessed 2026-08-01 - confirmed hashed-password authentication and the prohibition on plaintext passwords in Caddy configuration.
- [Securely Access and Expose code-server](https://coder.com/docs/code-server/guide) - Accessed 2026-08-01 - established code-server's browser IDE, terminal, port proxy, WebSocket, password-authentication, and external-auth capabilities, as well as its warning against unauthenticated public exposure.
- [Codex app-server README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md) - Accessed 2026-08-01 - confirmed durable threads, turns, typed events, interruptions, approvals, and rich-client integration contracts.
- [Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/) - Accessed 2026-08-01 - confirmed that app-server is the intended UI-ready integration boundary and supports reconnectable, structured conversations rather than ANSI terminal replay.
- [Neovim GUI documentation](https://neovim.io/doc/user/gui/) - Accessed 2026-08-01 - confirmed that Neovim supports alternative UI clients but does not itself provide the secure browser transport, hosting, or authentication required here.
- [Hetzner Cloud console documentation](https://docs.hetzner.com/cloud/servers/getting-started/vnc-console/) - Accessed 2026-08-01 - supported the existing emergency no-install route through the provider console.
- [Developing with VS Code Remote Tunnels](https://code.visualstudio.com/docs/remote/tunnels) - Accessed 2026-08-01 - confirmed a zero-SSH browser client, GitHub/Microsoft authentication on both ends, outbound-only Microsoft dev-tunnel transport, remote VS Code Server execution, persistent service mode, and a `vscode.dev` URL.
- [VS Code for the Web](https://code.visualstudio.com/docs/remote/vscode-web) - Accessed 2026-08-01 - distinguished browser-only repository editing from Remote Tunnels, which add the remote runtime and integrated terminal needed to attach tmux.
- [VS Code Remote Development with Linux](https://code.visualstudio.com/docs/remote/linux) - Accessed 2026-08-01 - confirmed Ubuntu 20.04+ AArch64 support and the glibc 2.28+ baseline, which the current Ubuntu 24.04 AArch64/glibc 2.39 host satisfies; native extensions can still have architecture-specific limits.
- [Warp open-source repository](https://github.com/warpdotdev/warp) - Accessed 2026-08-01 - confirmed that Warp's client is open source and its public web-compiled terminal is presented in the Warp/Oz contribution platform rather than as a general self-hostable tmux gateway.
- [Warp Drive on the web](https://docs.warp.dev/knowledge-and-collaboration/warp-drive/web) - Accessed 2026-08-01 - confirmed broad browser/mobile viewing and touch support but explicitly no shell command execution in the ordinary web surface.
- [Coder documentation](https://coder.com/docs) - Accessed 2026-08-01 - established Coder as a self-hosted control plane for multiple development workspaces and agents, with code-server or another web IDE as an attached workspace application.

## Problem Framing

The apparent choice between a browser terminal, Flutter, and Neovim combines two different products:

```text
Operator continuity                         ShipGlows product
──────────────────                         ─────────────────
Resume the exact existing tmux state       Manage projects and Codex threads
Keep current Codex CLI sessions            Render typed messages and approvals
Full shell authority is acceptable         Shell authority must stay hidden
One trusted operator                       Future authenticated users/tenants
Fastest useful result matters              Durable UX and policy matter
```

A single implementation should not serve both boundaries. The personal surface is equivalent to remote shell access and can expose tmux faithfully. The product surface should expose semantic Codex capabilities through the managed runner and must not expose a shell, PTY, tmux, ANSI stream, filesystem path, or raw app-server transport.

## Option Space

### Option A: Hetzner browser console

- Summary: use the existing provider console now, log into the server, then attach the active tmux session.
- Pros: zero installation on the client and independent recovery access when every application-level path fails.
- Cons: the operator has proved that keyboard mapping, zoom, font rendering, and daily terminal ergonomics are unacceptable.
- Decision: recovery console only. Remove it from every daily-work recommendation.

### Option B: VS Code Server through Remote Tunnels

- Summary: install only the standalone VS Code CLI on Hetzner, register an authenticated outbound Remote Tunnel, and open the server in `vscode.dev`; attach the existing tmux session from VS Code's integrated terminal.
- Pros: no client installation, no SSH or inbound port, GitHub/Microsoft account gate, familiar editor/terminal UI, browser zoom and font controls, server-side files/extensions, integrated port forwarding, and service mode for persistence.
- Cons: depends on Microsoft's hosted tunnel and licensing terms; traffic traverses the Microsoft dev-tunnel service; usage limits exist; the browser terminal still needs Windows/mobile keyboard proof; this remains full operator shell authority rather than a product boundary.
- Decision: recommended first pilot and likely first daily operator route.

### Option C: Private ttyd-to-tmux console behind Caddy

- Summary: run ttyd only on a loopback address or Unix socket and make its sole command attach the operator's tmux session; expose it through Caddy HTTPS and an authentication layer.
- Pros: fastest faithful access to all current panes; no browser installation; fits the existing Caddy host; minimal resource footprint; does not require rebuilding Codex or tmux state.
- Cons: grants effective shell authority; mobile keyboard ergonomics remain terminal-like; authentication, origin, session, logging, and exposure rules are release blockers.
- Decision: self-hosted fallback if Remote Tunnels is unreliable, too dependent on Microsoft, or insufficiently ergonomic after real device proof.

### Option D: code-server with an attached tmux terminal

- Summary: serve a complete VS Code-like browser IDE and attach tmux in its integrated terminal.
- Pros: excellent browser editing, file navigation, integrated terminals, and application-port proxying.
- Cons: larger runtime and attack surface; duplicates editor features not required by the immediate goal; tmux is only one panel inside a more complex IDE.
- Decision: preferred self-hosted VS Code route if ownership of the access layer matters more than the simplicity of Remote Tunnels. For one operator on one existing host, start with Remote Tunnels before operating this extra public service.

### Option E: Coder control plane

- Summary: deploy Coder to provision and govern one or more remote workspaces, agents, web terminals, and code-server applications.
- Pros: self-hosted control plane, workspace lifecycle, identity integration, future multi-user/agent isolation, and strong fit if ShipGlows later provisions separate environments per project or customer.
- Cons: Terraform/workspace/container concepts and significantly more operations than required to attach one existing tmux session on one server.
- Decision: strong future platform candidate, but overkill for the first personal access route.

### Option F: Warp client and Warp web/Oz surfaces

- Summary: use the newly open-source Warp client or its hosted agent/session experience as the workbench.
- Pros: excellent agent-first terminal UX, session concepts, mobile-aware web rendering, and a valuable design reference for ShipGlows conversations.
- Cons: the native client requires installation; Warp Drive web explicitly has no shell execution; the showcased web terminal is tied to Warp/Oz workflows; adopting the repository would mean integrating a large Rust/AGPL client plus non-equivalent hosted backend contracts.
- Decision: use as UX and architecture inspiration. Do not fork it or select it as the backend for the first ShipGlows route.

### Option G: Neovim as the primary application

- Summary: build an agent cockpit as a Neovim plugin or remote UI.
- Pros: powerful keyboard-first workflows and good fit for expert terminal operators.
- Cons: Neovim does not solve browser delivery, TLS, authentication, mobile access, or tmux transport; a hosted terminal or browser IDE is still required underneath; it narrows the audience to editor users.
- Decision: reject as the primary cross-platform route. Neovim remains a tool that can run inside the browser terminal or code-server terminal.

### Option H: Flutter terminal emulator

- Summary: embed a terminal/ANSI client in Flutter Web and connect it to a custom PTY/tmux backend.
- Pros: one branded shell and potential Web/Android reuse.
- Cons: rebuilds ttyd's hardest parts, creates a public PTY protocol, conflicts with the ready product spec, materially enlarges security and accessibility scope, and delays immediate value.
- Decision: reject for the MVP and avoid unless a future operator-only product contract proves a unique need that ttyd cannot satisfy.

### Option I: Flutter semantic Codex Cockpit through app-server

- Summary: continue the existing ready specification: Flutter displays projects and normalized Codex threads while a private managed runner controls `codex app-server` locally.
- Pros: correct product abstraction; browser and Android reuse; durable threads; structured progress, diffs, approvals, interruption, and recovery; no user SSH/tmux/server administration.
- Cons: substantially larger implementation; requires auth, repository authorization, isolation, persistence, quotas, redaction, and operational proof before live execution.
- Decision: recommended long-term product lane, but not the fastest route to current tmux panes.

## Comparison

| Route | Exact current panes | Browser-only client | Time to first value | Product UX | Security surface | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Hetzner console | yes | yes | immediate | operator-proved unusable | broad console access | recovery only |
| VS Code Remote Tunnels | yes, through integrated terminal | yes | shortest | strong browser IDE | full shell through Microsoft tunnel | pilot first |
| ttyd + Caddy | yes | yes | short | focused terminal | high self-hosted operator shell | fallback |
| code-server | yes | yes | short/medium | full self-hosted browser IDE | public service to secure and operate | second choice |
| Coder | yes through workspace terminal | yes | medium/long | workspace platform | larger self-hosted control plane | future scale |
| Warp | not from ordinary web surface | partly | uncertain | excellent inspiration | hosted/backend coupling | reference only |
| Neovim app/plugin | indirect | no, not by itself | long | expert-only | still needs transport | reject as primary |
| Flutter terminal | yes after major work | yes | long | branded terminal | very high/custom | reject for MVP |
| Flutter + app-server | no raw panes; semantic threads | yes | long | strongest product | high managed-agent boundary | continue as product |

## Emerging Recommendation

Adopt two explicit lanes and validate them in this order:

```text
First operator pilot
  Browser -> vscode.dev -> Microsoft Remote Tunnel
                       -> VS Code Server on Hetzner
                       -> integrated terminal -> tmux
                                             daily operator workspace

Self-hosted fallback
  Browser -> HTTPS/auth -> Caddy -> code-server or ttyd -> tmux
                                             operator-owned access path

Product build
  Flutter Web/Android -> authenticated API/SSE -> managed runner
                                              -> codex app-server
                                             semantic ShipGlows Cockpit
```

The first move should be a VS Code Remote Tunnels pilot, not a custom terminal build. Hetzner remains the compute backend; VS Code Server is the remote workspace layer; `vscode.dev` is the zero-install browser client; tmux remains the session authority. This directly tests the real keyboard, zoom, font, paste, resize, reconnect, file navigation, and preview-port experience on the new Windows machine before ShipGlows owns another web service.

If that pilot is good, keep it as the private operator route. If Microsoft dependency, usage limits, or device ergonomics are unacceptable, move to code-server behind the existing Caddy infrastructure. ttyd remains useful only when a focused terminal is preferable to a complete browser workspace.

Warp should influence the design language of the future Cockpit—project/session navigation, agent activity, steerability, and readable terminal-derived events—but it should not become the access backend. Its ordinary web surface cannot execute shell commands, while its web-compiled terminal and Oz workflows are a hosted Warp product rather than a documented drop-in self-hosted tmux service.

The existing Managed Codex Cockpit specification should remain the product authority. Its core decision is still correct: use `codex app-server` for threads, turns, typed items, approvals, and reconnection; do not scrape or stream tmux output into Flutter.

## Security Boundary For Personal Browser Access

- Treat access to the Remote Tunnel as equivalent to SSH: the same authenticated GitHub/Microsoft identity must own both tunnel registration and browser connection.
- Run the tunnel as the intended non-root operator account; do not expose a root workspace.
- Install persistent service mode only after the interactive pilot proves the right account, folder, terminal, and tmux behavior.
- Record how to unregister the tunnel and revoke account access if a browser or GitHub/Microsoft account is compromised.
- Do not treat Microsoft authentication as ShipGlows product authorization or expose this route to future customers.
- If moving to code-server/ttyd, bind it locally, terminate TLS at Caddy, use SSO/MFA or a strongly rate-limited authentication boundary, and never expose the backend port directly.
- Keep the Hetzner console only as last-resort infrastructure recovery, despite its unusable daily UX.

## Non-Decisions

- Whether VS Code Remote Tunnels passes real Windows keyboard, zoom, paste, tmux-prefix, reconnect, and port-preview proof.
- Whether the Microsoft-hosted tunnel dependency is acceptable for long-term private operator use.
- If self-hosting becomes necessary, whether the richer code-server workspace or the smaller ttyd terminal is the better fallback.
- Whether Coder becomes justified when ShipGlows needs isolated workspaces for several users, projects, or concurrent agents.
- Flutter MVP deployment credentials, production runner host, and provider configuration remain governed by the existing ready specification.

## Rejected Paths

- One universal terminal-based architecture for both the operator and end users - combines incompatible trust and UX boundaries.
- Neovim as the browser transport - it is an editor/client, not the access layer.
- Forking Warp as the first backend - its open-source client is large, its ordinary web mode has no shell, and its hosted Oz/session infrastructure is not a drop-in self-hosted tmux gateway.
- A custom Flutter ANSI/PTY/tmux implementation - high effort, high security risk, and no validated advantage over ttyd.
- Publicly exposing ttyd, tmux, SSH, or raw Codex app-server - converts a convenience feature into remote machine takeover risk.
- Replacing the semantic Managed Codex Cockpit spec with tmux scraping - loses durable typed events, approvals, reconnect semantics, and product-level authorization.
- Guacamole, full VNC, or a broad server-admin cockpit as the first build - substantially more system surface than the tmux continuity goal requires.

## Risks And Unknowns

- Full-shell compromise: the private browser console is effectively SSH in a tab; authentication failure exposes the operator account and every reachable project.
- Multiple attachments: browser reconnects and concurrent tabs must not create duplicate tmux sessions or unexpected shared keystrokes.
- Remote Tunnel dependency: the access path relies on Microsoft dev tunnels, account availability, provider limits, and accepted server license terms.
- Mobile usability: browser compatibility is broad, but terminal modifier keys, selection, paste, and tmux prefixes still need device proof in vscode.dev.
- Session naming: the current session is named `0`; a stable named operator session or safe chooser may be preferable before automation.
- Self-hosted fallback lifecycle: if Remote Tunnels is rejected, ShipGlows's current Caddy lifecycle may require an explicit always-on ownership rule for code-server/ttyd instead of accidental coupling to preview apps.
- Dirty implementation state: the existing Cockpit spec, runner scaffolding, and Flutter projection changes are uncommitted and must be preserved and reviewed before resuming product implementation.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: no secrets; only repository paths, installed-tool state, tmux session count/name, and architecture documents.
- Redactions applied: none required.
- Notes: no host IP, credential, token, cookie, private key, private repository content, or raw terminal transcript is persisted.

## Decision Inputs For Spec

- User story seed: As the trusted ShipGlows operator, I can open an authenticated browser workspace on any modern device and resume my existing tmux/Codex session without installing SSH, WSL, a terminal, or an editor on the client device.
- Scope in seed: VS Code standalone CLI on Hetzner, authenticated Remote Tunnel, integrated-terminal tmux attachment, persistent service only after proof, desktop/mobile keyboard proof, file navigation, preview-port proof, access revocation, and recovery documentation.
- Scope out seed: public users, multi-tenancy, Flutter embedding, Warp fork, arbitrary public shell sharing, Codex app-server product integration, billing, and marketing exposure.
- Invariants/constraints seed: non-root operator account; same authenticated identity on tunnel host/client; no inbound listener; no credentials in logs; no claim that this is product auth; tmux remains session authority; Hetzner console remains recovery-only.
- Validation seed: correct GitHub/Microsoft authorization, unauthorized-account rejection, integrated-terminal Unicode/keyboard/zoom/paste/resize behavior, tmux attach/reconnect with no duplicate session, browser refresh recovery, port forwarding, service restart, tunnel unregister/revoke, and Windows plus one mobile-browser proof.

## Handoff

- Recommended next action: run a bounded VS Code Remote Tunnels pilot against the existing tmux session, then decide from real device proof whether a self-hosted code-server fallback is necessary.
- Why this next step: it offers the richest zero-install experience with the least new infrastructure, while keeping the existing Flutter Cockpit specification untouched as the semantic product route.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-08-01 20:42:04 UTC | Choose browser, Flutter, or Neovim route for tmux/Codex access | Inspected ShipGlows host capabilities, current tmux state, existing Flutter/runner work and ready spec; compared current official web-terminal, browser-IDE, Neovim, Caddy, and Codex app-server contracts | Split the problem into private operator continuity and semantic product lanes; recommend ttyd first and existing Flutter app-server spec second | Specify the operator-only ttyd/Caddy lane without changing the existing product contract |
| 2026-08-01 21:08:56 UTC | Correct unusable Hetzner-console assumption and evaluate VS Code cloud versus Warp | Rechecked official VS Code Remote Tunnels, Linux host prerequisites, code-server, Coder, Warp web/open-source, and Microsoft tunnel security contracts | Replaced ttyd-first with a VS Code Remote Tunnels pilot; confirmed host baseline compatibility; retained code-server as self-hosted fallback, Warp as inspiration, and Flutter app-server as product architecture | Prove the Remote Tunnel on the operator's Windows browser before selecting a durable self-hosted fallback |
