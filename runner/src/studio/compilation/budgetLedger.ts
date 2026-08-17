import { canonicalJsonDigest } from "./canonicalManifest.js";

export const PILOT_COMPILATION_BUDGET = Object.freeze({
  schemaVersion: "compilation-budget-v1",
  providerControlCallsMax: 32,
  providerControlWindowMs: 900000,
  sandboxCreationsMax: 1,
  preCreateRetriesMax: 1,
  globalLiveConcurrencyMax: 2,
  tenantLiveConcurrencyMax: 1,
  projectLiveConcurrencyMax: 1,
  vcpusMax: 4,
  memoryBytesMax: 8589934592,
  diskBytesMax: 21474836480,
  processesMax: 256,
  durationMsMax: 600000,
  stdoutBytesMax: 1048576,
  stderrBytesMax: 1048576,
  sourceFilesMax: 4096,
  sourceOrdinaryFileBytesMax: 2097152,
  sourceAssetFileBytesMax: 16777216,
  sourceTotalBytesMax: 67108864,
  artifactFilesMax: 4096,
  artifactFileBytesMax: 16777216,
  artifactTotalBytesMax: 134217728,
  ingressBytesMax: 67108864,
  egressBytesMax: 134217728,
  vcrImageBytesMax: 16106127360,
  chantierVcrStorageGbMonthMax: "10.000000",
  persistentBytesMax: 0,
  snapshotBytesMax: 0,
  portsMax: 0,
  chantierSpendEurMax: "5.000000",
  ledgerExpiresAt: null,
});
export type CompilationBudgetV1 = typeof PILOT_COMPILATION_BUDGET;
export interface LedgerReservationV1 {
  readonly schemaVersion: "ledger-reservation-v1";
  readonly reservationId: string;
  readonly chantierId: "shipglows-linux-compilation-workers";
  readonly jobId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly attempt: 0 | 1;
  readonly dimensions: CompilationBudgetV1;
  readonly reservedEur: string;
  readonly ecbRateDate: string;
  readonly ecbEurUsdRate: string;
  readonly ecbEvidenceDigest: string;
  readonly contingencyBasisPoints: 1000;
  readonly state:
    "reserved" | "partiallyCharged" | "settled" | "retained" | "retired";
  readonly retryEvidenceDigest: string | null;
  readonly cleanupEvidenceDigest: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string | null;
}
export interface ProviderUsageReceiptV1 {
  readonly schemaVersion: "provider-usage-receipt-v1";
  readonly receiptId: string;
  readonly provider: "vercel_sandbox";
  readonly providerReceiptDigest: string;
  readonly reservationId: string;
  readonly jobId: string;
  readonly providerResourceIdDigest: string;
  readonly activeCpuMs: number;
  readonly provisionedMemoryByteMs: number;
  readonly creationCount: 0 | 1;
  readonly controlCallCount: number;
  readonly durationMs: number;
  readonly peakMemoryBytes: number;
  readonly diskBytes: number;
  readonly processCount: number;
  readonly stdoutBytes: number;
  readonly stderrBytes: number;
  readonly ingressBytes: number;
  readonly sourceFileCount: number;
  readonly artifactFileCount: number;
  readonly vcrImageBytes: number;
  readonly vcrStorageByteMs: number;
  readonly snapshotStorageByteMs: 0;
  readonly egressBytes: number;
  readonly rawUsd: string;
  readonly convertedEur: string;
  readonly contingencyEur: string;
  readonly observedAt: string;
  readonly final: boolean;
  readonly receiptDigest: string;
}
export interface ChantierSpendLedgerV1 {
  readonly schemaVersion: "chantier-spend-ledger-v1";
  readonly chantierId: "shipglows-linux-compilation-workers";
  readonly currency: "EUR";
  readonly ceilingEur: "5.000000";
  readonly reservationIds: readonly string[];
  readonly receiptIds: readonly string[];
  readonly reservedEur: string;
  readonly chargedEur: string;
  readonly remainingEur: string;
  readonly uncertain: boolean;
  readonly quarantinedJobIds: readonly string[];
  readonly recordsDigest: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string | null;
  readonly ledgerDigest: string;
}
export interface DurableCompilationLedgerSnapshotV1 {
  readonly revision: number;
  readonly ledger: ChantierSpendLedgerV1;
  readonly reservations: readonly LedgerReservationV1[];
  readonly receipts: readonly ProviderUsageReceiptV1[];
  readonly liveReservationIds: readonly string[];
  readonly createObservedJobIds: readonly string[];
}

