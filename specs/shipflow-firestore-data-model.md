---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-09"
created_at: "2026-05-09 18:19:39 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 10:14:49 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "firestore-data-model"
owner: "Diane"
user_story: "En tant que fondatrice de ShipFlow, je veux un modele Firestore clair pour les utilisateurs, repositories GitHub, projections Markdown, indexations et diagnostics, afin que les specs fondamentales restent coherentes avant toute implementation."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Firestore Security Rules"
  - "Cloud Functions for Firebase"
  - "GitHub repositories"
  - "managed clone runner"
  - "ShipFlow Markdown artifacts"
  - "ShipFlow dashboard"
depends_on:
  - artifact: "docs/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/shipflow-github-managed-clone-indexer.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/firebase-firestore-projection-migration.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "https://firebase.google.com/docs/firestore/data-model"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/firestore/security/get-started"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/firestore/security/rules-structure"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/firestore/query-data/get-data"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
supersedes: []
evidence:
  - "User decision 2026-05-09: if two users connect the same GitHub repo, ShipFlow uses one shared project with membership, not duplicate projects."
  - "User decision 2026-05-09: project IDs should be opaque; GitHub full name is stored as data to survive repo rename/transfer."
  - "User decision 2026-05-09: keep only latest file projection; GitHub owns history."
  - "User decision 2026-05-09: deleted repo files should remain temporarily visible as deleted projection records."
  - "User decision 2026-05-09: model minimal ShipFlow roles now: owner and viewer."
  - "User decision 2026-05-09: users need global preferences and cross-project views."
  - "User decision 2026-05-09: no GitHub token in client-readable Firestore documents."
  - "User decision 2026-05-09: keep 20 index runs per project."
next_step: "/sf-start ShipFlow Firestore Data Model"
---

# Title

ShipFlow Firestore Data Model

# Status

Ready foundational spec. This spec defines the Firestore data shape slice for implementation after the foundational coherence pass. It remains bounded to schema contracts, model/path definitions, examples, and validation scaffolding; actual Firestore rules, Firebase initialization, Cloud Functions, GitHub App flows, and production writes stay out of scope unless a later ready spec owns them.

# User Story

En tant que fondatrice de ShipFlow, je veux un modele Firestore clair pour les utilisateurs, repositories GitHub, projections Markdown, indexations et diagnostics, afin que les specs fondamentales restent coherentes avant toute implementation.

# Minimal Behavior Contract

Firestore stores ShipFlow application state and a rebuildable projection of GitHub/Markdown content. The system accepts Firebase-authenticated users, links them to shared GitHub-repository projects through membership documents, stores the latest indexed Markdown projection with a `sourceCommit`, keeps 20 recent index runs, and exposes user-scoped cross-project views. If Firestore disagrees with GitHub or the managed clone, Firestore is stale and is rebuilt; it never becomes canonical. The easy edge case to miss is querying Firestore as if security rules filter data automatically: every user-facing query must be shaped so rules can prove membership before returning documents.

# Success Behavior

- Given a Firebase user, `users/{uid}` stores app profile, preferences, GitHub connection status, and dashboard defaults.
- Given two users connect the same GitHub repo, they reference one shared `projects/{projectId}` document with separate membership documents.
- Given a repo is renamed or transferred, the opaque `projectId` stays stable while GitHub metadata fields update.
- Given a project is indexed, Firestore stores the latest Markdown projection for each allowed file, including full Markdown content when useful for UI/search, always tied to `sourceCommit`.
- Given GitHub advances to a new commit, existing projections remain readable but are marked stale until reindexed.
- Given a file disappears from GitHub, Firestore marks the projection `deleted: true` instead of silently leaving stale active content.
- Given the dashboard needs a global view, user-scoped references or feed documents support cross-project reads without scanning unauthorized projects.
- Given an index run completes, only the latest 20 `indexRuns` are retained for the project.

# Error Behavior

- If a user is not authenticated, client Firestore reads and writes fail closed.
- If a user is not a member of a project, the client cannot read that project, indexed files, diagnostics, or index runs.
- If GitHub access is revoked, access status becomes `github_access_lost` or `access_check_failed`; existing projection is marked stale instead of deleted.
- If an indexer writes projection data without `sourceCommit`, the write is invalid.
- If a client attempts to write server-owned fields, rules reject the write.
- If a projection document exceeds Firestore document-size constraints, the indexer must store a truncated body plus extract metadata, and record a diagnostic.
- If a duplicate GitHub repo is registered, the system resolves to the existing shared project instead of creating a second canonical project.

# Problem

