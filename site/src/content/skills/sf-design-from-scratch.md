---
title: "sf-design-from-scratch"
slug: "sf-design-from-scratch"
tagline: "Create a professional design system from the UI you already have."
summary: "A specialist build skill that extracts fonts, colors, modular type scale, spacing, radius, theme, and motion from an existing frontend, then centralizes them into a maintainable design-system source of truth."
category: "Build & Fix"
audience:
  - "Founders whose app has visual drift but no real design system"
  - "Teams that need a professional token system before playgrounds or deep token audits"
problem: "A product can look acceptable while still being hard to improve because fonts, colors, spacing, and sizes are scattered across pages and components."
outcome: "You get a complete, disciplined design-system source of truth that keeps the strongest existing visual signals, converts typography to a modular scale, and replaces repeated literals with central variables."
founder_angle: "This is the practical first step when the design system does not exist yet. It turns scattered visual choices into a professional source of truth that future work can build on."
when_to_use:
  - "When a project has no coherent design-token system"
  - "When design values are hardcoded across pages and components"
  - "Before running a design playground on a project with no token layer"
what_you_give:
  - "A frontend project, route, or representative page set"
  - "Any existing brand or visual direction"
what_you_get:
  - "A complete token system across color, typography, spacing, radius, theme, and motion"
  - "A modular typography scale, optionally fluid with clamp()"
  - "A bounded migration from hardcoded values to variables"
  - "A route toward sf-design, sf-design-playground, and sf-audit-design-tokens"
example_prompts:
  - "/sf-design-from-scratch"
  - "/sf-design-from-scratch src/pages/index.astro"
  - "/sf-design-from-scratch with-playground"
argument_modes:
  - argument: "tokens-only"
    effect: "Creates the centralized professional token system without adding playground tooling."
    consequence: "Useful when you want the first safe migration without playground scope."
  - argument: "with-playground"
    effect: "Creates the token system, then routes to the design playground once tokens exist."
    consequence: "Useful when live visual editing is part of the current design-system pass."
limits:
  - "It creates the design-system source of truth; it does not replace broader design audit, component audit, or accessibility audit."
  - "Large multi-page migrations should still use a ready spec before sweeping the whole app."
  - "Token centralization is not finished until pages and components consume the centralized source and visual proof passes."
related_skills:
  - "sf-design"
  - "sf-design-playground"
  - "sf-audit-design-tokens"
  - "sf-audit-design"
  - "sf-audit-components"
  - "sf-audit-a11y"
featured: false
order: 505
---
