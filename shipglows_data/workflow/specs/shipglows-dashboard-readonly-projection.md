---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-10"
created_at: "2026-05-10 09:26:21 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 17:07:27 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "dashboard-readonly-projection"
owner: "Diane"
confidence: medium
user_story: "En tant qu'utilisatrice ShipGlows, je veux ouvrir un dashboard qui lit les projets, artefacts, statuts et diagnostics depuis la projection Firestore, afin de comprendre l'etat de mes repositories sans declencher d'ecriture ni exposer l'infrastructure GitHub/clone."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Firestore Security Rules"
  - "GitHub App"
  - "managed clone runner"
  - "ShipGlows dashboard"
  - "ShipGlows Markdown artifacts"
  - "shipglows_data/"
depends_on:
  - artifact: "shipglows_data/technical/shipglows-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-auth-github-access.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md"
    artifact_version: "1.0.0"
    required_status: "ready"
supersedes: []
evidence:
  - "User direction 2026-05-10: continue foundational specs without implementation."
  - "User decision 2026-05-10: dashboard entry is a multi-project view with widgets, then users can filter visible projects and sort by date, status, and similar criteria."
  - "shipglows-firestore-data-model.md defines user-scoped projectRefs/feedItems, shared projects, indexedFiles, indexRuns, diagnostics, stale projection, and access-lost states."
  - "shipglows-auth-github-access.md defines old projection visibility/search after GitHub access loss while clone/index/refresh actions are blocked."
  - "shipglows-project-onboarding-flow.md routes ready projects to the dashboard and requires indexing state to resume from Firestore."
  - "shipglows-markdown-artifact-governance.md requires dashboard grouping by governance family/type and missing corpus as a setup warning."
  - "markdown-source-of-truth.md states repository Markdown is canonical and remote storage is projection/index/sync."
next_step: "/sf-ship ShipGlows Dashboard Read-only Projection"
---
# Spec: ShipGlows Dashboard Read-only Projection
🟢 [shipglows_app] spec: ShipGlows Dashboard Read-only Projection | status: ready | path: shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md | next: /sf-ship ShipGlows Dashboard Read-only Projection

# Title

ShipGlows Dashboard Read-only Projection

# Status

Ready after `/sf-ready`. This spec defines the dashboard consumption contract only. Firestore data model, auth/GitHub access, project onboarding, Markdown artifact governance, and GitHub managed clone/indexer producer dependencies are ready/closed; production Firebase SDK queries, Firestore Security Rules, and hosted validation remain gated by the proof contract below.

# User Story

En tant qu'utilisatrice ShipGlows, je veux ouvrir un dashboard qui lit les projets, artefacts, statuts et diagnostics depuis la projection Firestore, afin de comprendre l'etat de mes repositories sans declencher d'ecriture ni exposer l'infrastructure GitHub/clone.

# Minimal Behavior Contract

The dashboard accepts a Firebase-authenticated user, reads only membership-verifiable or user-scoped Firestore projection documents, and renders project status, indexed ShipGlows artifacts, freshness, access warnings, diagnostics, and setup gaps without writing repository content or exposing GitHub tokens, installation internals, clone paths, or server filesystem details. If projection data is missing, stale, access-lost, partially indexed, or unauthorized, the dashboard shows a clear read-only state and only offers backend-request actions that are allowed by the auth/access shipglows_data/workflow/specs. The easy edge case to miss is treating dashboard state as canonical or letting a broad Firestore query reveal projects or artifacts outside the signed-in user's membership.

# Success Behavior

- Given a signed-in user with `users/{uid}/projectRefs`, the dashboard lists only projects visible to that user.
- Given the dashboard opens, the default landing view is a multi-project overview with widgets, not a direct jump into the last project.
- Given the user wants to focus, the dashboard supports filtering visible projects and sorting by date, status, and other projection-backed fields without changing shared project data.
- Given a project is `ready` with fresh indexed files, the dashboard shows project identity, GitHub summary, artifact families, important artifacts, freshness metadata, and last index status from Firestore projection.
- Given a project is still onboarding or indexing, the dashboard resumes from Firestore project/index run status without restarting setup automatically.
- Given a project has no recognized ShipGlows artifacts, the dashboard shows an empty governance/setup state instead of treating indexing as failed.
- Given `shipglows_data/` is missing, duplicated, or legacy-cased, the dashboard shows the governance corpus warning emitted by the indexer.
- Given GitHub access is lost, the dashboard keeps the last projection readable/searchable with an access warning and disables clone/index/refresh actions until backend revalidation succeeds.
- Given a file was deleted in GitHub and remains as a deleted projection record, the dashboard does not present it as active content.
- Given diagnostics exist, the dashboard shows redacted, actionable diagnostics without exposing secrets, paths, tokens, or raw backend payloads.

