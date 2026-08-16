import { createHash } from "node:crypto";
import { Writable } from "node:stream";

import type { NetworkPolicy } from "@vercel/sandbox";

import type { CompilationPlanNameV1 } from "../compilation/contracts.js";
import {
  type ValidatedVercelSandboxConfiguration,
  type VercelCompilationImageIdentity,
  type VercelCompilationTarget,
  type VercelOidcPolicy,
} from "./vercelSandboxConfiguration.js";

export interface VercelSdkCapabilityReport {
  readonly persistentFalse: boolean;
  readonly zeroPorts: boolean;
  readonly denyAllNetwork: boolean;
  readonly immutableImageInspection: boolean;
  readonly memoryInspection: boolean;
  readonly hardDiskLimit: boolean;
  readonly hardProcessLimit: boolean;
  readonly snapshotsDisabled: boolean;
  readonly boundIdentityInspection: boolean;
}

export interface VercelSandboxSdkCreateInput {
  readonly name: string;
  readonly image: string;
  readonly timeout: 600_000;
  readonly resources: { readonly vcpus: 4 };
  readonly ports: [];
  readonly networkPolicy: "deny-all";
  readonly env: Record<string, string>;
  readonly tags: Record<string, string>;
  readonly persistent: false;
  readonly shipglowsLimits: {
    readonly memoryBytes: 8_589_934_592;
    readonly diskBytes: 21_474_836_480;
    readonly processes: 256;
    readonly snapshotBytes: 0;
  };
  readonly signal: AbortSignal;
}

export interface VercelSandboxSdkRunCommandInput {
  readonly cmd: string;
  readonly args: string[];
  readonly cwd: "/vercel/sandbox/project";
  readonly env: Record<string, string>;
  readonly sudo: false;
  readonly detached: false;
  readonly stdout: Writable;
  readonly stderr: Writable;
  readonly signal: AbortSignal;
  readonly timeoutMs: number;
}

export interface VercelSandboxSdkCommandResult {
  readonly exitCode: number;
  readonly durationMs?: number;
}

export interface VercelSandboxSdkInstance {
  readonly name: string;
  readonly persistent: boolean;
  readonly routes: readonly unknown[];
  readonly networkPolicy: NetworkPolicy | undefined;
  readonly currentSnapshotId: string | undefined;
  readonly sourceSnapshotId: string | undefined;
  readonly image: string | undefined;
  readonly timeout: number | undefined;
  readonly vcpus: number | undefined;
  readonly memory: number | undefined;
  readonly tags: Readonly<Record<string, string>> | undefined;
  readonly shipglowsObservedIdentity:
    | {
        readonly accountScopeDigest: string;
        readonly projectScopeDigest: string;
        readonly configurationDigest: string;
        readonly imageDigest: string;
        readonly toolchainDigest: string;
      }
    | undefined;
  readonly shipglowsObservedLimits:
    | {
        readonly diskBytes: number;
        readonly processes: number;
        readonly snapshotBytes: number;
      }
    | undefined;
  runCommand(
    input: VercelSandboxSdkRunCommandInput,
  ): Promise<VercelSandboxSdkCommandResult>;
  stop(options: { readonly signal: AbortSignal }): Promise<unknown>;
  delete(options: { readonly signal: AbortSignal }): Promise<void>;
}

export interface VercelSandboxSdkPort {
  readonly capabilities: VercelSdkCapabilityReport;
  create(input: VercelSandboxSdkCreateInput): Promise<VercelSandboxSdkInstance>;
  get(input: {
    readonly name: string;
    readonly resume: false;
    readonly signal: AbortSignal;
  }): Promise<VercelSandboxSdkInstance>;
}

export interface VercelCompilationBinding {
  readonly sandboxName: string;
  readonly jobId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly target: VercelCompilationTarget;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  readonly configurationDigest: string;
  readonly imageReference: string;
  readonly imageDigest: string;
  readonly toolchainDigest: string;
  readonly budgetDigest: string;
}

