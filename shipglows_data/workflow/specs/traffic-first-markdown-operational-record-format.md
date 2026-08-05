---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-22"
created_at: "2026-05-22 10:00:44 UTC"
updated: "2026-05-22"
updated_at: "2026-05-22 12:27:09 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "traffic-first-markdown-operational-record-format"
owner: "Diane"
confidence: medium
user_story: "En tant qu'opératrice ShipGlows, je veux que les tâches, audits et specs utilisent des lignes Markdown traffic-first avec le projet visible au début, afin que les fichiers bruts, le TUI et la future application web lisent les mêmes signaux opérationnels sans normalisation divergente."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "ShipGlows Markdown trackers"
  - "shipglows_data/workflow/TASKS.md"
  - "shipglows_data/workflow/AUDIT_LOG.md"
  - "shipglows_data/workflow/specs/"
  - "/home/claude/shipglows_data/TASKS.md"
  - "/home/claude/shipglows_data/AUDIT_LOG.md"
  - "lib/data/shipglows_sources/parsers/"
  - "tui/src/sources/readers.ts"
  - "ShipGlows writer skills"
depends_on:
  - artifact: "explorations/2026-05-22-markdown-operational-record-format.md"
    artifact_version: "1.0.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipglows_data/technical/code-docs-map.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "/home/claude/shipglowz/shipglows_data/workflow/specs/shipglows-terminal-tui-v1.md"
    artifact_version: "0.1.0"
    required_status: "ready"
supersedes: []
evidence:
  - "User decision 2026-05-22: traffic-light marker should be at the beginning of operational lines."
  - "User decision 2026-05-22: project name should remain visible near the beginning because tasks and audits need project filtering."
  - "User decision 2026-05-22: Markdown files should be formatted correctly at the source, not only normalized by scripts."
  - "Exploration report 2026-05-22 recommends traffic-first operational records with structured attributes and migration compatibility."
  - "lib/data/shipglows_sources/parsers/tasks_parser.dart currently derives task state from project sections and table/status text."
  - "lib/data/shipglows_sources/parsers/audit_log_parser.dart currently expects Markdown audit tables with Date and Project columns."
  - "lib/data/shipglows_sources/parsers/specs_parser.dart currently parses spec frontmatter and flow sections."
  - "tui/src/sources/readers.ts already normalizes legacy tables into traffic-first display lines, proving the desired display shape."
next_step: "/sf-ready Traffic-first operational record live migration and web reader contract"
---

# Spec: Traffic-First Markdown Operational Record Format

🔴 [shipglows_app] task: Run /sf-verify for shipglows-github-managed-clone-indexer.md | status: todo | area: github-clone-indexer
## Title

Traffic-First Markdown Operational Record Format

## Status

Ready for `/sf-start`.

## User Story

En tant qu'opératrice ShipGlows, je veux que les tâches, audits et specs utilisent des lignes Markdown traffic-first avec le projet visible au début, afin que les fichiers bruts, le TUI et la future application web lisent les mêmes signaux opérationnels sans normalisation divergente.

## Minimal Behavior Contract

ShipGlows accepts operational Markdown records for tasks, audits, and specs as one-line records that begin with a traffic-light marker, immediately include the project in square brackets, identify the record kind, then expose stable inline fields for status, date, severity, next step, or source path as needed. Readers must parse the new traffic-first records first, tolerate legacy tables during migration, and produce diagnostics for malformed records without losing valid records from the same file. Writer skills must create and update the canonical line format directly so raw Markdown remains readable; the easy edge case to miss is making the TUI or web app look correct while the underlying Markdown still drifts across table, section, and display-only formats.

## Success Behavior

- Preconditions: Existing global and project-local ShipGlows trackers, specs, docs, parsers, and writer skills are present.
- Trigger: An implementation agent runs this spec through `/sf-start` after readiness approval.
- User/operator result: Raw `TASKS.md`, `AUDIT_LOG.md`, and spec files expose operational summary lines that start with `🔴`, `🟠`, `🟡`, or `🟢`, followed by `[project]`, and can be scanned without opening the app.
- System effect: Flutter readers, TUI readers, tests, docs, and ShipGlows writer protocols agree on one canonical operational record grammar while preserving legacy table compatibility during migration.
- Success proof: Parser tests, TUI tests, migration dry-run/proof, metadata lint, and direct raw Markdown review show no lost task, audit, or spec records.
- Silent success: Not allowed. The implementation must leave visible docs, tests, and changed source files proving the new contract.

## Error Behavior

- Expected failures: Missing project prefix, unsupported traffic marker, unknown record kind, invalid date, malformed field separator, missing required field, duplicate record id if ids are introduced, or legacy table row with mismatched cells.
- User/operator response: Readers emit source diagnostics with file, line, excerpt, and suggested ShipGlows command instead of silently dropping the entire file.
- System effect: Valid records in the same file continue to parse; malformed records are isolated and legacy rows remain readable until the migration window is closed by a later spec.
- Must never happen: Writer skills must not create tracker entries without project identity; parsers must not execute Markdown content; migration must not delete legacy information without a recoverable diff; diagnostics must not dump secrets or large logs.
- Silent failure: Not allowed. Parser and migration failures must be visible in tests, diagnostics, or command output.

