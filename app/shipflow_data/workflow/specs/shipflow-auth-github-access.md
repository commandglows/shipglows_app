---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-10"
created_at: "2026-05-10 07:52:54 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 07:52:54 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "auth-github-access"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux separer clairement l'identite Firebase Auth de l'acces GitHub App, afin que ShipFlow puisse lire les repositories autorises sans exposer de secrets ni inventer un systeme de permissions concurrent a GitHub."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Firestore Security Rules"
  - "Cloud Functions for Firebase"
  - "GitHub App"
  - "GitHub repositories"
  - "managed clone runner"
  - "ShipFlow dashboard"
depends_on:
  - artifact: "shipflow_data/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/shipflow-firestore-data-model.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/shipflow-github-managed-clone-indexer.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "https://shipflow_data.github.com/en/apps/overview"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/rest/apps/apps"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://shipflow_data.github.com/en/webhooks/webhook-events-and-payloads?actionType=created#installation"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/auth"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/functions/callable"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/firestore/security/rules-conditions"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
supersedes: []
evidence:
  - "User decision 2026-05-09/10: GitHub App is the target GitHub access model, not classic user OAuth as the primary model."
  - "User decision 2026-05-10: GitHub App installation can cover all repos or a selected subset; ShipFlow project creation still requires explicit repo selection in ShipFlow."
  - "User decision 2026-05-10: GitHub wins for repository access and can create/update ShipFlow membership automatically."
  - "User decision 2026-05-10: if GitHub access is lost, keep ShipFlow membership but block refresh/indexing and show access-lost status."
  - "User decision 2026-05-10: Firebase Auth login is separate from GitHub access; GitHub login is not mandatory."
  - "User decision 2026-05-10: shared project data is common; user display preferences are personal."
  - "User decision 2026-05-10: users can hide/remove projects from their personal ShipFlow view without deleting shared project data."
  - "User decision 2026-05-10: orphaned projects are archived before future cleanup."
  - "User decision 2026-05-10: store GitHub permission level metadata; read permission is enough for V1 indexing."
  - "User decision 2026-05-10: never store GitHub App installation tokens in Firestore; generate short-lived tokens server-side."
  - "User decision 2026-05-10: organization GitHub App installations are supported."
  - "User decision 2026-05-10: existing organization installations require explicit user action before repos are shown in ShipFlow."
  - "User decision 2026-05-10: use a trusted backend abstraction, with Cloud Functions as V1 recommended target."
  - "User decision 2026-05-10: UI access cache can last 24h, but clone/index/action server paths must reverify GitHub access."
  - "User decision 2026-05-10: old Firestore projection remains visible and searchable with warning after GitHub access is lost."
  - "User decision 2026-05-10: `githubInstallations/{installationId}` is global and backend-only."
next_step: "/sf-ready ShipFlow Auth GitHub Access"
---
# Spec: ShipFlow Auth And GitHub Access
🟡 [shipflow_app] spec: ShipFlow Auth And GitHub Access | status: draft | path: shipflow_data/workflow/specs/shipflow-auth-github-access.md | next: /sf-ready ShipFlow Auth GitHub Access

# Title

ShipFlow Auth And GitHub Access

# Status

Draft foundational spec. No implementation should start from this spec alone. It must be reviewed with the Firestore data model, runner/indexer, onboarding, and dashboard projection shipflow_data/workflow/specs during the foundational coherence pass.

# User Story

En tant que fondatrice de ShipFlow, je veux separer clairement l'identite Firebase Auth de l'acces GitHub App, afin que ShipFlow puisse lire les repositories autorises sans exposer de secrets ni inventer un systeme de permissions concurrent a GitHub.

# Minimal Behavior Contract

