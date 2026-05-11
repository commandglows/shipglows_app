---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-08"
updated: "2026-05-08"
status: draft
source_skill: sf-docs
scope: "runtime-boundary"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "lib/main.dart"
  - "lib/shipflow/app.dart"
  - "lib/router.dart"
  - "lib/providers/providers.dart"
depends_on:
  - "shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "lib/main.dart defaults APP_TARGET to shipflow."
  - "LegacyShipFlowApp is only selected for APP_TARGET=legacy or APP_TARGET=contentflow."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Runtime Boundary

## Purpose

This document defines which runtime is active and which runtime is legacy while ShipFlow absorbs useful ContentFlow ideas.

## Owned Files

- `lib/main.dart`
- `lib/shipflow/app.dart`
- `lib/shipflow/router.dart`
- `lib/router.dart`
- `lib/providers/providers.dart`
- `lib/presentation/**`

## Entrypoints

- Default runtime: `flutter run -d linux` launches `shipflow.ShipFlowApp`.
- Active target: `APP_TARGET=shipflow`.
- Legacy targets: `APP_TARGET=legacy` and `APP_TARGET=contentflow`.

## Invariants

- ShipFlow is the default and active product runtime.
- The legacy runtime is a migration reference, not the product direction.
- The legacy runtime remains temporarily available until its modules are classified.
- New product work should target `lib/shipflow/` unless a ready spec explicitly adapts legacy code.
- Auth, feedback, BYOK, pipeline, terminal, and agent runner features cannot be activated by runtime naming alone.

## Runtime Selection

`lib/main.dart` normalizes `APP_TARGET`. Values `legacy` and `contentflow` select `LegacyShipFlowApp`; all other values select `shipflow.ShipFlowApp`.

This is intentional during migration. It lets us inspect and test old screens without presenting them as ShipFlow's default product.

## Removal Conditions

The legacy target can be removed only after:

- Every legacy code area in `shipflow_data/technical/legacy-contentflow-inventory.md` is classified.
- Reusable concepts are either moved into ShipFlow-specific modules or tracked in future specs.
- The active ShipFlow runtime has no tests, docs, or provider dependencies on the legacy graph.
- The user explicitly accepts the removal scope.

## Validation

```bash
rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib test
flutter test test/widget_test.dart
```

## Reader Checklist

- Does a change affect only the active runtime, only the legacy runtime, or both?
- Does a new dependency make ShipFlow rely on legacy providers or routes?
- Is a future feature being accidentally enabled through the legacy target?

## Maintenance Rule

Any change to `APP_TARGET`, app bootstrapping, root providers, or route ownership must update this document in the same chantier.
