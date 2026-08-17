import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import { COMPILATION_WORKER_CAPABILITIES, compilationRouteRequirementDigest, compilationWorkerEvidenceDigest, resolveCompilationRoute, type CompilationToolchain, type CompilationWorkerEvidence, type CompilationWorkerEvidenceClaims, type CompilationWorkerEvidenceVerifier, type ExecutionClass } from "../../src/studio/compilationRouter.js";
import { COMPILATION_ROUTING_CONTRACT_VERSION, projectCapabilityEvidenceDigest, type CompilationTarget, type ProjectCapabilityDetection } from "../../src/studio/projectTargetDetector.js";

const now = new Date("2026-08-16T10:05:00.000Z");
const observedAt = "2026-08-16T10:00:00.000Z";
const expiresAt = "2026-08-16T10:10:00.000Z";
const digest = (value: string): string => createHash("sha256").update(value).digest("hex");
const verifier: CompilationWorkerEvidenceVerifier = { verify: () => true };

function project(kind: "astro" | "flutter", targets: readonly CompilationTarget[], projectId = "project_1"): ProjectCapabilityDetection {
  const artifactDigests = (kind === "astro" ? [{ path: "site/package.json", digest: "1".repeat(64) }, { path: "site/pnpm-lock.yaml", digest: "2".repeat(64) }] : [
    { path: "app/pubspec.lock", digest: "1".repeat(64) }, { path: "app/pubspec.yaml", digest: "2".repeat(64) },
    ...(targets.includes("flutterWeb") ? [{ path: "app/web/index.html", digest: "3".repeat(64) }] : []),
    ...(targets.includes("flutterAndroid") ? [{ path: "app/android/settings.gradle.kts", digest: "4".repeat(64) }] : []),
    ...(targets.includes("flutterWindows") ? [{ path: "app/windows/CMakeLists.txt", digest: "5".repeat(64) }] : []),
    ...(targets.includes("flutterIos") ? [{ path: "app/ios/Runner.xcodeproj/project.pbxproj", digest: "6".repeat(64) }] : []),
  ]).sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const values = [COMPILATION_ROUTING_CONTRACT_VERSION, projectId, kind, "a".repeat(40), "b".repeat(64), targets, artifactDigests, observedAt, expiresAt];
  return { contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION, projectId, projectKind: kind, sourceRevision: "a".repeat(40), repositoryDigest: "b".repeat(64), declaredTargets: [...targets], artifactDigests, evidenceDigest: digest(JSON.stringify(values)), observedAt, expiresAt };
}

function worker(detected: ProjectCapabilityDetection, target: CompilationTarget, executionClass: ExecutionClass, toolchain: CompilationToolchain, suffix = "1", tenantId = "tenant_1"): CompilationWorkerEvidence {
  const claims: CompilationWorkerEvidenceClaims = {
    contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION, tenantId, projectId: detected.projectId,
    sourceRevision: detected.sourceRevision, repositoryDigest: detected.repositoryDigest, projectEvidenceDigest: detected.evidenceDigest,
    target, routeRequirementDigest: compilationRouteRequirementDigest({ tenantId, project: detected, target, executionClass, toolchain }),
    workerId: `worker_${suffix}`, resourceIdentityDigest: digest(`resource_${suffix}`), executionClass, toolchain,
    toolchainVersion: "1.0.0", runtimeIdentityDigest: "c".repeat(64), policyDigest: "d".repeat(64),
    capabilities: [...COMPILATION_WORKER_CAPABILITIES], authorityDigest: "e".repeat(64), observedAt, expiresAt,
  };
  return { ...claims, evidenceDigest: compilationWorkerEvidenceDigest(claims) };
}

function route(target: unknown, detected: ProjectCapabilityDetection, workers: readonly CompilationWorkerEvidence[], evidenceVerifier: CompilationWorkerEvidenceVerifier | undefined = verifier, tenantId = "tenant_1") {
  return resolveCompilationRoute({ tenantId, target, project: detected, workers, evidenceVerifier, now });
}

