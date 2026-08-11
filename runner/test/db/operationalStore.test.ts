import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, it } from "node:test";

import { SecretPayloadError, type OpaqueId, type ResolvedExecutionEnvelope } from "../../src/contracts/index.js";
import {
  MigrationPolicyError,
  openOperationalStore,
  RepositoryBindingError,
} from "../../src/db/index.js";
import {
  PROJECT_CONTEXT_SCHEMA_VERSION,
  SKILL_EVIDENCE_SCHEMA_VERSION,
  type SkillEvidenceEnvelope,
} from "../../src/skills/contracts.js";

const ids = {
  tenantA: "ten_000000000001",
  tenantB: "ten_000000000002",
  userA: "usr_000000000001",
  userB: "usr_000000000002",
  projectA: "prj_000000000001",
  projectB: "prj_000000000002",
  conversationA: "cnv_000000000001",
  runA: "run_000000000001",
  sessionA: "ses_000000000001",
  approvalA: "apr_000000000001",
  evidenceA: "evi_000000000001",
  contextA: "ctx_000000000001",
  skillRunA: "skr_000000000001",
};

async function databasePath(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "shipglows-runner-db-"));
  return join(root, `${name}.sqlite`);
}

function seed(store: Awaited<ReturnType<typeof openOperationalStore>>): void {
  store.createTenant({ id: ids.tenantA, identityRef: "firebase-tenant-a" });
  store.createTenant({ id: ids.tenantB, identityRef: "firebase-tenant-b" });
  store.createUser({ id: ids.userA, authSubject: "firebase-user-a" });
  store.createUser({ id: ids.userB, authSubject: "firebase-user-b" });
  store.addTenantUser({ tenantId: ids.tenantA, userId: ids.userA, role: "owner" });
  store.addTenantUser({ tenantId: ids.tenantB, userId: ids.userB, role: "owner" });
  store.createProject({
    id: ids.projectA,
    tenantId: ids.tenantA,
    githubRepositoryId: 101,
  });
  store.createProject({
    id: ids.projectB,
    tenantId: ids.tenantB,
    githubRepositoryId: 202,
  });
  store.grantProjectMembership({
    tenantId: ids.tenantA,
    projectId: ids.projectA,
    userId: ids.userA,
    capability: "mutate",
  });
  store.grantProjectMembership({
    tenantId: ids.tenantB,
    projectId: ids.projectB,
    userId: ids.userB,
    capability: "mutate",
  });
  store.createConversation({
    id: ids.conversationA,
    tenantId: ids.tenantA,
    projectId: ids.projectA,
    createdBy: ids.userA,
    title: "Foundation proof",
  });
}

function skillEvidenceEnvelope(overrides: {
  readonly contextId?: string;
  readonly skillRunId?: string;
  readonly evidenceId?: string;
} = {}): SkillEvidenceEnvelope {
  const contextId = overrides.contextId ?? ids.contextA;
  const skillRunId = overrides.skillRunId ?? ids.skillRunA;
  return {
    context: {
      schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
      bundleId: contextId,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      sourceCommit: "abc123",
      createdAt: "2026-08-02T09:00:00.000Z",
      sources: [{
        kind: "repositorySnapshot",
        reference: "repository:default-branch",
        sha256: "a".repeat(64),
      }],
      redactionCount: 1,
    },
    run: {
      schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
      skillRunId,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      skillId: "103-sg-verify",
      skillVersion: "1.0.0",
      contextBundleId: contextId,
      startedAt: "2026-08-02T09:01:00.000Z",
      completedAt: "2026-08-02T09:03:00.000Z",
      outcome: "completed",
    },
    evidence: [{
      schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
      evidenceId: overrides.evidenceId ?? ids.evidenceA,
      skillRunId,
      contextBundleId: contextId,
      dimension: "security",
      status: "warning",
      summary: { text: "One security issue remains." },
      sourceCommit: "abc123",
      observedAt: "2026-08-02T09:02:00.000Z",
    }],
  };
}

