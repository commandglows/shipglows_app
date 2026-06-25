---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-30"
created_at: "2026-05-30 20:44:06 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 20:44:06 UTC"
status: draft
source_skill: sf-start
scope: "product-entitlements"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "ShipFlow App access state"
  - "WinFlowz suite ledger"
  - "AppBootstrap"
  - "Firestore projection target"
depends_on:
  - artifact: "shipflow_data/workflow/specs/shipflow-product-entitlements-compliance.md"
    artifact_version: "1.0.1"
    required_status: active
supersedes: []
evidence:
  - "Local implementation created ProductEntitlementSnapshot and fail-closed AppAccessState mapping."
next_review: "2026-06-30"
next_step: "/sf-verify ShipFlow Product Entitlements Compliance"
---

# Product Entitlements

ShipFlow App separates identity, GitHub authorization, cache, and product access. The canonical product id is `shipflow_app`.

WinFlowz suite ledger is the durable source of truth. ShipFlow App may keep a bounded snapshot or server-owned mirror, but it must not create a second durable entitlement ledger.

## Status Mapping

| Status | `grantsAccess` | Consequence |
| --- | --- | --- |
| `active` | true when server says true and environment matches | Protected data can load after other gates pass. |
| `trialing` | true only when non-expired and server says true | Protected data can load during valid trial. |
| `inactive` | false | Recognized account, inactive access. |
| `expired` | false | Denied. Cache cannot revive access. |
| `revoked` | false | Denied. |
| `refunded` | false | Denied. |
| `pending_review` | false | Recognized account, pending review. |
| unknown, missing, malformed, unavailable | false | Fail closed. |

## Snapshot Contract

Trusted bootstrap snapshots use:

- `product_id=shipflow_app`
- `environment`
- `status`
- `grants_access`
- optional `plan_id`
- optional `expires_at`
- optional safe `reason`

Top-level client-supplied `product_id`, `plan_id`, `global_user_id`, `grants_access`, status, role, quota, or billing fields are not authority.

## Environment And Cache Policy

Entitlements are environment-scoped. Missing or mismatched environment denies access.

`OPEN_ACCESS` can create demo/local behavior, but it cannot grant protected workspace data.

Cached bootstrap is diagnostic context only. Backend unavailable plus cache keeps `canUseWorkspaceData=false`.

## Support Redaction

Support output may include product id, environment, status, reason, timestamps, request id, and redacted user identifiers. It must not include tokens, cookies, provider secrets, raw webhook/payment payloads, activation codes, service credentials, private clone URLs, or local clone paths.

## Validation

```bash
rg -n "shipflow_app|grantsAccess|suite ledger|fail closed|OPEN_ACCESS|cache" shipflow_data/technical/product-entitlements.md
flutter test test/data/models/app_entitlement_test.dart test/core/app_access_resume_test.dart
```
