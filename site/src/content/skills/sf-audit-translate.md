---
title: "sf-audit-translate"
slug: "sf-audit-translate"
tagline: "Review whether translations are complete, consistent, and trustworthy, then sync missing localized content when the mapping is clear."
summary: "A translation audit and controlled i18n sync skill for completeness, tone consistency, cross-language coherence, and missing localized entries."
category: "Audit & Improve"
audience:
  - "Founders operating a multilingual product or site"
  - "Teams that suspect i18n drift or incomplete localization"
problem: "Multilingual products lose trust when translations are partial, inconsistent, missing from some locales, or clearly treated as an afterthought."
outcome: "You get a structured view of translation quality and, when requested, a guarded sync path for missing keys or localized content."
founder_angle: "This skill is useful when translation errors create a trust tax that is easy to ignore internally but obvious to real users, and when missing locale coverage needs operational cleanup."
when_to_use:
  - "When a product supports multiple languages"
  - "When localization work has accumulated over time without a dedicated review"
  - "When a public launch needs a translation consistency pass"
  - "When missing translation keys or localized content should be filled from a source locale"
what_you_give:
  - "A localized page, folder, project, or sync/apply scope"
  - "The current translation files or content surfaces"
what_you_get:
  - "A translation consistency audit"
  - "Findings around missing, weak, or mismatched localized content"
  - "An optional sync report with missing entries before and after, files touched, and ambiguous items"
  - "A better basis for cleanup before publishing further"
example_prompts:
  - "/sf-audit-translate"
  - "/sf-audit-translate src/content"
  - "/sf-audit-translate marketing pages"
  - "/sf-audit-translate sync"
  - "/sf-audit-translate apply src/i18n"
argument_modes:
  - argument: "no special argument"
    effect: "Runs a project-level translation and i18n consistency audit."
    consequence: "Reports missing, weak, mismatched, hardcoded, or technically risky localized content."
  - argument: "file path or scope"
    effect: "Limits the audit to one page, folder, content surface, or project area."
    consequence: "Keeps findings and cleanup guidance focused on the selected localized surface."
  - argument: "global"
    effect: "Audits multilingual projects across the workspace when translation domains apply."
    consequence: "Surfaces cross-project localization drift and project-specific translation risks."
  - argument: "sync / apply"
    effect: "Switches to operational sync mode for filling missing translations from the default or source locale."
    consequence: "Only low-risk missing entries should be added; ambiguous, business-sensitive, or terminology-changing items must remain visible for review."
  - argument: "sync [path] / apply [path]"
    effect: "Runs sync mode only inside the provided file, folder, or content scope."
    consequence: "Reduces blast radius while still reporting missing entries before and after, files touched, and ambiguous items."
limits:
  - "It audits translation quality and can fill missing entries; it does not replace full localization work"
  - "Sync mode should not rewrite existing non-empty translations or change terminology without project context"
  - "Strong translation still depends on product context and tone decisions"
related_skills:
  - "sf-docs"
  - "sf-audit-copy"
  - "sf-audit-seo"
  - "sf-redact"
featured: false
order: 200
---
