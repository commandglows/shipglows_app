import type { FastifyInstance } from "fastify";
import { Type } from "typebox";

import {
  authenticationGuard,
  type AuthenticationAdapter,
} from "./auth/index.js";
import type {
  OperationalStore,
  PersistedEvent,
} from "./db/index.js";
import {
  projectAuthorizationGuard,
  type ProjectAccessRepository,
} from "./projects/projectAccess.js";

const MAX_CONVERSATIONS = 40;
const EVENT_PAGE_SIZE = 100;
const MAX_EVENT_PAGES = 5;
const MAX_ACTIVITY_ITEMS = 20;
const MAX_REVIEW_ITEMS = 20;

const activityKinds = [
  "approval",
  "change",
  "diagnostic",
  "evidence",
  "run",
] as const;

const degradationReasons = [
  "conversationLimitReached",
  "eventLimitReached",
  "invalidEventOmitted",
  "reviewProjectionUnavailable",
  "studioReviewUnavailable",
] as const;

type DegradationReason = (typeof degradationReasons)[number];

const ActivityItemSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, maxLength: 128 }),
    conversationId: Type.String({ minLength: 1, maxLength: 128 }),
    conversationTitle: Type.String({ minLength: 1, maxLength: 200 }),
    kind: Type.Union(activityKinds.map((kind) => Type.Literal(kind))),
    label: Type.String({ minLength: 1, maxLength: 96 }),
    occurredAt: Type.String({ minLength: 1, maxLength: 64 }),
    destination: Type.Literal("conversations"),
  },
  { additionalProperties: false },
);

const ReviewItemSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, maxLength: 128 }),
    conversationId: Type.String({ minLength: 1, maxLength: 128 }),
    conversationTitle: Type.String({ minLength: 1, maxLength: 200 }),
    kind: Type.Literal("approval"),
    label: Type.String({ minLength: 1, maxLength: 96 }),
    occurredAt: Type.String({ minLength: 1, maxLength: 64 }),
    destination: Type.Literal("conversations"),
  },
  { additionalProperties: false },
);

const ActivityReviewResponseSchema = Type.Object(
  {
    projectId: Type.String({ minLength: 1, maxLength: 128 }),
    status: Type.Union([Type.Literal("ready"), Type.Literal("degraded")]),
    reasons: Type.Array(
      Type.Union(degradationReasons.map((reason) => Type.Literal(reason))),
      { maxItems: degradationReasons.length },
    ),
    activity: Type.Array(ActivityItemSchema, { maxItems: MAX_ACTIVITY_ITEMS }),
    review: Type.Array(ReviewItemSchema, { maxItems: MAX_REVIEW_ITEMS }),
  },
  {
    $id: "shipglows.v1.activity-review.response",
    additionalProperties: false,
  },
);

type ActivityKind = (typeof activityKinds)[number];

interface ActivityItem {
  readonly id: string;
  readonly conversationId: string;
  readonly conversationTitle: string;
  readonly kind: ActivityKind;
  readonly label: string;
  readonly occurredAt: string;
  readonly destination: "conversations";
}

interface ReviewItem {
  readonly id: string;
  readonly conversationId: string;
  readonly conversationTitle: string;
  readonly kind: "approval";
  readonly label: string;
  readonly occurredAt: string;
  readonly destination: "conversations";
}

type ActivityReviewStore = Pick<
  OperationalStore,
  "listConversations" | "listEvents"
> &
  Partial<Pick<OperationalStore, "getApproval" | "getRun">>;

