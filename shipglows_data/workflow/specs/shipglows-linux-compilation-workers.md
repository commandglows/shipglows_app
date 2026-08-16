---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.9"
project: "shipglows_app"
created: "2026-08-16"
created_at: "2026-08-16 15:16:34 UTC"
updated: "2026-08-16"
updated_at: "2026-08-16 19:34:00 UTC"
status: ready
source_skill: "100-sg-spec"
source_model: "gpt-5.6-sol"
scope: "shipglows-linux-compilation-workers"
owner: "Diane"
confidence: high
user_story: "As a ShipGlows operator, I want Studio to compile explicitly requested Astro Web and Flutter Web fixtures through independently attested ephemeral Linux workers, so that we can prove faithful artifact production without executing customer code on the Windows control host, weakening tenant isolation, or implying support for unproved targets."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/studio/"
  - "runner/test/studio/"
  - "site/"
  - "app/"
  - "shipglows_data/technical/architecture.md"
  - "shipglows_data/technical/managed-runner-foundation.md"
  - "shipglows_data/technical/code-docs-map.md"
  - "shipglows_data/technical/platforms/vercel.md"
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md"
depends_on:
  - artifact: "shipglows_data/workflow/specs/shipglows-universal-compilation-router.md"
    artifact_version: "1.1.0"
    required_status: active
  - artifact: "shipglows_data/technical/architecture.md"
    artifact_version: "2.5.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "3.3.0"
    required_status: draft
supersedes:
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.8"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.7"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.6"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.5"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.4"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.3"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.2"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.1"
  - "shipglows_data/workflow/specs/shipglows-linux-compilation-workers.md@1.0.0"
evidence:
  - "Operator approved a hybrid Linux compiler chantier for Astro Web and Flutter Web after the five-target router was implemented and independently audited at P0/P1/P2=0."
  - "The current runner has a provider-neutral managed-sandbox boundary and an injected account-free Vercel adapter facade, but no SDK, account, project, credential, live provider call, compiler image, build, artifact retrieval, or operational availability."
  - "Official Vercel sources checked on 2026-08-16 document custom VCR images as public beta, persistence enabled by default, OIDC authentication, usage-based Sandbox billing, immutable OCI digest support, and bounded lifecycle/network controls."
  - "Repository truth pins pnpm 11.15.0 and Flutter 3.41.7 through app/.fvmrc; site/package.json currently permits Node 24 without selecting an exact patch."
  - "The bounded S2 readiness correction freezes individual-file streaming, canonical manifests, source/artifact/log/time caps, exact offline argv, sandbox-only plan enums, OIDC claim verification, one-use capabilities, and one durable EUR 5 ledger."
  - "The final S3 hardening freezes every v1 field/type/key order, aggregate digest, pilot resource value, ledger record and Stage A boundary/rejection outcome; changing a numeric value now requires a new spec version."
  - "The S4 repair separates all five phase grants, makes verification an internal non-bearer lease before cleanup, gates broker egress after cleanup, and freezes target-specific artifact roots, entrypoints, extension/media maps, modes, fixtures, and hostile tests."
  - "Independent A1 reproduction found forged hidden ledger indexes, stale phase evidence, insufficient file observations, permissive dates, and incomplete provider resource receipts; v1.0.4 adds the missing normative observation and receipt fields and requires reconstruction from immutable records."
  - "The final A1 re-audit required pairwise phase digests, exact result evidence matrices, externally anchored nested ledger records, receipt freshness/correlation, and non-revivable settlement states; v1.0.5 closes those invariants."
  - "The last A1 atomicity reproduction required invalid/non-monotonic clocks to leave verifier leases and durable ledger snapshots unchanged and required revoked results to carry no artifact/worker evidence; v1.0.6 closes those invariants."
  - "The final A1 aggregation reproduction showed that multiple independently capped receipts could re-count one reservation; v1.0.7 therefore permits exactly one final receipt per reservation, with idempotence only for the identical receipt ID and bytes."
  - "The final A1 correctness audit required a restart-safe pre-create retry transfer and a separately evidenced cleanup reconciliation instead of overloading settlement; v1.0.8 adds both CAS transitions and their durable evidence fields."
next_step: "Stop at the Stage E external gate: select and explicitly authorize the exact Vercel account/project, OIDC linkage, registry writes, provider actions, and bounded spend before any live proof."
---

# ShipGlows Linux Compilation Workers

## Status And Promise

Ready for staged implementation. This specification defines the approved path from the existing closed route requirement to independently proved Astro Web and Flutter Web artifacts on ephemeral Linux workers. It does not itself install a package, configure Vercel, mutate credentials or billing, create an image or sandbox, execute source, retrieve an artifact, enable Studio compilation, start a server, commit, push, deploy, or claim availability.

The Windows PC remains the trusted control and fixture-comparison environment only. It may hash known fixtures, validate schemas, inspect returned bytes, and compare deterministic expectations. It must never compile customer or generated project source, run dependency hooks, act as a fallback worker, or turn local Flutter/Node availability into worker evidence.

## Scope

In scope:

- `astro_web` through execution class `linux_node` and toolchain profile `astro_static`;
- `flutter_web` through execution class `linux_flutter` and toolchain profile `flutter_web`;
- pure compilation contracts, provider-neutral coordination, a disabled-by-default Vercel SDK boundary, two immutable private VCR images, inert live attestation, bounded fixture builds, verified artifact retrieval, and a later Studio projection;
- explicit resource, monetary, network, persistence, cleanup, provenance, source, and artifact evidence.

Out of scope:

- Flutter Android, Windows, and iOS compilation or signing;
- arbitrary customer projects before fixture proof and a later approval;
- preview hosting, public ports, deployment, signing, store submission, persistent workspaces, Drives, shared mutable caches, or production availability;
- host execution, client-selected commands/images/providers/toolchains, provider fallback, or automatic target selection.

## Product And Security Invariants

1. The artifact target is explicit and remains server-validated; the coordinator never substitutes another target.
2. Every job binds one tenant, project, source revision, canonical source manifest digest, route-requirement digest, toolchain digest, immutable image digest, policy digest, budget, expiry, and expected artifact contract.
3. Source accepted for compilation is a closed manifest of individually streamed files from a server-owned sealed snapshot, not a host path, Git URL, shell fragment, archive, directory upload, or mutable working tree.
4. Only an independently verified worker attestation can move a job from planned to admitted. A provider response or adapter assertion alone is insufficient.
5. Commands are selected from a server-owned closed plan. No client command, environment override, path override, provider override, image override, lifecycle option, or output path is accepted.
6. Workers start with `persistent: false`, zero ports, deny-all egress, no customer or provider credential in the guest, a fixed timeout, and an exact resource/spend reservation.
7. Dependency acquisition, if later required, uses a separately attested bounded allowlist or broker and then returns to deny-all before source execution. It is never silently widened.
8. Artifact retrieval accepts only named files beneath a server-owned output root, enforces type/count/per-file/aggregate limits, and verifies digest and source/job correlation before release.
9. Stop/delete/reconciliation are part of success. Cleanup uncertainty makes the job unavailable and quarantines all output.
10. No stage may imply that Vercel, Astro Web, Flutter Web, compilation, or artifacts are available in Studio until the required later stage and independent audit pass.

## Closed Contracts

### Compilation Job

`CompilationJobV1` is the closed schema defined under Normative Schemas. Its only source-byte aggregate field is `sourceAggregateDigest`; no compatibility alias is accepted. States are exactly `planned`, `admitted`, `running`, `retrieving`, `verified`, `failed`, `quarantined`, `released`, or `revoked`.

Allowed transitions are exactly `planned -> admitted|failed|quarantined|revoked`, `admitted -> running|failed|quarantined|revoked`, `running -> retrieving|failed|quarantined|revoked`, `retrieving -> verified|failed|quarantined|revoked`, `verified -> released|quarantined|revoked`, `failed -> quarantined|revoked`, `quarantined -> revoked`, and `released -> revoked`; `revoked` is terminal. Transitions are monotonic and atomic compare-and-set. Unknown fields, values, transitions, stale revisions, duplicate terminal events, or mismatched scope fail closed.

Admission, source-ingress, execution, and artifact-egress bearer capabilities are distinct server-issued opaque random values stored only as SHA-256 digests, bound to one job, tenant, project, target, phase, and route requirement, valid for at most five minutes, and consumed exactly once by atomic compare-and-set. They cross only the phase-specific authenticated private runner boundary with `Cache-Control: private, no-store`; they never appear in Flutter persistence, URLs, logs, evidence, filenames, or provider metadata. The artifact-verification lease is the non-bearer internal exception defined below and never crosses a transport boundary.

### Compilation Plan

`CompilationPlanV1` maps one target to an exact enum selected by the server. The sandbox execution port accepts only `astro_web_v1` or `flutter_web_v1`; it never accepts a callback, function, command string, executable, argv, shell, environment, or working-directory value from a caller. The adapter expands the enum inside the attested sandbox to these fixed argv sequences:

- Astro: `pnpm install --offline --frozen-lockfile --ignore-scripts`; `pnpm exec astro check`; `pnpm exec astro build`; output root `dist/`.
- Flutter Web: `flutter pub get --offline --enforce-lockfile`; `flutter build web --release --no-pub`; output root `build/web/`.

Manifest scripts are never invoked. The implementation must use an argv/process API, a fixed working directory inside the guest, an empty-by-default environment with only server-owned deterministic locale/cache variables, a ten-minute total job timeout, at most 1 MiB captured separately for stdout and stderr, hard process/resource limits, and no shell interpolation. Ten minutes bounds cost and cleanup exposure while leaving conservative headroom for the two small offline fixtures; later customer workloads require new measured limits.

