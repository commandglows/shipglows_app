import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunnerApp } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";
import { STUDIO_PREVIEW_CAPABILITIES, createTrustedBaseStudioCapability, type StudioCapabilityAdmission, type StudioCapabilityResolver } from "../../src/studio/capability.js";
import { StudioSessionService } from "../../src/studio/session.js";

const actor = { tenantId: "ten_1", userId: "usr_1", subject: "sub_1" };
const revision = "a".repeat(40);
const digest = "b".repeat(64);
const projection = createTrustedBaseStudioCapability({ projectId: "shipglows_app", previewOrigin: "http://127.0.0.1:3003", sourceRevision: revision, expectedSourceRevision: revision, repositoryDigest: digest, expectedRepositoryDigest: digest, requestedCapabilities: STUDIO_PREVIEW_CAPABILITIES });
assert.ok(projection);
const firstSurface = projection.surfaces[0];
assert.ok(firstSurface);
const admission: StudioCapabilityAdmission = { projection, adapterVersion: "1.0.0", capabilityVersion: "1.0.0", allowedImpactPaths: ["site/src/components/Hero.astro"], requiredEvidence: ["astro.test"] };

function runner(input: { authenticated?: boolean; allowed?: boolean; resolver?: StudioCapabilityResolver } = {}) {
  const resolver = input.resolver ?? { resolve: () => projection, admit: () => admission };
  return buildRunnerApp({
    config: loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005" }),
    dependencies: {
      ...(input.authenticated === false ? {} : { authentication: { authenticate: async () => actor } }),
      projectAccess: { hasProjectAccess: (request) => input.allowed !== false && request.tenantId === actor.tenantId && request.userId === actor.userId && request.projectId === "shipglows_app" },
      studioCapability: resolver,
      studioSessions: new StudioSessionService(resolver),
    },
  });
}

const mutationHeaders = { origin: "http://127.0.0.1:3005", "idempotency-key": "create_1" };

