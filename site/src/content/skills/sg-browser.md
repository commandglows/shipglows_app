---
title: "sg-browser"
slug: "sg-browser"
tagline: "Open a URL in a real browser and verify one observable non-auth objective."
summary: "A general browser verification skill for checking public UI, previews, production pages, visible assertions, screenshots, console messages, and network signals without turning every page check into auth debugging or manual QA."
category: "Build & Fix"
audience:
  - "Founders who need quick browser evidence before deciding what to fix"
  - "Developers checking local pages, previews, or production routes"
  - "Teams separating browser observation from auth debugging, deployment checks, and manual QA logs"
problem: "ShipGlowz had auth debugging, manual QA, and production verification skills, but no small general-purpose browser evidence entrypoint for non-auth page checks."
outcome: "You get a concise browser report with target, runtime, objective, observed state, verdict, evidence, limits, and the right next ShipGlowz command."
founder_angle: "This skill matters when you need to know what the browser actually sees without opening a full bug dossier or stretching an auth-specialized workflow."
when_to_use:
  - "When you need to verify that a public page, preview, or production URL displays an expected state"
  - "When a visual, console, network, screenshot, or accessibility snapshot check is enough"
  - "When a browser finding should route to sg-fix, sg-test, sg-prod, sg-auth-debug, or sg-verify"
what_you_give:
  - "A URL, route, deployment surface, or local page"
  - "One observable objective, such as text appearing, layout rendering, or a network status"
  - "Optional viewport or screenshot preference"
what_you_get:
  - "A real-browser observation"
  - "A narrow pass, fail, partial, blocked, or routed verdict"
  - "Sanitized console or network summaries when relevant"
  - "Screenshot or snapshot evidence when useful"
  - "Clear limits and the next ShipGlowz command"
example_prompts:
  - "/sg-browser https://example.com verify Example Domain is visible"
  - "/sg-browser local homepage check that the pricing CTA renders"
  - "/sg-browser preview URL inspect console errors on /dashboard"
  - "/sg-browser production page verify the docs link is visible"
limits:
  - "It is read-only by default and will not click through destructive or production-mutating actions without explicit approval"
  - "Auth, OAuth, session, callback, cookie, tenant, and protected-route issues belong in sg-auth-debug"
  - "Full manual user-flow QA and durable test logs belong in sg-test"
  - "Deployment URL discovery and runtime logs belong in sg-prod"
related_skills:
  - "sg-auth-debug"
  - "sg-test"
  - "sg-prod"
  - "sg-fix"
  - "sg-verify"
featured: false
order: 526
---

## What It Does

`sg-browser` opens the requested surface in a real browser and checks one concrete objective. The objective may be visual, structural, console-related, network-related, or screenshot-based.

The report is intentionally narrow: it says what was opened, what was expected, what was observed, what evidence was collected, what remains unproven, and which ShipGlowz command should follow.

## Boundaries

Use `sg-browser` for generic page evidence.

Use `sg-auth-debug` when the issue is login, OAuth, session persistence, cookies, callbacks, tenants, or protected routes.

Use `sg-test` when a real user flow needs guided manual QA, durable logs, retests, or bug records.

Use `sg-prod` when the deployment URL, Vercel state, build logs, runtime logs, or live deploy readiness are still uncertain.

## Evidence Discipline

The skill prefers accessibility snapshots and focused observations before heavier artifacts. Console and network evidence is summarized and redacted. Screenshots are used when visual proof matters.

Production interaction is read-only by default. Any action that creates, deletes, publishes, buys, sends email, changes account data, or triggers external side effects requires explicit approval or a safer environment.