# Error Behavior

- If Firebase Auth is missing, expired, or invalid, the dashboard shows signed-out or unauthorized state and performs no Firestore project reads.
- If Firestore rules deny a project or artifact read, the dashboard treats it as unavailable and does not retry with broader queries.
- If the user has no project refs, the dashboard shows an empty state that routes to onboarding, not a global project scan.
- If projection documents are stale relative to project head metadata, the dashboard marks them stale and keeps read-only content available.
- If an indexed file parse failed, the dashboard shows that file as unavailable or diagnostic-backed while leaving other files visible.
- If a backend request action such as refresh is unavailable because GitHub access is lost, the dashboard shows the blocked reason and performs no optimistic state mutation.
- If a projection document contains unknown artifact types, the dashboard groups them under safe unknown/diagnostic handling rather than executing or rendering unsafe content.
- If a client-side cache belongs to a previous Firebase user, the dashboard must clear or partition it before rendering the current user's data.

# Problem

The foundational specs define how ShipGlows authenticates users, indexes GitHub repositories, projects Markdown artifacts into Firestore, and onboards projects. The dashboard is the first major consumer of that projection, but its contract is still implicit. Without a dashboard spec, implementation could read too broadly, confuse stale projection with canonical content, hide access-loss states, expose infrastructure details, or accidentally create write paths before V1 write-back exists.

# Solution

Define the dashboard as a read-only Firestore projection consumer. It reads user-scoped project references and membership-verifiable project subcollections, renders status and artifact groups produced by the indexer, treats every repository-content value as rebuildable projection, and delegates any refresh/index request to the trusted backend. The UI vocabulary should stay product-oriented: projects, repositories, setup status, artifacts, warnings, and diagnostics.

# Scope In

- Define dashboard read model for user project list, project detail, artifact groups, freshness, diagnostics, and index history summaries.
- Define the default multi-project overview, widgets, filters, and sort behavior.
- Define how dashboard consumes `users/{uid}/projectRefs`, `users/{uid}/feedItems`, `projects/{projectId}`, `members`, `indexedFiles`, `indexRuns`, and `diagnostics`.
- Define read-only behavior for fresh, stale, indexing, empty, access-lost, hidden, archived, parse-failed, and governance-corpus-missing states.
- Define visibility rules for shared projects and personal display preferences.
- Define which backend-request actions can be presented without making the dashboard a write surface.
- Define security and privacy constraints for Firestore queries, cached projection, diagnostics, GitHub summaries, and clone details.
- Define links to onboarding terminal states and Markdown artifact governance families.

# Scope Out

- Implementing dashboard UI, widgets, routes, providers, or Firestore repositories.
- Implementing Firestore Security Rules.
- Implementing Firebase Auth or GitHub App flows.
- Implementing Cloud Functions, runner, clone, or indexer code.
- Implementing Markdown write-back, commits, branches, pull requests, or agents.
- Implementing full-text/vector search backend.
- Implementing billing, teams, organization admin, or invitation management.
- Building a marketing dashboard or landing page.

# Constraints

- V1 dashboard is read-only for repository content.
- Firestore is a projection and app-state store, not canonical repository content.
- GitHub repository and ShipGlows Markdown files remain canonical.
- The dashboard never receives GitHub tokens, installation tokens, private keys, tokenized clone URLs, clone filesystem paths, or backend-only installation documents.
- All user-facing project reads must be scoped by user-owned refs or paths Firestore rules can prove from membership.
- The dashboard may request backend actions like refresh/index only through explicit trusted backend contracts; it does not mutate server-owned projection fields directly.
- Stale or access-lost projection can remain visible, but must be labeled.
- Personal display preferences are user-scoped and cannot change shared project projection.
- Unknown or unsafe Markdown/artifact content is displayed as metadata/diagnostic, not executed.