The architecture decisions are now clear, but Firestore can still drift into a vague or unsafe shape. Without a data-model spec, implementation could duplicate projects per user, use GitHub names as brittle document IDs, store tokens in client-readable documents, keep unbounded run history, or make Firestore content look canonical.

# Solution

Use a shared-project Firestore model:

- `users/{uid}` stores user profile and preferences.
- `projects/{projectId}` stores one canonical app project for one GitHub repository.
- `projects/{projectId}/members/{uid}` stores minimal ShipFlow membership.
- `projects/{projectId}/indexedFiles/{fileId}` stores the latest rebuildable Markdown projection per file.
- `projects/{projectId}/indexRuns/{runId}` stores the 20 most recent indexing runs.
- `projects/{projectId}/diagnostics/{diagnosticId}` stores redacted diagnostics.
- `users/{uid}/projectRefs/{projectId}` and `users/{uid}/feedItems/{itemId}` support user-scoped cross-project dashboard views.
- Server-only storage outside client-readable Firestore owns secrets and GitHub credentials.

# Scope In

- Define Firestore collections, subcollections, document IDs, field groups, ownership, and status values.
- Define how one GitHub repo maps to one shared ShipFlow project.
- Define opaque `projectId` and unique GitHub identity fields.
- Define latest Markdown projection storage, including `sourceCommit`, full content policy, stale status, and deletion handling.
- Define minimal roles: `owner` and `viewer`.
- Define user preferences and cross-project view materialization.
- Define client-readable versus server-owned fields.
- Define security-rule requirements at contract level.
- Define retention policy for 20 index runs.

# Scope Out

- Writing actual Firestore rules.
- Implementing Firebase packages.
- Implementing Cloud Functions.
- Implementing GitHub App/OAuth flows.
- Implementing full-text search service or vector search.
- Implementing Markdown write-back, commits, branches, pull requests, or pushes.
- Implementing billing, organizations, or advanced teams.
- Persisting GitHub tokens in Firestore.

# Constraints

- Firestore is a projection and app-state database, not the source of truth for repository content.
- GitHub repository plus Markdown files remain canonical.
- Each ShipFlow project maps to exactly one GitHub repo.
- Project IDs are opaque and stable.
- GitHub `owner/repo` is data, not the Firestore document ID.
- The latest projection is enough in V1 because GitHub owns history.
- Full Markdown content may be stored only as projection and always with `sourceCommit`.
- Firestore Security Rules must be able to prove user membership without relying on client filtering.
- Server-owned writes should happen through Cloud Functions or trusted runner credentials.
- No token, clone filesystem path, service credential, or tokenized clone URL can be client-readable.

# Dependencies

- Official Cloud Firestore data model docs checked 2026-05-09: documents, collections, and subcollections are the base model.
- Official Firestore Security Rules docs checked 2026-05-09: rules must explicitly authorize paths and must be designed around request/auth/resource data.
- Official Firestore query docs checked 2026-05-09: client reads should be shaped by document paths and query constraints; rules are not a substitute for product query design.
- `specs/shipflow-github-managed-clone-indexer.md` defines runner/indexer producer behavior.
- `docs/technical/shipflow-foundational-architecture.md` defines GitHub/Markdown as canonical and Firestore as projection.

# Invariants

- `projects/{projectId}` is the only canonical app document for one GitHub repo.
- `projectId` is opaque; GitHub full name is stored in `github.fullName`.
- A unique server-side lookup prevents duplicate active projects for the same GitHub repository identity.
- User access is represented through `projects/{projectId}/members/{uid}` plus `users/{uid}/projectRefs/{projectId}`.
- Client reads must be scoped through user-owned references or membership-verifiable project paths.
- Indexed file documents represent the latest known projection only.
- Each indexed file projection has `sourceCommit`, `path`, `artifactType`, `contentHash`, `projectionStatus`, `deleted`, and `indexedAt`.
- Deleted files are represented with `deleted: true` until cleanup.
- Index runs retain only the latest 20 per project.
- GitHub wins every conflict.

# Links & Consequences

- Data: all future UI, indexing, onboarding, auth, and dashboard specs must use this schema vocabulary.
- Auth: Firebase Auth UID is app identity; GitHub access remains a separate permission check.
- Security: Firestore rules must block direct client writes to server-owned projection, index run, GitHub access, and diagnostics fields.
- Performance: global dashboards read user-scoped references/feed items, not arbitrary project scans.
- Cost: full Markdown storage increases Firestore storage/read costs, but reduces GitHub API calls and supports offline-ish dashboard reads.
- Freshness: app reads Firestore normally; freshness is determined by comparing GitHub head commit to stored `sourceCommit` during refresh/index jobs.
- Docs: all specs that mention Firestore must distinguish canonical GitHub content from rebuildable projection.

