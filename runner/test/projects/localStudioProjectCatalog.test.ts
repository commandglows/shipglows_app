import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";

import { HttpError } from "../../src/contracts/index.js";
import { LOCAL_STUDIO_TENANT_ID, LOCAL_STUDIO_USER_ID, createLocalStudioProjectCatalog } from "../../src/projects/localStudioProjectCatalog.js";

const temporaryRoots: string[] = [];
afterEach(() => { for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "shipglows-projects-"));
  temporaryRoots.push(root);
  for (const folder of ["shipglows_app", "gocharbon", "third"]) mkdirSync(resolve(root, folder, ".git"), { recursive: true });
  const storagePath = resolve(root, "state", "projects.json");
  const catalog = createLocalStudioProjectCatalog({
    storagePath,
    allowedRoot: root,
    studioProjectId: "gocharbon",
    builtinProjects: [
      { id: "shipglows_app", name: "ShipGlows", repositoryFullName: "shipglows/shipglows_app", repositoryPath: resolve(root, "shipglows_app") },
      { id: "gocharbon", name: "GoCharbon", repositoryFullName: "shipglows/gocharbon", repositoryPath: resolve(root, "gocharbon") },
    ],
  });
  return { root, storagePath, catalog, actor: { tenantId: LOCAL_STUDIO_TENANT_ID, userId: LOCAL_STUDIO_USER_ID } };
}

