---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-23"
created_at: "2026-05-23 20:50:34 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 16:47:00 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "traffic-first-live-migration-web-reader-contract"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux que la migration live des tâches, audits et specs vers le format traffic-first soit validée par le contrat de lecture de la future app web, afin que les fichiers Markdown restent la source lisible et exploitable sans normalisation cachée."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "shipflow_data/workflow/TASKS.md"
  - "shipflow_data/workflow/AUDIT_LOG.md"
  - "shipflow_data/workflow/specs/"
  - "/home/claude/shipflow_data/TASKS.md"
  - "/home/claude/shipflow_data/AUDIT_LOG.md"
  - "scripts/migrate_operational_records.py"
  - "lib/data/shipflow_sources/parsers/"
  - "test/data/shipflow_sources/parsers/"
  - "/home/claude/shipflow/tui/src/sources/"
  - "future ShipFlow web reader"
  - "future Firestore or database projection"
depends_on:
  - artifact: "shipflow_data/workflow/specs/traffic-first-markdown-operational-record-format.md"
    artifact_version: "1.0.0"
    required_status: ready
  - artifact: "/home/claude/shipflow/skills/references/operational-record-format.md"
    artifact_version: "1.0.0"
    required_status: active
  - artifact: "shipflow_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: draft
  - artifact: "shipflow_data/technical/code-docs-map.md"
    artifact_version: "0.1.0"
    required_status: draft
  - artifact: "shipflow_data/workflow/specs/shipflow-dashboard-readonly-projection.md"
    artifact_version: "0.1.0"
    required_status: draft
  - artifact: "shipflow_data/workflow/specs/shipflow-firestore-data-model.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes: []
evidence:
  - "User decision 2026-05-23: live migration needs its own spec because the future web app will read Markdown to display data."
  - "Dry-run after ambiguity resolution reports ambiguous/skipped count 0 and live migration blocker no."
  - "scripts/migrate_operational_records.py currently refuses --write and only emits reviewable canonical snippets."
  - "OperationalRecordParser already parses traffic-first records for Flutter data readers."
  - "/home/claude/shipflow/tui/src/sources/readers.ts already parses traffic-first records for the terminal dashboard."
  - "markdown-source-of-truth.md states Markdown/repository files remain canonical and projection layers are rebuildable."
  - "User decision 2026-05-30: operational data volume is small enough to fully migrate; no legacy active table or snapshot should remain after migration."
next_step: "/sf-prod shipflow_app"
---

# Spec: Traffic-First Operational Record Live Migration And Web Reader Contract


🟢 [shipflow_app] spec: Traffic-First Operational Record Live Migration And Web Reader Contract | status: ready | path: shipflow_data/workflow/specs/traffic-first-operational-record-live-migration-web-reader-contract.md | next: /sf-prod shipflow_app
## Title

Traffic-First Operational Record Live Migration And Web Reader Contract

## Status

Verified after `/sf-start`. The raw file rewrite, web-reader contract, parser/TUI compatibility, zero-legacy policy, and migration idempotence have passed the ordered proof gates defined below.

## User Story

En tant que fondatrice de ShipFlow, je veux que la migration live des tâches, audits et specs vers le format traffic-first soit validée par le contrat de lecture de la future app web, afin que les fichiers Markdown restent la source lisible et exploitable sans normalisation cachée.

## Minimal Behavior Contract

ShipFlow accepts existing legacy operational Markdown and a zero-ambiguity dry-run as input, then performs a live migration only after a web-reader contract defines the exact record shape, dedupe keys, source metadata, diagnostics, and projection fields that a future app web will consume. The migration produces canonical traffic-first `task:`, `audit:`, and `spec:` records in source Markdown files, preserves enough review evidence to recover or audit the rewrite, and leaves readers able to parse the migrated files without depending on hidden legacy normalization. If ambiguity, duplicate conflict, malformed output, missing web-reader fixture, or unsafe write risk appears, the live migration stops before modifying source files. The easy edge case to miss is making the current Flutter/TUI readers pass while the future web app would still need a custom migration-only interpretation of the Markdown.

## Success Behavior

