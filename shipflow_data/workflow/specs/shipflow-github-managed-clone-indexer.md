---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-09"
created_at: "2026-05-09 17:22:02 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 10:08:00 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "github-managed-clone-indexer"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux un runner/indexer qui lit un repo GitHub via un clone gere et projette les fichiers Markdown ShipFlow dans Firestore, afin que l'app puisse afficher les projets sans exposer de secrets ni rendre Firestore canonique."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions for Firebase"
  - "GitHub repositories"
  - "GitHub App installation tokens"
  - "managed clone runner"
  - "ShipFlow Markdown artifacts"
  - "lib/data/shipflow_sources/"
  - "lib/shipflow/"
depends_on:
  - artifact: "shipflow_data/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/firebase-firestore-projection-migration.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "shipflow_data/workflow/specs/shipflow-project-source-onboarding.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "shipflow_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "https://firebase.google.com/shipflow_data/functions"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/firestore"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/firestore/security/get-started"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/rest/repos/repos"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/rest/repos/contents"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/rest/git/trees"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
supersedes: []
evidence:
  - "User decision 2026-05-09: one user can have multiple projects and each ShipFlow project is exactly one GitHub repository."
  - "User decision 2026-05-09: clone is mandatory, infrastructure-managed, and hidden from the user."
  - "User decision 2026-05-09: Markdown/repository files remain source of truth; Firestore is a projection."
  - "User decision 2026-05-09: V1 is read-only; no Markdown writes, commits, or pushes."
  - "User decision 2026-05-09: Firebase Auth identity and GitHub repository access are separate."
  - "User decision 2026-05-09: GitHub wins every conflict."
next_step: "/sf-ready ShipFlow GitHub Managed Clone Indexer"
---

# Title

ShipFlow GitHub Managed Clone Indexer

# Status

Draft spec. This is the architecture slice that should be readied before implementing Firebase project onboarding or any agent/terminal runner. It turns the foundational decisions into an implementation-ready boundary for GitHub access, managed clone materialization, Markdown indexing, and Firestore projection.

# User Story

En tant que fondatrice de ShipFlow, je veux un runner/indexer qui lit un repo GitHub via un clone gere et projette les fichiers Markdown ShipFlow dans Firestore, afin que l'app puisse afficher les projets sans exposer de secrets ni rendre Firestore canonique.

# Minimal Behavior Contract

The system accepts an authenticated Firebase user and a GitHub repository identity, verifies server-side GitHub access, materializes a managed clone in a trusted runner, indexes only the allowed ShipFlow Markdown artifacts, and writes a Firestore projection under the shared opaque `projects/{projectId}` plus user-scoped refs. GitHub repository metadata such as `owner/repo` is stored as data for authority, display, and deduplication; it is not the Firestore document key. If GitHub access, clone, parsing, or projection fails, the project remains registered with a redacted diagnostic and a stale or failed status; no client secret is exposed and Firestore is never treated as canonical. The easy edge case to miss is storing clone paths, GitHub tokens, or projected Markdown in a way that lets the Flutter client bypass GitHub authority.

# Success Behavior

- Given a signed-in Firebase user and a GitHub repo identity, the client can request repository registration/indexing without seeing GitHub tokens or clone paths.
- Given valid GitHub access, the trusted runner can list/verify the repo, create a short-lived GitHub access credential, and clone or refresh the repo in an internal workspace.
- Given a managed clone, the indexer reads the approved ShipFlow Markdown scope and records path, source commit, content hash, parsed frontmatter, artifact type, parse status, and content/projection data in Firestore.
- Given Firestore projection exists, Flutter reads project status and indexed artifacts from Firestore only as a cache/projection of GitHub state.
- Given GitHub changes, the next index run marks stale projection and rewrites affected Firestore documents from GitHub/clone.
- Given disagreement between GitHub/clone and Firestore, GitHub/clone wins.

# Error Behavior

