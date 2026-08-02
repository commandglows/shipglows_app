---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-09"
created_at: "2026-05-09 17:22:02 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 16:49:28 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "github-managed-clone-indexer"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipGlows, je veux un runner/indexer qui lit un repo GitHub via un clone géré et projette les fichiers Markdown ShipGlows dans Firestore, afin que l'app puisse afficher les projets sans exposer de secrets ni rendre Firestore canonique."
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
  - "ShipGlows Markdown artifacts"
  - "lib/data/shipglows_sources/"
  - "lib/shipglows/"
depends_on:
  - artifact: "shipglows_data/technical/shipglows-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/firebase-firestore-projection-migration.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-project-source-onboarding.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-auth-github-access.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/technical/firestore-data-model.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "https://firebase.google.com/docs/functions/callable"
    artifact_version: "checked-2026-05-14"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/firestore/security/get-started"
    artifact_version: "checked-2026-05-14"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/firestore/security/rules-query"
    artifact_version: "checked-2026-05-14"
    required_status: "active"
  - artifact: "https://docs.github.com/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation"
    artifact_version: "checked-2026-05-14"
    required_status: "active"
  - artifact: "https://docs.github.com/rest/apps/apps"
    artifact_version: "checked-2026-05-14"
    required_status: "active"
supersedes: []
evidence:
  - "User decision 2026-05-09: one user can have multiple projects and each ShipGlows project is exactly one GitHub repository."
  - "User decision 2026-05-09: clone is mandatory, infrastructure-managed, and hidden from the user."
  - "User decision 2026-05-09: Markdown/repository files remain source of truth; Firestore is a projection."
  - "User decision 2026-05-09: V1 is read-only; no Markdown writes, commits, or pushes."
  - "User decision 2026-05-09: Firebase Auth identity and GitHub repository access are separate."
  - "User decision 2026-05-09: GitHub wins every conflict."
next_step: "/sf-ready ShipGlows Dashboard Read-only Projection"
---
# Spec: ShipGlows GitHub Managed Clone Indexer
🟢 [shipglows_app] spec: ShipGlows GitHub Managed Clone Indexer | status: ready | path: shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md | next: /sf-ready ShipGlows Dashboard Read-only Projection

# Title

ShipGlows GitHub Managed Clone Indexer

# Status

Ready for `/sf-start` after the 2026-05-14 readiness gate. This is the architecture slice to implement before Firebase project onboarding or any agent/terminal runner. It turns the foundational decisions into an implementation-ready boundary for GitHub access, managed clone materialization, Markdown indexing, and Firestore projection.

# User Story

En tant que fondatrice de ShipGlows, je veux un runner/indexer qui lit un repo GitHub via un clone géré et projette les fichiers Markdown ShipGlows dans Firestore, afin que l'app puisse afficher les projets sans exposer de secrets ni rendre Firestore canonique.

# Minimal Behavior Contract

The system accepts an authenticated Firebase user, a GitHub repository identity, and an idempotent indexing request, verifies server-side GitHub App access, materializes one managed clone/index run at a time for the project, indexes only the allowed ShipGlows Markdown artifacts within configured size limits, and writes a Firestore projection under the shared opaque `projects/{projectId}` plus user-scoped refs. GitHub repository metadata such as `owner/repo` is stored as data for authority, display, and deduplication; it is not the Firestore document key. If auth, access, token generation, clone, parsing, size limits, timeout, or projection write fails, the project remains registered with a redacted diagnostic and a stale or failed status that can be retried safely with the same request id; no client secret is exposed and Firestore is never treated as canonical. The easy edge case to miss is a duplicate or overlapping index request that stores clone paths, logs GitHub tokens, or lets Flutter-provided paths/source commits bypass GitHub authority.

# Success Behavior

