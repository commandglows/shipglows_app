---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglowz_app"
created: "2026-05-10"
created_at: "2026-05-10 07:52:54 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 16:53:20 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "auth-github-access"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipGlowz, je veux separer clairement l'identite Firebase Auth de l'acces GitHub App, afin que ShipGlowz puisse lire les repositories autorises sans exposer de secrets ni inventer un systeme de permissions concurrent a GitHub."
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
  - "ShipGlowz dashboard"
depends_on:
  - artifact: "shipglowz_data/technical/shipglowz-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "https://docs.github.com/en/apps/overview"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://docs.github.com/en/rest/apps/apps"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://docs.github.com/en/webhooks/webhook-events-and-payloads?actionType=created#installation"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/auth"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/functions/callable"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
  - artifact: "https://firebase.google.com/docs/firestore/security/rules-conditions"
    artifact_version: "checked-2026-05-30"
    required_status: "active"
supersedes: []
evidence:
  - "User decision 2026-05-09/10: GitHub App is the target GitHub access model, not classic user OAuth as the primary model."
  - "User decision 2026-05-10: GitHub App installation can cover all repos or a selected subset; ShipGlowz project creation still requires explicit repo selection in ShipGlowz."
  - "User decision 2026-05-10: GitHub wins for repository access and can create/update ShipGlowz membership automatically."
  - "User decision 2026-05-10: if GitHub access is lost, keep ShipGlowz membership but block refresh/indexing and show access-lost status."
  - "User decision 2026-05-10: Firebase Auth login is separate from GitHub access; GitHub login is not mandatory."
  - "User decision 2026-05-10: shared project data is common; user display preferences are personal."
  - "User decision 2026-05-10: users can hide/remove projects from their personal ShipGlowz view without deleting shared project data."
  - "User decision 2026-05-10: orphaned projects are archived before future cleanup."
  - "User decision 2026-05-10: store GitHub permission level metadata; read permission is enough for V1 indexing."
  - "User decision 2026-05-10: never store GitHub App installation tokens in Firestore; generate short-lived tokens server-side."
  - "User decision 2026-05-10: organization GitHub App installations are supported."
  - "User decision 2026-05-10: existing organization installations require explicit user action before repos are shown in ShipGlowz."
  - "User decision 2026-05-10: use a trusted backend abstraction, with Cloud Functions as V1 recommended target."
  - "User decision 2026-05-10: UI access cache can last 24h, but clone/index/action server paths must reverify GitHub access."
  - "User decision 2026-05-10: old Firestore projection remains visible and searchable with warning after GitHub access is lost."
  - "User decision 2026-05-10: `githubInstallations/{installationId}` is global and backend-only."
next_step: "/sf-ready ShipGlowz Project Onboarding Flow"
---
# Spec: ShipGlowz Auth And GitHub Access
🟢 [shipglowz_app] spec: ShipGlowz Auth And GitHub Access | status: ready | path: shipglowz_data/workflow/specs/shipglowz-auth-github-access.md | next: /sf-ready ShipGlowz Project Onboarding Flow

# Title

ShipGlowz Auth And GitHub Access

# Status

Ready after `/sf-ready`. Fresh official GitHub/Firebase documentation checks, Test Contract completion, structured implementation tasks, and alignment with the ready Firestore data model and managed clone/indexer producer slice are in place. Implementation remains contract-first: no production GitHub App, Cloud Functions, or Firestore rules should ship without the proof gates below.

# User Story

En tant que fondatrice de ShipGlowz, je veux separer clairement l'identite Firebase Auth de l'acces GitHub App, afin que ShipGlowz puisse lire les repositories autorises sans exposer de secrets ni inventer un systeme de permissions concurrent a GitHub.

# Minimal Behavior Contract

