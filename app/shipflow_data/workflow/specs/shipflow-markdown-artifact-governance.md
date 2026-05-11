---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-10"
created_at: "2026-05-10 09:17:31 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 09:17:31 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "markdown-artifact-governance"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux que l'indexer reconnaisse le corpus `shipflow_data/` comme source de gouvernance canonique dans chaque projet, afin que les agents lisent les bons artefacts sans indexer tout le Markdown au hasard."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "shipflow_data/"
  - "ShipFlow governance artifacts"
  - "sf-docs"
  - "managed clone runner"
  - "Firestore projection"
  - "ShipFlow dashboard"
  - "Markdown parsers"
depends_on:
  - artifact: "shipflow_data/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/shipflow-github-managed-clone-indexer.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/workflow/specs/shipflow-firestore-data-model.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "/home/claude/shipflow/skills/sf-docs/SKILL.md"
    artifact_version: "local-checked-2026-05-10"
    required_status: "active"
  - artifact: "/home/claude/shipflow/shipflow_data/workflow/specs/shipflow-governance-corpus-bootstrap-and-sf-build-integration.md"
    artifact_version: "1.0.0"
    required_status: "ready"
  - artifact: "/home/claude/shipflow/shipflow_data/technical/artifact-metadata-and-linter.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
supersedes:
  - "Root-only Markdown artifact discovery for ShipFlow governance documents"
evidence:
  - "User direction 2026-05-10: documentation is grouped under a per-project ShipFlow_Data/shipflow_data folder and that must be used as the governance artifact corpus across projects."
  - "Repo evidence 2026-05-10: sf-docs context prefers `shipflow_data/business/*`, `shipflow_data/editorial/*`, and `shipflow_data/technical/*` before root legacy shipflow_data."
  - "Repo evidence 2026-05-10: sf-docs Location rule says `shipflow_data` hosts tracking and registry files and is the preferred location for project governance artifacts."
  - "Repo evidence 2026-05-10: `/home/claude/socialflow/shipflow_data/` uses business, editorial, technical, and workflow subdirectories."
  - "Repo evidence 2026-05-10: `/home/claude/shipflow_data/` contains current global/root tracking and project task files."
next_step: "/sf-ready ShipFlow Markdown Artifact Governance"
---

# Title

ShipFlow Markdown Artifact Governance

# Status

Draft foundational spec. This spec defines what Markdown artifacts ShipFlow indexes as governance data and how `shipflow_data/` becomes the canonical per-project corpus. It must be reviewed with the onboarding, Firestore, auth/access, and runner/indexer shipflow_data/workflow/specs before implementation.

# User Story

En tant que fondatrice de ShipFlow, je veux que l'indexer reconnaisse le corpus `shipflow_data/` comme source de gouvernance canonique dans chaque projet, afin que les agents lisent les bons artefacts sans indexer tout le Markdown au hasard.

# Minimal Behavior Contract

The indexer treats `shipflow_data/` as the canonical project-local ShipFlow governance corpus when present, classifies only approved governance, tracker, technical, editorial, and business artifacts, extracts metadata and safe content into Firestore projection, and ignores secrets, runtime/build artifacts, dependency folders, and unknown bulky files. If both `shipflow_data/` and older root-level ShipFlow shipflow_data exist, `shipflow_data/` wins and root shipflow_data are fallback or legacy evidence only. The easy edge case to miss is indexing all Markdown in the repository and mixing app runtime content, generated shipflow_data, secrets, or stale root files into the governance projection.

# Success Behavior

- Given a project has `shipflow_data/`, ShipFlow indexes that corpus first.
- Given a project has `ShipFlow_Data/` but no `shipflow_data/`, ShipFlow treats it as a legacy casing variant and reports a migration recommendation to lowercase `shipflow_data/`.
- Given both `shipflow_data/` and root `shipflow_data/business/business.md`, `shipflow_data/editorial/content-map.md`, `shipflow_data/technical/*`, or similar files exist, `shipflow_data/` is canonical and root files are not allowed to override it.
- Given an artifact has ShipFlow frontmatter, the indexer extracts `artifact`, `artifact_version`, `status`, `scope`, `owner`, `depends_on`, `supersedes`, dates, and linked systems.
- Given tracker files like `shipflow_data/workflow/TASKS.md`, `shipflow_data/workflow/AUDIT_LOG.md`, `PROJECTS.md`, `TEST_LOG.md`, or `BUGS.md`, the indexer reads them as trackers without requiring ShipFlow frontmatter.
- Given app runtime Markdown content exists outside governance paths, ShipFlow ignores it unless a later spec explicitly opts it in.
- Given a file is ignored or unsafe, ShipFlow emits redacted diagnostics rather than silently treating it as missing.

# Error Behavior

