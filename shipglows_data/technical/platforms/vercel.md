---
artifact: technical_module_context
metadata_schema_version: "1.0"
artifact_version: "0.1.0"
project: "shipglows_app"
created: "2026-08-16"
updated: "2026-08-16"
status: draft
source_skill: sg-docs
scope: "platform-usage-vercel-sandbox"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/studio/providers/vercelSandboxProvider.ts"
  - "runner/src/studio/providers/evidenceVerifier.ts"
  - "runner/test/studio/vercelSandboxProvider.test.ts"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/technical/managed-runner-foundation.md"
  - "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md"
depends_on:
  - artifact: "shipglows_data/technical/external-platforms/vercel.md"
    artifact_version: "0.1.0"
    required_status: draft
supersedes: []
evidence:
  - "Account-free Vercel adapter conformance passed locally on 2026-08-16 as part of 48/48 focused managed-sandbox tests and 73/73 full Studio tests, with clean typecheck, lint, diff check, and high-severity offline dependency audit."
  - "Official Vercel Sandbox product, lifecycle, persistence, snapshot, firewall, credential-brokering, and platform-limit sources were checked on 2026-08-16."
  - "No Vercel SDK/package, account, project, credential, network call, sandbox allocation, billable action, or hosted proof was used."
next_review: "2026-08-23"
next_step: "Obtain separate approval for bounded real-account admission/probe/release proof before adding the SDK or representing Vercel Sandbox as available."
---

# Vercel Sandbox Project Usage

## Purpose

This note records the project-specific Vercel Sandbox boundary selected for the Studio compiler. It is intentionally narrower than Vercel's documentation: it describes the locally implemented adapter contract and the evidence still required before any account, execution, preview, or availability claim.

## Usage Summary

- Provider role: first managed-sandbox adapter behind the ShipGlows-owned `StudioWorkerProvider` boundary.
- Project/provider identifier: none observed or stored; no Vercel account or project is configured in this repository.
- Applies to paths: `runner/src/studio/providers/**`, `runner/src/studio/workerProvider.ts`, and matching Studio tests.
- Environments used: deterministic local fakes only.
- Validation surface: account-free contract and adapter conformance.
- Owner: Diane.
- Last verified: 2026-08-16.

## Current Implementation State

`VercelSandboxProvider` is implemented against an injected, narrow client facade. The repository deliberately adds neither `@vercel/sandbox` nor another Vercel SDK/package yet. Constructing the adapter without independently verified evidence remains `unproved` and performs zero client calls.

The local adapter can validate, reserve, simulate, inspect, attest, release, and reconcile only through injected test doubles. It does not execute commands, upload or download source, open ports, expose a provider URL, create snapshots, persist customer state, export artifacts, or wire compilation into the runner composition root.

## Local Configuration

| Item | Current rule | Secret? | Status |
| --- | --- | --- | --- |
| Vercel account/project | No identifier is configured or documented | no | unproved |
| SDK/package | No Vercel dependency or import exists | no | not implemented |
| Adapter transport | Injected narrow client facade | no | implemented and locally tested |
| Account/project/configuration identity | Digest fields are contract inputs only | no | not observed against Vercel |
| Runtime image | Pinned OCI repository plus exact SHA-256 digest required | no | policy implemented; image not proved |
| Persistence | `persistent: false`; snapshots not implemented | no | locally asserted only |
| Ingress | No ports or provider domains | no | locally asserted only |
| Generation egress | Starts deny-all, then permits one exact HTTPS root broker through request forwarding | broker details may be sensitive | locally asserted only |
| Verification egress | Deny-all, no model capability | no | locally asserted only |
| Credentials | Raw credentials are forbidden in the guest and contract; provider brokering is future proof work | yes | not configured or proved |
| Spend and quotas | Immutable USD reservation, duration, CPU, memory, disk, process, output, concurrency, API-call/window, transfer, and model-token ceilings | no | contract implemented; real limits/cost unproved |