## Problem

ShipGlows Markdown files are the canonical operational source, but current task and audit trackers rely heavily on wide tables and project sections. The TUI has started converting those tables into readable traffic-first display lines, yet the raw Markdown still varies by file and workflow. This makes the source harder to scan, forces each app surface to repeat normalization logic, and allows writer skills to keep creating divergent formats.

The upcoming web reader makes this more important: if Markdown remains canonical, then canonical Markdown should already carry the clearest operational shape instead of depending on every consumer to repair presentation.

## Solution

Define a canonical traffic-first operational record line format for tasks, audits, and spec summary/index records. Update project docs, shared ShipGlows writer-skill references, Flutter parsers, TUI readers, tests, and migration tooling so new records are created correctly at the source while old tables remain readable during a controlled compatibility period.

Canonical baseline:

```text
<traffic> [<project>] <kind>: <title> | <field>: <value> | <field>: <value>
```

Allowed traffic markers:

```text
```

Legacy `✅` can be read as `🟢`, but new writer output must use `🟢` for green operational records.

Task record examples:

```text
```

Audit record examples:

```text
```

Spec operational summary examples:

```text
```

Specs still keep YAML frontmatter and full contract sections. The traffic-first line is their operational summary for raw scanning and index readers, not a replacement for frontmatter.

## Operational Record Grammar v1

Canonical records are one physical Markdown line with this exact shape:

```text
<traffic> [<project>] <kind>: <title> | <field>: <value> | <field>: <value>
```

Canonical writer output MUST follow that shape exactly:

- `traffic` is one of `🔴`, `🟠`, `🟡`, or `🟢`.
- Legacy `✅` is read as `🟢` only during migration and fallback parsing; new writer output must use `🟢`.
- `[project]` is required immediately after the traffic marker, with one single ASCII space on each side of the token boundary shown in the canonical shape.
- Project names are compared case-insensitively for matching, but the original casing is preserved for display.
- Project names MUST NOT contain raw `[` or `]`.
- `kind` is one of `task`, `audit`, or `spec`.
- `title` is the first field value segment after `<kind>: ` and may contain colons after the first `: `.
- Additional fields use the exact separator ` | `.
- Each field uses `key: value`, with one colon-space boundary that splits key from value only on the first `: ` in that field.
- Newlines are forbidden inside a one-line record. Writers must escape newline content rather than emit raw line breaks.
- Canonical whitespace is single-space only at structural boundaries; leading indentation and trailing spaces are not part of the canonical form.
- Parsers MAY trim the line ends before parsing, but they MUST preserve internal spaces that belong to titles or values.
- Unknown fields are preserved as data, but ignored unless a downstream consumer explicitly requires them.
- Markdown links, inline code, and other Markdown inline syntax are treated as plain text by parsers and readers; they are never executed or rendered as commands.

Escaping rules for field text:

- `\|` stands for a literal pipe.
- `\\` stands for a literal backslash.
- `\n` stands for a literal newline in source text that must remain one logical field value.
- `\[` and `\]` stand for literal bracket characters in field values.
- The backslash only escapes the next supported character; all other backslashes are preserved as literal text.
- The project token itself is not escaped and does not allow bracket characters.

Required fields by record kind:

| Kind | Required fields | Optional fields | Value rules |
| --- | --- | --- | --- |
| `task` | `status` | `area`, `id` | `status` is required and must be a non-empty workflow state token; canonical output uses lower-case workflow labels such as `todo`, `in_progress`, `blocked`, `done`, or `ready` when that state is meaningful in the source. |
| `audit` | `date`, `overall`, `issues` | `id`, `scope` if the title alone does not identify the audit | `date` must be an ISO `YYYY-MM-DD` value; `overall` must be a short severity grade token such as `A`, `B`, `C`, `D`, `F`, or an explicitly documented equivalent; `issues` must be a concise summary token or count string that remains stable for dedupe and display. |
| `spec` | `status`, `path`, `next` | `id` | `status` must be a spec lifecycle state already used by the frontmatter contract, typically `draft`, `reviewed`, or `ready`; `path` must be a repository-relative Markdown path; `next` must be a short command or next-step label, not executable by parsers. |

Spec summary placement:

- Canonical `spec:` summary lines belong immediately after the `# Spec: ...` title block and before the `## Title` section.
- That placement is the robust convention because it keeps the summary visible at the top of the file while staying compatible with the existing spec template.
- Legacy specs that place a `spec:` line later under `## Title` may still be read during migration, but readers must prefer the top-of-file canonical summary when both exist and must emit a duplicate diagnostic for the later copy.

Deduplication and diagnostics:

