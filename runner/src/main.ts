import { resolve } from "node:path";

import { buildRunnerApp } from "./app.js";
import { SupabaseAuthenticationAdapter, createSupabaseJwksVerifier } from "./auth/index.js";
import { CodexAppServerRuntime, StdioCodexConnection } from "./agent-runtime/codex/index.js";
import { loadConfig } from "./config.js";
import { openOperationalStore } from "./db/index.js";
import { EventHub } from "./events/index.js";
import {
  GitHubAppInstallationTokenIssuer,
  GitHubRepositoryAccessVerifier,
  GitHubRestRepositoryApi,
  ShortLivedInstallationTokenService,
} from "./github/index.js";
import { RunAdmission } from "./runs/limits.js";
import { ManagedFixCommandExecutor } from "./runs/fix.js";
import { GitHubAppGitTransport, LocalWorkspaceManager, ProcessGitCommand } from "./workspaces/index.js";
import { WorkspaceCleanupWorker } from "./workspaces/cleanup.js";

const config = loadConfig();
const databasePath = process.env["RUNNER_DB_PATH"] ?? resolve(config.cwd, ".shipglowz-runner.sqlite");
const store = await openOperationalStore(databasePath);
const eventHub = new EventHub();
const runAdmission = new RunAdmission();
const authentication = config.integrations.supabase.enabled
  ? (() => {
      const projectUrl = config.integrations.supabase.url;
      if (projectUrl === undefined) throw new Error("Supabase URL is required when authentication is enabled.");
      return new SupabaseAuthenticationAdapter(
        createSupabaseJwksVerifier({
          projectUrl,
          audience: config.integrations.supabase.jwtAudience,
        }),
        { resolve: (input) => Promise.resolve(store.resolveActor(input) ?? null) },
      );
    })()
  : undefined;
const agentRuntime = config.runtimes.codex.enabled
  ? new CodexAppServerRuntime((workspaceRoot) => new StdioCodexConnection({ cwd: workspaceRoot ?? config.cwd }))
  : undefined;
const fixRuntime = config.integrations.github.enabled && agentRuntime !== undefined
  ? (() => {
      const github = config.integrations.github;
      if (github.appId === undefined || github.privateKey === undefined) {
        throw new Error("GitHub App credentials are required for the fix executor.");
      }
      const verifier = new GitHubRepositoryAccessVerifier(
        new ShortLivedInstallationTokenService(
          new GitHubAppInstallationTokenIssuer({
            appId: github.appId,
            privateKey: github.privateKey,
            ...(github.apiBaseUrl === undefined ? {} : { apiBaseUrl: github.apiBaseUrl }),
          }),
        ),
        new GitHubRestRepositoryApi(github.apiBaseUrl === undefined ? {} : { apiBaseUrl: github.apiBaseUrl }),
      );
      return LocalWorkspaceManager.create({ root: resolve(config.cwd, ".shipglowz-workspaces") }).then((workspaces) => {
        const transport = new GitHubAppGitTransport(new ProcessGitCommand(), verifier.withVerifiedRepository.bind(verifier));
        return {
          executor: new ManagedFixCommandExecutor(store, agentRuntime, workspaces, transport, eventHub, config.limits, runAdmission),
          cleanupWorker: new WorkspaceCleanupWorker(store, workspaces, transport),
        };
      });
    })()
  : undefined;
const resolvedFixRuntime = await fixRuntime;
const dependencies = {
  projectAccess: store,
  auditStore: store,
  approvalStore: store,
  conversationStore: store,
  eventStore: store,
  idempotencyStore: store,
  eventHub,
  runAdmission,
  ...(resolvedFixRuntime === undefined ? {} : { fixExecutor: resolvedFixRuntime.executor }),
  ...(authentication === undefined ? {} : { authentication }),
  ...(agentRuntime === undefined ? {} : { agentRuntime }),
};
const app = buildRunnerApp({ config, dependencies });
resolvedFixRuntime?.cleanupWorker.start();
app.addHook("onClose", () => {
  resolvedFixRuntime?.cleanupWorker.stop();
  store.close();
});
await app.listen({ host: config.server.host, port: config.server.port });
