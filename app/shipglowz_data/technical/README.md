---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-08"
updated: "2026-05-08"
status: draft
source_skill: sf-docs
scope: "technical-governance"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/main.dart"
  - "lib/shipglowz/"
  - "lib/data/shipglowz_sources/"
  - "lib/domain/project_health/"
  - "lib/presentation/"
  - "lib/router.dart"
  - "shipglowz_data/editorial/content-map.md"
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "README.md identifies ShipGlowz as the active app."
  - "lib/main.dart defaults APP_TARGET to shipglowz."
  - "Legacy ContentFlow runtime remains available behind explicit APP_TARGET values."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Technical Documentation

## Purpose

This directory is the code-proximate governance layer for `shipglowz_app`. It records which code areas are active ShipGlowz surfaces, which areas are legacy ContentFlow surfaces, and which documents must be updated before broad implementation work.

## Owned Files

- `shipglowz_data/technical/README.md`
- `shipglowz_data/technical/code-docs-map.md`
- `shipglowz_data/technical/runtime-boundary.md`
- `shipglowz_data/technical/markdown-source-of-truth.md`
- `shipglowz_data/technical/legacy-contentflow-inventory.md`

## Entrypoints

- `lib/main.dart` chooses the runtime target.
- `lib/shipglowz/app.dart` starts the active ShipGlowz dashboard.
- `lib/router.dart` starts the legacy runtime only when `APP_TARGET=legacy` or `APP_TARGET=contentflow`.
- `shipglowz_data/editorial/content-map.md` maps project-owned content and documentation surfaces.

## Invariants

- ShipGlowz is the active product in this repository.
- Legacy ContentFlow code is not deleted until classified.
- Markdown and repository files remain the source of truth for ShipGlowz operational data.
- Future database work is a projection/index/sync concern unless a later spec changes that contract.
- Future auth, BYOK, feedback, terminal, and agent-runner work needs dedicated specs before implementation.

## Validation

```bash
rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipglowz_data/workflow/TASKS.md shipglowz_data/editorial/content-map.md shipglowz_data/technical shipglowz_data/workflow/specs lib test
rg -n "APP_TARGET|LegacyShipGlowzApp|ShipGlowzApp" lib test
flutter test
flutter analyze
```

## Reader Checklist

- Does the file describe ShipGlowz as the active product?
- Does it distinguish active code from legacy/reference code?
- Does it avoid making Firebase, Firestore, FastAPI, Clerk, Supabase, or OpenRouter a hidden implementation decision?
- Does it preserve the Markdown source-of-truth invariant?
- Does it avoid instructing agents to delete legacy code without a classification?

## Maintenance Rule

When code moves between active ShipGlowz, shared/adapted code, and legacy ContentFlow, update `shipglowz_data/technical/code-docs-map.md` and `shipglowz_data/technical/legacy-contentflow-inventory.md` in the same chantier.