Do not add secret values, Vercel tokens, private URLs, raw provider logs, or customer data to this document.

## Adapter Invariants

- Domain admission depends on ShipGlows-owned capabilities and immutable evidence bindings, not a provider brand or self-reported attestation.
- An injected independent verifier must bind provider, adapter, account/project/configuration digests, policy, image, scenario, resource identity, budget, observation time, expiry, tested scenarios, invalidation conditions, and control states exactly.
- Generation and verification use separate phase contracts. Generation reserves seven complete lifecycle calls; verification reserves five. Reservation occurs atomically before allocation so cleanup capacity cannot be consumed by another request.
- Active, pending, and quarantined resources share one concurrency ceiling. Same-key concurrent preflights coalesce; a mismatched request under the same key fails closed.
- The provider-wide sliding API window includes reconciliation. Cleanup uncertainty quarantines the resource and denies identifier reuse.
- Create starts non-persistent, with zero ports and deny-all networking. Verification never changes that policy; generation may change it only to the exact broker rule after the initial probe.
- No fallback may run generated code, dependencies, build hooks, or runtime output on the primary runner host.

## Availability Boundary

Current state is `implemented and independently verified locally` for account-free admission/probe/release conformance only. It is not evidence of a usable Vercel account, managed-microVM containment, private ingress, effective network or credential controls, provider quotas, pricing, persistence/retention, cleanup under provider failure, reliability, compliance, or production availability.

A separate approved real-provider batch must pin the actual SDK/version, account/project scope, region if applicable, authentication mechanism, budget ceiling, quotas, toolchain image, retention, ingress, network, credential, reconciliation, and observability facts. It may run only inert bounded probes until a later implementation plan separately authorizes project source, generated execution, preview, persistence, or artifact export.

## Official Sources

Checked on 2026-08-16:

- [Vercel Sandbox product and capability overview](https://vercel.com/sandbox)
- [Vercel Sandboxes general availability](https://vercel.com/changelog/vercel-sandboxes-ga)
- [Sandbox duration and persistence](https://vercel.com/kb/guide/vercel-sandbox-duration-and-persistence)
- [Filesystem snapshots](https://vercel.com/changelog/filesystem-snapshots-supported-on-vercel-sandboxes)
- [Credential injection outside the guest](https://vercel.com/changelog/safely-inject-credentials-in-http-headers-with-vercel-sandbox)
- [Firewall request proxying and filtering](https://vercel.com/changelog/vercel-sandbox-firewall-now-supports-request-proxying-and-filtering)
- [Bounded file retrieval APIs](https://vercel.com/changelog/simplified-file-retrieval-from-vercel-sandbox-environments)
- [Published platform limits](https://vercel.com/docs/limits)

These sources are capability inputs for adapter design. They are not ShipGlows account, configuration, containment, cost, private-ingress, availability, compliance, or reliability proof.

## Validation

```bash
cd runner
npx tsx --test test/studio/vercelSandboxProvider.test.ts test/studio/managedSandboxAttestation.test.ts test/studio/workerProvider.test.ts
npx tsx --test test/studio/*.test.ts
npm run typecheck
npm run lint
npm audit --audit-level=high --offline
```

Real-provider validation is intentionally absent and requires a new approved plan, credentials, an explicit spend ceiling, and redacted account/project evidence.

## Reader Checklist

- Treat every account, SDK, quota, persistence, ingress, network, credential, cleanup, or price assumption as unproved until Batch C evidence exists.
- Recheck official Vercel sources before adding an SDK, changing adapter semantics, or approving a real-provider probe.
- Keep provider wire types, resource identifiers, credentials, domains, raw events, and guest paths out of Flutter and public contracts.
- Do not enable compile, preview, persistence, export, or availability from local fake-provider success.

## Maintenance Rule

Update this document whenever Vercel SDK/versioning, account/project configuration, adapter methods, evidence verification, quotas/cost, lifecycle reservation, networking, credential brokering, persistence/snapshots, ingress, cleanup/reconciliation, or real-provider proof status changes.
