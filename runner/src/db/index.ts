import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { assertSecretSafe, type ResolvedExecutionEnvelope, type SafePayload } from "../contracts/index.js";
import type { GitHubRepositoryBinding } from "../github/index.js";

export class MigrationPolicyError extends Error {}
export class RepositoryBindingError extends Error {}
export class RunStateError extends Error {}

export type RunState = "queued" | "running" | "interrupted" | "completed" | "failed";
export type RunTaskKind = "audit" | "fix" | "conversation";
export type WorkspaceCleanupState = "pending" | "completed" | "failed";
export type RuntimeSessionState = "idle" | "active" | "interrupted" | "completed" | "failed";
export type ApprovalState = "pending" | "approved" | "denied" | "expired";
export type HealthDimension = "tech" | "content" | "seo" | "performance" | "security";
export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

export interface ProjectAccessInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly projectId: string;
  readonly capability: "read" | "mutate";
}

export interface PersistedEvent {
  readonly cursor: number;
  readonly id: string;
  readonly tenantId: string;
  readonly conversationId: string;
  readonly type: string;
  readonly payload: SafePayload;
  readonly occurredAt: string;
}

export interface PersistedRun {
  readonly id: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly conversationId: string;
  readonly runtimeId: string;
  readonly executionProviderId: string;
  readonly taskKind: RunTaskKind;
  readonly state: RunState;
  readonly checkpoint: SafePayload;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PersistedExecution {
  readonly executionId: string;
  readonly tenantId: string;
  readonly runId: string;
  readonly projectId: string;
  readonly conversationId: string;
  readonly taskKind: RunTaskKind;
  readonly trigger: "manual";
  readonly runtimeId: string;
  readonly providerId: string;
  readonly requiredCapabilities: readonly string[];
  readonly maxDurationMs: number;
  readonly deadlineAt: string;
  readonly state: "pendingPreflight" | "preflightPassed" | "completed" | "interrupted" | "failed";
  readonly failureCode: string | null;
}

export interface WorkspaceCleanupRecord {
  readonly tenantId: string;
  readonly runId: string;
  readonly state: WorkspaceCleanupState;
  readonly dueAt: string;
  readonly attempts: number;
  readonly lastErrorCode: string | null;
}

export interface PersistedRuntimeSession {
  readonly id: string;
  readonly tenantId: string;
  readonly conversationId: string;
  readonly runtimeId: string;
  readonly runtimeSessionId: string;
  readonly state: RuntimeSessionState;
}

export interface PersistedCapabilityDecision {
  readonly tenantId: string;
  readonly runId: string;
  readonly runtimeId: string;
  readonly required: readonly string[];
  readonly missing: readonly string[];
  readonly accepted: boolean;
}

export interface PersistedApproval {
  readonly id: string;
  readonly tenantId: string;
  readonly runId: string;
  readonly state: ApprovalState;
  readonly requestedAt: string;
  readonly resolvedAt: string | null;
}

export interface PersistedHealthEvidence {
  readonly id: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly dimension: HealthDimension;
  readonly status: HealthStatus;
  readonly summary: SafePayload;
  readonly sourceCommit: string;
  readonly observedAt: string;
}

export interface CockpitDimensionRecord {
  readonly dimension: HealthDimension;
  readonly status: HealthStatus;
  readonly summary: SafePayload;
  readonly producer: string;
  readonly evidenceCount: number;
  readonly sourceCommit: string | null;
  readonly checkedAt: string | null;
}

export interface CockpitProjectRecord {
  readonly id: string;
  readonly name: string;
  readonly repositoryFullName: string;
  readonly accessState: "available" | "unavailable";
  readonly dimensions: readonly CockpitDimensionRecord[];
  readonly conversationCount: number;
  readonly activeRunCount: number;
}

export interface PersistedRunUsage {
  readonly tenantId: string;
  readonly runId: string;
  readonly durationMs: number;
  readonly inputUnits: number;
  readonly outputUnits: number;
  readonly estimatedCostMinor: number | null;
}

export interface OperationalStore {
  schemaVersion(): number;
  listTenantIds(): readonly string[];
  createTenant(input: { readonly id: string; readonly identityRef: string }): void;
  createUser(input: { readonly id: string; readonly authSubject: string }): void;
  addTenantUser(input: { readonly tenantId: string; readonly userId: string; readonly role: string }): void;
  createProject(input: {
    readonly id: string;
    readonly tenantId: string;
    readonly githubRepositoryId?: number;
    readonly sourceSystem?: string;
    readonly sourceProjectId?: string;
  }): void;
  bindProjectIdentity(input: {
    readonly tenantId: string;
    readonly sourceSystem: string;
    readonly sourceProjectId: string;
    readonly projectId: string;
  }): void;
  resolveProjectId(input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly sourceSystem: string;
    readonly sourceProjectId: string;
  }): string | null;
  bindGitHubRepository(input: {
    readonly tenantId: string;
    readonly projectId: string;
    readonly binding: GitHubRepositoryBinding;
  }): void;
  getGitHubRepositoryBinding(input: {
    readonly tenantId: string;
    readonly projectId: string;
  }): GitHubRepositoryBinding | undefined;
  createRun(input: {
    readonly id: string;
    readonly tenantId: string;
    readonly projectId: string;
    readonly conversationId: string;
    readonly runtimeId: string;
    readonly executionProviderId: string;
    readonly taskKind: RunTaskKind;
  }): PersistedRun;
  createExecution(input: ResolvedExecutionEnvelope): void;
  getExecution(input: { readonly tenantId: string; readonly executionId: string }): PersistedExecution | undefined;
  markExecution(input: { readonly tenantId: string; readonly executionId: string; readonly state: "preflightPassed" | "completed" | "interrupted" | "failed"; readonly failureCode?: string }): void;
  markExecutionForRun(input: { readonly tenantId: string; readonly runId: string; readonly state: "completed" | "interrupted" | "failed"; readonly failureCode?: string }): void;
  getRun(input: { readonly tenantId: string; readonly runId: string }): PersistedRun | undefined;
  getLatestRun(input: { readonly tenantId: string; readonly conversationId: string }): PersistedRun | undefined;
  checkpointRun(input: {
    readonly tenantId: string;
    readonly runId: string;
    readonly state: RunState;
    readonly checkpoint: SafePayload;
    readonly updatedAt?: string;
  }): PersistedRun;
  recoverInFlightRuns(input: { readonly occurredAt: string }): number;
  scheduleWorkspaceCleanup(input: {
    readonly tenantId: string;
    readonly runId: string;
    readonly dueAt: string;
  }): void;
  listDueWorkspaceCleanups(input: {
    readonly tenantId: string;
    readonly now: string;
    readonly limit?: number;
  }): readonly WorkspaceCleanupRecord[];
  markWorkspaceCleanup(input: {
    readonly tenantId: string;
    readonly runId: string;
    readonly state: Exclude<WorkspaceCleanupState, "pending">;
    readonly errorCode?: string;
  }): void;
  saveRuntimeSession(input: PersistedRuntimeSession): void;
  getRuntimeSession(input: {
    readonly tenantId: string;
    readonly conversationId: string;
  }): PersistedRuntimeSession | undefined;
  saveCapabilityDecision(input: PersistedCapabilityDecision): void;
  getCapabilityDecision(input: {
    readonly tenantId: string;
    readonly runId: string;
  }): PersistedCapabilityDecision | undefined;
  createApproval(input: {
    readonly id: string;
    readonly tenantId: string;
    readonly runId: string;
    readonly requestedAt: string;
  }): void;
  getApproval(input: { readonly tenantId: string; readonly approvalId: string }): PersistedApproval | undefined;
  resolveApproval(input: {
    readonly tenantId: string;
    readonly approvalId: string;
    readonly state: Exclude<ApprovalState, "pending">;
    readonly resolvedAt: string;
  }): void;
  appendHealthEvidence(input: PersistedHealthEvidence): void;
  listHealthEvidence(input: {
    readonly tenantId: string;
    readonly projectId: string;
  }): readonly PersistedHealthEvidence[];
  saveRunUsage(input: PersistedRunUsage): void;
  getRunUsage(input: { readonly tenantId: string; readonly runId: string }): PersistedRunUsage | undefined;
  grantProjectMembership(input: ProjectAccessInput): void;
  createConversation(input: {
    readonly id: string;
    readonly tenantId: string;
    readonly projectId: string;
    readonly createdBy: string;
    readonly title: string;
  }): void;
  resolveActor(input: {
    readonly subject: string;
    readonly tenantId: string;
  }): { readonly tenantId: string; readonly userId: string; readonly subject: string } | undefined;
  hasProjectAccess(input: ProjectAccessInput): boolean;
  getConversation(input: {
    readonly tenantId: string;
    readonly conversationId: string;
  }): { readonly id: string; readonly projectId: string; readonly title: string; readonly state: string } | undefined;
  listCockpitProjects(input: { readonly tenantId: string; readonly userId: string }): readonly CockpitProjectRecord[];
  listConversations(input: {
    readonly tenantId: string;
    readonly projectId: string;
  }): readonly { readonly id: string; readonly projectId: string; readonly title: string; readonly state: string }[];
  appendEvent(input: Omit<PersistedEvent, "cursor" | "occurredAt">): PersistedEvent;
  listEvents(input: {
    readonly tenantId: string;
    readonly conversationId: string;
    readonly after?: number;
    readonly limit?: number;
  }): readonly PersistedEvent[];
  executeIdempotent<T extends SafePayload>(
    input: { readonly tenantId: string; readonly actorUserId: string; readonly scope: string; readonly key: string },
    callback: () => { readonly statusCode: number; readonly body: T },
  ): { readonly replayed: boolean; readonly response: { readonly statusCode: number; readonly body: T } };
  executeIdempotentAsync<T extends SafePayload>(
    input: { readonly tenantId: string; readonly actorUserId: string; readonly scope: string; readonly key: string },
    callback: () => Promise<{ readonly statusCode: number; readonly body: T }>,
  ): Promise<{ readonly replayed: boolean; readonly response: { readonly statusCode: number; readonly body: T } }>;
  migrateDown(): never;
  close(): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readString(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`SQLite result is missing string field ${key}`);
  return value;
}

function readNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`SQLite result is missing number field ${key}`);
  }
  return value;
}

function parsePayload(serialized: string): SafePayload {
  const payload: unknown = JSON.parse(serialized);
  if (!isRecord(payload)) throw new Error("SQLite payload is not an object");
  assertSecretSafe(payload);
  return payload;
}

function oneRow(db: DatabaseSync, sql: string, ...values: SQLInputValue[]): Record<string, unknown> | undefined {
  const row: unknown = db.prepare(sql).get(...values);
  if (row === undefined) return undefined;
  if (!isRecord(row)) throw new Error("SQLite query returned an invalid row");
  return row;
}

function allRows(db: DatabaseSync, sql: string, ...values: SQLInputValue[]): readonly Record<string, unknown>[] {
  const rows: unknown = db.prepare(sql).all(...values);
  if (!Array.isArray(rows) || !rows.every(isRecord)) throw new Error("SQLite query returned invalid rows");
  return rows;
}

function run(db: DatabaseSync, sql: string, ...values: SQLInputValue[]): void {
  db.prepare(sql).run(...values);
}

function validateBinding(binding: GitHubRepositoryBinding): void {
  if (!Number.isSafeInteger(binding.installationId) || binding.installationId < 1) {
    throw new RepositoryBindingError("GitHub installation identifier is invalid.");
  }
  if (!Number.isSafeInteger(binding.repositoryId) || binding.repositoryId < 1) {
    throw new RepositoryBindingError("GitHub repository identifier is invalid.");
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(binding.fullName)) {
    throw new RepositoryBindingError("GitHub repository name is invalid.");
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(binding.defaultBranch) || binding.defaultBranch.includes("..")) {
    throw new RepositoryBindingError("GitHub default branch is invalid.");
  }
}

const runStates: readonly RunState[] = ["queued", "running", "interrupted", "completed", "failed"];
const runTaskKinds: readonly RunTaskKind[] = ["audit", "fix", "conversation"];
const cleanupStates: readonly WorkspaceCleanupState[] = ["pending", "completed", "failed"];

function isRunState(value: string): value is RunState {
  return runStates.includes(value as RunState);
}

function isRunTaskKind(value: string): value is RunTaskKind {
  return runTaskKinds.includes(value as RunTaskKind);
}

function isCleanupState(value: string): value is WorkspaceCleanupState {
  return cleanupStates.includes(value as WorkspaceCleanupState);
}

function validateTimestamp(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value))) throw new RunStateError(`${label} must be an ISO timestamp.`);
}

function validateOpaqueValue(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) {
    throw new RunStateError(`${label} is invalid.`);
  }
}

function readRun(row: Record<string, unknown>): PersistedRun {
  const state = readString(row, "state");
  const taskKind = readString(row, "taskKind");
  if (!isRunState(state) || !isRunTaskKind(taskKind)) throw new RunStateError("SQLite run state is invalid.");
  return {
    id: readString(row, "id"),
    tenantId: readString(row, "tenantId"),
    projectId: readString(row, "projectId"),
    conversationId: readString(row, "conversationId"),
    runtimeId: readString(row, "runtimeId"),
    executionProviderId: readString(row, "executionProviderId"),
    taskKind,
    state,
    checkpoint: parsePayload(readString(row, "checkpoint")),
    createdAt: readString(row, "createdAt"),
    updatedAt: readString(row, "updatedAt"),
  };
}

function runStateMayTransition(from: RunState, to: RunState): boolean {
  if (from === to) return true;
  if (from === "queued") return to === "running" || to === "interrupted" || to === "failed";
  if (from === "running") return to === "interrupted" || to === "completed" || to === "failed";
  return false;
}

function readCleanup(row: Record<string, unknown>): WorkspaceCleanupRecord {
  const state = readString(row, "state");
  if (!isCleanupState(state)) throw new RunStateError("SQLite cleanup state is invalid.");
  const lastErrorCode = row["lastErrorCode"];
  if (lastErrorCode !== null && typeof lastErrorCode !== "string") {
    throw new RunStateError("SQLite cleanup error code is invalid.");
  }
  return {
    tenantId: readString(row, "tenantId"),
    runId: readString(row, "runId"),
    state,
    dueAt: readString(row, "dueAt"),
    attempts: readNumber(row, "attempts"),
    lastErrorCode,
  };
}

