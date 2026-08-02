import { access, mkdir, readdir, realpath, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

import type { GitHubRepositoryBinding, VerifiedGitHubRepository } from "../github/index.js";

export class PathContainmentError extends Error {}
export class ProjectBusyError extends Error {}
export class GitWorkspaceError extends Error {}

export interface Workspace {
  readonly root: string;
  readonly kind: "audit" | "fix";
}

export interface GitCommand {
  run(input: {
    readonly args: readonly string[];
    readonly cwd?: string;
    readonly environment?: Readonly<Record<string, string>>;
  }): Promise<void>;
}

export interface GitRepositoryTransport {
  ensureMirror(input: {
    readonly binding: GitHubRepositoryBinding;
    readonly mirrorPath: string;
  }): Promise<void>;
  addAuditWorktree(input: {
    readonly mirrorPath: string;
    readonly workspacePath: string;
    readonly revision: string;
  }): Promise<void>;
  addFixWorktree(input: {
    readonly mirrorPath: string;
    readonly workspacePath: string;
    readonly revision: string;
    readonly branch: string;
  }): Promise<void>;
  removeWorktree(input: { readonly mirrorPath: string; readonly workspacePath: string }): Promise<void>;
}

function inside(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new PathContainmentError("Path leaves managed workspace.");
  }
}

function opaqueId(value: string, field: string): void {
  if (!/^[A-Za-z0-9_-]{3,128}$/.test(value)) {
    throw new PathContainmentError(`${field} must be an opaque identifier.`);
  }
}

function revision(value: string): void {
  if (!/^[A-Za-z0-9._/-]{1,255}$/.test(value) || value.includes("..") || value.startsWith("/")) {
    throw new GitWorkspaceError("Git revision is invalid.");
  }
}

async function pathExists(value: string): Promise<boolean> {
  try {
    await access(value);
    return true;
  } catch {
    return false;
  }
}

/** Runs a fixed Git argument list without a shell and without returning output. */
export class ProcessGitCommand implements GitCommand {
  async run(input: {
    readonly args: readonly string[];
    readonly cwd?: string;
    readonly environment?: Readonly<Record<string, string>>;
  }): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("git", [...input.args], {
        cwd: input.cwd,
        env: { ...process.env, ...input.environment, GIT_TERMINAL_PROMPT: "0" },
        shell: false,
        stdio: "ignore",
      });
      child.once("error", () => reject(new GitWorkspaceError("Managed Git operation could not start.")));
      child.once("exit", (code) => {
        if (code === 0) resolve();
        else reject(new GitWorkspaceError("Managed Git operation failed."));
      });
    });
  }
}

/**
 * Production transport. The remote URL is constructed from a verified GitHub
 * binding; the temporary installation token is only injected into Git's child
 * environment and is never included in a URL, argument list, result, or log.
 */
export class GitHubAppGitTransport implements GitRepositoryTransport {
  constructor(
    private readonly git: GitCommand,
    private readonly withVerifiedRepository: <T>(
      binding: GitHubRepositoryBinding,
      callback: (repository: VerifiedGitHubRepository, token: string) => Promise<T> | T,
    ) => Promise<T>,
  ) {}

  async ensureMirror(input: {
    readonly binding: GitHubRepositoryBinding;
    readonly mirrorPath: string;
  }): Promise<void> {
    const remoteUrl = `https://github.com/${input.binding.fullName}.git`;
    await this.withVerifiedRepository(input.binding, async (_repository, token) => {
      const environment = {
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `Authorization: Bearer ${token}`,
      };
      if (await pathExists(input.mirrorPath)) {
        await this.git.run({
          args: ["-C", input.mirrorPath, "fetch", "--prune", "origin"],
          environment,
        });
      } else {
        await this.git.run({
          args: ["clone", "--mirror", "--no-checkout", remoteUrl, input.mirrorPath],
          environment,
        });
      }
    });
  }

  addAuditWorktree(input: {
    readonly mirrorPath: string;
    readonly workspacePath: string;
    readonly revision: string;
  }): Promise<void> {
    return this.git.run({
      args: ["-C", input.mirrorPath, "worktree", "add", "--detach", input.workspacePath, input.revision],
    });
  }

  addFixWorktree(input: {
    readonly mirrorPath: string;
    readonly workspacePath: string;
    readonly revision: string;
    readonly branch: string;
  }): Promise<void> {
    return this.git.run({
      args: ["-C", input.mirrorPath, "worktree", "add", "-b", input.branch, input.workspacePath, input.revision],
    });
  }

  removeWorktree(input: { readonly mirrorPath: string; readonly workspacePath: string }): Promise<void> {
    return this.git.run({
      args: ["-C", input.mirrorPath, "worktree", "remove", "--force", input.workspacePath],
    });
  }
}

export class LocalWorkspaceManager {
  readonly #locks = new Set<string>();

  private constructor(private readonly root: string) {}

  static async create({ root }: { readonly root: string }): Promise<LocalWorkspaceManager> {
    await mkdir(root, { recursive: true });
    return new LocalWorkspaceManager(await realpath(root));
  }

  async allocateAudit(input: {
    readonly projectId: string;
    readonly conversationId: string;
  }): Promise<Workspace> {
    opaqueId(input.projectId, "projectId");
    opaqueId(input.conversationId, "conversationId");
    const workspaceRoot = path.join(this.root, "audit", input.projectId, input.conversationId);
    inside(this.root, workspaceRoot);
    await mkdir(workspaceRoot, { recursive: true });
    return { root: await realpath(workspaceRoot), kind: "audit" };
  }

