---
artifact: business_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_app
created: "2026-04-25"
updated: "2026-04-26"
status: reviewed
source_skill: sf-docs
scope: business
owner: "Diane"
confidence: low
risk_level: medium
security_impact: none
docs_impact: yes
target_audience: unknown
value_proposition: unknown
business_model: unknown
market: unknown
depends_on: []
supersedes: []
evidence:
  - CLAUDE.md
  - README.md
next_review: "2026-07-26"
next_step: /sf-docs audit shipflow_data/business/business.md
---
# Business Context

## Purpose

ContentFlow is a user-facing Flutter application for creators, independent operators, and small content teams who need to move ideas into published content faster without owning a complex operations stack.

For the ContentFlow ecosystem, this repository should be treated as the canonical product contract. The supporting site and lab repositories should align to the user-facing promise described here rather than define a competing product narrative.

The app coordinates planning, ideation, drafting, review, and schedule management across content surfaces while integrating with a backend powered by FastAPI services.

## Problem

Teams and solo operators often face:

- fragmented workflows across tools,
- slow content turnaround between idea, draft, review, and publish,
- fragile systems when backend services are temporarily unavailable.

ContentFlow reduces this friction by keeping the user interface usable in degraded mode and queueing supported backend actions locally until connectivity or API availability is restored.

## Product Positioning

The application is the execution layer of a larger ContentFlow ecosystem:

- `contentflow_site`: acquisition and product communication (Astro + marketing pages),
- `contentflow_lab`: AI pipeline and automation research/orchestration (Python/FastAPI agents),
- `contentflow_app`: authenticated creation shell for day-to-day planning and review.

The app itself is positioned as a practical operations surface, not an agent training interface.

## Core User Journeys

- first access and workspace onboarding (Clerk-authenticated),
- content ideation and angle creation,
- draft review and status transitions,
- scheduling and drip setup,
- publishing preparation and campaign activity tracking,
- feedback capture and product quality insights.

## Delivery Model

This repository documents and ships the Flutter client application only. Backend availability is required for authoritative sync, but not strictly required for read-only browsing and queueing flows when running in offline/degraded mode.

## Constraints and Non-Goals

- Non-goals: the app is not a replacement for upstream AI generation services; it is an operator layer for human-in-the-loop execution.
- Non-goals: binary file uploads and full publish operations may remain disabled in offline mode.
- Non-goals: platform SDK parity for native mobile auth paths that depend on unavailable Flutter SDK features.
- External publish channels and some destructive actions are intentionally blocked when reliability cannot be guaranteed locally.

## Current Commercial Scope

- Access model and pricing are managed outside this repository.
- This codebase focuses on product reliability, onboarding quality, and resilient user workflows.

## Governance Notes

- Backend integration decisions should preserve local-first usability for critical paths.
- Offline capability should not be treated as a secondary mode; it is part of baseline user experience.
- Queue durability, reconciliation clarity, and retry transparency are product quality requirements, not optional polish.
