import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import type { GitHubRepositoryBinding } from "../../src/github/index.js";
import {
  GitHubAppGitTransport,
  GitWorkspaceError,
  LocalWorkspaceManager,
  PathContainmentError,
  ProcessGitCommand,
  ProjectBusyError,
} from "../../src/workspaces/index.js";
import type { GitRepositoryTransport } from "../../src/workspaces/index.js";

async function temporaryRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "shipglows-runner-workspaces-"));
}

const binding: GitHubRepositoryBinding = {
  installationId: 42,
  repositoryId: 101,
  fullName: "shipglows/fixture",
  defaultBranch: "main",
};

class LocalGitFixtureTransport implements GitRepositoryTransport {
  readonly #git = new ProcessGitCommand();

  constructor(private readonly source: string) {}

  async ensureMirror(input: { readonly binding: GitHubRepositoryBinding; readonly mirrorPath: string }): Promise<void> {
    assert.equal(input.binding.repositoryId, binding.repositoryId);
    try {
      await this.#git.run({ args: ["-C", input.mirrorPath, "rev-parse", "--is-bare-repository"] });
      await this.#git.run({ args: ["-C", input.mirrorPath, "fetch", "--prune", "origin"] });
    } catch {
      await this.#git.run({ args: ["clone", "--mirror", this.source, input.mirrorPath] });
    }
  }

  addAuditWorktree(input: { readonly mirrorPath: string; readonly workspacePath: string; readonly revision: string }): Promise<void> {
    return this.#git.run({
      args: ["-C", input.mirrorPath, "worktree", "add", "--detach", input.workspacePath, input.revision],
    });
  }

  addFixWorktree(input: { readonly mirrorPath: string; readonly workspacePath: string; readonly revision: string; readonly branch: string }): Promise<void> {
    return this.#git.run({
      args: ["-C", input.mirrorPath, "worktree", "add", "-b", input.branch, input.workspacePath, input.revision],
    });
  }

  removeWorktree(input: { readonly mirrorPath: string; readonly workspacePath: string }): Promise<void> {
    return this.#git.run({ args: ["-C", input.mirrorPath, "worktree", "remove", "--force", input.workspacePath] });
  }
}

async function sourceRepository(root: string): Promise<string> {
  const source = join(root, "source");
  const git = new ProcessGitCommand();
  await git.run({ args: ["init", "--initial-branch=main", source] });
  await git.run({ args: ["-C", source, "config", "user.email", "shipglows@example.test"] });
  await git.run({ args: ["-C", source, "config", "user.name", "ShipGlows Test"] });
  await writeFile(join(source, "README.md"), "managed fixture\n");
  await git.run({ args: ["-C", source, "add", "README.md"] });
  await git.run({ args: ["-C", source, "commit", "-m", "fixture"] });
  return source;
}

describe("managed workspace containment", () => {
  it("rejects traversal outside a server-owned opaque workspace", async () => {
    const manager = await LocalWorkspaceManager.create({ root: await temporaryRoot() });
    const workspace = await manager.allocateAudit({
      projectId: "prj_000000000001",
      conversationId: "cnv_000000000001",
    });

    await assert.rejects(
      manager.withInternalPath(workspace, "../escape", async () => undefined),
      PathContainmentError,
    );
    await manager.close();
  });

  it("rejects an existing symlink that escapes the workspace", async () => {
    const root = await temporaryRoot();
    const outside = join(root, "outside");
    await mkdir(outside);
    const manager = await LocalWorkspaceManager.create({ root: join(root, "owned") });
    const workspace = await manager.allocateAudit({
      projectId: "prj_000000000001",
      conversationId: "cnv_000000000001",
    });
    await manager.withInternalPath(workspace, "", async (workspaceRoot) => {
      await symlink(outside, join(workspaceRoot, "escape-link"));
    });

    await assert.rejects(
      manager.withInternalPath(workspace, "escape-link/private.txt", async () => undefined),
      PathContainmentError,
    );
    await manager.close();
  });
});

