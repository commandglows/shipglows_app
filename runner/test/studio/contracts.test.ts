import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STUDIO_CONTRACT_VERSION,
  STUDIO_LIMITS,
  StudioContractError,
  negotiateTargetProfile,
  parseVisualCommand,
  studioBridgeMessageBytes,
  transitionStudioState,
  type StudioTargetProfile,
  type VisualCommand,
} from "../../src/studio/contracts.js";

function profile(): StudioTargetProfile {
  return {
    schemaVersion: STUDIO_CONTRACT_VERSION,
    profileId: "shipglows.astro.hero.v1",
    projectId: "prj_shipglows_app",
    sourceRevision: "abc1234",
    repositoryDigest: "a".repeat(64),
    target: "astro",
    targetRoot: "site/",
    adapterVersion: "1.0.0",
    capabilityVersion: "1.0.0",
    capabilities: ["token.set", "spacing.set", "visibility.set"],
    allowedSourceRoots: ["site/src/components/", "site/src/styles/"],
    fixtureIds: ["hero.default"],
    runtime: { packageManager: "pnpm", packageManagerVersion: "10.14.0", runtimeVersion: "22.16.0" },
    limits: STUDIO_LIMITS,
    isolation: "trustedFirstPartyBaseOnly",
    productionExcluded: true,
  };
}

function command(): VisualCommand {
  return {
    schemaVersion: STUDIO_CONTRACT_VERSION,
    commandId: "cmd_0001",
    sessionId: "ses_0001",
    kind: "token.set",
    parameters: { token: "color.accent", value: "brand" },
    affectedRuntimeNodeIds: ["node_0001"],
    affectedDimensions: ["design"],
    provenance: { actorType: "operator", actorId: "usr_0001" },
    revision: 1,
    idempotencyKey: "idem_0001",
    previewOnly: true,
    requiredCapability: "token.set",
    requiredUnprotectedDimensions: ["design"],
    compactionKey: "node_0001:color.accent",
  };
}

describe("Studio closed contracts", () => {
  it("round-trips a bounded semantic command", () => {
    const source = command();
    assert.deepEqual(parseVisualCommand(JSON.parse(JSON.stringify(source))), source);
  });

  it("rejects additional properties, raw executable input, and oversized requests", () => {
    assert.throws(() => parseVisualCommand({ ...command(), selector: "body" }), StudioContractError);
    assert.throws(
      () => parseVisualCommand({ ...command(), parameters: { css: "body{display:none}" } }),
      StudioContractError,
    );
    assert.throws(
      () => parseVisualCommand({ ...command(), parameters: { token: "x", value: "a".repeat(STUDIO_LIMITS.maxRequestBytes) } }),
      /exceeds/i,
    );
  });

  it("covers every allowed state transition and rejects step skipping", () => {
    const allowed = [
      ["unavailable", "starting"], ["starting", "ready"],
      ["ready", "previewing"], ["previewing", "laboratory"],
      ["laboratory", "compiling"], ["compiling", "verifying"],
      ["verifying", "verified"], ["verifying", "failed"],
      ["unavailable", "closed"], ["previewing", "interrupted"],
      ["interrupted", "closed"], ["failed", "closed"], ["verified", "closed"],
    ] as const;
    for (const [from, to] of allowed) assert.equal(transitionStudioState(from, to), to);
    assert.throws(() => transitionStudioState("unavailable", "verified"), /transition/i);
  });

  it("negotiates capabilities exactly and fails closed on profile mismatch", () => {
    assert.deepEqual(
      negotiateTargetProfile(profile(), {
        projectId: "prj_shipglows_app", sourceRevision: "abc1234", repositoryDigest: "a".repeat(64),
        target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
        requestedCapabilities: ["token.set"], trustedFirstPartyBase: true,
      }),
      { supported: true, capabilities: ["token.set"] },
    );
    assert.deepEqual(
      negotiateTargetProfile(profile(), {
        projectId: "prj_other", sourceRevision: "abc1234", repositoryDigest: "a".repeat(64),
        target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
        requestedCapabilities: ["token.set"], trustedFirstPartyBase: true,
      }),
      { supported: false, capabilities: [], reason: "profileMismatch" },
    );
    assert.deepEqual(
      negotiateTargetProfile(profile(), {
        projectId: "prj_shipglows_app", sourceRevision: "abc1234", repositoryDigest: "a".repeat(64),
        target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
        requestedCapabilities: ["motion.duration"], trustedFirstPartyBase: true,
      }),
      { supported: false, capabilities: [], reason: "unsupportedCapability" },
    );
  });

  it("rejects nested, non-finite, duplicate, and dimension-bypass command inputs", () => {
    assert.throws(() => parseVisualCommand({ ...command(), parameters: { token: "color.accent", value: { javascript: "alert(1)" } } }), StudioContractError);
    assert.throws(() => parseVisualCommand({ ...command(), affectedDimensions: ["design", "design"] }), StudioContractError);
    assert.throws(() => parseVisualCommand({ ...command(), affectedDimensions: ["copy"], requiredUnprotectedDimensions: ["design"] }), StudioContractError);
    assert.throws(() => parseVisualCommand({ ...command(), kind: "opacity.set", requiredCapability: "opacity.set", parameters: { value: Number.NaN } }), StudioContractError);
  });

  it("rejects a malformed profile even when remaining identity fields match", () => {
    const malformed = { ...profile(), schemaVersion: "wrong", profileId: "wrong" } as unknown as StudioTargetProfile;
    assert.deepEqual(negotiateTargetProfile(malformed, {
      projectId: "prj_shipglows_app", sourceRevision: "abc1234", repositoryDigest: "a".repeat(64), target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0", requestedCapabilities: ["token.set"], trustedFirstPartyBase: true,
    }), { supported: false, capabilities: [], reason: "profileMismatch" });
  });

  it("enforces the shared UTF-8 bridge budget at N and N+1 bytes", () => {
    const overhead = studioBridgeMessageBytes({ pad: "" });
    assert.equal(studioBridgeMessageBytes({ pad: "a".repeat(STUDIO_LIMITS.maxBridgeMessageBytes - overhead) }), STUDIO_LIMITS.maxBridgeMessageBytes);
    assert.equal(studioBridgeMessageBytes({ pad: "a".repeat(STUDIO_LIMITS.maxBridgeMessageBytes - overhead + 1) }), STUDIO_LIMITS.maxBridgeMessageBytes + 1);
    assert.ok(studioBridgeMessageBytes({ pad: "é" }) > JSON.stringify({ pad: "é" }).length);
  });
});
