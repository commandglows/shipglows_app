---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-10"
created_at: "2026-05-10 09:13:19 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 16:55:06 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "project-onboarding-flow"
owner: "Diane"
confidence: medium
user_story: "En tant qu'utilisatrice ShipFlow, je veux connecter GitHub, choisir un repository et voir son statut d'indexation, afin de transformer un repo GitHub en projet ShipFlow lisible sans comprendre l'infrastructure interne."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Firebase Auth"
  - "GitHub App"
  - "Cloud Functions for Firebase"
  - "Cloud Firestore"
  - "managed clone runner"
  - "ShipFlow dashboard"
  - "ShipFlow Markdown artifacts"
depends_on:
  - artifact: "shipflow_data/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/shipflow-auth-github-access.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipflow_data/workflow/specs/shipflow-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipflow_data/workflow/specs/shipflow-github-managed-clone-indexer.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipflow_data/workflow/specs/shipflow-project-source-onboarding.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/auth"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/functions/callable"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
supersedes:
  - "shipflow_data/workflow/specs/shipflow-project-source-onboarding.md as cloud/Firebase onboarding flow target"
evidence:
  - "User decision 2026-05-09: a ShipFlow project is exactly one GitHub repository."
  - "User decision 2026-05-09: clone is mandatory, infrastructure-managed, user-hidden, and V1 is read-only."
  - "User decision 2026-05-10: GitHub App is the target repo access model."
  - "User decision 2026-05-10: GitHub App installation can cover all repos or selected repos, but ShipFlow project creation requires explicit repo selection in the app."
  - "User decision 2026-05-10: GitHub wins for repository access."
  - "User decision 2026-05-10: stale projection remains visible/searchable with warning after GitHub access is lost."
next_step: "/sf-ready ShipFlow Markdown Artifact Governance"
---
# Spec: ShipFlow Project Onboarding Flow
🟢 [shipflow_app] spec: ShipFlow Project Onboarding Flow | status: ready | path: shipflow_data/workflow/specs/shipflow-project-onboarding-flow.md | next: /sf-ready ShipFlow Markdown Artifact Governance

# Title

ShipFlow Project Onboarding Flow

# Status

Ready after `/sf-ready`. This spec defines the user-visible onboarding flow that binds Firebase Auth, GitHub App access, shared Firestore projects, managed clone indexing, and read-only dashboard projection. Fresh official docs, ready auth/access, Firestore model, managed clone/indexer dependencies, and the Test Contract below are in place.

# User Story

En tant qu'utilisatrice ShipFlow, je veux connecter GitHub, choisir un repository et voir son statut d'indexation, afin de transformer un repo GitHub en projet ShipFlow lisible sans comprendre l'infrastructure interne.

# Minimal Behavior Contract

The onboarding flow accepts a signed-in ShipFlow user, guides them to connect or verify GitHub App access, lists only repositories GitHub confirms they can read, lets them explicitly choose one repository, creates or joins the shared ShipFlow project for that repo, starts a server-side read-only clone/index request, and shows indexing status until the project is ready or blocked. If GitHub App access, repo permission, clone, or indexing fails, the UI shows a clear recoverable state without exposing tokens, clone paths, or backend implementation details. The easy edge case to miss is auto-creating projects just because an organization installed the GitHub App; ShipFlow still waits for explicit user repo selection.

# Success Behavior

- Given the user is not signed in, onboarding starts with ShipFlow sign-in through Firebase Auth.
- Given the user is signed in but GitHub is not connected, onboarding shows a GitHub connection step.
- Given GitHub App is not installed, onboarding sends the user to the GitHub App installation flow and returns to ShipFlow with a pending verification state.
- Given GitHub App is installed on all repos or selected repos, ShipFlow lists only repos the user can read.
- Given the user selects a repo, ShipFlow creates or joins the shared `projects/{projectId}` for that GitHub repo.
- Given project creation succeeds, ShipFlow starts index/clone through the trusted backend and shows `queued`, `indexing`, then `ready`.
- Given indexing finds ShipFlow Markdown artifacts, the dashboard opens the project from Firestore projection.
- Given indexing finds no known artifacts, the project still exists but shows an empty/needs-setup state rather than failing silently.

# Error Behavior

- If Firebase Auth fails, onboarding stays on sign-in and does not call GitHub/backend project functions.
- If GitHub App installation is missing, onboarding shows `needs_github_app` with a single reconnect/install action.
- If GitHub App is installed but no repos are readable, onboarding shows `no_accessible_repositories`.
- If repo listing fails due to GitHub/rate/network error, onboarding shows `repository_list_failed` with retry.
- If selected repo access is lost before project creation, onboarding shows `github_access_lost` and does not create a fresh project membership.
- If a shared project already exists, onboarding joins/links the user instead of creating a duplicate.
- If clone/indexing fails after project creation, onboarding shows the project with `index_failed` or `clone_failed` diagnostics and retry.
- If the user leaves during indexing, the dashboard can resume from Firestore status.

