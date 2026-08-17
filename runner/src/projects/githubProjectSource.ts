import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { importPKCS8, SignJWT } from "jose";

import { HttpError } from "../contracts/index.js";

export type GitHubConnectionState =
  | "disabled"
  | "disconnected"
  | "verifying"
  | "ready"
  | "degraded"
  | "accessLost";

export interface GitHubSourceStatus {
  readonly state: GitHubConnectionState;
  readonly message: string;
  readonly accountLabel?: string;
  readonly actionUrl?: string;
}

export interface GitHubRepositoryCandidate {
  readonly candidateId: string;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly visibility: "private" | "public";
  readonly archived: boolean;
}

export interface SelectedGitHubRepository extends GitHubRepositoryCandidate {
  /** Server-only fields. They must never be copied into an HTTP response. */
  readonly installationId: number;
  readonly repositoryId: number;
}

interface ActorInput {
  readonly tenantId: string;
  readonly userId: string;
}

export interface GitHubProjectSource {
  status(input: ActorInput): Promise<GitHubSourceStatus>;
  beginSetup(input: ActorInput): Promise<{ readonly actionUrl: string; readonly setupUrl: string; readonly expiresAt: string }>;
  completeSetup(input: ActorInput & { readonly installationId: number; readonly state: string }): Promise<GitHubSourceStatus>;
  disconnect(input: ActorInput): Promise<void>;
  listRepositories(input: ActorInput & { readonly cursor?: string }): Promise<{
    readonly repositories: readonly GitHubRepositoryCandidate[];
    readonly nextCursor: string | null;
  }>;
  selectRepository(input: ActorInput & { readonly candidateId: string }): Promise<SelectedGitHubRepository>;
}

export interface GitHubAppProjectSourceOptions {
  readonly appId: string;
  readonly appSlug: string;
  readonly privateKey: string;
  readonly setupUrl: string;
  readonly storagePath: string;
  readonly apiBaseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly now?: () => Date;
  readonly random?: () => string;
  readonly onConnectionState?: (input: ActorInput & { readonly installationId: number; readonly state: "ready" | "degraded" | "accessLost" }) => Promise<void> | void;
}

interface InstallationBinding extends ActorInput {
  readonly installationId: number;
  readonly accountLabel: string;
}

interface ExpiringActorValue extends ActorInput {
  readonly expiresAt: number;
}

type SetupState = ExpiringActorValue;

interface CandidateState extends ExpiringActorValue {
  readonly installationId: number;
  readonly repositoryId: number;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly visibility: "private" | "public";
  readonly archived: boolean;
}

interface CursorState extends ExpiringActorValue {
  readonly page: number;
}

interface RepositoryMetadata {
  readonly id: number;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly visibility: "private" | "public";
  readonly archived: boolean;
}

class GitHubResponseError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "GitHubResponseError";
  }
}

const SETUP_TTL_MS = 10 * 60 * 1000;
const CANDIDATE_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 100;

function actorKey(actor: ActorInput): string {
  return `${actor.tenantId}\u0000${actor.userId}`;
}

function sameActor(value: ActorInput, actor: ActorInput): boolean {
  return value.tenantId === actor.tenantId && value.userId === actor.userId;
}

function repositoryMetadata(value: unknown): RepositoryMetadata {
  if (value === null || typeof value !== "object") throw new GitHubResponseError(502, "GitHub returned an invalid repository.");
  const record = value as Record<string, unknown>;
  const id = record["id"];
  const fullName = record["full_name"];
  const defaultBranch = record["default_branch"];
  const isPrivate = record["private"];
  const archived = record["archived"];
  if (!Number.isSafeInteger(id) || typeof fullName !== "string" || typeof defaultBranch !== "string" ||
      typeof isPrivate !== "boolean" || typeof archived !== "boolean") {
    throw new GitHubResponseError(502, "GitHub returned incomplete repository metadata.");
  }
  const segments = fullName.split("/");
  if (fullName.length > 201 || segments.length !== 2 || segments.some((segment) =>
    segment === "." || segment === ".." || !/^[A-Za-z0-9_.-]+$/.test(segment)) ||
    defaultBranch.length < 1 || defaultBranch.length > 255 || !/^[A-Za-z0-9._/-]+$/.test(defaultBranch) || defaultBranch.includes("..")) {
    throw new GitHubResponseError(502, "GitHub returned unsafe repository metadata.");
  }
  return { id: id as number, fullName, defaultBranch, visibility: isPrivate ? "private" : "public", archived };
}

