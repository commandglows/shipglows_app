---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-09"
updated: "2026-05-09"
status: draft
source_skill: sf-docs
scope: "supabase-to-firebase-contract-map"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "backup/local-supabase-wip-2026-05-08:shipglowz_data/workflow/specs/full-supabase-migration.md"
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions for Firebase"
  - "GitHub repositories"
  - "local clones"
depends_on:
  - "shipglowz_data/workflow/specs/firebase-firestore-projection-migration.md@0.1.0"
  - "shipglowz_data/technical/recovered-branch-reality.md@0.1.0"
supersedes: []
evidence:
  - "Supabase WIP branch inspected on 2026-05-09."
  - "Firebase official docs checked on 2026-05-09."
next_review: "2026-06-09"
next_step: "/sf-start ShipGlowz Project Source Onboarding"
---

# Supabase To Firebase Contract Map

## Purpose

This document extracts the useful contracts from `backup/local-supabase-wip-2026-05-08` and rewrites them as Firebase/Firestore architecture constraints. It is not a code migration plan from Supabase APIs.

## Owned Files

- `shipglowz_data/technical/supabase-to-firebase-contract-map.md`
- `shipglowz_data/workflow/specs/firebase-firestore-projection-migration.md`
- Future Firebase/Auth/Firestore implementation specs

## Entrypoints

- `backup/local-supabase-wip-2026-05-08:shipglowz_data/workflow/specs/full-supabase-migration.md`
- `backup/local-supabase-wip-2026-05-08:supabase/migrations/*.sql`
- `backup/local-supabase-wip-2026-05-08:lib/data/services/supabase_*`
- `backup/local-supabase-wip-2026-05-08:supabase/functions/**`

## Invariants

- GitHub repository identity is canonical.
- Local clone is the working copy for Markdown read/write.
- Firestore is projection/sync/index.
- Firebase Auth identity gates user access.
- Cloud Functions own privileged secrets and server-side GitHub/provider operations.
- Supabase implementation files are not merged.

## Contract Mapping

| Supabase WIP contract | Firebase/Firestore target | Recover? | Notes |
| --- | --- | --- | --- |
| Supabase Auth session restore | Firebase Auth session restore | yes | Preserve auth/session state model, not Supabase SDK code |
| `profiles` table | `users/{uid}` document | yes | Store display metadata and app preferences pointers |
| `projects` table | `projects/{githubFullNameHash}` or `users/{uid}/projects/{projectId}` projection | yes | Must include GitHub `owner`, `repo`, `fullName`, `htmlUrl`, local clone metadata, projection status |
| `project_members` table | `projects/{projectId}/members/{uid}` or membership map | yes | Needed for future workspace/team sharing |
| RLS owner/member functions | Firestore Security Rules + Cloud Function authorization helpers | yes | Must adapt to document paths and rule limitations |
| `user_settings` table | `users/{uid}/settings/app` | yes | Remote projection of settings; local preferences may still exist |
| Content/persona/idea/drip tables | Future projection collections | park | ContentFlow-specific; keep contract style, not immediate product scope |
| `offline_replay_audit` | `users/{uid}/syncAudit/{eventId}` or function logs | yes | Useful for replay observability |
| `edge_function_audit` | Cloud Function structured logs and optional audit collection | yes | Keep redacted request/error model |
| Supabase Storage private buckets | Firebase Storage or later storage decision | park | Not needed before feedback/files; do not choose now |
| Supabase Edge Functions `github-integration` | Cloud Functions GitHub integration | yes | Server-side GitHub tokens and repo tree/list actions |
| Supabase Edge Functions `provider-credentials` | Cloud Functions BYOK secret boundary | yes | Keep server-trust boundary; storage mechanism needs dedicated BYOK spec |
| Supabase Edge Functions `app-actions` | Cloud Functions runner/agent dispatcher | concept only | High-risk; future local/cloud runner spec |

## Firestore Projection Shape Draft

This is a contract draft, not final schema.

```text
users/{uid}
  email
  displayName
  createdAt
  updatedAt

users/{uid}/settings/app
  theme
  locale
  githubRepositoryDiscoveryMode

projects/{projectId}
  github:
    owner
    repo
    fullName
    htmlUrl
    defaultBranch
    private
  localClone:
    pathRedacted
    status
    lastCheckedAt
  projection:
    status
    lastIndexedAt
    sourceCommit
  createdByUid
  createdAt
  updatedAt

projects/{projectId}/members/{uid}
  role
  joinedAt

projects/{projectId}/sourceDiagnostics/{diagnosticId}
  code
  severity
  message
  redactedSource
  createdAt
```

`projectId` should be deterministic from GitHub identity or generated with a unique `github.fullName` constraint enforced by Cloud Function/client transaction rules. The exact choice belongs to the implementation spec.

## Security Rule Requirements

- A signed-in user can read a project only if `projects/{projectId}/members/{uid}` exists.
- Only owner/admin roles can update project metadata.
- Client writes cannot set arbitrary membership for another user.
- Client writes cannot mark projection as fresh without a trusted indexing path.
- Any secret-bearing field is forbidden in Firestore client-readable documents.
- Firestore rules must deny broad collection reads that bypass membership.

## Cloud Function Requirements

- Validate Firebase Auth token on every protected call.
- Verify project membership before GitHub repo actions.
- Store GitHub/OpenRouter/provider secrets only in server-trust storage.
- Return redacted errors.
- Emit request IDs for diagnostics.
- Keep GitHub repo list/tree operations server-side when OAuth tokens are involved.

## Local Clone Requirements

- Clone path is required for Markdown read/write workflows.
- Clone remote URL must match GitHub `owner/repo`.
- Path diagnostics must be redacted.
- Web runtime cannot access local clone without a local runner or explicit bridge.
- Firestore must not claim fresh projection when local clone has unindexed changes.

## Recovered Acceptance Criteria

- Auth identity is scoped by provider UID.
- User/project data is not globally readable.
- Queued offline writes never replay under the wrong user.
- Secret-bearing integrations fail closed when the server function is missing.
- Diagnostics are redacted.
- Remote DB can be rebuilt or reconciled from GitHub/Markdown state.

## Parked Contracts

- Anonymous feedback.
- Audio feedback storage.
- ContentFlow pipeline tables.
- Drip plan execution.
- Publishing accounts.
- Terminal/agent execution.
- BYOK key persistence details.

## Validation

```bash
rg -n "Supabase|Firebase|Firestore|Cloud Functions|GitHub repository|local clone" shipglowz_data/workflow/specs shipglowz_data/technical README.md
rg -n "supabase_flutter|Supabase" pubspec.yaml lib test
```

## Reader Checklist

- Is the next implementation recovering a contract instead of porting Supabase code?
- Does every project map to a GitHub repository?
- Does every remote record remain projection/sync/index?
- Are secrets kept out of Flutter and client-readable Firestore docs?
- Is local clone mismatch handled before write-back?

## Maintenance Rule

When a Firebase implementation spec is created, mark each row in `Contract Mapping` as implemented, parked, or superseded.
