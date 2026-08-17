const WORKFLOW = "studio-managed-flutter-blacksmith.yml";
const API_VERSION = "2026-03-10";
const SHA = /^[0-9a-f]{40}$/;
const OPERATION = /^[A-Za-z0-9_-]{8,64}$/;

export type BlacksmithTarget = "flutterAndroid" | "flutterWindows";

export interface BlacksmithTokenBroker {
  withActionsToken<T>(
    repositoryId: number,
    operation: (token: string) => Promise<T>,
  ): Promise<T>;
}

export interface ManagedCompilationRequest {
  readonly repositoryId: number;
  readonly workflowRef: string;
  readonly sourceSha: string;
  readonly operationId: string;
  readonly target: BlacksmithTarget;
}

export interface ManagedCompilationRun {
  readonly runId: number;
  readonly status: "queued" | "in_progress" | "completed";
  readonly conclusion: "success" | "failure" | "cancelled" | null;
}

export class BlacksmithCompilationError extends Error {
  constructor(readonly reason: "invalidRequest" | "dispatchUnavailable" | "runUnavailable" | "artifactUnavailable") {
    super(reason);
    this.name = "BlacksmithCompilationError";
  }
}

function assertRequest(request: ManagedCompilationRequest): void {
  if (!Number.isSafeInteger(request.repositoryId) || request.repositoryId < 1) throw new BlacksmithCompilationError("invalidRequest");
  if (!SHA.test(request.sourceSha) || !OPERATION.test(request.operationId)) throw new BlacksmithCompilationError("invalidRequest");
  if (!/^[A-Za-z0-9._/-]{1,128}$/.test(request.workflowRef) || request.workflowRef.includes("..")) throw new BlacksmithCompilationError("invalidRequest");
  const runtimeTarget: unknown = request.target;
  if (runtimeTarget !== "flutterAndroid" && runtimeTarget !== "flutterWindows") throw new BlacksmithCompilationError("invalidRequest");
}

function headers(token: string): Record<string, string> {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-github-api-version": API_VERSION,
  };
}

export class GitHubBlacksmithCompilationGateway {
  readonly #base: URL;

  constructor(
    private readonly tokens: BlacksmithTokenBroker,
    private readonly fetcher: typeof globalThis.fetch = globalThis.fetch,
    apiBaseUrl = "https://api.github.com/",
  ) {
    this.#base = new URL(apiBaseUrl);
    if (this.#base.protocol !== "https:") throw new BlacksmithCompilationError("invalidRequest");
  }

  async dispatch(request: ManagedCompilationRequest): Promise<void> {
    assertRequest(request);
    await this.tokens.withActionsToken(request.repositoryId, async (token) => {
      const endpoint = new URL(`repositories/${request.repositoryId}/actions/workflows/${WORKFLOW}/dispatches`, this.#base);
      const response = await this.fetcher(endpoint, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          ref: request.workflowRef,
          inputs: { operation_id: request.operationId, source_sha: request.sourceSha, target: request.target },
        }),
      });
      if (response.status !== 204) throw new BlacksmithCompilationError("dispatchUnavailable");
    });
  }

  async findRun(request: ManagedCompilationRequest): Promise<ManagedCompilationRun> {
    assertRequest(request);
    return this.tokens.withActionsToken(request.repositoryId, async (token) => {
      const endpoint = new URL(`repositories/${request.repositoryId}/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=20`, this.#base);
      const response = await this.fetcher(endpoint, { headers: headers(token) });
      if (!response.ok) throw new BlacksmithCompilationError("runUnavailable");
      const body = await response.json() as { workflow_runs?: unknown[] };
      const title = `studio-managed-${request.operationId}-${request.target}`;
      const match = body.workflow_runs?.find((entry) => {
        if (entry === null || typeof entry !== "object") return false;
        const run = entry as Record<string, unknown>;
        return run["display_title"] === title && run["head_sha"] === request.sourceSha;
      }) as Record<string, unknown> | undefined;
      if (!match || !Number.isSafeInteger(match["id"])) throw new BlacksmithCompilationError("runUnavailable");
      const status = match["status"];
      const conclusion = match["conclusion"];
      if (status !== "queued" && status !== "in_progress" && status !== "completed") throw new BlacksmithCompilationError("runUnavailable");
      if (conclusion !== null && conclusion !== "success" && conclusion !== "failure" && conclusion !== "cancelled") throw new BlacksmithCompilationError("runUnavailable");
      return { runId: match["id"] as number, status, conclusion };
    });
  }

  async downloadArtifact(repositoryId: number, runId: number): Promise<Uint8Array> {
    if (!Number.isSafeInteger(repositoryId) || repositoryId < 1 || !Number.isSafeInteger(runId) || runId < 1) throw new BlacksmithCompilationError("invalidRequest");
    return this.tokens.withActionsToken(repositoryId, async (token) => {
      const list = new URL(`repositories/${repositoryId}/actions/runs/${runId}/artifacts?per_page=2`, this.#base);
      const response = await this.fetcher(list, { headers: headers(token) });
      if (!response.ok) throw new BlacksmithCompilationError("artifactUnavailable");
      const body = await response.json() as { artifacts?: unknown[] };
      if (!Array.isArray(body.artifacts) || body.artifacts.length !== 1) throw new BlacksmithCompilationError("artifactUnavailable");
      const artifact = body.artifacts[0] as Record<string, unknown>;
      if (!Number.isSafeInteger(artifact["id"]) || artifact["expired"] !== false) throw new BlacksmithCompilationError("artifactUnavailable");
      const archive = new URL(`repositories/${repositoryId}/actions/artifacts/${String(artifact["id"])}/zip`, this.#base);
      const download = await this.fetcher(archive, { headers: headers(token), redirect: "follow" });
      if (!download.ok) throw new BlacksmithCompilationError("artifactUnavailable");
      const bytes = new Uint8Array(await download.arrayBuffer());
      if (bytes.length === 0 || bytes.length > 512 * 1024 * 1024) throw new BlacksmithCompilationError("artifactUnavailable");
      return bytes;
    });
  }
}
