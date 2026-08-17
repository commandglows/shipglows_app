---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.1.0"
project: "shipglows_app"
created: "2026-08-16"
created_at: "2026-08-16 13:56:45 UTC"
updated: "2026-08-16"
updated_at: "2026-08-16 14:51:50 UTC"
status: active
source_skill: "100-sg-spec"
source_model: "gpt-5.6-sol"
scope: "shipglows-universal-compilation-router"
owner: "Diane"
confidence: high
user_story: "As a ShipGlows operator, I want Studio to identify the supported targets of my Astro or Flutter project and select the exact attested execution class for the artifact I explicitly request, so that one visual workflow can prepare Web, Android, Windows, and iOS output without silently running code on the ShipGlows host or routing to an incompatible toolchain."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/studio/"
  - "runner/test/studio/"
  - "app/lib/domain/studio/"
  - "app/lib/shipglows/providers/studio_provider.dart"
  - "app/lib/shipglows/presentation/screens/studio_screen.dart"
  - "app/test/domain/studio/"
  - "app/test/shipglows/studio/"
  - "shipglows_data/technical/architecture.md"
  - "shipglows_data/technical/managed-runner-foundation.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md"
    artifact_version: "1.4.1"
    required_status: active
  - artifact: "shipglows_data/technical/architecture.md"
    artifact_version: "2.5.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "3.3.0"
    required_status: draft
  - artifact: "shipglows_data/technical/code-docs-map.md"
    artifact_version: "1.6.0"
    required_status: active
supersedes:
  - "shipglows_data/workflow/specs/shipglows-universal-compilation-router.md@1.0.2"
  - "shipglows_data/workflow/specs/shipglows-universal-compilation-router.md@1.0.1"
  - "shipglows_data/workflow/specs/shipglows-universal-compilation-router.md@1.0.0"
evidence:
  - "Operator decision on 2026-08-16: Flutter Web is the universal Studio control surface while compilation is delegated to an execution environment compatible with the explicit artifact target."
  - "Operator decision on 2026-08-16: the first closed matrix covers Astro Web, Flutter Web, Flutter Android, Flutter Windows, and Flutter iOS."
  - "Operator approved local contract, detection, routing, Flutter projection, tests, and documentation only; no provider, build, server, network, credential, cost, deployment, push, or host execution is authorized."
  - "The existing managed-sandbox contract is provider-neutral, fail-closed, and not wired to a real provider; this spec extends routing semantics without weakening that boundary."
  - "Local Batches A-C implemented the five-target detector/router, a separate authenticated versioned HTTP projection, strict Dart parsing, server projection loading, and one cross-language fixture without widening Astro v1 or compile intents."
  - "The first adversarial review found that worker evidence could be accepted without an injected independent verifier and that project evidence did not bind manifest bytes; the bounded Batch A-C repair now requires the verifier, tenant/project/target correlation, stable artifact digests, and the canonical project-evidence helper."
  - "Independent verification completed at P0/P1/P2=0 after the bounded artifact-race, verifier-correlation, canonical-marker, and strict Dart-mirror repairs; Batch D reconciled all directly mapped technical owners."
next_step: "Keep routing and compilation unavailable until a separately approved plan selects and proves real Linux, Windows, and macOS execution providers, credentials, quotas, and spend boundaries."
---

# ShipGlows Universal Compilation Router

## Status

The local project-capability detector, five-target router, authenticated HTTP projection, strict Flutter mirror, parity fixture, and fail-closed provider loading are implemented, documented, and independently verified at P0/P1/P2=0. This remains a routing contract only: it does not enable compilation, configure a worker/provider, install a provider SDK, start a server, use a credential, incur cost, execute project code, create or sign an artifact, deploy, or prove any platform operational.

## Outcome

ShipGlows keeps one Flutter Web Studio and one explicit operator action for selecting the requested deliverable. The runner detects a project's declared and structurally proved capabilities, resolves the requested target through a closed matrix, and returns either one immutable route requirement or a bounded unavailable result. A route is executable only after a separate provider proves the exact operating system, architecture, toolchain, image, policy, capacity, and freshness required by that target.

## User Story

As a ShipGlows operator, I want Studio to identify the supported targets of my Astro or Flutter project and select the exact attested execution class for the artifact I explicitly request, so that one visual workflow can prepare Web, Android, Windows, and iOS output without silently running code on the ShipGlows host or routing to an incompatible toolchain.