# Documentation Coherence

- Add this spec to `CONTENT_MAP.md`.
- Add this spec to `docs/technical/code-docs-map.md`.
- Update `docs/technical/shipflow-foundational-architecture.md` to list this as the Firestore schema owner.
- Future implementation must add a dedicated Firestore schema document or generated schema reference if the code grows.

# Edge Cases

- Same GitHub repo connected by two users.
- Repo renamed after project creation.
- Repo transferred to another owner.
- User loses GitHub access but still has a ShipFlow membership document.
- Owner leaves a project with no other owner.
- Indexer partially updates files and then crashes.
- Projection is fresh for commit A while GitHub default branch moved to commit B.
- Large Markdown file is too big for one Firestore document.
- Deleted file still appears in user feed.
- User switches accounts on the same device.
- Rules allow a collection group query broader than intended.
- Client attempts to write `sourceCommit`, `projectionStatus`, or membership role.

# Implementation Tasks

1. Create `docs/technical/firestore-data-model.md`.
   - Action: document collection paths, field tables, status enums, ownership rules, server-owned fields, client-writable fields, and retention policy.
   - Depends on: this spec passing `/sf-ready`.
   - Validate with: `rg -n "users/\\{uid\\}|projects/\\{projectId\\}|indexedFiles|indexRuns|diagnostics|projectRefs|feedItems" docs/technical/firestore-data-model.md`.
2. Add schema/model contract types under `lib/data/firestore_projection/`.
   - Action: define pure Dart contracts for `ShipFlowUserProfile`, `ShipFlowProjectRecord`, `ProjectMemberRecord`, `IndexedFileRecord`, `IndexRunRecord`, `DiagnosticRecord`, `UserProjectRef`, and `UserFeedItem`.
   - Depends on: Task 1 field tables.
   - Validate with: `flutter test test/data/firestore_projection`.
3. Add Firestore path constants and converter boundaries under `lib/data/firestore_projection/`.
   - Action: define path builders for `users/{uid}`, `users/{uid}/projectRefs/{projectId}`, `users/{uid}/feedItems/{itemId}`, `projects/{projectId}`, `members`, `indexedFiles`, `indexRuns`, and `diagnostics`, without initializing Firebase.
   - Depends on: Task 2 model contracts.
   - Validate with: path-generation tests proving opaque `projectId` handling and no `owner/repo` document IDs.
4. Add validation helpers under `lib/data/firestore_projection/`.
   - Action: reject missing `sourceCommit`, forbidden client-owned server fields, invalid role values, unbounded run retention inputs, and token/clone-path fields in client-readable payloads.
   - Depends on: Tasks 2-3.
   - Validate with: unit tests for forbidden client fields, token/clone-path absence, role enum values, and source-commit requirements.
5. Define unique GitHub repo resolution behavior in `docs/technical/firestore-data-model.md`.
   - Action: specify the server-owned lookup from GitHub repository identity to opaque `projectId`, including rename/transfer behavior and duplicate-registration handling.
   - Depends on: Task 1.
   - Validate with: `rg -n "opaque projectId|duplicate|rename|transfer|server-side lookup" docs/technical/firestore-data-model.md`.
6. Define projection freshness and deletion behavior in `docs/technical/firestore-data-model.md`.
   - Action: specify `sourceCommit`, `indexedAt`, `github.defaultBranch`, `github.headCommit`, `projectionStatus`, `deleted`, and stale/fresh transitions.
   - Depends on: Task 1.
   - Validate with: `rg -n "sourceCommit|github\\.headCommit|projectionStatus|deleted|stale|fresh" docs/technical/firestore-data-model.md`.
7. Define index-run retention behavior in docs and validation helpers.
   - Action: cap retained `indexRuns` at 20 per project and define cleanup ordering.
   - Depends on: Tasks 1 and 4.
   - Validate with: unit tests for 19, 20, and 21 run records.
8. Add schema examples in `docs/technical/firestore-data-model.md`.
   - Action: include safe JSON snippets for each client-readable document shape and one redacted diagnostic example.
   - Depends on: Tasks 1-7.
   - Validate with: examples contain no token, clone path, service credential, installation token, or raw backend filesystem path strings.
9. Update documentation indexes.
   - Action: align `CONTENT_MAP.md`, `docs/technical/code-docs-map.md`, and `docs/technical/shipflow-foundational-architecture.md` with the new Firestore schema document and validation command.
   - Depends on: Tasks 1-8.
   - Validate with: `rg -n "Firestore data model|firestore-data-model|firestore_projection" CONTENT_MAP.md docs/technical/code-docs-map.md docs/technical/shipflow-foundational-architecture.md`.

