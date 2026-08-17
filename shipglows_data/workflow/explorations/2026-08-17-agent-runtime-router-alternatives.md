---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-08-17"
updated: "2026-08-17"
status: reviewed
source_skill: sg-docs
scope: "provider-neutral-agent-runtime-and-router-alternatives"
owner: Diane
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/agent-runtime/"
  - "shipglows_data/technical/architecture.md"
  - "shipglows_data/technical/managed-runner-foundation.md"
  - "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
evidence:
  - "Operator confirmation on 2026-08-17: the ShipGlows engine remains provider- and harness-agnostic."
  - "Official project documentation for ACP, AgentAPI, OpenHands, Agyn and Google AX reviewed on 2026-08-17."
depends_on:
  - artifact: "shipglows_data/technical/architecture.md"
    artifact_version: "2.5.0"
    required_status: reviewed
supersedes: []
next_review: "2026-09-17"
next_step: "Define an AgentRuntime adapter conformance matrix before authorizing any runtime dependency or proof of concept."
---

# Exploration Report: Agent runtime and router alternatives

## Starting Question

Should ShipGlows adopt HarnessRouter, OpenHands or another agent-routing project, and how should that choice fit the existing provider-neutral runner architecture?

## Context Read

- `shipglows_data/technical/architecture.md` - `AgentRuntime` owns sessions, turns, interruption, approvals, normalized events and capabilities; Codex app-server is already an adapter rather than the public API.
- `shipglows_data/technical/managed-runner-foundation.md` - the managed runner owns authentication, authorization, persistence, idempotency, workspaces, safety and normalized projections.
- `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md` - the Cockpit must consume ShipGlows contracts rather than provider-specific transports.

## Internet Research

