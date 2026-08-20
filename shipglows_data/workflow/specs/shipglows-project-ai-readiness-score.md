---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "shipglows_app"
created: "2026-08-20"
updated: "2026-08-20"
status: active
source_skill: 101-sg-ready
scope: "managed-project-ai-readiness-score"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
user_story: "En tant qu’utilisatrice de ShipGlows, je veux comprendre en un coup d’œil si chaque projet est facile à comprendre et à modifier pour un agent IA, avec des preuves et des améliorations concrètes plutôt qu’une note opaque."
linked_systems:
  - "runner/src/ai-readiness/"
  - "runner/src/app.ts"
  - "app/lib/shipglows/data/cockpit/"
  - "app/lib/shipglows/presentation/widgets/cockpit/"
  - "shipglows_data/workflow/TASKS.md"
depends_on:
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.3.1"
    required_status: active
supersedes: []
evidence:
  - "The active runner already receives allowlisted, contained project roots from the Personal Cloud catalog and exposes a tenant-scoped Cockpit projection."
  - "The Flutter Cockpit already maps optional dimension scores but has no project-level AI-readiness contract or explainable recommendations."
  - "The operator selected the managed-project AI-readiness score as the next P1 product investment on 2026-08-20."
next_step: "Authorize deployment separately before claiming hosted availability."
---

# Spec: ShipGlows Project AI Readiness Score

🟢 [shipglows_app] spec: ShipGlows Project AI Readiness Score | status: locally_verified | path: shipglows_data/workflow/specs/shipglows-project-ai-readiness-score.md | next: authorize deployment separately before claiming hosted availability

# Title

ShipGlows Project AI Readiness Score

# Status

Locally verified implementation. The score is a deterministic, read-only local projection over an already allowlisted repository root; it is not an external crawl, an LLM judgment, or a claim that generated code will be correct. Runner, API, Flutter mapping, responsive rendering, security boundaries, and documentation passed the local proof contract. Hosted availability remains outside this scope.

# User Story

En tant qu’utilisatrice de ShipGlows, je veux comprendre en un coup d’œil si chaque projet est facile à comprendre et à modifier pour un agent IA, avec des preuves et des améliorations concrètes plutôt qu’une note opaque.

# Minimal Behavior Contract

When an authenticated user loads the Cockpit, every catalog-backed project receives an AI-readiness result computed from a bounded, non-executing inspection of its allowlisted repository. The UI shows a 0–100 score, the assessed checks, missing evidence, and the highest-value recommendations. If the project cannot be inspected safely or completely, the result is explicitly unavailable or partial and never defaults to a high score. The easiest missed edge case is a symlink or oversized repository causing traversal outside the project or unbounded work; the evaluator must not follow symlinks and must stop at fixed entry/depth budgets.

# Success Behavior

- A catalog-backed project exposes one versioned `aiReadiness` object with a score, coverage, status, checks, and recommendations.
- Checks cover project structure, schemas/contracts, agent guidance, `llms.txt`, sitemap/indexability for web projects, and fast feedback through lockfiles plus test/lint/check scripts.
- Every awarded point maps to one named observed artifact category; every missing category yields an actionable recommendation.
- Non-web projects mark sitemap as not applicable rather than losing points.
- The Flutter Cockpit renders the score and recommendations with existing theme tokens, semantics, and explicit partial/unavailable states.

# Error Behavior

- Missing or inaccessible roots return `unavailable` without a score and without exposing the path or raw filesystem error.
- Budget exhaustion returns `partial`, preserves only checks proved before the boundary, and recommends narrowing or improving repository indexability.
- Malformed manifests count as failed evidence and never execute scripts or project code.
- Unknown response fields or invalid score/check values fail closed in Flutter parsing.

# Problem

The Cockpit reports project health but cannot answer whether an agent can efficiently understand and work in a repository. Operators must infer readiness from scattered files, and missing guidance or machine-readable structure is not visible as a product signal.

# Solution

Add a server-owned `ProjectAiReadinessEvaluator` that inspects only allowlisted project roots through bounded metadata reads, then attach its explainable projection to the existing Cockpit response. Add a compact Flutter card section that shows the score, coverage, check outcomes, and up to three prioritized recommendations without creating a second visual system.

The version-1 weights are fixed and visible: structure 20, schemas/contracts 15, agent guidance 20, `llms.txt` 15, sitemap/indexability 10, and fast feedback 20. The public score is `round(earned / applicable maximum × 100)`; a non-web project excludes the sitemap check from both numerator and denominator. Coverage is the fraction of applicable checks actually completed before a scan boundary or error.

# Scope In

