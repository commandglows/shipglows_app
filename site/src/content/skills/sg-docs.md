---
title: "sg-docs"
slug: "sg-docs"
tagline: "Maintain internal documentation so the repo stays navigable for humans and agents."
summary: "An internal-documentation skill for architecture context, technical guides, metadata, and governance-layout compliance. Public documentation and editorial content belong to sg-content."
category: "Operate & Ship"
audience:
  - "Founders who want cleaner documentation without bloated prose"
  - "Teams that need docs to stay operational, not decorative"
problem: "Docs decay quickly when product changes, metadata rules, or governance layouts are not reflected in the files that explain how the system works."
outcome: "You get documentation that is closer to the current reality of the repo and easier to rely on during execution, including layout, metadata, and bug workflow docs that stay coherent with the tracker model."
founder_angle: "This skill matters because stale docs create the same drag as stale code: wrong assumptions, weak handoffs, and repeated rediscovery."
when_to_use:
  - "When internal architecture, contributor, operational, or agent documentation needs repair"
  - "When implementation changed user-facing behavior or contracts"
  - "When the documentation surface feels inconsistent or stale"
  - "When legacy ShipGlows files at the project root need to move into the canonical shipglows_data layout"
what_you_give:
  - "A target file, doc mode, or documentation goal"
  - "The current repo and decision-doc context"
what_you_get:
  - "Generated or updated internal documentation"
  - "Governance-layout review when legacy root docs should move into shipglows_data"
  - "Metadata and technical-docs coherence when contracts change"
  - "A stronger documentation contract for future work"
  - "Better coherence between code and supporting docs"
  - "Skill documentation coherence when internal contracts change"
example_prompts:
  - "/sg-docs readme"
  - "/sg-docs audit"
  - "/sg-docs migrate-layout"
  - "/sg-docs update docs after onboarding changes"
limits:
  - "It can improve documentation quality, but only the code proves real behavior"
  - "Docs still need product judgment when the underlying decision is unsettled"
  - "A local README refresh is not enough when the real issue is mixed governance layout or stale metadata contracts"
  - "Bug workflow docs should be checked for coherence across shipglows_data/workflow/TEST_LOG.md, shipglows_data/workflow/BUGS.md, dossier formats, and public skill pages"
  - "Docs audits should also verify skill-budget coherence with the ShipGlows skill budget audit script when skill docs change"
  - "Public documentation, landing pages, FAQ, articles, and external README content belong to sg-content"
related_skills:
  - "sg-context"
  - "sg-spec"
  - "sg-end"
featured: false
order: 350
---

## Documentation Coherence Checks

`sg-docs` should look for bug-workflow drift as part of a normal docs audit. That means checking whether `shipglows_data/workflow/TEST_LOG.md`, `shipglows_data/workflow/BUGS.md`, dossier templates, and public skill pages still describe the same operating model.

If one page still implies the old tracker behavior, the docs result should call out the mismatch instead of silently accepting it.

`sg-docs migrate-layout` owns the cleanup of legacy ShipGlows governance files that were left at a project root. Files such as `BUSINESS.md`, `PRODUCT.md`, `GTM.md`, `CONTENT_MAP.md`, `CONTEXT.md`, `GUIDELINES.md`, `TASKS.md`, and `AUDIT_LOG.md` are migration sources only; their compliant destinations live under `shipglows_data/business/`, `shipglows_data/editorial/`, `shipglows_data/technical/`, or `shipglows_data/workflow/`.

When public or internal skill documentation changes, `sg-docs` should also treat the skill budget audit as part of documentary coherence. The skill catalog has to remain understandable to humans and discoverable by Codex and Claude Code.

For public skill pages, `sg-docs` should keep runtime content schema compatibility intact and avoid ShipGlows governance frontmatter in Astro content collections.
