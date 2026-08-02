import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CodexAppServerRuntime, StdioCodexConnection } from "../src/agent-runtime/codex/index.js";
import type { OpaqueId } from "../src/contracts/index.js";
import {
  GitHubAppInstallationTokenIssuer,
  GitHubRepositoryAccessVerifier,
  GitHubRestRepositoryApi,
  ShortLivedInstallationTokenService,
  type GitHubRepositoryBinding,
} from "../src/github/index.js";
import { GitHubAppGitTransport, LocalWorkspaceManager, ProcessGitCommand } from "../src/workspaces/index.js";

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") throw new Error(`Missing required provider smoke variable: ${name}`);
  return value;
}

function positiveInteger(name: string): number {
  const value = Number(required(name));
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
}

function opaque(value: string): OpaqueId {
  return value as OpaqueId;
}

async function main(): Promise<void> {
  if (!process.argv.includes("--confirm")) {
    throw new Error("Provider smoke is disabled by default. Re-run with --confirm after reviewing the read-only scope.");
  }
  const binding: GitHubRepositoryBinding = {
    installationId: positiveInteger("RUNNER_SMOKE_GITHUB_INSTALLATION_ID"),
    repositoryId: positiveInteger("RUNNER_SMOKE_GITHUB_REPOSITORY_ID"),
    fullName: required("RUNNER_SMOKE_GITHUB_FULL_NAME"),
    defaultBranch: required("RUNNER_SMOKE_GITHUB_DEFAULT_BRANCH"),
  };
  const appId = required("GITHUB_APP_ID");
  const privateKey = required("GITHUB_PRIVATE_KEY").replace(/\\n/g, "\n");
  const apiBaseUrl = process.env["GITHUB_API_BASE_URL"];
  const issuer = new GitHubAppInstallationTokenIssuer({ appId, privateKey, ...(apiBaseUrl === undefined ? {} : { apiBaseUrl }) });
  const verifier = new GitHubRepositoryAccessVerifier(
    new ShortLivedInstallationTokenService(issuer),
    new GitHubRestRepositoryApi(apiBaseUrl === undefined ? {} : { apiBaseUrl }),
  );
  const root = await mkdtemp(join(tmpdir(), "shipglows-provider-smoke-"));
  const workspaces = await LocalWorkspaceManager.create({ root });
  const runtime = new CodexAppServerRuntime((workspaceRoot) => new StdioCodexConnection({ cwd: workspaceRoot ?? root }));
  try {
    const transport = new GitHubAppGitTransport(new ProcessGitCommand(), verifier.withVerifiedRepository.bind(verifier));
    const workspace = await workspaces.createAuditWorktree({ projectId: "smoke_project", conversationId: "smoke_conversation", binding, transport });
    const session = await runtime.createSession({ conversationId: opaque("smoke_conversation"), workspaceRoot: workspace.root });
    const turn = await runtime.startTurn({
      runtimeSessionId: session.runtimeSessionId,
      message: "Read only the repository root and report the top-level entries. Do not modify files, create branches, commit, or access the network.",
    });
    let terminal = false;
    for await (const event of runtime.events({ runtimeSessionId: session.runtimeSessionId })) {
      if (event.type === "turn.completed" || event.type === "turn.failed" || event.type === "turn.interrupted") {
        terminal = true;
        if (event.type !== "turn.completed") throw new Error(`Codex provider smoke ended with ${event.type}.`);
        break;
      }
    }
    if (!terminal) throw new Error("Codex provider smoke ended without a terminal turn event.");
    console.log(`Provider smoke passed for GitHub repository ${binding.fullName} (${binding.repositoryId}); Codex turn completed.`);
    void turn;
  } finally {
    await runtime.close();
    await workspaces.close();
  }
}

try {
  await main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : "Provider smoke failed.");
  process.exitCode = 1;
}