# Acceptance Criteria

- The data model supports one user with many projects.
- The data model supports one shared project per GitHub repo.
- The data model uses opaque project IDs.
- The data model stores GitHub metadata as fields.
- The data model stores latest Markdown projection with `sourceCommit`.
- Firestore never becomes canonical over GitHub/Markdown.
- Deleted files have an explicit representation.
- User preferences and cross-project dashboard views are represented.
- Roles are minimal and explicit: `owner`, `viewer`.
- GitHub tokens and clone paths are absent from client-readable Firestore documents.
- Index run retention is capped at 20 per project.

# Test Strategy

- Schema unit tests for Firestore path generation and opaque project ID handling.
- Model serialization tests for every document shape.
- Validation tests for forbidden client-owned fields.
- Projection freshness tests for matching and mismatched `sourceCommit`.
- Duplicate repo registration tests using GitHub identity lookup.
- Deleted-file projection tests.
- Index-run retention tests for max 20 runs.
- Future Firestore emulator security tests before real rules ship.

# Risks

- High security risk if rules cannot prove membership for every project subcollection query.
- High data risk if duplicate projects are created for the same repo.
- Medium cost risk if full Markdown content is stored and read too broadly.
- Medium product risk if user-scoped global feed documents become canonical instead of derived.
- Medium migration risk if GitHub repo rename/transfer behavior is not tested.

# Execution Notes

- Files to read first: `docs/technical/shipflow-foundational-architecture.md`, `specs/shipflow-github-managed-clone-indexer.md`, `specs/shipflow-auth-github-access.md`, `specs/shipflow-markdown-artifact-governance.md`, `specs/shipflow-dashboard-readonly-projection.md`, `docs/technical/code-docs-map.md`, `CONTENT_MAP.md`, and current source-reader models under `lib/data/shipflow_sources/`.
- Implementation order: write the technical schema doc first, then add pure Dart contracts/path builders/validators, then tests, then documentation index updates.
- Packages to avoid in this slice: do not add Firebase SDK initialization, Cloud Functions clients, GitHub API clients, background jobs, or search/vector dependencies.
- Patterns to reuse: keep pure parsing/model code close to existing `lib/data/shipflow_sources/` conventions and keep tests under a mirrored `test/data/firestore_projection/` directory.
- Decision on Markdown storage: store the latest full Markdown projection when useful for app UX/search, but always tag it with `sourceCommit`, `contentHash`, and `projectionStatus`. The app should not call GitHub on every screen render; GitHub is checked during refresh/index jobs.
- Decision on freshness: a new GitHub commit does not automatically corrupt Firestore. It only makes the projection stale until the runner reindexes from the new commit.
- Decision on history: Firestore keeps latest file projection only. GitHub owns version history.
- Decision on deletion: use `deleted: true` initially to avoid silent stale UI and to support diagnostics.
- Decision on shared repo: one shared project per GitHub repo, with memberships.
- Validation commands: `flutter test test/data/firestore_projection`, `rg -n "users/\\{uid\\}|projects/\\{projectId\\}|sourceCommit|indexRuns|projectRefs|feedItems" docs/technical/firestore-data-model.md specs/shipflow-firestore-data-model.md`, and `rg -n "token|clone path|service credential|installation token" docs/technical/firestore-data-model.md lib/data/firestore_projection test/data/firestore_projection` with findings manually reviewed for allowed redaction examples only.
- Stop conditions: stop before writing real Firestore rules, initializing Firebase, creating production collections, adding GitHub/Cloud Functions clients, storing secrets, or making any client write server-owned projection, membership role, access status, index run, or diagnostic fields.
- Fresh-docs verdict: checked. The model uses Firestore collections/documents/subcollections and path-based rule design consistent with official Firebase documentation.

# Open Questions

None for this spec. Advanced organizations, billing, write-back, search backend, vector indexing, and terminal/agent execution remain separate future specs.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-09 18:19:39 UTC | sf-spec | GPT-5 Codex | Created foundational Firestore data model spec from user decisions. | Draft spec created. | /sf-ready ShipFlow Firestore Data Model |
| 2026-05-10 10:14:49 UTC | sf-ready | GPT-5 Codex | Readiness gate after foundational coherence corrections. | ready | /sf-start ShipFlow Firestore Data Model |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Data model spec created from user answers and foundational architecture. |
| sf-ready | done | Passed readiness gate after task targets, validations, execution notes, and stop conditions were made explicit. |
| sf-start | next | Implement the Firestore data model slice only; do not initialize real Firebase or production Firestore writes in this chantier. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