- Given the migration dry-run reports `ambiguous/skipped count: 0`, when `/sf-start` runs this ready spec, then write mode is allowed to proceed only after the web-reader contract and fixtures exist.
- Given a Markdown tracker is migrated, when a human opens the raw file, then active operational records begin with `🔴`, `🟠`, `🟡`, or `🟢`, followed by `[project]`, record kind, title, and structured fields.
- Given a future web app reads migrated Markdown directly or through a projection/index layer, when it consumes task, audit, and spec records, then it can build the same project filters, recent lists, status groupings, diagnostics, and source links from the canonical line shape.
- Given a migrated record appears in a projection, when the user views it in a web UI, then the record remains traceable to file path, line number when known, source kind, project, title, traffic marker, fields, dedupe key, and parse diagnostics.
- Given a Markdown tracker is migrated, when readers parse the file, then no active legacy operational table remains in that migrated source file.
- Given a write step fails halfway, then no source file is left partially rewritten without a migration report and recoverable git diff.

## Error Behavior

- If the dry-run has any ambiguous/skipped records, the live migration must refuse to write.
- If the web-reader contract doc or fixtures are missing, the migration must refuse to write even if the dry-run is clean.
- If a generated canonical record lacks `[project]`, required fields, source path, or a dedupe key, the migration must stop before writing that file.
- If a canonical record conflicts with another canonical record and the conflict cannot be resolved deterministically, the migration must stop and emit the file/line conflict.
- If the migration would delete information that is not represented in canonical output, the migration must stop for manual review instead of keeping a legacy snapshot.
- If diagnostics include secrets, tokens, cookies, credentials, clone paths, or raw backend payloads, the diagnostic output must be redacted before it can be used as a web-visible projection.
- If the future web-reader contract needs a field not present in the canonical grammar, the migration must update the contract and parser tests before rewriting source files.

## Problem

The traffic-first format spec defines the grammar and the dry-run now reports no ambiguity, but that is not enough to mutate the operational source files. The future app web will read Markdown or a projection produced from Markdown, so the migrated files must be shaped for direct product consumption, not only for the current migration script.

Without a separate live-migration spec, implementation could apply a massive rewrite that is mechanically valid but still weak for the web surface: missing source metadata, unstable dedupe keys, unclear duplicate policy, no fixtures for project filtering, or no projection contract for diagnostics and status grouping.

## Solution

Create a migration execution contract that gates live writes on three things:

- canonical source format: existing dry-run counts remain clean and generated records follow `/home/claude/shipflow/skills/references/operational-record-format.md`;
- web-reader contract: a technical doc and fixtures define how a future web app reads or projects `task`, `audit`, and `spec` records;
- recoverable migration: write mode produces deterministic file rewrites, count reports, duplicate diagnostics, and validation evidence before the chantier can move to `/sf-verify`.

The migration makes canonical traffic-first records the only active source format for operational records. Because the expected data volume is small, implementation must fully migrate all operational rows and must not keep legacy active tables or legacy snapshot sections in migrated files. Any unmapped row is a blocking migration defect that must be resolved before write mode.

## Scope In

- Define the web-reader data contract for traffic-first `task`, `audit`, and `spec` records.
- Define required source metadata for future web display and projection: `sourcePath`, `line`, `recordKind`, `traffic`, `project`, `title`, `fields`, `dedupeKey`, `rawLine`, `diagnostics`, and optional `sourceCommit`.
- Define migration write-mode behavior for `scripts/migrate_operational_records.py`.
- Convert active project-local trackers and master trackers only after the web-reader contract is validated.
- Insert or normalize top-of-file `spec:` operational summary lines in active specs while keeping YAML frontmatter authoritative.
- Preserve review evidence with deterministic counts before and after migration.
- Keep canonical-first reading in Flutter and TUI, with legacy fallback only during the pre-migration compatibility window.
- Update docs and maps so future web implementation uses the same contract.

## Scope Out

- Building the future web UI.
- Implementing Firestore, Firebase Auth, Cloud Functions, or hosted indexing.
- Removing legacy fallback readers permanently.
- Designing Markdown write-back, commits, branches, pull requests, or agent write workflows.
- Changing the operational record grammar beyond the approved traffic-first V1 contract.
- Migrating non-operational long-form reports, audit evidence, transcripts, or technical docs into one-line records.
- Creating new task or audit content unrelated to the migration.

## Constraints

