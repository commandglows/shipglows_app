---
title: "sf-migrate"
slug: "sf-migrate"
tagline: "Plan and execute framework upgrades with less blind risk."
summary: "A migration skill for researching upgrade guides, scanning breaking changes, and applying a safer migration path."
category: "Operate & Ship"
audience:
  - "Founders upgrading frameworks or major dependencies"
  - "Teams trying to reduce upgrade risk and context loss"
problem: "Upgrades often fail because the official guide, the codebase reality, and the actual breakpoints are not reconciled before changes start."
outcome: "You get a more grounded migration path with clearer breakage expectations and less improvisation mid-upgrade."
founder_angle: "This skill matters when you know you need to upgrade but do not want the upgrade to become a chaotic rewrite."
when_to_use:
  - "When planning a framework or major package upgrade"
  - "When breaking changes need to be mapped against the current repo"
  - "When you want more structure than 'upgrade and hope'"
what_you_give:
  - "A target framework or dependency upgrade"
  - "The current repo and version context"
what_you_get:
  - "A safer migration path"
  - "A clearer map of likely breaking changes"
  - "A better basis for staged upgrade work"
example_prompts:
  - "/sf-migrate Astro 5"
  - "/sf-migrate Next.js upgrade"
  - "/sf-migrate current framework to latest stable"
limits:
  - "It improves migration planning and execution, but some upgrades still expose unknown app-specific issues"
  - "Major migrations may still require separate spec and validation work"
related_skills:
  - "sf-deps"
  - "sf-check"
  - "sf-verify"
featured: false
order: 520
---
