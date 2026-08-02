import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  InvalidInstallationTokenError,
  ShortLivedInstallationTokenService,
} from "../../src/github/index.js";
import type {
  InstallationTokenIssuer,
  InstallationTokenRequest,
} from "../../src/github/index.js";

describe("GitHub App short-lived token boundary", () => {
  it("narrows each token to one repository and never caches or returns it", async () => {
    const requests: InstallationTokenRequest[] = [];
    let issueCount = 0;
    const now = new Date("2026-07-18T10:00:00.000Z");
    const issuer: InstallationTokenIssuer = {
      issue: async (request) => {
        requests.push(request);
        issueCount += 1;
        return {
          token: `ghs_test_value_${issueCount}`,
          expiresAt: new Date(now.getTime() + 50 * 60 * 1000),
          repositoryIds: request.repositoryIds,
          permissions: request.permissions,
        };
      },
    };
    const service = new ShortLivedInstallationTokenService(issuer, () => now);

    const first = await service.withRepositoryToken(
      { installationId: 42, repositoryId: 101 },
      async () => ({ authorized: true }),
    );
    await service.withRepositoryToken(
      { installationId: 42, repositoryId: 101 },
      async () => ({ authorized: true }),
    );

    assert.deepEqual(first, { authorized: true });
    assert.equal(issueCount, 2);
    assert.deepEqual(requests, [
      {
        installationId: 42,
        repositoryIds: [101],
        permissions: { contents: "read" },
      },
      {
        installationId: 42,
        repositoryIds: [101],
        permissions: { contents: "read" },
      },
    ]);
    assert.doesNotMatch(JSON.stringify(first), /ghs_test_value/);
  });

  it("rejects already-expired or unexpectedly long-lived credentials", async () => {
    const now = new Date("2026-07-18T10:00:00.000Z");
    for (const expiresAt of [
      new Date(now.getTime() - 1),
      new Date(now.getTime() + 61 * 60 * 1000),
    ]) {
      const issuer: InstallationTokenIssuer = {
        issue: async (request) => ({
          token: "not-returned",
          expiresAt,
          repositoryIds: request.repositoryIds,
          permissions: request.permissions,
        }),
      };
      const service = new ShortLivedInstallationTokenService(issuer, () => now);

      await assert.rejects(
        service.withRepositoryToken(
          { installationId: 42, repositoryId: 101 },
          async () => true,
        ),
        InvalidInstallationTokenError,
      );
    }
  });

  it("rejects a response that widens repository scope or contents permission", async () => {
    const now = new Date("2026-07-18T10:00:00.000Z");
    for (const response of [
      { repositoryIds: [101, 202], permissions: { contents: "read" } },
      { repositoryIds: [101], permissions: { contents: "write" } },
    ]) {
      const issuer: InstallationTokenIssuer = {
        issue: async () => ({
          token: "not-returned",
          expiresAt: new Date(now.getTime() + 50 * 60 * 1000),
          ...response,
        }),
      };
      const service = new ShortLivedInstallationTokenService(issuer, () => now);

      await assert.rejects(
        service.withRepositoryToken(
          { installationId: 42, repositoryId: 101 },
          async () => true,
        ),
        InvalidInstallationTokenError,
      );
    }
  });
});
