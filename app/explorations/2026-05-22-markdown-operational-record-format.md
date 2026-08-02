---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-22"
updated: "2026-05-22"
status: draft
source_skill: sf-explore
scope: "markdown-operational-record-format"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: no
docs_impact: yes
linked_systems:
  - "ShipGlows Markdown trackers"
  - "ShipGlows App Flutter readers"
  - "ShipGlows terminal TUI"
  - "ShipGlows skills writer protocols"
evidence:
  - "CLAUDE.md"
  - "AGENT.md"
  - "shipglows_data/technical/markdown-source-of-truth.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/workflow/TASKS.md"
  - "shipglows_data/workflow/AUDIT_LOG.md"
  - "/home/claude/shipglowz/shipglows_data/workflow/specs/shipglows-terminal-tui-v1.md"
  - "lib/data/shipglows_sources/parsers/tasks_parser.dart"
  - "lib/data/shipglows_sources/parsers/audit_log_parser.dart"
  - "lib/data/shipglows_sources/parsers/specs_parser.dart"
  - "tui/src/sources/readers.ts"
depends_on: []
supersedes: []
next_step: "/sf-spec Traffic-first Markdown operational record format for ShipGlows tasks specs and audits"
---

# Exploration Report: Traffic-First Markdown Operational Records

## Starting Question

ShipGlows already has a dashboard app and a terminal TUI that read Markdown as the source of truth. The question is whether tasks, audits, and spec indexes should keep their current table-oriented formats and let readers normalize them, or whether the canonical Markdown itself should become easier to read directly by humans, TUI views, and a future web app.

The user preference is that the traffic-light marker should appear at the very beginning of each visible record line, and that project names should remain visible near the beginning so tasks and audits can be filtered or scanned by project.

## Context Read

- `CLAUDE.md` - confirms `shipglows_app` is the active ShipGlows dashboard and Markdown/repo files remain canonical.
- `AGENT.md` - identifies active source-reader surfaces, including `lib/data/shipglows_sources/**` and `tui/**`.
- `shipglows_data/technical/markdown-source-of-truth.md` - describes Markdown as the canonical operational source.
- `shipglows_data/technical/code-docs-map.md` - maps code readers to documentation responsibilities.
- `/home/claude/shipglows_data/TASKS.md` - shows global task tracking with dashboard and per-project table sections.
- `/home/claude/shipglows_data/AUDIT_LOG.md` - shows the current global audit log as a wide Markdown table.
- `shipglows_data/workflow/TASKS.md` - shows local task tracking with legends, top priority, and tables.
- `shipglows_data/workflow/AUDIT_LOG.md` - shows local audit tracking as a table with local project inference.
- `/home/claude/shipglowz/shipglows_data/workflow/specs/shipglows-terminal-tui-v1.md` - shows current spec frontmatter plus structured sections and history tables.
- `lib/data/shipglows_sources/parsers/tasks_parser.dart` - parses project sections, task status markers, and top priority text.
- `lib/data/shipglows_sources/parsers/audit_log_parser.dart` - parses Markdown audit tables with expected columns.
- `lib/data/shipglows_sources/parsers/specs_parser.dart` - parses frontmatter and flow sections from specs.
- `tui/src/sources/readers.ts` - already normalizes task, audit, and spec records into TUI-friendly display lines.
- ShipGlows skill references for audit/task workflows - show that several skills write directly to `TASKS.md` and `AUDIT_LOG.md`.

## Internet Research

- None. This is a local convention and product-contract exploration.

## Problem Framing

The current Markdown sources are usable, but they optimize for tabular editing more than line-by-line operational scanning. That creates three problems:

- Raw Markdown readability is uneven. A wide table makes the priority, project, status, and item title harder to scan than a traffic-first line.
- Each reader has to compensate. The terminal TUI can normalize display, but the future web app would need to duplicate similar presentation logic unless the canonical source is clearer.
- Writer conventions are fragmented. Audit skills, task workflows, review workflows, and readiness/verification flows can drift if they continue writing different structures for similar operational records.

The key design question is not just visual formatting. It is whether ShipGlows should define a canonical operational record grammar that every writer and reader can share.