export interface VercelOidcVerificationResult {
  readonly signatureVerified: boolean;
  readonly algorithm: string;
  readonly keyId: string;
  readonly issuer: string;
  readonly jwksUrl: string;
  readonly jwksFreshUntilMs: number;
  readonly redirects: number;
  readonly duplicateClaims: boolean;
  readonly audience: string;
  readonly subject: string;
  readonly owner: string;
  readonly ownerId: string;
  readonly team: string;
  readonly teamId: string;
  readonly project: string;
  readonly projectId: string;
  readonly userId: string;
  readonly environment: string;
  readonly issuedAtMs: number;
  readonly notBeforeMs: number;
  readonly expiresAtMs: number;
  readonly tokenDigest: string;
  readonly jti: string | null;
  readonly replayKeyDigest: string;
  readonly replayLeaseId: string;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  readonly configurationDigest: string;
  readonly claimSetExact: boolean;
  readonly consumed: boolean;
}

export interface VercelTrustVerifierPort {
  verifyOidcAndConsume(input: {
    readonly oidcToken: string;
    readonly policy: Readonly<VercelOidcPolicy>;
    readonly nowMs: number;
    readonly signal: AbortSignal;
  }): Promise<VercelOidcVerificationResult>;
  verifyOwnershipAndConsume(input: {
    readonly proof: string;
    readonly binding: VercelCompilationBinding;
    readonly nowMs: number;
    readonly signal: AbortSignal;
  }): Promise<{
    readonly bindingDigest: string;
    readonly proofDigest: string;
    readonly replayLeaseId: string;
    readonly consumed: boolean;
  }>;
}

export interface VercelBudgetAuthorizationResult {
  readonly reservationId: string;
  readonly bindingDigest: string;
  readonly budgetDigest: string;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  readonly configurationDigest: string;
  readonly reservedEur: string;
  readonly aggregateReservedAndChargedEur: string;
  readonly providerApiCallsMax: number;
  readonly providerApiWindowMs: number;
  readonly globalConcurrencyMax: number;
  readonly tenantConcurrencyMax: number;
  readonly projectConcurrencyMax: number;
  readonly expiresAtMs: number;
  readonly consumed: boolean;
}

export type VercelProviderOperation =
  "create" | "inspect" | "execute" | "stop" | "delete";
export interface VercelBudgetLedgerPort {
  reserveAndConsume(input: {
    readonly binding: VercelCompilationBinding;
    readonly ceilingEur: "5.000000";
    readonly nowMs: number;
    readonly signal: AbortSignal;
  }): Promise<VercelBudgetAuthorizationResult>;
  consumeProviderCall(input: {
    readonly reservationId: string;
    readonly operation: VercelProviderOperation;
    readonly maxCalls: 32;
    readonly windowMs: 900_000;
    readonly nowMs: number;
    readonly signal: AbortSignal;
  }): Promise<void>;
}

const SESSION = Symbol("vercel-authorized-session");
export interface VercelAuthorizedSession {
  readonly [SESSION]: true;
}
interface SessionState {
  readonly token: string;
  readonly binding: VercelCompilationBinding;
  readonly reservation: VercelBudgetAuthorizationResult;
  readonly oidc: VercelOidcVerificationResult;
  sdk: Promise<VercelSandboxSdkPort> | undefined;
  createAttempted: boolean;
}

export interface VercelSandboxSdkFacade {
  authorize(input: {
    readonly oidcToken: string;
    readonly binding: VercelCompilationBinding;
    readonly signal: AbortSignal;
  }): Promise<VercelAuthorizedSession>;
  create(input: {
    readonly session: VercelAuthorizedSession;
    readonly signal: AbortSignal;
  }): Promise<void>;
  inspect(input: {
    readonly session: VercelAuthorizedSession;
    readonly signal: AbortSignal;
  }): Promise<void>;
  execute(input: {
    readonly session: VercelAuthorizedSession;
    readonly plan: CompilationPlanNameV1;
    readonly signal: AbortSignal;
  }): Promise<VercelCompilationExecutionResult>;
  cleanup(input: {
    readonly session: VercelAuthorizedSession;
    readonly ownershipProof: string;
    readonly signal: AbortSignal;
  }): Promise<void>;
}

