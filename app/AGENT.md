---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.2.0"
draft: true
project: shipglows_app
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
  - "shipglows_data/editorial/content-map.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/technical/legacy-contentflow-inventory.md"
depends_on:
  - "CLAUDE.md@0.2.0"
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md@0.1.0"
supersedes:
  - "AGENT.md@1.1.0 contentflow_app guidance"
linked_systems:
  - "Flutter"
  - "ShipGlows Markdown sources"
  - "Legacy ContentFlow runtime"
next_review: "2026-06-08"
next_step: "/sf-docs update"
---

# AGENT - shipglows_app

## Mission

Keep this repository aligned with ShipGlows as the active product while preserving useful ContentFlow legacy ideas until they are classified. Do not treat legacy ContentFlow implementation details as current ShipGlows decisions.

## Technical Mandate For Contributors

- ShipGlows is the default runtime.
- `APP_TARGET=legacy` and `APP_TARGET=contentflow` are temporary audit targets.
- Markdown and repository files are the authoritative data source.
- Future databases are projections or sync layers unless a later reviewed spec says otherwise.
- Legacy auth, FastAPI, OpenRouter, feedback, and pipeline code are reference material until a dedicated ShipGlows spec adopts them.

## Required Architecture Conventions

1. Active work targets active ShipGlows modules first:
   - `lib/shipglows/**`
   - `lib/data/shipglows_sources/**`
   - `lib/domain/project_health/**`
   - the existing read-only terminal TUI belongs in `/home/claude/shipglowz/tui`
   - the future authenticated Flutter operator workspace (terminal/tmux/Neovim) belongs in this repo's `app/` and `runner/`, behind a dedicated high-risk spec and capability boundary

2. Legacy reuse requires classification:
   - Check `shipglows_data/technical/legacy-contentflow-inventory.md`.
   - Move only the smallest useful concept.
   - Preserve security boundaries for auth, secrets, feedback, terminal, and agent execution.

3. Runtime boundaries must stay explicit:
   - Do not add new default dependencies from the legacy runtime into ShipGlows.
   - Do not expose legacy routes as product features without a ready spec.

4. Data rules:
   - Do not make a database canonical by accident.
   - Do not write user/project state only to a projection layer.
   - Do not store service-role keys or BYOK secrets in client-side code.
   - Do not add terminal write-back, shell execution, auth, cloud, or secrets handling without the dedicated managed Cockpit/operator-workspace spec, server-side authorization, and isolation gates.
   - Terminal TUI file reads are governed by `/home/claude/shipglowz/tui/src/sources/sourcePolicy.ts`.

## Validation References

```bash
flutter test
flutter analyze
rg -n "APP_TARGET|LegacyShipGlowsApp|ShipGlowsApp" lib test
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglows_data/workflow/TASKS.md shipglows_data/editorial/content-map.md shipglows_data/technical shipglows_data/workflow/specs lib test
```

## Canonical Sources

- `CLAUDE.md`: contributor guidance.
- `shipglows_data/editorial/content-map.md`: content and documentation surface map.
- `shipglows_data/technical/code-docs-map.md`: code area documentation map.
- `shipglows_data/technical/runtime-boundary.md`: active versus legacy runtime.
- `shipglows_data/technical/markdown-source-of-truth.md`: data authority contract.
- `shipglows_data/technical/legacy-contentflow-inventory.md`: legacy classification.
- `shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md`: active chantier.

## Collaboration Guidance

When uncertain, classify and document before changing code. Ask before deleting anything that touches auth, secrets, BYOK, feedback, pipeline, terminal, agents, or data ownership.