const budgetKeys = Object.keys(PILOT_COMPILATION_BUDGET);
const reservationKeys = [
  "schemaVersion",
  "reservationId",
  "chantierId",
  "jobId",
  "tenantId",
  "projectId",
  "attempt",
  "dimensions",
  "reservedEur",
  "ecbRateDate",
  "ecbEurUsdRate",
  "ecbEvidenceDigest",
  "contingencyBasisPoints",
  "state",
  "retryEvidenceDigest",
  "cleanupEvidenceDigest",
  "createdAt",
  "updatedAt",
  "expiresAt",
];
const receiptKeys = [
  "schemaVersion",
  "receiptId",
  "provider",
  "providerReceiptDigest",
  "reservationId",
  "jobId",
  "providerResourceIdDigest",
  "activeCpuMs",
  "provisionedMemoryByteMs",
  "creationCount",
  "controlCallCount",
  "durationMs",
  "peakMemoryBytes",
  "diskBytes",
  "processCount",
  "stdoutBytes",
  "stderrBytes",
  "ingressBytes",
  "sourceFileCount",
  "artifactFileCount",
  "vcrImageBytes",
  "vcrStorageByteMs",
  "snapshotStorageByteMs",
  "egressBytes",
  "rawUsd",
  "convertedEur",
  "contingencyEur",
  "observedAt",
  "final",
  "receiptDigest",
];
const ledgerKeys = [
  "schemaVersion",
  "chantierId",
  "currency",
  "ceilingEur",
  "reservationIds",
  "receiptIds",
  "reservedEur",
  "chargedEur",
  "remainingEur",
  "uncertain",
  "quarantinedJobIds",
  "recordsDigest",
  "createdAt",
  "updatedAt",
  "expiresAt",
  "ledgerDigest",
];

