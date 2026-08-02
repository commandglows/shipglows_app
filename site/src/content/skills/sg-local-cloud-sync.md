---
title: "sg-local-cloud-sync"
slug: "sg-local-cloud-sync"
tagline: "Design local-to-cloud sync without losing user data."
summary: "A data-sync skill for local data promotion, cloud hydration, merge/conflict policy, sync UX states, sensitive-data exclusions, and proof routing."
category: "Build & Fix"
audience:
  - "Founders building local-first apps that later add accounts"
  - "Builders who need safe cloud sync, backup, or reinstall recovery"
  - "Teams handling clipboard, settings, notes, voice, dictionaries, or other user-created local data"
problem: "A sync feature can look simple while silently deleting local work, replaying data into the wrong account, syncing sensitive content, or promising reinstall recovery that has not been proven."
outcome: "You get a sync contract that defines data domains, account association, promotion, hydration, merge, conflict, tombstones, offline queue, sync/save UX states, sensitive-data policy, proof route, and docs impact."
founder_angle: "Cloud sync is a trust feature. Users forgive missing advanced options more easily than losing work after they create an account."
when_to_use:
  - "Before adding accounts or cloud sync to a local-first product"
  - "When local data must be promoted, merged, hydrated, exported, imported, or recovered"
  - "When sync UI needs saved, synced, pending, retrying, blocked, and error states"
  - "When you want a SocialGlowz-style real-time sync guidance overlay after sign-in"
  - "When secrets, clipboard content, private settings, or tenant boundaries are in scope"
what_you_give:
  - "The project, feature, or data domains that need sync"
  - "Known local stores, cloud stores, auth providers, and account flows"
  - "Any known conflict policy, delete behavior, offline requirement, or sensitive-data class"
what_you_get:
  - "A local-to-cloud Sync Contract"
  - "A promotion, hydration, merge, conflict, and tombstone decision matrix"
  - "Security and privacy stop conditions"
  - "UX guidance for sync/save state, refresh, retry, and recovery"
  - "A reusable SocialGlowz-inspired sync guidance overlay and local/cloud merge pattern when the product needs real-time post-auth feedback"
  - "Routes to spec/build, onboarding, docs, browser/auth proof, or manual QA when needed"
example_prompts:
  - "/sg-local-cloud-sync plan sync for clipboard snippets and settings"
  - "/sg-local-cloud-sync audit whether account creation can preserve local data"
  - "/sg-local-cloud-sync create the sync contract before we promise reinstall recovery"
argument_modes:
  - argument: "project or feature"
    effect: "Creates a Sync Contract for the named local/cloud data surface."
    consequence: "Useful before implementation or before writing a ready spec."
  - argument: "audit"
    effect: "Reviews an existing sync plan or implementation for data-loss, account-boundary, conflict, UX, and proof gaps."
    consequence: "Useful when sync already exists but trust or correctness is uncertain."
  - argument: "Flutter"
    effect: "Adds Flutter/Riverpod/local-store proof guidance and mobile/web validation order."
    consequence: "Useful for Android-first or Flutter Web projects."
  - argument: "secrets / sensitive data"
    effect: "Focuses on default exclusions, privacy, logging, consent, and secure future-spec boundaries."
    consequence: "Useful when clipboard content, tokens, credentials, private settings, or regulated data may appear."
  - argument: "sync overlay / SocialGlowz"
    effect: "Uses the reusable SocialGlowz sync guidance overlay and merge pattern."
    consequence: "Useful when future apps need a polished post-auth overlay with real-time stages, cloud/local decisions, durable retry, and ready feedback."
limits:
  - "It does not replace sg-build for implementation lifecycle"
  - "It does not replace sg-customer for broad activation and setup guidance"
  - "It routes product-access and entitlement-ledger decisions to sg-product-entitlements before final sync contracts"
  - "It blocks unsafe defaults such as silent local wipe, cross-account replay, vague latest-wins, and convenience secret sync"
  - "It does not promise provider-specific sync behavior without fresh official docs and proof"
related_skills:
  - "sg-product-entitlements"
  - "sg-build"
  - "sg-customer"
  - "sg-docs"
  - "sg-test"
  - "sg-browser"
  - "sg-auth-debug"
featured: true
order: 516
---

## The Data-Trust Layer

Use `sg-local-cloud-sync` when the core question is whether local user data can
safely become account-backed cloud data.

It is especially useful before account creation flows, backup promises,
reinstall recovery, multi-device sync, clipboard/settings sync, or any flow
where a user expects local work to survive sign-in.

For guided post-auth sync, it can also use the shared SocialGlowz-inspired
sync guidance pattern: a real-time overlay with explicit stages, local/cloud
merge decisions, payload validation, durable retry queue, restart/ready
feedback, and proof scenarios.
