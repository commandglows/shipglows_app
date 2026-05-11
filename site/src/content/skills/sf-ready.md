---
title: "sf-ready"
slug: "sf-ready"
tagline: "Pressure-test a spec before implementation so the thread is not coding against loose intent."
summary: "A readiness gate for checking whether a spec is complete, safe, and executable by a fresh agent."
category: "Plan & Decide"
audience:
  - "Founders using spec-first execution for non-trivial work"
  - "Teams that want stronger pre-implementation discipline"
problem: "Many specs look fine until implementation begins and missing assumptions start turning into guesses."
outcome: "You get a clearer signal on whether the spec is ready to code or still too weak to trust."
founder_angle: "This skill helps you spend structure where it pays off. It catches vague contracts before they become expensive implementation drift."
when_to_use:
  - "After writing a non-trivial spec"
  - "Before handing a task to implementation"
  - "When scope, security, or edge cases may still be underspecified"
what_you_give:
  - "A draft spec"
  - "The current repo and decision-doc context if needed"
what_you_get:
  - "A readiness judgment"
  - "Findings on missing assumptions or vague tasking"
  - "A safer handoff into implementation"
example_prompts:
  - "/sf-ready pricing page rollout"
  - "/sf-ready auth rewrite spec"
  - "/sf-ready current spec"
limits:
  - "It validates the contract, not the final implementation"
  - "A ready spec still needs disciplined execution and verification later"
related_skills:
  - "sf-spec"
  - "sf-start"
  - "sf-verify"
featured: false
order: 40
---
