import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SupabaseAuthenticationAdapter,
  type ActorResolver,
  type SupabaseJwtVerifier,
} from "../../src/auth/index.js";

const verifier: SupabaseJwtVerifier = {
  verify: async (accessToken) => {
    if (accessToken !== "valid.jwt.token") throw new Error("invalid token");
    return { subject: "auth-user-000000000001" };
  },
};

const resolver: ActorResolver = {
  resolve: async ({ subject, tenantId }) => {
    if (subject !== "auth-user-000000000001" || tenantId !== "ten_000000000001") return null;
    return {
      tenantId,
      userId: "usr_000000000001",
      subject,
    };
  },
};

describe("Supabase authentication adapter", () => {
  it("verifies a bearer token then resolves the actor within the requested tenant", async () => {
    const adapter = new SupabaseAuthenticationAdapter(verifier, resolver);

    const actor = await adapter.authenticate({
      headers: {
        authorization: "Bearer valid.jwt.token",
        "x-shipglows-tenant": "ten_000000000001",
      },
    });

    assert.deepEqual(actor, {
      tenantId: "ten_000000000001",
      userId: "usr_000000000001",
      subject: "auth-user-000000000001",
    });
  });

  it("fails closed for malformed authorization, an invalid token, or a cross-tenant request", async () => {
    const adapter = new SupabaseAuthenticationAdapter(verifier, resolver);

    for (const headers of [
      { authorization: "Token valid.jwt.token", "x-shipglows-tenant": "ten_000000000001" },
      { authorization: "Bearer invalid.jwt.token", "x-shipglows-tenant": "ten_000000000001" },
      { authorization: "Bearer valid.jwt.token", "x-shipglows-tenant": "ten_000000000002" },
      { authorization: "Bearer valid.jwt.token", "x-shipglows-tenant": "../ten_000000000001" },
    ]) {
      assert.equal(await adapter.authenticate({ headers }), null);
    }
  });
});