### Canonical Manifest Encoding

All source and artifact paths are UTF-8, relative, use `/`, are Unicode NFC, contain no empty, `.` or `..` segment, NUL, control character, backslash, leading `/`, drive prefix, trailing slash, or symlink traversal. The collision key is Unicode NFC followed by strict locale-independent lowercase; duplicate keys are rejected. Entries are ordered lexicographically by UTF-8 byte sequence. Canonical manifests are deterministic compact JSON with no insignificant whitespace, stable closed key order, UTF-8 without BOM, exactly one trailing LF, and SHA-256 over those exact bytes. Files are SHA-256 hashed as raw bytes.

`sourceAggregateDigest` is exactly lowercase hexadecimal SHA-256 over the concatenation, in canonical entry order, of each UTF-8 record `path`, NUL byte, base-10 `sizeBytes` without leading zero, NUL byte, lowercase hexadecimal `fileDigest`, LF byte. The artifact aggregate uses the same record construction over artifact entries. No archive/container digest exists.

### Normative Schemas And Canonical Key Orders

All objects set `additionalProperties: false`. `Digest` is `^[a-f0-9]{64}$`; opaque IDs are 128-bit-or-greater server-generated lowercase base64url without padding; timestamps are UTC RFC 3339 strings with millisecond precision and `Z`; byte/count/time values are non-negative safe integers; money strings are base-10 fixed six-decimal values. Each schema's listed field order is its canonical JSON key order, including nested records. A named self-digest field (`contractDigest`, `capabilityDigest`, `leaseDigest`, `receiptDigest`, `ledgerDigest`, `planDigest`, or `resultDigest`) is SHA-256 over that object's canonical compact-JSON-plus-LF projection with only that self-digest field omitted; capability/lease issuance digests also omit mutable `state`, which is protected separately by atomic storage revision.

`CompilationSourceManifestV1` key order and types:

1. `schemaVersion: "compilation-source-manifest-v1"`
2. `jobId: OpaqueId`
3. `tenantId: OpaqueId`
4. `projectId: OpaqueId`
5. `target: "astro_web"|"flutter_web"`
6. `sourceRevision: non-empty ASCII string <=128`
7. `entries: SourceEntryV1[]`
8. `fileCount: integer 0..4096`
9. `totalBytes: integer 0..67108864`
10. `sourceAggregateDigest: Digest`
11. `createdAt: Timestamp`

`SourceEntryV1` key order is `path: string`, `kind: "ordinary"|"asset"`, `sizeBytes: integer` (`0..2097152` ordinary, `0..16777216` asset), `fileDigest: Digest`. Array order and counts/totals/digest must recompute exactly.

`SourceFileObservationV1` key order/types are `identity: non-empty opaque string`, `kind: "regular"`, `linkCount: integer =1`, `mode: non-empty server-observed mode string`, `sizeBytes: integer`, `fileDigest: Digest`. Before and after observations must match identity, kind, link count, mode, size, and digest and must match streamed bytes. Symlink, hardlink count above one, device, FIFO, socket, special file, partial stream, or any TOCTOU drift is `sourceChanged`.

`ArtifactContractV1` key order and types:

1. `schemaVersion: "artifact-contract-v1"`
2. `target: "astro_web"|"flutter_web"`
3. `root: "dist"|"build/web"` exactly correlated to target
4. `requiredEntrypoints: string[]` in canonical lexicographic order
5. `extensionMediaTypes: ExtensionMediaTypeV1[]` in extension lexicographic order
6. `sourceMapsAllowed: false`
7. `executableBitsAllowed: false`
8. `allowedModes: ["0444","0644"]`
9. `contractDigest: Digest`

`ExtensionMediaTypeV1` key order is `extension: lowercase string beginning with .`, `mediaType: exact string`. The Astro contract has root `dist`, required entrypoint `index.html`, and exactly: `.avif -> image/avif`, `.css -> text/css`, `.html -> text/html`, `.ico -> image/x-icon`, `.jpeg -> image/jpeg`, `.jpg -> image/jpeg`, `.js -> text/javascript`, `.json -> application/json`, `.mjs -> text/javascript`, `.png -> image/png`, `.svg -> image/svg+xml`, `.txt -> text/plain`, `.webmanifest -> application/manifest+json`, `.webp -> image/webp`, `.woff -> font/woff`, `.woff2 -> font/woff2`, `.xml -> application/xml`.

The Flutter contract has root `build/web`, required entrypoints in canonical order `flutter.js`, `flutter_bootstrap.js`, `index.html`, `manifest.json`, `version.json`, and exactly: `.avif -> image/avif`, `.bin -> application/octet-stream`, `.css -> text/css`, `.frag -> application/octet-stream`, `.html -> text/html`, `.ico -> image/x-icon`, `.jpeg -> image/jpeg`, `.jpg -> image/jpeg`, `.js -> text/javascript`, `.json -> application/json`, `.png -> image/png`, `.svg -> image/svg+xml`, `.ttf -> font/ttf`, `.txt -> text/plain`, `.wasm -> application/wasm`, `.webp -> image/webp`, `.woff -> font/woff`, `.woff2 -> font/woff2`. `.bin` and `.frag` are accepted only below lexical prefix `assets/`; `.wasm` is always `application/wasm`. Unknown extensions, missing/duplicate entrypoints, extension/media mismatch, source maps (`.map`), executable bits, and files outside the exact target root fail closed.

Artifact path admission is lexical beneath the selected target root only; it does not resolve or follow filesystem links. Every entry must be an observed regular file with mode exactly `0644` or `0444`. Directories are traversal structure only and are never manifest entries.

`CompilationArtifactManifestV1` key order and types:

1. `schemaVersion: "compilation-artifact-manifest-v1"`
2. `jobId: OpaqueId`
3. `tenantId: OpaqueId`
4. `projectId: OpaqueId`
5. `target: "astro_web"|"flutter_web"`
6. `sourceAggregateDigest: Digest`
7. `toolchainDigest: Digest`
8. `imageDigest: Digest`
9. `artifactContractDigest: Digest`
10. `entries: ArtifactEntryV1[]`
11. `fileCount: integer 0..4096`
12. `totalBytes: integer 0..134217728`
13. `artifactAggregateDigest: Digest`
14. `createdAt: Timestamp`

`ArtifactEntryV1` key order is `path: string`, `mediaType: exact value derived from ArtifactContractV1`, `mode: "0444"|"0644"`, `sizeBytes: integer 0..16777216`, `fileDigest: Digest`. Array order and counts/totals/digest must recompute exactly.

`ArtifactFileObservationV1` key order/types are `identity: non-empty opaque string`, `kind: "regular"`, `linkCount: integer =1`, `mode: "0444"|"0644"`, `sizeBytes: integer`, `fileDigest: Digest`. Before/after observations and the manifest entry must match exactly. The verifier hashes the actual bounded byte stream directly from provider quarantine; provider size/digest/type claims alone never verify an artifact.

`AdmissionCapabilityV1` canonical key order/types are `schemaVersion: "admission-capability-v1"`, `capabilityId: OpaqueId`, `capabilityDigest: Digest`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `target: "astro_web"|"flutter_web"`, `routeRequirementDigest: Digest`, `budgetDigest: Digest`, `phase: "admission"`, `issuedAt: Timestamp`, `expiresAt: Timestamp`, `state: "issued"|"consumed"|"revoked"`. It is issued only after route/source/budget validation, has TTL at most 300 seconds, and is atomically consumed once immediately before the first provider allocation call.

`SourceIngressCapabilityV1` canonical key order/types are `schemaVersion: "source-ingress-capability-v1"`, `capabilityId: OpaqueId`, `capabilityDigest: Digest`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `target: "astro_web"|"flutter_web"`, `routeRequirementDigest: Digest`, `sourceManifestDigest: Digest`, `sourceAggregateDigest: Digest`, `workerEvidenceDigest: Digest`, `phase: "source_ingress"`, `issuedAt: Timestamp`, `expiresAt: Timestamp`, `state: "issued"|"consumed"|"revoked"`. It is issued after worker attestation, has TTL at most 300 seconds, and is atomically consumed once before the first source byte; partial/mismatched ingress revokes it.

`ExecutionCapabilityV1` canonical key order/types are `schemaVersion: "execution-capability-v1"`, `capabilityId: OpaqueId`, `capabilityDigest: Digest`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `target: "astro_web"|"flutter_web"`, `routeRequirementDigest: Digest`, `sourceAggregateDigest: Digest`, `workerEvidenceDigest: Digest`, `planDigest: Digest`, `artifactContractDigest: Digest`, `phase: "execution"`, `issuedAt: Timestamp`, `expiresAt: Timestamp`, `state: "issued"|"consumed"|"revoked"`. It is issued only after sealed ingress, has TTL at most 300 seconds, and is atomically consumed once immediately before starting the exact enum plan.

`ArtifactVerificationLeaseV1` is an internal non-bearer in-memory lease. Its canonical digest-projection key order/types are `schemaVersion: "artifact-verification-lease-v1"`, `leaseId: OpaqueId`, `leaseDigest: Digest`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `target: "astro_web"|"flutter_web"`, `routeRequirementDigest: Digest`, `artifactContractDigest: Digest`, `providerResourceIdDigest: Digest`, `workerEvidenceDigest: Digest`, `phase: "artifact_verification"`, `issuedAt: Timestamp`, `expiresAt: Timestamp`, `state: "issued"|"consumed"|"revoked"`. The projection exists only to compute/compare `leaseDigest`; the lease type exposes no serializer, bearer token, URL/header representation, user-readable value, Flutter/HTTP DTO, log formatter, or persistence codec. It has TTL at most 300 seconds and is consumed once by the injected verifier before the first artifact byte.