# Problem

The foundational backend and data decisions are mostly clear, but the first-run user path is not. Without a flow spec, implementation could expose technical infrastructure, create projects too early, confuse GitHub installation with ShipFlow project selection, or fail to resume long-running indexing work.

# Solution

Define onboarding as a small state machine:

1. `signed_out`
2. `needs_github_connection`
3. `verifying_github_access`
4. `select_repository`
5. `creating_or_joining_project`
6. `indexing_project`
7. `ready`
8. recoverable blocked states

The UI remains product-oriented: connect GitHub, choose repo, watch setup status, open project. The backend owns auth verification, GitHub access, project identity, clone/index, diagnostics, and Firestore writes.

# Scope In

- Define user-visible onboarding states and transitions.
- Define GitHub App connection/install/reverify UX.
- Define explicit repository selection UX.
- Define create-or-join behavior for shared projects.
- Define indexing progress and resume behavior.
- Define empty project and access-loss states.
- Define copy principles at contract level: no tokens, clone paths, or backend jargon.
- Define links to Firestore, auth/access, and runner/indexer shipflow_data/workflow/specs.
- Define V1 read-only expectations.

# Scope Out

- Implementing Firebase Auth provider screens.
- Implementing GitHub App installation callback code.
- Implementing repo search pagination details.
- Implementing Cloud Functions.
- Implementing Firestore rules.
- Implementing Markdown write-back, commits, PRs, or agents.
- Implementing terminal access.
- Implementing billing/team invitations.
- Designing a marketing landing page.

# Constraints

- Project equals one GitHub repository, represented by an opaque `projectId` plus GitHub repository metadata.
- User must explicitly select a repository before ShipFlow creates/joins a project.
- GitHub App installation is necessary but not sufficient to create projects.
- V1 requires only read permission.
- V1 is read-only and never writes to Markdown/GitHub.
- Clone paths are never shown or requested.
- Tokens and installation internals are never shown.
- The UI can show non-sensitive GitHub account/org labels when useful.
- Firestore projection is the UI read source after indexing, but GitHub remains canonical.
- Long-running indexing must be resumable from Firestore status.

# Dependencies

- `shipflow_data/workflow/specs/shipflow-auth-github-access.md` defines Firebase Auth/GitHub App separation and access-loss behavior.
- `shipflow_data/workflow/specs/shipflow-firestore-data-model.md` defines project, membership, projectRefs, feedItems, indexRuns, diagnostics, and projection records.
- `shipflow_data/workflow/specs/shipflow-github-managed-clone-indexer.md` defines backend clone/index behavior.
- `shipflow_data/technical/shipflow-foundational-architecture.md` defines source-of-truth and V1 read-only invariants.
- Official GitHub App install shipflow_data checked 2026-05-10 for third-party app installation flow.
- Official Firebase Auth and callable functions shipflow_data checked 2026-05-10 for signed-in user and backend request assumptions.

# Invariants

- Onboarding never creates a project from a GitHub installation alone.
- Onboarding never asks the user where the clone lives.
- Onboarding never exposes GitHub tokens or installation documents.
- Onboarding never treats Firestore projection as canonical repository content.
- A repo selected twice resolves to the same shared project.
- All repo-sensitive actions go through the trusted backend.
- User preferences after onboarding live in user-scoped shipflow_data.
- Any indexing state shown in UI must be backed by Firestore project/index run status.

# Links & Consequences

- Auth: the first visible gate is Firebase Auth, but repo access remains GitHub App.
- Data: successful selection creates/joins `projects/{projectId}` and `users/{uid}/projectRefs/{projectId}`.
- Runner: selected repo triggers `verifyRepositoryAccess` then `indexRepository`.
- Dashboard: ready state routes to the dashboard read-only projection.
- Docs: old local-clone onboarding assumptions in `shipflow-project-source-onboarding.md` are superseded for cloud/Firebase target flow.
- Security: UI must not include manual token entry, clone path entry, or service configuration fields.

# Documentation Coherence

- Add this spec to `shipflow_data/editorial/content-map.md`.
- Add this spec to `shipflow_data/technical/code-docs-map.md`.
- Add this spec to `shipflow_data/technical/shipflow-foundational-architecture.md`.
- Future dashboard projection spec must cite onboarding terminal states.
- Future README should document the flow only after implementation exists.

# Edge Cases