ShipFlow authenticates people with Firebase Auth and authorizes repository access through a GitHub App checked by a trusted backend. The client can request GitHub connection, repo discovery, project access refresh, and indexing, but the backend verifies Firebase Auth, checks GitHub App installation access, generates short-lived installation tokens only server-side, updates Firestore membership/status summaries, and never exposes tokens or installation internals to Flutter. If GitHub access is lost, the existing Firestore projection remains visible/searchable with a warning, but clone/index/refresh actions are blocked until GitHub access is restored. The easy edge case to miss is treating a ShipFlow membership as stronger than GitHub: for repo-sensitive actions, GitHub remains the final authority.

# Success Behavior

- Given a user signs in with any supported Firebase Auth provider, ShipFlow creates or updates `users/{uid}` without requiring GitHub as login provider.
- Given the user connects GitHub, ShipFlow uses GitHub App installation flow as the primary access model.
- Given the GitHub App is installed on all repos or selected repos, ShipFlow supports both and only creates projects after explicit repo selection inside ShipFlow.
- Given GitHub confirms the user can access a repo with at least read permission, ShipFlow can create/update project membership automatically.
- Given multiple users have GitHub access to the same repo, they share the same `projects/{projectId}` data and keep separate personal preferences.
- Given a user hides/removes a project from personal view, shared project data remains for other active members.
- Given the last active member removes a project, the project becomes `archived_orphaned` for future cleanup rather than being deleted immediately.
- Given GitHub access is stale for UI, a 24h access cache can keep the dashboard usable; server actions still reverify GitHub before clone/index/refresh.

# Error Behavior

- If Firebase Auth is missing or invalid, backend functions reject the request and Firestore rules block client access.
- If GitHub App installation is missing, revoked, suspended, or lacks repo access, access status becomes `needs_github_app`, `github_access_lost`, `installation_suspended`, or `access_check_failed`.
- If a user has ShipFlow membership but GitHub no longer confirms repo access, the user can view/search the last projection with warning but cannot refresh, clone, index, or trigger repo-sensitive actions.
- If GitHub permission is below read, the repo cannot be indexed.
- If a client attempts to read `githubInstallations/{installationId}`, rules deny it.
- If a token generation fails, the backend records a redacted diagnostic and does not retry with a stored token.
- If a GitHub webhook is received, the backend validates it before updating installation metadata.

# Problem

ShipFlow needs GitHub repository access, but the product decision is that Firebase Auth identity and GitHub repo permissions are separate concerns. Without a precise auth/access spec, implementation could force GitHub login, expose GitHub installation metadata to clients, store tokens in Firestore, duplicate access rules outside GitHub, or block useful read-only views unnecessarily after temporary GitHub access problems.

# Solution

Use Firebase Auth for ShipFlow identity and a GitHub App for repository authorization. A trusted backend, preferably Cloud Functions in V1, owns GitHub App private key use, installation token generation, repo permission checks, webhook handling, and server-owned Firestore writes. Firestore stores only non-secret summaries needed by the app: user profile, project membership, project GitHub summary, access status, permission level, cache timestamps, and diagnostics.

# Scope In

- Define separation between Firebase Auth identity and GitHub App repository authorization.
- Define GitHub App as primary target model for repo access.
- Define support for personal and organization GitHub App installations.
- Define backend-only `githubInstallations/{installationId}` semantics.
- Define user/project membership creation from GitHub-confirmed access.
- Define access loss behavior and stale projection visibility.
- Define 24h UI cache and mandatory server revalidation before clone/index/refresh.
- Define minimal permission requirements for V1 read-only indexing.
- Define client-visible versus backend-only fields.
- Define security-rule and trusted-backend requirements at contract level.

# Scope Out

- Building the GitHub App registration in GitHub UI.
- Implementing Firebase Auth providers.
- Implementing Cloud Functions code.
- Implementing GitHub webhook handlers.
- Implementing onboarding UI.
- Implementing write-back, commits, pull requests, or agent actions.
- Implementing advanced organizations, billing, teams, or invitation workflows.
- Using classic GitHub OAuth as the primary repo access model.

# Constraints