- If `shipflow_data/` is missing, onboarding/indexing can continue with `governance_corpus_missing` or fallback discovery, but the project is marked as needing governance bootstrap.
- If `shipflow_data/` and `ShipFlow_Data/` both exist, lowercase `shipflow_data/` wins and a duplicate-corpus diagnostic is emitted.
- If frontmatter is invalid on a governance artifact, the file is indexed with `parse_failed` metadata and a diagnostic; it does not block other files.
- If a tracker has frontmatter when it should not, ShipFlow keeps parsing it as a tracker and emits a metadata-shape diagnostic.
- If a file path contains secret-sensitive segments, the indexer ignores it and redacts path details.
- If a file exceeds size limits, the indexer stores metadata plus truncated summary/excerpt and emits `file_too_large`.
- If a symlink escapes the repository or corpus root, the indexer ignores it.

# Problem

Previous shipflow_data/workflow/specs named individual Markdown files and old root-level docs, but the current ShipFlow doctrine has evolved: project governance should live in `shipflow_data/` with family subdirectories such as `business/`, `technical/`, `editorial/`, and `workflow/`. Without a governance spec, the runner may index stale root files, miss the new corpus, or read arbitrary Markdown that belongs to an app rather than ShipFlow's operational governance.

# Solution

Define `shipflow_data/` as the canonical artifact corpus for project governance. The indexer will use a path-policy and artifact-classification table, extract structured metadata when available, parse tracker files with tracker-specific rules, and project the latest safe content into Firestore. Root-level files remain compatibility fallback during migration, not the target layout.

# Scope In

- Define canonical corpus path and casing behavior.
- Define artifact families: business, technical, editorial, workflow, root/governance, project trackers, specs, bugs, tests, and legacy fallback.
- Define initial allowed path patterns.
- Define tracker files that do not require frontmatter.
- Define ShipFlow frontmatter extraction for artifact files.
- Define ignore rules for secrets, dependencies, build output, generated caches, and runtime content.
- Define deletion, rename, duplicate, and stale-root behavior.
- Define how missing corpus is represented in diagnostics and onboarding/dashboard.
- Define how this feeds Firestore projection and dashboard read-only views.

# Scope Out

- Implementing parsers.
- Implementing sf-docs bootstrap.
- Moving existing files into `shipflow_data/`.
- Writing Markdown back to repositories.
- Editing app runtime content schemas.
- Indexing arbitrary blog/content collections.
- Building full-text or vector search.
- Deciding terminal/agent write-back behavior.

# Constraints

- Filesystem canonical spelling is `shipflow_data/` lowercase.
- `ShipFlow_Data/` is accepted only as a legacy/casing variant with migration diagnostic.
- `shipflow_data/` wins over root-level duplicates.
- Markdown/repo files remain canonical; Firestore remains projection.
- Indexing is read-only in V1.
- Trackers are operational registries and are not forced into ShipFlow frontmatter.
- Decision artifacts should carry ShipFlow frontmatter.
- Runtime content with framework-specific schema must not receive ShipFlow governance frontmatter unless its schema allows it.
- Secrets and credentials must never be projected.

# Dependencies

- `sf-docs` skill doctrine says `shipflow_data` is the preferred location for project governance artifacts.
- `artifact-metadata-and-linter.md` defines ShipFlow artifact frontmatter expectations and tracker exclusions.
- `shipflow-governance-corpus-bootstrap-and-sf-build-integration.md` defines normal governance corpus bootstrap through ShipFlow workflows.
- `shipflow-github-managed-clone-indexer.md` owns the producer path from clone to Firestore.
- `shipflow-firestore-data-model.md` owns projection records and diagnostics.
- Fresh external shipflow_data: not needed. This is local ShipFlow corpus doctrine and Markdown parsing policy.

# Invariants

- `shipflow_data/` is the first governance corpus root.
- The indexer does not recursively ingest all Markdown.
- Every indexed file has `path`, `artifactFamily`, `artifactType`, `sourceCommit`, `contentHash`, `parseStatus`, `indexedAt`, and `deleted`.
- Decision artifacts with frontmatter expose their metadata fields in projection.
- Tracker files are indexed with tracker-specific parsers and no frontmatter requirement.
- Unknown Markdown is ignored by default unless under an approved governance path and under size/safety limits.
- Root-level duplicates cannot override `shipflow_data/`.
- GitHub wins every conflict.

# Links & Consequences

- Runner/indexer: path policy must prioritize `shipflow_data/`.
- Firestore: indexed file records need artifact family/type and corpus-root metadata.
- Onboarding: missing corpus becomes a valid setup warning, not a fatal onboarding failure.
- Dashboard: read-only projection should group by governance family, not by raw file path only.
- sf-docs: future bootstrap/update work should create or maintain `shipflow_data/` rather than parallel root copies.
- Legacy migration: existing root shipflow_data remain useful evidence but should gradually move into `shipflow_data/`.

# Documentation Coherence

- Add this spec to `shipflow_data/editorial/content-map.md`.
- Add this spec to `shipflow_data/technical/code-docs-map.md`.
- Add this spec to `shipflow_data/technical/shipflow-foundational-architecture.md`.
- Update `shipflow_data/technical/markdown-source-of-truth.md` to name `shipflow_data/` as the preferred governance corpus path.
- Future dashboard projection spec must use the artifact families defined here.

