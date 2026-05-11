---
title: "sf-deps"
slug: "sf-deps"
tagline: "Audit the dependency layer before stale or risky packages quietly become product debt."
summary: "A dependency audit skill for vulnerabilities, outdated packages, unused dependencies, and configuration health."
category: "Audit & Improve"
audience:
  - "Founders maintaining long-lived projects"
  - "Teams that want a sharper dependency hygiene pass"
problem: "Dependency drift is easy to ignore until it creates security issues, upgrade pain, or runtime fragility."
outcome: "You get a clearer picture of whether the dependency layer is still healthy enough to support ongoing delivery."
founder_angle: "This skill is useful when the product still works today but the package layer is becoming harder to trust tomorrow."
when_to_use:
  - "When dependencies have not been reviewed in a while"
  - "Before a major cleanup or upgrade cycle"
  - "When package sprawl may be hiding risk"
what_you_give:
  - "The current project manifest and lockfiles"
  - "The repository dependency surface"
what_you_get:
  - "A dependency health audit"
  - "Findings around stale, risky, or unused packages"
  - "A better basis for cleanup and upgrade work"
example_prompts:
  - "/sf-deps"
  - "/sf-deps apps/web"
  - "/sf-deps before framework upgrade"
limits:
  - "It audits the package layer; it does not automatically resolve upgrade strategy"
  - "Some dependency problems still require careful migration planning"
related_skills:
  - "sf-migrate"
  - "sf-check"
  - "sf-audit-code"
featured: false
order: 210
---