- Given a signed-in Firebase user, a GitHub repo identity, and a unique `requestId`, the client can request repository registration/indexing without seeing GitHub tokens or clone paths.
- Given valid GitHub App access, the trusted runner can list/verify the repo, create a short-lived installation token, and clone or refresh the repo in an internal workspace.
- Given a managed clone, the indexer reads the approved ShipGlows Markdown scope, enforces the existing source-reader budget (`2 MB` per file and `20 MB` per refresh unless changed by a later spec), and records path, source commit, content hash, parsed frontmatter, artifact type, parse status, and content/projection data in Firestore.
- Given Firestore projection exists, Flutter reads project status and indexed artifacts from Firestore only as a cache/projection of GitHub state.
- Given GitHub changes, the next index run marks stale projection and rewrites affected Firestore documents from GitHub/clone.
- Given disagreement between GitHub/clone and Firestore, GitHub/clone wins.
- Given an index request is replayed with the same `requestId`, the backend returns the existing run status instead of creating a second run.

# Error Behavior

- If Firebase Auth is missing or invalid, runner endpoints return unauthorized and write no project data.
- If GitHub access is missing, revoked, insufficient, or private repo permission fails, access status becomes `needs_github_app`, `github_access_lost`, `installation_suspended`, or `access_check_failed` with redacted diagnostics, matching the auth/access spec.
- If token generation fails or an installation token expires during GitHub API/clone work, the runner may create one fresh token and retry the current operation once; if the retry fails, the run becomes `access_check_failed` or `clone_failed` with redacted diagnostics.
- If clone fails, the status becomes `clone_failed`; Firestore keeps previous projection marked stale when it exists.
- If an index run for the same project is already `queued` or `running`, a new request with a different `requestId` is rejected or coalesced as `already_running`; it must not start a concurrent clone/index mutation.
- If a repo, refresh, or file exceeds configured size/time limits, the runner skips the oversized file or fails the run with `source_too_large`, `refresh_too_large`, or `index_timeout`, preserving prior readable projection as stale.
- If a Markdown file cannot be parsed, the file gets `parse_failed` status but other valid files still index.
- If Firestore write fails after clone/index succeeds, the run is recorded as `projection_failed`; the client must not show it as fresh.
- If a file is deleted from GitHub, the corresponding Firestore projection is marked deleted or removed during the same source commit reconciliation.
- If a client sends a path, token, or source commit it should not control, the runner ignores it and derives authority from GitHub plus server state.
- If the same repo is renamed or transferred, the server resolves the existing opaque `projectId` before writing projection and records the new GitHub metadata instead of creating a duplicate project.

# Problem

ShipGlows has converged on the right product architecture: project equals GitHub repository, clone is mandatory, Firestore is projection, and V1 is read-only. The remaining risk is implementation drift: Flutter could become responsible for secrets, Firestore could accidentally become canonical, or the clone could be exposed as a user setting. A precise runner/indexer spec is needed before coding the Firebase/Firebase Auth/Firestore layer.

# Solution

Create a trusted runner boundary behind Firebase-authenticated callable/HTTP functions. The runner verifies Firebase identity, obtains GitHub access only through the GitHub App installation model for V1, materializes an ephemeral managed clone in an internal workspace, indexes the allowed Markdown corpus, and updates Firestore projection documents with source commit and diagnostics. Firestore stores projection and run metadata, not the `.git` working tree; all client-triggered runner calls are idempotent requests, not direct projection writes.

# Scope In

- Define Firestore document contracts for users, GitHub repos, projects, indexing runs, indexed Markdown files, diagnostics, and projection freshness.
- Define trusted runner contracts for `registerRepository`, `verifyGitHubAccess`, `indexRepository`, `getIndexStatus`, and future-safe `refreshRepositoryProjection`.
- Define managed clone semantics for V1 read-only indexing.
- Define allowed Markdown paths and artifact metadata.
- Define GitHub access boundary using server-side GitHub App installation tokens.
- Define idempotency, one-active-run concurrency, timeout, size-limit, token-renewal, and retry behavior for indexing requests.
- Define security invariants for Firebase Auth, Firestore rules, GitHub tokens, clone paths, diagnostics, and runner logs.
- Define test strategy for model contracts, indexer parsing, projection staleness, and failure handling.
- Update shipglows_data maps so future implementation agents know this spec owns the runner/indexer slice.

