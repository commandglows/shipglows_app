import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STUDIO_CONTRACT_VERSION,
  STUDIO_LIMITS,
  StudioContractError,
  negotiateTargetProfile,
  parseVisualCommand,
  transitionStudioState,
  type StudioTargetProfile,
  type VisualCommand,
} from "../../src/studio/contracts.js";

function profile(): StudioTargetProfile {
  return {
    schemaVersion: STUDIO_CONTRACT_VERSION,
    profileId: "shipglows.astro.hero.v1",
    projectId: "prj_shipglows_app",
    sourceRevision: "abc123",
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
    parameters: { token: "color.accent", value: "#ffffff" },
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
        projectId: "prj_shipglows_app", sourceRevision: "abc123", repositoryDigest: "a".repeat(64),
        target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
        requestedCapabilities: ["token.set"], trustedFirstPartyBase: true,
      }),
      { supported: true, capabilities: ["token.set"] },
    );
    assert.deepEqual(
      negotiateTargetProfile(profile(), {
        projectId: "prj_other", sourceRevision: "abc123", repositoryDigest: "a".repeat(64),
        target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
        requestedCapabilities: ["token.set"], trustedFirstPartyBase: true,
      }),
      { supported: false, capabilities: [], reason: "profileMismatch" },
    );
    assert.deepEqual(
      negotiateTargetProfile(profile(), {
        projectId: "prj_shipglows_app", sourceRevision: "abc123", repositoryDigest: "a".repeat(64),
        target: "astro", adapterVersion: "1.0.0", capabilityVersion: "1.0.0",
        requestedCapabilities: ["motion.duration"], trustedFirstPartyBase: true,
      }),
      { supported: false, capabilities: [], reason: "unsupportedCapability" },
    );
  });
});