- Dedupe keys are per record kind, never cross-kind.
- `task`: primary key is normalized project + `id` when `id` exists; otherwise normalized project + normalized title + normalized `area` when present.
- `audit`: primary key is normalized project + `id` when `id` exists; otherwise normalized project + normalized `date` + normalized `overall` + normalized `scope` or normalized title.
- `spec`: primary key is normalized project + `id` when `id` exists; otherwise normalized project + normalized `path`; if `path` is unavailable in a legacy scan, use normalized project + normalized title as the fallback key.
- Canonical traffic-first records take priority over legacy table rows with the same dedupe key.
- If both canonical and legacy representations map to the same key, the canonical line survives and the legacy row is suppressed with a duplicate diagnostic.
- If multiple canonical records map to the same key, the first canonical record in source order survives and later duplicates emit diagnostics that include the file and line references when available.
- Diagnostics for duplicate records MUST identify the winning record type, the suppressed duplicate type, and the source location when the parser can determine it.

Execution Batches:

1. Batch 1, contract and docs: update the shared contract and the supporting documentation first.
2. Batch 2, parsers and tests: Flutter parsers/tests and TUI readers/tests may run in parallel only after Batch 1 is complete and only when their file ownership is disjoint.
3. Batch 3, writer skills: writer skills may run in parallel with Batch 2 only when their write scopes are disjoint and the shared reference already exists; otherwise they must wait for Batch 2 to finish.
4. Batch 4, migration dry-run: run the migration dry-run after Batch 2 and Batch 3 have established compatible read and write behavior.
5. Batch 5, live migration: perform the live migration sequentially after the dry-run has passed and duplicate handling is understood.

No later batch may start when an earlier batch still has an unresolved contract, parser, or writer conflict.

## Scope In

- Define the canonical operational record grammar for `task`, `audit`, and `spec` records.
- Require project identity on every operational record as `[project]` immediately after the traffic marker.
- Require traffic-light markers at the beginning of operational record lines for source readability.
- Update `shipglows_data/technical/markdown-source-of-truth.md` with grammar, field rules, examples, diagnostics, and compatibility policy.
- Update `shipglows_data/technical/code-docs-map.md` with parser and writer update triggers if ownership changes.
- Add a shared ShipGlows-owned reference for writer skills, for example `/home/claude/shipglowz/skills/references/operational-record-format.md`.
- Update writer skills that create or mutate tasks, audit logs, spec summaries, or chantier flow records to use the shared reference.
- Update Flutter source parsers under `lib/data/shipglows_sources/parsers/` to parse traffic-first records before falling back to legacy tables.
- Update TUI readers under `tui/src/sources/` to parse the canonical format directly and keep legacy table fallback.
- Add or update tests for old and new task, audit, and spec record formats.
- Add migration tooling or a documented migration checklist that converts existing global and project-local trackers without data loss.
- Migrate active tracker files and active spec operational summaries only after parser compatibility and writer-skill updates are validated.

## Scope Out

- No redesign of the Flutter dashboard UI.
- No redesign of the terminal TUI layout beyond reading the canonical source format.
- No database, Firestore, Firebase, GitHub App, clone runner, or remote projection behavior change.
- No write-back from the TUI.
- No replacement of spec YAML frontmatter or detailed spec sections.
- No forced flattening of long audit evidence, verification reports, or detailed technical docs into one-line records.
- No deletion of legacy tables until a later verification/cleanup step proves all readers and writer skills are migrated.
- No public product claim that the future web app is complete.

## Constraints

- Markdown files remain canonical.
- Raw operational lines should be readable without app rendering.
- New operational record lines start with one of `🔴`, `🟠`, `🟡`, or `🟢`.
- Project identity appears immediately after the traffic marker as `[project]`.
- Record kind is explicit: `task:`, `audit:`, or `spec:`.
- Inline fields use ` | ` as the field separator and `key: value` as the field shape.
- Titles and field values must not require multiline parsing for the core record.
- Parsers must preserve backward compatibility with current tables during migration.
- Writer skills must not invent alternate compact formats unless the shared reference explicitly allows them as display-only output.
- Detailed spec frontmatter remains authoritative for spec metadata when it conflicts with a summary line; conflicts must produce diagnostics.
- A spec/frontmatter conflict remains unresolved until the parser emits a diagnostic and the source is corrected; readers must not silently pick one side without reporting the mismatch.
- Readers must never execute Markdown, commands, links, or inline field values.
- Diagnostics must avoid leaking secrets and must truncate large excerpts.

## Dependencies

- Runtime:
  - Flutter/Dart parsers in `lib/data/shipglows_sources/parsers/`.
  - TUI TypeScript readers in `tui/src/sources/`.
  - ShipGlows-owned skills and references under `/home/claude/shipglowz/skills/`.
  - Global trackers under `/home/claude/shipglows_data/`.
