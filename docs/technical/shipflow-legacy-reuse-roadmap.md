---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-09"
updated: "2026-05-09"
status: draft
source_skill: sf-docs
scope: "legacy-reuse-roadmap"
owner: "Diane"
confidence: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/core/"
  - "lib/data/models/"
  - "lib/data/services/"
  - "lib/presentation/screens/"
  - "lib/providers/providers.dart"
  - "web_auth/"
depends_on:
  - "docs/technical/legacy-contentflow-inventory.md@0.1.0"
  - "docs/technical/markdown-source-of-truth.md@0.1.0"
  - "specs/shipflow-legacy-contentflow-fusion.md@0.3.0"
supersedes: []
evidence:
  - "Repo audit on 2026-05-09"
  - "User direction: keep auth, BYOK/OpenRouter, feedback and pipeline ideas, but do not activate stack decisions prematurely."
next_review: "2026-06-09"
next_step: "/sf-ready ShipFlow Project Source Onboarding"
---

# ShipFlow Legacy Reuse Roadmap

## Purpose

This roadmap turns the embedded ContentFlow code into ShipFlow decisions. It is not a deletion plan. It is a decision aid for choosing what to reuse, rewrite, park, or archive.

## Owned Files

- `docs/technical/shipflow-legacy-reuse-roadmap.md`
- `docs/technical/legacy-contentflow-inventory.md`
- Future specs created from this roadmap

## Entrypoints

- `lib/main.dart`
- `lib/shipflow/**`
- `lib/data/shipflow_sources/**`
- `lib/presentation/**`
- `lib/data/services/**`
- `lib/providers/providers.dart`

## Invariants

- Markdown/repo files stay the source of truth.
- The database, if introduced, is a projection/index/sync layer.
- Legacy code can inform product shape but cannot silently choose the stack.
- Auth, BYOK, feedback, terminal, agents, and server execution require dedicated specs.
- Pipeline code stays parked until the user asks to revisit it.

## Recommended Reuse Order

| Order | Brick | Recommendation | Why | First safe action |
| --- | --- | --- | --- | --- |
| 1 | Project/source onboarding | Adapt | User prioritized this and clarified project = GitHub repository + local clone + remote DB projection | Spec onboarding around GitHub owner/repo, required local clone, Markdown files, and remote projection status |
| 2 | Settings/preferences | Adapt | ShipFlow will need source paths, theme, language, BYOK and project settings | Split generic settings from ContentFlow content settings |
| 3 | Feedback text | Park for later | Useful but not urgent before real users exist | Revisit after project/source model exists |
| 4 | BYOK/OpenRouter | Keep concept, delay activation | Needed later, but secret handling is high risk | Spec BYOK storage and client/server boundaries before wiring |
| 5 | Auth/session | Keep concept, redesign | Multi-user is likely, provider is open | Spec auth identity model before provider choice |
| 6 | Offline/cache/sync | Keep concept, adapt later | Projection DB and Markdown write-back will need conflict rules | Spec sync model after source/write strategy is clear |
| 7 | FastAPI/API facade | Park | Useful only if local runner/terminal/agents need privileged execution | Spec local runner separately; do not use as hosted backend default |
| 8 | Pipeline/drip/content screens | Park | Potential future product direction, not current migration scope | Keep untouched until product scope reopens |
| 9 | Clerk web auth assets | Reference-only | Provider likely not final | Archive later if Firebase Auth or another provider wins |

## Brick Notes

### Feedback Text

Current files:

- `lib/data/models/feedback_entry.dart`
- `lib/data/services/feedback_local_store.dart`
- `lib/data/services/feedback_service.dart`
- `lib/presentation/screens/feedback/feedback_screen.dart`
- `lib/presentation/screens/feedback/feedback_admin_screen.dart`

Recommended direction:

- Keep the idea.
- Start with text-only user feedback.
- Keep local draft and local sent-history behavior.
- Do not keep audio feedback for V1.
- Do not require FastAPI as the backend decision.

Decision question:

- Should feedback first be only an in-app text box that writes to a future projection/backend, or should it also create a local Markdown issue/task in the user's repo?

### Settings And Preferences

Current useful files:

- `lib/core/app_language.dart`
- `lib/core/app_theme_preference.dart`
- `lib/core/shared_preferences_provider.dart`
- `lib/data/models/app_settings.dart`
- `lib/presentation/screens/settings/**`

Recommended direction:

- Keep theme/language/local preferences.
- Split settings into `ShipFlowAppSettings` later.
- Remove content-specific assumptions only when the replacement model exists.

Decision question:

- Should ShipFlow settings be per device first, per workspace first, or both with local defaults and cloud projection later?

### Project And Source Onboarding

Current useful files:

- `lib/data/models/project.dart`
- `lib/core/project_onboarding_validation.dart`
- `lib/presentation/screens/projects/projects_screen.dart`
- `lib/presentation/screens/onboarding/onboarding_screen.dart`
- `lib/presentation/widgets/project_picker_action.dart`