describe("SQLite operational projection", () => {
  it("persists one secret-safe tenant-scoped execution envelope", async () => {
    const store = await openOperationalStore(await databasePath("execution-envelope"));
    seed(store);
    store.createRun({ id: ids.runA, tenantId: ids.tenantA, projectId: ids.projectA, conversationId: ids.conversationA, runtimeId: "codex", executionProviderId: "managed-disposable", taskKind: "audit" });
    const envelope: ResolvedExecutionEnvelope = {
      executionId: "exe_000000000001" as OpaqueId, runId: ids.runA as OpaqueId, tenantId: ids.tenantA as OpaqueId,
      projectId: ids.projectA as OpaqueId, conversationId: ids.conversationA as OpaqueId, taskKind: "audit", trigger: "manual",
      runtimeId: "codex", providerId: "managed-disposable", requiredCapabilities: ["readOnly"],
      resourceBudget: { maxDurationMs: 10_000 }, deadlineAt: "2026-08-07T00:00:10.000Z",
    };
    store.createExecution(envelope);
    store.markExecution({ tenantId: ids.tenantA, executionId: String(envelope.executionId), state: "preflightPassed" });
    assert.deepEqual(store.getExecution({ tenantId: ids.tenantA, executionId: String(envelope.executionId) }), {
      executionId: "exe_000000000001", tenantId: ids.tenantA, runId: ids.runA, projectId: ids.projectA, conversationId: ids.conversationA,
      taskKind: "audit", trigger: "manual", runtimeId: "codex", providerId: "managed-disposable", requiredCapabilities: ["readOnly"], maxDurationMs: 10_000,
      deadlineAt: "2026-08-07T00:00:10.000Z", state: "preflightPassed", failureCode: null,
    });
    assert.equal(store.getExecution({ tenantId: ids.tenantB, executionId: String(envelope.executionId) }), undefined);
    assert.throws(() => store.createExecution({ ...envelope, executionId: "exe_000000000002" as OpaqueId, runId: "run_000000000002" as OpaqueId, providerId: "sk-test-secret" }), SecretPayloadError);
    store.close();
  });

  it("transitions admitted executions once and interrupts active execution on restart", async () => {
    const store = await openOperationalStore(await databasePath("execution-recovery"));
    seed(store);
    store.createRun({ id: ids.runA, tenantId: ids.tenantA, projectId: ids.projectA, conversationId: ids.conversationA, runtimeId: "codex", executionProviderId: "managed-disposable", taskKind: "audit" });
    const envelope: ResolvedExecutionEnvelope = { executionId: "exe_000000000003" as OpaqueId, runId: ids.runA as OpaqueId, tenantId: ids.tenantA as OpaqueId, projectId: ids.projectA as OpaqueId, conversationId: ids.conversationA as OpaqueId, taskKind: "audit", trigger: "manual", runtimeId: "codex", providerId: "managed-disposable", requiredCapabilities: ["readOnly"], resourceBudget: { maxDurationMs: 10_000 }, deadlineAt: "2026-08-07T00:00:10.000Z" };
    store.createExecution(envelope);
    store.markExecution({ tenantId: ids.tenantA, executionId: String(envelope.executionId), state: "preflightPassed" });
    store.checkpointRun({ tenantId: ids.tenantA, runId: ids.runA, state: "running", checkpoint: { phase: "turn_started" } });
    assert.equal(store.recoverInFlightRuns({ occurredAt: "2026-08-07T00:00:00.000Z" }), 1);
    assert.equal(store.getExecution({ tenantId: ids.tenantA, executionId: String(envelope.executionId) })?.state, "interrupted");
    store.markExecutionForRun({ tenantId: ids.tenantA, runId: ids.runA, state: "completed" });
    assert.equal(store.getExecution({ tenantId: ids.tenantA, executionId: String(envelope.executionId) })?.state, "interrupted");
    store.close();
  });

  it("enforces tenant/project membership boundaries", async () => {
    const store = await openOperationalStore(await databasePath("tenants"));
    seed(store);

    assert.equal(
      store.hasProjectAccess({
        tenantId: ids.tenantA,
        userId: ids.userA,
        projectId: ids.projectA,
        capability: "read",
      }),
      true,
    );
    assert.equal(
      store.hasProjectAccess({
        tenantId: ids.tenantA,
        userId: ids.userA,
        projectId: ids.projectB,
        capability: "read",
      }),
      false,
    );
    store.close();
  });

  it("resolves an authenticated actor only inside an existing tenant membership", async () => {
    const store = await openOperationalStore(await databasePath("actors"));
    seed(store);

    assert.deepEqual(
      store.resolveActor({ subject: "firebase-user-a", tenantId: ids.tenantA }),
      { tenantId: ids.tenantA, userId: ids.userA, subject: "firebase-user-a" },
    );
    assert.equal(
      store.resolveActor({ subject: "firebase-user-a", tenantId: ids.tenantB }),
      undefined,
    );
    store.close();
  });

  it("resolves cross-namespace project identities only for an authorized tenant member", async () => {
    const store = await openOperationalStore(await databasePath("project-identities"));
    seed(store);
    store.bindProjectIdentity({
      tenantId: ids.tenantA,
      sourceSystem: "shipglows-app",
      sourceProjectId: "api_project_a",
      projectId: ids.projectA,
    });

    assert.equal(
      store.resolveProjectId({
        tenantId: ids.tenantA,
        userId: ids.userA,
        sourceSystem: "shipglows-app",
        sourceProjectId: "api_project_a",
      }),
      ids.projectA,
    );
    assert.equal(
      store.resolveProjectId({
        tenantId: ids.tenantB,
        userId: ids.userB,
        sourceSystem: "shipglows-app",
        sourceProjectId: "api_project_a",
      }),
      null,
    );
    store.close();
  });

  it("records a project identity binding during server-side project provisioning", async () => {
    const store = await openOperationalStore(await databasePath("project-provisioning-identity"));
    store.createTenant({ id: ids.tenantA, identityRef: "firebase-tenant-a" });
    store.createUser({ id: ids.userA, authSubject: "firebase-user-a" });
    store.addTenantUser({ tenantId: ids.tenantA, userId: ids.userA, role: "owner" });
    store.createProject({
      id: ids.projectA,
      tenantId: ids.tenantA,
      sourceSystem: "shipglows-app",
      sourceProjectId: "api_project_a",
    });
    store.grantProjectMembership({
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      userId: ids.userA,
      capability: "read",
    });

    assert.equal(
      store.resolveProjectId({
        tenantId: ids.tenantA,
        userId: ids.userA,
        sourceSystem: "shipglows-app",
        sourceProjectId: "api_project_a",
      }),
      ids.projectA,
    );
    store.close();
  });

  it("persists a GitHub App repository binding only within the owning tenant", async () => {
    const path = await databasePath("github-binding");
    let store = await openOperationalStore(path);
    seed(store);
    store.bindGitHubRepository({
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      binding: {
        installationId: 42,
        repositoryId: 101,
        fullName: "shipglows/example",
        defaultBranch: "main",
      },
    });
    assert.equal(store.schemaVersion(), 8);
    assert.deepEqual(
      store.getGitHubRepositoryBinding({ tenantId: ids.tenantA, projectId: ids.projectA }),
      {
        installationId: 42,
        repositoryId: 101,
        fullName: "shipglows/example",
        defaultBranch: "main",
      },
    );
    assert.equal(
      store.getGitHubRepositoryBinding({ tenantId: ids.tenantB, projectId: ids.projectA }),
      undefined,
    );
    assert.throws(
      () => store.bindGitHubRepository({
        tenantId: ids.tenantB,
        projectId: ids.projectA,
        binding: {
          installationId: 42,
          repositoryId: 101,
          fullName: "shipglows/example",
          defaultBranch: "main",
        },
      }),
      RepositoryBindingError,
    );
    store.close();

    store = await openOperationalStore(path);
    assert.deepEqual(
      store.getGitHubRepositoryBinding({ tenantId: ids.tenantA, projectId: ids.projectA }),
      {
        installationId: 42,
        repositoryId: 101,
        fullName: "shipglows/example",
        defaultBranch: "main",
      },
    );
    store.close();
  });

  it("returns the original idempotent result across a process restart", async () => {
    const path = await databasePath("idempotency");
    let store = await openOperationalStore(path);
    seed(store);
    let calls = 0;
    const first = store.executeIdempotent(
      {
        tenantId: ids.tenantA,
        actorUserId: ids.userA,
        scope: "conversation:create",
        key: "idem_000000000001",
      },
      () => {
        calls += 1;
        return { statusCode: 202, body: { conversationId: ids.conversationA } };
      },
    );
    store.close();

    store = await openOperationalStore(path);
    const replay = store.executeIdempotent(
      {
        tenantId: ids.tenantA,
        actorUserId: ids.userA,
        scope: "conversation:create",
        key: "idem_000000000001",
      },
      () => {
        calls += 1;
        return { statusCode: 500, body: { code: "duplicate" } };
      },
    );

    assert.equal(first.replayed, false);
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.response, first.response);
    assert.equal(calls, 1);
    store.close();
  });

  it("replays concurrent async commands through the durable idempotency boundary", async () => {
    const store = await openOperationalStore(await databasePath("async-idempotency"));
    seed(store);
    let calls = 0;
    const input = {
      tenantId: ids.tenantA,
      actorUserId: ids.userA,
      scope: "fix:project",
      key: "idem_async_000000000001",
    };
    const callback = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { statusCode: 202, body: { runId: "run_async_000000000001" } };
    };
    const [first, second] = await Promise.all([
      store.executeIdempotentAsync(input, callback),
      store.executeIdempotentAsync(input, callback),
    ]);

    assert.equal(calls, 1);
    assert.equal(first.replayed, false);
    assert.equal(second.replayed, true);
    assert.deepEqual(second.response, first.response);
    store.close();
  });

  it("assigns monotonically increasing event cursors across restart", async () => {
    const path = await databasePath("events");
    let store = await openOperationalStore(path);
    seed(store);
    const first = store.appendEvent({
      id: "evt_000000000001",
      tenantId: ids.tenantA,
      conversationId: ids.conversationA,
      type: "conversation.created",
      payload: { title: "Foundation proof" },
    });
    const second = store.appendEvent({
      id: "evt_000000000002",
      tenantId: ids.tenantA,
      conversationId: ids.conversationA,
      type: "run.queued",
      payload: { runId: "run_000000000001" },
    });
    store.close();

    store = await openOperationalStore(path);
    const third = store.appendEvent({
      id: "evt_000000000003",
      tenantId: ids.tenantA,
      conversationId: ids.conversationA,
      type: "run.started",
      payload: { runId: "run_000000000001" },
    });
    const events = store.listEvents({
      tenantId: ids.tenantA,
      conversationId: ids.conversationA,
      after: 0,
      limit: 20,
    });

    assert.deepEqual([first.cursor, second.cursor, third.cursor], [1, 2, 3]);
    assert.deepEqual(
      events.map((event: { cursor: number }) => event.cursor),
      [1, 2, 3],
    );
    store.close();
  });

  it("restores persisted conversations and rejects destructive down migration", async () => {
    const path = await databasePath("restart");
    let store = await openOperationalStore(path);
    seed(store);
    assert.equal(store.schemaVersion(), 8);
    assert.throws(() => store.migrateDown(), MigrationPolicyError);
    store.close();

    store = await openOperationalStore(path);
    assert.deepEqual(
      store.getConversation({
        tenantId: ids.tenantA,
        conversationId: ids.conversationA,
      }),
      {
        id: ids.conversationA,
        projectId: ids.projectA,
        title: "Foundation proof",
        state: "idle",
      },
    );
    store.close();
  });

  it("persists redacted run checkpoints and recovers an in-flight run after restart", async () => {
    const path = await databasePath("runs");
    let store = await openOperationalStore(path);
    seed(store);
    const created = store.createRun({
      id: ids.runA,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      conversationId: ids.conversationA,
      runtimeId: "codex",
      executionProviderId: "managed-disposable",
      taskKind: "audit",
    });
    assert.equal(created.state, "queued");
    assert.deepEqual(created.checkpoint, { phase: "queued" });

    const started = store.checkpointRun({
      tenantId: ids.tenantA,
      runId: ids.runA,
      state: "running",
      checkpoint: { phase: "workspace_ready", eventCursor: 12 },
    });
    assert.equal(started.state, "running");
    assert.deepEqual(started.checkpoint, { phase: "workspace_ready", eventCursor: 12 });
    store.close();

    store = await openOperationalStore(path);
    assert.equal(store.recoverInFlightRuns({ occurredAt: "2026-08-02T10:00:00.000Z" }), 1);
    assert.deepEqual(store.getRun({ tenantId: ids.tenantA, runId: ids.runA }), {
      ...started,
      state: "interrupted",
      checkpoint: { phase: "runner_restart", reason: "in_flight_run_recovered" },
      updatedAt: "2026-08-02T10:00:00.000Z",
    });
    assert.equal(store.getRun({ tenantId: ids.tenantB, runId: ids.runA }), undefined);
    assert.throws(
      () => store.checkpointRun({
        tenantId: ids.tenantA,
        runId: ids.runA,
        state: "completed",
        checkpoint: { phase: "done" },
      }),
      /Invalid run state transition/,
    );
    assert.throws(
      () => store.checkpointRun({
        tenantId: ids.tenantA,
        runId: ids.runA,
        state: "interrupted",
        checkpoint: { authorization: "Bearer secret" },
      }),
      SecretPayloadError,
    );
    store.close();
  });

  it("migrates an existing schema v2 database before using durable run tables", async () => {
    const path = await databasePath("migration-v2");
    const legacy = new DatabaseSync(path);
    legacy.exec("CREATE TABLE meta(version INTEGER NOT NULL); INSERT INTO meta VALUES(2);");
    legacy.close();

    const store = await openOperationalStore(path);
    assert.equal(store.schemaVersion(), 8);
    seed(store);
    assert.equal(
      store.createRun({
        id: ids.runA,
        tenantId: ids.tenantA,
        projectId: ids.projectA,
        conversationId: ids.conversationA,
        runtimeId: "codex",
        executionProviderId: "managed-disposable",
        taskKind: "conversation",
      }).state,
      "queued",
    );
    store.close();
  });

  it("persists runtime session mappings and capability decisions inside the tenant boundary", async () => {
    const store = await openOperationalStore(await databasePath("runtime-projection"));
    seed(store);
    store.createRun({
      id: ids.runA,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      conversationId: ids.conversationA,
      runtimeId: "codex",
      executionProviderId: "managed-disposable",
      taskKind: "conversation",
    });
    store.saveRuntimeSession({
      id: ids.sessionA,
      tenantId: ids.tenantA,
      conversationId: ids.conversationA,
      runtimeId: "codex",
      runtimeSessionId: "runtime-session-opaque",
      state: "active",
    });
    assert.deepEqual(
      store.getRuntimeSession({ tenantId: ids.tenantA, conversationId: ids.conversationA }),
      {
        id: ids.sessionA,
        tenantId: ids.tenantA,
        conversationId: ids.conversationA,
        runtimeId: "codex",
        runtimeSessionId: "runtime-session-opaque",
        state: "active",
      },
    );
    store.saveCapabilityDecision({
      tenantId: ids.tenantA,
      runId: ids.runA,
      runtimeId: "codex",
      required: ["sessions", "semanticEvents", "isolatedWorkspaces"],
      missing: [],
      accepted: true,
    });
    assert.deepEqual(store.getCapabilityDecision({ tenantId: ids.tenantA, runId: ids.runA }), {
      tenantId: ids.tenantA,
      runId: ids.runA,
      runtimeId: "codex",
      required: ["sessions", "semanticEvents", "isolatedWorkspaces"],
      missing: [],
      accepted: true,
    });
    assert.equal(store.getRuntimeSession({ tenantId: ids.tenantB, conversationId: ids.conversationA }), undefined);
    assert.equal(store.getCapabilityDecision({ tenantId: ids.tenantB, runId: ids.runA }), undefined);
    store.close();
  });

  it("persists approvals, health evidence, and bounded run usage summaries", async () => {
    const store = await openOperationalStore(await databasePath("operational-projections"));
    seed(store);
    store.createRun({
      id: ids.runA,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      conversationId: ids.conversationA,
      runtimeId: "codex",
      executionProviderId: "managed-disposable",
      taskKind: "fix",
    });
    store.createApproval({
      id: ids.approvalA,
      tenantId: ids.tenantA,
      runId: ids.runA,
      requestedAt: "2026-08-02T09:00:00.000Z",
    });
    store.resolveApproval({
      tenantId: ids.tenantA,
      approvalId: ids.approvalA,
      state: "approved",
      resolvedAt: "2026-08-02T09:01:00.000Z",
    });
    assert.deepEqual(store.getApproval({ tenantId: ids.tenantA, approvalId: ids.approvalA }), {
      id: ids.approvalA,
      tenantId: ids.tenantA,
      runId: ids.runA,
      state: "approved",
      requestedAt: "2026-08-02T09:00:00.000Z",
      resolvedAt: "2026-08-02T09:01:00.000Z",
    });
    store.appendHealthEvidence({
      id: ids.evidenceA,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      dimension: "security",
      status: "warning",
      summary: { text: "One security issue remains.", issueCount: 1, source: "shipglows-skill" },
      sourceCommit: "abc123",
      observedAt: "2026-08-02T09:02:00.000Z",
      skillRunId: null,
      contextBundleId: null,
    });
    assert.deepEqual(store.listHealthEvidence({ tenantId: ids.tenantA, projectId: ids.projectA }), [{
      id: ids.evidenceA,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      dimension: "security",
      status: "warning",
      summary: { text: "One security issue remains.", issueCount: 1, source: "shipglows-skill" },
      sourceCommit: "abc123",
      observedAt: "2026-08-02T09:02:00.000Z",
      skillRunId: null,
      contextBundleId: null,
    }]);
    const cockpit = store.listCockpitProjects({
      tenantId: ids.tenantA,
      userId: ids.userA,
      evaluatedAt: "2026-08-02T10:00:00.000Z",
    });
    assert.equal(cockpit.length, 1);
    assert.equal(cockpit[0]?.health.overallStatus, "warning");
    assert.equal(cockpit[0]?.health.coverage, 0.2);
    assert.equal(
      cockpit[0]?.health.dimensions.find((item) => item.dimension === "security")?.evidenceCount,
      1,
    );
    assert.equal(
      cockpit[0]?.health.dimensions.find((item) => item.dimension === "content")?.status,
      "notReported",
    );
    store.saveRunUsage({
      tenantId: ids.tenantA,
      runId: ids.runA,
      durationMs: 1500,
      inputUnits: 120,
      outputUnits: 80,
      estimatedCostMinor: 3,
    });
    assert.deepEqual(store.getRunUsage({ tenantId: ids.tenantA, runId: ids.runA }), {
      tenantId: ids.tenantA,
      runId: ids.runA,
      durationMs: 1500,
      inputUnits: 120,
      outputUnits: 80,
      estimatedCostMinor: 3,
    });
    assert.equal(store.getApproval({ tenantId: ids.tenantB, approvalId: ids.approvalA }), undefined);
    store.close();
  });

  it("atomically persists skill context, run, evidence, and Cockpit provenance", async () => {
    const store = await openOperationalStore(await databasePath("skill-evidence-provenance"));
    seed(store);
    const envelope = skillEvidenceEnvelope();

    store.persistSkillEvidenceEnvelope(envelope);

    assert.deepEqual(
      store.getProjectContextBundle({ tenantId: ids.tenantA, bundleId: ids.contextA }),
      envelope.context,
    );
    assert.deepEqual(
      store.getSkillRun({ tenantId: ids.tenantA, skillRunId: ids.skillRunA }),
      envelope.run,
    );
    assert.equal(
      store.listHealthEvidence({ tenantId: ids.tenantA, projectId: ids.projectA })[0]?.skillRunId,
      ids.skillRunA,
    );
    const security = store.listCockpitProjects({
      tenantId: ids.tenantA,
      userId: ids.userA,
      evaluatedAt: "2026-08-02T10:00:00.000Z",
    })[0]?.health.dimensions.find((item) => item.dimension === "security");
    assert.equal(security?.skillRunId, ids.skillRunA);
    assert.equal(security?.contextBundleId, ids.contextA);
    assert.equal(store.getSkillRun({ tenantId: ids.tenantB, skillRunId: ids.skillRunA }), undefined);

    const rollbackEnvelope = skillEvidenceEnvelope({
      contextId: "ctx_000000000002",
      skillRunId: "skr_000000000002",
      evidenceId: ids.evidenceA,
    });
    assert.throws(() => store.persistSkillEvidenceEnvelope(rollbackEnvelope));
    assert.equal(
      store.getProjectContextBundle({ tenantId: ids.tenantA, bundleId: "ctx_000000000002" }),
      undefined,
    );
    assert.equal(
      store.getSkillRun({ tenantId: ids.tenantA, skillRunId: "skr_000000000002" }),
      undefined,
    );
    store.close();
  });

  it("persists tenant-scoped workspace cleanup state without local paths", async () => {
    const store = await openOperationalStore(await databasePath("cleanup"));
    seed(store);
    store.createRun({
      id: ids.runA,
      tenantId: ids.tenantA,
      projectId: ids.projectA,
      conversationId: ids.conversationA,
      runtimeId: "codex",
      executionProviderId: "managed-disposable",
      taskKind: "fix",
    });
    store.scheduleWorkspaceCleanup({
      tenantId: ids.tenantA,
      runId: ids.runA,
      dueAt: "2026-08-02T09:00:00.000Z",
    });
    assert.deepEqual(
      store.listDueWorkspaceCleanups({
        tenantId: ids.tenantA,
        now: "2026-08-02T10:00:00.000Z",
      }),
      [{
        tenantId: ids.tenantA,
        runId: ids.runA,
        state: "pending",
        dueAt: "2026-08-02T09:00:00.000Z",
        attempts: 0,
        lastErrorCode: null,
      }],
    );
    store.markWorkspaceCleanup({
      tenantId: ids.tenantA,
      runId: ids.runA,
      state: "failed",
      errorCode: "workspace_not_found",
    });
    assert.deepEqual(
      store.listDueWorkspaceCleanups({
        tenantId: ids.tenantA,
        now: "2026-08-02T10:00:00.000Z",
      }),
      [],
    );
    assert.throws(
      () => store.scheduleWorkspaceCleanup({
        tenantId: ids.tenantB,
        runId: ids.runA,
        dueAt: "2026-08-02T09:00:00.000Z",
      }),
      /Run is unavailable for this tenant/,
    );
    store.close();
  });

  it("rejects secret-bearing event and idempotency payloads before persistence", async () => {
    const store = await openOperationalStore(await databasePath("secrets"));
    seed(store);

    assert.throws(
      () =>
        store.appendEvent({
          id: "evt_000000000001",
          tenantId: ids.tenantA,
          conversationId: ids.conversationA,
          type: "diagnostic.error",
          payload: { authorization: "Bearer secret" },
        }),
      SecretPayloadError,
    );
    assert.throws(
      () =>
        store.executeIdempotent(
          {
            tenantId: ids.tenantA,
            actorUserId: ids.userA,
            scope: "conversation:create",
            key: "idem_000000000002",
          },
          () => ({ statusCode: 200, body: { clonePath: "/private/repo" } }),
        ),
      SecretPayloadError,
    );
    store.close();
  });
});