- Markdown remains canonical. Any database or web index is a projection, cache, or sync layer.
- Live migration must be reversible through git diff and migration reports.
- The migration must not depend on hidden conversation context.
- The migration must not execute Markdown values, commands, links, inline code, or field contents.
- `spec:` summary records are operational summaries only; spec frontmatter and full body remain authoritative.
- `path` fields for spec records must be repository-relative where possible, not machine-absolute.
- The future web reader must not parse legacy tables for migrated files.
- Legacy compatibility remains a temporary read bridge before migration, not a valid writer format or post-migration source.
- No client-visible record or diagnostic may expose secrets, privileged tokens, tokenized clone URLs, or server clone paths.

## Legacy Migration Policy

The migration policy is zero legacy in migrated operational sources.

- Active operational task, audit, and spec summary data must be represented as canonical traffic-first records after migration.
- Legacy task and audit tables must be removed from migrated active tracker files once their rows are represented canonically.
- Legacy snapshot sections are not allowed in migrated files. If a row cannot be represented without loss, write mode must stop and report the unmapped row with file, line, and reason.
- Future web readers and projections must ignore legacy tables by contract. They may expose migration diagnostics, but they must not build database records from legacy tables after migration.
- Legacy fallback parser code may remain temporarily for pre-migration files and external compatibility, but migrated files must pass tests without depending on that fallback.

## Dependencies

- `traffic-first-markdown-operational-record-format.md` owns the grammar and parser/writer obligations.
- `/home/claude/shipflow/skills/references/operational-record-format.md` is the shared writer-skill contract.
- `markdown-source-of-truth.md` owns the rule that Markdown and GitHub remain authoritative.
- `code-docs-map.md` maps parser, migration, writer-skill, TUI, and future web-read surfaces.
- `shipflow-dashboard-readonly-projection.md` defines the dashboard as read-only projection consumer.
- `shipflow-firestore-data-model.md` defines projection vocabulary for source commit, indexed files, diagnostics, and user-scoped dashboard feeds.
- Fresh external docs: not needed for this spec because it defines local Markdown migration and reader contracts. Future Firebase, Firestore, hosting, or web framework implementation specs must re-check official docs before code.

## Invariants

- Every active operational record has a traffic marker at the start of the line.
- Every active operational record has `[project]` immediately after the traffic marker.
- Every task record has a non-empty `status`.
- Every audit record has `date`, `overall`, and `issues`.
- Every spec record has `status`, `path`, and `next`.
- Canonical records win over legacy records with the same dedupe key.
- Duplicate suppression is observable in diagnostics and count reports.
- A migrated file cannot rely on legacy sections as its primary active source.
- A web reader can filter by project without opening neighboring sections.
- A web reader can group by traffic/status without interpreting prose.
- A projection can be rebuilt from Markdown without trusting database state as canonical.

## Links & Consequences

- Flutter readers: `OperationalRecordParser` and task/audit/spec parsers must remain canonical-first and expose diagnostics.
- TUI readers: `/home/claude/shipflow/tui/src/sources/readers.ts` must remain canonical-first for the terminal dashboard.
- Future web app: must consume the same web-reader contract and fixtures instead of inventing a separate parser.
- Firestore/database projection: stores rebuildable summaries and source metadata, not canonical truth.
- Writer skills: after migration, new task, audit, and spec summaries must be written directly in traffic-first format.
- Docs: `markdown-source-of-truth.md`, `code-docs-map.md`, and a new web-reader contract doc must stay aligned.
- Operations: a failed migration must leave actionable file/line diagnostics and no hidden partial state.

## Documentation Coherence

- Create `shipflow_data/technical/operational-record-web-reader-contract.md`.
- Update `shipflow_data/technical/markdown-source-of-truth.md` to point to the live migration and web-reader contract once ready.
- Update `shipflow_data/technical/code-docs-map.md` with the web-reader contract and write-mode validation surface.
- Update the traffic-first format spec after live migration with the final counts and next lifecycle step.
- Keep `/home/claude/shipflow/skills/references/operational-record-format.md` as the grammar reference, not the migration execution plan.

## Edge Cases

- A migrated title contains `|`, backslash, brackets, inline code, or a command-like string.
- A legacy table row has project encoded in title text instead of a project column.
- A spec has valid frontmatter but a non-standard title heading.
- A spec already has a canonical `spec:` line that differs from frontmatter.
- A file has both canonical records and legacy rows for the same dedupe key.
- A master tracker contains project names with spaces, accents, or mixed casing.
- A future web projection reads a file without line numbers because it came from a preprocessed blob.
- A diagnostic references a file path outside the project root.
- A migrated file is too large for a future projection payload.
- A task is deferred or done but still operationally useful in historical views.
- A legacy row contains information that does not map into required canonical fields.
- A migration run finds a legacy row that would require a snapshot; this is a blocker, not a supported output state.