Recommended direction:

- Adapt the project concept into a ShipFlow GitHub repository model.
- Treat `owner/repo` and GitHub URL as canonical project identity.
- Treat local repo paths as required clones/working copies, not identity.
- Treat remote database rows as projection/sync/index, not identity or source of truth.
- Keep GitHub OAuth/repository discovery as future, while allowing manual GitHub URL onboarding first.

Decision question:

- Answered 2026-05-09: a ShipFlow project is necessarily a GitHub repository. It has a local clone and a remote database projection. Future workspaces may group repositories, but project and GitHub repo are not separate concepts.

### BYOK And OpenRouter

Current useful files:

- `lib/core/openrouter_guard.dart`
- `lib/data/models/ai_runtime.dart`
- `lib/data/models/openrouter_credential.dart`
- `test/core/byok_guard_test.dart`
- `test/core/ai_runtime_guard_test.dart`

Recommended direction:

- Keep the guard/model concept.
- Do not wire secrets into Flutter client storage until the security model is explicit.
- Prefer a design where provider keys are stored in user-controlled secure storage or a trusted backend/local runner, not in public client bundles.

Decision question:

- For BYOK, do we want keys to stay only on the user's machine, or is account-level encrypted storage acceptable later?

### Auth And Identity

Current reference files:

- `lib/data/models/auth_session.dart`
- `lib/data/models/app_access_state.dart`
- `lib/data/services/clerk_auth_service*`
- `lib/presentation/screens/auth/auth_screen.dart`
- `web_auth/**`

Recommended direction:

- Keep the session/access-state idea.
- Do not keep Clerk as a default decision.
- Firebase Auth remains a plausible candidate but needs a dedicated spec with current official docs.

Decision question:

- Is the first hosted ShipFlow account model "one user owns private repos" or "workspace/team with shared repos"?

### Offline, Cache, And Sync

Current reference files:

- `lib/data/models/offline_sync.dart`
- `lib/data/services/offline_storage_service.dart`
- offline tests in `test/core/offline_sync_test.dart`

Recommended direction:

- Keep the idea of cached reads and explicit sync status.
- Reframe it around Markdown source-of-truth and projection rebuilds.
- Delay write queue design until ShipFlow write-back rules are explicit.

Decision question:

- Do we need ShipFlow to edit Markdown from the UI soon, or is V1.5 still read/index/analyze only?

### FastAPI, Terminal, And Agent Runner

Current reference files:

- `lib/data/services/api_service.dart`
- ContentFlow FastAPI specs
- old API-dependent screens and providers

Recommended direction:

- Do not use FastAPI as the hosted product backend by default.
- Keep FastAPI as a candidate for a local privileged runner if the web UI must launch agents or terminal commands.
- Treat terminal/agent execution as high-risk security work.

Decision question:

- Should the future runner execute on the user's local machine, in a cloud worker, or both with explicit permission boundaries?

### Pipeline, Drip, And Content Workflow

Current reference files:

- `lib/presentation/screens/drip/**`
- `lib/data/models/drip_plan.dart`
- `lib/presentation/screens/feed/**`
- `lib/presentation/screens/editor/**`
- `lib/presentation/screens/angles/**`
- `lib/presentation/screens/seo/**`
- `lib/presentation/screens/newsletter/**`
- `lib/presentation/screens/research/**`
- `lib/presentation/screens/reels/**`

Recommended direction:

- Park untouched.
- Keep as source material for future content/indexing workflows.
- Do not rename or migrate now.

Decision question:

- Should ShipFlow eventually include content publishing workflows, or only observe and orchestrate external project workflows?

## Suggested Next Specs

1. `ShipFlow Feedback Text V1`
   - Lowest-risk feature reuse.
   - Clarifies whether feedback writes to Markdown, projection backend, or both.

2. `ShipFlow Project Source Model`
   - Defines project/workspace/repo/source hierarchy.
   - Unblocks onboarding and database projection shape.

3. `ShipFlow Auth And Workspace Model`
   - Separates identity model from provider choice.
   - Decides single-user versus workspace/team semantics.

4. `ShipFlow BYOK Security Model`
   - Defines key storage and runtime boundary.
   - Required before OpenRouter activation.

5. `ShipFlow Local Runner Architecture`
   - Decides whether FastAPI or another local service is needed for agents/terminal.

## Reader Checklist

- Is the brick being reused as a concept or as implementation?
- Does reuse accidentally adopt Clerk, FastAPI, Supabase, or OpenRouter as active stack?
- Does the proposed feature preserve Markdown source-of-truth?
- Does the feature touch auth, secrets, terminal, agents, or user data?

## Maintenance Rule

When the user answers a decision question, update this roadmap and either create a focused spec or mark the brick as parked.
