import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "typebox";

import { authenticationGuard, type AuthenticationAdapter } from "../auth/index.js";
import { HttpError } from "../contracts/index.js";
import { projectAuthorizationGuard, type ProjectAccessRepository } from "../projects/projectAccess.js";
import {
  resolveCompilationRoute,
  type CompilationToolchain,
  type CompilationWorkerEvidence,
  type CompilationWorkerEvidenceVerifier,
  type ExecutionClass,
} from "./compilationRouter.js";
import {
  COMPILATION_ROUTING_CONTRACT_VERSION,
  COMPILATION_TARGETS,
  type CompilationTarget,
  type ProjectCapabilityDetection,
} from "./projectTargetDetector.js";

export interface CompilationRoutingProjectionResolver {
  resolve(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
  }): Promise<{
    readonly project: ProjectCapabilityDetection;
    readonly workers: readonly CompilationWorkerEvidence[];
    readonly evidenceVerifier?: CompilationWorkerEvidenceVerifier;
  } | null> | {
    readonly project: ProjectCapabilityDetection;
    readonly workers: readonly CompilationWorkerEvidence[];
    readonly evidenceVerifier?: CompilationWorkerEvidenceVerifier;
  } | null;
}

const routeRequirements: Readonly<Record<CompilationTarget, {
  readonly executionClass: ExecutionClass;
  readonly toolchain: CompilationToolchain;
  readonly environment: "linuxNode" | "linuxFlutter" | "linuxAndroid" | "windowsFlutter" | "macosFlutter";
}>> = Object.freeze({
  astroWeb: Object.freeze({ executionClass: "linuxSandbox", toolchain: "astroNodePnpm", environment: "linuxNode" }),
  flutterWeb: Object.freeze({ executionClass: "linuxSandbox", toolchain: "flutterWeb", environment: "linuxFlutter" }),
  flutterAndroid: Object.freeze({ executionClass: "linuxSandbox", toolchain: "flutterAndroidGradle", environment: "linuxAndroid" }),
  flutterWindows: Object.freeze({ executionClass: "windowsVm", toolchain: "flutterWindowsMsvc", environment: "windowsFlutter" }),
  flutterIos: Object.freeze({ executionClass: "macosXcode", toolchain: "flutterIosXcode", environment: "macosFlutter" }),
});

const Target = Type.Union(COMPILATION_TARGETS.map((target) => Type.Literal(target)));
const ProjectParams = Type.Object({ projectId: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false });
const ErrorResponse = Type.Object({ error: Type.Object({
  code: Type.Literal("studioCompilationRoutingUnavailable"),
  message: Type.String({ minLength: 1, maxLength: 256 }),
}, { additionalProperties: false }) }, { additionalProperties: false });
const Route = Type.Object({
  target: Target,
  projectSupported: Type.Boolean(),
  compilerAvailability: Type.Union([Type.Literal("available"), Type.Literal("unavailable")]),
  environment: Type.Union([
    Type.Literal("linuxNode"), Type.Literal("linuxFlutter"), Type.Literal("linuxAndroid"),
    Type.Literal("windowsFlutter"), Type.Literal("macosFlutter"),
  ]),
  executionClass: Type.Union([Type.Literal("linuxSandbox"), Type.Literal("windowsVm"), Type.Literal("macosXcode")]),
  toolchain: Type.Union([
    Type.Literal("astroNodePnpm"), Type.Literal("flutterWeb"), Type.Literal("flutterAndroidGradle"),
    Type.Literal("flutterWindowsMsvc"), Type.Literal("flutterIosXcode"),
  ]),
  reason: Type.Union([
    Type.Null(), Type.Literal("targetNotDeclared"), Type.Literal("workerUnconfigured"),
    Type.Literal("workerUnproved"), Type.Literal("toolchainUnproved"), Type.Literal("incompatibleWorker"),
  ]),
}, { additionalProperties: false });
const Projection = Type.Object({
  contractVersion: Type.Literal(COMPILATION_ROUTING_CONTRACT_VERSION),
  projectId: Type.String({ minLength: 1, maxLength: 128 }),
  projectKind: Type.Union([Type.Literal("astro"), Type.Literal("flutter")]),
  sourceRevision: Type.String({ pattern: "^[a-fA-F0-9]{7,64}$" }),
  repositoryDigest: Type.String({ pattern: "^[a-fA-F0-9]{64}$" }),
  projectEvidenceDigest: Type.String({ pattern: "^[a-fA-F0-9]{64}$" }),
  artifactDigests: Type.Array(Type.Object({
    path: Type.String({ pattern: "^(?:site|app)/[A-Za-z0-9._/-]{1,192}$" }),
    digest: Type.String({ pattern: "^[a-fA-F0-9]{64}$" }),
  }, { additionalProperties: false }), { minItems: 2, maxItems: 16 }),
  observedAt: Type.String({ format: "date-time" }),
  expiresAt: Type.String({ format: "date-time" }),
  routes: Type.Array(Route, { minItems: 5, maxItems: 5 }),
}, { $id: "shipglows.compilation-routing.v1.projection", additionalProperties: false });

