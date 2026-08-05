---
artifact: technical_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-08-03"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: "contentflow-spec-archive"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "shipglows_data/workflow/specs/"
  - "shipglows_data/technical/legacy-contentflow-inventory.md"
depends_on:
  - artifact: "shipglows_data/technical/legacy-contentflow-inventory.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "ContentFlow specifications were classified by the legacy inventory as reference-only, parked, adapt-candidate, or archive-later."
  - "Current ShipGlows owner docs and the Managed Agent Cockpit MVP supersede these files as active product truth."
next_review: "2026-11-03"
next_step: "Mine an archived contract only when a current ShipGlows specification explicitly adopts it."
---

# ContentFlow Specification Archive

## Purpose

This directory preserves former ContentFlow specifications outside the active ShipGlows chantier registry. Their full bodies and Git history are retained. They are historical references, not executable ShipGlows plans.

## Preservation Ledger

| Archived specification | Classification | Preserved value | Current rule |
| --- | --- | --- | --- |
| `PRD-lifetime-deal-early-bird-payg.md` | commercial history | BYOK and lifetime-deal risk framing | No active ShipGlows offer is inferred from it. |
| `SPEC-content-pipeline-unification.md` | parked product history | content-pipeline concepts | Reuse requires a current product decision. |
| `SPEC-offline-sync-v2.md` | reusable technical reference | cache, queue, replay, and recovery concepts | Does not define current runner persistence. |
| `SPEC-project-flows-selection-onboarding-archive.md` | adapt-candidate | project-selection and archive UX | Current project identity and onboarding contracts win. |
| `architecture-cible-fastapi-clerk-flutter.md` | reference-only | former Flutter/FastAPI/Clerk target | Supabase and the managed runner are current first adapters. |
| `feedback-admin-v1-contentflow.md` | keep-concept | feedback triage UX | No current feedback feature is implied. |
| `feedback-backend-contract-fastapi.md` | reference-only | former feedback API contract | FastAPI is not adopted by the current Cockpit architecture. |
| `foundation-scrollable-nav-affiliations.md` | parked UI history | navigation and affiliation concepts | Not part of the active Cockpit MVP. |
| `late-integration-finalization.md` | reference-only | former publishing integration work | Does not define current integrations. |
| `spec-no-ui-jump-on-resume.md` | adapt-candidate | resume stability expectations | Reuse only through current Flutter behavior and tests. |

## Reuse Rule

Archived content may inform exploration or a new specification, but it cannot activate a provider, route, data model, commercial promise, or security boundary by reference alone.

## Maintenance Rule

Update this ledger when an archived contract is adopted, superseded more precisely, or intentionally rejected by a current ShipGlows decision.