## Option Space

### Option A: Keep Table-First Markdown, Normalize In Readers

- Summary: Preserve the existing `TASKS.md` and `AUDIT_LOG.md` table formats, then make the TUI and future web app render traffic-first display strings.
- Pros:
  - Lowest migration cost.
  - Existing Flutter parsers and skill writer flows keep working.
  - Tables remain familiar for bulk editing in Markdown.
- Cons:
  - Raw Markdown remains less readable than the app views.
  - Traffic lights cannot truly be the first meaningful character if they live inside table cells.
  - Every UI reader has to reimplement display normalization.
  - Wide tables are brittle when titles, links, and notes get long.

### Option B: Plain Traffic-First Record Lines

- Summary: Replace operational tables with one canonical record per line, starting with the traffic-light marker and project.
- Example:

```text
🔴 [shipglows_app] 📋 todo - Run /sf-verify for shipglows-github-managed-clone-indexer.md before closing or shipping the implementation
🟠 [ShipGlows] 🔄 in progress - Harden install.sh supply-chain and failure handling
```

- Pros:
  - Best raw readability.
  - TUI, web app, and plain terminal output can share the same mental model.
  - Project filtering becomes obvious because project is always in a fixed early position.
  - The line start carries the most important operational signal.
- Cons:
  - Plain adjacent lines are not always ideal in generic Markdown renderers unless line breaks are preserved.
  - Requires new parsers and writer skill contracts.
  - Needs escaping/separator rules for pipes, dashes, commands, links, and multiline notes.
  - Loses table affordances for manual column sorting unless supplemented elsewhere.

### Option C: Traffic-First Record Lines With Structured Attributes

- Summary: Use a traffic-first line as the canonical summary/index record, with predictable inline fields where needed. Keep detailed evidence, spec frontmatter, and longer audit notes in structured sections below the record when useful.
- Task examples:

```text
🔴 [shipglows_app] task: Run /sf-verify for shipglows-github-managed-clone-indexer.md | status: todo | area: github-clone-indexer
🟠 [ShipGlows] task: Harden install.sh supply-chain and failure handling | status: in_progress | area: installer
```

- More compact task variant:

```text
🔴 [shipglows_app] 📋 todo - Run /sf-verify for shipglows-github-managed-clone-indexer.md
🟠 [ShipGlows] 🔄 in progress - Harden install.sh supply-chain and failure handling
```

- Audit examples:

```text
🟠 [shipglows_app] audit: dependencies | date: 2026-04-27 | overall: C | issues: 0/1/2
🔴 [ContentFlow] audit: design-tokens | date: 2026-05-21 | overall: D | issues: 2/4/3
```

- Spec examples:

```text
🟢 [ShipGlows] spec: ShipGlows Terminal TUI V1 | status: ready | next: /sf-verify
🟡 [shipglows_app] spec: Markdown artifact governance | status: draft | next: /sf-ready
```

- Pros:
  - Keeps raw Markdown highly scannable.
  - Gives parsers stable fields without requiring wide tables.
  - Allows summary records to be uniform across tasks, audits, and specs.
  - Lets detailed artifacts keep richer Markdown structures where they add value.
- Cons:
  - Requires a real migration and compatibility period.
  - Requires writer-skill updates across several ShipGlows workflows.
  - Exact grammar must be specified carefully to avoid future drift.
  - Human editing is slightly more constrained than freeform Markdown.

## Comparison

Option A is cheapest but preserves the root problem: the canonical source is less readable than the projections. It is acceptable as a compatibility layer, but weak as a long-term contract for a future web reader.

Option B best matches the user's visual preference. Its main weakness is that plain lines need explicit rendering rules and a parsing grammar. If implemented without field discipline, it can become another informal format.

Option C is the strongest long-term direction. It treats tasks, audit entries, and spec index entries as operational records while allowing full spec files and detailed audit evidence to remain richer Markdown. This avoids forcing every artifact into a single flat format while still making indexes and trackers readable.

## Emerging Recommendation

Adopt a new canonical "traffic-first operational record" convention for summary and index surfaces:

- Task tracker records.
- Audit log entries.
- Spec index or chantier-flow records.
- Dashboard/TUI/web-app projection inputs.

Do not force every detailed artifact into a flat line format. Specs should keep YAML frontmatter and structured sections. Audit reports can keep evidence sections and detailed tables when they carry real value. The uniformity should apply to operational record lines, not to every paragraph of every document.

Recommended baseline shape:

```text
<traffic> [<project>] <kind>: <title> | <field>: <value> | <field>: <value>
```

For human-facing task streams, the spec may choose the compact display variant:

```text
<traffic> [<project>] <status> - <title>
```

The spec should decide whether compact lines are canonical or just display sugar. My current recommendation is to make the structured field grammar canonical and allow readers to render compact display lines.

## Non-Decisions

- Exact field names are not finalized.
- Exact status vocabulary is not finalized.
- The migration scope is not finalized.
- The spec has not decided whether canonical records should be plain lines or Markdown bullets.
- The spec has not decided whether old tables remain supported indefinitely or only during migration.

## Rejected Paths

- UI-only normalization - rejected as the sole strategy because the future web app and raw Markdown both benefit from a cleaner source format.
- Migrating all Markdown content to one rigid format - rejected because detailed specs and evidence sections need richer structure than one-line records.
- Keeping project only in section headings - rejected because cross-project views and filters need project identity on each record.

## Risks And Unknowns

- Markdown rendering: raw line records are visually ideal in plain text, but generic Markdown renderers may collapse adjacent lines unless the app preserves line breaks or records are represented as bullets.
- Bullet prefix tradeoff: `- 🔴 [project] ...` renders well in Markdown, but violates the user's preference that the traffic light be at the true beginning of the line.
- Escaping rules: inline field separators such as `|` and ` - ` need clear escaping or avoidance rules.
- Migration safety: existing global and local trackers contain meaningful operational state that must not be lost.
- Writer coverage: skills such as `sf-tasks`, `sf-audit-*`, `sf-review`, `sf-start`, `sf-verify`, `sf-end`, and `sf-docs` may all need updates.
- Parser compatibility: Flutter and TUI readers should support old and new formats during the migration window.

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: none
- Redactions applied: none
- Notes: This report summarizes local Markdown contracts and parser behavior. No secrets, credentials, logs, or customer data were included.

## Decision Inputs For Spec

- User story seed: As Diane, I want ShipGlows tasks, audits, and specs to use a readable traffic-first Markdown convention so raw files, the terminal TUI, and the future web app all show the same operational signals clearly.
- Scope in seed: Define canonical record grammar, update source docs, update parsers, add migration compatibility, and update writer skills that create or modify operational records.
- Scope out seed: Full redesign of the dashboard UI, unrelated product features, and rewriting detailed spec/audit evidence sections that do not need operational-index formatting.
- Invariants/constraints seed:
  - Markdown remains canonical.
  - Project identity appears on each operational record.
  - Traffic light appears at the start of the operational record line where practical.
  - Existing data must migrate without loss.
  - Readers must tolerate legacy tables during the transition.
  - The terminal TUI remains read-only unless a separate spec changes that boundary.
- Validation seed:
  - Parser tests for old and new task records.
  - Parser tests for old and new audit records.
  - Parser tests for spec/index records.
  - Migration fixture proving no record loss from current tracker files.
  - Updated docs lint for the new contract.
  - Manual review of raw Markdown, TUI output, and future web-reader assumptions.

## Handoff

- Recommended next command: `/sf-spec Traffic-first Markdown operational record format for ShipGlows tasks specs and audits`
- Why this next step: The direction is clear enough to specify contracts, migration stages, parser compatibility, and writer-skill updates before changing live trackers.

## Exploration Run History

| Date UTC | Prompt/Focus | Action | Result | Next step |
|----------|--------------|--------|--------|-----------|
| 2026-05-22 09:55:56 UTC | Explore readable Markdown conventions for tasks, audits, and specs | Read ShipGlows App context, current parsers, global/local trackers, technical docs, and related skill workflow references | Recommended traffic-first operational records with structured attributes and compatibility migration | Draft `/sf-spec` |