export interface VercelCompilationExecutionResult {
  readonly exitCodes: readonly number[];
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
}
export type VercelSandboxSdkLoader = (credentials: {
  readonly token: string;
  readonly teamId: string;
  readonly projectId: string;
}) => Promise<VercelSandboxSdkPort>;

export class VercelSandboxSdkFacadeError extends Error {
  constructor(
    readonly code:
      | "disabled"
      | "invalid"
      | "oidcInvalid"
      | "budgetUnavailable"
      | "budgetExceeded"
      | "providerUnavailable"
      | "policyMismatch"
      | "executionFailed"
      | "logLimitExceeded"
      | "executionTimedOut"
      | "cleanupUncertain",
  ) {
    super("Vercel Sandbox compilation is unavailable.");
    this.name = "VercelSandboxSdkFacadeError";
  }
}

const DIGEST = /^[a-f0-9]{64}$/;
const OPAQUE = /^[a-zA-Z0-9_-]{16,128}$/;
const NAME = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const MONEY = /^(?:0|[1-4])\.\d{6}$|^5\.000000$/;
const ENV = Object.freeze({ LANG: "C.UTF-8", LC_ALL: "C.UTF-8", TZ: "UTC" });
const WORKDIR = "/vercel/sandbox/project" as const;
const CAPABILITY_KEYS = [
  "persistentFalse",
  "zeroPorts",
  "denyAllNetwork",
  "immutableImageInspection",
  "memoryInspection",
  "hardDiskLimit",
  "hardProcessLimit",
  "snapshotsDisabled",
  "boundIdentityInspection",
] as const;
const PLANS: Readonly<
  Record<
    CompilationPlanNameV1,
    readonly { readonly cmd: string; readonly args: readonly string[] }[]
  >
> = Object.freeze({
  astro_web_v1: Object.freeze([
    Object.freeze({
      cmd: "pnpm",
      args: Object.freeze([
        "install",
        "--offline",
        "--frozen-lockfile",
        "--ignore-scripts",
      ]),
    }),
    Object.freeze({
      cmd: "pnpm",
      args: Object.freeze(["exec", "astro", "check"]),
    }),
    Object.freeze({
      cmd: "pnpm",
      args: Object.freeze(["exec", "astro", "build"]),
    }),
  ]),
  flutter_web_v1: Object.freeze([
    Object.freeze({
      cmd: "flutter",
      args: Object.freeze(["pub", "get", "--offline", "--enforce-lockfile"]),
    }),
    Object.freeze({
      cmd: "flutter",
      args: Object.freeze(["build", "web", "--release", "--no-pub"]),
    }),
  ]),
});