- If Firebase Auth is missing or invalid, runner endpoints return unauthorized and write no project data.
- If GitHub access is missing, revoked, insufficient, or private repo permission fails, access status becomes `needs_github_app`, `github_access_lost`, `installation_suspended`, or `access_check_failed` with redacted diagnostics, matching the auth/access spec.
- If clone fails, the status becomes `clone_failed`; Firestore keeps previous projection marked stale when it exists.
- If a Markdown file cannot be parsed, the file gets `parse_failed` status but other valid files still index.
- If Firestore write fails after clone/index succeeds, the run is recorded as `projection_failed`; the client must not show it as fresh.
- If a file is deleted from GitHub, the corresponding Firestore projection is marked deleted or removed during the same source commit reconciliation.
- If a client sends a path, token, or source commit it should not control, the runner ignores it and derives authority from GitHub plus server state.

# Problem

ShipFlow has converged on the right product architecture: project equals GitHub repository, clone is mandatory, Firestore is projection, and V1 is read-only. The remaining risk is implementation drift: Flutter could become responsible for secrets, Firestore could accidentally become canonical, or the clone could be exposed as a user setting. A precise runner/indexer spec is needed before coding the Firebase/Firebase Auth/Firestore layer.

# Solution

Create a trusted runner boundary behind Firebase-authenticated callable/HTTP functions. The runner verifies Firebase identity, obtains GitHub access through a GitHub App or equivalent server-side credential flow, materializes a managed clone in an internal workspace, indexes the allowed Markdown corpus, and updates Firestore projection documents with source commit and diagnostics. In V1, the managed clone may be ephemeral per indexing run; Firestore stores projection and clone metadata, not the `.git` working tree.

# Scope In

- Define Firestore document contracts for users, GitHub repos, projects, indexing runs, indexed Markdown files, diagnostics, and projection freshness.
- Define trusted runner contracts for `registerRepository`, `verifyGitHubAccess`, `indexRepository`, `getIndexStatus`, and future-safe `refreshRepositoryProjection`.
- Define managed clone semantics for V1 read-only indexing.
- Define allowed Markdown paths and artifact metadata.
- Define GitHub access boundary using server-side credentials, with GitHub App installation tokens as the preferred future model.
- Define security invariants for Firebase Auth, Firestore rules, GitHub tokens, clone paths, and diagnostics.
- Define test strategy for model contracts, indexer parsing, projection staleness, and failure handling.
- Update shipflow_data maps so future implementation agents know this spec owns the runner/indexer slice.

# Scope Out

- Building the full onboarding UI.
- Implementing GitHub OAuth or GitHub App installation UX.
- Writing Markdown back to the repository.
- Creating commits, branches, pull requests, or pushes.
- Running user agents or terminal sessions from the web UI.
- Implementing multi-user sharing beyond user/project ownership fields and future-ready membership shape.
- Persisting a long-lived working tree as product behavior.
- Storing Git object databases inside Firestore.
- Migrating or merging Supabase code.
- Reintroducing FastAPI as the required architecture.

# Constraints

- V1 is read-only.
- Firebase Auth identity and GitHub access are separate and both must be checked where relevant.
- The Flutter client never receives GitHub tokens, service account credentials, clone paths, or server filesystem details.
- Firestore stores projection/index/status data; GitHub repository content remains canonical.
- GitHub wins every conflict.
- Clone materialization is mandatory before indexing, but in V1 it can be ephemeral inside the trusted runner.
- Diagnostics must be useful but redacted.
- Repository content is untrusted input and Markdown/frontmatter parsing must be defensive.
- Firestore rules must prevent cross-user project reads and writes before real data is enabled.

# Dependencies