  async createAuditWorktree(input: {
    readonly projectId: string;
    readonly conversationId: string;
    readonly binding: GitHubRepositoryBinding;
    readonly transport: GitRepositoryTransport;
  }): Promise<Workspace> {
    const { mirrorPath, workspacePath, revision } = this.#managedPaths({
      ...input,
      repositoryId: input.binding.repositoryId,
    });
    if (await pathExists(workspacePath)) {
      throw new GitWorkspaceError("Managed audit workspace already exists.");
    }
    await mkdir(path.dirname(workspacePath), { recursive: true });
    await input.transport.ensureMirror({ binding: input.binding, mirrorPath });
    await input.transport.addAuditWorktree({ mirrorPath, workspacePath, revision });
    return { root: await realpath(workspacePath), kind: "audit" };
  }

  async createFixWorktree(input: {
    readonly projectId: string;
    readonly conversationId: string;
    readonly binding: GitHubRepositoryBinding;
    readonly transport: GitRepositoryTransport;
  }): Promise<Workspace> {
    return this.withProjectMutation(input.projectId, async () => {
      const { mirrorPath, workspacePath, revision } = this.#managedPaths({
        ...input,
        repositoryId: input.binding.repositoryId,
      }, "fix");
      if (await pathExists(workspacePath)) {
        throw new GitWorkspaceError("Managed fix workspace already exists.");
      }
      await mkdir(path.dirname(workspacePath), { recursive: true });
      await input.transport.ensureMirror({ binding: input.binding, mirrorPath });
      const branch = `shipglows/fix/${input.projectId}/${input.conversationId}`;
      await input.transport.addFixWorktree({ mirrorPath, workspacePath, revision, branch });
      return { root: await realpath(workspacePath), kind: "fix" };
    });
  }

  async removeManagedWorktree(input: {
    readonly projectId: string;
    readonly conversationId: string;
    readonly kind: Workspace["kind"];
    readonly repositoryId: number;
    readonly transport: GitRepositoryTransport;
  }): Promise<void> {
    const { mirrorPath, workspacePath } = this.#workspacePaths(input, input.kind);
    if (!await pathExists(workspacePath)) return;
    await input.transport.removeWorktree({ mirrorPath, workspacePath });
  }

  async cleanupAbandonedWorkspaces(input: {
    readonly olderThan: Date;
    readonly transport: GitRepositoryTransport;
    readonly repositoryIdFor: (projectId: string) => number | undefined;
  }): Promise<number> {
    let removed = 0;
    for (const kind of ["audit", "fix"] as const) {
      const kindRoot = path.join(this.root, kind);
      if (!await pathExists(kindRoot)) continue;
      const projects = await readdir(kindRoot, { withFileTypes: true });
      for (const project of projects) {
        if (!project.isDirectory()) continue;
        const repositoryId = input.repositoryIdFor(project.name);
        if (repositoryId === undefined) continue;
        const projectRoot = path.join(kindRoot, project.name);
        const conversations = await readdir(projectRoot, { withFileTypes: true });
        for (const conversation of conversations) {
          if (!conversation.isDirectory()) continue;
          const workspacePath = path.join(projectRoot, conversation.name);
          const metadata = await stat(workspacePath);
          if (metadata.mtime > input.olderThan) continue;
          await this.removeManagedWorktree({
            projectId: project.name,
            conversationId: conversation.name,
            kind,
            repositoryId,
            transport: input.transport,
          });
          removed += 1;
        }
      }
    }
    return removed;
  }

  async withInternalPath<T>(
    workspace: Workspace,
    relative: string,
    callback: (resolved: string) => Promise<T> | T,
  ): Promise<T> {
    const resolved = path.resolve(workspace.root, relative || ".");
    inside(workspace.root, resolved);
    try {
      inside(workspace.root, await realpath(path.dirname(resolved)));
    } catch (error) {
      if (error instanceof PathContainmentError) throw error;
    }
    return callback(resolved);
  }

  async withProjectMutation<T>(projectId: string, callback: () => Promise<T> | T): Promise<T> {
    opaqueId(projectId, "projectId");
    if (this.#locks.has(projectId)) {
      throw new ProjectBusyError("Project already has a running mutation.");
    }
    this.#locks.add(projectId);
    try {
      return await callback();
    } finally {
      this.#locks.delete(projectId);
    }
  }

  async close(): Promise<void> {
    await rm(this.root, { recursive: true, force: true });
  }

  #workspacePaths(
    input: { readonly projectId: string; readonly conversationId: string; readonly repositoryId: number },
    kind: Workspace["kind"] = "audit",
  ): { readonly mirrorPath: string; readonly workspacePath: string } {
    opaqueId(input.projectId, "projectId");
    opaqueId(input.conversationId, "conversationId");
    if (!Number.isSafeInteger(input.repositoryId) || input.repositoryId < 1) {
      throw new GitWorkspaceError("GitHub repository identifier is invalid.");
    }
    const mirrorPath = path.join(this.root, "mirrors", `${input.repositoryId}.git`);
    const workspacePath = path.join(this.root, kind, input.projectId, input.conversationId);
    inside(this.root, mirrorPath);
    inside(this.root, workspacePath);
    return { mirrorPath, workspacePath };
  }

  #managedPaths(
    input: {
      readonly projectId: string;
      readonly conversationId: string;
      readonly repositoryId: number;
      readonly binding: GitHubRepositoryBinding;
    },
    kind: Workspace["kind"] = "audit",
  ): { readonly mirrorPath: string; readonly workspacePath: string; readonly revision: string } {
    if (input.binding.repositoryId !== input.repositoryId) {
      throw new GitWorkspaceError("Managed repository binding is invalid.");
    }
    revision(input.binding.defaultBranch);
    return {
      ...this.#workspacePaths(input, kind),
      revision: `refs/heads/${input.binding.defaultBranch}`,
    };
  }
}
