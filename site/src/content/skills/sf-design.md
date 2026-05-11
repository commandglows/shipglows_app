---
title: "sf-design"
slug: "sf-design"
tagline: "Ask one design question and let ShipFlow choose the right design workflow."
summary: "A master design lifecycle skill that routes design questions through audits, token systems, playgrounds, implementation, browser proof, verification, and shipping."
category: "Build & Fix"
audience:
  - "Founders who know what feels wrong visually but do not want to choose between design skills"
  - "Teams migrating from scattered design values to a real token system"
  - "Builders who need visual proof and non-regression checks after UI changes"
problem: "Design work spans tokens, components, layout, accessibility, screenshots, and implementation. Without a master entrypoint, the operator has to know which specialist skill to launch and when centralization still needs a site-wide migration."
outcome: "You get the right design route: audit, token creation, playground, component or accessibility review, spec-first implementation, browser proof, verification, and ship routing when the work is ready."
founder_angle: "This is the practical default when the request is simply about design. It keeps specialist quality without making you memorize the design-system workflow."
when_to_use:
  - "When you have a design-related question and are not sure which skill owns it"
  - "When token centralization needs to become a real site-wide implementation"
  - "When a redesign, visual cleanup, accessibility fix, or token migration spans more than one surface"
what_you_give:
  - "A design goal, page, route, screenshot description, or rough design concern"
  - "Any constraints such as no visual regression, brand direction, or target pages"
what_you_get:
  - "A routed design workflow using the right specialist skills"
  - "Spec-first implementation when the design work is broad or proof-sensitive"
  - "Checks, browser proof, and verification routing for visible design claims"
  - "An explicit handoff from token centralization to full-site token consumption when needed"
example_prompts:
  - "/sf-design améliorer la page d'accueil"
  - "/sf-design centraliser les tokens et les appliquer partout sans changement visuel"
  - "/sf-design vérifier si le design est professionnel"
  - "/sf-design créer un playground de design system"
argument_modes:
  - argument: "tokens"
    effect: "Routes token creation, token audit, or token migration through the appropriate specialist and lifecycle."
    consequence: "Useful when design values are scattered or a centralized token layer needs implementation."
  - argument: "audit"
    effect: "Routes to standard or deep design audit depending on scope."
    consequence: "Useful before choosing what to fix."
  - argument: "playground"
    effect: "Routes to the design-system playground when a token layer exists."
    consequence: "Useful for live visual token review."
limits:
  - "It orchestrates design workflows; the specialist skills still own token audits, accessibility audits, component audits, playground scaffolding, and design-system creation."
  - "Broad redesigns and multi-page migrations require a ready spec before implementation."
related_skills:
  - "sf-design-from-scratch"
  - "sf-design-playground"
  - "sf-audit-design"
  - "sf-audit-design-tokens"
  - "sf-audit-components"
  - "sf-audit-a11y"
featured: true
order: 500
---