## Implementation Tasks

- [x] Task 1: Create the web-reader contract doc.
  - File: `shipflow_data/technical/operational-record-web-reader-contract.md`
  - Action: Define the normalized web read model, source metadata, required fields, dedupe keys, diagnostics, sorting/filtering fields, and projection-safe redaction rules.
  - User story link: Ensures the future web app can read migrated Markdown directly or through a rebuildable projection.
  - Depends on: this spec passing `/sf-ready`.
  - Validate with: `rg -n "sourcePath|dedupeKey|traffic|project|diagnostics|projection|web reader" shipflow_data/technical/operational-record-web-reader-contract.md`
  - Notes: This is the gate that turns a mechanical migration into an app-consumable source contract.

- [x] Task 2: Add shared fixture examples for web-reader behavior.
  - File: `test/data/shipflow_sources/fixtures/operational_records_web_reader.md`
  - Action: Add canonical task, audit, and spec records covering project filters, duplicate diagnostics, escaped fields, status grouping, and source metadata expectations.
  - User story link: Prevents future web implementation from inventing a divergent parser.
  - Depends on: Task 1.
  - Validate with: `flutter test test/data/shipflow_sources/parsers`
  - Notes: If the future web app is not Flutter, the fixture remains a cross-runtime Markdown contract.

- [x] Task 3: Extend parser tests for web-facing read-model fields.
  - File: `test/data/shipflow_sources/parsers/operational_record_parser_test.dart`
  - Action: Assert `project`, `kind`, `traffic`, `title`, `fields`, `source`, `line`, `rawLine`, malformed diagnostics, and duplicate expectations that the web-reader doc requires.
  - User story link: Proves that Markdown source can feed a web app without hidden normalization.
  - Depends on: Tasks 1-2.
  - Validate with: `flutter test test/data/shipflow_sources/parsers/operational_record_parser_test.dart`
  - Notes: Add model fields only if the web-reader contract requires fields the parser does not expose.

- [x] Task 4: Implement explicit write-mode planning in the migration script.
  - File: `scripts/migrate_operational_records.py`
  - Action: Add a write plan that refuses to run unless dry-run blockers are zero, web-reader contract and fixtures exist, required tests pass, and every target file has deterministic proposed output.
  - User story link: Prevents a massive source rewrite before the future app data contract exists.
  - Depends on: Tasks 1-3.
  - Validate with: `python3 scripts/migrate_operational_records.py --dry-run`
  - Notes: `--write` must remain refused until the plan reports all gates green.

- [x] Task 5: Implement recoverable write mode.
  - File: `scripts/migrate_operational_records.py`
  - Action: Implement `--write` with per-file deterministic rewrites, before/after counts, duplicate suppression report, changed-file list, and refusal on any ambiguous, malformed, or unmapped record.
  - User story link: Makes live migration safe enough to run on canonical source files.
  - Depends on: Task 4.
  - Validate with: `python3 scripts/migrate_operational_records.py --write --check-only` if implemented, then `python3 scripts/migrate_operational_records.py --dry-run`
  - Notes: Do not use an implicit destructive rewrite. The write command must make its targets and report path explicit.

- [x] Task 6: Migrate project-local active trackers.
  - File: `shipflow_data/workflow/TASKS.md` and `shipflow_data/workflow/AUDIT_LOG.md`
  - Action: Convert active operational rows to canonical traffic-first records and remove legacy active tables from migrated files.
  - User story link: Gives the app and raw reader a clean project-local source.
  - Depends on: Tasks 1-5.
  - Validate with: `python3 scripts/migrate_operational_records.py --dry-run` and `flutter test test/data/shipflow_sources`
  - Notes: Preserve non-operational prose only when it remains useful context.

- [x] Task 7: Migrate master trackers.
  - File: `/home/claude/shipflow_data/TASKS.md` and `/home/claude/shipflow_data/AUDIT_LOG.md`
  - Action: Convert master task/audit rows to canonical traffic-first records while preserving project identity and status semantics, then remove legacy active tables from migrated master files.
  - User story link: Enables cross-project filtering for the future web app.
  - Depends on: Tasks 1-6.
  - Validate with: `python3 scripts/migrate_operational_records.py --dry-run`
  - Notes: Master tracker edits are high blast radius; keep the diff reviewable and do not mix unrelated changes.

