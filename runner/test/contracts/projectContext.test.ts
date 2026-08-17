import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import type { ActorContext } from "../../src/auth/index.js";
import { loadConfig } from "../../src/config.js";
import type { ProjectContextBundle } from "../../src/skills/contracts.js";

const actor: ActorContext = {
  tenantId: "ten_context_000001",
  userId: "usr_context_000001",
  subject: "context-user",
};
const projectId = "prj_context_000001";

describe("read-only project context projection", () => {
  it("returns only bounded provenance counts for the actor project", async () => {
    const observed: string[] = [];
    const app = appWith({
      getLatestProjectContextBundle: (input) => {
        observed.push(`${input.tenantId}:${input.projectId}`);
        return bundle();
      },
    });
    const response = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/context`,
    });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(observed, [`${actor.tenantId}:${projectId}`]);
    assert.deepEqual(response.json(), {
      projectId,
      status: "stale",
      observedAt: "2026-07-01T10:00:00.000Z",
      sourceCommit: "abc123",
      repositorySnapshotCount: 1,
      shipglowsArtifactCount: 1,
      redactionCount: 3,
    });
    assert.equal(JSON.stringify(response.json()).includes("private/path"), false);
    assert.equal(JSON.stringify(response.json()).includes("a".repeat(64)), false);
  });

  it("returns an honest missing state without a stored bundle", async () => {
    const app = appWith({ getLatestProjectContextBundle: () => undefined });
    const response = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/context`,
    });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().status, "missing");
    assert.equal(response.json().sourceCommit, null);
  });

  it("distinguishes an unavailable projection from missing context", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
      },
    });
    const response = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/context`,
    });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "projectContextUnavailable");
  });

  it("fails closed on lost project access for reads and refreshes", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => false },
        projectContextStore: { getLatestProjectContextBundle: () => bundle() },
      },
    });
    const forbidden = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/context`,
    });
    const mutation = await app.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/context/refresh`,
      headers: { "idempotency-key": "refresh-denied" },
      payload: {},
    });
    await app.close();

    assert.equal(forbidden.statusCode, 403);
    assert.equal(mutation.statusCode, 403);
  });

  it("refreshes through origin, project and idempotency controls without exposing sources", async () => {
    let refreshes = 0;
    let callbacks = 0;
    let saved: { statusCode: number; body: unknown } | undefined;
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: (input) => input.capability === "read" },
        projectContextStore: { getLatestProjectContextBundle: () => undefined },
        projectContextGenerator: {
          refresh: async (input) => {
            refreshes += 1;
            assert.deepEqual(input, { tenantId: actor.tenantId, userId: actor.userId, projectId });
            return bundle();
          },
        },
        idempotencyStore: {
          executeIdempotentAsync: async (_input, callback) => {
            if (saved !== undefined) return { replayed: true, response: saved } as never;
            callbacks += 1;
            saved = await callback();
            return { replayed: false, response: saved } as never;
          },
        },
      },
    });
    const request = () => app.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/context/refresh`,
      headers: { origin: "http://127.0.0.1:3005", "idempotency-key": "refresh-context-1" },
      payload: {},
    });
    const first = await request();
    const replay = await request();
    const denied = await app.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/context/refresh`,
      headers: { origin: "http://localhost:3005", "idempotency-key": "refresh-context-2" },
      payload: {},
    });
    const missingKey = await app.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/context/refresh`,
      headers: { origin: "http://127.0.0.1:3005" },
      payload: {},
    });
    const extensibleBody = await app.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/context/refresh`,
      headers: { origin: "http://127.0.0.1:3005", "idempotency-key": "refresh-context-3" },
      payload: { repositoryPath: "private/path" },
    });
    await app.close();

    assert.equal(first.statusCode, 200);
    assert.equal(replay.statusCode, 200);
    assert.equal(denied.statusCode, 403);
    assert.equal(missingKey.statusCode, 400);
    assert.equal(extensibleBody.statusCode, 400);
    assert.equal(callbacks, 1);
    assert.equal(refreshes, 1);
    assert.equal(JSON.stringify(first.json()).includes("private/path"), false);
    assert.equal(JSON.stringify(first.json()).includes("a".repeat(64)), false);
  });
});

function appWith(store: {
  getLatestProjectContextBundle(input: {
    readonly tenantId: string;
    readonly projectId: string;
  }): ProjectContextBundle | undefined;
}) {
  return buildRunnerApp({
    config: loadConfig({ RUNNER_ENV: "test" }),
    dependencies: {
      authentication: { authenticate: async () => actor },
      projectAccess: { hasProjectAccess: () => true },
      projectContextStore: store,
    },
  });
}

function bundle(): ProjectContextBundle {
  return {
    schemaVersion: "shipglows.project-context.v1",
    bundleId: "ctx_context_000001",
    tenantId: actor.tenantId,
    projectId,
    sourceCommit: "abc123",
    createdAt: "2026-07-01T10:00:00.000Z",
    sources: [
      {
        kind: "repositorySnapshot",
        reference: "private/path",
        sha256: "a".repeat(64),
      },
      {
        kind: "shipglowsArtifact",
        reference: "shipglows_data/business/product.md",
        sha256: "b".repeat(64),
      },
    ],
    redactionCount: 3,
  };
}
