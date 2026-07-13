---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.2.0"
draft: true
project: shipglowz_app
created: "2026-04-26"
updated: "2026-05-08"
status: draft
source_skill: sf-docs
scope: technical
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
evidence:
  - "CLAUDE.md"
  - "shipglowz_data/editorial/content-map.md"
  - "shipglowz_data/technical/code-docs-map.md"
  - "shipglowz_data/technical/legacy-contentflow-inventory.md"
depends_on:
  - "CLAUDE.md@0.2.0"
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
supersedes:
  - "AGENT.md@1.1.0 contentflow_app guidance"
linked_systems:
  - "Flutter"
  - "ShipGlowz Markdown sources"
  - "Legacy ContentFlow runtime"
next_review: "2026-06-08"
next_step: "/sf-docs update"
---

# AGENT - shipglowz_app

## Mission

Keep this repository aligned with ShipGlowz as the active product while preserving useful ContentFlow legacy ideas until they are classified. Do not treat legacy ContentFlow implementation details as current ShipGlowz decisions.

## Technical Mandate For Contributors

- ShipGlowz is the default runtime.
- `APP_TARGET=legacy` and `APP_TARGET=contentflow` are temporary audit targets.
- Markdown and repository files are the authoritative data source.
- Future databases are projections or sync layers unless a later reviewed spec says otherwise.
- Legacy auth, FastAPI, OpenRouter, feedback, and pipeline code are reference material until a dedicated ShipGlowz spec adopts them.

## Required Architecture Conventions

1. Active work targets active ShipGlowz modules first:
   - `lib/shipglowz/**`
   - `lib/data/shipglowz_sources/**`
   - `lib/domain/project_health/**`
   - terminal TUI work belongs in `/home/claude/shipglowz/tui`, not this Flutter app repo

2. Legacy reuse requires classification:
   - Check `shipglowz_data/technical/legacy-contentflow-inventory.md`.
   - Move only the smallest useful concept.
   - Preserve security boundaries for auth, secrets, feedback, terminal, and agent execution.

3. Runtime boundaries must stay explicit:
   - Do not add new default dependencies from the legacy runtime into ShipGlowz.
   - Do not expose legacy routes as product features without a ready spec.

4. Data rules:
   - Do not make a database canonical by accident.
   - Do not write user/project state only to a projection layer.
   - Do not store service-role keys or BYOK secrets in client-side code.
   - Do not add terminal write-back, shell execution, auth, cloud, or secrets handling from this app repo.
   - Terminal TUI file reads are governed by `/home/claude/shipglowz/tui/src/sources/sourcePolicy.ts`.

## Validation References

```bash
flutter test
flutter analyze
rg -n "APP_TARGET|LegacyShipGlowzApp|ShipGlowzApp" lib test
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglowz_data/workflow/TASKS.md shipglowz_data/editorial/content-map.md shipglowz_data/technical shipglowz_data/workflow/specs lib test
```

## Canonical Sources

- `CLAUDE.md`: contributor guidance.
- `shipglowz_data/editorial/content-map.md`: content and documentation surface map.
- `shipglowz_data/technical/code-docs-map.md`: code area documentation map.
- `shipglowz_data/technical/runtime-boundary.md`: active versus legacy runtime.
- `shipglowz_data/technical/markdown-source-of-truth.md`: data authority contract.
- `shipglowz_data/technical/legacy-contentflow-inventory.md`: legacy classification.
- `shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md`: active chantier.

## Collaboration Guidance

When uncertain, classify and document before changing code. Ask before deleting anything that touches auth, secrets, BYOK, feedback, pipeline, terminal, agents, or data ownership.
