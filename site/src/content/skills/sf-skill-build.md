---
title: "sf-skill-build"
slug: "sf-skill-build"
tagline: "Build or modify a ShipFlow skill through one gated lifecycle instead of manual command stitching."
summary: "A master maintenance workflow for ShipFlow skills that routes fuzzy ideas through exploration, then keeps spec, refresh, budget, verification, docs, and public skill pages aligned before shipping."
category: "Meta & Setup"
audience:
  - "ShipFlow maintainers creating or evolving skills"
  - "Operators who want one safe entrypoint for skill lifecycle changes"
problem: "Skill work often drifts when SKILL.md edits are done without refresh, budget checks, verification, and documentation/public-surface updates."
outcome: "You get one workflow that clarifies fuzzy skill ideas before spec work, then orchestrates the full skill maintenance path with explicit gates and observable outcomes."
founder_angle: "This move reduces governance drift. It protects discovery quality and public trust while keeping skill evolution shippable."
when_to_use:
  - "When you create a new ShipFlow skill"
  - "When you materially change an existing skill contract"
  - "When skill work affects help docs or public skill pages"
what_you_give:
  - "A skill target (name or path)"
  - "A spec-first intent for non-trivial changes"
  - "A fuzzy skill idea when placement or public promise still needs exploration"
  - "Current repository state"
what_you_get:
  - "An exploration reroute when the idea is too ambiguous for a durable spec"
  - "A gated lifecycle from spec through ship routing"
  - "Budget and metadata validation path"
  - "Technical and editorial coherence checks"
  - "A chantier-aware execution report with next command"
example_prompts:
  - "/sf-skill-build sf-test"
  - "/sf-skill-build add a new audit skill for conversion copy"
  - "/sf-skill-build skills/sf-help/SKILL.md"
argument_modes:
  - argument: "<new skill idea>"
    effect: "Clarifies the idea through sf-explore when needed, then creates the target skill through the full lifecycle with spec-first gating and public-surface checks."
    consequence: "Blocks SKILL.md edits until exploration or spec/readiness gates settle placement, then runs refresh and validation before verify/ship routing."
  - argument: "<existing skill path>"
    effect: "Modifies an existing skill contract and revalidates downstream docs/help/public coherence."
    consequence: "Blocks ship routing until verify passes and required updates are complete."
limits:
  - "It orchestrates existing lifecycle skills; it does not replace sf-spec, sf-ready, sf-start, sf-verify, or sf-ship internals"
  - "It does not skip exploration when skill intent, placement, or public promise is too fuzzy for one targeted question to settle"
  - "It blocks when readiness, budget, metadata, verification, or required site build checks fail"
related_skills:
  - "sf-explore"
  - "sf-spec"
  - "sf-ready"
  - "sf-skills-refresh"
  - "sf-help"
  - "sf-verify"
  - "sf-ship"
featured: false
order: 515
---