# Scope Out

- Building the full onboarding UI.
- Implementing GitHub OAuth or GitHub App installation UX.
- Implementing classic GitHub OAuth as an alternate V1 repository-access path.
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
- GitHub App installation access is the only V1 runner authorization model for private repository clone/index operations.
- The Flutter client never receives GitHub tokens, service account credentials, clone paths, or server filesystem details.
- Firestore stores projection/index/status data; GitHub repository content remains canonical.
- GitHub wins every conflict.
- Clone materialization is mandatory before indexing; in V1 it is ephemeral inside the trusted runner unless a later ready spec adds persistent clones.
- Only one clone/index mutation may be active per `projectId`; duplicate client calls use `requestId` idempotency and cannot fan out concurrent work.
- Initial indexing limits inherit `SourcePathPolicy`: `2 MB` per file and `20 MB` per refresh. Larger inputs become diagnostics and do not bypass the budget.
- Runner operations must have explicit timeout and retry policy: one token-regeneration retry for token expiry, bounded retry for transient GitHub/network failures, and no unbounded background loop.
- Diagnostics must be useful but redacted.
- Repository content is untrusted input and Markdown/frontmatter parsing must be defensive.
- Firestore rules must prevent cross-user project reads and writes before real data is enabled.

# Dependencies

- Fresh official Firebase docs checked 2026-05-14: callable functions include Firebase Auth context when available and validate auth tokens; App Check can be added for abuse protection.
- Fresh official Firebase docs checked 2026-05-14: Firestore Security Rules rely on `request.auth` and path/query design; server SDKs bypass rules and must be treated as trusted backend code.
- Fresh official GitHub docs checked 2026-05-14: installation tokens can be used for server-to-server API requests and HTTP Git clone when the app has Contents permission.
- Fresh official GitHub docs checked 2026-05-14: installation access tokens expire after one hour, can be narrowed by repository and permission, and must be generated server-side.
- `shipglows_data/workflow/specs/shipglows-auth-github-access.md` defines access statuses, server-side revalidation, backend-only installation metadata, and GitHub-wins behavior.
- `shipglows_data/workflow/specs/shipglows-firestore-data-model.md` and `shipglows_data/technical/firestore-data-model.md` define existing projection records and path builders under `lib/data/firestore_projection/`.
- Existing source reader/parser patterns live under `lib/data/shipglows_sources/`.
- Foundational architecture contract is `shipglows_data/technical/shipglows-foundational-architecture.md`.
- Firebase translation contract is `shipglows_data/workflow/specs/firebase-firestore-projection-migration.md`.

# Invariants

- `projectId` is opaque and stable; a server-side unique lookup maps the current GitHub repository identity to the shared project.
- Each project has exactly one GitHub repo.
- One Firebase user can own or access many projects.
- Firestore documents always carry `github.owner`, `github.repo`, `github.fullName`, `sourceCommit`, `projectionStatus`, and `updatedAt` where relevant.
- Indexed files always carry `path`, `sourceCommit`, `blobSha` or content hash, `artifactType`, `parseStatus`, and `indexedAt`.
- Client-triggered indexing is a request; server-side GitHub/clone state is the authority.
- Tokens and clone filesystem paths are never written to user-readable Firestore documents.
- Firestore stale/fresh status is always tied to a GitHub commit SHA.
- Idempotency is keyed by `projectId + requestId`; one request maps to one index run result.
- A project cannot have two active clone/index mutations at the same time.
- Server-owned diagnostics may include a redacted repository/file path and stable error code, but never tokenized URLs, installation tokens, service credentials, or local clone filesystem paths.

# Links & Consequences

