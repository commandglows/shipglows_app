---
artifact: runbook
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglows_app"
created: "2026-05-30"
created_at: "2026-05-30 20:44:06 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 20:44:06 UTC"
status: draft
source_skill: sf-start
scope: "product-entitlements-support"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "ShipGlows entry screen"
  - "AppAccessState diagnostics"
  - "WinFlowz suite ledger"
depends_on:
  - artifact: "shipglows_data/technical/product-entitlements.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Product entitlement compliance implementation added support-safe entry states."
next_review: "2026-06-30"
next_step: "/sf-verify ShipGlows Product Entitlements Compliance"
---

# Product Entitlements Support Runbook

Use this runbook to diagnose recognized users without granting access outside the suite ledger.

## Safe Identifiers

Allowed: `product_id=shipglows_app`, environment, redacted user id, visible email, status, reason code, request id, `checked_at`, `expires_at`, backend status.

Forbidden: bearer tokens, cookies, raw provider tokens, provider secrets, raw webhook/payment payloads, activation codes, service credentials, private clone URLs, local clone paths.

## Triage

| State | Meaning | Action |
| --- | --- | --- |
| recognized, no access | No active `shipglows_app` entitlement. | Confirm suite ledger access path. |
| revoked | Ledger revoked access. | Escalate with safe identifiers. |
| refunded | Ledger refunded access. | Route to billing/support. |
| expired | Trial/subscription expired. | Route to renewal/support. |
| pending_review | Access awaits review. | Escalate with request id. |
| wrong environment | Snapshot environment mismatch. | Check deployment configuration. |
| unavailable | Bridge/backend cannot verify entitlement. | Retry and check suite/backend status. |
| stale cache | Cache exists but entitlement is denied/unavailable. | Keep protected data denied. |

## Validation

```bash
rg -n "recognized|no access|revoked|refunded|pending_review|wrong environment|redacted|shipglows_app" shipglows_data/technical/product-entitlements-support-runbook.md
```