- Document contracts:
  - `explorations/2026-05-22-markdown-operational-record-format.md@1.0.0`.
  - `shipglows_data/technical/markdown-source-of-truth.md@0.1.0`.
  - `shipglows_data/technical/code-docs-map.md@0.1.0`.
  - `/home/claude/shipglowz/shipglows_data/workflow/specs/shipglows-terminal-tui-v1.md@0.1.0`.
- Metadata gaps:
  - Several existing trackers are not frontmatter artifacts, so migration proof must rely on record counts, diffs, and parser tests rather than artifact metadata.
  - Some existing ShipGlows writer skills may encode tracker write rules only in prose; readiness must identify the exact skills to patch.
- Fresh external docs: not needed. This spec changes local Markdown conventions, local parsers, local tests, and local ShipGlows skill instructions; it does not depend on external SDK, framework, API, auth, build, routing, or service behavior.

## Invariants

- A human can scan active tasks, audits, and spec summaries in raw Markdown and see severity/status first, project second, kind/title third.
- A future web reader can parse the same canonical records without duplicating TUI-only table normalization.
- Existing task and audit information is not lost during migration.
- New writer output is canonical even while readers support legacy input.
- Legacy input compatibility is a migration bridge, not a license for new non-canonical output.
- Project filters work for tasks, audits, and specs because every operational record carries project identity.
- Spec files keep their frontmatter and lifecycle sections; the operational record is a summary/index affordance.
- Audit evidence can remain detailed Markdown below or beside the summary record.
- Parser diagnostics are additive and local to bad records.

## Links & Consequences

- Upstream systems:
  - Writer skills such as `sf-tasks`, `sf-audit*`, `sf-review`, `sf-start`, `sf-verify`, `sf-end`, and `sf-docs` can create or mutate operational records and must share the same contract.
  - Existing global and project-local Markdown trackers provide migration input.
  - Existing specs provide spec summary/input data through frontmatter and current chantier flow.
- Downstream systems:
  - Flutter dashboard source readers and project health builders consume parsed task, audit, and spec state.
  - Terminal TUI readers consume task, audit, and spec summaries for cross-project views and project filtering.
  - Future web app readers should consume the canonical operational record format directly.
  - `/sf-ready` and `/sf-verify` must be able to validate the spec and migration proof.
- Cross-cutting checks:
  - Security: Markdown remains untrusted input. Parsers must not execute field values or commands.
  - Data integrity: Migration must preserve counts, titles, statuses, project names, dates, issue counts, and next steps.
  - Performance: Parsers should remain line-oriented and avoid whole-repo expensive scans outside existing reader boundaries.
  - Ops: Validation commands must run locally without Android builds, cloud deploys, or external network.
  - Docs: Source-of-truth and code-doc maps must reflect the new contract before writer skills rely on it.

## Documentation Coherence

- Update `shipglows_data/technical/markdown-source-of-truth.md` with the operational record grammar, examples, required fields, legacy compatibility, diagnostics, and migration policy.
- Update `shipglows_data/technical/code-docs-map.md` if parser ownership, validation commands, or update triggers change.
- Update `shipglows_data/technical/terminal-tui.md` so the TUI docs describe canonical record parsing instead of display-only normalization.
- Add `/home/claude/shipglowz/skills/references/operational-record-format.md` as the shared writer contract for skills.
- Update writer skill bodies or references so future skill runs produce canonical source lines.
- Update `tui/README.md` if TUI validation or source format expectations change.
- Do not update public marketing copy; this is an internal source-format contract.

## Edge Cases

- A task title contains `|`; the migration must either escape it or move the detail to a field value with documented escaping.
- A title contains `:`, commands, Markdown links, or inline code.
- A field value contains a raw newline or an unescaped bracket and therefore cannot be serialized without escaping.
- A project name contains spaces, underscores, mixed case, or brackets.
- A local tracker omits a `Project` column and currently relies on local project inference.
- A global tracker has both dashboard summary rows and per-project task rows.
- A legacy audit table has no `Project` column and must use the local project fallback.
- A spec frontmatter status conflicts with the spec operational record status.
- A spec has no operational record because it predates the new contract.
- A record starts with `✅`; readers can normalize it to green, but writers must not emit it for new records.
- A malformed record appears between valid records.
- A future Markdown renderer collapses adjacent plain lines; app renderers must treat operational records as records, not rely on generic paragraph rendering.
- A migration script sees duplicate legacy rows.
- A writer skill appends a canonical line but leaves a stale legacy table row that creates duplicate dashboard records.
- A parser changes task/audit counts and masks data loss as "better filtering".

## Implementation Tasks

- [ ] Task 1: Create the shared operational record contract.
  - File: `/home/claude/shipglowz/skills/references/operational-record-format.md`
  - Action: Define grammar, allowed traffic markers, required fields per kind, escaping rules, legacy compatibility, examples, diagnostics, and writer obligations.
  - User story link: Establishes one source convention for raw Markdown, TUI, and future web readers.
  - Depends on: This spec passing `/sf-ready`.
  - Validate with: `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py /home/claude/shipglowz/skills/references/operational-record-format.md`
  - Notes: Keep the reference concise enough for writer skills to load without duplicating examples in every skill.

