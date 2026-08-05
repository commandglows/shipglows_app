---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-10"
created_at: "2026-05-10 16:03:25 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 16:38:48 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "foundational-coherence"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipGlows, je veux une spec unique de coherence qui verrouille les contrats transverses entre auth, onboarding, indexer, gouvernance Markdown, projection Firestore et dashboard, afin d'eviter des implementations divergentes ou insecurisees avant /sf-start."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Firebase Auth"
  - "GitHub App"
  - "Cloud Firestore"
  - "Firestore Security Rules"
  - "Cloud Functions for Firebase"
  - "managed clone runner"
  - "shipglows_data/"
  - "ShipGlows dashboard"
  - "shipglows_data/technical/shipglows-foundational-architecture.md"
depends_on:
  - artifact: "shipglows_data/technical/shipglows-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/foundational-specs-handoff.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-auth-github-access.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-firestore-data-model.md"
    artifact_version: "0.1.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "https://firebase.google.com/shipglows_data/auth"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipglows_data/firestore/security/rules-conditions"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipglows_data/functions"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://shipglows_data.github.com/en/apps/overview"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
  - artifact: "https://shipglows_data.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation"
    artifact_version: "checked-2026-05-10"
    required_status: "active"
supersedes: []
evidence:
  - "shipglows_data/technical/foundational-specs-handoff.md references /sf-ready ShipGlows Foundational Coherence Review as required gate before implementation."
  - "Foundational specs are present but mostly still draft and explicitly deferred for cross-spec coherence pass."
  - "Current state mixes shared contracts across multiple files, increasing ambiguity for a fresh implementation context."
next_step: "/sf-verify ShipGlows Foundational Coherence Review"
---
# Spec: ShipGlows Foundational Coherence Review
🟢 [shipglows_app] spec: ShipGlows Foundational Coherence Review | status: ready | path: shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md | next: /sf-verify ShipGlows Foundational Coherence Review

# Title

ShipGlows Foundational Coherence Review

# Status

Implemented canonical coherence spec. This spec now contains the cross-spec matrix, state vocabulary, security controls, failure gates, and documentation pointers needed before foundational implementation starts.

# User Story

En tant que fondatrice de ShipGlows, je veux une spec unique de coherence qui verrouille les contrats transverses entre auth, onboarding, indexer, gouvernance Markdown, projection Firestore et dashboard, afin d'eviter des implementations divergentes ou insecurisees avant /sf-start.

# Minimal Behavior Contract

When an operator runs the foundational coherence pass, the system must evaluate the six foundational specs against one shared contract that defines identities, permissions, state transitions, data authority, read/write boundaries, and failure handling; the output is an explicit ready/not-ready decision with actionable corrections per mismatch. If a cross-spec contradiction or security gap is found, implementation remains blocked and the gap is recorded as a concrete correction item. The easiest edge case to miss is a spec that appears correct in isolation but breaks a cross-spec invariant (for example stale projection visibility, access-lost behavior, or server-side authorization ownership).

# Success Behavior

- Preconditions: the foundational architecture doc and all six foundational specs exist in the repository.
- Trigger: operator runs `/sf-ready ShipGlows Foundational Coherence Review` against this canonical spec.
- User-visible result: a deterministic readiness verdict (`ready` or `not ready`) for the foundational set, with precise blockers when not ready.
- System effect: frontmatter/status and chantier trace are updated in this coherence spec; linked foundational specs receive targeted correction actions when needed.
- Proof of success: `sf-ready` checklist can be answered without ambiguity for all required gates (behavior, ordering, security, shipglows_data coherence, language doctrine, freshness gate) and outputs a single next command.

# Error Behavior

- Invalid state: one or more foundational specs are missing, structurally incomplete, or contradictory on critical contracts (authz, projection authority, state machine, tenant boundaries).
- Operator feedback: coherence review returns `not ready` with explicit per-gap corrective actions and identifies the owning spec(s).
- Expected system effect: no `/sf-start` launch is authorized for foundational implementation; status remains `draft` or `reviewed` until blockers are closed.
- Must never happen: declaring `ready` while cross-spec security controls are unspecified; silently accepting undefined retry/rollback/idempotency behavior; relying on UI-only checks for server-authorized operations.

# Problem

