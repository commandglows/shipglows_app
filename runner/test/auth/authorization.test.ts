import assert from "node:assert/strict";
import Fastify from "fastify";
import { describe, it } from "node:test";

import {
  DisabledAuthenticationAdapter,
  authenticationGuard,
} from "../../src/auth/index.js";
import type {
  ActorContext,
  AuthenticationAdapter,
} from "../../src/auth/index.js";
import { installErrorHandler } from "../../src/contracts/index.js";
import {
  projectAuthorizationGuard,
  type ProjectAccessRepository,
} from "../../src/projects/projectAccess.js";

const actor: ActorContext = {
  tenantId: "ten_000000000001",
  userId: "usr_000000000001",
  subject: "supabase-user-000000000001",
  sessionId: "ses_000000000001",
};

describe("authentication and project authorization", () => {
  it("fails closed when no authentication provider is configured", async () => {
    const app = Fastify();
    installErrorHandler(app);
    app.get(
      "/protected",
      { preHandler: authenticationGuard(new DisabledAuthenticationAdapter()) },
      async () => ({ ok: true }),
    );

    const response = await app.inject({ method: "GET", url: "/protected" });
    await app.close();

    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, "unauthorized");
  });

  it("denies a cross-tenant project reference before the handler runs", async () => {
    const auth: AuthenticationAdapter = {
      authenticate: async () => actor,
    };
    const access: ProjectAccessRepository = {
      hasProjectAccess: (input) =>
        input.tenantId === "ten_000000000002" &&
        input.projectId === "prj_000000000002",
    };
    let handlerRan = false;
    const app = Fastify();
    installErrorHandler(app);
    app.get<{ Params: { projectId: string } }>(
      "/v1/projects/:projectId/probe",
      {
        preHandler: [
          authenticationGuard(auth),
          projectAuthorizationGuard(access, "read"),
        ],
      },
      async () => {
        handlerRan = true;
        return { ok: true };
      },
    );

    const response = await app.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000002/probe",
    });
    await app.close();

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error.code, "projectForbidden");
    assert.equal(handlerRan, false);
  });
});
