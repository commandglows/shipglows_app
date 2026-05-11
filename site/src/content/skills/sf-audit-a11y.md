---
title: "sf-audit-a11y"
slug: "sf-audit-a11y"
tagline: "Inspect accessibility as an engineering system, not as a shallow checklist."
summary: "A specialist accessibility audit for keyboard support, focus management, ARIA patterns, and WCAG-level correctness."
category: "Audit & Improve"
audience:
  - "Founders shipping custom UI components"
  - "Teams that need stronger accessibility rigor before release"
problem: "Many products pass a surface accessibility check while still failing on keyboard flows, ARIA semantics, live regions, or focus behavior in real usage."
outcome: "You get a deeper accessibility review that treats interaction patterns as product contracts, not decorative compliance."
founder_angle: "If your product uses custom UI, accessibility debt becomes workflow debt. This skill helps you catch the kind of failures that create broken flows for real users."
when_to_use:
  - "When a product relies on custom menus, dialogs, tabs, or comboboxes"
  - "When accessibility needs to be reviewed beyond color contrast and alt text"
  - "When a design audit needs a dedicated accessibility follow-up"
what_you_give:
  - "A UI surface, component set, or project to review"
  - "The existing frontend implementation"
what_you_get:
  - "A specialist accessibility review"
  - "Findings around keyboard interaction and screen-reader behavior"
  - "A clearer understanding of which interaction contracts are weak"
example_prompts:
  - "/sf-audit-a11y"
  - "/sf-audit-a11y src/components"
  - "/sf-audit-a11y app/routes/settings.tsx"
limits:
  - "It audits the current interaction model; it does not automatically rebuild components"
  - "Some findings may require design and engineering changes together"
related_skills:
  - "sf-audit-design"
  - "sf-audit-components"
  - "sf-verify"
featured: false
order: 110
---