function isRuntimeSessionState(value: string): value is RuntimeSessionState {
  return ["idle", "active", "interrupted", "completed", "failed"].includes(value);
}

function parseStringArray(serialized: string, label: string): readonly string[] {
  const parsed: unknown = JSON.parse(serialized);
  if (!Array.isArray(parsed) || !parsed.every((value) => typeof value === "string")) {
    throw new RunStateError(`${label} is invalid.`);
  }
  return parsed;
}

function readRuntimeSession(row: Record<string, unknown>): PersistedRuntimeSession {
  const state = readString(row, "state");
  if (!isRuntimeSessionState(state)) throw new RunStateError("SQLite runtime session state is invalid.");
  return {
    id: readString(row, "id"),
    tenantId: readString(row, "tenantId"),
    conversationId: readString(row, "conversationId"),
    runtimeId: readString(row, "runtimeId"),
    runtimeSessionId: readString(row, "runtimeSessionId"),
    state,
  };
}

function readCapabilityDecision(row: Record<string, unknown>): PersistedCapabilityDecision {
  return {
    tenantId: readString(row, "tenantId"),
    runId: readString(row, "runId"),
    runtimeId: readString(row, "runtimeId"),
    required: parseStringArray(readString(row, "required"), "Required capabilities"),
    missing: parseStringArray(readString(row, "missing"), "Missing capabilities"),
    accepted: readNumber(row, "accepted") === 1,
  };
}

function isApprovalState(value: string): value is ApprovalState {
  return ["pending", "approved", "denied", "expired"].includes(value);
}

function isHealthDimension(value: string): value is HealthDimension {
  return ["tech", "content", "seo", "performance", "security"].includes(value);
}

function isHealthStatus(value: string): value is HealthStatus {
  return ["healthy", "warning", "critical", "unknown"].includes(value);
}

function readApproval(row: Record<string, unknown>): PersistedApproval {
  const state = readString(row, "state");
  if (!isApprovalState(state)) throw new RunStateError("SQLite approval state is invalid.");
  const resolvedAt = row["resolvedAt"];
  if (resolvedAt !== null && typeof resolvedAt !== "string") throw new RunStateError("SQLite approval timestamp is invalid.");
  return {
    id: readString(row, "id"),
    tenantId: readString(row, "tenantId"),
    runId: readString(row, "runId"),
    state,
    requestedAt: readString(row, "requestedAt"),
    resolvedAt,
  };
}

function readHealthEvidence(row: Record<string, unknown>): PersistedHealthEvidence {
  const dimension = readString(row, "dimension");
  const status = readString(row, "status");
  if (!isHealthDimension(dimension) || !isHealthStatus(status)) {
    throw new RunStateError("SQLite health evidence classification is invalid.");
  }
  return {
    id: readString(row, "id"),
    tenantId: readString(row, "tenantId"),
    projectId: readString(row, "projectId"),
    dimension,
    status,
    summary: parsePayload(readString(row, "summary")),
    sourceCommit: readString(row, "sourceCommit"),
    observedAt: readString(row, "observedAt"),
  };
}

function readRunUsage(row: Record<string, unknown>): PersistedRunUsage {
  const estimatedCostMinor = row["estimatedCostMinor"];
  if (estimatedCostMinor !== null && typeof estimatedCostMinor !== "number") {
    throw new RunStateError("SQLite usage cost is invalid.");
  }
  return {
    tenantId: readString(row, "tenantId"),
    runId: readString(row, "runId"),
    durationMs: readNumber(row, "durationMs"),
    inputUnits: readNumber(row, "inputUnits"),
    outputUnits: readNumber(row, "outputUnits"),
    estimatedCostMinor,
  };
}

function selectRun(db: DatabaseSync, tenantId: string, runId: string): Record<string, unknown> | undefined {
  return oneRow(
    db,
    `SELECT id, tenant_id AS tenantId, project_id AS projectId, conversation_id AS conversationId,
            runtime_id AS runtimeId, execution_provider_id AS executionProviderId, task_kind AS taskKind,
            state, checkpoint, created_at AS createdAt, updated_at AS updatedAt
     FROM runs WHERE tenant_id = ? AND id = ?`,
    tenantId,
    runId,
  );
}

function readExecution(row: Record<string, unknown>): PersistedExecution {
  const taskKind = readString(row, "taskKind");
  if (!isRunTaskKind(taskKind)) throw new RunStateError("Execution task kind is invalid.");
  const trigger = readString(row, "trigger");
  if (trigger !== "manual") throw new RunStateError("Execution trigger is invalid.");
  const state = readString(row, "state");
  if (state !== "pendingPreflight" && state !== "preflightPassed" && state !== "completed" && state !== "interrupted" && state !== "failed") throw new RunStateError("Execution state is invalid.");
  const required = parseStringArray(readString(row, "requiredCapabilities"), "Execution capabilities");
  const failureCode = row["failureCode"];
  if (failureCode !== null && typeof failureCode !== "string") throw new RunStateError("Execution failure code is invalid.");
  return { executionId: readString(row, "executionId"), tenantId: readString(row, "tenantId"), runId: readString(row, "runId"), projectId: readString(row, "projectId"), conversationId: readString(row, "conversationId"), taskKind, trigger, runtimeId: readString(row, "runtimeId"), providerId: readString(row, "providerId"), requiredCapabilities: required, maxDurationMs: readNumber(row, "maxDurationMs"), deadlineAt: readString(row, "deadlineAt"), state, failureCode };
}