# Dependencies

- `shipglows_data/workflow/specs/shipglows-firestore-data-model.md` defines the Firestore documents consumed by the dashboard.
- `shipglows_data/workflow/specs/shipglows-auth-github-access.md` defines Firebase Auth, GitHub access loss, UI cache TTL, and server revalidation rules.
- `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md` defines the projection producer and index/run statuses.
- `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md` defines dashboard entry from `ready`, `indexing_project`, blocked, and empty setup states.
- `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md` defines artifact families, `shipglows_data/` corpus policy, missing corpus warnings, and safe content projection.
- `shipglows_data/technical/shipglows-foundational-architecture.md` defines GitHub/Markdown as canonical, mandatory hidden clone, and read-only V1.
- `shipglows_data/technical/markdown-source-of-truth.md` defines repository Markdown as source of truth and database projection as rebuildable.
- Fresh external shipglows_data: not needed for this spec because it is a local product/read-model contract. Implementation shipglows_data/workflow/specs that add Firebase SDK queries or Firestore rules must re-check official Firebase shipglows_data.

# Invariants

- Dashboard reads never make Firestore canonical over GitHub/Markdown.
- A project card or detail page always traces repository content to a `projectId`, GitHub identity summary, projection status, and source commit when content is shown.
- User project lists come from `users/{uid}/projectRefs` or equivalent user-scoped feed records.
- The dashboard default route is a multi-project overview; last-opened-project can be a preference or shortcut but not the default entry behavior.
- Filters and sorting are personal view state and do not mutate shared project records.
- Shared project data remains shared; personal hiding, ordering, filters, and dashboard defaults remain user-scoped.
- Dashboard-visible diagnostics are redacted and never include secrets or server filesystem details.
- Access-lost projects are readable/searchable from last projection but cannot be refreshed or reindexed without backend access restoration.
- Deleted projection records cannot appear as active artifacts.
- Every visible refresh/index affordance maps to a trusted backend request and must be disabled when auth/access status blocks it.

# Links & Consequences

- Auth: dashboard requires Firebase Auth and must not infer GitHub access from client-visible membership alone.
- Firestore: query design must follow user-scoped refs and membership-verifiable paths; security rules are not a substitute for broad client scans.
- Onboarding: terminal and recoverable onboarding states become dashboard states after project creation/join.
- Runner/indexer: dashboard consumes status and diagnostics; it does not create clone paths or source commits.
- Markdown governance: dashboard grouping should be by artifact family/type and corpus status, not raw file tree alone.
- Data quality: stale, partial, deleted, and parse-failed projection must stay visible as state, not disappear silently.
- Performance: default dashboard should avoid reading all full Markdown bodies for all projects; list views use summaries and fetch bodies on detail/search demand.
- Product: overview widgets should aggregate projection summaries across visible projects and respect user filters/sorts.
- Accessibility: warnings and disabled actions need text labels and status semantics, not color alone.

# Documentation Coherence

- Add this spec to `shipglows_data/editorial/content-map.md`.
- Add this spec to `shipglows_data/technical/code-docs-map.md`.
- Add this spec to `shipglows_data/technical/shipglows-foundational-architecture.md`.
- Future implementation should create a dedicated dashboard technical doc only when concrete routes/providers/queries exist.
- Future README should mention dashboard behavior only after implementation exists.

# Edge Cases

- User signs out while dashboard has project projection cached.
- User switches Firebase accounts on the same device.
- User hides a project that still has shared active members.
- Project is `archived_orphaned` but GitHub access is restored through onboarding.
- GitHub access is lost after projection has been indexed successfully.
- Firestore projection is fresh for commit A while GitHub default branch has moved to commit B.
- Indexing is queued/running while dashboard is open.
- An index run partially succeeds and some files have parse failures.
- No `shipglows_data/` corpus exists.
- Both `shipglows_data/` and `ShipGlows_Data/` exist.
- A file is marked `deleted: true`.
- A full Markdown body is too large and only summary/truncated projection exists.
- Diagnostics exist for unsafe ignored files.
- Firestore read is denied for a project ref that still exists in the user's cached list.
- Unknown future artifact families appear before the dashboard is updated.