## Non-Goals And Authority Boundary

- No automatic build, compile, test, package, signing, notarization, upload, preview, deployment, or artifact download.
- No provider selection from Flutter and no real Vercel, Codemagic, GitHub Actions, cloud runner, VM, or macOS service call.
- No SDK/package installation, account configuration, credential access, spend reservation, or quota consumption.
- No command, path, image, toolchain version, environment variable, secret, or worker identifier supplied by the client.
- No Flutter Linux or Flutter macOS desktop target in this first matrix. Adding either is a material scope change.
- No inference that a platform directory alone proves a buildable or healthy project.
- No host-process fallback, including for locally installed Flutter, Android, Windows, Node, or Visual Studio toolchains.

## Closed Domain Contracts

### Project kind

`ProjectKind` is exactly:

- `astro`
- `flutter`
- `unknown`
- `ambiguous`

`unknown` means no supported project signature was proved. `ambiguous` means mutually exclusive root signatures or conflicting authoritative manifests were found. Neither state may expose a runnable target.

### Artifact target

`CompilationTarget` is exactly:

| Target | Project kind | Artifact intent | Required execution class | Required toolchain family |
| --- | --- | --- | --- | --- |
| `astro_web` | `astro` | production web bundle | `linux_node` | `node_astro` |
| `flutter_web` | `flutter` | Flutter web bundle | `linux_flutter` | `flutter_web` |
| `flutter_android` | `flutter` | Android application package/bundle | `linux_android` | `flutter_android` |
| `flutter_windows` | `flutter` | Windows desktop application | `windows_flutter` | `flutter_windows_msvc` |
| `flutter_ios` | `flutter` | unsigned or signed iOS application according to a later explicit build policy | `macos_flutter` | `flutter_ios_xcode` |

The client must select one advertised target. Project kind never selects the artifact implicitly. A request with a missing, unknown, deprecated, incompatible, or unadvertised target is rejected.

### Execution class

`ExecutionClass` is exactly `linux_node`, `linux_flutter`, `linux_android`, `windows_flutter`, or `macos_flutter`. Each route requirement binds:

- contract and schema version;
- tenant, project, repository, immutable source revision, and project-capability digest;
- one explicit `CompilationTarget` and one `ExecutionClass`;
- OS family and version range, CPU architecture, and virtualization/isolation capability;
- required toolchain family plus server-owned minimum/exact version policy;
- immutable worker image/toolchain-set digest when configured;
- network, credential, filesystem, persistence, ingress, resource, duration, concurrency, output, transfer, API, and cost policy digests;
- artifact kind and a server-owned validation profile;
- creation and expiry timestamps plus a route-requirement digest.

The route requirement contains requirements only. It is not a lease, command, capability token, worker choice, provider availability claim, or permission to execute.

### Toolchain requirements

- `node_astro`: Linux, supported Node and package-manager policy, Astro project adapter, production web validation profile.
- `flutter_web`: Linux, pinned Flutter/Dart toolchain with web enabled, supported browser-free build validation profile.
- `flutter_android`: Linux, pinned Flutter/Dart, Java, Gradle and Android SDK/build-tools/platform set; signing is absent unless separately authorized.
- `flutter_windows_msvc`: Windows, pinned Flutter/Dart, Visual Studio Build Tools workload, MSVC, Windows SDK, CMake and Ninja versions compatible with the project.
- `flutter_ios_xcode`: macOS on Apple-compatible hardware, pinned Flutter/Dart, Xcode, iOS SDK and CocoaPods policy; signing identity, provisioning, App Store access and notarization remain separate capabilities and default absent.

Version ranges are resolved only from server-owned policy. An unpinned, unsupported, end-of-life, incompatible, or unverifiable toolchain makes the route unavailable.

### Detection result

`ProjectCapabilityReport` binds the inspected source revision and contains:

- `projectKind`;
- closed `evidenceCodes` and redacted relative evidence locations;
- `supportedTargets`, each with `target`, `availability: declared | structurally_proved`, and bounded missing requirements;
- `unsupportedTargets` with closed reason codes;
- report digest and expiry;
- no absolute host path, source content, command, secret, provider, or worker data.

Detection proves compatibility candidates, not successful compilation.

### Route resolution result

The runner returns exactly one of:

