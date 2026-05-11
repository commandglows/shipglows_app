---
title: "sf-fix"
slug: "sf-fix"
tagline: "Triage a bug fast, decide whether it is safe to patch now, and route it correctly."
summary: "The bug-first entrypoint for ShipFlow when the work starts from broken behavior instead of a new feature request."
category: "Build & Fix"
audience:
  - "Solo founders facing product or QA bugs"
  - "Operators who want a safer fork between hotfixes and deeper spec work"
problem: "Bug work often oscillates between overreacting with a rushed patch and overcomplicating a local issue that could have been fixed directly."
outcome: "You get a clearer decision about whether the issue should be fixed now, investigated further, or routed into a stronger contract path, using the bug dossier as the working record."
founder_angle: "This skill helps you move quickly without pretending every bug is trivial. It keeps speed and judgment in the same loop, and it keeps the diagnosis attached to the bug itself."
when_to_use:
  - "When the starting point is a concrete bug report or failing behavior"
  - "When it is unclear whether the issue is truly local"
  - "When a bug may hide a deeper product or permission problem"
what_you_give:
  - "The observed bug, error, or failing flow"
  - "Any relevant expected behavior if known"
what_you_get:
  - "A triage decision and rationale"
  - "Either a direct-fix path or a spec-first reroute"
  - "A bug-dossier-driven fix loop when BUG-ID is provided"
  - "A durable bug record even when the fix starts as a direct local patch, except for explicit minor exceptions"
  - "A route to sf-browser when the bug needs non-auth browser evidence"
  - "A sharper understanding of the real bug boundary"
example_prompts:
  - "/sf-fix users can still access archived projects"
  - "/sf-fix dashboard crashes on first login"
  - "/sf-fix checkout spinner never resolves"
limits:
  - "It is for bounded bug work, not broad redesign"
  - "Some bug reports still need deeper clarification before safe implementation"
  - "When a bug id is supplied, the skill consumes bugs/BUG-ID.md and appends diagnosis and fix attempts there instead of relying on chat history"
related_skills:
  - "sf-spec"
  - "sf-bug"
  - "sf-browser"
  - "sf-start"
  - "sf-verify"
featured: true
order: 20
---

## Bug-First Flow

When you pass `BUG-ID`, `sf-fix` treats `bugs/BUG-ID.md` as the primary source of truth. It should read the dossier, append diagnosis notes, record fix attempts, and keep the retest history attached to the same record.

When no `BUG-ID` exists yet, `sf-fix` should usually create one before ending the run so the correction is not remembered only through chat history. The intended default is simple: a direct fix can stay fast without becoming untraceable.

That rule matters most for the "small fix" path. If the bug is real enough to change code, data flow, permissions, routing, payment, cache behavior, API behavior, or stateful UI, it should leave a durable record:

- a compact `BUGS.md` index pointer
- a detailed `bugs/BUG-ID.md` dossier
- diagnosis and fix-attempt notes attached to the same bug
- retest history when the fix is checked later

The exception is intentionally narrow. Copy-only typos, cosmetic-only adjustments, or exact duplicates can skip dossier creation only when the final report says so explicitly and names the tradeoff.

If the dossier is incomplete, the skill should say what is missing and keep the bug open rather than inventing context from chat memory.
