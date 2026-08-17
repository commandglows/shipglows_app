/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-optional-chain */
import { canonicalJsonDigest } from "./canonicalManifest.js";
import {
  CompilationCoordinator,
  type CompilationCoordinatorRequestV1,
  type CompilationCoordinatorResultV1,
} from "./coordinator.js";
import type { CompilationPlanNameV1, CompilationTargetV1 } from "./contracts.js";
import type { CompilationCoordinatorPorts } from "./ports.js";
import {
  createVercelSandboxSdkFacade,
  type VercelBudgetLedgerPort,
  type VercelSandboxSdkFacade,
  type VercelSandboxSdkLoader,
  type VercelTrustVerifierPort,
} from "../providers/vercelSandboxSdkFacade.js";
import {
  validateVercelSandboxConfiguration,
  type VercelSandboxConfiguration,
} from "../providers/vercelSandboxConfiguration.js";

export type LinuxCompilationIntegrationReason =
  | "disabled"
  | "workerUnproved"
  | "projectUnproved";

export interface LinuxCompilationRuntimeProofV1 {
  readonly schemaVersion: "linux-compilation-runtime-proof-v1";
  readonly configurationDigest: string;
  readonly oidcPolicyDigest: string;
  readonly ledgerPolicyDigest: string;
  readonly astroManifestDigest: string;
  readonly flutterManifestDigest: string;
  readonly proofDigest: string;
}

export interface LinuxCompilationImagePlanV1 {
  readonly schemaVersion: "shipglows-toolchain-image-plan-v1";
  readonly target: CompilationTargetV1;
  readonly status: string;
  readonly routable: boolean;
  readonly visibility: string;
  readonly platform: string;
  readonly finalImage: { readonly repository: string | null; readonly digest: string | null };
  readonly toolchain: Readonly<Record<string, unknown>> & { readonly toolchainDigest: string | null };
  readonly offlineCache: { readonly contentDigest: string | null };
  readonly execution: {
    readonly commands: readonly (readonly string[])[];
    readonly outputRoot: string;
    readonly timeoutMs: number;
    readonly persistent: boolean;
    readonly ports: number;
    readonly runtimeNetwork: string;
    readonly guestCredentials: boolean;
  };
  readonly attestation: {
    readonly sbomDigest: string | null;
    readonly provenanceDigest: string | null;
    readonly vulnerabilityResultDigest: string | null;
  };
  readonly blockers: readonly string[];
}

export interface LinuxCompilationIntegrationDependencies {
  readonly loadSdk: VercelSandboxSdkLoader;
  readonly verifier: VercelTrustVerifierPort;
  readonly ledger: VercelBudgetLedgerPort;
  readonly createPorts: (input: Readonly<{
    target: CompilationTargetV1;
    plan: CompilationPlanNameV1;
    facade: VercelSandboxSdkFacade;
    imagePlan: LinuxCompilationImagePlanV1;
  }>) => CompilationCoordinatorPorts;
  readonly clock?: () => number;
}

export interface LinuxCompilationIntegration {
  readonly available: boolean;
  readonly reason: LinuxCompilationIntegrationReason | null;
  compile(target: unknown, request: unknown): Promise<CompilationCoordinatorResultV1>;
}

const DIGEST = /^[a-f0-9]{64}$/;
const TARGETS = ["astro_web", "flutter_web"] as const;
const PLAN: Readonly<Record<CompilationTargetV1, CompilationPlanNameV1>> = Object.freeze({
  astro_web: "astro_web_v1",
  flutter_web: "flutter_web_v1",
});
const COMMANDS: Readonly<Record<CompilationTargetV1, readonly (readonly string[])[]>> = Object.freeze({
  astro_web: Object.freeze([
    Object.freeze(["pnpm", "install", "--offline", "--frozen-lockfile", "--ignore-scripts"]),
    Object.freeze(["pnpm", "exec", "astro", "check"]),
    Object.freeze(["pnpm", "exec", "astro", "build"]),
  ]),
  flutter_web: Object.freeze([
    Object.freeze(["flutter", "pub", "get", "--offline", "--enforce-lockfile"]),
    Object.freeze(["flutter", "build", "web", "--release", "--no-pub"]),
  ]),
});

