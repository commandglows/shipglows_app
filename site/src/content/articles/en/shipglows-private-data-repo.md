---
title: "Why ShipGlows keeps public code and private data in separate repositories"
description: "A practical explanation of why ShipGlows uses a separate private Git repository for durable operator data."
summary: "ShipGlows separates framework code from durable private operator data so versioning, backups, and privacy boundaries stay coherent."
publishDate: 2026-07-09
locale: "en"
articleKey: "shipglows-private-data-repo"
slug: "shipglows-private-data-repo"
alternateSlug: "pourquoi-shipglows-separe-le-code-public-des-donnees-privees"
tags:
  - "documentation"
  - "governance"
  - "private-data"
  - "git"
featured: false
draft: false
readingTime: "4 min"
---

ShipGlows does not treat all local state the same way.

That distinction matters because some data should be public and reusable across the framework, some should be private but durable, and some should be private and ephemeral.

## The simple rule

ShipGlows separates three classes of state:

- public framework code and governance
- durable private operator data
- ephemeral private runtime state

The public framework stays in the ShipGlows repository.

Durable private operator data belongs under `~/.shipglows/private/data/`.

Ephemeral runtime state belongs elsewhere, with its own retention policy.

## Why a separate private repository exists

The private data working tree under `~/.shipglows/private/data/` is intended to be its own Git repository.

That gives ShipGlows operators a clean place to version and back up private operational memory without mixing it into public project repositories or into the ShipGlows framework repository itself.

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

For example, a mail review queue may live in `~/.shipglows/private/data/mail-intake/`. It contains redacted review records, not raw message bodies.

## Why the remote is configurable

ShipGlows is not built for one operator only.

That is why the private repository remote must be configuration-driven rather than hardcoded in shared doctrine. A bootstrap or install flow may resolve it from a variable such as `SHIPGLOWS_PRIVATE_DATA_REPO`, but public docs should describe the contract, not one person’s repository URL.

## The point of the separation

This separation is not bureaucracy.

It reduces accidental leakage, keeps backups coherent, and makes it easier to reason about what should be public, what should be private-and-versioned, and what should remain temporary.
