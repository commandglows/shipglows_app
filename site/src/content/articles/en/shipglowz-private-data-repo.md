---
title: "Why ShipGlowz keeps public code and private data in separate repositories"
description: "A practical explanation of why ShipGlowz uses a separate private Git repository for durable operator data."
summary: "ShipGlowz separates framework code from durable private operator data so versioning, backups, and privacy boundaries stay coherent."
publishDate: 2026-07-09
locale: "en"
articleKey: "shipglowz-private-data-repo"
slug: "shipglowz-private-data-repo"
alternateSlug: "pourquoi-shipglowz-separe-le-code-public-des-donnees-privees"
tags:
  - "documentation"
  - "governance"
  - "private-data"
  - "git"
featured: false
draft: false
readingTime: "4 min"
---

ShipGlowz does not treat all local state the same way.

That distinction matters because some data should be public and reusable across the framework, some should be private but durable, and some should be private and ephemeral.

## The simple rule

ShipGlowz separates three classes of state:

- public framework code and governance
- durable private operator data
- ephemeral private runtime state

The public framework stays in the ShipGlowz repository.

Durable private operator data belongs under `~/.shipglowz/private/data/`.

Ephemeral runtime state belongs elsewhere, with its own retention policy.

## Why a separate private repository exists

The private data working tree under `~/.shipglowz/private/data/` is intended to be its own Git repository.

That gives ShipGlowz operators a clean place to version and back up private operational memory without mixing it into public project repositories or into the ShipGlowz framework repository itself.

This is useful for things like:

- project fiches
- reusable private source summaries
- private reports
- declarative local registries such as future email-management state

## What does not belong there

A private data repository is still not a secret vault.

It should not store:

- OAuth client secrets
- refresh tokens
- cookies
- SSH keys
- raw credentials

It may also hold short-retention operational state when versioning improves recovery, without becoming an archive of raw messages.

For example, a mail review queue may live in `~/.shipglowz/private/data/mail-intake/`. It contains redacted review records, not raw message bodies.

## Why the remote is configurable

ShipGlowz is not built for one operator only.

That is why the private repository remote must be configuration-driven rather than hardcoded in shared doctrine. A bootstrap or install flow may resolve it from a variable such as `SHIPGLOWZ_PRIVATE_DATA_REPO`, but public docs should describe the contract, not one person’s repository URL.

## The point of the separation

This separation is not bureaucracy.

It reduces accidental leakage, keeps backups coherent, and makes it easier to reason about what should be public, what should be private-and-versioned, and what should remain temporary.
