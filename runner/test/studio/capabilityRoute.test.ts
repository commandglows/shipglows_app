import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import {
  createTrustedBaseStudioCapability,
  STUDIO_PREVIEW_CAPABILITIES,
  type StudioCapabilityResolver,
} from "../../src/studio/capability.js";

const actor = {
  tenantId: "ten_000000000001",
  userId: "usr_000000000001",
  subject: "firebase-user-000000000001",
};

function app(capability?: StudioCapabilityResolver) {
  const studio = capability === undefined ? {} : { studioCapability: capability };
  return buildRunnerApp({
    config: loadConfig({ RUNNER_ENV: "test" }),
    dependencies: {
      authentication: { authenticate: async () => actor },
      projectAccess: {
        hasProjectAccess: ({ projectId }) => projectId === "shipglows_app",
      },
      ...studio,
    },
  });
}

describe("Studio capability route", () => {
  it("returns only the exact safe trusted-base projection", async () => {
    const digest = "a".repeat(64);
    const runner = app({
      resolve: () => createTrustedBaseStudioCapability({
        projectId: "shipglows_app",
        previewOrigin: "http://127.0.0.1:3003",
        sourceRevision: "afacc09",
        expectedSourceRevision: "afacc09",
        repositoryDigest: digest,
        expectedRepositoryDigest: digest,
        requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES,
      }),
    });
    const response = await runner.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    await runner.close();
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().previewOrigin, "http://127.0.0.1:3003");
    assert.equal(response.json().sourceRevision, "afacc09");
    assert.equal(response.json().repositoryDigest, digest);
    assert.equal(response.json().surfaces.length, 8);
    assert.deepEqual(response.json().capabilities, STUDIO_PREVIEW_CAPABILITIES);
    assert.deepEqual(response.json().expectedPaths, ["site/src/components/Hero.astro"]);
    assert.equal(response.json().compileAdmission.reason, "workerIsolationUnavailable");
    assert.deepEqual(response.json().surfaces[2].capabilities, ["opacity.set", "transform.set", "visibility.set", "motion.duration", "motion.easing"]);
    assert.doesNotMatch(response.body, /credential|javascript|selector|shell/i);
  });

  it("projects the separately allowlisted GoCharbon Hero profile", async () => {
    const digest = "b".repeat(64);
    const capability = createTrustedBaseStudioCapability({
      projectId: "gocharbon",
      previewOrigin: "http://127.0.0.1:3002",
      sourceRevision: "bcdef12",
      expectedSourceRevision: "bcdef12",
      repositoryDigest: digest,
      expectedRepositoryDigest: digest,
      requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES,
    });
    assert.ok(capability);
    assert.equal(capability.profileId, "gocharbon.astro.hero.v1");
    assert.equal(capability.previewOrigin, "http://127.0.0.1:3002");
    assert.deepEqual(capability.expectedPaths, ["site/src/pages/index.astro"]);
    assert.deepEqual(capability.surfaces.map((surface) => surface.id), ["hero.root", "hero.copy", "hero.eyebrow", "hero.title", "hero.intro", "hero.actions", "hero.miner", "hero.depth"]);
    assert.equal(createTrustedBaseStudioCapability({
      projectId: "gocharbon",
      previewOrigin: "http://127.0.0.1:3003",
      sourceRevision: "bcdef12",
      expectedSourceRevision: "bcdef12",
      repositoryDigest: digest,
      expectedRepositoryDigest: digest,
      requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES,
    }), null);
  });

  it("fails closed without a configured resolver or project access", async () => {
    const unavailable = app();
    const response = await unavailable.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    await unavailable.close();
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "studioUnavailable");

    const forbidden = app();
    const denied = await forbidden.inject({ method: "GET", url: "/v1/projects/customer/studio/capability" });
    await forbidden.close();
    assert.equal(denied.statusCode, 403);
  });

  it("rejects profile, revision, origin, and writable capability mismatches", () => {
    const digest = "a".repeat(64);
    const base = {
      projectId: "shipglows_app",
      previewOrigin: "http://127.0.0.1:3003",
      sourceRevision: "afacc09",
      expectedSourceRevision: "afacc09",
      repositoryDigest: digest,
      expectedRepositoryDigest: digest,
      requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES,
    };
    assert.equal(createTrustedBaseStudioCapability({ ...base, projectId: "customer" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, expectedSourceRevision: "different" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, previewOrigin: "http://localhost:3003" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, previewOrigin: "http://user:pass@127.0.0.1:3003" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, repositoryDigest: "z".repeat(64), expectedRepositoryDigest: "z".repeat(64) }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, requestedCapabilities: ["token.set"] }), null);
  });

  it("requires authentication, preserves tenant access, and maps resolver failures to unavailable", async () => {
    const resolver: StudioCapabilityResolver = { resolve: () => { throw new Error("private provider failure"); } };
    const unauthenticated = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { projectAccess: { hasProjectAccess: () => true }, studioCapability: resolver },
    });
    const unauthorized = await unauthenticated.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    await unauthenticated.close();
    assert.equal(unauthorized.statusCode, 401);

    let resolved = false;
    const crossTenant = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: (input) => input.tenantId === "another_tenant" },
        studioCapability: { resolve: () => { resolved = true; return null; } },
      },
    });
    const forbidden = await crossTenant.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    await crossTenant.close();
    assert.equal(forbidden.statusCode, 403);
    assert.equal(resolved, false);

    const failing = app(resolver);
    const unavailable = await failing.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    await failing.close();
    assert.equal(unavailable.statusCode, 503);
    assert.equal(unavailable.json().error.code, "studioUnavailable");
  });
});