- [x] Task 8: Add canonical `spec:` summaries to active specs.
  - File: `shipflow_data/workflow/specs/*.md`
  - Action: Insert or normalize one top-of-file `spec:` summary line after `# Spec: ...` and before `## Title`, keeping frontmatter authoritative.
  - User story link: Lets the web app index specs without parsing full bodies first.
  - Depends on: Tasks 1-5.
  - Validate with: `python3 scripts/migrate_operational_records.py --dry-run` and metadata lint on touched specs.
  - Notes: `path` must be repository-relative.

- [x] Task 9: Update docs and ownership maps after migration.
  - File: `shipflow_data/technical/markdown-source-of-truth.md`, `shipflow_data/technical/code-docs-map.md`, and `/home/claude/shipflow/skills/references/operational-record-format.md`
  - Action: Record the live migration state, web-reader contract, validation commands, and zero-legacy post-migration policy.
  - User story link: Keeps future agents and the future web app aligned on one source contract.
  - Depends on: Tasks 6-8.
  - Validate with: `rg -n "operational-record-web-reader-contract|live migration|legacy fallback|traffic-first" shipflow_data/technical /home/claude/shipflow/skills/references/operational-record-format.md`
  - Notes: Do not weaken the grammar reference; add migration state outside the grammar when possible.

- [x] Task 10: Run final migration validation and record counts.
  - File: `shipflow_data/workflow/specs/traffic-first-operational-record-live-migration-web-reader-contract.md` and `shipflow_data/workflow/verification/traffic-first-operational-record-live-migration-web-reader-contract.md`
  - Action: Record final before/after counts, duplicate suppression counts, malformed count, target file list, validation commands, scenario results, and accepted exceptions in the verification checklist or execution report.
  - User story link: Gives `/sf-verify` a concrete proof surface.
  - Depends on: Tasks 1-9.
  - Validate with: `flutter test test/data/shipflow_sources`, `cd /home/claude/shipflow/tui && bun test && bun run typecheck`, metadata lint, and `git diff --check`
  - Notes: This task closes `/sf-start`; `/sf-verify` still owns final readiness review.

## Acceptance Criteria

- [x] AC 1: Given the future web-reader contract doc exists, when a future web app consumes a record, then it can rely on a stable normalized model without parsing legacy tables.
- [x] AC 2: Given the migration script runs in dry-run mode, then it reports zero ambiguous/skipped records before write mode is allowed.
- [x] AC 3: Given write mode runs, then every changed file has deterministic before/after counts and no partial rewrite.
- [x] AC 4: Given migrated `TASKS.md` files are opened raw, then active task records begin with traffic marker + `[project]`.
- [x] AC 5: Given migrated `AUDIT_LOG.md` files are opened raw, then active audit records begin with traffic marker + `[project]`.
- [x] AC 6: Given migrated specs are opened raw, then each active spec has one canonical `spec:` summary line with repository-relative `path`.
- [x] AC 7: Given Flutter parsers read migrated Markdown, then task/audit/spec records parse without needing legacy fallback for migrated active records.
- [x] AC 8: Given TUI readers read migrated Markdown, then project filtering and recent operational lists still work.
- [x] AC 9: Given a migrated tracker is read by Flutter, TUI, or the future web reader, then no displayed or projected record comes from a legacy table.
- [x] AC 10: Given a projection or future web reader displays migrated data, then every visible record is traceable to source path and record identity.

## Test Contract