describe("local project registry", () => {
  it("persists built-ins and exposes no repository path", () => {
    const { catalog, storagePath, actor } = fixture();
    const projects = catalog.management.list(actor);
    assert.deepEqual(projects.map((project) => project.id), ["shipglows_app", "gocharbon"]);
    assert.equal(projects[1]?.studioAvailable, true);
    assert.equal(Object.hasOwn(projects[0] ?? {}, "repositoryPath"), false);
    assert.match(readFileSync(storagePath, "utf8"), /repositoryPath/);
  });

  it("connects, archives, restores and disconnects without changing Git files", () => {
    const { root, catalog, actor } = fixture();
    const connected = catalog.management.connect({ ...actor, repositoryPath: resolve(root, "third"), name: "Third" });
    assert.match(connected.id, /^local_/);
    assert.equal(catalog.cockpitStore.listCockpitProjects(actor).length, 3);
    catalog.management.update({ ...actor, projectId: connected.id, isArchived: true });
    assert.equal(catalog.cockpitStore.listCockpitProjects(actor).length, 2);
    catalog.management.update({ ...actor, projectId: connected.id, isArchived: false });
    catalog.management.disconnect({ ...actor, projectId: connected.id });
    assert.equal(catalog.management.list(actor).length, 2);
    assert.equal(existsSync(resolve(root, "third", ".git")), true);
  });

  it("keeps generic project mutation denied and protects boundaries", async () => {
    const { root, catalog, actor } = fixture();
    assert.equal(await catalog.projectAccess.hasProjectAccess({ ...actor, projectId: "gocharbon", capability: "read" }), true);
    assert.equal(await catalog.projectAccess.hasProjectAccess({ ...actor, projectId: "gocharbon", capability: "mutate" }), false);
    assert.throws(() => catalog.management.connect({ ...actor, repositoryPath: resolve(root, "missing") }), HttpError);
    assert.throws(() => catalog.management.disconnect({ ...actor, projectId: "gocharbon" }), /Built-in/);
    assert.deepEqual(catalog.management.list({ tenantId: "other", userId: actor.userId }), []);
  });

  it("maintains one default and refuses to archive it", () => {
    const { catalog, actor } = fixture();
    catalog.management.update({ ...actor, projectId: "gocharbon", isDefault: true });
    assert.deepEqual(catalog.management.list(actor).filter((project) => project.isDefault).map((project) => project.id), ["gocharbon"]);
    assert.throws(() => catalog.management.update({ ...actor, projectId: "gocharbon", isArchived: true }), /default/);
  });

  it("reconciles an explicitly selected GitHub repository with its local origin", () => {
    const { root, catalog, actor } = fixture();
    writeFileSync(resolve(root, "third", ".git", "config"), '[remote "origin"]\n\turl = git@github.com:shipglows/third.git\n');
    const local = catalog.management.connect({ ...actor, repositoryPath: resolve(root, "third") });
    assert.deepEqual(local.sourceKinds, ["local"]);

    const reconciled = catalog.management.connectGitHub({
      ...actor,
      repository: {
        candidateId: "candidate_third",
        installationId: 42,
        repositoryId: 101,
        fullName: "ShipGlows/third",
        defaultBranch: "main",
        visibility: "private",
        archived: false,
      },
    });

    assert.equal(reconciled.id, local.id);
    assert.deepEqual(reconciled.sourceKinds, ["local", "github"]);
    assert.equal(reconciled.readiness, "ready");
    assert.equal(JSON.stringify(reconciled).includes("installationId"), false);
    assert.equal(JSON.stringify(reconciled).includes(resolve(root, "third")), false);
    assert.equal(catalog.management.list(actor).length, 3);
  });

  it("creates one GitHub-only project and keeps explicit selection idempotent", () => {
    const { catalog, actor } = fixture();
    const repository = {
      candidateId: "candidate_cloud",
      installationId: 43,
      repositoryId: 202,
      fullName: "shipglows/cloud-project",
      defaultBranch: "main",
      visibility: "public" as const,
      archived: false,
    };
    const first = catalog.management.connectGitHub({ ...actor, repository });
    const second = catalog.management.connectGitHub({ ...actor, repository });
    assert.equal(first.id, second.id);
    assert.deepEqual(first.sourceKinds, ["github"]);
    assert.equal(first.capabilities.cockpit, true);
    assert.equal(first.capabilities.studio, false);
    assert.equal(catalog.management.list(actor).length, 3);
  });

  it("keeps a stale GitHub-only project visible while gating access until restoration", async () => {
    const { catalog, actor } = fixture();
    const connected = catalog.management.connectGitHub({
      ...actor,
      repository: {
        candidateId: "candidate_access",
        installationId: 44,
        repositoryId: 303,
        fullName: "shipglows/access-project",
        defaultBranch: "main",
        visibility: "private",
        archived: false,
      },
    });
    catalog.management.updateGitHubReadiness({ ...actor, installationId: 44, state: "degraded" });
    const degraded = catalog.management.list(actor).find((project) => project.id === connected.id);
    assert.ok(degraded);
    assert.equal(degraded.readiness, "degraded");
    assert.equal(degraded.capabilities.conversations, false);
    assert.equal(await catalog.projectAccess.hasProjectAccess({ ...actor, projectId: connected.id, capability: "read" }), false);

    catalog.management.updateGitHubReadiness({ ...actor, installationId: 44, state: "accessLost" });
    const stale = catalog.management.list(actor).find((project) => project.id === connected.id);
    assert.ok(stale);
    assert.equal(stale.readiness, "accessLost");
    assert.equal(stale.capabilities.cockpit, true);
    assert.equal(stale.capabilities.conversations, false);
    assert.equal(await catalog.projectAccess.hasProjectAccess({ ...actor, projectId: connected.id, capability: "read" }), false);

    catalog.management.updateGitHubReadiness({ ...actor, installationId: 44, state: "ready" });
    const restored = catalog.management.list(actor).find((project) => project.id === connected.id);
    assert.ok(restored);
    assert.equal(restored.readiness, "ready");
    assert.equal(restored.capabilities.conversations, true);
    assert.equal(await catalog.projectAccess.hasProjectAccess({ ...actor, projectId: connected.id, capability: "read" }), true);
  });

  it("isolates readiness loss and restoration by private installation binding", () => {
    const { catalog, actor } = fixture();
    const first = catalog.management.connectGitHub({
      ...actor,
      repository: {
        candidateId: "candidate_first",
        installationId: 51,
        repositoryId: 401,
        fullName: "shipglows/first-installation",
        defaultBranch: "main",
        visibility: "private",
        archived: false,
      },
    });
    const second = catalog.management.connectGitHub({
      ...actor,
      repository: {
        candidateId: "candidate_second",
        installationId: 52,
        repositoryId: 402,
        fullName: "shipglows/second-installation",
        defaultBranch: "main",
        visibility: "private",
        archived: false,
      },
    });

    catalog.management.updateGitHubReadiness({ ...actor, installationId: 51, state: "accessLost" });
    let projects = catalog.management.list(actor);
    assert.equal(projects.find((project) => project.id === first.id)?.readiness, "accessLost");
    assert.equal(projects.find((project) => project.id === second.id)?.readiness, "ready");

    catalog.management.updateGitHubReadiness({ ...actor, installationId: 51, state: "ready" });
    projects = catalog.management.list(actor);
    assert.equal(projects.find((project) => project.id === first.id)?.readiness, "ready");
    assert.equal(projects.find((project) => project.id === second.id)?.readiness, "ready");
  });
});
