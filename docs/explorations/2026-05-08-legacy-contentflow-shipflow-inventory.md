---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-08"
updated: "2026-05-08"
status: draft
source_skill: sf-explore
scope: "Legacy ContentFlow inventory and ShipFlow reuse decisions"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/main.dart"
  - "lib/shipflow/"
  - "lib/presentation/"
  - "lib/providers/providers.dart"
  - "lib/data/services/api_service.dart"
  - "lib/data/shipflow_sources/"
  - "web_auth/"
  - "scripts/"
  - "specs/"
  - "TASKS.md"
  - "CLAUDE.md"
  - "AGENT.md"
evidence:
  - "README.md presents ShipFlow Operations Dashboard as local-first, read-only, no auth, no backend."
  - "pubspec.yaml package name is shipflow_app."
  - "lib/main.dart defaults APP_TARGET to shipflow but still exposes legacy/contentflow runtime target."
  - "lib/shipflow/ contains the current ShipFlow dashboard runtime."
  - "lib/presentation/, lib/providers/providers.dart and lib/data/services/api_service.dart contain the legacy ContentFlow product app."
  - "CLAUDE.md, AGENT.md, TASKS.md and most specs still describe ContentFlow, Clerk, FastAPI, feedback, OpenRouter and content pipeline work."
depends_on: []
supersedes: []
next_step: "/sf-spec Purge and adapt legacy ContentFlow scope for ShipFlow"
---

# Exploration Report: Legacy ContentFlow -> ShipFlow Inventory

## Starting Question

ShipFlow was split or migrated from a ContentFlow Flutter codebase. The current
main branch launches ShipFlow by default, but a large ContentFlow runtime remains.
Before deleting anything, decide which bricks should be kept, renamed, archived,
transferred back to ContentFlow, or deleted later.

## Context Read

- `README.md` - ShipFlow is documented as local-first, read-only, no auth, no cloud sync, no backend.
- `pubspec.yaml` - package is `shipflow_app`.
- `lib/main.dart` - default target is ShipFlow, but `APP_TARGET=legacy|contentflow` still exists.
- `lib/shipflow/` - current dashboard app: overview, project detail, diagnostics, settings.
- `lib/data/shipflow_sources/` - current source reader/parser boundary for Markdown and ledgers.
- `lib/domain/project_health/` - current health/posture model.
- `lib/router.dart`, `lib/providers/providers.dart`, `lib/data/services/api_service.dart` - legacy ContentFlow app runtime.
- `web_auth/`, `scripts/validate-clerk-runtime.sh`, `scripts/install-web-auth.sh` - Clerk web runtime.
- `TASKS.md`, `CLAUDE.md`, `AGENT.md`, `specs/` - mostly legacy ContentFlow tracking and specs.

## Internet Research

None. This pass is repo-local. Future stack decisions may need fresh official docs
for Firebase/Firestore, FastAPI, hosting and database options.

## Problem Framing

The repo is not just dirty; it contains two product scopes:

```text
shipflow_app
  |
  +-- Current default runtime
  |     lib/shipflow/
  |     lib/data/shipflow_sources/
  |     lib/domain/project_health/
  |
  +-- Legacy embedded runtime
        lib/presentation/
        lib/providers/providers.dart
        lib/data/services/api_service.dart
        web_auth/
        ContentFlow specs/docs/tasks
```

Deleting the legacy runtime now is risky because some bricks are likely useful
for ShipFlow V2: auth, BYOK/OpenRouter, feedback, project models, settings,
offline/cache, UI widgets, and maybe parts of the content pipeline later.

The immediate goal should be inventory and decision-making, not purge.

## Brick Inventory