- `surface`: local Markdown operational sources, migration tooling, Flutter parsers, TUI readers, web-reader contract docs, and rebuildable projection fields for `task`, `audit`, and `spec` records. Covered source files include `shipflow_data/workflow/TASKS.md`, `shipflow_data/workflow/AUDIT_LOG.md`, `shipflow_data/workflow/specs/*.md`, `/home/claude/shipflow_data/TASKS.md`, `/home/claude/shipflow_data/AUDIT_LOG.md`, `scripts/migrate_operational_records.py`, `lib/data/shipflow_sources/parsers/`, `test/data/shipflow_sources/`, and `/home/claude/shipflow/tui/src/sources/`.
- `proof_profile`: high-blast-radius local source migration proof. Required evidence is automated parser/migration checks, deterministic write-plan output, metadata lint, diff hygiene, and manual raw-Markdown review. No hosted service, auth provider, production deploy, Firestore write, or public web UI proof is in scope for this spec.
- `proof_order`:
  1. Create or update the web-reader contract doc and shared fixture before enabling migration write mode.
  2. Prove the parser read model with targeted Flutter parser tests, including source metadata, escaped values, malformed diagnostics, duplicate diagnostics, and no fallback dependency for migrated fixtures.
  3. Run `python3 scripts/migrate_operational_records.py --dry-run` and confirm zero ambiguous, skipped, malformed, duplicate-conflict, and unmapped operational rows.
  4. Run the write-plan or check-only mode and confirm every target file has deterministic proposed output, before/after counts, and no planned legacy snapshot output.
  5. Run recoverable write mode only after the prior gates are green.
  6. Re-run dry-run, Flutter parser tests, TUI checks, metadata lint, `git diff --check`, and targeted raw-Markdown review after the write.
  7. Record final counts, target files, diagnostics, exceptions, and scenario results in the verification checklist.
- `checklist_path`: `shipflow_data/workflow/verification/traffic-first-operational-record-live-migration-web-reader-contract.md`.
- `required_scenario_ids`:
  - `OR-WEB-001`: web-reader contract defines normalized fields, source metadata, dedupe keys, diagnostics, projection redaction, and sorting/filtering fields.
  - `OR-WEB-002`: shared fixture covers task, audit, and spec records, escaped values, duplicate diagnostics, malformed diagnostics, status grouping, and project filtering.
  - `OR-PARSE-001`: Flutter parser exposes the required read model and parses migrated fixtures without legacy-table fallback.
  - `OR-TUI-001`: TUI readers consume canonical records for migrated files without requiring legacy-table fallback.
  - `OR-MIG-001`: migration dry-run reports zero ambiguous, skipped, malformed, duplicate-conflict, and unmapped operational rows.
  - `OR-MIG-002`: write plan or check-only mode reports deterministic per-file output, before/after counts, duplicate suppression counts, and target file list.
  - `OR-MIG-003`: live write leaves canonical traffic-first operational records and no active legacy operational tables or legacy snapshot sections in migrated files.
  - `OR-SEC-001`: diagnostics are redacted, bounded, non-executable, and safe for future web projection.
  - `OR-DOC-001`: technical docs and shared ShipFlow grammar reference mention the web-reader contract, live migration state, and zero-legacy post-migration policy.
- `required_results`: all required scenario ids pass; all migrated records retain project, kind, title, traffic, required fields, dedupe key, source path, and parse status; unmapped legacy rows count is zero; active legacy operational table count is zero in migrated files; generated diagnostics contain no secrets, cookies, credentials, tokenized URLs, raw backend payloads, or unbounded excerpts; every changed source file is recoverable through git diff and recorded in the verification checklist.
- `exception_with_proof`: environment-specific test-tool unavailability may be accepted only when the unavailable command, reason, replacement proof, residual risk, and owner follow-up are recorded in the checklist. No exception may bypass the web-reader contract, zero-unmapped-row gate, zero-legacy post-migration gate, redaction gate, metadata lint, or diff hygiene.
- `exception_without_proof`: none. Write mode, `/sf-verify`, and closure must not proceed when a required result lacks proof.

## Test Strategy

- Run `python3 scripts/migrate_operational_records.py --dry-run` before and after implementation.
- Run parser tests with `flutter test test/data/shipflow_sources`.
- Run the targeted operational record parser test after adding web-reader fixtures.
- Run TUI checks with `cd /home/claude/shipflow/tui && bun test && bun run typecheck`.
- Run ShipFlow metadata lint on touched specs and docs.
- Run `git diff --check` in the project repo and targeted diff checks for `/home/claude/shipflow_data/TASKS.md`.
- Review migrated raw Markdown manually enough to confirm the source itself is readable without app rendering.

## Risks

- High blast radius: master trackers and spec summaries affect cross-project operations.
- Duplicate risk: before migration, canonical and legacy rows may coexist and produce double counting unless duplicate diagnostics are enforced.
- Projection risk: a future web app could treat projection rows as canonical unless the contract repeats Markdown authority.
- Path risk: absolute machine paths in `spec:` records would leak local filesystem details and break portability.
- Parser drift risk: Flutter, TUI, future web, and migration script can drift unless fixtures are shared.
- Redaction risk: diagnostics can expose sensitive paths or payloads if not constrained before web projection.

