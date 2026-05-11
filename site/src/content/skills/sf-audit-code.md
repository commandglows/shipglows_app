---
title: "sf-audit-code"
slug: "sf-audit-code"
tagline: "Review code with a product and risk lens, not just style rules."
summary: "A code audit skill focused on behavior, architecture, safety, duplication, and system fit."
category: "Audit & Improve"
audience:
  - "Founders who want to know whether the codebase is getting harder to trust"
  - "Operators preparing a cleanup or handoff"
problem: "Code can look acceptable locally while hiding duplication, weak system boundaries, missing tests, or risky shortcuts that will slow future work."
outcome: "You get a review that points to the structural problems most likely to create delivery drag or regressions."
founder_angle: "This skill helps you avoid false confidence. It is useful when you need to know whether the code is still serving the product or quietly fighting it."
when_to_use:
  - "When recent work needs a code-focused review"
  - "When the project feels harder to change than it should"
  - "When you want a product-aware code quality pass before shipping"
what_you_give:
  - "A file, module, or full project"
  - "The current repository state"
what_you_get:
  - "A review of architecture, reliability, and system fit"
  - "Findings tied to behavior and maintainability"
  - "A sharper sense of where cleanup matters most"
example_prompts:
  - "/sf-audit-code"
  - "/sf-audit-code src/lib/auth.ts"
  - "/sf-audit-code recent checkout work"
limits:
  - "It reviews and prioritizes issues; it does not refactor automatically"
  - "A deeper fix path may still require spec and implementation skills after the audit"
related_skills:
  - "sf-audit"
  - "sf-fix"
  - "sf-start"
featured: false
order: 120
---
