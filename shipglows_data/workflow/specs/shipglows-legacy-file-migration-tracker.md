---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "shipglows_app"
created: "2026-05-10"
created_at: "2026-05-10 10:22:56 UTC"
updated: "2026-08-11"
updated_at: "2026-08-11 19:57:13 UTC"
status: superseded
source_skill: 300-sg-docs
source_model: "GPT-5 Codex"
scope: "legacy-file-migration-tracker"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipGlows, je veux un suivi explicite des anciens fichiers a garder, adapter, deplacer en legacy ou supprimer plus tard, afin que la migration ContentFlow vers ShipGlows reste lisible et reversible."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "shipglows_data/technical/legacy-contentflow-inventory.md"
  - "shipglows_data/technical/runtime-boundary.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/editorial/content-map.md"
  - "shipglows_data/workflow/TASKS.md"
  - "shipglows_data/workflow/specs/"
  - "lib/"
  - "web_auth/"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md"
    artifact_version: "0.4.0"
    required_status: "in_progress"
  - artifact: "shipglows_data/technical/legacy-contentflow-inventory.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/runtime-boundary.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/code-docs-map.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/editorial/content-map.md"
    artifact_version: "0.1.0"
    required_status: "draft"
supersedes: []
superseded_by: "shipglows_data/technical/runtime-boundary.md"
evidence:
  - "User asked 2026-05-10 whether shipglows_data/workflow/specs track old files that should be moved to legacy or deleted, because otherwise old and new files will become confusing."
  - "shipglows_data/technical/legacy-contentflow-inventory.md classifies legacy areas but does not yet track current path, target path, migration status, decision source, and validation per file or area."
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md requires classification before deletion and blocks destructive cleanup when risk or product value is unclear."
  - "shipglows_data/editorial/content-map.md points to legacy-contentflow-inventory.md as canonical classification source."
next_step: "Superseded by the single-runtime boundary; retain only as historical cleanup evidence."
---
# Spec: ShipGlows Legacy File Migration Tracker
⚪ [shipglows_app] spec: ShipGlows Legacy File Migration Tracker | status: superseded | path: shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md | next: consult runtime-boundary.md

# Title

ShipGlows Legacy File Migration Tracker

# Status

Superseded on 2026-08-11. This document remains historical cleanup evidence only: ShipGlows has one product runtime and dormant modules are not a compatibility surface.

# User Story

En tant que fondatrice de ShipGlows, je veux un suivi explicite des anciens fichiers a garder, adapter, deplacer en legacy ou supprimer plus tard, afin que la migration ContentFlow vers ShipGlows reste lisible et reversible.

# Minimal Behavior Contract

This historical contract preserves the safe-cleanup rule: no dormant module may be moved or deleted without a current owner spec and import/behavior proof. It must not be used to restore an alternate application runtime.

# Success Behavior

- Given the current legacy inventory exists, when the tracker is created, then every currently known legacy area and legacy spec has a migration tracking row or an explicit grouping row with a clear expansion rule.
- Given a file is marked `move-to-legacy`, `archive-later`, or `delete-later`, when an agent reads the tracker, then the row names the target path or deletion condition, the decision source, risk, validation command, and required approval/spec before mutation.
- Given a file is security-sensitive, auth-related, secret-related, backend-related, runner-related, BYOK-related, or pipeline-related, when it appears in the tracker, then it cannot be marked directly deletable without a ready spec or explicit user decision.
- Given active ShipGlows files exist, when the tracker is built, then they are either excluded from legacy migration or marked `active-keep` so they cannot be moved by cleanup work.
- Given a future cleanup PR moves, archives, or deletes files, when shipglows_data are reviewed, then `legacy-contentflow-inventory.md`, the tracker, `shipglows_data/editorial/content-map.md`, and `code-docs-map.md` show the same ownership and status.
- Given a row remains ambiguous, when the tracker is reviewed, then it uses `needs-decision` with a concrete decision question instead of hiding the ambiguity.

# Error Behavior

