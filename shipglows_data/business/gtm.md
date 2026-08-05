---
artifact: gtm_context
metadata_schema_version: "1.0"
artifact_version: "2.1.0"
project: "shipglows_app"
created: "2026-04-26"
updated: "2026-08-03"
status: draft
source_skill: 300-sg-docs
scope: gtm
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
target_segment:
  - "developers managing multiple repositories"
  - "technical founders and agencies"
offer: "a managed visual Cockpit for repository health and agent-assisted improvement"
channels:
  - "ShipGlows public site"
  - "direct product onboarding"
proof_points:
  - "working Flutter Cockpit and project conversation UI"
  - "tenant-scoped managed runner contracts and local test proof"
  - "real managed-server PTY/tmux/Codex smoke with bounded cleanup"
depends_on:
  - artifact: "shipglows_data/business/business.md"
    artifact_version: "2.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "2.1.0"
    required_status: reviewed
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/gtm.md"
evidence:
  - "Current ShipGlows product specification and implementation state."
next_review: "2026-09-03"
next_step: "Replace MVP claims with production proof after one provider-configured project run."
---

# Go-To-Market Context

## Positioning

ShipGlows is the visual control plane for teams that want AI-assisted repository improvement without turning every user into a server operator.

## Core Promise

See the health of every project, open a focused agent conversation, and follow audits or fixes from one application while ShipGlows manages the execution infrastructure.

## Differentiation

- global health visibility and per-project work in one product;
- semantic conversations as the default experience rather than a raw terminal;
- provider-neutral agent orchestration with Codex as the first adapter;
- explicit permissions, evidence freshness, and fail-closed execution;
- optional advanced Workspace without exposing it to ordinary users.

## Claims Allowed Now

- ShipGlows has an implemented Flutter Cockpit and managed conversation foundation.
- The runner has local contract proof for tenant isolation, persistence, GitHub workspaces, and Codex normalization.
- The Workspace gateway and Flutter terminal are implemented, and an isolated real server smoke proves PTY/tmux/Codex execution and cleanup.

## Claims Not Yet Allowed

- generally available hosted agent execution;
- fully autonomous fixes or deployments;
- publicly authenticated PTY/tmux access or production-proven Neovim access;
- complete platform parity across Web, Android, and Windows;
- automatic healthy status without current evidence.

## Maintenance Rule

Update this document whenever production proof, packaging, target segments, acquisition channels, or public product claims change.