The repository has a complete foundational corpus but the contracts are spread across multiple draft shipglows_data/workflow/specs and a handoff doc. A fresh implementation context can still choose inconsistent status names, permission checks, query boundaries, and error semantics. Without a single coherence spec, `/sf-ready` can pass individual shipglows_data while cross-spec contradictions remain.

# Solution

Create one canonical coherence spec that defines the shared invariants, adversarial/security checks, and acceptance criteria across auth, onboarding, managed clone indexing, Markdown governance, Firestore projection, and dashboard consumption. Use this spec as the mandatory readiness gate before any foundational `/sf-start` execution.

# Scope In

- Define cross-spec contract matrix for:
  - project identity and deduplication
  - auth vs GitHub access separation
  - server-side authorization ownership
  - read-only V1 boundaries
  - projection freshness/staleness semantics
  - access-lost behavior and recovery
  - `shipglows_data/` governance precedence
  - dashboard query/read boundaries
- Define required state vocabulary and mapping rules between shipglows_data/workflow/specs.
- Define coherence-level acceptance criteria and adversarial misuse cases.
- Define security minimums required before implementation.
- Define documentation alignment obligations for foundational artifacts.

# Scope Out

- No application code implementation.
- No Firebase rules/code deployment.
- No Cloud Functions implementation.
- No schema migration execution.
- No UI redesign beyond behavioral contract definition.
- No expansion to billing, write-back, agent execution, terminal automation, or advanced team models.

# Constraints

- Must remain compatible with `shipglows_data/technical/shipglows-foundational-architecture.md` decisions.
- Must preserve V1 read-only product boundary.
- Must keep GitHub repository and Markdown as canonical content authority.
- Must enforce server-trusted checks for repo access and sensitive operations.
- Must keep spec internal-contract anchors in English section headings for ShipGlows tooling compatibility.

# Dependencies

- Foundational specs:
  - `shipglows_data/workflow/specs/shipglows-auth-github-access.md`
  - `shipglows_data/workflow/specs/shipglows-firestore-data-model.md`
  - `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md`
  - `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md`
  - `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md`
  - `shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md`
- Architecture and handoff context:
  - `shipglows_data/technical/shipglows-foundational-architecture.md`
  - `shipglows_data/technical/foundational-specs-handoff.md`
- Fresh external shipglows_data verdict: `fresh-shipglows_data checked` via official Firebase and GitHub shipglows_data already referenced by foundational specs; coherence spec must fail readiness if those dependencies become stale or contradictory.

# Invariants

- One ShipGlows project maps to exactly one GitHub repository.
- Project primary key is opaque `projectId`; GitHub `owner/repo` remains mutable metadata.
- Firebase Auth identity and GitHub repository authorization are separate concerns.
- Managed clone is mandatory, infrastructure-managed, and user-hidden.
- V1 remains read-only for repository content.
- Firestore is projection/state store, never canonical repo authority.
- GitHub access and repository truth win in conflicts.
- Access loss blocks refresh/index writes while allowing stale read visibility with clear warning.

# Links & Consequences

- Upstream dependencies:
  - Auth/session semantics from Firebase Auth and GitHub App shipglows_data.
  - Firestore data and rules constraints for multi-project access.
- Downstream consumers:
  - onboarding flow, index runner, dashboard, source readers, diagnostics surfaces.
- Cross-system consequences:
  - inconsistent state naming can break onboarding resume and dashboard filters.
  - weak authz contract can expose cross-project data.
  - missing stale/access-lost contract can hide operational failures.
- Required cross-validations:
  - state mapping table consistency across six foundational specs.
  - query scope and tenant checks in data model and dashboard contracts.
  - retry/idempotency semantics between onboarding trigger and indexing runs.

# Documentation Coherence

- Must stay aligned (or be updated in same chantier when changed):
  - `shipglows_data/technical/shipglows-foundational-architecture.md`
  - `shipglows_data/technical/foundational-specs-handoff.md`
  - `shipglows_data/technical/code-docs-map.md`
  - `shipglows_data/editorial/content-map.md`
  - each foundational spec listed in Dependencies
- `None` is not allowed for this scope because the coherence gate exists specifically to align documentation contracts before implementation.

# Edge Cases

