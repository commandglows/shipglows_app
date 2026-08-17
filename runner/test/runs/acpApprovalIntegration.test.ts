import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import type {
  AgentCapabilities,
  PromptResponse,
  RequestPermissionRequest,
  RequestPermissionResponse,
  SessionModeState,
} from "@agentclientprotocol/sdk";

import { AcpRuntime, type AcpClientHandlers, type AcpConnection } from "../../src/agent-runtime/acp/index.js";
import { openOperationalStore } from "../../src/db/index.js";
import { ApprovalCommandService } from "../../src/runs/approval.js";
import { AuditCommandService } from "../../src/runs/audit.js";

class PermissionAcpConnection implements AcpConnection {
  handlers: AcpClientHandlers | undefined;
  readonly #prompt: Promise<PromptResponse>;
  #resolvePrompt: ((response: PromptResponse) => void) | undefined;

  constructor() {
    this.#prompt = new Promise((resolve) => { this.#resolvePrompt = resolve; });
  }

  initialize(): Promise<AgentCapabilities> {
    return Promise.resolve({ sessionCapabilities: { resume: {} } });
  }

  newSession(): Promise<{ readonly sessionId: string; readonly modes?: SessionModeState | null }> {
    return Promise.resolve({
      sessionId: "acp_integration_session",
      modes: { currentModeId: "agent", availableModes: [{ id: "read-only", name: "Read-only" }] },
    });
  }

  resumeSession(): Promise<void> { return Promise.resolve(); }
  setMode(): Promise<void> { return Promise.resolve(); }
  prompt(): Promise<PromptResponse> { return this.#prompt; }
  cancel(): Promise<void> { return Promise.resolve(); }
  close(): Promise<void> { return Promise.resolve(); }

  requestPermission(request: RequestPermissionRequest): Promise<RequestPermissionResponse> {
    if (this.handlers === undefined) throw new Error("ACP handlers are unavailable.");
    const response = this.handlers.requestPermission(request);
    void response.then(() => this.#resolvePrompt?.({ stopReason: "end_turn" }));
    return response;
  }
}

async function waitForApproval(store: Awaited<ReturnType<typeof openOperationalStore>>, tenantId: string, approvalId: string): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (store.getApproval({ tenantId, approvalId }) !== undefined) return;
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Approval was not persisted.");
}

function approvalId(value: unknown): string {
  return typeof value === "string" ? value : "";
}

describe("ACP durable approval integration", () => {
  it("persists permission before API resolution and returns the selected ACP response", async () => {
    const root = await mkdtemp(join(tmpdir(), "shipglows-acp-approval-"));
    const store = await openOperationalStore(join(root, "runner.sqlite"));
    const tenantId = "tenant_acp_integration";
    const userId = "user_acp_integration";
    const projectId = "project_acp_integration";
    store.createTenant({ id: tenantId, identityRef: "firebase-acp-integration" });
    store.createUser({ id: userId, authSubject: "firebase-acp-integration-user" });
    store.addTenantUser({ tenantId, userId, role: "owner" });
    store.createProject({ id: projectId, tenantId, githubRepositoryId: 9001 });
    store.grantProjectMembership({ tenantId, projectId, userId, capability: "mutate" });

    const connection = new PermissionAcpConnection();
    const runtime = new AcpRuntime({
      id: "codex",
      modeIds: { readOnly: "read-only", workspaceWrite: "agent" },
      factory: ({ handlers }) => {
        connection.handlers = handlers;
        return connection;
      },
    });
    const audit = new AuditCommandService(store, runtime, undefined, undefined, undefined, undefined, () => root);
    const started = await audit.start({ tenantId, userId, projectId, scope: "security" });
    assert.equal(started.state, "running");

    const permissionResponse = connection.requestPermission({
      sessionId: "acp_integration_session",
      toolCall: { toolCallId: "tool_integration", title: "Inspect repository", kind: "read" },
      options: [{ optionId: "reject-once", name: "Reject", kind: "reject_once" }],
    });
    const events = store.listEvents({ tenantId, conversationId: started.conversationId, after: 0, limit: 100 });
    const requested = events.find((event) => event.type === "approval.requested");
    const firstApprovalId = approvalId(requested?.payload["approvalId"]);
    if (firstApprovalId === "") {
      await new Promise<void>((resolve) => setTimeout(resolve, 25));
    }
    const refreshed = store.listEvents({ tenantId, conversationId: started.conversationId, after: 0, limit: 100 });
    const durableEvent = refreshed.find((event) => event.type === "approval.requested");
    const durableApprovalId = approvalId(durableEvent?.payload["approvalId"]);
    await waitForApproval(store, tenantId, durableApprovalId);
    assert.equal(store.getApproval({ tenantId, approvalId: durableApprovalId })?.state, "pending");

    const service = new ApprovalCommandService(store, runtime);
    const result = await service.resolve({ tenantId, projectId, approvalId: durableApprovalId, decision: "deny" });
    assert.equal(result.state, "denied");
    assert.deepEqual(await permissionResponse, { outcome: { outcome: "selected", optionId: "reject-once" } });
    assert.equal(store.getApproval({ tenantId, approvalId: durableApprovalId })?.state, "denied");
    await runtime.close();
    store.close();
  });
});