| Brick | Current origin | Possible ShipFlow value | Initial bucket |
|---|---|---|---|
| `lib/shipflow/` dashboard | ShipFlow | Core runtime | Keep |
| `lib/data/shipflow_sources/` | ShipFlow | Markdown/ledger database reader | Keep |
| `lib/domain/project_health/` | ShipFlow | Project posture and next command logic | Keep |
| `lib/main.dart` target switch | Migration bridge | Useful short-term, harmful long-term | Decide |
| `lib/presentation/theme/` | Shared/legacy | Theme may be reusable | Rename/adapt |
| `lib/presentation/widgets/app_error_view.dart` | Shared/legacy | Useful diagnostic UI primitive | Rename/adapt |
| `lib/presentation/widgets/skeleton_loader.dart` | Shared/legacy | Generic loading UI | Rename/adapt |
| `lib/core/app_diagnostics.dart` | Shared/legacy | Useful if renamed away from ContentFlow copy | Rename/adapt |
| `lib/core/app_language.dart` | Shared/legacy | Useful if i18n remains needed | Decide |
| `lib/core/app_theme_preference.dart` | Shared/legacy | Useful if user settings remain | Decide |
| `lib/data/models/project.dart` | ContentFlow | Useful concept, but content-centric | Rename/adapt |
| `lib/data/models/app_settings.dart` | ContentFlow | Useful settings shape, contains AI/GitHub/content assumptions | Split/adapt |
| `lib/data/models/auth_session.dart` | ContentFlow | ShipFlow will need auth eventually | Keep as concept, redesign |
| `lib/data/services/offline_storage_service.dart` | ContentFlow | Useful queue/cache primitives | Keep as concept, adapt later |
| `lib/data/services/feedback_service.dart` | ContentFlow | User feedback is desired for ShipFlow too | Keep as concept, adapt later |
| `lib/data/services/notification_service.dart` | ContentFlow | FCM scaffold may be useful later | Archive/adapt |
| `lib/core/openrouter_guard.dart` | ContentFlow | BYOK/OpenRouter desired for ShipFlow too | Keep concept, decouple from ApiService |
| `lib/data/models/openrouter_credential.dart` | ContentFlow | Useful for BYOK | Keep/adapt |
| `lib/data/models/ai_runtime.dart` | ContentFlow | Useful for BYOK/platform mode decisions | Keep/adapt |
| `lib/data/services/api_service.dart` | ContentFlow/FastAPI | Huge facade; some contracts useful, implementation uncertain | Archive or split |
| `lib/providers/providers.dart` | ContentFlow | Some state patterns useful, too much product coupling | Archive or split |
| `lib/router.dart` | ContentFlow | Route structure not ShipFlow-native | Archive |
| `lib/presentation/screens/auth/` | ContentFlow/Clerk | Auth needed, Clerk choice undecided | Keep as reference only |
| `web_auth/` | ContentFlow/Clerk | Only useful if Clerk remains; likely not | Archive pending decision |
| `lib/presentation/screens/feedback/` | ContentFlow | Feedback desired, current implementation backend-coupled | Keep as reference |
| `lib/presentation/screens/settings/` | ContentFlow | Settings/integrations concepts useful | Split/adapt |
| `lib/presentation/screens/projects/` | ContentFlow | Project management likely useful | Adapt carefully |
| `lib/presentation/screens/onboarding/` | ContentFlow | ShipFlow may need project/source onboarding | Adapt carefully |
| `feed/editor/history/calendar` | ContentFlow | Maybe useful if ShipFlow manages indexed content | Park |
| `angles/personas/ritual/seo/newsletter/research/reels` | ContentFlow | Mostly ContentFlow product pipeline | Park / transfer |
| `drip` | ContentFlow | Could become ShipFlow content publishing later | Park |
| `activity/runs/templates/analytics/performance/uptime/work_domains` | ContentFlow/System | Some operational dashboard ideas may fit ShipFlow | Review one by one |
| `specs/*contentflow*` and FastAPI specs | ContentFlow | Not ShipFlow source of truth | Transfer/archive |
| `TASKS.md`, `CLAUDE.md`, `AGENT.md` | ContentFlow | Actively misleading for ShipFlow | Rewrite for ShipFlow |

## Option Space

### Option A: Hard purge now

- Summary: Delete all legacy ContentFlow runtime and docs now.
- Pros: Small, clean ShipFlow repo quickly.
- Cons: High risk of losing reusable auth, feedback, BYOK, settings, project and offline code.
- Verdict: Not recommended.

### Option B: Keep everything and only rename visible copy

- Summary: Leave legacy runtime in place; rename ContentFlow strings opportunistically.
- Pros: Lowest immediate code risk.
- Cons: Keeps architecture confusion, stale tests, stale docs and misleading decisions.
- Verdict: Not enough.

