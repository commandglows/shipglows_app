---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-09"
created_at: "2026-05-09 13:00:00 UTC"
updated: "2026-05-09"
updated_at: "2026-05-09 16:44:03 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "firebase-firestore-projection-migration"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux traduire le WIP Supabase retrouve en architecture Firebase/Firestore, afin de garder les contrats utiles sans adopter Supabase comme stack cible."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "backup/local-supabase-wip-2026-05-08"
  - "shipflow_data/workflow/specs/full-supabase-migration.md"
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions for Firebase"
  - "GitHub repositories"
  - "local clones"
  - "Markdown source of truth"
depends_on:
  - artifact: "shipflow_data/technical/recovered-branch-reality.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/shipflow-project-source-onboarding.md"
    artifact_version: "0.3.0"
    required_status: "ready"
  - artifact: "shipflow_data/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "https://firebase.google.com/shipflow_data/flutter/setup"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/auth/flutter/start"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/firestore"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/firestore/security/get-started"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
  - artifact: "https://firebase.google.com/shipflow_data/functions"
    artifact_version: "checked-2026-05-09"
    required_status: "active"
supersedes:
  - "backup/local-supabase-wip-2026-05-08:shipflow_data/workflow/specs/full-supabase-migration.md as implementation target"
evidence:
  - "User decision 2026-05-09: translate Supabase WIP into Firebase/Firestore."
  - "User decision 2026-05-09: project = GitHub repository + local clone + remote database projection."
  - "User decision 2026-05-09: clone is mandatory, internal, managed by ShipFlow infrastructure, and V1 is read-only."
  - "backup/local-supabase-wip-2026-05-08 contains Supabase Auth, data, Edge Functions, SQL migrations, and tests."
  - "Supabase is rejected as target because of inactivity policy concerns."
next_step: "/sf-start Firebase Firestore projection migration"
---
# Spec: Firebase Firestore Projection Migration
🟢 [shipflow_app] spec: Firebase Firestore Projection Migration | status: ready | path: shipflow_data/workflow/specs/firebase-firestore-projection-migration.md | next: /sf-start Firebase Firestore projection migration

# Title

Firebase Firestore Projection Migration

# Status

Ready for implementation planning. This spec is a translation contract, not a direct code migration. It preserves the useful Supabase WIP decisions and maps them to Firebase/Firestore while keeping GitHub repository + managed clone + Markdown as source of truth.

# User Story

En tant que fondatrice de ShipFlow, je veux traduire le WIP Supabase retrouve en architecture Firebase/Firestore, afin de garder les contrats utiles sans adopter Supabase comme stack cible.

# Minimal Behavior Contract

The migration accepts the Supabase WIP as design evidence, extracts contracts for auth, project ownership, GitHub integration, projection data, offline sync, security rules, and privileged server actions, then rewrites them as a Firebase/Firebase Auth/Cloud Firestore/Cloud Functions architecture. It must not merge Supabase code, add Supabase dependencies, or make Firestore canonical. If a Supabase contract cannot be safely expressed in Firebase without a new product/security decision, the contract is parked with a named blocker. The easy edge case to miss is recreating Supabase's relational/RLS model directly in Firestore without adapting it to document paths, security rules, and GitHub repository identity.

# Success Behavior

- Given the Supabase WIP branch, the spec identifies which contracts are reusable and which implementation files are not.
- Given a ShipFlow project, the canonical identity is GitHub `owner/repo`.
- Given a project has a managed clone, Markdown/repo files remain the read/index source of truth for V1.
- Given Firestore exists, it stores projection/index/sync documents derived from GitHub/Markdown state.
- Given a user signs in, Firebase Auth provides identity for project access and Firestore rules.
- Given a privileged GitHub/OpenRouter/agent/terminal operation is needed, Cloud Functions or another trusted runner owns secrets and server-side access.
- Given offline state exists, local cache/queue records are scoped by Firebase UID and GitHub repo identity.

# Error Behavior

- If Firebase shipflow_data or SDK behavior differ from assumptions, implementation stops and updates this spec.
- If Firestore security rules cannot express a permission boundary, the feature is not shipped.
- If a project has a Firestore row but no GitHub repo identity, it is invalid.
- If a managed clone and GitHub URL disagree, the UI blocks sync/indexing and reports a diagnostic.
- If queued writes belong to a different Firebase UID or GitHub repo, replay is paused.
- If Cloud Functions are missing for a secret-bearing action, the UI fails closed.

# Problem

The recovered local branch contains a serious Supabase migration effort, but Supabase is no longer the desired platform. The current `origin/main` is the sane base but lacks the recovered remote database/auth work. Without a translation spec, future implementation could either lose valuable contracts or accidentally reintroduce Supabase under pressure.

