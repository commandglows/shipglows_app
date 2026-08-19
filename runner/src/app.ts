import Fastify, { type FastifyReply, type preHandlerAsyncHookHandler } from "fastify";
import websocket from "@fastify/websocket";
import { Readable } from "node:stream";
import { TypeBoxValidatorCompiler } from "@fastify/type-provider-typebox";
import { Type } from "typebox";
import {
  DisabledAuthenticationAdapter,
  authenticationGuard,
  type AuthenticationAdapter,
} from "./auth/index.js";
import type { RunnerConfig } from "./config.js";
import { HttpError, installErrorHandler, CommandRequestSchemas, VersionResponseSchema } from "./contracts/index.js";
import type { CockpitProjectRecord, OperationalStore } from "./db/index.js";
import type { PersistedEvent } from "./db/index.js";
import type { AgentRuntime, SafePayload } from "./contracts/index.js";
import type { ProjectWorkspaceResolver } from "./contracts/index.js";
import type { EventHub } from "./events/index.js";
import { AuditCommandService } from "./runs/audit.js";
import { RunLimitError } from "./runs/limits.js";
import type { RunAdmission } from "./runs/limits.js";
import { FixUnavailableError, type FixCommandExecutor } from "./runs/fix.js";
import { ApprovalCommandError, ApprovalCommandService } from "./runs/approval.js";
import { ConversationCommandError, ConversationCommandService } from "./runs/conversation.js";
import type { ExecutionAdmissionService } from "./runs/execution.js";
import {
  projectAuthorizationGuard,
  type ProjectAccessRepository,
} from "./projects/projectAccess.js";
import type { LocalProjectManagement } from "./projects/localStudioProjectCatalog.js";
import { registerLocalProjectRoutes } from "./projects/localProjectRoutes.js";
import type { GitHubProjectSource } from "./projects/githubProjectSource.js";
import { registerGitHubProjectRoutes } from "./projects/githubProjectRoutes.js";
import { stateChangingOriginGuard } from "./security/requestPolicy.js";
import { OperatorWorkspaceError, type OperatorWorkspaceGateway } from "./operator-workspace/index.js";
import type { RunnerDiagnostics } from "./observability/index.js";
import type { StudioCapabilityResolver } from "./studio/capability.js";
import type { StudioSessionService } from "./studio/session.js";
import { registerStudioRoutes } from "./studio/routes.js";
import { registerCompilationRoutingRoutes, type CompilationRoutingProjectionResolver } from "./studio/compilationRoutingRoutes.js";
import { registerActivityReviewRoutes } from "./activityReviewRoutes.js";
import { registerProjectContextRoutes } from "./projectContextRoutes.js";
import type { ProjectContextGenerator } from "./projectContextRoutes.js";
import { CloudProjectCatalogError, redactCloudProject, type CloudProjectCatalogReader } from "./cloud-projects/index.js";
import { PreviewIngressError, type PreviewIngressService } from "./preview-ingress/index.js";

const ProjectAuthorizationResponseSchema = Type.Object(
  {
    projectId: Type.String({ minLength: 1, maxLength: 128 }),
    access: Type.Literal("read"),
  },
  { $id: "shipglows.v1.project.authorization.response", additionalProperties: false },
);

const ProjectIdentityResolutionResponseSchema = Type.Object(
  {
    sourceSystem: Type.String({ minLength: 1, maxLength: 64 }),
    sourceProjectId: Type.String({ minLength: 1, maxLength: 128 }),
    projectId: Type.String({ minLength: 1, maxLength: 128 }),
  },
  { $id: "shipglows.v1.project.identity-resolution.response", additionalProperties: false },
);

const noProjectAccess: ProjectAccessRepository = {
  hasProjectAccess: () => false,
};

const cockpitDimension = Type.Object({
  dimension: Type.String(), status: Type.String(), summary: Type.Record(Type.String(), Type.Unknown()),
  producer: Type.String(), evidenceCount: Type.Integer({ minimum: 0 }), sourceCommit: Type.Union([Type.String(), Type.Null()]), checkedAt: Type.Union([Type.String(), Type.Null()]),
}, { additionalProperties: false });
const cockpitResponse = Type.Object({ generatedAt: Type.String(), projects: Type.Array(Type.Object({
  id: Type.String(), name: Type.String(), repositoryFullName: Type.String(), accessState: Type.String(), conversationCount: Type.Integer({ minimum: 0 }), activeRunCount: Type.Integer({ minimum: 0 }),
  health: Type.Object({ overallStatus: Type.String(), coverage: Type.Number(), dimensions: Type.Array(cockpitDimension) }, { additionalProperties: false }),
}, { additionalProperties: false })) }, { $id: "shipglowz.v1.cockpit.response", additionalProperties: false });

const LivenessResponseSchema = Type.Object(
  { status: Type.Literal("ok") },
  { $id: "shipglows.v1.liveness.response", additionalProperties: false },
);

const DiagnosticResponseSchema = Type.Object({
  status: Type.Union([Type.Literal("ok"), Type.Literal("degraded")]),
  build: Type.Object({
    service: Type.Literal("shipglows-managed-runner"),
    version: Type.Literal("0.1.0"),
    buildId: Type.String({ maxLength: 128 }),
    commit: Type.String({ maxLength: 128 }),
    builtAtUtc: Type.String({ maxLength: 64 }),
    builtAtParis: Type.String({ maxLength: 64 }),
  }, { additionalProperties: false }),
  generatedAtUtc: Type.String({ maxLength: 64 }),
  generatedAtParis: Type.String({ maxLength: 64 }),
  checks: Type.Array(Type.Object({
    name: Type.String({ maxLength: 32 }),
    status: Type.Union([Type.Literal("ok"), Type.Literal("failed")]),
    code: Type.Union([Type.Literal("available"), Type.Literal("dependencyFailure")]),
  }, { additionalProperties: false }), { maxItems: 16 }),
}, { $id: "shipglows.v1.diagnostics.response", additionalProperties: false });

