---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-10"
created_at: "2026-05-10 09:17:31 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 16:56:29 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "markdown-artifact-governance"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipGlows, je veux que l'indexer reconnaisse le corpus `shipglows_data/` comme source de gouvernance canonique dans chaque projet, afin que les agents lisent les bons artefacts sans indexer tout le Markdown au hasard."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "shipglows_data/"
  - "ShipGlows governance artifacts"
  - "sf-docs"
  - "managed clone runner"
  - "Firestore projection"
  - "ShipGlows dashboard"
  - "Markdown parsers"
depends_on:
  - artifact: "shipglows_data/technical/shipglows-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/workflow/specs/shipglows-github-managed-clone-indexer.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "shipglows_data/workflow/specs/shipglows-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "/home/claude/shipglowz/skills/sf-docs/SKILL.md"
    artifact_version: "local-checked-2026-05-10"
    required_status: "active"
  - artifact: "/home/claude/shipglowz/shipglows_data/workflow/specs/shipglows-governance-corpus-bootstrap-and-sf-build-integration.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "/home/claude/shipglowz/shipglows_data/technical/artifact-metadata-and-linter.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
supersedes:
  - "Root-only Markdown artifact discovery for ShipGlows governance documents"
evidence:
  - "User direction 2026-05-10: documentation is grouped under a per-project ShipGlows_Data/shipglows_data folder and that must be used as the governance artifact corpus across projects."
  - "Repo evidence 2026-05-10: sf-docs context prefers `shipglows_data/business/*`, `shipglows_data/editorial/*`, and `shipglows_data/technical/*` before root legacy shipglows_data."
  - "Repo evidence 2026-05-10: sf-docs Location rule says `shipglows_data` hosts tracking and registry files and is the preferred location for project governance artifacts."
  - "Repo evidence 2026-05-10: `/home/claude/socialflow/shipglows_data/` uses business, editorial, technical, and workflow subdirectories."
  - "Repo evidence 2026-05-10: `/home/claude/shipglows_data/` contains current global/root tracking and project task files."
next_step: "/sf-ready ShipGlows Dashboard Read-only Projection"
---
# Spec: ShipGlows Markdown Artifact Governance
🟢 [shipglows_app] spec: ShipGlows Markdown Artifact Governance | status: ready | path: shipglows_data/workflow/specs/shipglows-markdown-artifact-governance.md | next: /sf-ready ShipGlows Dashboard Read-only Projection

# Title

ShipGlows Markdown Artifact Governance

# Status

Ready after `/sf-ready`. This spec defines what Markdown artifacts ShipGlows indexes as governance data and how `shipglows_data/` becomes the canonical per-project corpus. It is aligned with the ready Firestore model and managed clone/indexer producer slice, plus the Test Contract below.

# User Story

En tant que fondatrice de ShipGlows, je veux que l'indexer reconnaisse le corpus `shipglows_data/` comme source de gouvernance canonique dans chaque projet, afin que les agents lisent les bons artefacts sans indexer tout le Markdown au hasard.

# Minimal Behavior Contract

The indexer treats `shipglows_data/` as the canonical project-local ShipGlows governance corpus when present, classifies only approved governance, tracker, technical, editorial, and business artifacts, extracts metadata and safe content into Firestore projection, and ignores secrets, runtime/build artifacts, dependency folders, and unknown bulky files. If both `shipglows_data/` and older root-level ShipGlows shipglows_data exist, `shipglows_data/` wins and root shipglows_data are fallback or legacy evidence only. The easy edge case to miss is indexing all Markdown in the repository and mixing app runtime content, generated shipglows_data, secrets, or stale root files into the governance projection.

# Success Behavior

