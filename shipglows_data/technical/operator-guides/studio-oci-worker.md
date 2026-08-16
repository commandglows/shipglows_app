---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.1.1"
project: "shipglows_app"
created: "2026-08-16"
updated: "2026-08-16"
status: draft
source_skill: "sg-docs"
scope: "studio-oci-worker-operations"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/config.ts"
  - "runner/src/main.ts"
  - "runner/src/studio/capability.ts"
  - "runner/src/studio/session.ts"
  - "runner/src/studio/workerProvider.ts"
  - "runner/test/studio/"
  - "site/src/studio/"
  - "app/lib/shipglows/providers/studio_provider.dart"
depends_on:
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "3.1.1"
    required_status: draft
  - artifact: "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md"
    artifact_version: "1.3.1"
    required_status: active
supersedes:
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md@0.1.0"
evidence:
  - "Final Studio proof on 2026-08-16: site 13/13 with check/build/exclusion, runner 35/35 with typecheck/lint, and Flutter 24 Studio plus five theme tests (29/29 combined) with clean analysis/format."
  - "Five focused defect closures cover exact handshake validation, loop/revision ordering, atomic idempotency, distinct 256 KiB total-message and 16 KiB command limits, and late cleanup/release after provider timeout."
  - "No dedicated Linux OCI worker, immutable worker image, mTLS identity, hosted route, generated compile, patch, reload, or visual evidence has been provisioned or proved."
next_review: "2026-08-23"
next_step: "Provision and independently verify the dedicated Linux containerd/gVisor worker before injecting any compile provider."
---

# Studio And OCI Worker Operations

## Current operating state

Studio is a local trusted-base implementation, disabled by default and forbidden by configuration in production. The Astro preview, bridge, Flutter session surface, semantic journal, undo/redo, Laboratory policy, variants, repository/runtime attestation, and worker admission contracts have focused local tests.

Compilation is not operational. The runner composition root injects no `StudioWorkerProvider`; compile requests therefore fail closed with bounded `studioCompileUnavailable`/HTTP `503`. This state must be preserved until a dedicated Linux worker independently proves every required isolation capability. Windows, Docker Desktop, an ordinary container, or a successful TypeScript fake does not prove gVisor `runsc`/Systrap.

## Trusted-base enablement gate

Local Studio configuration is accepted only when all of these server-owned values are present and exact:

```text
RUNNER_STUDIO_ENABLED=true
RUNNER_STUDIO_PROJECT_ID=shipglows_app
RUNNER_STUDIO_ORIGIN=http://127.0.0.1:3003
RUNNER_STUDIO_SOURCE_REVISION=<exact full hex Git HEAD>
RUNNER_STUDIO_REPOSITORY_DIGEST=<64 hex SHA-256 of "git-tree:<HEAD tree object>\n">
RUNNER_STUDIO_ADAPTER_VERSION=<bounded version>
RUNNER_STUDIO_CAPABILITY_VERSION=<bounded version>
```

Do not copy these values from the browser or target site. The runner resolves Git HEAD, requires the complete repository to be clean, derives the tree digest itself, and checks the configured values. The runtime must answer on the exact credential-free HTTP loopback origin and expose the exact public `shipglows.astro.hero.v1` profile, bridge v1 contract, and eight reviewed anchors. Any mismatch returns unavailable.

Do not enable Studio while the working tree contains implementation or documentation changes. Do not weaken the clean-tree check, change the origin to a LAN/public address, add credentials to the URL, or accept a site-provided revision/digest to make local admission pass.

## Session behavior

- Sessions are ephemeral and actor/tenant/project scoped.
- Idle expiry is 30 minutes and absolute expiry is four hours.
- One variant journal holds at most 128 compacted commands; one session holds at most eight variants.
- Mutation routes require authenticated project mutation access, trusted browser Origin when present, and bounded idempotency. Session creation serializes the idempotency decision so concurrent duplicate keys replay one atomic result.
- A semantic command is limited to 16 KiB; the complete bridge message is separately limited to 256 KiB. Reject either overflow without partial application.
- Events and projections are summaries only. They must not contain screenshots, raw project content, prompts, provider output, credentials, host paths, commands, or runtime handles.
- A runner restart does not restore Studio sessions. Show interruption/expiry and start a freshly attested session.