- Fresh official Firebase shipflow_data checked 2026-05-09: Cloud Functions, Cloud Firestore, and Firestore Security Rules.
- Fresh official GitHub shipflow_data checked 2026-05-09: repository API, contents API, Git trees API, and GitHub App installation authentication.
- GitHub official docs confirm installation tokens can be used for server-to-server API requests and HTTP Git clone when the app has contents permission.
- GitHub official docs confirm installation access tokens expire after one hour, so the runner must create short-lived credentials per operation instead of storing usable clone credentials in Firestore.
- Existing source reader/parser patterns live under `lib/data/shipflow_sources/`.
- Foundational architecture contract is `shipflow_data/technical/shipflow-foundational-architecture.md`.
- Firebase translation contract is `shipflow_data/workflow/specs/firebase-firestore-projection-migration.md`.

# Invariants

- `projectId` is opaque and stable; a server-side unique lookup maps the current GitHub repository identity to the shared project.
- Each project has exactly one GitHub repo.
- One Firebase user can own or access many projects.
- Firestore documents always carry `github.owner`, `github.repo`, `github.fullName`, `sourceCommit`, `projectionStatus`, and `updatedAt` where relevant.
- Indexed files always carry `path`, `sourceCommit`, `blobSha` or content hash, `artifactType`, `parseStatus`, and `indexedAt`.
- Client-triggered indexing is a request; server-side GitHub/clone state is the authority.
- Tokens and clone filesystem paths are never written to user-readable Firestore documents.
- Firestore stale/fresh status is always tied to a GitHub commit SHA.

# Links & Consequences

- Data: Firestore schema must support projection rebuilds, deleted files, partial parse failures, and future multi-user membership.
- Auth: Firebase Auth gates app identity; GitHub App/OAuth gates repository access.
- Security: privileged work moves to Cloud Functions or an equivalent trusted runner; Flutter remains a projection reader/requester.
- Performance: indexing can be asynchronous; the UI must tolerate `queued`, `running`, `stale`, `failed`, and `fresh` statuses.
- Ops: ephemeral clone is lower-maintenance for V1 but may be slower; persistent clone can be added later behind the same contract.
- Product: onboarding can be built after this boundary without exposing clone internals.
- Future write-back: commits and conflict resolution require a separate high-risk spec.

# Documentation Coherence

- Add this spec to `shipflow_data/editorial/content-map.md`.
- Add this spec to `shipflow_data/technical/code-docs-map.md`.
- Keep `shipflow_data/technical/shipflow-foundational-architecture.md` as the canonical decision record.
- Future implementation must update README only when Firebase/GitHub runner code exists.
- Future `sf-docs` pass should refine the exact ShipFlow Markdown artifact allowlist.

# Edge Cases

- Private repo access is revoked between registration and indexing.
- GitHub token expires during clone or API listing.
- Repo is renamed or transferred.
- Default branch changes after project registration.
- Repo is empty or has no allowed ShipFlow Markdown files.
- Markdown file is huge, binary-like, malformed, or has invalid frontmatter.
- Two index runs overlap for the same repo.
- Firestore projection is fresh for commit A while GitHub default branch is now commit B.
- A deleted file remains in Firestore from an old run.
- User A signs in after user B on the same device and cached projection is visible client-side.
- Firestore rules allow list access broader than intended.
- Runner logs accidentally include tokenized clone URLs.

# Implementation Tasks

1. Create Firestore contract shipflow_data for `users/{uid}`, `projects/{projectId}`, `projects/{projectId}/indexedFiles/{fileId}`, `projects/{projectId}/indexRuns/{runId}`, and `projects/{projectId}/diagnostics/{diagnosticId}`.
2. Add Dart domain models for project identity, projection status, indexed file metadata, index run state, and redacted diagnostics under `lib/shipflow/` or `lib/data/shipflow_sources/`.
3. Add pure validation helpers for GitHub repo identity, project ID derivation, allowed Markdown paths, artifact type detection, and stale/fresh source commit comparison.
4. Define a runner interface in code or shipflow_data with `registerRepository`, `verifyGitHubAccess`, `indexRepository`, `getIndexStatus`, and `refreshRepositoryProjection`.
5. Implement a local/fake runner adapter for tests that reads a local repo fixture but returns server-shaped Firestore projection payloads.
6. Reuse or adapt existing Markdown readers/parsers to emit indexed artifact records without requiring UI state.
7. Add Firestore repository abstraction for reading projection status and indexed files from Flutter, with no direct clone or token API.
8. Draft Firestore security rule requirements before enabling real Firestore writes.
9. Add tests for user/project scoping, stale commit detection, deleted file reconciliation, parse failures, unsafe diagnostics, and overlapping runs.
10. Update `shipflow_data/editorial/content-map.md`, `shipflow_data/technical/code-docs-map.md`, and `shipflow_data/technical/shipflow-foundational-architecture.md` links after implementation starts.