ShipGlowz authenticates people with Firebase Auth and authorizes repository access through a GitHub App checked by a trusted backend. The client can request GitHub connection, repo discovery, project access refresh, and indexing, but the backend verifies Firebase Auth, checks GitHub App installation access, generates short-lived installation tokens only server-side, updates Firestore membership/status summaries, and never exposes tokens or installation internals to Flutter. If GitHub access is lost, the existing Firestore projection remains visible/searchable with a warning, but clone/index/refresh actions are blocked until GitHub access is restored. The easy edge case to miss is treating a ShipGlowz membership as stronger than GitHub: for repo-sensitive actions, GitHub remains the final authority.

# Success Behavior

- Given a user signs in with any supported Firebase Auth provider, ShipGlowz creates or updates `users/{uid}` without requiring GitHub as login provider.
- Given the user connects GitHub, ShipGlowz uses GitHub App installation flow as the primary access model.
- Given the GitHub App is installed on all repos or selected repos, ShipGlowz supports both and only creates projects after explicit repo selection inside ShipGlowz.
- Given GitHub confirms the user can access a repo with at least read permission, ShipGlowz can create/update project membership automatically.
- Given multiple users have GitHub access to the same repo, they share the same `projects/{projectId}` data and keep separate personal preferences.
- Given a user hides/removes a project from personal view, shared project data remains for other active members.
- Given the last active member removes a project, the project becomes `archived_orphaned` for future cleanup rather than being deleted immediately.
- Given GitHub access is stale for UI, a 24h access cache can keep the dashboard usable; server actions still reverify GitHub before clone/index/refresh.

# Error Behavior

- If Firebase Auth is missing or invalid, backend functions reject the request and Firestore rules block client access.
- If GitHub App installation is missing, revoked, suspended, or lacks repo access, access status becomes `needs_github_app`, `github_access_lost`, `installation_suspended`, or `access_check_failed`.
- If a user has ShipGlowz membership but GitHub no longer confirms repo access, the user can view/search the last projection with warning but cannot refresh, clone, index, or trigger repo-sensitive actions.
- If GitHub permission is below read, the repo cannot be indexed.
- If a client attempts to read `githubInstallations/{installationId}`, rules deny it.
- If a token generation fails, the backend records a redacted diagnostic and does not retry with a stored token.
- If a GitHub webhook is received, the backend validates it before updating installation metadata.

# Problem

ShipGlowz needs GitHub repository access, but the product decision is that Firebase Auth identity and GitHub repo permissions are separate concerns. Without a precise auth/access spec, implementation could force GitHub login, expose GitHub installation metadata to clients, store tokens in Firestore, duplicate access rules outside GitHub, or block useful read-only views unnecessarily after temporary GitHub access problems.

# Solution

Use Firebase Auth for ShipGlowz identity and a GitHub App for repository authorization. A trusted backend, preferably Cloud Functions in V1, owns GitHub App private key use, installation token generation, repo permission checks, webhook handling, and server-owned Firestore writes. Firestore stores only non-secret summaries needed by the app: user profile, project membership, project GitHub summary, access status, permission level, cache timestamps, and diagnostics.

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
- Firebase Auth is the ShipGlowz identity model and does not have to use GitHub login.
- GitHub wins for repository access.
- ShipGlowz membership can cache and summarize access, but cannot override GitHub for server-side repo actions.
- GitHub App installation tokens are generated on demand server-side and are never stored in Firestore.
- `githubInstallations/{installationId}` is global and backend-only.
- Client-visible project/user shipglowz_data can expose non-sensitive summaries only.
- Read permission is enough for V1 clone/index/read projection.
- Write/admin permissions are recorded for future capability checks but not used for V1 write behavior.
- Old projections can remain visible after access loss, but must be clearly marked stale/access-lost.

# Dependencies

- Official GitHub Apps shipglowz_data checked 2026-05-10: GitHub Apps support fine-grained repository permissions and installation-based access.
- Official GitHub installation authentication shipglowz_data checked 2026-05-10: installation access tokens are short-lived and should be generated server-side.
- Official GitHub Apps REST shipglowz_data checked 2026-05-10: installation tokens can be scoped to repositories and cannot exceed app-granted permissions.
- Official GitHub webhook shipglowz_data checked 2026-05-10: installation and repository-selection events can inform backend metadata.
- Official Firebase Auth shipglowz_data checked 2026-05-10: Firebase Auth provides app identity.
- Official Cloud Functions callable shipglowz_data checked 2026-05-10: callable functions can receive authenticated app requests and backend context.
- Official Firestore Security Rules condition shipglowz_data checked 2026-05-10: rules use `request.auth` and must be shaped around allowed paths/queries.