# Implementation Tasks

- [x] Task 1: Create dashboard read-model documentation.
  - File: `shipglows_data/technical/dashboard-readonly-projection.md`
  - Action: Define list/detail/read models, status mapping, Firestore paths, redaction rules, and no-write guarantees.
  - User story link: Makes dashboard behavior implementable from projection without exposing infrastructure.
  - Depends on: This spec passing `/sf-ready`.
  - Validate with: `rg -n "projectRefs|indexedFiles|indexRuns|diagnostics|read-only|access-lost" shipglows_data/technical/dashboard-readonly-projection.md`
  - Notes: Documentation only; no code during spec phase.
- [x] Task 2: Define dashboard state taxonomy.
  - File: `shipglows_data/technical/dashboard-readonly-projection.md`
  - Action: Map onboarding/project/index/access states to visible dashboard states: empty, indexing, ready, stale, access_lost, corpus_missing, partial, failed, hidden, archived. Internal access statuses must stay traceable to `not_connected`, `needs_github_app`, `connected`, `access_cached`, `github_access_lost`, `installation_suspended`, and `access_check_failed`.
  - User story link: Lets users understand project state without backend jargon.
  - Depends on: Task 1.
  - Validate with: State table covers every terminal/recoverable state from onboarding, auth/access, and indexer shipglows_data/workflow/specs.
  - Notes: Use product-facing labels in future UI; keep internal enum names traceable.
- [x] Task 2b: Define multi-project overview widgets, filters, and sorting.
  - File: `shipglows_data/technical/dashboard-readonly-projection.md`
  - Action: Specify default overview widgets, project filter model, sort fields, empty states, and persistence as user-scoped view preferences.
  - User story link: Makes the dashboard useful as a multi-project cockpit before drilling into one repo.
  - Depends on: Tasks 1-2.
  - Validate with: Widget/state tests cover overview default, filter by project/status, sort by date/status, and reset filters.
  - Notes: Widgets must use projection summaries and avoid loading every full Markdown body.
- [x] Task 3: Define Firestore query boundaries.
  - File: `shipglows_data/technical/dashboard-readonly-projection.md`
  - Action: Specify allowed read paths and forbidden broad reads/collection scans for project list, project detail, artifact list, artifact body, diagnostics, and index runs.
  - User story link: Protects cross-project privacy while enabling dashboard reads.
  - Depends on: Task 1.
  - Validate with: Query matrix names membership/user-scope proof for every read.
  - Notes: Actual rules and SDK code remain future implementation.
- [x] Task 4: Define dashboard DTO/domain contracts.
  - File: `lib/shipglows/` and/or future data layer files chosen during implementation.
  - Action: Add read-only DTOs for project summary, artifact summary, artifact detail, diagnostic summary, index run summary, and dashboard feed item.
  - User story link: Gives the UI a projection-only shape that cannot accidentally carry secrets or write authority.
  - Depends on: Tasks 1-3.
  - Validate with: Unit tests for serialization, redaction, stale/access-lost mapping, and absence of forbidden fields.
  - Notes: No direct dependency on clone or GitHub token types.
- [x] Task 5: Define dashboard repository/provider contracts.
  - File: `lib/shipglows/` and/or future data layer files chosen during implementation.
  - Action: Add interfaces for reading project refs, project summaries, artifact groups, diagnostics, index runs, and optional backend action requests.
  - User story link: Keeps dashboard as reader/requester rather than projection writer.
  - Depends on: Task 4.
  - Validate with: Fake repository tests for no projects, ready project, stale project, access lost, partial parse, denied read, and user switch.
  - Notes: Backend action methods must return request/status results, not mutate client-owned projection state.
- [x] Task 6: Define dashboard UI behavior.
  - File: `lib/shipglows/presentation/**`
  - Action: Implement list/detail/search-or-filter states using the read model, including warnings, disabled actions, empty corpus, deleted files, and redacted diagnostics.
  - User story link: Delivers the user-visible dashboard promise.
  - Depends on: Tasks 4-5.
  - Validate with: Widget tests for all state taxonomy entries and accessibility checks for warnings/disabled actions.
  - Notes: Do not show clone paths, installation IDs, token concepts, or backend file paths.
