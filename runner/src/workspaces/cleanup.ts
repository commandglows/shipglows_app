import type { OperationalStore } from "../db/index.js";
import type { GitRepositoryTransport, LocalWorkspaceManager } from "./index.js";

type CleanupStore = Pick<
  OperationalStore,
  "listTenantIds" | "listDueWorkspaceCleanups" | "getRun" | "getGitHubRepositoryBinding" | "markWorkspaceCleanup"
>;

export class WorkspaceCleanupWorker {
  #timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly store: CleanupStore,
    private readonly workspaces: LocalWorkspaceManager,
    private readonly transport: GitRepositoryTransport,
  ) {}

  async runOnce(now = new Date().toISOString()): Promise<number> {
    let processed = 0;
    for (const tenantId of this.store.listTenantIds()) {
      const records = this.store.listDueWorkspaceCleanups({ tenantId, now, limit: 100 });
      for (const record of records) {
        const run = this.store.getRun({ tenantId, runId: record.runId });
        const binding = run === undefined
          ? undefined
          : this.store.getGitHubRepositoryBinding({ tenantId, projectId: run.projectId });
        if (run === undefined || binding === undefined || (run.taskKind !== "audit" && run.taskKind !== "fix")) {
          this.store.markWorkspaceCleanup({ tenantId, runId: record.runId, state: "failed", errorCode: "cleanupContextUnavailable" });
          processed += 1;
          continue;
        }
        try {
          await this.workspaces.removeManagedWorktree({
            projectId: run.projectId,
            conversationId: run.conversationId,
            kind: run.taskKind,
            repositoryId: binding.repositoryId,
            transport: this.transport,
          });
          this.store.markWorkspaceCleanup({ tenantId, runId: record.runId, state: "completed" });
        } catch {
          this.store.markWorkspaceCleanup({ tenantId, runId: record.runId, state: "failed", errorCode: "cleanupFailed" });
        }
        processed += 1;
      }
    }
    return processed;
  }

  start(intervalMs = 60_000): void {
    if (this.#timer !== undefined) return;
    this.#timer = setInterval(() => { void this.runOnce(); }, intervalMs);
  }

  stop(): void {
    if (this.#timer === undefined) return;
    clearInterval(this.#timer);
    this.#timer = undefined;
  }
}
