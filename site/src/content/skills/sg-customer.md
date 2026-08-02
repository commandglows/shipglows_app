---
title: "sg-customer"
slug: "sg-customer"
tagline: "Turn shipped features into clear, trusted customer journeys."
summary: "A customer-experience skill for UX/UI clarity, friction, trust, first-success paths, onboarding, setup sequencing, recoverable states, docs coherence, and proof routing."
category: "Build & Fix"
audience:
  - "Founders who want users to understand new features without extra explanation"
  - "Builders adding setup, permissions, integrations, or multi-step product flows"
  - "Teams that need onboarding, docs, support copy, and product state to stay coherent"
problem: "Features can work technically while users still miss the value, distrust the flow, hesitate on the next action, grant permissions in the wrong order, skip setup without recovery, or never reach the first meaningful success moment."
outcome: "You get an end-user contract that explains the target user, first-success path, UX/UI clarity, friction, trust, state semantics, recovery paths, onboarding/setup impact, proof route, and docs/editorial impact."
founder_angle: "End-user clarity is product leverage. It helps every user, technical or not, understand what to do next, trust the path, and see why the product was built for them."
when_to_use:
  - "After shipping a feature that users need to discover, understand, trust, configure, or recover from"
  - "Before implementing a setup flow, checklist, permissions guide, empty state, or recovery path"
  - "When onboarding copy, docs, support text, and in-app states need to match"
  - "When you want a reusable stepped setup overlay with progress icons and recoverable state"
what_you_give:
  - "A feature, flow, shipped change, or existing onboarding surface"
  - "Any known user segment, setup requirement, permission, integration, or value moment"
  - "Whether you want planning, audit, implementation routing, or proof guidance"
what_you_get:
  - "A first-success path and end-user experience strategy"
  - "UX/UI clarity, friction, trust, and recovery findings"
  - "A small-step progression with progressive disclosure"
  - "Required versus optional setup sequencing"
  - "Why/how guidance, visual cues, state semantics, recovery paths, and proof obligations"
  - "A reusable onboarding progress overlay pattern when the product needs first-run setup guidance"
  - "Routes to design, build, docs, content, browser, or manual QA owner skills when needed"
example_prompts:
  - "/sg-customer onboarding keyboard permissions"
  - "/sg-customer audit setup checklist before shipping"
  - "/sg-customer flow cloud sync activation"
  - "/sg-customer recovery revoked cloud permission"
argument_modes:
  - argument: "audit [scope]"
    effect: "Finds evidence-backed comprehension, friction, trust, state, and recovery issues in an existing journey."
    consequence: "Routes each finding to the proper owner and proof lane."
  - argument: "flow [feature-or-flow]"
    effect: "Creates an End-User Contract with first success, states, recovery, documentation impact, and proof route."
    consequence: "Useful before implementation or after a shipped change."
  - argument: "onboarding [feature-or-flow]"
    effect: "Plans first-run setup, progressive disclosure, dependency order, optionality, and re-entry."
    consequence: "Loads the overlay pattern only for an explicitly requested stepped overlay."
  - argument: "recovery [feature-or-state]"
    effect: "Creates a safe resume, defer, and recheck path for blocked, revoked, failed, or lost-context states."
    consequence: "Keeps a user in control without hiding permission, billing, privacy, or data consequences."
limits:
  - "It does not replace sg-design for visual polish, layout, token systems, or component architecture"
  - "It does not implement broad onboarding UI without a ready spec and build lifecycle"
  - "It blocks misleading permission, privacy, billing, or capability claims"
related_skills:
  - "sg-design"
  - "sg-build"
  - "sg-test"
  - "sg-docs"
  - "sg-content"
  - "sg-browser"
featured: true
order: 515
---

## The Customer Layer

Use `sg-customer` when the question is not just "does the feature exist?"
but "will users understand it, trust it, know what to do, recover from skips or
blocked states, and reach value quickly?"

It is especially useful for flows with permissions, integrations, optional
modules, empty states, or setup steps that need clear why/how guidance.

Use exactly one of four modes: `audit`, `flow`, `onboarding`, or `recovery`.
If the goal is unclear, the skill asks which customer job matters instead of
guessing. Visual-system work belongs to `sg-design`, content and public claims
to `sg-content`, documentation governance to `sg-docs`, and browser, manual
QA, or auth proof to their specialized owners.