`ArtifactEgressCapabilityV1` canonical key order/types are `schemaVersion: "artifact-egress-capability-v1"`, `capabilityId: OpaqueId`, `capabilityDigest: Digest`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `target: "astro_web"|"flutter_web"`, `routeRequirementDigest: Digest`, `artifactManifestDigest: Digest`, `artifactAggregateDigest: Digest`, `privateBrokerObjectDigest: Digest`, `cleanupEvidenceDigest: Digest`, `phase: "artifact_egress"`, `issuedAt: Timestamp`, `expiresAt: Timestamp`, `state: "issued"|"consumed"|"revoked"`. It has TTL at most 300 seconds and can be issued only after verification succeeded, verified bytes were copied into the private broker quarantine, the provider resource was stopped/deleted/reconciled, and cleanup evidence matched. It is consumed once before the first broker byte and revoked on partial/failed transfer.

Every phase digest is SHA-256 of that schema's exact canonical digest projection and is bound to the exact job/tenant/project/target/phase plus its listed evidence. State transitions are only `issued -> consumed` or `issued|consumed -> revoked`; `consumed` and `revoked` cannot return to `issued`. Cross-phase substitution, replay, expiry, scope mismatch, or digest mismatch fails before the phase side effect and revokes all later phase grants.

`CompilationBudgetV1` canonical key order and exact types/values are:

1. `schemaVersion: "compilation-budget-v1"`
2. `providerControlCallsMax: integer =32`
3. `providerControlWindowMs: integer =900000`
4. `sandboxCreationsMax: integer =1`
5. `preCreateRetriesMax: integer =1`
6. `globalLiveConcurrencyMax: integer =2`
7. `tenantLiveConcurrencyMax: integer =1`
8. `projectLiveConcurrencyMax: integer =1`
9. `vcpusMax: integer =4`
10. `memoryBytesMax: integer =8589934592`
11. `diskBytesMax: integer =21474836480`
12. `processesMax: integer =256`
13. `durationMsMax: integer =600000`
14. `stdoutBytesMax: integer =1048576`
15. `stderrBytesMax: integer =1048576`
16. `sourceFilesMax: integer =4096`
17. `sourceOrdinaryFileBytesMax: integer =2097152`
18. `sourceAssetFileBytesMax: integer =16777216`
19. `sourceTotalBytesMax: integer =67108864`
20. `artifactFilesMax: integer =4096`
21. `artifactFileBytesMax: integer =16777216`
22. `artifactTotalBytesMax: integer =134217728`
23. `ingressBytesMax: integer =67108864`
24. `egressBytesMax: integer =134217728`
25. `vcrImageBytesMax: integer =16106127360`
26. `chantierVcrStorageGbMonthMax: fixed-decimal string ="10.000000"`
27. `persistentBytesMax: integer =0`
28. `snapshotBytesMax: integer =0`
29. `portsMax: integer =0`
30. `chantierSpendEurMax: fixed-decimal string ="5.000000"`
31. `ledgerExpiresAt: Timestamp|null`

Provider control calls are at most 32 per job within 15 minutes. Creation is exactly at most one; one retry is allowed only before any create is observed. After a create request is acknowledged, observed, times out ambiguously, or may have reached Vercel, creation retry is forbidden and reconciliation begins. Live concurrency is two globally and one per tenant and project.

`LedgerReservationV1` canonical key order/types are `schemaVersion: "ledger-reservation-v1"`, `reservationId: OpaqueId`, `chantierId: "shipglows-linux-compilation-workers"`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `attempt: integer 0..1`, `dimensions: CompilationBudgetV1`, `reservedEur: fixed-decimal string`, `ecbRateDate: YYYY-MM-DD`, `ecbEurUsdRate: positive fixed-decimal string`, `ecbEvidenceDigest: Digest`, `contingencyBasisPoints: integer =1000`, `state: "reserved"|"partiallyCharged"|"settled"|"retained"|"retired"`, `retryEvidenceDigest: Digest|null`, `cleanupEvidenceDigest: Digest|null`, `createdAt: Timestamp`, `updatedAt: Timestamp`, `expiresAt: Timestamp|null`. `retired` requires a non-null retry evidence digest and is terminal; every other state requires it null. A cleanup evidence digest is allowed only on `settled`.

`ProviderUsageReceiptV1` canonical key order/types are `schemaVersion: "provider-usage-receipt-v1"`, `receiptId: OpaqueId`, `provider: "vercel_sandbox"`, `providerReceiptDigest: Digest`, `reservationId: OpaqueId`, `jobId: OpaqueId`, `providerResourceIdDigest: Digest`, `activeCpuMs: integer`, `provisionedMemoryByteMs: integer`, `creationCount: integer =1`, `controlCallCount: integer 0..32`, `durationMs: integer 0..600000`, `peakMemoryBytes: integer 0..8589934592`, `diskBytes: integer 0..21474836480`, `processCount: integer 0..256`, `stdoutBytes: integer 0..1048576`, `stderrBytes: integer 0..1048576`, `ingressBytes: integer 0..67108864`, `sourceFileCount: integer 0..4096`, `artifactFileCount: integer 0..4096`, `vcrImageBytes: integer 0..16106127360`, `vcrStorageByteMs: safe integer bounded by the reserved ten-GB pilot allocation and proof duration`, `snapshotStorageByteMs: integer =0`, `egressBytes: integer 0..134217728`, `rawUsd: fixed-decimal string`, `convertedEur: fixed-decimal string`, `contingencyEur: fixed-decimal string`, `observedAt: Timestamp`, `final: true`, `receiptDigest: Digest`. Active CPU is at most `durationMs * 4`; provisioned memory is at most `durationMs * 8589934592`. Exactly one final receipt is accepted during a reservation lifetime and it must correlate the immutable reservation, job, and provider resource identity. Replaying the identical `receiptId` with byte-identical content is idempotent; every different receipt for a reservation that already has a receipt, is settled, or was released fails closed without mutation. Partial receipts are forbidden; uncertain cleanup retains the reservation while preserving its single final receipt.

`ChantierSpendLedgerV1` canonical key order/types are `schemaVersion: "chantier-spend-ledger-v1"`, `chantierId: "shipglows-linux-compilation-workers"`, `currency: "EUR"`, `ceilingEur: "5.000000"`, `reservationIds: OpaqueId[]` in lexicographic order, `receiptIds: OpaqueId[]` in lexicographic order, `reservedEur: fixed-decimal string`, `chargedEur: fixed-decimal string`, `remainingEur: fixed-decimal string`, `uncertain: boolean`, `quarantinedJobIds: OpaqueId[]` in lexicographic order, `recordsDigest: Digest`, `createdAt: Timestamp`, `updatedAt: Timestamp`, `expiresAt: Timestamp|null`, `ledgerDigest: Digest`. `recordsDigest` hashes the complete canonical ordered reservation and receipt records, not only IDs or totals. Restore requires the separately retained expected `ledgerDigest` anchor and recomputes records, hidden live/create indexes, totals, and digests; rewritten/re-digested nested records fail.

Every receipt `observedAt` is a valid timestamp between reservation creation and settlement `now`, with at most 15 minutes freshness. Future, stale, invalid, cross-job, cross-resource, or incomplete final receipts fail closed. `retain` is allowed only for a live `reserved`, `partiallyCharged`, or already `retained` reservation; settled/released reservations cannot return to live state.

`retryBeforeCreate` is one atomic CAS transfer. It requires a live `attempt=0` reservation in `reserved`, exact server-owned evidence that no create was observed, no receipt, and no existing attempt 1. It retires attempt 0 with `retryEvidenceDigest`, creates exactly one `attempt=1` reservation with the same job/tenant/project, dimensions, amount, rate, and evidence lineage, and swaps the live identifier without transiently increasing concurrency, reservation totals, charges, creation counters, or call counters. The retired reservation is terminal. Concurrent, double, post-create, mismatched-lineage, stale-revision, or restart replay attempts fail without mutation; restore reconstructs the same live and create-observed indexes.

`reconcileCleanup` is a separate atomic CAS transition and never adds or replaces a usage receipt. It accepts only a live `retained` reservation under global uncertainty with its sole final receipt, the exact receipt-bound `providerResourceIdDigest`, a new `cleanupEvidenceDigest`, and a valid observation between that receipt and `now` with at most 15 minutes freshness. It changes the reservation to `settled`, removes it from live/quarantine, recomputes global uncertainty from remaining quarantines, and preserves all charges and counters. Exact replay of the same reservation/resource/cleanup evidence is idempotent; any mismatch, concurrent revision, absent/extra receipt, invalid time, or non-retained state fails without mutation.

