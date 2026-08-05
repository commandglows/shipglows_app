---
title: "sg-planning"
slug: "sg-planning"
tagline: "Turn portfolio, product, priority, and backlog decisions into one focused execution path."
summary: "The public planning métier for tasks, backlog ordering, priority decisions, reviews, and session direction across projects and products."
category: "Organize"
audience:
  - "Founders managing several products in one project"
  - "Operators who want to decide the next useful outcome before work begins"
problem: "Planning fragments when tasks, portfolio choices, review findings, and session state live in separate commands."
outcome: "You get a clear target expressed as project, product, surface, and feature where relevant, plus a bounded next action."
founder_angle: "Planning protects focus without forcing you to remember the internal lifecycle machinery."
when_to_use:
  - "When deciding what to do next across a project or portfolio"
  - "When a backlog, review, or priority decision needs a concrete execution route"
what_you_give:
  - "A goal, backlog, project, product, or review context"
what_you_get:
  - "A prioritized path and an owner métier"
  - "One material decision question only when the target cannot be resolved safely"
example_prompts:
  - "/sg-planning prioritize the onboarding work for product A"
  - "/sg-planning review this project's active chantiers"
argument_modes:
  - argument: "tasks | backlog | priorities | review | session"
    effect: "Selects a bounded planning workflow."
    consequence: "The selected workflow can hand the outcome to its owner skill without exposing internal helpers."
limits:
  - "It organizes and routes work; it does not replace the owner métier that executes it"
related_skills:
  - "shipglows"
  - "sg-build"
  - "sg-help"
featured: false
order: 12
---

## Planning is outcome-first

Use `sg-planning` when the uncertainty is what matters next. It resolves the
target before choosing an internal workflow, so one project can safely contain
multiple products, surfaces, and features.