# Invariants

- A Firebase `uid` is not a GitHub identity.
- A GitHub App installation is not a ShipGlowz user.
- A ShipGlowz project is still exactly one GitHub repository, represented by an opaque `projectId` plus GitHub repository metadata.
- A project can be shared by multiple Firebase users through membership.
- Personal preferences live under user-scoped documents, not shared project projection documents.
- GitHub access status has `checkedAt`, `expiresAt`, `permission`, and `source: github`.
- UI access cache TTL is 24h.
- Server clone/index/refresh always revalidates GitHub access regardless of UI cache.
- `githubInstallations/{installationId}` is never client-readable.
- No GitHub token, private key, webhook secret, clone URL with credentials, or service credential is client-readable.

# Links & Consequences

- Firestore: `shipglowz-firestore-data-model.md` must include backend-only installation metadata and client-visible summaries.
- Runner/indexer: `shipglowz-github-managed-clone-indexer.md` must call the trusted backend access check before clone/index.
- Onboarding: repo discovery requires an explicit user action even when an organization installation already exists.
- Dashboard: stale/access-lost projects remain readable/searchable with clear warning.
- Security: Firestore rules must not allow client writes to membership role, GitHub permission, access status, installation IDs, or diagnostics that imply authority.
- Product: users do not need to understand token mechanics; the UI should talk about connecting GitHub and selecting repos.

# Documentation Coherence

- Add this spec to `shipglowz_data/editorial/content-map.md`.
- Add this spec to `shipglowz_data/technical/code-docs-map.md`.
- Add this spec to `shipglowz_data/technical/shipglowz-foundational-architecture.md` owned files.
- Future onboarding spec must cite this spec for GitHub App flow and access-loss UX.
- Future implementation shipglowz_data must state that GitHub OAuth traces in legacy ContentFlow are not the target ShipGlowz auth model.

# Edge Cases

- GitHub App installed on an organization before a user connects ShipGlowz.
- GitHub App installed on all repos, then changed to selected repos.
- GitHub App installation suspended or deleted.
- Repo removed from installation selection.
- User remains Firebase-authenticated but loses GitHub org membership.
- User hides a project while other users still have access.
- Last active user hides/removes a project.
- GitHub reports read access but repo clone fails due to installation permission mismatch.
- GitHub webhook arrives before user explicitly connects GitHub in ShipGlowz.
- UI cache says access is valid but server revalidation fails.
- Client tries to infer accessible installations through document IDs or collection scans.

# Implementation Tasks

- [ ] Task 1: Update the Firestore data model contract for auth/access fields.
  - File: `shipglowz_data/technical/firestore-data-model.md`
  - Action: Define backend-only `githubInstallations/{installationId}`, client-visible GitHub access summaries, membership fields, personal project hide/remove state, and `archived_orphaned`.
  - User story link: Separates Firebase identity from GitHub repository authority without exposing installation internals.
  - Depends on: this spec passing `/sf-ready`.
  - Validate with: `rg -n "githubInstallations|accessStatus|archived_orphaned|backend-only|membership" shipglowz_data/technical/firestore-data-model.md`.
- [ ] Task 2: Add pure Dart auth/access projection enums and validators.
  - File: `lib/data/firestore_projection/firestore_projection_models.dart`
  - File: `lib/data/firestore_projection/firestore_projection_validators.dart`
  - Action: Add access status enum, permission enum, cache-expiry helpers, and validators that reject token/private-key/clone-url/service-credential fields from client-visible payloads.
  - User story link: Lets Flutter display access state without becoming the authority or carrying secrets.
  - Depends on: Task 1.
  - Validate with: `flutter test test/data/firestore_projection`.
