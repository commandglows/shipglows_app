---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "0.3.0"
project: "shipglows_app"
created: "2026-08-16"
updated: "2026-08-16"
status: draft
source_skill: "sg-docs"
scope: "studio-managed-sandbox-operations"
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
  - "runner/src/studio/providers/managedSandbox.ts"
  - "runner/src/studio/providers/attestation.ts"
  - "runner/src/studio/providers/evidenceVerifier.ts"
  - "runner/src/studio/providers/vercelSandboxProvider.ts"
  - "runner/src/studio/projectTargetDetector.ts"
  - "runner/src/studio/compilationRouter.ts"
  - "runner/src/studio/compilationRoutingRoutes.ts"
  - "runner/test/studio/"
  - "site/src/studio/"
  - "app/lib/shipglows/providers/studio_provider.dart"
  - "app/lib/domain/studio/studio_compilation_routing.dart"
  - "app/lib/shipglows/data/managed_runner_api.dart"
  - "shipglows_data/technical/platforms/vercel.md"
depends_on:
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "3.3.0"
    required_status: draft
  - artifact: "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md"
    artifact_version: "1.4.1"
    required_status: active
supersedes:
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md@0.2.0"
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md@0.1.1"
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md@0.1.0"
evidence:
  - "Earlier trusted-base Studio proof on 2026-08-16: site 13/13 with check/build/exclusion, runner 35/35 with typecheck/lint, and Flutter 24 Studio plus five theme tests (29/29 combined) with clean analysis/format."
  - "Five focused defect closures cover exact handshake validation, loop/revision ordering, atomic idempotency, distinct 256 KiB total-message and 16 KiB command limits, and late cleanup/release after provider timeout."
  - "No dedicated Linux OCI worker, immutable worker image, mTLS identity, hosted route, generated compile, patch, reload, or visual evidence has been provisioned or proved."
  - "The former self-hosted containerd/gVisor direction was superseded before provisioning; its requirements remain historical comparison evidence only."
  - "Earlier provider-neutral managed-sandbox admission and the account-free injected Vercel facade passed independent local verification on 2026-08-16: 48/48 focused tests, 73/73 then-current Studio tests, typecheck, lint, diff check, and zero high-severity offline audit findings."
  - "No Vercel SDK/package, account, credential, provider/network call, production wiring, execution, preview, persistence, export, or availability proof exists."
  - "The universal compilation router and Flutter projection passed local adversarial verification at P0/P1/P2=0 for five closed targets; this proves routing behavior only and no compiler/worker/provider availability."
next_review: "2026-08-30"
next_step: "Keep routing read-only and unavailable until separately authorized real execution-class evidence is obtained."
---

# Studio Managed-Sandbox Operations

The filename is retained as a compatibility path for existing links. The operative direction in this guide is the provider-neutral managed-sandbox architecture below; self-hosted OCI/containerd/gVisor is superseded historical evidence, not the current implementation instruction.

## Current operating state

Studio is a local trusted-base implementation, disabled by default and forbidden by configuration in production. The Astro preview, bridge, Flutter session surface, semantic journal, undo/redo, Laboratory policy, variants, repository/runtime attestation, provider-neutral admission boundary, and account-free Vercel adapter facade have focused local tests.

Compilation is not operational. The runner composition root injects no managed-sandbox provider; compile requests therefore fail closed with bounded `studioCompileUnavailable`/HTTP `503`. No Vercel SDK or package is installed, and no account, credential, network, billable, sandbox, or hosted action has occurred. Preserve this state until independently observed real-provider evidence satisfies every required control.

Universal compilation routing is also local-only and unconfigured. The code recognizes five contract targets—Astro Web, Flutter Web, Flutter Android, Flutter Windows, and Flutter iOS—and can describe their required Linux, Windows/MSVC, or macOS/Xcode execution class. `main.ts` injects no compilation-routing resolver, independent worker verifier, worker, or compiler. A missing resolver/verifier returns HTTP `503`; a supported project target must never be shown as an available compiler without exact independent worker evidence.