# Acceptance Criteria

- A fresh agent can implement the runner/indexer without using Supabase or making Firestore canonical.
- Project identity is an opaque `projectId` plus GitHub repository metadata; GitHub remains authoritative for access and deduplication.
- Clone materialization is server-side and hidden from the user.
- V1 indexing performs no Markdown writes, commits, pushes, or branch mutations.
- Firestore projection records include source commit and stale/fresh state.
- GitHub/clone state wins every conflict with Firestore.
- Token and clone path handling is server-only and redacted in diagnostics.
- Partial parse failures do not block indexing of other files.
- Tests cover happy path, access failure, clone failure, parse failure, stale projection, deleted files, and cross-user isolation.

# Test Strategy

- Unit tests for GitHub identity parsing and opaque project ID lookup/deduplication.
- Unit tests for allowed Markdown path policy and artifact classification.
- Unit tests for projection freshness by source commit.
- Parser tests using existing `test/data/shipflow_sources` patterns.
- Fake-runner tests for clone/index success, access denied, clone failed, and partial parse failed.
- Repository tests for Firestore-shaped payload mapping and redacted diagnostics.
- Security-rule tests must be added before any production Firestore write path ships.
- Full `flutter analyze` and `flutter test` after code implementation.

# Risks

- High security risk if GitHub tokens or tokenized clone URLs reach client logs or Firestore.
- High architecture risk if Firestore becomes the editing source before write-back is designed.
- Medium cost/performance risk if ephemeral clone is slow for larger repos.
- Medium product risk if GitHub App installation UX is deferred too long.
- Medium data risk if stale/deleted Firestore documents are not reconciled by source commit.

# Execution Notes

- Recommended V1 clone model: ephemeral managed clone inside a trusted runner per indexing run. This satisfies the mandatory clone decision without introducing persistent server maintenance too early.
- Recommended production direction: Firebase Cloud Functions as control plane; if clone/index runtime limits become painful, use Cloud Run Jobs or another trusted worker behind the same function contract.
- Recommended GitHub access direction: GitHub App installation tokens for repository access, because they are short-lived and repo-scoped by installation permissions.
- Recommended Firestore content shape: store full Markdown text only when needed for the app experience, always tagged with source commit and never treated as canonical.
- Fresh-shipflow_data verdict: checked. Official Firebase and GitHub shipflow_data support the boundary used here; implementation must re-check shipflow_data before adding real SDK/API code.

# Open Questions

None for this spec. Deferred decisions are intentionally out of scope: write-back, persistent clone optimization, terminal/agent execution, and multi-user sharing semantics.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-09 17:22:02 UTC | sf-spec | GPT-5 Codex | Created runner/indexer spec from foundational architecture decisions. | Draft spec created. | /sf-ready ShipFlow GitHub Managed Clone Indexer |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Spec created from user architecture decisions and official Firebase/GitHub shipflow_data. |
| sf-ready | next | Validate completeness, security boundaries, Firestore contract, and implementation readiness. |
| sf-start | pending | Implement only after ready gate. |
| sf-verify | pending | Verify behavior, tests, and shipflow_data after implementation. |
| sf-end | pending | Close task and update trackers/shipflow_data. |
| sf-ship | pending | Commit/push only after checks and explicit ship flow. |