export function createVercelSandboxSdkFacade(
  configuration: ValidatedVercelSandboxConfiguration,
  dependencies: {
    readonly loadSdk: VercelSandboxSdkLoader;
    readonly verifier: VercelTrustVerifierPort;
    readonly ledger: VercelBudgetLedgerPort;
    readonly clock?: () => number;
  },
): VercelSandboxSdkFacade {
  const sessions = new WeakMap<object, SessionState>();
  const usedReplayLeases = new Set<string>(),
    usedReplayKeys = new Set<string>();
  const clock = dependencies.clock ?? Date.now;
  const state = (session: VercelAuthorizedSession): SessionState => {
    const value = sessions.get(session);
    if (value === undefined) throw new VercelSandboxSdkFacadeError("invalid");
    return value;
  };
  const sdk = async (value: SessionState): Promise<VercelSandboxSdkPort> => {
    value.sdk ??= Promise.resolve()
      .then(() =>
        dependencies.loadSdk({
          token: value.token,
          teamId: value.oidc.teamId,
          projectId: value.oidc.projectId,
        }),
      )
      .then((port) => {
        assertCapabilities(port.capabilities);
        return port;
      })
      .catch((error: unknown) => {
        value.sdk = undefined;
        if (error instanceof VercelSandboxSdkFacadeError) throw error;
        throw new VercelSandboxSdkFacadeError("providerUnavailable");
      });
    return value.sdk;
  };
  const consume = async (
    value: SessionState,
    operation: VercelProviderOperation,
    signal: AbortSignal,
  ): Promise<void> => {
    validSignal(signal);
    const nowMs = validNow(clock());
    assertSessionAuthority(value, configuration, nowMs);
    try {
      await dependencies.ledger.consumeProviderCall({
        reservationId: value.reservation.reservationId,
        operation,
        maxCalls: 32,
        windowMs: 900_000,
        nowMs,
        signal,
      });
    } catch {
      throw new VercelSandboxSdkFacadeError("budgetExceeded");
    }
  };
  const getStrict = async (
    value: SessionState,
    signal: AbortSignal,
  ): Promise<VercelSandboxSdkInstance> => {
    await consume(value, "inspect", signal);
    const port = await sdk(value);
    try {
      const instance = await port.get({
        name: value.binding.sandboxName,
        resume: false,
        signal,
      });
      assertStrictInstance(instance, value);
      return instance;
    } catch (error) {
      if (error instanceof VercelSandboxSdkFacadeError) throw error;
      throw new VercelSandboxSdkFacadeError("providerUnavailable");
    }
  };
  const facade: VercelSandboxSdkFacade = {
    async authorize(input): Promise<VercelAuthorizedSession> {
      exactInput(input, ["oidcToken", "binding", "signal"]);
      assertEnabled(configuration);
      validSignal(input.signal);
      validateBinding(input.binding, configuration);
      if (
        typeof input.oidcToken !== "string" ||
        input.oidcToken.length < 32 ||
        input.oidcToken.length > 16_384
      )
        throw new VercelSandboxSdkFacadeError("oidcInvalid");
      const nowMs = validNow(clock());
      let oidc: VercelOidcVerificationResult;
      try {
        oidc = await dependencies.verifier.verifyOidcAndConsume({
          oidcToken: input.oidcToken,
          policy: configuration.oidc,
          nowMs,
          signal: input.signal,
        });
        assertOidc(
          oidc,
          input.oidcToken,
          input.binding,
          configuration.oidc,
          nowMs,
          usedReplayLeases,
          usedReplayKeys,
        );
      } catch {
        throw new VercelSandboxSdkFacadeError("oidcInvalid");
      }
      let reservation: VercelBudgetAuthorizationResult;
      try {
        reservation = await dependencies.ledger.reserveAndConsume({
          binding: input.binding,
          ceilingEur: "5.000000",
          nowMs,
          signal: input.signal,
        });
        assertBudget(reservation, input.binding, nowMs);
      } catch {
        throw new VercelSandboxSdkFacadeError("budgetUnavailable");
      }
      const session = Object.freeze({ [SESSION]: true as const });
      sessions.set(session, {
        token: input.oidcToken,
        binding: deepCloneFreeze(input.binding),
        reservation: deepCloneFreeze(reservation),
        oidc: deepCloneFreeze(oidc),
        sdk: undefined,
        createAttempted: false,
      });
      return session;
    },
    async create(input): Promise<void> {
      exactInput(input, ["session", "signal"]);
      const value = state(input.session);
      validSignal(input.signal);
      assertSessionAuthority(value, configuration, validNow(clock()));
      if (value.createAttempted)
        throw new VercelSandboxSdkFacadeError("invalid");
      await consume(value, "create", input.signal);
      const port = await sdk(value);
      value.createAttempted = true;
      const identity = imageFor(value, configuration);
      const tags = identityTags(value.binding);
      try {
        const instance = await port.create({
          name: value.binding.sandboxName,
          image: identity.reference,
          timeout: 600_000,
          resources: { vcpus: 4 },
          ports: [],
          networkPolicy: "deny-all",
          env: { ...ENV },
          tags,
          persistent: false,
          shipglowsLimits: {
            memoryBytes: 8_589_934_592,
            diskBytes: 21_474_836_480,
            processes: 256,
            snapshotBytes: 0,
          },
          signal: input.signal,
        });
        assertStrictInstance(instance, value);
      } catch (error) {
        if (error instanceof VercelSandboxSdkFacadeError) throw error;
        throw new VercelSandboxSdkFacadeError("providerUnavailable");
      }
    },
    async inspect(input): Promise<void> {
      exactInput(input, ["session", "signal"]);
      await getStrict(state(input.session), input.signal);
    },
    async execute(input): Promise<VercelCompilationExecutionResult> {
      exactInput(input, ["session", "plan", "signal"]);
      const value = state(input.session);
      assertSessionAuthority(value, configuration, validNow(clock()));
      const requested: unknown = input.plan;
      if (
        (requested !== "astro_web_v1" && requested !== "flutter_web_v1") ||
        (requested === "astro_web_v1") !==
          (value.binding.target === "astro_web")
      )
        throw new VercelSandboxSdkFacadeError("invalid");
      const instance = await getStrict(value, input.signal);
      const started = validNow(clock()),
        stdout = new BoundedSink(1_048_576),
        stderr = new BoundedSink(1_048_576),
        exitCodes: number[] = [];
      for (const command of PLANS[requested]) {
        const elapsed = validNow(clock()) - started,
          remaining = 600_000 - elapsed;
        if (elapsed < 0 || remaining <= 0)
          throw new VercelSandboxSdkFacadeError("executionTimedOut");
        await consume(value, "execute", input.signal);
        try {
          const result = await instance.runCommand({
            cmd: command.cmd,
            args: [...command.args],
            cwd: WORKDIR,
            env: { ...ENV },
            sudo: false,
            detached: false,
            stdout,
            stderr,
            signal: input.signal,
            timeoutMs: remaining,
          });
          exitCodes.push(result.exitCode);
          if (result.exitCode !== 0)
            throw new VercelSandboxSdkFacadeError("executionFailed");
        } catch (error) {
          if (stdout.exceeded || stderr.exceeded)
            throw new VercelSandboxSdkFacadeError("logLimitExceeded");
          if (error instanceof VercelSandboxSdkFacadeError) throw error;
          throw new VercelSandboxSdkFacadeError(
            input.signal.aborted ? "executionTimedOut" : "executionFailed",
          );
        }
      }
      return Object.freeze({
        exitCodes: Object.freeze(exitCodes),
        stdout: stdout.bytes(),
        stderr: stderr.bytes(),
      });
    },
    async cleanup(input): Promise<void> {
      exactInput(input, ["session", "ownershipProof", "signal"]);
      const value = state(input.session);
      validSignal(input.signal);
      const nowMs = validNow(clock());
      assertSessionAuthority(value, configuration, nowMs);
      try {
        const proof = await dependencies.verifier.verifyOwnershipAndConsume({
          proof: input.ownershipProof,
          binding: value.binding,
          nowMs,
          signal: input.signal,
        });
        if (
          !DIGEST.test(proof.bindingDigest) ||
          proof.bindingDigest !== bindingDigest(value.binding) ||
          !DIGEST.test(proof.proofDigest) ||
          !OPAQUE.test(proof.replayLeaseId) ||
          !proof.consumed ||
          usedReplayLeases.has(proof.replayLeaseId)
        )
          throw new Error("invalid");
        usedReplayLeases.add(proof.replayLeaseId);
      } catch {
        throw new VercelSandboxSdkFacadeError("cleanupUncertain");
      }
      let instance: VercelSandboxSdkInstance;
      try {
        await consume(value, "inspect", input.signal);
        const port = await sdk(value);
        instance = await port.get({
          name: value.binding.sandboxName,
          resume: false,
          signal: input.signal,
        });
        assertOwnedIdentity(instance, value);
      } catch {
        throw new VercelSandboxSdkFacadeError("cleanupUncertain");
      }
      try {
        await consume(value, "stop", input.signal);
        await instance.stop({ signal: input.signal });
        await consume(value, "delete", input.signal);
        await instance.delete({ signal: input.signal });
      } catch {
        throw new VercelSandboxSdkFacadeError("cleanupUncertain");
      }
    },
  };
  return Object.freeze(facade);
}

