---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.3.0"
project: "shipglowz_app"
created: "2026-05-08"
updated: "2026-08-01"
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
  - "lib/shipglowz/app.dart"
  - "lib/router.dart"
  - "lib/providers/providers.dart"
  - "runner/src/main.ts"
  - "runner/src/app.ts"
  - "lib/shipglowz/auth/**"
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md@0.1.0"
supersedes: []
evidence:
  - "lib/main.dart defaults APP_TARGET to shipglowz."
  - "LegacyShipGlowzApp is only selected for APP_TARGET=legacy or APP_TARGET=contentflow."
  - "Managed Cockpit auth bootstrap is disabled without both public Supabase build values."
next_review: "2026-06-08"
next_step: "/sf-docs technical audit"
---

# Runtime Boundary

## Purpose

This document defines which runtime is active and which runtime is legacy while ShipGlowz absorbs useful ContentFlow ideas.

## Owned Files

- `lib/main.dart`
- `lib/shipglowz/app.dart`
- `lib/shipglowz/router.dart`
- `lib/router.dart`
- `lib/providers/providers.dart`
- `lib/presentation/**`

## Entrypoints

- Default runtime: `flutter run` launches `shipglowz.ShipGlowzApp` on a supported Android or Web device.
- Managed control-plane bootstrap: `runner/src/main.ts` starts a loopback-only Fastify service. It exposes only the versioned ShipGlowz API boundary; it never exposes a raw Codex, PTY, tmux, SSH, or filesystem transport.
- Active target: `APP_TARGET=shipglowz`.
- Legacy targets: `APP_TARGET=legacy` and `APP_TARGET=contentflow`.

## Invariants

- ShipGlowz is the default and active product runtime.
- The legacy runtime is a migration reference, not the product direction.
- The legacy runtime remains temporarily available until its modules are classified.
- New product work should target `lib/shipglowz/` unless a ready spec explicitly adapts legacy code.
- Active runtime code in `lib/shipglowz/` must not import legacy runtime modules (`lib/router.dart`, `lib/providers/providers.dart`, `lib/data/services/**`, `lib/presentation/**`, `web_auth/**`) without an explicit migration or compatibility spec.
- Legacy tests should import those legacy modules only through `test/legacy_contract.dart` unless a migration spec explicitly allows direct imports in place.
- Auth, feedback, BYOK, pipeline, terminal, and agent runner features cannot be activated by runtime naming alone.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are optional public build configuration. If either is absent or the URL is invalid, `lib/main.dart` injects a disabled ShipGlowz auth adapter and the read-only local dashboard remains available. Privileged Supabase keys are never Flutter build values.
- The managed runner owns neutral `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker`, and `ModelGateway` contracts. Flutter must consume only normalized ShipGlowz API/event types, never a runtime wire protocol.

## Runtime Selection

`lib/main.dart` normalizes `APP_TARGET`. Values `legacy` and `contentflow` select `LegacyShipGlowzApp`; all other values select `shipglowz.ShipGlowzApp`.

This is intentional during migration. It lets us inspect and test old screens without presenting them as ShipGlowz's default product.

## Removal Conditions

The legacy target can be removed only after:

- Every legacy code area in `shipglowz_data/technical/legacy-contentflow-inventory.md` is classified.
- Reusable concepts are either moved into ShipGlowz-specific modules or tracked in future specs.
- The active ShipGlowz runtime has no direct dependencies on the legacy graph in `lib/` code; legacy-only test dependencies must go through `test/legacy_contract.dart`.
- The user explicitly accepts the removal scope.

## Validation

```bash
rg -n "APP_TARGET|LegacyShipGlowzApp|ShipGlowzApp" lib/main.dart lib/shipglowz app test
rg -n "package:shipglowz_app/(providers/providers\\.dart|data/services/|router\\.dart|presentation/)" lib/shipglowz
rg -n "package:shipglowz_app/(providers/providers\\.dart|data/services/|router\\.dart|presentation/)" test --glob '!test/legacy_contract.dart'
./scripts/validate-boundary-suite.sh
./scripts/validate-shipglowz-runtime-boundary.sh
./scripts/validate-legacy-test-boundary.sh
flutter test test/widget_test.dart
```

## Reader Checklist

- Does a change affect only the active runtime, only the legacy runtime, or both?
- Does a new dependency make ShipGlowz rely on legacy providers or routes?
- Is a future feature being accidentally enabled through the legacy target?

## Maintenance Rule

Any change to `APP_TARGET`, app bootstrapping, root providers, or route ownership must update this document in the same chantier.
