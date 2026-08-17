import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import type { GitHubProjectSource } from "../../src/projects/githubProjectSource.js";
import { LOCAL_STUDIO_TENANT_ID, LOCAL_STUDIO_USER_ID, createLocalStudioProjectCatalog } from "../../src/projects/localStudioProjectCatalog.js";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "shipglows-github-project-routes-"));
  roots.push(root);
  mkdirSync(resolve(root, "shipglows_app", ".git"), { recursive: true });
  const catalog = createLocalStudioProjectCatalog({
    storagePath: resolve(root, "state", "projects.json"), allowedRoot: root, studioProjectId: "shipglows_app",
    builtinProjects: [{ id: "shipglows_app", name: "ShipGlows", repositoryFullName: "shipglows/shipglows_app", repositoryPath: resolve(root, "shipglows_app") }],
  });
  const source: GitHubProjectSource = {
    status: () => Promise.resolve({ state: "ready", message: "Repositories are ready.", accountLabel: "ShipGlows" }),
    beginSetup: () => Promise.resolve({ actionUrl: "https://github.com/apps/shipglows/installations/new?state=opaque", setupUrl: "http://127.0.0.1:3005/projects/github/setup", expiresAt: "2026-08-17T12:10:00.000Z" }),
    completeSetup: () => Promise.resolve({ state: "ready", message: "Repositories are ready.", accountLabel: "ShipGlows" }),
    disconnect: () => Promise.resolve(),
    listRepositories: () => Promise.resolve({ repositories: [{
      candidateId: "candidate_shipglows", fullName: "shipglows/shipglows_app", defaultBranch: "main", visibility: "private", archived: false,
    }], nextCursor: null }),
    selectRepository: ({ candidateId }) => Promise.resolve({
      candidateId, installationId: 42, repositoryId: 101, fullName: "shipglows/shipglows_app", defaultBranch: "main", visibility: "private", archived: false,
    }),
  };
  const config = loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005" });
  const authentication = { authenticate: () => Promise.resolve({ tenantId: LOCAL_STUDIO_TENANT_ID, userId: LOCAL_STUDIO_USER_ID, subject: "local" }) };
  const app = buildRunnerApp({ config, dependencies: {
    authentication, projectAccess: catalog.projectAccess, cockpitStore: catalog.cockpitStore,
    localProjectManagement: catalog.management, githubProjectSource: source,
  } });
  return { app };
}

describe("GitHub project source routes", () => {
  it("lists only redacted candidates and requires explicit trusted-origin selection", async () => {
    const { app } = fixture();
    const status = await app.inject({ method: "GET", url: "/v1/project-sources/github" });
    assert.equal(status.statusCode, 200);
    assert.equal(status.json().state, "ready");

    const deniedSetup = await app.inject({ method: "POST", url: "/v1/project-sources/github/setup", headers: { origin: "https://evil.example" } });
    assert.equal(deniedSetup.statusCode, 403);
    const setup = await app.inject({ method: "POST", url: "/v1/project-sources/github/setup", headers: { origin: "http://127.0.0.1:3005" } });
    assert.equal(setup.statusCode, 200);
    assert.equal(JSON.stringify(setup.json()).includes("installationId"), false);
    const completed = await app.inject({
      method: "POST",
      url: "/v1/project-sources/github/setup/complete",
      headers: { origin: "http://127.0.0.1:3005" },
      payload: { installationId: 42, state: "opaque_setup_state" },
    });
    assert.equal(completed.statusCode, 200);
    assert.equal(JSON.stringify(completed.json()).includes("42"), false);

    const repositories = await app.inject({ method: "GET", url: "/v1/project-sources/github/repositories" });
    assert.equal(repositories.statusCode, 200);
    assert.equal(repositories.json().repositories[0].candidateId, "candidate_shipglows");
    assert.equal(JSON.stringify(repositories.json()).includes("installationId"), false);

    const denied = await app.inject({ method: "POST", url: "/v1/project-sources/github/projects", headers: { origin: "https://evil.example" }, payload: { candidateId: "candidate_shipglows" } });
    assert.equal(denied.statusCode, 403);
    const connected = await app.inject({ method: "POST", url: "/v1/project-sources/github/projects", headers: { origin: "http://127.0.0.1:3005" }, payload: { candidateId: "candidate_shipglows" } });
    assert.equal(connected.statusCode, 201);
    assert.deepEqual(connected.json().sourceKinds, ["local", "github"]);
    assert.equal(JSON.stringify(connected.json()).includes("installationId"), false);
    const disconnected = await app.inject({ method: "DELETE", url: "/v1/project-sources/github", headers: { origin: "http://127.0.0.1:3005" } });
    assert.equal(disconnected.statusCode, 204);
    await app.close();
  });
});