- [x] Task 7: Add security-focused tests.
  - File: `test/shipglows/` or existing test directories chosen during implementation.
  - Action: Test account switching, cache partitioning, denied reads, forbidden fields, and disabled backend actions under access loss.
  - User story link: Prevents private repo/project leakage.
  - Depends on: Tasks 4-6.
  - Validate with: `flutter test` plus future Firestore emulator tests before production data.
  - Notes: Emulator security tests are mandatory before enabling real Firestore reads.
- [x] Task 8: Update documentation maps after implementation.
  - File: `shipglows_data/editorial/content-map.md`, `shipglows_data/technical/code-docs-map.md`, `shipglows_data/technical/shipglows-foundational-architecture.md`, and future README only if behavior exists.
  - Action: Link concrete dashboard shipglows_data and code ownership.
  - User story link: Keeps future agents on the projection-only contract.
  - Depends on: Tasks 1-7.
  - Validate with: `rg -n "Dashboard read-only|dashboard-readonly|ShipGlows dashboard" shipglows_data/editorial/content-map.md shipglows_data/technical`
  - Notes: This current spec already adds foundational links; implementation should refine them.

# Acceptance Criteria

- [x] AC 1: Given a signed-in user with project refs, when the dashboard loads, then it lists only those projects and performs no global project scan.
- [x] AC 1b: Given the dashboard opens, when the user has multiple projects, then the default view is a multi-project widget overview with filter and sort controls.
- [x] AC 1c: Given filters or sorting are changed, when the dashboard updates, then only user-scoped view preferences change and shared project projection is untouched.
- [x] AC 2: Given a signed-out user, when the dashboard route opens, then no project Firestore reads occur and the user sees sign-in/unauthorized state.
- [x] AC 3: Given a ready project, when the user opens it, then project status, artifact families, freshness, last index status, and diagnostics summaries are visible from Firestore projection.
- [x] AC 4: Given a stale projection, when the dashboard renders it, then content remains readable with stale labeling and source commit metadata.
- [x] AC 5: Given GitHub access is lost, when the dashboard renders the project, then last projection remains visible/searchable, refresh/index actions are disabled, and the access warning is explicit.
- [x] AC 6: Given no known ShipGlows artifacts were indexed, when the dashboard opens the project, then the project shows an empty/setup state, not an unexplained failure.
- [x] AC 7: Given `shipglows_data/` is missing or duplicated, when dashboard reads diagnostics, then it shows the governance corpus warning without blocking all project visibility.
- [x] AC 8: Given a deleted projection record, when artifacts are listed, then the deleted file is not shown as active content.
- [x] AC 9: Given parse failures for some files, when dashboard renders artifacts, then valid files remain visible and failed files show redacted diagnostics.
- [x] AC 10: Given a user switches accounts, when dashboard reloads, then cached data from the previous user is not rendered.
- [x] AC 11: Given a forbidden field or backend-only document exists, when dashboard DTOs are built, then tokens, installation internals, clone paths, and raw backend paths are absent.
- [x] AC 12: Given an unknown future artifact type appears, when dashboard groups artifacts, then it remains safely viewable as unknown metadata or diagnostic, not executable content.

# Test Contract