function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta(version INTEGER NOT NULL);
    INSERT INTO meta SELECT 1 WHERE NOT EXISTS(SELECT 1 FROM meta);
    CREATE TABLE IF NOT EXISTS idempotency(
      tenant_id TEXT NOT NULL,
      actor_user_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      body TEXT NOT NULL,
      PRIMARY KEY(tenant_id, actor_user_id, scope, key)
    );
    CREATE TABLE IF NOT EXISTS conversations(
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      state TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events(
      cursor INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT UNIQUE NOT NULL,
      tenant_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      occurred_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tenants(id TEXT PRIMARY KEY, identity_ref TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, auth_subject TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS tenant_users(tenant_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, github_repository_id INTEGER);
    CREATE TABLE IF NOT EXISTS memberships(
      tenant_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      capability TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS project_identity_bindings(
      tenant_id TEXT NOT NULL,
      source_system TEXT NOT NULL,
      source_project_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      PRIMARY KEY(tenant_id, source_system, source_project_id),
      UNIQUE(tenant_id, source_system, project_id)
    );
  `);
  const versionRow = oneRow(db, "SELECT version FROM meta LIMIT 1");
  if (versionRow === undefined) throw new Error("SQLite schema version is missing");
  const version = readNumber(versionRow, "version");
  if (version === 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS github_repository_bindings(
        project_id TEXT PRIMARY KEY,
        installation_id INTEGER NOT NULL,
        repository_id INTEGER NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        default_branch TEXT NOT NULL
      );
      UPDATE meta SET version = 2;
    `);
  }
  const migratedVersionRow = oneRow(db, "SELECT version FROM meta LIMIT 1");
  if (migratedVersionRow === undefined) throw new Error("SQLite schema version is missing after migration");
  let migratedVersion = readNumber(migratedVersionRow, "version");
  if (migratedVersion === 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS runs(
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        runtime_id TEXT NOT NULL,
        execution_provider_id TEXT NOT NULL,
        task_kind TEXT NOT NULL,
        state TEXT NOT NULL,
        checkpoint TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS runs_tenant_updated_idx ON runs(tenant_id, updated_at DESC);
      CREATE TABLE IF NOT EXISTS workspace_cleanups(
        run_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        state TEXT NOT NULL,
        due_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error_code TEXT
      );
      CREATE INDEX IF NOT EXISTS workspace_cleanups_due_idx
        ON workspace_cleanups(tenant_id, state, due_at);
      UPDATE meta SET version = 3;
    `);
    migratedVersion = 3;
  }
  if (migratedVersion === 3) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS runtime_sessions(
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL UNIQUE,
        runtime_id TEXT NOT NULL,
        runtime_session_id TEXT NOT NULL,
        state TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS capability_decisions(
        run_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        runtime_id TEXT NOT NULL,
        required TEXT NOT NULL,
        missing TEXT NOT NULL,
        accepted INTEGER NOT NULL
      );
      UPDATE meta SET version = 4;
    `);
    migratedVersion = 4;
  }
  if (migratedVersion === 4) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS approvals(
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        run_id TEXT NOT NULL,
        state TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        resolved_at TEXT
      );
      CREATE INDEX IF NOT EXISTS approvals_tenant_state_idx ON approvals(tenant_id, state);
      CREATE TABLE IF NOT EXISTS health_evidence(
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        dimension TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT NOT NULL,
        source_commit TEXT NOT NULL,
        observed_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS health_evidence_project_observed_idx
        ON health_evidence(tenant_id, project_id, observed_at DESC);
      CREATE TABLE IF NOT EXISTS run_usage(
        run_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        input_units INTEGER NOT NULL,
        output_units INTEGER NOT NULL,
        estimated_cost_minor INTEGER
      );
      UPDATE meta SET version = 5;
    `);
    migratedVersion = 5;
  }
  if (migratedVersion === 5) {
    db.exec(`
      CREATE INDEX IF NOT EXISTS project_identity_bindings_project_idx
        ON project_identity_bindings(tenant_id, project_id);
      UPDATE meta SET version = 6;
    `);
    migratedVersion = 6;
  }
  if (migratedVersion === 6) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS executions(
        execution_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        run_id TEXT NOT NULL UNIQUE,
        project_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        task_kind TEXT NOT NULL,
        trigger TEXT NOT NULL,
        runtime_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        required_capabilities TEXT NOT NULL,
        max_duration_ms INTEGER NOT NULL,
        deadline_at TEXT NOT NULL,
        state TEXT NOT NULL,
        failure_code TEXT
      );
      CREATE INDEX IF NOT EXISTS executions_tenant_run_idx ON executions(tenant_id, run_id);
      UPDATE meta SET version = 7;
    `);
    migratedVersion = 7;
  }
  if (migratedVersion !== 7) {
    throw new Error(`Unsupported SQLite schema version ${migratedVersion}`);
  }
}