# Edge Cases

- Project has only old root files and no `shipflow_data/`.
- Project has both `shipflow_data/` and `ShipFlow_Data/`.
- Project has `shipflow_data/` plus stale root duplicates.
- Tracker files contain accidental frontmatter.
- Artifact frontmatter is malformed.
- App runtime content lives under `src/content/` with incompatible schema.
- Markdown file contains secrets.
- File is too large for Firestore document projection.
- File renamed within `shipflow_data/`.
- File deleted from GitHub but still exists in Firestore projection.
- Symlink points outside the repository.

# Implementation Tasks

1. Create `shipflow_data/technical/markdown-artifact-governance.md` with corpus root, path allowlist, ignore rules, artifact families, and examples.
2. Update `shipflow_data/technical/markdown-source-of-truth.md` to prefer `shipflow_data/`.
3. Define path-policy constants for `shipflow_data/`, `ShipFlow_Data/` legacy handling, and root fallback.
4. Define artifact-family classification for business, technical, editorial, workflow, tracker, spec, bug, test, and legacy.
5. Define frontmatter extraction contract for ShipFlow artifacts.
6. Define tracker parsing contract for `shipflow_data/workflow/TASKS.md`, `shipflow_data/workflow/AUDIT_LOG.md`, `PROJECTS.md`, `TEST_LOG.md`, and `BUGS.md`.
7. Define ignore/redaction rules for secrets, dependency folders, build output, caches, runtime content, and symlink escapes.
8. Define Firestore projection fields for artifact governance metadata.
9. Add fixtures for projects with canonical corpus, legacy casing, root fallback, duplicates, invalid frontmatter, and unsafe files.
10. Update shipflow_data maps and foundational references.

# Acceptance Criteria

- `shipflow_data/` is documented as the canonical project governance corpus.
- `ShipFlow_Data/` is handled as a legacy casing variant, not a second canonical root.
- Root-level governance shipflow_data are fallback/legacy when `shipflow_data/` exists.
- The indexer policy does not ingest all Markdown by default.
- Trackers are indexed without mandatory frontmatter.
- Decision artifacts use ShipFlow frontmatter when present.
- Unsafe paths and secret-like files are ignored with redacted diagnostics.
- Missing corpus is a warning/bootstrap state, not a fatal project failure.
- Firestore projection can group artifacts by family/type.

# Test Strategy

- Path policy tests for canonical corpus, legacy casing, root fallback, and duplicates.
- Artifact classification tests for business, technical, editorial, workflow, tracker, spec, bug, and ignored runtime content.
- Frontmatter parser tests for valid, missing, and malformed metadata.
- Tracker parser tests without frontmatter.
- Redaction tests for secret-like paths.
- Large-file and symlink escape tests.
- Deleted/renamed file reconciliation tests through indexer fixtures.

# Risks

- High data-quality risk if stale root docs override canonical `shipflow_data/`.
- High security risk if arbitrary Markdown or secrets are indexed.
- Medium migration risk because existing projects may use root shipflow_data or different casing.
- Medium UX risk if missing governance corpus is treated as hard failure instead of setup warning.
- Medium maintenance risk if sf-docs and indexer disagree on corpus paths.

# Execution Notes

- Technical decision: lowercase `shipflow_data/` is canonical because existing ShipFlow skill doctrine and real projects use that path.
- Technical decision: user-facing language can call it "ShipFlow Data" or "ShipFlow_Data" if needed, but filesystem policy should normalize toward `shipflow_data/`.
- Technical decision: root files like `shipflow_data/business/business.md`, `shipflow_data/editorial/content-map.md`, `shipflow_data/technical/*`, and `shipflow_data/workflow/specs/*.md` remain migration fallback for older projects.
- Technical decision: the first implementation should be conservative and index fewer files with strong diagnostics rather than over-indexing.
- Fresh-shipflow_data verdict: not needed; this spec depends on local ShipFlow doctrine and repository evidence.

# Open Questions

None. Remaining choices are implementation details unless they change visible project setup UX or corpus naming in the UI.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-10 09:17:31 UTC | sf-spec | GPT-5 Codex | Created foundational Markdown artifact governance spec from ShipFlow corpus doctrine. | Draft spec created. | /sf-ready ShipFlow Markdown Artifact Governance after foundational coherence pass |

# Current Chantier Flow

| Step | Status | Notes |
|------|--------|-------|
| sf-spec | done | Markdown artifact governance spec created. |
| sf-ready | deferred | Wait until all foundational specs are written, then review coherence as a group. |
| sf-start | pending | No implementation before foundational coherence review. |
| sf-verify | pending | Verify after future implementation only. |
| sf-end | pending | Close after implementation and verification. |
| sf-ship | pending | Commit/push only after explicit ship flow. |
