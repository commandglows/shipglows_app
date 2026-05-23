---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.2.0"
draft: true
project: shipflow_app
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
  - "shipflow_data/editorial/content-map.md"
  - "shipflow_data/technical/code-docs-map.md"
  - "shipflow_data/technical/legacy-contentflow-inventory.md"
depends_on:
  - "CLAUDE.md@0.2.0"
  - "shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
supersedes:
  - "AGENT.md@1.1.0 contentflow_app guidance"
linked_systems:
  - "Flutter"
  - "ShipFlow Markdown sources"
  - "Legacy ContentFlow runtime"
next_review: "2026-06-08"
next_step: "/sf-docs update"
---

# AGENT - shipflow_app

## Mission

Keep this repository aligned with ShipFlow as the active product while preserving useful ContentFlow legacy ideas until they are classified. Do not treat legacy ContentFlow implementation details as current ShipFlow decisions.

## Technical Mandate For Contributors

- ShipFlow is the default runtime.
- `APP_TARGET=legacy` and `APP_TARGET=contentflow` are temporary audit targets.
- Markdown and repository files are the authoritative data source.
- Future databases are projections or sync layers unless a later reviewed spec says otherwise.
- Legacy auth, FastAPI, OpenRouter, feedback, and pipeline code are reference material until a dedicated ShipFlow spec adopts them.

## Required Architecture Conventions

1. Active work targets active ShipFlow modules first:
   - `lib/shipflow/**`
   - `lib/data/shipflow_sources/**`
   - `lib/domain/project_health/**`
   - terminal TUI work belongs in `/home/claude/shipflow/tui`, not this Flutter app repo

2. Legacy reuse requires classification:
   - Check `shipflow_data/technical/legacy-contentflow-inventory.md`.
   - Move only the smallest useful concept.
   - Preserve security boundaries for auth, secrets, feedback, terminal, and agent execution.

3. Runtime boundaries must stay explicit:
   - Do not add new default dependencies from the legacy runtime into ShipFlow.
   - Do not expose legacy routes as product features without a ready spec.

4. Data rules:
   - Do not make a database canonical by accident.
   - Do not write user/project state only to a projection layer.
   - Do not store service-role keys or BYOK secrets in client-side code.
   - Do not add terminal write-back, shell execution, auth, cloud, or secrets handling from this app repo.
   - Terminal TUI file reads are governed by `/home/claude/shipflow/tui/src/sources/sourcePolicy.ts`.

## Validation References

```bash
flutter test
flutter analyze
rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib test
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipflow_data/workflow/TASKS.md shipflow_data/editorial/content-map.md shipflow_data/technical shipflow_data/workflow/specs lib test
```

## Canonical Sources

- `CLAUDE.md`: contributor guidance.
- `shipflow_data/editorial/content-map.md`: content and documentation surface map.
- `shipflow_data/technical/code-docs-map.md`: code area documentation map.
- `shipflow_data/technical/runtime-boundary.md`: active versus legacy runtime.
- `shipflow_data/technical/markdown-source-of-truth.md`: data authority contract.
- `shipflow_data/technical/legacy-contentflow-inventory.md`: legacy classification.
- `shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md`: active chantier.

## Collaboration Guidance

When uncertain, classify and document before changing code. Ask before deleting anything that touches auth, secrets, BYOK, feedback, pipeline, terminal, agents, or data ownership.
