---
title: "sg-github-hygiene"
slug: "sg-github-hygiene"
tagline: "Clean up git and GitHub drift before it turns into release friction."
summary: "A git/GitHub hygiene skill for sync drift, stale branches, PR drift, and Dependabot backlog triage with bounded safe fixes."
category: "Operate & Ship"
audience:
  - "Founders maintaining several repos and feature branches"
  - "Teams that want cleaner GitHub hygiene before shipping"
  - "Operators dealing with stale refs, behind branches, and update backlog"
problem: "Git drift accumulates quietly: stale local branches, feature branches behind base, unpruned refs, and Dependabot pull requests that sit open until upgrades become harder and riskier."
outcome: "You get a bounded hygiene pass that classifies sync drift, stale branches, PR lag, and Dependabot backlog, then applies only safe repairs or routes the risky cases to the right owner skill."
founder_angle: "Repository hygiene is one of those operational habits that feels optional until a hotfix, release, or dependency update is blocked by avoidable branch drift."
when_to_use:
  - "When you want to know whether a repo or workspace is actually up to date"
  - "When old merged branches, deleted upstreams, or stale refs are piling up"
  - "When open pull requests or Dependabot updates are behind base or blocked"
  - "When you want a safe git maintenance lane without jumping straight to destructive cleanup"
what_you_give:
  - "The current repo or the workspace scope"
  - "Whether you want a read-only audit or bounded fixes"
  - "Any GitHub context that matters, such as open PRs or Dependabot lanes"
what_you_get:
  - "A hygiene classification for sync drift, stale branches, PR drift, and Dependabot backlog"
  - "Safe fixes such as fetch/prune, remote prune, fully merged local branch cleanup, or fast-forward pulls when appropriate"
  - "Explicit blocks when a branch is dirty, diverged, protected, sensitive, or needs human approval"
  - "Routing to dependency, migration, CI, or ship skills when hygiene is not the real owner lane"
example_prompts:
  - "/sg-github-hygiene audit"
  - "/sg-github-hygiene branches workspace"
  - "/sg-github-hygiene dependabot"
  - "/sg-github-hygiene fix current repo"
argument_modes:
  - argument: "audit"
    effect: "Runs a read-only hygiene diagnosis for the current repo or selected workspace repos."
    consequence: "Best default when you want the state made clear before any mutation."
  - argument: "branches"
    effect: "Focuses on sync drift, stale refs, merged branches, orphaned upstreams, and PR branch lag."
    consequence: "Useful when branch cleanup is the main concern."
  - argument: "dependabot"
    effect: "Focuses on Dependabot coverage, open Dependabot PRs, stale update lanes, and safe merge boundaries."
    consequence: "Useful when dependency automation exists but is not moving cleanly."
  - argument: "fix"
    effect: "Applies only bounded safe hygiene repairs after the audit classifies the repo state."
    consequence: "Useful when you want help cleaning the easy cases without hiding the risky ones."
limits:
  - "It does not replace sg-ship for commits and pushes"
  - "It does not replace sg-technical deps for dependency risk analysis"
  - "It routes major upgrade lanes to sg-technical migrate instead of auto-merging them"
  - "It blocks dirty, diverged, protected, sensitive, or conflict-prone branch actions instead of forcing them through"
  - "It does not silently delete branches with unique local commits or bypass GitHub protections"
related_skills:
  - "sg-status"
  - "sg-maintain"
  - "sg-technical"
  - "sg-ship"
featured: false
order: 360
---

## Safe Hygiene Before Speed

`sg-github-hygiene` is for the middle ground between passive dashboards and
manual cleanup. It can surface stale branch state, PR drift, and Dependabot
backlog quickly, but it keeps strict stop conditions around dirty repos,
protected branches, diverged history, and sensitive upgrade lanes.

Use it when the right next move is to make the repository cleaner and safer,
not when the real problem is broader dependency policy, migration planning,
shipping, or CI failure analysis.
