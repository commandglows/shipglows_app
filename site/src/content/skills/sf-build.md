---
title: "sf-build"
slug: "sf-build"
tagline: "Run non-trivial work from story to spec, build, verification, closeout, and ship without making the user drive every gate."
summary: "The master user-facing lifecycle orchestrator for carrying a story, bug, or goal through ShipFlow's spec, readiness, implementation, verification, documentation, closure, and shipping gates."
category: "Build & Fix"
audience:
  - "Founders who want the work handled end to end"
  - "Operators who do not want to manually chain every lifecycle skill"
  - "Teams using ShipFlow specs as durable chantier memory"
problem: "Non-trivial work often stalls because the user has to remember when to spec, verify, update docs, close trackers, and ship."
outcome: "You get a single high-level entrypoint that routes the work through the right ShipFlow gates and reports the result without hiding proof gaps."
founder_angle: "This skill is the normal launch point when the outcome matters more than the individual commands. It keeps the user in business decisions while ShipFlow handles execution sequence, evidence, and closure."
when_to_use:
  - "When you want a feature, bug fix, site update, docs change, or product improvement handled as a complete workstream"
  - "When the task may need spec, readiness, implementation, verification, docs alignment, and ship routing"
  - "When you know the desired outcome but do not want to choose every downstream skill manually"
what_you_give:
  - "A story, bug, or goal in plain language"
  - "Any business constraint that changes scope, risk, timing, or release posture"
  - "Optional report mode only when you need detailed agent handoff evidence"
what_you_get:
  - "A routed ShipFlow lifecycle instead of a pile of manual commands"
  - "Spec and readiness handling when the task is non-trivial"
  - "Implementation, verification, docs alignment, and closure routing"
  - "A concise user report with chantier status when a unique spec is in scope"
example_prompts:
  - "/sf-build add a public cheatsheet for master skills and their modes"
  - "/sf-build fix the broken onboarding flow"
  - "/sf-build improve the docs page and ship it"
argument_modes:
  - argument: "<story, bug, or goal>"
    effect: "Runs the user-facing lifecycle for the requested work."
    consequence: "Routes through spec/readiness, implementation, verification, documentation alignment, end, and ship when the scope requires it."
  - argument: "report=agent / handoff / verbose / full-report"
    effect: "Switches the final report toward detailed evidence and handoff context."
    consequence: "Useful for another agent or blocked run, but noisier than the default user report."
limits:
  - "It does not skip safeguards; it reduces manual command-chaining"
  - "It asks a business-framed numbered question when a decision changes behavior, risk, permissions, security, proof, or ship posture"
  - "It proceeds by default only when the default is clear, context-safe, reversible, and verifiable"
  - "It should not ship unrelated dirty files without explicit user approval"
related_skills:
  - "sf-spec"
  - "sf-ready"
  - "sf-start"
  - "sf-verify"
  - "sf-end"
  - "sf-ship"
  - "sf-browser"
  - "sf-auth-debug"
  - "sf-prod"
featured: true
order: 20
---

## The Default Build Entrypoint

Use `sf-build` when the useful request is the outcome, not the individual phase.
It is designed to keep the user at the level of scope, product tradeoffs, and
ship risk while ShipFlow handles the execution sequence underneath.
When a decision matters, it asks a numbered question with why, a responsible
recommendation, and practical options instead of forcing the user to infer the
technical tradeoff.

For a narrow command such as "run checks" or "open browser proof", call the
focused owner skill directly. For a complete change, start here.