# Solution

Create a Firebase-native target architecture:

- Firebase Auth for identity.
- Cloud Firestore for remote projection/index/sync.
- Cloud Functions for privileged GitHub, BYOK, agent, terminal, and secret-bearing operations.
- Managed cloud-side clone as working copy for Markdown read/index now and future write-back.
- GitHub repository identity as canonical project key.

Mine `backup/local-supabase-wip-2026-05-08` for behavior contracts, not code to merge.

# Scope In

- Translate Supabase Auth contract to Firebase Auth.
- Translate Supabase SQL/RLS ownership intent to Firestore document paths and security rules.
- Translate Supabase Edge Function boundaries to Cloud Functions boundaries.
- Translate GitHub integration contracts to Firebase-compatible trusted function contracts.
- Translate offline queue/user mismatch rules to Firebase UID + GitHub repo scoping.
- Define Firestore projection collections at contract level.
- Identify Supabase WIP tests/acceptance criteria worth rewriting.
- Update shipflow_data to record translation decisions.

# Scope Out

- Implementing Firebase packages in this run.
- Creating a Firebase project from CLI.
- Writing Firestore security rules.
- Deploying Cloud Functions.
- Migrating Supabase code directly.
- Reintroducing Supabase dependencies.
- Implementing full GitHub OAuth or clone orchestration in this spec.
- Implementing terminal/agent runner.

# Constraints

- Firestore is a projection/index/sync layer, not canonical source of truth.
- GitHub repository identity is canonical for projects.
- Managed clone is required for Markdown read/index workflows and future write-back.
- Firebase service account credentials are server-only.
- Client Flutter code must not hold GitHub tokens, OpenRouter keys, service credentials, or privileged terminal/agent capabilities.
- Security rules must be designed before any real data is written.
- Cloud Functions must verify Firebase Auth identity and project/repo authorization before secret or GitHub actions.
- Supabase WIP remains archive evidence and must not be merged.

# Dependencies

- Official Firebase Flutter setup shipflow_data checked 2026-05-09: `https://firebase.google.com/shipflow_data/flutter/setup`.
- Official Firebase Auth Flutter shipflow_data checked 2026-05-09: `https://firebase.google.com/shipflow_data/auth/flutter/start`.
- Official Cloud Firestore shipflow_data checked 2026-05-09: `https://firebase.google.com/shipflow_data/firestore`.
- Official Firestore Security Rules shipflow_data checked 2026-05-09: `https://firebase.google.com/shipflow_data/firestore/security/get-started`.
- Official Cloud Functions for Firebase shipflow_data checked 2026-05-09: `https://firebase.google.com/shipflow_data/functions`.
- Local evidence: `backup/local-supabase-wip-2026-05-08:shipflow_data/workflow/specs/full-supabase-migration.md`.
- Local evidence: `backup/local-supabase-wip-2026-05-08:supabase/migrations/*.sql`.
- Local evidence: `backup/local-supabase-wip-2026-05-08:lib/data/services/supabase_*`.

# Invariants

- No Supabase dependency is added to `origin/main`.
- No Firestore document becomes more authoritative than GitHub/Markdown.
- Firestore project documents must include GitHub `owner`, `repo`, `fullName`, `htmlUrl`, and projection status.
- Local clone metadata must be linked to GitHub repo identity.
- Offline queues are scoped by Firebase UID and GitHub full name.
- Secret-bearing features are server-side only.

# Links & Consequences

- `shipflow_data/workflow/specs/shipflow-project-source-onboarding.md` becomes the immediate feature spec that consumes this architecture.
- `shipflow_data/technical/recovered-branch-reality.md` remains the durable memory for branch and WIP context.
- `shipflow_data/technical/markdown-source-of-truth.md` must mention Firestore as projection once implementation starts.
- Future Firebase implementation must update `pubspec.yaml`, app init, auth/session providers, projection repositories, and shipflow_data.
- Supabase WIP tests should be rewritten as Firebase contract tests rather than ported blindly.

# Documentation Coherence

- Add this spec to `shipflow_data/editorial/content-map.md`.
- Add this spec to `shipflow_data/technical/code-docs-map.md`.
- Keep `shipflow_data/technical/recovered-branch-reality.md` as source for branch reality.
- Future implementation shipflow_data must distinguish `GitHub canonical`, `local clone working copy`, and `Firestore projection`.
- README should not claim Firebase is implemented until code exists.

# Edge Cases

- Private GitHub repo requires auth before clone or projection.
- User disconnects GitHub but Firestore projection remains.
- Local clone remote URL does not match Firestore GitHub identity.
- Firestore projection is stale after local Markdown edits.
- Multiple users access one repo through workspace/team semantics.
- Offline queue created by user A is visible after user B signs in.
- Cloud Function succeeds on GitHub but Firestore projection update fails.
- Firestore security rules permit list/read broader than intended.
- Firebase free-tier or quota limits block expected sync behavior.