- Static, deterministic repository inspection with no subprocess, network call, package installation, or file mutation.
- Six explainable checks: structure, schemas/contracts, agent guidance, `llms.txt`, web sitemap/indexability, and fast feedback.
- Applicability-aware weighted score and coverage.
- Cockpit API schema, mapper/domain model, project-card UI, tests, technical documentation, and task reconciliation.

# Scope Out

- LLM-as-judge scoring, generated-code quality prediction, runtime benchmarks, Lighthouse, remote crawling, SEO ranking, dependency installation, or CI execution.
- Automatic repair, file generation, project mutation, hosted deployment, push, or public marketing claim.
- A configurable scoring marketplace or per-language framework matrix.

# Constraints

- Use the existing catalog containment boundary; never accept a client-supplied repository path.
- Inspect at most 5,000 directory entries to depth four and read only allowlisted metadata files with a per-file limit of 256 KiB.
- Never follow symlinks, execute manifests, interpolate paths into a shell, or return private paths/file content.
- Preserve missing/partial/unavailable truth and deterministic output ordering.
- Flutter visual changes consume the existing `AppTheme` authority and add no raw visual literals.

# Test Contract

- Surface: runner evaluator and authenticated Cockpit DTO plus Flutter Cockpit mapping/rendering.
- Automated proof: evaluator fixtures for complete, incomplete, non-web, malformed, symlink, missing-root, and budget-exhausted projects; API contract tests; Dart mapper and widget tests.
- Static proof: runner typecheck/lint, Flutter analyze/format, changed-file design drift, metadata and diff checks.
- Browser/hosted exception: no hosted proof is required for this local-only implementation because no deployment is authorized; do not claim production availability.

# Dependencies

- Existing Personal Cloud catalog reader remains the sole project-root authority.
- Existing authenticated Cockpit route remains the consumer boundary.
- Existing Flutter design-system authority remains the sole visual carrier.

# Invariants

- A score never grants execution, mutation, trust, merge, or deployment authority.
- Missing evidence never becomes passed evidence.
- Repository content is untrusted data and cannot choose paths, commands, weights, or response shape.
- Tenant/project authorization remains enforced before the result is returned.
- No repository path, file content, token, secret, or raw exception appears in the public DTO.

# Links & Consequences

- Upstream: Personal Cloud catalog containment and Cockpit authorization.
- Downstream: Cockpit project cards, future audit suggestions, and project-priority decisions.
- Product change: before, readiness was inferred manually; after, each inspectable project has an explainable bounded readiness projection.
- Preserved promise: health and AI readiness remain evidence-backed projections, not fabricated guarantees.

# Documentation Coherence

- Update the managed-runner technical map with evaluator ownership and proof limits.
- Mark the active task complete only after implementation and verification.
- No public site copy changes because hosted availability and customer outcomes are not yet proved.

# Edge Cases

- Empty repository, one-file repository, monorepo, non-web project, several manifests, missing `README`, malformed `package.json`, uppercase filenames, hidden directories, symlink loops, unreadable files, excessive entries, and stale catalog roots.
- ZOMBIES coverage: Z—empty/missing evidence; O—one minimal valid project; M—monorepo and many entries; B—depth/entry/file-size budgets and score bounds; I—catalog/evaluator/API/Flutter boundaries; E—filesystem/manifest/parser failures; S—six static checks with no execution.

# Implementation Tasks

1. Add the evaluator contract and bounded filesystem implementation under `runner/src/ai-readiness/`; this creates the explainable evidence needed by the user story, depends only on the catalog-owned root, and validates with `npm test -- --test-name-pattern="AI readiness"` plus no-follow fixture assertions.
2. Inject the evaluator into the Cockpit route, resolve roots only from the catalog snapshot, and extend the closed API schema; this connects the evidence to authorized projects, depends on Task 1, and validates with the focused Cockpit contract tests covering authorization, redaction, partial and unavailable responses.
3. Add immutable Flutter models and strict DTO parsing; this preserves the server-owned contract in the client, depends on Task 2, and validates with `flutter test test/shipglows/data/cockpit/cockpit_dto_mapper_test.dart`.
4. Render a compact explainable readiness section on server-backed Cockpit project cards using existing tokens and semantic labels; this delivers the visible outcome, depends on Task 3, and validates with focused Cockpit widget tests plus the deterministic Cockpit golden suite.
5. Reconcile technical documentation and the active task record, then run runner tests/typecheck/lint, Flutter tests/analyze/format, changed-file design drift, metadata lint, secret scan, and `git diff --check` before a bounded local commit.

# Acceptance Criteria