## Universal routing inspection

The separate read-only endpoint is:

```text
GET /v1/projects/:projectId/studio/compilation-routing
```

It requires ordinary authentication and project-read authorization and returns `private, no-store`. Its projection is bound to the exact project, source revision, repository digest, expiry window, and sorted digest list for every manifest, lock, and advertised platform marker. It contains all five routes and never chooses an artifact target for the operator.

Expected execution requirements are:

| Target | Required class | Required toolchain family |
| --- | --- | --- |
| Astro Web | Linux isolated worker | Node, package manager, Astro |
| Flutter Web | Linux isolated worker | Flutter/Dart with Web support |
| Flutter Android | Linux isolated worker | Flutter/Dart, Java, Gradle, Android SDK |
| Flutter Windows | Windows isolated worker | Flutter/Dart, Visual Studio Build Tools, MSVC, Windows SDK, CMake/Ninja |
| Flutter iOS | macOS isolated worker | Flutter/Dart, Xcode, iOS SDK, CocoaPods policy |

Project support is not compiler availability. Do not troubleshoot an unavailable route by running locally installed Flutter, Android, Node, Visual Studio, or Xcode on the runner/host. Do not inject a fake verifier outside tests. Never add target, worker, toolchain, provider, image, signing, or command fields to the existing compile-intent request.

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

## Managed-sandbox admission gate

The domain contract requires capabilities, not a provider-specific hypervisor or container-runtime brand. Before any real provider can be injected, independent evidence must bind one exact provider, adapter version, account/project/configuration, managed resource identity, image digest, policy digest, scenario, resource/cost budget, observation, expiry, tested scenarios, invalidation conditions, and control-state matrix.

Required outcomes include:

- one fresh managed-microVM failure domain per job phase, with no runner-host execution or cross-job state;
- an immutable bounded envelope and complete CPU, memory, disk, process, output, duration, concurrency, API-call/window, transfer, model-token, currency, and spend reservation;
- generation egress restricted to one brokered model-gateway path without exposing the raw credential in the guest;
- a separate verification sandbox with no model capability, provider credential, shared mutable generation state, or outbound network;
- no public provider port/domain before an authenticated private-ingress proof;
- non-persistence by default, no snapshot reuse, expiring leases, idempotent release, orphan reconciliation, and quarantine on uncertainty;
- hostile filesystem, process, device/socket, credential, ingress, egress, cross-job, quota, timeout, cancellation, evidence-tampering, and cleanup/restart fixtures;
- proof that source, generated code, install/build hooks, dependencies, and runtime output never execute on the primary runner host.

Passing local provider-interface tests is necessary but insufficient. A provider name, product page, SDK response, or provider-created attestation cannot verify itself.

## Current Vercel adapter contract

`VercelSandboxProvider` is implemented against an injected narrow client facade and deterministic test doubles. Its local rules are:

- default construction without independently verified evidence remains `unproved` and performs no client call;
- create requests are non-persistent, open zero ports, and start with deny-all networking;
- generation may update networking only to one exact HTTPS root broker, then re-inspects the resource; verification remains deny-all;
- generation atomically reserves seven provider lifecycle calls and verification reserves five before allocation;
- active, pending, and quarantined resources share the concurrency limit; same-key concurrent preflights coalesce and mismatched replays fail closed;
- the provider-wide sliding API window includes reconciliation; cleanup slots cannot be consumed by another admission;
- cleanup uncertainty quarantines the resource and prevents identifier reuse;
- no command, file transfer, snapshot, provider preview, persistence, patch export, or runtime execution surface exists.

The canonical project-specific state, sources, and future proof route are in `shipglows_data/technical/platforms/vercel.md`.

## Compile and incident behavior

