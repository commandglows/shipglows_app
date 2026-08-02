---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglows_app"
created: "2026-05-30"
created_at: "2026-05-30 09:10:00 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 15:50:00 UTC"
scope: operational-record-web-reader-contract
status: draft
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
source_skill: sf-start
linked_systems:
  - "lib/data/shipglows_sources/parsers/"
  - "lib/data/shipglows_sources/parsers/operational_record_parser.dart"
  - "test/data/shipglows_sources/parsers/operational_record_parser_test.dart"
  - "test/data/shipglows_sources/fixtures/operational_records_web_reader.md"
  - "scripts/migrate_operational_records.py"
  - "/home/claude/shipglowz/tui/src/sources/"
links:
  - shipglows_data/technical/markdown-source-of-truth.md
  - shipglows_data/technical/code-docs-map.md
  - /home/claude/shipglowz/skills/references/operational-record-format.md
next_review: "2026-06-30"
depends_on:
  - artifact: "shipglows_data/workflow/specs/traffic-first-markdown-operational-record-format.md"
    artifact_version: "1.0.0"
    required_status: ready
evidence:
  - "Writer-side parser and migration proof were added in the live migration chantier run (`/sf-start Traffic-first operational record live migration and web reader contract`)."
supersedes: []
next_step: "/sf-verify Traffic-first operational record live migration and web reader contract"
---

# Operational Record Web Reader Contract

## Purpose

Define the normalized read-model contract for rendering operational records in future ShipGlows web surfaces from Markdown sources, without introducing a second parser behavior. Migration output must be readable by this model directly.

## Source Records

The canonical source line remains traffic-first Markdown (`🔴|🟠|🟡|🟢`). Reader input must ignore legacy table rows for migrated files and should only consume canonical records for active operational state.

Canonical line shape and required fields remain defined by `/home/claude/shipglowz/skills/references/operational-record-format.md`.

Migrated files must not retain active legacy operational tables; they should be readable from canonical rows alone. If canonical coverage is incomplete, the row must block write mode as `unmapped`, and live migration cannot proceed.

## Read Model

Each parser/reader row maps to this normalized object:

- `recordKind` (`task` | `audit` | `spec`)
- `project` (string)
- `traffic` (canonical marker: `🔴` `🟠` `🟡` `🟢`)
- `title` (string)
- `fields` (`Map<String, String>`)
- `dedupeKey` (`task|...` / `audit|...` / `spec|...`)
- `sourcePath` (repository-relative markdown path)
- `line` (1-based line number if known)
- `rawLine` (original canonical line text)
- `diagnostics` (warnings for malformed/duplicate/unknown rows)

### Projection Metadata

Readers that persist data for web lists may add optional:

- `recordId`: derived from `sourcePath + ':' + line + ':' + dedupeKey`
- `sourceCommit` (hash), when available from commit-aware sync jobs

## Sorting and Filters

- Filter by: `project`, `recordKind`, `traffic`
- Recent ordering: source `line` descending within a `sourcePath`, then fallback to source path + project.
- Grouping: by `traffic`, then `recordKind`, then project.
- Spec index ordering: `status` then `path` lexicographically.

## Dedupe and Conflict Policy

1. Canonical record keys are derived per `/home/claude/shipglowz/skills/references/operational-record-format.md` and are stable for the same project + semantic identity.
2. Duplicate canonical keys are resolved by first row in source order; later duplicates are emitted as diagnostics and never overwrite the first.
3. If a canonical row and a legacy-derived row share a dedupe key, canonical wins.
4. A migration output that cannot produce a dedupe key for a mapped row must be treated as a blocker.

## Diagnostics Contract

Diagnostics returned to UI/projection must include:

- `severity` (`warning`/`error`)
- `sourcePath`
- `line` (if known)
- short `message`
- bounded `excerpt`
- `suggestedCommand` for repair

Reader output for UI must never expose tokenized paths, credentials, or raw payload dumps. Excerpts should be truncated and safe.

## Projection Rules

- Web projection should persist only this normalised output.
- Display-only artifacts (UI lists, recent feeds, grouping tiles) are derived from parsed canonical rows.
- Legacy tables should not produce persisted projection rows for migrated trackers.

## Projection-Writer Alignment

`OperationalRecordParser` in Flutter and terminal readers in `/home/claude/shipglowz/tui/src/sources/` must expose the same required read-model fields and diagnostics semantics:

- `recordKind`
- `sourcePath`
- `line`
- `rawLine`
- `dedupeKey`
- filtering keys (`project`, `traffic`, `recordKind`)

This contract is the shared target for future web-reader implementation.

## Test Coverage Requirements

- `operational_records_web_reader.md` fixture must include task, audit, and spec rows, escaped values, duplicate records, malformed records, and explicit project split.
- `scripts/migrate_operational_records.py --write --check-only` must be rejected if this contract file or fixture is missing.

## Redaction Rules

- Strip local filesystem paths from UI-visible diagnostics whenever not needed for user action.
- Never show raw command strings from `next` or values in raw Markdown as executable content.
- Preserve line-level evidence only for operator actions.

## Zero-Legacy Migration Requirement

- For files touched by live migration, remove active legacy table representation for task and audit sections once canonical rows are produced.
- Rows that cannot be mapped to a valid canonical line (missing `project`, required fields, dedupe key, or malformed key/value) are blockers and must fail the write gate before writing.
- Migration diagnostics visible to users and web projections must remain bounded and redacted.
