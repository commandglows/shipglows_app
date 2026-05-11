---
title: "sf-design-playground"
slug: "sf-design-playground"
tagline: "Generate a live design-system playground so token decisions become visible instead of abstract."
summary: "A scaffolding skill that creates a versioned page for previewing and editing design tokens in real time."
category: "Meta & Setup"
audience:
  - "Founders iterating on a product design system"
  - "Teams that need a visual token workspace without full Storybook overhead"
problem: "Design-token work is slow when every change requires editing code blindly and hunting through the product to judge impact."
outcome: "You get a dedicated playground page where colors, spacing, type, and motion can be inspected more concretely."
founder_angle: "This skill matters when visual consistency is becoming a system problem. It turns token work into a visible tool, then points to sf-design when the centralized values still need to be implemented across the site."
when_to_use:
  - "When the project has a token layer worth iterating on directly"
  - "When designers or founders need a quicker feedback loop on visual primitives"
  - "When an audit points to weak or invisible token infrastructure"
what_you_give:
  - "A frontend project with a design-token layer"
  - "The current design-system structure"
what_you_get:
  - "A versioned design-system preview route"
  - "A clearer workspace for token iteration"
  - "A stronger visual foundation for later design cleanup"
  - "A clear handoff to sf-design when token centralization still needs site-wide consumption and visual proof"
example_prompts:
  - "/sf-design-playground"
  - "/sf-design-playground v2"
  - "/sf-design-playground for app theme"
limits:
  - "It generates tooling around the design system; it does not solve token strategy by itself"
  - "Projects with no meaningful token layer should start with sf-design-from-scratch"
  - "It does not prove that every page consumes the centralized token source"
related_skills:
  - "sf-design"
  - "sf-design-from-scratch"
  - "sf-audit-design-tokens"
  - "sf-audit-design"
  - "sf-scaffold"
featured: false
order: 510
---
