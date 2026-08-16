import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import { COMPILATION_WORKER_CAPABILITIES, compilationRouteRequirementDigest, compilationWorkerEvidenceDigest, type CompilationWorkerEvidence, type CompilationWorkerEvidenceClaims, type CompilationWorkerEvidenceVerifier } from "../../src/studio/compilationRouter.js";
import { COMPILATION_ROUTING_CONTRACT_VERSION, projectCapabilityEvidenceDigest, type ProjectCapabilityDetection } from "../../src/studio/projectTargetDetector.js";

const actor = { tenantId: "ten_1", userId: "usr_1", subject: "sub_1" };
const revision = "a".repeat(40);
const repositoryDigest = "b".repeat(64);
const verifier: CompilationWorkerEvidenceVerifier = { verify: () => true };

function project(now = new Date()): ProjectCapabilityDetection {
  const observedAt = new Date(now.getTime() - 1_000).toISOString();
  const expiresAt = new Date(now.getTime() + 14 * 60_000).toISOString();
  const declaredTargets = ["flutterWeb", "flutterAndroid", "flutterWindows", "flutterIos"] as const;
  const artifactDigests = Object.freeze([
    Object.freeze({ path: "app/android/settings.gradle", digest: "1".repeat(64) }),
    Object.freeze({ path: "app/ios/Runner.xcodeproj/project.pbxproj", digest: "2".repeat(64) }),
    Object.freeze({ path: "app/pubspec.lock", digest: "3".repeat(64) }),
    Object.freeze({ path: "app/pubspec.yaml", digest: "4".repeat(64) }),
    Object.freeze({ path: "app/web/index.html", digest: "5".repeat(64) }),
    Object.freeze({ path: "app/windows/CMakeLists.txt", digest: "6".repeat(64) }),
  ]);
  const claims = { projectId: "shipglows_app", projectKind: "flutter" as const, sourceRevision: revision, repositoryDigest, declaredTargets, artifactDigests, observedAt, expiresAt };
  return Object.freeze({ contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION, ...claims, evidenceDigest: projectCapabilityEvidenceDigest(claims) });
}

function windowsWorker(capability: ProjectCapabilityDetection, overrides: Partial<CompilationWorkerEvidenceClaims> = {}): CompilationWorkerEvidence {
  const tenantId = overrides.tenantId ?? actor.tenantId;
  const requirementDigest = compilationRouteRequirementDigest({ tenantId, project: capability, target: "flutterWindows", executionClass: "windowsVm", toolchain: "flutterWindowsMsvc" });
  const claims: CompilationWorkerEvidenceClaims = {
    contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION, tenantId, projectId: capability.projectId,
    sourceRevision: capability.sourceRevision, repositoryDigest: capability.repositoryDigest,
    projectEvidenceDigest: capability.evidenceDigest, target: "flutterWindows", routeRequirementDigest: requirementDigest,
    workerId: "worker_windows_1", resourceIdentityDigest: "3".repeat(64), executionClass: "windowsVm",
    toolchain: "flutterWindowsMsvc", toolchainVersion: "1.0.0", runtimeIdentityDigest: "4".repeat(64),
    policyDigest: "5".repeat(64), capabilities: [...COMPILATION_WORKER_CAPABILITIES], authorityDigest: "6".repeat(64),
    observedAt: capability.observedAt, expiresAt: capability.expiresAt, ...overrides,
  };
  return Object.freeze({ ...claims, evidenceDigest: compilationWorkerEvidenceDigest(claims) });
}

function app(options: { access?: boolean; resolver?: () => unknown } = {}) {
  return buildRunnerApp({
    config: loadConfig({ RUNNER_ENV: "test" }),
    dependencies: {
      authentication: { authenticate: async () => actor },
      projectAccess: { hasProjectAccess: () => options.access ?? true },
      ...(options.resolver === undefined ? {} : { studioCompilationRouting: { resolve: options.resolver as never } }),
    },
  });
}