- If a path no longer exists, the tracker marks it `already-removed` or `not-found` with evidence instead of silently dropping it.
- If a proposed target path would mix active ShipGlows runtime with legacy archive content, the tracker blocks the move and requires a safer target path.
- If a row lacks a decision source, validation command, or risk classification, readiness fails and no migration is allowed for that row.
- If a future cleanup attempts to delete or move auth, BYOK, feedback, pipeline, API, provider graph, web auth, or user-data code without a ready owner spec, the action is blocked and recorded as `blocked-needs-spec`.
- If a shipglows_data update says a file is archived but the file still exists in the active path, the tracker must show that mismatch and keep the next action explicit.
- No implementation may use this tracker to bypass git history, remove user changes, delete secrets evidence without redaction review, or make ContentFlow decisions look like active ShipGlows product contracts.

# Problem

The current migration/fusion shipglows_data prevent destructive cleanup, but the tracking is still too coarse. `shipglows_data/technical/legacy-contentflow-inventory.md` classifies broad paths and shipglows_data/workflow/specs, while old files still live beside new ShipGlows files. Without a more operational tracker, future agents may lose the difference between active ShipGlows, reusable legacy concepts, parked product ideas, archive candidates, and files that can be removed later. That creates product confusion and deletion risk.

# Solution

Create a dedicated legacy file migration tracking contract, implemented as a technical tracker document and linked from the existing inventory and maps. The tracker records current path, area, decision, target path, migration status, risk, decision source, validation, and blocking question. It becomes the required checklist before any legacy move, archive, or deletion.

# Scope In

- Create a durable tracker for legacy file migration decisions.
- Define status taxonomy: `active-keep`, `adapt-candidate`, `keep-concept`, `park`, `reference-only`, `move-to-legacy`, `archive-later`, `delete-later`, `already-removed`, `not-found`, `superseded-by`, `blocked-needs-spec`, and `needs-decision`.
- Track current path, target path, owner spec, decision source, risk, migration status, validation, and next action.
- Seed the tracker from `shipglows_data/technical/legacy-contentflow-inventory.md`, `shipglows_data/editorial/content-map.md`, and the current `shipglows_data/workflow/specs/` list.
- Link the tracker from `legacy-contentflow-inventory.md`, `code-docs-map.md`, `shipglows_data/editorial/content-map.md`, and the migration/fusion spec.
- Add validation commands that compare tracker rows with actual repo paths.
- Preserve active ShipGlows paths and classify them as non-migration surfaces where needed.

# Scope Out

- Moving, deleting, or renaming files.
- Rewriting legacy code.
- Choosing auth, BYOK, FastAPI, Firebase, feedback, terminal, runner, or pipeline architecture.
- Creating a new runtime boundary.
- Closing the broader `shipglows-legacy-contentflow-fusion` chantier.
- Updating `shipglows_data/workflow/TASKS.md`, `shipglows_data/workflow/AUDIT_LOG.md`, or `PROJECTS.md`; those remain outside `sf-spec`.

# Constraints

- No destructive file operation is allowed in this spec implementation.
- The tracker must be reviewable as plain Markdown.
- The tracker must preserve the existing inventory as the classification source unless this spec explicitly supersedes part of that contract.
- `shipglows_data/workflow/specs/` remains the chantier registry; the tracker is supporting documentation, not a second chantier registry.
- Active ShipGlows paths under `lib/shipglows/`, `lib/data/shipglows_sources/`, and `lib/domain/project_health/` must not be moved as part of legacy cleanup.
- Security-sensitive legacy surfaces require a future ready spec or explicit user decision before archive/delete.
- The tracker must avoid vague statuses such as "clean up later" without a concrete next action.

# Dependencies

- `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md` owns the broader migration/fusion chantier and requires classification before deletion.
- `shipglows_data/technical/legacy-contentflow-inventory.md` is the current canonical classification source.
- `shipglows_data/technical/runtime-boundary.md` defines when legacy runtime removal is allowed.
- `shipglows_data/technical/code-docs-map.md` links code areas to shipglows_data and validation commands.
- `shipglows_data/editorial/content-map.md` identifies active, governance, and legacy surfaces.
- Fresh external shipglows_data: not needed. This is a local repository documentation and migration-tracking contract; no external framework, SDK, service, API, auth, or build behavior is being specified.

# Invariants

- Classification precedes movement or deletion.
- A legacy label is not a deletion approval.
- Every move/delete/archive action must cite a row in the tracker and an owner decision source.
- Active ShipGlows runtime remains separate from legacy archive/reference material.
- Parked product ideas remain visible until a future spec adopts or rejects them.
- Security-sensitive rows default to blocked until a dedicated spec owns them.
- The tracker must stay synchronized with actual filesystem paths after each cleanup slice.