- User signs out mid-flow.
- GitHub App installation opens in another tab and the user returns later.
- GitHub App installed on an org before the user connects ShipFlow.
- GitHub App installed for all repos, then changed to selected repos.
- Repo is selected, then access is revoked before indexing starts.
- Shared project exists but current user previously hid it.
- Repo already exists as `archived_orphaned`.
- Indexing succeeds but no ShipFlow Markdown artifacts are found.
- Indexing partially succeeds with parse diagnostics.
- User refreshes the browser/app during `indexing_project`.
- GitHub API is temporarily unavailable.
- Firestore projection exists from older commit while new indexing is queued.

# Implementation Tasks

- [ ] Task 1: Create the onboarding technical flow document.
  - File: `shipflow_data/technical/project-onboarding-flow.md`
  - Action: Define state machine, transitions, blocked states, retry behavior, resume behavior, and copy constraints.
  - User story link: Makes the user path implementable without exposing clone/backend internals.
  - Depends on: this spec passing `/sf-ready`.
  - Validate with: `rg -n "signed_out|needs_github_connection|select_repository|indexing_project|ready|blocked" shipflow_data/technical/project-onboarding-flow.md`.
- [ ] Task 2: Define onboarding state DTOs and pure contracts.
  - File: `lib/shipflow/` or nearest existing app-layer ShipFlow data directory chosen during implementation.
  - Action: Add onboarding state enum, repository option DTO, setup status DTO, and failure/retry mapping without wiring Firebase SDKs yet.
  - User story link: Gives Flutter a stable user-facing flow state independent of backend implementation details.
  - Depends on: Task 1.
  - Validate with: unit tests for every state and transition.
- [ ] Task 3: Define fake backend/repository contracts consumed by onboarding.
  - File: `test/shipflow/` or nearest existing ShipFlow test directory.
  - Action: Cover `startGitHubAppInstall`, `listAccessibleRepositories`, `createOrJoinProject`, `startProjectIndexing`, and `getProjectSetupStatus` with fakes for no installation, no repos, existing project, hidden project, archived orphan, clone failed, index failed, and ready.
  - User story link: Proves onboarding can create/join/read setup status without real GitHub/Firebase calls.
  - Depends on: Tasks 1-2.
  - Validate with: `flutter test test/shipflow`.
- [ ] Task 4: Implement user-visible onboarding screens or panels.
  - File: `lib/shipflow/presentation/**` or the existing ShipFlow route/presentation layer.
  - Action: Add signed-out, connect GitHub, select repo, setup progress, ready, and blocked state UI with no clone paths, token fields, or backend jargon.
  - User story link: Delivers the first-run path from repo selection to readable project.
  - Depends on: Tasks 1-3.
  - Validate with: widget tests for each state and accessibility labels for progress/errors.
- [ ] Task 5: Update docs maps and changelog after implementation.
  - File: `shipflow_data/technical/code-docs-map.md`
  - File: `shipflow_data/editorial/content-map.md`
  - File: `CHANGELOG.md`
  - Action: Link the onboarding contract and implemented surfaces without claiming production GitHub/Firebase access unless deployed proof exists.
  - User story link: Keeps future agents aligned on read-only onboarding and explicit repo selection.
  - Depends on: Tasks 1-4.
  - Validate with: `rg -n "project-onboarding-flow|GitHub App|select_repository|indexing_project" shipflow_data/technical shipflow_data/editorial CHANGELOG.md`.

# Acceptance Criteria

- The flow starts from Firebase Auth identity and does not require GitHub login.
- The flow uses GitHub App repo authorization.
- The user explicitly selects a repo before project creation/join.
- A repo maps to one shared ShipFlow project.
- The UI never asks for clone path or GitHub token.
- The UI can resume after interruption from Firestore status.
- Indexing progress and errors are visible and recoverable.
- Empty repo/no known ShipFlow artifacts is a valid state.
- Access-loss behavior matches `shipflow-auth-github-access.md`.
- No implementation begins until foundational coherence review passes.

# Test Contract

- `surface`: onboarding technical contract, pure state DTOs, fake backend/repository contracts, onboarding UI states, docs maps, and future backend request assumptions for GitHub App installation and project indexing. Real Firebase Auth providers, GitHub App callbacks, Cloud Functions, Firestore Security Rules, and production repository access are out of scope unless a later spec expands the implementation surface.
- `proof_profile`: high-risk user-flow contract proof before hosted auth/GitHub integration. Required evidence is fresh official GitHub/Firebase docs, state-machine tests, fake backend tests, widget tests, forbidden-field rendering checks, docs coherence, metadata lint, and diff hygiene.
- `proof_order`:
  1. Write `project-onboarding-flow.md` before app code.
  2. Add state-machine tests for every success/error transition.
  3. Add fake backend tests for repo discovery, create-or-join, hidden/reactivated project, archived orphan, clone/index failures, and resume from Firestore setup status.
  4. Add widget tests for visible states and accessibility labels before declaring UI ready.
  5. Run focused onboarding tests, broader `flutter test`, `flutter analyze`, forbidden-field scan, metadata lint, and `git diff --check`.
  6. Use `/sf-ship` -> `/sf-prod` before any browser/user-flow claim in this `vercel-preview-push` project.