- [ ] Task 2: Update project source-of-truth docs.
  - File: `shipglows_data/technical/markdown-source-of-truth.md`
  - Action: Add the traffic-first operational record contract, migration phase, reader fallback policy, and diagnostics expectations.
  - User story link: Makes the canonical Markdown convention explicit in the app's technical contract.
  - Depends on: Task 1.
  - Validate with: `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py shipglows_data/technical/markdown-source-of-truth.md`
  - Notes: State that detailed specs and audit evidence remain structured Markdown; only operational summary/index records require the line grammar.

- [ ] Task 3: Update documentation ownership map.
  - File: `shipglows_data/technical/code-docs-map.md`
  - Action: Add update triggers for operational record grammar, Flutter parser changes, TUI parser changes, migration tooling, and writer-skill references.
  - User story link: Prevents future parser or skill changes from drifting away from the new convention.
  - Depends on: Task 2.
  - Validate with: `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py shipglows_data/technical/code-docs-map.md`
  - Notes: Mention the shared ShipGlows-owned reference by absolute path because it lives outside the project repo.

- [ ] Task 4: Add Flutter operational record parser primitives.
  - File: `lib/data/shipglows_sources/parsers/operational_record_parser.dart`
  - Action: Implement a line-oriented parser for traffic-first records with record kind, traffic marker, project, title, fields, source line, and diagnostics.
  - User story link: Gives the Flutter dashboard a direct reader for the canonical source format.
  - Depends on: Task 2.
  - Validate with: `flutter test test/data/shipglows_sources`
  - Notes: Do not execute commands or links from field values. Preserve line numbers for diagnostics.

- [ ] Task 5: Extend parsed models for canonical records.
  - File: `lib/data/shipglows_sources/parsers/parsed_models.dart`
  - Action: Add typed record models or extend existing models so task, audit, and spec parsers can expose project, traffic, status, title/scope, date, issues, path, next step, and source metadata.
  - User story link: Lets filters and UI surfaces rely on project and severity consistently.
  - Depends on: Task 4.
  - Validate with: `flutter test test/data/shipglows_sources`
  - Notes: Keep backward-compatible fields used by existing dashboard code until the UI layer is deliberately updated.

- [ ] Task 6: Update task parsing with canonical-first fallback.
  - File: `lib/data/shipglows_sources/parsers/tasks_parser.dart`
  - Action: Parse `task:` operational records first, preserve legacy section/table counting as fallback, and emit diagnostics for malformed task records.
  - User story link: Makes tasks readable and filterable by project from the source line.
  - Depends on: Task 4 and Task 5.
  - Validate with: `flutter test test/data/shipglows_sources`
  - Notes: New output should not double-count the same legacy row after migration.

- [ ] Task 7: Update audit parsing with canonical-first fallback.
  - File: `lib/data/shipglows_sources/parsers/audit_log_parser.dart`
  - Action: Parse `audit:` operational records with date, project, scope/title, overall, and issues fields, then fall back to legacy audit tables.
  - User story link: Makes audits visible and filterable by project without relying on wide table columns.
  - Depends on: Task 4 and Task 5.
  - Validate with: `flutter test test/data/shipglows_sources`
  - Notes: Local audit files without project fields must use the configured local project only for legacy fallback, not for malformed canonical records.

- [ ] Task 8: Update spec parsing for operational summaries.
  - File: `lib/data/shipglows_sources/parsers/specs_parser.dart`
  - Action: Read optional `spec:` operational record lines from spec bodies, compare them with frontmatter, and emit diagnostics when title/status/path/next step conflicts matter for dashboard display.
  - User story link: Makes specs part of the same traffic-first scanning contract while preserving frontmatter authority.
  - Depends on: Task 4 and Task 5.
  - Validate with: `flutter test test/data/shipglows_sources`
  - Notes: Missing operational records in legacy specs should be warnings during migration, not hard errors.

- [ ] Task 9: Add Flutter parser tests and fixtures.
  - File: `test/data/shipglows_sources/parsers/operational_record_parser_test.dart`
  - Action: Cover valid task/audit/spec records, legacy fallback, malformed lines, escaping, project names, `✅` legacy normalization, and conflict diagnostics.
  - User story link: Proves the canonical format is machine-readable and migration-safe.
  - Depends on: Tasks 4-8.
  - Validate with: `flutter test test/data/shipglows_sources`
  - Notes: Add or split task/audit/spec parser test files if that is clearer than one large test file.

- [ ] Task 10: Update TUI source readers to parse canonical records.
  - File: `tui/src/sources/readers.ts`
  - Action: Parse operational records directly before legacy table summarization, preserve project filtering behavior, and prevent duplicate records when both canonical and legacy forms exist.
  - User story link: Aligns the terminal dashboard with the canonical Markdown source instead of relying on display-only normalization.
  - Depends on: Task 1 shared contract.
  - Validate with: `cd tui && bun test && bun run typecheck`
  - Notes: Extract a small TypeScript helper such as `tui/src/sources/operationalRecords.ts` if it keeps `readers.ts` readable.

