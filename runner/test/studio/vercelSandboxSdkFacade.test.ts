import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";

import type { NetworkPolicy } from "@vercel/sandbox";

import {
  createVercelSandboxSdkFacade,
  VercelSandboxSdkFacadeError,
  type VercelBudgetAuthorizationResult,
  type VercelBudgetLedgerPort,
  type VercelCompilationBinding,
  type VercelOidcVerificationResult,
  type VercelSandboxSdkCreateInput,
  type VercelSandboxSdkInstance,
  type VercelSandboxSdkPort,
  type VercelSandboxSdkRunCommandInput,
  type VercelTrustVerifierPort,
} from "../../src/studio/providers/vercelSandboxSdkFacade.js";
import {
  ASYNC_RETRY_TYPES_INTEGRITY,
  ASYNC_RETRY_TYPES_VERSION,
  disabledVercelSandboxConfiguration,
  validateVercelSandboxConfiguration,
  VERCEL_SANDBOX_SDK_INTEGRITY,
  VERCEL_SANDBOX_SDK_VERSION,
} from "../../src/studio/providers/vercelSandboxConfiguration.js";

const a = "a".repeat(64),
  b = "b".repeat(64),
  c = "c".repeat(64),
  d = "d".repeat(64),
  token = `eyJ${"x".repeat(80)}`;
const astroReference = `shipglows/astro-web@sha256:${a}`,
  flutterReference = `shipglows/flutter-web@sha256:${b}`;
const oidcPolicy = {
  issuer: "https://oidc.vercel.com/shipglows-team",
  jwksUrl: "https://oidc.vercel.com/shipglows-team/.well-known/jwks.json",
  audience: "https://vercel.com/shipglows",
  subject: "owner:shipglows:project:studio",
  owner: "shipglows",
  ownerId: "team_shipglows",
  team: "shipglows",
  teamId: "team_shipglows",
  project: "studio",
  projectId: "prj_studio_2026",
  userId: "usr_shadow_2026",
  environment: "development" as const,
};
const enabled = validateVercelSandboxConfiguration({
  enabled: true,
  accountScopeDigest: c,
  projectScopeDigest: d,
  configurationDigest: a,
  oidc: oidcPolicy,
  images: {
    astro_web: {
      reference: astroReference,
      imageDigest: a,
      toolchainDigest: c,
    },
    flutter_web: {
      reference: flutterReference,
      imageDigest: b,
      toolchainDigest: d,
    },
  },
});
const binding: VercelCompilationBinding = {
  sandboxName: "shipglows-job",
  jobId: "job_abcdefghijklmnop",
  tenantId: "tenant_abcdefghijkl",
  projectId: "project_abcdefghijk",
  target: "astro_web",
  accountScopeDigest: c,
  projectScopeDigest: d,
  configurationDigest: a,
  imageReference: astroReference,
  imageDigest: a,
  toolchainDigest: c,
  budgetDigest: b,
};
const now = 1_800_000_000_000;

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function bindingHash(value: VercelCompilationBinding): string {
  return sha(
    JSON.stringify([
      value.sandboxName,
      value.jobId,
      value.tenantId,
      value.projectId,
      value.target,
      value.accountScopeDigest,
      value.projectScopeDigest,
      value.configurationDigest,
      value.imageReference,
      value.imageDigest,
      value.toolchainDigest,
      value.budgetDigest,
    ]),
  );
}
function tags(value: VercelCompilationBinding): Record<string, string> {
  return {
    shipglows: "compilation",
    job: sha(value.jobId).slice(0, 32),
    tenant: sha(value.tenantId).slice(0, 32),
    project: sha(value.projectId).slice(0, 32),
    config: value.configurationDigest.slice(0, 32),
  };
}
function oidcResult(
  overrides: Partial<VercelOidcVerificationResult> = {},
): VercelOidcVerificationResult {
  const tokenDigest = sha(token),
    jti = "jti_abcdefghijklmnop";
  return {
    signatureVerified: true,
    algorithm: "RS256",
    keyId: "kid_abcdefghijklmnop",
    issuer: oidcPolicy.issuer,
    jwksUrl: oidcPolicy.jwksUrl,
    jwksFreshUntilMs: now + 60_000,
    redirects: 0,
    duplicateClaims: false,
    audience: oidcPolicy.audience,
    subject: oidcPolicy.subject,
    owner: oidcPolicy.owner,
    ownerId: oidcPolicy.ownerId,
    team: oidcPolicy.team,
    teamId: oidcPolicy.teamId,
    project: oidcPolicy.project,
    projectId: oidcPolicy.projectId,
    userId: oidcPolicy.userId,
    environment: "development",
    issuedAtMs: now - 1_000,
    notBeforeMs: now - 1_000,
    expiresAtMs: now + 900_000,
    tokenDigest,
    jti,
    replayKeyDigest: sha(JSON.stringify([tokenDigest, jti])),
    replayLeaseId: "replay_abcdefghijkl",
    accountScopeDigest: c,
    projectScopeDigest: d,
    configurationDigest: a,
    claimSetExact: true,
    consumed: true,
    ...overrides,
  };
}
function budgetResult(
  overrides: Partial<VercelBudgetAuthorizationResult> = {},
): VercelBudgetAuthorizationResult {
  return {
    reservationId: "reserve_abcdefghijkl",
    bindingDigest: bindingHash(binding),
    budgetDigest: b,
    accountScopeDigest: c,
    projectScopeDigest: d,
    configurationDigest: a,
    reservedEur: "1.000000",
    aggregateReservedAndChargedEur: "1.100000",
    providerApiCallsMax: 32,
    providerApiWindowMs: 900_000,
    globalConcurrencyMax: 2,
    tenantConcurrencyMax: 1,
    projectConcurrencyMax: 1,
    expiresAtMs: now + 900_000,
    consumed: true,
    ...overrides,
  };
}

