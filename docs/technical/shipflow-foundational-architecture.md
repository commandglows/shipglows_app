---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipflow_app"
created: "2026-05-09"
updated: "2026-05-10"
status: draft
source_skill: sf-docs
scope: "foundational-architecture"
owner: "Diane"
confidence: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "GitHub repositories"
  - "managed cloud clone"
  - "Firebase Auth"
  - "Cloud Firestore"
  - "Cloud Functions"
  - "ShipFlow generated Markdown files"
depends_on:
  - "docs/technical/recovered-branch-reality.md@0.1.0"
  - "specs/firebase-firestore-projection-migration.md@0.3.0"
  - "specs/shipflow-project-source-onboarding.md@0.3.0"
supersedes: []
evidence:
  - "User architecture answers on 2026-05-09."
next_review: "2026-06-09"
next_step: "/sf-ready ShipFlow Foundational Coherence Review"
---

# ShipFlow Foundational Architecture

## Purpose

This document records the architecture decisions that must guide project onboarding, Firebase/Firestore design, indexing, and future write-back.

## Owned Files

- `docs/technical/shipflow-foundational-architecture.md`
- `docs/technical/foundational-specs-handoff.md`
- `specs/firebase-firestore-projection-migration.md`
- `specs/shipflow-project-source-onboarding.md`
- `specs/shipflow-github-managed-clone-indexer.md`
- `specs/shipflow-firestore-data-model.md`
- `specs/shipflow-auth-github-access.md`
- `specs/shipflow-project-onboarding-flow.md`
- `specs/shipflow-markdown-artifact-governance.md`
- `specs/shipflow-dashboard-readonly-projection.md`

## Entrypoints

- GitHub repository connection
- Managed clone/indexing infrastructure
- Firestore projection/index
- ShipFlow dashboard

## Decisions

| Topic | Decision | Consequence |
| --- | --- | --- |
| User/projects | One user can have multiple projects. | Firestore model must support one user linked to many repos. |
| Project identity | One project is exactly one GitHub repository, represented in Firestore by an opaque `projectId` plus GitHub repository metadata. | GitHub repository identity is authoritative for repo access and deduplication, but `owner/repo` remains mutable metadata, not a Firestore document ID. |
| Clone | A clone is mandatory. | ShipFlow must create/manage a working copy before reliable indexing. |
| Clone visibility | The user does not choose or manage clone paths. | Clone paths are internal infrastructure details exposed only as status/diagnostics. |
| Clone location | Clone is managed by ShipFlow infrastructure, likely cloud-side. | Browser/client cannot be the filesystem authority. A server-side runner/function/job layer is needed. |
| V1 writes | V1 is read-only. | No Markdown writes, commits, or pushes in the first implementation slice. |
| GitHub access | Firebase Auth identity and GitHub repository access are separate. | Login and GitHub permissions must not be conflated. |
| Sharing | GitHub access is the primary permission source for repo readability. | ShipFlow can start by checking GitHub access; workspace/team semantics can come later. |
| Markdown scope | ShipFlow indexes the project-local `shipflow_data/` governance corpus first, with root-level legacy docs only as fallback evidence during migration. | Initial scope includes technical/editorial/business/workflow artifacts, trackers, specs, and related generated files under the approved governance corpus, not arbitrary repository Markdown. |
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
- Parsed entities from ShipFlow files.
- Search/index data.
- Diagnostics.
- Sync/projection status.
- Future membership/workspace metadata.

Canonical source:

- GitHub repository.
- ShipFlow-generated Markdown files in that repository.
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
- Trusted backend indexes allowed ShipFlow Markdown files.
- Trusted backend writes Firestore projection.
- Client reads Firestore projection and diagnostics.

Agent/terminal execution is not urgent for this phase and should remain out of scope.

## Initial Indexed Markdown Scope

The first indexing scope should cover ShipFlow-owned/generated artifacts, not arbitrary markdown. The preferred root is `shipflow_data/`; root-level files remain compatibility fallback during migration and cannot override `shipflow_data/`:

- `shipflow_data/workflow/TASKS.md`, `shipflow_data/workflow/AUDIT_LOG.md`, `shipflow_data/workflow/CHANGELOG.md`, `shipflow_data/workflow/PROJECTS.md` when present
- `shipflow_data/technical/*.md`
- `shipflow_data/editorial/*.md`
- `shipflow_data/business/*.md`
- `shipflow_data/workflow/specs/*.md`
- root compatibility docs such as `TASKS.md`, `CONTENT_MAP.md`, `CLAUDE.md`, `AGENT.md`, `README.md`, `specs/*.md`, and `docs/**/*.md` only when `shipflow_data/` is missing or explicitly migrating
- other ShipFlow artifact docs with recognized frontmatter

This list should be refined from `sf-docs` governance corpus rules before implementation, but the invariant is already fixed: `shipflow_data/` wins over root fallback docs.

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
rg -n "project.*GitHub|managed clone|Firestore|source of truth|GitHub wins" docs/technical specs
```

## Reader Checklist

- Does the design avoid exposing clone paths as user-managed settings?
- Does the design keep V1 read-only?
- Does any Firestore write try to become canonical Markdown content?
- Is private GitHub access handled server-side?
- Is conflict resolution GitHub-first?

## Maintenance Rule

Any spec that touches project onboarding, indexing, Firestore, GitHub auth, clone management, or write-back must cite this document.
