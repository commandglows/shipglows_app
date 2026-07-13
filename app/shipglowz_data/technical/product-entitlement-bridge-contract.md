---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-30"
created_at: "2026-05-30 20:44:06 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 20:44:06 UTC"
status: draft
source_skill: sf-start
scope: "product-entitlement-bridge-contract"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "ShipGlowz backend bridge target"
  - "WinFlowz suite ledger"
  - "AppBootstrap entitlement snapshot"
depends_on:
  - artifact: "shipglowz_data/technical/product-entitlements.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "WinFlowz suite bridge patterns exist for other products."
next_review: "2026-06-30"
next_step: "/sf-verify ShipGlowz Product Entitlements Compliance"
---

# Product Entitlement Bridge Contract

This is the future trusted backend to WinFlowz suite lookup contract. It is not a hosted implementation.

## Request

The browser must not call the suite ledger directly. A trusted backend derives identity, product, and environment server-side, then requests `product_id=shipglowz_app`.

```json
{
  "product_id": "shipglowz_app",
  "environment": "preview",
  "subject": {"provider_user_id": "redacted"},
  "request_id": "req_..."
}
```

## Response

```json
{
  "product_id": "shipglowz_app",
  "environment": "preview",
  "status": "active",
  "grants_access": true,
  "reason": "entitlement_active",
  "plan_id": "starter"
}
```

## Errors

- `unauthorized`: bridge credential invalid.
- `unavailable`: suite timeout or lookup unavailable.
- `contract_error`: product mismatch, environment mismatch, or malformed response.
- valid denied snapshot: account recognized, product data denied.

All errors fail closed. Logs are redacted.

## Validation

```bash
rg -n "product_id|shipglowz_app|environment|grantsAccess|grants_access|unauthorized|unavailable|redacted" shipglowz_data/technical/product-entitlement-bridge-contract.md
```