class FakeSandbox implements VercelSandboxSdkInstance {
  name = binding.sandboxName;
  persistent = false;
  routes: readonly unknown[] = [];
  networkPolicy: NetworkPolicy | undefined = "deny-all";
  currentSnapshotId: string | undefined;
  sourceSnapshotId: string | undefined;
  image: string | undefined = astroReference;
  timeout: number | undefined = 600_000;
  vcpus: number | undefined = 4;
  memory: number | undefined = 8192;
  tags: Readonly<Record<string, string>> | undefined = tags(binding);
  shipglowsObservedIdentity:
    | {
        accountScopeDigest: string;
        projectScopeDigest: string;
        configurationDigest: string;
        imageDigest: string;
        toolchainDigest: string;
      }
    | undefined = {
    accountScopeDigest: c,
    projectScopeDigest: d,
    configurationDigest: a,
    imageDigest: a,
    toolchainDigest: c,
  };
  shipglowsObservedLimits:
    | { diskBytes: number; processes: number; snapshotBytes: number }
    | undefined = {
    diskBytes: 21_474_836_480,
    processes: 256,
    snapshotBytes: 0,
  };
  commands: VercelSandboxSdkRunCommandInput[] = [];
  stopCalls = 0;
  deleteCalls = 0;
  async runCommand(
    input: VercelSandboxSdkRunCommandInput,
  ): Promise<{ readonly exitCode: number }> {
    this.commands.push(input);
    input.stdout.write("ok\n");
    return { exitCode: 0 };
  }
  async stop(): Promise<void> {
    this.stopCalls += 1;
  }
  async delete(): Promise<void> {
    this.deleteCalls += 1;
  }
}

