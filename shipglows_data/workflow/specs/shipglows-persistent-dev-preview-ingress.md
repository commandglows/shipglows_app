---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.3"
project: "shipglows_app"
created: "2026-08-18"
created_at: "2026-08-17 22:23:23 UTC"
updated: "2026-08-18"
updated_at: "2026-08-18 02:55:35 UTC"
status: ready
source_skill: "101-sg-ready"
source_model: "GPT-5 Codex"
scope: "shipglows-persistent-dev-preview-ingress"
owner: "Diane"
confidence: high
user_story: "En tant qu'operatrice ShipGlows, je veux ouvrir chaque devserver permanent dans l'application via une URL stable et privee, afin de voir mes previews a distance sans tunnel SSH, port public ni onglet externe."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Flutter Web"
  - "ShipGlows managed runner"
  - "ShipGlows Linux CLI"
  - "Caddy system ingress"
  - "Caddy user-mode project router"
  - "Vercel DNS"
  - "PM2 and Flutter Web devservers"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-cloud-dev-gateway-foundation.md"
    artifact_version: "1.0.1"
    required_status: "ready"
supersedes: []
evidence:
  - "Operator decision 2026-08-18: remote previews inside ShipGlows App are the immediate product need; SSH tunnels and separate browser tabs are rejected as the normal workflow."
  - "Repository inspection 2026-08-18: the CLI already generates path-based Caddy routes from PM2, but path prefixes are fragile for absolute assets and devserver HMR."
  - "Repository inspection 2026-08-18: Studio preview is a separate instrumented semantic bridge with production enablement forbidden; generic dev preview must not reuse or weaken that contract."
  - "Hosted proof 2026-08-18: the Preview surface exposes automatic and operator-triggered browser recovery guidance with retry, first-party new-tab fallback and URL copy actions on app.shipglows.com."
  - "Hosted proof 2026-08-18: a blocked Vivaldi iframe remains paired with a persistent diagnostic action, while bounded authenticated client events are emitted as secret-free structured PM2 logs."
next_step: "/102-sg-start ShipGlows Persistent Dev Preview Ingress"
---

# Spec: ShipGlows Persistent Dev Preview Ingress

🟢 [shipglows_app] spec: ShipGlows Persistent Dev Preview Ingress | status: ready | path: shipglows_data/workflow/specs/shipglows-persistent-dev-preview-ingress.md | next: /102-sg-start ShipGlows Persistent Dev Preview Ingress

## Title

ShipGlows Persistent Dev Preview Ingress

## Status

Ready security and product contract after a SAFE `/101-sg-ready` verdict on 2026-08-18. Stable subdomains, one-time POST bootstrap, host-only cookie, HTTP/WebSocket authorization, exact-Host routing and Studio separation are complete and executable. No public ingress, DNS, certificate or preview availability is claimed before implementation and the separate rollout proof.

## User Story

En tant qu'operatrice ShipGlows, je veux ouvrir chaque devserver permanent dans l'application via une URL stable et privee, afin de voir mes previews a distance sans tunnel SSH, port public ni onglet externe.

## Minimal Behavior Contract

Given an authenticated operator selecting a running catalog project, ShipGlows establishes a short private preview session and embeds the project at its stable HTTPS subdomain inside the app. Every HTTP asset request and WebSocket upgrade is authorized before reaching the loopback devserver; an unauthenticated, expired, wrong-host or stopped-project request is denied without revealing ports or paths. The easiest missed edge case is HMR: the same host, cookie and authorization policy must cover the upgrade while preserving root-relative assets and client-side routing.

## Success Behavior

- Each preview-capable project has one immutable DNS-safe origin such as `https://<slug>.preview.shipglows.com`.
- Flutter first performs an authenticated short-lived session bootstrap POST; no bearer, ticket or cookie appears in a URL.
- The preview host sets a host-only `HttpOnly`, `Secure`, bounded-lifetime cookie after exact actor/project/host validation.
- Caddy authorizes every subsequent HTTP request and WebSocket upgrade through a private runner endpoint before proxying to the catalog-owned loopback port.
- The inner CLI-managed Caddy router selects the upstream by exact Host, preserving root-relative assets, SPA routing and HMR.
- Flutter embeds the preview in a dedicated Preview surface without opening a separate tab and shows explicit starting, ready, reconnecting, stopped, expired and denied states.
- Browser refresh can bootstrap a fresh preview session without changing the stable project URL.

## Error Behavior

