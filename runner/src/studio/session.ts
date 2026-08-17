import { createHash, randomUUID } from "node:crypto";

import { STUDIO_CONTRACT_VERSION, STUDIO_LIMITS, StudioContractError, parseVisualCommand, studioBridgeMessageBytes, type CompileIntent, type StudioDimension, type StudioState, type VisualCommand } from "./contracts.js";
import type { StudioActorProject, StudioCapabilityAdmission, StudioCapabilityResolver } from "./capability.js";
import { StudioCompileAdmissionError, type StudioCompileAdmissionService } from "./workerProvider.js";

export type LaboratoryMode = "studio" | "recommended" | "active";

export interface StudioVariantProjection {
  readonly variantId: string;
  readonly name: string;
  readonly commandCount: number;
  readonly commandRevision: number;
}

export interface StudioSessionProjection {
  readonly contractVersion: typeof STUDIO_CONTRACT_VERSION;
  readonly sessionId: string;
  readonly projectId: string;
  readonly profileId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly state: StudioState;
  readonly revision: number;
  readonly commandCount: number;
  readonly undoCursor: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly variants: readonly StudioVariantProjection[];
  readonly activeVariantId: string | null;
  readonly laboratory: { readonly mode: LaboratoryMode; readonly reasons: readonly string[] };
  readonly idleExpiresAt: string;
  readonly absoluteExpiresAt: string;
  readonly cleanupState: "active" | "pending" | "cleaned" | "quarantined";
  readonly compileIntent: CompileIntent | null;
}

export interface StudioSessionEvent {
  readonly sequence: number;
  readonly type: "session.created" | "command.applied" | "journal.undo" | "journal.redo" | "variant.created" | "variant.selected" | "variant.deleted" | "compile.admitted" | "compile.failed" | "session.interrupted" | "session.closed";
  readonly revision: number;
  readonly occurredAt: string;
  readonly summary: Readonly<Record<string, string | number | boolean | null>>;
}

export class StudioSessionError extends Error {
  constructor(
    readonly statusCode: 400 | 403 | 404 | 409 | 410 | 429 | 503,
    readonly code: "studioUnavailable" | "studioSessionNotFound" | "studioSessionForbidden" | "studioSessionExpired" | "studioConflict" | "studioLimitExceeded" | "studioInvalidCommand" | "studioCompileUnavailable",
    message: string,
  ) {
    super(message);
    this.name = "StudioSessionError";
  }
}

interface StoredVariant extends StudioVariantProjection {
  readonly commands: readonly VisualCommand[];
  readonly undoCursor: number;
}
interface StoredSession {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly projectId: string;
  readonly admission: StudioCapabilityAdmission;
  state: StudioState;
  revision: number;
  commands: VisualCommand[];
  undoCursor: number;
  variants: StoredVariant[];
  activeVariantId: string | null;
  laboratory: { mode: LaboratoryMode; reasons: string[] };
  touchedAt: number;
  idleExpiresAt: number;
  readonly absoluteExpiresAt: number;
  cleanupState: "active" | "pending" | "cleaned" | "quarantined";
  compileIntent: CompileIntent | null;
  compilePayloadHash: string | null;
  readonly idempotency: Map<string, { readonly payloadHash: string; readonly projection: StudioSessionProjection }>;
  readonly events: StudioSessionEvent[];
}

export class StudioSessionService {
  readonly #sessions = new Map<string, StoredSession>();
  readonly #creationIdempotency = new Map<string, { readonly payloadHash: string; readonly sessionId: string }>();
  readonly #locks = new Map<string, Promise<void>>();

  constructor(
    private readonly capability: StudioCapabilityResolver,
    private readonly compileAdmission?: StudioCompileAdmissionService,
    private readonly now: () => Date = () => new Date(),
    private readonly id: () => string = () => randomUUID().replaceAll("-", ""),
  ) {}