const capabilities = {
  persistentFalse: true,
  zeroPorts: true,
  denyAllNetwork: true,
  immutableImageInspection: true,
  memoryInspection: true,
  hardDiskLimit: true,
  hardProcessLimit: true,
  snapshotsDisabled: true,
  boundIdentityInspection: true,
} as const;
function harness(
  options: {
    oidc?: Partial<VercelOidcVerificationResult>;
    budget?: Partial<VercelBudgetAuthorizationResult>;
    sandbox?: FakeSandbox;
    capabilities?: Partial<typeof capabilities>;
    ownershipValid?: boolean;
    rejectProviderCall?: boolean;
  } = {},
) {
  const events: string[] = [],
    creates: VercelSandboxSdkCreateInput[] = [],
    gets: string[] = [],
    calls: string[] = [];
  const sandbox = options.sandbox ?? new FakeSandbox();
  const retainedOidc = oidcResult(options.oidc);
  const retainedBudget = budgetResult(options.budget);
  const verifier: VercelTrustVerifierPort = {
    async verifyOidcAndConsume() {
      events.push("verify");
      return retainedOidc;
    },
    async verifyOwnershipAndConsume(input) {
      events.push("ownership");
      return {
        bindingDigest:
          options.ownershipValid === false ? d : bindingHash(input.binding),
        proofDigest: c,
        replayLeaseId: "cleanup_abcdefghijkl",
        consumed: true,
      };
    },
  };
  const ledger: VercelBudgetLedgerPort = {
    async reserveAndConsume() {
      events.push("reserve");
      return retainedBudget;
    },
    async consumeProviderCall(input) {
      calls.push(input.operation);
      if (options.rejectProviderCall === true) throw new Error("rejected");
    },
  };
  const port: VercelSandboxSdkPort = {
    capabilities: { ...capabilities, ...options.capabilities },
    async create(input) {
      creates.push(input);
      sandbox.image = input.image;
      sandbox.tags = input.tags;
      return sandbox;
    },
    async get(input) {
      gets.push(input.name);
      return sandbox;
    },
  };
  let loads = 0,
    currentNow = now;
  const facade = createVercelSandboxSdkFacade(enabled, {
    verifier,
    ledger,
    clock: () => currentNow,
    loadSdk: async (credentials) => {
      loads += 1;
      events.push("load");
      assert.deepEqual(credentials, {
        token,
        teamId: oidcPolicy.teamId,
        projectId: oidcPolicy.projectId,
      });
      return port;
    },
  });
  return {
    facade,
    events,
    creates,
    gets,
    calls,
    sandbox,
    retainedOidc,
    retainedBudget,
    setNow(value: number) {
      currentNow = value;
    },
    get loads() {
      return loads;
    },
  };
}
async function authorize(
  h: ReturnType<typeof harness>,
  custom: VercelCompilationBinding = binding,
) {
  return h.facade.authorize({
    oidcToken: token,
    binding: custom,
    signal: new AbortController().signal,
  });
}