- Same repository selected by two users concurrently during onboarding.
- GitHub access revoked between onboarding completion and index trigger.
- Repo renamed/transferred while `projectId` remains stable.
- Index run times out after partial projection write.
- `shipglows_data/` appears after an initial fallback-root indexing cycle.
- Dashboard queries mix accessible and no-longer-accessible projects for same user.
- Duplicate onboarding triggers for the same project (replay/double submit).

# Coherence Contract Matrix

| Contract | Canonical rule | Owner spec | Must align with | Readiness failure if |
| --- | --- | --- | --- | --- |
| Project identity | One ShipGlows project equals exactly one GitHub repository, keyed by opaque `projectId`; GitHub owner/name/repository ID are metadata for deduplication and access checks. | `shipglows_data/workflow/specs/shipglows-firestore-data-model.md` | Auth, onboarding, indexer, dashboard | Any spec uses `owner/repo` as durable Firestore document ID or creates duplicate projects for the same repo. |
| Identity versus repository access | Firebase Auth identifies the ShipGlows user; GitHub App installation/access proves repository readability. These are separate and both are required for sensitive project actions. | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | Onboarding, Firestore rules, dashboard | Any spec treats Firebase login alone as proof of repo access or makes GitHub login mandatory for Firebase identity. |
| Server-side authorization | Repo listing, create-or-join, refresh, clone, indexing, projection writes, and access resync are initiated through trusted backend checks. Client UI can request, not authorize. | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | Indexer, onboarding, Firestore model | Any sensitive operation can be completed with UI-only checks or client-supplied repo metadata. |
| Read-only V1 boundary | V1 may read repository content and write app/projection state; it must not write Markdown, commit, push, open PRs, run terminal sessions, or execute agents. | `shipglows_data/technical/shipglows-foundational-architecture.md` | Indexer, dashboard, onboarding | Any foundational spec adds repo write-back, terminal, or agent execution behavior. |
| Projection authority | Firestore stores app state and projection, never canonical repository content. GitHub/clone content wins conflicts. | `shipglows_data/workflow/specs/shipglows-firestore-data-model.md` | Indexer, dashboard, Markdown governance | Any spec lets Firestore override repo Markdown without a future write-back spec. |
| Managed clone | Clone materialization is mandatory for reliable indexing, infrastructure-owned, and hidden from user configuration. | `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md` | Onboarding, dashboard diagnostics | Any spec asks the user to choose clone paths or exposes clone paths as user-managed settings. |
| Governance corpus | `shipglows_data/` is the preferred project-local governance corpus; root-level docs are fallback or legacy evidence during migration and cannot override `shipglows_data/`. | `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md` | Indexer, dashboard projection | Any spec indexes arbitrary repository Markdown or lets stale root docs override `shipglows_data/`. |
| Dashboard read model | Dashboard reads user-scoped Firestore projection, project refs, diagnostics, and stale/access warnings without triggering repo writes. | `shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md` | Firestore model, auth/access, indexer | Any dashboard query can scan globally, cross tenants, mutate canonical content, or hide access-loss warnings. |
| Access loss | Existing projection can remain visible/searchable with clear warning; refresh, clone, indexing, and access-sensitive writes are blocked until GitHub access is restored. | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | Dashboard, indexer, Firestore model | Any spec deletes shared project data immediately or keeps refreshing after access is lost. |
| Idempotent create-or-join | Concurrent or repeated onboarding for the same GitHub repo resolves to one shared project with safe membership updates. | `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md` | Firestore model, auth/access | Duplicate requests can create duplicate projects, widen permissions, or overwrite membership incorrectly. |

# Canonical State Vocabulary

