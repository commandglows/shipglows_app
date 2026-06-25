---
artifact: verification_checklist
metadata_schema_version: "1.0"
artifact_version: "1.0.3"
project: "shipflow_app"
created: "2026-05-30"
created_at: "2026-05-30 20:44:06 UTC"
updated: "2026-05-30"
updated_at: "2026-05-30 21:04:26 UTC"
status: active
source_skill: sf-start
scope: "shipflow-product-entitlements-compliance"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "AppAccessState"
  - "AppBootstrap"
  - "Entry screen"
  - "support runbook"
depends_on:
  - artifact: "shipflow_data/workflow/specs/shipflow-product-entitlements-compliance.md"
    artifact_version: "1.0.1"
    required_status: active
supersedes: []
evidence:
  - "flutter test test/data/models/app_entitlement_test.dart test/core/app_access_resume_test.dart test/core/offline_sync_test.dart test/navigation/resume_no_jump_test.dart"
  - "flutter analyze"
  - "python3 /home/claude/shipflow/tools/shipflow_metadata_lint.py selected ShipFlow artifacts"
next_review: "2026-06-30"
next_step: "/sf-ship ShipFlow Product Entitlements Compliance verification trace"
---

# Verification: ShipFlow Product Entitlements Compliance

## Scenarios

| Scenario | Proof | Result |
| --- | --- | --- |
| `ENT-PREFLIGHT-001` | Docs state suite ledger first and no local durable ledger. | PASS: `product-entitlements.md` and bridge contract state suite-ledger-first. |
| `ENT-PRODUCT-001` | `product_id=shipflow_app`. | PASS: constant and tests use `shipflow_app`. |
| `ENT-SNAPSHOT-001` | Active/trialing grant, denied statuses fail closed. | PASS: `app_entitlement_test.dart` and access-state tests. |
| `ENT-AUTH-001` | Auth without entitlement is denied. | PASS: `noEntitlement` access-state test. |
| `ENT-GITHUB-001` | GitHub cannot bypass entitlement. | PASS: documented invariant; no GitHub gate grants product access in this slice. |
| `ENT-CACHE-001` | Cached bootstrap cannot grant protected access. | PASS: `offline_sync_test.dart` asserts degraded cache has `canUseWorkspaceData=false`. |
| `ENT-OPEN-001` | Open access cannot grant protected access. | PASS: `canUseWorkspaceData` only true for ready/onboarding entitlement states. |
| `ENT-ENV-001` | Environment mismatch denies. | PASS: runtime environment check added before ready/onboarding. |
| `ENT-CLIENT-001` | Client top-level forged fields ignored. | PASS: model test keeps top-level forged fields from granting access. |
| `ENT-SUPPORT-001` | Support diagnostics are redacted. | PASS: support runbook lists safe/forbidden identifiers. |

## Required Local Checks

```bash
flutter test test/data/models/app_entitlement_test.dart test/core/app_access_resume_test.dart test/core/offline_sync_test.dart test/navigation/resume_no_jump_test.dart
flutter analyze
python3 /home/claude/shipflow/tools/shipflow_metadata_lint.py shipflow_data/technical/product-entitlements.md shipflow_data/technical/product-entitlement-bridge-contract.md shipflow_data/technical/product-entitlements-support-runbook.md shipflow_data/workflow/verification/shipflow-product-entitlements-compliance.md shipflow_data/workflow/specs/shipflow-product-entitlements-compliance.md
```

## Preview And Production Proof

This project is `vercel-preview-push`; browser/user-flow proof requires `/sf-ship` then `/sf-prod` for a matching Vercel deployment if hosted behavior is claimed.

Post-ship production deployment `dpl_491rXUVf8JMBvUiU5PNFC95q5mMi` is `Ready`, commit `1e835bb` has successful GitHub status, and `https://shipflowapp.vercel.app/` returned HTTP 200 with ShipFlow and `flutter_bootstrap.js` markers on 2026-05-30 20:59:30 UTC.

Chromium headless proof on 2026-05-30 21:01:09 UTC rendered the Flutter UI instead of a gray page. Visible state: sidebar with ShipFlow, Overview, Diagnostics, Settings; header `ShipFlow Operations Dashboard`; main panel message `No projects found in PROJECTS.md.` Screenshot evidence: `/tmp/shipflowapp-prod-sf-browser.png`. DOM proof included `main.dart.js`, `flutter_bootstrap.js`, `flutter-view`, and title `ShipFlow Operations Dashboard`.

Final sf-verify reconciliation on 2026-05-30 21:04:26 UTC: browser proof gap is closed for this chantier. Local contract proof remains the focused Flutter test suite plus full analyzer from 2026-05-30 20:59 UTC, production proof remains Vercel `Ready` plus HTTP 200, and metadata lint passes after the verification trace. Historical high-severity bug files still exist as active records, but their current symptom risk does not block this chantier because the current production browser evidence shows a rendered Flutter UI rather than the blank gray page.