- [ ] Task 11: Update TUI docs and tests.
  - File: `tui/test/readers.test.ts`
  - File: `tui/README.md`
  - File: `shipglows_data/technical/terminal-tui.md`
  - Action: Add tests proving canonical task, audit, and spec lines render traffic-first, preserve project prefixes, support project filtering, and keep legacy fallback, then align the TUI docs with that same source-format contract.
  - User story link: Ensures the terminal view matches raw Markdown and catches future drift.
  - Depends on: Task 10.
  - Validate with: `cd tui && bun test && bun run typecheck`
  - Notes: Keep the docs aligned with the tests so the reader contract stays visible to maintainers and operators.

- [ ] Task 12: Update writer skills to use the shared format.
  - File: `/home/claude/shipglowz/skills/sf-tasks/SKILL.md`
  - Action: Load or reference the shared operational record contract and require new task writes/updates to emit canonical `task:` records.
  - User story link: Prevents future task entries from reintroducing non-canonical formats.
  - Depends on: Task 1.
  - Validate with: `rg -n "operational-record-format|TASKS.md|task:" /home/claude/shipglowz/skills/sf-tasks/SKILL.md`
  - Notes: If `sf-tasks` delegates write protocol to a reference file, patch that reference instead and keep the skill body small.

- [ ] Task 13: Update audit writer skills to use the shared format.
  - File: `/home/claude/shipglowz/skills/sf-audit/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-a11y/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-code/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-components/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-copy/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-copywriting/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-design/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-design-tokens/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-gtm/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-seo/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-audit-translate/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-deps/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-perf/SKILL.md`
  - Action: Update the shared audit write protocol across these exact skill files so new audit log entries emit canonical `audit:` records.
  - User story link: Makes audit logs readable and filterable by project at the source.
  - Depends on: Task 1.
  - Validate with: `rg -n "operational-record-format|AUDIT_LOG.md|audit:" /home/claude/shipglowz/skills/sf-audit/SKILL.md /home/claude/shipglowz/skills/sf-audit-a11y/SKILL.md /home/claude/shipglowz/skills/sf-audit-code/SKILL.md /home/claude/shipglowz/skills/sf-audit-components/SKILL.md /home/claude/shipglowz/skills/sf-audit-copy/SKILL.md /home/claude/shipglowz/skills/sf-audit-copywriting/SKILL.md /home/claude/shipglowz/skills/sf-audit-design/SKILL.md /home/claude/shipglowz/skills/sf-audit-design-tokens/SKILL.md /home/claude/shipglowz/skills/sf-audit-gtm/SKILL.md /home/claude/shipglowz/skills/sf-audit-seo/SKILL.md /home/claude/shipglowz/skills/sf-audit-translate/SKILL.md /home/claude/shipglowz/skills/sf-deps/SKILL.md /home/claude/shipglowz/skills/sf-perf/SKILL.md`
  - Notes: Patch common references before individual skill bodies where possible to avoid divergent instructions.

- [ ] Task 14: Update lifecycle/spec writer skills for spec operational summaries.
  - File: `/home/claude/shipglowz/skills/sf-spec/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-ready/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-start/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-verify/SKILL.md`
  - File: `/home/claude/shipglowz/skills/sf-end/SKILL.md`
  - Action: Require new or updated specs to include a `spec:` operational summary line in the body while keeping frontmatter and `Current Chantier Flow` authoritative.
  - User story link: Makes specs visible in the same traffic-first format as tasks and audits.
  - Depends on: Task 1.
  - Validate with: `rg -n "operational-record-format|spec:" /home/claude/shipglowz/skills/sf-spec/SKILL.md /home/claude/shipglowz/skills/sf-ready/SKILL.md /home/claude/shipglowz/skills/sf-start/SKILL.md /home/claude/shipglowz/skills/sf-verify/SKILL.md /home/claude/shipglowz/skills/sf-end/SKILL.md`
  - Notes: Include `sf-ready`, `sf-start`, `sf-verify`, and `sf-end` only where they mutate spec status, run history, or chantier flow.

- [ ] Task 15: Add migration tooling or a deterministic migration checklist.
  - File: `scripts/migrate_operational_records.py`
  - Action: Convert current global and project-local task/audit tables and active spec summaries into canonical records with dry-run output, before/after counts, and duplicate detection.
  - User story link: Moves existing canonical Markdown to the readable source format without losing data.
  - Depends on: Tasks 4-9 and Tasks 12-14.
  - Validate with: `python3 scripts/migrate_operational_records.py --dry-run`
  - Notes: Use a script only if it can be deterministic and reviewable. Otherwise create a documented checklist plus fixture proof before manual migration.

