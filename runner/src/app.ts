import Fastify from "fastify";
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
import { installErrorHandler, CommandRequestSchemas, VersionResponseSchema } from "./contracts/index.js";
import type { CockpitProjectRecord, OperationalStore } from "./db/index.js";
import type { PersistedEvent } from "./db/index.js";
import type { AgentRuntime, SafePayload } from "./contracts/index.js";
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
import { stateChangingOriginGuard } from "./security/requestPolicy.js";
import { OperatorWorkspaceError, type OperatorWorkspaceGateway } from "./operator-workspace/index.js";

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

export interface RunnerAppDependencies {
  readonly authentication?: AuthenticationAdapter;
  readonly projectAccess?: ProjectAccessRepository;
  readonly auditStore?: Pick<OperationalStore, "createConversation" | "createRun" | "appendEvent" | "saveRuntimeSession" | "checkpointRun">;
  readonly eventStore?: Pick<OperationalStore, "getConversation" | "listEvents"> & Partial<Pick<OperationalStore, "listConversations">>;
  readonly cockpitStore?: Pick<OperationalStore, "listCockpitProjects">;
  readonly operatorWorkspaceCapability?: (input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }) => Promise<{ readonly available: boolean; readonly reason: string }>;
  readonly operatorWorkspaceGateway?: OperatorWorkspaceGateway;
  readonly eventHub?: EventHub;
  readonly runAdmission?: RunAdmission;
  readonly fixExecutor?: FixCommandExecutor;
  readonly idempotencyStore?: Pick<OperationalStore, "executeIdempotentAsync">;
  readonly approvalStore?: Pick<OperationalStore, "getApproval" | "getRun" | "getRuntimeSession" | "resolveApproval" | "appendEvent">;
  readonly conversationStore?: Pick<OperationalStore, "createConversation" | "getConversation" | "createRun" | "getRun" | "getLatestRun" | "saveRuntimeSession" | "getRuntimeSession" | "checkpointRun" | "appendEvent">;
  readonly agentRuntime?: AgentRuntime;
  readonly executionAdmission?: ExecutionAdmissionService;
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

export function buildRunnerApp({
  config,
  dependencies = {},
}: {
  config: RunnerConfig;
  dependencies?: RunnerAppDependencies;
}) {
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024 });
  void app.register(websocket, { options: { maxPayload: 20 * 1024 } });
  app.setValidatorCompiler(TypeBoxValidatorCompiler);
  installErrorHandler(app);
  const authentication = dependencies.authentication ?? new DisabledAuthenticationAdapter();
  const projectAccess = dependencies.projectAccess ?? noProjectAccess;

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
    "/v1/cockpit",
    {
      preHandler: [authenticationGuard(authentication)],
      schema: { response: { 200: cockpitResponse, 503: Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }) }) } },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      const store = dependencies.cockpitStore;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (store === undefined) return reply.status(503).send({ error: { code: "cockpitUnavailable", message: "Cockpit projection is unavailable." } });
      const projects = store.listCockpitProjects({ tenantId: actor.tenantId, userId: actor.userId });
      return {
        generatedAt: new Date().toISOString(),
        projects: projects.map((project: CockpitProjectRecord) => ({
          id: project.id,
          name: project.name,
          repositoryFullName: project.repositoryFullName,
          accessState: project.accessState,
          conversationCount: project.conversationCount,
          activeRunCount: project.activeRunCount,
          health: project.health,
        })),
      };
    },
  );

  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/operator-workspace",
    {
      preHandler: [authenticationGuard(authentication), projectAuthorizationGuard(projectAccess, "read")],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        response: {
          200: Type.Object({ available: Type.Boolean(), reason: Type.String() }, { $id: "shipglowz.v1.operator-workspace.capability", additionalProperties: false }),
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
      return dependencies.operatorWorkspaceCapability({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId });
    },
  );

  app.post<{ Params: { projectId: string }; Headers: { "idempotency-key": string } }>(
    "/v1/projects/:projectId/operator-sessions",
    {
      preHandler: [authenticationGuard(authentication), projectAuthorizationGuard(projectAccess, "read"), stateChangingOriginGuard(config.server.allowedOrigins)],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        headers: Type.Object({ "idempotency-key": Type.String({ minLength: 8, maxLength: 128 }) }, { additionalProperties: true }),
        response: {
          201: Type.Object({ sessionId: Type.String(), token: Type.String(), projectId: Type.String(), expiresAt: Type.String() }, { additionalProperties: false }),
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
        const session = gateway.create({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, idempotencyKey: request.headers["idempotency-key"] });
        return await reply.status(201).send({ sessionId: session.id, token: session.token, projectId: session.projectId, expiresAt: session.expiresAt });
      } catch (error) {
        if (error instanceof OperatorWorkspaceError) return reply.status(503).send({ error: { code: error.code, message: error.message } });
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
      gateway.attach(request.params.sessionId, token, socket);
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
          body: (await new ConversationCommandService(store, runtime, dependencies.eventHub, config.limits, dependencies.runAdmission, dependencies.executionAdmission).create({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, title: request.body.title })) as unknown as SafePayload,
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
        const service = new ConversationCommandService(store, runtime, dependencies.eventHub, config.limits, dependencies.runAdmission, dependencies.executionAdmission);
        const result = action === "message"
          ? await service.message({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId, conversationId: request.params.conversationId, text: request.body.text ?? "" })
          : action === "interrupt"
            ? await service.interrupt({ tenantId: actor.tenantId, projectId: request.params.projectId, conversationId: request.params.conversationId })
            : await service.resume({ tenantId: actor.tenantId, projectId: request.params.projectId, conversationId: request.params.conversationId });
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

  return app;
}
