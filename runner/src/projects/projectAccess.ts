import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";

import { HttpError } from "../contracts/index.js";

export type ProjectCapability = "read" | "mutate";

export interface ProjectAccessRepository {
  hasProjectAccess(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly capability: ProjectCapability;
  }): Promise<boolean> | boolean;

  /** Resolve an external application's project id without trusting the client. */
  resolveProjectId?: (input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly sourceSystem: string;
    readonly sourceProjectId: string;
  }) => Promise<string | null> | string | null;
}

interface ProjectRequest extends FastifyRequest {
  readonly params: { readonly projectId?: string };
}

export function projectAuthorizationGuard(
  access: ProjectAccessRepository,
  capability: ProjectCapability,
): preHandlerAsyncHookHandler {
  return async (request): Promise<void> => {
    const projectRequest = request as ProjectRequest;
    const actor = projectRequest.shipglowzActor;
    const projectId = projectRequest.params.projectId;
    if (
      actor === undefined ||
      projectId === undefined ||
      !(await access.hasProjectAccess({
        tenantId: actor.tenantId,
        userId: actor.userId,
        projectId,
        capability,
      }))
    ) {
      throw new HttpError(403, "projectForbidden", "You do not have access to this project.");
    }
  };
}