| State | Meaning | Allowed producer | Allowed consumer | Forbidden interpretation |
| --- | --- | --- | --- | --- |
| `needs_github_connection` | User is authenticated in ShipGlows but has no usable GitHub App installation/access path for project onboarding. | Auth/access backend or onboarding flow | Onboarding UI | A project exists or indexing can start. |
| `select_repository` | User can choose from repos the GitHub App installation allows and ShipGlows has server-validated. | Trusted backend repo-list endpoint | Onboarding UI | Client-provided repo list is authoritative. |
| `creating_or_joining_project` | Backend is deduplicating by GitHub repo identity and creating/updating membership. | Trusted backend onboarding action | Onboarding UI, diagnostics | A client-side write directly creates shared project state. |
| `indexing_project` | A trusted runner is materializing/checking the clone and projecting allowed Markdown artifacts. | Managed clone/indexer | Onboarding, dashboard | The browser is cloning or indexing repository files. |
| `ready` | Project has a usable projection for the current user and can appear in dashboard normal state. | Indexer/projection backend | Dashboard, onboarding | Repo content is canonical in Firestore. |
| `stale` | Projection exists but no longer matches current repo/clone truth or freshness expectations. | Indexer/projection backend | Dashboard, diagnostics | Projection should be silently trusted or discarded. |
| `access_lost` | GitHub no longer authorizes refresh/index for this user or project context. Existing projection may remain visible with warning. | Auth/access resync or backend action | Dashboard, onboarding recovery | User has lost Firebase identity or project data must be deleted. |
| `archived` | Shared project is no longer active for normal indexing/visibility, usually after orphaning or explicit later cleanup policy. | Trusted backend/admin policy | Dashboard filters, cleanup shipglows_data | Immediate destructive repository or projection deletion. |
| `failed` | A recoverable operation failed with diagnostic metadata safe for user/operator display. | Onboarding/indexer/backend | Onboarding, dashboard, diagnostics | Silent failure or secret-bearing raw error exposure. |
| `hidden_for_user` | User removed the project from personal ShipGlows view without deleting shared project data. | User-scoped preference action | Dashboard filters | Project deletion or GitHub access revocation. |

# Mandatory Security Controls

| Area | Required control | Owner spec | Validation expectation |
| --- | --- | --- | --- |
| Authentication | Every client request that touches user/project state must bind to Firebase Auth identity. | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | Rules/functions examples reject unauthenticated requests. |
| Authorization | Repo-sensitive actions revalidate GitHub App installation access server-side at action time. | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | No create, refresh, clone, or index action relies only on cached client claims. |
| Tenant boundary | Client reads are scoped through user membership/project refs; queries must be compatible with Firestore rules because rules are not filters. | `shipglows_data/workflow/specs/shipglows-firestore-data-model.md` | No dashboard/global collection query can depend on rules to trim inaccessible rows. |
| Backend trust | Cloud Functions or equivalent trusted runner owns token exchange, repo listing, clone/index, and projection writes. | `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md` | Flutter/client never receives GitHub App installation tokens or clone credentials. |
| Token handling | GitHub installation tokens are short-lived, generated server-side, never stored in client-readable Firestore, and never logged. | `shipglows_data/workflow/specs/shipglows-auth-github-access.md` | Token storage/logging is explicitly prohibited. |
| Input validation | Repo IDs, installation IDs, project IDs, artifact paths, and state transition inputs are validated against server-known records and allowlists. | Auth/access, indexer, Markdown governance | Client-provided repo/path/state cannot create authority. |
| Idempotency and replay | Create-or-join and indexing triggers are deduped by repo identity, source commit, requested actor, and run status. | Onboarding, indexer, Firestore model | Double submit/retry cannot duplicate projects or widen memberships. |
| Partial failure | Index timeout/partial projection produces `failed` or `stale` diagnostics without exposing secrets and without mixing partial data as fresh. | Indexer, dashboard | Dashboard can distinguish ready, stale, and failed projection. |
| Abuse control | Repo listing, indexing, refresh, and dashboard fan-out define quotas/rate limits or a future enforcement owner before implementation. | Auth/access, indexer, dashboard | No unbounded repo scans, clone loops, or cross-project fan-out. |
| Logging | Logs and diagnostics preserve auditability while redacting tokens, private clone URLs, raw file secrets, and sensitive GitHub payload fields. | Auth/access, indexer, dashboard | User-visible diagnostics are sanitized and operator logs have redaction rules. |

# Coherence Failure Gates

- Block readiness if any foundational spec grants user/project access from Firebase Auth alone without server-side GitHub access verification for repo-sensitive operations.
- Block readiness if any spec relies on Firestore Security Rules to filter broad queries instead of designing user-scoped queries that can satisfy rules.
- Block readiness if any spec lets Flutter/client hold GitHub App installation tokens, clone credentials, private clone URLs, or projection write authority.
- Block readiness if any spec makes Firestore canonical over repository Markdown or hides the stale/access-lost distinction.
- Block readiness if any spec introduces write-back, commits, PRs, terminal, agent execution, billing, or advanced teams into V1 scope.
- Block readiness if duplicate onboarding, repo rename/transfer, access revocation, partial indexing, timeout, or replay lacks a recoverable behavior.
- Block readiness if documentation maps do not point future agents to this coherence spec before foundational implementation.