  async create(actor: StudioActorProject, idempotencyKey: string): Promise<StudioSessionProjection> {
    assertOpaque(idempotencyKey, "Idempotency key");
    const key = `${actor.tenantId}:${actor.userId}:${actor.projectId}:${idempotencyKey}`;
    const payloadHash = digest({ projectId: actor.projectId });
    const replay = this.#creationIdempotency.get(key);
    if (replay !== undefined) {
      if (replay.payloadHash !== payloadHash) throw conflict("Idempotency key was reused with different session input.");
      return this.get(actor, replay.sessionId);
    }
    return this.withLock(`create:${key}`, async () => {
      const lockedReplay = this.#creationIdempotency.get(key);
      if (lockedReplay !== undefined) {
        if (lockedReplay.payloadHash !== payloadHash) throw conflict("Idempotency key was reused with different session input.");
        return this.get(actor, lockedReplay.sessionId);
      }
      let admission: StudioCapabilityAdmission | null | undefined;
      try { admission = await this.capability.admit?.(actor); } catch {
        throw new StudioSessionError(503, "studioUnavailable", "Studio capability admission is temporarily unavailable.");
      }
      if (admission === undefined || admission === null) throw new StudioSessionError(503, "studioUnavailable", "Studio capability admission is unavailable.");
      const current = this.now().getTime();
      const sessionId = `ses_${this.id().slice(0, 32)}`;
      const initialVariantId = `var_${this.id().slice(0, 24)}`;
      const session: StoredSession = {
        sessionId,
        tenantId: actor.tenantId,
        userId: actor.userId,
        projectId: actor.projectId,
        admission,
        state: "ready",
        revision: 0,
        commands: [],
        undoCursor: 0,
        variants: [{ variantId: initialVariantId, name: "Version 1", commandCount: 0, commandRevision: 0, commands: [], undoCursor: 0 }],
        activeVariantId: initialVariantId,
        laboratory: { mode: "studio", reasons: [] },
        touchedAt: current,
        idleExpiresAt: current + STUDIO_LIMITS.idleTimeoutSeconds * 1000,
        absoluteExpiresAt: current + STUDIO_LIMITS.absoluteTimeoutSeconds * 1000,
        cleanupState: "active",
        compileIntent: null,
        compilePayloadHash: null,
        idempotency: new Map(),
        events: [],
      };
      this.#sessions.set(sessionId, session);
      this.#creationIdempotency.set(key, { payloadHash, sessionId });
      this.addEvent(session, "session.created", { projectId: actor.projectId });
      return project(session);
    });
  }

  get(actor: StudioActorProject, sessionId: string): StudioSessionProjection {
    const session = this.owned(actor, sessionId);
    this.ensureActive(session);
    this.touch(session);
    return project(session);
  }

  events(actor: StudioActorProject, sessionId: string, after = 0): readonly StudioSessionEvent[] {
    const session = this.owned(actor, sessionId);
    this.ensureActive(session);
    if (!Number.isSafeInteger(after) || after < 0) throw new StudioSessionError(400, "studioInvalidCommand", "Event cursor is invalid.");
    this.touch(session);
    return session.events.filter((event) => event.sequence > after);
  }