- Given a project has `shipglows_data/`, ShipGlows indexes that corpus first.
- Given a project has `ShipGlows_Data/` but no `shipglows_data/`, ShipGlows treats it as a legacy casing variant and reports a migration recommendation to lowercase `shipglows_data/`.
- Given both `shipglows_data/` and root `shipglows_data/business/business.md`, `shipglows_data/editorial/content-map.md`, `shipglows_data/technical/*`, or similar files exist, `shipglows_data/` is canonical and root files are not allowed to override it.
- Given an artifact has ShipGlows frontmatter, the indexer extracts `artifact`, `artifact_version`, `status`, `scope`, `owner`, `depends_on`, `supersedes`, dates, and linked systems.
- Given tracker files like `shipglows_data/workflow/TASKS.md`, `shipglows_data/workflow/AUDIT_LOG.md`, `PROJECTS.md`, `TEST_LOG.md`, or `BUGS.md`, the indexer reads them as trackers without requiring ShipGlows frontmatter.
- Given app runtime Markdown content exists outside governance paths, ShipGlows ignores it unless a later spec explicitly opts it in.
- Given a file is ignored or unsafe, ShipGlows emits redacted diagnostics rather than silently treating it as missing.

# Error Behavior

- If `shipglows_data/` is missing, onboarding/indexing can continue with `governance_corpus_missing` or fallback discovery, but the project is marked as needing governance bootstrap.
- If `shipglows_data/` and `ShipGlows_Data/` both exist, lowercase `shipglows_data/` wins and a duplicate-corpus diagnostic is emitted.
- If frontmatter is invalid on a governance artifact, the file is indexed with `parse_failed` metadata and a diagnostic; it does not block other files.
- If a tracker has frontmatter when it should not, ShipGlows keeps parsing it as a tracker and emits a metadata-shape diagnostic.
- If a file path contains secret-sensitive segments, the indexer ignores it and redacts path details.
- If a file exceeds size limits, the indexer stores metadata plus truncated summary/excerpt and emits `file_too_large`.
- If a symlink escapes the repository or corpus root, the indexer ignores it.

# Problem

Previous shipglows_data/workflow/specs named individual Markdown files and old root-level docs, but the current ShipGlows doctrine has evolved: project governance should live in `shipglows_data/` with family subdirectories such as `business/`, `technical/`, `editorial/`, and `workflow/`. Without a governance spec, the runner may index stale root files, miss the new corpus, or read arbitrary Markdown that belongs to an app rather than ShipGlows's operational governance.

# Solution

Define `shipglows_data/` as the canonical artifact corpus for project governance. The indexer will use a path-policy and artifact-classification table, extract structured metadata when available, parse tracker files with tracker-specific rules, and project the latest safe content into Firestore. Root-level files remain compatibility fallback during migration, not the target layout.

# Scope In

- Define canonical corpus path and casing behavior.
- Define artifact families: business, technical, editorial, workflow, root/governance, project trackers, specs, bugs, tests, and legacy fallback.
- Define initial allowed path patterns.
- Define tracker files that do not require frontmatter.
- Define ShipGlows frontmatter extraction for artifact files.
- Define ignore rules for secrets, dependencies, build output, generated caches, and runtime content.
- Define deletion, rename, duplicate, and stale-root behavior.
- Define how missing corpus is represented in diagnostics and onboarding/dashboard.
- Define how this feeds Firestore projection and dashboard read-only views.

# Scope Out

- Implementing parsers.
- Implementing sf-docs bootstrap.
- Moving existing files into `shipglows_data/`.
- Writing Markdown back to repositories.
- Editing app runtime content schemas.
- Indexing arbitrary blog/content collections.
- Building full-text or vector search.
- Deciding terminal/agent write-back behavior.

# Constraints

- Filesystem canonical spelling is `shipglows_data/` lowercase.
- `ShipGlows_Data/` is accepted only as a legacy/casing variant with migration diagnostic.
- `shipglows_data/` wins over root-level duplicates.
- Markdown/repo files remain canonical; Firestore remains projection.
- Indexing is read-only in V1.
- Trackers are operational registries and are not forced into ShipGlows frontmatter.
- Decision artifacts should carry ShipGlows frontmatter.
- Runtime content with framework-specific schema must not receive ShipGlows governance frontmatter unless its schema allows it.
- Secrets and credentials must never be projected.

