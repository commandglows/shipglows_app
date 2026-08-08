---
artifact: exploration
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "shipglows_app"
created: "2026-08-08"
updated: "2026-08-08"
status: active
source_skill: "010-sg-technical"
scope: "agentic-security-architecture"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/runs/approval.ts"
  - "runner/src/runs/execution.ts"
  - "runner/src/agent-runtime/codex/index.ts"
  - "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
depends_on:
  - artifact: "https://blog.google/security/architecting-security-for-agentic/"
    artifact_version: "2025-12-08"
    required_status: active
supersedes: []
evidence:
  - "Operator approval 2026-08-08: implement at least one MVP and retain the exploration and future ideas."
  - "Operator approval 2026-08-08: continue with the bounded adversarial regression suite."
next_review: "2026-09-08"
next_step: "Deferred: enrich provider-neutral approval metadata before any broader approval policy is enabled."
---

# Agentic security architecture

## Decision

Security boundaries belong in the managed runner, not only in ShipGlows skills or prompts. Skills may describe policy and generate adversarial fixtures, but the runner must enforce capabilities, approval rules, tenant/project scope and side-effect boundaries.

## MVP implemented

- Every admitted run already receives an immutable, server-resolved execution envelope with task kind, provider, runtime, capabilities, budget and deadline.
- Unsupported execution capabilities fail before workspace, session or turn side effects.
- Approval now fails closed: only an isolated `fix` run may approve a privileged runtime request. `audit` and ordinary `conversation` runs cannot convert an approval request into extra authority. Denial remains available.
- Existing tenant/project authorization, secret-safe payloads, isolated fix worktrees and explicit operator approvals remain independent layers.

This is deliberately conservative. The current provider-neutral approval event does not expose enough structured action metadata to prove that a command is read-only or that its destination is safe.

## Threats covered by the first slice

- repository or web content asks an audit agent to modify files;
- indirect prompt injection asks a normal conversation to run a privileged tool;
- a model attempts to use the approval UI to expand the run's original authority;
- an unsupported provider capability silently falls back or broadens permissions.

## Adversarial regression suite

The runner test suite now exercises five policy-level attacks independently of prompt wording:

- repository prompt injection attempting to escalate a read-only audit;
- a conversation requesting secret access;
- a conversation requesting exfiltration through a generated URL;
- a cross-project approval reference;
- an operator denial that must remain usable without granting authority.

The first three intentionally converge on the same server invariant: untrusted text is data and cannot change the run's task kind or approval policy. These tests do not claim to detect malicious prose or inspect network egress; they prove that the current approval boundary is independent of that prose.

## Future investigations

1. Add a provider-neutral proposed-action descriptor: action kind, target class, read/write effect, network destination class and redacted data-flow labels.
2. Persist the descriptor with the approval and compare it to the immutable execution envelope before showing an approval control.
3. Split capabilities into explicit read and write grants for filesystem, commands, network and external providers.
4. Add deterministic URL and destination checks that reject secret-bearing or non-allowlisted egress.
5. Evaluate an isolated alignment critic that receives only the user goal and redacted action metadata, never raw untrusted repository or web content.
6. Add continuous adversarial fixtures for prompt injection, cross-project access, secret requests, approval bypass and data exfiltration.
7. Track attack success rate and policy-denial regressions as security health evidence in the Cockpit.

## Non-goals for this MVP

- claiming complete protection against prompt injection;
- introducing a second model before deterministic boundaries are mature;
- parsing raw shell commands as the primary security boundary;
- enabling autonomous push, merge, deployment, messaging or payment actions.
