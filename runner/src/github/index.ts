import { importPKCS8, SignJWT } from "jose";

export interface InstallationTokenRequest {
  readonly installationId: number;
  readonly repositoryIds: readonly number[];
  readonly permissions: { readonly contents: "read" };
}

export interface InstallationTokenIssuer {
  issue(request: InstallationTokenRequest): Promise<{
    readonly token: string;
    readonly expiresAt: Date | string;
    readonly repositoryIds: readonly number[];
    readonly permissions: Readonly<Record<string, string>>;
  }>;
}

export interface GitHubAppTokenIssuerOptions {
  readonly appId: string;
  readonly privateKey: string;
  readonly apiBaseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
  readonly now?: () => Date;
}

export interface GitHubRepositoryBinding {
  readonly installationId: number;
  readonly repositoryId: number;
  readonly fullName: string;
  readonly defaultBranch: string;
}

export interface VerifiedGitHubRepository {
  readonly id: number;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly private: boolean;
  readonly archived: boolean;
}

export interface GitHubRepositoryApi {
  getRepository(input: {
    readonly repositoryId: number;
    readonly installationToken: string;
  }): Promise<VerifiedGitHubRepository>;
}

export interface GitHubRepositoryApiOptions {
  readonly apiBaseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
}

export class InvalidInstallationTokenError extends Error {
  constructor(message = "Installation token is invalid or too long-lived.") {
    super(message);
    this.name = "InvalidInstallationTokenError";
  }
}

export class GitHubRepositoryAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubRepositoryAccessError";
  }
}

/** Server-only REST adapter used to revalidate a repository by immutable ID. */
export class GitHubRestRepositoryApi implements GitHubRepositoryApi {
  readonly #apiBaseUrl: URL;
  readonly #fetch: typeof globalThis.fetch;

  constructor(options: GitHubRepositoryApiOptions = {}) {
    this.#apiBaseUrl = new URL(options.apiBaseUrl ?? "https://api.github.com/");
    if (this.#apiBaseUrl.protocol !== "https:") {
      throw new GitHubRepositoryAccessError("GitHub API must use HTTPS.");
    }
    this.#fetch = options.fetch ?? globalThis.fetch;
  }

  async getRepository(input: {
    readonly repositoryId: number;
    readonly installationToken: string;
  }): Promise<VerifiedGitHubRepository> {
    if (!Number.isSafeInteger(input.repositoryId) || input.repositoryId < 1 || input.installationToken.length === 0) {
      throw new GitHubRepositoryAccessError("GitHub repository request is invalid.");
    }
    const endpoint = new URL(`repositories/${input.repositoryId}`, this.#apiBaseUrl);
    const response = await this.#fetch(endpoint, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${input.installationToken}`,
        "x-github-api-version": "2026-03-10",
      },
    });
    if (!response.ok) {
      throw new GitHubRepositoryAccessError("GitHub repository access is unavailable.");
    }
    const json = await response.json();
    if (json === null || typeof json !== "object") {
      throw new GitHubRepositoryAccessError("GitHub returned an invalid repository response.");
    }
    const repository = json as Record<string, unknown>;
    const id = repository["id"];
    const fullName = repository["full_name"];
    const defaultBranch = repository["default_branch"];
    const isPrivate = repository["private"];
    const archived = repository["archived"];
    if (
      !Number.isSafeInteger(id) ||
      typeof fullName !== "string" ||
      typeof defaultBranch !== "string" ||
      typeof isPrivate !== "boolean" ||
      typeof archived !== "boolean"
    ) {
      throw new GitHubRepositoryAccessError("GitHub returned incomplete repository metadata.");
    }
    return { id: id as number, fullName, defaultBranch, private: isPrivate, archived };
  }
}

function assertBinding(binding: GitHubRepositoryBinding): void {
  if (!Number.isSafeInteger(binding.installationId) || binding.installationId < 1) {
    throw new GitHubRepositoryAccessError("GitHub installation identifier is invalid.");
  }
  if (!Number.isSafeInteger(binding.repositoryId) || binding.repositoryId < 1) {
    throw new GitHubRepositoryAccessError("GitHub repository identifier is invalid.");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(binding.fullName)) {
    throw new GitHubRepositoryAccessError("GitHub repository name is invalid.");
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(binding.defaultBranch) || binding.defaultBranch.includes("..")) {
    throw new GitHubRepositoryAccessError("GitHub default branch is invalid.");
  }
}

function parseIssuerResponse(value: unknown): {
  readonly token: string;
  readonly expiresAt: string;
  readonly repositoryIds: readonly number[];
  readonly permissions: Readonly<Record<string, string>>;
} {
  if (value === null || typeof value !== "object") {
    throw new InvalidInstallationTokenError("GitHub returned an invalid installation token response.");
  }
  const response = value as Record<string, unknown>;
  const token = response["token"];
  const expiresAt = response["expires_at"];
  const repositories = response["repositories"];
  const permissions = response["permissions"];
  if (typeof token !== "string" || token.length === 0 || typeof expiresAt !== "string") {
    throw new InvalidInstallationTokenError("GitHub returned an incomplete installation token response.");
  }
  if (!Array.isArray(repositories) || repositories.some((repository) => repository === null || typeof repository !== "object" || !Number.isSafeInteger((repository as Record<string, unknown>)["id"]))) {
    throw new InvalidInstallationTokenError("GitHub did not confirm the narrowed repository scope.");
  }
  if (permissions === null || typeof permissions !== "object" || Array.isArray(permissions)) {
    throw new InvalidInstallationTokenError("GitHub did not return installation token permissions.");
  }
  const parsedPermissions: Record<string, string> = {};
  for (const [name, permission] of Object.entries(permissions)) {
    if (typeof permission !== "string") {
      throw new InvalidInstallationTokenError("GitHub returned invalid installation token permissions.");
    }
    parsedPermissions[name] = permission;
  }
  return {
    token,
    expiresAt,
    repositoryIds: repositories.map((repository) => (repository as { id: number }).id),
    permissions: parsedPermissions,
  };
}