`CompilationJobV1` canonical key order/types are `schemaVersion: "compilation-job-v1"`, `jobId: OpaqueId`, `tenantId: OpaqueId`, `projectId: OpaqueId`, `requestedTarget: "astro_web"|"flutter_web"`, `sourceRevision: ASCII string <=128`, `sourceManifestDigest: Digest`, `sourceAggregateDigest: Digest`, `routeRequirementDigest: Digest`, `executionClass: "linux_node"|"linux_flutter"`, `toolchainProfile: "astro_static"|"flutter_web"`, `toolchainDigest: Digest`, `imageDigest: Digest`, `policyDigest: Digest`, `artifactContractDigest: Digest`, `budgetDigest: Digest`, `admissionCapabilityDigest: Digest|null`, `sourceIngressCapabilityDigest: Digest|null`, `executionCapabilityDigest: Digest|null`, `artifactVerificationLeaseDigest: Digest|null`, `artifactEgressCapabilityDigest: Digest|null`, `state: JobState`, `reason: ClosedReason|null`, `createdAt: Timestamp`, `updatedAt: Timestamp`, `expiresAt: Timestamp`. Each phase field holds only its matching schema digest; reuse across fields is invalid.

`CompilationPlanV1` canonical key order/types are `schemaVersion: "compilation-plan-v1"`, `planId: OpaqueId`, `jobId: OpaqueId`, `plan: "astro_web_v1"|"flutter_web_v1"`, `workingDirectory: "/workspace/source"`, `outputRoot: "dist"|"build/web"` correlated to plan, `durationMsMax: integer =600000`, `stdoutBytesMax: integer =1048576`, `stderrBytesMax: integer =1048576`, `planDigest: Digest`.

`CompilationResultV1` canonical key order/types are `schemaVersion: "compilation-result-v1"`, `jobId: OpaqueId`, `state: "verified"|"failed"|"quarantined"|"released"|"revoked"`, `reason: ClosedReason|null`, `sourceAggregateDigest: Digest`, `artifactManifestDigest: Digest|null`, `artifactAggregateDigest: Digest|null`, `workerEvidenceDigest: Digest|null`, `receiptDigest: Digest|null`, `stdoutDigest: Digest|null`, `stderrDigest: Digest|null`, `startedAt: Timestamp|null`, `finishedAt: Timestamp`, `resultDigest: Digest`. Success states require null reason and all three artifact/worker evidence digests. `failed` and `revoked` require one exact closed reason and all three evidence digests null. Only `quarantined` may retain evidence, and then either all three evidence digests are present or all three are null; partial evidence is invalid.

### Source Stream And Allowlists

`CompilationSourceManifestV1` describes regular files streamed individually; no archive, extraction, link, device, FIFO, socket, sparse-file interpretation, or directory upload exists. Each file is opened by the server from an owner-controlled snapshot, identity/size/hash are checked before streaming, bytes are streamed once into a fresh sandbox-owned root, and identity/size/hash are checked again before the source capability is sealed. Any mutation or mismatch is `sourceChanged`; the partial guest tree is quarantined and destroyed.

The two source roots and allowlists are exact:

- Astro repository proof root `site/`: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `astro.config.mjs`, `tsconfig.json`, `src/**`, and `public/**` only. The trusted fixture root is `runner/test/fixtures/linux-compilation/astro-web/` with the same relative allowlist. `.astro/`, `.vercel/`, `dist/`, `node_modules/`, tests, environment files, evidence images, README, ecosystem config, and every unlisted entry are excluded.
- Flutter repository proof root `app/`: `.fvmrc`, `.metadata`, `analysis_options.yaml`, `pubspec.yaml`, `pubspec.lock`, `lib/**`, and `web/**` only. The trusted fixture root is `runner/test/fixtures/linux-compilation/flutter-web/` with the same relative allowlist. `.dart_tool/`, `.flutter-plugins-dependencies`, `build/`, native folders, tests, scripts, environment files, `Isa Build/`, server files, docs, and every unlisted entry are excluded.

Source limits are at most 4,096 regular files, at most 2 MiB per ordinary file, at most 16 MiB per allowlisted asset under `public/` or `web/`, and at most 64 MiB total. These caps cover the current fixtures/project evidence with margin while bounding hashing, transfer, memory, disk, and TOCTOU exposure; crossing one is a policy change, not an automatic increase.

### Artifact Manifest

`CompilationArtifactManifestV1` lists only individually streamed regular files with canonical paths, media/type classification, size, SHA-256 digest, job/source/toolchain/image correlation, and aggregate digest. It permits at most 4,096 files, 16 MiB per file, and 128 MiB total. These values accommodate static Web bundles while bounding retrieval, verification, local quarantine, and egress cost. Symlinks, executables outside policy, source maps or metadata not explicitly allowed, hidden credentials, traversal, duplicates, collisions, excess size/count, partial streams, and unlisted output fail closed.

Before provider cleanup, the internal verification lease streams quarantined regular files directly from provider storage to the injected verifier; no user-facing or egress capability exists. The verifier validates the exact artifact contract, manifest, bytes, modes, media mapping, limits, and digests and returns only `verified(manifestDigest, artifactAggregateDigest)` or a closed reason. It cannot release, execute, render, rewrite, select files, or expose a URL. Verified streams are copied into a private broker quarantine bound by `privateBrokerObjectDigest`; copy failure revokes the lease and broker object.

Only after verification, provider stop/delete/reconciliation, and cleanup-evidence validation may the coordinator issue `ArtifactEgressCapabilityV1` for that private broker object and atomically transition output toward `released`. Failure, stale evidence, cleanup uncertainty, expiry, cancellation, or later correlation failure transitions to `quarantined` or `revoked`, revokes every phase grant and broker access, and makes all bytes unavailable for download.

### Closed Reasons And Budgets

Unavailable/failure reasons are exactly `disabled`, `unsupportedTarget`, `projectUnproved`, `routeStale`, `sourceChanged`, `sourceInvalid`, `sourceLimitExceeded`, `capabilityInvalid`, `capabilityExpired`, `capabilityReplayed`, `planInvalid`, `workerUnproved`, `workerIncompatible`, `oidcInvalid`, `budgetUnavailable`, `budgetExceeded`, `providerUnavailable`, `executionFailed`, `executionTimedOut`, `logLimitExceeded`, `artifactInvalid`, `artifactLimitExceeded`, `artifactUnproved`, `cleanupUncertain`, or `revoked`. Unknown provider errors map to `providerUnavailable` without leaking raw detail.

`CompilationBudgetV1` uses exactly the normative values above. They are conservative pilot values sized for two small trusted offline fixtures: four vCPU/eight GiB permit Flutter compilation without presenting production capacity, 20 GiB bounds image/source/build scratch space, 256 processes contains tool fan-out, and the remaining file/log/transfer/time/concurrency limits bound denial-of-service, egress, cleanup, and spend exposure. Every dimension is reserved before a side effect and monotonically charged from official receipts. Changing any numeric value requires a new spec version and readiness review; runtime configuration may only reduce a maximum.

## Toolchain Image Strategy

### Astro Web Image

- Private VCR repository dedicated to `linux/amd64`, referenced only as `repository@sha256:<digest>`.
- Minimal glibc-based Linux base pinned by digest.
- Node major 24, with the exact patch selected and recorded only after SDK/image compatibility proof; the current `>=24 <25` manifest range is not an immutable toolchain pin.
- Corepack and pnpm exactly `11.15.0`.
- The fixture lock resolves Astro `6.4.8` and `@astrojs/vercel` `11.0.5`; project dependencies are not silently baked into the generic toolchain identity.
- No Vercel control credential, customer source, mutable `latest` tag, server, browser, Android SDK, Flutter SDK, or deployment tool.

### Flutter Web Image

- Separate private VCR `linux/amd64` image with a minimal glibc-based Linux base pinned by digest.
- Flutter exactly `3.41.7` from `app/.fvmrc`, including its bundled Dart SDK, with the web artifacts precached during image construction.
- No Android SDK, Xcode, MSVC, signing material, browser, Vercel control credential, customer source, or mutable tag.
- `app/pubspec.lock` remains the dependency authority. `app/Isa Build/build.yml` currently names Flutter `3.32.2`; correction is permitted only if the file is confirmed non-user-dirty and the mismatch directly blocks the approved fixture proof. Otherwise stop and return ownership rather than widening this chantier.

Each image requires an OCI digest, base digest, normalized tool-version manifest, SBOM, vulnerability result, build provenance, repository/project scope, creation time, and retirement policy. A tag is navigation only and never evidence.

## Staged Delivery

### Stage A — Pure Closed Contracts

Implement job, enum plan, streamed-source manifest, artifact-manifest, capability, state-machine, budget, ledger, and closed reason-code contracts with the canonical encoding above and hostile fixtures. No SDK, archive/extraction, process, network, provider, or artifact transfer.

Exit proof: deterministic compact-JSON/LF/SHA-256 tests, Unicode/path/collision/order cases, state/capability/ledger tests, hostile streamed manifest cases, exact target matrix, and static no-execution scan.

### Stage B — Provider-Neutral Coordinator

Add injected ports for admission, owner-controlled snapshot sealing, verified individual source streams, sandbox-only enum-plan execution, direct provider-to-verifier quarantined artifact streams, private-broker quarantine copy, cleanup evidence, post-cleanup egress, atomic release/revoke, ledger settlement, and reconciliation. The execution port method accepts only the exact plan enum and attested lease; no generic callback/string/process port exists. Default composition has no provider or broker and returns unavailable before any side effect.

Exit proof: fake-provider lifecycle tests prove reservation-before-call, exact tenant/project/job correlation, one-use capabilities, TOCTOU sealing, cancellation, timeout, retry idempotence, quarantine/revoke, cleanup uncertainty, and absence of host fallback. Host sentinel tests install process/filesystem/network traps in the coordinator test process and prove the only execution request crosses the injected sandbox port as `astro_web_v1` or `flutter_web_v1`.

### Stage C — Disabled Vercel SDK Facade And Configuration