- [HarnessRouter on Product Hunt](https://www.producthunt.com/products/epsilla) - Accessed 2026-08-17 - evaluated as a young unified harness API and the starting point for this comparison.
- [Agent Client Protocol](https://agentclientprotocol.com/get-started/agents) - Accessed 2026-08-17 - evaluated as the broadest open interoperability boundary across coding agents and clients.
- [Coder AgentAPI](https://github.com/coder/agentapi) - Accessed 2026-08-17 - evaluated as a lightweight HTTP wrapper around multiple coding-agent CLIs.
- [OpenHands Software Agent SDK](https://docs.openhands.dev/sdk/index) - Accessed 2026-08-17 - evaluated as an embeddable agent framework and production Agent Server.
- [Agyn](https://github.com/agynio/platform) - Accessed 2026-08-17 - evaluated as a Kubernetes-native, security-oriented platform for isolated agents.
- [Google Agent Executor](https://github.com/google/ax) - Accessed 2026-08-17 - evaluated as an early distributed runtime with durable events and resumability.
- [Coder Tasks](https://coder.com/docs/ai-coder/tasks) - Accessed 2026-08-17 - excluded because its documented deprecation makes it an unsuitable new foundation.

## Problem Framing

ShipGlows does not need a vendor product to become its public engine. It needs a stable internal runtime contract that can host several replaceable adapters while retaining ShipGlows-owned safety, persistence, observability, authorization and product semantics.

```text
Flutter Cockpit and ShipGlows API
               |
               v
     ShipGlows AgentRuntime
      |        |        |
      v        v        v
   Codex    Claude   OpenHands
   adapter  adapter   adapter
      \        |        /
       optional protocol bridges
          ACP / native SDKs
```

ACP, a native provider SDK, a CLI wrapper and OpenHands do not occupy the same architectural layer:

- ACP is an interoperability protocol, not a complete control plane.
- AgentAPI and HarnessRouter are compatibility bridges around existing harnesses.
- OpenHands supplies its own agent loop, tools, runtime model and server surface.
- Agyn and Google AX address execution-fleet concerns that sit below or around an agent adapter.

## What OpenHands Is

OpenHands is an open-source software-development agent platform. Its SDK provides an agent loop and tools for shell, file editing, browsers and MCP integrations; its Agent Server exposes agents through a service boundary and can run them locally or in isolated infrastructure.

For ShipGlows, OpenHands should therefore be understood as one possible `AgentRuntime` implementation. Adopting it as the central engine would also adopt OpenHands-specific agent semantics and could weaken the existing separation between ShipGlows product contracts and runtime behavior. The safer fit is an optional adapter evaluated against the same conformance requirements as Codex, Claude or any future runtime.

## Option Space

### Option A: ACP as the compatibility boundary

- Summary: use ACP where a supported agent exposes it, while keeping ShipGlows APIs and persistence independent.
- Pros: open standard, broad ecosystem, official SDKs and lower dependence on one router vendor.
- Cons: does not provision workspaces, queue jobs, enforce ShipGlows policy or provide the complete control plane.

### Option B: AgentAPI as an isolated compatibility prototype

- Summary: test a small HTTP bridge across several existing agent CLIs.
- Pros: lightweight, broad CLI coverage and easy to benchmark.
- Cons: terminal emulation and TUI parsing can break when upstream interfaces change; insufficient as the durable security or persistence boundary.

### Option C: OpenHands as an optional runtime adapter

- Summary: connect OpenHands Agent Server or SDK behind `AgentRuntime`.
- Pros: mature agent primitives, REST deployment surface, model choice and sandbox-friendly operation.
- Cons: it is a full agent stack rather than a neutral wrapper around Codex and Claude; adopting it centrally would replace some native-harness behavior.

### Option D: HarnessRouter as a bounded experiment

- Summary: evaluate its unified API and session features in an isolated proof of concept.
- Pros: closer to a turnkey multi-harness router than ACP or AgentAPI.
- Cons: very young project, narrower harness coverage and insufficient operational history for a core dependency.

### Option E: Agyn or Google AX for a future execution fleet

- Summary: revisit these when ShipGlows needs multi-tenant remote execution, stronger isolation or distributed recovery.
- Pros: security and fleet concerns are explicit; Google AX's event-log and single-writer design are relevant to durable resumability.
- Cons: Kubernetes and operational complexity are disproportionate for the current local workflow; Google AX remains early and its broader bring-your-own-harness direction is not yet a proven ShipGlows integration.

## Comparison

| Candidate | Architectural role | Preserves native harnesses | Supplies control plane | Current ShipGlows fit |
| --- | --- | --- | --- | --- |
| ACP | interoperability protocol | yes, through adapters | no | preferred compatibility boundary |
| AgentAPI | lightweight CLI-to-HTTP bridge | mostly | minimal | disposable prototype only |
| OpenHands | complete agent SDK/server | no; it is its own agent stack | partial to strong | optional runtime adapter |
| HarnessRouter | unified harness API | yes | stronger turnkey surface | watch or isolated experiment |
| Agyn | secure Kubernetes agent platform | configurable | strong fleet layer | future multi-tenant option |
| Google AX | distributed agent runtime | future-oriented | strong runtime concepts | watch, do not adopt yet |

## Emerging Recommendation

Keep the current ShipGlows architecture. `AgentRuntime` remains the canonical internal boundary, and every provider or harness remains a replaceable adapter. Prefer native, documented provider interfaces where they are stable; use ACP as the first shared compatibility protocol when it reduces adapter duplication without leaking into the public API.

OpenHands is worth retaining on the shortlist as an optional runtime, especially for self-hosted and model-agnostic execution. It should not become the definition of a ShipGlows conversation, approval, event, workspace or capability.

AgentAPI can provide a cheap compatibility benchmark. HarnessRouter can be compared against it in an isolated test, but neither should own persistence, authorization, policy, worktree safety or user-facing contracts. Agyn and Google AX should be revisited only when distributed execution requirements justify their operating cost and maturity risk.

## Architectural Invariants

- Flutter and public ShipGlows APIs consume normalized ShipGlows contracts only.
- Runtime-specific session identifiers and wire types remain behind adapters.
- Authentication, tenant/project authorization, approvals, capabilities, idempotency, event persistence and worktree safety remain runner-owned.
- Unsupported capabilities fail explicitly; the runner never silently changes runtime or broadens authority.
- No router or runtime dependency is authorized by this exploration.
- A runtime is admitted only after contract, cancellation, resume, event normalization, approval, redaction, failure and cleanup conformance proofs.

## Non-Decisions

- No dependency, service or proof of concept is selected or installed.
- No migration away from the current Codex adapter is proposed.
- ACP is not made a public endpoint or persistent data model.
- OpenHands is not selected as the default ShipGlows agent.
- No Kubernetes, hosted runtime or paid provider spend is authorized.

## Rejected Paths

- One universal third-party router as ShipGlows' public API - rejected because it would couple product semantics and safety to a young external abstraction.
- Direct provider types in Flutter or persisted operational records - rejected because it breaks runtime neutrality and migration safety.
- Coder Tasks as a new foundation - rejected because it is being deprecated.
- LangGraph, CrewAI or AutoGen as direct substitutes - rejected for this decision because they are orchestration frameworks rather than drop-in compatibility layers for native coding-agent harnesses.
- E2B or Daytona as complete answers - rejected for this decision because sandbox infrastructure alone does not normalize agent sessions, events, approvals and capabilities.

## Risks And Unknowns

- ACP implementation coverage and optional capabilities vary across agent adapters.
- CLI wrappers inherit breaking changes, authentication flows and interactive behavior from every upstream harness.
- OpenHands may duplicate capabilities already owned by the runner and needs a strict boundary review before integration.
- Distributed runtimes can introduce Kubernetes, storage, networking, cost and incident-response burdens before ShipGlows needs them.
- Windows-local behavior, fork/resume semantics and concurrent-writer guarantees require direct conformance tests; documentation claims alone are insufficient.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: local project paths and runtime architecture details
- Redactions applied: no secrets, credentials, tokens, private logs, session files or customer data included
- Notes: external projects are summarized; the report contains architectural decisions rather than copied source text.

## Decision Inputs For Spec

- User story seed: As a ShipGlows operator, I can select supported coding-agent runtimes without changing Cockpit behavior or weakening runner safety.
- Scope in seed: adapter contract matrix, one isolated test adapter, normalized lifecycle events, capability discovery, cancellation/resume, approvals, redaction and cleanup proof.
- Scope out seed: public ACP exposure, silent runtime fallback, Kubernetes fleet rollout, paid provider commitment and replacement of the current Codex adapter.
- Invariants/constraints seed: ShipGlows contracts remain canonical; runtime types stay private; all side-effect authority remains runner-owned; unsupported behavior fails closed.
- Validation seed: run the same conformance suite against the existing Codex adapter and one candidate adapter; prove event, approval, resume, interruption, failure, redaction and cleanup equivalence.

## Handoff

- Recommended next action: create an `AgentRuntime` conformance matrix only when an adapter proof of concept is prioritized.
- Why this next step: it compares candidates against ShipGlows requirements without prematurely selecting or installing a platform.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-08-17 15:57:00 UTC | HarnessRouter alternatives and OpenHands fit | Compared protocol, wrapper, full-agent and distributed-runtime options against the existing neutral runner boundary | Retain `AgentRuntime`; prefer ACP as compatibility boundary; treat OpenHands as an optional adapter | Define a conformance matrix before any integration approval |