# Dependencies

- `sf-docs` skill doctrine says `shipglows_data` is the preferred location for project governance artifacts.
- `artifact-metadata-and-linter.md` defines ShipGlows artifact frontmatter expectations and tracker exclusions.
- `shipglows-governance-corpus-bootstrap-and-sf-build-integration.md` defines normal governance corpus bootstrap through ShipGlows workflows.
- `shipglows-github-managed-clone-indexer.md` owns the producer path from clone to Firestore.
- `shipglows-firestore-data-model.md` owns projection records and diagnostics.
- Fresh external shipglows_data: not needed. This is local ShipGlows corpus doctrine and Markdown parsing policy.

# Invariants

- `shipglows_data/` is the first governance corpus root.
- The indexer does not recursively ingest all Markdown.
- Every indexed file has `path`, `artifactFamily`, `artifactType`, `sourceCommit`, `contentHash`, `parseStatus`, `indexedAt`, and `deleted`.
- Decision artifacts with frontmatter expose their metadata fields in projection.
- Tracker files are indexed with tracker-specific parsers and no frontmatter requirement.
- Unknown Markdown is ignored by default unless under an approved governance path and under size/safety limits.
- Root-level duplicates cannot override `shipglows_data/`.
- GitHub wins every conflict.

# Links & Consequences

- Runner/indexer: path policy must prioritize `shipglows_data/`.
- Firestore: indexed file records need artifact family/type and corpus-root metadata.
- Onboarding: missing corpus becomes a valid setup warning, not a fatal onboarding failure.
- Dashboard: read-only projection should group by governance family, not by raw file path only.
- sf-docs: future bootstrap/update work should create or maintain `shipglows_data/` rather than parallel root copies.
- Legacy migration: existing root shipglows_data remain useful evidence but should gradually move into `shipglows_data/`.

# Documentation Coherence

- Add this spec to `shipglows_data/editorial/content-map.md`.
- Add this spec to `shipglows_data/technical/code-docs-map.md`.
- Add this spec to `shipglows_data/technical/shipglows-foundational-architecture.md`.
- Update `shipglows_data/technical/markdown-source-of-truth.md` to name `shipglows_data/` as the preferred governance corpus path.
- Future dashboard projection spec must use the artifact families defined here.

# Edge Cases

- Project has only old root files and no `shipglows_data/`.
- Project has both `shipglows_data/` and `ShipGlows_Data/`.
- Project has `shipglows_data/` plus stale root duplicates.
- Tracker files contain accidental frontmatter.
- Artifact frontmatter is malformed.
- App runtime content lives under `src/content/` with incompatible schema.
- Markdown file contains secrets.
- File is too large for Firestore document projection.
- File renamed within `shipglows_data/`.
- File deleted from GitHub but still exists in Firestore projection.
- Symlink points outside the repository.

# Implementation Tasks

- [ ] Task 1: Create the Markdown artifact governance technical contract.
  - File: `shipglows_data/technical/markdown-artifact-governance.md`
  - Action: Define corpus root, path allowlist, ignore rules, artifact families, tracker exceptions, frontmatter extraction, Firestore projection fields, diagnostics, and examples.
  - User story link: Gives the indexer a conservative corpus contract instead of indexing arbitrary Markdown.
  - Depends on: this spec passing `/sf-ready`.
  - Validate with: `rg -n "shipglows_data|artifactFamily|tracker|frontmatter|ignored|redacted|governance_corpus_missing" shipglows_data/technical/markdown-artifact-governance.md`.
- [ ] Task 2: Update source-of-truth and docs maps.
  - File: `shipglows_data/technical/markdown-source-of-truth.md`
  - File: `shipglows_data/technical/code-docs-map.md`
  - File: `shipglows_data/editorial/content-map.md`
  - Action: Name `shipglows_data/` as the preferred project governance corpus and link the new technical contract.
  - User story link: Keeps future agents and docs aligned on the same corpus root.
  - Depends on: Task 1.
  - Validate with: `rg -n "markdown-artifact-governance|shipglows_data|governance corpus" shipglows_data/technical shipglows_data/editorial`.