- GitHub App is the primary repo authorization model.
- Firebase Auth is the ShipFlow identity model and does not have to use GitHub login.
- GitHub wins for repository access.
- ShipFlow membership can cache and summarize access, but cannot override GitHub for server-side repo actions.
- GitHub App installation tokens are generated on demand server-side and are never stored in Firestore.
- `githubInstallations/{installationId}` is global and backend-only.
- Client-visible project/user shipflow_data can expose non-sensitive summaries only.
- Read permission is enough for V1 clone/index/read projection.
- Write/admin permissions are recorded for future capability checks but not used for V1 write behavior.
- Old projections can remain visible after access loss, but must be clearly marked stale/access-lost.

# Dependencies

- Official GitHub Apps shipflow_data checked 2026-05-10: GitHub Apps support fine-grained repository permissions and installation-based access.
- Official GitHub installation authentication shipflow_data checked 2026-05-10: installation access tokens are short-lived and should be generated server-side.
- Official GitHub Apps REST shipflow_data checked 2026-05-10: installation tokens can be scoped to repositories and cannot exceed app-granted permissions.
- Official GitHub webhook shipflow_data checked 2026-05-10: installation and repository-selection events can inform backend metadata.
- Official Firebase Auth shipflow_data checked 2026-05-10: Firebase Auth provides app identity.
- Official Cloud Functions callable shipflow_data checked 2026-05-10: callable functions can receive authenticated app requests and backend context.
- Official Firestore Security Rules condition shipflow_data checked 2026-05-10: rules use `request.auth` and must be shaped around allowed paths/queries.

# Invariants

- A Firebase `uid` is not a GitHub identity.
- A GitHub App installation is not a ShipFlow user.
- A ShipFlow project is still exactly one GitHub repository, represented by an opaque `projectId` plus GitHub repository metadata.
- A project can be shared by multiple Firebase users through membership.
- Personal preferences live under user-scoped documents, not shared project projection documents.
- GitHub access status has `checkedAt`, `expiresAt`, `permission`, and `source: github`.
- UI access cache TTL is 24h.
- Server clone/index/refresh always revalidates GitHub access regardless of UI cache.
- `githubInstallations/{installationId}` is never client-readable.
- No GitHub token, private key, webhook secret, clone URL with credentials, or service credential is client-readable.

# Links & Consequences

- Firestore: `shipflow-firestore-data-model.md` must include backend-only installation metadata and client-visible summaries.
- Runner/indexer: `shipflow-github-managed-clone-indexer.md` must call the trusted backend access check before clone/index.
- Onboarding: repo discovery requires an explicit user action even when an organization installation already exists.
- Dashboard: stale/access-lost projects remain readable/searchable with clear warning.
- Security: Firestore rules must not allow client writes to membership role, GitHub permission, access status, installation IDs, or diagnostics that imply authority.
- Product: users do not need to understand token mechanics; the UI should talk about connecting GitHub and selecting repos.

# Documentation Coherence

- Add this spec to `shipflow_data/editorial/content-map.md`.
- Add this spec to `shipflow_data/technical/code-docs-map.md`.
- Add this spec to `shipflow_data/technical/shipflow-foundational-architecture.md` owned files.
- Future onboarding spec must cite this spec for GitHub App flow and access-loss UX.
- Future implementation shipflow_data must state that GitHub OAuth traces in legacy ContentFlow are not the target ShipFlow auth model.

# Edge Cases

- GitHub App installed on an organization before a user connects ShipFlow.
- GitHub App installed on all repos, then changed to selected repos.
- GitHub App installation suspended or deleted.
- Repo removed from installation selection.
- User remains Firebase-authenticated but loses GitHub org membership.
- User hides a project while other users still have access.
- Last active user hides/removes a project.
- GitHub reports read access but repo clone fails due to installation permission mismatch.
- GitHub webhook arrives before user explicitly connects GitHub in ShipFlow.
- UI cache says access is valid but server revalidation fails.
- Client tries to infer accessible installations through document IDs or collection scans.

# Implementation Tasks

