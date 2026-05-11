---
title: "sf-perf"
slug: "sf-perf"
tagline: "Audit performance where it actually hurts the product, not where it is merely fashionable to optimize."
summary: "A performance audit skill for rendering, bundle weight, data flow, Core Web Vitals, and system bottlenecks."
category: "Audit & Improve"
audience:
  - "Founders who suspect the product is slower than it should be"
  - "Teams preparing a performance-focused quality pass"
problem: "Performance problems often stay vague until they start damaging UX, conversion, or operational cost."
outcome: "You get a clearer picture of where the real performance drag sits and which fixes matter first."
founder_angle: "This skill is useful when speed is starting to affect usability or trust and you need to know which bottleneck is worth attacking."
when_to_use:
  - "When the app feels slow but the root cause is unclear"
  - "When a release needs a performance review before broader rollout"
  - "When you want to distinguish real bottlenecks from premature optimization"
what_you_give:
  - "A project, page, or performance concern"
  - "The current code and runtime architecture"
what_you_get:
  - "A performance-focused audit"
  - "Findings across rendering, bundles, and data flow"
  - "A more credible optimization priority list"
example_prompts:
  - "/sf-perf"
  - "/sf-perf site/src/pages/index.astro"
  - "/sf-perf dashboard load path"
limits:
  - "It identifies performance issues; it does not apply every optimization automatically"
  - "Observed slowness may still depend on infrastructure or external services outside the repo"
related_skills:
  - "sf-audit-code"
  - "sf-check"
  - "sf-verify"
featured: false
order: 220
---