/** Local-runner GitHub App adapter. OAuth credentials and numeric IDs never cross its public DTO boundary. */
export class GitHubAppProjectSource implements GitHubProjectSource {
  readonly #apiBaseUrl: URL;
  readonly #fetch: typeof globalThis.fetch;
  readonly #now: () => Date;
  readonly #random: () => string;
  readonly #setupUrl: string;
  readonly #bindings = new Map<string, InstallationBinding>();
  readonly #setupStates = new Map<string, SetupState>();
  readonly #candidates = new Map<string, CandidateState>();
  readonly #cursors = new Map<string, CursorState>();

  constructor(private readonly options: GitHubAppProjectSourceOptions) {
    if (!/^[1-9][0-9]*$/.test(options.appId)) throw new Error("GitHub App identifier is invalid.");
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,98}[A-Za-z0-9])?$/.test(options.appSlug)) throw new Error("GitHub App slug is invalid.");
    if (!options.privateKey.includes("BEGIN PRIVATE KEY")) throw new Error("GitHub App private key is invalid.");
    const setupUrl = new URL(options.setupUrl);
    const localHttp = setupUrl.protocol === "http:" && (setupUrl.hostname === "127.0.0.1" || setupUrl.hostname === "[::1]");
    if (setupUrl.protocol !== "https:" && setupUrl.protocol !== "shipglows:" && !localHttp) {
      throw new Error("GitHub App setup URL must use HTTPS, the ShipGlows scheme, or loopback HTTP.");
    }
    this.#setupUrl = setupUrl.toString();
    this.#apiBaseUrl = new URL(options.apiBaseUrl ?? "https://api.github.com/");
    if (this.#apiBaseUrl.protocol !== "https:") throw new Error("GitHub API must use HTTPS.");
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#now = options.now ?? (() => new Date());
    this.#random = options.random ?? (() => randomBytes(32).toString("base64url"));
    this.#loadBindings();
  }

  async status(input: ActorInput): Promise<GitHubSourceStatus> {
    this.#prune();
    const binding = this.#bindings.get(actorKey(input));
    if (binding === undefined) {
      const verifying = [...this.#setupStates.values()].some((state) => sameActor(state, input));
      return verifying
        ? { state: "verifying", message: "Finish the GitHub App installation, then return to ShipGlows." }
        : { state: "disconnected", message: "Connect the ShipGlows GitHub App to discover repositories." };
    }
    try {
      const verified = await this.#installation(binding.installationId);
      if (verified.accountLabel !== binding.accountLabel) {
        this.#bindings.set(actorKey(input), { ...binding, accountLabel: verified.accountLabel });
        this.#saveBindings();
      }
      await this.#notify(input, binding.installationId, "ready");
      return { state: "ready", message: "GitHub repositories are ready.", accountLabel: verified.accountLabel };
    } catch (error) {
      if (error instanceof GitHubResponseError && (error.status === 401 || error.status === 403 || error.status === 404)) {
        await this.#notify(input, binding.installationId, "accessLost");
        return { state: "accessLost", message: "GitHub App access was removed. Reconnect it to continue.", accountLabel: binding.accountLabel };
      }
      await this.#notify(input, binding.installationId, "degraded");
      return { state: "degraded", message: "GitHub could not be verified right now. Try again shortly.", accountLabel: binding.accountLabel };
    }
  }

  beginSetup(input: ActorInput): Promise<{ readonly actionUrl: string; readonly setupUrl: string; readonly expiresAt: string }> {
    this.#prune();
    const state = `ghs_${this.#random()}`;
    const expiresAt = this.#now().getTime() + SETUP_TTL_MS;
    this.#setupStates.set(state, { ...input, expiresAt });
    const action = new URL(`https://github.com/apps/${this.options.appSlug}/installations/new`);
    action.searchParams.set("state", state);
    return Promise.resolve({ actionUrl: action.toString(), setupUrl: this.#setupUrl, expiresAt: new Date(expiresAt).toISOString() });
  }

  async completeSetup(input: ActorInput & { readonly installationId: number; readonly state: string }): Promise<GitHubSourceStatus> {
    this.#prune();
    const pending = this.#setupStates.get(input.state);
    if (pending === undefined || !sameActor(pending, input)) {
      throw new HttpError(409, "githubSetupStateInvalid", "The GitHub setup state is invalid or expired.");
    }
    this.#setupStates.delete(input.state);
    if (!Number.isSafeInteger(input.installationId) || input.installationId < 1) {
      throw new HttpError(400, "githubInstallationInvalid", "The GitHub installation is invalid.");
    }
    let verified: { readonly accountLabel: string };
    try {
      verified = await this.#installation(input.installationId);
    } catch {
      throw new HttpError(409, "githubInstallationUnavailable", "GitHub did not confirm this App installation.");
    }
    const previous = this.#bindings.get(actorKey(input));
    if (previous !== undefined && previous.installationId !== input.installationId) {
      await this.#notify(input, previous.installationId, "accessLost");
    }
    this.#bindings.set(actorKey(input), { tenantId: input.tenantId, userId: input.userId, installationId: input.installationId, accountLabel: verified.accountLabel });
    this.#saveBindings();
    await this.#notify(input, input.installationId, "ready");
    return { state: "ready", message: "GitHub repositories are ready.", accountLabel: verified.accountLabel };
  }

  disconnect(input: ActorInput): Promise<void> {
    const binding = this.#bindings.get(actorKey(input));
    this.#bindings.delete(actorKey(input));
    for (const [id, candidate] of this.#candidates) if (sameActor(candidate, input)) this.#candidates.delete(id);
    for (const [id, cursor] of this.#cursors) if (sameActor(cursor, input)) this.#cursors.delete(id);
    this.#saveBindings();
    return binding === undefined
      ? Promise.resolve()
      : Promise.resolve(this.#notify(input, binding.installationId, "accessLost"));
  }

  async listRepositories(input: ActorInput & { readonly cursor?: string }): Promise<{ readonly repositories: readonly GitHubRepositoryCandidate[]; readonly nextCursor: string | null }> {
    this.#prune();
    const binding = this.#binding(input);
    let page = 1;
    if (input.cursor !== undefined) {
      const cursor = this.#cursors.get(input.cursor);
      if (cursor === undefined || !sameActor(cursor, input)) throw new HttpError(400, "githubCursorInvalid", "The repository page cursor is invalid or expired.");
      page = cursor.page;
    }
    try {
      const result = await this.#withInstallationToken(binding.installationId, async (token) => {
        const endpoint = new URL("installation/repositories", this.#apiBaseUrl);
        endpoint.searchParams.set("per_page", String(PAGE_SIZE));
        endpoint.searchParams.set("page", String(page));
        const response = await this.#fetch(endpoint, { headers: this.#installationHeaders(token) });
        if (!response.ok) throw new GitHubResponseError(response.status, "GitHub repository access is unavailable.");
        const json: unknown = await response.json();
        if (json === null || typeof json !== "object" || !Array.isArray((json as Record<string, unknown>)["repositories"])) {
          throw new GitHubResponseError(502, "GitHub returned an invalid repository list.");
        }
        const record = json as Record<string, unknown>;
        const totalCount = record["total_count"];
        if (!Number.isSafeInteger(totalCount) || (totalCount as number) < 0) throw new GitHubResponseError(502, "GitHub returned an invalid repository count.");
        const metadata = (record["repositories"] as unknown[]).map(repositoryMetadata);
        const expiresAt = this.#now().getTime() + CANDIDATE_TTL_MS;
        const repositories = metadata.map((repository) => {
          const candidateId = `ghc_${this.#random()}`;
          this.#candidates.set(candidateId, { ...input, expiresAt, installationId: binding.installationId, repositoryId: repository.id,
            fullName: repository.fullName, defaultBranch: repository.defaultBranch, visibility: repository.visibility, archived: repository.archived });
          return { candidateId, fullName: repository.fullName, defaultBranch: repository.defaultBranch, visibility: repository.visibility, archived: repository.archived };
        });
        let nextCursor: string | null = null;
        if (page * PAGE_SIZE < (totalCount as number)) {
          nextCursor = `ghp_${this.#random()}`;
          this.#cursors.set(nextCursor, { ...input, page: page + 1, expiresAt });
        }
        return { repositories, nextCursor };
      });
      await this.#notify(input, binding.installationId, "ready");
      return result;
    } catch (error) {
      return await this.#throwAccessError(error, input, binding.installationId);
    }
  }

  async selectRepository(input: ActorInput & { readonly candidateId: string }): Promise<SelectedGitHubRepository> {
    this.#prune();
    const candidate = this.#candidates.get(input.candidateId);
    if (candidate === undefined || !sameActor(candidate, input)) throw new HttpError(404, "githubCandidateUnavailable", "The selected repository is unavailable or expired.");
    const binding = this.#binding(input);
    if (candidate.installationId !== binding.installationId) throw new HttpError(409, "githubCandidateStale", "The selected repository belongs to an older GitHub connection.");
    try {
      const verified = await this.#withInstallationToken(binding.installationId, async (token) => {
        const response = await this.#fetch(new URL(`repositories/${candidate.repositoryId}`, this.#apiBaseUrl), { headers: this.#installationHeaders(token) });
        if (!response.ok) throw new GitHubResponseError(response.status, "GitHub repository access is unavailable.");
        return repositoryMetadata(await response.json());
      });
      if (verified.id !== candidate.repositoryId || verified.fullName.toLowerCase() !== candidate.fullName.toLowerCase() ||
          verified.defaultBranch !== candidate.defaultBranch || verified.visibility !== candidate.visibility || verified.archived !== candidate.archived) {
        throw new HttpError(409, "githubCandidateChanged", "The repository changed since it was listed. Refresh and select it again.");
      }
      await this.#notify(input, binding.installationId, "ready");
      return { candidateId: input.candidateId, installationId: binding.installationId, repositoryId: verified.id,
        fullName: verified.fullName, defaultBranch: verified.defaultBranch, visibility: verified.visibility, archived: verified.archived };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      return await this.#throwAccessError(error, input, binding.installationId);
    }
  }

  #binding(input: ActorInput): InstallationBinding {
    const binding = this.#bindings.get(actorKey(input));
    if (binding === undefined) throw new HttpError(409, "githubDisconnected", "Connect the ShipGlows GitHub App before listing repositories.");
    return binding;
  }

  async #appJwt(): Promise<string> {
    const now = Math.floor(this.#now().getTime() / 1000);
    const key = await importPKCS8(this.options.privateKey, "RS256");
    return new SignJWT({}).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(this.options.appId)
      .setIssuedAt(now - 60).setExpirationTime(now + 9 * 60).sign(key);
  }

  async #installation(installationId: number): Promise<{ readonly accountLabel: string }> {
    const response = await this.#fetch(new URL(`app/installations/${installationId}`, this.#apiBaseUrl), {
      headers: { accept: "application/vnd.github+json", authorization: `Bearer ${await this.#appJwt()}`, "x-github-api-version": "2026-03-10" },
    });
    if (!response.ok) throw new GitHubResponseError(response.status, "GitHub App installation is unavailable.");
    const json: unknown = await response.json();
    if (json === null || typeof json !== "object") throw new GitHubResponseError(502, "GitHub returned an invalid installation.");
    const record = json as Record<string, unknown>;
    const returnedId = record["id"];
    const account = record["account"];
    const accountLabel = account !== null && typeof account === "object" ? (account as Record<string, unknown>)["login"] : undefined;
    if (returnedId !== installationId || typeof accountLabel !== "string" ||
        !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,98}[A-Za-z0-9])?$/.test(accountLabel)) {
      throw new GitHubResponseError(502, "GitHub returned incomplete installation metadata.");
    }
    return { accountLabel };
  }

  async #withInstallationToken<T>(installationId: number, callback: (token: string) => Promise<T>): Promise<T> {
    const response = await this.#fetch(new URL(`app/installations/${installationId}/access_tokens`, this.#apiBaseUrl), {
      method: "POST",
      headers: { accept: "application/vnd.github+json", authorization: `Bearer ${await this.#appJwt()}`, "x-github-api-version": "2026-03-10" },
    });
    if (!response.ok) throw new GitHubResponseError(response.status, "GitHub could not issue an installation token.");
    const json: unknown = await response.json();
    if (json === null || typeof json !== "object") throw new GitHubResponseError(502, "GitHub returned an invalid installation token.");
    const token = (json as Record<string, unknown>)["token"];
    const expiresAt = (json as Record<string, unknown>)["expires_at"];
    const expiry = typeof expiresAt === "string" ? Date.parse(expiresAt) : Number.NaN;
    const now = this.#now().getTime();
    if (typeof token !== "string" || token.length === 0 || !Number.isFinite(expiry) || expiry <= now || expiry > now + 60 * 60 * 1000) {
      throw new GitHubResponseError(502, "GitHub returned an invalid installation token.");
    }
    return callback(token);
  }

  #installationHeaders(token: string): Record<string, string> {
    return { accept: "application/vnd.github+json", authorization: `Bearer ${token}`, "x-github-api-version": "2026-03-10" };
  }

  async #throwAccessError(error: unknown, input: ActorInput, installationId: number): Promise<never> {
    if (error instanceof GitHubResponseError && (error.status === 401 || error.status === 403 || error.status === 404)) {
      await this.#notify(input, installationId, "accessLost");
      throw new HttpError(409, "githubAccessLost", "GitHub App access is no longer available. Reconnect it to continue.");
    }
    await this.#notify(input, installationId, "degraded");
    throw new HttpError(503, "githubDegraded", "GitHub is temporarily unavailable. Try again shortly.");
  }

  async #notify(input: ActorInput, installationId: number, state: "ready" | "degraded" | "accessLost"): Promise<void> {
    await this.options.onConnectionState?.({ ...input, installationId, state });
  }

  #prune(): void {
    const now = this.#now().getTime();
    for (const [id, value] of this.#setupStates) if (value.expiresAt <= now) this.#setupStates.delete(id);
    for (const [id, value] of this.#candidates) if (value.expiresAt <= now) this.#candidates.delete(id);
    for (const [id, value] of this.#cursors) if (value.expiresAt <= now) this.#cursors.delete(id);
  }

  #loadBindings(): void {
    try {
      const parsed: unknown = JSON.parse(readFileSync(this.options.storagePath, "utf8"));
      if (parsed === null || typeof parsed !== "object" || (parsed as Record<string, unknown>)["schemaVersion"] !== 1 ||
          !Array.isArray((parsed as Record<string, unknown>)["bindings"])) return;
      for (const value of (parsed as { bindings: unknown[] }).bindings) {
        if (value === null || typeof value !== "object") continue;
        const record = value as Record<string, unknown>;
        if (typeof record["tenantId"] !== "string" || typeof record["userId"] !== "string" ||
            !Number.isSafeInteger(record["installationId"]) || (record["installationId"] as number) < 1 ||
            typeof record["accountLabel"] !== "string" || record["accountLabel"].length === 0) continue;
        const binding = record as unknown as InstallationBinding;
        this.#bindings.set(actorKey(binding), binding);
      }
    } catch {
      // Missing or corrupt local state fails closed as disconnected.
    }
  }

  #saveBindings(): void {
    mkdirSync(dirname(this.options.storagePath), { recursive: true });
    const temporary = `${this.options.storagePath}.tmp`;
    writeFileSync(temporary, `${JSON.stringify({ schemaVersion: 1, bindings: [...this.#bindings.values()] }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(temporary, this.options.storagePath);
  }
}

/** Honest disabled adapter. It performs no network request and cannot create a project. */
export class UnavailableGitHubProjectSource implements GitHubProjectSource {
  constructor(private readonly enabled: boolean) {}

  status(): Promise<GitHubSourceStatus> {
    return Promise.resolve({ state: this.enabled ? "disconnected" : "disabled", message: this.enabled
      ? "Connect the ShipGlows GitHub App to discover repositories."
      : "GitHub App access is not configured on this runner." });
  }

  beginSetup(): Promise<never> { return this.#unavailable(); }
  completeSetup(): Promise<never> { return this.#unavailable(); }
  disconnect(): Promise<void> { return Promise.resolve(); }
  listRepositories(): Promise<never> { return this.#unavailable(); }
  selectRepository(): Promise<never> { return this.#unavailable(); }

  #unavailable(): never {
    throw new HttpError(409, this.enabled ? "githubDisconnected" : "githubDisabled", this.enabled
      ? "Connect the ShipGlows GitHub App before listing repositories."
      : "GitHub App access is not configured on this runner.");
  }
}
