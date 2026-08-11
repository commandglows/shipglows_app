import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunnerApp, type RunnerAppDependencies } from "../../src/app.js";
import type { ActorContext, AuthenticationAdapter } from "../../src/auth/index.js";
import { loadConfig } from "../../src/config.js";
import type { AgentRuntime, OpaqueId } from "../../src/contracts/index.js";
import type { ProjectAccessRepository } from "../../src/projects/projectAccess.js";
import { OperatorWorkspaceGateway, type OperatorPty } from "../../src/operator-workspace/index.js";

const actor: ActorContext = {
  tenantId: "ten_000000000001",
  userId: "usr_000000000001",
  subject: "firebase-user-000000000001",
};

describe("runner API foundation", () => {
  it("serves a schema-validated version endpoint without internal paths", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }, { cwd: "/srv/private" }),
    });

    const response = await app.inject({ method: "GET", url: "/v1/version" });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      apiVersion: "v1",
      service: "shipglows-managed-runner",
      serviceVersion: "0.1.0",
      providers: { firebase: false, github: false, codex: false, eve: false },
    });
    assert.doesNotMatch(response.body, /\/srv\/private/);
  });

  it("applies authentication and tenant-scoped project access on the runner route", async () => {
    const authentication: AuthenticationAdapter = { authenticate: async () => actor };
    const projectAccess: ProjectAccessRepository = {
      hasProjectAccess: (input) =>
        input.tenantId === actor.tenantId &&
        input.userId === actor.userId &&
        input.projectId === "prj_000000000001" &&
        input.capability === "read",
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { authentication, projectAccess },
    });

    const allowed = await app.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000001/authorization",
    });
    const denied = await app.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000002/authorization",
    });
    await app.close();

    assert.equal(allowed.statusCode, 200);
    assert.deepEqual(allowed.json(), {
      projectId: "prj_000000000001",
      access: "read",
    });
    assert.equal(denied.statusCode, 403);
    assert.equal(denied.json().error.code, "projectForbidden");
  });

  it("fails closed on the protected runner route when authentication is absent", async () => {
    const app = buildRunnerApp({ config: loadConfig({ RUNNER_ENV: "test" }) });
    const response = await app.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000001/authorization",
    });
    await app.close();

    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, "unauthorized");
  });

  it("keeps the operator Workspace capability tenant-scoped and unavailable by default", async () => {
    const authentication: AuthenticationAdapter = { authenticate: async () => actor };
    const projectAccess: ProjectAccessRepository = { hasProjectAccess: () => true };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { authentication, projectAccess },
    });

    const unavailable = await app.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000001/operator-workspace",
    });
    await app.close();

    assert.equal(unavailable.statusCode, 503);
    assert.equal(unavailable.json().error.code, "operatorWorkspaceUnavailable");

    const forbiddenApp = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication,
        projectAccess: { hasProjectAccess: () => false },
        operatorWorkspaceCapability: async () => ({ available: true, reason: "ready" }),
      },
    });
    const forbidden = await forbiddenApp.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000001/operator-workspace",
    });
    await forbiddenApp.close();

    assert.equal(forbidden.statusCode, 403);
    assert.equal(forbidden.json().error.code, "projectForbidden");
  });

  it("creates and closes an opaque operator session through authenticated routes", async () => {
    const pty: OperatorPty = {
      write: () => undefined,
      resize: () => undefined,
      kill: () => undefined,
      onData: () => ({ dispose: () => undefined }),
      onExit: () => ({ dispose: () => undefined }),
    };
    const gateway = new OperatorWorkspaceGateway({ prj_000000000001: { cwd: "/srv/private/project", tmuxSession: "shipglows-project" } }, () => pty);
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        operatorWorkspaceGateway: gateway,
      },
    });
    const created = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/operator-sessions", headers: { "idempotency-key": "workspace-test-1" } });
    assert.equal(created.statusCode, 201);
    assert.doesNotMatch(created.body, /srv|tmux|shipglows-project/);
    const body = created.json();
    const closed = await app.inject({ method: "POST", url: `/v1/operator-sessions/${body.sessionId}/close` });
    await app.close();
    assert.equal(closed.statusCode, 200);
    assert.equal(closed.json().state, "closed");
  });

  it("resolves a canonical project identity only through the tenant-scoped server directory", async () => {
    const authentication: AuthenticationAdapter = { authenticate: async () => actor };
    const resolverInputs: unknown[] = [];
    const projectAccess: ProjectAccessRepository = {
      resolveProjectId: (input) => {
        resolverInputs.push(input);
        return input.sourceSystem === "shipglows-app" && input.sourceProjectId === "api_proj_1"
          ? "runner_proj_1"
          : null;
      },
      hasProjectAccess: (input) => input.projectId === "runner_proj_1" && input.capability === "read",
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { authentication, projectAccess },
    });

    const resolved = await app.inject({
      method: "GET",
      url: "/v1/projects/resolve?sourceSystem=shipglows-app&sourceProjectId=api_proj_1",
    });
    const missingAccess = await app.inject({
      method: "GET",
      url: "/v1/projects/resolve?sourceSystem=shipglows-app&sourceProjectId=api_proj_missing",
    });
    await app.close();

    assert.equal(resolved.statusCode, 200);
    assert.deepEqual(resolved.json(), {
      sourceSystem: "shipglows-app",
      sourceProjectId: "api_proj_1",
      projectId: "runner_proj_1",
    });
    assert.equal(missingAccess.statusCode, 404);
    assert.equal(missingAccess.json().error.code, "projectIdentityNotFound");
    assert.deepEqual(resolverInputs, [{
      tenantId: actor.tenantId,
      userId: actor.userId,
      sourceSystem: "shipglows-app",
      sourceProjectId: "api_proj_1",
    }, {
      tenantId: actor.tenantId,
      userId: actor.userId,
      sourceSystem: "shipglows-app",
      sourceProjectId: "api_proj_missing",
    }]);
  });

  it("returns identityUnavailable when no canonical project directory is configured", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
      },
    });
    const response = await app.inject({
      method: "GET",
      url: "/v1/projects/resolve?sourceSystem=shipglows-app&sourceProjectId=api_proj_1",
    });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "identityUnavailable");
  });

  it("starts a tenant-scoped audit run through the protected command route", async () => {
    const opaque = (value: string) => value as OpaqueId;
    const auditStore: NonNullable<RunnerAppDependencies["auditStore"]> = {
      createConversation: () => undefined,
      createRun: () => ({
        id: "run_000000000001",
        tenantId: actor.tenantId,
        projectId: "prj_000000000001",
        conversationId: "cnv_000000000001",
        runtimeId: "codex",
        executionProviderId: "managed-disposable",
        taskKind: "audit",
        state: "queued",
        checkpoint: { phase: "queued" },
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
      appendEvent: (input) => ({
        ...input,
        cursor: 1,
        occurredAt: "2026-08-02T00:00:00.000Z",
      }),
      saveRuntimeSession: () => undefined,
      checkpointRun: (input) => ({
        id: "run_000000000001",
        tenantId: input.tenantId,
        projectId: "prj_000000000001",
        conversationId: "cnv_000000000001",
        runtimeId: "codex",
        executionProviderId: "managed-disposable",
        taskKind: "audit",
        state: input.state,
        checkpoint: input.checkpoint,
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
    };
    const runtime: AgentRuntime = {
      id: "codex",
      capabilities: new Set(["sessions", "turns", "resume", "interrupt", "semanticEvents"]),
      createSession: async () => ({ runtimeSessionId: opaque("thread_000000000001"), state: "idle" }),
      resumeSession: async () => ({ runtimeSessionId: opaque("thread_000000000001"), state: "idle" }),
      startTurn: async () => ({ runtimeTurnId: opaque("turn_000000000001"), state: "queued" }),
      interruptTurn: async () => undefined,
      async *events() {
        yield { type: "turn.completed", occurredAt: "2026-08-02T00:00:00.000Z", payload: {} };
      },
    };
    const authentication: AuthenticationAdapter = { authenticate: async () => actor };
    const projectAccess: ProjectAccessRepository = { hasProjectAccess: () => true };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication,
        projectAccess,
        auditStore,
        agentRuntime: runtime,
        idempotencyStore: {
          executeIdempotentAsync: async (_input, callback) => ({ replayed: false, response: await callback() }),
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/audits",
      headers: { "idempotency-key": "audit-test-1" },
      payload: { scope: "security" },
    });
    await app.close();

    assert.equal(response.statusCode, 202);
    assert.equal(response.json().state, "running");
    assert.match(response.json().runId, /^run_/);
  });

  it("rejects a state-changing request from an untrusted browser origin", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ALLOWED_ORIGINS: "https://cockpit.example.com" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/audits",
      headers: { origin: "https://evil.example", "idempotency-key": "audit-origin-1" },
      payload: { scope: "security" },
    });
    await app.close();

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error.code, "originNotAllowed");
  });

  it("accepts an explicitly allowed browser origin on a state-changing route", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ALLOWED_ORIGINS: "https://cockpit.example.com/" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/audits",
      headers: { origin: "https://cockpit.example.com", "idempotency-key": "audit-allowed-1" },
      payload: { scope: "security" },
    });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "runtimeUnavailable");
  });

  it("fails closed until the isolated fix executor is wired", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ALLOWED_ORIGINS: "https://cockpit.example.com" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/fixes",
      headers: { origin: "https://cockpit.example.com", "idempotency-key": "fix-test-1" },
      payload: { issueId: "issue-42", instruction: "Apply the safe fix." },
    });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().error.code, "fixUnavailable");
  });

  it("resolves an approval once and replays the durable idempotent response", async () => {
    let runtimeCalls = 0;
    let resolveCalls = 0;
    const approvalStore: NonNullable<RunnerAppDependencies["approvalStore"]> = {
      getApproval: () => ({
        id: "approval_000000000001",
        tenantId: actor.tenantId,
        runId: "run_000000000001",
        state: "pending",
        requestedAt: "2026-08-02T00:00:00.000Z",
        resolvedAt: null,
      }),
      getRun: () => ({
        id: "run_000000000001",
        tenantId: actor.tenantId,
        projectId: "prj_000000000001",
        conversationId: "cnv_000000000001",
        runtimeId: "codex",
        executionProviderId: "managed-disposable",
        taskKind: "fix",
        state: "running",
        checkpoint: {},
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
      getRuntimeSession: () => ({
        id: "ses_000000000001",
        tenantId: actor.tenantId,
        conversationId: "cnv_000000000001",
        runtimeId: "codex",
        runtimeSessionId: "thread_000000000001",
        state: "active",
      }),
      resolveApproval: () => { resolveCalls += 1; },
      appendEvent: (input) => ({
        ...input,
        cursor: 1,
        occurredAt: "2026-08-02T00:00:00.000Z",
      }),
    };
    const runtime: AgentRuntime = {
      id: "codex",
      capabilities: new Set(["approvals"]),
      createSession: async () => ({ runtimeSessionId: "thread_000000000001" as OpaqueId, state: "idle" }),
      resumeSession: async () => ({ runtimeSessionId: "thread_000000000001" as OpaqueId, state: "idle" }),
      startTurn: async () => ({ runtimeTurnId: "turn_000000000001" as OpaqueId, state: "queued" }),
      interruptTurn: async () => undefined,
      resolveApproval: async () => { runtimeCalls += 1; },
      async *events() { yield* []; },
    };
    const idempotencyStore: NonNullable<RunnerAppDependencies["idempotencyStore"]> = {
      executeIdempotentAsync: async <T extends Readonly<Record<string, unknown>>>(_input: unknown, callback: () => Promise<{ statusCode: number; body: T }>) => {
        if (runtimeCalls > 0) return { replayed: true, response: { statusCode: 200, body: { approvalId: "approval_000000000001", state: "approved" } as unknown as T } };
        return { replayed: false, response: await callback() };
      },
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        approvalStore,
        agentRuntime: runtime,
        idempotencyStore,
      },
    });
    const request = {
      method: "POST" as const,
      url: "/v1/projects/prj_000000000001/approvals/approval_000000000001",
      headers: { "idempotency-key": "approval-test-1" },
      payload: { decision: "approve" },
    };
    const first = await app.inject(request);
    const second = await app.inject(request);
    await app.close();

    assert.equal(first.statusCode, 200);
    assert.deepEqual(second.json(), first.json());
    assert.equal(runtimeCalls, 1);
    assert.equal(resolveCalls, 1);
  });

  it("fails closed when an audit attempts to approve a privileged runtime action", async () => {
    let runtimeCalls = 0;
    let resolveCalls = 0;
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        approvalStore: {
          getApproval: () => ({ id: "approval_policy", tenantId: actor.tenantId, runId: "run_policy", state: "pending", requestedAt: "2026-08-08T00:00:00.000Z", resolvedAt: null }),
          getRun: () => ({ id: "run_policy", tenantId: actor.tenantId, projectId: "prj_000000000001", conversationId: "cnv_policy", runtimeId: "codex", executionProviderId: "managed-disposable", taskKind: "audit", state: "running", checkpoint: {}, createdAt: "2026-08-08T00:00:00.000Z", updatedAt: "2026-08-08T00:00:00.000Z" }),
          getRuntimeSession: () => ({ id: "ses_policy", tenantId: actor.tenantId, conversationId: "cnv_policy", runtimeId: "codex", runtimeSessionId: "thread_policy", state: "active" }),
          resolveApproval: () => { resolveCalls += 1; },
          appendEvent: (input) => ({ ...input, cursor: 1, occurredAt: "2026-08-08T00:00:00.000Z" }),
        },
        agentRuntime: {
          id: "codex", capabilities: new Set(["approvals"]),
          createSession: async () => ({ runtimeSessionId: "thread_policy" as OpaqueId, state: "idle" }),
          resumeSession: async () => ({ runtimeSessionId: "thread_policy" as OpaqueId, state: "idle" }),
          startTurn: async () => ({ runtimeTurnId: "turn_policy" as OpaqueId, state: "queued" }),
          interruptTurn: async () => undefined,
          resolveApproval: async () => { runtimeCalls += 1; },
          async *events() { yield* []; },
        },
        idempotencyStore: {
          executeIdempotentAsync: async (_input, callback) => ({ replayed: false, response: await callback() }),
        },
      },
    });
    const response = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/approvals/approval_policy", headers: { "idempotency-key": "policy-1" }, payload: { decision: "approve" } });
    await app.close();

    assert.equal(response.statusCode, 403);
    assert.equal(response.json().error.code, "approvalPolicyDenied");
    assert.equal(runtimeCalls, 0);
    assert.equal(resolveCalls, 0);
  });

  it("creates conversations and replays duplicate messages without a second turn", async () => {
    let startTurnCalls = 0;
    let conversationCreateCalls = 0;
    const run = {
      id: "run_000000000002",
      tenantId: actor.tenantId,
      projectId: "prj_000000000001",
      conversationId: "cnv_000000000002",
      runtimeId: "codex",
      executionProviderId: "managed-disposable",
      taskKind: "conversation" as const,
      state: "running" as const,
      checkpoint: { phase: "turn_started", runtimeTurnId: "turn_000000000002" },
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    };
    const conversationStore: NonNullable<RunnerAppDependencies["conversationStore"]> = {
      createConversation: () => { conversationCreateCalls += 1; },
      getConversation: () => ({ id: "cnv_000000000002", projectId: "prj_000000000001", title: "Cockpit", state: "active" }),
      createRun: () => run,
      getRun: () => run,
      getLatestRun: () => run,
      saveRuntimeSession: () => undefined,
      getRuntimeSession: () => ({ id: "ses_000000000002", tenantId: actor.tenantId, conversationId: "cnv_000000000002", runtimeId: "codex", runtimeSessionId: "thread_000000000002", state: "active" }),
      checkpointRun: () => run,
      appendEvent: (input) => ({ ...input, cursor: 1, occurredAt: "2026-08-02T00:00:00.000Z" }),
    };
    const runtime: AgentRuntime = {
      id: "codex",
      capabilities: new Set(["sessions", "turns", "resume", "interrupt", "semanticEvents"]),
      createSession: async () => ({ runtimeSessionId: "thread_000000000002" as OpaqueId, state: "idle" }),
      resumeSession: async () => ({ runtimeSessionId: "thread_000000000002" as OpaqueId, state: "idle" }),
      startTurn: async () => { startTurnCalls += 1; return { runtimeTurnId: "turn_000000000002" as OpaqueId, state: "queued" }; },
      interruptTurn: async () => undefined,
      async *events() { yield { type: "turn.completed", occurredAt: "2026-08-02T00:00:00.000Z", payload: {} }; },
    };
    const idempotent = new Map<string, { statusCode: number; body: Readonly<Record<string, unknown>> }>();
    const idempotencyStore: NonNullable<RunnerAppDependencies["idempotencyStore"]> = {
      executeIdempotentAsync: async <T extends Readonly<Record<string, unknown>>>(input: { scope: string; key: string }, callback: () => Promise<{ statusCode: number; body: T }>) => {
        const key = `${input.scope}:${input.key}`;
        const previous = idempotent.get(key);
        if (previous !== undefined) return { replayed: true, response: { statusCode: previous.statusCode, body: previous.body as T } };
        const response = await callback();
        idempotent.set(key, response);
        return { replayed: false, response };
      },
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        conversationStore,
        agentRuntime: runtime,
        idempotencyStore,
      },
    });
    const created = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/conversations", headers: { "idempotency-key": "conversation-create-1" }, payload: { title: "Cockpit" } });
    const message = { method: "POST" as const, url: "/v1/projects/prj_000000000001/conversations/cnv_000000000002/messages", headers: { "idempotency-key": "message-1" }, payload: { text: "Inspect this project." } };
    const firstMessage = await app.inject(message);
    const replayedMessage = await app.inject(message);
    await app.close();

    assert.equal(created.statusCode, 201);
    assert.equal(conversationCreateCalls, 1);
    assert.equal(firstMessage.statusCode, 202);
    assert.deepEqual(replayedMessage.json(), firstMessage.json());
    assert.equal(startTurnCalls, 1);
  });

  it("interrupts and resumes the server-owned conversation session", async () => {
    let interruptCalls = 0;
    let resumeCalls = 0;
    const activeRun = {
      id: "run_000000000003",
      tenantId: actor.tenantId,
      projectId: "prj_000000000001",
      conversationId: "cnv_000000000003",
      runtimeId: "codex",
      executionProviderId: "managed-disposable",
      taskKind: "conversation" as const,
      state: "running" as const,
      checkpoint: { phase: "turn_started", runtimeTurnId: "turn_000000000003" },
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-02T00:00:00.000Z",
    };
    const conversationStore: NonNullable<RunnerAppDependencies["conversationStore"]> = {
      createConversation: () => undefined,
      getConversation: () => ({ id: "cnv_000000000003", projectId: "prj_000000000001", title: "Cockpit", state: "active" }),
      createRun: () => activeRun,
      getRun: () => activeRun,
      getLatestRun: () => activeRun,
      saveRuntimeSession: () => undefined,
      getRuntimeSession: () => ({ id: "ses_000000000003", tenantId: actor.tenantId, conversationId: "cnv_000000000003", runtimeId: "codex", runtimeSessionId: "thread_000000000003", state: "active" }),
      checkpointRun: () => activeRun,
      appendEvent: (input) => ({ ...input, cursor: 1, occurredAt: "2026-08-02T00:00:00.000Z" }),
    };
    const runtime: AgentRuntime = {
      id: "codex",
      capabilities: new Set(["sessions", "turns", "resume", "interrupt", "semanticEvents"]),
      createSession: async () => ({ runtimeSessionId: "thread_000000000003" as OpaqueId, state: "idle" }),
      resumeSession: async () => { resumeCalls += 1; return { runtimeSessionId: "thread_000000000003" as OpaqueId, state: "idle" }; },
      startTurn: async () => ({ runtimeTurnId: "turn_000000000003" as OpaqueId, state: "queued" }),
      interruptTurn: async () => { interruptCalls += 1; },
      async *events() { yield* []; },
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        conversationStore,
        agentRuntime: runtime,
        idempotencyStore: {
          executeIdempotentAsync: async (_input, callback) => ({ replayed: false, response: await callback() }),
        },
      },
    });
    const interrupted = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/conversations/cnv_000000000003/interrupt", headers: { "idempotency-key": "interrupt-1" }, payload: {} });
    const resumed = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/conversations/cnv_000000000003/resume", headers: { "idempotency-key": "resume-1" }, payload: {} });
    await app.close();

    assert.equal(interrupted.statusCode, 200);
    assert.equal(interrupted.json().state, "interrupted");
    assert.equal(resumed.statusCode, 200);
    assert.equal(resumed.json().state, "idle");
    assert.equal(interruptCalls, 1);
    assert.equal(resumeCalls, 1);
  });

  it("does not disclose cross-project conversations and blocks missing mutation access", async () => {
    const runtime: AgentRuntime = {
      id: "codex",
      capabilities: new Set(["sessions", "turns", "resume", "interrupt", "semanticEvents"]),
      createSession: async () => ({ runtimeSessionId: "thread_000000000004" as OpaqueId, state: "idle" }),
      resumeSession: async () => ({ runtimeSessionId: "thread_000000000004" as OpaqueId, state: "idle" }),
      startTurn: async () => ({ runtimeTurnId: "turn_000000000004" as OpaqueId, state: "queued" }),
      interruptTurn: async () => undefined,
      async *events() { yield* []; },
    };
    const conversationStore: NonNullable<RunnerAppDependencies["conversationStore"]> = {
      createConversation: () => undefined,
      getConversation: () => ({ id: "cnv_000000000004", projectId: "prj_000000000002", title: "Private", state: "active" }),
      createRun: () => ({
        id: "run_000000000004",
        tenantId: actor.tenantId,
        projectId: "prj_000000000002",
        conversationId: "cnv_000000000004",
        runtimeId: "codex",
        executionProviderId: "managed-disposable",
        taskKind: "conversation",
        state: "running",
        checkpoint: { runtimeTurnId: "turn_000000000004" },
        createdAt: "2026-08-02T00:00:00.000Z",
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
      getRun: () => undefined,
      getLatestRun: () => undefined,
      saveRuntimeSession: () => undefined,
      getRuntimeSession: () => ({ id: "ses_000000000004", tenantId: actor.tenantId, conversationId: "cnv_000000000004", runtimeId: "codex", runtimeSessionId: "thread_000000000004", state: "active" }),
      checkpointRun: () => { throw new Error("must not checkpoint a cross-project conversation"); },
      appendEvent: () => { throw new Error("must not append a cross-project event"); },
    };
    const dependencies: RunnerAppDependencies = {
      authentication: { authenticate: async () => actor },
      projectAccess: { hasProjectAccess: () => true },
      conversationStore,
      agentRuntime: runtime,
      idempotencyStore: { executeIdempotentAsync: async (_input, callback) => ({ replayed: false, response: await callback() }) },
    };
    const hidden = buildRunnerApp({ config: loadConfig({ RUNNER_ENV: "test" }), dependencies });
    const hiddenResponse = await hidden.inject({ method: "POST", url: "/v1/projects/prj_000000000001/conversations/cnv_000000000004/interrupt", headers: { "idempotency-key": "hidden-1" }, payload: {} });
    await hidden.close();

    const forbidden = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { authentication: { authenticate: async () => actor }, projectAccess: { hasProjectAccess: () => false } },
    });
    const forbiddenResponse = await forbidden.inject({ method: "POST", url: "/v1/projects/prj_000000000001/conversations", headers: { "idempotency-key": "forbidden-1" }, payload: { title: "Denied" } });
    await forbidden.close();

    assert.equal(hiddenResponse.statusCode, 404);
    assert.equal(hiddenResponse.json().error.code, "conversationNotFound");
    assert.equal(forbiddenResponse.statusCode, 403);
    assert.equal(forbiddenResponse.json().error.code, "projectForbidden");
  });

  it("replays tenant-scoped conversation events through an SSE resume surface", async () => {
    const eventStore: NonNullable<RunnerAppDependencies["eventStore"]> = {
      getConversation: () => ({
        id: "cnv_000000000001",
        projectId: "prj_000000000001",
        title: "Audit",
        state: "active",
      }),
      listEvents: ({ after }) => after === 0 ? [{
        cursor: 1,
        id: "evt_000000000001",
        tenantId: actor.tenantId,
        conversationId: "cnv_000000000001",
        type: "run.started",
        payload: { runId: "run_000000000001" },
        occurredAt: "2026-08-02T00:00:00.000Z",
      }] : [],
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        eventStore,
      },
    });
    const response = await app.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000001/conversations/cnv_000000000001/events?after=0",
    });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.match(response.headers["content-type"] ?? "", /^text\/event-stream/);
    assert.match(response.body, /id: 1/);
    assert.match(response.body, /event: run\.started/);
    assert.match(response.body, /event: stream\.heartbeat/);
    assert.doesNotMatch(response.body, /ten_000000000001/);
  });
});
