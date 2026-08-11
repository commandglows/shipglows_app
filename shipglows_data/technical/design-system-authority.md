---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "shipglows_app"
created: "2026-06-11"
updated: "2026-08-11"
status: active
source_skill: 001-sg-build
scope: "design-system-authority"
owner: "Diane"
confidence: high
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "app/lib/presentation/theme/app_theme.dart"
  - "app/lib/shipglows/app.dart"
  - "site/src/styles/global.css"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.20.0"
    required_status: ready
supersedes:
  - "shipglows_data/technical/design-system-authority.md@1.0.0"
evidence:
  - "ShipGlowsApp consumes AppTheme.lightTheme and AppTheme.darkTheme directly and follows ThemeMode.system."
  - "AppThemeTokens exposes named layout, responsive, focus, semantic-state, and motion tokens for the Cockpit and conversation lots."
  - "Flutter theme tests cover light/dark construction, token availability, key non-text contrast, and the absence of a second theme builder in ShipGlowsApp."
next_review: "2026-09-11"
next_step: "Migrate Task 9 Cockpit and conversation widgets to consume AppThemeTokens, with drift delta and visual proof."
---

# Design-System Authority

## Purpose

ShipGlows has one Flutter product runtime and one Flutter design-system authority. UI code must obtain theme, semantic colors, layout dimensions, responsive behavior, focus treatment, and motion values from the canonical carrier instead of constructing local visual systems.

The public Astro site is a separate surface with its own CSS carrier. The app and site share product and brand direction, but no resolved-value parity is claimed: a token on one platform does not automatically define an equivalent token on the other.

## Canonical Flutter Carrier

`app/lib/presentation/theme/app_theme.dart` is the sole Flutter carrier. It owns:

- `AppTheme.lightTheme` and `AppTheme.darkTheme`;
- the Material color schemes, typography, component defaults, and padded tap-target policy;
- `AppThemePalette` for surface roles;
- `AppThemeTokens` for spacing and density, radii, responsive breakpoints and window classes, navigation dimensions, minimum targets, Cockpit and conversation dimensions, focus, health/access/execution states, and motion.

`app/lib/shipglows/app.dart` consumes these two canonical themes and uses `ThemeMode.system`. It must not contain a second `ThemeData` builder.

## Surface Separation

```yaml
design_system_authority:
  flutter:
    canonical_carrier: app/lib/presentation/theme/app_theme.dart
    consumer_root: app/lib/shipglows/
    theme_mode: system
  site:
    carrier: site/src/styles/global.css
    relationship: independent_platform_mapping
  cross_surface_parity:
    claimed: false
    rule: document intentional equivalence before claiming resolved-value parity
```

The Astro carrier is not an alternate Flutter authority. Flutter changes do not require a matching site token unless the same product decision is intentionally implemented on both surfaces.

## Consumption Rules

For every new or modified Flutter screen or widget:

1. use `Theme.of(context)` for Material roles;
2. use `AppTheme.paletteOf(context)` for named surfaces;
3. use `AppTheme.tokensOf(context)` for layout, responsive, focus, semantic status, and motion values;
4. add a named token to the carrier before introducing a new visual value;
5. preserve `unknown` and unavailable states rather than mapping them to a healthy color;
6. pair semantic colors with text, icon, or shape cues; color alone must not carry state.

Definition literals are allowed inside the canonical carrier. They are forbidden as one-off design decisions in ShipGlows screens and widgets.

## Token Contract

The canonical extension exposes these stable groups:

| Group | Intended consumers |
| --- | --- |
| `spacing`, `density`, `radii` | layout and component composition |
| `breakpoints` | compact, medium, and expanded window behavior |
| `navigation` | mobile bar and navigation rail sizing |
| `minimumTarget` | touch, pointer, and keyboard-operable controls |
| `cockpit`, `conversation` | Task 9–10 layouts without local dimensions |
| `focus` | visible keyboard focus treatment |
| `health`, `access`, `execution` | semantic project and run states |
| `motion` | bounded interface transitions |

Tokens are semantic API, not permission to duplicate their resolved values elsewhere.

## Validation

Run the following from the repository root or `app/` as appropriate:

```bash
cd app
dart format lib/presentation/theme/app_theme.dart lib/shipglows/app.dart test/shipglows/theme
flutter test test/shipglows/theme
flutter analyze

python3 /home/claude/shipglows/tools/design_system_drift_check.py \
  --root /home/claude/shipglows_app/app/lib/shipglows \
  --warn-only \
  --format markdown
```

The drift report is an adoption baseline. Existing findings remain debt for the following Task 9–10 lots; a change must not add unexplained drift.

## Stop Conditions

- `ShipGlowsApp` or another Flutter runtime constructs a competing `ThemeData`.
- A changed screen/widget adds an unexplained visual literal instead of consuming or extending `AppThemeTokens`.
- Light or dark mode lacks the required theme extension or a key semantic/focus color falls below 3:1 non-text contrast against the app canvas.
- A responsive behavior introduces a local breakpoint instead of `AppBreakpointTokens`.
- App/site parity is claimed without an explicit canonical mapping and resolved-value proof.

## Current Adoption State

- Token source: updated.
- ShipGlows root theme consumption: complete.
- Screen/widget token consumption: partial; the pre-existing Task 9–10 drift baseline remains.
- Visual proof: not part of this carrier-only lot; required when consuming screens/widgets adopt the carrier.