Add an adapter from the existing narrow facade to an exactly pinned `@vercel/sandbox` SDK only after separate package approval. Configuration is typed, server-owned, disabled by default, and validates account/project scope digests, OIDC mode, quotas, image repositories/digests, timeouts, API-call budgets, and monetary ceilings before constructing a client.

Only Vercel OIDC with the team issuer is accepted; there is no access-token fallback. Before any provider call, verify an RS256 JWT by `kid` against HTTPS JWKS discovered from the exact configured team issuer, then require exact `iss`, configured `aud`, `sub`, `owner` and `owner_id`, `project` and `project_id`, `environment=development`, and expected `user_id`. Require valid `nbf`, `iat`, and `exp` with at most 60 seconds clock skew. Although locally pulled development tokens may live for 12 hours, ShipGlows requires at least 15 minutes remaining at admission. Reject algorithm confusion, missing/duplicate claims, issuer/JWKS redirects outside the configured origin, stale keys without bounded refresh, and replay keyed by SHA-256 token digest plus `jti` when present. No credential value enters logs, evidence, Flutter, the guest, or durable project docs. Missing or ambiguous configuration performs zero provider calls.

Exit proof: contract tests against SDK types/test doubles, dependency audit, redaction tests, disabled composition proof, and no live call.

### Stage D — Immutable Private VCR Images

Create the two images above through an approved registry workflow. Resolve every base and final image to SHA-256, generate SBOM/provenance, scan, and record only redacted account/project evidence. Image creation/push is an external mutation and requires its own approval.

Exit proof: private repository scope, pull-by-digest, tool versions, size/architecture limits, SBOM/provenance, clean policy result, and no embedded secret/source.

### Stage E — Inert Live Provider Attestation

With explicit credentials and spend approval, create only short-lived non-persistent, zero-port, deny-all sandboxes from each immutable image. Run bounded inert version/identity probes, inspect effective policy/resources/image, independently attest the result, then stop, delete, reconcile, and settle the durable chantier ledger.

Exit proof: exact OIDC/account/project/resource/image/policy/budget correlation, verifier independence, observed expiry, effective cleanup, official provider usage receipts, and durable aggregate chantier spend at or below EUR 5.

### Stage F — Bounded Fixture Builds And Artifact Retrieval

After Stage E passes and a separate execution approval, build one repository-owned non-secret Astro fixture and one repository-owned non-secret Flutter Web fixture with the fixed offline argv. Dependencies must therefore already be present in the immutable image/content-addressed offline store; a cache miss fails closed and never widens the network. Stream only the bounded quarantined artifact files, verify them on the Windows control PC against trusted fixture expectations without executing or serving them, then delete, reconcile, and settle the same durable ledger.

Exit proof: successful enum plan, sealed source streams and verified artifact digests, log/output limits, no secret/network/port/persistence escape, deterministic or explained comparison, official usage receipts, complete cleanup, and cumulative Stage E+F cost including retries at or below EUR 5.

### Stage G — Studio Projection

Only after Stage F and independent review may the existing routing projection expose proved availability for `astro_web` and `flutter_web`. The client still selects only the artifact target and cannot submit provider/runtime/toolchain fields. Build controls remain disabled unless the exact fresh worker evidence and job admission are present.

Exit proof: strict Runner/Dart parity, authenticated tenant/project guards, unavailable defaults, stale-evidence rejection, accessible compact UI states, and no widening of Android/Windows/iOS claims.

### Stage H — Independent Audit, Documentation, And Authorized Commit

Run an independent P0/P1/P2 audit across source isolation, artifact verification, provider evidence, budgets, credential handling, cleanup, cross-language projection, and public claims. Reconcile technical owners and history. Commit only the explicitly reviewed chantier scope; push/deploy remain separately authorized.

Exit proof: P0/P1/P2=0, full focused/regression/security gates, metadata/link/diff checks, exact dirty-scope review, truthful docs, and an intentional local commit if authorized.

## Durable EUR Spend Ledger

One server-owned durable ledger is created before Stage E and atomically aggregates all Stage E and F reservations and charges across attempts. The hard ceiling is EUR 5 total for the entire chantier, not EUR 5 per job or stage. It includes retries, active CPU, provisioned memory, sandbox creation/API operations, VCR image storage for the proof window with at most 10 GB-month allocated to this chantier, snapshot storage fixed at zero, network egress, artifact retrieval, and cleanup/reconciliation calls. Each VCR image is at most 15 GB even though the aggregate chantier allocation is lower. Reservations remain held until official Vercel usage receipts settle them and cleanup is independently reconciled; process restart or retry cannot reset the aggregate.

The ledger expires 24 hours after the final official receipt and certain cleanup reconciliation. `ledgerExpiresAt` remains null and the record is retained indefinitely while any receipt, resource, cleanup, charge, quarantine, or revocation state is uncertain. Retention never authorizes another call or releases money.

USD charges are converted with the latest published ECB EUR/USD reference rate whose observation is no more than 24 hours old, applying a further 10% contingency before reservation. The ledger stores the rate date, retrieval evidence digest, direction, formula, raw USD, converted EUR, contingency, receipt identifier/digest, reservation, charge, release, and remaining ceiling without storing credentials or raw account data. An absent, stale, ambiguous, unavailable, or directionally uncertain rate or provider receipt permits zero provider calls; if discovered after an allocation, output is quarantined, cleanup is attempted within the retained reservation, and no reservation is released until reconciliation is certain.

## Mandatory Stops

Stop before or during the applicable stage when any of the following occurs:

- OIDC, account, team, project, environment, region, issuer, or resource ownership is absent or ambiguous;
- any access-token fallback is proposed, or OIDC signature, `kid`/JWKS, exact claims, lifetime, remaining TTL, skew, or replay proof fails;
- any credential creation, refresh, storage, permission, or mutation exceeds the explicit approval;
- a billing-plan, payment-method, spending-control, quota, or subscription change would be required;
- the durable aggregate reservation or charge can exceed EUR 5, official receipts are absent, or the ECB rate is absent, older than 24 hours, ambiguous, or lacks the 10% contingency;
- an image uses a mutable tag, unresolved base, wrong architecture, absent SBOM/provenance, or unverified digest;
- persistence is true or uncertain, a snapshot/Drive is created, any port is exposed, or network policy is wider than the approved exact phase;
- a source snapshot/seal verifier, worker-evidence verifier, artifact stream verifier, one-use capability, budget reservation, expiry binding, or tenant/project/job/target correlation is absent;
- cleanup, deletion, reconciliation, cancellation, provider accounting, or artifact quarantine is uncertain;
- project files change after evidence, a shell/client override appears, a host fallback is attempted, or Android/Windows/iOS becomes implied;
- a fixture contains customer/private data or actual customer/generated source would be executed without a new approval.

Every stop leaves routing and compilation unavailable. Failed output is quarantined and must not be shown as an artifact.

## Verification Matrix

- Closed-schema and unknown-field rejection for all job, plan, source, artifact, provider-config, and projection records.
- Cross-tenant/project/target/revision/job/image/policy evidence replay rejection.
- Streamed-source absolute/traversal/backslash/control/NFC, symlink/hardlink/device, duplicate/lowercase collision, changed-file, oversize, partial-stream, and manifest-race rejection.
- Command/argv/environment/working-directory/output-root allowlist tests; shell metacharacters remain inert data.
- Artifact traversal, symlink, duplicate, count/size/type, stale, source-map, executable, digest, and partial-transfer rejection.
- Reservation-before-provider-call, atomic EUR aggregate, ECB-rate freshness/direction/contingency, receipt settlement, concurrency/API/duration/CPU/memory/disk/process/log/source/artifact/transfer/VCR/money limits.
- OIDC RS256/`kid`/JWKS origin, exact claim set, `nbf`/`iat`/`exp`, 60-second skew, 15-minute remaining TTL, token-digest/`jti` replay, and no-access-token-fallback tests.
- Persistence, snapshot, Drive, port, network, credential, cleanup, and reconciliation hostile tests.
- Disabled-default and no-SDK/no-provider/no-host-execution scans at the stages where those absences are required.
- Exact Astro/Flutter image manifest and fixture parity; Flutter `3.32.2` drift is explicitly detected.
- Canonical contract fixtures are exactly `runner/test/fixtures/linux-compilation/contracts/artifact-contract-astro-web-v1.json`, `artifact-contract-flutter-web-v1.json`, `artifact-manifest-astro-web-valid-v1.json`, and `artifact-manifest-flutter-web-valid-v1.json`. Their bytes follow the schema-specific key orders and compact-JSON/LF rules; hostile variants are generated deterministically from them in tests rather than becoming alternate authorities.
- Artifact-contract tests cover both target/root maps, every required entrypoint, every allowed extension/media pair, `.bin`/`.frag` lexical `assets/` restriction, `.wasm`, unknown extension, media mismatch, missing required entrypoint, `.map`, non-regular type, mode `0644`/`0444` and rejected executable/other modes, canonical order/digest, file/count/total N and N+1.
- Capability tests cover issuance prerequisites, exact phase/job/tenant/project/target/evidence binding, TTL N/N+1, consume-once, consumed/revoked terminal behavior, same-phase replay, every cross-phase substitution, private/no-store bearer handling, non-serializable verification lease, pre-cleanup provider-to-verifier streams, post-cleanup broker-only egress, and cascade revocation.
- Runner focused/full tests, typecheck, lint, offline audit; Flutter focused/full Studio tests, analyze, format; metadata, topology, link/path, stale-claim, and diff checks.

