---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: shipglows_app
created: "2026-04-26"
updated: "2026-08-11"
status: active
source_skill: 300-sg-docs
scope: technical
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
evidence:
  - "CLAUDE.md"
  - "shipglows_data/editorial/content-map.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/technical/runtime-boundary.md"
depends_on:
  - "CLAUDE.md@0.2.0"
  - "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md@1.25.0"
supersedes:
  - "AGENT.md@0.3.0 historical contributor guidance"
linked_systems:
  - "Flutter"
  - "ShipGlows Markdown sources"
  - "Dormant modules outside the ShipGlows entrypoint"
next_review: "2026-09-03"
next_step: "Continue the managed Cockpit MVP from the single ShipGlows runtime."
---

# AGENT - shipglows_app

## Mission

Keep this repository aligned with the single ShipGlows product runtime. Code outside that runtime is dormant unless a current ShipGlows spec explicitly integrates it.

## Technical Mandate For Contributors

- `app/lib/main.dart` always starts `ShipGlowsApp`.
- GitHub repositories and ShipGlows Markdown are the authoritative content sources.
- The runner SQLite database is an operational projection, not repository authority.
- Dormant auth, feedback, pipeline, and integration modules are not product features until a current ShipGlows spec adopts them.

## Required Architecture Conventions

1. Active work targets active ShipGlows modules first:
   - `lib/shipglows/**`
   - `lib/data/shipglows_sources/**`
   - `lib/domain/project_health/**`
   - the existing read-only terminal TUI belongs in `/home/claude/shipglowz/tui`
   - the authenticated Flutter operator Workspace belongs in `app/` and `runner/`; its short-lived PTY/tmux stream is implemented, server-smoke proven, and remains fail-closed unless the runner allowlists and authorizes the project

2. Dormant-module reuse requires classification:
   - Check `shipglows_data/technical/runtime-boundary.md` and `shipglows_data/technical/legacy-contentflow-inventory.md`.
   - Integrate only the smallest useful concept.
   - Preserve security boundaries for auth, secrets, feedback, terminal, and agent execution.

3. Runtime boundaries must stay explicit:
   - Do not add dependencies from dormant modules into ShipGlows without a ready spec.
   - Do not expose dormant routes or scripts as product features.

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
! rg -n "APP_TARGET|LegacyShipGlowsApp" lib/main.dart lib/shipglows web/index.html
rg -n "ShipGlowsApp" lib/main.dart lib/shipglows
```

## Canonical Sources

- `CLAUDE.md`: contributor guidance.
- `shipglows_data/editorial/content-map.md`: content and documentation surface map.
- `shipglows_data/technical/code-docs-map.md`: code area documentation map.
- `shipglows_data/technical/runtime-boundary.md`: single-runtime and dormant-module boundary.
- `shipglows_data/technical/markdown-source-of-truth.md`: data authority contract.
- `shipglows_data/technical/legacy-contentflow-inventory.md`: historical dormant-module classification.
- `shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md`: active managed Cockpit chantier.

## Collaboration Guidance

When uncertain, classify and document before changing code. Ask before deleting anything that touches auth, secrets, BYOK, feedback, pipeline, terminal, agents, or data ownership.
