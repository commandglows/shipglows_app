import type { FastifyInstance, FastifyRequest } from "fastify";
import { Type } from "typebox";

import { authenticationGuard, type AuthenticationAdapter } from "../auth/index.js";
import { HttpError } from "../contracts/index.js";
import { stateChangingOriginGuard } from "../security/requestPolicy.js";
import type { GitHubProjectSource } from "./githubProjectSource.js";
import type { LocalProjectManagement } from "./localStudioProjectCatalog.js";

const ConnectionStateSchema = Type.Union([
  Type.Literal("disabled"), Type.Literal("disconnected"), Type.Literal("verifying"),
  Type.Literal("ready"), Type.Literal("degraded"), Type.Literal("accessLost"),
]);
const RepositorySchema = Type.Object({
  candidateId: Type.String({ minLength: 8, maxLength: 160, pattern: "^[A-Za-z0-9_-]+$" }),
  fullName: Type.String({ minLength: 3, maxLength: 201, pattern: "^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$" }),
  defaultBranch: Type.String({ minLength: 1, maxLength: 255, pattern: "^[A-Za-z0-9._/-]+$" }),
  visibility: Type.Union([Type.Literal("private"), Type.Literal("public")]), archived: Type.Boolean(),
}, { additionalProperties: false });
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

function actor(request: FastifyRequest): { tenantId: string; userId: string } {
  if (request.shipglowsActor === undefined) throw new HttpError(401, "unauthorized", "Authentication is required.");
  return request.shipglowsActor;
}

export function registerGitHubProjectRoutes(app: FastifyInstance, input: {
  readonly authentication: AuthenticationAdapter;
  readonly source: GitHubProjectSource;
  readonly management: LocalProjectManagement;
  readonly allowedOrigins: readonly string[];
}): void {
  const authenticated = authenticationGuard(input.authentication);
  const mutation = [authenticated, stateChangingOriginGuard(input.allowedOrigins)];

  app.get("/v1/project-sources/github", {
    preHandler: [authenticated],
    schema: { response: { 200: Type.Object({
      state: ConnectionStateSchema,
      message: Type.String({ minLength: 1, maxLength: 240 }),
      accountLabel: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
      actionUrl: Type.Optional(Type.String({ maxLength: 2048 })),
    }, { additionalProperties: false }) } },
  }, (request) => input.source.status(actor(request)));

  app.post("/v1/project-sources/github/setup", {
    preHandler: mutation,
    schema: { response: {
      200: Type.Object({
        actionUrl: Type.String({ format: "uri" }),
        setupUrl: Type.String({ format: "uri" }),
        expiresAt: Type.String({ format: "date-time" }),
      }, { additionalProperties: false }),
      409: ErrorSchema,
    } },
  }, (request) => input.source.beginSetup(actor(request)));

  app.post<{ Body: { installationId: number; state: string } }>("/v1/project-sources/github/setup/complete", {
    preHandler: mutation,
    schema: {
      body: Type.Object({
        installationId: Type.Integer({ minimum: 1 }),
        state: Type.String({ minLength: 16, maxLength: 160 }),
      }, { additionalProperties: false }),
      response: {
        200: Type.Object({
          state: ConnectionStateSchema,
          message: Type.String({ minLength: 1, maxLength: 240 }),
          accountLabel: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
          actionUrl: Type.Optional(Type.String({ maxLength: 2048 })),
        }, { additionalProperties: false }),
        400: ErrorSchema,
        409: ErrorSchema,
      },
    },
  }, (request) => input.source.completeSetup({ ...actor(request), installationId: request.body.installationId, state: request.body.state }));

  app.delete("/v1/project-sources/github", {
    preHandler: mutation,
    schema: { response: { 204: Type.Null() } },
  }, async (request, reply) => {
    await input.source.disconnect(actor(request));
    return reply.status(204).send();
  });

  app.get<{ Querystring: { cursor?: string } }>("/v1/project-sources/github/repositories", {
    preHandler: [authenticated],
    schema: {
      querystring: Type.Object({ cursor: Type.Optional(Type.String({ minLength: 1, maxLength: 256 })) }, { additionalProperties: false }),
      response: {
        200: Type.Object({ repositories: Type.Array(RepositorySchema), nextCursor: Type.Union([Type.String(), Type.Null()]) }, { additionalProperties: false }),
        409: ErrorSchema,
        503: ErrorSchema,
      },
    },
  }, (request) => input.source.listRepositories({ ...actor(request), ...(request.query.cursor === undefined ? {} : { cursor: request.query.cursor }) }));

  app.post<{ Body: { candidateId: string } }>("/v1/project-sources/github/projects", {
    preHandler: mutation,
    schema: {
      body: Type.Object({ candidateId: Type.String({ minLength: 8, maxLength: 160 }) }, { additionalProperties: false }),
      response: { 201: ProjectSchema, 400: ErrorSchema, 403: ErrorSchema, 404: ErrorSchema, 409: ErrorSchema, 503: ErrorSchema },
    },
  }, async (request, reply) => {
    const selected = await input.source.selectRepository({ ...actor(request), candidateId: request.body.candidateId });
    const project = input.management.connectGitHub({ ...actor(request), repository: selected });
    return reply.status(201).send(project);
  });

  app.delete<{ Params: { projectId: string } }>("/v1/projects/:projectId/sources/github", {
    preHandler: mutation,
    schema: {
      params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
      response: { 200: ProjectSchema, 204: Type.Null(), 403: ErrorSchema, 404: ErrorSchema, 409: ErrorSchema },
    },
  }, (request, reply) => {
    const project = input.management.disconnectGitHub({ ...actor(request), projectId: request.params.projectId });
    return project === null ? reply.status(204).send() : reply.status(200).send(project);
  });
}
