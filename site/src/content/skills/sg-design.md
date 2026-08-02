---
title: "sg-design"
slug: "sg-design"
tagline: "One design skill, with explicit modes and rigorous playbooks."
summary: "The single public design entrypoint for system creation, playgrounds, UI/token/component/accessibility audits, implementation, proof, verification, and shipping."
category: "Build & Fix"
audience:
  - "Founders who know what feels wrong visually but do not want to choose between design skills"
  - "Teams migrating from scattered design values to a real token system"
  - "Builders who need visual proof and non-regression checks after UI changes"
problem: "Design work spans tokens, components, layout, accessibility, screenshots, and implementation. Without one public entrypoint, the operator has to choose among overlapping commands and determine when centralization still needs a site-wide migration."
outcome: "You get the right design route: audit, token creation, playground, component or accessibility review, spec-first implementation, browser proof, verification, and ship routing when the work is ready."
founder_angle: "This is the practical default when the request is simply about design. It keeps specialist quality without making you memorize the design-system workflow."
when_to_use:
  - "When you have a design-related question and are not sure which design mode applies"
  - "When token centralization needs to become a real site-wide implementation"
  - "When a redesign, visual cleanup, accessibility fix, or token migration spans more than one surface"
what_you_give:
  - "A design goal, page, route, screenshot description, or rough design concern"
  - "Any constraints such as no visual regression, brand direction, or target pages"
what_you_get:
  - "One explicit design mode with its matching bounded playbook"
  - "Spec-first implementation when the design work is broad or proof-sensitive"
  - "Checks, browser proof, and verification routing for visible design claims"
  - "An explicit handoff from token centralization to full-site token consumption when needed"
example_prompts:
  - "/sg-design system src/styles/global.css"
  - "/sg-design playground /design-system"
  - "/sg-design audit ui src/pages/pricing.astro"
  - "/sg-design audit tokens"
  - "/sg-design audit components src/components"
  - "/sg-design audit a11y src/components"
  - "/sg-design redesign src/pages/pricing.astro"
  - "/sg-design migration src/pages"
argument_modes:
  - argument: "system [scope]"
    effect: "Loads the design-system creation playbook from existing UI evidence."
    consequence: "Use when no coherent token authority exists."
  - argument: "audit <ui|tokens|components|a11y> [scope]"
    effect: "Loads exactly the named audit playbook; bare audit asks for a subtype."
    consequence: "Use for a bounded professional diagnosis without another public command."
  - argument: "playground [route-path]"
    effect: "Routes to the design-system playground when a token layer exists."
    consequence: "Useful for live visual token review."
  - argument: "redesign [scope]"
    effect: "Audits the current surface, resolves visual direction, and routes broad implementation through a ready spec."
    consequence: "Use when the intended result changes visual direction rather than only repairing drift."
  - argument: "migration [scope]"
    effect: "Measures design-token consumption and routes a bounded cross-surface migration through the lifecycle."
    consequence: "Use when the authority exists but pages or components still bypass it."
limits:
  - "It is the sole public design command; each mode keeps detailed procedure in a local playbook."
  - "Broad redesigns and multi-page migrations require a ready spec before implementation."
related_skills:
  - "sg-build"
  - "sg-verify"
featured: true
order: 500
---