## Stage A Normative Given/When/Then Cases

For this table, digest state is exactly `absent`, `unchanged`, `sealed`, or `invalidated`. Capability state is exactly `notIssued`, `issued`, `consumed`, or `consumedThenRevoked`. Stage A is pure: every row requires provider calls `0` and host filesystem/process/network side effects `0`.

| Given | When | Then | Exact reason | Job transition | Capability | Digest state | Provider/host side effects |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Any schema has one unknown key | Parse | Reject | `sourceInvalid` for source; `artifactInvalid` for artifact; `planInvalid` for plan/job/budget/capability/ledger/result | unchanged | `notIssued` | `unchanged` | `0/0` |
| Any closed enum has an unknown value | Parse | Reject | `unsupportedTarget` for target; otherwise `planInvalid` | unchanged | `notIssued` | `unchanged` | `0/0` |
| A job has an unknown state or a transition outside the exact graph | Transition | Reject | `planInvalid` | unchanged | unchanged | `unchanged` | `0/0` |
| A capability is expired, scope-mismatched, or digest-mismatched | Consume | Reject | `capabilityExpired` or `capabilityInvalid` | `planned -> revoked` if owned, otherwise unchanged | `consumedThenRevoked` only if atomically claimed; otherwise unchanged | `invalidated` if owned, otherwise `unchanged` | `0/0` |
| A previously consumed capability is presented again | Consume | Reject | `capabilityReplayed` | unchanged or current state `-> revoked` | `consumed` | `invalidated` | `0/0` |
| A valid capability from admission, ingress, execution, verification, or egress is presented to any other phase | Authorize phase | Reject before allocation/stream/execution/read | `capabilityInvalid` | unchanged or current nonterminal `-> revoked` | presented grant `issued|consumed -> revoked` | `invalidated` | `0/0` |
| A phase capability age is exactly 300000 ms / 300001 ms, with all timestamp/skew checks otherwise valid | Authorize phase | Accept N / reject N+1 | null / `capabilityExpired` | unchanged / current nonterminal `-> revoked` | `issued -> consumed` / `issued -> revoked` | `sealed` / `invalidated` | `0/0` |
| Verification lease is requested through JSON/HTTP/Flutter/log/persistence serializer | Expose | No representation is produced | `capabilityInvalid` | current nonterminal `-> quarantined` | `issued -> revoked` | `invalidated` | `0/0` |
| Artifact egress is requested before verifier success, broker quarantine copy, or certain cleanup | Issue egress | Reject | `artifactUnproved` or `cleanupUncertain` | `retrieving|verified -> quarantined` | `notIssued`; lease `-> revoked` on mismatch | `invalidated` | `0/0` |
| A path is non-UTF-8, non-NFC, uses `\`, contains forbidden segments/chars, or collides by strict lowercase key | Canonicalize | Reject | `sourceInvalid` or `artifactInvalid` by schema | unchanged | `notIssued` | `absent` | `0/0` |
| Valid NFC paths are supplied out of canonical UTF-8 byte order | Canonicalize | Sort then seal only if received manifest order already equals canonical order; otherwise reject | `sourceInvalid` or `artifactInvalid` on noncanonical encoded manifest | unchanged | `notIssued` | `absent` | `0/0` |
| Canonical entries and compact JSON key order/LF are exact | Hash | Recomputed manifest and aggregate digests match | null | unchanged | unchanged | `sealed` | `0/0` |
| JSON whitespace, key order, BOM, final LF, file digest, count, total, or aggregate differs | Hash | Reject | `sourceInvalid` or `artifactInvalid` | unchanged | `notIssued` | `invalidated` | `0/0` |
| Owner snapshot identity/size/hash is stable before and after a complete individual stream | Seal source | Accept file and eventually manifest | null | unchanged | final stream `issued -> consumed` | `sealed` | `0/0` |
| A source stream is partial, reordered, duplicated, mutated, or closes before declared bytes | Seal source | Reject and revoke partial set | `sourceChanged` | `planned -> quarantined` | `consumedThenRevoked` | `invalidated` | `0/0` |
| Source `fileCount=4096` | Validate | Accept boundary | null | unchanged | unchanged | `sealed` | `0/0` |
| Source `fileCount=4097` | Validate | Reject | `sourceLimitExceeded` | unchanged | `notIssued` | `absent` | `0/0` |
| Ordinary source file `sizeBytes=2097152` / `2097153` | Validate | Accept N / reject N+1 | null / `sourceLimitExceeded` | unchanged | unchanged / `notIssued` | `sealed` / `absent` | `0/0` |
| Asset source file `sizeBytes=16777216` / `16777217` | Validate | Accept N / reject N+1 | null / `sourceLimitExceeded` | unchanged | unchanged / `notIssued` | `sealed` / `absent` | `0/0` |
| Source total or ingress bytes `=67108864` / `=67108865` | Validate | Accept N / reject N+1 | null / `sourceLimitExceeded` or `budgetExceeded` for ingress ledger | unchanged | unchanged / `notIssued` | `sealed` / `absent` | `0/0` |
| Artifact `fileCount=4096` / `4097` | Validate | Accept N / reject N+1 | null / `artifactLimitExceeded` | unchanged / `retrieving -> quarantined` | unchanged / `consumedThenRevoked` | `sealed` / `invalidated` | `0/0` |
| Artifact file `sizeBytes=16777216` / `16777217` | Validate | Accept N / reject N+1 | null / `artifactLimitExceeded` | unchanged / `retrieving -> quarantined` | unchanged / `consumedThenRevoked` | `sealed` / `invalidated` | `0/0` |
| Artifact total or egress bytes `=134217728` / `=134217729` | Validate | Accept N / reject N+1 | null / `artifactLimitExceeded` or `budgetExceeded` for egress ledger | unchanged / `retrieving -> quarantined` | unchanged / `consumedThenRevoked` | `sealed` / `invalidated` | `0/0` |
| Astro artifact uses root `dist`, contains `index.html`, every extension/media mapping is exact, entries are regular mode `0444|0644`, and no source map exists | Validate contract | Accept | null | unchanged | verification lease `issued -> consumed` | `sealed` | `0/0` |
| Flutter artifact uses root `build/web`, contains all five required entrypoints, exact mapping and modes, with `.bin|.frag` only under `assets/` | Validate contract | Accept | null | unchanged | verification lease `issued -> consumed` | `sealed` | `0/0` |
| Root/target map mismatches, any required entrypoint is missing, extension is unknown, media differs, `.map` exists, `.bin|.frag` is outside `assets/`, entry is non-regular, or mode is not `0444|0644` | Validate contract | Reject | `artifactInvalid` | `retrieving -> quarantined` | verification lease `issued|consumed -> revoked` | `invalidated` | `0/0` |
| stdout or stderr independently `=1048576` / `=1048577` | Account | Accept N / reject N+1 | null / `logLimitExceeded` | unchanged / current nonterminal `-> failed` | unchanged / owned capability `-> consumedThenRevoked` | `unchanged` / `invalidated` | `0/0` |
| Duration `=600000 ms` / `=600001 ms` | Account | Accept N / reject N+1 | null / `executionTimedOut` | unchanged / `running -> failed` | unchanged / `consumedThenRevoked` | `unchanged` / `invalidated` | `0/0` |
| Each resource is exactly N: provider calls 32/15m, creations 1, pre-create retries 1, global live 2, tenant live 1, project live 1, vCPU 4, RAM 8589934592, disk 21474836480, processes 256, VCR image 16106127360, chantier VCR 10.000000 GB-month, persistence 0, snapshots 0, ports 0, spend 5.000000 EUR | Reserve | Accept the boundary if all other dimensions fit | null | unchanged | unchanged | `unchanged` | `0/0` |
| Any preceding resource is N+1; or persistence/snapshots/ports is 1 | Reserve | Reject before allocation | `budgetExceeded` | unchanged | `notIssued` | `unchanged` | `0/0` |
| A second create is requested after any create is observed or ambiguous | Reserve | Reject and require reconciliation | `cleanupUncertain` | current nonterminal `-> quarantined` | owned capability `-> consumedThenRevoked` | `invalidated` | `0/0` |
| One pre-create failure has occurred and no create may have reached provider | Reserve one retry | Accept retry reservation once | null | unchanged | unchanged | `unchanged` | `0/0` |
| Two coordinators race for the same global/tenant/project slot or restart with an existing durable reservation | Atomic reserve | Exactly one wins; loser/restart cannot reset counters | `budgetUnavailable` for loser | unchanged | loser `notIssued` | `unchanged` | `0/0` |
| Final receipt is exact, cleanup certain, totals fit, and rate evidence is fresh | Settle | Charge atomically; expiry becomes final receipt +24h | null | unchanged | unchanged | `sealed` receipt digest | `0/0` |
| Receipt/rate/resource/cleanup is absent, stale, conflicting, partial, or uncertain | Settle | Retain reservation indefinitely, quarantine output, make zero new calls | `budgetUnavailable` or `cleanupUncertain` | current nonterminal/verified `-> quarantined` | `consumedThenRevoked` | `invalidated` | `0/0` |

## Acceptance Criteria

- [ ] A pure job/plan/source/artifact contract rejects every unbound or extra input.
- [ ] Admission, source ingress, execution, internal verification, and user egress have distinct exact schemas/digests; job phase fields cannot be substituted or replayed.
- [ ] The verification lease has no serializable/user-readable form, and artifact egress cannot exist until direct provider-to-verifier streaming, private-broker quarantine copy, and certain cleanup all succeed.
- [ ] Astro and Flutter artifact contracts enforce their exact roots, required entrypoints, extension/media maps, regular-file modes, source-map ban, and unknown-extension rejection against canonical fixtures.
- [ ] Source and artifacts stream as individual regular files with the exact UTF-8/NFC/lowercase-collision/order/compact-JSON/LF/SHA-256 rules and no archive or extraction surface.
- [ ] Source, artifact, log, and ten-minute timeout caps are enforced at admission and while streaming/executing.
- [ ] The provider-neutral coordinator is unavailable by default and cannot execute on the Windows host.
- [ ] Its only execution port accepts an attested lease plus `astro_web_v1` or `flutter_web_v1`; host sentinel tests prove no local process/filesystem/network fallback.
- [ ] The Vercel SDK boundary is exact-versioned, injected, disabled by default, redacted, and separately approved.
- [ ] Astro and Flutter Web use two private immutable `linux/amd64` VCR images with exact digest, SBOM, provenance, and no embedded credentials/source.
- [ ] Node 24 has an exact proved patch; pnpm is `11.15.0`; Flutter is `3.41.7` from `.fvmrc`.
- [ ] Live inert proof establishes account/project/image/policy/resource/budget/cleanup truth without persistence, ports, widened network, or spend above EUR 5.
- [ ] OIDC uses the exact team issuer, RS256/JWKS and closed claims/lifetime/replay contract with no access-token fallback.
- [ ] One atomic durable ledger holds Stage E/F/retry/cleanup reservations and settles official receipts with a fresh ECB rate plus 10% contingency under the aggregate EUR 5 ceiling.
- [ ] The two trusted fixtures build only after separate execution approval and their bounded returned artifacts pass independent verification.
- [ ] Studio remains unavailable until fresh exact execution evidence exists and never advertises Android, Windows, or iOS from this chantier.
- [ ] Independent audit reaches P0/P1/P2=0 and all directly mapped technical documentation is reconciled before closure.
- [ ] No customer source, deployment, signing, public availability, push, or billing/credential mutation occurs implicitly.

## Risks And Mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| VCR custom images are public beta | API/behavior or availability changes | Exact SDK/image proof, disabled default, adapter boundary, recheck official sources before live work |
| Node manifest range is not an exact toolchain | Non-reproducible Astro output | Select and attest an exact Node 24 patch before image creation |
| Flutter configuration drift | Build mismatch | `.fvmrc` 3.41.7 is canonical; detect stale 3.32.2 workflow and repair only under its bounded gate |
| Dependency installation executes hooks | Untrusted execution or exfiltration | Treat install as execution, isolate it, bound network, close egress before build, never run on host |
| Provider evidence is self-issued | False isolation/capability claim | Independent verifier with exact account/project/resource/digest correlation |
| Default Vercel persistence retains source | Privacy and storage-cost leak | Explicit `persistent:false`, inspect effective state, forbid snapshots/Drives, delete/reconcile |
| Artifact streams attack the control PC | Host compromise | Closed manifest, bounded individual regular-file streams, quarantine and byte comparison without extraction/execution |
| Usage exceeds expectations | Unapproved cost | Reserve every call/resource, stop at EUR 5, inspect usage, cleanup on all paths |

Residual risk after fixture proof: arbitrary customer dependency graphs, malicious build tooling, provider beta stability, regional availability, production concurrency, long-term cost, compliance, visual fidelity, and hosted UX remain unproved. A separate approval and evidence set is required before customer builds.

## Official Source References

Checked on 2026-08-16; these are design inputs, not provider proof:

- [Vercel Sandbox overview](https://vercel.com/sandbox)
- [Vercel Sandbox custom images public beta](https://vercel.com/changelog/vercel-sandbox-now-support-custom-images)
- [Vercel Container Registry usage, formats, limits, and digest references](https://vercel.com/kb/guide/how-to-use-vercel-container-registry)
- [Sandbox duration and persistence](https://vercel.com/kb/guide/vercel-sandbox-duration-and-persistence)
- [Sandbox persistence generally available and enabled by default](https://vercel.com/changelog/sandbox-persistence-is-now-ga)
- [Sandbox snapshots](https://vercel.com/docs/vercel-sandbox/concepts/snapshots)
- [Vercel Drives beta and persistence boundaries](https://vercel.com/kb/guide/vercel-drives)
- [Sandbox credential brokering](https://vercel.com/changelog/safely-inject-credentials-in-http-headers-with-vercel-sandbox)
- [Sandbox request proxying and filtering](https://vercel.com/changelog/vercel-sandbox-firewall-now-supports-request-proxying-and-filtering)
- [Vercel OIDC federation](https://vercel.com/docs/oidc)
- [Vercel pricing](https://vercel.com/pricing)
- [Flutter Web deployment](https://docs.flutter.dev/deployment/web)
- [Flutter SDK archive](https://docs.flutter.dev/install/archive)
- [Astro build and deploy guidance](https://docs.astro.build/en/guides/deploy/)
- [pnpm continuous-integration guidance](https://pnpm.io/continuous-integration)

## Documentation Map

After implementation truth is stable, update:

- `shipglows_data/technical/architecture.md` for the adopted coordinator/provider boundary only;
- `shipglows_data/technical/managed-runner-foundation.md` for composition, contracts, failure states, and proof;
- `shipglows_data/technical/code-docs-map.md` for new source/test/fixture/image paths and maintenance ownership;
- `shipglows_data/technical/platforms/vercel.md` for exact SDK, OIDC/account/project, VCR image digests, persistence, limits, pricing, and live evidence;
- `shipglows_data/technical/operator-guides/studio-oci-worker.md` for approvals, budgets, probes, builds, retrieval, cleanup, reconciliation, incidents, and rollback;
- this spec for every completed stage, proof count, stop, decision, and residual risk.

Public site, README, pricing, availability, support, and onboarding claims remain unchanged until a separately approved editorial/release decision.

## Execution Batches

Parallel writes are allowed only for batches explicitly marked parallel, only after this spec is revalidated ready, and only within the listed non-overlapping ownership. The integration owner stops all writers before touching shared seams.

### Batch A1 — Contracts (sequential foundation)

Owner: Runner domain agent.

Write scope, exactly:

- `runner/src/studio/compilation/contracts.ts`
- `runner/src/studio/compilation/canonicalManifest.ts`
- `runner/src/studio/compilation/sourcePolicy.ts`
- `runner/src/studio/compilation/artifactPolicy.ts`
- `runner/src/studio/compilation/budgetLedger.ts`
- `runner/test/studio/linuxCompilationContracts.test.ts`
- `runner/test/fixtures/linux-compilation/contracts/artifact-contract-astro-web-v1.json`
- `runner/test/fixtures/linux-compilation/contracts/artifact-contract-flutter-web-v1.json`
- `runner/test/fixtures/linux-compilation/contracts/artifact-manifest-astro-web-valid-v1.json`
- `runner/test/fixtures/linux-compilation/contracts/artifact-manifest-flutter-web-valid-v1.json`

Must not edit: existing provider adapters, HTTP routes, composition root, Flutter, site/app fixtures, package files, docs, this spec, or Git.

### Batch B1 — Coordinator (sequential after A1)

Owner: Runner orchestration agent.

Write scope, exactly:

- `runner/src/studio/compilation/ports.ts`
- `runner/src/studio/compilation/coordinator.ts`
- `runner/test/studio/linuxCompilationCoordinator.test.ts`

Must not edit: provider adapters, SDK/config, composition root, Flutter, fixtures, package files, docs, this spec, or Git.

### Batches C1/C2 — SDK Boundary And Fixture/Image Inputs (parallel only after B1)

Owner C1: Vercel adapter agent. Write scope, exactly: `runner/src/studio/providers/vercelSandboxSdkFacade.ts`, `runner/src/studio/providers/vercelSandboxConfiguration.ts`, and `runner/test/studio/vercelSandboxSdkFacade.test.ts`. `runner/package.json` and `runner/package-lock.json` are permitted only under a separate package approval and then become C1-owned exclusively.

Owner C2: Toolchain/fixture agent. Write scope, exactly: `runner/images/astro-web/**`, `runner/images/flutter-web/**`, `runner/test/fixtures/linux-compilation/astro-web/**`, `runner/test/fixtures/linux-compilation/flutter-web/**`, and `runner/test/studio/linuxCompilationImages.test.ts`. The stale `app/Isa Build/build.yml` may be added to C2 ownership only after the direct-required/non-user-dirty gate is recorded in this spec; otherwise it remains forbidden.

Neither owner may edit the other's files, composition root, HTTP/Flutter projection, technical docs, this spec, or Git. No registry/provider call occurs in these write batches.

### Batch D1 — Integration And Offline Audit (sequential)

Owner: integration agent after C1/C2 stop.

Write scope, exactly: `runner/src/studio/compilation/integration.ts`, `runner/test/studio/linuxCompilationIntegration.test.ts`, and this spec's flow/history. D1 may consume but not edit A1's contracts, B1's coordinator, C1's SDK facade/config, and C2's image/fixture files. Any required producer correction returns to that stopped owner sequentially.

Must not perform provider calls, image pushes, builds, credential/billing changes, server starts, docs reconciliation, commit, or push.

### Batch E1 — Inert Live Proof (sequential, separately approved)

Owner: provider-proof agent.

Write scope, exactly: new files under `shipglows_data/workflow/evidence/linux-compilation-workers/stage-e/` and this spec history/flow only. E1 consumes D1 integration and C2 image manifests without editing them. External create/inspect/probe/stop/delete actions require the Stage E approval and aggregate EUR 5 ceiling.

Must not upload source, run dependency/build commands, expose ports, widen network, persist, snapshot, mount a Drive, or edit product code.

### Batch F1 — Fixture Execution Proof (sequential, separately approved)

Owner: execution-proof agent.

Write scope, exactly: new files under `shipglows_data/workflow/evidence/linux-compilation-workers/stage-f/` and this spec history/flow only. F1 consumes the immutable C2 fixtures/images and D1 integration without editing them; any fixture correction returns to C2 and invalidates prior image/evidence digests. Provider execution and artifact retrieval require Stage F approval.

Must not use customer source, host compilation, Android/Windows/iOS, deployment, signing, public ports, persistence, or cumulative spend above EUR 5.

### Batch G1 — Studio Projection (sequential after independent Stage F acceptance)

Owner: cross-language integration agent.

Write scope, exactly: `runner/src/studio/compilationRoutingRoutes.ts`, `runner/test/studio/compilationRoutingRoute.test.ts`, `test/fixtures/studio/compilation-routing-v1.json`, `app/lib/shipglows/data/managed_runner_api.dart`, `app/lib/shipglows/providers/studio_provider.dart`, `app/test/shipglows/data/managed_runner_api_test.dart`, new `app/test/shipglows/studio/studio_provider_test.dart`, and this spec history/flow. G1 consumes verified worker/job evidence through the integration port only; it cannot edit contracts, coordinator, provider adapter/config, images, build fixtures, or evidence.

Must not edit compilation plans/provider credentials/images, widen existing compile POST inputs, enable unproved targets, or perform external actions.

### Batch H1 — Independent Audit And Documentation (sequential)

Owner: independent verification agent, then documentation owner after findings are repaired.

Write scope, exactly: new files under `shipglows_data/workflow/evidence/linux-compilation-workers/stage-h/`; then `shipglows_data/technical/architecture.md`, `shipglows_data/technical/managed-runner-foundation.md`, `shipglows_data/technical/code-docs-map.md`, `shipglows_data/technical/platforms/vercel.md`, `shipglows_data/technical/operator-guides/studio-oci-worker.md`, and this spec history/flow. Audit and documentation writers run sequentially. A local commit is a final separately authorized, scope-reviewed action and has no file-writing owner in the parallel topology.

Must not change public claims, package files, product behavior, provider state, billing, credentials, deploy, or push.

## Readiness Decision

Ready for Stage A and Batch A1 only. The product promise, two-target boundary, exact v1 schemas/key orders/digests, five distinct phase grants, internal provider-to-verifier flow, cleanup-gated private-broker egress, target-specific artifact contracts, pilot numeric budgets, Stage A expected outcomes, coordinator, disabled provider seam, immutable image strategy, provider/build proof separation, Windows-host restriction, stop gates, acceptance criteria, documentation consequences, and non-overlapping future write ownership are resolved. Stages C through H retain their stated approvals and evidence gates; readiness does not authorize them early. Any numeric-limit, capability-flow, or artifact-map change requires a new spec version and readiness decision.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-16 15:16:34 UTC | 100-sg-spec | gpt-5.6-sol | Converted the approved hybrid Linux compiler direction and official Vercel 2026 audit into closed staged contracts, immutable image requirements, live-proof stops, and non-overlapping execution batches. | Ready for pure local Stage A only; no code, package, provider, credential, registry, billing, server, build, artifact, Git, or documentation mutation occurred. | Revalidate topology, then execute Batch A1 without crossing any external boundary. |
| 2026-08-16 15:23:51 UTC | 101-sg-ready | gpt-5.6-sol | Closed the S2 readiness gaps with archive-free streaming, exact canonicalization/allowlists/caps/argv/reasons/budgets, sandbox-only execution, OIDC verification, one-use capabilities, artifact quarantine, atomic EUR accounting, and path-exact ownership. | Ready for Batch A1; no other file, code, provider, credential, package, server, billing, Git, or external state was touched. | Execute only the path-exact Batch A1 contract foundation. |
| 2026-08-16 15:35:24 UTC | 101-sg-ready | gpt-5.6-sol | Completed final S3 hardening with field/type/key-order schemas, source aggregate construction, exact pilot resource limits, durable reservation/receipt records, state graph, and normative Stage A N/N+1 outcomes. | Ready for Batch A1 without implementation ambiguity; no other file, code, provider, credential, package, server, billing, Git, or external state was touched. | Execute only the path-exact Batch A1 contract foundation. |
| 2026-08-16 15:40:01 UTC | 101-sg-ready | gpt-5.6-sol | Closed S4 with distinct admission/ingress/execution/verification/egress grants, phase-specific job digests, non-bearer verifier flow, cleanup-gated private-broker egress, and exact Astro/Flutter artifact contracts and fixtures. | Ready for Batch A1 with capability and artifact boundaries mechanically testable; no other file, code, provider, credential, package, server, billing, Git, or external state was touched. | Execute only the path-exact Batch A1 contract foundation. |
| 2026-08-16 16:26:15 UTC | sg-development | gpt-5.6-sol | Repaired A1 security findings by reconstructing hidden ledger indexes, binding phase consumption to exact evidence, verifying regular one-link source/artifact byte streams across TOCTOU observations, and expanding provider receipts to every reserved resource/log/transfer dimension. | A1 focused tests 19/19, typecheck, lint, metadata, diff hygiene, and no-host/provider scan pass; no B1, provider, package, Git, credential, server, or external action occurred. | Return the repaired A1 contract to independent re-audit before B1. |
| 2026-08-16 16:37:48 UTC | sg-development | gpt-5.6-sol | Closed final A1 audit findings with pairwise phase-digest checks, result evidence matrices, externally anchored nested-record restore, receipt time/resource identity correlation, and terminal reservation protection. | A1 focused tests 19/19, typecheck, lint, metadata, no-host scan, and diff hygiene pass; no B1, provider, package, Git, credential, server, or external action occurred. | Return A1 for independent confirmation before B1. |
| 2026-08-16 16:45:35 UTC | sg-development | gpt-5.6-sol | Made verifier-lease and ledger time rejection mutation-free, enforced monotonic finite clocks across every ledger mutation, and clarified revoked result evidence. | A1 focused tests 20/20, typecheck, lint, metadata, no-host scan, and diff hygiene pass; no B1 or external scope entered. | Return A1 for independent confirmation before B1. |
| 2026-08-16 16:51:03 UTC | sg-development | gpt-5.6-sol | Closed the last receipt-aggregation attack by permitting one final receipt lifetime per reservation, preserving exact replay idempotence, rejecting every different/concurrent second final atomically, and validating that invariant on restore. | A1 focused tests 21/21, typecheck, lint, metadata, no-host scan, and diff hygiene pass; no B1 or external scope entered. | Return A1 for independent confirmation before B1. |
| 2026-08-16 17:00:54 UTC | sg-development | gpt-5.6-sol | Added durable atomic pre-create retry transfer and separately evidenced cleanup reconciliation, including terminal attempt retirement, exact lineage/resource binding, restart reconstruction, idempotence, and concurrency rejection. | A1 focused tests 23/23, typecheck, lint, metadata, no-host scan, and diff hygiene pass; no B1 or external scope entered. | Return A1 for independent confirmation before B1. |
| 2026-08-16 19:34:00 UTC | sg-development | gpt-5.6-sol | Recorded the approved exact package addition (`@vercel/sandbox@3.0.0` and the separately approved `@types/async-retry@1.4.9`), the completed A1/B1 coordinator foundation, C1 disabled SDK boundary, C2 blocked image/fixture plans, and D1 immutable fail-closed integration resolver. | Offline A1+B1+C1+C2+D1 focused suite passes 81/81 with typecheck and lint; D1 routes only exact Astro/Flutter proofs, while current C2 `routable:false` plans keep integration unavailable with zero SDK load or host fallback. No provider, registry, credential, server, build, Git, or spend action occurred. | Stop for the separately approved Stage E account/project/OIDC/registry/provider gate. |

## Current Chantier Flow

| Stage | Status | Evidence or gate |
| --- | --- | --- |
| Specification | completed | Closed streamed job/enum-plan/source/artifact/five-phase-grant/ledger schemas, artifact contracts, canonical key orders/digests, exact pilot limits, stages A-H, stops, fixtures, tests, docs, and ownership are explicit |
| Readiness | ready | A1 through D1 are locally implemented; C2 remains deliberately non-routable and every Stage E+ external gate remains closed |
| Implementation | in progress | A1 contracts, B1 coordinator, C1 disabled Vercel SDK boundary, C2 deterministic blocked image/fixture inputs, and D1 immutable integration are implemented; no main/session/endpoint or Studio projection is enabled |
| Verification | in progress | Offline focused A1+B1+C1+C2+D1 suite passes 81/81 plus typecheck/lint; live account/project/image/policy/resource/budget/cleanup and fixture proofs remain absent |
| Documentation | pending | Existing docs remain truthful about non-availability; reconciliation follows proved implementation stages |
| Closure | pending | Requires Stage H P0/P1/P2=0 and truthful documentation |
| Shipping | pending | No commit, push, deployment, provider availability, or public claim is authorized by spec creation |

Current next action: stop at Stage E. Obtain a new exact approval for the selected Vercel account/project, OIDC linkage, private registry writes, inert provider lifecycle actions, and bounded aggregate spend before any external effect. Until immutable OCI attestations make both C2 manifests `routable:true`, D1 remains unavailable and performs zero SDK loads or host fallback.