export interface RunnerAppDependencies {
  readonly authentication?: AuthenticationAdapter;
  readonly projectAccess?: ProjectAccessRepository;
  readonly auditStore?: Pick<OperationalStore, "createConversation" | "createRun" | "appendEvent" | "saveRuntimeSession" | "checkpointRun"> & Partial<Pick<OperationalStore, "createApproval" | "getApproval" | "resolveApproval">>;
  readonly eventStore?: Pick<OperationalStore, "getConversation" | "listEvents"> & Partial<Pick<OperationalStore, "listConversations" | "getApproval" | "getRun">>;
  readonly cockpitStore?: Pick<OperationalStore, "listCockpitProjects">;
  readonly projectContextStore?: Pick<OperationalStore, "getLatestProjectContextBundle">;
  readonly projectContextGenerator?: ProjectContextGenerator;
  readonly localProjectManagement?: LocalProjectManagement;
  readonly projectWorkspaceResolver?: ProjectWorkspaceResolver;
  readonly githubProjectSource?: GitHubProjectSource;
  readonly operatorWorkspaceCapability?: (input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }) => Promise<{ readonly available: boolean; readonly reason: string }>;
  readonly operatorWorkspaceGateway?: OperatorWorkspaceGateway;
  readonly eventHub?: EventHub;
  readonly runAdmission?: RunAdmission;
  readonly fixExecutor?: FixCommandExecutor;
  readonly idempotencyStore?: Pick<OperationalStore, "executeIdempotentAsync">;
  readonly approvalStore?: Pick<OperationalStore, "getApproval" | "getRun" | "getRuntimeSession" | "resolveApproval" | "appendEvent">;
  readonly conversationStore?: Pick<OperationalStore, "createConversation" | "getConversation" | "createRun" | "getRun" | "getLatestRun" | "saveRuntimeSession" | "getRuntimeSession" | "checkpointRun" | "appendEvent"> & Partial<Pick<OperationalStore, "createApproval" | "getApproval" | "resolveApproval">>;
  readonly agentRuntime?: AgentRuntime;
  readonly executionAdmission?: ExecutionAdmissionService;
  readonly diagnostics?: RunnerDiagnostics;
  readonly studioCapability?: StudioCapabilityResolver;
  readonly studioSessions?: StudioSessionService;
  readonly studioCompilationRouting?: CompilationRoutingProjectionResolver;
  readonly cloudProjectCatalog?: CloudProjectCatalogReader;
  readonly previewIngress?: PreviewIngressService;
  readonly reconcileCloudProjects?: (actor: { readonly tenantId: string; readonly userId: string }) => Promise<void>;
  readonly previewDiagnosticSink?: (event: {
    readonly diagnosticId: string;
    readonly projectId: string;
    readonly stage: string;
    readonly code: string;
    readonly browserFamily: string;
    readonly occurredAt: string;
  }) => void;
  readonly workspaceDiagnosticSink?: (event: {
    readonly diagnosticId: string;
    readonly projectId: string;
    readonly surface: "editor" | "terminal";
    readonly stage: string;
    readonly code: string;
    readonly browserFamily: string;
    readonly occurredAt: string;
  }) => void;
  readonly accessDiagnosticSink?: (event: {
    readonly method: string;
    readonly route: string;
    readonly statusCode: 401 | 403;
    readonly requestId: string;
  }) => void;
}

function browserFamily(userAgent: string | undefined): string {
  const value = userAgent?.toLowerCase() ?? "";
  if (value.includes("vivaldi")) return "vivaldi";
  if (value.includes("edg/")) return "edge";
  if (value.includes("firefox/")) return "firefox";
  if (value.includes("safari/") && !value.includes("chrome/")) return "safari";
  if (value.includes("chrome/")) return "chromium";
  return "unknown";
}

function eventFrame(event: PersistedEvent): string {
  return `id: ${event.cursor}\nevent: ${event.type}\ndata: ${JSON.stringify({
    cursor: event.cursor,
    id: event.id,
    type: event.type,
    payload: event.payload,
    occurredAt: event.occurredAt,
  })}\n\n`;
}

function nextWithTimeout<T>(iterator: AsyncIterator<T>, timeoutMs: number): Promise<IteratorResult<T>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ done: true, value: undefined as T }), timeoutMs);
    void iterator.next().then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error("SSE event iterator failed."));
      },
    );
  });
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value.length > 0 ? value : undefined;
  }
  return undefined;
}

function previewError(reply: FastifyReply, error: unknown) {
  if (error instanceof PreviewIngressError) {
    return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
  }
  throw error;
}

