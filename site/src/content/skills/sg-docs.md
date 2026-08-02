---
title: "sg-docs"
slug: "sg-docs"
tagline: "Create or repair documentation so the repo stays navigable for both humans and agents."
summary: "A documentation skill for maintaining docs, metadata, and governance-layout compliance across project surfaces."
category: "Operate & Ship"
audience:
  - "Founders who want cleaner documentation without bloated prose"
  - "Teams that need docs to stay operational, not decorative"
problem: "Docs decay quickly when product changes, metadata rules, or governance layouts are not reflected in the files that explain how the system works."
outcome: "You get documentation that is closer to the current reality of the repo and easier to rely on during execution, including layout, metadata, and bug workflow docs that stay coherent with the tracker model."
founder_angle: "This skill matters because stale docs create the same drag as stale code: wrong assumptions, weak handoffs, and repeated rediscovery."
when_to_use:
  - "When the repo needs a new README, guide, or audit of existing docs"
  - "When implementation changed user-facing behavior or contracts"
  - "When the documentation surface feels inconsistent or stale"
  - "When legacy ShipGlowz files at the project root need to move into the canonical shipglowz_data layout"
what_you_give:
  - "A target file, doc mode, or documentation goal"
  - "The current repo and decision-doc context"
what_you_get:
  - "Generated or updated documentation"
  - "Governance-layout review when legacy root docs should move into shipglowz_data"
  - "Metadata and technical-docs coherence when contracts change"
  - "A stronger documentation contract for future work"
  - "Better coherence between code and supporting docs"
  - "Skill documentation and public skill-page coherence when skill contracts change"
example_prompts:
  - "/sg-docs readme"
  - "/sg-docs audit"
  - "/sg-docs migrate-layout"
  - "/sg-docs update docs after onboarding changes"
limits:
  - "It can improve documentation quality, but only the code proves real behavior"
  - "Docs still need product judgment when the underlying decision is unsettled"
  - "A local README refresh is not enough when the real issue is mixed governance layout or stale metadata contracts"
  - "Bug workflow docs should be checked for coherence across shipglowz_data/workflow/TEST_LOG.md, shipglowz_data/workflow/BUGS.md, dossier formats, and public skill pages"
  - "Docs audits should also verify skill-budget coherence with the ShipGlowz skill budget audit script when skill docs change"
  - "Skill-contract changes belong to the internal 900 core build workflow; sg-docs keeps the docs and public surfaces coherent"
related_skills:
  - "sg-context"
  - "sg-spec"
  - "sg-end"
featured: false
order: 350
---

## Documentation Coherence Checks

`sg-docs` should look for bug-workflow drift as part of a normal docs audit. That means checking whether `shipglowz_data/workflow/TEST_LOG.md`, `shipglowz_data/workflow/BUGS.md`, dossier templates, and public skill pages still describe the same operating model.

If one page still implies the old tracker behavior, the docs result should call out the mismatch instead of silently accepting it.

`sg-docs migrate-layout` owns the cleanup of legacy ShipGlowz governance files that were left at a project root. Files such as `BUSINESS.md`, `PRODUCT.md`, `GTM.md`, `CONTENT_MAP.md`, `CONTEXT.md`, `GUIDELINES.md`, `TASKS.md`, and `AUDIT_LOG.md` are migration sources only; their compliant destinations live under `shipglowz_data/business/`, `shipglowz_data/editorial/`, `shipglowz_data/technical/`, or `shipglowz_data/workflow/`.

When public or internal skill documentation changes, `sg-docs` should also treat the skill budget audit as part of documentary coherence. The skill catalog has to remain understandable to humans and discoverable by Codex and Claude Code.

For public skill pages, `sg-docs` should keep runtime content schema compatibility intact and avoid ShipGlowz governance frontmatter in Astro content collections.
