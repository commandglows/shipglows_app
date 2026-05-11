---
title: "sf-check"
slug: "sf-check"
tagline: "Run the standard technical checks and fix the obvious issues before you pretend the work is done."
summary: "A practical quality gate for typecheck, lint, build, and related technical validation in the current project."
category: "Operate & Ship"
audience:
  - "Founders who want a disciplined technical finish"
  - "Teams that need a fast validation pass before review or ship"
problem: "A change can look complete in the editor while still failing basic project checks that matter for real delivery."
outcome: "You get a tighter technical validation loop and earlier visibility into build-breaking or type-breaking issues."
founder_angle: "This skill is useful when you need a concrete technical stoplight before moving to higher-level review or shipping."
when_to_use:
  - "After a meaningful code change"
  - "Before asking whether work is ready to ship"
  - "When you want the default project checks run in one move"
what_you_give:
  - "The current repository state"
  - "The project tooling already configured in the repo"
what_you_get:
  - "A combined technical check pass"
  - "Visibility into type, lint, and build failures"
  - "A cleaner basis for verification and release"
  - "A clear route to sf-browser when non-auth browser evidence is the missing proof"
example_prompts:
  - "/sf-check"
  - "/sf-check after auth refactor"
  - "/sf-check before release"
limits:
  - "It validates technical correctness, not user-story correctness by itself"
  - "Passing checks do not prove the product behavior is right"
related_skills:
  - "sf-browser"
  - "sf-verify"
  - "sf-start"
  - "sf-ship"
featured: false
order: 500
---