- [x] An inspectable representative project returns a deterministic score from 0 through 100 and six ordered checks.
- [x] A non-web project excludes sitemap from the denominator and labels it not applicable.
- [x] Missing guidance, schemas, `llms.txt`, or fast-feedback evidence produces explicit recommendations.
- [x] Missing roots, symlinks, oversized metadata, and entry-budget exhaustion fail closed without path/content disclosure.
- [x] Only catalog-backed authorized projects receive readiness data.
- [x] Flutter rejects malformed scores, duplicate/unknown check IDs, invalid coverage, and contradictory statuses.
- [x] The project card exposes score, coverage, state, and prioritized recommendations accessibly in light/dark themes.
- [x] Runner and Flutter focused/full proportional checks pass; documentation and tracker reflect the implemented truth.

# Test Strategy

Use temporary directory fixtures for isolated evaluator behavior, injected catalog/evaluator fakes for API serialization, strict mapper tests for adversarial DTOs, and widget tests for semantics and state rendering. Run broader runner and Flutter regressions after focused suites pass.

# Risks

- Arbitrary weights could look authoritative: keep weights versioned, checks visible, and the score explicitly advisory.
- Framework bias could punish non-web projects: detect web applicability conservatively and exclude inapplicable sitemap points.
- Repository scanning could leak or consume resources: fixed root authority, no symlink following, metadata-only reads, and entry/depth/file budgets.
- A score may become stale after repository changes: current slice computes on Cockpit load and returns `evaluatedAt`; caching is intentionally deferred.

# OWASP Security Gate

- Categories considered: A01 authorization, A05 path/file injection, A06 bounded design/abuse, A08 untrusted manifest integrity, A09 redacted diagnostics, A10 exceptional conditions.
- Trust boundaries: authenticated actor → Cockpit route → catalog-owned root → untrusted repository metadata → closed public DTO.
- ASVS: no broad compliance claim; focused authorization, input/path containment, error handling, and data minimization proof only.
- Residual gap: hosted filesystem permissions and live deployment behavior remain owned by a separately authorized production proof.

# Execution Notes

- First reads: `runner/src/health/index.ts`, `runner/src/app.ts`, `runner/src/cloud-projects/index.ts`, `app/lib/shipglows/data/cockpit/cockpit_models.dart`, and `app/lib/shipglows/presentation/widgets/cockpit/cockpit_project_card.dart`.
- Keep scoring logic pure after evidence collection so weights and status derivation are unit-testable.
- Prefer exact known metadata filenames and directory names; do not read arbitrary source content.
- Use a version field in the readiness projection so future scoring evolution is explicit.
- Keep recommendations server-owned and closed; Flutter renders them as inert text.
- Stop if catalog containment is bypassed, a symlink is followed, a private path/content appears in a DTO, missing evidence receives points, or the UI invents a status not present in the server projection.

# Open Questions

None. The operator authorized autonomous implementation of the P1 scope; remote deployment and push remain outside authority.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-20 07:35:24 UTC | sg-development | GPT-5 | Converted the selected P1 into an autonomous bounded product contract. | reviewed | Perform readiness review, then implement if safe. |
| 2026-08-20 07:38:00 UTC | 101-sg-ready | GPT-5 | Reviewed user-story fit, scoring determinism, catalog containment, bounded failure behavior, UI authority, proof, OWASP and ZOMBIES coverage. | ready | Implement the bounded evaluator and Cockpit projection. |
| 2026-08-20 | sg-development | GPT-5 | Implemented the bounded evaluator, authenticated Cockpit projection, strict Flutter mapping, and token-owned responsive summary. | complete | Run the proportional local verification contract. |
| 2026-08-20 | 103-sg-verify | GPT-5 | Verified 386 runner tests, 171 Flutter tests, static analysis, lint, audit, metadata, design drift, responsive goldens, and redaction boundaries. | locally_verified | Reconcile closure records and create the authorized local commit. |
| 2026-08-20 | 104-sg-end | GPT-5 | Aligned the task, spec, technical map, product context, and local-only delivery boundary. | closed_local_scope | Keep hosted deployment and proof separate. |

# Current Chantier Flow

| Stage | Status | Evidence | Next step |
| --- | --- | --- | --- |
| Spec | complete | Explainable weights, bounded inspection, fail-closed states, UI authority and proof path defined | Preserve as contract authority |
| Readiness | complete | Product, security, ZOMBIES, dependency and validation decisions resolved | None |
| Implementation | complete | Runner evaluator, authenticated projection, strict mapper and responsive Flutter summary integrated | None |
| Verification | locally_verified | Full runner and Flutter suites plus static, security, metadata, visual and drift checks passed | Preserve hosted boundary |
| Closure | closed_local_scope | Spec, tracker, technical map and product context reconciled | Create the authorized local commit |
| Delivery | local_commit_authorized | Push and deployment remain explicitly unauthorized | Seek separate authority only if hosted availability is wanted |