# Implementation Tasks

- [x] Task 1: Create coherence contract matrix section in this spec.
  - Fichier : `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`
  - Action : Add explicit state/permission/authority mapping table that references each foundational spec owner.
  - User story link : Ensures one shared interpretation before implementation.
  - Depends on : None.
  - Validate with : `rg -n "contract matrix|state mapping|authority" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`.
  - Notes : Matrix must include owner spec for each rule.

- [x] Task 2: Normalize cross-spec state vocabulary.
  - Fichier : `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`
  - Action : Define canonical terms for `ready`, `indexing`, `stale`, `access_lost`, `archived`, `failed`, and map expected usage.
  - User story link : Prevents divergent runtime behavior across onboarding/indexer/dashboard.
  - Depends on : Task 1.
  - Validate with : `rg -n "access_lost|stale|indexing|archived|state vocabulary" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`.
  - Notes : Any alias must be explicit and justified.

- [x] Task 3: Define mandatory security control checklist.
  - Fichier : `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`
  - Action : Add authn/authz/input-validation/tenant/isolation/logging/abuse controls that each foundational spec must satisfy.
  - User story link : Avoids insecure shortcuts before build starts.
  - Depends on : Task 1.
  - Validate with : `rg -n "Authentication|Authorization|Multi-tenant|rate|replay|idempot" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`.
  - Notes : Must include server-side ownership of sensitive checks.

- [x] Task 4: Define coherence acceptance criteria and failure gates.
  - Fichier : `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`
  - Action : Add Given/When/Then criteria that block readiness on mismatch and route to owning correction spec.
  - User story link : Makes readiness verifiable and non-ambiguous.
  - Depends on : Tasks 1-3.
  - Validate with : `rg -n "CA [0-9]+" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`.
  - Notes : Include at least one misuse/bypass criterion.

- [x] Task 5: Update foundational reference shipglows_data to point to this canonical gate.
  - Fichier : `shipglows_data/technical/foundational-specs-handoff.md`, `shipglows_data/technical/shipglows-foundational-architecture.md`, `shipglows_data/technical/code-docs-map.md`
  - Action : Replace implicit coherence pass wording with explicit reference to this spec path.
  - User story link : Fresh contexts find the same gate without conversation history.
  - Depends on : Task 4.
  - Validate with : `rg -n "shipglows-foundational-coherence-review.md|Foundational Coherence" shipglows_data/technical/foundational-specs-handoff.md shipglows_data/technical/shipglows-foundational-architecture.md shipglows_data/technical/code-docs-map.md`.
  - Notes : Documentation-only, no runtime changes.

# Acceptance Criteria

- [ ] CA 1 : Given all six foundational specs exist, when `/sf-ready ShipGlows Foundational Coherence Review` runs on this spec, then it can evaluate each required gate using explicit criteria from this document without inferencing from chat history.
- [ ] CA 2 : Given any foundational spec contradicts a listed invariant (project identity, V1 read-only, GitHub-wins, or projection authority), when coherence review runs, then verdict is `not ready` and the owning spec to fix is named.
- [ ] CA 3 : Given repo access checks are defined only client-side in any foundational spec, when coherence review runs, then verdict is `not ready` because server-side authorization ownership is missing.
- [ ] CA 4 : Given one spec uses a conflicting lifecycle state name or meaning, when coherence review runs, then the mismatch is flagged as blocking until canonical mapping is restored.
- [ ] CA 5 : Given stale projection after GitHub access loss, when user opens dashboard, then behavior remains readable with warning and refresh/index actions stay blocked per coherent cross-spec contract.
- [ ] CA 6 : Given duplicate onboarding trigger for the same repository, when coherence review checks abuse cases, then idempotency or safe dedup expectation is explicitly defined.
- [ ] CA 7 : Given documentation pointers are reviewed, when starting from architecture or handoff shipglows_data, then this canonical coherence spec is discoverable as the mandatory readiness gate.

# Test Strategy

