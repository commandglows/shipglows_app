---
title: "sf-docs"
slug: "sf-docs"
tagline: "Create or repair documentation so the repo stays navigable for both humans and agents."
summary: "A documentation skill for generating, updating, auditing, and harmonizing project docs and supporting contracts."
category: "Operate & Ship"
audience:
  - "Founders who want cleaner documentation without bloated prose"
  - "Teams that need docs to stay operational, not decorative"
problem: "Docs decay quickly when product changes are not reflected in the files that explain how the system works."
outcome: "You get documentation that is closer to the current reality of the repo and easier to rely on during execution, including bug workflow docs that stay coherent with the tracker model."
founder_angle: "This skill matters because stale docs create the same drag as stale code: wrong assumptions, weak handoffs, and repeated rediscovery."
when_to_use:
  - "When the repo needs a new README, guide, or audit of existing docs"
  - "When implementation changed user-facing behavior or contracts"
  - "When the documentation surface feels inconsistent or stale"
  - "When legacy ShipFlow files at the project root need to move into the canonical shipflow_data layout"
what_you_give:
  - "A target file, doc mode, or documentation goal"
  - "The current repo and decision-doc context"
what_you_get:
  - "Generated or updated documentation"
  - "A stronger documentation contract for future work"
  - "Better coherence between code and supporting docs"
example_prompts:
  - "/sf-docs readme"
  - "/sf-docs audit"
  - "/sf-docs migrate-layout"
  - "/sf-docs update docs after onboarding changes"
limits:
  - "It can improve documentation quality, but only the code proves real behavior"
  - "Docs still need product judgment when the underlying decision is unsettled"
  - "Bug workflow docs should be checked for coherence across TEST_LOG.md, BUGS.md, dossier formats, and public skill pages"
  - "Docs audits should also verify skill-budget coherence with the ShipFlow skill budget audit script when skill docs change"
related_skills:
  - "sf-context"
  - "sf-spec"
  - "sf-end"
featured: false
order: 350
---

## Documentation Coherence Checks

`sf-docs` should look for bug-workflow drift as part of a normal docs audit. That means checking whether `TEST_LOG.md`, `BUGS.md`, dossier templates, and public skill pages still describe the same operating model.

If one page still implies the old tracker behavior, the docs result should call out the mismatch instead of silently accepting it.

`sf-docs migrate-layout` owns the cleanup of legacy ShipFlow governance files that were left at a project root. Files such as `BUSINESS.md`, `PRODUCT.md`, `GTM.md`, `CONTENT_MAP.md`, `CONTEXT.md`, `GUIDELINES.md`, `TASKS.md`, and `AUDIT_LOG.md` are migration sources only; their compliant destinations live under `shipflow_data/business/`, `shipflow_data/editorial/`, `shipflow_data/technical/`, or `shipflow_data/workflow/`.

When public or internal skill documentation changes, `sf-docs` should also treat the skill budget audit as part of documentary coherence. The skill catalog has to remain understandable to humans and discoverable by Codex and Claude Code.