export function buildRunnerApp({
  config,
  dependencies = {},
}: {
  config: RunnerConfig;
  dependencies?: RunnerAppDependencies;
}) {
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024 });
  void app.register(websocket, { options: { maxPayload: 20 * 1024 } });
  void app.register((routeScope, _options, done) => {
  const app = routeScope;
  app.setValidatorCompiler(TypeBoxValidatorCompiler);
  installErrorHandler(app);
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (typeof origin !== "string") return;
    const allowed = config.server.allowedOrigins.includes(origin);
    if (!allowed) {
      if (request.method === "OPTIONS") return reply.status(403).send();
      return;
    }
    reply
      .header("Access-Control-Allow-Origin", origin)
      .header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
      .header("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key, X-ShipGlows-Tenant")
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Max-Age", "600");
    if (request.method === "OPTIONS") return reply.status(204).send();
  });
  app.addHook("onResponse", async (request, reply) => {
    if (reply.statusCode !== 401 && reply.statusCode !== 403) return;
    dependencies.accessDiagnosticSink?.({
      method: request.method,
      route: request.routeOptions.url ?? request.url.split("?", 1)[0] ?? "unknown",
      statusCode: reply.statusCode,
      requestId: request.id,
    });
  });
  app.options("*", async (_request, reply) => reply.status(404).send());
  const authentication = dependencies.authentication ?? new DisabledAuthenticationAdapter();
  const projectAccess = dependencies.projectAccess ?? noProjectAccess;
  const cloudProjectCatalog = dependencies.cloudProjectCatalog;
  const previewIngress = dependencies.previewIngress;
  const reconcileCloudProjects = dependencies.reconcileCloudProjects;
  const surfaceDiagnosticWindows = new Map<string, { startedAt: number; count: number }>();
  const reconcileCloudProjectsGuard: preHandlerAsyncHookHandler = async (request) => {
    const actor = request.shipglowsActor;
    if (actor === undefined) throw new Error("Authenticated actor is missing.");
    try {
      await reconcileCloudProjects?.({ tenantId: actor.tenantId, userId: actor.userId });
    } catch (error) {
      if (error instanceof CloudProjectCatalogError) throw new HttpError(503, error.code, error.message);
      throw error;
    }
  };
  if (cloudProjectCatalog !== undefined) {
    app.get("/v1/cloud-projects", { preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard] }, async (request) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      let snapshot;
      try {
        snapshot = await cloudProjectCatalog.read();
      } catch (error) {
        if (error instanceof CloudProjectCatalogError) throw new HttpError(503, error.code, error.message);
        throw error;
      }
      const projects = [];
      for (const project of snapshot.entries) {
        if (await projectAccess.hasProjectAccess({ tenantId: actor.tenantId, userId: actor.userId, projectId: project.projectId, capability: "read" })) projects.push(redactCloudProject(project));
      }
      return { generatedAt: snapshot.generatedAt, projects };
    });
  }
  if (previewIngress !== undefined && cloudProjectCatalog !== undefined) {
    app.post<{ Params: { projectId: string }; Body: { diagnosticId: string; stage: string; code: string; occurredAt: string } }>("/v1/projects/:projectId/preview-diagnostics", {
      preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard, projectAuthorizationGuard(projectAccess, "read"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128, pattern: "^[A-Za-z0-9_-]+$" }) }),
        body: Type.Object({
          diagnosticId: Type.String({ minLength: 12, maxLength: 64, pattern: "^pd_[A-Za-z0-9]+$" }),
          stage: Type.Union([Type.Literal("bootstrap"), Type.Literal("frame"), Type.Literal("recovery")]),
          code: Type.Union([Type.Literal("timeout"), Type.Literal("frame_error"), Type.Literal("browser_help"), Type.Literal("popup_blocked"), Type.Literal("reported")]),
          occurredAt: Type.String({ minLength: 20, maxLength: 40, format: "date-time" }),
        }, { additionalProperties: false }),
      },
    }, async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      const now = Date.now();
      const key = `${actor.tenantId}:${actor.userId}`;
      const current = surfaceDiagnosticWindows.get(key);
      const window = current === undefined || now - current.startedAt >= 60_000 ? { startedAt: now, count: 0 } : current;
      window.count += 1;
      surfaceDiagnosticWindows.set(key, window);
      if (window.count > 30) return await reply.status(429).send({ error: { code: "rateLimited", message: "Too many preview diagnostics." } });
      dependencies.previewDiagnosticSink?.({
        diagnosticId: request.body.diagnosticId,
        projectId: request.params.projectId,
        stage: request.body.stage,
        code: request.body.code,
        browserFamily: browserFamily(request.headers["user-agent"]),
        occurredAt: request.body.occurredAt,
      });
      return await reply.status(202).send({ diagnosticId: request.body.diagnosticId, accepted: true });
    });
    app.post<{ Params: { projectId: string }; Body: Record<string, never> }>("/v1/projects/:projectId/preview-ticket", {
      preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard, projectAuthorizationGuard(projectAccess, "read"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: { params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }), body: Type.Object({}) },
    }, async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      try {
        const snapshot = await cloudProjectCatalog.read();
        const project = snapshot.entries.find((entry) => entry.projectId === request.params.projectId);
        if (project === undefined || !config.personalCloud.enabled) return await reply.status(503).send({ error: { code: "previewUnavailable", message: "Preview access is unavailable." } });
        const host = `${project.previewSlug}.${config.personalCloud.previewDomain}`;
        const ticket = await previewIngress.createTicket({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, host, origin: request.headers.origin ?? "" });
        return await reply.status(201).send({ ...ticket, origin: `https://${host}` });
      } catch (error) { return await previewError(reply, error); }
    });
    app.post<{ Body: { ticketId: string; secret: string } }>("/v1/preview/session", {
      preHandler: [authenticationGuard(authentication), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: { body: Type.Object({ ticketId: Type.String({ minLength: 8, maxLength: 128 }), secret: Type.String({ minLength: 32, maxLength: 128 }) }) },
    }, async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      try {
        const cookie = await previewIngress.consumeTicket({ tenantId: actor.tenantId, userId: actor.userId, ticketId: request.body.ticketId, secret: request.body.secret, host: request.hostname, origin: request.headers.origin ?? "" });
        return await reply.header("Set-Cookie", `${cookie.name}=${cookie.value}; ${cookie.attributes}; Max-Age=${cookie.maxAgeSeconds}`).header("Cache-Control", "no-store").send({ state: "ready" });
      } catch (error) { return await previewError(reply, error); }
    });
    app.get("/v1/preview/authorize", async (request, reply) => {
      try {
        const cookie = readCookie(request.headers.cookie, "__Host-shipglows_preview");
        const result = await previewIngress.authorize({ cookie, host: request.hostname, ...(request.headers.origin === undefined ? {} : { origin: request.headers.origin }), websocket: request.headers.upgrade?.toLowerCase() === "websocket" });
        return await reply.header("X-ShipGlows-Project", result.projectId).send({ state: "authorized" });
      } catch (error) { return await previewError(reply, error); }
    });
    app.get<{ Querystring: { domain?: string } }>("/v1/preview/tls-ask", async (request, reply) => {
      const domain = request.query.domain ?? "";
      try {
        const snapshot = await cloudProjectCatalog.read();
        const allowed = snapshot.entries.some((project) => project.capabilities.preview && `${project.previewSlug}.${config.personalCloud.enabled ? config.personalCloud.previewDomain : "invalid"}` === domain.toLowerCase());
        return allowed ? await reply.send({ allowed: true }) : await reply.status(404).send({ allowed: false });
      } catch { return await reply.status(503).send({ allowed: false }); }
    });
  }
  if (dependencies.localProjectManagement !== undefined) {
    registerLocalProjectRoutes(app, {
      authentication,
      management: dependencies.localProjectManagement,
      allowedOrigins: config.server.allowedOrigins,
    });
    if (dependencies.githubProjectSource !== undefined) {
      registerGitHubProjectRoutes(app, {
        authentication,
        source: dependencies.githubProjectSource,
        management: dependencies.localProjectManagement,
        allowedOrigins: config.server.allowedOrigins,
      });
    }
  }

  app.get(
    "/health/live",
    { schema: { response: { 200: LivenessResponseSchema } } },
    () => ({ status: "ok" as const }),
  );

  registerStudioRoutes(app, {
    authentication,
    projectAccess,
    allowedOrigins: config.server.allowedOrigins,
    ...(dependencies.studioCapability === undefined ? {} : { capability: dependencies.studioCapability }),
    ...(dependencies.studioSessions === undefined ? {} : { sessions: dependencies.studioSessions }),
  });
  registerCompilationRoutingRoutes(app, {
    authentication,
    projectAccess,
    ...(dependencies.studioCompilationRouting === undefined ? {} : { resolver: dependencies.studioCompilationRouting }),
  });
  registerActivityReviewRoutes(app, {
    authentication,
    projectAccess,
    ...(dependencies.eventStore?.listConversations === undefined
      ? {}
      : {
          store: dependencies.eventStore as Pick<
            OperationalStore,
            "listConversations" | "listEvents"
          > &
            Partial<Pick<OperationalStore, "getApproval" | "getRun">>,
        }),
  });
  registerProjectContextRoutes(app, {
    authentication,
    projectAccess,
    allowedOrigins: config.server.allowedOrigins,
    ...(dependencies.projectContextStore === undefined
      ? {}
      : { store: dependencies.projectContextStore }),
    ...(dependencies.projectContextGenerator === undefined
      ? {}
      : { generator: dependencies.projectContextGenerator }),
    ...(dependencies.idempotencyStore === undefined
      ? {}
      : { idempotencyStore: dependencies.idempotencyStore }),
  });

  app.get(
    "/v1/version",
    { schema: { response: { 200: VersionResponseSchema } } },
    () => ({
      apiVersion: "v1" as const,
      service: "shipglows-managed-runner",
      serviceVersion: "0.1.0",
      providers: {
        firebase: config.integrations.firebase.enabled,
        github: config.integrations.github.enabled,
        codex: config.runtimes.codex.enabled,
        eve: config.runtimes.eve.enabled,
      },
    }),
  );

  app.get(
    "/v1/diagnostics",
    {
      preHandler: [authenticationGuard(authentication)],
      schema: { response: { 200: DiagnosticResponseSchema, 503: DiagnosticResponseSchema } },
    },
    async (_request, reply) => {
      const diagnostics = dependencies.diagnostics;
      if (diagnostics === undefined) {
        return reply.status(503).send({
          status: "degraded",
          build: {
            service: "shipglows-managed-runner",
            version: "0.1.0",
            buildId: "unknown",
            commit: "unknown",
            builtAtUtc: "unknown",
            builtAtParis: "unknown",
          },
          generatedAtUtc: new Date(0).toISOString(),
          generatedAtParis: "1970-01-01T01:00:00 Europe/Paris",
          checks: [{ name: "diagnostics", status: "failed", code: "dependencyFailure" }],
        });
      }
      const snapshot = await diagnostics.snapshot();
      return reply.status(snapshot.status === "ok" ? 200 : 503).send(snapshot);
    },
  );

  app.get(
    "/v1/cockpit",
    {
      preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard],
      schema: { response: { 200: cockpitResponse, 503: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }) } },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const store = dependencies.cockpitStore;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (store === undefined) return reply.status(503).send({ error: { code: "cockpitUnavailable", message: "Cockpit projection is unavailable." } });
      const projects = store.listCockpitProjects({ tenantId: actor.tenantId, userId: actor.userId });
      const cloudNames = cloudProjectCatalog === undefined
        ? new Map<string, string>()
        : new Map((await cloudProjectCatalog.read()).entries.map((project) => [project.projectId, project.displayName]));
      return {
        generatedAt: new Date().toISOString(),
        projects: projects.map((project: CockpitProjectRecord) => {
          const cloudName = cloudNames.get(project.id);
          return {
            id: project.id,
            name: cloudName ?? project.name,
            repositoryFullName: cloudName !== undefined && project.repositoryFullName === project.id
              ? cloudName
              : project.repositoryFullName,
            accessState: project.accessState,
            conversationCount: project.conversationCount,
            activeRunCount: project.activeRunCount,
            health: project.health,
          };
        }),
      };
    },
  );

  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/operator-workspace",
    {
      preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard, projectAuthorizationGuard(projectAccess, "read")],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        response: {
          200: Type.Object({
            available: Type.Boolean(),
            reason: Type.String(),
            protocolVersion: Type.Literal(2),
            surfaces: Type.Array(Type.Union([Type.Literal("editor"), Type.Literal("terminal")]), { minItems: 2, maxItems: 2 }),
          }, { $id: "shipglowz.v2.operator-workspace.capability", additionalProperties: false }),
          503: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (dependencies.operatorWorkspaceCapability === undefined) {
        return reply.status(503).send({ error: { code: "operatorWorkspaceUnavailable", message: "The operator Workspace is not configured on this runner." } });
      }
      const capability = await dependencies.operatorWorkspaceCapability({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId });
      return { ...capability, protocolVersion: 2 as const, surfaces: ["editor", "terminal"] as const };
    },
  );

  app.post<{ Params: { projectId: string }; Headers: { "idempotency-key": string }; Body: { surface: "editor" | "terminal" } }>(
    "/v1/projects/:projectId/operator-sessions",
    {
      preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard, projectAuthorizationGuard(projectAccess, "mutate"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        headers: Type.Object({ "idempotency-key": Type.String({ minLength: 8, maxLength: 128 }) }, { additionalProperties: true }),
        body: Type.Object({ surface: Type.Union([Type.Literal("editor"), Type.Literal("terminal")]) }, { additionalProperties: false }),
        response: {
          201: Type.Object({ sessionId: Type.String(), token: Type.String(), projectId: Type.String(), expiresAt: Type.String() }, { additionalProperties: false }),
          409: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
          503: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const gateway = dependencies.operatorWorkspaceGateway;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (gateway === undefined) return reply.status(503).send({ error: { code: "operatorWorkspaceUnavailable", message: "The operator Workspace is not configured on this runner." } });
      try {
        const session = gateway.create({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, surface: request.body.surface, idempotencyKey: request.headers["idempotency-key"] });
        return await reply.status(201).send({ sessionId: session.id, token: session.token, projectId: session.projectId, expiresAt: session.expiresAt });
      } catch (error) {
        if (error instanceof OperatorWorkspaceError) {
          const status = error.statusCode === 409 ? 409 : 503;
          return reply.status(status).send({ error: { code: error.code, message: error.message } });
        }
        throw error;
      }
    },
  );

  app.post<{ Params: { sessionId: string } }>(
    "/v1/operator-sessions/:sessionId/close",
    {
      preHandler: [authenticationGuard(authentication), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ sessionId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        response: { 200: Type.Object({ state: Type.Literal("closed") }, { additionalProperties: false }), 404: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }) },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      const closed = dependencies.operatorWorkspaceGateway?.closeOwned({ sessionId: request.params.sessionId, tenantId: actor.tenantId, userId: actor.userId }) ?? false;
      return closed ? reply.send({ state: "closed" as const }) : reply.status(404).send({ error: { code: "operatorSessionNotFound", message: "The operator session is unavailable." } });
    },
  );

  app.get<{ Params: { sessionId: string } }>(
    "/v1/operator-sessions/:sessionId/stream",
    { websocket: true, schema: { params: Type.Object({ sessionId: Type.String() }) } },
    (socket, request) => {
      const gateway = dependencies.operatorWorkspaceGateway;
      if (gateway === undefined) return socket.close(1011, "Workspace unavailable.");
      const protocol = request.headers["sec-websocket-protocol"];
      const token = typeof protocol === "string" && protocol.startsWith("shipglows.workspace.") ? protocol.slice("shipglows.workspace.".length) : "";
      gateway.attach(request.params.sessionId, token, socket, request.headers.origin);
    },
  );

  app.get<{
    Querystring: { sourceSystem: string; sourceProjectId: string };
  }>(
    "/v1/projects/resolve",
    {
      preHandler: [authenticationGuard(authentication)],
      schema: {
        querystring: Type.Object(
          {
            sourceSystem: Type.String({ minLength: 1, maxLength: 64, pattern: "^[A-Za-z0-9_-]+$" }),
            sourceProjectId: Type.String({ minLength: 1, maxLength: 128, pattern: "^[A-Za-z0-9_-]+$" }),
          },
          { additionalProperties: false },
        ),
        response: {
          200: ProjectIdentityResolutionResponseSchema,
          404: Type.Object({ error: Type.Object({ code: Type.Literal("projectIdentityNotFound"), message: Type.String() }) }),
          503: Type.Object({ error: Type.Object({ code: Type.Literal("identityUnavailable"), message: Type.String() }) }),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const configuredResolver = projectAccess.resolveProjectId;
      const resolver = configuredResolver === undefined
        ? undefined
        : (input: Parameters<NonNullable<ProjectAccessRepository["resolveProjectId"]>>[0]) =>
            configuredResolver(input);
      if (actor === undefined) return reply.status(401).send({ error: { code: "unauthorized", message: "Authentication is required." } });
      if (resolver === undefined) return reply.status(503).send({ error: { code: "identityUnavailable", message: "Canonical project identity resolution is unavailable." } });
      const projectId = await resolver({
        tenantId: actor.tenantId,
        userId: actor.userId,
        sourceSystem: request.query.sourceSystem,
        sourceProjectId: request.query.sourceProjectId,
      });
      if (projectId === null || !(await projectAccess.hasProjectAccess({ tenantId: actor.tenantId, userId: actor.userId, projectId, capability: "read" }))) {
        return reply.status(404).send({ error: { code: "projectIdentityNotFound", message: "The project identity is unavailable." } });
      }
      return reply.send({
        sourceSystem: request.query.sourceSystem,
        sourceProjectId: request.query.sourceProjectId,
        projectId,
      });
    },
  );

  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/authorization",
    {
      preHandler: [
        authenticationGuard(authentication),
        projectAuthorizationGuard(projectAccess, "read"),
      ],
      schema: {
        params: Type.Object(
          { projectId: Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: false },
        ),
        response: { 200: ProjectAuthorizationResponseSchema },
      },
    },
    (request) => ({ projectId: request.params.projectId, access: "read" as const }),
  );

  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/conversations",
    {
      preHandler: [authenticationGuard(authentication), projectAuthorizationGuard(projectAccess, "read")],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        response: { 200: Type.Object({ conversations: Type.Array(Type.Object({ id: Type.String(), projectId: Type.String(), title: Type.String(), state: Type.String() }, { additionalProperties: false })) }, { additionalProperties: false }) },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const store = dependencies.eventStore;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (store?.listConversations === undefined) return reply.status(503).send({ error: { code: "conversationsUnavailable", message: "Conversation history is unavailable." } });
      return { conversations: store.listConversations({ tenantId: actor.tenantId, projectId: request.params.projectId }) };
    },
  );

  app.post<{
    Params: { projectId: string };
    Body: { title: string };
    Headers: { "idempotency-key": string };
  }>(
    "/v1/projects/:projectId/conversations",
    {
      preHandler: [authenticationGuard(authentication), projectAuthorizationGuard(projectAccess, "mutate"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        body: Type.Object({ title: Type.String({ minLength: 1, maxLength: 200 }) }, { additionalProperties: false }),
        headers: Type.Object({ "idempotency-key": Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: true }),
        response: {
          201: Type.Object({ conversationId: Type.String(), state: Type.Literal("idle") }, { $id: "shipglows.v1.conversation.create.response", additionalProperties: false }),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const runtime = dependencies.agentRuntime;
      const store = dependencies.conversationStore;
      const idempotencyStore = dependencies.idempotencyStore;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (runtime === undefined || store === undefined) return reply.status(503).send({ error: { code: "runtimeUnavailable", message: "The managed runtime is unavailable." } });
      if (idempotencyStore === undefined) return reply.status(503).send({ error: { code: "idempotencyUnavailable", message: "Durable command replay is unavailable." } });
      try {
        const outcome = await idempotencyStore.executeIdempotentAsync({ tenantId: actor.tenantId, actorUserId: actor.userId, scope: `conversation:create:${request.params.projectId}`, key: request.headers["idempotency-key"] }, async () => ({
          statusCode: 201,
          body: (await new ConversationCommandService(store, runtime, dependencies.eventHub, config.limits, dependencies.runAdmission, dependencies.executionAdmission, dependencies.projectWorkspaceResolver).create({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, title: request.body.title })) as unknown as SafePayload,
        }));
        return await reply.status(outcome.response.statusCode).send(outcome.response.body);
      } catch (error: unknown) {
        if (error instanceof ConversationCommandError) return reply.status(503).send({ error: { code: error.code, message: error.message } });
        throw error;
      }
    },
  );

  const conversationCommand = async (request: {
    readonly shipglowsActor?: { readonly tenantId: string; readonly userId: string };
    readonly params: { readonly projectId: string; readonly conversationId: string };
    readonly body: { readonly text?: string };
    readonly headers: { readonly "idempotency-key": string };
  }, reply: { status: (code: number) => { send: (body: unknown) => unknown } }, action: "message" | "interrupt" | "resume") => {
    const actor = request.shipglowsActor;
    const runtime = dependencies.agentRuntime;
    const store = dependencies.conversationStore;
    const idempotencyStore = dependencies.idempotencyStore;
    if (actor === undefined) throw new Error("Authenticated actor is missing.");
    if (runtime === undefined || store === undefined) return reply.status(503).send({ error: { code: "runtimeUnavailable", message: "The managed runtime is unavailable." } });
    if (idempotencyStore === undefined) return reply.status(503).send({ error: { code: "idempotencyUnavailable", message: "Durable command replay is unavailable." } });
    try {
      const outcome = await idempotencyStore.executeIdempotentAsync({ tenantId: actor.tenantId, actorUserId: actor.userId, scope: `conversation:${action}:${request.params.conversationId}`, key: request.headers["idempotency-key"] }, async () => {
        const service = new ConversationCommandService(store, runtime, dependencies.eventHub, config.limits, dependencies.runAdmission, dependencies.executionAdmission, dependencies.projectWorkspaceResolver);
        const result = action === "message"
          ? await service.message({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, conversationId: request.params.conversationId, text: request.body.text ?? "" })
          : action === "interrupt"
            ? await service.interrupt({ tenantId: actor.tenantId, projectId: request.params.projectId, conversationId: request.params.conversationId })
            : await service.resume({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, conversationId: request.params.conversationId });
        return { statusCode: action === "message" ? 202 : 200, body: result as unknown as SafePayload };
      });
      return await reply.status(outcome.response.statusCode).send(outcome.response.body);
    } catch (error: unknown) {
      if (error instanceof ConversationCommandError) return reply.status(error.code === "conversationNotFound" ? 404 : error.code === "activeTurnUnavailable" ? 409 : 503).send({ error: { code: error.code, message: error.message } });
      if (error instanceof RunLimitError) return reply.status(429).send({ error: { code: error.code, message: error.message } });
      throw error;
    }
  };

  app.post<{ Params: { projectId: string; conversationId: string }; Body: { text: string }; Headers: { "idempotency-key": string } }>(
    "/v1/projects/:projectId/conversations/:conversationId/messages",
    {
      preHandler: [authenticationGuard(authentication), projectAuthorizationGuard(projectAccess, "mutate"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }), conversationId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        body: Type.Object({ text: Type.String({ minLength: 1, maxLength: 32000 }) }, { additionalProperties: false }),
        headers: Type.Object({ "idempotency-key": Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: true }),
      },
    },
    (request, reply) => conversationCommand(request, reply, "message"),
  );

  for (const [action, path] of [["interrupt", "interrupt"], ["resume", "resume"]] as const) {
    app.post<{ Params: { projectId: string; conversationId: string }; Body: Record<string, never>; Headers: { "idempotency-key": string } }>(
      `/v1/projects/:projectId/conversations/:conversationId/${path}`,
      {
        preHandler: [authenticationGuard(authentication), projectAuthorizationGuard(projectAccess, "mutate"), stateChangingOriginGuard(config.server.allowedOrigins)],
        schema: {
          params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }), conversationId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
          body: Type.Object({}, { additionalProperties: false }),
          headers: Type.Object({ "idempotency-key": Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: true }),
        },
      },
      (request, reply) => conversationCommand(request, reply, action),
    );
  }

  app.post<{
    Params: { projectId: string };
    Body: { scope: string };
    Headers: { "idempotency-key": string };
  }>(
    "/v1/projects/:projectId/audits",
    {
      preHandler: [
        authenticationGuard(authentication),
        projectAuthorizationGuard(projectAccess, "mutate"),
        stateChangingOriginGuard(config.server.allowedOrigins),
      ],
      schema: {
        params: Type.Object(
          { projectId: Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: false },
        ),
        body: CommandRequestSchemas.audit,
        headers: Type.Object(
          { "idempotency-key": Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: true },
        ),
        response: {
          202: Type.Object(
            {
              conversationId: Type.String(),
              runId: Type.String(),
              state: Type.Union([Type.Literal("running"), Type.Literal("failed")]),
            },
            { $id: "shipglows.v1.audit.response", additionalProperties: false },
          ),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (dependencies.auditStore === undefined || dependencies.agentRuntime === undefined) {
        return reply.status(503).send({ error: { code: "runtimeUnavailable", message: "The managed runtime is unavailable." } });
      }
      const auditStore = dependencies.auditStore;
      const agentRuntime = dependencies.agentRuntime;
      const idempotencyStore = dependencies.idempotencyStore;
      if (idempotencyStore === undefined) {
        return reply.status(503).send({ error: { code: "idempotencyUnavailable", message: "Durable command replay is unavailable." } });
      }
      try {
        const outcome = await idempotencyStore.executeIdempotentAsync({
          tenantId: actor.tenantId,
          actorUserId: actor.userId,
          scope: `audit:${request.params.projectId}`,
          key: request.headers["idempotency-key"],
        }, async () => ({
          statusCode: 202,
          body: (await new AuditCommandService(
            auditStore,
            agentRuntime,
            dependencies.eventHub,
            config.limits,
            dependencies.runAdmission,
            dependencies.executionAdmission,
            dependencies.projectWorkspaceResolver,
          ).start({
            tenantId: actor.tenantId,
            userId: actor.userId,
            projectId: request.params.projectId,
            scope: request.body.scope,
          })) as unknown as SafePayload,
        }));
        return await reply.status(outcome.response.statusCode).send(outcome.response.body);
      } catch (error: unknown) {
        if (error instanceof RunLimitError && error.code === "runQuotaExceeded") {
          return reply.status(429).send({ error: { code: error.code, message: error.message } });
        }
        throw error;
      }
    },
  );

  app.post<{
    Params: { projectId: string };
    Body: { issueId: string; instruction: string };
    Headers: { "idempotency-key": string };
  }>(
    "/v1/projects/:projectId/fixes",
    {
      preHandler: [
        authenticationGuard(authentication),
        projectAuthorizationGuard(projectAccess, "mutate"),
        stateChangingOriginGuard(config.server.allowedOrigins),
      ],
      schema: {
        params: Type.Object(
          { projectId: Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: false },
        ),
        body: CommandRequestSchemas.fix,
        headers: Type.Object(
          { "idempotency-key": Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: true },
        ),
        response: {
          202: Type.Object(
            {
              conversationId: Type.String(),
              runId: Type.String(),
              state: Type.Union([Type.Literal("running"), Type.Literal("failed")]),
            },
            { $id: "shipglows.v1.fix.response", additionalProperties: false },
          ),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      const fixExecutor = dependencies.fixExecutor;
      if (fixExecutor === undefined) {
        return reply.status(503).send({
          error: { code: "fixUnavailable", message: "The isolated fix executor is unavailable." },
        });
      }
      const idempotencyStore = dependencies.idempotencyStore;
      if (idempotencyStore === undefined) {
        return reply.status(503).send({
          error: { code: "idempotencyUnavailable", message: "Durable command replay is unavailable." },
        });
      }
      try {
        const outcome = await idempotencyStore.executeIdempotentAsync({
          tenantId: actor.tenantId,
          actorUserId: actor.userId,
          scope: `fix:${request.params.projectId}`,
          key: request.headers["idempotency-key"],
        }, async () => ({
          statusCode: 202,
          body: (await fixExecutor.start({
            tenantId: actor.tenantId,
            userId: actor.userId,
            projectId: request.params.projectId,
            issueId: request.body.issueId,
            instruction: request.body.instruction,
          })) as unknown as SafePayload,
        }));
        return await reply.status(outcome.response.statusCode).send(outcome.response.body);
      } catch (error: unknown) {
        if (error instanceof FixUnavailableError) {
          return reply.status(503).send({ error: { code: error.code, message: error.message } });
        }
        if (error instanceof RunLimitError && error.code === "runQuotaExceeded") {
          return reply.status(429).send({ error: { code: error.code, message: error.message } });
        }
        throw error;
      }
    },
  );

  app.post<{
    Params: { projectId: string; approvalId: string };
    Body: { decision: "approve" | "deny" };
    Headers: { "idempotency-key": string };
  }>(
    "/v1/projects/:projectId/approvals/:approvalId",
    {
      preHandler: [
        authenticationGuard(authentication),
        projectAuthorizationGuard(projectAccess, "mutate"),
        stateChangingOriginGuard(config.server.allowedOrigins),
      ],
      schema: {
        params: Type.Object(
          {
            projectId: Type.String({ minLength: 1, maxLength: 128 }),
            approvalId: Type.String({ minLength: 1, maxLength: 128 }),
          },
          { additionalProperties: false },
        ),
        body: Type.Object(
          { decision: Type.Union([Type.Literal("approve"), Type.Literal("deny")]) },
          { additionalProperties: false },
        ),
        headers: Type.Object(
          { "idempotency-key": Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: true },
        ),
        response: {
          200: Type.Object(
            {
              approvalId: Type.String(),
              state: Type.Union([Type.Literal("approved"), Type.Literal("denied")]),
            },
            { $id: "shipglows.v1.approval.response", additionalProperties: false },
          ),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (dependencies.agentRuntime === undefined || dependencies.approvalStore === undefined) {
        return reply.status(503).send({ error: { code: "runtimeUnavailable", message: "The managed runtime is unavailable." } });
      }
      const agentRuntime = dependencies.agentRuntime;
      const approvalStore = dependencies.approvalStore;
      const idempotencyStore = dependencies.idempotencyStore;
      if (idempotencyStore === undefined) {
        return reply.status(503).send({ error: { code: "idempotencyUnavailable", message: "Durable command replay is unavailable." } });
      }
      try {
        const outcome = await idempotencyStore.executeIdempotentAsync({
          tenantId: actor.tenantId,
          actorUserId: actor.userId,
          scope: `approval:${request.params.approvalId}`,
          key: request.headers["idempotency-key"],
        }, async () => ({
          statusCode: 200,
          body: (await new ApprovalCommandService(
            approvalStore,
            agentRuntime,
            dependencies.eventHub,
          ).resolve({
            tenantId: actor.tenantId,
            projectId: request.params.projectId,
            approvalId: request.params.approvalId,
            decision: request.body.decision,
          })) as unknown as SafePayload,
        }));
        return await reply.status(outcome.response.statusCode).send(outcome.response.body);
      } catch (error: unknown) {
        if (error instanceof ApprovalCommandError) {
          const statusCode = error.code === "approvalNotFound" ? 404
            : error.code === "approvalAlreadyResolved" ? 409
            : error.code === "approvalPolicyDenied" ? 403
            : 503;
          return reply.status(statusCode).send({ error: { code: error.code, message: error.message } });
        }
        throw error;
      }
    },
  );

  app.get<{
    Params: { projectId: string; conversationId: string };
    Querystring: { after?: string; live?: string };
  }>(
    "/v1/projects/:projectId/conversations/:conversationId/events",
    {
      preHandler: [
        authenticationGuard(authentication),
        projectAuthorizationGuard(projectAccess, "read"),
      ],
      schema: {
        params: Type.Object(
          {
            projectId: Type.String({ minLength: 1, maxLength: 128 }),
            conversationId: Type.String({ minLength: 1, maxLength: 128 }),
          },
          { additionalProperties: false },
        ),
        querystring: Type.Object(
          {
            after: Type.Optional(Type.String({ pattern: "^[0-9]+$", maxLength: 20 })),
            live: Type.Optional(Type.Literal("true")),
          },
          { additionalProperties: false },
        ),
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const eventStore = dependencies.eventStore;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (eventStore === undefined) {
        return reply.status(503).send({ error: { code: "eventsUnavailable", message: "Event history is unavailable." } });
      }
      if (request.query.live === "true" && dependencies.eventHub === undefined) {
        return reply.status(503).send({ error: { code: "liveEventsUnavailable", message: "Live event fan-out is unavailable." } });
      }
      const conversation = eventStore.getConversation({
        tenantId: actor.tenantId,
        conversationId: request.params.conversationId,
      });
      if (conversation?.projectId !== request.params.projectId) {
        return reply.status(404).send({ error: { code: "conversationNotFound", message: "Conversation was not found." } });
      }
      const after = request.query.after === undefined ? 0 : Number(request.query.after);
      const subscription = request.query.live === "true"
        ? dependencies.eventHub?.subscribe({
            tenantId: actor.tenantId,
            conversationId: request.params.conversationId,
          })
        : undefined;
      const events = eventStore.listEvents({
        tenantId: actor.tenantId,
        conversationId: request.params.conversationId,
        after,
        limit: 100,
      });
      const snapshotCursor = events.at(-1)?.cursor ?? after;
      const stream = async function*() {
        try {
          for (const event of events) yield eventFrame(event);
          yield "event: stream.heartbeat\ndata: {}\n\n";
          if (subscription === undefined) return;
          const iterator = subscription.events[Symbol.asyncIterator]();
          let streamOpen = true;
          while (streamOpen) {
            const result = await nextWithTimeout(iterator, 30_000);
            if (result.done) {
              streamOpen = false;
              continue;
            }
            if (result.value.cursor <= snapshotCursor) continue;
            yield eventFrame(result.value);
          }
        } finally {
          subscription?.close();
        }
      };
      reply.raw.once("close", () => subscription?.close());
      return reply
        .header("content-type", "text/event-stream; charset=utf-8")
        .header("cache-control", "no-cache")
        .header("x-accel-buffering", "no")
        .send(Readable.from(stream()));
    },
  );

  app.post<{ Params: { projectId: string }; Body: { diagnosticId: string; surface: "editor" | "terminal"; stage: string; code: string; occurredAt: string } }>(
    "/v1/projects/:projectId/workspace-diagnostics",
    {
      preHandler: [authenticationGuard(authentication), reconcileCloudProjectsGuard, projectAuthorizationGuard(projectAccess, "mutate"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128, pattern: "^[A-Za-z0-9_-]+$" }) }, { additionalProperties: false }),
        body: Type.Object({
          diagnosticId: Type.String({ minLength: 12, maxLength: 64, pattern: "^wd_[A-Za-z0-9]+$" }),
          surface: Type.Union([Type.Literal("editor"), Type.Literal("terminal")]),
          stage: Type.Union([Type.Literal("capability"), Type.Literal("stream"), Type.Literal("recovery")]),
          code: Type.Union([Type.Literal("connect_failed"), Type.Literal("stream_closed"), Type.Literal("cleanup_failed"), Type.Literal("retry_exhausted"), Type.Literal("reported")]),
          occurredAt: Type.String({ minLength: 20, maxLength: 40, format: "date-time" }),
        }, { additionalProperties: false }),
        response: { 202: Type.Object({ diagnosticId: Type.String(), accepted: Type.Literal(true) }, { additionalProperties: false }) },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      const now = Date.now();
      const key = `${actor.tenantId}:${actor.userId}`;
      const current = surfaceDiagnosticWindows.get(key);
      const window = current === undefined || now - current.startedAt >= 60_000 ? { startedAt: now, count: 0 } : current;
      window.count += 1;
      surfaceDiagnosticWindows.set(key, window);
      if (window.count > 30) return await reply.status(429).send({ error: { code: "rateLimited", message: "Too many Workspace diagnostics." } });
      dependencies.workspaceDiagnosticSink?.({
        diagnosticId: request.body.diagnosticId,
        projectId: request.params.projectId,
        surface: request.body.surface,
        stage: request.body.stage,
        code: request.body.code,
        browserFamily: browserFamily(request.headers["user-agent"]),
        occurredAt: request.body.occurredAt,
      });
      return await reply.status(202).send({ diagnosticId: request.body.diagnosticId, accepted: true });
    },
  );

  done();
  });
  return app;
}
