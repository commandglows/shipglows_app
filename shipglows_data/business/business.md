---
artifact: business_context
metadata_schema_version: "1.0"
artifact_version: "2.0.0"
project: "shipglows_app"
created: "2026-04-25"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: business
owner: "Diane"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
target_audience: "developers, technical operators, agencies, and repository owners"
value_proposition: "See project health and safely direct managed coding agents without operating servers or terminals."
business_model: "managed software and infrastructure; commercial packaging remains governed separately"
market: "AI-assisted software delivery and repository operations"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.4.0"
    required_status: ready
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/business.md"
evidence:
  - "Operator-validated ShipGlows Cockpit and managed-agent product vision."
  - "Implemented Flutter Cockpit, managed conversations, runner projection, authentication boundary, and GitHub App foundation."
next_review: "2026-09-03"
next_step: "Validate the managed Cockpit with one real project and provider-configured run."
---

# Business Context

## Purpose

ShipGlows gives developers and technical operators one visual control plane for the health and improvement of their repositories. Users can inspect project health, open managed agent conversations, request audits or fixes, and follow work without administering SSH, tmux, runtime credentials, or server paths.

## Problem

Repository maintenance is fragmented across dashboards, terminals, CI systems, issue trackers, hosting providers, and AI-agent sessions. This makes it difficult to understand overall health, preserve context, and safely delegate work.

ShipGlows reduces that fragmentation through:

- a cross-project Cockpit covering technical quality, content, SEO, performance, and security;
- project-scoped semantic agent conversations;
- server-managed repository access and execution boundaries;
- an optional, separately authorized operator Workspace for advanced terminal workflows.

## Target Users

- developers who manage several repositories;
- founders and agencies without dedicated infrastructure teams;
- technical operators who want agent assistance with visible safety boundaries;
- advanced users who may need an optional PTY/tmux/Neovim workspace.

## Delivery Model

ShipGlows provides the application and managed runner. The normal customer experience is the Flutter Cockpit and semantic conversation interface. Server administration, provider credentials, repository workspaces, and runtime transports remain ShipGlows-managed infrastructure.

## Commercial Boundary

Commercial packaging, pricing, quotas, and entitlements are governed by dedicated product and entitlement contracts. This document does not claim that the current MVP is generally available or that provider-configured execution has completed production proof.

## Non-Goals

- exposing a general-purpose SSH client to ordinary users;
- silently mutating, pushing, merging, or deploying repository changes;
- presenting missing evidence as healthy;
- making one agent provider or terminal transport the product architecture.

## Maintenance Rule

Update this document when the target user, managed-service boundary, commercial delivery model, or core product promise changes.
