---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglows_app"
created: "2026-05-30"
created_at: "2026-05-30 17:05:00 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 17:05:00 UTC"
scope: dashboard-readonly-projection
status: draft
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
source_skill: sf-start
linked_systems:
  - "lib/shipglows/data/dashboard_readonly_projection_repository.dart"
  - "test/shipglows/data/dashboard_readonly_projection_repository_test.dart"
  - "shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes: []
evidence:
  - "Dashboard read-only projection sf-start implementation slice."
next_review: "2026-06-30"
next_step: "/sf-verify ShipGlows Dashboard Read-only Projection"
---

# Dashboard Read-only Projection

## Purpose

This document defines the local read model used by the ShipGlows dashboard before real Firebase SDK queries or Firestore Security Rules are wired. The dashboard consumes a projection of GitHub/Markdown state. It never makes Firestore canonical and never writes repository content.

## Read Model

Project summaries expose only UI-safe fields:

- `projectId`
- `displayName`
- `githubFullName`
- `state`
- `projectionStatus`
- `accessStatus`
- `sourceCommit`
- `updatedAt`
- `artifactCount`
- `diagnosticCount`
- `staleReason`
- `refreshDisabledReason`

Artifact summaries expose:

- `fileId`
- `projectId`
- `path`
- `family`
- `artifactType`
- `sourceCommit`
- `deleted`
- `parseStatus`

Diagnostics expose:

- `diagnosticId`
- `projectId`
- `code`
- `severity`
- `message`
- `createdAt`
- `redactedPath`

Index runs expose:

- `projectId`
- `runId`
- `requestId`
- `status`
- `sourceCommit`
- `startedAt`
- `finishedAt`

## State Mapping

| Dashboard state | Source condition | User consequence |
| --- | --- | --- |
| `ready` | projection is fresh and active artifacts exist | Project can be opened normally. |
| `indexing` | projection/index run is queued or running | Project remains visible with progress status. |
| `stale` | projection is behind repository head | Content remains readable with stale label. |
| `accessLost` | GitHub access lost, suspended, or failed | Last projection remains readable; refresh/index actions are disabled. |
| `corpusMissing` | projection is fresh but no active artifacts exist | Show setup/governance corpus warning, not generic failure. |
| `partial` | projection has partial or parse-failed content | Valid artifacts remain visible with diagnostics. |
| `failed` | projection status is error | Show recoverable failure state. |
| `hidden` | user-scoped view preference hides project | Shared project data is untouched. |
| `archived` | project is archived/orphaned | Project is not active but can be reactivated by valid onboarding. |
| `deleted` | indexed file has `deleted: true` | File is excluded from active artifact lists. |
| `unknown` | future state is not recognized | Render inert metadata and diagnostics only. |

## Firestore Path Intent

The future hosted implementation should derive project visibility from user-scoped refs such as `users/{uid}/projectRefs/{projectId}` or equivalent feed records. It must not run a broad client-side scan of all `projects/*`.

Allowed dashboard read surfaces:

- user project refs
- visible project summaries
- project indexed file summaries
- project diagnostics
- project index run summaries

Forbidden client writes:

- `sourceCommit`
- `projectionStatus`
- `accessStatus`
- memberships
- indexed file records
- diagnostics
- index runs
- backend-only installation metadata

## Redaction Rules

Dashboard DTOs must not contain:

- GitHub tokens
- installation tokens
- private keys
- webhook secrets
- tokenized clone URLs
- clone filesystem paths
- service credentials
- raw backend payload dumps
- unredacted server paths

Diagnostics must be bounded and redacted. A diagnostic can name a safe project-relative path or a redacted path pattern, but not a local clone directory.

## Filters And Sorting

The default dashboard view is a multi-project overview. Filters and sorting are user-scoped view state and do not mutate shared projection records.

Supported local contract filters:

- project text query
- dashboard state

Supported sort modes:

- `updatedDesc`
- `status`
- `name`

## Validation

```bash
flutter test test/shipglows/data/dashboard_readonly_projection_repository_test.dart
rg -n "token|installationToken|clonePath|cloneUrl|serviceCredential|x-access-token" lib/shipglows test/shipglows shipglows_data/technical/dashboard-readonly-projection.md
```