# Links & Consequences

- Legacy inventory: gains an operational migration-tracking layer instead of only broad classification.
- Runtime boundary: future removal of `APP_TARGET=legacy/contentflow` depends on tracker rows reaching safe terminal states.
- Content map: must point readers to the tracker when they need current legacy movement status.
- Code shipglows_data map: must include validation for tracker consistency when legacy paths move.
- Specs: old ContentFlow specs can be tracked as `reference-only`, `park`, `archive-later`, or `superseded-by` future specs.
- Security: prevents accidental deletion or activation of auth, BYOK, feedback, API, web auth, pipeline, or runner-related code without a ready owner spec.
- Ops: gives future agents a concrete checklist and reduces context loss across conversations.

# Documentation Coherence

- Add `shipglows_data/technical/legacy-file-migration-tracker.md`.
- Update `shipglows_data/technical/legacy-contentflow-inventory.md` to name the tracker as the operational move/archive/delete ledger.
- Update `shipglows_data/technical/code-docs-map.md` to link the tracker and its validation command.
- Update `shipglows_data/editorial/content-map.md` to list the tracker under governance surfaces.
- Update `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md` to include the tracker as the next cleanup gate.
- No README, pricing, FAQ, public onboarding, screenshots, or marketing copy changes are required because this is an internal migration-control artifact.

# Edge Cases

- A file was already deleted before being added to the tracker.
- A broad directory contains both active reusable primitives and dead legacy screens.
- A legacy spec is conceptually superseded but still useful as evidence.
- A file name says ContentFlow but the code is now shared utility.
- A file appears unused but contains auth, secret, BYOK, feedback, or pipeline assumptions.
- A target legacy/archive folder is chosen but would break imports or tests if moved too early.
- A row is grouped at directory level but later needs file-level decisions.
- A future agent updates the inventory but forgets the tracker, or updates the tracker but not the content map.

# Implementation Tasks

- [x] Task 1 : Create the migration tracker document.
  - Fichier : `shipglows_data/technical/legacy-file-migration-tracker.md`
  - Action : Add frontmatter, purpose, status taxonomy, target-path rules, migration table schema, validation commands, and maintenance rule.
  - User story link : Provides the durable place where old/new file status stays readable.
  - Depends on : This spec passing `/sf-ready`.
  - Validate with : `rg -n "Current path|Target path|Migration status|Decision source|Validation|blocked-needs-spec" shipglows_data/technical/legacy-file-migration-tracker.md`
  - Notes : Use a table designed for review, not a generated report that hides decisions.

- [x] Task 2 : Seed tracker rows from the existing legacy inventory.
  - Fichier : `shipglows_data/technical/legacy-file-migration-tracker.md`
  - Action : Add rows for every path or area currently listed in `shipglows_data/technical/legacy-contentflow-inventory.md`, preserving current decisions and adding target path or blocking question.
  - User story link : Ensures already-known legacy areas are not lost during migration.
  - Depends on : Task 1.
  - Validate with : `rg -n "lib/router.dart|lib/providers/providers.dart|web_auth|shipglows_data/workflow/specs/\\*contentflow\\*|README.md" shipglows_data/technical/legacy-file-migration-tracker.md`
  - Notes : Directory-level grouping is allowed only when the row states how to expand it before actual movement.

- [x] Task 3 : Seed tracker rows for legacy specs.
  - Fichier : `shipglows_data/technical/legacy-file-migration-tracker.md`
  - Action : Add one row per legacy spec currently classified in `shipglows_data/technical/legacy-contentflow-inventory.md`, including target status and owner decision.
  - User story link : Prevents old shipglows_data/workflow/specs from blending with active ShipGlows shipglows_data/workflow/specs.
  - Depends on : Task 1.
  - Validate with : `rg -n "SPEC-offline-sync-v2|architecture-cible-fastapi-clerk-flutter|feedback-admin-v1-contentflow|PRD-lifetime-deal" shipglows_data/technical/legacy-file-migration-tracker.md`
  - Notes : Do not move shipglows_data/workflow/specs in this task; only track the future action.