# Implementation Tasks

1. Create a Supabase-to-Firebase contract extraction document under `shipflow_data/technical/`.
2. Map Supabase tables to Firestore collections/documents at contract level.
3. Map Supabase RLS rules to Firestore security rule requirements.
4. Map Supabase Edge Functions to Cloud Functions contracts.
5. Map Supabase auth/session/offline acceptance criteria to Firebase Auth + Firestore rules.
6. Update `shipflow_data/technical/recovered-branch-reality.md` with recovered contract checklist.
7. Update `shipflow_data/workflow/specs/shipflow-project-source-onboarding.md` to consume Firebase/Firestore architecture.
8. Run doc validation searches and no code tests unless code changes are introduced.

# Acceptance Criteria

- There is a durable Firebase/Firestore translation contract.
- The contract explicitly names which Supabase WIP pieces are reusable.
- The contract explicitly forbids direct Supabase merge.
- Project identity remains GitHub repo + local clone.
- Firestore is documented only as projection/sync/index.
- Security boundaries for Auth, Firestore rules, and Cloud Functions are explicit.
- Future implementation has clear file and doc targets.

# Test Strategy

- Documentation validation:
  - `rg -n "Supabase|Firebase|Firestore|Cloud Functions|GitHub repository|local clone" shipflow_data/workflow/specs shipflow_data/technical README.md`
  - `rg -n "recovered-branch-reality|firebase-firestore-projection-migration" shipflow_data/editorial/content-map.md shipflow_data/technical shipflow_data/workflow/specs`
- No Flutter tests are required for this spec-only slice unless code changes occur.
- Future implementation must run `flutter analyze` and `flutter test`.

# Risks

- High security risk if Firestore rules are under-specified.
- High data risk if Firestore becomes canonical by accident.
- Medium risk that Firestore's document model needs a different shape than the Supabase SQL tables.
- Medium risk that Cloud Functions still introduce maintenance or cost complexity.
- Medium risk that Firebase quota/pricing assumptions need fresh review before production.

# Execution Notes

- Execution mode: main-only spec/documentation slice.
- Fresh external shipflow_data checked from official Firebase shipflow_data on 2026-05-09.
- Do not implement Firebase code until this spec's extraction document exists and the project onboarding spec is aligned.
- Use `origin/main` as base.
- Treat `backup/local-supabase-wip-2026-05-08` as archive evidence.

# Open Questions

None for the translation/spec slice. Cost/quota and exact Firebase project provisioning remain future implementation decisions.

# Skill Run History

| Timestamp UTC | Skill | Model | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-09 13:00:00 UTC | sf-spec | GPT-5 Codex | ready | Created Firebase/Firestore translation spec from recovered Supabase WIP and user direction. |
| 2026-05-09 13:00:00 UTC | sf-ready | GPT-5 Codex | ready | Scope is documentation/contract extraction only; implementation choices are bounded. |
| 2026-05-09 13:00:00 UTC | sf-start | GPT-5 Codex | implemented | Added `shipflow_data/technical/supabase-to-firebase-contract-map.md`. |
| 2026-05-09 13:00:00 UTC | sf-verify | GPT-5 Codex | verified | Documentation references resolve; no Supabase dependency exists in active `pubspec.yaml`, `lib`, or `test`. |
| 2026-05-09 13:00:00 UTC | sf-build | GPT-5 Codex | partial | Spec and extraction doc created; code implementation not started by design. |
| 2026-05-09 16:44:03 UTC | sf-docs | GPT-5 Codex | partial | Added foundational architecture decisions: GitHub project identity, managed clone, Firestore projection, read-only V1, GitHub-wins conflicts. |

# Current Chantier Flow

| Step | Status | Notes |
| --- | --- | --- |
| sf-spec | done | Spec created in `shipflow_data/workflow/specs/firebase-firestore-projection-migration.md`. |
| sf-ready | ready | Ready for documentation extraction slice. |
| governance corpus gate | already existed | `shipflow_data/technical/`, `shipflow_data/technical/code-docs-map.md`, and `shipflow_data/editorial/content-map.md` exist. |
| sf-start | implemented | Extraction doc created in `shipflow_data/technical/supabase-to-firebase-contract-map.md`. |
| sf-verify | verified | Documentation validation passed; active code has no Supabase dependency. |
| sf-end | pending | Blocked by unrelated broader dirty worktree and no requested closure/commit scope. |
| sf-ship | pending | Blocked by unrelated broader dirty worktree and no requested staging scope. |
