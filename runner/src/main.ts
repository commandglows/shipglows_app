import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

import { buildRunnerApp } from "./app.js";
import { FirebaseAuthenticationAdapter, FixedSingleUserFirebaseAuthenticationAdapter, createFirebaseIdTokenVerifier } from "./auth/index.js";
import { AcpRuntime, StdioAcpConnection } from "./agent-runtime/acp/index.js";
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
import { OperatorWorkspaceGateway, spawnTmuxPty } from "./operator-workspace/index.js";
import { ExecutionAdmissionService, LocalManagedExecutionProvider } from "./runs/execution.js";
import { ExecutionProviderRegistry } from "./contracts/index.js";
import { createBuildIdentity, RunnerDiagnostics } from "./observability/index.js";
import { GitStudioRepositoryAttestor, HttpStudioRuntimeAttestor, createTrustedBaseStudioResolver } from "./studio/capability.js";
import { StudioSessionService } from "./studio/session.js";
import { createLocalStudioProjectCatalog } from "./projects/localStudioProjectCatalog.js";
import { GitHubAppProjectSource, UnavailableGitHubProjectSource } from "./projects/githubProjectSource.js";
import { LocalProjectContextGenerator } from "./projectContextGenerator.js";
import { FileCloudProjectCatalogReader, findCloudProjectByHost } from "./cloud-projects/index.js";
import { PreviewIngressService } from "./preview-ingress/index.js";

const config = loadConfig();
const require = createRequire(import.meta.url);
const codexAcpEntrypoint = require.resolve("@agentclientprotocol/codex-acp");
const studioCapability = config.studio.enabled ? createTrustedBaseStudioResolver({
  configuration: config.studio,
  repository: new GitStudioRepositoryAttestor(config.studio.repositoryRoot, config.studio.repositoryCleanScope),
  runtime: new HttpStudioRuntimeAttestor(),
}) : undefined;
const studioSessions = studioCapability === undefined ? undefined : new StudioSessionService(studioCapability);

const databasePath = process.env["RUNNER_DB_PATH"] ?? resolve(config.cwd, ".shipglows-runner.sqlite");
const store = await openOperationalStore(databasePath);
store.recoverInFlightRuns({ occurredAt: new Date().toISOString() });
const localStudioActor = Object.freeze({ tenantId: "local_studio", userId: "local_operator", subject: "local_studio_operator" });
const localStudioWorkspaceRoot = config.studio.enabled ? dirname(config.studio.repositoryRoot) : undefined;
const localStudioProjects = config.localStudioAuthEnabled && config.studio.enabled && localStudioWorkspaceRoot !== undefined ? createLocalStudioProjectCatalog({
  storagePath: resolve(process.env["LOCALAPPDATA"] ?? config.cwd, "ShipGlows", "Runner", "local-projects.json"),
  allowedRoot: localStudioWorkspaceRoot,
  studioProjectId: config.studio.projectId,
  builtinProjects: [
    { id: "shipglows_app", name: "ShipGlows", repositoryFullName: "shipglows/shipglows_app", repositoryPath: resolve(localStudioWorkspaceRoot, "shipglows_app") },
    { id: "gocharbon", name: "GoCharbon", repositoryFullName: "shipglows/gocharbon", repositoryPath: resolve(localStudioWorkspaceRoot, "gocharbon") },
  ],
}) : undefined;
const localStudioAuthentication = config.localStudioAuthEnabled
  ? { authenticate: () => Promise.resolve(localStudioActor) }
  : undefined;
const githubProjectSource = localStudioProjects === undefined
  ? undefined
  : config.integrations.github.enabled
    ? (() => {
        const github = config.integrations.github;
        if (github.appId === undefined || github.appSlug === undefined || github.privateKey === undefined || github.setupUrl === undefined) {
          throw new Error("GitHub App project-source configuration is incomplete.");
        }
        return new GitHubAppProjectSource({
          appId: github.appId,
          appSlug: github.appSlug,
          privateKey: github.privateKey,
          setupUrl: github.setupUrl,
          storagePath: resolve(process.env["LOCALAPPDATA"] ?? config.cwd, "ShipGlows", "Runner", "github-project-source.json"),
          onConnectionState: (input) => localStudioProjects.management.updateGitHubReadiness(input),
          ...(github.apiBaseUrl === undefined ? {} : { apiBaseUrl: github.apiBaseUrl }),
        });
      })()
    : new UnavailableGitHubProjectSource(false);
const projectAccess = localStudioProjects?.projectAccess ?? store;
const projectContextGenerator = localStudioProjects === undefined
  ? undefined
  : new LocalProjectContextGenerator(localStudioProjects.management, store);
const diagnostics = new RunnerDiagnostics({
  build: createBuildIdentity(process.env),
  probes: [{ name: "database", check: () => { store.schemaVersion(); } }],
});
const eventHub = new EventHub();
const runAdmission = new RunAdmission();
const executionAdmission = new ExecutionAdmissionService(store, new ExecutionProviderRegistry([new LocalManagedExecutionProvider()]), config.limits);
const personalCloudConfig = config.personalCloud.enabled ? config.personalCloud : undefined;
const cloudProjectCatalog = personalCloudConfig !== undefined
  ? new FileCloudProjectCatalogReader(personalCloudConfig.catalogPath, personalCloudConfig.allowedRoots)
  : undefined;