### Option C: Inventory-first staged extraction

- Summary: Keep main stable, create an explicit inventory/spec, then move bricks through
  buckets: keep, adapt, archive, transfer, delete.
- Pros: Minimizes recoding risk while removing confusion deliberately.
- Cons: Requires discipline and a spec-first cleanup plan.
- Verdict: Recommended.

## Emerging Recommendation

Use a staged cleanup/spec:

1. Freeze the current ShipFlow runtime boundary:
   - `lib/shipflow/`
   - `lib/data/shipflow_sources/`
   - `lib/domain/project_health/`
2. Decide target product capabilities before deleting legacy:
   - auth yes/no now
   - BYOK/OpenRouter yes/no now
   - feedback yes/no now
   - project/source onboarding yes/no now
   - database/indexing stack undecided
3. Rewrite project guidance files first:
   - `CLAUDE.md`
   - `AGENT.md`
   - `TASKS.md`
   - README sections that still mention ContentFlow deployment
4. Split legacy runtime into:
   - reusable shared primitives
   - ShipFlow future features
   - archived ContentFlow-only code
5. Only delete after each module has an explicit bucket and retest path.

## User Direction Captured

Current answers from Diane:

- Product target: multi-user eventually, not only a personal local cockpit.
- Source of truth: Markdown/repository files should remain authoritative.
- Database role: projection/index/sync layer, not the canonical source.
- Write path: if the app changes product state that belongs in the user's project, it should edit the Markdown/repo files rather than create a conflicting database truth.
- Likely stack: Firebase/Firestore is plausible because it avoids idle shutdown and server maintenance, but the decision is not final.
- FastAPI: undecided. It may be useful for local tooling, terminal/agent orchestration, or privileged operations, but it should not be assumed as the hosted product backend without a clearer reason.
- Auth provider: still open; Firebase Auth currently sounds like the strongest candidate, not a final decision.
- BYOK/OpenRouter: needed later, not V1 cleanup.
- Feedback: keep the need, but start text-only.
- Legacy ContentFlow: goal is a potable migration/fusion between the two projects, refined over time, not a destructive purge.
- Runtime boundary: `APP_TARGET=legacy/contentflow` needs explanation before deciding.

## Direction Questions

These questions should drive the next spec. They are intentionally concrete.

### Product Identity

1. Is ShipFlow a local operator cockpit only, or will it become a hosted user product?
2. Is the target user only you, or other users too?
3. Should ShipFlow remain desktop-first, or is web/mobile important soon?
4. Should the app manage one operator workspace, or multiple user workspaces?

### Data Model

5. Are Markdown files the source of truth long-term, or only an import source?
6. Should the future database be a cache/index of Markdown, or become authoritative?
7. If database and Markdown disagree, which one wins?
8. Do we need write-back from app to Markdown trackers eventually?
9. Which entities are real ShipFlow entities: projects, tasks, specs, audit events, operations, dependencies, content items, users, workspaces?
10. Should project identity be path-based, repo-based, slug-based, or database-id-based?

### Stack

11. Do we prefer Firebase/Firestore because it avoids idle shutdown and server maintenance?
12. Is a no-card/free-tier constraint mandatory for the first hosted version?
13. Is FastAPI still acceptable for local/dev tooling, or should it be excluded from ShipFlow?
14. Do we want a server later for secrets/jobs, or must V1 avoid any server runtime?
15. Should Vercel remain part of the plan, or is Firebase Hosting more likely?

### Auth

16. Which auth provider is preferred now: Firebase Auth, Clerk, Auth0, custom, none yet?
17. Does ShipFlow auth need Google login only, email/password, GitHub, or all three?
18. Are there admin/operator roles, or just authenticated users?
19. Should auth be required for local desktop, hosted web, or both?
20. Do we need account deletion/export from the start?

### BYOK / OpenRouter

21. Is OpenRouter BYOK needed for ShipFlow V1 or later?
22. Should BYOK keys be stored server-side only, or can local desktop store them locally?
23. If hosted web has no server in V1, should BYOK be disabled there?
24. Do we need multiple AI providers or only OpenRouter?
25. Should AI jobs be synchronous client-triggered actions or queued server jobs?