/** Server-only issuer for a GitHub App installation token. */
export class GitHubAppInstallationTokenIssuer implements InstallationTokenIssuer {
  readonly #apiBaseUrl: URL;
  readonly #fetch: typeof globalThis.fetch;
  readonly #now: () => Date;

  constructor(private readonly options: GitHubAppTokenIssuerOptions) {
    if (!/^[1-9][0-9]*$/.test(options.appId)) {
      throw new InvalidInstallationTokenError("GitHub App identifier is invalid.");
    }
    if (!options.privateKey.includes("BEGIN PRIVATE KEY")) {
      throw new InvalidInstallationTokenError("GitHub App private key is invalid.");
    }
    this.#apiBaseUrl = new URL(options.apiBaseUrl ?? "https://api.github.com/");
    if (this.#apiBaseUrl.protocol !== "https:") {
      throw new InvalidInstallationTokenError("GitHub API must use HTTPS.");
    }
    this.#fetch = options.fetch ?? globalThis.fetch;
    this.#now = options.now ?? (() => new Date());
  }

  async issue(request: InstallationTokenRequest): Promise<{
    readonly token: string;
    readonly expiresAt: string;
    readonly repositoryIds: readonly number[];
    readonly permissions: Readonly<Record<string, string>>;
  }> {
    if (request.repositoryIds.length !== 1) {
      throw new InvalidInstallationTokenError("Installation tokens must be narrowed to one read-only repository.");
    }
    const now = this.#now();
    const privateKey = await importPKCS8(this.options.privateKey, "RS256");
    const appJwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(this.options.appId)
      .setIssuedAt(Math.floor(now.getTime() / 1000) - 60)
      .setExpirationTime(Math.floor(now.getTime() / 1000) + 9 * 60)
      .sign(privateKey);
    const endpoint = new URL(
      `app/installations/${request.installationId}/access_tokens`,
      this.#apiBaseUrl,
    );
    const response = await this.#fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${appJwt}`,
        "content-type": "application/json",
        "x-github-api-version": "2026-03-10",
      },
      body: JSON.stringify({
        repository_ids: request.repositoryIds,
        permissions: request.permissions,
      }),
    });
    if (!response.ok) {
      throw new InvalidInstallationTokenError("GitHub could not issue an installation token.");
    }
    return parseIssuerResponse(await response.json());
  }
}

/**
 * Gives a secret to a single server-internal callback. It never caches,
 * persists, serializes, or returns the installation credential.
 */
export class ShortLivedInstallationTokenService {
  constructor(
    private readonly issuer: InstallationTokenIssuer,
    private readonly now = (): Date => new Date(),
  ) {}

  async withRepositoryToken<T>(
    input: { readonly installationId: number; readonly repositoryId: number },
    callback: (token: string) => Promise<T> | T,
  ): Promise<T> {
    const result = await this.issuer.issue({
      installationId: input.installationId,
      repositoryIds: [input.repositoryId],
      permissions: { contents: "read" },
    });
    const expiry = result.expiresAt instanceof Date ? result.expiresAt.getTime() : Date.parse(result.expiresAt);
    const current = this.now().getTime();
    const scopedRepositories = result.repositoryIds.length === 1 && result.repositoryIds[0] === input.repositoryId;
    if (
      !result.token ||
      !Number.isFinite(expiry) ||
      expiry <= current ||
      expiry > current + 60 * 60 * 1000 ||
      !scopedRepositories ||
      result.permissions["contents"] !== "read"
    ) {
      throw new InvalidInstallationTokenError();
    }
    return callback(result.token);
  }
}

/** Rechecks installation access before any clone, fetch, audit, or fix. */
export class GitHubRepositoryAccessVerifier {
  constructor(
    private readonly tokens: ShortLivedInstallationTokenService,
    private readonly repositories: GitHubRepositoryApi,
  ) {}

  async withVerifiedRepository<T>(
    binding: GitHubRepositoryBinding,
    callback: (repository: VerifiedGitHubRepository, token: string) => Promise<T> | T,
  ): Promise<T> {
    assertBinding(binding);
    return this.tokens.withRepositoryToken(binding, async (token) => {
      const repository = await this.repositories.getRepository({
        repositoryId: binding.repositoryId,
        installationToken: token,
      });
      if (
        repository.id !== binding.repositoryId ||
        repository.fullName.toLowerCase() !== binding.fullName.toLowerCase() ||
        repository.defaultBranch !== binding.defaultBranch ||
        repository.archived
      ) {
        throw new GitHubRepositoryAccessError("GitHub repository access is no longer valid.");
      }
      return callback(repository, token);
    });
  }
}
