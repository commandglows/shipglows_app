---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-08"
updated: "2026-08-11"
status: active
source_skill: 300-sg-docs
scope: "technical-governance"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/main.dart"
  - "lib/shipglows/"
  - "lib/data/shipglows_sources/"
  - "lib/domain/project_health/"
  - "lib/presentation/"
  - "runner/src/"
  - "shipglows_data/editorial/content-map.md"
depends_on:
  - "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md@1.25.0"
  - "shipglows_data/workflow/specs/firebase-auth-convex-alignment.md@0.1.0"
supersedes:
  - "shipglows_data/technical/README.md@0.3.0"
evidence:
  - "README.md identifies ShipGlows as the active app."
  - "lib/main.dart always launches ShipGlowsApp."
  - "Firebase Auth and the managed Fastify/SQLite runner are implemented behind provider-neutral boundaries."
next_review: "2026-09-03"
next_step: "Keep public TLS, identity provisioning, and Workspace proof status aligned."
---

# Technical Documentation

## Purpose

This directory is the code-proximate governance layer for `shipglows_app`. It records the single ShipGlows runtime, its managed control plane, and the dormant modules that must not become product behavior by accident.

## Owned Files

- `shipglows_data/technical/README.md`
- `shipglows_data/technical/code-docs-map.md`
- `shipglows_data/technical/runtime-boundary.md`
- `shipglows_data/technical/markdown-source-of-truth.md`
- `shipglows_data/technical/managed-runner-foundation.md`

## Entrypoints

- `app/lib/main.dart` always starts `ShipGlowsApp`.
- `app/lib/shipglows/app.dart` starts the ShipGlows Cockpit.
- `runner/src/main.ts` starts the managed control plane.
- `shipglows_data/editorial/content-map.md` maps project-owned content and documentation surfaces.

## Invariants

- ShipGlows is the only product runtime in this repository.
- Dormant modules are not executable product surfaces and are only changed through a current ShipGlows spec.
- Markdown and repository files remain the source of truth for ShipGlows operational data.
- SQLite remains an operational projection unless a later spec changes that contract.
- Firebase Auth is the active identity adapter; Convex is the target product data layer; Fastify/SQLite is the justified execution-plane exception.
- The operator Workspace gateway and Flutter terminal are implemented; real server PTY/tmux/Codex smoke passes. Public authenticated access remains unavailable pending Caddy/TLS and actor/project provisioning.

## Validation

```bash
! rg -n "APP_TARGET|LegacyShipGlowsApp" app/lib/main.dart app/lib/shipglows app/web/index.html
rg -n "ShipGlowsApp" app/lib/main.dart app/lib/shipglows
flutter test
flutter analyze
```

## Reader Checklist

- Does the file describe ShipGlows as the active product?
- Does it distinguish active code from dormant modules?
- Does it preserve Firebase Auth, Convex, and the Fastify/SQLite execution-plane boundary exactly as documented?
- Does it preserve the Markdown source-of-truth invariant?
- Does it avoid turning dormant code into an alternate runtime?

## Maintenance Rule

When code moves between the ShipGlows runtime and dormant modules, update `shipglows_data/technical/code-docs-map.md` and `shipglows_data/technical/runtime-boundary.md` in the same chantier.