- [x] Task 4 : Add anti-destructive guardrails to the legacy inventory.
  - Fichier : `shipglows_data/technical/legacy-contentflow-inventory.md`
  - Action : Add a `Migration Tracking` section that points to the tracker and states that move/archive/delete actions require a tracker row plus owner decision source.
  - User story link : Makes the existing canonical inventory point to the operational tracker.
  - Depends on : Tasks 1-3.
  - Validate with : `rg -n "Migration Tracking|legacy-file-migration-tracker|move/archive/delete" shipglows_data/technical/legacy-contentflow-inventory.md`
  - Notes : Preserve existing inventory rows; do not rewrite classifications unless the tracker reveals an inconsistency.

- [x] Task 5 : Link the tracker from project maps.
  - Fichier : `shipglows_data/editorial/content-map.md`
  - Action : Add `shipglows_data/technical/legacy-file-migration-tracker.md` to governance surfaces and legacy/reference explanation.
  - User story link : Helps future readers find the tracker from the repository map.
  - Depends on : Task 1.
  - Validate with : `rg -n "legacy-file-migration-tracker|legacy file migration" shipglows_data/editorial/content-map.md`
  - Notes : Keep ContentFlow as legacy/reference, not active product.

- [x] Task 6 : Link the tracker from code shipglows_data map.
  - Fichier : `shipglows_data/technical/code-docs-map.md`
  - Action : Add a map row for legacy file migration tracking, including validation command and update trigger.
  - User story link : Makes code/shipglows_data ownership changes traceable during cleanup.
  - Depends on : Task 1.
  - Validate with : `rg -n "Legacy file migration|legacy-file-migration-tracker|move.*archive.*delete" shipglows_data/technical/code-docs-map.md`
  - Notes : The update trigger should fire on any legacy path move, archive, delete, or decision change.

- [x] Task 7 : Update the migration/fusion spec.
  - Fichier : `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md`
  - Action : Add the tracker to dependencies/links or documentation coherence, and make it the required gate before destructive cleanup.
  - User story link : Keeps the broader chantier aligned with the new file-level tracking contract.
  - Depends on : Tasks 1-6.
  - Validate with : `rg -n "legacy-file-migration-tracker|destructive cleanup|move/archive/delete" shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md`
  - Notes : Do not mark the broader fusion chantier complete.

- [x] Task 8 : Add tracker consistency validation.
  - Fichier : `shipglows_data/technical/legacy-file-migration-tracker.md`
  - Action : Document manual validation commands that compare tracked paths with actual filesystem paths and flag missing tracker rows for known legacy surfaces.
  - User story link : Gives future agents a repeatable way to detect drift.
  - Depends on : Tasks 1-7.
  - Validate with : `rg -n "rg --files|not-found|already-removed|consistency" shipglows_data/technical/legacy-file-migration-tracker.md`
  - Notes : Do not add scripts in this spec unless a later implementation finds manual validation insufficient.

# Acceptance Criteria

- [x] CA 1 : Given a future agent wants to move or delete a legacy file, when they read the shipglows_data, then `shipglows_data/technical/legacy-file-migration-tracker.md` tells them the current path, decision, target path or deletion condition, validation, and blocker state.
- [x] CA 2 : Given a legacy path appears in `legacy-contentflow-inventory.md`, when the tracker is created, then it has a matching tracker row or an explicit grouped row that forbids movement until expanded.
- [x] CA 3 : Given a legacy spec is parked, reference-only, keep-concept, or archive-later, when browsing `shipglows_data/workflow/specs/`, then the tracker identifies its status and prevents it from being mistaken for active ShipGlows implementation scope.
- [x] CA 4 : Given a row concerns auth, BYOK, feedback, FastAPI/API, web auth, pipeline, providers, or user data, when a deletion is proposed, then the tracker requires a ready owner spec or explicit user decision before mutation.
- [x] CA 5 : Given a file has already disappeared, when the tracker is updated, then it uses `already-removed` or `not-found` with evidence rather than silently removing the row.
- [x] CA 6 : Given shipglows_data maps are updated, when a reader starts from `shipglows_data/editorial/content-map.md` or `code-docs-map.md`, then they can find the migration tracker.
- [x] CA 7 : Given a future cleanup slice changes any legacy path, when validation runs, then the tracker, inventory, content map, and code shipglows_data map remain consistent.
- [x] CA 8 : Given this spec is implemented, when reviewing git diff, then no code file, legacy file, spec file, or archive folder has been moved or deleted by this spec implementation.

