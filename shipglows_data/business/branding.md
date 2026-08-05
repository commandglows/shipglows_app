---
artifact: brand_context
metadata_schema_version: "1.0"
artifact_version: "2.0.0"
project: "shipglows_app"
created: "2026-04-25"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: brand
owner: "Diane"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
brand_voice: "clear, capable, calm, and direct"
trust_posture: "visible evidence and explicit boundaries over automation hype"
depends_on:
  - artifact: "shipglows_data/business/business.md"
    artifact_version: "2.0.0"
    required_status: reviewed
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/branding.md"
evidence:
  - "ShipGlows identity decision and current Cockpit product vision."
next_review: "2026-09-03"
next_step: "Align public site claims and screenshots after hosted Cockpit proof."
---

# Branding Guide

## Brand

- Brand name: ShipGlows
- Category: managed repository-health and agent-operation platform
- Primary message: see every project clearly and improve it safely
- Primary promise: turn fragmented repository signals and agent sessions into one understandable control plane

## Voice

- Clear and practical.
- Confident without implying capabilities that are not proven.
- Visual and outcome-oriented for ordinary users.
- Precise about permissions, evidence freshness, and degraded states.
- French user-facing copy uses informal `tu` consistently.

## Product Language

Prefer:

- Cockpit
- project health
- conversation
- audit
- proposed fix
- approval required
- evidence unavailable
- Workspace opérateur

Avoid in ordinary-user copy:

- SSH, PTY, tmux, process IDs, host paths, sockets, and raw runtime protocol terms;
- claims of full autonomy, automatic deployment, or guaranteed health;
- presenting a terminal as the primary ShipGlows experience.

## Experience Principles

- Show global state before asking for action.
- Explain unknown or unavailable states plainly.
- Keep advanced operator capabilities separate from normal conversations.
- Make every mutation reviewable and every approval explicit.

## Maintenance Rule

Update this document when the product name, category, promise, voice, vocabulary, or trust posture changes.
