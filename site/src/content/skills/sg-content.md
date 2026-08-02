---
title: "sg-content"
slug: "sg-content"
tagline: "Manage content work through one lifecycle instead of guessing which writing, audit, docs, or SEO skill to launch."
summary: "A master content lifecycle skill for routing strategy, repurposing, drafting, enrichment, audits, public-content governance, validation, and ship readiness through the right owner skills."
category: "Research & Grow"
audience:
  - "Founders turning product work into durable content"
  - "Operators maintaining public docs, FAQ, skill pages, and site copy"
  - "Teams that need public claims, surfaces, and validation kept in sync"
problem: "Content work can start from many places: a source note, a build conversation, an article idea, a stale page, an SEO issue, or a public claim. Without one lifecycle entrypoint, agents can pick the wrong owner skill or bypass the content governance layer."
outcome: "You get a routed content workflow that checks the content map, editorial governance, claims, target surfaces, specialist skills, validation, and ship scope before treating content as done."
founder_angle: "Content is not just writing. For ShipGlowz, it is a product surface that must stay aligned with the real workflow, public promises, support answers, and shipped behavior. ShipGlowz also treats declared products as governed surfaces: product inventory, public routes, and proof-backed claims stay aligned before copy is considered done."
when_to_use:
  - "When you want to manage content work but do not know whether to start with repurposing, drafting, enrichment, docs, marketing review, SEO, or research"
  - "When a content update touches public pages, README, FAQ, public docs, public skill pages, pricing, support copy, or claims"
  - "When product governance needs to stay visible in the content layer for declared products and sales surfaces"
  - "When a source idea should become content only after surface, evidence, and claim checks"
what_you_give:
  - "A content goal, source, URL, file path, target surface, or mode keyword"
  - "Any known audience, source material, claim risk, or publication target"
  - "Whether you want planning only, applied edits, audit, or ship routing"
what_you_get:
  - "A mode decision and routed owner-skill sequence"
  - "Content map and editorial governance checks before public output"
  - "Product-registry and claim-coherence checks when the content references declared products or sales surfaces"
  - "A self-owned `repurpose` mode for a source-faithful pack, versioned repo memory, and downstream handoffs to drafting, enrichment, audits, docs, research, or ship gates"
  - "Optional project-aware quality scoring with global score, criterion scores, status, evidence, recommendations, and confidence"
  - "Validation and a concise content lifecycle report"
example_prompts:
  - "/sg-content repurpose this build conversation into docs, FAQ, and public skill-page updates"
  - "/sg-content capture-full-conversation"
  - "/sg-content clean-transcript /path/to/conversation.md"
  - "/sg-content audit the public content around skill modes and update the right surfaces"
  - "/sg-content draft article about ShipGlowz skill lifecycle"
  - "/sg-content audit article avec grille projet"
argument_modes:
  - argument: "capture-full-conversation"
    effect: "Exports the complete visible tmux conversation to a raw Markdown transcript."
    consequence: "Uses the internal capture implementation; it does not clean, summarize, or repurpose the transcript."
  - argument: "clean-transcript <path>"
    effect: "Removes terminal noise and labels a supplied transcript for readability."
    consequence: "Uses the internal cleanup implementation; it does not capture a new pane or create a content strategy pack."
  - argument: "plan / strategy"
    effect: "Creates or routes a content plan before edits."
    consequence: "Uses the content map and may require a spec when multiple surfaces or claims are affected."
  - argument: "repurpose <source>"
    effect: "Creates a source-faithful pack inside the content lifecycle."
    consequence: "Useful after a build conversation, source note, release, or product explanation when the downstream surface still needs to be chosen or briefed; `verbatim`, `mot pour mot`, and `copie exacte` preserve exact archival text without analysis."
  - argument: "draft / article / blog / guide"
    effect: "Routes original long-form writing through the drafting lane."
    consequence: "Stops with surface missing when no declared blog or article path exists."
  - argument: "enrich"
    effect: "Routes existing content through the enrichment lane."
    consequence: "Improves current pages while preserving runtime schemas and public claims."
  - argument: "audit / marketing / seo"
    effect: "Routes quality review to the relevant audit lane."
    consequence: "Routes market, GTM, copy, and copywriting review to explicit `009-sg-marketing` modes; SEO/search intent stays separate."
  - argument: "apply / publish / ship"
    effect: "Runs validation and ship routing for content changes."
    consequence: "Requires bounded dirty scope, public build proof when relevant, and verification before ship."
limits:
  - "It does not replace specialist writing, enrichment, audit, docs, research, or SEO skills after its bounded repurpose pack"
  - "Capture and cleanup are separate modes; neither replaces the exact-preservation verbatim branch"
  - "It does not invent undeclared blog, newsletter, social, or support paths"
  - "It blocks unsupported sensitive claims instead of making them sound better"
related_skills:
  - "sg-redact"
  - "sg-enrich"
  - "sg-marketing"
  - "sg-seo"
  - "sg-docs"
  - "sg-veille"
featured: true
order: 355
---

## The Content Lifecycle Entrypoint

Use `sg-content` when the problem is content management rather than one narrow
writing task. Its `repurpose <source>` mode creates the source-faithful pack;
it then decides whether the next owner is drafting,
enrichment, copy audit, SEO, docs, research, verification, or ship routing.

The skill starts from the content map and editorial governance layer, so public
content stays tied to declared surfaces, product truth, and claim evidence.

When a workflow asks whether a draft is good enough for a specific project,
`sg-content` can route the piece through the shared content quality rubric. The
rubric reads project rules from `shipglowz_data/business/*` and
`shipglowz_data/editorial/*`, then returns scores, a final status, evidence, and
revision guidance without creating a separate skill for each project.