- Spec consistency checks:
  - `rg -n "# (Title|Status|User Story|Minimal Behavior Contract|Success Behavior|Error Behavior|Problem|Solution|Scope In|Scope Out|Constraints|Dependencies|Invariants|Links & Consequences|Documentation Coherence|Edge Cases|Implementation Tasks|Acceptance Criteria|Test Strategy|Risks|Execution Notes|Open Questions|Skill Run History|Current Chantier Flow)" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`
- Cross-reference checks:
  - `rg -n "ShipGlows Foundational Coherence Review|shipglows-foundational-coherence-review.md" shipglows_data/technical shipglows_data/workflow/specs`
- Invariant drift checks across foundational specs:
  - `rg -n "projectId|GitHub wins|read-only|access-lost|stale|shipglows_data" shipglows_data/workflow/specs/shipglows-*.md shipglows_data/technical/shipglows-foundational-architecture.md`
- Manual adversarial review:
  - verify replay, duplicate trigger, stale state, tenant leakage, and UI-only security assumptions are explicitly blocked.

# Risks

- High: false-ready decision if one foundational spec keeps ambiguous authz ownership.
- High: tenant boundary leak if project membership and query filters diverge across shipglows_data/workflow/specs.
- Medium: operational confusion if state vocabulary stays inconsistent.
- Medium: shipglows_data drift if architecture/handoff/map references are not updated with this canonical gate.
- Security impact: yes, mitigated by mandatory server-side authorization ownership, explicit multi-tenant boundaries, replay/dedup constraints, and logging boundaries in readiness criteria.

# Execution Notes

- Files to read first:
  - `shipglows_data/technical/shipglows-foundational-architecture.md`
  - `shipglows_data/technical/foundational-specs-handoff.md`
  - `shipglows_data/workflow/specs/shipglows-auth-github-access.md`
  - `shipglows_data/workflow/specs/shipglows-firestore-data-model.md`
  - `shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md`
  - `shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md`
  - `shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md`
  - `shipglows_data/workflow/specs/shipglows-dashboard-readonly-projection.md`
- Implementation approach (before code):
  1. Build coherence matrix and canonical state vocabulary in this spec.
  2. Reconcile each foundational spec against that matrix and list blockers.
  3. Resolve blockers spec-by-spec, then rerun `sf-ready` on this coherence spec.
- Explicit constraints:
  - Do not write runtime code during coherence phase.
  - Do not mark foundational implementation shipglows_data/workflow/specs `ready` by convenience; enforce evidence.
  - Keep machine-stable headings/anchors in English.
- Validation commands:
  - `rg -n "coherence|state|invariant|access_lost|stale" shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md shipglows_data/workflow/specs/shipglows-*.md shipglows_data/technical/*.md`
- Stop conditions / reroute:
  - Stop and keep `not ready` if any security-critical contract lacks owner or testable wording.
  - Reroute to targeted `/sf-spec <owning correction title>` when a blocker requires scope beyond wording alignment.

# Open Questions

None.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 16:03:25 UTC | sf-spec | GPT-5 Codex | Created canonical foundational coherence spec from existing foundational architecture and handoff intent. | draft saved | /sf-ready ShipGlows Foundational Coherence Review |
| 2026-05-10 16:17:31 UTC | sf-build | GPT-5 Codex | Added coherence matrix, state vocabulary, security controls, failure gates, shipglows_data links, and validation checks. | implemented | /sf-end ShipGlows Foundational Coherence Review |
| 2026-05-10 16:31:18 UTC | sf-ship | GPT-5 Codex | Quick ship for foundational coherence documentation scope. | shipped | /sf-end ShipGlows Foundational Coherence Review |
| 2026-05-10 16:38:48 UTC | sf-end | GPT-5 Codex | Closed documentation-only foundational coherence chantier after quick ship and bookkeeping updates. | closed | None |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Canonical coherence spec created in `shipglows_data/workflow/specs/shipglows-foundational-coherence-review.md`. |
| sf-ready | satisfied in sf-build | Structure, metadata, security, shipglows_data coherence, and freshness evidence checked after corrections. |
| sf-start | implemented | Coherence contract and shipglows_data navigation updates applied; no runtime code changed. |
| sf-verify | passed | Required sections, coherence anchors, shipglows_data cross-links, and implementation task completion validated with scoped checks. |
| sf-end | closed | Documentation-only coherence chantier closed after quick ship and bookkeeping updates. |
| sf-ship | shipped | Quick ship completed for the documentation-only coherence scope; formal closure remains pending. |
