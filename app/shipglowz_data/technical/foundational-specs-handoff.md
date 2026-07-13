---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglowz_app"
created: "2026-05-10"
updated: "2026-05-10"
status: draft
source_skill: sf-spec
scope: "foundational-specs-handoff"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - "Firebase Auth"
  - "GitHub App"
  - "Cloud Firestore"
  - "Cloud Functions"
  - "managed clone runner"
  - "shipglowz_data/"
  - "ShipGlowz dashboard"
depends_on:
  - "shipglowz_data/technical/shipglowz-foundational-architecture.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-auth-github-access.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-markdown-artifact-governance.md@0.1.0"
  - "shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md@0.1.0"
supersedes: []
evidence:
  - "Foundational architecture/spec conversation through 2026-05-10."
next_review: "2026-05-11"
next_step: "/sf-ready shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md"
---

# Foundational Specs Handoff

## Purpose

This handoff lets a fresh context resume with the correct architecture reality before running the canonical foundational coherence review in `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md`.

## Current Decision Set

- A ShipGlowz project is exactly one GitHub repository.
- One user can access many projects; one project can be shared by many users.
- GitHub App is the target repository authorization model.
- Firebase Auth is ShipGlowz identity and is separate from GitHub access.
- GitHub wins for repository access and repository content.
- A managed clone is mandatory for indexing, but V1 can materialize it ephemerally inside a trusted backend.
- V1 is read-only: no Markdown writes, commits, pushes, PRs, terminal, or agent execution.
- Firestore stores app state and projection, not canonical repository content.
- `shipglowz_data/` is the canonical project-local governance corpus.
- Dashboard default entry is multi-project, widget-based, filterable, and sortable.
- Old projection can remain visible/searchable after GitHub access loss, with warning and disabled refresh/index.

## Foundational Specs

| Spec | Role | Status for next context |
| --- | --- | --- |
| `shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md` | Canonical cross-spec coherence gate for auth, onboarding, indexer, Markdown governance, Firestore projection, dashboard, security, and shipglowz_data alignment | Run `/sf-ready` on this spec before implementation |
| `shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md` | Firestore documents, shared projects, memberships, projections, diagnostics, feed refs | Review for naming/status consistency |
| `shipglowz_data/workflow/specs/shipglowz-auth-github-access.md` | Firebase Auth vs GitHub App, backend-only tokens, access loss | Review for security-rule implications |
| `shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md` | Trusted runner, managed clone, index runs, Firestore projection writes | Review against `shipglowz_data/` governance policy |
| `shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md` | Sign-in, GitHub connection, repo selection, create-or-join, setup status | Review state names with dashboard and auth |
| `shipglowz_data/workflow/specs/shipglowz-markdown-artifact-governance.md` | `shipglowz_data/`, artifact families, tracker parsing, ignore/redaction rules | Review projection fields with Firestore model |
| `shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md` | Multi-project read-only dashboard, widgets, filters, status/warnings | Review query boundaries and UX states |

## Coherence Review Checklist

- Do all specs use the same project identity model: opaque `projectId` plus GitHub repo metadata?
- Do all repo-sensitive actions revalidate GitHub access server-side?
- Do all UI reads avoid global Firestore scans?
- Do status names align across onboarding, auth, indexer, Firestore, and dashboard?
- Does `shipglowz_data/` override root-level fallback shipglowz_data everywhere?
- Are stale, deleted, parse-failed, access-lost, hidden, and archived states consistent?
- Are all client-visible diagnostics redacted?
- Is any spec accidentally asking for implementation before the coherence review?
- Are future write-back, agents, terminal, billing, and advanced teams clearly out of scope?

## Recommended Next Step

Run the canonical foundational coherence review before any implementation:

```bash
/sf-ready shipglowz_data/workflow/specs/shipglowz-foundational-coherence-review.md
```

The review should either promote the foundational set toward ready status or create targeted correction specs if contradictions remain.
