import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  projectActivityReview,
} from "../../src/activityReviewRoutes.js";
import { buildRunnerApp } from "../../src/app.js";
import type { ActorContext } from "../../src/auth/index.js";
import { loadConfig } from "../../src/config.js";
import type {
  PersistedApproval,
  PersistedEvent,
  PersistedRun,
} from "../../src/db/index.js";

const actor: ActorContext = {
  tenantId: "ten_activity_000001",
  userId: "usr_activity_000001",
  subject: "activity-user",
};

const projectId = "prj_activity_000001";
const conversationId = "cnv_activity_000001";

describe("read-only activity and review projection", () => {
  it("orders and deduplicates normalized activity deterministically", () => {
    const event = persistedEvent({
      cursor: 1,
      id: "evt_activity_000001",
      type: "run.started",
      occurredAt: "2026-08-17T10:00:00.000Z",
    });
    const projection = projectActivityReview({
      tenantId: actor.tenantId,
      projectId,
      store: {
        listConversations: () => [
          conversation(),
          conversation(),
        ],
        listEvents: () => [
          event,
          event,
          persistedEvent({
            cursor: 2,
            id: "evt_activity_000002",
            type: "run.completed",
            occurredAt: "2026-08-17T11:00:00.000Z",
          }),
          persistedEvent({
            cursor: 3,
            id: "evt_ignored_000001",
            type: "message.assistant.completed",
            occurredAt: "2026-08-17T12:00:00.000Z",
          }),
        ],
        getApproval: () => undefined,
        getRun: () => undefined,
      },
    });

    assert.deepEqual(
      projection.activity.map((item) => item.id),
      ["evt_activity_000002", "evt_activity_000001"],
    );
    assert.equal(projection.activity[0]?.label, "Run completed");
    assert.equal(projection.review.length, 0);
  });

  it("projects only pending approvals owned by the requested project and conversation", () => {
    const requested = persistedEvent({
      cursor: 1,
      id: "evt_approval_000001",
      type: "approval.requested",
      occurredAt: "2026-08-17T10:00:00.000Z",
      payload: { approvalId: "apr_activity_000001" },
    });
    const projection = projectActivityReview({
      tenantId: actor.tenantId,
      projectId,
      store: {
        listConversations: () => [conversation()],
        listEvents: () => [requested],
        getApproval: () => approval(),
        getRun: () => run(),
      },
    });

    assert.deepEqual(projection.review, [
      {
        id: "apr_activity_000001",
        conversationId,
        conversationTitle: "Activity review",
        kind: "approval",
        label: "Approval requested",
        occurredAt: "2026-08-17T10:00:00.000Z",
        destination: "conversations",
      },
    ]);

    const isolated = projectActivityReview({
      tenantId: actor.tenantId,
      projectId,
      store: {
        listConversations: () => [conversation()],
        listEvents: () => [requested],
        getApproval: () => approval(),
        getRun: () => run({ projectId: "prj_other_000001" }),
      },
    });
    assert.equal(isolated.review.length, 0);
    assert.ok(isolated.reasons.includes("invalidEventOmitted"));
  });

  it("fails closed when project access is lost and exposes no mutation route", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => false },
        eventStore: {
          getConversation: () => undefined,
          listConversations: () => [conversation()],
          listEvents: () => [],
        },
      },
    });

    const forbidden = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/activity-review`,
    });
    const mutation = await app.inject({
      method: "POST",
      url: `/v1/projects/${projectId}/activity-review`,
    });
    await app.close();

    assert.equal(forbidden.statusCode, 403);
    assert.equal(forbidden.json().error.code, "projectForbidden");
    assert.equal(mutation.statusCode, 404);
  });

  it("returns a controlled unavailable response without an event projection", async () => {
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: { hasProjectAccess: () => true },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/activity-review`,
    });
    await app.close();

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), {
      error: {
        code: "activityReviewUnavailable",
        message: "Activity and review projection is unavailable.",
      },
    });
  });

  it("loads only the authenticated actor tenant and authorized project", async () => {
    const observed: string[] = [];
    const app = buildRunnerApp({
      config: loadConfig({ RUNNER_ENV: "test" }),
      dependencies: {
        authentication: { authenticate: async () => actor },
        projectAccess: {
          hasProjectAccess: (input) =>
            input.tenantId === actor.tenantId &&
            input.userId === actor.userId &&
            input.projectId === projectId,
        },
        eventStore: {
          getConversation: () => undefined,
          listConversations: (input) => {
            observed.push(`conversations:${input.tenantId}:${input.projectId}`);
            return [conversation()];
          },
          listEvents: (input) => {
            observed.push(`events:${input.tenantId}:${input.conversationId}`);
            return [
              persistedEvent({
                cursor: 1,
                id: "evt_route_000001",
                type: "run.completed",
                occurredAt: "2026-08-17T12:00:00.000Z",
              }),
            ];
          },
          getApproval: () => undefined,
          getRun: () => undefined,
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: `/v1/projects/${projectId}/activity-review`,
    });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().projectId, projectId);
    assert.equal(response.json().activity[0].id, "evt_route_000001");
    assert.deepEqual(observed, [
      `conversations:${actor.tenantId}:${projectId}`,
      `events:${actor.tenantId}:${conversationId}`,
    ]);
  });
});

function conversation() {
  return {
    id: conversationId,
    projectId,
    title: "Activity review",
    state: "active",
  } as const;
}

function persistedEvent(
  overrides: Partial<PersistedEvent> &
    Pick<PersistedEvent, "cursor" | "id" | "type" | "occurredAt">,
): PersistedEvent {
  return {
    cursor: overrides.cursor,
    id: overrides.id,
    tenantId: overrides.tenantId ?? actor.tenantId,
    conversationId: overrides.conversationId ?? conversationId,
    type: overrides.type,
    payload: overrides.payload ?? {},
    occurredAt: overrides.occurredAt,
  };
}

function approval(
  overrides: Partial<PersistedApproval> = {},
): PersistedApproval {
  return {
    id: "apr_activity_000001",
    tenantId: actor.tenantId,
    runId: "run_activity_000001",
    state: "pending",
    requestedAt: "2026-08-17T10:00:00.000Z",
    resolvedAt: null,
    ...overrides,
  };
}

function run(overrides: Partial<PersistedRun> = {}): PersistedRun {
  return {
    id: "run_activity_000001",
    tenantId: actor.tenantId,
    projectId,
    conversationId,
    runtimeId: "codex",
    executionProviderId: "local",
    taskKind: "conversation",
    state: "running",
    checkpoint: {},
    createdAt: "2026-08-17T10:00:00.000Z",
    updatedAt: "2026-08-17T10:00:00.000Z",
    ...overrides,
  };
}
