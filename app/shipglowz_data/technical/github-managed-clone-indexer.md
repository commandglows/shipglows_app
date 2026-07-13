---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-14"
updated: "2026-05-14"
status: draft
source_skill: sf-start
scope: "github-managed-clone-indexer"
owner: "Diane"
confidence: medium
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions for Firebase"
  - "GitHub App installation access"
  - "managed clone runner"
  - "lib/data/firestore_projection/"
  - "lib/data/shipglowz_sources/"
depends_on:
  - "shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md@0.1.0"
  - "shipglowz_data/technical/firestore-data-model.md@0.1.0"
supersedes: []
evidence:
  - "Pure Dart contracts and local fake runner implementation."
next_review: "2026-06-14"
next_step: "/sf-verify ShipGlowz GitHub Managed Clone Indexer"
---

# GitHub Managed Clone Indexer

## Purpose

This document defines the trusted runner boundary before production Firebase, Firestore, GitHub API, or Cloud Functions code exists. The current implementation is pure Dart contracts, validators, a local fake runner, and tests.

V1 repository authorization uses GitHub App installation access only. Flutter never receives GitHub tokens, installation tokens, tokenized clone URLs, service credentials, clone paths, or server filesystem details.

## Function Contracts

### verifyGitHubAccess

Input:

- Firebase Auth context from the callable or HTTP gateway.
- `projectId` as an opaque ShipGlowz project id.
- GitHub repository metadata as `owner`, `repo`, and `owner/repo` full name.
- `requestId` for idempotent diagnostics when verification is part of an indexing request.

Output:

- `accessStatus`: `connected`, `needs_github_app`, `github_access_lost`, `installation_suspended`, or `access_check_failed`.
- Redacted diagnostic records only.
- No token, installation token, service credential, tokenized URL, or clone path.

### indexRepository

Input:

- Firebase Auth context.
- Opaque `projectId`.
- GitHub `owner`, `repo`, and `fullName` as data, never as Firestore document ids.
- `requestId`, validated as the idempotency key.

Behavior:

- Verify Firebase Auth first.
- Reverify GitHub App installation access server-side.
- Enforce one active run per `projectId`.
- If the same `requestId` is replayed, return the existing run status.
- If a different request is already `queued` or `running`, return `already_running`.
- Materialize a managed clone in a backend-only workspace.
- Index only the allowlisted ShipGlowz Markdown corpus.
- Enforce `2 MB` max per file and `20 MB` max per refresh.
- Derive `sourceCommit` from GitHub/server state. Ignore any client-provided path or commit authority.

Output:

- Index run status: `queued`, `running`, `already_running`, `success`, `partial`, `failed`, or `canceled`.
- Indexed file projection records with `path`, `sourceCommit`, content hash, artifact type, parse status, frontmatter, projection status, deletion marker, and `indexedAt`.
- Redacted diagnostics including `source_too_large`, `refresh_too_large`, `parse_failed`, `index_timeout`, `clone_failed`, `projection_failed`, and `already_running`.

### getIndexStatus

Input:

- Firebase Auth context.
- Opaque `projectId`.
- `requestId` or latest-run lookup parameters.

Output:

- Client-readable status summary.
- Projection freshness tied to a GitHub commit SHA.
- Redacted diagnostics.

### refreshRepositoryProjection

This is future-safe naming for the same runner boundary. It must reuse `requestId` idempotency, server-side GitHub App access verification, one-active-run behavior, size budgets, and redaction rules.

## Status Transitions

- `queued` -> `running` -> `success` when all allowed files index for the current commit.
- `queued` -> `running` -> `partial` when recoverable parse failures, oversized files, or deleted-file reconciliation diagnostics exist.
- `queued` or `running` -> `failed` for access failure, clone failure, index timeout, or projection failure.
- `running` plus a duplicate `requestId` returns the existing active status.
- A different active request returns `already_running` and starts no second clone/index mutation.

Projection status:

- `fresh`: indexed source commit matches GitHub head.
- `stale`: GitHub head changed or clone/index failed while prior projection remains readable.
- `partial`: some files indexed with diagnostics.
- `access_lost`: GitHub App access is lost or suspended.
- `error`: projection is not fresh because indexing or projection write failed.

## Timeout And Retry Policy

- Runner operations must have explicit timeouts before production deployment.
- If an installation token expires during GitHub API or clone work, the runner may create one fresh token and retry the current operation once.
- GitHub/network transient retries must be bounded.
- No unbounded background loop is allowed.
- `index_timeout` is a terminal run diagnostic for the attempt; retry requires a new or replayed idempotent request.

## Size Budgets

- Per-file budget: `2 MB`.
- Per-refresh budget: `20 MB`.
- Oversized files produce `source_too_large`.
- Refresh overflow produces `refresh_too_large`.
- Prior readable projection remains stale rather than silently overwritten by incomplete authority.

## Security Requirements

- Firebase Auth is mandatory for callable or HTTP runner endpoints.
- App Check and rate limit controls are required before production exposure.
- GitHub App installation metadata is backend-only.
- Firestore writes for project status, index runs, diagnostics, source commits, and membership authority are server-owned.
- Security Rules must enforce membership-verifiable reads for project documents, indexed files, index runs, and diagnostics.
- Query boundaries must not allow cross-user project listing.
- Diagnostics and audit logging must be useful but redacted.
- Abuse/cost controls must cap clone/index frequency, file size, total refresh size, and run duration.
- Production code must not log tokens, installationToken, cloneUrl, clonePath, serviceCredential, or x-access-token values.

## Local Fake Runner

The current implementation in `lib/data/shipglowz_sources/local_fake_clone_indexer.dart` is not a production runner. It reads a local fixture/repository path through `SourcePathPolicy`, applies `ShipGlowzArtifactIndexPolicy`, emits Firestore-shaped projection records, reconciles deleted files as tombstones, and validates that client-readable payloads contain no secret-like fields.

## Validation

```bash
flutter test test/data/firestore_projection
flutter test test/data/shipglowz_sources
flutter test test/shipglowz/data
rg -n "requestId|already_running|source_too_large|index_timeout|verifyGitHubAccess|indexRepository|2 MB|20 MB|token" shipglowz_data/technical/github-managed-clone-indexer.md
rg -n "App Check|rate limit|server-owned|membership|redacted|Security Rules|backend-only" shipglowz_data/technical/github-managed-clone-indexer.md
```
