---
artifact: product_context
metadata_schema_version: "1.0"
artifact_version: "2.1.0"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: product
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
target_user: "repository owners and technical operators"
user_problem: "They lack one safe visual place to understand repository health and direct managed coding agents."
desired_outcomes:
  - "Understand all repository health dimensions from one Cockpit."
  - "Run and resume project-scoped agent conversations without using SSH or a terminal."
  - "Review audits, fixes, approvals, and evidence through explicit controls."
non_goals:
  - "Unsupervised repository mutation, push, merge, or deployment."
  - "General server administration for ordinary users."
depends_on:
  - artifact: "shipglows_data/business/business.md"
    artifact_version: "2.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.4.0"
    required_status: ready
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/product.md"
evidence:
  - "Current Flutter ShipGlows runtime and managed runner implementation."
  - "Operator decisions captured in the Managed Agent Cockpit MVP specification."
next_review: "2026-09-03"
next_step: "Complete public TLS and authenticated project provisioning, then prove the Workspace from Flutter Web."
---

# Product Context

## Current Product

ShipGlows is a Flutter application backed by a managed control plane. It organizes work by project, shows a visual health Cockpit, and exposes one tab per managed agent conversation.

## Primary Surfaces

- Cockpit: cross-project health, activity, diagnostics, and evidence freshness.
- Project detail: project state, health dimensions, recent evidence, and actions.
- Conversations: semantic agent events, messages, approvals, interruption, and resume.
- Operator Workspace: optional advanced surface with a separately authorized, short-lived PTY/tmux connection rendered directly in Flutter.
- Settings/auth: provider-neutral session and managed-runner configuration boundaries.

## Current Implementation Truth

- Flutter Web, Android, and Windows share the intended product architecture; Web is the first hosted proof surface.
- Supabase is the first identity adapter behind a provider-neutral contract.
- GitHub App access and managed worktrees are server-owned.
- Codex app-server is the first complete agent adapter behind a runtime-neutral interface.
- Cockpit and conversation state are projected by the managed runner.
- Interactive PTY/tmux rendering is implemented in Flutter and the runner. A real server smoke proves resize, input/output, isolated tmux attachment, Codex execution, and cleanup.
- The active runner is allowlisted and healthy on loopback, but the Workspace is not publicly usable yet: HTTPS routing and authenticated actor/project provisioning remain incomplete.

## User Journey

1. The user signs in.
2. The Cockpit displays authorized projects and evidence-backed health.
3. The user opens a project and selects or creates a conversation.
4. The user launches an audit, proposes a fix, sends a message, or resolves an approval.
5. The runner executes inside server-owned policy and workspace boundaries.
6. Results return as normalized semantic events and health evidence.
7. An authorized operator may explicitly open the separate Workspace; ordinary users remain in the semantic conversation experience.

## Product Invariants

- Ordinary users do not manage SSH keys, tmux sessions, host paths, or agent credentials.
- Missing evidence stays unknown rather than becoming healthy.
- Repository content remains canonical; runner storage is an operational projection.
- Mutating work remains isolated and reviewable.
- Advanced terminal access is a separate capability, never an implicit conversation feature.

## Maintenance Rule

Update this document when a user-facing surface, supported platform, agent action, permission boundary, or implementation-status claim changes.
