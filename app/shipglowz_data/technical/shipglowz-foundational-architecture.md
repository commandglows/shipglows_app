---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-09"
updated: "2026-05-10"
status: draft
source_skill: sf-docs
scope: "foundational-architecture"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "GitHub repositories"
  - "managed cloud clone"
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions"
  - "ShipGlowz generated Markdown files"
depends_on:
  - "shipglowz_data/technical/recovered-branch-reality.md@0.1.0"
  - "shipglowz_data/workflow/specs/firebase-firestore-projection-migration.md@0.3.0"
  - "shipglowz_data/workflow/specs/shipglowz-project-source-onboarding.md@0.3.0"
supersedes: []
evidence:
  - "User architecture answers on 2026-05-09."
next_review: "2026-06-09"
next_step: "/sf-ready shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md"
---

# ShipGlowz Foundational Architecture

## Purpose

This document records the architecture decisions that must guide project onboarding, Firebase/Firestore design, indexing, and future write-back.

## Owned Files

- `shipglowz_data/technical/shipglowz-foundational-architecture.md`
- `shipglowz_data/technical/foundational-specs-handoff.md`
- `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md`
- `shipglowz_data/workflow/specs/firebase-firestore-projection-migration.md`
- `shipglowz_data/workflow/specs/shipglowz-project-source-onboarding.md`
- `shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md`
- `shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md`
- `shipglowz_data/technical/firestore-data-model.md`
- `shipglowz_data/technical/dashboard-readonly-projection.md`
- `shipglowz_data/workflow/specs/shipglowz-auth-github-access.md`
- `shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md`
- `shipglowz_data/workflow/specs/shipglowz-markdown-artifact-governance.md`
- `shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md`

## Entrypoints

- GitHub repository connection
- Managed clone/indexing infrastructure
- Firestore projection/index
- ShipGlowz dashboard

## Decisions

| Topic | Decision | Consequence |
| --- | --- | --- |
| User/projects | One user can have multiple projects. | Firestore model must support one user linked to many repos. |
| Project identity | One project is exactly one GitHub repository, represented in Firestore by an opaque `projectId` plus GitHub repository metadata. | GitHub repository identity is authoritative for repo access and deduplication, but `owner/repo` remains mutable metadata, not a Firestore document ID. |
| Clone | A clone is mandatory. | ShipGlowz must create/manage a working copy before reliable indexing. |
| Clone visibility | The user does not choose or manage clone paths. | Clone paths are internal infrastructure details exposed only as status/diagnostics. |
| Clone location | Clone is managed by ShipGlowz infrastructure, likely cloud-side. | Browser/client cannot be the filesystem authority. A server-side runner/function/job layer is needed. |
| V1 writes | V1 is read-only. | No Markdown writes, commits, or pushes in the first implementation slice. |
| GitHub access | Firebase Auth identity and GitHub repository access are separate. | Login and GitHub permissions must not be conflated. |
| Sharing | GitHub access is the primary permission source for repo readability. | ShipGlowz can start by checking GitHub access; workspace/team semantics can come later. |
| Markdown scope | ShipGlowz indexes the project-local `shipglowz_data/` governance corpus first, with root-level legacy shipglowz_data only as fallback evidence during migration. | Initial scope includes technical/editorial/business/workflow artifacts, trackers, specs, and related generated files under the approved governance corpus, not arbitrary repository Markdown. |
| Dashboard projection | Dashboard reads Firestore projection in read-only mode. | UI can show projects, artifacts, freshness, access warnings, diagnostics, and index status, but cannot make Firestore canonical or write repository content. |
| Conflict authority | GitHub wins. | Firestore projection becomes stale and rebuilds when repo/clone changes. |

## Firestore Role

Firestore can contain everything needed for the application experience, but it is not the canonical source for repository content.

Allowed Firestore data:

- User profile and settings.
- GitHub project registry.
- GitHub access/status metadata.
- Managed clone status.
- Indexed Markdown content.
- Parsed entities from ShipGlowz files.
- Search/index data.
- Diagnostics.
- Sync/projection status.
- Future membership/workspace metadata.

Canonical source:

- GitHub repository.
- ShipGlowz-generated Markdown files in that repository.
- Managed clone as the working copy used for indexing.

Rule: Firestore stores a projection of the repo, not the authority that overrides it. If Firestore disagrees with GitHub/clone, GitHub/clone wins and Firestore is marked stale.

## Cloud Functions And Runner Decision

Cloud Functions or an equivalent trusted server-side runner is urgent for architecture, but not necessarily for immediate product UI.

It is urgent because these operations cannot safely live in Flutter/client code:

- GitHub OAuth token exchange.
- Listing private repos.
- Validating repository access.
- Creating/updating managed clones.
- Running indexing jobs.
- Updating Firestore projection from clone contents.
- Holding GitHub tokens or future provider secrets.

V1 should define the boundary even if some operations are stubs:

- Client asks for project onboarding.
- Trusted backend verifies GitHub access.
- Trusted backend creates or checks managed clone.
- Trusted backend indexes allowed ShipGlowz Markdown files.
- Trusted backend writes Firestore projection.
- Client reads Firestore projection and diagnostics.

Agent/terminal execution is not urgent for this phase and should remain out of scope.

## Initial Indexed Markdown Scope

The first indexing scope should cover ShipGlowz-owned/generated artifacts, not arbitrary markdown. The preferred root is `shipglowz_data/`; root-level files remain compatibility fallback during migration and cannot override `shipglowz_data/`:

- `shipglowz_data/workflow/TASKS.md` and `shipglowz_data/workflow/AUDIT_LOG.md` when present
- `CHANGELOG.md` when maintained as the root project changelog
- `shipglowz_data/technical/*.md`
- `shipglowz_data/editorial/*.md`
- `shipglowz_data/business/*.md`
- `shipglowz_data/workflow/specs/*.md`
- root compatibility docs such as `CLAUDE.md`, `AGENT.md`, `AGENTS.md`, `README.md`, and `CHANGELOG.md`
- other ShipGlowz artifact docs with recognized frontmatter

This list should be refined from `sf-docs` governance corpus rules before implementation, but the invariant is already fixed: `shipglowz_data/` wins over root fallback docs.

## Invariants

- Project equals one GitHub repository, with an opaque app `projectId` and GitHub metadata used for authority/deduplication.
- Clone is mandatory but user-hidden.
- V1 is read-only.
- Firestore projection can be rich, but GitHub/Markdown remains authoritative.
- GitHub wins every conflict.
- Firebase Auth and GitHub access are separate concerns.
- Cloud/server-side boundary is required for private GitHub access and indexing.

## Validation

```bash
rg -n "project.*GitHub|managed clone|Firestore|source of truth|GitHub wins" shipglowz_data/technical shipglowz_data/workflow/specs
```

## Reader Checklist

- Has `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md` passed `/sf-ready` before foundational implementation starts?
- Does the design avoid exposing clone paths as user-managed settings?
- Does the design keep V1 read-only?
- Does any Firestore write try to become canonical Markdown content?
- Is private GitHub access handled server-side?
- Is conflict resolution GitHub-first?

## Maintenance Rule

Any spec that touches project onboarding, indexing, Firestore, GitHub auth, clone management, or write-back must cite this document and pass through `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md` before implementation.
