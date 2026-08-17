---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-08-17"
updated: "2026-08-17"
status: ready
source_skill: sg-development
scope: "local-project-context-indexing"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu’utilisatrice de ShipGlows, je veux actualiser explicitement le contexte vérifié d’un projet local sans exposer ni modifier ses sources privées."
linked_systems:
  - "runner/src/projectContextGenerator.ts"
  - "runner/src/projectContextRoutes.ts"
  - "app/lib/shipglows/presentation/widgets/project_context_panel.dart"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-project-context-provenance.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes: []
evidence:
  - "The existing provenance projection deliberately excludes generation and remains the public read boundary."
  - "The operator approved a local-only bounded indexer before any hosted GitHub or Firestore source."
  - "Runtime proof returned 200 for the closed empty-object refresh, replayed an identical response for the same idempotency key, and projected ready context through GET."
  - "Browser proof rendered the verified card with commit, date, 103 ShipGlows artifacts and one context-scoped idempotency record without browser errors."
next_step: "Ask the operator to personally reconfirm the verified project-context card after the latest restart."
---

# ShipGlows Local Project Context Indexing

## Objective

Produce a tenant/project-bound context bundle from one server-resolved local repository, then expose only the existing redacted provenance projection.

## Included

- explicit authenticated refresh from the project context card;
- trusted-Origin and bounded idempotency controls;
- server-derived Git commit;
- allowlisted repository manifests and allowlisted `shipglows_data` document formats;
- containment, symlink, traversal, file-count, traversal-count, per-file and total-byte limits;
- deterministic content hashes and opaque private source references;
- per-project concurrent refresh coalescing and unchanged-context reuse;
- no writes to the indexed repository.

## Excluded

- GitHub-hosted repository reads, Firestore, remote indexing or network access;
- source content, source paths, hashes or bundle identifiers in Flutter responses;
- automatic/background refresh;
- CLI changes, server restart, commit, push or deployment.

## Acceptance Criteria

- [x] Only an authenticated actor with project read access and an allowed Origin can refresh.
- [x] A bounded idempotency key replays one command outcome.
- [x] Concurrent refreshes for one tenant/project coalesce.
- [x] The repository path and Git commit are resolved by the runner, never by Flutter.
- [x] Sources outside the allowlist, escaping symlinks, changed files and oversized scans fail closed.
- [x] Identical latest sources reuse the existing bundle.
- [x] Public responses contain counts and provenance state only.
- [x] Flutter exposes an explicit refresh action with progress and safe failure feedback.
- [x] Separately authorized runtime proof turns ShipGlows from `Absent` to `Vérifié` and confirms repository status is unchanged.

## Current Chantier Flow

| Stage | Status | Evidence | Next step |
| --- | --- | --- | --- |
| Audit | complete | Existing projection boundary and local registry inspected | Preserve read-only public DTO |
| Spec | ready | Local-only security, limits, authority and proof contract recorded | Keep hosted sources excluded |
| Implementation | complete | Runner producer, protected refresh route and Flutter action implemented | Preserve the bounded contract |
| Verification | agent_runtime_verified | POST `{}` returns 200; same-key replay is identical; GET is ready with 103 ShipGlows artifacts; browser renders `Vérifié` with commit/date/counts and no errors; repository status is unchanged | Await operator’s personal reconfirmation after the latest restart |
| Delivery | local_only | Runtime proof complete; no commit, push or deployment performed | Preserve local-only delivery boundary |

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-17 | sg-development | GPT-5 Codex | Implemented and locally verified the approved bounded local context producer and explicit refresh surface | locally_verified | Complete separately authorized runtime proof |
| 2026-08-17 | sg-development | GPT-5 Codex | Proved the closed `{}` refresh, identical idempotent replay, ready GET projection, unchanged repository status and rendered verified card with one context idempotency record | agent_runtime_verified | Operator personally reconfirms the card after the latest restart |