export function registerActivityReviewRoutes(
  app: FastifyInstance,
  input: {
    readonly authentication: AuthenticationAdapter;
    readonly projectAccess: ProjectAccessRepository;
    readonly store?: ActivityReviewStore;
  },
): void {
  app.get<{ Params: { projectId: string } }>(
    "/v1/projects/:projectId/activity-review",
    {
      preHandler: [
        authenticationGuard(input.authentication),
        projectAuthorizationGuard(input.projectAccess, "read"),
      ],
      schema: {
        params: Type.Object(
          { projectId: Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: false },
        ),
        response: {
          200: ActivityReviewResponseSchema,
          503: Type.Object(
            {
              error: Type.Object(
                {
                  code: Type.Literal("activityReviewUnavailable"),
                  message: Type.String(),
                },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
        },
      },
    },
    async (request, reply) => {
      const actor = request.shipglowsActor;
      if (actor === undefined) {
        throw new Error("Authenticated actor is missing.");
      }
      if (input.store === undefined) {
        return reply.status(503).send({
          error: {
            code: "activityReviewUnavailable",
            message: "Activity and review projection is unavailable.",
          },
        });
      }
      return projectActivityReview({
        store: input.store,
        tenantId: actor.tenantId,
        projectId: request.params.projectId,
      });
    },
  );
}

export function projectActivityReview(input: {
  readonly store: ActivityReviewStore;
  readonly tenantId: string;
  readonly projectId: string;
}): {
  readonly projectId: string;
  readonly status: "ready" | "degraded";
  readonly reasons: readonly DegradationReason[];
  readonly activity: readonly ActivityItem[];
  readonly review: readonly ReviewItem[];
} {
  const reasons = new Set<DegradationReason>(["studioReviewUnavailable"]);
  const normalizedConversations = deduplicateConversations(
    input.store.listConversations({
      tenantId: input.tenantId,
      projectId: input.projectId,
    }),
  );
  const conversations = normalizedConversations.filter((conversation) => {
    const valid =
      conversation.projectId === input.projectId &&
      safeOpaqueId(conversation.id) !== undefined &&
      conversation.title.length >= 1 &&
      conversation.title.length <= 200;
    if (!valid) reasons.add("invalidEventOmitted");
    return valid;
  });
  if (conversations.length > MAX_CONVERSATIONS) {
    reasons.add("conversationLimitReached");
  }

  const activity = new Map<string, ActivityItem>();
  const requestedApprovals = new Map<
    string,
    { readonly event: PersistedEvent; readonly title: string }
  >();

  for (const conversation of conversations.slice(0, MAX_CONVERSATIONS)) {
    const events = boundedConversationEvents({
      store: input.store,
      tenantId: input.tenantId,
      conversationId: conversation.id,
      reasons,
    });
    for (const event of events) {
      if (
        event.tenantId !== input.tenantId ||
        event.conversationId !== conversation.id ||
        safeOpaqueId(event.id) === undefined ||
        !validTimestamp(event.occurredAt)
      ) {
        reasons.add("invalidEventOmitted");
        continue;
      }
      const presentation = activityPresentation(event.type);
      if (presentation !== undefined) {
        activity.set(`${conversation.id}:${event.id}`, {
          id: event.id,
          conversationId: conversation.id,
          conversationTitle: conversation.title,
          kind: presentation.kind,
          label: presentation.label,
          occurredAt: event.occurredAt,
          destination: "conversations",
        });
      }
      if (event.type === "approval.requested") {
        const approvalId = safeOpaqueId(event.payload["approvalId"]);
        if (approvalId === undefined) {
          reasons.add("invalidEventOmitted");
          continue;
        }
        requestedApprovals.set(approvalId, {
          event,
          title: conversation.title,
        });
      }
    }
  }

  const review = projectPendingApprovals({
    store: input.store,
    tenantId: input.tenantId,
    projectId: input.projectId,
    requestedApprovals,
    reasons,
  });
  const orderedActivity = [...activity.values()]
    .sort(compareRecent)
    .slice(0, MAX_ACTIVITY_ITEMS);

  return {
    projectId: input.projectId,
    status: reasons.size === 0 ? "ready" : "degraded",
    reasons: degradationReasons.filter((reason) => reasons.has(reason)),
    activity: orderedActivity,
    review,
  };
}

function deduplicateConversations(
  conversations: readonly {
    readonly id: string;
    readonly projectId: string;
    readonly title: string;
    readonly state: string;
  }[],
): readonly {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly state: string;
}[] {
  const byId = new Map<string, (typeof conversations)[number]>();
  for (const conversation of conversations) {
    if (!byId.has(conversation.id)) byId.set(conversation.id, conversation);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function boundedConversationEvents(input: {
  readonly store: ActivityReviewStore;
  readonly tenantId: string;
  readonly conversationId: string;
  readonly reasons: Set<DegradationReason>;
}): readonly PersistedEvent[] {
  const byId = new Map<string, PersistedEvent>();
  let after = 0;
  for (let page = 0; page < MAX_EVENT_PAGES; page += 1) {
    const events = input.store.listEvents({
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      after,
      limit: EVENT_PAGE_SIZE,
    });
    for (const event of events) {
      byId.set(`${event.conversationId}:${event.id}`, event);
    }
    if (events.length < EVENT_PAGE_SIZE) return [...byId.values()];
    const next = events.at(-1)?.cursor;
    if (next === undefined || next <= after) {
      input.reasons.add("invalidEventOmitted");
      return [...byId.values()];
    }
    after = next;
  }
  input.reasons.add("eventLimitReached");
  return [...byId.values()];
}

function projectPendingApprovals(input: {
  readonly store: ActivityReviewStore;
  readonly tenantId: string;
  readonly projectId: string;
  readonly requestedApprovals: ReadonlyMap<
    string,
    { readonly event: PersistedEvent; readonly title: string }
  >;
  readonly reasons: Set<DegradationReason>;
}): readonly ReviewItem[] {
  if (
    input.store.getApproval === undefined ||
    input.store.getRun === undefined
  ) {
    input.reasons.add("reviewProjectionUnavailable");
    return [];
  }
  const review: ReviewItem[] = [];
  for (const [approvalId, request] of input.requestedApprovals) {
    const approval = input.store.getApproval({
      tenantId: input.tenantId,
      approvalId,
    });
    if (approval?.state !== "pending") continue;
    const run = input.store.getRun({
      tenantId: input.tenantId,
      runId: approval.runId,
    });
    if (
      run?.projectId !== input.projectId ||
      run.conversationId !== request.event.conversationId
    ) {
      input.reasons.add("invalidEventOmitted");
      continue;
    }
    review.push({
      id: approvalId,
      conversationId: request.event.conversationId,
      conversationTitle: request.title,
      kind: "approval",
      label: "Approval requested",
      occurredAt: request.event.occurredAt,
      destination: "conversations",
    });
  }
  return review.sort(compareRecent).slice(0, MAX_REVIEW_ITEMS);
}

function safeOpaqueId(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value)
    ? value
    : undefined;
}

function validTimestamp(value: string): boolean {
  return value.length <= 64 && Number.isFinite(Date.parse(value));
}

function compareRecent(
  left: { readonly occurredAt: string; readonly id: string },
  right: { readonly occurredAt: string; readonly id: string },
): number {
  return (
    Date.parse(right.occurredAt) - Date.parse(left.occurredAt) ||
    right.id.localeCompare(left.id)
  );
}

function activityPresentation(
  type: string,
): { readonly kind: ActivityKind; readonly label: string } | undefined {
  const presentations: Readonly<
    Record<string, { readonly kind: ActivityKind; readonly label: string }>
  > = {
    "approval.requested": { kind: "approval", label: "Approval requested" },
    "approval.resolved": { kind: "approval", label: "Approval resolved" },
    "approval.expired": { kind: "approval", label: "Approval expired" },
    "file.changeProposed": { kind: "change", label: "File change proposed" },
    "file.changed": { kind: "change", label: "File changed" },
    "tracker.changeProposed": {
      kind: "change",
      label: "Tracker change proposed",
    },
    "diagnostic.warning": {
      kind: "diagnostic",
      label: "Diagnostic warning",
    },
    "diagnostic.error": { kind: "diagnostic", label: "Diagnostic error" },
    "health.evidenceProduced": {
      kind: "evidence",
      label: "Health evidence produced",
    },
    "run.queued": { kind: "run", label: "Run queued" },
    "run.started": { kind: "run", label: "Run started" },
    "run.progress": { kind: "run", label: "Run in progress" },
    "run.completed": { kind: "run", label: "Run completed" },
    "run.failed": { kind: "run", label: "Run failed" },
  };
  return presentations[type];
}
