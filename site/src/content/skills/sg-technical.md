---
title: "sg-technical"
slug: "sg-technical"
tagline: "Use one explicit technical mode for code risk, dependencies, performance, or a breaking migration."
summary: "A unified technical entrypoint with four bounded modes and evidence limits that match the work."
category: "Audit & Improve"
audience:
  - "Founders who need a trustworthy technical review without memorizing several commands"
  - "Operators planning dependency, performance, or framework work"
problem: "Code, dependency, performance, and migration work is related, but each needs different evidence and mutation safeguards."
outcome: "You choose one explicit mode and receive a specialist audit or migration plan without silently running unrelated technical lanes."
founder_angle: "One entrypoint reduces command noise while keeping security, supply-chain, measurement, and rollback discipline visible."
when_to_use:
  - "Use audit for code correctness, architecture, security, reliability, or test posture"
  - "Use deps for vulnerabilities, supply chain, licenses, drift, lockfiles, or package configuration"
  - "Use performance for bundles, rendering, loading, fetching, caching, or database efficiency"
  - "Use migrate for a researched breaking framework or package upgrade"
what_you_give:
  - "One explicit mode: audit, deps, performance, or migrate"
  - "A file, project, global scope, or package target as accepted by that mode"
what_you_get:
  - "Severity-ranked technical findings with named evidence limits"
  - "A dependency or performance posture that distinguishes checked facts from unknowns"
  - "A migration matrix and safe apply plan before any approved mutation"
example_prompts:
  - "/010-sg-technical audit src/lib/auth.ts"
  - "/010-sg-technical deps global"
  - "/010-sg-technical performance src/pages/index.astro"
  - "/010-sg-technical migrate astro@6"
limits:
  - "Audit, deps, and performance are read-only by default; findings do not authorize fixes"
  - "Static or partial evidence is not a security sign-off, measured bottleneck, or production proof"
  - "Migration requires current official guidance, distinct apply approval, safe dirty-state handling, rollback, and checks"
  - "Broad audits, proportional checks, production truth, SEO, and translation remain separate owner skills"
related_skills:
  - "sg-audit"
  - "sg-check"
  - "sg-prod"
  - "sg-seo"
  - "sg-audit-translate"
featured: false
order: 120
---
