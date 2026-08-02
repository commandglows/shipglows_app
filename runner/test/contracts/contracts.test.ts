import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ApiErrorSchema,
  CommandRequestSchemas,
  EVENT_TYPES,
  NormalizedEventSchema,
  VersionResponseSchema,
  assertSecretSafe,
  SecretPayloadError,
} from "../../src/contracts/index.js";

describe("versioned public contracts", () => {
  it("publishes stable v1 schema identifiers and a closed event vocabulary", () => {
    assert.equal((VersionResponseSchema as { $id?: string }).$id, "shipglowz.v1.version.response");
    assert.equal((ApiErrorSchema as { $id?: string }).$id, "shipglowz.v1.error.response");
    assert.equal(
      (NormalizedEventSchema as { $id?: string }).$id,
      "shipglowz.v1.conversation.event",
    );
    assert.ok(EVENT_TYPES.includes("conversation.created"));
    assert.ok(EVENT_TYPES.includes("approval.requested"));
    assert.ok(EVENT_TYPES.includes("stream.heartbeat"));
    assert.equal(new Set(EVENT_TYPES).size, EVENT_TYPES.length);
  });

  it("keeps command request schemas closed to client-selected policy fields", () => {
    for (const schema of Object.values(CommandRequestSchemas)) {
      assert.equal((schema as { additionalProperties?: boolean }).additionalProperties, false);
    }
  });
});

describe("secret-safe public payloads", () => {
  it("rejects secret-bearing field names at any depth", () => {
    for (const payload of [
      { authorization: "Bearer hidden" },
      { nested: { installationToken: "hidden" } },
      { nested: [{ clonePath: "/srv/private/repository" }] },
      { cookie: "session=hidden" },
    ]) {
      assert.throws(
        () => assertSecretSafe(payload),
        (error: unknown) => error instanceof SecretPayloadError,
      );
    }
  });

  it("rejects recognizable token values even under innocent field names", () => {
    assert.throws(
      () => assertSecretSafe({ diagnostic: "ghs_ABCDEF0123456789abcdef" }),
      (error: unknown) => error instanceof SecretPayloadError,
    );
  });

  it("accepts bounded opaque diagnostics", () => {
    assert.doesNotThrow(() =>
      assertSecretSafe({
        code: "runtimeUnavailable",
        projectId: "prj_000000000001",
        summary: "The managed runtime is unavailable.",
      }),
    );
  });
});
