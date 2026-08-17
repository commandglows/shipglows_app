---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-08-17"
updated: "2026-08-17"
status: locally_verified
source_skill: sg-development
scope: "legacy-value-recovery-wave-1"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu’utilisatrice de ShipGlows, je veux retrouver les comportements historiques encore utiles dans le runtime actif afin de gérer tous mes dépôts, mes préférences et mes éléments opérationnels sans réactiver ContentFlow."
linked_systems:
  - "app/lib/shipglows/"
  - "app/test/shipglows/"
  - "runner/src/"
  - "runner/test/"
  - "shipglows_data/technical/runtime-boundary.md"
  - "shipglows_data/technical/legacy-file-migration-tracker.md"
depends_on:
  - artifact: "shipglows_data/technical/runtime-boundary.md"
    artifact_version: "1.3.0"
    required_status: active
supersedes: []
evidence:
  - "Three parallel read-only audits on 2026-08-17 identified bounded recovery candidates for projects, preferences/diagnostics, and operational activity/review."
  - "The active GitHub repository API already exposes an opaque nextCursor while the Flutter provider currently consumes only the first page."
  - "ShipGlows already owns light and dark themes but the active app fixes ThemeMode.system."
  - "The active runner event contracts can support read-only activity/review projection without reviving legacy providers or endpoints."
next_step: "Manually exercise the three recovered surfaces before any separately authorized commit or push."
---

# ShipGlows Legacy Value Recovery — Wave 1

🟢 [shipglows_app] spec: ShipGlows Legacy Value Recovery Wave 1 | status: locally_verified | path: shipglows_data/workflow/specs/shipglows-legacy-value-recovery-wave-1.md | next: manually exercise the recovered surfaces before any publish decision

## Objective

Recover three proven product values into the single active ShipGlows runtime:

1. complete explicit GitHub repository discovery across opaque pages;
2. local theme preference and a safe, reusable error/diagnostic experience;
3. read-only recent activity and review guidance derived only from active runner contracts.

## Scope

### Included

- GitHub pagination, deduplication, bounded retry, loading and failure states;
- system/light/dark preference persisted locally through the active bootstrap;
- token-owned Settings primitives;
- controlled user messages, retry and strictly redacted copyable diagnostics;
- project-scoped recent activity and review items sourced from existing Cockpit, Conversations and Studio truth;
- navigation back to the canonical surface that owns any action;
- focused tests, active-suite verification and mapped technical documentation.

### Excluded

- legacy Clerk, FastAPI, OpenRouter, OAuth, integration endpoints or provider graph;
- raw exception, email, token, credential, local path or private payload disclosure;
- automatic repository import;
- persistent “no active project” mode;
- feedback, publishing pipeline, offline writes, content analytics or legacy screen restoration;
- new mutation authority from the activity/review surface;
- server start, external GitHub call, credential change, commit, push or deployment.

## Behavior Contract

### GitHub discovery

- Repository pages are requested only through opaque cursors returned by the runner.
- Results are deduplicated by opaque candidate identity while preserving stable display order.
- A page failure keeps already verified candidates visible and offers an explicit retry.
- Selection remains explicit; loading more pages never connects or imports a repository.
- Cursor loops and unbounded pagination fail safely.

### Preferences and safe errors

- Theme preference supports `system`, `light` and `dark`, persists locally and updates the app immediately.
- Invalid persisted values normalize to `system`.
- Shared settings components consume canonical ShipGlows tokens and preserve semantics, focus and text scaling.
- User-visible errors use controlled messages and stable local codes.
- Copyable diagnostics contain only allowlisted, bounded, non-sensitive fields; they never include email, bearer fragments, credentials, private URLs, repository paths or raw exception payloads.

### Activity and review

- Activity is project-scoped and derived only from normalized active runner data.
- Ordering and deduplication are deterministic across reconnect/reload.
- Review items are read-only summaries; their action navigates to Conversations or Studio, where existing authorization and confirmation remain authoritative.
- Missing, degraded or access-lost source truth remains visible and never fabricates healthy or actionable state.
- If existing active contracts cannot establish an item safely, it is omitted with an honest empty/degraded state rather than inferred from legacy data.

## Security And Reliability