- Data: Firestore schema must support projection rebuilds, deleted files, partial parse failures, and future multi-user membership.
- Auth: Firebase Auth gates app identity; GitHub App/OAuth gates repository access.
- Security: privileged work moves to Cloud Functions or an equivalent trusted runner; Flutter remains a projection reader/requester.
- Performance: indexing can be asynchronous; the UI must tolerate `queued`, `running`, `stale`, `partial`, `failed`, `already_running`, and `fresh` statuses.
- Ops: ephemeral clone is lower-maintenance for V1 but may be slower; persistent clone can be added later behind the same contract.
- Product: onboarding can be built after this boundary without exposing clone internals.
- Future write-back: commits and conflict resolution require a separate high-risk spec.
- Abuse/cost: runner entrypoints must be rate-limited or App-Check-protected before production and must enforce the file/refresh budgets to avoid unbounded clone/index work.
- Observability: index runs and diagnostics become the cross-system evidence for dashboard, onboarding, verification, and incident triage.

# Documentation Coherence

- Add this spec to `shipglows_data/editorial/content-map.md`.
- Add this spec to `shipglows_data/technical/code-docs-map.md`.
- Keep `shipglows_data/technical/shipglows-foundational-architecture.md` as the canonical decision record.
- Keep `shipglows_data/technical/firestore-data-model.md` and `lib/data/firestore_projection/*` aligned when new index-run fields or status enums are added.
- Update `shipglows_data/workflow/TASKS.md` and `CHANGELOG.md` after implementation changes behavior or creates new code surfaces.
- Future implementation must update README only when Firebase/GitHub runner code exists.
- Future `sf-docs` pass should refine the exact ShipGlows Markdown artifact allowlist.

# Edge Cases

- Private repo access is revoked between registration and indexing.
- GitHub token expires during clone or API listing.
- GitHub token generation fails before clone starts.
- Repo is renamed or transferred.
- Default branch changes after project registration.
- Repo is empty or has no allowed ShipGlows Markdown files.
- Markdown file is huge, binary-like, malformed, or has invalid frontmatter.
- Total allowed files exceed the refresh byte budget.
- Two index runs overlap for the same repo.
- The same request is submitted twice due to client retry or network timeout.
- Runner crashes after clone succeeds but before Firestore projection writes complete.
- Firestore writes partially succeed for indexed files but fail for the index run summary.
- Firestore projection is fresh for commit A while GitHub default branch is now commit B.
- A deleted file remains in Firestore from an old run.
- User A signs in after user B on the same device and cached projection is visible client-side.
- Firestore rules allow list access broader than intended.
- Runner logs accidentally include tokenized clone URLs.
- GitHub API rate limit or abuse protection blocks listing/clone metadata during an index request.

# Implementation Tasks

- [x] Task 1: Extend the Firestore projection model for runner-owned index request metadata.
  - File: `lib/data/firestore_projection/firestore_projection_models.dart`
  - Action: Add or extend pure Dart records/enums for index request status, runner diagnostic codes, access status mirroring `shipglows-auth-github-access.md`, idempotency `requestId`, and active-run metadata without importing Firebase SDKs.
  - User story link: Gives the app a safe projection shape for showing clone/index status without exposing secrets or making Firestore canonical.
  - Depends on: Existing `lib/data/firestore_projection/*` contracts from `shipglows-firestore-data-model.md`.
  - Validate with: `flutter test test/data/firestore_projection`.
  - Notes: Keep this pure Dart; do not add `cloud_firestore`, `firebase_auth`, or Cloud Functions clients in this task.
- [x] Task 2: Add path and validation support for runner-owned payloads.
  - File: `lib/data/firestore_projection/firestore_projection_paths.dart`
  - File: `lib/data/firestore_projection/firestore_projection_validators.dart`
  - Action: Add path helpers only if new paths are needed, plus validators for `requestId`, GitHub `owner/repo`, source commit, one-active-run state, forbidden secret-like fields, max file bytes (`2 MB`), max refresh bytes (`20 MB`), and max retained index runs (`20`).
  - User story link: Prevents invalid or client-controlled projection writes from becoming trusted runner state.
  - Depends on: Task 1.
  - Validate with: `flutter test test/data/firestore_projection/firestore_projection_paths_test.dart test/data/firestore_projection/firestore_projection_validators_test.dart`.
  - Notes: Keep GitHub full name as data, not a Firestore document path segment.
