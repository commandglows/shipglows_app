---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-10"
updated: "2026-05-30"
status: draft
source_skill: sf-build
scope: "firestore-data-model"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions"
  - "GitHub repositories"
  - "WinFlowz suiteAccess mirror"
depends_on:
  - "shipflow_data/workflow/specs/shipflow-firestore-data-model.md@0.1.0"
supersedes: []
evidence:
  - "shipflow_data/workflow/specs/shipflow-firestore-data-model.md"
  - "shipflow_data/workflow/specs/shipflow-product-entitlements-compliance.md"
next_review: "2026-06-10"
next_step: "/sf-verify ShipFlow Firestore Data Model"
---

# Firestore Data Model

## Purpose

Define the Firestore schema contract for users, shared GitHub-backed projects, memberships, latest Markdown projection, index history, diagnostics, and user-scoped cross-project dashboard views.

## Collection Paths

- `users/{uid}`
- `users/{uid}/suiteAccess/{productId}` or a server-owned equivalent mirror
- `users/{uid}/projectRefs/{projectId}`
- `users/{uid}/feedItems/{itemId}`
- `projects/{projectId}`
- `projects/{projectId}/members/{uid}`
- `projects/{projectId}/indexedFiles/{fileId}`
- `projects/{projectId}/indexRuns/{runId}`
- `projects/{projectId}/diagnostics/{diagnosticId}`

`projectId` is opaque and stable. GitHub `owner/repo` is stored as mutable metadata.

## Ownership Rules

- Client-readable and client-scoped:
  - `users/{uid}` (safe preference/profile subset)
  - `users/{uid}/projectRefs/*`
  - `users/{uid}/feedItems/*`
  - `projects/{projectId}` read only for members
  - `projects/{projectId}/indexedFiles/*` read only for members
  - `projects/{projectId}/indexRuns/*` read only for members
  - `projects/{projectId}/diagnostics/*` read only for members
- Server-owned write surfaces:
  - `suiteAccess` or product entitlement mirror records
  - project creation/dedupe mapping
  - `projectionStatus`, `sourceCommit`, `github.headCommit`
  - `indexRuns`, `diagnostics`
  - membership role updates
  - GitHub access status transitions
- Product access rule:
  - identity and membership are insufficient without server-owned product access for `product_id=shipflow_app`
  - client writes to `suiteAccess` or entitlement mirror records are forbidden
  - `active` and non-expired `trialing` can grant access; every other status denies
  - environment mismatch denies access
- Forbidden in client-readable payloads:
  - GitHub tokens
  - installation tokens
  - service credentials
  - clone filesystem paths
  - tokenized clone URLs

## Roles

Minimal role vocabulary:

- `owner`
- `viewer`

## Core Fields

`users/{uid}`

- `uid`, `email`, `displayName`
- `githubConnectionStatus` (`connected`, `github_access_lost`, `access_check_failed`, `not_connected`)
- `dashboardDefaultProjectId`
- `createdAt`, `updatedAt`

`users/{uid}/suiteAccess/{productId}` or equivalent server-owned mirror

- `productId` (`shipflow_app`)
- `environment` (`local`, `preview`, `staging`, `production`)
- `status` (`active`, `trialing`, `inactive`, `expired`, `revoked`, `refunded`, `pending_review`)
- `grantsAccess` (server-derived)
- `reason`
- `planId` (optional)
- `checkedAt`
- `expiresAt` (optional)
- `source` (`suite_ledger`)

`projects/{projectId}`

- `projectId` (opaque)
- `github.owner`, `github.repo`, `github.fullName`
- `github.defaultBranch`, `github.headCommit`
- `projectionStatus` (`fresh`, `stale`, `indexing`, `partial`, `access_lost`, `error`)
- `accessStatus` (`not_connected`, `needs_github_app`, `connected`, `access_cached`, `github_access_lost`, `installation_suspended`, `access_check_failed`)
- `activeIndexRun` (`runId`, `requestId`, `status`, `startedAt`) when a runner-owned request is queued or running
- `createdAt`, `updatedAt`

`projects/{projectId}/indexedFiles/{fileId}`