- `surface`: dashboard read-only projection contract, technical read-model doc, pure Dart dashboard DTO/domain contracts, fake repository/provider contracts, widget states, cache/user-switch boundaries, docs maps, and future Firestore read-path assumptions. Covered source areas include `shipglows_data/technical/dashboard-readonly-projection.md`, `lib/shipglows/**`, `test/shipglows/**`, `shipglows_data/technical/code-docs-map.md`, `shipglows_data/editorial/content-map.md`, and related Firestore/indexer specs.
- `proof_profile`: high-risk local product/data contract proof before real hosted Firestore reads. Required evidence is spec/doc coherence, pure Dart unit tests, fake repository tests, widget tests, forbidden-field scans, accessibility-oriented state assertions, metadata lint, and diff hygiene. Real Firebase SDK queries, Firestore Security Rules, Cloud Functions, GitHub App calls, hosted auth flows, and production data reads are out of scope for this implementation slice unless a later spec expands the surface.
- `proof_order`:
  1. Write `dashboard-readonly-projection.md` before code so state names, read paths, redaction, and no-write guarantees are explicit.
  2. Add DTO/state mapping tests before or alongside DTO implementation.
  3. Add fake repository/provider tests for signed-out, empty, ready, stale, access-lost, denied, deleted, partial-parse, and user-switch states before UI wiring.
  4. Implement dashboard UI states only after read models and fake repository contracts pass.
  5. Add forbidden-field and cache-partition tests before declaring the dashboard safe for preview.
  6. Run focused dashboard tests, then broader `flutter test`, `flutter analyze`, metadata lint, and `git diff --check`.
  7. Use `/sf-ship` then `/sf-prod` before any browser/user-flow claim in this `vercel-preview-push` project.
- `checklist_path`: `shipglows_data/workflow/verification/shipglows-dashboard-readonly-projection.md`.
- `required_scenario_ids`:
  - `DASH-READ-001`: signed-in user sees only user-scoped project refs and no global project scan is possible in the repository contract.
  - `DASH-READ-002`: signed-out or expired-auth state performs no project reads and shows an unauthorized/signed-out state.
  - `DASH-OVERVIEW-001`: default dashboard entry is a multi-project overview with widget summaries, project filters, and projection-backed sorting.
  - `DASH-STATE-001`: ready, indexing, stale, access-lost, corpus-missing, hidden, archived, partial, failed, deleted, and unknown artifact states map to visible dashboard states.
  - `DASH-DIAG-001`: diagnostics are redacted, bounded, actionable, and never expose tokens, installation internals, clone paths, service credentials, raw backend payloads, or server filesystem paths.
  - `DASH-CACHE-001`: Firebase user switch clears or partitions cached projection so previous-user project data is not rendered.
  - `DASH-A11Y-001`: warnings, disabled refresh/index actions, stale labels, and diagnostics are conveyed with text/status semantics, not color alone.
  - `DASH-DOC-001`: technical docs and maps align with dashboard read-only behavior and do not claim production Firebase/GitHub indexing beyond implemented proof.
- `required_results`: all required scenario ids pass; dashboard code has no direct write path to server-owned projection fields; read models contain no forbidden secret/clone fields; stale/access-lost content is labeled; deleted files are not active artifacts; unknown artifact types remain inert metadata; docs and changelog do not overclaim production readiness; checks pass or exceptions are recorded with proof.
- `exception_with_proof`: hosted preview/browser proof may be deferred only when implementation remains pure local contracts and widget/fake repository tests cover the visible states; any real Firebase SDK query, Firestore rule, auth route, Cloud Function, or deployed dashboard user flow removes this exception and requires `/sf-ship` -> `/sf-prod` -> browser/auth proof.
- `exception_without_proof`: none for user-scoped read boundaries, forbidden-field redaction, account-switch isolation, no-write guarantee, metadata lint, and diff hygiene.

# Test Strategy

- Unit tests for dashboard state mapping from project/access/index/projection statuses.
- Unit tests for DTO redaction and forbidden-field absence.
- Repository/fake Firestore tests for project refs, feed items, artifact groups, diagnostics, index runs, denied reads, stale data, and deleted files.
- Widget tests for signed-out, empty, onboarding/indexing, ready, stale, access-lost, corpus-missing, partial parse, and diagnostics states.
- Account-switch/cache tests to prevent cross-user projection leakage.
- Accessibility checks for warnings, status labels, disabled actions, and diagnostics.
- Future Firestore emulator tests for dashboard read paths before production Firestore access ships.
- No implementation checks were run for this spec phase.

# Risks

- High security risk if dashboard queries can enumerate projects or artifacts outside the user's membership.
- High data risk if users interpret Firestore projection as canonical and act on stale data without warning.
- High privacy risk if cached projection crosses Firebase users on the same device.
- Medium UX risk if access-lost and stale states look like data loss or generic failure.
- Medium performance/cost risk if list views read every full Markdown body by default.
- Medium maintainability risk if dashboard status names drift from onboarding, auth/access, indexer, and Firestore shipglows_data/workflow/specs.

