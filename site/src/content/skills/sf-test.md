---
title: "sf-test"
slug: "sf-test"
tagline: "Guide the human through the real user flow, then turn the result into test evidence and actionable bugs."
summary: "A manual QA skill for creating guided test campaigns, capturing structured outcomes, and preserving bug history after implementation."
category: "Build & Fix"
audience:
  - "Founders who need guided manual testing before shipping"
  - "Developers validating flows that need real browser or user observation"
  - "Teams that want bug reports and retests captured as durable project memory"
problem: "Technical checks and verification can pass while nobody has actually walked through the user-facing flow in the app."
outcome: "You get a concrete manual test protocol, compact test and bug indexes, and durable bug dossiers with separated evidence."
founder_angle: "This skill matters because finished code is not the same thing as a tested user journey. It gives the founder a clear script to follow and turns every failure into an actionable record without bloating the trackers."
when_to_use:
  - "After implementation and verification, before shipping"
  - "When the work changes a visible user flow"
  - "When login, onboarding, protected routes, uploads, payments, or redirects need real observation"
  - "After a fix, when the original bug needs a precise retest"
what_you_give:
  - "The recent feature, task, or spec to test"
  - "The target environment: local, preview, or production"
  - "Optional context such as a bug id, route, account type, or user flow"
what_you_get:
  - "Step-by-step manual test instructions"
  - "Structured result choices for common failure modes"
  - "A compact TEST_LOG.md record for the campaign"
  - "A compact BUGS.md index entry when the test fails"
  - "A per-bug dossier under bugs/BUG-ID.md"
  - "Redacted evidence references under test-evidence/BUG-ID/ when needed"
  - "A route into sf-browser when a narrow non-auth browser check is enough"
  - "A clean route into sf-fix or sf-auth-debug when the failure needs diagnosis"
example_prompts:
  - "/sf-test"
  - "/sf-test Google Auth"
  - "/sf-test --retest BUG-2026-04-26-001"
  - "/sf-test --prod onboarding flow"
limits:
  - "It guides and records manual evidence; it does not replace automated tests"
  - "It must stay anchored to the spec, recent diff, acceptance criteria, or verification findings"
related_skills:
  - "sf-check"
  - "sf-verify"
  - "sf-bug"
  - "sf-browser"
  - "sf-auth-debug"
  - "sf-fix"
  - "sf-ship"
featured: true
order: 65
---

## The Missing Proof Layer

ShipFlow already has strong gates for planning, implementation, technical checks, and readiness review:

```text
sf-spec -> sf-ready -> sf-start -> sf-check -> sf-verify
```

But there is a question those gates cannot fully answer by themselves:

```text
Did a real human try the real user flow?
```

`sf-test` is the answer. It turns the end of a build into a guided manual test campaign. The agent tells the user exactly what to open, click, wait for, and verify. The user chooses from structured outcomes instead of writing a vague bug report from memory.

## From Conversation To Evidence

Without a test log, manual QA often disappears into chat:

```text
User: "I have an infinite loader after Google login."
Agent: remembers it temporarily.
Next session: the exact bug context is gone.
```

`sf-test` changes the shape of that information:

```text
Observation -> scenario -> result -> bug id -> fix -> retest
```

The goal is not to add ceremony. The goal is to make the user faster and the project memory stronger.

## Example: Google Auth

For a Google login feature, the skill should not ask "does it work?" It should guide a concrete scenario:

```text
1. Open the app in a private browser window.
2. Go to /login.
3. Click "Continue with Google".
4. Choose the intended Google account.
5. Wait for the callback to complete.
6. Confirm the app lands on the expected page.
7. Reload the page.
8. Confirm the session persists.
9. Open a protected route directly.
10. Confirm access works without logging in again.
```

Then it should offer structured responses:

```text
- Login worked and session persisted
- OAuth or callback error page
- Infinite loading
- Returned to login after Google
- Logged in but protected route failed
- Wrong account, workspace, or destination
- Other observation
```

That response becomes either test evidence or a bug record with reproduction steps.

## Intended Workflow

```text
sf-spec
  -> sf-ready
  -> sf-start
  -> sf-check
  -> sf-verify
  -> sf-test
  -> sf-fix when a bug is found
  -> sf-test --retest
  -> sf-ship
```

`sf-test` sits after verification and before shipping. It can also be used after a fix to retest the exact scenario that failed.

## Artifacts

The skill should preserve three different kinds of memory:

- `TEST_LOG.md` for compact campaigns, scenarios, environments, and results
- `BUGS.md` for a compact bug index with status, severity, owner, and links
- `bugs/BUG-ID.md` for the full dossier, including reproduction, expected and observed behavior, diagnosis, fixes, retests, and next action

Evidence that is too large or sensitive should be redacted and stored by path in `test-evidence/BUG-ID/`, not pasted into the trackers. That split matters. A test is evidence. A bug is work to resolve. Keeping them separate makes future agent sessions more precise.
