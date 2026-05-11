---
title: "sf-prod"
slug: "sf-prod"
tagline: "Check whether production is actually healthy after a push instead of assuming the deploy tells the truth."
summary: "A production verification skill for deployment status, logs, and live health checks after release."
category: "Operate & Ship"
audience:
  - "Founders shipping directly to production"
  - "Operators who want a post-deploy reality check"
problem: "A deploy can succeed mechanically while the live product is still unhealthy, broken, or misconfigured."
outcome: "You get a stronger post-release confirmation that production is behaving as expected."
founder_angle: "This skill matters because shipping is not finished when the command exits. It is finished when production actually works."
when_to_use:
  - "Right after a deploy or push"
  - "When a production issue may have emerged during rollout"
  - "When you want a live-state sanity check before moving on"
what_you_give:
  - "A deployed project or target environment"
  - "The production URL or deployment context"
what_you_get:
  - "A production health check"
  - "Visibility into deployment status and live errors"
  - "A tighter release confidence loop"
  - "A route into sf-browser when the confirmed URL needs page-level browser proof"
example_prompts:
  - "/sf-prod"
  - "/sf-prod check latest deploy"
  - "/sf-prod verify live site after push"
limits:
  - "It checks visible production health, not every hidden failure mode"
  - "Deeper incidents may still require logs, tracing, or product-specific debugging"
related_skills:
  - "sf-ship"
  - "sf-check"
  - "sf-browser"
  - "sf-fix"
featured: false
order: 530
---