- `routable`: immutable `RouteRequirement`; no provider or worker is claimed.
- `unavailable`: closed `reasonCode`, retryability, safe operator message, and zero execution authority.

Reason codes include `unknownProject`, `ambiguousProject`, `targetMissing`, `targetUnknown`, `targetNotDeclared`, `targetNotStructurallyProved`, `targetProjectMismatch`, `sourceRevisionMismatch`, `capabilityReportExpired`, `toolchainPolicyMissing`, `executionClassUnavailable`, `workerAttestationMissing`, `workerAttestationExpired`, `workerAttestationMismatch`, `providerUnproved`, `capacityUnavailable`, `budgetUnavailable`, and `policyUnavailable`. Unknown internal failures map to one bounded fail-closed code and preserve diagnostics only in redacted server logs.

## Detection Precedence And Evidence

Detection is server-side, read-only, repository-root-bound, symlink-safe, size-bounded, time-bounded, and based on an immutable source revision. The detector does not execute package managers, scripts, Flutter, Dart, Node, shell commands, build hooks, project binaries, or generated code.

Precedence is deterministic:

1. Resolve the authorized repository root and immutable revision; reject dirty, changed, missing, or escaping sources according to existing Studio policy.
2. Inspect server-allowlisted root manifests and platform metadata as data only.
3. If authoritative Astro and Flutter root signatures both pass, return `ambiguous`; do not choose by ordering.
4. For Astro, require an allowlisted Astro dependency/config signature before advertising `astro_web`.
5. For Flutter, require a valid `pubspec.yaml` Flutter SDK dependency before evaluating targets.
6. Advertise `flutter_web` only when web platform structure is present and compatible with policy.
7. Advertise `flutter_android` only when Android platform structure and manifest/Gradle structure are present; never infer signing readiness.
8. Advertise `flutter_windows` only when Windows platform structure and CMake/runner structure are present; never infer MSVC availability from project files.
9. Advertise `flutter_ios` only when iOS Xcode project/workspace and runner structure are present; never infer signing or App Store readiness.
10. Bind the normalized report to the source revision and a digest of every inspected allowlisted input. Any change invalidates it.

Nested examples, generated folders, vendored packages, build outputs, symlink targets, and arbitrary workspace manifests do not compete with authoritative root detection. Multiple Flutter platform directories produce multiple explicit supported targets, not ambiguity. Malformed or oversized authoritative files fail closed with a bounded reason.

## Routing And Attestation Invariants

1. Flutter displays server-projected capabilities; it never detects the repository or constructs a route requirement.
2. The requested artifact target is explicit and belongs to the latest unexpired capability report for the exact source revision.
3. Target-to-execution-class and toolchain mapping is a closed exhaustive server-owned table.
4. A Linux worker cannot satisfy Windows or iOS; a Windows worker cannot satisfy Linux/Android/iOS; a macOS worker cannot silently substitute for another class.
5. `flutter_windows` requires Windows plus the pinned MSVC/CMake set. Wine, cross-compilation, the runner host, WSL, or a Linux sandbox is not an accepted substitute.
6. `flutter_ios` requires an attested macOS/Xcode class. A Linux sandbox cannot compile or sign it. Signing is a separate absent-by-default capability.
7. A provider brand, SDK response, image label, cached success, or self-issued adapter assertion is not sufficient attestation.
8. Independent evidence must bind the worker/resource identity, provider/adapter, execution class, OS/architecture, toolchain/image/policy digests, observed time, expiry, tenant/project scope, budget/capacity state, and exact route-requirement digest.
9. Missing, stale, mismatched, mutable, reused, cross-tenant, quarantined, over-budget, or unverifiable evidence rejects the route before worker creation or execution.
10. No failure may fall back to the host, a generic shell, a different target, another provider, a weaker toolchain, or an unproved execution class.
11. Detection and routing are pure admission decisions. A later execution API must require a distinct short-lived capability and separately approved provider/build implementation.
12. Logs, errors, Flutter DTOs, and telemetry expose no host path, provider credential, signing material, source content, or raw attestation.

## Operator Experience

- Studio labels the detected project kind and source revision.
- It shows each supported artifact separately: Astro Web, Flutter Web, Android, Windows, or iOS.
- Selecting a target shows the required environment in plain language, for example `Windows worker · Flutter + MSVC/CMake`.
- `Supported by project` and `Compiler available` are separate states. The first may be true while the second remains unavailable.
- An unavailable target remains visible when useful, with a safe reason such as missing project platform files or unavailable attested worker.
- Studio never labels an artifact built, signed, downloadable, verified, or deployable from route resolution alone.
- Changing source revision expires the displayed capability and requires a fresh report before selection.