- [ ] Task 3: Extend artifact path/classification policy.
  - File: `lib/data/shipglows_sources/shipglows_artifact_index_policy.dart`
  - File: `test/data/shipglows_sources/shipglows_artifact_index_policy_test.dart`
  - Action: Add/confirm path-policy constants for canonical `shipglows_data/`, legacy `ShipGlows_Data/`, root fallback, approved artifact families, ignored runtime content, secret-like paths, dependency/build/cache folders, and symlink escape handling.
  - User story link: Ensures the managed clone indexer reads the right governance files and rejects unsafe or unrelated Markdown.
  - Depends on: Tasks 1-2.
  - Validate with: `flutter test test/data/shipglows_sources/shipglows_artifact_index_policy_test.dart`.
- [ ] Task 4: Add fixtures and parser/projection tests.
  - File: `test/data/shipglows_sources/fixtures/` and related parser/indexer test files.
  - Action: Cover canonical corpus, legacy casing, root fallback, duplicates, invalid frontmatter, tracker without frontmatter, secret-like path, large file, deleted file, renamed file, and unsafe runtime Markdown.
  - User story link: Proves missing/dirty corpus states become diagnostics instead of unsafe projection.
  - Depends on: Task 3.
  - Validate with: `flutter test test/data/shipglows_sources`.
- [ ] Task 5: Update changelog after implementation.
  - File: `CHANGELOG.md`
  - Action: Record only implemented artifact-governance behavior and avoid claiming production indexing if the work remains local/fake-runner scoped.
  - User story link: Keeps operator-facing release notes honest.
  - Depends on: Tasks 1-4.
  - Validate with: `rg -n "artifact governance|shipglows_data|Markdown" CHANGELOG.md`.

# Acceptance Criteria

- `shipglows_data/` is documented as the canonical project governance corpus.
- `ShipGlows_Data/` is handled as a legacy casing variant, not a second canonical root.
- Root-level governance shipglows_data are fallback/legacy when `shipglows_data/` exists.
- The indexer policy does not ingest all Markdown by default.
- Trackers are indexed without mandatory frontmatter.
- Decision artifacts use ShipGlows frontmatter when present.
- Unsafe paths and secret-like files are ignored with redacted diagnostics.
- Missing corpus is a warning/bootstrap state, not a fatal project failure.
- Firestore projection can group artifacts by family/type.

# Test Contract

- `surface`: Markdown artifact governance technical docs, artifact path/classification policy, parser/indexer fixtures, diagnostics, docs maps, and Firestore projection field expectations for indexed governance artifacts. Production GitHub clone/indexing is not required for this slice when local fixtures and fake runner tests cover the policy.
- `proof_profile`: high-security local corpus-selection proof. Required evidence is policy tests, parser/indexer fixtures, redaction/ignore tests, metadata lint, docs coherence, and diff hygiene. External-doc freshness is not needed because this is local ShipGlows corpus doctrine and repository parsing policy.
- `proof_order`:
  1. Write `markdown-artifact-governance.md` before policy changes.
  2. Add path/classification tests before or alongside code changes.
  3. Add fixtures for canonical corpus, legacy casing, root fallback, duplicates, malformed frontmatter, trackers, unsafe paths, large files, deleted files, and runtime content.
  4. Run focused artifact policy tests, broader `flutter test test/data/shipglows_sources`, metadata lint, and `git diff --check`.
  5. Use `/sf-ship` and `/sf-prod` only if the implementation affects deployed dashboard behavior in this `vercel-preview-push` project.