  async applyCommand(actor: StudioActorProject, sessionId: string, raw: unknown): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      this.ensureEditable(session);
      let command: VisualCommand;
      try { command = parseVisualCommand(raw); } catch (error) {
        throw new StudioSessionError(400, "studioInvalidCommand", error instanceof StudioContractError ? error.message : "Studio command is invalid.");
      }
      const payloadHash = digest(command);
      const replay = session.idempotency.get(command.idempotencyKey);
      if (replay !== undefined) {
        if (replay.payloadHash !== payloadHash) throw conflict("Idempotency key was reused with a different command.");
        return replay.projection;
      }
      if (command.sessionId !== sessionId || command.provenance.actorType !== "operator" || command.provenance.actorId !== "operator" || command.revision !== session.revision + 1) throw conflict("Studio command ownership or revision is stale.");
      const target = session.admission.projection.surfaces.find((surface) => surface.id === command.affectedRuntimeNodeIds[0]);
      if (target === undefined) throw new StudioSessionError(400, "studioInvalidCommand", "Studio command references an unknown runtime node.");
      if (!target.capabilities.includes(command.kind)) throw new StudioSessionError(400, "studioInvalidCommand", "Studio command is not admitted for this surface.");
      const protectedSurfaceDimensions: readonly StudioDimension[] = target.protectedDimensions;
      if (command.affectedDimensions.some((dimension) => protectedSurfaceDimensions.includes(dimension))) throw new StudioSessionError(409, "studioConflict", "Studio command affects a protected surface dimension.");
      if (command.requiredUnprotectedDimensions.some((dimension) => protectedSurfaceDimensions.includes(dimension))) throw new StudioSessionError(409, "studioConflict", "Studio command requires a protected surface dimension.");
      const active = session.commands.slice(0, session.undoCursor);
      const previous = active.at(-1);
      const compacted = command.compactionKey !== undefined && previous?.compactionKey === command.compactionKey && previous.kind === command.kind && sameNodes(previous, command);
      if (compacted) active[active.length - 1] = command;
      else active.push(command);
      if (active.length > STUDIO_LIMITS.maxCommandsPerVariant) throw new StudioSessionError(429, "studioLimitExceeded", "Studio command limit was reached.");
      const bridgeEnvelope = { version: "shipglows.studio.bridge.v1", type: "studio.commands", channelId: "x".repeat(128), revision: command.revision, commands: active };
      if (studioBridgeMessageBytes(bridgeEnvelope) > STUDIO_LIMITS.maxBridgeMessageBytes) throw new StudioSessionError(429, "studioLimitExceeded", "Studio command journal exceeds the bridge message limit.");
      session.commands = active;
      session.undoCursor = active.length;
      session.revision = command.revision;
      this.syncActiveVariant(session);
      this.touch(session);
      session.laboratory = evaluateLaboratory(active);
      session.state = session.laboratory.mode === "active" ? "laboratory" : "previewing";
      this.addEvent(session, "command.applied", { commandId: command.commandId, kind: command.kind, compacted });
      const result = project(session);
      session.idempotency.set(command.idempotencyKey, { payloadHash, projection: result });
      return result;
    });
  }

  async undo(actor: StudioActorProject, sessionId: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.journalMove(actor, sessionId, idempotencyKey, "undo");
  }

  async redo(actor: StudioActorProject, sessionId: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.journalMove(actor, sessionId, idempotencyKey, "redo");
  }

  async createVariant(actor: StudioActorProject, sessionId: string, name: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      this.ensureEditable(session);
      if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$/.test(name)) throw new StudioSessionError(400, "studioInvalidCommand", "Variant name is invalid.");
      return this.idempotent(session, idempotencyKey, { action: "createVariant", name }, () => {
        if (session.variants.length >= STUDIO_LIMITS.maxVariants) throw new StudioSessionError(429, "studioLimitExceeded", "Studio variant limit was reached.");
        session.revision += 1;
        const variant: StoredVariant = { variantId: `var_${this.id().slice(0, 24)}`, name, commandCount: session.commands.length, commandRevision: session.revision, commands: [...session.commands], undoCursor: session.undoCursor };
        session.variants.push(variant);
        session.activeVariantId = variant.variantId;
        session.state = "laboratory";
        session.laboratory = { mode: "active", reasons: [...new Set([...session.laboratory.reasons, "manualVariant"])] };
        this.addEvent(session, "variant.created", { variantId: variant.variantId, name });
      });
    });
  }

  async selectVariant(actor: StudioActorProject, sessionId: string, variantId: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      this.ensureEditable(session);
      return this.idempotent(session, idempotencyKey, { action: "selectVariant", variantId }, () => {
        const variant = session.variants.find((item) => item.variantId === variantId);
        if (variant === undefined) throw new StudioSessionError(404, "studioSessionNotFound", "Studio variant was not found.");
        session.activeVariantId = variant.variantId;
        session.commands = [...variant.commands];
        session.undoCursor = variant.undoCursor;
        session.state = "laboratory";
        const selectedLaboratory = evaluateLaboratory(session.commands.slice(0, session.undoCursor));
        session.laboratory = { mode: "active", reasons: [...new Set([...selectedLaboratory.reasons, "manualVariant"])] };
        session.revision += 1;
        this.addEvent(session, "variant.selected", { variantId });
      });
    });
  }

  async deleteVariant(actor: StudioActorProject, sessionId: string, variantId: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      this.ensureEditable(session);
      return this.idempotent(session, idempotencyKey, { action: "deleteVariant", variantId }, () => {
        if (session.variants.length === 1) throw conflict("The last Studio variant cannot be deleted.");
        const index = session.variants.findIndex((item) => item.variantId === variantId);
        if (index < 0) throw new StudioSessionError(404, "studioSessionNotFound", "Studio variant was not found.");
        session.variants.splice(index, 1);
        if (session.activeVariantId === variantId) {
          const fallback = session.variants.at(-1);
          session.activeVariantId = fallback?.variantId ?? null;
          session.commands = [...(fallback?.commands ?? [])];
          session.undoCursor = fallback?.undoCursor ?? 0;
          session.laboratory = evaluateLaboratory(session.commands.slice(0, session.undoCursor));
          session.state = session.laboratory.mode === "active" ? "laboratory" : session.undoCursor === 0 ? "ready" : "previewing";
        }
        session.revision += 1;
        this.addEvent(session, "variant.deleted", { variantId });
      });
    });
  }

  async compile(actor: StudioActorProject, sessionId: string, variantId: string, idempotencyKey: string): Promise<CompileIntent> {
    return this.withLock(sessionId, async () => {
      const session = this.owned(actor, sessionId);
      this.ensureActive(session);
      assertOpaque(idempotencyKey, "Idempotency key");
      const payloadHash = digest({ variantId });
      if (session.compileIntent !== null) {
        if (session.compileIntent.idempotencyKey !== idempotencyKey || session.compilePayloadHash !== payloadHash) throw conflict("This Studio session already owns a different compile attempt.");
        return session.compileIntent;
      }
      const variant = session.variants.find((item) => item.variantId === variantId);
      if (variant === undefined || session.activeVariantId !== variantId) throw conflict("The accepted active variant is required for compile admission.");
      const commands = variant.commands.slice(0, variant.undoCursor);
      if (commands.length === 0) throw conflict("The accepted active variant must contain at least one semantic command.");
      let currentAdmission: StudioCapabilityAdmission | null | undefined;
      try { currentAdmission = await this.capability.admit?.(actor); } catch {
        throw new StudioSessionError(503, "studioCompileUnavailable", "Studio base attestation is temporarily unavailable.");
      }
      if (currentAdmission?.projection.sourceRevision !== session.admission.projection.sourceRevision || currentAdmission.projection.repositoryDigest !== session.admission.projection.repositoryDigest) {
        session.state = "conflict";
        throw conflict("Studio base revision changed; a new session is required.");
      }
      const intent: CompileIntent = Object.freeze({
        schemaVersion: STUDIO_CONTRACT_VERSION,
        intentId: `int_${this.id().slice(0, 24)}`,
        sessionId,
        variantId,
        frozenCommandRevision: variant.commandRevision,
        sourceCommit: session.admission.projection.sourceRevision,
        repositoryDigest: session.admission.projection.repositoryDigest,
        adapterVersion: session.admission.adapterVersion,
        capabilityVersion: session.admission.capabilityVersion,
        affectedSurfaceIds: [...new Set(commands.flatMap((command) => command.affectedRuntimeNodeIds))].sort(),
        affectedDimensions: [...new Set(commands.flatMap((command) => command.affectedDimensions))].sort(),
        predictedImpactPaths: [...session.admission.allowedImpactPaths],
        requiredEvidence: [...session.admission.requiredEvidence],
        actorId: actor.userId,
        idempotencyKey,
        createdAt: this.now().toISOString(),
        status: "preflight",
      });
      session.compileIntent = intent;
      session.compilePayloadHash = payloadHash;
      session.state = "compiling";
      session.revision += 1;
      this.touch(session);
      if (this.compileAdmission === undefined) {
        session.compileIntent = Object.freeze({ ...intent, status: "failed" });
        session.state = "failed";
        this.addEvent(session, "compile.failed", { code: "workerUnavailable" });
        return session.compileIntent;
      }
      try {
        await this.compileAdmission.admit({ tenantId: actor.tenantId, projectId: actor.projectId, actorId: actor.userId, intent });
        session.compileIntent = Object.freeze({ ...intent, status: "accepted" });
        this.addEvent(session, "compile.admitted", { intentId: intent.intentId });
        return session.compileIntent;
      } catch (error) {
        session.compileIntent = Object.freeze({ ...intent, status: "failed" });
        session.state = "failed";
        this.addEvent(session, "compile.failed", { code: error instanceof StudioCompileAdmissionError ? error.code : "workerUnavailable" });
        return session.compileIntent;
      }
    });
  }

  async interrupt(actor: StudioActorProject, sessionId: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      return this.idempotent(session, idempotencyKey, { action: "interrupt" }, () => {
        if (["closed", "verified"].includes(session.state)) throw conflict("Studio session cannot be interrupted from its current state.");
        session.state = "interrupted";
        session.revision += 1;
        session.cleanupState = "pending";
        this.addEvent(session, "session.interrupted", { reason: "operator" });
      });
    });
  }

  async close(actor: StudioActorProject, sessionId: string, idempotencyKey: string): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      return this.idempotent(session, idempotencyKey, { action: "close" }, () => {
        session.state = "closed";
        session.revision += 1;
        session.commands = [];
        session.variants = [];
        session.activeVariantId = null;
        session.cleanupState = "cleaned";
        this.addEvent(session, "session.closed", {});
      });
    });
  }

  private async journalMove(actor: StudioActorProject, sessionId: string, idempotencyKey: string, direction: "undo" | "redo"): Promise<StudioSessionProjection> {
    return this.withLock(sessionId, () => {
      const session = this.owned(actor, sessionId);
      this.ensureEditable(session);
      return this.idempotent(session, idempotencyKey, { action: direction }, () => {
        const next = direction === "undo" ? session.undoCursor - 1 : session.undoCursor + 1;
        if (next < 0 || next > session.commands.length) throw conflict(`Studio journal cannot ${direction}.`);
        session.undoCursor = next;
        session.revision += 1;
        this.syncActiveVariant(session);
        session.laboratory = evaluateLaboratory(session.commands.slice(0, next));
        session.state = session.laboratory.mode === "active" ? "laboratory" : next === 0 ? "ready" : "previewing";
        this.addEvent(session, direction === "undo" ? "journal.undo" : "journal.redo", { cursor: next });
      });
    });
  }

  private idempotent(session: StoredSession, idempotencyKey: string, payload: unknown, action: () => void): StudioSessionProjection {
    assertOpaque(idempotencyKey, "Idempotency key");
    const payloadHash = digest(payload);
    const replay = session.idempotency.get(idempotencyKey);
    if (replay !== undefined) {
      if (replay.payloadHash !== payloadHash) throw conflict("Idempotency key was reused with different input.");
      return replay.projection;
    }
    action();
    this.touch(session);
    const result = project(session);
    session.idempotency.set(idempotencyKey, { payloadHash, projection: result });
    return result;
  }

  private owned(actor: StudioActorProject, sessionId: string): StoredSession {
    const session = this.#sessions.get(sessionId);
    if (session === undefined) throw new StudioSessionError(404, "studioSessionNotFound", "Studio session was not found.");
    if (session.tenantId !== actor.tenantId || session.userId !== actor.userId || session.projectId !== actor.projectId) throw new StudioSessionError(403, "studioSessionForbidden", "Studio session does not belong to this actor and project.");
    return session;
  }

  private ensureActive(session: StoredSession): void {
    const current = this.now().getTime();
    if (current >= session.idleExpiresAt || current >= session.absoluteExpiresAt) {
      session.state = "interrupted";
      session.cleanupState = "pending";
      throw new StudioSessionError(410, "studioSessionExpired", "Studio session expired and requires a fresh capability admission.");
    }
    if (session.state === "closed") throw new StudioSessionError(410, "studioSessionExpired", "Studio session is closed.");
  }

  private ensureEditable(session: StoredSession): void {
    this.ensureActive(session);
    if (["compiling", "verifying", "verified", "failed", "conflict", "interrupted"].includes(session.state)) throw conflict("Studio session is not editable in its current state.");
  }

  private touch(session: StoredSession): void {
    const current = this.now().getTime();
    session.touchedAt = current;
    session.idleExpiresAt = Math.min(current + STUDIO_LIMITS.idleTimeoutSeconds * 1000, session.absoluteExpiresAt);
  }

  private syncActiveVariant(session: StoredSession): void {
    const index = session.variants.findIndex((variant) => variant.variantId === session.activeVariantId);
    if (index < 0) throw conflict("Studio session has no active variant.");
    const current = session.variants.at(index);
    if (current === undefined) throw conflict("Studio session has no active variant.");
    session.variants[index] = {
      variantId: current.variantId,
      name: current.name,
      commandCount: session.commands.length,
      commandRevision: session.revision,
      commands: [...session.commands],
      undoCursor: session.undoCursor,
    };
  }

  private addEvent(session: StoredSession, type: StudioSessionEvent["type"], summary: StudioSessionEvent["summary"]): void {
    session.events.push({ sequence: session.events.length + 1, type, revision: session.revision, occurredAt: this.now().toISOString(), summary });
  }

  private async withLock<T>(sessionId: string, operation: () => T | Promise<T>): Promise<T> {
    const previous = this.#locks.get(sessionId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    const queued = previous.then(() => current);
    this.#locks.set(sessionId, queued);
    await previous;
    try { return await operation(); } finally {
      release();
      if (this.#locks.get(sessionId) === queued) this.#locks.delete(sessionId);
    }
  }
}

