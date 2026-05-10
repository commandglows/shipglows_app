---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-08"
updated: "2026-05-08"
status: draft
source_skill: sf-docs
scope: "markdown-source-of-truth"
owner: "Diane"
confidence: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/data/shipflow_sources/"
  - "lib/domain/project_health/"
  - "/home/claude/shipflow_data/*.md"
  - "/home/claude/shipflow/specs/*.md"
depends_on:
  - "specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "User direction on 2026-05-08: Markdown/repository files remain authoritative."
  - "User direction on 2026-05-08: future database is projection/index/sync, not canonical."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Markdown Source Of Truth

## Purpose

This document records the data contract for ShipFlow while database and multi-user choices remain open.

## Owned Files

- `lib/data/shipflow_sources/**`
- `lib/domain/project_health/**`
- `README.md` source input sections
- Future sync/database specs that project Markdown data

## Entrypoints

- `lib/data/shipflow_sources/source_file_reader.dart`
- `lib/data/shipflow_sources/source_path_policy.dart`
- `lib/data/shipflow_sources/parsers/**`
- `lib/domain/project_health/project_health_builder.dart`

## Invariants

- Repository Markdown files are canonical for ShipFlow operational state.
- `shipflow_data/` is the preferred project-local governance corpus for ShipFlow artifacts. Older root-level files are migration fallback when the corpus is missing.
- A ShipFlow project is canonically identified by a GitHub repository (`owner/repo`).
- Each project has a local clone for Markdown/repository reading and future write-back.
- The remote database is a projection/sync/index layer and must be rebuildable or reconcilable from the GitHub repository and Markdown state.
- A future database may index, cache, project, or synchronize this state, but does not become authoritative by default.
- If the app needs to change a value that belongs to the user's project, the write path must update the relevant Markdown or repository file.
- Conflict handling should use repository/Git review semantics where possible.
- Client code must not hold privileged service credentials.

## Projection Model

Future Firestore, Firebase, SQLite, Turso, or other storage can be used as a projection layer if it satisfies these rules:

- It can be rebuilt from Markdown/repo files.
- It records enough source metadata to trace data back to files and commits when possible.
- It does not accept edits that bypass the canonical file without a write-back plan.
- It handles multi-user reads without leaking private repositories or secrets.

## Validation

```bash
flutter test test/data/shipflow_sources
flutter test test/domain/project_health
rg -n "service-role|SUPABASE|FIREBASE|Firestore|FastAPI|canonical|source of truth" lib docs specs README.md
```

## Reader Checklist

- Does the change keep Markdown as the authority?
- Does any database write need a Markdown write-back?
- Does the design avoid turning cache/projection data into hidden truth?
- Are path allowlists and diagnostics still safe?

## Maintenance Rule

Any future storage, sync, auth, or multi-user spec must cite this document and either preserve or explicitly supersede its source-of-truth contract.
