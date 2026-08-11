---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.4.0"
project: "shipglows_app"
created: "2026-05-08"
updated: "2026-08-11"
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
  - "lib/shipglows/app.dart"
  - "lib/router.dart"
  - "lib/providers/providers.dart"
  - "runner/src/main.ts"
  - "runner/src/app.ts"
  - "lib/shipglows/auth/**"
depends_on:
  - "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "lib/main.dart defaults APP_TARGET to shipglows."
  - "LegacyShipGlowsApp is only selected for APP_TARGET=legacy or APP_TARGET=contentflow."
  - "Managed Cockpit auth bootstrap is disabled without both public Firebase build values."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Runtime Boundary

## Purpose

This document defines which runtime is active and which runtime is legacy while ShipGlows absorbs useful ContentFlow ideas.

## Owned Files

- `lib/main.dart`
- `lib/shipglows/app.dart`
- `lib/shipglows/router.dart`
- `lib/router.dart`
- `lib/providers/providers.dart`
- `lib/presentation/**`

## Entrypoints

- Default runtime: `flutter run` launches `shipglows.ShipGlowsApp` on a supported Android or Web device.
- Managed control-plane bootstrap: `runner/src/main.ts` starts a loopback-only Fastify service. It exposes only the versioned ShipGlows API boundary; it never exposes a raw Codex, PTY, tmux, SSH, or filesystem transport.
- Active target: `APP_TARGET=shipglows`.
- Legacy targets: `APP_TARGET=legacy` and `APP_TARGET=contentflow`.

## Invariants

- ShipGlows is the default and active product runtime.
- The legacy runtime is a migration reference, not the product direction.
- The legacy runtime remains temporarily available until its modules are classified.
- New product work should target `lib/shipglows/` unless a ready spec explicitly adapts legacy code.
- Active runtime code in `lib/shipglows/` must not import legacy runtime modules (`lib/router.dart`, `lib/providers/providers.dart`, `lib/data/services/**`, `lib/presentation/**`, `web_auth/**`) without an explicit migration or compatibility spec.
- Legacy tests should import those legacy modules only through `test/legacy_contract.dart` unless a migration spec explicitly allows direct imports in place.
- Auth, feedback, BYOK, pipeline, terminal, and agent runner features cannot be activated by runtime naming alone.
- `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID` and `FIREBASE_PROJECT_ID` are optional public client build configuration. If any value is absent, `lib/main.dart` injects a disabled ShipGlows auth adapter and the read-only local dashboard remains available. Privileged Firebase service-account credentials are never Flutter build values.
- The managed runner owns neutral `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker`, and `ModelGateway` contracts. Flutter must consume only normalized ShipGlows API/event types, never a runtime wire protocol.

## Runtime Selection

`lib/main.dart` normalizes `APP_TARGET`. Values `legacy` and `contentflow` select `LegacyShipGlowsApp`; all other values select `shipglows.ShipGlowsApp`.

This is intentional during migration. It lets us inspect and test old screens without presenting them as ShipGlows's default product.

## Removal Conditions

The legacy target can be removed only after:

- Every legacy code area in `shipglows_data/technical/legacy-contentflow-inventory.md` is classified.
- Reusable concepts are either moved into ShipGlows-specific modules or tracked in future specs.
- The active ShipGlows runtime has no direct dependencies on the legacy graph in `lib/` code; legacy-only test dependencies must go through `test/legacy_contract.dart`.
- The user explicitly accepts the removal scope.

## Validation

```bash
rg -n "APP_TARGET|LegacyShipGlowsApp|ShipGlowsApp" lib/main.dart lib/shipglows app test
rg -n "package:shipglows_app/(providers/providers\\.dart|data/services/|router\\.dart|presentation/)" lib/shipglows
rg -n "package:shipglows_app/(providers/providers\\.dart|data/services/|router\\.dart|presentation/)" test --glob '!test/legacy_contract.dart'
./scripts/validate-boundary-suite.sh
./scripts/validate-shipglows-runtime-boundary.sh
./scripts/validate-legacy-test-boundary.sh
flutter test test/widget_test.dart
```

## Reader Checklist

- Does a change affect only the active runtime, only the legacy runtime, or both?
- Does a new dependency make ShipGlows rely on legacy providers or routes?
- Is a future feature being accidentally enabled through the legacy target?

## Maintenance Rule

Any change to `APP_TARGET`, app bootstrapping, root providers, or route ownership must update this document in the same chantier.
