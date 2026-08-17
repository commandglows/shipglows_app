---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "shipglows_app"
created: "2026-08-17"
updated: "2026-08-17"
status: active
source_skill: "001-sg-build"
scope: "smart-project-hub"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/lib/shipglows/presentation/screens/projects_screen.dart"
  - "app/lib/shipglows/data/managed_runner_api.dart"
  - "runner/src/projects/localStudioProjectCatalog.ts"
  - "runner/src/projects/githubProjectRoutes.ts"
  - "runner/src/projects/githubProjectSource.ts"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-project-onboarding-flow.md"
    artifact_version: "1.2.0"
    required_status: active
  - artifact: "shipglows_data/workflow/specs/shipglows-auth-github-access.md"
    artifact_version: "1.0.0"
    required_status: ready
supersedes: []
evidence:
  - "The active Flutter Hub can connect a local repository or explicitly select a repository candidate returned by the runner."
  - "The runner reconciles a local origin and a GitHub full name into one aggregate and redacts local paths and GitHub installation fields from responses."
  - "The local runner completes GitHub App setup through actor-bound one-time state, App-JWT verification, server-only installation tokens, and immutable repository revalidation."
next_review: "2026-09-17"
next_step: "Configure real GitHub App credentials and run separately authorized browser proof; hosted Firebase membership and indexing remain deferred."
---

# Smart Project Hub

## Purpose

The active ShipGlows runtime owns one project aggregate regardless of where discovery starts. A project may begin from a local Git repository, from an explicitly selected GitHub App repository candidate, or from both after reconciliation. The Hub presents user outcomes and capability readiness; it does not expose infrastructure configuration.

## Active Flow

```text
local folder --------> validate + inspect origin + detect platforms ---+
                                                                  reconcile --> one project --> Cockpit / Studio / Conversations / Workspace
GitHub App status --> list redacted candidates --> explicit selection -+
```

Local connection validates that the path is an existing Git repository inside the configured ShipGlows workspace. The runner reads only local repository metadata, detects supported project markers, and never mutates Git files.

GitHub connection is a five-step server-owned contract:

1. Report `disabled`, `disconnected`, `verifying`, `ready`, `degraded`, or `accessLost` honestly.
2. Start installation through the configured GitHub App slug with an opaque, one-time, actor-bound state that expires after ten minutes.
3. Complete setup only through an authenticated ShipGlows request; verify `installation_id` with an App JWT and persist only the actor installation binding and bounded account label outside repositories.
4. Use a short-lived server-only installation token to call GitHub's installation repository endpoint and return only redacted candidates with opaque actor-bound identifiers and cursors.
5. Revalidate immutable repository metadata before resolving one explicitly selected candidate, then create or reconcile the project. Installation and repository numeric identifiers remain private.

Installation alone never creates a project. Pagination is part of the runner contract through an opaque cursor, while bulk import remains outside the current product behavior.

## Reconciliation

The registry normalizes supported GitHub HTTPS and SSH origins to `owner/repository`. When a local origin matches a selected GitHub repository, ShipGlows enriches the existing project instead of creating a duplicate. Repeating the same GitHub selection is idempotent at the aggregate level.

The registry persists outside repositories. Schema version 2 retains optional local and GitHub sources and migrates version 1 local-only records. Public responses never include:

- repository filesystem paths;
- GitHub installation identifiers;
- GitHub repository numeric identifiers;
- installation tokens, private keys, clone URLs, or credentials.

## User-Visible States

GitHub source states:

- `disabled`: runner GitHub configuration is absent;
- `disconnected`: the local Hub has no verified installation association for the actor;
- `verifying`: installation or access is being checked;
- `ready`: repository discovery and explicit selection are available;
- `degraded`: GitHub cannot currently be reverified; stale projects remain visible, while only independently available local capabilities stay usable;
- `accessLost`: GitHub access must be restored.

Source-state propagation is scoped by the private installation identifier: losing or restoring one installation updates only aggregates bound to that installation. Other installations owned by the same actor remain unchanged, and the identifier never enters a public DTO.

Project readiness is deliberately smaller:

- `ready`: at least one current source provides read access;
- `degraded`: one source needs attention while another source still keeps the project usable;
- `accessLost`: no current source can authorize project actions.

Health remains `unknown` with zero evidence until a real evaluator or index projection reports it. Empty or missing evidence is never presented as healthy.

## Capability Guidance

Every project response declares actual booleans for Cockpit, Studio, Conversations, and Workspace. Archived projects expose no active actions. Studio is available only for the configured supported profile. Workspace remains unavailable until its project-specific runner capability is proven. Access-lost projects remain visible but cannot start protected actions.

Detected platform labels come from bounded repository markers (`pubspec.yaml`, `package.json`, Astro dependency, Python manifests, or `Cargo.toml`). Detection informs the Hub; it does not install tools or declare a build successful.

## Failure And Recovery

- Invalid or out-of-workspace local paths fail without changing the registry.
- An archived GitHub repository cannot be selected.
- GitHub listing or selection while disabled/disconnected fails with a typed recoverable error.
- Expired, replayed, or cross-actor setup states, candidates, and cursors fail closed.
- Malformed upstream account or repository metadata never reaches Flutter.
- A duplicate local path is rejected; a matching local/GitHub identity is reconciled.
- Removing one source keeps the project when another source remains.
- A default project cannot be removed or archived until another default is chosen.
- Built-in local projects cannot be disconnected.

## Local Adapter And Deferred Hosted Flow

When the local Project Hub and GitHub are both enabled, the runner wires the real GitHub App adapter. Configuration requires App ID, private key, App slug, and setup-return URL; fix-only GitHub runners still require only App ID/private key. No GitHub call occurs at construction, and automated tests use mocked HTTP. Real credentials, installation, and browser proof were not exercised by this chantier.

Hosted Firebase identity, shared membership, clone/indexing, Firestore resume, and hosted auth proof remain deferred. Their future implementation must preserve this Hub contract and the separate auth/GitHub authority contract.

The later portfolio evolution may add multi-repository selection, continuous prioritization, monitoring, schedules, notifications, or autonomous actions only through a separate approved chantier. None is implied by the current pagination-ready contract.

## Validation

```powershell
cd runner
npm run typecheck
npm run lint
npx tsx --test test/projects/*.test.ts

cd ..\app
flutter analyze
flutter test test/shipglows/presentation/projects test/shipglows/data/managed_projects_api_test.dart
```

The hosted GitHub/Firebase user journey requires separate configured auth and browser proof. Local contract and widget tests cannot establish that hosted claim.