# Test Strategy

- Markdown structure check with `rg -n "Title|Migration Tracking|Acceptance Criteria|Current Chantier Flow" shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md shipglows_data/technical/legacy-file-migration-tracker.md`.
- Tracker seed check with `rg -n "lib/router.dart|lib/providers/providers.dart|web_auth|feedback|OpenRouter|pipeline|FastAPI|SPEC-offline-sync-v2" shipglows_data/technical/legacy-file-migration-tracker.md`.
- Cross-link check with `rg -n "legacy-file-migration-tracker" shipglows_data/editorial/content-map.md shipglows_data/technical/code-docs-map.md shipglows_data/technical/legacy-contentflow-inventory.md shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md`.
- Non-destructive scoped diff check with `git diff --name-status -- shipglows_data/technical/legacy-file-migration-tracker.md shipglows_data/technical/legacy-contentflow-inventory.md shipglows_data/technical/code-docs-map.md shipglows_data/editorial/content-map.md shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md` to confirm this chantier only changes tracker and cross-link shipglows_data.
- Optional broad drift scan with `rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglows_data/workflow/TASKS.md shipglows_data/editorial/content-map.md shipglows_data/technical shipglows_data/workflow/specs lib test` after implementation.

# Risks

- High cleanup risk if a tracker row is treated as deletion approval instead of a gate.
- High product risk if parked ContentFlow concepts are archived in a way that future specs cannot rediscover.
- High security risk if auth, BYOK, API, or web auth files are moved/deleted without a dedicated spec.
- Medium documentation risk if tracker rows drift from real filesystem paths.
- Medium scope risk if implementation starts moving files while trying to build the tracker.

# Execution Notes

- Files to read first: `shipglows_data/technical/legacy-contentflow-inventory.md`, `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md`, `shipglows_data/editorial/content-map.md`, `shipglows_data/technical/code-docs-map.md`, `shipglows_data/technical/runtime-boundary.md`.
- Implementation approach: create the tracker document, seed it from existing inventory/spec classification, then add cross-links and validation commands.
- Use only Markdown edits in this chantier.
- Do not create or choose a physical legacy/archive target directory unless the tracker defines it as a future target; actual movement belongs to a later ready cleanup spec.
- Avoid broad mechanical rewrites of existing shipglows_data. Add the smallest sections and links needed to make the tracker canonical.
- Stop conditions: stop before moving, deleting, renaming, re-exporting, or rewriting any code/spec/shipglows_data file beyond the tracker and cross-link shipglows_data; stop if a path's status changes product/security meaning and ask for a user decision or new owner spec.
- Fresh-shipglows_data verdict: not needed because this is local repository governance, not framework/API behavior.

# Open Questions

None for creating the tracker. Future cleanup rows may contain `needs-decision` questions, but those are row-level decisions for later cleanup work, not blockers for this tracker spec.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 10:22:56 UTC | sf-spec | GPT-5 Codex | Created legacy file migration tracker spec from user request and existing legacy inventory. | draft saved | /sf-ready ShipGlows Legacy File Migration Tracker |
| 2026-05-10 10:31:36 UTC | sf-ready | GPT-5 Codex | Readiness gate for legacy file migration tracker spec. | ready | /sf-start ShipGlows Legacy File Migration Tracker |
| 2026-05-10 10:36:30 UTC | sf-start | GPT-5 Codex | Created tracker doc and linked inventory, content map, code shipglows_data map, and parent fusion spec. | implemented | /sf-verify ShipGlows Legacy File Migration Tracker |
| 2026-07-11 20:42:00 UTC | 103-sg-verify | GPT-5 Codex | Reconciled completed tasks and verified tracker structure, seeded rows, cross-links, non-destructive controls, and metadata after the ShipGlows rename. | verified | /104-sg-end ShipGlows Legacy File Migration Tracker |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Spec created in `shipglows_data/workflow/specs/shipglows-legacy-file-migration-tracker.md`. |
| sf-ready | done | Tracker scope, non-destructive guardrails, task targets, and acceptance criteria validated. |
| sf-start | done | Tracker shipglows_data implemented; no legacy file moves, deletes, or renames. |
| sf-verify | done | Tracker structure, coverage, cross-links, non-destructive controls, and metadata verified on 2026-07-11. |
| sf-end | next | Close the verified tracker chantier. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
