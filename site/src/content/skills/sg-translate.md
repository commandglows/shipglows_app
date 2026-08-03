---
title: "sg-translate"
slug: "sg-translate"
tagline: "Audit translation quality or safely synchronize clearly mapped missing localized entries through one domain skill."
summary: "A translation and i18n skill with explicit audit and sync modes, guarded compatibility for apply, and focused locale-quality proof."
category: "Audit & Improve"
audience:
  - "Founders operating a multilingual product or site"
  - "Teams that suspect i18n drift or incomplete localization"
problem: "Multilingual products lose trust when translations are partial, inconsistent, structurally unsafe, or clearly treated as an afterthought."
outcome: "You get a bounded localization audit or a guarded sync of unambiguous missing entries, with unsafe items left visible for review."
founder_angle: "One translation métier replaces an operation-named command while keeping audit and controlled synchronization distinct and predictable."
when_to_use:
  - "When a product supports multiple languages"
  - "When localization work needs a completeness, quality, or technical-i18n review"
  - "When a public launch needs a translation consistency pass"
  - "When clearly mapped missing translation keys or localized content should be synchronized"
what_you_give:
  - "An explicit audit or sync intent, a localized path or project, or global audit scope"
  - "The current translation files, locale routes, content counterparts, or i18n setup"
what_you_get:
  - "A translation consistency and technical-i18n audit"
  - "Findings around missing, weak, hardcoded, mismatched, or structurally unsafe localized content"
  - "A guarded sync report with before/after counts, touched files, and ambiguous items left unchanged"
example_prompts:
  - "/sg-translate"
  - "/sg-translate audit src/content"
  - "/sg-translate audit global"
  - "/sg-translate sync"
  - "/sg-translate apply src/i18n"
argument_modes:
  - argument: "no special argument"
    effect: "Defaults to audit for the current unambiguous project."
    consequence: "Reports localization gaps without mutating product files."
  - argument: "audit [path or scope]"
    effect: "Audits one page, folder, content surface, or the current project."
    consequence: "Checks completeness, language quality, hardcoded strings, formatting, and technical i18n inside the selected scope."
  - argument: "audit global / global"
    effect: "Audits a bounded selection of multilingual projects across the workspace."
    consequence: "Surfaces cross-project terminology patterns and project-specific localization risks without delegated mutation."
  - argument: "sync [path or scope]"
    effect: "Adds only clearly mapped missing entries from a reliable source locale."
    consequence: "Preserves placeholders and existing translations, then reports before/after counts, touched files, and unchanged ambiguous items."
  - argument: "apply [path or scope]"
    effect: "Compatibility alias that runs the exact sync workflow."
    consequence: "Keeps older prompts working without exposing a third mode or duplicate implementation."
  - argument: "help"
    effect: "Lists grammar, boundaries, and examples without loading an execution playbook."
    consequence: "Produces no audit, sync, or file mutation."
limits:
  - "Audit is read-only and does not authorize remediation"
  - "Sync never rewrites existing non-empty translations or changes locale and slug strategy by default"
  - "Ambiguous, business-sensitive, terminology-conflicting, or placeholder-unsafe entries remain unchanged for review"
  - "Nuanced cultural adaptation may still need a native-speaker review"
related_skills:
  - "sg-docs"
  - "sg-marketing"
  - "sg-seo"
  - "sg-redact"
featured: false
order: 200
---
