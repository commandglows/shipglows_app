import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "typebox";

import { authenticationGuard, type AuthenticationAdapter } from "../auth/index.js";
import { HttpError } from "../contracts/index.js";
import { projectAuthorizationGuard, type ProjectAccessRepository } from "../projects/projectAccess.js";
import { stateChangingOriginGuard } from "../security/requestPolicy.js";
import type { StudioCapabilityResolver } from "./capability.js";
import { StudioSessionError, type StudioSessionService } from "./session.js";

const ProjectParams = Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });
const SessionParams = Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }), sessionId: Type.String({ pattern: "^ses_[A-Za-z0-9]{1,32}$" }) }, { additionalProperties: false });
const ErrorResponse = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }, { additionalProperties: false }) }, { additionalProperties: false });
const SemanticCapability = Type.Union([
  Type.Literal("token.set"), Type.Literal("spacing.set"), Type.Literal("radius.set"), Type.Literal("opacity.set"),
  Type.Literal("transform.set"), Type.Literal("visibility.set"), Type.Literal("motion.duration"), Type.Literal("motion.easing"),
]);
const ProtectedDimension = Type.Union([Type.Literal("copy"), Type.Literal("structure"), Type.Literal("accessibility"), Type.Literal("performance")]);
const StudioProfileId = Type.Union([Type.Literal("shipglows.astro.hero.v1"), Type.Literal("gocharbon.astro.hero.v1")]);
const Surface = Type.Object({
  id: Type.String({ minLength: 1, maxLength: 128 }), label: Type.String({ minLength: 1, maxLength: 128 }), sourceConfidence: Type.Literal("exact"),
  sourceSymbol: Type.String({ minLength: 1, maxLength: 128 }), capabilities: Type.Array(SemanticCapability, { minItems: 3, maxItems: 8, uniqueItems: true }),
  protectedDimensions: Type.Array(ProtectedDimension, { minItems: 4, maxItems: 4, uniqueItems: true }),
}, { additionalProperties: false });
const CompileIntentResponse = Type.Object({
  schemaVersion: Type.Literal("shipglows.studio.v1"), intentId: Type.String(), sessionId: Type.String(), variantId: Type.String(), frozenCommandRevision: Type.Integer({ minimum: 0 }),
  sourceCommit: Type.String(), repositoryDigest: Type.String(), adapterVersion: Type.String(), capabilityVersion: Type.String(),
  affectedSurfaceIds: Type.Array(Type.String()), affectedDimensions: Type.Array(Type.String()), predictedImpactPaths: Type.Array(Type.String()), requiredEvidence: Type.Array(Type.String()),
  actorId: Type.String(), idempotencyKey: Type.String(), createdAt: Type.String(), status: Type.Union([Type.Literal("preflight"), Type.Literal("accepted"), Type.Literal("running"), Type.Literal("verified"), Type.Literal("failed"), Type.Literal("conflict")]),
}, { additionalProperties: false });
const SessionResponse = Type.Object({
  contractVersion: Type.Literal("shipglows.studio.v1"), sessionId: Type.String(), projectId: Type.String(), profileId: StudioProfileId,
  sourceRevision: Type.String(), repositoryDigest: Type.String(), state: Type.String(), revision: Type.Integer({ minimum: 0 }), commandCount: Type.Integer({ minimum: 0 }), undoCursor: Type.Integer({ minimum: 0 }), canUndo: Type.Boolean(), canRedo: Type.Boolean(),
  variants: Type.Array(Type.Object({ variantId: Type.String(), name: Type.String(), commandCount: Type.Integer({ minimum: 0 }), commandRevision: Type.Integer({ minimum: 0 }) }, { additionalProperties: false })),
  activeVariantId: Type.Union([Type.String(), Type.Null()]), laboratory: Type.Object({ mode: Type.Union([Type.Literal("studio"), Type.Literal("recommended"), Type.Literal("active")]), reasons: Type.Array(Type.String()) }, { additionalProperties: false }),
  idleExpiresAt: Type.String(), absoluteExpiresAt: Type.String(), cleanupState: Type.Union([Type.Literal("active"), Type.Literal("pending"), Type.Literal("cleaned"), Type.Literal("quarantined")]), compileIntent: Type.Union([CompileIntentResponse, Type.Null()]),
}, { additionalProperties: false });

