import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, it } from "node:test";

import { ProjectDeliveryError, ProjectDeliveryRepository } from "../../src/workspaces/projectDelivery.js";

const exec = promisify(execFile);

async function git(cwd: string, ...args: string[]): Promise<string> {
  const result = await exec("git", args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
  return result.stdout.trim();
}

async function fixture(branch: "main" | "preview" = "main") {
  const root = await mkdtemp(join(tmpdir(), "shipglows-delivery-"));
  const remote = join(root, "remote.git");
  const repository = join(root, "repository");
  await exec("git", ["init", "--bare", remote]);
  await exec("git", ["clone", remote, repository]);
  await git(repository, "config", "user.email", "runner@example.test");
  await git(repository, "config", "user.name", "ShipGlows Runner");
  await git(repository, "switch", "-c", branch);
  await writeFile(join(repository, "tracked.txt"), "initial");
  await git(repository, "add", "tracked.txt");
  await git(repository, "commit", "-m", "initial");
  await git(repository, "push", "-u", "origin", branch);
  return { root, remote, repository };
}

describe("canonical project delivery", () => {
  it("admits a clean canonical main or preview checkout and pushes non-force", async () => {
    const project = await fixture("preview");
    const delivery = new ProjectDeliveryRepository();
    const admitted = await delivery.admit({ root: project.repository, deliveryBranch: "preview" });
    assert.equal(admitted.branch, "preview");
    await writeFile(join(project.repository, "tracked.txt"), "next");
    await git(project.repository, "add", "tracked.txt");
    await git(project.repository, "commit", "-m", "next");
    await delivery.push(admitted);
    assert.equal(await git(project.repository, "rev-parse", "HEAD"), await git(project.remote, "rev-parse", "refs/heads/preview"));
  });

  it("rejects arbitrary branches and dirty checkouts without changing them", async () => {
    const project = await fixture();
    const delivery = new ProjectDeliveryRepository();
    await git(project.repository, "switch", "-c", "feature");
    await assert.rejects(delivery.admit({ root: project.repository, deliveryBranch: "main" }), (error) => error instanceof ProjectDeliveryError && error.code === "deliveryBranchMismatch");
    await git(project.repository, "switch", "main");
    await writeFile(join(project.repository, "tracked.txt"), "dirty");
    await assert.rejects(delivery.admit({ root: project.repository, deliveryBranch: "main" }), (error) => error instanceof ProjectDeliveryError && error.code === "deliveryCheckoutDirty");
    assert.match(await exec("git", ["status", "--short"], { cwd: project.repository }).then((result) => result.stdout), /tracked\.txt/);
  });

  it("rejects a remote advance instead of rebasing or forcing", async () => {
    const project = await fixture();
    const other = join(project.root, "other");
    await exec("git", ["clone", project.remote, other]);
    await git(other, "config", "user.email", "other@example.test");
    await git(other, "config", "user.name", "Other");
    await git(other, "switch", "main");
    await writeFile(join(other, "tracked.txt"), "remote");
    await git(other, "add", "tracked.txt");
    await git(other, "commit", "-m", "remote");
    await git(other, "push", "origin", "main");
    const delivery = new ProjectDeliveryRepository();
    await assert.rejects(delivery.admit({ root: project.repository, deliveryBranch: "main" }), (error) => error instanceof ProjectDeliveryError && error.code === "deliveryRemoteAdvanced");
  });
});