- [ ] Task 16: Migrate active Markdown sources after compatibility is proven.
  - File: `shipglows_data/workflow/TASKS.md`
  - File: `shipglows_data/workflow/AUDIT_LOG.md`
  - File: `shipglows_data/workflow/specs/*.md`
  - File: `/home/claude/shipglows_data/TASKS.md`
  - File: `/home/claude/shipglows_data/AUDIT_LOG.md`
  - Action: Replace active task and audit operational index entries plus active spec summary lines with canonical traffic-first records, preserving legacy details where still needed and using the dry-run to identify which spec files under the glob are active.
  - User story link: Delivers the user's desired readable Markdown source, not only parser support.
  - Depends on: Task 15.
  - Validate with: `flutter test test/data/shipglows_sources && cd tui && bun test && bun run typecheck`
  - Notes: Do not migrate unrelated archived evidence unless it is an active operational index.

- [ ] Task 17: Run final coherence validation.
  - File: `shipglows_data/workflow/specs/traffic-first-markdown-operational-record-format.md`
  - Action: Verify docs, parsers, TUI, writer skills, and migrated Markdown agree on the same grammar and that legacy compatibility remains intentional.
  - User story link: Confirms the whole workflow reads and writes the same convention.
  - Depends on: Tasks 1-16.
  - Validate with: `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py shipglows_data/technical/markdown-source-of-truth.md shipglows_data/technical/code-docs-map.md shipglows_data/workflow/specs/traffic-first-markdown-operational-record-format.md && flutter test test/data/shipglows_sources && cd tui && bun test && bun run typecheck`
  - Notes: This spec should then move to `/sf-verify` before closure.

## Acceptance Criteria

- [ ] AC 1: Given a task record such as `🔴 [shipglows_app] task: Run /sf-verify | status: todo`, when Flutter and TUI readers parse it, then both expose traffic `🔴`, project `shipglows_app`, kind `task`, title `Run /sf-verify`, and status `todo`.
- [ ] AC 2: Given an audit record with `date`, `overall`, and `issues` fields, when readers parse it, then audit views can sort/filter by project and date without needing a Markdown table.
- [ ] AC 3: Given a spec file with frontmatter and a `spec:` operational record, when the spec parser reads it, then it preserves frontmatter authority and reports a diagnostic if the summary conflicts with frontmatter status or title.
- [ ] AC 4: Given legacy task and audit tables, when readers parse them during migration, then existing dashboard/TUI views still show records and mark legacy fallback behavior in diagnostics or tests.
- [ ] AC 5: Given both canonical and legacy representations of the same migrated record, when readers parse the source, then they avoid duplicate active records.
- [ ] AC 6: Given a malformed operational record missing `[project]`, when readers parse the file, then they emit a line-specific diagnostic and continue parsing valid neighboring records.
- [ ] AC 7: Given a writer skill creates a new task, audit, or spec summary, when its instructions are followed, then the resulting Markdown line starts with a traffic marker and includes `[project]` before the record kind.
- [ ] AC 8: Given existing global and local tracker files, when migration runs in dry-run mode, then it reports before/after record counts and a reviewable diff without modifying files.
- [ ] AC 9: Given migration is applied, when parser and TUI tests run, then no task, audit, or active spec summary is lost relative to pre-migration fixtures.
- [ ] AC 10: Given raw Markdown is opened in a terminal or editor, when reading active task, audit, and spec summary sections, then severity/status and project are visible at the beginning of each operational line.

## Test Strategy

- Unit:
  - `flutter test test/data/shipglows_sources` for Dart parser primitives, task parser, audit parser, spec parser, diagnostics, and legacy fallback.
  - `cd tui && bun test` for TypeScript reader parsing, dedupe, filtering, and rendering summaries.
- Integration:
  - Migration dry-run against copies or fixtures of current `TASKS.md`, `AUDIT_LOG.md`, and selected specs.
  - Parser fixture proving old tables and new records produce equivalent record counts before cleanup.
- Manual:
  - Open migrated `TASKS.md`, `AUDIT_LOG.md`, and active specs in raw Markdown and confirm the first visible character of each operational record is the traffic marker.
  - Use the TUI project filter to inspect tasks, audits, and specs for at least `shipglows_app` and one global project.
  - Review writer skill diffs to confirm new instructions point to the shared reference instead of duplicating incompatible examples.

## Risks

- Security impact: yes, mitigated by treating Markdown as untrusted text, avoiding command execution, preserving source allowlists, redacting diagnostics, and truncating excerpts.
- Product/data/performance risk: high, because tracker migration and writer protocol changes can affect multiple projects and app surfaces. Mitigate with compatibility parsers, dry-run migration, count checks, tests, and no deletion of legacy detail until verified.
- Workflow risk: high, because several skills may continue writing old tables if only the app parsers are updated. Mitigate by creating a shared ShipGlows-owned reference and updating writer skills before migrating live files.
- Readability risk: medium, because plain lines may render as one paragraph in generic Markdown. Mitigate by making app readers treat operational lines as records and documenting that raw source readability in editors/terminals takes priority over generic Markdown bullet rendering.
- Grammar drift risk: medium, because compact display lines are tempting. Mitigate by defining compact output as display-only unless it matches the canonical `kind: title | field: value` grammar.