describe("Vercel Sandbox SDK facade", () => {
  it("pins approved packages and rejects incomplete, mutable, or cross-origin configuration", () => {
    assert.equal(VERCEL_SANDBOX_SDK_VERSION, "3.0.0");
    assert.equal(
      VERCEL_SANDBOX_SDK_INTEGRITY,
      "sha512-1pF3id7LIG2GfjkEAZW+ZngMDdywJw7aFLOyIlry/lj8v3b4GMn3WCuBbvG4N4wTmYUfFzHaVHfdwVpqALEFkw==",
    );
    assert.equal(ASYNC_RETRY_TYPES_VERSION, "1.4.9");
    assert.equal(
      ASYNC_RETRY_TYPES_INTEGRITY,
      "sha512-s1ciZQJzRh3708X/m3vPExr5KJlzlZJvXsKpbtE2luqNcbROr64qU+3KpJsYHqWMeaxI839OvXf9PrUSw1Xtyg==",
    );
    assert.throws(() => validateVercelSandboxConfiguration({ enabled: true }));
    assert.throws(() =>
      validateVercelSandboxConfiguration({
        ...enabled,
        enabled: true,
      } as never),
    );
    assert.throws(() =>
      validateVercelSandboxConfiguration({
        enabled: true,
        accountScopeDigest: c,
        projectScopeDigest: d,
        configurationDigest: a,
        oidc: { ...oidcPolicy, jwksUrl: "https://evil.example/jwks" },
        images: {
          astro_web: {
            reference: "shipglows/astro:latest",
            imageDigest: a,
            toolchainDigest: c,
          },
          flutter_web: {
            reference: flutterReference,
            imageDigest: b,
            toolchainDigest: d,
          },
        },
      }),
    );
  });

  it("stays disabled before verifier, ledger, or SDK load", async () => {
    let effects = 0;
    const facade = createVercelSandboxSdkFacade(
      disabledVercelSandboxConfiguration(),
      {
        clock: () => now,
        loadSdk: async () => {
          effects += 1;
          throw new Error();
        },
        verifier: {
          async verifyOidcAndConsume() {
            effects += 1;
            throw new Error();
          },
          async verifyOwnershipAndConsume() {
            effects += 1;
            throw new Error();
          },
        },
        ledger: {
          async reserveAndConsume() {
            effects += 1;
            throw new Error();
          },
          async consumeProviderCall() {
            effects += 1;
          },
        },
      },
    );
    await assert.rejects(
      facade.authorize({
        oidcToken: token,
        binding,
        signal: new AbortController().signal,
      }),
      (error: unknown) =>
        error instanceof VercelSandboxSdkFacadeError &&
        error.code === "disabled",
    );
    assert.equal(effects, 0);
  });

  it("verifies and consumes exact OIDC then reserves exact budget before loading SDK", async () => {
    const h = harness();
    const session = await authorize(h);
    assert.deepEqual(h.events, ["verify", "reserve"]);
    assert.equal(h.loads, 0);
    await h.facade.create({ session, signal: new AbortController().signal });
    assert.deepEqual(h.events, ["verify", "reserve", "load"]);
    assert.deepEqual(h.calls, ["create"]);
  });

  it("detaches and freezes retained verifier, ledger, binding, and nested evidence", async () => {
    const h = harness();
    const mutableBinding = { ...binding };
    const oidcWithNested = h.retainedOidc as VercelOidcVerificationResult & {
      nested?: { values: string[] };
    };
    const budgetWithNested =
      h.retainedBudget as VercelBudgetAuthorizationResult & {
        nested?: { values: string[] };
      };
    oidcWithNested.nested = { values: ["sealed"] };
    budgetWithNested.nested = { values: ["sealed"] };
    const session = await authorize(h, mutableBinding);
    Object.assign(h.retainedOidc, { expiresAtMs: 0, projectId: "mutated" });
    Object.assign(h.retainedBudget, { expiresAtMs: 0, bindingDigest: d });
    Object.assign(mutableBinding, { imageDigest: d, configurationDigest: d });
    oidcWithNested.nested.values[0] = "mutated";
    budgetWithNested.nested.values[0] = "mutated";
    await h.facade.create({ session, signal: new AbortController().signal });
    assert.equal(h.creates.length, 1);
  });

  it("rejects every operation after OIDC or reservation expiry before ledger, SDK, or provider effect", async () => {
    const operations = [
      (
        h: ReturnType<typeof harness>,
        session: Awaited<ReturnType<typeof authorize>>,
      ) => h.facade.create({ session, signal: new AbortController().signal }),
      (
        h: ReturnType<typeof harness>,
        session: Awaited<ReturnType<typeof authorize>>,
      ) => h.facade.inspect({ session, signal: new AbortController().signal }),
      (
        h: ReturnType<typeof harness>,
        session: Awaited<ReturnType<typeof authorize>>,
      ) =>
        h.facade.execute({
          session,
          plan: "astro_web_v1",
          signal: new AbortController().signal,
        }),
      (
        h: ReturnType<typeof harness>,
        session: Awaited<ReturnType<typeof authorize>>,
      ) =>
        h.facade.cleanup({
          session,
          ownershipProof: "proof_abcdefghijkl",
          signal: new AbortController().signal,
        }),
    ];
    for (const operation of operations) {
      const oidcExpired = harness({ budget: { expiresAtMs: now + 1_800_000 } });
      const oidcSession = await authorize(oidcExpired);
      oidcExpired.setNow(now + 900_001);
      await assert.rejects(operation(oidcExpired, oidcSession));
      assert.deepEqual(oidcExpired.events, ["verify", "reserve"]);
      assert.deepEqual(oidcExpired.calls, []);
      assert.equal(oidcExpired.loads, 0);
      assert.equal(
        oidcExpired.creates.length +
          oidcExpired.gets.length +
          oidcExpired.sandbox.commands.length,
        0,
      );

      const budgetExpired = harness({ oidc: { expiresAtMs: now + 1_800_000 } });
      const budgetSession = await authorize(budgetExpired);
      budgetExpired.setNow(now + 900_001);
      await assert.rejects(operation(budgetExpired, budgetSession));
      assert.deepEqual(budgetExpired.events, ["verify", "reserve"]);
      assert.deepEqual(budgetExpired.calls, []);
      assert.equal(budgetExpired.loads, 0);
      assert.equal(
        budgetExpired.creates.length +
          budgetExpired.gets.length +
          budgetExpired.sandbox.commands.length,
        0,
      );
    }
  });

  it("consumes the provider-call ledger before SDK construction", async () => {
    const h = harness({ rejectProviderCall: true });
    const session = await authorize(h);
    await assert.rejects(
      h.facade.create({ session, signal: new AbortController().signal }),
    );
    assert.deepEqual(h.calls, ["create"]);
    assert.equal(h.loads, 0);
    assert.equal(h.creates.length, 0);
  });

  it("rejects access-token and lifecycle overrides and a second creation", async () => {
    const h = harness();
    await assert.rejects(
      h.facade.authorize({
        oidcToken: token,
        binding,
        signal: new AbortController().signal,
        accessToken: "forbidden",
      } as never),
    );
    assert.deepEqual(h.events, []);
    const session = await authorize(h);
    await h.facade.create({ session, signal: new AbortController().signal });
    await assert.rejects(
      h.facade.create({ session, signal: new AbortController().signal }),
    );
    assert.equal(h.creates.length, 1);
    await assert.rejects(
      h.facade.inspect({
        session,
        signal: new AbortController().signal,
        resume: true,
      } as never),
    );
    assert.equal(h.gets.length, 0);
  });

  it("rejects OIDC algorithm, claim, lifetime, JWKS, digest, and replay drift before ledger or SDK", async () => {
    const attacks: Partial<VercelOidcVerificationResult>[] = [
      { algorithm: "HS256" },
      { audience: "other" },
      { teamId: "other" },
      { environment: "production" },
      { expiresAtMs: now + 899_999 },
      { notBeforeMs: now + 60_001 },
      { issuedAtMs: now - 43_260_001 },
      { jwksUrl: "https://evil.example/jwks" },
      { redirects: 1 },
      { duplicateClaims: true },
      { claimSetExact: false },
      { accountScopeDigest: d },
      { projectScopeDigest: a },
      { configurationDigest: d },
      { tokenDigest: d },
      { replayKeyDigest: d },
      { consumed: false },
    ];
    for (const attack of attacks) {
      const h = harness({ oidc: attack });
      await assert.rejects(
        authorize(h),
        (error: unknown) =>
          error instanceof VercelSandboxSdkFacadeError &&
          error.code === "oidcInvalid",
      );
      assert.deepEqual(h.events, ["verify"]);
      assert.equal(h.loads, 0);
    }
    const replay = harness();
    await authorize(replay);
    await assert.rejects(
      authorize(replay),
      (error: unknown) =>
        error instanceof VercelSandboxSdkFacadeError &&
        error.code === "oidcInvalid",
    );
    assert.equal(replay.loads, 0);
  });

  it("rejects scope, quota, expiry, and cumulative EUR drift before SDK load", async () => {
    const attacks: Partial<VercelBudgetAuthorizationResult>[] = [
      { aggregateReservedAndChargedEur: "5.000001" },
      { reservedEur: "0.000000" },
      { providerApiCallsMax: 31 },
      { providerApiWindowMs: 899_999 },
      { globalConcurrencyMax: 3 },
      { tenantConcurrencyMax: 2 },
      { projectConcurrencyMax: 2 },
      { configurationDigest: d },
      { bindingDigest: d },
      { expiresAtMs: now },
    ];
    for (const attack of attacks) {
      const h = harness({ budget: attack });
      await assert.rejects(
        authorize(h),
        (error: unknown) =>
          error instanceof VercelSandboxSdkFacadeError &&
          error.code === "budgetUnavailable",
      );
      assert.deepEqual(h.events, ["verify", "reserve"]);
      assert.equal(h.loads, 0);
    }
  });

  it("refuses an SDK wrapper that cannot prove every hard resource boundary before create", async () => {
    for (const key of Object.keys(
      capabilities,
    ) as (keyof typeof capabilities)[]) {
      const h = harness({ capabilities: { [key]: false as never } });
      const session = await authorize(h);
      await assert.rejects(
        h.facade.create({ session, signal: new AbortController().signal }),
        (error: unknown) =>
          error instanceof VercelSandboxSdkFacadeError &&
          error.code === "providerUnavailable",
      );
      assert.equal(h.creates.length, 0);
    }
  });

  it("creates exact ephemeral resources and rejects every observed resource or image drift", async () => {
    const h = harness();
    const session = await authorize(h);
    await h.facade.create({ session, signal: new AbortController().signal });
    assert.deepEqual(h.creates[0], {
      name: binding.sandboxName,
      image: astroReference,
      timeout: 600_000,
      resources: { vcpus: 4 },
      ports: [],
      networkPolicy: "deny-all",
      env: { LANG: "C.UTF-8", LC_ALL: "C.UTF-8", TZ: "UTC" },
      tags: tags(binding),
      persistent: false,
      shipglowsLimits: {
        memoryBytes: 8_589_934_592,
        diskBytes: 21_474_836_480,
        processes: 256,
        snapshotBytes: 0,
      },
      signal: h.creates[0]?.signal,
    });
    const drifts: ((s: FakeSandbox) => void)[] = [
      (s) => {
        s.persistent = undefined as never;
      },
      (s) => {
        s.routes = [{}];
      },
      (s) => {
        s.networkPolicy = "allow-all";
      },
      (s) => {
        s.currentSnapshotId = "snapshot";
      },
      (s) => {
        s.image = flutterReference;
      },
      (s) => {
        s.memory = 4096;
      },
      (s) => {
        s.shipglowsObservedLimits = undefined;
      },
    ];
    for (const mutate of drifts) {
      const sandbox = new FakeSandbox();
      mutate(sandbox);
      const drift = harness({ sandbox });
      const authorized = await authorize(drift);
      await assert.rejects(
        drift.facade.inspect({
          session: authorized,
          signal: new AbortController().signal,
        }),
        (error: unknown) =>
          error instanceof VercelSandboxSdkFacadeError &&
          (error.code === "policyMismatch" ||
            error.code === "cleanupUncertain"),
      );
      assert.equal(sandbox.commands.length, 0);
    }
  });

  it("binds plan to target and runs only fixed argv after strict identity inspection", async () => {
    const h = harness();
    const session = await authorize(h);
    await assert.rejects(
      h.facade.execute({
        session,
        plan: "flutter_web_v1",
        signal: new AbortController().signal,
      }),
    );
    assert.equal(h.gets.length, 0);
    await h.facade.execute({
      session,
      plan: "astro_web_v1",
      signal: new AbortController().signal,
    });
    assert.deepEqual(
      h.sandbox.commands.map(({ cmd, args }) => [cmd, args]),
      [
        [
          "pnpm",
          ["install", "--offline", "--frozen-lockfile", "--ignore-scripts"],
        ],
        ["pnpm", ["exec", "astro", "check"]],
        ["pnpm", ["exec", "astro", "build"]],
      ],
    );
    assert.deepEqual(h.calls, ["inspect", "execute", "execute", "execute"]);
  });

  it("rejects immutable image, toolchain, configuration, and scope binding drift before verifier", async () => {
    for (const change of [
      { imageReference: flutterReference },
      { imageDigest: b },
      { toolchainDigest: d },
      { configurationDigest: d },
      { accountScopeDigest: a },
      { projectScopeDigest: a },
    ]) {
      const h = harness();
      await assert.rejects(authorize(h, { ...binding, ...change }));
      assert.deepEqual(h.events, []);
      assert.equal(h.loads, 0);
    }
  });

  it("cleans an exactly owned sandbox despite policy drift, but never an unproved identity", async () => {
    const drift = new FakeSandbox();
    drift.persistent = true;
    drift.networkPolicy = "allow-all";
    drift.routes = [{}];
    drift.currentSnapshotId = "bad";
    drift.shipglowsObservedLimits = undefined;
    const h = harness({ sandbox: drift });
    const session = await authorize(h);
    await h.facade.cleanup({
      session,
      ownershipProof: "proof_abcdefghijkl",
      signal: new AbortController().signal,
    });
    assert.equal(drift.stopCalls, 1);
    assert.equal(drift.deleteCalls, 1);
    assert.deepEqual(h.calls, ["inspect", "stop", "delete"]);
    const noProof = harness({ ownershipValid: false });
    const noProofSession = await authorize(noProof);
    await assert.rejects(
      noProof.facade.cleanup({
        session: noProofSession,
        ownershipProof: "proof_abcdefghijkl",
        signal: new AbortController().signal,
      }),
      (error: unknown) =>
        error instanceof VercelSandboxSdkFacadeError &&
        error.code === "cleanupUncertain",
    );
    assert.equal(noProof.loads, 0);
    const wrong = new FakeSandbox();
    wrong.tags = { shipglows: "other" };
    const wrongIdentity = harness({ sandbox: wrong });
    const wrongSession = await authorize(wrongIdentity);
    await assert.rejects(
      wrongIdentity.facade.cleanup({
        session: wrongSession,
        ownershipProof: "proof_abcdefghijkl",
        signal: new AbortController().signal,
      }),
    );
    assert.equal(wrong.stopCalls, 0);
    assert.equal(wrong.deleteCalls, 0);
  });

  it("redacts verifier, ledger, provider, and cleanup failures", async () => {
    const verifier = createVercelSandboxSdkFacade(enabled, {
      clock: () => now,
      loadSdk: async () => {
        throw new Error("token=secret");
      },
      verifier: {
        async verifyOidcAndConsume() {
          throw new Error("token=secret");
        },
        async verifyOwnershipAndConsume() {
          throw new Error("token=secret");
        },
      },
      ledger: {
        async reserveAndConsume() {
          throw new Error("token=secret");
        },
        async consumeProviderCall() {
          throw new Error("token=secret");
        },
      },
    });
    await assert.rejects(
      verifier.authorize({
        oidcToken: token,
        binding,
        signal: new AbortController().signal,
      }),
      (error: unknown) =>
        error instanceof VercelSandboxSdkFacadeError &&
        !error.message.includes("secret") &&
        !error.message.includes(token),
    );
  });
});
