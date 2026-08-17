import { createHash } from "node:crypto";

import {
  REQUIRED_STUDIO_WORKER_CAPABILITIES,
  studioWorkerScenarioDigest,
  type StudioWorkerAdmissionRequest,
  type StudioWorkerAttestation,
  type StudioWorkerProvider,
} from "../workerProvider.js";
import {
  assertManagedSandboxVerifiedEvidence,
  type ManagedSandboxVerifiedEvidence,
} from "./evidenceVerifier.js";
import {
  validateManagedSandboxAttestation,
  type ManagedSandboxCapabilityAttestation,
} from "./attestation.js";
import {
  MANAGED_SANDBOX_CONTROL_NAMES,
  isManagedSandboxProviderLifecycleCallAccounting,
  isManagedSandboxResourceBudget,
  sameManagedSandboxResourceBudget,
  type ManagedSandboxProviderLifecycleOperation,
  type ManagedSandboxResourceBudget,
  type ManagedSandboxUnavailableReason,
} from "./managedSandbox.js";

/** Narrow, injected boundary; this module never imports or instantiates the Vercel SDK. */
export interface VercelSandboxFacade {
  createSandbox(input: VercelSandboxCreateInput): Promise<VercelSandboxRecord>;
  probeSandbox(input: { readonly name: string }): Promise<void>;
  updateNetworkPolicy(input: { readonly name: string; readonly networkPolicy: VercelSandboxNetworkPolicy }): Promise<void>;
  inspectSandbox(input: { readonly name: string }): Promise<VercelSandboxRecord>;
  stopSandbox(input: { readonly name: string }): Promise<void>;
  deleteSandbox(input: { readonly name: string }): Promise<void>;
  listSandboxes(input: { readonly namePrefix: string; readonly tags: Readonly<Record<string, string>>; readonly limit: number }): Promise<readonly VercelSandboxRecord[]>;
}

export interface VercelSandboxCreateInput {
  readonly name: string;
  readonly image: string;
  readonly persistent: false;
  readonly timeout: number;
  readonly resources: { readonly vcpus: number };
  readonly resourceBudget: ManagedSandboxResourceBudget;
  readonly ports: readonly [];
  readonly networkPolicy: "deny-all";
  readonly tags: Readonly<Record<string, string>>;
}

export type VercelSandboxNetworkPolicy = "deny-all" | { readonly allow: Readonly<Record<string, readonly [{ readonly forwardURL: string }]>> };

export interface VercelSandboxRecord {
  readonly resourceId: string;
  readonly name: string;
  readonly image: string;
  readonly persistent: boolean;
  readonly timeout: number;
  readonly vcpus: number;
  readonly ports: readonly number[];
  readonly networkPolicy: VercelSandboxNetworkPolicy;
  readonly tags: Readonly<Record<string, string>>;
  readonly observedBudget: ManagedSandboxResourceBudget;
  readonly expiresAt: string;
}

export interface VercelSandboxEvidenceInput {
  readonly request: StudioWorkerAdmissionRequest;
  readonly observed: VercelSandboxRecord;
  readonly expected: {
    readonly providerId: string;
    readonly adapterVersion: string;
    readonly accountScopeDigest: string;
    readonly projectScopeDigest: string;
    readonly configurationDigest: string;
    readonly policyDigest: string;
    readonly imageDigest: string;
    readonly scenarioDigest: string;
    readonly resourceBudget: ManagedSandboxResourceBudget;
  };
}

/**
 * Trusted control-plane hook. It must return the original observed evidence and
 * its immutable, independently verified counterpart; this adapter never creates either.
 */
export interface VercelSandboxEvidenceVerifier {
  verify(input: VercelSandboxEvidenceInput): Promise<{ readonly observed: ManagedSandboxCapabilityAttestation; readonly verified: ManagedSandboxVerifiedEvidence } | undefined>;
}

