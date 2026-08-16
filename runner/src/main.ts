import { resolve } from "node:path";

import { buildRunnerApp } from "./app.js";
import { FirebaseAuthenticationAdapter, createFirebaseIdTokenVerifier } from "./auth/index.js";
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
import { OperatorWorkspaceGateway } from "./operator-workspace/index.js";
import { ExecutionAdmissionService, LocalManagedExecutionProvider } from "./runs/execution.js";
import { ExecutionProviderRegistry } from "./contracts/index.js";
import { createBuildIdentity, RunnerDiagnostics } from "./observability/index.js";
import { GitStudioRepositoryAttestor, HttpStudioRuntimeAttestor, createTrustedBaseStudioResolver } from "./studio/capability.js";
import { StudioSessionService } from "./studio/session.js";

const config = loadConfig();
const studioCapability = config.studio.enabled ? createTrustedBaseStudioResolver({
  configuration: config.studio,
  repository: new GitStudioRepositoryAttestor(config.cwd),
  runtime: new HttpStudioRuntimeAttestor(),
}) : undefined;
const studioSessions = studioCapability === undefined ? undefined : new StudioSessionService(studioCapability);

const databasePath = process.env["RUNNER_DB_PATH"] ?? resolve(config.cwd, ".shipglows-runner.sqlite");
const store = await openOperationalStore(databasePath);
const diagnostics = new RunnerDiagnostics({
  build: createBuildIdentity(process.env),
  probes: [{ name: "database", check: () => { store.schemaVersion(); } }],
});
const eventHub = new EventHub();
const runAdmission = new RunAdmission();
const executionAdmission = new ExecutionAdmissionService(store, new ExecutionProviderRegistry([new LocalManagedExecutionProvider()]), config.limits);
const operatorWorkspaceGateway = new OperatorWorkspaceGateway(config.operatorWorkspaces);
const authentication = config.integrations.firebase.enabled
  ? (() => {
      const projectId = config.integrations.firebase.projectId;
      if (projectId === undefined) throw new Error("Firebase project ID is required when authentication is enabled.");
      return new FirebaseAuthenticationAdapter(
        createFirebaseIdTokenVerifier({ projectId }),
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
      return LocalWorkspaceManager.create({ root: resolve(config.cwd, ".shipglows-workspaces") }).then((workspaces) => {
        const transport = new GitHubAppGitTransport(new ProcessGitCommand(), verifier.withVerifiedRepository.bind(verifier));
        return {
          executor: new ManagedFixCommandExecutor(store, agentRuntime, workspaces, transport, eventHub, config.limits, runAdmission, executionAdmission),
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
  cockpitStore: store,
  idempotencyStore: store,
  eventHub,
  operatorWorkspaceGateway,
  operatorWorkspaceCapability: ({ projectId }: { projectId: string }) => Promise.resolve(operatorWorkspaceGateway.capability(projectId)),
  runAdmission,
  executionAdmission,
  diagnostics,
  ...(studioCapability === undefined ? {} : { studioCapability }),
  ...(studioSessions === undefined ? {} : { studioSessions }),
  ...(resolvedFixRuntime === undefined ? {} : { fixExecutor: resolvedFixRuntime.executor }),
  ...(authentication === undefined ? {} : { authentication }),
  ...(agentRuntime === undefined ? {} : { agentRuntime }),
};
const app = buildRunnerApp({ config, dependencies });
resolvedFixRuntime?.cleanupWorker.start();
app.addHook("onClose", () => {
  resolvedFixRuntime?.cleanupWorker.stop();
  store.close();
  operatorWorkspaceGateway.shutdown();
});
await app.listen({ host: config.server.host, port: config.server.port });