function evaluateLaboratory(commands: readonly VisualCommand[]): { mode: LaboratoryMode; reasons: string[] } {
  const hard = new Set<string>();
  if (commands.some((command) => command.affectedDimensions.includes("structure") || command.kind === "layout.reorder")) hard.add("structuralChange");
  if (commands.some((command) => command.affectedDimensions.includes("motion") || command.kind.startsWith("motion."))) hard.add("motionChange");
  if (commands.some((command) => command.kind === "state.set")) hard.add("interactionState");
  if (hard.size > 0) return { mode: "active", reasons: [...hard] };
  const soft: string[] = [];
  if (new Set(commands.flatMap((command) => command.affectedRuntimeNodeIds)).size > 3) soft.push("manySurfaces");
  if (commands.length > 5) soft.push("manyCommands");
  return { mode: soft.length >= 2 ? "recommended" : "studio", reasons: soft };
}

function project(session: StoredSession): StudioSessionProjection {
  return {
    contractVersion: STUDIO_CONTRACT_VERSION,
    sessionId: session.sessionId,
    projectId: session.projectId,
    profileId: session.admission.projection.profileId,
    sourceRevision: session.admission.projection.sourceRevision,
    repositoryDigest: session.admission.projection.repositoryDigest,
    state: session.state,
    revision: session.revision,
    commandCount: session.commands.length,
    undoCursor: session.undoCursor,
    canUndo: session.undoCursor > 0,
    canRedo: session.undoCursor < session.commands.length,
    variants: session.variants.map(({ variantId, name, commandCount, commandRevision }) => ({ variantId, name, commandCount, commandRevision })),
    activeVariantId: session.activeVariantId,
    laboratory: { mode: session.laboratory.mode, reasons: [...session.laboratory.reasons] },
    idleExpiresAt: new Date(session.idleExpiresAt).toISOString(),
    absoluteExpiresAt: new Date(session.absoluteExpiresAt).toISOString(),
    cleanupState: session.cleanupState,
    compileIntent: session.compileIntent,
  };
}

function assertOpaque(value: string, label: string): void {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value)) throw new StudioSessionError(400, "studioInvalidCommand", `${label} is invalid.`);
}

function digest(value: unknown): string { return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex"); }
function sameNodes(left: VisualCommand, right: VisualCommand): boolean { return left.affectedRuntimeNodeIds.length === right.affectedRuntimeNodeIds.length && left.affectedRuntimeNodeIds.every((item, index) => item === right.affectedRuntimeNodeIds[index]); }
function conflict(message: string): StudioSessionError { return new StudioSessionError(409, "studioConflict", message); }
