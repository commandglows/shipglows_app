---
title: "sg-product-entitlements"
slug: "sg-product-entitlements"
tagline: "Design product entitlement ownership and server-side access gates before premium behavior changes."
summary: "A product-entitlement skill for suite and standalone access models, provider events, redemption codes, support diagnostics, backend authorization, and sync handoffs."
category: "Build & Fix"
audience:
  - "Founders changing paid-access, premium, or gated-product behavior"
  - "Builders defining product ledger strategy and premium gate design"
  - "Teams routing support actions for grants, revokes, refunds, expiry, and migration"
problem: "Entitlement changes are often implemented incorrectly when access checks are mixed with auth, local caches, or provider callbacks without explicit server-owned ownership."
outcome: "You get a bounded entitlement contract that separates identity, provider events, and durable access authorization, then routes to sync or auth/debug specialists only where owned."
founder_angle: "Small access mistakes can expose premium data or block loyal customers; this skill reduces that risk before implementation starts."
when_to_use:
  - "When adding or changing product access, paid plans, feature gates, or premium capabilities"
  - "When handling provider events, activation codes, refunds, revocation, or migration"
  - "When local snapshots/caches exist and entitlement freshness or stale access is risky"
  - "When support teams need predictable grant/revoke/refund diagnostics"
what_you_give:
  - "Product access scope, project, plan/product identifiers, and entitlement mode"
  - "Current project signals and whether a suite ledger exists"
what_you_get:
  - "A product entitlement contract or routed implementation plan"
  - "Rules for identity separation, provider-event safety, backend gates, and status semantics"
  - "Support-runbook framing for common grant/revoke/refund support needs"
  - "Explicit handoff to sync and auth-debug specialists where ownership is separate"
example_prompts:
  - "/sg-product-entitlements define access checks for a new paid plan"
  - "/sg-product-entitlements audit duplicate entitlement tables before implementation"
  - "/sg-product-entitlements route a refund + sync scenario for product-local data"
  - "/sg-product-entitlements support runbook for code redemption and duplicate account access"
limits:
  - "This skill does not write project code; it produces contract and routing guidance"
  - "Provider/webhook behavior must be validated with current docs before implementation changes depend on it"
  - "It does not replace sg-build, sg-local-cloud-sync, sg-auth-debug, or product-specific implementation specs"
related_skills:
  - "sg-local-cloud-sync"
  - "sg-auth-debug"
  - "sg-spec"
  - "sg-ready"
  - "sg-build"
  - "sg-start"
  - "sg-verify"
  - "sg-docs"
  - "sg-test"
  - "sg-prod"
featured: false
order: 517
---

## Entitlement Design Surface

Use `sg-product-entitlements` when access decisions are involved.

The skill focuses on entitlement ownership and authorization boundaries, then hands sync or auth ownership work to the relevant specialist skill.
