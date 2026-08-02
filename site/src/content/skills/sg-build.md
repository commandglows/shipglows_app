---
title: "sg-build"
slug: "sg-build"
tagline: "Run non-trivial work from story to spec, build, verification, closeout, and ship without making the user drive every gate."
summary: "The master user-facing lifecycle orchestrator for carrying a story, bug, or goal through ShipGlowz's spec, readiness, implementation, verification, onboarding consideration, documentation, closure, and shipping gates."
category: "Build & Fix"
audience:
  - "Founders who want the work handled end to end"
  - "Operators who do not want to manually chain every lifecycle skill"
  - "Teams using ShipGlowz specs as durable chantier memory"
problem: "Non-trivial work often stalls because the user has to remember when to spec, verify, update docs, close trackers, and ship."
outcome: "You get a single high-level entrypoint that routes the work through the right ShipGlowz gates and reports the result without hiding proof gaps."
founder_angle: "This skill is the normal launch point when the outcome matters more than the individual commands. It keeps the user in business decisions while ShipGlowz handles execution sequence, evidence, closure, and the quality bar."
when_to_use:
  - "When you want a feature, bug fix, site update, docs change, or product improvement handled as a complete workstream"
  - "When the task may need spec, readiness, implementation, verification, docs alignment, and ship routing"
  - "When you know the desired outcome but do not want to choose every downstream skill manually"
what_you_give:
  - "A story, bug, or goal in plain language"
  - "Optional `agents` when delegated sequential execution must be validated"
  - "Any business constraint that changes scope, risk, timing, or release posture"
  - "Optional report mode only when you need detailed agent handoff evidence"
what_you_get:
  - "A routed ShipGlowz lifecycle instead of a pile of manual commands"
  - "A route that optimizes for correctness, security, maintainability, relevant performance, and proof before speed"
  - "A clear agents status when delegated execution is requested or materially affects trust"
  - "Spec and readiness handling when the task is non-trivial"
  - "Implementation, verification, docs alignment, and closure routing"
  - "A post-build onboarding suggestion when a user-facing feature would benefit from activation guidance"
  - "A concise user report with chantier status when a unique spec is in scope"
example_prompts:
  - "/sg-build add a public cheatsheet for master skills and their modes"
  - "/sg-build agents migrate the app branding and validate the result"
  - "/sg-build fix the broken onboarding flow"
  - "/sg-build improve the docs page and ship it"
argument_modes:
  - argument: "<story, bug, or goal>"
    effect: "Runs the user-facing lifecycle for the requested work."
    consequence: "Routes through spec/readiness, implementation, verification, onboarding consideration, documentation alignment, end, and ship when the scope requires it."
  - argument: "agents"
    effect: "Forces delegated sequential execution as a validation gate for file work, validation, closure preparation, and ship preparation."
    consequence: "If no bounded subagent is used where one is required, the run must stop or report degraded execution with the reason."
  - argument: "no-agents"
    effect: "Forces main-thread execution."
    consequence: "Use only when you intentionally accept less isolation between orchestration and execution."
  - argument: "report=agent / handoff / verbose / full-report"
    effect: "Switches the final report toward detailed evidence and handoff context."
    consequence: "Useful for another agent or blocked run, but noisier than the default user report."
limits:
  - "It does not skip safeguards; it reduces manual command-chaining"
  - "It does not choose the fastest path when the professional path needs stronger proof or preparation"
  - "It asks a business-framed numbered question when a decision changes behavior, risk, permissions, security, proof, or ship posture"
  - "It proceeds by default only when the default is clear, context-safe, reversible, and verifiable"
  - "It should not ship unrelated dirty files without explicit user approval"
related_skills:
  - "sg-spec"
  - "sg-ready"
  - "sg-start"
  - "sg-verify"
  - "sg-end"
  - "sg-ship"
  - "sg-browser"
  - "sg-auth-debug"
  - "sg-prod"
  - "sg-customer"
featured: true
order: 20
---

## The Default Build Entrypoint

Use `sg-build` when the useful request is the outcome, not the individual phase.
It is designed to keep the user at the level of scope, product tradeoffs, and
ship risk while ShipGlowz handles the execution sequence underneath.
When a decision matters, it asks a numbered question with why, a responsible
recommendation, and practical options instead of forcing the user to infer the
technical tradeoff.

For a narrow command such as "run checks" or "open browser proof", call the
focused owner skill directly. For a complete change, start here.
