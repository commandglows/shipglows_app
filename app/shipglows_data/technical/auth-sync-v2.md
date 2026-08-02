---
artifact: architecture_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: shipglows_app
created: "2026-04-27"
updated: "2026-04-27"
status: draft
source_skill: manual
scope: shipglows-app-v2-auth-sync
owner: unknown
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Flutter app"
  - "future auth"
  - "future cloud sync"
external_dependencies:
  - "Supabase"
invariants:
  - "No auth or cloud sync is implemented in V1."
  - "Service-role keys are forbidden in Flutter/client code."
depends_on: []
supersedes: []
evidence:
  - "Existing V2 auth and sync decision note migrated into shipglows_data/technical."
next_review: "2026-06-27"
next_step: "/sf-docs audit shipglows_data/technical/auth-sync-v2.md"
---

# ShipGlows App V2 Auth + Sync (Decision Note)

## Current Position

V1 is intentionally local read-only. No auth and no cloud sync are implemented.

## Non-Negotiable Constraints for V2

- Local ledgers (`OPERATIONS_LOG.md`, `DEPENDENCY_LOG.md`) remain core input evidence.
- Cloud sync must use explicit user/project ownership.
- Any Supabase data path must be enforced by RLS policies.
- Service-role keys are forbidden in Flutter/client code.
- Cross-device sync conflicts must never silently overwrite local evidence.

## Suggested V2 Split

- Desktop reader remains available.
- Optional sync worker performs authenticated upload/download.
- Conflict resolution surfaces diagnostics instead of silent merges.

## Security Checklist Before V2 Implementation

- Threat model for tenant boundary, replay, and token leakage.
- RLS policy test coverage for every read/write table.
- Signed event provenance for cloud-origin events.
- Redaction strategy for diagnostics and synced logs.