- `fileId`, `path`, `artifactType`
- `sourceCommit` (required)
- `contentHash`
- `projectionStatus`
- `parseStatus` (`parsed`, `parse_failed`, `skipped`, `deleted`)
- `frontmatter` (defensively parsed metadata map)
- `deleted` (boolean tombstone)
- `indexedAt`
- `markdownBody` (optional full projection content)

`projects/{projectId}/indexRuns/{runId}`

- `runId`
- `requestId` (runner idempotency key scoped by `projectId`)
- `sourceCommit`
- `status` (`queued`, `running`, `already_running`, `success`, `partial`, `failed`, `canceled`)
- `startedAt`, `finishedAt`
- `filesIndexed`, `filesDeleted`

`projects/{projectId}/diagnostics/{diagnosticId}`

- `diagnosticId`, `code`, `severity`, `message`
- `createdAt`
- `redactedPath` (optional)

`users/{uid}/projectRefs/{projectId}`

- `projectId`
- `role` (`owner` or `viewer`)
- `projectionStatus`
- `updatedAt`

`users/{uid}/feedItems/{itemId}`

- `itemId`, `projectId`, `title`, `createdAt`

## Unique GitHub Repo Resolution

Server-owned lookup maps GitHub repository identity to one active opaque `projectId`:

- Key inputs: installation/repository identity and normalized `github.fullName`.
- On connect:
  - if lookup exists, join existing `projects/{projectId}`
  - if lookup missing, create a new project with generated opaque ID
- On rename/transfer:
  - keep existing `projectId`
  - update mutable metadata (`owner`, `repo`, `fullName`, URLs)
- On duplicate registration attempts:
  - resolve to existing project, do not create a second canonical project document

## Freshness And Deletion Contract

- Freshness is evaluated by `github.headCommit` versus indexed records `sourceCommit`.
- If they differ, projection is `stale` and remains readable until reindex.
- `deleted: true` marks files removed from GitHub to avoid silent stale content.
- `projectionStatus` transitions are backend-controlled:
  - `indexing` during run
  - `fresh` when latest commit indexed successfully
  - `partial` when indexed with recoverable failures
  - `stale` when repo head advances
  - `access_lost` when GitHub access is no longer valid
  - `error` for failed indexing or contract errors

## Retention

- Keep latest 20 `indexRuns` per project.
- Cleanup ordering: newest by `startedAt` first; trim items older than rank 20.

## Safe JSON Examples

```json
{
  "projectId": "proj_8f3c9a",
  "github": {
    "owner": "octocat",
    "repo": "hello-world",
    "fullName": "octocat/hello-world",
    "defaultBranch": "main",
    "headCommit": "abc123"
  },
  "projectionStatus": "stale",
  "createdAt": "2026-05-10T10:00:00.000Z",
  "updatedAt": "2026-05-10T10:30:00.000Z"
}
```

```json
{
  "fileId": "specs_shipflow-firestore-data-model_md",
  "path": "shipflow_data/workflow/specs/shipflow-firestore-data-model.md",
  "artifactType": "spec",
  "sourceCommit": "abc123",
  "contentHash": "sha256:...",
  "projectionStatus": "fresh",
  "deleted": false,
  "indexedAt": "2026-05-10T10:30:00.000Z",
  "markdownBody": "# Firestore Data Model"
}
```

```json
{
  "diagnosticId": "diag_20260510_001",
  "code": "source_too_large",
  "severity": "warning",
  "message": "Body truncated above size threshold.",
  "createdAt": "2026-05-10T10:30:00.000Z",
  "redactedPath": "shipflow_data/workflow/specs/large-file.md"
}
```

## Validation

```bash
rg -n "users/\\{uid\\}|projects/\\{projectId\\}|indexedFiles|indexRuns|diagnostics|projectRefs|feedItems|suiteAccess|shipflow_app|grantsAccess" shipflow_data/technical/firestore-data-model.md
flutter test test/data/firestore_projection
rg -n "token|installation token|service credential|clone path|clone URL" shipflow_data/technical/firestore-data-model.md lib/data/firestore_projection test/data/firestore_projection
```
