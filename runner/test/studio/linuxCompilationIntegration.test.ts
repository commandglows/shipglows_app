/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canonicalJsonDigest } from "../../src/studio/compilation/canonicalManifest.js";
import {
  createLinuxCompilationIntegration,
  type LinuxCompilationImagePlanV1,
  type LinuxCompilationRuntimeProofV1,
} from "../../src/studio/compilation/integration.js";
import type { CompilationCoordinatorPorts } from "../../src/studio/compilation/ports.js";

const a = "a".repeat(64), b = "b".repeat(64), c = "c".repeat(64), d = "d".repeat(64), e = "e".repeat(64), f = "f".repeat(64);
const id = "abcdefghijklmnopqrstuv";

function image(target: "astro_web" | "flutter_web", seed: string): LinuxCompilationImagePlanV1 {
  const astro = target === "astro_web";
  return {
    schemaVersion: "shipglows-toolchain-image-plan-v1",
    target,
    status: "verified",
    routable: true,
    visibility: "private",
    platform: "linux/amd64",
    finalImage: { repository: `vcr.vercel.com/shipglows/${target}`, digest: seed.repeat(64) },
    toolchain: { toolchainDigest: (astro ? "1" : "2").repeat(64) },
    offlineCache: { contentDigest: c },
    execution: {
      commands: astro ? [
        ["pnpm", "install", "--offline", "--frozen-lockfile", "--ignore-scripts"],
        ["pnpm", "exec", "astro", "check"],
        ["pnpm", "exec", "astro", "build"],
      ] : [
        ["flutter", "pub", "get", "--offline", "--enforce-lockfile"],
        ["flutter", "build", "web", "--release", "--no-pub"],
      ],
      outputRoot: astro ? "dist" : "build/web",
      timeoutMs: 600000,
      persistent: false,
      ports: 0,
      runtimeNetwork: "deny_all",
      guestCredentials: false,
    },
    attestation: { sbomDigest: d, provenanceDigest: e, vulnerabilityResultDigest: f },
    blockers: [],
  };
}

function configuration(astro: LinuxCompilationImagePlanV1, flutter: LinuxCompilationImagePlanV1) {
  return {
    enabled: true,
    accountScopeDigest: a,
    projectScopeDigest: b,
    configurationDigest: c,
    oidc: {
      issuer: "https://oidc.vercel.com/team_shipglows",
      jwksUrl: "https://oidc.vercel.com/team_shipglows/.well-known/jwks.json",
      audience: "https://vercel.com/shipglows",
      subject: "owner:shipglows:project:studio:environment:development",
      owner: "shipglows", ownerId: "owner_shipglows", team: "shipglows", teamId: "team_shipglows",
      project: "studio", projectId: "project_studio", userId: "user_shipglows", environment: "development" as const,
    },
    images: {
      astro_web: { reference: `${astro.finalImage.repository}@sha256:${astro.finalImage.digest}`, imageDigest: astro.finalImage.digest!, toolchainDigest: astro.toolchain.toolchainDigest! },
      flutter_web: { reference: `${flutter.finalImage.repository}@sha256:${flutter.finalImage.digest}`, imageDigest: flutter.finalImage.digest!, toolchainDigest: flutter.toolchain.toolchainDigest! },
    },
  };
}

function proof(astro: LinuxCompilationImagePlanV1, flutter: LinuxCompilationImagePlanV1): LinuxCompilationRuntimeProofV1 {
  const core = {
    schemaVersion: "linux-compilation-runtime-proof-v1" as const,
    configurationDigest: c,
    oidcPolicyDigest: d,
    ledgerPolicyDigest: e,
    astroManifestDigest: canonicalJsonDigest(astro),
    flutterManifestDigest: canonicalJsonDigest(flutter),
  };
  return { ...core, proofDigest: canonicalJsonDigest(core) };
}

