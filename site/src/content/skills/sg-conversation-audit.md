---
title: "sg-conversation-audit"
slug: "sg-conversation-audit"
tagline: "Audit exported ShipGlowz transcripts for systemic agent flaws and route durable fixes."
summary: "A focused audit lane that reads canonical conversation evidence, classifies repeatable failure patterns, and routes recommended owners."
category: "Audit & Improve"
audience:
  - "Operators running ShipGlowz with recurring execution friction"
  - "Teams that want recurring skill-level quality loops"
problem: "Conversations can contain recurring behavior flaws, but ad hoc fixes are hard to compare without durable, standardized evidence."
outcome: "You get a durable audit report tied to evidence, severity, and an explicit owner route."
founder_angle: "This skill prevents recurring defects from being resolved only once; it turns fragile transcripts into repeatable improvement work."
when_to_use:
  - "When you want recurring conversation quality issues to be classified and routed automatically."
  - "When you have a recent transcript and need to propose a durable follow-up action."
  - "When `sg-build` changes need evidence from real conversation behavior."
what_you_give:
  - "A path to one or more conversation transcripts."
  - "An explicit quality policy and routing preference."
what_you_get:
  - "A `conversation_audit` artifact in `shipglowz_data/workflow/conversation-audits/`."
  - "Stability-oriented category counts and top findings."
  - "A direct owner route for actionable failures."
example_prompts:
  - "sg-conversation-audit latest"
  - "sg-conversation-audit path shipglowz_data/workflow/conversations/conversation-..."
  - "sg-conversation-audit export shipflow"
  - "sg-conversation-audit report=agent"
argument_modes:
  - argument: "latest"
    effect: "Audit the latest transcript under shipglowz_data/workflow/conversations/."
    consequence: "Fast loop for operator-incremental evidence."
  - argument: "path <file-or-dir>"
    effect: "Audit one transcript file or all files in a directory."
    consequence: "Useful for backfills and fixture audits."
  - argument: "export shipflow"
    effect: "Capture a fresh transcript through the shipflow preset, then audit it."
    consequence: "One-step capture-to-audit flow."
  - argument: "report=agent"
    effect: "Show full evidence table and routing rationale."
    consequence: "Use for downstream owner handoff."
limits:
  - "Default mode audits the latest transcript when no explicit path is passed."
  - "Safe-only gates are strict: unsafe transcripts block public artifact publication."
  - "No generic code fixes; the skill routes to owners."
related_skills:
  - "sg-build"
  - "sg-verify"
  - "sg-docs"
  - "sg-spec"
featured: false
order: 540
---

# Conversation Audit

`sg-conversation-audit` standardizes how ShipGlowz consumes conversation evidence, classifies recurring agent behavior issues, and routes follow-up work to the right owner skill.