- `checklist_path`: `shipglows_data/workflow/verification/shipglows-markdown-artifact-governance.md`.
- `required_scenario_ids`:
  - `ART-GOV-001`: canonical lowercase `shipglows_data/` is preferred over legacy/root fallback sources.
  - `ART-GOV-002`: `ShipGlows_Data/` is treated as legacy casing with a migration diagnostic, not as a second canonical root.
  - `ART-GOV-003`: approved artifact families and tracker exceptions are classified without indexing arbitrary Markdown.
  - `ART-GOV-004`: malformed frontmatter, missing corpus, duplicates, large files, deleted files, and parse failures become bounded diagnostics.
  - `ART-GOV-005`: secret-like paths, dependency/build/cache output, symlink escapes, and runtime content are ignored or redacted.
  - `ART-GOV-006`: dashboard/indexer projection can group artifacts by family/type without treating Firestore as canonical.
- `required_results`: all required scenario ids pass; no arbitrary Markdown crawl exists by default; unsafe paths are redacted; trackers remain allowed without frontmatter; missing corpus is warning/bootstrap state; docs maps name the governance contract.
- `exception_with_proof`: production clone proof may be deferred when local fixture/fake-runner tests cover every required scenario. No exception may bypass redaction, no-arbitrary-Markdown, canonical corpus precedence, metadata lint, or diff hygiene.
- `exception_without_proof`: none for secret-path redaction, symlink escape rejection, canonical corpus precedence, and no arbitrary Markdown indexing.

# Test Strategy

- Path policy tests for canonical corpus, legacy casing, root fallback, and duplicates.
- Artifact classification tests for business, technical, editorial, workflow, tracker, spec, bug, and ignored runtime content.
- Frontmatter parser tests for valid, missing, and malformed metadata.
- Tracker parser tests without frontmatter.
- Redaction tests for secret-like paths.
- Large-file and symlink escape tests.
- Deleted/renamed file reconciliation tests through indexer fixtures.

# Risks

- High data-quality risk if stale root docs override canonical `shipglows_data/`.
- High security risk if arbitrary Markdown or secrets are indexed.
- Medium migration risk because existing projects may use root shipglows_data or different casing.
- Medium UX risk if missing governance corpus is treated as hard failure instead of setup warning.
- Medium maintenance risk if sf-docs and indexer disagree on corpus paths.

# Execution Notes

- Technical decision: lowercase `shipglows_data/` is canonical because existing ShipGlows skill doctrine and real projects use that path.
- Technical decision: user-facing language can call it "ShipGlows Data" or "ShipGlows_Data" if needed, but filesystem policy should normalize toward `shipglows_data/`.
- Technical decision: root files like `shipglows_data/business/business.md`, `shipglows_data/editorial/content-map.md`, `shipglows_data/technical/*`, and `shipglows_data/workflow/specs/*.md` remain migration fallback for older projects.
- Technical decision: the first implementation should be conservative and index fewer files with strong diagnostics rather than over-indexing.
- Fresh-shipglows_data verdict: not needed; this spec depends on local ShipGlows doctrine and repository evidence.

# Open Questions

None. Remaining choices are implementation details unless they change visible project setup UX or corpus naming in the UI.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 09:17:31 UTC | sf-spec | GPT-5 Codex | Created foundational Markdown artifact governance spec from ShipGlows corpus doctrine. | Draft spec created. | /sf-ready ShipGlows Markdown Artifact Governance after foundational coherence pass |
| 2026-05-30 16:55:32 UTC | sf-spec | GPT-5 Codex | Repaired readiness gaps: dependency versions, structured tasks, Test Contract, proof order, scenarios, and exception policy. | reviewed | /sf-ready ShipGlows Markdown Artifact Governance |
| 2026-05-30 16:56:29 UTC | sf-ready | GPT-5 Codex | Readiness review passed: corpus precedence, allowlist, diagnostics, redaction, fixture policy, docs coherence, and Test Contract are actionable. | ready | /sf-ready ShipGlows Dashboard Read-only Projection |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Markdown artifact governance spec created. |
| sf-ready | ready | Passed after Test Contract repair and dependency alignment. |
| sf-start | pending | No implementation before foundational coherence review. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
