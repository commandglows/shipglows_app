---
title: "Why ShipGlowz should not rush global primitives for profiles and tags"
description: "A precise explanation of why global runtime primitives for profiles and tags should wait until the semantics are stable."
summary: "Global primitives look elegant, but they hard-freeze semantics, debugging posture, and runtime obligations earlier than ShipGlowz can safely support."
publishDate: 2026-06-28
locale: "en"
articleKey: "global-primitives-vs-local-conventions"
slug: "global-primitives-vs-local-conventions"
alternateSlug: "pourquoi-shipflow-ne-doit-pas-figer-trop-vite-des-primitives-globales"
tags:
  - "runtime"
  - "profiles"
  - "focus-tags"
  - "governance"
featured: true
draft: false
readingTime: "6 min"
---

Global primitives sound attractive because they make the syntax feel native.

If `%Victoire` or `#Adhesion` became true runtime primitives, they would no longer behave like a local convention loaded at the beginning of a thread. They would become part of the platform contract itself.

That is exactly why ShipGlowz should not rush them.

## The distinction that matters

A local convention is implemented inside the ShipGlowz layer. It can be changed, renamed, clarified, or even removed without pretending that the host runtime understands it natively.

A global primitive is different:

- it is always available
- it has to behave consistently across conversations
- it needs exact persistence and reset semantics
- it must be debuggable when it interacts with skills, tags, and routing

Once that contract exists, every ambiguity becomes product debt.

## Why the timing matters

The current profile system is still proving its operating model.

ShipGlowz already knows the value of named profiles such as `%Victoire`, `%Prudence`, and `%Ariane`: they change posture and arbitration. They do not replace skill ownership, and they do not remove the need for project context.

What is still stabilizing is the runtime behavior around them:

- Does a profile persist for one turn or the whole thread?
- Can several profiles stack?
- If a profile conflicts with a focus tag, which one wins?
- How does the operator inspect the currently active profile state?
- What is the reset command?

If those answers are not fixed first, a global primitive only hides uncertainty under nicer syntax.

## The main reasons to wait

### 1. We may not control the host runtime deeply enough

ShipGlowz can document conventions today because documentation is under our control.

A native primitive requires a real execution hook in the runtime layer. If that layer is partial, indirect, or dependent on plugin behavior, the primitive becomes misleading. It looks native but still behaves like a workaround.

### 2. Global syntax freezes semantics early

The moment a primitive becomes public, users build habits around it.

Changing its scope later is expensive because it breaks muscle memory, docs, examples, and debugging assumptions. Local conventions are much cheaper to evolve while the model is still being refined.

### 3. Hidden magic gets harder to debug

If `%Victoire` silently changes arbitration three turns later, the operator needs to know why.

That means a primitive is not only syntax. It needs visible state, conflict rules, reset behavior, and probably an inspection surface. Without those, the runtime feels magical instead of trustworthy.

### 4. Profiles and tags may need different lifecycles

They look similar, but they do different jobs.

- a profile changes posture
- a tag recenters the current objective

Those two concepts may need different persistence rules. Treating them as one primitive family too early would create conceptual drift instead of clarity.

## The practical rule

ShipGlowz should first prove the model locally:

1. document the invocation convention clearly
2. implement plugin-level routing where we control the behavior
3. observe real usage
4. freeze semantics only when conflicts, persistence, and reset behavior are explicit

After that, global primitives become a product hardening move.

Before that, they are mostly premature API design.

## The short version

The issue is not whether global primitives are elegant. They are.

The issue is whether ShipGlowz is ready to promise exact runtime semantics for profiles and tags across threads, tools, and debugging surfaces.

Right now, the safer move is to mature the model first, then promote it.