- Provider unconfigured, unproved, unavailable, incompatible, over quota, cost-blocked, or lacking complete lifecycle capacity: preserve the accepted variant, return bounded unavailable, start nothing, and never fall back to host execution.
- Dirty repository, changed HEAD/tree digest, unhealthy runtime, or bridge mismatch: deny capability/compile and require a new clean, freshly attested session.
- Expired, reused, mutable, or evidence-mismatched envelope: deny admission and issue no replacement capability inside the same compile attempt.
- Timeout, cancellation, cleanup uncertainty, or restart: revoke capabilities, quarantine uncertain resources, deny reuse, and retain only bounded operational metadata. Preview-start and worker-preflight promises that resolve after timeout must still run their attached late cleanup/release path.
- Failed generation or verification after a future managed execution slice exists: produce no verified state, commit, push, merge, deploy, or baseline update.

## Local validation evidence

The following checks describe the current local contract proof, not real-provider or hosted proof:

```bash
cd site
pnpm exec vitest run tests/studio
pnpm check
pnpm build

cd ../app
flutter analyze
flutter test test/domain/studio test/shipglows/studio test/shipglows/theme

cd ../runner
npx tsx --test test/studio/workerProvider.test.ts test/studio/managedSandboxAttestation.test.ts test/studio/vercelSandboxProvider.test.ts
npx tsx --test test/studio/*.test.ts
npm run typecheck
npm run lint
npm audit --audit-level=high --offline
```

Evidence recorded on 2026-08-16: site 13/13 with clean check/build and zero production Studio markers; Flutter Studio 32/32 with clean analysis/format; the full runner Studio surface 96 pass/1 Windows symlink skip with clean typecheck, lint, diff check, and zero offline dependency-audit findings. Independent adversarial review closed the manifest-race, artifact-evidence, verifier, tenant/project/target replay, and Dart-mirror defects and finished at P0/P1/P2=0. These are contract and fake-evidence proofs only.

Live `127.0.0.1:3003` confirms the exact profile and eight anchors. Live `127.0.0.1:3005` loads the Flutter Studio bundle without browser console warnings, but screenshot and semantics capture are unavailable, so visual/browser composition proof remains absent.

The earlier broader runner suite reached 144/146; Windows denied the existing symlink fixture with `EPERM` and normalized one worktree fixture to CRLF. The full Flutter suite reached 213 passing tests before eight pre-existing source-reader/indexer and Cockpit-golden failures. The broader site command reached one pre-existing installer-parity failure. None of these failures proves or disproves a real managed provider, and none may be hidden in a readiness report.

## Availability boundary

Do not describe Studio as hosted, production-ready, publicly available, or capable of compiling to code until all of the following exist: independently observed account/project-scoped provider proof, generated compile and reviewable patch, isolated runtime reload, viewport/state/accessibility/performance evidence, authenticated hosted browser proof, and an explicit release/editorial decision.

The next permissible expansion is a separately approved, cost-bounded real-provider admission/probe/release batch. It must not run project or generated code, issue a model call, expose a provider preview, enable persistence, or export a patch. Compile execution/export remains a later approval after that proof.

Official prerequisite references: [Flutter deployment overview](https://docs.flutter.dev/deployment), [Flutter Windows build requirements](https://docs.flutter.dev/platform-integration/windows/building), [Flutter iOS deployment](https://docs.flutter.dev/deployment/ios), and [Astro deployment/build guidance](https://docs.astro.build/en/guides/deploy/). They help evaluate a future worker image but are not operational evidence.

## Superseded historical direction

The former plan required a ShipGlows-operated Linux worker using containerd 2.x and gVisor `runsc`/Systrap. It was superseded before provisioning and produced no worker, image, mTLS identity, runtime, or hostile-workload evidence. Keep its source references only as architecture history and future provider-comparison material; do not provision or enable it from this guide.

## Maintenance Rule

Update this guide whenever Studio enablement, identity/digest derivation, project artifact markers, target/execution-class/toolchain routing, resolver/verifier wiring, session retention/limits, compile schemas, managed-provider adapter/runtime/image/policy, independent evidence, account/project scope, budgets/cost, network or credential boundaries, signing, persistence/snapshots, private ingress, leases/cleanup/recovery, hosted routing, or proof status changes. Keep the compatibility filename until all canonical links can be changed in one approved migration.