export function validateCompilationBudget(value: unknown): CompilationBudgetV1 {
  if (
    !object(value) ||
    !exact(value, budgetKeys) ||
    JSON.stringify(value) !== JSON.stringify(PILOT_COMPILATION_BUDGET)
  )
    throw new Error("Compilation budget is invalid.");
  return PILOT_COMPILATION_BUDGET;
}
export function validateLedgerReservation(
  value: LedgerReservationV1,
): LedgerReservationV1 {
  const runtime = value as unknown as Record<string, unknown>;
  if (
    !exact(value, reservationKeys) ||
    runtime["schemaVersion"] !== "ledger-reservation-v1" ||
    runtime["chantierId"] !== "shipglows-linux-compilation-workers" ||
    ![value.reservationId, value.jobId, value.tenantId, value.projectId].every(
      id,
    ) ||
    !Number.isSafeInteger(value.attempt) ||
    value.attempt < 0 ||
    value.attempt > 1 ||
    runtime["contingencyBasisPoints"] !== 1000 ||
    !(
      [
        "reserved",
        "partiallyCharged",
        "settled",
        "retained",
        "retired",
      ] as const
    ).includes(value.state) ||
    !(
      value.retryEvidenceDigest === null || digest(value.retryEvidenceDigest)
    ) ||
    !(
      value.cleanupEvidenceDigest === null ||
      digest(value.cleanupEvidenceDigest)
    ) ||
    (value.state === "retired") !== (value.retryEvidenceDigest !== null) ||
    (value.cleanupEvidenceDigest !== null && value.state !== "settled") ||
    !timestamp(value.createdAt) ||
    !timestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
    (value.expiresAt !== null && !timestamp(value.expiresAt)) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.ecbRateDate) ||
    positiveFixed(value.ecbEurUsdRate) <= 0 ||
    !digest(value.ecbEvidenceDigest)
  )
    throw new Error("Reservation invalid.");
  validateCompilationBudget(value.dimensions);
  fixed(value.reservedEur);
  return deepFreeze({ ...value, dimensions: PILOT_COMPILATION_BUDGET });
}
export function validateProviderUsageReceipt(
  value: ProviderUsageReceiptV1,
): ProviderUsageReceiptV1 {
  const runtime = value as unknown as Record<string, unknown>,
    numbers = [
      value.activeCpuMs,
      value.provisionedMemoryByteMs,
      value.creationCount,
      value.controlCallCount,
      value.durationMs,
      value.peakMemoryBytes,
      value.diskBytes,
      value.processCount,
      value.stdoutBytes,
      value.stderrBytes,
      value.ingressBytes,
      value.sourceFileCount,
      value.artifactFileCount,
      value.vcrImageBytes,
      value.vcrStorageByteMs,
      value.snapshotStorageByteMs,
      value.egressBytes,
    ];
  if (
    !exact(value, receiptKeys) ||
    runtime["schemaVersion"] !== "provider-usage-receipt-v1" ||
    runtime["provider"] !== "vercel_sandbox" ||
    ![value.receiptId, value.reservationId, value.jobId].every(id) ||
    ![value.providerReceiptDigest, value.providerResourceIdDigest].every(
      digest,
    ) ||
    !numbers.every(nonnegative) ||
    value.creationCount !== 1 ||
    value.controlCallCount > 32 ||
    value.durationMs > 600000 ||
    value.activeCpuMs > value.durationMs * 4 ||
    value.peakMemoryBytes > 8589934592 ||
    value.provisionedMemoryByteMs > value.durationMs * 8589934592 ||
    value.diskBytes > 21474836480 ||
    value.processCount > 256 ||
    value.stdoutBytes > 1048576 ||
    value.stderrBytes > 1048576 ||
    value.ingressBytes > 67108864 ||
    value.sourceFileCount > 4096 ||
    value.artifactFileCount > 4096 ||
    value.vcrImageBytes > 16106127360 ||
    value.vcrStorageByteMs > 10737418240 * 600000 ||
    runtime["snapshotStorageByteMs"] !== 0 ||
    value.egressBytes > 134217728 ||
    !value.final ||
    !timestamp(value.observedAt) ||
    value.receiptDigest !== selfDigest(value, "receiptDigest")
  )
    throw new Error("Receipt invalid.");
  money(value.rawUsd);
  fixed(value.convertedEur);
  fixed(value.contingencyEur);
  return deepFreeze({ ...value });
}
export function validateChantierSpendLedger(
  value: ChantierSpendLedgerV1,
): ChantierSpendLedgerV1 {
  const runtime = value as unknown as Record<string, unknown>;
  if (
    !exact(value, ledgerKeys) ||
    runtime["schemaVersion"] !== "chantier-spend-ledger-v1" ||
    runtime["chantierId"] !== "shipglows-linux-compilation-workers" ||
    runtime["currency"] !== "EUR" ||
    runtime["ceilingEur"] !== "5.000000" ||
    !digest(value.recordsDigest) ||
    value.ledgerDigest !== selfDigest(value, "ledgerDigest") ||
    !sorted(value.reservationIds) ||
    !sorted(value.receiptIds) ||
    !sorted(value.quarantinedJobIds) ||
    ![
      ...value.reservationIds,
      ...value.receiptIds,
      ...value.quarantinedJobIds,
    ].every(id) ||
    typeof value.uncertain !== "boolean" ||
    !timestamp(value.createdAt) ||
    !timestamp(value.updatedAt) ||
    (value.expiresAt !== null && !timestamp(value.expiresAt)) ||
    fixed(value.reservedEur) > 5000000 ||
    fixed(value.chargedEur) > 5000000 ||
    fixed(value.remainingEur) !==
      5000000 - Math.max(fixed(value.reservedEur), fixed(value.chargedEur))
  )
    throw new Error("Ledger invalid.");
  return deepFreeze({
    ...value,
    reservationIds: [...value.reservationIds],
    receiptIds: [...value.receiptIds],
    quarantinedJobIds: [...value.quarantinedJobIds],
  });
}

