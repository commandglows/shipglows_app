---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-10"
created_at: "2026-05-10 09:13:19 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 09:13:19 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "project-onboarding-flow"
owner: "Diane"
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
  - artifact: "docs/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/shipflow-auth-github-access.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/shipflow-firestore-data-model.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/shipflow-github-managed-clone-indexer.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "specs/shipflow-project-source-onboarding.md"
    artifact_version: "0.4.0"
    required_status: "ready"
  - artifact: "https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/auth"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/functions/callable"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
supersedes:
  - "specs/shipflow-project-source-onboarding.md as cloud/Firebase onboarding flow target"
evidence:
  - "User decision 2026-05-09: a ShipFlow project is exactly one GitHub repository."
  - "User decision 2026-05-09: clone is mandatory, infrastructure-managed, user-hidden, and V1 is read-only."
  - "User decision 2026-05-10: GitHub App is the target repo access model."
  - "User decision 2026-05-10: GitHub App installation can cover all repos or selected repos, but ShipFlow project creation requires explicit repo selection in the app."
  - "User decision 2026-05-10: GitHub wins for repository access."
  - "User decision 2026-05-10: stale projection remains visible/searchable with warning after GitHub access is lost."
next_step: "/sf-ready ShipFlow Project Onboarding Flow"
---

# Title

ShipFlow Project Onboarding Flow

# Status

Draft foundational UX/architecture spec. This spec defines the user-visible onboarding flow that binds Firebase Auth, GitHub App access, shared Firestore projects, managed clone indexing, and read-only dashboard projection. It must be reviewed with the other foundational specs before implementation.

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
- Define links to Firestore, auth/access, and runner/indexer specs.
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

- `specs/shipflow-auth-github-access.md` defines Firebase Auth/GitHub App separation and access-loss behavior.
- `specs/shipflow-firestore-data-model.md` defines project, membership, projectRefs, feedItems, indexRuns, diagnostics, and projection records.
- `specs/shipflow-github-managed-clone-indexer.md` defines backend clone/index behavior.
- `docs/technical/shipflow-foundational-architecture.md` defines source-of-truth and V1 read-only invariants.
- Official GitHub App install docs checked 2026-05-10 for third-party app installation flow.
- Official Firebase Auth and callable functions docs checked 2026-05-10 for signed-in user and backend request assumptions.

# Invariants

- Onboarding never creates a project from a GitHub installation alone.
- Onboarding never asks the user where the clone lives.
- Onboarding never exposes GitHub tokens or installation documents.
- Onboarding never treats Firestore projection as canonical repository content.
- A repo selected twice resolves to the same shared project.
- All repo-sensitive actions go through the trusted backend.
- User preferences after onboarding live in user-scoped docs.
- Any indexing state shown in UI must be backed by Firestore project/index run status.

# Links & Consequences

- Auth: the first visible gate is Firebase Auth, but repo access remains GitHub App.
- Data: successful selection creates/joins `projects/{projectId}` and `users/{uid}/projectRefs/{projectId}`.
- Runner: selected repo triggers `verifyRepositoryAccess` then `indexRepository`.
- Dashboard: ready state routes to the dashboard read-only projection.
- Docs: old local-clone onboarding assumptions in `shipflow-project-source-onboarding.md` are superseded for cloud/Firebase target flow.
- Security: UI must not include manual token entry, clone path entry, or service configuration fields.

# Documentation Coherence

- Add this spec to `CONTENT_MAP.md`.
- Add this spec to `docs/technical/code-docs-map.md`.
- Add this spec to `docs/technical/shipflow-foundational-architecture.md`.
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

1. Create a technical flow document `docs/technical/project-onboarding-flow.md` with state machine, transitions, and blocked states.
2. Define onboarding state enum and DTOs in the future app layer without wiring Firebase yet.
3. Define backend function contracts consumed by onboarding: `startGitHubAppInstall`, `listAccessibleRepositories`, `createOrJoinProject`, `startProjectIndexing`, `getProjectSetupStatus`.
4. Define UI screens/panels for signed out, connect GitHub, select repo, setup progress, ready, and blocked states.
5. Define project join behavior for existing, hidden, archived_orphaned, and new projects.
6. Define progress mapping from Firestore project/index run statuses to UI labels.
7. Define retry behavior for repo listing, access verification, clone failure, and index failure.
8. Define tests for state transitions and resume behavior.
9. Update docs maps and foundational architecture references.

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
- Fresh-docs verdict: checked. GitHub App installation flow and Firebase authenticated callable assumptions support this architecture.

# Open Questions

None. Remaining choices are implementation details unless they change visible onboarding copy or product positioning.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 09:13:19 UTC | sf-spec | GPT-5 Codex | Created foundational project onboarding flow spec. | Draft spec created. | /sf-ready ShipFlow Project Onboarding Flow after foundational coherence pass |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Onboarding flow spec created from foundational auth, Firestore, and runner specs. |
| sf-ready | deferred | Wait until all foundational specs are written, then review coherence as a group. |
| sf-start | pending | No implementation before foundational coherence review. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
