---
title: "sg-model"
slug: "sg-model"
tagline: "Choose the right model for the task without letting speed or cost outrank quality."
summary: "A model-selection skill for matching task type, reliability, quality bar, latency, cost, and subagent routing needs before execution starts."
category: "Plan & Decide"
audience:
  - "Founders who want quality-aware model decisions"
  - "Operators who want a more deliberate model choice"
problem: "Using the wrong model can waste money, time, or execution reliability, but choosing the cheapest or fastest model too early can also weaken important work."
outcome: "You get a model choice that starts from reliability and risk, then uses speed or cost only when the fallback remains quality-equivalent."
founder_angle: "This skill matters when model choice is no longer trivial. It keeps the workflow economical without treating economy as more important than correctness, security, maintainability, and proof."
when_to_use:
  - "When the task could reasonably fit several model tiers"
  - "When cost or latency matters materially but should not lower the quality bar"
  - "When a complex task may justify stronger reasoning"
what_you_give:
  - "A task description and its constraints"
  - "Any quality, reliability, cost, or speed constraint"
what_you_get:
  - "A model recommendation"
  - "A clearer tradeoff between reliability, speed, cost, and reasoning depth"
  - "Quality-equivalent fallbacks instead of automatic cheapest-path defaults"
  - "A default subagent model policy: low-risk bounded work can use GPT-5.4-mini, long implementation uses GPT-5.3-Codex, high-risk reasoning uses GPT-5.5"
  - "A clear note on whether the model choice is applied, a subagent override, or only a next-run recommendation"
  - "A better execution setup before work begins"
example_prompts:
  - "/sg-model for migration planning"
  - "/sg-model docs cleanup without lowering quality"
  - "/sg-model which model for this audit"
limits:
  - "It helps choose a model; it does not improve the task framing by itself"
  - "It cannot guarantee that the already-running main conversation can switch its own active model mid-thread"
  - "The best model still depends on the quality of the downstream workflow"
  - "Fast or cheap fallbacks are only appropriate when they remain quality-equivalent for the task risk"
related_skills:
  - "sg-context"
  - "sg-spec"
  - "sg-start"
featured: false
order: 620
---