- Direct unauthenticated access returns a bounded denial page/status and never the devserver response.
- Wrong host/project pairing, unknown slug, stopped process, stale catalog, invalid cookie, replayed bootstrap or expired session returns denial before proxying.
- Bootstrap requires exact allowed app Origin and valid Firebase actor/project membership; native callers follow a separately authenticated client contract and cannot bypass host binding.
- HMR upgrade authorization failure closes with a bounded code and triggers Flutter reconnect guidance, not a public port fallback.
- Certificate issuance is denied for hosts not present in the validated catalog.
- Devserver headers cannot disable ShipGlows frame policy or expose a broader parent origin.
- Runner/Caddy failure leaves the project process unchanged and displays recoverable unavailability.

## Problem

Current devservers are loopback services managed well by CLI/PM2/tmux, but remote access requires manual tunnels. Existing path-based proxy routes can break absolute asset paths, SPA routers and HMR, while opening ports or publishing raw devservers would expose source maps, debug APIs and development credentials.

## Solution

Use stable per-project preview subdomains. A root-managed public Caddy terminates TLS, validates on-demand certificate names against a runner allowlist, mediates preview authentication and forwards approved traffic to the existing user-mode Caddy. The CLI changes its generated routes from path matching to exact Host matching and retains port ownership. Flutter obtains a cookie through an authenticated POST and embeds the resulting origin. Generic Preview remains separate from the instrumented Studio/Laboratory contract.

## Scope In

- Stable preview-origin and slug contract based on the cloud project catalog.
- Runner bootstrap, cookie verification, per-request authorization and TLS-name allowlist endpoints.
- Caddy public HTTP/WebSocket authorization and inner exact-Host routing.
- HMR, root-relative asset, SPA route and reconnect behavior.
- Flutter Web Preview surface, bootstrap transport and embedded-frame lifecycle.
- Security headers, frame ancestry, no-store bootstrap and redacted observability.

## Scope Out

- Studio semantic anchors, visual commands, Laboratory, variants or compile-to-code.
- Public unauthenticated sharing, customer previews or multi-user tenant sharing.
- Raw port exposure, SSH tunnels, ngrok-style third-party tunnels or path-prefix URLs.
- Project process start/stop/restart from Flutter.
- Native mobile WebView delivery beyond shared contract compatibility in this milestone.
- DNS/CAX11 mutation and production proof, owned by the rollout spec.

## Constraints

- App production origin is `https://app.shipglows.com`; preview origins stay beneath the same registrable domain.
- Bootstrap secret/ticket is sent in an authenticated POST body/header only, never URL/query/fragment/referrer/history/log.
- Cookie is host-only, HttpOnly, Secure, short-lived and bound server-side to actor, project and preview host.
- Public Caddy never trusts a client-supplied upstream port; routing comes only from the validated CLI catalog.
- Devservers remain loopback-only; firewall never opens their port range.
- Exact Origin and Host checks apply to bootstrap and WebSocket paths.
- Preview frame styling/layout consumes the canonical Flutter design tokens and preserves keyboard/focus/accessibility states.

## Test Contract

- Surface/profile: runner route/auth tests, Caddy fixture validation, CLI host-route tests, real local Astro/Vite/Flutter fixtures and Flutter Web widget/browser tests.
- Automated order: contract/parser -> cookie/bootstrap -> HTTP auth -> WS/HMR auth -> inner host routing -> Flutter states -> complete regressions.
- Browser order: authenticated bootstrap, iframe load, root assets, SPA deep link, HMR upgrade/reload, expiry/rebootstrap, direct unauthenticated denial and hostile-origin denial.
- Hosted proof is excluded until rollout authority; local HTTPS fixtures or injected proxies do not establish production certificate or DNS readiness.
- Current official Caddy documentation for `forward_auth`, WebSocket proxying and on-demand TLS `ask` must be rechecked immediately before implementation.

## Dependencies

- Cloud Dev Gateway catalog and fixed operator authorization.
- Existing CLI user-mode Caddy lifecycle and PM2/Flutter registries.
- Existing runner Fastify auth/origin policies and Flutter managed-runner token provider.
- Vercel DNS capability and root-managed Caddy access, exercised only by rollout.

## Invariants

- No raw devserver is reachable without runner authorization.
- Stable public origin never encodes an internal port or filesystem path.
- Bootstrap credentials never appear in URLs.
- Unknown/stale catalog entries cannot obtain certificates or proxy traffic.
- Generic Preview cannot advertise or accept Studio semantic commands.
- Proxy failure never mutates source or restarts a project.

