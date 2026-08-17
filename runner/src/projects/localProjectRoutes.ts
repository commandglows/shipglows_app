import type { FastifyInstance, FastifyRequest } from "fastify";
import { Type } from "typebox";

import { authenticationGuard, type AuthenticationAdapter } from "../auth/index.js";
import { HttpError } from "../contracts/index.js";
import { stateChangingOriginGuard } from "../security/requestPolicy.js";
import type { LocalProjectManagement } from "./localStudioProjectCatalog.js";

const ProjectSchema = Type.Object({
  id: Type.String(), name: Type.String(), repositoryFullName: Type.String(),
  sourceKinds: Type.Array(Type.Union([Type.Literal("local"), Type.Literal("github")])),
  readiness: Type.Union([Type.Literal("ready"), Type.Literal("degraded"), Type.Literal("accessLost")]),
  detectedPlatforms: Type.Array(Type.String()),
  capabilities: Type.Object({
    cockpit: Type.Boolean(), studio: Type.Boolean(), conversations: Type.Boolean(), workspace: Type.Boolean(),
  }, { additionalProperties: false }),
  isDefault: Type.Boolean(), isArchived: Type.Boolean(), builtin: Type.Boolean(), studioAvailable: Type.Boolean(),
}, { additionalProperties: false });
const ErrorSchema = Type.Object({ error: Type.Object({ code: Type.String(), message: Type.String() }, { additionalProperties: false }) }, { additionalProperties: false });
const ProjectParams = Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });

function actor(request: FastifyRequest): { tenantId: string; userId: string } {
  if (request.shipglowsActor === undefined) throw new HttpError(401, "unauthorized", "Authentication is required.");
  return request.shipglowsActor;
}

export function registerLocalProjectRoutes(app: FastifyInstance, input: {
  readonly authentication: AuthenticationAdapter;
  readonly management: LocalProjectManagement;
  readonly allowedOrigins: readonly string[];
}): void {
  const authenticated = authenticationGuard(input.authentication);
  const mutation = [authenticated, stateChangingOriginGuard(input.allowedOrigins)];
  app.get("/v1/local-projects", { preHandler: [authenticated], schema: { response: { 200: Type.Object({ projects: Type.Array(ProjectSchema) }, { additionalProperties: false }) } } },
    (request) => ({ projects: input.management.list(actor(request)) }));
  app.post<{ Body: { repositoryPath: string; name?: string } }>("/v1/local-projects", { preHandler: mutation, schema: {
    body: Type.Object({ repositoryPath: Type.String({ minLength: 1, maxLength: 1024 }), name: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })) }, { additionalProperties: false }),
    response: { 201: ProjectSchema, 400: ErrorSchema, 403: ErrorSchema, 409: ErrorSchema },
  } }, (request, reply) => reply.status(201).send(input.management.connect({ ...actor(request), ...request.body })));
  app.patch<{ Params: { projectId: string }; Body: { name?: string; isDefault?: boolean; isArchived?: boolean } }>("/v1/local-projects/:projectId", { preHandler: mutation, schema: {
    params: ProjectParams,
    body: Type.Object({ name: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })), isDefault: Type.Optional(Type.Boolean()), isArchived: Type.Optional(Type.Boolean()) }, { additionalProperties: false, minProperties: 1 }),
    response: { 200: ProjectSchema, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 409: ErrorSchema },
  } }, (request) => input.management.update({ ...actor(request), projectId: request.params.projectId, ...request.body }));
  app.delete<{ Params: { projectId: string } }>("/v1/local-projects/:projectId", { preHandler: mutation, schema: {
    params: ProjectParams, response: { 204: Type.Null(), 403: ErrorSchema, 404: ErrorSchema, 409: ErrorSchema },
  } }, (request, reply) => {
    input.management.disconnect({ ...actor(request), projectId: request.params.projectId });
    return reply.status(204).send();
  });
}