const operatorWorkspaceGateway = new OperatorWorkspaceGateway(
  config.operatorWorkspaces,
  spawnTmuxPty,
  {},
  60_000,
  personalCloudConfig?.appOrigin ?? config.server.allowedOrigins[0],
);
const reconcileCloudProjects = personalCloudConfig !== undefined && cloudProjectCatalog !== undefined
  ? async (actor: { readonly tenantId: string; readonly userId: string }) => {
      if (actor.tenantId !== personalCloudConfig.tenantId || actor.userId !== personalCloudConfig.userId) throw new Error("Personal Cloud actor mismatch.");
      const snapshot = await cloudProjectCatalog.read();
      const cloudWorkspaces: Record<string, { cwd: string; tmuxSession: string }> = {};
      for (const project of snapshot.entries) {
        store.ensureLocalProjectContextTarget({ tenantId: actor.tenantId, userId: actor.userId, projectId: project.projectId });
        if (project.capabilities.workspace && project.privateRuntime.tmuxSession !== undefined) {
          cloudWorkspaces[project.projectId] = { cwd: project.privateRuntime.cwd, tmuxSession: project.privateRuntime.tmuxSession };
        }
      }
      operatorWorkspaceGateway.reconcileWorkspaces({ ...config.operatorWorkspaces, ...cloudWorkspaces });
    }
  : undefined;
const authentication = config.integrations.firebase.enabled
  ? (() => {
      const projectId = config.integrations.firebase.projectId;
      if (projectId === undefined) throw new Error("Firebase project ID is required when authentication is enabled.");
      const verifier = createFirebaseIdTokenVerifier({ projectId });
      return config.personalCloud.enabled
        ? new FixedSingleUserFirebaseAuthenticationAdapter(verifier, config.personalCloud.firebaseUid, config.personalCloud.tenantId, config.personalCloud.userId)
        : new FirebaseAuthenticationAdapter(verifier, { resolve: (input) => Promise.resolve(store.resolveActor(input) ?? null) });
    })()
  : undefined;
const agentRuntime = config.runtimes.codex.enabled
  ? new AcpRuntime({
      id: "codex",
      modeIds: { readOnly: "read-only", workspaceWrite: "agent" },
      factory: ({ cwd, handlers }) => new StdioAcpConnection({
        cwd,
        command: process.execPath,
        args: [codexAcpEntrypoint],
        handlers,
      }),
    })
  : undefined;
const previewIngress = personalCloudConfig !== undefined && cloudProjectCatalog !== undefined
  ? new PreviewIngressService(
      {
        resolveByHost: async (host) => findCloudProjectByHost(await cloudProjectCatalog.read(), host, personalCloudConfig.previewDomain),
      },
      {
        hasAccess: (input) => projectAccess.hasProjectAccess({ ...input, capability: "read" }),
      },
      personalCloudConfig.appOrigin,
    )
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
  projectAccess,
  auditStore: store,
  approvalStore: store,
  conversationStore: store,
  eventStore: store,
  projectContextStore: store,
  ...(projectContextGenerator === undefined ? {} : { projectContextGenerator }),
  cockpitStore: localStudioProjects?.cockpitStore ?? store,
  ...(localStudioProjects === undefined ? {} : { localProjectManagement: localStudioProjects.management }),
  ...(localStudioProjects === undefined ? {} : { projectWorkspaceResolver: (input: Parameters<typeof localStudioProjects.management.resolveLocalRepository>[0]) => localStudioProjects.management.resolveLocalRepository(input) }),
  ...(githubProjectSource === undefined ? {} : { githubProjectSource }),
  idempotencyStore: store,
  eventHub,
  operatorWorkspaceGateway,
  operatorWorkspaceCapability: ({ projectId }: { projectId: string }) => Promise.resolve(operatorWorkspaceGateway.capability(projectId)),
  runAdmission,
  executionAdmission,
  diagnostics,
  ...(cloudProjectCatalog === undefined ? {} : { cloudProjectCatalog }),
  ...(previewIngress === undefined ? {} : { previewIngress }),
  ...(reconcileCloudProjects === undefined ? {} : { reconcileCloudProjects }),
  ...(studioCapability === undefined ? {} : { studioCapability }),
  ...(studioSessions === undefined ? {} : { studioSessions }),
  ...(resolvedFixRuntime === undefined ? {} : { fixExecutor: resolvedFixRuntime.executor }),
  ...(localStudioAuthentication !== undefined ? { authentication: localStudioAuthentication } : authentication === undefined ? {} : { authentication }),
  ...(agentRuntime === undefined ? {} : { agentRuntime }),
};
const app = buildRunnerApp({ config, dependencies });
resolvedFixRuntime?.cleanupWorker.start();
app.addHook("onClose", async () => {
  resolvedFixRuntime?.cleanupWorker.stop();
  await agentRuntime?.close();
  store.recoverInFlightRuns({ occurredAt: new Date().toISOString() });
  store.close();
  operatorWorkspaceGateway.shutdown();
});
await app.listen({ host: config.server.host, port: config.server.port });
