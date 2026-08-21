import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { promisify } from "node:util";

export type DeliveryBranch = "main" | "preview";

export interface ProjectDeliveryWorkspace {
  readonly root: string;
  readonly branch: DeliveryBranch;
  readonly remoteHead: string;
}

export class ProjectDeliveryError extends Error {
  constructor(readonly code:
    | "deliveryRepositoryUnavailable"
    | "deliveryBranchMismatch"
    | "deliveryCheckoutDirty"
    | "deliveryRemoteUnavailable"
    | "deliveryRemoteAdvanced"
    | "deliveryDiverged"
    | "deliveryPushRejected") {
    super(code);
    this.name = "ProjectDeliveryError";
  }
}

interface GitResult { readonly stdout: string }
type GitExecutor = (root: string, args: readonly string[]) => Promise<GitResult>;

const execute = promisify(execFile);

async function processGit(root: string, args: readonly string[]): Promise<GitResult> {
  const result = await execute("git", [...args], {
    cwd: root,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    maxBuffer: 1024 * 1024,
  });
  return { stdout: result.stdout };
}

function exactBranch(value: string): DeliveryBranch {
  const branch = value.trim();
  if (branch !== "main" && branch !== "preview") {
    throw new ProjectDeliveryError("deliveryBranchMismatch");
  }
  return branch;
}

export class ProjectDeliveryRepository {
  constructor(private readonly git: GitExecutor = processGit) {}

  async admit(input: { readonly root: string; readonly deliveryBranch: DeliveryBranch }): Promise<ProjectDeliveryWorkspace> {
    let root: string;
    try {
      root = await realpath(input.root);
      const inside = (await this.git(root, ["rev-parse", "--show-toplevel"])).stdout.trim();
      if (await realpath(inside) !== root) throw new ProjectDeliveryError("deliveryRepositoryUnavailable");
    } catch (error) {
      if (error instanceof ProjectDeliveryError) throw error;
      throw new ProjectDeliveryError("deliveryRepositoryUnavailable");
    }
    const branch = exactBranch((await this.#run(root, ["branch", "--show-current"], "deliveryRepositoryUnavailable")).stdout);
    if (branch !== input.deliveryBranch) throw new ProjectDeliveryError("deliveryBranchMismatch");
    if ((await this.#run(root, ["status", "--porcelain=v1", "--untracked-files=all"], "deliveryRepositoryUnavailable")).stdout.length > 0) {
      throw new ProjectDeliveryError("deliveryCheckoutDirty");
    }
    await this.#run(root, ["fetch", "--no-tags", "origin", input.deliveryBranch], "deliveryRemoteUnavailable");
    const localHead = (await this.#run(root, ["rev-parse", "HEAD"], "deliveryRepositoryUnavailable")).stdout.trim();
    const remoteHead = (await this.#run(root, ["rev-parse", `refs/remotes/origin/${input.deliveryBranch}`], "deliveryRemoteUnavailable")).stdout.trim();
    const counts = (await this.#run(root, ["rev-list", "--left-right", "--count", `${localHead}...${remoteHead}`], "deliveryRemoteUnavailable")).stdout.trim().split(/\s+/).map(Number);
    const [ahead, behind] = counts;
    if (behind !== 0 && ahead !== 0) throw new ProjectDeliveryError("deliveryDiverged");
    if (behind !== 0) throw new ProjectDeliveryError("deliveryRemoteAdvanced");
    return Object.freeze({ root, branch, remoteHead });
  }

  async push(workspace: ProjectDeliveryWorkspace): Promise<void> {
    if ((await this.#run(workspace.root, ["status", "--porcelain=v1", "--untracked-files=all"], "deliveryPushRejected")).stdout.length > 0) {
      throw new ProjectDeliveryError("deliveryCheckoutDirty");
    }
    await this.#run(workspace.root, ["fetch", "--no-tags", "origin", workspace.branch], "deliveryRemoteUnavailable");
    const remoteHead = (await this.#run(workspace.root, ["rev-parse", `refs/remotes/origin/${workspace.branch}`], "deliveryRemoteUnavailable")).stdout.trim();
    if (remoteHead !== workspace.remoteHead) throw new ProjectDeliveryError("deliveryRemoteAdvanced");
    await this.#run(workspace.root, ["push", "origin", `HEAD:refs/heads/${workspace.branch}`], "deliveryPushRejected");
  }

  async #run(root: string, args: readonly string[], code: ProjectDeliveryError["code"]): Promise<GitResult> {
    try {
      return await this.git(root, args);
    } catch {
      throw new ProjectDeliveryError(code);
    }
  }
}