export interface VercelSandboxProviderOptions {
  readonly client: VercelSandboxFacade;
  readonly imageRepository: string;
  readonly accountScopeDigest: string;
  readonly projectScopeDigest: string;
  readonly configurationDigest: string;
  readonly maxVcpus: number;
  readonly providerApiRateLimit: { readonly maxProviderApiCalls: number; readonly providerApiWindowMs: number };
  readonly generationGateway: { readonly host: string; readonly brokerUrl: string };
  readonly evidenceVerifier?: VercelSandboxEvidenceVerifier;
  readonly adapterVersion?: string;
  readonly now?: () => Date;
  readonly reconciliationLimit?: number;
}

export class VercelSandboxProviderConfigurationError extends Error {
  constructor() { super("Managed sandbox configuration is invalid."); this.name = "VercelSandboxProviderConfigurationError"; }
}

export class VercelSandboxCleanupError extends Error {
  constructor(readonly code: "cleanupUncertain" | "reconciliationUnavailable") { super("Managed sandbox cleanup is uncertain."); this.name = "VercelSandboxCleanupError"; }
}

const PROVIDER_ID = "vercel-sandbox";
const DEFAULT_ADAPTER_VERSION = "vercel-sandbox-2.9.2";
const NAME_PREFIX = "sg-studio-";
const TAGS = Object.freeze({ shipglows: "studio", lifecycle: "ephemeral" });
const DIGEST = /^[a-f0-9]{64}$/;
const IMAGE_DIGEST = /^sha256:([a-f0-9]{64})$/;
const REPOSITORY = /^(?!.*(?:\s|@))[A-Za-z0-9._/-]{1,180}$/;
const OPAQUE = /^[A-Za-z0-9._:-]{1,128}$/;

interface Lease {
  readonly key: string;
  readonly inputHash: string;
  readonly name: string;
  readonly attestation: StudioWorkerAttestation;
  readonly ledger: CallLedger;
  stopped: boolean;
  deleting?: Promise<boolean> | undefined;
}

interface CallReservation {
  readonly id: string;
  readonly inputHash: string;
  remaining: number;
}
interface CallLedger {
  readonly budget: ManagedSandboxResourceBudget;
  readonly operations: ManagedSandboxProviderLifecycleOperation[];
  readonly reservation: CallReservation;
}
interface PendingPreflight {
  readonly inputHash: string;
  readonly name: string;
  readonly budget: ManagedSandboxResourceBudget;
  readonly promise: Promise<Awaited<ReturnType<StudioWorkerProvider["preflight"]>>>;
}
interface Quarantine { readonly key: string; readonly inputHash: string; readonly name: string; resourceId?: string; readonly ledger: CallLedger; stopped: boolean; }
class CallBudgetExceeded extends Error {}

/** Admission/probe/release only. Commands, files, snapshots, ports, and execution are absent by design. */
export class VercelSandboxProvider implements StudioWorkerProvider {
  readonly providerId = PROVIDER_ID;
  readonly #leases = new Map<string, Lease>();
  readonly #pending = new Map<string, PendingPreflight>();
  readonly #quarantines = new Map<string, Quarantine>();
  readonly #providerCallTimestamps: number[] = [];
  readonly #callReservations = new Map<string, CallReservation>();
  readonly #adapterVersion: string;
  readonly #now: () => Date;
  readonly #reconciliationLimit: number;

  constructor(private readonly options: VercelSandboxProviderOptions) {
    validateOptions(options);
    this.#adapterVersion = options.adapterVersion ?? DEFAULT_ADAPTER_VERSION;
    this.#now = options.now ?? (() => new Date());
    this.#reconciliationLimit = options.reconciliationLimit ?? 20;
  }