export function createLinuxCompilationIntegration(input: {
  readonly configuration: VercelSandboxConfiguration;
  readonly imagePlans: Readonly<Record<CompilationTargetV1, LinuxCompilationImagePlanV1>>;
  readonly runtimeProof: LinuxCompilationRuntimeProofV1 | null;
}, dependencies: LinuxCompilationIntegrationDependencies): LinuxCompilationIntegration {
  let configuration;
  try {
    configuration = validateVercelSandboxConfiguration(input.configuration);
  } catch {
    return unavailable("projectUnproved");
  }
  if (!configuration.enabled) return unavailable("disabled");

  const plans = TARGETS.map((target) => validateImagePlan(input.imagePlans[target], target));
  if (plans.some((plan) => plan === null)) return unavailable("workerUnproved");
  const astro = plans[0]!;
  const flutter = plans[1]!;
  const proof = input.runtimeProof;
  if (
    proof === null ||
    !validProof(proof, configuration.configurationDigest!, astro, flutter) ||
    !configuration.images ||
    !imageMatches(configuration.images.astro_web, astro) ||
    !imageMatches(configuration.images.flutter_web, flutter)
  ) return unavailable("projectUnproved");

  const facade = createVercelSandboxSdkFacade(configuration, dependencies);
  const coordinators = Object.freeze(Object.fromEntries(TARGETS.map((target, index) => {
    const imagePlan = plans[index]!;
    const ports = dependencies.createPorts(Object.freeze({ target, plan: PLAN[target], facade, imagePlan }));
    return [target, new CompilationCoordinator(ports)] as const;
  }))) as Readonly<Record<CompilationTargetV1, CompilationCoordinator>>;

  return Object.freeze({
    available: true,
    reason: null,
    async compile(target: unknown, request: unknown) {
      if (!TARGETS.includes(target as CompilationTargetV1)) return closed("unsupportedTarget", request);
      const typed = request as CompilationCoordinatorRequestV1;
      if (typed?.scope?.target !== target) return closed("routeStale", request);
      return coordinators[target as CompilationTargetV1].compile(request);
    },
  });
}

function unavailable(reason: LinuxCompilationIntegrationReason): LinuxCompilationIntegration {
  const coordinator = new CompilationCoordinator(null);
  return Object.freeze({
    available: false,
    reason,
    compile(_target: unknown, request: unknown) { return coordinator.compile(request); },
  });
}

function closed(reason: "unsupportedTarget" | "routeStale", request: unknown): Promise<CompilationCoordinatorResultV1> {
  const value = request as CompilationCoordinatorRequestV1;
  return Promise.resolve({
    state: "failed",
    reason,
    ledgerDigest: typeof value?.expectedLedgerDigest === "string" ? value.expectedLedgerDigest : "0".repeat(64),
    ledgerRevision: Number.isSafeInteger(value?.expectedLedgerRevision) ? value.expectedLedgerRevision : 0,
    artifactAggregateDigest: null,
  });
}

function validateImagePlan(value: LinuxCompilationImagePlanV1, target: CompilationTargetV1): LinuxCompilationImagePlanV1 | null {
  if (!value || value.schemaVersion !== "shipglows-toolchain-image-plan-v1" || value.target !== target || value.status !== "verified" || !value.routable || value.visibility !== "private" || value.platform !== "linux/amd64" || value.blockers.length !== 0) return null;
  const expectedOutput = target === "astro_web" ? "dist" : "build/web";
  if (value.execution.outputRoot !== expectedOutput || value.execution.timeoutMs !== 600000 || value.execution.persistent || value.execution.ports !== 0 || value.execution.runtimeNetwork !== "deny_all" || value.execution.guestCredentials || JSON.stringify(value.execution.commands) !== JSON.stringify(COMMANDS[target])) return null;
  const digests = [value.finalImage.digest, value.toolchain.toolchainDigest, value.offlineCache.contentDigest, value.attestation.sbomDigest, value.attestation.provenanceDigest, value.attestation.vulnerabilityResultDigest];
  if (typeof value.finalImage.repository !== "string" || !digests.every((item) => typeof item === "string" && DIGEST.test(item))) return null;
  return deepFreeze(structuredClone(value));
}

function validProof(proof: LinuxCompilationRuntimeProofV1, configurationDigest: string, astro: LinuxCompilationImagePlanV1, flutter: LinuxCompilationImagePlanV1): boolean {
  const keys = ["schemaVersion", "configurationDigest", "oidcPolicyDigest", "ledgerPolicyDigest", "astroManifestDigest", "flutterManifestDigest", "proofDigest"];
  if (Object.keys(proof).join(",") !== keys.join(",") || proof.schemaVersion !== "linux-compilation-runtime-proof-v1" || !keys.slice(1).every((key) => DIGEST.test(proof[key as keyof LinuxCompilationRuntimeProofV1]))) return false;
  if (proof.configurationDigest !== configurationDigest || proof.astroManifestDigest !== canonicalJsonDigest(astro) || proof.flutterManifestDigest !== canonicalJsonDigest(flutter) || proof.astroManifestDigest === proof.flutterManifestDigest) return false;
  const core = {
    schemaVersion: proof.schemaVersion,
    configurationDigest: proof.configurationDigest,
    oidcPolicyDigest: proof.oidcPolicyDigest,
    ledgerPolicyDigest: proof.ledgerPolicyDigest,
    astroManifestDigest: proof.astroManifestDigest,
    flutterManifestDigest: proof.flutterManifestDigest,
  };
  return proof.proofDigest === canonicalJsonDigest(core);
}

function imageMatches(identity: { readonly reference: string; readonly imageDigest: string; readonly toolchainDigest: string }, plan: LinuxCompilationImagePlanV1): boolean {
  return identity.reference === `${plan.finalImage.repository}@sha256:${plan.finalImage.digest}` && identity.imageDigest === plan.finalImage.digest && identity.toolchainDigest === plan.toolchain.toolchainDigest;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  }
  return value;
}