describe("universal compilation routing projection route", () => {
  it("matches the canonical cross-language fixture without selecting a target", async () => {
    const capability = project();
    const runner = app({ resolver: () => ({ project: capability, workers: [], evidenceVerifier: verifier }) });
    const response = await runner.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" });
    await runner.close();
    const expected = JSON.parse(await readFile(resolve(process.cwd(), "../test/fixtures/studio/compilation-routing-v1.json"), "utf8")) as Record<string, unknown>;
    expected["observedAt"] = capability.observedAt;
    expected["expiresAt"] = capability.expiresAt;
    expected["projectEvidenceDigest"] = capability.evidenceDigest;
    expected["artifactDigests"] = capability.artifactDigests;
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), expected);
    assert.equal(Object.hasOwn(response.json(), "selectedTarget"), false);
    assert.equal(response.headers["cache-control"], "private, no-store");
  });

  it("fails closed before resolver use without auth, access, configuration, or exact project binding", async () => {
    const unconfigured = app();
    assert.equal((await unconfigured.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" })).statusCode, 503);
    await unconfigured.close();

    let called = false;
    const forbidden = app({ access: false, resolver: () => { called = true; return null; } });
    assert.equal((await forbidden.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" })).statusCode, 403);
    await forbidden.close();
    assert.equal(called, false);

    const wrong = { ...project(), projectId: "other" };
    const mismatched = app({ resolver: () => ({ project: wrong, workers: [], evidenceVerifier: verifier }) });
    assert.equal((await mismatched.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" })).statusCode, 503);
    await mismatched.close();

    const unauthenticated = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { projectAccess: { hasProjectAccess: () => true }, studioCompilationRouting: { resolve: () => ({ project: project(), workers: [], evidenceVerifier: verifier }) } },
    });
    assert.equal((await unauthenticated.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" })).statusCode, 401);
    await unauthenticated.close();
  });

  it("requires an injected verifier and admits only its exact tenant/project/target evidence", async () => {
    const capability = project();
    const missingVerifier = app({ resolver: () => ({ project: capability, workers: [windowsWorker(capability)] }) });
    assert.equal((await missingVerifier.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" })).statusCode, 503);
    await missingVerifier.close();

    const exact = app({ resolver: () => ({ project: capability, workers: [windowsWorker(capability)], evidenceVerifier: verifier }) });
    const exactResponse = await exact.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" });
    await exact.close();
    assert.equal(exactResponse.statusCode, 200);
    assert.equal(exactResponse.json().routes.find((route: { target: string }) => route.target === "flutterWindows").compilerAvailability, "available");

    for (const replay of [
      windowsWorker(capability, { tenantId: "ten_2" }),
      windowsWorker(capability, { projectId: "other_project" }),
      windowsWorker(capability, { target: "flutterAndroid" }),
    ]) {
      const rejected = app({ resolver: () => ({ project: capability, workers: [replay], evidenceVerifier: verifier }) });
      const response = await rejected.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" });
      await rejected.close();
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().routes.find((route: { target: string }) => route.target === "flutterWindows").reason, "workerUnproved");
    }
  });

  it("rejects a stale artifact digest before projecting routes", async () => {
    const capability = project();
    const stale = { ...capability, artifactDigests: [{ path: "app/pubspec.lock", digest: "9".repeat(64) }, ...(capability.artifactDigests?.slice(1) ?? [])] };
    const runner = app({ resolver: () => ({ project: stale, workers: [], evidenceVerifier: verifier }) });
    assert.equal((await runner.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/compilation-routing" })).statusCode, 503);
    await runner.close();
  });

  it("does not widen the Astro capability or compile-intent contracts", async () => {
    const runner = app({ resolver: () => ({ project: project(), workers: [], evidenceVerifier: verifier }) });
    const capability = await runner.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    const compile = await runner.inject({
      method: "POST", url: "/v1/projects/shipglows_app/studio-sessions/ses_1/compile-intents",
      headers: { origin: "http://127.0.0.1:3005", "idempotency-key": "route_test_1" },
      payload: { variantId: "var_1", artifactTarget: "flutterWindows" },
    });
    await runner.close();
    assert.equal(capability.statusCode, 503);
    assert.equal(compile.statusCode, 400);
  });
});