# Execution Notes

- Implementation approach: create the read-model doc first, then DTOs/state mapping, then repository/provider contracts, then UI states, then security-focused tests.
- Files to read first before implementation: `shipglows_data/workflow/specs/shipglows-firestore-data-model.md`, `shipglows_data/workflow/specs/shipglows-auth-github-access.md`, `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md`, `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md`, and `shipglows_data/technical/markdown-source-of-truth.md`.
- Technical decision: dashboard list views should use summary/projectRef/feed records and fetch full artifact bodies only for detail/search demand.
- Technical decision: dashboard may show refresh/retry controls only as trusted backend requests; it never writes `sourceCommit`, `projectionStatus`, `accessStatus`, memberships, diagnostics, or indexed file records directly.
- Technical decision: stale and access-lost projections remain valuable read-only context and should stay visible with explicit warnings.
- Technical decision: project hiding/removal is personal user-scoped display state and must not delete shared project projection.
- Fresh-shipglows_data verdict: not needed for this spec. Re-check official Firebase/Firestore shipglows_data before writing SDK queries, Cloud Functions, or Firestore rules.
- Stop condition: if implementation requires direct client writes to server-owned projection fields, stop and create/update an auth/data spec before coding.
- Stop condition: if product requires editing Markdown, creating commits, or running agents from the dashboard, stop and create a separate high-risk write-back/agent spec.

# Open Questions

None. Remaining choices are implementation details unless they change visible dashboard navigation, project information architecture, or write-back scope.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 09:26:21 UTC | sf-spec | GPT-5 Codex | Created foundational dashboard read-only projection spec from existing foundational specs and shipglows_data. | Draft spec created. | /sf-ready ShipGlows Dashboard Read-only Projection after foundational coherence pass |
| 2026-05-30 16:50:20 UTC | sf-spec | GPT-5 Codex | Repaired readiness gaps after managed clone/indexer closeout: dependency versions, status, Test Contract, proof order, scenarios, and exceptions. | reviewed | /sf-ready ShipGlows Dashboard Read-only Projection |
| 2026-05-30 16:51:17 UTC | sf-ready | GPT-5 Codex | Reviewed readiness after Test Contract repair. | not ready: blocking dependencies still draft (`shipglows-auth-github-access.md`, `shipglows-project-onboarding-flow.md`, `shipglows-markdown-artifact-governance.md`). | /sf-ready ShipGlows Auth GitHub Access |
| 2026-05-30 16:56:47 UTC | sf-ready | GPT-5 Codex | Re-ran readiness after dependencies were repaired and marked ready; dashboard contract, proof path, state taxonomy, security boundaries, and docs coherence are actionable. | ready | /sf-start ShipGlows Dashboard Read-only Projection |
| 2026-05-30 17:04:36 UTC | sf-start | GPT-5 Codex | Implemented read-only projection contract docs, in-memory repository/read models, UI projection panel, user-scope/access-lost/filter/sort/account-switch tests, and docs map alignment. | implemented | /sf-verify ShipGlows Dashboard Read-only Projection |
| 2026-05-30 17:06:32 UTC | sf-verify | GPT-5 Codex | Verified local contract scope against scenario ids, checks, redaction scan, metadata lint, analyzer, and widget/repository tests. | verified | /sf-end ShipGlows Dashboard Read-only Projection |
| 2026-05-30 17:07:27 UTC | sf-end | GPT-5 Codex | Closed the local dashboard read-only projection contract slice and prepared it for ship. | closed | /sf-ship ShipGlows Dashboard Read-only Projection |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Dashboard read-only projection spec created. |
| sf-ready | ready | Passed after auth/GitHub access, project onboarding, and Markdown artifact governance dependencies were made ready. |
| sf-start | done | Local contract, fake repository, widget-state proof, and documentation alignment implemented without real Firebase/GitHub wiring. |
| sf-verify | verified | Local contract/fake repository/widget scope verified; hosted Firebase/GitHub/browser proof remains out of scope until real integration. |
| sf-end | closed | Local contract slice closed; ship remains. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