describe("managed Git mirrors and worktrees", () => {
  it("uses a verified GitHub binding without putting an installation token in the URL or Git arguments", async () => {
    const root = await temporaryRoot();
    const commands: { readonly args: readonly string[]; readonly environment?: Readonly<Record<string, string>> }[] = [];
    let verified = false;
    const transport = new GitHubAppGitTransport(
      {
        run: async (command) => { commands.push(command); },
      },
      async (verifiedBinding, callback) => {
        assert.deepEqual(verifiedBinding, binding);
        verified = true;
        return callback({
          id: binding.repositoryId,
          fullName: binding.fullName,
          defaultBranch: binding.defaultBranch,
          private: true,
          archived: false,
        }, "ghs_server_only_token");
      },
    );

    await transport.ensureMirror({ binding, mirrorPath: join(root, "mirror.git") });

    assert.equal(verified, true);
    assert.equal(commands.length, 1);
    const command = commands[0];
    assert.ok(command);
    assert.deepEqual(command.args, [
      "clone",
      "--mirror",
      "--no-checkout",
      "https://github.com/shipglows/fixture.git",
      join(root, "mirror.git"),
    ]);
    assert.doesNotMatch(JSON.stringify(command.args), /ghs_/);
    assert.match(command.environment?.["GIT_CONFIG_VALUE_0"] ?? "", /^Authorization: Bearer ghs_/);
  });

  it("creates a detached audit worktree from a local Git fixture", async () => {
    const root = await temporaryRoot();
    const source = await sourceRepository(root);
    const manager = await LocalWorkspaceManager.create({ root: join(root, "owned") });
    const workspace = await manager.createAuditWorktree({
      projectId: "prj_000000000001",
      conversationId: "cnv_000000000001",
      binding,
      transport: new LocalGitFixtureTransport(source),
    });

    assert.equal(workspace.kind, "audit");
    assert.equal(await readFile(join(workspace.root, "README.md"), "utf8"), "managed fixture\n");
    assert.doesNotMatch(workspace.root, /shipglows\/fixture|github\.com/);
    await manager.close();
  });

  it("creates a dedicated local branch for a fix and cleans abandoned worktrees", async () => {
    const root = await temporaryRoot();
    const source = await sourceRepository(root);
    const transport = new LocalGitFixtureTransport(source);
    const manager = await LocalWorkspaceManager.create({ root: join(root, "owned") });
    const workspace = await manager.createFixWorktree({
      projectId: "prj_000000000001",
      conversationId: "cnv_000000000002",
      binding,
      transport,
    });
    await utimes(workspace.root, new Date("2020-01-01T00:00:00.000Z"), new Date("2020-01-01T00:00:00.000Z"));

    const removed = await manager.cleanupAbandonedWorkspaces({
      olderThan: new Date("2021-01-01T00:00:00.000Z"),
      transport,
      repositoryIdFor: (projectId) => projectId === "prj_000000000001" ? binding.repositoryId : undefined,
    });

    assert.equal(removed, 1);
    await assert.rejects(readFile(join(workspace.root, "README.md")), /ENOENT/);
    await manager.close();
  });

  it("does not accept a client-shaped identifier as a workspace path", async () => {
    const manager = await LocalWorkspaceManager.create({ root: await temporaryRoot() });
    await assert.rejects(
      manager.createAuditWorktree({
        projectId: "../project",
        conversationId: "cnv_000000000001",
        binding,
        transport: new LocalGitFixtureTransport("/not-used"),
      }),
      PathContainmentError,
    );
    await assert.rejects(
      manager.createAuditWorktree({
        projectId: "prj_000000000001",
        conversationId: "cnv_000000000001",
        binding: { ...binding, defaultBranch: "../../main" },
        transport: new LocalGitFixtureTransport("/not-used"),
      }),
      GitWorkspaceError,
    );
    await manager.close();
  });
});

describe("per-project mutation lock", () => {
  it("rejects a second concurrent mutating operation for one project", async () => {
    const manager = await LocalWorkspaceManager.create({ root: await temporaryRoot() });
    let releaseFirst!: () => void;
    const holdFirst = new Promise<void>((resolve) => { releaseFirst = resolve; });
    let enteredFirst!: () => void;
    const firstEntered = new Promise<void>((resolve) => { enteredFirst = resolve; });
    const first = manager.withProjectMutation("prj_000000000001", async () => {
      enteredFirst();
      await holdFirst;
    });
    await firstEntered;

    await assert.rejects(
      manager.withProjectMutation("prj_000000000001", async () => undefined),
      ProjectBusyError,
    );
    releaseFirst();
    await first;
    await manager.close();
  });
});