- [ ] Task 3: Define trusted backend function contracts.
  - File: `shipglowz_data/technical/auth-github-access-contract.md`
  - Action: Document `startGitHubAppInstall`, `syncGitHubInstallation`, `listAccessibleRepositories`, `verifyRepositoryAccess`, and `refreshProjectAccess` inputs, outputs, auth preconditions, error codes, idempotency expectations, and redaction policy.
  - User story link: Keeps GitHub App tokens, webhooks, and permission checks server-side.
  - Depends on: Tasks 1-2.
  - Validate with: `rg -n "startGitHubAppInstall|verifyRepositoryAccess|refreshProjectAccess|installation token|redacted" shipglowz_data/technical/auth-github-access-contract.md`.
- [ ] Task 4: Add local contract tests and fixtures.
  - File: `test/data/firestore_projection/firestore_projection_validators_test.dart`
  - File: `test/shipglowz/data/` or nearest existing ShipGlowz app-layer test directory.
  - Action: Cover unauthenticated, no installation, connected, access cached, access lost, installation suspended, token-generation failure, permission below read, hidden project, last-member orphan archive, and forbidden-field payloads.
  - User story link: Proves the access model is observable and recoverable without production GitHub/Firebase calls.
  - Depends on: Tasks 2-3.
  - Validate with: `flutter test test/data/firestore_projection test/shipglowz/data`.
- [ ] Task 5: Add docs map and changelog alignment.
  - File: `shipglowz_data/technical/code-docs-map.md`
  - File: `shipglowz_data/editorial/content-map.md`
  - File: `CHANGELOG.md`
  - Action: Link the auth/access contract and document that production GitHub App/Cloud Functions wiring is still out of scope until a later implementation slice.
  - User story link: Prevents future agents from reviving legacy OAuth or claiming production GitHub access too early.
  - Depends on: Tasks 1-4.
  - Validate with: `rg -n "auth-github-access|GitHub App|Firebase Auth|accessStatus" shipglowz_data/technical shipglowz_data/editorial CHANGELOG.md`.

# Acceptance Criteria

- Firebase Auth and GitHub App authorization are clearly separate.
- GitHub App is the primary target access model.
- GitHub login is not mandatory for ShipGlowz login.
- GitHub wins for repository access.
- Read permission is enough for V1 indexing.
- UI access cache is 24h.
- Clone/index/refresh revalidates GitHub every time.
- Lost GitHub access blocks server actions but keeps old projection visible/searchable with warning.
- `githubInstallations/{installationId}` is global and backend-only.
- No GitHub App token is stored in Firestore.
- User/project membership sync is driven by GitHub-confirmed access.

# Test Contract

- `surface`: auth/access contract docs, Firestore projection DTOs/validators, fake repository/provider contracts, dashboard-visible access states, docs maps, and future trusted backend interfaces for GitHub App installation access. No real GitHub App key, installation token, Cloud Function deploy, Firestore rule deploy, or production repo access is in scope for this implementation slice unless a later spec expands it.
- `proof_profile`: high-security local contract proof. Required evidence is fresh official GitHub/Firebase docs, pure Dart validation tests, forbidden-field scans, access-state transition tests, docs coherence, metadata lint, and diff hygiene. Production proof later requires `/sf-ship` -> `/sf-prod` plus emulator/backend evidence before real Firebase/GitHub access is enabled.
- `proof_order`:
  1. Update technical contract docs before adding code.
  2. Add enum/validator tests before or alongside DTO implementation.
  3. Add forbidden-field tests for token/private-key/webhook-secret/tokenized clone URL/service credential fields before any app-layer mapping.
  4. Add access-state tests for connected, cached, lost, suspended, insufficient permission, and unauthenticated states.
  5. Add docs-map/changelog alignment without claiming production GitHub/Firebase wiring.
  6. Run focused projection tests, then broader `flutter test`, `flutter analyze`, secret scan, metadata lint, and `git diff --check`.
