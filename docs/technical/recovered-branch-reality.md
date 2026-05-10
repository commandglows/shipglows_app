---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-09"
updated: "2026-05-09"
status: draft
source_skill: sf-docs
scope: "recovered-branch-reality"
owner: "Diane"
confidence: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "origin/main"
  - "backup/local-supabase-wip-2026-05-08"
  - "specs/full-supabase-migration.md"
  - "specs/shipflow-project-source-onboarding.md"
depends_on:
  - "docs/technical/markdown-source-of-truth.md@0.1.0"
  - "docs/technical/shipflow-legacy-reuse-roadmap.md@0.1.0"
supersedes: []
evidence:
  - "git log --all on 2026-05-09"
  - "git show --stat backup/local-supabase-wip-2026-05-08"
  - "User clarification on 2026-05-09"
next_review: "2026-06-09"
next_step: "/sf-spec Firebase Firestore projection migration"
---

# Recovered Branch Reality

## Purpose

This document preserves the recovered context so future sessions do not lose the project truth again.

## Owned Files

- `docs/technical/recovered-branch-reality.md`
- `specs/shipflow-project-source-onboarding.md`
- future Firebase/Firestore migration specs

## Entrypoints

- `origin/main`
- `backup/local-supabase-wip-2026-05-08`
- `integration/recover-from-local-supabase-wip`

## Current Branch Reality

- `origin/main` is the healthy base currently used for the repo.
- `origin/main` does not contain the full remote database migration work.
- `backup/local-supabase-wip-2026-05-08` contains the recovered local WIP from the divergent VM state.
- That WIP includes a full Supabase migration attempt:
  - `specs/full-supabase-migration.md`
  - `lib/data/services/supabase_auth_service.dart`
  - `lib/data/services/supabase_data_service.dart`
  - `lib/data/services/supabase_function_service.dart`
  - `supabase/migrations/*.sql`
  - `supabase/functions/**`
  - Supabase service tests
- The Supabase WIP should not be merged directly into `main`.

## Product Reality

- A ShipFlow project is necessarily a GitHub repository.
- Project identity is GitHub `owner/repo` plus GitHub URL.
- Each project has a local clone for Markdown/repository reading and future write-back.
- A remote database is part of the architecture target.
- The remote database is a projection/sync/index layer, not the source of truth.
- GitHub repository + Markdown files remain canonical.

## Stack Decision

- Supabase is not the desired target stack because of the inactivity policy concern.
- The Supabase WIP is useful as a design and contract archive, not as implementation to keep.
- The intended direction is to translate the useful Supabase WIP ideas into Firebase/Firestore/Firebase Auth architecture.
- Future Firebase/Firestore specs must use current official docs before implementation.

## What To Recover From Supabase WIP

- Auth/session contract shape.
- Project/repository tables and ownership concepts.
- RLS/security intent, translated to Firebase security rules or equivalent.
- Edge Function boundaries for privileged GitHub actions, translated to Firebase Cloud Functions or another serverless function layer if needed.
- Offline queue/sync semantics.
- Tests and acceptance criteria from `specs/full-supabase-migration.md`.

## What Not To Recover Directly

- Supabase Flutter SDK wiring.
- Supabase Auth provider implementation.
- Supabase SQL migrations as runtime target.
- Supabase Storage implementation.
- Supabase Edge Function code as deployed target.

## Invariants

- Do not reintroduce Supabase as the active target without explicit user reversal.
- Do not drop the WIP branch until its useful contracts have been translated.
- Do not make Firestore canonical; it remains projection/sync/index.
- Do not bypass GitHub repository identity.

## Validation

```bash
git branch -a --sort=-committerdate
git show --stat backup/local-supabase-wip-2026-05-08
git grep -n "Supabase\\|Firestore\\|Firebase\\|GitHub" backup/local-supabase-wip-2026-05-08 -- specs lib supabase test
```

## Reader Checklist

- Is a future spec using `origin/main` as healthy base?
- Did it mine `backup/local-supabase-wip-2026-05-08` for contracts before rewriting?
- Did it translate Supabase concepts to Firebase/Firestore instead of merging Supabase code?
- Does it preserve GitHub repo + local clone + Markdown source-of-truth?

## Maintenance Rule

When the Firebase/Firestore migration spec is created, cite this document and mark which Supabase WIP contracts were recovered.