- Preserve actor/project isolation and existing server authorization.
- Treat runner payloads, cursor values and exceptions as untrusted.
- Bound page count, item count, strings, retry and diagnostic size.
- Do not log or project installation IDs, repository IDs, tokens, emails or private paths.
- Do not introduce a fallback to legacy APIs or providers.
- Fail closed for malformed pagination, unknown events, missing ownership or lost access.

## Execution Batches

Parallel writes are authorized only for the following non-overlapping ownership. The root agent is the integration owner and owns all documentation, changelog, shared verification and conflict resolution.

### Batch A — GitHub repository pagination

Owned writes:

- `app/lib/shipglows/providers/managed_github_projects_provider.dart`
- project-picker portions of `app/lib/shipglows/presentation/screens/projects_screen.dart`
- new or existing focused Flutter tests under `app/test/shipglows/providers/` and `app/test/shipglows/presentation/projects/`

Forbidden writes: runner files, app root/theme/settings/diagnostics, Cockpit/activity files, documentation and changelog.

Proof: multi-page success, stable deduplication, cursor-loop bound, page retry, retained verified candidates, explicit selection only.

### Batch B — Preferences and safe errors

Owned writes:

- `app/lib/shipglows/app.dart`
- new active providers/widgets for local preferences, settings primitives and safe errors
- preference/error portions of active Settings and Diagnostics surfaces
- `app/lib/shipglows/presentation/screens/project_detail_screen.dart` only for replacing raw error display
- focused tests under new or existing ShipGlows preference/error test paths

Forbidden writes: project picker/provider, runner files, Cockpit/activity files, legacy modules, documentation and changelog.

Proof: persistence, immediate theme change, invalid-value fallback, token/semantics checks, retry, diagnostic allowlist and secret-pattern rejection.

### Batch C — Read-only activity and review

Owned writes:

- new runner activity/review contracts/routes/tests only when active event truth requires them
- activity/review additions to `app/lib/shipglows/data/managed_runner_api.dart`
- new activity/review models, providers and widgets under `app/lib/shipglows/`
- Cockpit integration and focused tests

Forbidden writes: project picker/provider, app root/theme/settings/diagnostics, legacy modules, documentation and changelog.

Proof: deterministic order, deduplication, project/actor isolation, degraded/access-lost behavior, read-only navigation, no new mutation endpoint.

### Integration Batch — root owner only

Owned writes: directly mapped technical docs, content/code maps, changelog, spec history and minimal integration corrections across batch seams.

Dependency order: A/B/C may write in parallel after this spec is ready; integration starts only after all three return control.

Proof: Flutter analyze, focused tests, full `test/shipglows`, runner typecheck/lint/focused tests when runner changed, runtime-boundary test, metadata lint, design-drift check and diff check.

## Acceptance Criteria

- [x] GitHub repositories beyond the first opaque page are discoverable without automatic import.
- [x] Pagination failures are recoverable without losing prior verified results.
- [x] Theme preference persists and applies system/light/dark correctly.
- [x] Active errors expose no raw exception or sensitive diagnostic field.
- [x] Activity/review uses only active normalized truth and remains read-only.
- [x] Project isolation, access-loss and malformed-input cases fail closed.
- [x] No active import reaches legacy providers, services or route graphs.
- [x] Focused and combined verification passes, with unrelated historical failures reported separately.

## Current Chantier Flow

| Stage | Status | Evidence | Next step |
| --- | --- | --- | --- |
| Audit | complete | Three independent legacy-value audits consolidated | Execute isolated batches |
| Spec | locally_verified | Scope, security boundaries, acceptance criteria and write batches defined | Keep as local implementation authority |
| Implementation | complete | All three isolated batches returned control without crossing ownership boundaries | Manual product exercise |
| Verification | complete | Focused batch proofs plus combined Flutter, runner, metadata, drift and diff gates | Report local result |
| Delivery | local_only | No commit or push authorized by the displayed plan | Obtain separate approval before publishing |

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-17 | sg-development | GPT-5 Codex | Consolidated three audits and prepared non-overlapping execution batches | ready | Execute batches A, B and C in parallel |
| 2026-08-17 | sg-development | GPT-5 Codex | Integrated pagination, preferences/safe errors, and read-only activity/review from three parallel batches | locally_verified | Manual product exercise before any publish decision |