## Execution Notes

- Read first:
  - `explorations/2026-05-22-markdown-operational-record-format.md`
  - `shipglows_data/technical/markdown-source-of-truth.md`
  - `shipglows_data/technical/code-docs-map.md`
  - `lib/data/shipglows_sources/parsers/tasks_parser.dart`
  - `lib/data/shipglows_sources/parsers/audit_log_parser.dart`
  - `lib/data/shipglows_sources/parsers/specs_parser.dart`
  - `tui/src/sources/readers.ts`
  - `/home/claude/shipglowz/skills/references/operational-record-format.md` once created
- Implementation order:
  1. Define the shared contract.
  2. Update docs.
  3. Add parser primitives and tests.
  4. Update Flutter and TUI readers with legacy fallback.
  5. Update writer skills.
  6. Add dry-run migration proof.
  7. Migrate active sources.
  8. Run final coherence validation.
- Validate with:
  - `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py shipglows_data/workflow/specs/traffic-first-markdown-operational-record-format.md`
  - `python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py shipglows_data/technical/markdown-source-of-truth.md shipglows_data/technical/code-docs-map.md`
  - `flutter test test/data/shipglows_sources`
  - `cd tui && bun test && bun run typecheck`
  - `python3 scripts/migrate_operational_records.py --dry-run` if the migration script is implemented.
- Stop conditions:
  - A field cannot be escaped with the supported grammar, including `|`, `\`, newline, or bracket content that must remain in a one-line record.
  - Migration dry-run shows record loss, ambiguous duplicate mapping, or a project that cannot be inferred from a legacy record without guessing.
  - Parser compatibility would require weakening project identity on canonical records.
  - A spec/frontmatter conflict remains unresolved after parsing and diagnostics.
  - Any writer outside `/home/claude/shipglowz/skills` is still emitting legacy tracker format after the shared contract is introduced.
  - A security review finds Markdown fields could be treated as executable commands by any consumer.

## Open Questions

None.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-05-22 10:00:44 UTC | sf-spec | GPT-5 Codex | Created spec for traffic-first Markdown operational records from the 2026-05-22 exploration and user direction | draft | /sf-ready Traffic-first Markdown operational record format |
| 2026-05-22 11:56:59 UTC | sf-build | GPT-5 Codex | Readiness patch via delegated worker | partial | /sf-ready Traffic-first Markdown operational record format |
| 2026-05-22 12:01:28 UTC | sf-build | GPT-5 Codex | Readiness patch to resolve review blockers in the spec | partial | /sf-ready Traffic-first Markdown operational record format |
| 2026-05-22 12:05:26 UTC | sf-build | GPT-5 Codex | Readiness patch for final blockers in the spec | partial | /sf-ready Traffic-first Markdown operational record format |
| 2026-05-22 12:06:33 UTC | sf-ready | GPT-5 Codex | Validated readiness after delegated adversarial review and spec patches | ready | /sf-start Traffic-first Markdown operational record format |
| 2026-05-22 12:08:22 UTC | sf-start | GPT-5 Codex | Batch 1 contract and docs: created shared operational record reference and updated source-of-truth/code-doc map | partial | /sf-start Traffic-first Markdown operational record format Batch 2 |
| 2026-05-22 12:27:09 UTC | sf-build | GPT-5 Codex | Implemented parser/TUI/writer batches and dry-run migration tooling; stopped before live migration because dry-run reports 39 ambiguous active records | partial | /sf-start Traffic-first Markdown operational record format migration ambiguity resolution |
| 2026-05-22 13:30:54 UTC | sf-start | GPT-5 Codex | Resolved migration blockers by making spec title inference tolerant of existing Markdown headings, setting a missing spec next step, and adding explicit project cells to 19 master backlog rows | implemented | /sf-start Traffic-first Markdown operational record format live migration |
| 2026-05-23 20:50:34 UTC | sf-spec | GPT-5 Codex | Split live migration into a dedicated spec gated by the future web-reader contract | draft | /sf-ready Traffic-first operational record live migration and web reader contract |

## Current Chantier Flow

- `sf-spec`: done, draft spec created.
- `sf-ready`: done, spec marked ready.
- `sf-start`: partial, shared contract, docs, Flutter parsers/tests, TUI readers/tests/docs, writer-skill references, dry-run migration tooling, and ambiguity resolution complete; live migration is no longer blocked by ambiguous records but is now gated by the dedicated web-reader migration spec.
- `sf-verify`: not launched.
- `sf-end`: not launched.
- `sf-ship`: not launched.

Next step: `/sf-ready Traffic-first operational record live migration and web reader contract`