function createOperationalStore(file = ":memory:"): OperationalStore {
  const db = new DatabaseSync(file);
  const pendingIdempotency = new Map<string, Promise<{ readonly statusCode: number; readonly body: SafePayload }>>();
  createSchema(db);

  return {
    schemaVersion: () => {
      const row = oneRow(db, "SELECT version FROM meta LIMIT 1");
      if (row === undefined) throw new Error("SQLite schema version is missing");
      return readNumber(row, "version");
    },
    listTenantIds: () => allRows(db, "SELECT id FROM tenants ORDER BY id").map((row) => readString(row, "id")),
    createTenant: ({ id, identityRef }) => run(db, "INSERT INTO tenants VALUES(?, ?)", id, identityRef),
    createUser: ({ id, authSubject }) => run(db, "INSERT INTO users VALUES(?, ?)", id, authSubject),
    addTenantUser: ({ tenantId, userId, role }) =>
      run(db, "INSERT INTO tenant_users VALUES(?, ?, ?)", tenantId, userId, role),
    createProject: ({ id, tenantId, githubRepositoryId, sourceSystem, sourceProjectId }) => {
      if (sourceSystem !== undefined || sourceProjectId !== undefined) {
        if (sourceSystem === undefined || sourceProjectId === undefined) {
          throw new RepositoryBindingError("Project identity source and identifier must be supplied together.");
        }
        validateOpaqueValue(sourceSystem, "Project identity source");
        validateOpaqueValue(sourceProjectId, "Source project identifier");
      }
      run(db, "INSERT INTO projects VALUES(?, ?, ?)", id, tenantId, githubRepositoryId ?? null);
      if (sourceSystem !== undefined && sourceProjectId !== undefined) {
        run(
          db,
          `INSERT INTO project_identity_bindings(tenant_id, source_system, source_project_id, project_id)
           VALUES(?, ?, ?, ?)`,
          tenantId,
          sourceSystem,
          sourceProjectId,
          id,
        );
      }
    },
    bindProjectIdentity: ({ tenantId, sourceSystem, sourceProjectId, projectId }) => {
      validateOpaqueValue(tenantId, "Tenant identifier");
      validateOpaqueValue(sourceSystem, "Project identity source");
      validateOpaqueValue(sourceProjectId, "Source project identifier");
      validateOpaqueValue(projectId, "Project identifier");
      const project = oneRow(
        db,
        "SELECT id FROM projects WHERE id = ? AND tenant_id = ?",
        projectId,
        tenantId,
      );
      if (project === undefined) {
        throw new RepositoryBindingError("Project identity target is unavailable for this tenant.");
      }
      run(
        db,
        `INSERT INTO project_identity_bindings(tenant_id, source_system, source_project_id, project_id)
         VALUES(?, ?, ?, ?)
         ON CONFLICT(tenant_id, source_system, source_project_id) DO UPDATE SET project_id = excluded.project_id`,
        tenantId,
        sourceSystem,
        sourceProjectId,
        projectId,
      );
    },
    bindGitHubRepository: ({ tenantId, projectId, binding }) => {
      validateBinding(binding);
      const project = oneRow(
        db,
        "SELECT id FROM projects WHERE id = ? AND tenant_id = ?",
        projectId,
        tenantId,
      );
      if (project === undefined) {
        throw new RepositoryBindingError("Project is unavailable for this tenant.");
      }
      run(
        db,
        `INSERT INTO github_repository_bindings(project_id, installation_id, repository_id, full_name, default_branch)
         VALUES(?, ?, ?, ?, ?)
         ON CONFLICT(project_id) DO UPDATE SET
           installation_id = excluded.installation_id,
           repository_id = excluded.repository_id,
           full_name = excluded.full_name,
           default_branch = excluded.default_branch`,
        projectId,
        binding.installationId,
        binding.repositoryId,
        binding.fullName,
        binding.defaultBranch,
      );
    },
    getGitHubRepositoryBinding: ({ tenantId, projectId }) => {
      const row = oneRow(
        db,
        `SELECT b.installation_id AS installationId, b.repository_id AS repositoryId,
                b.full_name AS fullName, b.default_branch AS defaultBranch
         FROM github_repository_bindings b
         JOIN projects p ON p.id = b.project_id
         WHERE b.project_id = ? AND p.tenant_id = ?`,
        projectId,
        tenantId,
      );
      if (row === undefined) return undefined;
      return {
        installationId: readNumber(row, "installationId"),
        repositoryId: readNumber(row, "repositoryId"),
        fullName: readString(row, "fullName"),
        defaultBranch: readString(row, "defaultBranch"),
      };
    },
    createRun: ({ id, tenantId, projectId, conversationId, runtimeId, executionProviderId, taskKind }) => {
      validateOpaqueValue(id, "Run identifier");
      validateOpaqueValue(tenantId, "Tenant identifier");
      validateOpaqueValue(projectId, "Project identifier");
      validateOpaqueValue(conversationId, "Conversation identifier");
      validateOpaqueValue(runtimeId, "Runtime identifier");
      validateOpaqueValue(executionProviderId, "Execution provider identifier");
      if (!runTaskKinds.includes(taskKind)) throw new RunStateError("Run task kind is invalid.");
      const conversation = oneRow(
        db,
        `SELECT c.id FROM conversations c
         JOIN projects p ON p.id = c.project_id AND p.tenant_id = c.tenant_id
         WHERE c.id = ? AND c.project_id = ? AND c.tenant_id = ?`,
        conversationId,
        projectId,
        tenantId,
      );
      if (conversation === undefined) throw new RunStateError("Conversation is unavailable for this tenant/project.");
      const timestamp = new Date().toISOString();
      const checkpoint: SafePayload = { phase: "queued" };
      assertSecretSafe(checkpoint);
      run(
        db,
        `INSERT INTO runs(
           id, tenant_id, project_id, conversation_id, runtime_id, execution_provider_id,
           task_kind, state, checkpoint, created_at, updated_at
         ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        tenantId,
        projectId,
        conversationId,
        runtimeId,
        executionProviderId,
        taskKind,
        "queued",
        JSON.stringify(checkpoint),
        timestamp,
        timestamp,
      );
      const created = selectRun(db, tenantId, id);
      if (created === undefined) throw new RunStateError("Created run cannot be read back.");
      return readRun(created);
    },
    createExecution: (input) => {
      assertSecretSafe(input);
      validateOpaqueValue(String(input.executionId), "Execution identifier");
      validateTimestamp(input.deadlineAt, "Execution deadline");
      if (!runTaskKinds.includes(input.taskKind)) throw new RunStateError("Execution envelope is invalid.");
      if (!Number.isSafeInteger(input.resourceBudget.maxDurationMs) || input.resourceBudget.maxDurationMs < 1) throw new RunStateError("Execution budget is invalid.");
      if (selectRun(db, String(input.tenantId), String(input.runId)) === undefined) throw new RunStateError("Run is unavailable for this tenant.");
      run(db, `INSERT INTO executions(execution_id, tenant_id, run_id, project_id, conversation_id, task_kind, trigger, runtime_id, provider_id, required_capabilities, max_duration_ms, deadline_at, state, failure_code)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendingPreflight', NULL)`, String(input.executionId), String(input.tenantId), String(input.runId), String(input.projectId), String(input.conversationId), input.taskKind, input.trigger, input.runtimeId, input.providerId, JSON.stringify(input.requiredCapabilities), input.resourceBudget.maxDurationMs, input.deadlineAt);
    },
    getExecution: ({ tenantId, executionId }) => {
      const row = oneRow(db, `SELECT execution_id AS executionId, tenant_id AS tenantId, run_id AS runId, project_id AS projectId, conversation_id AS conversationId, task_kind AS taskKind, trigger, runtime_id AS runtimeId, provider_id AS providerId, required_capabilities AS requiredCapabilities, max_duration_ms AS maxDurationMs, deadline_at AS deadlineAt, state, failure_code AS failureCode FROM executions WHERE tenant_id = ? AND execution_id = ?`, tenantId, executionId);
      return row === undefined ? undefined : readExecution(row);
    },
    markExecution: ({ tenantId, executionId, state, failureCode }) => {
      if (failureCode !== undefined) validateOpaqueValue(failureCode, "Execution failure code");
      const currentState = state === "preflightPassed" ? "pendingPreflight" : "preflightPassed";
      const result = db.prepare("UPDATE executions SET state = ?, failure_code = ? WHERE tenant_id = ? AND execution_id = ? AND state = ?").run(state, failureCode ?? null, tenantId, executionId, currentState);
      if (Number(result.changes) !== 1) throw new RunStateError("Execution is unavailable or already finalized.");
    },
    markExecutionForRun: ({ tenantId, runId, state, failureCode }) => {
      if (failureCode !== undefined) validateOpaqueValue(failureCode, "Execution failure code");
      const result = db.prepare("UPDATE executions SET state = ?, failure_code = ? WHERE tenant_id = ? AND run_id = ? AND state = 'preflightPassed'").run(state, failureCode ?? null, tenantId, runId);
      if (Number(result.changes) > 1) throw new RunStateError("Execution transition is ambiguous.");
    },
    getRun: ({ tenantId, runId }) => {
      const row = selectRun(db, tenantId, runId);
      return row === undefined ? undefined : readRun(row);
    },
    getLatestRun: ({ tenantId, conversationId }) => {
      const row = oneRow(
        db,
        `SELECT id, tenant_id AS tenantId, project_id AS projectId, conversation_id AS conversationId,
                runtime_id AS runtimeId, execution_provider_id AS executionProviderId, task_kind AS taskKind,
                state, checkpoint, created_at AS createdAt, updated_at AS updatedAt
         FROM runs WHERE tenant_id = ? AND conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
        tenantId,
        conversationId,
      );
      return row === undefined ? undefined : readRun(row);
    },
    checkpointRun: ({ tenantId, runId, state, checkpoint, updatedAt }) => {
      assertSecretSafe(checkpoint);
      if (!runStates.includes(state)) throw new RunStateError("Run state is invalid.");
      const currentRow = selectRun(db, tenantId, runId);
      if (currentRow === undefined) throw new RunStateError("Run is unavailable for this tenant.");
      const current = readRun(currentRow);
      if (!runStateMayTransition(current.state, state)) {
        throw new RunStateError(`Invalid run state transition from ${current.state} to ${state}.`);
      }
      const timestamp = updatedAt ?? new Date().toISOString();
      validateTimestamp(timestamp, "Run updatedAt");
      run(
        db,
        "UPDATE runs SET state = ?, checkpoint = ?, updated_at = ? WHERE tenant_id = ? AND id = ?",
        state,
        JSON.stringify(checkpoint),
        timestamp,
        tenantId,
        runId,
      );
      const updated = selectRun(db, tenantId, runId);
      if (updated === undefined) throw new RunStateError("Updated run cannot be read back.");
      return readRun(updated);
    },
    recoverInFlightRuns: ({ occurredAt }) => {
      validateTimestamp(occurredAt, "Recovery timestamp");
      const checkpoint: SafePayload = { phase: "runner_restart", reason: "in_flight_run_recovered" };
      assertSecretSafe(checkpoint);
      db.prepare(
        `UPDATE executions SET state = 'interrupted', failure_code = 'runnerRestart'
         WHERE state = 'preflightPassed' AND EXISTS(
           SELECT 1 FROM runs WHERE runs.id = executions.run_id AND runs.tenant_id = executions.tenant_id
             AND runs.state IN ('queued', 'running')
         )`,
      ).run();
      const result = db.prepare(
        `UPDATE runs SET state = 'interrupted', checkpoint = ?, updated_at = ? WHERE state = 'running'`,
      ).run(JSON.stringify(checkpoint), occurredAt);
      return Number(result.changes);
    },
    scheduleWorkspaceCleanup: ({ tenantId, runId, dueAt }) => {
      validateTimestamp(dueAt, "Cleanup dueAt");
      if (selectRun(db, tenantId, runId) === undefined) {
        throw new RunStateError("Run is unavailable for this tenant.");
      }
      const existing = oneRow(db, "SELECT tenant_id AS tenantId FROM workspace_cleanups WHERE run_id = ?", runId);
      if (existing !== undefined && readString(existing, "tenantId") !== tenantId) {
        throw new RunStateError("Cleanup is unavailable for this tenant.");
      }
      run(
        db,
        `INSERT INTO workspace_cleanups(run_id, tenant_id, state, due_at, attempts, last_error_code)
         VALUES(?, ?, 'pending', ?, 0, NULL)
         ON CONFLICT(run_id) DO UPDATE SET
           state = 'pending', due_at = excluded.due_at, last_error_code = NULL`,
        runId,
        tenantId,
        dueAt,
      );
    },
    listDueWorkspaceCleanups: ({ tenantId, now, limit = 100 }) => {
      validateTimestamp(now, "Cleanup now");
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
        throw new RunStateError("Cleanup limit is invalid.");
      }
      return allRows(
        db,
        `SELECT tenant_id AS tenantId, run_id AS runId, state, due_at AS dueAt,
                attempts, last_error_code AS lastErrorCode
         FROM workspace_cleanups
         WHERE tenant_id = ? AND state = 'pending' AND due_at <= ?
         ORDER BY due_at, run_id LIMIT ?`,
        tenantId,
        now,
        limit,
      ).map(readCleanup);
    },
    markWorkspaceCleanup: ({ tenantId, runId, state, errorCode }) => {
      if (!cleanupStates.includes(state)) {
        throw new RunStateError("Cleanup state must be completed or failed.");
      }
      if (errorCode !== undefined) validateOpaqueValue(errorCode, "Cleanup error code");
      const existing = oneRow(
        db,
        "SELECT tenant_id AS tenantId FROM workspace_cleanups WHERE run_id = ? AND tenant_id = ?",
        runId,
        tenantId,
      );
      if (existing === undefined) throw new RunStateError("Cleanup is unavailable for this tenant.");
      run(
        db,
        `UPDATE workspace_cleanups
         SET state = ?, attempts = attempts + 1, last_error_code = ?
         WHERE run_id = ? AND tenant_id = ?`,
        state,
        state === "failed" ? (errorCode ?? "cleanup_failed") : null,
        runId,
        tenantId,
      );
    },
    saveRuntimeSession: ({ id, tenantId, conversationId, runtimeId, runtimeSessionId, state }) => {
      validateOpaqueValue(id, "Runtime session identifier");
      validateOpaqueValue(tenantId, "Tenant identifier");
      validateOpaqueValue(conversationId, "Conversation identifier");
      validateOpaqueValue(runtimeId, "Runtime identifier");
      validateOpaqueValue(runtimeSessionId, "Runtime session reference");
      if (!isRuntimeSessionState(state)) throw new RunStateError("Runtime session state is invalid.");
      const conversation = oneRow(
        db,
        "SELECT id FROM conversations WHERE id = ? AND tenant_id = ?",
        conversationId,
        tenantId,
      );
      if (conversation === undefined) throw new RunStateError("Conversation is unavailable for this tenant.");
      run(
        db,
        `INSERT INTO runtime_sessions(id, tenant_id, conversation_id, runtime_id, runtime_session_id, state)
         VALUES(?, ?, ?, ?, ?, ?)
         ON CONFLICT(conversation_id) DO UPDATE SET
           id = excluded.id,
           runtime_id = excluded.runtime_id,
           runtime_session_id = excluded.runtime_session_id,
           state = excluded.state`,
        id,
        tenantId,
        conversationId,
        runtimeId,
        runtimeSessionId,
        state,
      );
    },
    getRuntimeSession: ({ tenantId, conversationId }) => {
      const row = oneRow(
        db,
        `SELECT id, tenant_id AS tenantId, conversation_id AS conversationId,
                runtime_id AS runtimeId, runtime_session_id AS runtimeSessionId, state
         FROM runtime_sessions WHERE tenant_id = ? AND conversation_id = ?`,
        tenantId,
        conversationId,
      );
      return row === undefined ? undefined : readRuntimeSession(row);
    },
    saveCapabilityDecision: ({ tenantId, runId, runtimeId, required, missing, accepted }) => {
      validateOpaqueValue(tenantId, "Tenant identifier");
      validateOpaqueValue(runId, "Run identifier");
      validateOpaqueValue(runtimeId, "Runtime identifier");
      if (!Array.isArray(required) || !Array.isArray(missing) || !required.every((value) => typeof value === "string") ||
          !missing.every((value) => typeof value === "string")) {
        throw new RunStateError("Capability decision lists are invalid.");
      }
      assertSecretSafe({ required, missing });
      if (typeof accepted !== "boolean") throw new RunStateError("Capability decision result is invalid.");
      if (selectRun(db, tenantId, runId) === undefined) throw new RunStateError("Run is unavailable for this tenant.");
      run(
        db,
        `INSERT INTO capability_decisions(run_id, tenant_id, runtime_id, required, missing, accepted)
         VALUES(?, ?, ?, ?, ?, ?)
         ON CONFLICT(run_id) DO UPDATE SET
           tenant_id = excluded.tenant_id,
           runtime_id = excluded.runtime_id,
           required = excluded.required,
           missing = excluded.missing,
           accepted = excluded.accepted`,
        runId,
        tenantId,
        runtimeId,
        JSON.stringify(required),
        JSON.stringify(missing),
        accepted ? 1 : 0,
      );
    },
    getCapabilityDecision: ({ tenantId, runId }) => {
      const row = oneRow(
        db,
        `SELECT tenant_id AS tenantId, run_id AS runId, runtime_id AS runtimeId,
                required, missing, accepted
         FROM capability_decisions WHERE tenant_id = ? AND run_id = ?`,
        tenantId,
        runId,
      );
      return row === undefined ? undefined : readCapabilityDecision(row);
    },
    createApproval: ({ id, tenantId, runId, requestedAt }) => {
      validateOpaqueValue(id, "Approval identifier");
      validateTimestamp(requestedAt, "Approval requestedAt");
      if (selectRun(db, tenantId, runId) === undefined) throw new RunStateError("Run is unavailable for this tenant.");
      run(
        db,
        `INSERT INTO approvals(id, tenant_id, run_id, state, requested_at, resolved_at)
         VALUES(?, ?, ?, 'pending', ?, NULL)`,
        id,
        tenantId,
        runId,
        requestedAt,
      );
    },
    getApproval: ({ tenantId, approvalId }) => {
      const row = oneRow(
        db,
        `SELECT id, tenant_id AS tenantId, run_id AS runId, state,
                requested_at AS requestedAt, resolved_at AS resolvedAt
         FROM approvals WHERE tenant_id = ? AND id = ?`,
        tenantId,
        approvalId,
      );
      return row === undefined ? undefined : readApproval(row);
    },
    resolveApproval: ({ tenantId, approvalId, state, resolvedAt }) => {
      if (!isApprovalState(state)) throw new RunStateError("Approval resolution is invalid.");
      validateTimestamp(resolvedAt, "Approval resolvedAt");
      const current = oneRow(
        db,
        "SELECT state FROM approvals WHERE tenant_id = ? AND id = ?",
        tenantId,
        approvalId,
      );
      if (current === undefined) throw new RunStateError("Approval is unavailable for this tenant.");
      if (readString(current, "state") !== "pending") throw new RunStateError("Approval is already resolved.");
      run(
        db,
        "UPDATE approvals SET state = ?, resolved_at = ? WHERE tenant_id = ? AND id = ?",
        state,
        resolvedAt,
        tenantId,
        approvalId,
      );
    },
    appendHealthEvidence: ({ id, tenantId, projectId, dimension, status, summary, sourceCommit, observedAt }) => {
      validateOpaqueValue(id, "Health evidence identifier");
      validateOpaqueValue(tenantId, "Tenant identifier");
      validateOpaqueValue(projectId, "Project identifier");
      if (!isHealthDimension(dimension) || !isHealthStatus(status)) {
        throw new RunStateError("Health evidence classification is invalid.");
      }
      if (!/^[A-Za-z0-9._/-]{1,200}$/.test(sourceCommit)) throw new RunStateError("Health source commit is invalid.");
      validateTimestamp(observedAt, "Health observedAt");
      assertSecretSafe(summary);
      const project = oneRow(db, "SELECT id FROM projects WHERE id = ? AND tenant_id = ?", projectId, tenantId);
      if (project === undefined) throw new RunStateError("Project is unavailable for this tenant.");
      run(
        db,
        `INSERT INTO health_evidence(id, tenant_id, project_id, dimension, status, summary, source_commit, observed_at)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        tenantId,
        projectId,
        dimension,
        status,
        JSON.stringify(summary),
        sourceCommit,
        observedAt,
      );
    },
    listHealthEvidence: ({ tenantId, projectId }) =>
      allRows(
        db,
        `SELECT id, tenant_id AS tenantId, project_id AS projectId, dimension, status,
                summary, source_commit AS sourceCommit, observed_at AS observedAt
         FROM health_evidence WHERE tenant_id = ? AND project_id = ? ORDER BY observed_at, id`,
        tenantId,
        projectId,
      ).map(readHealthEvidence),
    saveRunUsage: ({ tenantId, runId, durationMs, inputUnits, outputUnits, estimatedCostMinor }) => {
      if (!Number.isSafeInteger(durationMs) || durationMs < 0 || !Number.isSafeInteger(inputUnits) || inputUnits < 0 ||
          !Number.isSafeInteger(outputUnits) || outputUnits < 0 ||
          (estimatedCostMinor !== null && (!Number.isSafeInteger(estimatedCostMinor) || estimatedCostMinor < 0))) {
        throw new RunStateError("Run usage values are invalid.");
      }
      if (selectRun(db, tenantId, runId) === undefined) throw new RunStateError("Run is unavailable for this tenant.");
      run(
        db,
        `INSERT INTO run_usage(run_id, tenant_id, duration_ms, input_units, output_units, estimated_cost_minor)
         VALUES(?, ?, ?, ?, ?, ?)
         ON CONFLICT(run_id) DO UPDATE SET
           duration_ms = excluded.duration_ms,
           input_units = excluded.input_units,
           output_units = excluded.output_units,
           estimated_cost_minor = excluded.estimated_cost_minor`,
        runId,
        tenantId,
        durationMs,
        inputUnits,
        outputUnits,
        estimatedCostMinor,
      );
    },
    getRunUsage: ({ tenantId, runId }) => {
      const row = oneRow(
        db,
        `SELECT tenant_id AS tenantId, run_id AS runId, duration_ms AS durationMs,
                input_units AS inputUnits, output_units AS outputUnits,
                estimated_cost_minor AS estimatedCostMinor
         FROM run_usage WHERE tenant_id = ? AND run_id = ?`,
        tenantId,
        runId,
      );
      return row === undefined ? undefined : readRunUsage(row);
    },
    grantProjectMembership: ({ tenantId, projectId, userId, capability }) =>
      run(db, "INSERT INTO memberships VALUES(?, ?, ?, ?)", tenantId, projectId, userId, capability),
    createConversation: ({ id, tenantId, projectId, createdBy, title }) =>
      run(db, "INSERT INTO conversations VALUES(?, ?, ?, ?, ?, ?)", id, tenantId, projectId, createdBy, title, "idle"),
    resolveActor: ({ subject, tenantId }) => {
      const row = oneRow(
        db,
        `SELECT users.id AS userId, users.auth_subject AS subject
         FROM users JOIN tenant_users ON tenant_users.user_id = users.id
         WHERE users.auth_subject = ? AND tenant_users.tenant_id = ? LIMIT 1`,
        subject,
        tenantId,
      );
      if (row === undefined) return undefined;
      return { tenantId, userId: readString(row, "userId"), subject: readString(row, "subject") };
    },
    resolveProjectId: ({ tenantId, userId, sourceSystem, sourceProjectId }) => {
      const row = oneRow(
        db,
        `SELECT b.project_id AS projectId
         FROM project_identity_bindings b
         JOIN memberships m ON m.tenant_id = b.tenant_id AND m.project_id = b.project_id
         WHERE b.tenant_id = ? AND b.source_system = ? AND b.source_project_id = ?
           AND m.user_id = ? AND m.capability IN ('read', 'mutate')
         UNION ALL
         SELECT p.id AS projectId
         FROM projects p
         JOIN memberships m ON m.tenant_id = p.tenant_id AND m.project_id = p.id
         WHERE p.tenant_id = ? AND p.id = ? AND ? = 'shipglows-app'
           AND m.user_id = ? AND m.capability IN ('read', 'mutate')
         LIMIT 1`,
        tenantId,
        sourceSystem,
        sourceProjectId,
        userId,
        tenantId,
        sourceProjectId,
        sourceSystem,
        userId,
      );
      return row === undefined ? null : readString(row, "projectId");
    },
    hasProjectAccess: ({ tenantId, projectId, userId, capability }) =>
      oneRow(
        db,
        `SELECT 1 FROM memberships m
         JOIN projects p ON p.id = m.project_id
         WHERE m.tenant_id = ? AND m.project_id = ? AND m.user_id = ?
           AND (m.capability = ? OR (? = 'read' AND m.capability = 'mutate'))
           AND p.tenant_id = ?`,
        tenantId,
        projectId,
        userId,
        capability,
        capability,
        tenantId,
      ) !== undefined,
    listCockpitProjects: ({ tenantId, userId }) => {
      const projectRows = allRows(
        db,
        `SELECT DISTINCT p.id, COALESCE(g.full_name, p.id) AS repositoryFullName
         FROM projects p JOIN memberships m ON m.project_id = p.id AND m.tenant_id = p.tenant_id
         LEFT JOIN github_repository_bindings g ON g.project_id = p.id
         WHERE p.tenant_id = ? AND m.user_id = ? AND m.capability IN ('read', 'mutate')
         ORDER BY p.id`,
        tenantId,
        userId,
      );
      const dimensions: readonly HealthDimension[] = ["tech", "content", "seo", "performance", "security"];
      return projectRows.map((project) => {
        const projectId = readString(project, "id");
        const evidenceRows = allRows(
          db,
          `SELECT dimension, status, summary, source_commit AS sourceCommit, observed_at AS observedAt
           FROM health_evidence WHERE tenant_id = ? AND project_id = ?
           ORDER BY observed_at DESC`,
          tenantId,
          projectId,
        );
        const latest = new Map<string, Record<string, unknown>>();
        for (const row of evidenceRows) {
          const dimension = readString(row, "dimension");
          if (!latest.has(dimension)) latest.set(dimension, row);
        }
        const projectDimensions = dimensions.map((dimension) => {
          const row = latest.get(dimension);
          if (row === undefined) return { dimension, status: "unknown" as const, summary: { text: "No evidence reported." }, producer: "none", evidenceCount: 0, sourceCommit: null, checkedAt: null };
          return { dimension, status: readString(row, "status") as HealthStatus, summary: parsePayload(readString(row, "summary")), producer: "shipglows-runner", evidenceCount: 1, sourceCommit: readString(row, "sourceCommit"), checkedAt: readString(row, "observedAt") };
        });
        const conversationCount = readNumber(oneRow(db, "SELECT COUNT(*) AS count FROM conversations WHERE tenant_id = ? AND project_id = ?", tenantId, projectId) ?? { count: 0 }, "count");
        const activeRunCount = readNumber(oneRow(db, "SELECT COUNT(*) AS count FROM runs WHERE tenant_id = ? AND project_id = ? AND state IN ('queued', 'running')", tenantId, projectId) ?? { count: 0 }, "count");
        return { id: projectId, name: readString(project, "repositoryFullName"), repositoryFullName: readString(project, "repositoryFullName"), accessState: "available" as const, dimensions: projectDimensions, conversationCount, activeRunCount };
      });
    },
    getConversation: ({ tenantId, conversationId }) => {
      const row = oneRow(
        db,
        "SELECT id, project_id AS projectId, title, state FROM conversations WHERE tenant_id = ? AND id = ?",
        tenantId,
        conversationId,
      );
      if (row === undefined) return undefined;
      return {
        id: readString(row, "id"),
        projectId: readString(row, "projectId"),
        title: readString(row, "title"),
        state: readString(row, "state"),
      };
    },
    listConversations: ({ tenantId, projectId }) => allRows(
      db,
      "SELECT id, project_id AS projectId, title, state FROM conversations WHERE tenant_id = ? AND project_id = ? ORDER BY rowid ASC",
      tenantId,
      projectId,
    ).map((row) => ({
      id: readString(row, "id"),
      projectId: readString(row, "projectId"),
      title: readString(row, "title"),
      state: readString(row, "state"),
    })),
    appendEvent: ({ id, tenantId, conversationId, type, payload }) => {
      assertSecretSafe(payload);
      const occurredAt = new Date().toISOString();
      run(
        db,
        "INSERT INTO events(id, tenant_id, conversation_id, type, payload, occurred_at) VALUES(?, ?, ?, ?, ?, ?)",
        id,
        tenantId,
        conversationId,
        type,
        JSON.stringify(payload),
        occurredAt,
      );
      const row = oneRow(db, "SELECT last_insert_rowid() AS cursor");
      if (row === undefined) throw new Error("SQLite event cursor is missing");
      return { cursor: readNumber(row, "cursor"), id, tenantId, conversationId, type, payload, occurredAt };
    },
    listEvents: ({ tenantId, conversationId, after = 0, limit = 100 }) =>
      allRows(
        db,
        `SELECT cursor, id, tenant_id AS tenantId, conversation_id AS conversationId, type, payload, occurred_at AS occurredAt
         FROM events WHERE tenant_id = ? AND conversation_id = ? AND cursor > ? ORDER BY cursor LIMIT ?`,
        tenantId,
        conversationId,
        after,
        limit,
      ).map((row) => ({
        cursor: readNumber(row, "cursor"),
        id: readString(row, "id"),
        tenantId: readString(row, "tenantId"),
        conversationId: readString(row, "conversationId"),
        type: readString(row, "type"),
        payload: parsePayload(readString(row, "payload")),
        occurredAt: readString(row, "occurredAt"),
      })),
    executeIdempotent: <T extends SafePayload>(input: {
      readonly tenantId: string;
      readonly actorUserId: string;
      readonly scope: string;
      readonly key: string;
    }, callback: () => { readonly statusCode: number; readonly body: T }) => {
      const prior = oneRow(
        db,
        "SELECT status_code AS statusCode, body FROM idempotency WHERE tenant_id = ? AND actor_user_id = ? AND scope = ? AND key = ?",
        input.tenantId,
        input.actorUserId,
        input.scope,
        input.key,
      );
      if (prior !== undefined) {
        return {
          replayed: true,
          response: { statusCode: readNumber(prior, "statusCode"), body: parsePayload(readString(prior, "body")) as T },
        };
      }
      const response = callback();
      assertSecretSafe(response.body);
      run(
        db,
        "INSERT INTO idempotency VALUES(?, ?, ?, ?, ?, ?)",
        input.tenantId,
        input.actorUserId,
        input.scope,
        input.key,
        response.statusCode,
        JSON.stringify(response.body),
      );
      return { replayed: false, response };
    },
    executeIdempotentAsync: async <T extends SafePayload>(input: {
      readonly tenantId: string;
      readonly actorUserId: string;
      readonly scope: string;
      readonly key: string;
    }, callback: () => Promise<{ readonly statusCode: number; readonly body: T }>) => {
      const prior = oneRow(
        db,
        "SELECT status_code AS statusCode, body FROM idempotency WHERE tenant_id = ? AND actor_user_id = ? AND scope = ? AND key = ?",
        input.tenantId,
        input.actorUserId,
        input.scope,
        input.key,
      );
      if (prior !== undefined) {
        return {
          replayed: true,
          response: { statusCode: readNumber(prior, "statusCode"), body: parsePayload(readString(prior, "body")) as T },
        };
      }
      const lockKey = `${input.tenantId}:${input.actorUserId}:${input.scope}:${input.key}`;
      const pending = pendingIdempotency.get(lockKey);
      if (pending !== undefined) {
        return { replayed: true, response: { ...(await pending) as { readonly statusCode: number; readonly body: T } } };
      }
      const operation = callback().then((response) => {
        assertSecretSafe(response.body);
        run(
          db,
          "INSERT INTO idempotency VALUES(?, ?, ?, ?, ?, ?)",
          input.tenantId,
          input.actorUserId,
          input.scope,
          input.key,
          response.statusCode,
          JSON.stringify(response.body),
        );
        return response;
      });
      pendingIdempotency.set(lockKey, operation);
      try {
        const response = await operation;
        return { replayed: false, response };
      } finally {
        pendingIdempotency.delete(lockKey);
      }
    },
    migrateDown: () => {
      throw new MigrationPolicyError("Down migrations are not allowed");
    },
    close: () => db.close(),
  };
}

export function openOperationalStore(file = ":memory:"): Promise<OperationalStore> {
  return Promise.resolve(createOperationalStore(file));
}
