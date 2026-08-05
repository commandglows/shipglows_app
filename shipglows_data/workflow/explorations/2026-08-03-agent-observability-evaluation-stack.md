---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: ShipGlows App
created: "2026-08-03"
updated: "2026-08-03"
status: reviewed
source_skill: 700-sg-explore
scope: managed-agent-observability-and-evaluation
owner: Diane
confidence: high
risk_level: medium
security_impact: high
docs_impact: yes
linked_systems:
  - runner
  - Codex app-server
  - managed-agent-cockpit-mvp
  - OpenTelemetry
evidence:
  - "Runner uses a server-owned Codex app-server adapter, normalized events, SQLite operational projection and redacted public diagnostics."
  - "Braintrust, Phoenix and Jaeger official documentation consulted on 2026-08-03."
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes: []
next_step: "Decide the first managed-agent observability deployment after one provider-configured Codex smoke run."
---

# Exploration Report: Agent Observability And Evals

## Starting Question

Which observability and evaluation layer should ShipGlows use for its managed Codex runner and health Cockpit: Braintrust, Arize Phoenix, Jaeger, or a combination?

## Context Read

- `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md` - the Cockpit is the product control plane; the runner owns normalized, redacted runtime events.
- `shipglows_data/technical/managed-runner-foundation.md` - the current runner already has server-owned execution, SQLite projection, SSE replay and provider smoke boundaries.
- `runner/src/agent-runtime/codex/index.ts` - Codex app-server is a local stdio adapter whose events can be instrumented without exposing its transport.

## Internet Research

- [Braintrust documentation](https://www.braintrust.dev/docs) - Accessed 2026-08-03 - managed AI tracing, experiments and production evaluation workflow.
- [Arize Phoenix documentation](https://arize.com/docs/phoenix) - Accessed 2026-08-03 - open-source, OpenTelemetry-based AI tracing, evaluation, datasets and experiments.
- [Jaeger documentation](https://www.jaegertracing.io/docs/) - Accessed 2026-08-03 - distributed tracing backend, deployment and storage topology.

## Problem Framing

ShipGlows needs two different feedback loops that must not be confused:

```text
User Cockpit        runner reliability                  agent quality
health dimensions ───────────────────────► audit/fix usefulness and safety
                    HTTP/SSE/SQLite/Codex                prompts, tools, outcomes
                              │                                   │
                         Jaeger/OTel                    Phoenix or Braintrust
```

The Cockpit remains ShipGlows-owned. External tooling may observe its execution but must never become the user-facing source of truth or receive secrets, GitHub tokens, internal worktree paths, raw private code, or unredacted prompts.

## Option Space

### Option A: Braintrust

- Summary: managed AI observability and evaluation platform with traces, datasets, experiments and online scoring.
- Pros: quickest route to experiment comparison, human review and LLM-quality evaluation; low operations burden.
- Cons: a third-party data boundary; less aligned with self-hosted/server-owned control; does not replace infrastructure tracing.

### Option B: Arize Phoenix

- Summary: open-source AI observability and evaluation platform built on OpenTelemetry/OpenInference, with tracing, datasets, experiments and prompt iteration.
- Pros: strongest fit for private managed workspaces, OpenTelemetry interoperability and a future self-hosted control plane; covers agent-quality loops that Jaeger does not.
- Cons: deployment and retention operations are ours; integration with the Codex JSON-RPC adapter needs a thin custom instrumentation layer.

### Option C: Jaeger

- Summary: distributed tracing backend with collectors, sampling, deployment and storage choices.
- Pros: excellent for runner availability, API latency, SSE fan-out, SQLite/worktree cleanup and provider-smoke diagnostics; vendor-neutral via OpenTelemetry.
- Cons: not an AI evaluation product: no prompt/dataset/experiment/human-review workflow for measuring whether audits or fixes are good.

### Option D: Portable OpenTelemetry First, Select One AI Layer

- Summary: emit a small redacted OpenTelemetry schema from the runner now; route technical spans to Jaeger and later choose exactly one AI-quality layer.
- Pros: preserves optionality, prevents a vendor-specific public contract, separates reliability from quality, and keeps the Cockpit independent.
- Cons: needs a small event taxonomy and redaction policy before any exporter is enabled.

## Comparison

| Need | Braintrust | Phoenix | Jaeger |
| --- | --- | --- | --- |
| Runner/API/SSE reliability | partial | partial | strong |
| Audit/fix quality evaluation | strong | strong | weak |
| Self-hosting/data control | limited by chosen offering | strong | strong |
| OpenTelemetry alignment | available instrumentation | native OTLP foundation | native distributed tracing |
| Fastest initial evaluation workflow | strong | medium | not applicable |
| Replaces ShipGlows Cockpit | no | no | no |

## Emerging Recommendation

Adopt Option D. Define redacted OpenTelemetry spans in the runner first: `http.request`, `conversation.command`, `runtime.turn`, `runtime.approval`, `workspace.lifecycle`, `event.stream` and `provider.smoke`. Attach opaque tenant/project/conversation/run IDs, durations, terminal outcome and bounded error codes only.

Use Jaeger (or another OTLP-compatible backend) for runner reliability. When real provider-backed Codex sessions exist, choose one AI-quality plane:

- choose Phoenix if private/self-hosted data control and open standards matter most;
- choose Braintrust if fastest managed evaluation, review queues and experimentation matter most.

Do not run Phoenix and Braintrust in the MVP. The current recommendation is Phoenix as the default short-list leader because ShipGlows owns managed workspaces and may handle private repository context; Braintrust remains the faster managed alternative.

## Non-Decisions

- No external telemetry exporter is selected or enabled.
- No private code, secrets, tokens, internal paths or raw prompts may leave the runner.
- No user-visible Cockpit data model is delegated to any observability vendor.
- No automatic self-improvement is authorized by evaluation scores alone.

## Risks And Unknowns

- Retention, regional hosting, pricing and self-hosted operating cost can change the final Phoenix-versus-Braintrust choice.
- Codex app-server semantic notifications require an explicit mapping to the redacted span taxonomy.
- LLM-as-judge scores must be calibrated against test results and human review; a high score cannot authorize a fix or merge.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: runner topology and internal paths in local documentation
- Redactions applied: report contains no credentials, raw prompts, code excerpts, worktree paths or customer data.
- Notes: external source content is summarized only.

## Decision Inputs For Spec

- User story seed: As ShipGlows operators, we can diagnose runner reliability and compare agent changes without exposing customer repositories.
- Scope in seed: redacted OTel taxonomy, exporter boundary, retention/redaction policy, one proof trace and an evaluation pilot decision.
- Scope out seed: vendor UI inside ShipGlows, automatic fix authorization, dual Phoenix/Braintrust rollout.
- Invariants/constraints seed: opaque IDs only; no secrets/paths/raw code; Cockpit remains canonical; quality scores are advisory.
- Validation seed: verify a provider-backed audit produces a redacted trace; prove no restricted fields reach the exporter; compare one fixed evaluation dataset before and after a runner change.

## Handoff

- Recommended next command: decide after the first provider-configured Codex smoke run.
- Why this next step: real trace volume, repository sensitivity and operating preference will make the Phoenix-versus-Braintrust choice evidence-based.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-08-03 09:09:22 UTC | Braintrust, Phoenix and Jaeger for managed Codex | Compared official documentation with existing runner and Cockpit contracts | OTel-first, Jaeger for reliability, Phoenix/Braintrust later for agent quality | Add decision task and choose after a provider smoke |