export class CompilationBudgetLedger {
  #revision = 0;
  readonly #reservations = new Map<string, LedgerReservationV1>();
  readonly #receipts = new Map<string, ProviderUsageReceiptV1>();
  readonly #live = new Set<string>();
  readonly #created = new Set<string>();
  readonly #quarantined = new Set<string>();
  #createdAt: string;
  #updatedAt: string;
  #uncertain = false;
  constructor(now = new Date()) {
    this.#createdAt = stamp(now);
    this.#updatedAt = this.#createdAt;
  }
  reserve(
    value: LedgerReservationV1,
    expectedRevision: number,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    this.#cas(expectedRevision);
    const reservation = validateLedgerReservation(value),
      existing = this.#reservations.get(reservation.reservationId);
    if (existing !== undefined) {
      if (JSON.stringify(existing) !== JSON.stringify(reservation))
        throw new Error("Compilation budget unavailable.");
      return this.snapshot();
    }
    this.#freshRate(reservation, now);
    if (
      reservation.state !== "reserved" ||
      (this.#created.has(reservation.jobId) && reservation.attempt > 0)
    )
      throw new Error("Compilation budget unavailable.");
    const sameJob = [...this.#reservations.values()].filter(
      (item) => item.jobId === reservation.jobId,
    );
    if (
      sameJob.some((item) => item.attempt === reservation.attempt) ||
      (reservation.attempt === 1 &&
        (sameJob.length !== 1 || this.#created.has(reservation.jobId)))
    )
      throw new Error("Compilation budget unavailable.");
    this.#checkConcurrency(reservation);
    const total =
      [...this.#reservations.values()]
        .filter(active)
        .reduce((sum, item) => sum + fixed(item.reservedEur), 0) +
      fixed(reservation.reservedEur);
    if (total > 5000000) throw new Error("Compilation budget unavailable.");
    this.#reservations.set(reservation.reservationId, reservation);
    this.#live.add(reservation.reservationId);
    this.#bump(now);
    return this.snapshot();
  }
  retryBeforeCreate(
    retiredReservationId: string,
    retryValue: LedgerReservationV1,
    retryEvidenceDigest: string,
    expectedRevision: number,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    if (!id(retiredReservationId) || !digest(retryEvidenceDigest))
      throw new Error("Compilation budget unavailable.");
    this.#cas(expectedRevision);
    const prior = this.#requiredReservation(retiredReservationId),
      retry = validateLedgerReservation(retryValue),
      sameLineage =
        prior.jobId === retry.jobId &&
        prior.tenantId === retry.tenantId &&
        prior.projectId === retry.projectId &&
        prior.reservedEur === retry.reservedEur &&
        prior.ecbRateDate === retry.ecbRateDate &&
        prior.ecbEurUsdRate === retry.ecbEurUsdRate &&
        prior.ecbEvidenceDigest === retry.ecbEvidenceDigest &&
        JSON.stringify(prior.dimensions) === JSON.stringify(retry.dimensions);
    if (
      prior.attempt !== 0 ||
      prior.state !== "reserved" ||
      !this.#live.has(prior.reservationId) ||
      this.#created.has(prior.jobId) ||
      [...this.#receipts.values()].some(
        (item) => item.reservationId === prior.reservationId,
      ) ||
      retry.attempt !== 1 ||
      retry.state !== "reserved" ||
      retry.retryEvidenceDigest !== null ||
      retry.cleanupEvidenceDigest !== null ||
      retry.reservationId === prior.reservationId ||
      this.#reservations.has(retry.reservationId) ||
      !sameLineage ||
      [...this.#reservations.values()].some(
        (item) => item.jobId === prior.jobId && item.attempt === 1,
      )
    )
      throw new Error("Compilation budget unavailable.");
    const retired = validateLedgerReservation({
      ...prior,
      state: "retired",
      retryEvidenceDigest,
      updatedAt: stamp(now),
      expiresAt: stamp(new Date(now.getTime() + 86400000)),
    });
    this.#reservations.set(prior.reservationId, retired);
    this.#reservations.set(retry.reservationId, retry);
    this.#live.delete(prior.reservationId);
    this.#live.add(retry.reservationId);
    this.#bump(now);
    return this.snapshot();
  }
  observeCreate(
    reservationId: string,
    expectedRevision: number,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    if (!id(reservationId)) throw new Error("Compilation budget unavailable.");
    this.#cas(expectedRevision);
    const reservation = this.#requiredReservation(reservationId);
    if (this.#created.has(reservation.jobId)) return this.snapshot();
    const next = replaceReservation(reservation, "partiallyCharged", now, null);
    this.#reservations.set(reservationId, next);
    this.#created.add(reservation.jobId);
    this.#bump(now);
    return this.snapshot();
  }
  retain(
    reservationId: string,
    expectedRevision: number,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    if (!id(reservationId)) throw new Error("Compilation budget unavailable.");
    this.#cas(expectedRevision);
    const item = this.#requiredReservation(reservationId);
    if (
      !this.#live.has(reservationId) ||
      !(
        item.state === "reserved" ||
        item.state === "partiallyCharged" ||
        item.state === "retained"
      )
    )
      throw new Error("Compilation budget unavailable.");
    const next = replaceReservation(item, "retained", now, null);
    this.#reservations.set(reservationId, next);
    this.#uncertain = true;
    this.#quarantined.add(item.jobId);
    this.#bump(now);
    return this.snapshot();
  }
  settle(
    receiptValue: ProviderUsageReceiptV1,
    expectedRevision: number,
    cleanupCertain: boolean,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    if (typeof cleanupCertain !== "boolean")
      throw new Error("Compilation budget unavailable.");
    this.#cas(expectedRevision);
    const receipt = validateProviderUsageReceipt(receiptValue),
      existing = this.#receipts.get(receipt.receiptId);
    if (existing !== undefined) {
      if (JSON.stringify(existing) !== JSON.stringify(receipt))
        throw new Error("Compilation budget unavailable.");
      return this.snapshot();
    }
    const reservation = this.#requiredReservation(receipt.reservationId),
      prior = [...this.#receipts.values()].filter(
        (item) => item.reservationId === receipt.reservationId,
      ),
      observed = Date.parse(receipt.observedAt);
    if (
      reservation.state === "settled" ||
      prior.length !== 0 ||
      reservation.jobId !== receipt.jobId ||
      observed < Date.parse(reservation.createdAt) ||
      observed > now.getTime() ||
      now.getTime() - observed > 900000
    )
      throw new Error("Compilation budget unavailable.");
    this.#verifyConversion(reservation, receipt);
    const charged = [...this.#receipts.values(), receipt].reduce(
      (sum, item) => sum + fixed(item.contingencyEur),
      0,
    );
    if (charged > 5000000) throw new Error("Compilation budget exceeded.");
    const nextReservation = !cleanupCertain
      ? replaceReservation(reservation, "retained", now, null)
      : replaceReservation(
          reservation,
          "settled",
          now,
          new Date(now.getTime() + 86400000),
        );
    this.#receipts.set(receipt.receiptId, receipt);
    this.#created.add(receipt.jobId);
    this.#reservations.set(reservation.reservationId, nextReservation);
    if (!cleanupCertain) {
      this.#uncertain = true;
      this.#quarantined.add(receipt.jobId);
    } else this.#live.delete(reservation.reservationId);
    this.#bump(now);
    return this.snapshot();
  }
  release(
    reservationId: string,
    expectedRevision: number,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    if (!id(reservationId)) throw new Error("Compilation budget unavailable.");
    this.#cas(expectedRevision);
    const item = this.#requiredReservation(reservationId);
    if (item.state !== "settled" || this.#uncertain)
      throw new Error("Compilation budget unavailable.");
    this.#live.delete(reservationId);
    this.#bump(now);
    return this.snapshot();
  }
  reconcileCleanup(
    reservationId: string,
    providerResourceIdDigest: string,
    cleanupEvidenceDigest: string,
    observedAt: string,
    expectedRevision: number,
    now: Date,
  ): DurableCompilationLedgerSnapshotV1 {
    this.#validNow(now);
    if (
      !id(reservationId) ||
      !digest(providerResourceIdDigest) ||
      !digest(cleanupEvidenceDigest) ||
      !timestamp(observedAt)
    )
      throw new Error("Compilation budget unavailable.");
    this.#cas(expectedRevision);
    const item = this.#requiredReservation(reservationId),
      receipts = [...this.#receipts.values()].filter(
        (receipt) => receipt.reservationId === reservationId,
      );
    if (item.state === "settled") {
      if (
        item.cleanupEvidenceDigest === cleanupEvidenceDigest &&
        receipts.length === 1 &&
        receipts[0]?.providerResourceIdDigest === providerResourceIdDigest
      )
        return this.snapshot();
      throw new Error("Compilation budget unavailable.");
    }
    const observed = Date.parse(observedAt);
    if (
      item.state !== "retained" ||
      !this.#live.has(reservationId) ||
      !this.#uncertain ||
      receipts.length !== 1 ||
      receipts[0]?.providerResourceIdDigest !== providerResourceIdDigest ||
      observed < Date.parse(receipts[0].observedAt) ||
      observed > now.getTime() ||
      now.getTime() - observed > 900000
    )
      throw new Error("Compilation budget unavailable.");
    const settled = validateLedgerReservation({
      ...item,
      state: "settled",
      cleanupEvidenceDigest,
      updatedAt: stamp(now),
      expiresAt: stamp(new Date(now.getTime() + 86400000)),
    });
    this.#reservations.set(reservationId, settled);
    this.#live.delete(reservationId);
    this.#quarantined.delete(item.jobId);
    this.#uncertain = this.#quarantined.size > 0;
    this.#bump(now);
    return this.snapshot();
  }
  snapshot(): DurableCompilationLedgerSnapshotV1 {
    const reservations = [...this.#reservations.values()].sort(
        byId("reservationId"),
      ),
      receipts = [...this.#receipts.values()].sort(byId("receiptId"));
    const activeReserved = reservations
        .filter(active)
        .reduce((sum, item) => sum + fixed(item.reservedEur), 0),
      charged = receipts.reduce(
        (sum, item) => sum + fixed(item.contingencyEur),
        0,
      );
    const finalReceipts = receipts.filter((item) => item.final);
    const expiresAt =
        this.#uncertain ||
        this.#quarantined.size > 0 ||
        finalReceipts.length === 0
          ? null
          : stamp(
              new Date(
                Math.max(
                  ...finalReceipts.map((item) => Date.parse(item.observedAt)),
                ) + 86400000,
              ),
            ),
      recordsDigest = canonicalJsonDigest({ reservations, receipts });
    const core = {
      schemaVersion: "chantier-spend-ledger-v1" as const,
      chantierId: "shipglows-linux-compilation-workers" as const,
      currency: "EUR" as const,
      ceilingEur: "5.000000" as const,
      reservationIds: reservations.map((item) => item.reservationId),
      receiptIds: receipts.map((item) => item.receiptId),
      reservedEur: format(activeReserved),
      chargedEur: format(charged),
      remainingEur: format(5000000 - Math.max(activeReserved, charged)),
      uncertain: this.#uncertain,
      quarantinedJobIds: [...this.#quarantined].sort(),
      recordsDigest,
      createdAt: this.#createdAt,
      updatedAt: this.#updatedAt,
      expiresAt,
    };
    const ledger = validateChantierSpendLedger({
      ...core,
      ledgerDigest: canonicalJsonDigest(core),
    });
    return deepFreeze({
      revision: this.#revision,
      ledger,
      reservations,
      receipts,
      liveReservationIds: [...this.#live].sort(),
      createObservedJobIds: [...this.#created].sort(),
    });
  }
  static restore(
    snapshot: DurableCompilationLedgerSnapshotV1,
    expectedLedgerDigest: string,
  ): CompilationBudgetLedger {
    if (
      !digest(expectedLedgerDigest) ||
      snapshot.ledger.ledgerDigest !== expectedLedgerDigest ||
      !Number.isSafeInteger(snapshot.revision) ||
      snapshot.revision < 0
    )
      throw new Error("Ledger snapshot invalid.");
    const ledger = validateChantierSpendLedger(snapshot.ledger);
    if (
      ledger.recordsDigest !==
      canonicalJsonDigest({
        reservations: snapshot.reservations,
        receipts: snapshot.receipts,
      })
    )
      throw new Error("Ledger snapshot invalid.");
    const instance = new CompilationBudgetLedger(new Date(ledger.createdAt));
    instance.#revision = snapshot.revision;
    instance.#createdAt = ledger.createdAt;
    instance.#updatedAt = ledger.updatedAt;
    instance.#uncertain = ledger.uncertain;
    for (const item of snapshot.reservations) {
      const value = validateLedgerReservation(item);
      if (instance.#reservations.has(value.reservationId))
        throw new Error("Ledger snapshot invalid.");
      instance.#reservations.set(value.reservationId, value);
    }
    const receiptedReservations = new Set<string>();
    for (const item of snapshot.receipts) {
      const value = validateProviderUsageReceipt(item),
        reservation = instance.#reservations.get(value.reservationId);
      if (
        instance.#receipts.has(value.receiptId) ||
        receiptedReservations.has(value.reservationId) ||
        reservation?.jobId !== value.jobId
      )
        throw new Error("Ledger snapshot invalid.");
      instance.#receipts.set(value.receiptId, value);
      receiptedReservations.add(value.reservationId);
    }
    for (const reservation of instance.#reservations.values())
      if (
        reservation.state === "settled" &&
        !receiptedReservations.has(reservation.reservationId)
      )
        throw new Error("Ledger snapshot invalid.");
    const expectedLive = [...instance.#reservations.values()]
        .filter(active)
        .map((item) => item.reservationId)
        .sort(),
      expectedCreated = [
        ...new Set(
          [...instance.#reservations.values()]
            .filter(
              (item) =>
                item.state === "partiallyCharged" ||
                item.state === "retained" ||
                item.state === "settled",
            )
            .map((item) => item.jobId)
            .concat([...instance.#receipts.values()].map((item) => item.jobId)),
        ),
      ].sort();
    if (
      JSON.stringify(snapshot.liveReservationIds) !==
        JSON.stringify(expectedLive) ||
      JSON.stringify(snapshot.createObservedJobIds) !==
        JSON.stringify(expectedCreated)
    )
      throw new Error("Ledger snapshot invalid.");
    for (const key of expectedLive) instance.#live.add(key);
    for (const jobId of expectedCreated) instance.#created.add(jobId);
    for (const jobId of ledger.quarantinedJobIds)
      instance.#quarantined.add(jobId);
    if (JSON.stringify(instance.snapshot().ledger) !== JSON.stringify(ledger))
      throw new Error("Ledger snapshot invalid.");
    return instance;
  }
  #cas(expected: number): void {
    if (!Number.isSafeInteger(expected) || expected !== this.#revision)
      throw new Error("Compilation ledger revision conflict.");
  }
  #validNow(now: Date): void {
    if (
      !(now instanceof Date) ||
      !Number.isFinite(now.getTime()) ||
      now.getTime() < Date.parse(this.#updatedAt)
    )
      throw new Error("Compilation budget unavailable.");
  }
  #bump(now: Date): void {
    this.#revision += 1;
    this.#updatedAt = stamp(now);
  }
  #requiredReservation(value: string): LedgerReservationV1 {
    const item = this.#reservations.get(value);
    if (item === undefined) throw new Error("Compilation budget unavailable.");
    return item;
  }
  #freshRate(value: LedgerReservationV1, now: Date): void {
    const observed = Date.parse(value.ecbRateDate + "T00:00:00.000Z");
    if (
      !Number.isFinite(observed) ||
      observed > now.getTime() ||
      now.getTime() - observed > 86400000
    )
      throw new Error("Compilation budget unavailable.");
  }
  #checkConcurrency(value: LedgerReservationV1): void {
    const live = [...this.#live].map((key) => this.#requiredReservation(key));
    if (
      live.length >= 2 ||
      live.some((item) => item.tenantId === value.tenantId) ||
      live.some((item) => item.projectId === value.projectId)
    )
      throw new Error("Compilation budget unavailable.");
  }
  #verifyConversion(
    reservation: LedgerReservationV1,
    receipt: ProviderUsageReceiptV1,
  ): void {
    const raw = Number(receipt.rawUsd),
      rate = Number(reservation.ecbEurUsdRate),
      converted = round6(raw / rate),
      contingency = round6(converted * 1.1);
    if (
      receipt.convertedEur !== converted.toFixed(6) ||
      receipt.contingencyEur !== contingency.toFixed(6) ||
      fixed(receipt.contingencyEur) > fixed(reservation.reservedEur)
    )
      throw new Error("Compilation budget unavailable.");
  }
}

function replaceReservation(
  value: LedgerReservationV1,
  state: LedgerReservationV1["state"],
  now: Date,
  expiry: Date | null,
): LedgerReservationV1 {
  return validateLedgerReservation({
    ...value,
    state,
    updatedAt: stamp(now),
    expiresAt: expiry === null ? null : stamp(expiry),
  });
}
function active(value: LedgerReservationV1): boolean {
  return value.state !== "settled" && value.state !== "retired";
}
function selfDigest(value: object, key: string): string {
  return canonicalJsonDigest(
    Object.fromEntries(Object.entries(value).filter(([name]) => name !== key)),
  );
}
function exact(value: object, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return (
    actual.length === keys.length &&
    keys.every((key, index) => actual[index] === key)
  );
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function sorted(values: readonly string[]): boolean {
  return (
    values.length === new Set(values).size &&
    values.every(
      (value, index) => index === 0 || (values[index - 1] ?? "") < value,
    )
  );
}
function byId<T extends string>(key: T) {
  return (a: Record<T, string>, b: Record<T, string>) =>
    a[key].localeCompare(b[key]);
}
const opaque = /^[a-z0-9_-]{22,128}$/,
  sha = /^[a-f0-9]{64}$/;
function id(value: string): boolean {
  return opaque.test(value);
}
function digest(value: string): boolean {
  return sha.test(value);
}
function timestamp(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}
function nonnegative(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
function positiveFixed(value: string): number {
  if (!/^(?:0|[1-9]\d*)\.\d{6}$/.test(value))
    throw new Error("Compilation budget is invalid.");
  return Number(value);
}
function money(value: string): number {
  if (!/^(?:0|[1-9]\d*)\.\d{6}$/.test(value))
    throw new Error("Compilation budget is invalid.");
  const micros = Number(value.replace(".", ""));
  if (!Number.isSafeInteger(micros))
    throw new Error("Compilation budget is invalid.");
  return micros;
}
function fixed(value: string): number {
  const micros = money(value);
  if (micros > 5000000) throw new Error("Compilation budget is invalid.");
  return micros;
}
function format(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0 || value > 5000000)
    throw new Error("Compilation budget is invalid.");
  return (
    String(Math.floor(value / 1000000)) +
    "." +
    String(value % 1000000).padStart(6, "0")
  );
}
function round6(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}
function stamp(value: Date): string {
  return value.toISOString();
}
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
