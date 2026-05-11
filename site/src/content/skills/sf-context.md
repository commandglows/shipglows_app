---
title: "sf-context"
slug: "sf-context"
tagline: "Prime the relevant files and decisions before the thread starts guessing about the codebase."
summary: "A context-loading skill that retrieves the most relevant repo surface before implementation begins."
category: "Plan & Decide"
audience:
  - "Founders starting work in a large or stale codebase"
  - "Operators who want better thread startup discipline"
problem: "Fresh threads waste time rediscovering files, flows, and hotspots that should have been identified before the first implementation decision."
outcome: "The thread starts with a tighter map of what matters, which reduces blind exploration and bad assumptions."
founder_angle: "This skill pays off whenever startup cost is the problem. It makes the next move faster by shrinking the search space first."
when_to_use:
  - "At the start of a task in a non-trivial repository"
  - "When the relevant code surface is unclear"
  - "When you want to reduce repeated exploration work across threads"
what_you_give:
  - "A task or problem statement"
  - "The current repository context"
what_you_get:
  - "A narrowed set of relevant files and entry points"
  - "A better starting map for implementation or review"
  - "Less context rebuild cost in fresh threads"
example_prompts:
  - "/sf-context auth bug in onboarding"
  - "/sf-context pricing page update"
  - "/sf-context API export flow"
limits:
  - "It improves orientation; it does not replace deeper analysis"
  - "Bad project structure can still limit how much context can be recovered cleanly"
related_skills:
  - "sf-spec"
  - "sf-start"
  - "sf-fix"
featured: false
order: 340
---