- `checklist_path`: `shipflow_data/workflow/verification/shipflow-project-onboarding-flow.md`.
- `required_scenario_ids`:
  - `ONBOARD-AUTH-001`: signed-out user cannot call repo/backend project functions.
  - `ONBOARD-GH-001`: GitHub App installation is necessary but never sufficient for project creation; explicit repo selection is required.
  - `ONBOARD-REPO-001`: only GitHub-confirmed readable repositories appear as selectable options.
  - `ONBOARD-PROJECT-001`: selected repo creates or joins one shared opaque `projectId`; existing hidden/orphaned projects are handled deterministically.
  - `ONBOARD-INDEX-001`: queued/indexing/ready/empty/clone_failed/index_failed states are visible and resumable from stored status.
  - `ONBOARD-SEC-001`: UI and DTOs never render GitHub tokens, installation internals, clone paths, tokenized URLs, private keys, or backend filesystem details.
  - `ONBOARD-DOC-001`: docs and changelog explain read-only onboarding without claiming production GitHub/Firebase wiring before proof.
- `required_results`: all required scenario ids pass; onboarding never auto-creates from installation alone; repo-sensitive actions route through trusted backend contracts; user-visible states are recoverable; implementation has no manual token/clone path inputs; docs do not overclaim production readiness.
- `exception_with_proof`: hosted GitHub/Firebase proof may be deferred only while implementation remains local contracts, fakes, and widget states. Any real Firebase Auth provider flow, GitHub callback, callable function, Firestore query, or production project creation requires `/sf-ship` -> `/sf-prod` plus browser/auth proof.
- `exception_without_proof`: none for explicit repo selection, forbidden-field rendering, create-or-join determinism, resume behavior, metadata lint, and diff hygiene.

# Test Strategy

- State-machine tests for every onboarding transition.
- Widget tests for visible states: signed out, connect GitHub, select repo, progress, ready, blocked.
- Contract tests with fake backend for no installation, no repos, repo selected, existing project, hidden project, archived project, clone failed, index failed.
- Resume tests from Firestore setup statuses.
- Security-focused tests proving clone path/token fields never render.
- Future integration tests with Firebase/GitHub mocks after implementation starts.

# Risks

- High UX risk if GitHub App installation and repo selection feel like the same step.
- High security risk if onboarding exposes technical setup or token concepts.
- Medium product risk if empty repositories look like failure.
- Medium reliability risk if setup progress cannot resume after app refresh.
- Medium architecture risk if old local-clone onboarding assumptions leak into the cloud target.

# Execution Notes

- Product decision: onboarding should feel like "Connect GitHub -> Choose repository -> ShipFlow prepares it", not "configure backend/clone/database".
- Technical decision: repository list comes from trusted backend after Firebase Auth and GitHub App access checks.
- Technical decision: successful repo selection is create-or-join, not blind create.
- Technical decision: hidden project rejoin should unhide the user's `projectRef`; archived_orphaned should reactivate if GitHub access is valid.
- Technical decision: no manual GitHub URL field in the primary V1 cloud flow unless repo discovery is unavailable; if added, it is a fallback path still verified by backend.
- Fresh-docs verdict: checked against official GitHub and Firebase docs on 2026-05-30. GitHub documents third-party GitHub App installation flow; Firebase callable functions include Firebase Auth and App Check tokens when available.

# Open Questions

None. Remaining choices are implementation details unless they change visible onboarding copy or product positioning.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 09:13:19 UTC | sf-spec | GPT-5 Codex | Created foundational project onboarding flow spec. | Draft spec created. | /sf-ready ShipFlow Project Onboarding Flow after foundational coherence pass |
| 2026-05-30 16:54:01 UTC | sf-spec | GPT-5 Codex | Repaired readiness gaps: dependency versions, fresh official docs, structured tasks, Test Contract, proof order, scenarios, and exception policy. | reviewed | /sf-ready ShipFlow Project Onboarding Flow |
| 2026-05-30 16:55:06 UTC | sf-ready | GPT-5 Codex | Readiness review passed: explicit repo selection, create-or-join, resume behavior, failure states, security constraints, fresh-docs gate, and Test Contract are actionable. | ready | /sf-ready ShipFlow Markdown Artifact Governance |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Onboarding flow spec created from foundational auth, Firestore, and runner shipflow_data/workflow/specs. |
| sf-ready | ready | Passed after fresh-docs and Test Contract repair. |
| sf-start | pending | No implementation before foundational coherence review. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
