import type { FastifyInstance } from "fastify";
import { Type } from "typebox";

import { authenticationGuard, type AuthenticationAdapter } from "./auth/index.js";
import type { SafePayload } from "./contracts/index.js";
import type { OperationalStore } from "./db/index.js";
import {
  ProjectContextGenerationError,
} from "./projectContextGenerator.js";
import {
  projectAuthorizationGuard,
  type ProjectAccessRepository,
} from "./projects/projectAccess.js";
import { stateChangingOriginGuard } from "./security/requestPolicy.js";
import type { ProjectContextBundle } from "./skills/contracts.js";

const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

type ProjectContextStore = Pick<OperationalStore, "getLatestProjectContextBundle">;
type IdempotencyStore = Pick<OperationalStore, "executeIdempotentAsync">;
export interface ProjectContextGenerator {
  refresh(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }): Promise<ProjectContextBundle>;
}

const responseSchema = Type.Object(
  {
    projectId: Type.String({ minLength: 1, maxLength: 128 }),
    status: Type.Union([
      Type.Literal("ready"),
      Type.Literal("stale"),
      Type.Literal("missing"),
    ]),
    observedAt: Type.Union([Type.String({ maxLength: 64 }), Type.Null()]),
    sourceCommit: Type.Union([Type.String({ maxLength: 200 }), Type.Null()]),
    repositorySnapshotCount: Type.Integer({ minimum: 0, maximum: 128 }),
    shipglowsArtifactCount: Type.Integer({ minimum: 0, maximum: 128 }),
    redactionCount: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
);

const errorSchema = Type.Object({
  error: Type.Object({
    code: Type.String({ minLength: 1, maxLength: 64 }),
    message: Type.String({ maxLength: 160 }),
  }, { additionalProperties: false }),
}, { additionalProperties: false });

function projection(projectId: string, bundle: ProjectContextBundle | undefined, now: number) {
  if (bundle === undefined) {
    return {
      projectId,
      status: "missing" as const,
      observedAt: null,
      sourceCommit: null,
      repositorySnapshotCount: 0,
      shipglowsArtifactCount: 0,
      redactionCount: 0,
    };
  }
  const observedAt = Date.parse(bundle.createdAt);
  const stale = !Number.isFinite(observedAt) || now - observedAt > STALE_AFTER_MS;
  return {
    projectId,
    status: stale ? "stale" as const : "ready" as const,
    observedAt: bundle.createdAt,
    sourceCommit: bundle.sourceCommit,
    repositorySnapshotCount: bundle.sources.filter((source) => source.kind === "repositorySnapshot").length,
    shipglowsArtifactCount: bundle.sources.filter((source) => source.kind === "shipglowsArtifact").length,
    redactionCount: bundle.redactionCount,
  };
}

export function registerProjectContextRoutes(
  app: FastifyInstance,
  input: {
    readonly authentication: AuthenticationAdapter;
    readonly projectAccess: ProjectAccessRepository;
    readonly store?: ProjectContextStore;
    readonly generator?: ProjectContextGenerator;
    readonly idempotencyStore?: IdempotencyStore;
    readonly allowedOrigins?: readonly string[];
    readonly now?: () => number;
  },
): void {
  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/context",
    {
      preHandler: [
        authenticationGuard(input.authentication),
        projectAuthorizationGuard(input.projectAccess, "read"),
      ],
      schema: {
        params: Type.Object(
          { projectId: Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: false },
        ),
        response: {
          200: responseSchema,
          503: Type.Object(
            {
              error: Type.Object(
                {
                  code: Type.Literal("projectContextUnavailable"),
                  message: Type.String({ maxLength: 160 }),
                },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
        },
      },
    },
    (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (input.store === undefined) {
        return reply.status(503).send({
          error: {
            code: "projectContextUnavailable",
            message: "Project context projection is unavailable.",
          },
        });
      }
      const bundle = input.store.getLatestProjectContextBundle({
        tenantId: actor.tenantId,
        projectId: request.params.projectId,
      });
      return projection(request.params.projectId, bundle, input.now?.() ?? Date.now());
    },
  );

  app.post<{ Params: { projectId: string }; Headers: { "idempotency-key": string }; Body: Record<string, never> }>(
    "/v1/projects/:projectId/context/refresh",
    {
      preHandler: [
        authenticationGuard(input.authentication),
        projectAuthorizationGuard(input.projectAccess, "read"),
        stateChangingOriginGuard(input.allowedOrigins ?? []),
      ],
      schema: {
        params: Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
        headers: Type.Object({ "idempotency-key": Type.String({ minLength: 8, maxLength: 128, pattern: "^[A-Za-z0-9._:-]+$" }) }, { additionalProperties: true }),
        body: Type.Object({}, { additionalProperties: false }),
        response: { 200: responseSchema, 400: errorSchema, 409: errorSchema, 503: errorSchema },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) throw new Error("Authenticated actor is missing.");
      if (input.generator === undefined || input.idempotencyStore === undefined) {
        return reply.status(503).send({ error: { code: "projectContextRefreshUnavailable", message: "Project context refresh is unavailable." } });
      }
      const generator = input.generator;
      try {
        const outcome = await input.idempotencyStore.executeIdempotentAsync({
          tenantId: actor.tenantId,
          actorUserId: actor.userId,
          scope: `project-context:refresh:${request.params.projectId}`,
          key: request.headers["idempotency-key"],
        }, async () => ({
          statusCode: 200,
          body: projection(
            request.params.projectId,
            await generator.refresh({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId }),
            input.now?.() ?? Date.now(),
          ) as unknown as SafePayload,
        }));
        return await reply.status(outcome.response.statusCode).send(outcome.response.body);
      } catch (error) {
        if (error instanceof ProjectContextGenerationError) {
          const status = error.code === "contextLimitExceeded" ? 409 : 400;
          return reply.status(status).send({ error: { code: error.code, message: error.message } });
        }
        throw error;
      }
    },
  );
}
