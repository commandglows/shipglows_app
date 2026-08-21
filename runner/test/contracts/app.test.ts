import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRunnerApp, type RunnerAppDependencies } from "../../src/app.js";
import type { ActorContext, AuthenticationAdapter } from "../../src/auth/index.js";
import { CloudProjectCatalogError } from "../../src/cloud-projects/index.js";
import { loadConfig } from "../../src/config.js";
import type { AgentRuntime, OpaqueId } from "../../src/contracts/index.js";
import type { ProjectAccessRepository } from "../../src/projects/projectAccess.js";
import { OperatorWorkspaceGateway, type OperatorPty } from "../../src/operator-workspace/index.js";
import { createBuildIdentity, RunnerDiagnostics } from "../../src/observability/index.js";
import type { PreviewIngressService } from "../../src/preview-ingress/index.js";

const actor: ActorContext = {
  tenantId: "ten_000000000001",
  userId: "usr_000000000001",
  subject: "firebase-user-000000000001",
};

describe("runner API foundation", () => {
  it("logs bounded access denials without credentials or query values", async () => {
    const events: unknown[] = [];
    const authentication: AuthenticationAdapter = {
      authenticate: async () => null,
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication,
        accessDiagnosticSink: (event) => events.push(event),
      },
    });
    const response = await app.inject({
      method: "GET",
      url: "/v1/diagnostics?token=must-not-leak",
      headers: { authorization: "Bearer must-not-leak" },
    });
    await app.close();

    assert.equal(response.statusCode, 401);
    assert.equal(events.length, 1);
    const serialized = JSON.stringify(events);
    assert.doesNotMatch(serialized, /must-not-leak/);
    assert.match(serialized, /diagnostics/);
  });
  it("serves a minimal liveness response without build, config, or path details", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }, { cwd: "/srv/private" }),
    });

    const response = await app.inject({ method: "GET", url: "/health/live" });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: "ok" });
    assert.doesNotMatch(response.body, /version|commit|provider|\/srv\/private/i);
  });

  it("keeps structured diagnostics authenticated and redacts synthetic failures", async () => {
    const diagnostics = new RunnerDiagnostics({
      build: createBuildIdentity({
        RUNNER_BUILD_ID: "test-build",
        RUNNER_BUILD_COMMIT: "a232292d",
        RUNNER_BUILD_TIMESTAMP: "2026-08-11T16:00:00.000Z",
      }),
      probes: [{ name: "database", check: () => { throw new Error("ghp_abcdefghijklmnopqrstuvwxyz at /srv/private.sqlite"); } }],
      now: () => new Date("2026-08-11T16:05:00.000Z"),
    });
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { authentication: { authenticate: async () => actor }, diagnostics },
    });

    const response = await app.inject({ method: "GET", url: "/v1/diagnostics" });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.equal(response.json().status, "degraded");
    assert.deepEqual(response.json().checks, [
      { name: "database", status: "failed", code: "dependencyFailure" },
    ]);
    assert.doesNotMatch(response.body, /ghp_|\/srv\/|private\.sqlite/i);
  });

  it("fails closed when unauthenticated diagnostics are requested", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { diagnostics: new RunnerDiagnostics() },
    });
    const response = await app.inject({ method: "GET", url: "/v1/diagnostics" });
    await app.close();
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, "unauthorized");
  });

  it("reports an unexpected server failure only through the stable error code", async () => {
    const captured: string[] = [];
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        diagnostics: new RunnerDiagnostics({ now: () => new Date(Number.NaN) }),
        errorReporter: { capture: (code) => { captured.push(code); } },
      },
    });
    const response = await app.inject({ method: "GET", url: "/v1/diagnostics" });
    await app.close();
    assert.equal(response.statusCode, 500);
    assert.deepEqual(captured, ["httpRequestFailed"]);
  });

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

  it("reports a stale cloud project catalog as unavailable instead of an internal error", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => false },
        cloudProjectCatalog: { read: async () => { throw new CloudProjectCatalogError("catalogStale"); } },
        // A non-owner actor does not read the catalog during reconciliation.
        reconcileCloudProjects: () => Promise.resolve(),
      },
    });

    const response = await app.inject({ method: "GET", url: "/v1/cloud-projects" });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), {
      error: { code: "catalogStale", message: "The project catalog is stale." },
    });
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

  it("serves the evaluator-owned five-dimension Cockpit projection unchanged", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        cockpitStore: {
          listCockpitProjects: () => [{
            id: "prj_000000000001",
            name: "shipglows/demo",
            repositoryFullName: "shipglows/demo",
            accessState: "available",
            health: {
              overallStatus: "stale",
              coverage: 0.2,
              dimensions: [
                { dimension: "tech", status: "stale", summary: { text: "Evidence expired." }, producer: "shipglows.test", evidenceCount: 1, sourceCommit: "abc123", checkedAt: "2026-06-01T08:00:00.000Z", skillRunId: "skr_000000000001", contextBundleId: "ctx_000000000001" },
                { dimension: "content", status: "notReported", summary: { text: "No evidence reported." }, producer: "none", evidenceCount: 0, sourceCommit: null, checkedAt: null, skillRunId: null, contextBundleId: null },
                { dimension: "seo", status: "notReported", summary: { text: "No evidence reported." }, producer: "none", evidenceCount: 0, sourceCommit: null, checkedAt: null, skillRunId: null, contextBundleId: null },
                { dimension: "performance", status: "notReported", summary: { text: "No evidence reported." }, producer: "none", evidenceCount: 0, sourceCommit: null, checkedAt: null, skillRunId: null, contextBundleId: null },
                { dimension: "security", status: "notReported", summary: { text: "No evidence reported." }, producer: "none", evidenceCount: 0, sourceCommit: null, checkedAt: null, skillRunId: null, contextBundleId: null },
              ],
            },
            conversationCount: 0,
            activeRunCount: 0,
          }],
        },
        aiReadinessEvaluator: {
          evaluate: async () => ({
            version: "shipglows.ai-readiness.v1",
            status: "ready",
            score: 100,
            coverage: 1,
            evaluatedAt: "2026-08-20T08:00:00.000Z",
            checks: [
              { id: "structure", outcome: "passed", earnedPoints: 20, maxPoints: 20, summary: "Structure is discoverable." },
              { id: "schemas", outcome: "passed", earnedPoints: 15, maxPoints: 15, summary: "Schemas are discoverable." },
              { id: "agentGuidance", outcome: "passed", earnedPoints: 20, maxPoints: 20, summary: "Guidance is discoverable." },
              { id: "llmsText", outcome: "passed", earnedPoints: 15, maxPoints: 15, summary: "llms.txt is discoverable." },
              { id: "sitemap", outcome: "passed", earnedPoints: 10, maxPoints: 10, summary: "Sitemap is discoverable." },
              { id: "fastFeedback", outcome: "passed", earnedPoints: 20, maxPoints: 20, summary: "Fast checks are discoverable." },
            ],
            recommendations: [],
          }),
        },
        cloudProjectCatalog: {
          read: async () => ({
            version: "shipglows.cli-project-catalog.v1",
            generatedAt: new Date().toISOString(),
            entries: [{
              projectId: "prj_000000000001",
              displayName: "Demo",
              previewSlug: "demo",
              status: "online",
              capabilities: { preview: true, workspace: true },
              deliveryBranch: "main",
              privateRuntime: { cwd: "/srv/demo", port: 3000, tmuxSession: "demo" },
            }],
          }),
        },
      },
    });

    const response = await app.inject({ method: "GET", url: "/v1/cockpit" });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().projects[0].health.overallStatus, "stale");
    assert.equal(response.json().projects[0].health.coverage, 0.2);
    assert.equal(response.json().projects[0].health.dimensions[1].status, "notReported");
    assert.equal(response.json().projects[0].aiReadiness.score, 100);
    assert.equal(response.json().projects[0].aiReadiness.checks.length, 6);
  });

  it("uses the Personal Cloud catalog display name instead of an internal project id", async () => {
    const projectId = "prj_000000000001";
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        reconcileCloudProjects: async () => undefined,
        cloudProjectCatalog: {
          read: async () => ({
            version: "shipglows.cli-project-catalog.v1",
            generatedAt: new Date().toISOString(),
            entries: [{
              projectId,
              displayName: "shipglows-site",
              previewSlug: "shipglows-site",
              status: "online",
              capabilities: { preview: true, workspace: true },
              deliveryBranch: "main",
              privateRuntime: { cwd: "C:\\workspace", port: 3000, tmuxSession: "shipglows-site" },
            }],
          }),
        },
        cockpitStore: {
          listCockpitProjects: () => [{
            id: projectId,
            name: projectId,
            repositoryFullName: projectId,
            accessState: "available",
            health: {
              overallStatus: "notReported",
              coverage: 0,
              dimensions: [],
            },
            conversationCount: 0,
            activeRunCount: 0,
          }],
        },
      },
    });

    const response = await app.inject({ method: "GET", url: "/v1/cockpit" });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().projects[0].name, "shipglows-site");
    assert.equal(response.json().projects[0].repositoryFullName, "shipglows-site");
  });

  it("isolates invalid or failed AI readiness evaluation from the Cockpit", async () => {
    for (const evaluate of [
      async () => ({
        version: "shipglows.ai-readiness.v1" as const,
        status: "ready" as const,
        score: 100,
        coverage: 1,
        evaluatedAt: "2026-08-20T08:00:00.000Z",
        checks: [
          { id: "structure" as const, outcome: "missing" as const, earnedPoints: 0, maxPoints: 20, summary: "Missing." },
          { id: "schemas" as const, outcome: "missing" as const, earnedPoints: 0, maxPoints: 15, summary: "Missing." },
          { id: "agentGuidance" as const, outcome: "missing" as const, earnedPoints: 0, maxPoints: 20, summary: "Missing." },
          { id: "llmsText" as const, outcome: "missing" as const, earnedPoints: 0, maxPoints: 15, summary: "Missing." },
          { id: "sitemap" as const, outcome: "missing" as const, earnedPoints: 0, maxPoints: 10, summary: "Missing." },
          { id: "fastFeedback" as const, outcome: "missing" as const, earnedPoints: 0, maxPoints: 20, summary: "Missing." },
        ],
        recommendations: [],
      }),
      async () => { throw new Error("private evaluator failure"); },
    ]) {
      const projectId = "prj_000000000001";
      const app = buildRunnerApp({
        config: loadConfig({ RUNNER_ENV: "test" }),
        dependencies: {
          authentication: { authenticate: async () => actor },
          cockpitStore: {
            listCockpitProjects: () => [{
              id: projectId,
              name: "Demo",
              repositoryFullName: "shipglows/demo",
              accessState: "available",
              health: { overallStatus: "unknown", coverage: 0, dimensions: [] },
              conversationCount: 0,
              activeRunCount: 0,
            }],
          },
          aiReadinessEvaluator: { evaluate },
          cloudProjectCatalog: {
            read: async () => ({
              version: "shipglows.cli-project-catalog.v1",
              generatedAt: new Date().toISOString(),
              entries: [{
                projectId,
                displayName: "Demo",
                previewSlug: "demo",
                status: "online",
                capabilities: { preview: true, workspace: false },
                deliveryBranch: "main",
                privateRuntime: { cwd: "/srv/demo" },
              }],
            }),
          },
        },
      });

      const response = await app.inject({ method: "GET", url: "/v1/cockpit" });
      await app.close();

      assert.equal(response.statusCode, 200);
      assert.equal(response.json().projects[0].aiReadiness.status, "unavailable");
    }
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

    const availableApp = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication,
        projectAccess,
        operatorWorkspaceCapability: async () => ({ available: true, reason: "ready" }),
      },
    });
    const available = await availableApp.inject({
      method: "GET",
      url: "/v1/projects/prj_000000000001/operator-workspace",
    });
    await availableApp.close();
    assert.deepEqual(available.json(), { available: true, reason: "ready", protocolVersion: 2, surfaces: ["editor", "terminal"] });

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
    let spawnCount = 0;
    const pty: OperatorPty = {
      write: () => undefined,
      resize: () => undefined,
      kill: () => undefined,
      onData: () => ({ dispose: () => undefined }),
      onExit: () => ({ dispose: () => undefined }),
    };
    const gateway = new OperatorWorkspaceGateway({ prj_000000000001: { cwd: "/srv/private/project", tmuxSession: "shipglows-project" } }, () => {
      spawnCount += 1;
      return pty;
    });
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        operatorWorkspaceGateway: gateway,
      },
    });
    const incompatible = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/operator-sessions", headers: { "idempotency-key": "workspace-test-old" }, payload: { protocolVersion: 1, surface: "editor" } });
    assert.equal(incompatible.statusCode, 400);
    assert.equal(spawnCount, 0);
    const created = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/operator-sessions", headers: { "idempotency-key": "workspace-test-1" }, payload: { protocolVersion: 2, surface: "editor" } });
    const invalidSurface = await app.inject({ method: "POST", url: "/v1/projects/prj_000000000001/operator-sessions", headers: { "idempotency-key": "workspace-test-2" }, payload: { protocolVersion: 2, surface: "shell" } });
    assert.equal(created.statusCode, 201);
    assert.equal(spawnCount, 1);
    assert.equal(invalidSurface.statusCode, 400);
    assert.doesNotMatch(created.body, /srv|tmux|shipglows-project/);
    const body = created.json();
    assert.equal(body.protocolVersion, 2);
    const closed = await app.inject({ method: "POST", url: `/v1/operator-sessions/${body.sessionId}/close` });
    await app.close();
    assert.equal(closed.statusCode, 200);
    assert.equal(closed.json().state, "closed");

    const readOnlyApp = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: ({ capability }) => capability === "read" },
        operatorWorkspaceGateway: gateway,
      },
    });
    const denied = await readOnlyApp.inject({ method: "POST", url: "/v1/projects/prj_000000000001/operator-sessions", headers: { "idempotency-key": "workspace-readonly" }, payload: { protocolVersion: 2, surface: "terminal" } });
    await readOnlyApp.close();
    assert.equal(denied.statusCode, 403);
  });

  it("accepts bounded authenticated preview diagnostics without private payloads", async () => {
    const events: Record<string, string>[] = [];
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "https://app.shipglows.com" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
        cloudProjectCatalog: { read: async () => ({ version: "shipglows.cli-project-catalog.v1" as const, generatedAt: new Date().toISOString(), entries: [] }) },
        previewIngress: {} as PreviewIngressService,
        reconcileCloudProjects: () => Promise.resolve(),
        previewDiagnosticSink: (event) => events.push(event),
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/preview-diagnostics",
      headers: { origin: "https://app.shipglows.com", "user-agent": "Mozilla/5.0 Chrome/140.0" },
      payload: { diagnosticId: "pd_abc123def456", stage: "frame", code: "timeout", occurredAt: "2026-08-18T02:00:00.000Z" },
    });
    const rejected = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/preview-diagnostics",
      headers: { origin: "https://app.shipglows.com" },
      payload: { diagnosticId: "pd_abc123def456", stage: "frame", code: "timeout", occurredAt: "2026-08-18T02:00:00.000Z", cookie: "secret" },
    });
    await app.close();

    assert.equal(response.statusCode, 202);
    assert.deepEqual(events, [{ diagnosticId: "pd_abc123def456", projectId: "prj_000000000001", stage: "frame", code: "timeout", browserFamily: "chromium", occurredAt: "2026-08-18T02:00:00.000Z" }]);
    assert.equal(rejected.statusCode, 400);
    assert.doesNotMatch(JSON.stringify(events), /secret|cookie|authorization/i);
  });

  it("accepts redacted Workspace diagnostics only with mutate access", async () => {
    const events: Record<string, string>[] = [];
    const dependencies = {
      authentication: { authenticate: async () => actor },
      reconcileCloudProjects: () => Promise.resolve(),
      workspaceDiagnosticSink: (event: Record<string, string>) => events.push(event),
    };
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "https://app.shipglows.com" }),
      dependencies: { ...dependencies, projectAccess: { hasProjectAccess: () => true } },
    });
    const accepted = await app.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/workspace-diagnostics",
      headers: { origin: "https://app.shipglows.com", "user-agent": "Mozilla/5.0 Firefox/141.0" },
      payload: { diagnosticId: "wd_abc123def456", surface: "editor", stage: "recovery", code: "reported", occurredAt: "2026-08-18T02:00:00.000Z" },
    });
    await app.close();
    assert.equal(accepted.statusCode, 202);
    assert.deepEqual(events, [{ diagnosticId: "wd_abc123def456", projectId: "prj_000000000001", surface: "editor", stage: "recovery", code: "reported", browserFamily: "firefox", occurredAt: "2026-08-18T02:00:00.000Z" }]);

    const readOnlyApp = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "https://app.shipglows.com" }),
      dependencies: { ...dependencies, projectAccess: { hasProjectAccess: ({ capability }) => capability === "read" } },
    });
    const denied = await readOnlyApp.inject({
      method: "POST",
      url: "/v1/projects/prj_000000000001/workspace-diagnostics",
      headers: { origin: "https://app.shipglows.com" },
      payload: { diagnosticId: "wd_abc123def456", surface: "editor", stage: "recovery", code: "reported", occurredAt: "2026-08-18T02:00:00.000Z" },
    });
    await readOnlyApp.close();
    assert.equal(denied.statusCode, 403);
  });

  it("upgrades an operator session to a protected WebSocket", async () => {
    const pty: OperatorPty = {
      write: () => undefined,
      resize: () => undefined,
      kill: () => undefined,
      onData: () => ({ dispose: () => undefined }),
      onExit: () => ({ dispose: () => undefined }),
    };
    const gateway = new OperatorWorkspaceGateway(
      { prj_000000000001: { cwd: "/srv/private/project", tmuxSession: "shipglows-project" } },
      () => pty,
      {},
      60_000,
      "https://app.shipglows.com",
    );
    const capability = gateway.create({
      tenantId: actor.tenantId,
      userId: actor.userId,
      projectId: "prj_000000000001",
      surface: "terminal",
      idempotencyKey: "workspace-websocket-1",
    });
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: { operatorWorkspaceGateway: gateway },
    });
    await app.ready();

    let resolveConnected!: (value: string) => void;
    const connectedPromise = new Promise<string>((resolve) => { resolveConnected = resolve; });
    const socket = await app.injectWS(
      `/v1/operator-sessions/${capability.id}/stream`,
      {
        headers: {
          origin: "https://app.shipglows.com",
          "sec-websocket-protocol": `shipglows.workspace.${capability.token}`,
        },
      },
      {
        onInit: (client) => client.once("message", (data) => {
          assert.ok(Buffer.isBuffer(data));
          resolveConnected(data.toString("utf8"));
        }),
      },
    );
    const connected = await connectedPromise;
    socket.terminate();
    await app.close();

    assert.deepEqual(JSON.parse(connected), { type: "status", state: "connected" });
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
        projectWorkspaceResolver: () => "C:\\managed\\project",
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

  it("answers CORS preflight only for an explicitly allowed browser origin", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test", RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005" }),
    });
    const allowed = await app.inject({
      method: "OPTIONS",
      url: "/v1/projects/shipglows_app/studio-sessions",
      headers: { origin: "http://127.0.0.1:3005", "access-control-request-method": "POST" },
    });
    const denied = await app.inject({
      method: "OPTIONS",
      url: "/v1/projects/shipglows_app/studio-sessions",
      headers: { origin: "https://hostile.example", "access-control-request-method": "POST" },
    });
    await app.close();
    assert.equal(allowed.statusCode, 204);
    assert.equal(allowed.headers["access-control-allow-origin"], "http://127.0.0.1:3005");
    assert.equal(denied.statusCode, 403);
    assert.equal(denied.headers["access-control-allow-origin"], undefined);
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
        projectWorkspaceResolver: () => "C:\\managed\\project",
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
        projectWorkspaceResolver: () => "C:\\managed\\project",
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