function assertEnabled(
  value: ValidatedVercelSandboxConfiguration,
): asserts value is ValidatedVercelSandboxConfiguration & {
  readonly enabled: true;
  readonly oidc: Readonly<VercelOidcPolicy>;
  readonly images: Readonly<
    Record<VercelCompilationTarget, Readonly<VercelCompilationImageIdentity>>
  >;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  readonly configurationDigest: string;
} {
  if (
    !value.enabled ||
    value.oidc === null ||
    value.images === null ||
    value.accountScopeDigest === null ||
    value.projectScopeDigest === null ||
    value.configurationDigest === null
  )
    throw new VercelSandboxSdkFacadeError("disabled");
}
function validNow(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new VercelSandboxSdkFacadeError("invalid");
  return value;
}
function validSignal(signal: AbortSignal): void {
  if (signal.aborted) throw new VercelSandboxSdkFacadeError("invalid");
}
function exactInput(value: object, keys: readonly string[]): void {
  const actual = Object.keys(value);
  if (
    actual.length !== keys.length ||
    keys.some((key) => !Object.hasOwn(value, key))
  ) {
    throw new VercelSandboxSdkFacadeError("invalid");
  }
}
function validateBinding(
  binding: VercelCompilationBinding,
  configuration: ValidatedVercelSandboxConfiguration,
): void {
  assertEnabled(configuration);
  const keys = [
    "sandboxName",
    "jobId",
    "tenantId",
    "projectId",
    "target",
    "accountScopeDigest",
    "projectScopeDigest",
    "configurationDigest",
    "imageReference",
    "imageDigest",
    "toolchainDigest",
    "budgetDigest",
  ];
  if (
    Object.keys(binding).length !== keys.length ||
    keys.some((key) => !Object.hasOwn(binding, key)) ||
    !NAME.test(binding.sandboxName) ||
    ![binding.jobId, binding.tenantId, binding.projectId].every((id) =>
      OPAQUE.test(id),
    ) ||
    !DIGEST.test(binding.budgetDigest) ||
    binding.accountScopeDigest !== configuration.accountScopeDigest ||
    binding.projectScopeDigest !== configuration.projectScopeDigest ||
    binding.configurationDigest !== configuration.configurationDigest
  ) {
    throw new VercelSandboxSdkFacadeError("invalid");
  }
  const target: unknown = binding.target;
  if (target !== "astro_web" && target !== "flutter_web")
    throw new VercelSandboxSdkFacadeError("invalid");
  const image = configuration.images[target];
  if (
    binding.imageReference !== image.reference ||
    binding.imageDigest !== image.imageDigest ||
    binding.toolchainDigest !== image.toolchainDigest
  )
    throw new VercelSandboxSdkFacadeError("invalid");
}
function assertSessionAuthority(
  value: SessionState,
  configuration: ValidatedVercelSandboxConfiguration,
  now: number,
): void {
  validateBinding(value.binding, configuration);
  assertEnabled(configuration);
  const oidc = value.oidc;
  if (
    now > oidc.expiresAtMs ||
    oidc.tokenDigest !== sha256(value.token) ||
    oidc.issuer !== configuration.oidc.issuer ||
    oidc.audience !== configuration.oidc.audience ||
    oidc.subject !== configuration.oidc.subject ||
    oidc.owner !== configuration.oidc.owner ||
    oidc.ownerId !== configuration.oidc.ownerId ||
    oidc.team !== configuration.oidc.team ||
    oidc.teamId !== configuration.oidc.teamId ||
    oidc.project !== configuration.oidc.project ||
    oidc.projectId !== configuration.oidc.projectId ||
    oidc.userId !== configuration.oidc.userId ||
    oidc.environment !== "development" ||
    oidc.accountScopeDigest !== value.binding.accountScopeDigest ||
    oidc.projectScopeDigest !== value.binding.projectScopeDigest ||
    oidc.configurationDigest !== value.binding.configurationDigest
  )
    throw new VercelSandboxSdkFacadeError("oidcInvalid");
  const reservation = value.reservation;
  if (
    now > reservation.expiresAtMs ||
    reservation.bindingDigest !== bindingDigest(value.binding) ||
    reservation.budgetDigest !== value.binding.budgetDigest ||
    reservation.accountScopeDigest !== value.binding.accountScopeDigest ||
    reservation.projectScopeDigest !== value.binding.projectScopeDigest ||
    reservation.configurationDigest !== value.binding.configurationDigest
  )
    throw new VercelSandboxSdkFacadeError("budgetUnavailable");
}
function deepCloneFreeze<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
function assertOidc(
  value: VercelOidcVerificationResult,
  token: string,
  binding: VercelCompilationBinding,
  policy: Readonly<VercelOidcPolicy>,
  now: number,
  usedLeases: Set<string>,
  usedKeys: Set<string>,
): void {
  const tokenDigest = sha256(token),
    replayKey = sha256(JSON.stringify([tokenDigest, value.jti]));
  if (
    !value.signatureVerified ||
    value.algorithm !== "RS256" ||
    !OPAQUE.test(value.keyId) ||
    value.issuer !== policy.issuer ||
    value.jwksUrl !== policy.jwksUrl ||
    value.jwksFreshUntilMs < now ||
    value.redirects !== 0 ||
    value.duplicateClaims ||
    !value.claimSetExact ||
    value.audience !== policy.audience ||
    value.subject !== policy.subject ||
    value.owner !== policy.owner ||
    value.ownerId !== policy.ownerId ||
    value.team !== policy.team ||
    value.teamId !== policy.teamId ||
    value.project !== policy.project ||
    value.projectId !== policy.projectId ||
    value.userId !== policy.userId ||
    value.environment !== "development" ||
    value.accountScopeDigest !== binding.accountScopeDigest ||
    value.projectScopeDigest !== binding.projectScopeDigest ||
    value.configurationDigest !== binding.configurationDigest ||
    !Number.isSafeInteger(value.issuedAtMs) ||
    !Number.isSafeInteger(value.notBeforeMs) ||
    !Number.isSafeInteger(value.expiresAtMs) ||
    value.notBeforeMs > now + 60_000 ||
    value.issuedAtMs > now + 60_000 ||
    value.issuedAtMs < now - 43_200_000 - 60_000 ||
    value.expiresAtMs - value.issuedAtMs > 43_200_000 + 60_000 ||
    value.expiresAtMs < now + 900_000 ||
    value.tokenDigest !== tokenDigest ||
    value.replayKeyDigest !== replayKey ||
    (value.jti !== null && !OPAQUE.test(value.jti)) ||
    !OPAQUE.test(value.replayLeaseId) ||
    !value.consumed ||
    usedLeases.has(value.replayLeaseId) ||
    usedKeys.has(value.replayKeyDigest)
  )
    throw new Error("invalid");
  usedLeases.add(value.replayLeaseId);
  usedKeys.add(value.replayKeyDigest);
}
function assertBudget(
  value: VercelBudgetAuthorizationResult,
  binding: VercelCompilationBinding,
  now: number,
): void {
  if (
    !OPAQUE.test(value.reservationId) ||
    value.bindingDigest !== bindingDigest(binding) ||
    value.budgetDigest !== binding.budgetDigest ||
    value.accountScopeDigest !== binding.accountScopeDigest ||
    value.projectScopeDigest !== binding.projectScopeDigest ||
    value.configurationDigest !== binding.configurationDigest ||
    !MONEY.test(value.reservedEur) ||
    !MONEY.test(value.aggregateReservedAndChargedEur) ||
    Number(value.reservedEur) <= 0 ||
    Number(value.aggregateReservedAndChargedEur) > 5 ||
    value.providerApiCallsMax !== 32 ||
    value.providerApiWindowMs !== 900_000 ||
    value.globalConcurrencyMax !== 2 ||
    value.tenantConcurrencyMax !== 1 ||
    value.projectConcurrencyMax !== 1 ||
    !Number.isSafeInteger(value.expiresAtMs) ||
    value.expiresAtMs <= now ||
    !value.consumed
  )
    throw new Error("invalid");
}
function assertCapabilities(value: VercelSdkCapabilityReport): void {
  if (
    Object.keys(value).length !== CAPABILITY_KEYS.length ||
    CAPABILITY_KEYS.some((key) => !value[key])
  )
    throw new VercelSandboxSdkFacadeError("providerUnavailable");
}
function imageFor(
  value: SessionState,
  configuration: ValidatedVercelSandboxConfiguration,
): Readonly<VercelCompilationImageIdentity> {
  assertEnabled(configuration);
  return configuration.images[value.binding.target];
}
function identityTags(
  binding: VercelCompilationBinding,
): Record<string, string> {
  return {
    shipglows: "compilation",
    job: sha256(binding.jobId).slice(0, 32),
    tenant: sha256(binding.tenantId).slice(0, 32),
    project: sha256(binding.projectId).slice(0, 32),
    config: binding.configurationDigest.slice(0, 32),
  };
}
function assertOwnedIdentity(
  instance: VercelSandboxSdkInstance,
  value: SessionState,
): void {
  if (
    instance.name !== value.binding.sandboxName ||
    instance.image !== value.binding.imageReference ||
    !sameTags(instance.tags, identityTags(value.binding))
  )
    throw new VercelSandboxSdkFacadeError("cleanupUncertain");
}
function assertStrictInstance(
  instance: VercelSandboxSdkInstance,
  value: SessionState,
): void {
  assertOwnedIdentity(instance, value);
  const observed = instance.shipglowsObservedLimits,
    identity = instance.shipglowsObservedIdentity,
    persistent: unknown = instance.persistent;
  if (
    persistent !== false ||
    instance.routes.length !== 0 ||
    instance.networkPolicy !== "deny-all" ||
    instance.currentSnapshotId !== undefined ||
    instance.sourceSnapshotId !== undefined ||
    instance.timeout !== 600_000 ||
    instance.vcpus !== 4 ||
    instance.memory !== 8192 ||
    observed?.diskBytes !== 21_474_836_480 ||
    observed.processes !== 256 ||
    observed.snapshotBytes !== 0 ||
    identity?.accountScopeDigest !== value.binding.accountScopeDigest ||
    identity.projectScopeDigest !== value.binding.projectScopeDigest ||
    identity.configurationDigest !== value.binding.configurationDigest ||
    identity.imageDigest !== value.binding.imageDigest ||
    identity.toolchainDigest !== value.binding.toolchainDigest
  )
    throw new VercelSandboxSdkFacadeError("policyMismatch");
}
function sameTags(
  actual: Readonly<Record<string, string>> | undefined,
  expected: Readonly<Record<string, string>>,
): boolean {
  const keys = Object.keys(expected);
  return (
    actual !== undefined &&
    Object.keys(actual).length === keys.length &&
    keys.every((key) => actual[key] === expected[key])
  );
}
function bindingDigest(value: VercelCompilationBinding): string {
  return sha256(
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
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
class BoundedSink extends Writable {
  #chunks: Buffer[] = [];
  #length = 0;
  exceeded = false;
  constructor(private readonly limit: number) {
    super();
  }
  override _write(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    const bytes = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(String(chunk), encoding);
    if (this.#length + bytes.length > this.limit) {
      this.exceeded = true;
      callback(new Error("bounded-output"));
      return;
    }
    this.#chunks.push(Buffer.from(bytes));
    this.#length += bytes.length;
    callback();
  }
  bytes(): Uint8Array {
    return Uint8Array.from(Buffer.concat(this.#chunks, this.#length));
  }
}
