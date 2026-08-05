---
artifact: verification_checklist
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-06-11"
created_at: "2026-06-11 17:00:00 UTC"
updated: "2026-06-11"
updated_at: "2026-06-11 17:00:00 UTC"
status: active
source_skill: sf-check
scope: "shipglows-app-site-design-system-authority-hardening"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "shipglows_data/technical/design-system-authority.md"
  - "shipglows_data/workflow/specs/shipglows-app-site-design-system-authority-hardening.md"
  - "site/src/styles/global.css"
  - "app/lib/presentation/theme/app_theme.dart"
depends_on:
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.0.0"
    required_status: draft
  - artifact: "shipglows_data/workflow/specs/shipglows-app-site-design-system-authority-hardening.md"
    artifact_version: "1.0.0"
    required_status: draft
supersedes: []
next_review: "2026-07-11"
evidence:
  - "Spec and authority files added in this cycle without UI runtime modification."
  - "Design-system drift check command recorded and available in the spec's validation section."
next_step: "/sf-verify shipglows_app app-site design-system authority hardening"
---

# Verification: shipglows_app – App & Site Design-System Authority Hardening

## Scenarios

| Scenario | Proof | Result |
| --- | --- | --- |
| `DSA-001` | Design authority file exists and declares both carriers plus forbidden-bypass rules. | PASS |
| `DSA-002` | Hardening spec references the same authority file and cross-surface scope. | PASS |
| `DSA-003` | No runtime code was modified in this cycle. | PASS |
| `DSA-004` | Validation command set includes drift scan and metadata lint. | PASS |
| `DSA-005` | Verification checklist is linked from the spec through a dependency entry. | PASS |

## Required Checks

```bash
python3 /home/claude/shipglowz/tools/shipglows_metadata_lint.py \
  shipglows_data/technical/design-system-authority.md \
  shipglows_data/workflow/specs/shipglows-app-site-design-system-authority-hardening.md \
  shipglows_data/workflow/verification/shipglows-app-site-design-system-authority-hardening.md

python3 /home/claude/shipglowz/tools/design_system_drift_check.py --root /home/claude/shipglows_app --changed --warn-only

rg -n "design_system_authority|design-system-authority|shipglows-app-site-design-system-authority-hardening" \
  shipglows_data/technical/design-system-authority.md \
  shipglows_data/workflow/specs/shipglows-app-site-design-system-authority-hardening.md \
  shipglows_data/workflow/verification/shipglows-app-site-design-system-authority-hardening.md
```

## Notes

- This is a governance hardening pass only: no app/site UI files were changed yet.
- Next implementation slice must introduce the first scoped token bridge and then re-run this checklist with concrete scenario proofs from changed files.