## Error And Adversarial Scenarios

| Scenario | Required result |
| --- | --- |
| Both Astro and Flutter root signatures exist | `ambiguousProject`; zero target and zero worker lookup |
| Unknown framework or malformed root manifest | `unknownProject` or bounded malformed-input failure; zero execution |
| Flutter project lacks requested platform directory | `targetNotStructurallyProved` |
| Client requests iOS for Astro or Windows for Astro | `targetProjectMismatch` |
| Client submits a target absent from the enum | `targetUnknown`; no permissive parsing |
| Capability report belongs to an older commit | `sourceRevisionMismatch`; create no route requirement |
| Linux worker claims it can build Windows | `workerAttestationMismatch` |
| macOS worker has Xcode but no matching Flutter/toolchain digest | `workerAttestationMismatch` |
| iOS route has no signing authority | Route may describe unsigned build policy only; it cannot claim signed output |
| Provider is unconfigured or only locally faked | `providerUnproved` or `executionClassUnavailable` |
| Attestation expires between selection and admission | Reject and require fresh evidence; do not reuse cached success |
| Flutter alters execution class, toolchain, image, or policy fields | Closed schema rejection; server recomputes the requirement |
| Detector meets symlink, traversal, oversized or changing input | Bounded fail-closed result; no content or path disclosure |
| No compatible worker exists | Preserve target choice, show unavailable, execute nothing on host |

## Security And Cost Boundary

- Treat all repository files and generated output as untrusted data.
- Detection permits bounded parsing only; it grants no command-execution capability.
- Preserve existing separate generation and verification sandbox phases when execution is added later.
- Worker evidence remains externally verifiable and cannot be authored solely by the adapter requesting admission.
- Provider lifecycle, concurrency, API, duration, CPU, memory, disk, process, output, transfer, token/model, monetary, currency, cleanup, and reconciliation budgets remain mandatory before any future provider call.
- iOS certificates, provisioning profiles, App Store Connect keys, Android keystores, and Windows signing certificates are not part of this spec. They require separate brokered, single-purpose, short-lived authority and audit.
- Local availability of Flutter, Android SDK, Visual Studio Build Tools, or any other toolchain is diagnostic environment context only and must never authorize host compilation.

## Data And Compatibility

- Introduce versioned, closed DTOs rather than widening the existing Astro-only `CompileIntent` with optional free-form fields.
- Preserve current Astro Studio behavior and fail-closed compile admission.
- Existing clients that do not understand the router contract continue to receive the existing capability projection; they cannot request a universal route.
- Unknown enum values fail closed across TypeScript and Dart. Do not coerce them to Web or a default platform.
- Persist no provider lease, credential, signing material, build output, or source snapshot in this local contract slice.

## Acceptance Criteria

- [x] `astro_web` resolves only from a structurally proved Astro project to `linux_node` and `node_astro`.
- [x] `flutter_web` resolves only from a structurally proved Flutter Web project to `linux_flutter` and `flutter_web`.
- [x] `flutter_android` resolves only from a structurally proved Flutter Android project to `linux_android` and `flutter_android`.
- [x] `flutter_windows` resolves only from a structurally proved Flutter Windows project to `windows_flutter` and `flutter_windows_msvc`.
- [x] `flutter_ios` resolves only from a structurally proved Flutter iOS project to `macos_flutter` and `flutter_ios_xcode`.
- [x] Project capability and route requirements are immutable, revision-bound, digest-bound, expiring, and closed-schema validated.
- [x] Unknown, ambiguous, incompatible, stale, and malformed inputs produce stable bounded errors and zero provider/worker creation.
- [x] Exact worker/toolchain attestation mismatch rejects every target without fallback.
- [x] Flutter presents project support separately from compiler availability and never selects a worker or toolchain.
- [x] No new path can invoke a command, provider, network, credential, cost, build, signing, artifact, deployment, or host toolchain.
- [x] Focused Runner and Flutter tests, typecheck/lint/analyze, metadata lint, and diff checks pass.
- [x] Documentation describes contract truth and pending provider proof without claiming operational multi-platform compilation.
- [x] Independent verification reports zero unresolved P0, P1, or P2 findings for the approved local slice.