export function registerCompilationRoutingRoutes(app: FastifyInstance, input: {
  readonly authentication: AuthenticationAdapter;
  readonly projectAccess: ProjectAccessRepository;
  readonly resolver?: CompilationRoutingProjectionResolver;
}): void {
  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/studio/compilation-routing",
    {
      preHandler: [authenticationGuard(input.authentication), projectAuthorizationGuard(input.projectAccess, "read")],
      schema: { params: ProjectParams, response: { 200: Projection, 503: ErrorResponse } },
    },
    async (request, reply) => {
      const actor = requiredActor(request);
      try {
        const resolved = await input.resolver?.resolve({ tenantId: actor.tenantId, userId: actor.userId, projectId: request.params.projectId });
        if (resolved?.project.projectId !== request.params.projectId || resolved.evidenceVerifier === undefined) return await unavailable(reply);
        const evidenceProbe = resolveCompilationRoute({
          tenantId: actor.tenantId,
          target: resolved.project.declaredTargets[0] ?? null,
          project: resolved.project,
          workers: resolved.workers,
          evidenceVerifier: resolved.evidenceVerifier,
        });
        if (!evidenceProbe.supported && (evidenceProbe.reason === "invalidProjectEvidence" || evidenceProbe.reason === "unknownTarget")) return await unavailable(reply);
        const routes = COMPILATION_TARGETS.map((target) => {
          const requirement = routeRequirements[target];
          const projectSupported = resolved.project.declaredTargets.includes(target);
          const route = resolveCompilationRoute({
            tenantId: actor.tenantId,
            target,
            project: resolved.project,
            workers: resolved.workers,
            evidenceVerifier: resolved.evidenceVerifier,
          });
          return Object.freeze({
            target,
            projectSupported,
            compilerAvailability: route.supported ? "available" as const : "unavailable" as const,
            environment: requirement.environment,
            executionClass: requirement.executionClass,
            toolchain: requirement.toolchain,
            reason: route.supported ? null : route.reason === "unknownTarget" || route.reason === "invalidProjectEvidence" ? "incompatibleWorker" as const : route.reason,
          });
        });
        reply.header("Cache-Control", "private, no-store").header("Vary", "Authorization, X-ShipGlows-Tenant");
        return Object.freeze({
          contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION,
          projectId: resolved.project.projectId,
          projectKind: resolved.project.projectKind,
          sourceRevision: resolved.project.sourceRevision,
          repositoryDigest: resolved.project.repositoryDigest,
          projectEvidenceDigest: resolved.project.evidenceDigest,
          artifactDigests: Object.freeze(resolved.project.artifactDigests?.map((artifact) => Object.freeze({ ...artifact })) ?? []),
          observedAt: resolved.project.observedAt,
          expiresAt: resolved.project.expiresAt,
          routes: Object.freeze(routes),
        });
      } catch {
        return unavailable(reply);
      }
    },
  );
}

function requiredActor(request: FastifyRequest) {
  if (request.shipglowsActor === undefined) throw new HttpError(401, "unauthorized", "Authentication is required.");
  return request.shipglowsActor;
}

function unavailable(reply: FastifyReply) {
  reply.header("Cache-Control", "private, no-store");
  return reply.status(503).send({ error: {
    code: "studioCompilationRoutingUnavailable" as const,
    message: "Studio compilation routing is unavailable for this project and revision.",
  } });
}