describe("Studio session routes", () => {
  it("requires authentication, tenant project mutation access, and trusted origin", async () => {
    const unauthenticated = runner({ authenticated: false });
    const unauthorized = await unauthenticated.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    await unauthenticated.close();
    assert.equal(unauthorized.statusCode, 401);

    const crossTenant = runner({ allowed: false });
    const forbidden = await crossTenant.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    await crossTenant.close();
    assert.equal(forbidden.statusCode, 403);

    const hostileOrigin = runner();
    const deniedOrigin = await hostileOrigin.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: { ...mutationHeaders, origin: "https://evil.example" }, payload: {} });
    await hostileOrigin.close();
    assert.equal(deniedOrigin.statusCode, 403);
  });

  it("creates and replays one actor-scoped session without source mutation", async () => {
    const app = runner();
    const first = await app.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    const replay = await app.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    await app.close();
    assert.equal(first.statusCode, 200);
    assert.equal(replay.statusCode, 200);
    assert.equal(first.json().sessionId, replay.json().sessionId);
    assert.equal(first.json().sourceRevision, revision);
    assert.equal(first.json().variants.length, 1);
    assert.equal(first.json().activeVariantId, first.json().variants[0].variantId);
  });

  it("executes the closed capability to compile sequence and fails worker isolation without host execution", async () => {
    const app = runner();
    const capability = await app.inject({ method: "GET", url: "/v1/projects/shipglows_app/studio/capability" });
    assert.equal(capability.statusCode, 200);
    assert.equal(capability.json().compileAdmission.reason, "workerIsolationUnavailable");

    const created = await app.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    const sessionId = created.json().sessionId as string;
    const initialVariantId = created.json().activeVariantId as string;
    const command = await app.inject({
      method: "POST",
      url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/commands`,
      headers: { ...mutationHeaders, "idempotency-key": "command_flow_1" },
      payload: {
        schemaVersion: "shipglows.studio.v1", commandId: "cmd_flow_1", sessionId, kind: "opacity.set", parameters: { value: 0.72 },
        affectedRuntimeNodeIds: ["hero.title"], affectedDimensions: ["design"], provenance: { actorType: "operator", actorId: "operator" },
        revision: 1, idempotencyKey: "command_flow_1", previewOnly: true, requiredCapability: "opacity.set", requiredUnprotectedDimensions: [], compactionKey: "hero.title.opacity",
      },
    });
    assert.equal(command.statusCode, 200);
    assert.equal(command.json().commandCount, 1);

    const undo = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/commands/undo`, headers: { ...mutationHeaders, "idempotency-key": "undo_flow_1" }, payload: {} });
    const redo = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/commands/redo`, headers: { ...mutationHeaders, "idempotency-key": "redo_flow_1" }, payload: {} });
    assert.equal(undo.json().undoCursor, 0);
    assert.equal(redo.json().undoCursor, 1);

    const variant = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/variants`, headers: { ...mutationHeaders, "idempotency-key": "variant_flow_1" }, payload: { action: "create", name: "Variante 2" } });
    const createdVariantId = variant.json().activeVariantId as string;
    assert.notEqual(createdVariantId, initialVariantId);
    const selected = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/variants`, headers: { ...mutationHeaders, "idempotency-key": "select_flow_1" }, payload: { action: "select", variantId: initialVariantId } });
    assert.equal(selected.json().activeVariantId, initialVariantId);
    const deleted = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/variants`, headers: { ...mutationHeaders, "idempotency-key": "delete_flow_1" }, payload: { action: "delete", variantId: createdVariantId } });
    assert.equal(deleted.json().variants.length, 1);

    const compile = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/compile-intents`, headers: { ...mutationHeaders, "idempotency-key": "compile_flow_1" }, payload: { variantId: initialVariantId } });
    assert.equal(compile.statusCode, 200);
    assert.equal(compile.json().status, "failed");
    assert.equal(compile.json().variantId, initialVariantId);

    const mismatched = await app.inject({ method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/compile-intents`, headers: { ...mutationHeaders, "idempotency-key": "compile_flow_2" }, payload: { variantId: initialVariantId, intentId: "client_owned" } });
    assert.equal(mismatched.statusCode, 400);
    await app.close();
  });

  it("rejects nested command parameters at the HTTP boundary without journal mutation", async () => {
    const app = runner();
    const created = await app.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    const sessionId = created.json().sessionId as string;
    const malformed = await app.inject({
      method: "POST",
      url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/commands`,
      headers: { ...mutationHeaders, "idempotency-key": "command_1" },
      payload: {
        schemaVersion: "shipglows.studio.v1",
        commandId: "cmd_1",
        sessionId,
        kind: "color.set",
        parameters: { property: "backgroundColor", token: { raw: "#ffffff" } },
        affectedRuntimeNodeIds: [firstSurface.id],
        affectedDimensions: ["color"],
        provenance: { actorType: "operator", actorId: actor.userId },
        revision: 1,
        idempotencyKey: "command_1",
        previewOnly: true,
        requiredCapability: "inspect",
        requiredUnprotectedDimensions: ["color"],
      },
    });
    const unchanged = await app.inject({ method: "GET", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}` });
    await app.close();
    assert.equal(malformed.statusCode, 400);
    assert.equal(unchanged.statusCode, 200);
    assert.equal(unchanged.json().commandCount, 0);
  });

  it("rejects unsupported surface capabilities and protected dimensions", async () => {
    const app = runner();
    const created = await app.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: { ...mutationHeaders, "idempotency-key": "create_restrictions" }, payload: {} });
    const sessionId = created.json().sessionId as string;
    const envelope = {
      schemaVersion: "shipglows.studio.v1", sessionId, affectedRuntimeNodeIds: ["hero.eyebrow"], provenance: { actorType: "operator", actorId: "operator" },
      revision: 1, previewOnly: true, requiredUnprotectedDimensions: [] as string[],
    };
    const unsupported = await app.inject({
      method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/commands`, headers: { ...mutationHeaders, "idempotency-key": "unsupported_1" },
      payload: { ...envelope, commandId: "unsupported_1", kind: "spacing.set", parameters: { property: "gap", value: 12 }, affectedDimensions: ["design"], idempotencyKey: "unsupported_1", requiredCapability: "spacing.set" },
    });
    const protectedDimension = await app.inject({
      method: "POST", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}/commands`, headers: { ...mutationHeaders, "idempotency-key": "protected_1" },
      payload: { ...envelope, commandId: "protected_1", kind: "opacity.set", parameters: { value: 0.5 }, affectedDimensions: ["accessibility"], idempotencyKey: "protected_1", requiredCapability: "opacity.set" },
    });
    const unchanged = await app.inject({ method: "GET", url: `/v1/projects/shipglows_app/studio-sessions/${sessionId}` });
    await app.close();
    assert.equal(unsupported.statusCode, 400);
    assert.equal(protectedDimension.statusCode, 409);
    assert.equal(unchanged.json().commandCount, 0);
  });

  it("maps admission exceptions to the stable unavailable response", async () => {
    const failing: StudioCapabilityResolver = { resolve: () => projection, admit: () => { throw new Error("private failure"); } };
    const app = runner({ resolver: failing });
    const response = await app.inject({ method: "POST", url: "/v1/projects/shipglows_app/studio-sessions", headers: mutationHeaders, payload: {} });
    await app.close();
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "studioUnavailable");
    assert.doesNotMatch(response.body, /private failure/i);
  });
});