  preflight(request: StudioWorkerAdmissionRequest): Promise<Awaited<ReturnType<StudioWorkerProvider["preflight"]>>> {
    const invalid = validateRequest(request, this.options.maxVcpus, this.options.providerApiRateLimit);
    if (invalid !== undefined) return Promise.resolve({ available: false, reason: invalid });
    // Default construction is intentionally inert and cannot claim provider availability.
    if (this.options.evidenceVerifier === undefined) return Promise.resolve({ available: false, reason: "unproved" });
    const key = leaseKey(request);
    const name = sandboxName(request);
    const inputHash = studioWorkerScenarioDigest(request);
    if (this.#quarantines.has(name)) return Promise.resolve({ available: false, reason: "cleanupPending" });
    const existing = this.#leases.get(key);
    if (existing !== undefined) {
      if (existing.inputHash !== inputHash) return Promise.resolve({ available: false, reason: "incompatible" });
      if (Date.parse(existing.attestation.expiresAt) > this.#now().getTime()) return Promise.resolve({ available: true, attestation: existing.attestation });
      return this.release(request, existing.attestation, "attestationRejected").catch(() => undefined).then(() => ({ available: false as const, reason: "unproved" as const }));
    }
    const pending = this.#pending.get(key);
    if (pending !== undefined) return pending.inputHash === inputHash ? pending.promise : Promise.resolve({ available: false, reason: "incompatible" });
    const budget = request.resourceBudget;
    if (budget === undefined || this.activeAllocationCount() >= this.activeAllocationLimit(budget)) return Promise.resolve({ available: false, reason: "quotaExceeded" });
    const reservation = this.reserveProviderCalls(`preflight:${key}`, inputHash, requiredLifecycleCalls(request.phase));
    if (reservation === undefined) return Promise.resolve({ available: false, reason: "quotaExceeded" });
    const promise = this.createAndProbe(request, key, reservation).finally(() => this.#pending.delete(key));
    this.#pending.set(key, { inputHash, name, budget, promise });
    return promise;
  }

  async release(request: StudioWorkerAdmissionRequest, _attestation: StudioWorkerAttestation | undefined, _reason: "preflightUnavailable" | "preflightTimedOut" | "attestationRejected"): Promise<void> {
    void _attestation; void _reason;
    const key = leaseKey(request);
    const quarantineName = sandboxName(request);
    const lease = this.#leases.get(key);
    if (lease === undefined) {
      const quarantine = this.#quarantines.get(quarantineName);
      if (quarantine?.inputHash !== studioWorkerScenarioDigest(request)) throw new VercelSandboxCleanupError("cleanupUncertain");
      if (!this.ensureCleanupReservation(quarantine) || !(await this.destroy(quarantine))) throw new VercelSandboxCleanupError("cleanupUncertain");
      this.releaseReservation(quarantine.ledger.reservation);
      this.#quarantines.delete(quarantineName);
      return;
    }
    if (lease.inputHash !== studioWorkerScenarioDigest(request)) throw new VercelSandboxCleanupError("cleanupUncertain");
    if (!this.ensureCleanupReservation(lease) || !(await this.releaseLease(lease))) {
      // A failed stop/delete is an unresolved provider resource, never an available lease.
      this.#quarantines.set(lease.name, { key, inputHash: lease.inputHash, name: lease.name, resourceId: lease.attestation.workerIdentity, ledger: lease.ledger, stopped: lease.stopped });
      throw new VercelSandboxCleanupError("cleanupUncertain");
    }
    this.#leases.delete(lease.key);
    this.#quarantines.delete(lease.name);
    this.releaseReservation(lease.ledger.reservation);
  }

  /** Bounded, label-and-name-scoped reconciliation. Failure is explicit, never an empty success. */
  async reconcile(): Promise<{ readonly inspected: number; readonly released: number }> {
    const retried = await this.retryReconciliationQuarantines();
    if (retried !== undefined) return retried;
    const reconciliationHash = digestOf(JSON.stringify([NAME_PREFIX, TAGS, this.#reconciliationLimit]));
    const reservation = this.reserveProviderCalls(`reconcile:${reconciliationHash}`, reconciliationHash, 2 + (2 * this.#reconciliationLimit));
    if (reservation === undefined) throw new VercelSandboxCleanupError("reconciliationUnavailable");
    let records: readonly VercelSandboxRecord[];
    try {
      records = await this.call(undefined, reservation, "list", () => this.options.client.listSandboxes({ namePrefix: NAME_PREFIX, tags: TAGS, limit: this.#reconciliationLimit }));
      this.consumeReservation(reservation, "reconcile");
    }
    catch {
      this.releaseReservation(reservation);
      throw new VercelSandboxCleanupError("reconciliationUnavailable");
    }
    let released = 0;
    for (const record of records.slice(0, this.#reconciliationLimit)) {
      if (!isOwnedExpired(record, this.#now().getTime())) continue;
      // The list result supplies the only verified resource budget available to
      // reconciliation. Charge both the bounded reconciliation pass and every
      // subsequent provider call against that observed budget.
      const ledger: CallLedger = { budget: record.observedBudget, operations: ["list", "reconcile"], reservation };
      const quarantine: Quarantine = { key: `reconcile:${record.resourceId}`, inputHash: digestOf(JSON.stringify([record.resourceId, record.name, record.expiresAt])), name: record.name, resourceId: record.resourceId, ledger, stopped: false };
      if (!(await this.destroy(quarantine))) { this.#quarantines.set(quarantine.name, quarantine); throw new VercelSandboxCleanupError("cleanupUncertain"); }
      this.#quarantines.delete(quarantine.name);
      released += 1;
    }
    this.releaseReservation(reservation);
    return { inspected: Math.min(records.length, this.#reconciliationLimit), released };
  }

  private async retryReconciliationQuarantines(): Promise<{ readonly inspected: number; readonly released: number } | undefined> {
    const quarantines = [...this.#quarantines.values()].filter((quarantine) => quarantine.key.startsWith("reconcile:"));
    if (quarantines.length === 0) return undefined;
    let released = 0;
    for (const quarantine of quarantines) {
      if (!this.ensureCleanupReservation(quarantine) || !(await this.destroy(quarantine))) throw new VercelSandboxCleanupError("cleanupUncertain");
      this.#quarantines.delete(quarantine.name);
      if (![...this.#quarantines.values()].some((remaining) => remaining.ledger.reservation === quarantine.ledger.reservation)) this.releaseReservation(quarantine.ledger.reservation);
      released += 1;
    }
    return { inspected: quarantines.length, released };
  }

  private async createAndProbe(request: StudioWorkerAdmissionRequest, key: string, reservation: CallReservation): Promise<Awaited<ReturnType<StudioWorkerProvider["preflight"]>>> {
    const budget = request.resourceBudget;
    if (budget === undefined) return { available: false, reason: "incompatible" };
    const name = sandboxName(request);
    const input: VercelSandboxCreateInput = {
      name, image: `${this.options.imageRepository}@${request.imageDigest}`, persistent: false,
      timeout: budget.maxDurationMs, resources: { vcpus: budget.maxVcpus }, resourceBudget: budget,
      ports: [], networkPolicy: "deny-all", tags: { ...TAGS, phase: request.phase },
    };
    const temporary: Quarantine = { key, inputHash: studioWorkerScenarioDigest(request), name, ledger: { budget, operations: [], reservation }, stopped: false };
    try {
      await this.call(temporary.ledger, reservation, "create", () => this.options.client.createSandbox(input));
      await this.call(temporary.ledger, reservation, "probe", () => this.options.client.probeSandbox({ name }));
      const created = await this.call(temporary.ledger, reservation, "inspect", () => this.options.client.inspectSandbox({ name }));
      temporary.resourceId = created.resourceId;
      if (!matchesRecord(created, input, "deny-all", request.expiresAt, this.#now())) return await this.failedProbe(temporary, "incompatible");
      let observed = created;
      if (request.phase === "generation") {
        const policy = generationPolicy(this.options.generationGateway);
        await this.call(temporary.ledger, reservation, "update", () => this.options.client.updateNetworkPolicy({ name, networkPolicy: policy }));
        observed = await this.call(temporary.ledger, reservation, "inspect", () => this.options.client.inspectSandbox({ name }));
        temporary.resourceId = observed.resourceId;
        if (!matchesRecord(observed, input, policy, request.expiresAt, this.#now())) return await this.failedProbe(temporary, "incompatible");
      }
      const evidence = await this.verifyEvidence(request, observed);
      if (evidence === undefined) return await this.failedProbe(temporary, "unproved");
      const attestation: StudioWorkerAttestation = {
        providerId: this.providerId, workerIdentity: observed.resourceId, imageDigest: request.imageDigest,
        policyDigest: request.policyDigest, capabilities: [...REQUIRED_STUDIO_WORKER_CAPABILITIES], phase: request.phase,
        expiresAt: evidence.expiresAt, managedSandbox: evidence,
      };
      this.#leases.set(key, { ...temporary, inputHash: studioWorkerScenarioDigest(request), attestation });
      return { available: true, attestation };
    } catch (error) {
      return await this.failedProbe(temporary, error instanceof CallBudgetExceeded ? "quotaExceeded" : "providerUnavailable");
    }
  }

  private async verifyEvidence(request: StudioWorkerAdmissionRequest, observed: VercelSandboxRecord): Promise<ManagedSandboxCapabilityAttestation | undefined> {
    const budget = request.resourceBudget;
    const verifier = this.options.evidenceVerifier;
    if (budget === undefined || verifier === undefined) return undefined;
    const expected = expectedEvidence(this.options, this.#adapterVersion, request, budget);
    try {
      const bundle = await verifier.verify({ request, observed, expected });
      if (bundle === undefined) return undefined;
      assertManagedSandboxVerifiedEvidence(bundle.verified);
      validateManagedSandboxAttestation(bundle.observed, { expectedProviderId: this.providerId, now: this.#now() });
      return evidenceMatches(bundle.observed, bundle.verified, request, observed, expected) ? bundle.observed : undefined;
    } catch { return undefined; }
  }

  private async failedProbe(lease: Quarantine, reason: ManagedSandboxUnavailableReason): Promise<{ readonly available: false; readonly reason: ManagedSandboxUnavailableReason }> {
    if (await this.destroy(lease)) {
      this.releaseReservation(lease.ledger.reservation);
      return { available: false, reason };
    }
    // Key by the deterministic name and retain the observed resource identity;
    // this prevents a retry from reusing the identifier while deletion is uncertain.
    this.#quarantines.set(lease.name, lease);
    return { available: false, reason: "cleanupPending" };
  }

  private async releaseLease(lease: Lease): Promise<boolean> {
    if (lease.deleting !== undefined) return lease.deleting;
    lease.deleting = this.destroy(lease).finally(() => { lease.deleting = undefined; });
    return lease.deleting;
  }

  private async destroy(lease: { readonly name: string; stopped: boolean; readonly ledger: CallLedger }): Promise<boolean> {
    if (!lease.stopped) {
      try { await this.call(lease.ledger, lease.ledger.reservation, "stop", () => this.options.client.stopSandbox({ name: lease.name })); }
      catch { return false; }
      lease.stopped = true;
    }
    try { await this.call(lease.ledger, lease.ledger.reservation, "delete", () => this.options.client.deleteSandbox({ name: lease.name })); return true; }
    catch { return false; }
  }

  private async call<T>(ledger: CallLedger | undefined, reservation: CallReservation, operation: ManagedSandboxProviderLifecycleOperation, work: () => Promise<T>): Promise<T> {
    if (ledger !== undefined && !isManagedSandboxProviderLifecycleCallAccounting([...ledger.operations, operation], ledger.budget)) throw new CallBudgetExceeded();
    this.consumeReservation(reservation, operation);
    ledger?.operations.push(operation);
    return work();
  }

  private consumeReservation(reservation: CallReservation, _operation: ManagedSandboxProviderLifecycleOperation): void {
    void _operation;
    if (this.#callReservations.get(reservation.id) !== reservation || reservation.remaining < 1) throw new CallBudgetExceeded();
    const now = this.#now().getTime();
    this.pruneProviderCallTimestamps(now);
    reservation.remaining -= 1;
    this.#providerCallTimestamps.push(now);
  }

  private reserveProviderCalls(id: string, inputHash: string, count: number): CallReservation | undefined {
    const now = this.#now().getTime();
    this.pruneProviderCallTimestamps(now);
    const reserved = [...this.#callReservations.values()].reduce((total, reservation) => total + reservation.remaining, 0);
    if (this.#callReservations.has(id) || this.#providerCallTimestamps.length + reserved + count > this.options.providerApiRateLimit.maxProviderApiCalls) return undefined;
    const reservation: CallReservation = { id, inputHash, remaining: count };
    this.#callReservations.set(id, reservation);
    return reservation;
  }

  private ensureCleanupReservation(resource: { readonly stopped: boolean; readonly ledger: CallLedger }): boolean {
    const needed = resource.stopped ? 1 : 2;
    const reservation = resource.ledger.reservation;
    if (reservation.remaining >= needed) return true;
    const now = this.#now().getTime();
    this.pruneProviderCallTimestamps(now);
    const additional = needed - reservation.remaining;
    const reserved = [...this.#callReservations.values()].reduce((total, current) => total + current.remaining, 0);
    if (this.#providerCallTimestamps.length + reserved + additional > this.options.providerApiRateLimit.maxProviderApiCalls) return false;
    reservation.remaining += additional;
    return true;
  }

  private releaseReservation(reservation: CallReservation): void {
    if (this.#callReservations.get(reservation.id) === reservation) this.#callReservations.delete(reservation.id);
    reservation.remaining = 0;
  }

  private pruneProviderCallTimestamps(now: number): void {
    const { providerApiWindowMs } = this.options.providerApiRateLimit;
    for (let index = this.#providerCallTimestamps.length - 1; index >= 0; index -= 1) {
      if ((this.#providerCallTimestamps[index] ?? Number.POSITIVE_INFINITY) <= now - providerApiWindowMs) this.#providerCallTimestamps.splice(index, 1);
    }
  }

  private activeAllocationCount(): number {
    return new Set([
      ...[...this.#leases.values()].map((lease) => lease.name),
      ...[...this.#pending.values()].map((pending) => pending.name),
      ...this.#quarantines.keys(),
    ]).size;
  }

  private activeAllocationLimit(incoming: ManagedSandboxResourceBudget): number {
    return Math.min(
      incoming.maxConcurrentAllocations,
      ...[...this.#leases.values()].map((lease) => lease.ledger.budget.maxConcurrentAllocations),
      ...[...this.#pending.values()].map((pending) => pending.budget.maxConcurrentAllocations),
      ...[...this.#quarantines.values()].map((quarantine) => quarantine.ledger.budget.maxConcurrentAllocations),
    );
  }
}

function validateOptions(options: VercelSandboxProviderOptions): void {
  const rateLimit = (options as { readonly providerApiRateLimit?: VercelSandboxProviderOptions["providerApiRateLimit"] }).providerApiRateLimit;
  if (rateLimit === undefined || !REPOSITORY.test(options.imageRepository) || !DIGEST.test(options.accountScopeDigest) || !DIGEST.test(options.projectScopeDigest) || !DIGEST.test(options.configurationDigest) || !Number.isSafeInteger(options.maxVcpus) || options.maxVcpus < 1 || options.maxVcpus > 32 || !Number.isSafeInteger(rateLimit.maxProviderApiCalls) || rateLimit.maxProviderApiCalls < 1 || rateLimit.maxProviderApiCalls > 1_000 || !Number.isSafeInteger(rateLimit.providerApiWindowMs) || rateLimit.providerApiWindowMs < 1_000 || rateLimit.providerApiWindowMs > 60 * 60 * 1_000 || !OPAQUE.test(options.adapterVersion ?? DEFAULT_ADAPTER_VERSION) || !validGateway(options.generationGateway) || (options.reconciliationLimit !== undefined && (!Number.isSafeInteger(options.reconciliationLimit) || options.reconciliationLimit < 1 || options.reconciliationLimit > 50))) throw new VercelSandboxProviderConfigurationError();
}

function validGateway(gateway: VercelSandboxProviderOptions["generationGateway"]): boolean {
  try {
    const url = new URL(gateway.brokerUrl);
    return url.protocol === "https:" && url.username === "" && url.password === "" && url.search === "" && url.hash === "" && url.pathname === "/" && url.port === "" && url.hostname === gateway.host && /^[a-z0-9.-]{1,253}$/.test(gateway.host);
  } catch { return false; }
}

function validateRequest(request: StudioWorkerAdmissionRequest, maxVcpus: number, providerApiRateLimit: VercelSandboxProviderOptions["providerApiRateLimit"]): ManagedSandboxUnavailableReason | undefined {
  const match = IMAGE_DIGEST.exec(request.imageDigest);
  const budget = request.resourceBudget;
  if (match === null || budget === undefined || !isManagedSandboxResourceBudget(budget) || request.maxDurationMs !== budget.maxDurationMs || request.maxMemoryBytes !== budget.maxMemoryBytes || request.maxProcesses !== budget.maxProcesses || budget.maxVcpus > maxVcpus || budget.maxMemoryBytes > budget.maxVcpus * 2 * 1024 * 1024 * 1024 || request.outboundNetwork !== (request.phase === "generation" ? "gatewayOnly" : "denied") || request.modelGatewayCapability !== (request.phase === "generation" ? "singleJob" : "none")) return "incompatible";
  if (request.phase === "generation" && (budget.maxModelTokens < 1 || budget.spendReservation.amountMicros < 1)) return "costBudgetExceeded";
  if (request.phase === "verification" && budget.maxModelTokens !== 0) return "incompatible";
  if (budget.maxProviderApiCalls !== providerApiRateLimit.maxProviderApiCalls || budget.providerApiWindowMs !== providerApiRateLimit.providerApiWindowMs) return "quotaExceeded";
  // Reserve the complete closed lifecycle before creating anything: create/probe/
  // inspect/(update+inspect)/stop/delete.  A smaller cap could strand a resource.
  const requiredCalls = requiredLifecycleCalls(request.phase);
  return budget.maxProviderApiCalls < requiredCalls ? "quotaExceeded" : undefined;
}

function requiredLifecycleCalls(phase: StudioWorkerAdmissionRequest["phase"]): 7 | 5 {
  return phase === "generation" ? 7 : 5;
}

function expectedEvidence(options: VercelSandboxProviderOptions, adapterVersion: string, request: StudioWorkerAdmissionRequest, resourceBudget: ManagedSandboxResourceBudget): VercelSandboxEvidenceInput["expected"] {
  return { providerId: PROVIDER_ID, adapterVersion, accountScopeDigest: options.accountScopeDigest, projectScopeDigest: options.projectScopeDigest, configurationDigest: options.configurationDigest, policyDigest: request.policyDigest, imageDigest: request.imageDigest.slice("sha256:".length), scenarioDigest: studioWorkerScenarioDigest(request), resourceBudget };
}

function matchesRecord(record: VercelSandboxRecord, input: VercelSandboxCreateInput, policy: VercelSandboxNetworkPolicy, requestedExpiresAt: string, now: Date): boolean {
  return OPAQUE.test(record.resourceId) && record.name === input.name && record.image === input.image && !record.persistent && record.timeout === input.timeout && record.vcpus === input.resources.vcpus && record.ports.length === 0 && record.tags["shipglows"] === TAGS.shipglows && record.tags["lifecycle"] === TAGS.lifecycle && exactFutureExpiry(record.expiresAt, requestedExpiresAt, now) && sameManagedSandboxResourceBudget(record.observedBudget, input.resourceBudget) && samePolicy(record.networkPolicy, policy);
}

function evidenceMatches(observedEvidence: ManagedSandboxCapabilityAttestation, verified: ManagedSandboxVerifiedEvidence, request: StudioWorkerAdmissionRequest, observed: VercelSandboxRecord, expected: VercelSandboxEvidenceInput["expected"]): boolean {
  return sameEvidenceEnvelope(observedEvidence, verified) && verified.providerId === PROVIDER_ID &&
    verified.adapterVersion === expected.adapterVersion && verified.accountScopeDigest === expected.accountScopeDigest &&
    verified.projectScopeDigest === expected.projectScopeDigest && verified.configurationDigest === expected.configurationDigest &&
    verified.policyDigest === expected.policyDigest && verified.imageDigest === expected.imageDigest &&
    verified.scenarioDigest === expected.scenarioDigest && verified.observedResourceIdentityDigest === digestOf(observed.resourceId) &&
    verified.expiresAt === request.expiresAt && observedEvidence.expiresAt === request.expiresAt && observed.expiresAt === request.expiresAt &&
    observedEvidence.proofState === "observed" && sameManagedSandboxResourceBudget(verified.observedBudget, expected.resourceBudget);
}

function sameEvidenceEnvelope(observed: ManagedSandboxCapabilityAttestation, verified: ManagedSandboxVerifiedEvidence): boolean {
  const observedVersion = (observed as { readonly version: string }).version;
  const verifiedVersion = (verified as { readonly version: string }).version;
  return observedVersion === verifiedVersion && observed.providerId === verified.providerId && observed.adapterVersion === verified.adapterVersion &&
    observed.accountScopeDigest === verified.accountScopeDigest && observed.projectScopeDigest === verified.projectScopeDigest &&
    observed.observedResourceIdentityDigest === verified.observedResourceIdentityDigest && observed.configurationDigest === verified.configurationDigest &&
    observed.policyDigest === verified.policyDigest && observed.imageDigest === verified.imageDigest && observed.scenarioDigest === verified.scenarioDigest &&
    observed.evidenceDigest === verified.evidenceDigest && observed.observedAt === verified.observedAt && observed.expiresAt === verified.expiresAt &&
    observed.observedBudget !== undefined && sameManagedSandboxResourceBudget(observed.observedBudget, verified.observedBudget) &&
    exactStrings(observed.testedScenarios, verified.testedScenarios) && exactStrings(observed.invalidationConditions, verified.invalidationConditions) &&
    MANAGED_SANDBOX_CONTROL_NAMES.every((control) => observed.controls[control] === verified.controls[control]);
}

function exactStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Closed policy: no tolerance window; provider, evidence, and request must name one lease expiry. */
function exactFutureExpiry(actual: string, requested: string, now: Date): boolean {
  const actualMs = Date.parse(actual); const requestedMs = Date.parse(requested);
  return Number.isFinite(actualMs) && Number.isFinite(requestedMs) && actualMs === requestedMs && actualMs > now.getTime();
}

function samePolicy(actual: VercelSandboxNetworkPolicy, expected: VercelSandboxNetworkPolicy): boolean {
  if (actual === "deny-all" || expected === "deny-all") return actual === expected;
  const hosts = Object.keys(expected.allow);
  return hosts.length === 1 && Object.keys(actual.allow).length === 1 && hosts.every((host) => actual.allow[host]?.[0].forwardURL === expected.allow[host]?.[0].forwardURL);
}

function generationPolicy(gateway: VercelSandboxProviderOptions["generationGateway"]): VercelSandboxNetworkPolicy { return { allow: { [gateway.host]: [{ forwardURL: gateway.brokerUrl }] } }; }
function digestOf(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function sandboxName(request: StudioWorkerAdmissionRequest): string { return `${NAME_PREFIX}${request.phase}-${leaseKey(request).slice(0, 32)}`; }
function leaseKey(request: StudioWorkerAdmissionRequest): string { return digestOf(JSON.stringify([request.jobId, request.phase, request.idempotencyKey])); }
function isOwnedExpired(record: VercelSandboxRecord, now: number): boolean { return record.name.startsWith(NAME_PREFIX) && record.tags["shipglows"] === TAGS.shipglows && record.tags["lifecycle"] === TAGS.lifecycle && Number.isFinite(Date.parse(record.expiresAt)) && Date.parse(record.expiresAt) <= now; }
