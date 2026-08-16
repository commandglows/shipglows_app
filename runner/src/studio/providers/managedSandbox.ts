export const REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES = Object.freeze([
  "managedMicrovmFailureDomain",
  "runnerHostExecutionDenied",
  "freshEphemeralIsolation",
  "defaultDenyEgress",
  "generationGatewayOnly",
  "verificationDenyAll",
  "phaseCredentialSeparation",
  "immutableRuntimeIdentity",
  "resourceBudgets",
  "costBudgetPreflight",
  "expiringLease",
  "idempotentRelease",
  "orphanReconciliation",
] as const);

export type ManagedSandboxCapability = (typeof REQUIRED_STUDIO_MANAGED_SANDBOX_CAPABILITIES)[number];

export interface ManagedSandboxResourceBudget {
  readonly maxDurationMs: number;
  readonly maxVcpus: number;
  readonly maxMemoryBytes: number;
  readonly maxDiskBytes: number;
  readonly maxProcesses: number;
  readonly maxOutputBytes: number;
  readonly maxConcurrentAllocations: number;
  readonly maxProviderApiCalls: number;
  readonly providerApiWindowMs: number;
  readonly maxTransferBytes: number;
  readonly maxModelTokens: number;
  readonly spendReservation: {
    readonly currency: "USD";
    readonly amountMicros: number;
    readonly reservationId: string;
  };
}

export const MANAGED_SANDBOX_PROVIDER_LIFECYCLE_OPERATIONS = Object.freeze([
  "create", "probe", "update", "inspect", "stop", "delete", "list", "reconcile",
] as const);

export type ManagedSandboxProviderLifecycleOperation = (typeof MANAGED_SANDBOX_PROVIDER_LIFECYCLE_OPERATIONS)[number];

/** Every allocation needs these calls even if no network update or reconciliation is applicable. */
export const MANAGED_SANDBOX_REQUIRED_ALLOCATION_LIFECYCLE_CALLS = Object.freeze([
  "create", "probe", "stop", "delete",
] as const satisfies readonly ManagedSandboxProviderLifecycleOperation[]);

export const MANAGED_SANDBOX_CONTROL_NAMES = Object.freeze([
  "lifecycle",
  "sourceIn",
  "artifactOut",
  "network",
  "credentials",
  "privateIngress",
  "persistence",
  "snapshots",
  "quotas",
  "cleanup",
] as const);

export type ManagedSandboxControl = (typeof MANAGED_SANDBOX_CONTROL_NAMES)[number];
export type ManagedSandboxControlState = "attested" | "unproved" | "unavailable" | "notImplemented";

export const MANAGED_SANDBOX_UNAVAILABLE_REASONS = Object.freeze([
  "unconfigured",
  "unproved",
  "incompatible",
  "quotaExceeded",
  "costBudgetExceeded",
  "privateIngressUnavailable",
  "snapshotUnavailable",
  "cleanupPending",
  "providerUnavailable",
] as const);

export type ManagedSandboxUnavailableReason = (typeof MANAGED_SANDBOX_UNAVAILABLE_REASONS)[number];

const opaque = /^[A-Za-z0-9._:-]{1,128}$/;

/**
 * This validates a bounded policy/request budget only. It does not assert that
 * a provider has reserved quota or spend; that requires verified evidence.
 */
export function isManagedSandboxResourceBudget(value: ManagedSandboxResourceBudget): boolean {
  const reservation = value.spendReservation as { readonly currency: string; readonly amountMicros: number; readonly reservationId: string };
  return integer(value.maxDurationMs, 1_000, 15 * 60 * 1_000) && integer(value.maxVcpus, 1, 16) &&
    integer(value.maxMemoryBytes, 64 * 1024 * 1024, 4 * 1024 * 1024 * 1024) && integer(value.maxDiskBytes, 64 * 1024 * 1024, 64 * 1024 * 1024 * 1024) &&
    integer(value.maxProcesses, 1, 256) && integer(value.maxOutputBytes, 1_024, 512 * 1024 * 1024) &&
    integer(value.maxConcurrentAllocations, 1, 128) && integer(value.maxProviderApiCalls, 1, 1_000) && integer(value.providerApiWindowMs, 1_000, 60 * 60 * 1_000) &&
    integer(value.maxTransferBytes, 0, 1024 * 1024 * 1024 * 1024) && integer(value.maxModelTokens, 0, 10_000_000) &&
    reservation.currency === "USD" && integer(reservation.amountMicros, 0, 100_000_000_000) && opaque.test(reservation.reservationId);
}

/** Clone and freeze a budget before it crosses an adapter or verifier boundary. */
export function freezeManagedSandboxResourceBudget(value: ManagedSandboxResourceBudget): ManagedSandboxResourceBudget {
  const spendReservation = Object.freeze({
    currency: value.spendReservation.currency,
    amountMicros: value.spendReservation.amountMicros,
    reservationId: value.spendReservation.reservationId,
  });
  return Object.freeze({
    maxDurationMs: value.maxDurationMs,
    maxVcpus: value.maxVcpus,
    maxMemoryBytes: value.maxMemoryBytes,
    maxDiskBytes: value.maxDiskBytes,
    maxProcesses: value.maxProcesses,
    maxOutputBytes: value.maxOutputBytes,
    maxConcurrentAllocations: value.maxConcurrentAllocations,
    maxProviderApiCalls: value.maxProviderApiCalls,
    providerApiWindowMs: value.providerApiWindowMs,
    maxTransferBytes: value.maxTransferBytes,
    maxModelTokens: value.maxModelTokens,
    spendReservation,
  });
}

/** Exact policy equality, including every nested spend-reservation field. */
export function sameManagedSandboxResourceBudget(left: ManagedSandboxResourceBudget, right: ManagedSandboxResourceBudget): boolean {
  const leftSpend = left.spendReservation as { readonly currency: string; readonly amountMicros: number; readonly reservationId: string };
  const rightSpend = right.spendReservation as { readonly currency: string; readonly amountMicros: number; readonly reservationId: string };
  return left.maxDurationMs === right.maxDurationMs && left.maxVcpus === right.maxVcpus &&
    left.maxMemoryBytes === right.maxMemoryBytes && left.maxDiskBytes === right.maxDiskBytes &&
    left.maxProcesses === right.maxProcesses && left.maxOutputBytes === right.maxOutputBytes &&
    left.maxConcurrentAllocations === right.maxConcurrentAllocations && left.maxProviderApiCalls === right.maxProviderApiCalls &&
    left.providerApiWindowMs === right.providerApiWindowMs && left.maxTransferBytes === right.maxTransferBytes &&
    left.maxModelTokens === right.maxModelTokens && leftSpend.currency === rightSpend.currency &&
    leftSpend.amountMicros === rightSpend.amountMicros && leftSpend.reservationId === rightSpend.reservationId;
}

/**
 * One entry is charged for every provider lifecycle call, including cleanup
 * and reconciliation. Adapters must check this before each such call.
 */
export function isManagedSandboxProviderLifecycleCallAccounting(
  operations: readonly string[],
  budget: ManagedSandboxResourceBudget,
): operations is readonly ManagedSandboxProviderLifecycleOperation[] {
  return isManagedSandboxResourceBudget(budget) && operations.length <= budget.maxProviderApiCalls &&
    operations.every((operation) => (MANAGED_SANDBOX_PROVIDER_LIFECYCLE_OPERATIONS as readonly string[]).includes(operation));
}

function integer(value: number, minimum: number, maximum: number): boolean {
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum;
}