- `checklist_path`: `shipglowz_data/workflow/verification/shipglowz-auth-github-access.md`.
- `required_scenario_ids`:
  - `AUTH-GH-001`: Firebase Auth identity and GitHub App repository authority remain separate in docs and DTOs.
  - `AUTH-GH-002`: no GitHub token, installation token, private key, webhook secret, tokenized clone URL, service credential, or backend-only installation payload is client-readable.
  - `AUTH-GH-003`: repo-sensitive actions require server-side GitHub access revalidation even when UI cache is fresh.
  - `AUTH-GH-004`: access-lost state keeps old projection visible/searchable with warning and blocks refresh/index/clone actions.
  - `AUTH-GH-005`: membership sync and personal hide/remove do not delete shared project projection; last-member removal archives orphaned project state.
  - `AUTH-GH-006`: Firestore/query requirements are shaped around `request.auth`, membership-verifiable reads, and backend-owned writes.
  - `AUTH-GH-007`: official GitHub/Firebase docs support installation-token and callable/rules assumptions used by the spec.
- `required_results`: all required scenario ids pass; docs cite current official sources; implementation has no production secret material; client-visible models cannot carry forbidden fields; access states are recoverable; old projection visibility after access loss is explicit; every server-owned field remains server-owned by contract.
- `exception_with_proof`: production Firebase/GitHub runtime proof may be deferred only while the implementation remains docs/pure-Dart/fake-contract scoped. Any real callable function, Firestore Security Rules deploy, GitHub webhook, installation-token generation, or repository access call removes this exception and requires official-doc recheck plus deployed/emulator proof.
- `exception_without_proof`: none for forbidden-field redaction, server-side revalidation requirement, GitHub-wins authority, membership/user boundary, metadata lint, and diff hygiene.

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

- Technical decision: expose installation account/org label to the UI only as a non-sensitive summary on project/user shipglowz_data, not by reading `githubInstallations` directly.
- Technical decision: store installation metadata backend-only; expose `github.accountLogin`, `github.accountType`, `repositorySelection`, and `accessStatus` summaries only when needed by the UI.
- Technical decision: Cloud Functions are V1 recommended backend; the spec says trusted backend so Cloud Run can replace long-running pieces later without changing product rules.
- Technical decision: GitHub webhooks update backend metadata but do not by themselves expose repos to users. User action is still required before repo discovery/project creation in ShipGlowz.
- Product-impact decision: users can keep seeing/searching old projection after GitHub access is lost, with a warning and disabled refresh/indexing.
- Fresh-docs verdict: checked against official GitHub and Firebase docs on 2026-05-30. GitHub App installation access tokens are short-lived, repository/permission-scoped, and generated server-side; Firebase callable functions include Firebase Auth and App Check tokens when available; Firestore rules use `request.auth` and evaluate queries against possible result sets.

# Open Questions

None. Remaining choices are implementation details unless they change user-visible onboarding copy or access-loss UX.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 07:52:54 UTC | sf-spec | GPT-5 Codex | Created foundational auth/GitHub access spec from user decisions and security-first defaults. | Draft spec created. | /sf-ready ShipGlowz Auth GitHub Access after foundational coherence pass |
| 2026-05-30 16:52:09 UTC | sf-spec | GPT-5 Codex | Repaired readiness gaps: fresh official docs, dependency versions, structured implementation tasks, Test Contract, proof order, scenarios, and exception policy. | reviewed | /sf-ready ShipGlowz Auth GitHub Access |
| 2026-05-30 16:53:20 UTC | sf-ready | GPT-5 Codex | Readiness review passed: behavior contract, auth/GitHub separation, security constraints, fresh-docs gate, tasks, Test Contract, and proof path are actionable. | ready | /sf-ready ShipGlowz Project Onboarding Flow |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Auth/GitHub access spec created. |
| sf-ready | ready | Passed after fresh-docs and Test Contract repair. |
| sf-start | pending | No implementation before the foundational coherence pass. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