## Execution Notes

- Recommended proof path for `/sf-start`: evidence-first plus parser regression tests.
- Live migration should be sequential, not parallel, once write mode starts.
- Do not stage, commit, or ship automatically unless the invoked ShipFlow lifecycle step explicitly requires it.
- Do not remove legacy fallback parser code in this spec; closing fallback is a later cleanup after the migrated source has been verified. The migrated files themselves must not rely on legacy fallback.
- Treat `/home/claude/shipflow_data/` as a separate high-impact target; re-read files immediately before writing.
- The future web app may be Flutter web or another web surface; the contract is Markdown/read-model-first rather than framework-specific.

## Open Questions

None. Legacy policy is decided: migrated operational sources must have zero legacy active tables and no legacy snapshot sections; unmapped rows block write mode.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-23 20:50:34 UTC | sf-spec | GPT-5 Codex | Created spec for live traffic-first migration gated by future web-reader contract | draft | /sf-ready Traffic-first operational record live migration and web reader contract |
| 2026-05-29 22:01:15 UTC | sf-ready | GPT-5 Codex | Reviewed readiness for live migration and web-reader contract. | not ready: missing required Test Contract and unresolved legacy-table migration decision. | /sf-spec Traffic-first operational record live migration and web reader contract readiness fixes |
| 2026-05-30 07:00:15 UTC | sf-spec | GPT-5 Codex | Added zero-legacy migration policy and required Test Contract after user decision. | draft updated; ready for sf-ready review | /sf-ready Traffic-first operational record live migration and web reader contract |
| 2026-05-30 07:06:40 UTC | sf-ready | GPT-5 Codex | Reviewed corrected spec against readiness gate and manual-proof contract requirements. | not ready: Test Contract lacks required surface, proof_profile, proof_order, checklist_path, required_results, and exception fields. | /sf-spec Traffic-first operational record live migration and web reader contract test contract fields |
| 2026-05-30 07:17:15 UTC | sf-spec | GPT-5 Codex | Completed Test Contract with required proof fields, scenario ids, required results, and exception policy. | draft updated; ready for sf-ready review | /sf-ready Traffic-first operational record live migration and web reader contract |
| 2026-05-30 07:23:34 UTC | sf-ready | GPT-5 Codex | Reviewed readiness after Test Contract completion, zero-legacy policy, adversarial pass, and security pass. | ready | /sf-start Traffic-first operational record live migration and web reader contract |
| 2026-05-30 15:55:10 UTC | sf-start | GPT-5 Codex | Executed live migration tasks, added web-reader contract and fixtures, implemented write gates, and validated migration/reader/parser/TUI surfaces. | implemented | /sf-verify Traffic-first operational record live migration and web reader contract |
| 2026-05-30 16:05:11 UTC | sf-start | GPT-5 Codex | Re-ran required validations (`dry-run`, `write --check-only`, parser tests, TUI checks, metadata lint) and fixed verification artifact metadata to pass linter gates. | implemented | /sf-verify Traffic-first operational record live migration and web reader contract |
| 2026-05-30 15:38:54 UTC | sf-start | GPT-5 Codex | Integrated subagent output, fixed migration writer idempotence, applied final write cleanup, and re-ran targeted validation. | implemented | /sf-verify Traffic-first operational record live migration and web reader contract |
| 2026-05-30 15:42:48 UTC | sf-verify | GPT-5 Codex | Verified user story outcome, acceptance criteria, migration idempotence, parser/TUI compatibility, metadata lint, diff hygiene, docs coherence, and bug gate scope. | verified | /sf-end Traffic-first operational record live migration and web reader contract |
| 2026-05-30 16:24:08 UTC | sf-end | GPT-5 Codex | Closed the verified chantier, updated bookkeeping, and prepared the next ship step without committing or pushing. | closed | /sf-ship Traffic-first operational record live migration and web reader contract |
| 2026-05-30 16:47:00 UTC | sf-ship | GPT-5 Codex | Shipped the verified traffic-first operational record migration and web-reader contract changes. | shipped | /sf-prod shipflow_app |

## Current Chantier Flow

- `sf-spec`: done, readiness fixes added with zero-legacy policy and complete Test Contract fields.
- `sf-ready`: ready.
- `sf-start`: done.
- `sf-verify`: verified.
- `sf-end`: closed.
- `sf-ship`: shipped.

Next step: `/sf-prod shipflow_app`
