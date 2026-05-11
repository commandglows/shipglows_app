---
title: "sf-bug"
slug: "sf-bug"
tagline: "Run a bug from report to dossier, fix, retest, verification, and ship risk without skipping gates."
summary: "A professional bug loop executor that reads bug state and continues through the right ShipFlow owner skills when safe."
category: "Build & Fix"
audience:
  - "Founders managing bugs across multiple agent sessions"
  - "Developers who want one command to carry bug state safely"
  - "Operators using BUG-ID dossiers as durable project memory"
problem: "ShipFlow already has bug capture, fix, retest, verification, and shipping gates, but the operator still has to remember which command comes next and when the loop can continue safely."
outcome: "The bug loop continues through the right owner skills when safe, or reports the blocked next command based on dossier status, severity, evidence needs, development mode, and ship risk."
founder_angle: "This skill keeps bug work from turning into scattered chat memory. It protects speed by making the next action obvious, and it protects quality by refusing unsafe closure."
when_to_use:
  - "When you have a BUG-ID and need to know what comes next"
  - "When a bug was fixed but still needs retest or verification"
  - "When you need to decide whether an open bug blocks shipping"
  - "When a fresh bug report needs test, fix, browser evidence, or spec routing"
what_you_give:
  - "A BUG-ID, bug summary, or mode such as --retest, --fix, --verify, --ship, or --close"
  - "Optional environment or release context when ship risk matters"
what_you_get:
  - "A dossier-first bug state summary"
  - "Lifecycle continuation through the right owner skill, or a blocked next command when execution cannot continue safely"
  - "A safety check for missing evidence, retest, verification, and high-risk shipping"
  - "A clear distinction between orchestration and the phase skills that mutate records or code"
example_prompts:
  - "/sf-bug"
  - "/sf-bug BUG-2026-05-03-001"
  - "/sf-bug --retest BUG-2026-05-03-001"
  - "/sf-bug --ship BUG-2026-05-03-001"
argument_modes:
  - argument: "no argument"
    effect: "Summarizes actionable bug state from BUGS.md and recent dossiers."
    consequence: "Continues the highest-priority safe bug action when possible instead of editing records in the master thread."
  - argument: "BUG-ID"
    effect: "Reads BUGS.md and bugs/BUG-ID.md, then continues based on status and severity when safe."
    consequence: "Keeps the dossier as the source of truth."
  - argument: "--retest BUG-ID"
    effect: "Continues through sf-test --retest BUG-ID."
    consequence: "Retest evidence stays in the bug dossier and compact trackers."
  - argument: "--ship BUG-ID"
    effect: "Checks whether the bug state blocks clean shipping."
    consequence: "Open high or critical bugs stay visible as blocked or partial-risk."
limits:
  - "It orchestrates the bug loop; it does not replace sf-test, sf-fix, sf-auth-debug, sf-browser, sf-verify, or sf-ship"
  - "It does not close bugs without retest evidence or an explicit closed-without-retest exception"
  - "It does not persist raw sensitive evidence"
related_skills:
  - "sf-test"
  - "sf-fix"
  - "sf-auth-debug"
  - "sf-browser"
  - "sf-verify"
  - "sf-ship"
featured: false
order: 18
---

## One Lifecycle Executor For The Bug Loop

The professional bug model already splits work into compact trackers and detailed dossiers:

- `TEST_LOG.md` records manual test runs.
- `BUGS.md` keeps the compact bug index.
- `bugs/BUG-ID.md` holds the full dossier.
- `test-evidence/BUG-ID/` stores redacted larger evidence when needed.

`sf-bug` sits above the phase skills and answers one question:

```text
What should happen next for this bug, and can ShipFlow safely continue it now?
```

It reads the bug state and continues through the owner skill when safe. It does not patch code in the master thread, mutate the dossier directly, or declare closure by itself.

## Intended Flow

```text
sf-bug
  -> sf-test for capture or retest
  -> sf-fix for diagnosis and fix attempts
  -> sf-auth-debug or sf-browser when evidence is missing
  -> sf-verify for closure
  -> sf-ship for final bug-risk-aware shipping
```

That makes the loop easier to run without weakening it. A `fix-attempted` bug continues to retest when possible. A `fixed-pending-verify` bug continues to verification. An open high or critical bug blocks clean ship framing.

## Why It Exists

Without an orchestrator, a bug can stall between tools:

```text
The fix exists, but nobody retested it.
The retest passed, but nobody verified closure.
The release is ready, but an open high-severity bug still exists.
```

`sf-bug` makes those states explicit and continues the next safe action when possible. It preserves the professional bug loop while keeping each specialized skill responsible for its own work.
