import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FirebaseAuthenticationAdapter,
  FixedSingleUserFirebaseAuthenticationAdapter,
  PersonalCloudFirebaseAuthenticationAdapter,
  type ActorResolver,
  type FirebaseIdTokenVerifier,
} from "../../src/auth/index.js";

const verifier: FirebaseIdTokenVerifier = {
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

describe("Firebase authentication adapter", () => {
  it("verifies a bearer token then resolves the actor within the requested tenant", async () => {
    const adapter = new FirebaseAuthenticationAdapter(verifier, resolver);

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
    const adapter = new FirebaseAuthenticationAdapter(verifier, resolver);

    for (const headers of [
      { authorization: "Token valid.jwt.token", "x-shipglows-tenant": "ten_000000000001" },
      { authorization: "Bearer invalid.jwt.token", "x-shipglows-tenant": "ten_000000000001" },
      { authorization: "Bearer valid.jwt.token", "x-shipglows-tenant": "ten_000000000002" },
      { authorization: "Bearer valid.jwt.token", "x-shipglows-tenant": "../ten_000000000001" },
    ]) {
      assert.equal(await adapter.authenticate({ headers }), null);
    }
  });

  it("binds personal-cloud auth to one configured subject without a tenant header", async () => {
    const adapter = new FixedSingleUserFirebaseAuthenticationAdapter(
      verifier,
      "auth-user-000000000001",
      "ten_personal",
      "usr_owner",
    );
    assert.deepEqual(await adapter.authenticate({ headers: { authorization: "Bearer valid.jwt.token" } }), {
      tenantId: "ten_personal",
      userId: "usr_owner",
      subject: "auth-user-000000000001",
    });
    const otherVerifier: FirebaseIdTokenVerifier = { verify: async () => ({ subject: "other-user" }) };
    const denied = new FixedSingleUserFirebaseAuthenticationAdapter(otherVerifier, "auth-user-000000000001", "ten_personal", "usr_owner");
    assert.equal(await denied.authenticate({ headers: { authorization: "Bearer valid.jwt.token", "x-shipglows-tenant": "attacker" } }), null);
  });

  it("provisions every valid Firebase subject without trusting a tenant header", async () => {
    const failures: string[] = [];
    const adapter = new PersonalCloudFirebaseAuthenticationAdapter(
      verifier,
      {
        resolveOrProvision: async ({ subject }) => ({
          subject,
          tenantId: "ten_personal_subject",
          userId: "usr_personal_subject",
        }),
      },
      (reason) => failures.push(reason),
    );
    assert.deepEqual(
      await adapter.authenticate({
        headers: {
          authorization: "Bearer valid.jwt.token",
          "x-shipglows-tenant": "attacker",
        },
      }),
      {
        subject: "auth-user-000000000001",
        tenantId: "ten_personal_subject",
        userId: "usr_personal_subject",
      },
    );
    assert.deepEqual(failures, []);
  });

  it("reports redacted authentication failure categories", async () => {
    const failures: string[] = [];
    const adapter = new PersonalCloudFirebaseAuthenticationAdapter(
      verifier,
      { resolveOrProvision: async () => { throw new Error("database unavailable"); } },
      (reason) => failures.push(reason),
    );
    assert.equal(await adapter.authenticate({ headers: {} }), null);
    assert.equal(await adapter.authenticate({ headers: { authorization: "Bearer invalid.jwt.token" } }), null);
    assert.equal(await adapter.authenticate({ headers: { authorization: "Bearer valid.jwt.token" } }), null);
    assert.deepEqual(failures, ["missingBearer", "invalidToken", "provisioningFailed"]);
  });
});
