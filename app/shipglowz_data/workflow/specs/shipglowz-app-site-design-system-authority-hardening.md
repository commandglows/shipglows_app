---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglowz_app"
created: "2026-06-11"
created_at: "2026-06-11 17:00:00 UTC"
updated: "2026-06-11"
updated_at: "2026-06-11 17:00:00 UTC"
status: draft
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "app-site-design-system-authority-hardening"
owner: "Diane"
confidence: medium
user_story: "En tant qu'utilisatrice ShipGlowz, je veux que l'application Flutter et le site marketing partagent un contrat de design strict pour éviter tout quick-fix visuel, conserver une image pro, et rendre impossible la customisation hors tokens centralisés."
risk_level: "high"
security_impact: "none"
docs_impact: "yes"
linked_systems:
  - "site/src/styles/global.css"
  - "app/lib/presentation/theme/app_theme.dart"
  - "shipglowz_data/technical/design-system-authority.md"
  - "app/lib/presentation"
  - "site/src/components"
depends_on:
  - artifact: "shipglowz_data/technical/design-system-authority.md"
    artifact_version: "1.0.0"
    required_status: draft
  - artifact: "shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md"
    artifact_version: "0.1.0"
    required_status: active
supersedes: []
evidence:
  - "site uses CSS custom properties in `site/src/styles/global.css` as the style entry point for marketing UI."
  - "Flutter theme is centralized in `app/lib/presentation/theme/app_theme.dart` and consumed in app UI layers."
  - "No shared design-system contract exists today between web and Flutter token carriers."
next_step: "/sf-ready shipglowz-app-site design-system authority hardening"
---
# Spec: shipglowz_app – App & Site Design-System Authority Hardening

# Title

shipglowz_app – App & Site Design-System Authority Hardening

## Status

Draft for execution planning. This spec defines non-negotiable design rules before any further UI edits are accepted for `shipglowz_app`.

## User Story

En tant qu'utilisatrice ShipGlowz, je veux que les interfaces site et app restent sur un style systematique, cohérent, et professionnel, de sorte qu'aucun agent ni développeur ne puisse appliquer des modifications visuelles adhoc sans passer par les tokens centralisés.

## Minimal Behavior Contract

Any UI change touching app or site screens in production scope must:

- Use declared design tokens for colors, typography, spacing, radius, shadows, and motion where available.
- Avoid introducing inline visual literals in production screens/widgets as first-class values.
- Document any cross-surface exception (app-only or site-only) in `shipglowz_data/technical/design-system-authority.md` before merging.
- Keep app and site directionally aligned in brand level (tone, density, hierarchy, contrast, spacing intent) even if carriers are platform-specific.

## In Scope

- `site/src/styles/global.css` and `site/src/components/**`.
- `app/lib/presentation/theme/app_theme.dart` and `app/lib/presentation/**` screens/widgets.
- `shipglowz_data/technical/design-system-authority.md` and related workflow specs.

## Out of Scope

- Refactoring non-UI runtime, auth, Firestore, indexing, or ingestion.
- Complete visual rebranding.
- Mobile/web engine migrations.

## Hardening Constraints

- `Color(0x...)`, `Colors.`, `const EdgeInsets`, `BorderRadius`, `letter-spacing`, `fontWeight`, `Duration`, and `BoxShadow` values in production UI code must be traceable to a named token in the local carrier or an approved exception.
- Any new screen-level visual constant must be added through the declared carrier and not as raw literals.
- App and site may keep distinct carriers, but they must implement the same design intent for shared sections (brand colors, base scale, spacing rhythm, border radius family, elevation behavior).

## Required Deliverables

1. **Formal declaration extension**
   - Keep `shipglowz_data/technical/design-system-authority.md` as the canonical contract.
   - Add `design_system_authority` status by surface and document accepted exceptions.

2. **Carrier discipline**
   - For all future changes, site values flow through `:root` tokens.
   - For all future changes, Flutter values flow through token fields in `AppTheme`/`AppThemePalette` or similarly centralized surfaces.

3. **Cross-surface contract checks**
   - Document mapping rules for shared values (ex: primary/secondary, accent, background tiering, typography scale, panel radius).
   - Add these mappings to the spec itself and keep them updated.

4. **Guardrails before merge**
- Require explicit visual-review proof for app and site when tokens are introduced or moved.
- Gate on drift checks focused on changed files.

## Validation Commands

```bash
python3 /home/claude/shipglowz/tools/design_system_drift_check.py --root /home/claude/shipglowz_app --changed --warn-only
rg -n "Color\(0x|Colors\.|EdgeInsets|BorderRadius\.circular\(|BoxShadow\(|letter-spacing|fontWeight:|font-size|duration" app/lib/presentation site/src
python3 /home/claude/shipglowz/tools/shipglowz_metadata_lint.py shipglowz_data/technical/design-system-authority.md shipglowz_data/workflow/specs/shipglowz-app-site-design-system-authority-hardening.md shipglowz_data/workflow/verification/shipglowz-app-site-design-system-authority-hardening.md
```

## Acceptance Criteria

- New UI edits in reviewed files reference tokenized values or an explicit documented exception.
- No agent can justify hardcoded visual values for production screens without a declared token path.
- Site/app remain aligned at contract level (brand colors, typography intent, density level, spacing rhythm, corner/shadow language).
- Verification checklist is updated and passed for each implementation slice.

## Risks

- Legacy screens currently include numerous direct literals from earlier runtime migrations; this spec does not force immediate full cleanup, but forbids new drift without declaration.
- `web_auth` assets are legacy and intentionally excluded from this hardening scope unless they become user-facing ShipGlowz UX.

## Open Edge Cases

- Different typography capabilities between web and Flutter for exact matching.
- Accessibility touch-target and contrast requirements on mobile layouts.
- Animated states that require platform-specific motion tokens.

## Task Plan

- [ ] Update `shipglowz_data/technical/design-system-authority.md` with explicit mapping and exception list for app/site.
- [ ] Align this spec with code owners and UI owners before any design-capable screen commit.
- [ ] Add/update verification trace for each PR touching `app/lib/presentation/**` or `site/src/**`.
- [ ] Run token drift check on changed files for every design PR.
- [ ] Add a short visual proof route for both surfaces when design rules changed.
