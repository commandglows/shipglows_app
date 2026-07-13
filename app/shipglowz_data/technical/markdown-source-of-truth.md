---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-08"
updated: "2026-05-22"
status: draft
source_skill: sf-docs
scope: "markdown-source-of-truth"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/data/shipglowz_sources/"
  - "lib/domain/project_health/"
  - "/home/claude/shipglowz_data/*.md"
  - "/home/claude/shipglowz/shipglowz_data/workflow/specs/*.md"
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "User direction on 2026-05-08: Markdown/repository files remain authoritative."
  - "User direction on 2026-05-08: future database is projection/index/sync, not canonical."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Markdown Source Of Truth

## Purpose

This document records the data contract for ShipGlowz while database and multi-user choices remain open.

## Owned Files

- `lib/data/shipglowz_sources/**`
- `lib/domain/project_health/**`
- `README.md` source input sections
- Future sync/database shipglowz_data/workflow/specs that project Markdown data

## Entrypoints

- `lib/data/shipglowz_sources/source_file_reader.dart`
- `lib/data/shipglowz_sources/source_path_policy.dart`
- `lib/data/shipglowz_sources/parsers/**`
- `lib/domain/project_health/project_health_builder.dart`

## Invariants

- Repository Markdown files are canonical for ShipGlowz operational state.
- `shipglowz_data/` is the preferred project-local governance corpus for ShipGlowz artifacts. Older root-level files are migration fallback when the corpus is missing.
- A ShipGlowz project is canonically identified by a GitHub repository (`owner/repo`).
- Each project has a local clone for Markdown/repository reading and future write-back.
- The remote database is a projection/sync/index layer and must be rebuildable or reconcilable from the GitHub repository and Markdown state.
- A future database may index, cache, project, or synchronize this state, but does not become authoritative by default.
- If the app needs to change a value that belongs to the user's project, the write path must update the relevant Markdown or repository file.
- Conflict handling should use repository/Git review semantics where possible.
- Client code must not hold privileged service credentials.

## Operational Record Contract

Task, audit, and spec summary/index records use the shared ShipGlowz traffic-first line format defined in `/home/claude/shipglowz/skills/references/operational-record-format.md`.

Canonical one-line shape:

```text
<traffic> [<project>] <kind>: <title> | <field>: <value> | <field>: <value>
```

Contract rules:

- `traffic` is one of `🔴`, `🟠`, `🟡`, or `🟢`; legacy `✅` is read as green only during migration.
- `[project]` is required immediately after the traffic marker and is preserved for display.
- `kind` is one of `task`, `audit`, or `spec`.
- Fields use exact ` | ` separators and `key: value` pairs.
- Records are one physical Markdown line. Writers escape field text instead of emitting raw newlines.
- Markdown links, inline code, commands, and field values are untrusted text; parsers and readers never execute them.

Required fields:

| Kind | Required fields | Compatibility note |
| --- | --- | --- |
| `task` | `status` | Legacy task tables or project sections may be read as fallback until migration closes. |
| `audit` | `date`, `overall`, `issues` | Legacy audit tables may be read as fallback until migration closes. |
| `spec` | `status`, `path`, `next` | Frontmatter remains authoritative; summary conflicts must produce diagnostics. |

Operational migration state:

- Canonical traffic-first records are now the active source format for live-migrated task, audit, and spec sources.
- `scripts/migrate_operational_records.py` enforces zero active legacy requirement: live write is blocked when unmapped rows, malformed rows, duplicate-conflict without deterministic resolution, or missing required fields are detected.
- Migrated sources must remain parseable for future web projections without hidden runtime normalization.

Example records:

```text
🔴 [shipglowz_app] task: Run /sf-verify | status: todo | area: github-clone-indexer
🟠 [shipglowz_app] audit: dependencies | date: 2026-04-27 | overall: C | issues: 0/1/2
🟢 [ShipGlowz] spec: ShipGlowz Terminal TUI V1 | status: ready | path: shipglowz_data/workflow/specs/shipglowz-terminal-tui-v1.md | next: /sf-start ShipGlowz Terminal TUI V1
```

## Migration and Web Reader Documentation

This contract now depends on:

- `shipglowz_data/technical/operational-record-web-reader-contract.md`
- `/home/claude/shipglowz/skills/references/operational-record-format.md`
- `scripts/migrate_operational_records.py`

These documents define source metadata, read-model fields, duplicate policy, diagnostics redaction, and deterministic write gates for the future ShipGlowz web projection surface.

## Legacy Compatibility Policy

Readers must parse canonical operational records first and then use legacy table or section formats only as migration fallback. Canonical records win over legacy rows with the same dedupe key, and duplicate suppression must be visible through diagnostics instead of hidden count changes.

New writer output must use the shared traffic-first format directly. Legacy compatibility is a read bridge, not an allowed source format for new task, audit, or spec operational records.

Detailed specs, audit evidence, verification reports, and long technical documents remain normal structured Markdown. Only operational summary/index records require the one-line grammar.

Diagnostics for malformed or duplicate operational records must include source file, line when available, a short redacted excerpt, and a repair hint. A bad record must not cause valid records in the same file to disappear.

## Projection Model

Future Firestore, Firebase, SQLite, Turso, or other storage can be used as a projection layer if it satisfies these rules:

- It can be rebuilt from Markdown/repo files.
- It records enough source metadata to trace data back to files and commits when possible.
- It does not accept edits that bypass the canonical file without a write-back plan.
- It handles multi-user reads without leaking private repositories or secrets.

## Validation

```bash
flutter test test/data/shipglowz_sources
flutter test test/domain/project_health
rg -n "service-role|SUPABASE|FIREBASE|Firestore|FastAPI|canonical|source of truth" lib shipglowz_data/technical shipglowz_data/workflow/specs README.md
```

## Reader Checklist

- Does the change keep Markdown as the authority?
- Does any database write need a Markdown write-back?
- Does the design avoid turning cache/projection data into hidden truth?
- Are path allowlists and diagnostics still safe?

## Maintenance Rule

Any future storage, sync, auth, or multi-user spec must cite this document and either preserve or explicitly supersede its source-of-truth contract.