### Feedback

26. Is feedback for users of ShipFlow, or operator notes for yourself?
27. Should feedback be text-only first, or audio too?
28. Should anonymous feedback exist, or authenticated-only?
29. Who can see feedback admin screens?
30. Is feedback a core ShipFlow feature or just support tooling?

### Legacy Content Pipeline

31. Should feed/editor/history/calendar survive as future indexed content views?
32. Are personas, ritual, angles, SEO, newsletter and reels definitely ContentFlow-only?
33. Could drip/publishing become relevant to ShipFlow, or should it be transferred out?
34. Do activity/runs/templates/performance/uptime have ShipFlow equivalents?
35. Should we archive ContentFlow pipeline code in-repo or move it to a separate repo?

### Runtime Boundary

36. Should `APP_TARGET=legacy/contentflow` be removed eventually?
37. Until then, should legacy be hidden from builds but kept in code?
38. Should tests for legacy continue running, or be moved to an archive suite?
39. Should the build output include `web_auth/` at all?
40. Should README document only ShipFlow, or also mention archived legacy mode?

### Security / Operations

41. Are source files trusted local inputs, or should they always be treated as hostile/untrusted?
42. Should recommended commands ever be executable from UI, or copy-only forever?
43. Do we need audit logs for UI actions?
44. Should sensitive paths and env names be redacted everywhere?
45. What is the acceptable failure mode: block, degraded mode, or stale cached data?

## Non-Decisions

- No code deletion.
- No migration to Firebase/Firestore yet.
- No decision to keep or remove FastAPI.
- No decision to keep or remove Clerk.
- No decision to keep or remove Vercel.
- No decision to delete ContentFlow pipeline screens.

## Rejected Paths

- Immediate hard purge - too much risk of losing reusable code.
- Blind rename of all ContentFlow strings - would hide architecture debt without clarifying runtime.
- Reusing the archived Supabase WIP as ShipFlow direction - it mostly reflects a ContentFlow migration path.

## Risks And Unknowns

- The current guidance files actively mislead future work because they describe ContentFlow as the project.
- Keeping the legacy target too long may continue to pollute tests and dependency decisions.
- Removing legacy too early may force recoding auth, BYOK, feedback, settings and project-management pieces.
- Stack decisions are unresolved: database/indexing, auth provider, hosted runtime, server trust boundary.
- The local Markdown database model needs a clear source-of-truth contract before any hosted sync.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: none
- Redactions applied: none
- Notes: The report summarizes code structure and product decisions only.

## Decision Inputs For Spec

- User story seed: As the ShipFlow operator, I want the repo separated into current ShipFlow runtime, reusable future ShipFlow bricks, archived ContentFlow code, and transferred/deleted legacy pieces, so future work can proceed without losing useful code or following stale ContentFlow assumptions.
- Scope in seed: inventory, bucket assignment, guidance doc rewrite, build/runtime boundary, tests boundary, no code deletion without explicit module decision.
- Scope out seed: Firebase implementation, auth implementation, database migration, pipeline feature work, ContentFlow transfer mechanics unless explicitly selected.
- Invariants/constraints seed:
  - Do not delete legacy modules until classified.
  - ShipFlow default runtime must remain working.
  - README/CLAUDE/AGENT/TASKS must not describe ContentFlow as the active project.
  - Secrets must not move into Flutter public code.
  - Markdown/ledger reads remain allowlisted and read-only unless a later spec changes this.
- Validation seed:
  - `flutter test test/widget_test.dart`
  - targeted ShipFlow source/parser tests
  - `rg` checks for active ContentFlow references after each staged cleanup
  - manual launch of ShipFlow dashboard

## Handoff

- Recommended next command: `/sf-spec Purge and adapt legacy ContentFlow scope for ShipFlow`
- Why this next step: The work crosses docs, runtime, tests, scripts and product decisions; it should not be executed as a casual cleanup.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-05-08 | Inventory legacy ContentFlow before deleting anything | Read runtime, docs, routes, services, models and specs; classified reusable bricks and decision questions | Staged extraction recommended | Answer direction questions, then create spec |