1. Extend `shipflow_data/technical/firestore-data-model.md` plan with backend-only `githubInstallations/{installationId}` and client-visible GitHub access summaries.
2. Define access status enums: `not_connected`, `needs_github_app`, `connected`, `access_cached`, `github_access_lost`, `installation_suspended`, `access_check_failed`.
3. Define permission enum: `none`, `read`, `write`, `admin`, plus raw GitHub permission payload for backend diagnostics only.
4. Define trusted backend function contracts: `startGitHubAppInstall`, `syncGitHubInstallation`, `listAccessibleRepositories`, `verifyRepositoryAccess`, `refreshProjectAccess`.
5. Define server-only token lifecycle: create installation token per operation, use it, discard it, log only redacted metadata.
6. Define membership sync behavior when GitHub confirms access to an existing shared project.
7. Define personal project hide/remove behavior and `archived_orphaned` transition.
8. Define access-loss dashboard behavior for stale projection visibility.
9. Define Firestore security rule requirements for client-readable project summaries and backend-only installation shipflow_data.
10. Add auth/access fixtures and tests during implementation for token absence, membership sync, cache expiry, and access-loss behavior.

# Acceptance Criteria

- Firebase Auth and GitHub App authorization are clearly separate.
- GitHub App is the primary target access model.
- GitHub login is not mandatory for ShipFlow login.
- GitHub wins for repository access.
- Read permission is enough for V1 indexing.
- UI access cache is 24h.
- Clone/index/refresh revalidates GitHub every time.
- Lost GitHub access blocks server actions but keeps old projection visible/searchable with warning.
- `githubInstallations/{installationId}` is global and backend-only.
- No GitHub App token is stored in Firestore.
- User/project membership sync is driven by GitHub-confirmed access.

# Test Strategy

- Unit tests for access status transitions.
- Unit tests for permission threshold checks.
- Firestore model tests proving no token/private installation payload appears in client DTOs.
- Backend contract tests for unauthenticated, no installation, read access, revoked access, and suspended installation cases.
- Security-rule emulator tests before production Firestore access.
- UI state tests for access-lost warning and stale projection visibility.
- Runner integration tests proving index/clone calls verify GitHub access even when UI cache is fresh.

# Risks

- High security risk if installation metadata or tokens become client-readable.
- High architecture risk if classic OAuth is accidentally revived from legacy ContentFlow code.
- Medium UX risk if access-lost states feel like data loss instead of stale/read-only mode.
- Medium operations risk if GitHub webhook handling and explicit user sync disagree.
- Medium cost/rate-limit risk if access checks ignore the 24h UI cache.

# Execution Notes

- Technical decision: expose installation account/org label to the UI only as a non-sensitive summary on project/user shipflow_data, not by reading `githubInstallations` directly.
- Technical decision: store installation metadata backend-only; expose `github.accountLogin`, `github.accountType`, `repositorySelection`, and `accessStatus` summaries only when needed by the UI.
- Technical decision: Cloud Functions are V1 recommended backend; the spec says trusted backend so Cloud Run can replace long-running pieces later without changing product rules.
- Technical decision: GitHub webhooks update backend metadata but do not by themselves expose repos to users. User action is still required before repo discovery/project creation in ShipFlow.
- Product-impact decision: users can keep seeing/searching old projection after GitHub access is lost, with a warning and disabled refresh/indexing.
- Fresh-shipflow_data verdict: checked against official GitHub and Firebase shipflow_data on 2026-05-10.

# Open Questions

None. Remaining choices are implementation details unless they change user-visible onboarding copy or access-loss UX.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 07:52:54 UTC | sf-spec | GPT-5 Codex | Created foundational auth/GitHub access spec from user decisions and security-first defaults. | Draft spec created. | /sf-ready ShipFlow Auth GitHub Access after foundational coherence pass |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Auth/GitHub access spec created. |
| sf-ready | deferred | Wait until all foundational specs are written, then review coherence as a group. |
| sf-start | pending | No implementation before the foundational coherence pass. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
