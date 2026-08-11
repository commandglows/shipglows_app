---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-05-08"
updated: "2026-08-11"
status: active
source_skill: 300-sg-docs
scope: "runtime-boundary"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/lib/main.dart"
  - "app/lib/shipglows/app.dart"
  - "app/lib/shipglows/router.dart"
  - "runner/src/main.ts"
  - "runner/src/app.ts"
  - "app/lib/shipglows/auth/**"
depends_on: []
supersedes:
  - "shipglows_data/technical/runtime-boundary.md@0.4.0"
evidence:
  - "app/lib/main.dart always launches ShipGlowsApp and no longer accepts APP_TARGET."
  - "Managed Cockpit auth bootstrap is disabled without all required public Firebase build values."
  - "The Flutter product consumes only normalized ShipGlows runner contracts."
next_review: "2026-09-11"
next_step: "/sg-docs technical audit"
---

# Runtime Boundary

## Purpose

ShipGlows App has one product runtime. This document defines its executable boundary and prevents dormant repository modules from becoming accidental alternate applications.

## Owned Files

- `app/lib/main.dart`
- `app/lib/shipglows/app.dart`
- `app/lib/shipglows/router.dart`
- `app/lib/shipglows/**`

## Entrypoints

- `flutter run` and production Flutter builds launch `shipglows.ShipGlowsApp`.
- `runner/src/main.ts` starts the loopback-only managed Fastify control plane.
- There is no product runtime selector and no supported alternate app target.

## Invariants

- `app/lib/main.dart` always launches `ShipGlowsApp`.
- New product work belongs under `app/lib/shipglows/` or an explicitly shared, documented module.
- Dormant files elsewhere under `app/lib/` are not a product surface, compatibility target, or architecture constraint. They may be reused only after a narrow review and direct integration into ShipGlows.
- Auth, feedback, BYOK, pipeline, terminal, and agent-runner features cannot be activated by naming or compile-time target aliases.
- `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID`, and `FIREBASE_PROJECT_ID` are optional public client build configuration. If any value is absent, `main.dart` injects a disabled ShipGlows auth adapter and the read-only local Cockpit remains available.
- Privileged Firebase service-account credentials are never Flutter build values.
- The managed runner owns neutral `AgentRuntime`, `ExecutionProvider`, `CapabilityBroker`, and `ModelGateway` contracts. Flutter consumes only normalized ShipGlows API/event types, never a runtime wire protocol.

## Validation

```bash
rg -n "APP_TARGET|LegacyShipGlowsApp" app/lib app/test
rg -n "package:shipglows_app/(providers/providers\\.dart|data/services/|router\\.dart)" app/lib/shipglows
cd app && flutter test test/widget_test.dart && flutter analyze
```

The first two searches must return no active-runtime dependency or selector.

## Reader Checklist

- Does this change stay inside the single ShipGlows product runtime?
- Does a new shared import have a documented current purpose?
- Could a dormant route, provider, service, or auth path become executable accidentally?
- Does Flutter remain isolated from runtime-specific wire protocols and privileged credentials?

## Maintenance Rule

Any change to app bootstrapping, root providers, route ownership, or the runner/client boundary must update this document in the same chantier.
