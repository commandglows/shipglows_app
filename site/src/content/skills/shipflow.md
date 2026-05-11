---
title: "shipflow"
slug: "shipflow"
tagline: "Start with one plain instruction and let ShipFlow choose the right workflow."
summary: "The primary non-technical router skill for answering simple questions directly or handing real work to the right ShipFlow master or specialist skill."
category: "Plan & Decide"
audience:
  - "Founders who do not want to memorize every sf-* command"
  - "Operators who know the outcome but not the right workflow route"
  - "Teams that want routing decisions kept visible in the main thread"
problem: "A user can lose momentum before work starts by having to choose between build, bug, maintenance, content, design, deploy, skill, and audit workflows."
outcome: "You get one first command that either answers directly, routes the current thread to the right ShipFlow skill, or asks one numbered clarification question when no context-safe route exists."
founder_angle: "The router keeps the first move simple. You describe the business or product need, and ShipFlow chooses whether the work is conversation, build, maintenance, bug, release, content, design, skill maintenance, or audit."
when_to_use:
  - "When you want the recommended first command and do not know which skill to launch"
  - "When the request might be a feature, bug, maintenance run, content task, design task, deploy proof, skill change, audit, or simple question"
  - "When you want the selected master skill to own its normal lifecycle after routing"
what_you_give:
  - "A plain-language instruction"
  - "Any known target file, feature, bug symptom, deployment, content surface, or audit concern"
what_you_get:
  - "A direct conversational answer for pure questions"
  - "A direct main-thread handoff to the selected skill for real work"
  - "One numbered question when the route is ambiguous"
  - "No hidden master-skill-in-subagent nesting"
example_prompts:
  - "shipflow explain which docs govern skill runtime"
  - "shipflow fix the checkout bug"
  - "shipflow prepare this change for deploy proof"
argument_modes:
  - argument: "<instruction>"
    effect: "Classifies the request and either answers directly or hands the main thread to the selected ShipFlow skill."
    consequence: "Routes feature/code/docs to sf-build, maintenance to sf-maintain, bugs to sf-bug, release/deploy/prod proof to sf-deploy, content to sf-content, design to sf-design, skill maintenance to sf-skill-build, and obvious specialist audits to sf-audit-*."
limits:
  - "It does not replace the selected skill's lifecycle gates"
  - "It uses context-safe defaults only when they are clear, low-risk, reversible, and verifiable"
  - "It asks a numbered question with the reason and recommended route instead of guessing when routing is ambiguous"
  - "It does not run master skills inside hidden subagents"
related_skills:
  - "sf-build"
  - "sf-maintain"
  - "sf-bug"
  - "sf-deploy"
  - "sf-content"
  - "sf-design"
  - "sf-skill-build"
  - "sf-audit"
featured: true
order: 5
---

## The First Command

Use `shipflow <instruction>` when you want ShipFlow to choose the route. It is
for the first moment of a request, before you know whether the work is a build,
bug loop, maintenance run, release proof, content task, design task, skill change, audit, or
just a question.

The router keeps the handoff visible. If it selects a master skill, that skill
takes over the main thread and owns its own delegated sequential execution.
If no route is safely implied by the instruction and project context, the router
asks one numbered decision question with the reason and recommended route.
