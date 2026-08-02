import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { describe, it } from "node:test";
import { decodeJwt } from "jose";

import {
  GitHubAppInstallationTokenIssuer,
  GitHubRestRepositoryApi,
  GitHubRepositoryAccessError,
  GitHubRepositoryAccessVerifier,
  ShortLivedInstallationTokenService,
} from "../../src/github/index.js";
import type {
  GitHubRepositoryApi,
  InstallationTokenIssuer,
} from "../../src/github/index.js";

const binding = {
  installationId: 42,
  repositoryId: 101,
  fullName: "shipglows/example",
  defaultBranch: "main",
} as const;

function tokenService(): ShortLivedInstallationTokenService {
  const issuer: InstallationTokenIssuer = {
    issue: async (request) => ({
      token: "ghs_never_returned_to_client",
      expiresAt: new Date("2026-08-01T01:00:00.000Z"),
      repositoryIds: request.repositoryIds,
      permissions: request.permissions,
    }),
  };
  return new ShortLivedInstallationTokenService(
    issuer,
    () => new Date("2026-08-01T00:00:00.000Z"),
  );
}

describe("GitHub repository revalidation", () => {
  it("allows a server-internal operation only for the exact active binding", async () => {
    const repositories: GitHubRepositoryApi = {
      getRepository: async ({ repositoryId, installationToken }) => {
        assert.equal(repositoryId, binding.repositoryId);
        assert.match(installationToken, /^ghs_/);
        return {
          id: binding.repositoryId,
          fullName: binding.fullName,
          defaultBranch: binding.defaultBranch,
          private: true,
          archived: false,
        };
      },
    };
    const verifier = new GitHubRepositoryAccessVerifier(tokenService(), repositories);
    const result = await verifier.withVerifiedRepository(binding, async (repository) => ({
      repositoryId: repository.id,
      defaultBranch: repository.defaultBranch,
    }));

    assert.deepEqual(result, { repositoryId: 101, defaultBranch: "main" });
    assert.doesNotMatch(JSON.stringify(result), /ghs_/);
  });

  it("blocks renamed, archived, or mismatched repository access before Git can run", async () => {
    const repositories: GitHubRepositoryApi = {
      getRepository: async () => ({
        id: binding.repositoryId,
        fullName: binding.fullName,
        defaultBranch: binding.defaultBranch,
        private: true,
        archived: true,
      }),
    };
    const verifier = new GitHubRepositoryAccessVerifier(tokenService(), repositories);

    await assert.rejects(
      verifier.withVerifiedRepository(binding, async () => undefined),
      GitHubRepositoryAccessError,
    );
  });
});

describe("GitHub App token issuer", () => {
  it("signs an app JWT then requests one narrowed read-only installation token", async () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    let requestedUrl = "";
    let requestBody = "";
    let authorization = "";
    const issuer = new GitHubAppInstallationTokenIssuer({
      appId: "42",
      privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      now: () => new Date("2026-08-01T00:00:00.000Z"),
      fetch: async (url, init) => {
        requestedUrl = url instanceof URL ? url.toString() : typeof url === "string" ? url : "";
        requestBody = typeof init?.body === "string" ? init.body : "";
        authorization = String((init?.headers as Record<string, string>)["authorization"]);
        return new Response(JSON.stringify({
          token: "ghs_server_only_token",
          expires_at: "2026-08-01T00:50:00.000Z",
          repositories: [{ id: 101 }],
          permissions: { contents: "read" },
        }), { status: 201 });
      },
    });

    const issued = await issuer.issue({
      installationId: 42,
      repositoryIds: [101],
      permissions: { contents: "read" },
    });
    const jwt = decodeJwt(authorization.replace("Bearer ", ""));

    assert.equal(requestedUrl, "https://api.github.com/app/installations/42/access_tokens");
    assert.deepEqual(JSON.parse(requestBody), {
      repository_ids: [101],
      permissions: { contents: "read" },
    });
    assert.equal(jwt.iss, "42");
    assert.equal((jwt.exp ?? 0) - (jwt.iat ?? 0) <= 10 * 60, true);
    assert.deepEqual(issued.repositoryIds, [101]);
    assert.equal(issued.permissions["contents"], "read");
  });
});

describe("GitHub repository REST adapter", () => {
  it("revalidates a repository by immutable ID without returning the credential", async () => {
    let requestedUrl = "";
    let authorization = "";
    const api = new GitHubRestRepositoryApi({
      fetch: async (url, init) => {
        requestedUrl = url instanceof URL ? url.toString() : typeof url === "string" ? url : "";
        const headers = init?.headers as Record<string, string> | undefined;
        authorization = headers?.["authorization"] ?? "";
        return new Response(JSON.stringify({
          id: 101,
          full_name: "shipglows/example",
          default_branch: "main",
          private: true,
          archived: false,
        }), { status: 200 });
      },
    });

    const repository = await api.getRepository({
      repositoryId: 101,
      installationToken: "ghs_server_only_token",
    });

    assert.equal(requestedUrl, "https://api.github.com/repositories/101");
    assert.equal(authorization, "Bearer ghs_server_only_token");
    assert.deepEqual(repository, {
      id: 101,
      fullName: "shipglows/example",
      defaultBranch: "main",
      private: true,
      archived: false,
    });
    assert.doesNotMatch(JSON.stringify(repository), /ghs_/);
  });
});