function request(target: "astro_web" | "flutter_web") {
  return {
    schemaVersion: "compilation-coordinator-request-v1" as const,
    operationId: id,
    scope: { jobId: id, tenantId: id, projectId: id, target, routeRequirementDigest: a },
    expectedLedgerDigest: a,
    expectedLedgerRevision: 0,
    budgetDigest: b,
    planId: id,
    leaseId: "bcdefghijklmnopqrstuvw",
    now: new Date("2026-08-16T10:00:00.000Z"),
  };
}

function harness(overrides: { astro?: LinuxCompilationImagePlanV1; flutter?: LinuxCompilationImagePlanV1; runtimeProof?: LinuxCompilationRuntimeProofV1 | null } = {}) {
  const astro = overrides.astro ?? image("astro_web", "3"), flutter = overrides.flutter ?? image("flutter_web", "4");
  let loads = 0;
  const selections: unknown[] = [];
  const integration = createLinuxCompilationIntegration({
    configuration: configuration(astro, flutter),
    imagePlans: { astro_web: astro, flutter_web: flutter },
    runtimeProof: overrides.runtimeProof === undefined ? proof(astro, flutter) : overrides.runtimeProof,
  }, {
    loadSdk: async () => { loads += 1; throw new Error("must not load"); },
    verifier: {} as never,
    ledger: {} as never,
    createPorts: (selection) => {
      selections.push(selection);
      return {
        operations: { load: async () => null, create: async () => false, complete: async () => false },
      } as unknown as CompilationCoordinatorPorts;
    },
  });
  return { integration, selections, get loads() { return loads; } };
}

describe("Linux compilation D1 integration", () => {
  it("routes Astro and Flutter through exact immutable target plans without loading the SDK", async () => {
    const h = harness();
    assert.equal(h.integration.available, true);
    assert.deepEqual(h.selections.map((value: any) => [value.target, value.plan]), [["astro_web", "astro_web_v1"], ["flutter_web", "flutter_web_v1"]]);
    assert.equal((await h.integration.compile("astro_web", request("astro_web"))).reason, "budgetUnavailable");
    assert.equal((await h.integration.compile("flutter_web", request("flutter_web"))).reason, "budgetUnavailable");
    assert.equal(h.loads, 0);
  });

  it("keeps the current C2 non-routable plans unavailable with zero SDK or port construction", async () => {
    const astro = { ...image("astro_web", "3"), status: "blocked_missing_immutable_inputs", routable: false, blockers: ["final_image_digest_unresolved"] };
    const h = harness({ astro, runtimeProof: null });
    assert.equal(h.integration.available, false);
    assert.equal(h.integration.reason, "workerUnproved");
    assert.equal(h.selections.length, 0);
    assert.equal((await h.integration.compile("astro_web", request("astro_web"))).reason, "disabled");
    assert.equal(h.loads, 0);
  });

  it("fails closed for target replay, digest replay, unknown targets, and disabled configuration", async () => {
    const h = harness();
    assert.equal((await h.integration.compile("astro_web", request("flutter_web"))).reason, "routeStale");
    assert.equal((await h.integration.compile("windows", request("astro_web"))).reason, "unsupportedTarget");
    const astro = image("astro_web", "3"), flutter = image("flutter_web", "4"), replay = proof(astro, flutter);
    const invalid = harness({ astro, flutter, runtimeProof: { ...replay, flutterManifestDigest: replay.astroManifestDigest } });
    assert.equal(invalid.integration.available, false);
    assert.equal(invalid.integration.reason, "projectUnproved");
    assert.equal(invalid.selections.length, 0);
    assert.equal(invalid.loads, 0);
  });

  it("snapshots and freezes the accepted wiring", () => {
    const h = harness();
    const first: any = h.selections[0];
    assert.equal(Object.isFrozen(first), true);
    assert.equal(Object.isFrozen(first.imagePlan), true);
    assert.throws(() => { first.imagePlan.routable = false; });
    assert.equal(h.integration.available, true);
  });
});
