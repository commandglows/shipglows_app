---
title: "sf-changelog"
slug: "sf-changelog"
tagline: "Turn recent git history into a human-readable changelog instead of leaving progress trapped in commits."
summary: "A changelog generation skill for summarizing meaningful project changes in a cleaner public format."
category: "Operate & Ship"
audience:
  - "Founders who want better release visibility"
  - "Teams that need a readable change history"
problem: "Important work gets buried in commit logs, making it harder for collaborators or future-you to understand what changed and why."
outcome: "You get a changelog-shaped summary of recent work that is easier to scan than raw git history."
founder_angle: "This skill is useful when you want public or internal release notes without manually reconstructing the story from scattered commits."
when_to_use:
  - "When a batch of work is finished and needs a summary"
  - "When release notes are missing or stale"
  - "When you want a cleaner visible history for a project"
what_you_give:
  - "A repository with recent git history"
  - "The change window you want to summarize"
what_you_get:
  - "A changelog-oriented summary"
  - "A more legible release narrative"
  - "Less dependence on raw commit archaeology"
example_prompts:
  - "/sf-changelog"
  - "/sf-changelog last release"
  - "/sf-changelog recent docs and site updates"
limits:
  - "It can summarize what happened, but not fix poor commit discipline retroactively"
  - "The best output still depends on meaningful underlying git history"
related_skills:
  - "sf-end"
  - "sf-review"
  - "sf-docs"
featured: false
order: 330
---