- [x] Task 3: Create the runner contract document.
  - File: `shipglows_data/technical/github-managed-clone-indexer.md`
  - Action: Document callable/HTTP function inputs and outputs for `verifyGitHubAccess`, `indexRepository`, `getIndexStatus`, and `refreshRepositoryProjection`, including auth preconditions, idempotency key, single-active-run behavior, status transitions, timeout/retry policy, size budgets, diagnostics, and forbidden fields.
  - User story link: Gives the trusted backend boundary an implementable contract before any real Cloud Functions or GitHub API code exists.
  - Depends on: Tasks 1-2.
  - Validate with: `rg -n "requestId|already_running|source_too_large|index_timeout|verifyGitHubAccess|indexRepository|2 MB|20 MB|token" shipglows_data/technical/github-managed-clone-indexer.md`.
  - Notes: Explicitly state that GitHub App installation access is the only V1 repo authorization model.
- [x] Task 4: Define allowed Markdown artifact indexing policy.
  - File: `lib/data/shipglows_sources/shipglows_artifact_index_policy.dart`
  - File: `test/data/shipglows_sources/shipglows_artifact_index_policy_test.dart`
  - Action: Add a pure allowlist/classifier for `shipglows_data/business/*`, `shipglows_data/editorial/*`, `shipglows_data/technical/*`, `shipglows_data/workflow/TASKS.md`, `shipglows_data/workflow/AUDIT_LOG.md`, `shipglows_data/workflow/specs/*.md`, and root compatibility docs (`AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `CHANGELOG.md`).
  - User story link: Ensures the indexer reads ShipGlows governance artifacts, not arbitrary repository Markdown.
  - Depends on: Task 3.
  - Validate with: `flutter test test/data/shipglows_sources/shipglows_artifact_index_policy_test.dart`.
  - Notes: `shipglows_data/` wins over root fallback docs; do not index `.git`, build output, secrets, or arbitrary docs by default.
- [x] Task 5: Define the local fake runner adapter for implementation tests.
  - File: `lib/data/shipglows_sources/local_fake_clone_indexer.dart`
  - File: `test/data/shipglows_sources/local_fake_clone_indexer_test.dart`
  - Action: Implement a fake runner that reads a local fixture/repo path through `SourcePathPolicy` and `SourceFileReader`, emits Firestore-shaped projection records, marks oversized files as diagnostics, reconciles deleted files, and never returns clone paths or token-like fields.
  - User story link: Lets `/sf-start` prove the indexing contract locally before connecting real Firebase/GitHub services.
  - Depends on: Tasks 1-4.
  - Validate with: `flutter test test/data/shipglows_sources/local_fake_clone_indexer_test.dart`.
  - Notes: This is not the production runner; it is the test adapter for server-shaped payloads.
- [x] Task 6: Define runner repository interfaces for the active ShipGlows app layer.
  - File: `lib/shipglows/data/github_managed_clone_indexer_repository.dart`
  - File: `test/shipglows/data/github_managed_clone_indexer_repository_test.dart`
  - Action: Add interfaces/fakes for requesting index status and reading projection summaries without exposing clone, GitHub token, installation token, service credential, or server filesystem fields.
  - User story link: Keeps Flutter as a projection reader/requester rather than a secret-bearing runner.
  - Depends on: Tasks 1-5.
  - Validate with: `flutter test test/shipglows/data/github_managed_clone_indexer_repository_test.dart`.
  - Notes: Do not initialize Firebase SDKs here; production adapters need a later implementation slice after emulator/security-rule readiness.
- [x] Task 7: Add security and failure-mode tests.
  - File: `test/data/shipglows_sources/local_fake_clone_indexer_test.dart`
  - File: `test/data/firestore_projection/firestore_projection_validators_test.dart`
  - File: `test/shipglows/data/github_managed_clone_indexer_repository_test.dart`
  - Action: Cover duplicate `requestId`, overlapping different `requestId`, token-like field rejection, stale commit detection, deleted-file tombstones, parse failures, oversized files, refresh budget exhaustion, access denied, token-expiry retry result, clone failed, projection failed, and cross-user cache isolation assumptions.
  - User story link: Proves failure states remain observable and recoverable instead of silently corrupting projection state.
  - Depends on: Tasks 1-6.
  - Validate with: `flutter test test/data/firestore_projection test/data/shipglows_sources test/shipglows/data`.
  - Notes: Security-rule emulator tests remain mandatory before production Firestore writes, but this slice must still test pure contract behavior.
- [x] Task 8: Draft Firestore and backend security-rule requirements before production writes.
  - File: `shipglows_data/technical/github-managed-clone-indexer.md`
  - Action: Add a security section covering Firebase Auth, App Check/rate limiting, backend-only installation metadata, membership-verifiable reads, server-owned writes, query boundaries, audit logging, redaction, and abuse/cost controls.
  - User story link: Prevents a UI-only security model and keeps private repo access server-side.
  - Depends on: Tasks 3 and 7.
  - Validate with: `rg -n "App Check|rate limit|server-owned|membership|redacted|Security Rules|backend-only" shipglows_data/technical/github-managed-clone-indexer.md`.
  - Notes: Do not deploy real rules or Cloud Functions in this chantier.
- [x] Task 9: Update documentation maps and public docs only where behavior exists.
  - File: `shipglows_data/editorial/content-map.md`
  - File: `shipglows_data/technical/code-docs-map.md`
  - File: `shipglows_data/technical/shipglows-foundational-architecture.md`
  - File: `README.md`
  - File: `CHANGELOG.md`
  - Action: Link the new technical runner contract and code ownership. Update README only if new local/fake runner behavior is user-visible; always add a concise changelog entry for implemented code or contract changes.
  - User story link: Keeps future agents and operators from mistaking local fake indexing, Firestore projection, and production GitHub runner state.
  - Depends on: Tasks 1-8.
  - Validate with: `rg -n "github-managed-clone-indexer|local_fake_clone_indexer|GitHub managed clone" shipglows_data/editorial/content-map.md shipglows_data/technical README.md CHANGELOG.md`.
  - Notes: Do not claim Firebase/GitHub production indexing exists until it does.
- [x] Task 10: Run the bounded verification gate.
  - File: `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md`
  - Action: Run targeted tests, full `flutter analyze`, full `flutter test`, secret-field scan, and documentation link scan; append implementation results to `Skill Run History` in this spec during `/sf-start` or `/sf-verify`.
  - User story link: Confirms the runner/indexer contract can be safely consumed by the app before production services are wired.
  - Depends on: Tasks 1-9.
  - Validate with: `flutter analyze`, `flutter test`, `rg -n "token|installationToken|clonePath|cloneUrl|serviceCredential|x-access-token" lib test shipglows_data/technical`.
  - Notes: Any token/clone-path scan hit must be manually reviewed and allowed only when it appears in a redaction/forbidden-field test or documentation warning.

# Acceptance Criteria

- A fresh agent can implement the runner/indexer without using Supabase or making Firestore canonical.
- Project identity is an opaque `projectId` plus GitHub repository metadata; GitHub remains authoritative for access and deduplication.
- Clone materialization is server-side and hidden from the user.
- V1 indexing performs no Markdown writes, commits, pushes, or branch mutations.
- Firestore projection records include source commit and stale/fresh state.
- GitHub/clone state wins every conflict with Firestore.
- Token and clone path handling is server-only and redacted in diagnostics.
- Partial parse failures do not block indexing of other files.
- Duplicate requests with the same `requestId` return the existing run status and do not create duplicate runs.
- Overlapping different requests for the same `projectId` cannot create concurrent clone/index mutations.
- Token-expiry handling is bounded to one fresh-token retry for the current operation.
- Oversized files and over-budget refreshes produce redacted diagnostics and keep prior projection stale/readable.
- The implementation uses existing Firestore projection contracts instead of redefining schema ad hoc.
- Tests cover happy path, access failure, token expiry retry, duplicate request, already-running request, clone failure, projection failure, parse failure, oversized files, stale projection, deleted files, and cross-user isolation.

# Test Strategy

- Unit tests for GitHub identity parsing and opaque project ID lookup/deduplication.
- Unit tests for allowed Markdown path policy and artifact classification.
- Unit tests for projection freshness by source commit.
- Parser tests using existing `test/data/shipglows_sources` patterns.
- Fake-runner tests for clone/index success, access denied, token-expiry retry, clone failed, refresh timeout, oversized files, and partial parse failed.
- Idempotency/concurrency tests for same `requestId`, different `requestId` while a run is active, and runner crash/retry status recovery.
- Repository tests for Firestore-shaped payload mapping and redacted diagnostics.
- Secret-field tests proving token, installation token, tokenized clone URL, service credential, and clone filesystem path fields are rejected from client-readable payloads and diagnostics.
- Security-rule tests must be added before any production Firestore write path ships.
- Full `flutter analyze` and `flutter test` after code implementation.

# Risks

- High security risk if GitHub tokens or tokenized clone URLs reach client logs or Firestore.
- High architecture risk if Firestore becomes the editing source before write-back is designed.
- High data-integrity risk if duplicate/overlapping index requests race and publish mixed-source projection.
- Medium cost/performance risk if ephemeral clone is slow for larger repos.
- Medium product risk if GitHub App installation UX is deferred too long.
- Medium data risk if stale/deleted Firestore documents are not reconciled by source commit.
- Medium availability risk if token expiry, GitHub rate limits, or Cloud Functions timeouts are not surfaced as recoverable diagnostics.

# Execution Notes

- Recommended V1 clone model: ephemeral managed clone inside a trusted runner per indexing run. This satisfies the mandatory clone decision without introducing persistent server maintenance too early.
- Recommended production direction: Firebase Cloud Functions as control plane; if clone/index runtime limits become painful, use Cloud Run Jobs or another trusted worker behind the same function contract.
- Required V1 GitHub access direction: GitHub App installation tokens for repository access, because they are short-lived and repo-scoped by installation permissions.
- Recommended Firestore content shape: store full Markdown text only when needed for the app experience, always tagged with source commit and never treated as canonical.
- Files to read first: `shipglows_data/technical/firestore-data-model.md`, `lib/data/firestore_projection/*`, `lib/data/shipglows_sources/source_file_reader.dart`, `lib/data/shipglows_sources/source_path_policy.dart`, `shipglows_data/workflow/specs/shipglows-auth-github-access.md`, and `shipglows_data/technical/shipglows-foundational-architecture.md`.
- Packages to avoid in the first implementation slice: no Firebase SDK initialization, no GitHub API client, no Octokit dependency, no background job framework, and no Cloud Functions deployable code. This slice should define contracts, pure Dart validators/models, and local fake runner behavior.
- Existing patterns to reuse: `SourcePathPolicy` for path and byte budgets, `SourceFileReader` for local file reads, `lib/data/firestore_projection/*` for projection DTOs, and mirrored `test/data/...` folders for deterministic tests.
- Data flow: Flutter/requester creates an idempotent request -> trusted backend verifies Firebase Auth and GitHub App access -> backend creates short-lived installation token -> backend clones/reads allowed artifacts -> backend writes server-owned projection/run/diagnostic records -> Flutter reads projection only.
- Stop conditions: stop before deploying Cloud Functions, writing production Firestore rules, storing any token/clone path in a client-readable shape, adding write-back/commit behavior, or accepting a second active run for the same project.
- Validation commands: `flutter test test/data/firestore_projection`, `flutter test test/data/shipglows_sources`, `flutter test test/shipglows/data`, `flutter analyze`, `flutter test`, and `rg -n "token|installationToken|clonePath|cloneUrl|serviceCredential|x-access-token" lib test shipglows_data/technical`.
- Fresh-docs verdict: `fresh-docs checked` on 2026-05-14. Official Firebase callable functions docs support authenticated callable context and App Check hardening; official Firestore Security Rules docs confirm `request.auth`/query-shaped access and server SDK bypass; official GitHub App docs confirm installation tokens, HTTP Git access with Contents permission, one-hour expiry, and repository/permission scoping.

# Open Questions

None for this spec. Decisions fixed by this readiness repair: V1 uses GitHub App installation access only; V1 uses one active run per project; V1 uses `requestId` idempotency; initial size budgets are `2 MB` per file and `20 MB` per refresh; token-expiry retry is bounded to one fresh-token retry. Deferred decisions remain out of scope: write-back, persistent clone optimization, terminal/agent execution, production Cloud Functions deployment, production Firestore rules, and advanced multi-user sharing semantics.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-09 17:22:02 UTC | sf-spec | GPT-5 Codex | Created runner/indexer spec from foundational architecture decisions. | Draft spec created. | /sf-ready ShipGlows GitHub Managed Clone Indexer |
| 2026-05-14 16:15:30 UTC | sf-ready | GPT-5 Codex | Readiness gate for managed clone/indexer spec, including adversarial/security/fresh-docs review. | not ready | /sf-spec ShipGlows GitHub Managed Clone Indexer readiness fixes |
| 2026-05-14 16:23:00 UTC | sf-spec | GPT-5 Codex | Repaired readiness gaps: dependencies, concrete implementation tasks, auth model, idempotency, concurrency, size limits, token retry, docs freshness, and validation commands. | draft updated | /sf-ready ShipGlows GitHub Managed Clone Indexer |
| 2026-05-14 17:32:39 UTC | sf-ready | GPT-5 Codex | Re-ran readiness gate after repairs: structure, metadata, user-story traceability, task ordering, adversarial review, security review, language doctrine, and fresh Firebase/GitHub docs. | ready | /sf-start ShipGlows GitHub Managed Clone Indexer |
| 2026-05-14 17:49:11 UTC | sf-start | GPT-5 Codex | Implemented bounded pure-Dart contracts, validators, local fake runner, repository interface, technical doc, docs maps, changelog, and tests without production Firebase/GitHub wiring. | implemented | /sf-verify ShipGlows GitHub Managed Clone Indexer |
| 2026-05-14 18:06:57 UTC | sf-verify | GPT-5.5 xhigh | Verified implementation against ready spec; corrected wire enum serialization and managed-clone path redaction; ran targeted/full Flutter checks, secret scan, and documentation scans. | verified | /sf-end ShipGlows GitHub Managed Clone Indexer |
| 2026-05-14 20:31:08 UTC | sf-ship | GPT-5 Codex | Quick ship after bug gate, secret scan, `flutter analyze`, full `flutter test`, and `git diff --check`; no full closeout. | shipped | /sf-prod shipglows_app |
| 2026-05-30 16:49:28 UTC | sf-end | GPT-5 Codex | Closed the managed clone/indexer slice after confirming implementation, verification, and quick ship were already complete; moved product focus to dashboard read-only projection. | closed | /sf-ready ShipGlows Dashboard Read-only Projection |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Spec created from user architecture decisions and official Firebase/GitHub shipglows_data. |
| sf-ready | done | Passed readiness after concrete tasks, auth dependency, idempotency/concurrency, size limits, token retry, language doctrine, and fresh-docs evidence were checked. |
| sf-start | done | Implemented the bounded pure-Dart contract, local fake runner, docs contract, repository interface, and tests before production Firebase/GitHub wiring. |
| sf-verify | done | Verified bounded pure-Dart implementation after correcting wire enum serialization and managed-clone path redaction; local checks passed. |
| sf-end | done | Formal closeout completed; this slice is ready to serve as the producer foundation for the dashboard projection. |
| sf-ship | done | Quick commit/push after green local checks; preview deployment validation remains required by project development mode. |
