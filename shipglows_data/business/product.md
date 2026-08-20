---
artifact: product_context
metadata_schema_version: "1.0"
artifact_version: "2.2.1"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-20"
status: reviewed
source_skill: 300-sg-docs
scope: product
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
target_user: "developers, founders, agencies, repository owners, and technical operators"
user_problem: "They lack one safe visual place to understand repository health, direct managed coding agents, and iterate on the real product before generating code."
desired_outcomes:
  - "Understand all repository health dimensions from one Cockpit."
  - "Run and resume project-scoped agent conversations without using SSH or a terminal."
  - "Review audits, fixes, approvals, and evidence through explicit controls."
  - "Experiment visually on the real product without changing source files."
  - "Compile only an accepted visual variant into one isolated reviewable patch."
non_goals:
  - "Unsupervised repository mutation, push, merge, or deployment."
  - "General server administration for ordinary users."
  - "A separate autonomous design-file authority or a generic vector editor."
linked_systems:
  - "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md"
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
  - "Operator decision 2026-08-15: add a planned code-first Visual Studio and deferred-generation Laboratory as the second ShipGlows product promise."
next_review: "2026-09-03"
next_step: "Run readiness for the Visual Studio and Laboratory MVP while preserving the existing hosted Cockpit proof gap."
---

# Product Context

## Current Product

ShipGlows is a Flutter application backed by a managed control plane. It organizes work by project, shows a visual health Cockpit, and exposes one tab per managed agent conversation.

## Planned Product Direction

ShipGlows has two complementary promises:

1. safely understand projects and direct managed agents through explicit controls, worktrees, approvals, and evidence;
2. visually create and edit the real running product, experiment without source generation, and compile only an accepted variant into production-oriented Astro or Flutter code.

The second promise is planned, not implemented or publicly available. Its governing draft is `shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md`. It defines a real-runtime Studio, an automatically triggered Laboratory for complex work, and an explicit compile boundary. It does not make a separate design document authoritative and does not weaken the current mutation, authorization, worktree, review, or remote-action boundaries.

## Primary Surfaces

- Cockpit: cross-project health, explainable AI readiness, activity, diagnostics, and evidence freshness.
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
- Catalog-backed projects have a locally implemented, advisory AI-readiness score with explicit evidence and recommendations; hosted availability remains subject to runner deployment proof.
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
