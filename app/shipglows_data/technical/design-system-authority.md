---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-06-11"
updated: "2026-06-11"
status: draft
source_skill: 300-sf-docs
scope: "design-system-authority"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "site/src/styles/global.css"
  - "app/lib/presentation/theme/app_theme.dart"
  - "/home/claude/shipglowz/shipglows_data/business/branding.md"
  - "/home/claude/shipglowz/shipglows_data/technical/design-system-authority.md"
depends_on:
  - artifact: "/home/claude/shipglowz/shipglows_data/business/branding.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/workflow/specs/shipglows-legacy-contentflow-fusion.md"
    artifact_version: "0.1.0"
    required_status: active
supersedes: []
evidence:
  - "User direction in 2026-06-11 that design changes for managed UIs must go through a declared design authority."
  - "Flutter theme is carried in `app/lib/presentation/theme/app_theme.dart` and site token entry is `site/src/styles/global.css`."
next_review: "2026-07-11"
next_step: "/sf-docs update shipglows_data/technical/design-system-authority.md"
---

# Design-System Authority

## Purpose

This project has two UI surfaces (`app/` Flutter and `site/` Astro marketing site). They must not drift independently.

For `shipglows_app`, design authority is declared in two parts:

- **Brand contract**: `/home/claude/shipglowz/shipglows_data/business/branding.md`
- **Surface carriers**:
  - `site/src/styles/global.css` (CSS custom properties)
  - `app/lib/presentation/theme/app_theme.dart` (Flutter theme + palette extension)

The authority is **split by platform** today, with one common product-direction contract above it. New UI changes are blocked unless they are represented in at least one surface token carrier.

## Declaration

```yaml
design_system_authority:
  status: declared
  brand_contract: /home/claude/shipglowz/shipglows_data/business/branding.md
  technology_carriers:
    - site/src/styles/global.css
    - app/lib/presentation/theme/app_theme.dart
  canonical_source: /home/claude/shipglowz/shipglows_data/technical/design-system-authority.md
  mandatory_scope:
    - color
    - typography
    - spacing
    - radius
    - shadows
    - motion
  validation:
    - python3 /home/claude/shipglowz/tools/design_system_drift_check.py --root /home/claude/shipglowz_app/app --warn-only --format markdown
    - python3 /home/claude/shipglowz/tools/design_system_drift_check.py --root /home/claude/shipglowz_app/site --warn-only --format markdown
  forbidden_bypass:
    - inline visual literals in app/site screens/widgets
    - one-off typography sizing
    - one-off spacing/radius/shadow declarations
    - platform-specific token drift between app and site
```

## Governing Rule

For a production UX or app-screen change, the implementation must:

1. declare or reuse a semantic token in the relevant carrier,
2. consume tokens through that carrier in the screen/widget,
3. avoid introducing new hardcoded color/spacing/font/radius/shadow/motion literals.

## Stop Conditions

- A design surface change adds direct hardcoded values without a token path.
- The app and site define inconsistent typography, spacing, or contrast standards without a documented exception.
- A token is added in only one surface while the other surface receives a directly equivalent visual change.

## Maintenance Rule

If this surface adds a shared token source (e.g. DTCG JSON, shared theme package), update this artifact and `shipglows_data/technical/code-docs-map.md` before implementing UI changes.
