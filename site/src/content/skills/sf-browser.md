---
title: "sf-browser"
slug: "sf-browser"
tagline: "Open a URL in a real browser and verify one observable non-auth objective."
summary: "A general browser verification skill for checking public UI, previews, production pages, visible assertions, screenshots, console messages, and network signals without turning every page check into auth debugging or manual QA."
category: "Build & Fix"
audience:
  - "Founders who need quick browser evidence before deciding what to fix"
  - "Developers checking local pages, previews, or production routes"
  - "Teams separating browser observation from auth debugging, deployment checks, and manual QA logs"
problem: "ShipFlow had auth debugging, manual QA, and production verification skills, but no small general-purpose browser evidence entrypoint for non-auth page checks."
outcome: "You get a concise browser report with target, runtime, objective, observed state, verdict, evidence, limits, and the right next ShipFlow command."
founder_angle: "This skill matters when you need to know what the browser actually sees without opening a full bug dossier or stretching an auth-specialized workflow."
when_to_use:
  - "When you need to verify that a public page, preview, or production URL displays an expected state"
  - "When a visual, console, network, screenshot, or accessibility snapshot check is enough"
  - "When a browser finding should route to sf-fix, sf-test, sf-prod, sf-auth-debug, or sf-verify"
what_you_give:
  - "A URL, route, deployment surface, or local page"
  - "One observable objective, such as text appearing, layout rendering, or a network status"
  - "Optional viewport or screenshot preference"
what_you_get:
  - "A real-browser observation"
  - "A narrow pass, fail, partial, blocked, or routed verdict"
  - "Sanitized console or network summaries when relevant"
  - "Screenshot or snapshot evidence when useful"
  - "Clear limits and the next ShipFlow command"
example_prompts:
  - "/sf-browser https://example.com verify Example Domain is visible"
  - "/sf-browser local homepage check that the pricing CTA renders"
  - "/sf-browser preview URL inspect console errors on /dashboard"
  - "/sf-browser production page verify the docs link is visible"
limits:
  - "It is read-only by default and will not click through destructive or production-mutating actions without explicit approval"
  - "Auth, OAuth, session, callback, cookie, tenant, and protected-route issues belong in sf-auth-debug"
  - "Full manual user-flow QA and durable test logs belong in sf-test"
  - "Deployment URL discovery and runtime logs belong in sf-prod"
related_skills:
  - "sf-auth-debug"
  - "sf-test"
  - "sf-prod"
  - "sf-fix"
  - "sf-verify"
featured: false
order: 526
---

## What It Does

`sf-browser` opens the requested surface in a real browser and checks one concrete objective. The objective may be visual, structural, console-related, network-related, or screenshot-based.

The report is intentionally narrow: it says what was opened, what was expected, what was observed, what evidence was collected, what remains unproven, and which ShipFlow command should follow.

## Boundaries

Use `sf-browser` for generic page evidence.

Use `sf-auth-debug` when the issue is login, OAuth, session persistence, cookies, callbacks, tenants, or protected routes.

Use `sf-test` when a real user flow needs guided manual QA, durable logs, retests, or bug records.

Use `sf-prod` when the deployment URL, Vercel state, build logs, runtime logs, or live deploy readiness are still uncertain.

## Evidence Discipline

The skill prefers accessibility snapshots and focused observations before heavier artifacts. Console and network evidence is summarized and redacted. Screenshots are used when visual proof matters.

Production interaction is read-only by default. Any action that creates, deletes, publishes, buys, sends email, changes account data, or triggers external side effects requires explicit approval or a safer environment.