## Test Matrix

### Runner contract tests

- Exact enum parsing and rejection of extra fields, unknown values, missing target, and incompatible project/target combinations.
- Deterministic detection for one Astro root and Flutter roots containing each allowed combination of Web, Android, Windows, and iOS structures.
- Unknown, dual-framework ambiguity, malformed YAML/JSON/config, nested example, symlink escape, oversized file, file race, dirty revision, and digest-change fixtures.
- Exhaustive table test proving every `CompilationTarget` maps to exactly one execution class, toolchain family, and artifact kind with no default branch.
- Immutable/deep-frozen report and route requirement; deterministic digest and expiry tests.
- Evidence correlation tests across tenant, project, revision, target, worker/resource, class, OS, architecture, toolchain/image/policy digest, capacity, budget, observation, and expiry.
- Negative cross-OS cases, particularly Linux-to-Windows and Linux-to-iOS, plus absent iOS signing authority.
- Assert zero provider facade, worker creation, process spawn, filesystem mutation, network, and host-execution calls for detection/routing and every rejection.

### Flutter contract and presentation tests

- Closed DTO round trip for every supported target and every public reason code.
- Unknown enum, extra privileged field, stale revision, and malformed response rejection.
- Separate project-support and compiler-availability labels.
- Explicit target selection with no default artifact when several are available.
- Environment descriptions for Linux Node, Linux Flutter, Linux Android, Windows MSVC/CMake, and macOS Xcode.
- Unavailable and ambiguous states remain accessible, keyboard navigable, non-color-only, and free of internal paths/provider details.
- No route request before explicit selection and no compile/build action from a routable response.

### Integration proof

- Contract fixture parity between TypeScript and Dart for all success/error envelopes.
- Existing Astro Studio tests remain green and compile remains unavailable without separately proved provider evidence.
- Static scan confirms no command runner, process spawn, provider SDK, credential, signing, network, or host-toolchain import is added by this slice.
- Independent adversarial review must attempt target smuggling, downgrade/default routing, stale evidence reuse, cross-target attestation reuse, and host fallback.

## Documentation Map

Implementation must update these durable surfaces in the integration/documentation batch:

| Changed truth | Canonical document |
| --- | --- |
| Control-plane and execution-class architecture | `shipglows_data/technical/architecture.md` |
| Runner detection, routing, attestation, and no-host boundary | `shipglows_data/technical/managed-runner-foundation.md` |
| Code ownership and validation routes | `shipglows_data/technical/code-docs-map.md` |
| Operator-visible target states and unavailable recovery | `shipglows_data/technical/operator-guides/studio-oci-worker.md` |
| Product promise or public availability | No change unless separately reviewed; this slice creates no availability claim |

The operator guide's legacy filename is retained for link compatibility. Documentation must cite current official Flutter platform build requirements and Apple/Android/Windows toolchain sources when factual requirements are reconciled, while distinguishing documentation from account/provider proof.

## Official Source References

