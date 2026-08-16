import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import {
  createTrustedBaseStudioCapability,
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
        requestedCapabilities: ["inspect"],
      }),
    });
    const response = await runner.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    await runner.close();
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().previewOrigin, "http://127.0.0.1:3003");
    assert.equal(response.json().surfaces.length, 8);
    assert.deepEqual(response.json().capabilities, ["inspect"]);
    assert.doesNotMatch(response.body, /path|revision|digest|credential|token/i);
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
      requestedCapabilities: ["inspect" as const],
    };
    assert.equal(createTrustedBaseStudioCapability({ ...base, projectId: "customer" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, expectedSourceRevision: "different" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, previewOrigin: "http://localhost:3003" }), null);
    assert.equal(createTrustedBaseStudioCapability({ ...base, requestedCapabilities: ["token.set"] }), null);
  });
});
