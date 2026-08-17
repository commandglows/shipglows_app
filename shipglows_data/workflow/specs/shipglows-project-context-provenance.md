---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-08-17"
updated: "2026-08-17"
status: reviewed
source_skill: sg-development
scope: "project-context-provenance"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu’utilisatrice de ShipGlows, je veux voir si le contexte stratégique d’un projet est vérifié, absent, ancien ou inaccessible sans exposer ses sources privées."
linked_systems:
  - "runner/src/projectContextRoutes.ts"
  - "runner/src/db/index.ts"
  - "app/lib/shipglows/"
depends_on: []
supersedes: []
evidence:
  - "The runner already persists tenant/project-bound ProjectContextBundle records with source provenance and redaction counts."
  - "Legacy project content directory fields are dormant and are not imported into the active runtime."
next_step: "Manually inspect the project-context card after a separately authorized runner restart."
---

# ShipGlows Project Context Provenance

## Objective

Project the latest verified context provenance for one authorized project without exposing source references, source hashes, local paths, tenant identifiers or bundle identifiers.

## Included

- latest context lookup scoped by tenant and project;
- read-only authenticated route;
- ready, stale, missing, access-lost and unavailable UI states;
- source-kind counts, observation date, source commit and redaction count;
- project-detail integration and bounded parser tests.

## Excluded

- repository scans, context generation or refresh mutation;
- source content, source paths, SHA-256 values or private payloads;
- legacy ContentFlow models or endpoints;
- commit, push, deployment or server restart.

## Acceptance Criteria

- [x] Actor and project isolation fail closed.
- [x] Public DTO contains no source reference or source hash.
- [x] Missing context is distinct from access loss and service failure.
- [x] Context older than 30 days is visibly stale.
- [x] Flutter rejects extensible or malformed payloads.
- [x] Active Flutter and runner verification passes.

## Current Chantier Flow

| Stage | Status | Evidence | Next step |
| --- | --- | --- | --- |
| Audit | complete | Active context bundle contract and dormant legacy fields compared | Implement bounded projection |
| Spec | locally_verified | Security boundary and states fixed by approved operator plan | Preserve as implementation authority |
| Implementation | complete | Runner route/store query and Flutter project card implemented | Manual app proof after runner restart |
| Verification | complete | Runner 22/22 focused and Flutter 142/142 active checks pass | Report local result |
| Delivery | local_only | No Git publication or runner restart authorized | Obtain separate approval for runtime proof |

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-17 | sg-development | GPT-5 Codex | Rewrote legacy context value as a redacted active-runtime provenance projection | in_progress | Complete combined verification |
| 2026-08-17 | sg-development | GPT-5 Codex | Verified isolation, redaction, states, parsing and project-detail integration | locally_verified | Manual proof after runner restart |
