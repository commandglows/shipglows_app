---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: "shipglows_app"
created: "2026-08-21"
created_at: "2026-08-21 22:32:00 UTC"
updated: "2026-08-21"
updated_at: "2026-08-21 22:37:03 UTC"
status: active
source_skill: "102-sg-start"
source_model: "GPT-5 Codex"
scope: "shipglows-auth-recovery-diagnostics"
owner: "Diane"
confidence: high
user_story: "As the ShipGlows operator, I want redacted copyable authentication diagnostics so incidents can be diagnosed without developer tools or credential exposure."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "Flutter authentication gate"
  - "Firebase Auth"
  - "Managed runner"
  - "Vercel Flutter Web"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-personal-cloud-rollout.md"
    artifact_version: "1.0.1"
    required_status: ready
supersedes: []
evidence:
  - "Production incident 2026-08-21: a public runner 502 appeared as a generic authentication failure and the client-only diagnostic ID could not be copied or correlated from the UI."
next_step: "Run the Vercel Flutter build and hosted authentication recovery proof."
---

# ShipGlows Auth Recovery Diagnostics

## User Story

As the ShipGlows operator, when authentication reaches a runner or provider failure, I need a clear and copyable redacted diagnostic so I can distinguish service availability, session rejection, and browser failures without opening developer tools or exposing credentials.

## Minimal Behavior Contract

The authentication recovery surface shows the safe failure stage, stable error code, optional HTTP status, diagnostic ID, UTC occurrence time, and application build identity. One accessible action copies exactly those allowlisted fields and confirms success. Raw exception messages, response bodies, tokens, cookies, OAuth data, user data, and private configuration never enter the visible or copied diagnostic.

## Success Behavior

- The existing plain-language recovery message remains primary.
- A selectable diagnostic summary names the safe stage and available status.
- `Copier le diagnostic` copies the same allowlisted summary and announces success.
- Existing sign-in, retry, sign-out, loading, and access-denied behavior remains unchanged.

## Error Behavior

- Clipboard failure does not replace or hide the original recovery state.
- Missing HTTP status is omitted rather than guessed.
- Unknown internal stages use a safe generic label.
- Repeated failures replace the prior diagnostic with the current occurrence.

## Scope

- In: Flutter authentication gate, widget tests, this contract, directly mapped operational documentation if behavior changes.
- Out: runner error payload changes, server logging correlation, Firebase policy, credentials, provider configuration, and unrelated runner work already present in the worktree.

## Ordered Tasks

1. Add regression coverage for a runner `502`, copied fields, confirmation, and secret exclusion.
2. Introduce one immutable allowlisted diagnostic value at the auth boundary.
3. Render and copy it with existing Material controls and ShipGlows tokens.
4. Run focused tests, Flutter analysis, design drift, and diff/secret review.
5. Commit and push only the owned files, then verify the matching Vercel deployment when available.

## Acceptance Criteria

- A runner `502` visibly includes `Connexion à l’API`, `requestFailed`, `HTTP 502`, and an opaque `auth_` identifier.
- Copying produces the visible redacted fields, UTC time, and build identity.
- Copied text excludes the session token, exception message, response body, cookies, and authorization headers.
- The copy action has a clear accessible label and success confirmation.
- Existing authentication widget tests remain green.

## Proof Contract

- Proof path: regression-first plus hosted auth proof after delivery.
- Automated: focused widget tests, Flutter analysis, design-system drift scan, secret/diff review.
- Hosted follow-through: `proof_type=auth/browser`, `scenario=runner failure diagnostic copy`, `target_or_environment=https://app.shipglows.com`.
- Rendered acceptance remains operator-confirmed if automated browser auth cannot safely create the failure state.

## ZOMBIES Coverage

- Z: no diagnostic renders in signed-out/loading/success states.
- O: one runner failure creates one current diagnostic.
- M: repeated failures replace stale diagnostics; no diagnostic history or secret accumulation.
- B: HTTP status is optional and bounded to the transport integer supplied by the client adapter.
- I: runner/provider errors cross into an explicit client allowlist rather than raw payload rendering.
- E: denied, unauthorized, timeout, unexpected, and clipboard-failure paths remain recoverable.
- S: one summary and one copy action; no new observability backend.

## OWASP Security Gate

- Categories: A02, A07, A09, A10.
- Trust boundary: provider/runner error to browser-visible and clipboard-visible text.
- Rule: only locally constructed allowlisted fields cross the boundary; privileged material and raw payloads remain excluded.
- Proof: behavior-focused widget assertions explicitly reject a token and raw server message.
- Residual gap: server-side correlation of the client-generated ID remains out of scope and must not be implied.

## Documentation And Editorial Impact

- Technical documentation: record the safe diagnostic contract if implementation changes the documented auth recovery behavior.
- Editorial: no public promise or marketing surface changes.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|---|---|---|---|---|---|
| 2026-08-21 22:37:03 UTC | implementation | GPT-5 Codex | Added the allowlisted visible/copyable diagnostic, clipboard recovery, malformed-code normalization, and focused widget regressions. | implemented; metadata, diff, and changed-file design drift checks pass; Flutter SDK is unavailable locally | Commit the owned files, then use the Vercel build as compilation proof. |
| 2026-08-21 22:32:00 UTC | specification and readiness | GPT-5 Codex | Defined and reviewed the allowlisted authentication recovery diagnostic contract. | ready; behavior, security boundary, proof, and delivery scope are decision-complete | Implement regression-first. |

## Current Chantier Flow

Specification (ready) -> implementation (implemented) -> verification (partial: hosted build pending) -> delivery (pending) -> hosted proof (pending)
