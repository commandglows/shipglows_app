---
title: "sg-status"
slug: "sg-status"
tagline: "Get a fast git-based project dashboard instead of manually checking every repo by hand."
summary: "A read-only status skill for seeing branches, changes, sync state, and recent activity across the current project or workspace."
category: "Operate & Ship"
audience:
  - "Founders managing several repositories or worktrees"
  - "Operators who want a quick state check before acting"
problem: "Context switching becomes expensive when basic project state has to be reconstructed manually each time."
outcome: "You get a cleaner snapshot of repo status so you can decide what to touch next with less friction."
founder_angle: "This skill is useful whenever the problem is not 'how do I fix it' but 'what is the actual current state across my work'."
when_to_use:
  - "Before starting or resuming work in a project"
  - "When managing multiple repos or branches"
  - "When you need a quick git-state dashboard"
what_you_give:
  - "The current project or workspace"
  - "Optionally a preferred view mode"
what_you_get:
  - "A fast project status snapshot"
  - "Better visibility into branches and local changes"
  - "Less time spent manually checking repo state"
example_prompts:
  - "/sg-status"
  - "/sg-status all projects"
  - "/sg-status current workspace"
limits:
  - "It reports state; it does not resolve the state for you"
  - "It does not mutate project trackers or legacy archive files"
  - "The output is only as useful as the underlying git hygiene"
related_skills:
  - "sg-review"
  - "sg-ship"
  - "sg-prod"
featured: false
order: 550
---