## Links & Consequences

- Upstream: catalog slug/status/upstream changes refresh inner Caddy atomically.
- Downstream: Flutter Projects exposes Preview capability and opens the dedicated embedded surface.
- Studio: may reuse a proven private-ingress primitive later, but its instrumentation/compile guarantees remain separately governed.
- Operations: certificate, cookie and authorization diagnostics require redacted bounded codes.
- Product before -> after: manual SSH tunnel and external tab -> one stable private in-app preview origin.

## Documentation Coherence

- Update runner foundation, architecture, runtime boundary and a new preview-ingress operator guide when implemented.
- Update CLI Caddy documentation for exact-Host routing and rollback.
- Public content remains unchanged until production denial and authorized browser proof both pass.

## Edge Cases

- Zero: no preview-capable projects; no certificate or route is admitted.
- One: one project bootstraps one host-only session and loads assets/HMR.
- Many: concurrent project hosts/cookies remain isolated; duplicate slug is rejected before routing.
- Boundaries: ticket/session TTL, cookie size, request/header/body limits, host/slug length, WS payload/rate and concurrent preview count.
- Interfaces: browser Origin/Host/cookie, runner authorization response and Caddy upstream headers are closed and versioned.
- Exceptions: expired cookie, catalog change, stopped/restarted process, late Caddy reload, WS disconnect and certificate denial recover without public fallback.

## Implementation Tasks

1. Define preview origin, bootstrap and authorization contracts plus hostile fixtures.
2. Extend CLI Caddy generation in its owned batch to exact-Host routes sourced from catalog v1; prove atomic config validation and rollback.
3. Add new runner preview modules for bootstrap, cookie, host authorization and TLS-name admission; prove replay/expiry/cross-project denial.
4. Add a dedicated Flutter Preview transport/provider/frame and project navigation using design tokens; prove user states and no external-tab dependency.
5. Integrate shared runner/Flutter/Caddy templates sequentially after isolated batches pass.
6. Run local browser/HMR/denial proof and reconcile documentation without a hosted claim.

## Acceptance Criteria

- `PDI-001`: each eligible project exposes exactly one stable HTTPS origin without port/path leakage.
- `PDI-002`: bootstrap secret is absent from URL, referrer, history, diagnostics and access logs.
- `PDI-003`: unauthenticated HTTP and WS requests never reach the devserver.
- `PDI-004`: wrong actor/project/host, expired/replayed bootstrap and hostile Origin fail closed.
- `PDI-005`: root assets, SPA deep links and HMR function through the same authorized host.
- `PDI-006`: unknown catalog slugs cannot trigger certificate issuance.
- `PDI-007`: Flutter renders Preview in-app with recovery states and canonical design tokens.
- `PDI-008`: no Studio capability, semantic command or compile claim is introduced.
- `PDI-009`: a connected-but-empty frame always retains a visible recovery action, and every reported incident receives a bounded correlation ID without logging cookies, tokens, terminal input or Preview content.
- ZOMBIES coverage: zero/one/many preview hosts; boundary TTL/header/body/WS/slug limits; interfaces across Flutter-runner-Caddy-devserver; exceptional expiry/replay/reload/HMR/process failure; simplest solution retains the existing two Caddy ownership layers.

## Test Strategy

- Runner unit/route tests with deterministic clock, nonce store, fake Firebase actor and fake catalog.
- Caddy config fixtures and local proxy tests for host preservation, forward auth, response headers and WebSocket upgrade.
- Real local Astro/Vite/Flutter devserver fixtures for assets, client routing and HMR.
- Flutter widget and browser tests for bootstrap, iframe lifecycle, accessibility, resize, reconnect and denial.
- Secret-marker scans across responses/log fixtures plus complete runner/Flutter regression and metadata checks.

## Risks

- Preview credential theft/replay: one-time bootstrap, short cookie, exact host/actor binding and redacted logs.
- On-demand TLS abuse: runner `ask` admits only known eligible slugs with rate limits.
- Proxy bypass: loopback upstreams and firewall denial of devserver ports.
- Third-party cookie restrictions: same-site custom app/preview domains and first-party host-only bootstrap are mandatory for Web proof.
- Devserver header incompatibility: Caddy enforces exact frame ancestry and tested header normalization.
- HMR drift: framework fixtures prove HTTP and WS together before a project is declared preview-ready.

## OWASP Security Gate