export function registerStudioRoutes(app: FastifyInstance, input: {
  readonly authentication: AuthenticationAdapter;
  readonly projectAccess: ProjectAccessRepository;
  readonly allowedOrigins: readonly string[];
  readonly capability?: StudioCapabilityResolver;
  readonly sessions?: StudioSessionService;
}): void {
  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/studio/capability",
    {
      preHandler: [authenticationGuard(input.authentication), projectAuthorizationGuard(input.projectAccess, "read")],
      schema: { params: ProjectParams, response: {
        200: Type.Object({
          supported: Type.Literal(true), reason: Type.Literal("trustedFirstPartyBase"), contractVersion: Type.Literal("shipglows.studio.v1"), bridgeVersion: Type.Literal("shipglows.studio.bridge.v1"), profileId: StudioProfileId,
          sourceRevision: Type.String({ pattern: "^[a-fA-F0-9]{7,64}$" }), repositoryDigest: Type.String({ pattern: "^[a-fA-F0-9]{64}$" }), previewOrigin: Type.String({ format: "uri" }),
          adapterVersion: Type.String({ minLength: 1, maxLength: 64 }), capabilityVersion: Type.String({ minLength: 1, maxLength: 64 }),
          capabilities: Type.Tuple([Type.Literal("token.set"), Type.Literal("spacing.set"), Type.Literal("radius.set"), Type.Literal("opacity.set"), Type.Literal("transform.set"), Type.Literal("visibility.set"), Type.Literal("motion.duration"), Type.Literal("motion.easing")]),
          compileAdmission: Type.Object({ available: Type.Literal(false), reason: Type.Literal("workerIsolationUnavailable"), message: Type.String({ minLength: 1, maxLength: 256 }) }, { additionalProperties: false }),
          expectedPaths: Type.Array(Type.String({ minLength: 1, maxLength: 256 }), { minItems: 1, maxItems: 1, uniqueItems: true }), surfaces: Type.Array(Surface, { minItems: 8, maxItems: 8 }),
        }, { $id: "shipglows.studio.v1.capability.response", additionalProperties: false }),
        503: ErrorResponse,
      } },
    },
    async (request, reply) => {
      const actor = requiredActor(request);
      try {
        const projection = await input.capability?.resolve({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId });
        if (projection === undefined || projection === null) return await unavailable(reply, "Studio preview is unavailable for this project and revision.");
        reply.header("Cache-Control", "private, no-store").header("Vary", "Authorization, X-ShipGlows-Tenant");
        return projection;
      } catch {
        return unavailable(reply, "Studio preview attestation is temporarily unavailable.");
      }
    },
  );

  const mutationGuards = [authenticationGuard(input.authentication), projectAuthorizationGuard(input.projectAccess, "mutate"), stateChangingOriginGuard(input.allowedOrigins)];
  const readGuards = [authenticationGuard(input.authentication), projectAuthorizationGuard(input.projectAccess, "read")];

  app.post<{ Params: { projectId: string } }>("/v1/projects/:projectId/studio-sessions", { preHandler: mutationGuards, schema: { params: ProjectParams, body: Type.Object({}, { additionalProperties: false }), response: { 200: SessionResponse, 400: ErrorResponse, 403: ErrorResponse, 409: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, async () => requiredSessions(input.sessions).create(actorProject(request), idempotencyKey(request))));
  app.get<{ Params: { projectId: string; sessionId: string } }>("/v1/projects/:projectId/studio-sessions/:sessionId", { preHandler: readGuards, schema: { params: SessionParams, response: { 200: SessionResponse, 403: ErrorResponse, 404: ErrorResponse, 410: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => requiredSessions(input.sessions).get(actorProject(request), request.params.sessionId)));
  app.get<{ Params: { projectId: string; sessionId: string }; Querystring: { after?: number } }>("/v1/projects/:projectId/studio-sessions/:sessionId/events", { preHandler: readGuards, schema: { params: SessionParams, querystring: Type.Object({ after: Type.Optional(Type.Integer({ minimum: 0 })) }, { additionalProperties: false }), response: { 200: Type.Object({ events: Type.Array(Type.Object({ sequence: Type.Integer(), type: Type.String(), revision: Type.Integer(), occurredAt: Type.String(), summary: Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])) }, { additionalProperties: false })) }, { additionalProperties: false }), 403: ErrorResponse, 404: ErrorResponse, 410: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => ({ events: requiredSessions(input.sessions).events(actorProject(request), request.params.sessionId, request.query.after ?? 0) })));

  const CommandBody = Type.Object({
    schemaVersion: Type.Literal("shipglows.studio.v1"), commandId: Type.String(), sessionId: Type.String(), kind: Type.String(), parameters: Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean()])), affectedRuntimeNodeIds: Type.Array(Type.String()), affectedDimensions: Type.Array(Type.String()), provenance: Type.Object({ actorType: Type.String(), actorId: Type.String() }, { additionalProperties: false }), revision: Type.Integer(), idempotencyKey: Type.String(), previewOnly: Type.Boolean(), requiredCapability: Type.String(), requiredUnprotectedDimensions: Type.Array(Type.String()), compactionKey: Type.Optional(Type.String()),
  }, { additionalProperties: false });
  app.post<{ Params: { projectId: string; sessionId: string }; Body: unknown }>("/v1/projects/:projectId/studio-sessions/:sessionId/commands", { preHandler: mutationGuards, schema: { params: SessionParams, body: CommandBody, response: { 200: SessionResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 410: ErrorResponse, 429: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => requiredSessions(input.sessions).applyCommand(actorProject(request), request.params.sessionId, request.body)));
  for (const action of ["undo", "redo"] as const) app.post<{ Params: { projectId: string; sessionId: string } }>(`/v1/projects/:projectId/studio-sessions/:sessionId/commands/${action}`, { preHandler: mutationGuards, schema: { params: SessionParams, body: Type.Object({}, { additionalProperties: false }), response: { 200: SessionResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 410: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => requiredSessions(input.sessions)[action](actorProject(request), request.params.sessionId, idempotencyKey(request))));

  const VariantBody = Type.Union([
    Type.Object({ action: Type.Literal("create"), name: Type.String({ minLength: 1, maxLength: 64 }) }, { additionalProperties: false }),
    Type.Object({ action: Type.Literal("select"), variantId: Type.String() }, { additionalProperties: false }),
    Type.Object({ action: Type.Literal("delete"), variantId: Type.String() }, { additionalProperties: false }),
  ]);
  app.post<{ Params: { projectId: string; sessionId: string }; Body: { action: "create"; name: string } | { action: "select" | "delete"; variantId: string } }>("/v1/projects/:projectId/studio-sessions/:sessionId/variants", { preHandler: mutationGuards, schema: { params: SessionParams, body: VariantBody, response: { 200: SessionResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 410: ErrorResponse, 429: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => {
    const service = requiredSessions(input.sessions); const actor = actorProject(request); const key = idempotencyKey(request);
    return request.body.action === "create" ? service.createVariant(actor, request.params.sessionId, request.body.name, key) : request.body.action === "select" ? service.selectVariant(actor, request.params.sessionId, request.body.variantId, key) : service.deleteVariant(actor, request.params.sessionId, request.body.variantId, key);
  }));
  app.post<{ Params: { projectId: string; sessionId: string }; Body: { variantId: string } }>("/v1/projects/:projectId/studio-sessions/:sessionId/compile-intents", { preHandler: mutationGuards, schema: { params: SessionParams, body: Type.Object({ variantId: Type.String() }, { additionalProperties: false }), response: { 200: CompileIntentResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 410: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => requiredSessions(input.sessions).compile(actorProject(request), request.params.sessionId, request.body.variantId, idempotencyKey(request))));
  app.post<{ Params: { projectId: string; sessionId: string } }>("/v1/projects/:projectId/studio-sessions/:sessionId/interrupt", { preHandler: mutationGuards, schema: { params: SessionParams, body: Type.Object({}, { additionalProperties: false }), response: { 200: SessionResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 410: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => requiredSessions(input.sessions).interrupt(actorProject(request), request.params.sessionId, idempotencyKey(request))));
  app.delete<{ Params: { projectId: string; sessionId: string } }>("/v1/projects/:projectId/studio-sessions/:sessionId", { preHandler: mutationGuards, schema: { params: SessionParams, response: { 200: SessionResponse, 400: ErrorResponse, 403: ErrorResponse, 404: ErrorResponse, 409: ErrorResponse, 503: ErrorResponse } } }, async (request, reply) => handle(reply, () => requiredSessions(input.sessions).close(actorProject(request), request.params.sessionId, idempotencyKey(request))));
}

function requiredActor(request: FastifyRequest) { if (request.shipglowsActor === undefined) throw new HttpError(401, "unauthorized", "Authentication is required."); return request.shipglowsActor; }
function actorProject(request: FastifyRequest & { params: { projectId: string } }) { const actor = requiredActor(request); return { tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId }; }
function idempotencyKey(request: FastifyRequest): string { const value = request.headers["idempotency-key"]; if (typeof value !== "string") throw new HttpError(400, "idempotencyKeyRequired", "Idempotency-Key is required."); return value; }
function requiredSessions(service: StudioSessionService | undefined): StudioSessionService { if (service === undefined) throw new StudioSessionError(503, "studioUnavailable", "Studio sessions are unavailable."); return service; }
async function handle(reply: FastifyReply, operation: () => unknown) { try { reply.header("Cache-Control", "private, no-store"); return await operation(); } catch (error) { if (error instanceof StudioSessionError) return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } }); throw error; } }
function unavailable(reply: FastifyReply, message: string) { reply.header("Cache-Control", "private, no-store"); return reply.status(503).send({ error: { code: "studioUnavailable", message } }); }