- [Flutter deployment overview](https://docs.flutter.dev/deployment)
- [Flutter Web deployment](https://docs.flutter.dev/deployment/web)
- [Flutter Android deployment](https://docs.flutter.dev/deployment/android)
- [Flutter Windows build requirements](https://docs.flutter.dev/platform-integration/windows/building)
- [Flutter iOS deployment](https://docs.flutter.dev/deployment/ios)
- [Astro deployment and build guidance](https://docs.astro.build/en/guides/deploy/)

These references describe platform prerequisites and supported build workflows. They do not prove a ShipGlows account, worker, compiler, signing service, artifact, or availability state.

## Risks

| Risk | Impact | Mitigation and proof |
| --- | --- | --- |
| Platform directory is mistaken for buildability | False availability and failed builds | Structural capability is labelled separately from toolchain availability and actual build proof |
| Defaulting to Web hides an invalid target | Wrong artifact | Explicit target required; exhaustive closed mapping has no default |
| Linux sandbox is treated as universal | Unsafe or impossible Windows/iOS work | Exact OS/toolchain attestation and negative cross-OS tests |
| Local Windows toolchain becomes a shortcut | Untrusted code executes on the operator host | Absolute no-host invariant and zero-spawn proofs |
| Client chooses privileged runtime details | Policy bypass or credential exposure | Server-owned target map and rejection of extra fields |
| Stale project detection survives source change | Wrong platform or dependency assumptions | Revision/input digests, expiry, invalidation, and race fixtures |
| Toolchain label substitutes for evidence | Supply-chain or compatibility failure | Immutable image/toolchain/policy digests and independent evidence correlation |
| iOS routing implies signing capability | Credential/privacy and public-claim risk | Signing absent by default and separate future authority |
| Router scope expands into provider orchestration | Cost, lock-in, and unsafe execution | Pure route requirement contract; provider/build integration excluded |
| Flutter and TypeScript enums drift | Wrong routing or permissive fallback | Shared golden fixtures and unknown-value rejection on both sides |

Residual risk: local contract tests cannot prove a real Linux, Windows, or macOS worker, toolchain compatibility with arbitrary customer projects, signing, artifact quality, provider isolation, capacity, cost, or hosted availability. Those claims remain unavailable until separately approved real-provider and end-to-end proof.

## Execution Batches

Parallel writes are permitted only after this ready spec is accepted by the integration owner. Ownership is non-overlapping; no batch may edit another batch's files.

### Batch A — Runner domain, detection, and routing

Owner: Runner implementation agent.

Write scope:

- New runner files under `runner/src/studio/` dedicated to project capability detection and universal route requirements.
- New matching tests under `runner/test/studio/`.

Actions:

- Implement closed enums, DTO parsing, deterministic root detection, target matrix, immutable route requirements, reason codes, and revision/digest/expiry binding.
- Integrate only through a new injectable/pure port or additive contract surface; do not wire a provider, process runner, server startup, or execution path.
- Add hostile fixtures and zero-side-effect assertions.

Must not edit: Flutter files, existing specs, technical documentation, package manifests/locks, provider adapters, `runner/src/main.ts`, or unrelated runner modules.

Proof: focused tests, full Studio runner tests, typecheck, lint, dependency diff, and static no-execution scan.

### Batch B — Flutter domain and Studio projection

Owner: Flutter implementation agent.

Write scope:

- New or narrowly extended files under `app/lib/domain/studio/`, `app/lib/shipglows/providers/studio_provider.dart`, and `app/lib/shipglows/presentation/screens/studio_screen.dart`.
- Matching tests under `app/test/domain/studio/` and `app/test/shipglows/studio/`.

Actions:

- Parse the closed server projection, show explicit artifact choices and environment requirements, separate project support from compiler availability, and keep build actions disabled.
- Preserve existing routing, theme tokens, accessibility, and Astro Studio behavior.

Must not edit: Runner, site, specs, technical documentation, native platform folders, package manifests/locks, or provider integrations.

Proof: focused domain/widget tests, `flutter analyze`, formatter check, and evidence that no client DTO accepts provider/worker/toolchain override fields.

### Batch C — Contract integration and independent verification

Owner: integration agent after Batches A-B stop writing.

Write scope:

- Narrow Runner/Flutter contract seams and cross-language golden fixtures required to integrate A and B.
- This spec's history and chantier-flow sections.

Actions:

- Reconcile naming and versioning without weakening either closed schema.
- Run full target/error matrix, prior Astro Studio regression proof, static no-provider/no-execution scan, and independent adversarial verification.
- Repair only integration-owned seams; return ownership-specific defects to A or B rather than creating overlapping edits.

Must not edit: provider adapters, package manifests/locks, site runtime, native build projects, or technical documentation.

Proof: parity fixtures, Runner/Flutter gates, zero unresolved P0/P1/P2, and recorded evidence.

### Batch D — Documentation reconciliation

Owner: documentation agent after integration truth is stable.

Write scope:

- `shipglows_data/technical/architecture.md`
- `shipglows_data/technical/managed-runner-foundation.md`
- `shipglows_data/technical/code-docs-map.md`
- `shipglows_data/technical/operator-guides/studio-oci-worker.md`
- This spec's documentation status/history only if assigned by the integration owner.

Actions:

- Record implemented contract truth, explicit non-operational status, official source references, test commands/results, and next real-provider proof gate.
- Do not add marketing, pricing, availability, build, signing, or deployment claims.

Must not edit: product code, tests, other specs, public site/content, package manifests/locks, or provider configuration.

Proof: metadata lint, docs-map/link consistency, claim scan, and `git diff --check`.

## Implementation Order And Stops

1. Batch A and Batch B may write in parallel because their ownership is disjoint.
2. Stop both writers before Batch C integrates and verifies their contracts.
3. Begin Batch D only after integrated behavior and proof counts are stable.
4. Stop the chantier before any real provider lookup/call, worker creation, command execution, server launch, credential/signing access, cost, build, artifact, deployment, commit, or push not separately authorized.
5. A mismatch requiring a new target, provider choice, signing behavior, host execution, public claim, package dependency, or platform architecture is a material scope change and requires operator approval.

## Readiness Decision

Ready. The product decision, closed target matrix, detection precedence, target/environment/toolchain contracts, attestation boundary, no-host invariant, error behavior, proof matrix, documentation consequences, and non-overlapping write ownership are resolved. A fresh implementation agent can execute Batches A-B locally without conversation history and must stop before every external or executable boundary.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- |
| 2026-08-16 13:56:45 UTC | 100-sg-spec | gpt-5.6-sol | Converted the approved universal Studio routing decision, including Flutter Windows, into a closed cross-platform contract and adversarial readiness boundary. | Ready for non-overlapping local Runner and Flutter implementation; no external, provider, execution, build, credential, cost, deployment, or Git action occurred. | Start Batches A-B, then stop their writers for Batch C integration and independent verification. |
| 2026-08-16 14:19:07 UTC | sg-development | gpt-5.6-sol | Integrated Batches A-B through a separate optional authenticated routing projection, strict revision/digest-bound Dart parsing, provider loading, and one shared five-target JSON fixture without changing Astro v1 or the compile POST. | Local integration passes 92/93 Runner Studio tests with one platform symlink skip, 31/31 Flutter Studio tests, Runner typecheck/lint, Flutter analyze/format, and diff checks; no provider, build, server, credential, network, cost, artifact, deployment, or Git action occurred. | Run independent adversarial verification, then Batch D documentation reconciliation. |
| 2026-08-16 14:35:24 UTC | sg-development | gpt-5.6-sol | Repaired Batch C after the first P1 audit by carrying the injected independent evidence verifier through the resolver, binding every route to the authenticated tenant, exposing canonical stable artifact digests, and extending cross-language hostile fixtures. | Runner focused 22 pass/1 Windows symlink skip and full Studio 95 pass/1 skip, typecheck, lint, zero-vulnerability offline audit, Flutter Studio 31/31, analyze, format, parity, metadata, and diff gates pass; no provider/build/external action exists. | Complete the independent re-audit, then Batch D documentation reconciliation. |
| 2026-08-16 14:51:50 UTC | sg-docs | gpt-5.6-sol | Reconciled the independently verified five-target router, HTTP projection, canonical project/worker evidence, Flutter mirror, and strict non-operational boundary across every directly mapped technical owner. | Documentation now records Runner 96 pass/1 Windows symlink skip, Flutter Studio 32/32, clean static/offline-audit gates, independent P0/P1/P2=0, and no real worker/compiler/provider/build/signing/artifact/deployment/availability. | Preserve fail-closed routing until a separately approved real-provider plan exists. |

## Current Chantier Flow

| Stage | Status | Evidence or gate |
| --- | --- | --- |
| Specification | completed | User story, five-target matrix, detection precedence, attestation invariants, errors, tests, docs, risks, and execution batches are explicit |
| Readiness | ready | Local contract work is autonomous; all executable/external boundaries are explicit stops |
| Implementation | completed | Batches A-B and their Batch C HTTP/Dart/fixture integration are implemented locally; build actions remain disabled and compile intent is unchanged |
| Verification | completed | Runner 96 pass/1 Windows symlink skip, Flutter Studio 32/32, clean typecheck/lint/analyze/format/offline audit, and independent P0/P1/P2=0 |
| Documentation | completed | Architecture, runner foundation, code-docs map, operator guide, official sources, and strict non-availability language reconciled |
| Closure | pending | Local commit scope and final lifecycle handoff remain outside this docs-only batch |
| Shipping | pending | No commit, push, deployment, provider, or availability action is part of this spec-writing batch |

Current next action: preserve the fail-closed local router and prepare a separate operator-approved decision for real Linux, Windows, and macOS execution providers, credential boundaries, quotas, and spend. No compiler, build, signing, artifact, deployment, or availability action is implied by this completed local contract.
