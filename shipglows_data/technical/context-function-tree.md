---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "2.0.0"
project: "shipglows_app"
created: "2026-04-27"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: "context-function-tree"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/lib/shipglows/"
  - "runner/src/"
  - "site/src/"
depends_on:
  - artifact: "shipglows_data/technical/context.md"
    artifact_version: "2.0.0"
    required_status: reviewed
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/context-function-tree.md"
evidence:
  - "Current monorepo source tree and code-docs map."
next_review: "2026-09-03"
next_step: "Add behavior indexes if Cockpit, conversations, or Workspace navigation becomes costly."
---

# Context Function Tree

## Flutter Application

```text
app/lib/main.dart
└── app/lib/shipglows/app.dart
    ├── router.dart
    ├── auth/
    ├── data/
    │   ├── cockpit/
    │   └── managed_runner_api.dart
    ├── providers/
    │   ├── managed_cockpit_provider.dart
    │   ├── managed_conversation_provider.dart
    │   └── managed_workspace_provider.dart
    └── presentation/
        ├── screens/overview_screen.dart
        ├── screens/project_detail_screen.dart
        ├── screens/operator_workspace_screen.dart
        └── widgets/managed_conversation_panel.dart
```

## Managed Runner

```text
runner/src/main.ts
└── runner/src/app.ts
    ├── auth/
    ├── projects/
    ├── contracts/
    ├── runtimes/
    ├── runs/
    ├── github/
    ├── workspaces/
    ├── events/
    └── db/
```

## Public Site

```text
site/src/
├── pages/
├── content/
├── components/
└── styles/
```

## Governance Navigation

```text
shipglows_data/
├── business/
├── editorial/
├── technical/
└── workflow/
    ├── specs/
    ├── verification/
    └── archives/
```

## Legacy Boundary

The older ContentFlow runtime remains under legacy Flutter modules such as `app/lib/router.dart`, `app/lib/presentation/`, and `app/lib/data/services/`. Consult the legacy inventory before adapting or removing it; do not use those modules as current ShipGlows entrypoints.

## Validation

```bash
rg -n "class ShipGlowsApp|createShipGlowsRouter|buildRunnerApp" app/lib runner/src
```

## Maintenance Rule

Update this tree when primary entrypoints, subsystem ownership, or canonical governance families move.