describe("closed universal compilation router", () => {
  const matrix = [
    ["astroWeb", "astro", "linuxSandbox", "astroNodePnpm"], ["flutterWeb", "flutter", "linuxSandbox", "flutterWeb"],
    ["flutterAndroid", "flutter", "linuxSandbox", "flutterAndroidGradle"], ["flutterWindows", "flutter", "windowsVm", "flutterWindowsMsvc"],
    ["flutterIos", "flutter", "macosXcode", "flutterIosXcode"],
  ] as const;
  for (const [target, kind, executionClass, toolchain] of matrix) it(`maps ${target} only to ${executionClass}/${toolchain}`, () => {
    const detected = project(kind, [target]); const result = route(target, detected, [worker(detected, target, executionClass, toolchain)]);
    if (!result.supported) assert.fail(result.reason);
    assert.equal(result.executionClass, executionClass); assert.equal(result.toolchain, toolchain);
    assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.requiredCapabilities));
  });

  it("fails closed for unknown, undeclared, absent, and wrong-platform targets", () => {
    const astro = project("astro", ["astroWeb"]);
    assertUnsupported(route("shell", astro, []), "unknownTarget");
    assertUnsupported(route("flutterIos", project("flutter", ["flutterWeb"]), []), "targetNotDeclared");
    const windows = project("flutter", ["flutterWindows"]); const web = project("flutter", ["flutterWeb"]);
    assertUnsupported(route("flutterWindows", windows, [worker(web, "flutterWeb", "linuxSandbox", "flutterWeb")]), "workerUnconfigured");
  });

  it("requires a non-throwing injected verifier", () => {
    const detected = project("astro", ["astroWeb"]); const attested = worker(detected, "astroWeb", "linuxSandbox", "astroNodePnpm");
    assertUnsupported(resolveCompilationRoute({ tenantId: "tenant_1", target: "astroWeb", project: detected, workers: [attested], now }), "workerUnproved");
    assertUnsupported(route("astroWeb", detected, [attested], { verify: () => { throw new Error("authority unavailable"); } }), "workerUnproved");
    assertUnsupported(route("astroWeb", detected, [attested], { verify: () => false }), "workerUnproved");
  });

  it("rejects replay across tenant, project, revision, and target", () => {
    const detected = project("flutter", ["flutterWeb", "flutterAndroid"]); const attested = worker(detected, "flutterWeb", "linuxSandbox", "flutterWeb");
    assertUnsupported(route("flutterWeb", detected, [attested], verifier, "tenant_2"), "workerUnproved");
    const another = project("flutter", ["flutterWeb"], "project_2");
    assertUnsupported(route("flutterWeb", another, [attested]), "workerUnproved");
    const revision = project("flutter", ["flutterWeb"]); const changed = { ...revision, sourceRevision: "9".repeat(40) };
    assertUnsupported(route("flutterWeb", changed, [attested]), "invalidProjectEvidence");
    assertUnsupported(route("flutterAndroid", detected, [attested]), "toolchainUnproved");
  });

  it("rejects copied digests, stale evidence, capability disorder, and ambiguous workers", () => {
    const detected = project("flutter", ["flutterWindows"]); const attested = worker(detected, "flutterWindows", "windowsVm", "flutterWindowsMsvc");
    assertUnsupported(route("flutterWindows", detected, [{ ...attested, workerId: "spoof" }]), "workerUnproved");
    assertUnsupported(route("flutterWindows", detected, [{ ...attested, expiresAt: now.toISOString() }]), "workerUnproved");
    assertUnsupported(route("flutterWindows", detected, [{ ...attested, capabilities: [...COMPILATION_WORKER_CAPABILITIES].reverse() }]), "workerUnproved");
    assertUnsupported(route("flutterWindows", detected, [attested, worker(detected, "flutterWindows", "windowsVm", "flutterWindowsMsvc", "2")]), "incompatibleWorker");
  });

  it("rejects noncanonical, excessive, duplicate, missing, and target-inconsistent artifact evidence", () => {
    const detected = project("flutter", ["flutterWeb"]);
    const mutate = (artifactDigests: readonly { readonly path: string; readonly digest: string }[]) => {
      const changed = { ...detected, artifactDigests };
      return { ...changed, evidenceDigest: projectCapabilityEvidenceDigest(changed) };
    };
    const base = detected.artifactDigests ?? [];
    const first = base[0];
    if (first === undefined) assert.fail("Expected canonical fixture artifacts.");
    assertUnsupported(route("flutterWeb", mutate([...base].reverse()), []), "invalidProjectEvidence");
    assertUnsupported(route("flutterWeb", mutate(Array.from({ length: 17 }, (_, index) => ({ path: `app/marker-${index}.txt`, digest: digest(String(index)) }))), []), "invalidProjectEvidence");
    assertUnsupported(route("flutterWeb", mutate([first, first, ...base.slice(1)]), []), "invalidProjectEvidence");
    assertUnsupported(route("flutterWeb", mutate(base.filter((item) => item.path !== "app/pubspec.lock")), []), "invalidProjectEvidence");
    assertUnsupported(route("flutterWeb", mutate([...base, { path: "app/windows/CMakeLists.txt", digest: "7".repeat(64) }].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)), []), "invalidProjectEvidence");
  });

  it("binds deterministic route output to verified evidence", () => {
    const detected = project("astro", ["astroWeb"]); const attested = worker(detected, "astroWeb", "linuxSandbox", "astroNodePnpm");
    const first = route("astroWeb", detected, [attested]); const replay = route("astroWeb", detected, [attested]); assert.deepEqual(first, replay);
    if (!first.supported) assert.fail(first.reason);
    assert.equal(first.workerEvidenceDigest, attested.evidenceDigest);
  });
});

function assertUnsupported(result: ReturnType<typeof resolveCompilationRoute>, reason: Extract<ReturnType<typeof resolveCompilationRoute>, { supported: false }>["reason"]): void {
  if (result.supported) assert.fail("Expected routing to fail closed.");
  assert.equal(result.reason, reason);
}
