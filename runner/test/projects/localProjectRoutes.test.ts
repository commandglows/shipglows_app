import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import { LOCAL_STUDIO_TENANT_ID, LOCAL_STUDIO_USER_ID, createLocalStudioProjectCatalog } from "../../src/projects/localStudioProjectCatalog.js";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "shipglows-project-routes-"));
  roots.push(root);
  for (const folder of ["shipglows_app", "gocharbon", "new-project"]) mkdirSync(resolve(root, folder, ".git"), { recursive: true });
  const catalog = createLocalStudioProjectCatalog({
    storagePath: resolve(root, "state", "projects.json"), allowedRoot: root, studioProjectId: "shipglows_app",
    builtinProjects: [
      { id: "shipglows_app", name: "ShipGlows", repositoryFullName: "shipglows/shipglows_app", repositoryPath: resolve(root, "shipglows_app") },
      { id: "gocharbon", name: "GoCharbon", repositoryFullName: "shipglows/gocharbon", repositoryPath: resolve(root, "gocharbon") },
    ],
  });
  const config = loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005" });
  const authentication = { authenticate: () => Promise.resolve({ tenantId: LOCAL_STUDIO_TENANT_ID, userId: LOCAL_STUDIO_USER_ID, subject: "local" }) };
  const app = buildRunnerApp({ config, dependencies: { authentication, projectAccess: catalog.projectAccess, cockpitStore: catalog.cockpitStore, localProjectManagement: catalog.management } });
  return { root, app };
}

describe("local project management routes", () => {
  it("lists redacted projects and connects only from the trusted origin", async () => {
    const { root, app } = fixture();
    const listed = await app.inject({ method: "GET", url: "/v1/local-projects" });
    assert.equal(listed.statusCode, 200);
    assert.equal(JSON.stringify(listed.json()).includes("repositoryPath"), false);

    const denied = await app.inject({ method: "POST", url: "/v1/local-projects", headers: { origin: "https://evil.example" }, payload: { repositoryPath: resolve(root, "new-project") } });
    assert.equal(denied.statusCode, 403);
    const connected = await app.inject({ method: "POST", url: "/v1/local-projects", headers: { origin: "http://127.0.0.1:3005" }, payload: { repositoryPath: resolve(root, "new-project"), name: "New" } });
    assert.equal(connected.statusCode, 201);
    assert.equal(connected.json().name, "New");
    assert.equal(JSON.stringify(connected.json()).includes("repositoryPath"), false);
    await app.close();
  });
});