- Top 10 considered: A01 host/project access control, A02 TLS/CORS/cookie/frame configuration, A04 HTTPS and secret handling, A05 Host/header/upstream injection, A06 replay/certificate/abuse design, A07 session bootstrap, A08 catalog/cookie integrity, A09 redacted denial evidence and A10 proxy/WS/certificate failure.
- Trust/data boundaries: Flutter bearer -> preview bootstrap; cookie -> Caddy/runner authorization; catalog host -> loopback upstream; untrusted devserver response -> framed browser surface.
- Selected ASVS v5.0.0: `v5.0.0-3.4.2`, `v5.0.0-3.4.3`, `v5.0.0-3.4.6` for origin/CSP/frame boundaries, `v5.0.0-3.3.1` for session cookie protections, `v5.0.0-5.1.4` for Host/slug validation, `v5.0.0-12.1.1` for TLS and `v5.0.0-13.2.1` for API authorization; readiness must verify exact current wording.
- Proof: unauthenticated/cross-project/host/replay fixtures, HMR upgrade denial, direct-port firewall proof and secret/log scans.
- Residual gap/owner: real DNS, certificates, firewall and browser cookies require the rollout/release owner with separate authority.

## Execution Notes

- Write Batch PC-A is the single sequential CLI writer after the foundation and preview contracts are frozen. It owns both catalog v1 export and exact-Host user-mode Caddy routing, including HMR/lifecycle tests, with the complete write set `cli/config.sh`, `cli/lib.sh`, `cli/install.sh`, and `tests/cli/**`; no separate preview CLI batch or parallel CLI writer exists.
- Runner preview batch owns only new `runner/src/preview/**`, `runner/test/preview/**` and their focused fixtures.
- Flutter batch owns only new preview transport/provider/view/widget files and focused tests.
- Sequential integration owns existing runner config/app/main, Flutter API/router/providers, deployment templates and docs.
- Operator Workspace and Visual Studio files are outside this implementation batch.

## Open Questions

None. Stable subdomains, authenticated POST bootstrap, host-only cookies, dual Caddy ownership and separation from Studio are fixed by this contract.

## Skill Run History

| Timestamp (UTC) | Skill | Model | Action | Result | Next |
| --- | --- | --- | --- | --- | --- |
| 2026-08-18 02:55:35 UTC | sg-bug | GPT-5 Codex | Repaired the silent gray Preview state with a persistent diagnostic banner and added an authenticated, rate-limited, closed-schema diagnostic endpoint emitting redacted structured PM2 logs. | Flutter tests 8/8, Runner diagnostic route 1/1, typecheck, targeted lint, hosted Vivaldi blocked-frame rendering and production health passed. | Use the displayed correlation ID for direct PM2 diagnosis when a user reports an incident. |
| 2026-08-18 02:37:23 UTC | sg-development | GPT-5 Codex | Added a bounded browser-block recovery state to the generic Preview, including timeout/error guidance, permanent help access, retry, user-gesture new-tab fallback and URL copy. | Flutter widget tests 8/8 and targeted analysis passed; production Vercel build deployed and the hosted help surface was rendered on app.shipglows.com. | Continue the remaining ingress/browser proof under the Personal Cloud rollout. |
| 2026-08-17 22:45:49 UTC | 101-sg-ready | GPT-5 Codex | Rechecked canonical structure, dependency freshness, ticket/cookie secrecy, HTTP plus WebSocket/HMR authorization, exact Host/Origin boundaries, Studio separation, OWASP, ZOMBIES and the single sequential PC-A CLI writer. | SAFE; metadata 4/4, structural and diff checks passed, and no unresolved readiness blocker remains | /102-sg-start ShipGlows Persistent Dev Preview Ingress |
| 2026-08-17 22:23:23 UTC | 100-sg-spec | GPT-5 Codex | Specified stable authenticated dev-preview ingress without replacing the CLI or conflating Studio. | reviewed; readiness and fresh Caddy documentation review required | /101-sg-ready ShipGlows Persistent Dev Preview Ingress |

## Current Chantier Flow

`100-sg-spec` (reviewed) -> `101-sg-ready` (SAFE; ready) -> `102-sg-start` (active; browser-recovery slice deployed) -> `103-sg-verify` (slice verified; full ingress proof remains) -> `104-sg-end` (not started) -> `005-sg-ship` (not authorized) -> `004-sg-deploy` (browser-recovery slice live; full rollout remains owned by personal-cloud rollout)
