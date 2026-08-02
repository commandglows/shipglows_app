---
title: "sg-platform-parity"
slug: "sg-platform-parity"
tagline: "Keep product expectations and technical implementation aligned across every supported platform."
summary: "Audits platform parity, separates legitimate platform adaptations from implementation debt, and routes missing work to the right ShipGlowz skill."
category: "Audit & Improve"
audience:
  - "Founders shipping the same product across web, mobile, and desktop"
  - "Operators who need platform promises to match implementation reality"
  - "Teams using Flutter or shared product concepts across different operating systems"
problem: "Multi-platform products drift easily: a feature may exist on one OS, be partially native on another, and still be described as fully supported everywhere."
outcome: "You get a platform parity matrix, clear adaptation decisions, proof gaps, and owner routes for implementation, QA, verification, or documentation correction."
founder_angle: "This skill protects trust. It keeps users from being surprised by platform differences unless the adapted experience is better or genuinely required by the platform."
when_to_use:
  - "Before claiming support for a new platform"
  - "When porting a feature from one OS to another"
  - "Before a release where platform coverage matters"
  - "When docs, store copy, or roadmap language may overpromise parity"
what_you_give:
  - "A project, feature, workflow, or spec path"
  - "Optional target platforms such as web, Android, iOS, Windows, macOS, or Linux"
  - "Any explicit product decision about acceptable platform adaptation"
what_you_get:
  - "A parity verdict by capability and platform"
  - "A distinction between better adaptation, required adaptation, accepted degradation, and implementation debt"
  - "Evidence pointers for code, docs, specs, tests, CI, or manual QA"
  - "Routes to sg-spec, sg-build, sg-test, sg-verify, sg-docs, or sg-ship"
example_prompts:
  - "/sg-platform-parity overlay and hotkeys across desktop"
  - "/sg-platform-parity WinFlowz platforms=android,ios,windows,macos,linux,web"
  - "/sg-platform-parity check the platform claims before ship"
argument_modes:
  - argument: "<project | feature | spec path>"
    effect: "Audits parity for the requested scope."
    consequence: "Produces a concise verdict by default and durable artifacts when the scope needs follow-up."
  - argument: "platforms=<list>"
    effect: "Constrains the comparison to the named platforms."
    consequence: "Useful when the project supports more platforms than the current chantier targets."
  - argument: "report=agent / handoff / verbose / full-report"
    effect: "Includes detailed matrix evidence and routing notes."
    consequence: "Useful when another skill or agent will execute the follow-up."
limits:
  - "It does not implement platform ports directly"
  - "It does not treat scaffolds, permission strings, shared code, or roadmap language as proof of support"
  - "It does not accept a different experience unless it is better, required, or explicitly accepted as degraded"
related_skills:
  - "sg-audit"
  - "sg-spec"
  - "sg-build"
  - "sg-test"
  - "sg-verify"
  - "sg-docs"
  - "sg-ship"
featured: false
order: 68
---

## Platform Parity Control

Use `sg-platform-parity` when the product promise spans multiple platforms and
the team needs a sober comparison between expected behavior, implementation
evidence, QA proof, and public claims.

The default posture is parity. Adaptation is accepted when it is better for the
platform or genuinely required by OS, browser, store, hardware, permission, or
distribution constraints.

For a Flutter or WinFlowz-style product, use it to check whether a feature
promised across Android, web, and desktop is actually usable on each platform,
not merely present in shared Dart code, manifests, or permission declarations.