Flutter and runner now share the closed compile-intent boundary: Flutter sends only `{ "variantId": "..." }` with a stable `Idempotency-Key`, and parses the runner-owned immutable `CompileIntent`. Session creation, commands, undo/redo, and variant operations are synchronized through the same authenticated, tenant/project-scoped routes. Preserve these schemas; do not add client-selected worker, image, path, prompt, runtime, policy, or proof fields.

## Dedicated worker admission gate

Before a real provider can be injected, independent Linux evidence must prove all required properties for the exact provider, runtime class, image digest, and policy digest:

- dedicated failure domain using containerd 2.x and gVisor `io.containerd.runsc.v1` with Systrap;
- non-root process, read-only root filesystem, no host mounts, no container-runtime socket, bounded devices/processes/memory/duration;
- default-deny networking, with only a single-job model-gateway capability during generation;
- a separate fresh verification sandbox with no model/provider capability, credential, shared mutable generation volume, or outbound network;
- immutable signed image/envelope identity, short expiry, single-job scope, expiring lease, idempotent cleanup, startup reconciliation, and quarantine on uncertainty;
- hostile filesystem, process, socket, device, credential, network, cross-job, quota, timeout, cancellation, and worker-restart fixtures;
- proof that generated source, install/build hooks, dependencies, and runtime output never execute on the primary runner host.

Passing provider-interface unit tests is necessary but insufficient. Do not inject a provider merely because its returned attestation object names these capabilities; the deployment and hostile fixtures must independently demonstrate them.

## Compile and incident behavior

- Worker unavailable or incompatible: preserve the accepted variant, return bounded unavailable, start nothing, and never fall back to host execution.
- Dirty repository, changed HEAD/tree digest, unhealthy runtime, or bridge mismatch: deny capability/compile and require a new clean, freshly attested session.
- Expired or reused envelope: deny admission and issue no replacement capability inside the same compile attempt.
- Timeout, cancellation, cleanup uncertainty, or restart: revoke capabilities, quarantine uncertain resources, deny reuse, and retain only bounded operational metadata. Preview-start and worker-preflight promises that resolve after timeout must still run their attached late cleanup/release path.
- Failed generation or verification after a future worker exists: produce no verified state, commit, push, merge, deploy, or baseline update.

## Local validation evidence

The following checks describe the current local contract proof, not worker or hosted proof:

```bash
cd site
pnpm exec vitest run tests/studio
pnpm check
pnpm build

cd ../app
flutter analyze
flutter test test/domain/studio test/shipglows/studio test/shipglows/theme

cd ../runner
npx tsx --test test/studio/*.test.ts test/contracts/config.test.ts
npm run typecheck
npm run lint
```

Evidence recorded on 2026-08-16: site 13/13 with clean check/build and zero production Studio markers; runner Studio 35/35 with clean typecheck/lint; Flutter 24 Studio plus five theme tests (29/29 combined) with clean analysis/format. Focused fixtures close exact handshake validation, loop/revision ordering, atomic idempotency under concurrency, the 256 KiB complete-message/16 KiB command split, and late cleanup/release after provider timeout. Live `127.0.0.1:3003` confirms the exact profile and eight anchors. Live `127.0.0.1:3005` loads the Flutter Studio bundle without browser console warnings, but screenshot and semantics capture are unavailable, so visual/browser composition proof remains absent.

The full runner suite reached 144/146; Windows denied the existing symlink fixture with `EPERM` and normalized one worktree fixture to CRLF. The full Flutter suite reached 213 passing tests before eight pre-existing source-reader/indexer and Cockpit-golden failures. The broader site command reached one pre-existing installer-parity failure. None of these failures proves or disproves the OCI worker, and none may be hidden in a readiness report.

## Availability boundary

Do not describe Studio as hosted, production-ready, publicly available, or capable of compiling to code until all of the following exist: provisioned dedicated-worker proof, generated compile and reviewable patch, isolated runtime reload, viewport/state/accessibility/performance evidence, authenticated hosted browser proof, and an explicit release/editorial decision.

## Maintenance Rule

Update this guide whenever Studio enablement, identity/digest derivation, session retention/limits, compile schemas, worker runtime/image/policy, network or credential boundaries, leases/cleanup/recovery, hosted routing, or proof status changes.
