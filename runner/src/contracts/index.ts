import type { FastifyError, FastifyInstance } from "fastify";
import { Type } from "typebox";

export const API_VERSION = "v1";

export const RUNTIME_CAPABILITIES = [
  "sessions",
  "turns",
  "resume",
  "interrupt",
  "approvals",
  "semanticEvents",
  "isolatedWorkspaces",
] as const;

export type RuntimeCapability = (typeof RUNTIME_CAPABILITIES)[number];
export type OpaqueId = string & { readonly __opaqueId: unique symbol };
export type ConversationState = "idle" | "active" | "interrupted" | "completed" | "failed";
export type ApprovalDecision = "approve" | "deny";
export type SafePayload = Readonly<Record<string, unknown>>;

export interface RuntimeSession {
  readonly runtimeSessionId: OpaqueId;
  readonly state: ConversationState;
}

export interface RuntimeTurn {
  readonly runtimeTurnId: OpaqueId;
  readonly state: "queued" | "active" | "interrupted" | "completed" | "failed";
}

export interface RuntimeEvent {
  readonly type: string;
  readonly occurredAt: string;
  readonly payload: SafePayload;
}

export interface AgentRuntime {
  readonly id: string;
  readonly capabilities: ReadonlySet<RuntimeCapability>;
  createSession(input: { readonly conversationId: OpaqueId; readonly workspaceRoot?: string }): Promise<RuntimeSession>;
  resumeSession(input: { readonly runtimeSessionId: OpaqueId }): Promise<RuntimeSession>;
  startTurn(input: {
    readonly runtimeSessionId: OpaqueId;
    readonly message: string;
  }): Promise<RuntimeTurn>;
  interruptTurn(input: { readonly runtimeSessionId: OpaqueId; readonly runtimeTurnId: OpaqueId }): Promise<void>;
  events(input: { readonly runtimeSessionId: OpaqueId; readonly after?: string }): AsyncIterable<RuntimeEvent>;
  resolveApproval?(
    input: { readonly runtimeSessionId: OpaqueId; readonly approvalId: OpaqueId; readonly decision: ApprovalDecision },
  ): Promise<void>;
}

export const EXECUTION_CAPABILITIES = ["readOnly", "isolatedWorkspace", "operatorWorkspace"] as const;
export type ExecutionCapability = (typeof EXECUTION_CAPABILITIES)[number];
export type ExecutionIntentTrigger = "manual";
export type ExecutionOutcome =
  | { readonly state: "completed"; readonly executionId: OpaqueId }
  | { readonly state: "failed"; readonly executionId: OpaqueId; readonly code: string }
  | { readonly state: "delegated"; readonly executionId: OpaqueId };

/** Server-resolved, persistence-safe execution admission input. Never add prompts, paths, or secrets. */
export interface ResolvedExecutionEnvelope {
  readonly executionId: OpaqueId;
  readonly runId: OpaqueId;
  readonly tenantId: OpaqueId;
  readonly projectId: OpaqueId;
  readonly conversationId: OpaqueId;
  readonly taskKind: "audit" | "fix" | "conversation";
  readonly trigger: ExecutionIntentTrigger;
  readonly runtimeId: string;
  readonly providerId: string;
  readonly requiredCapabilities: readonly ExecutionCapability[];
  readonly resourceBudget: Readonly<{ maxDurationMs: number }>;
  readonly deadlineAt: string;
}

export interface ExecutionProvider {
  readonly id: string;
  readonly kind: "disposable" | "persistent";
  readonly capabilities: ReadonlySet<ExecutionCapability>;
  preflight(input: ResolvedExecutionEnvelope): Promise<void>;
  cancel(input: { readonly executionId: OpaqueId; readonly runId: OpaqueId }): Promise<void>;
}

export class ExecutionProviderError extends Error {
  constructor(
    readonly code: "executionProviderUnavailable" | "executionCapabilityUnavailable" | "manualTriggerRequired",
    readonly providerId: string,
    readonly missing: readonly ExecutionCapability[] = [],
  ) {
    super(code === "manualTriggerRequired" ? "Execution must be manually triggered." : `Execution provider ${providerId} is unavailable.`);
    this.name = "ExecutionProviderError";
  }
}

export class ExecutionProviderRegistry {
  readonly #providers: ReadonlyMap<string, ExecutionProvider>;

  constructor(providers: readonly ExecutionProvider[]) {
    const entries = new Map<string, ExecutionProvider>();
    for (const provider of providers) {
      if (entries.has(provider.id)) throw new Error(`Duplicate execution provider id: ${provider.id}`);
      entries.set(provider.id, provider);
    }
    this.#providers = entries;
  }

  select(providerId: string, required: readonly ExecutionCapability[]): ExecutionProvider {
    const provider = this.#providers.get(providerId);
    if (provider === undefined) throw new ExecutionProviderError("executionProviderUnavailable", providerId);
    const missing = required.filter((capability) => !provider.capabilities.has(capability));
    if (missing.length > 0) throw new ExecutionProviderError("executionCapabilityUnavailable", providerId, missing);
    return provider;
  }
}

export interface CapabilityBroker {
  issue(input: {
    readonly actorId: OpaqueId;
    readonly projectId: OpaqueId;
    readonly purpose: "agent" | "operatorWorkspace";
  }): Promise<{ readonly capabilityId: OpaqueId; readonly expiresAt: string }>;
}

export interface ModelGateway {
  select(input: { readonly runtimeId: string; readonly taskKind: "audit" | "fix" | "conversation" }): Promise<{
    readonly modelId: string;
    readonly configurationId: string;
  }>;
}

export class RuntimeCapabilityError extends Error {
  readonly code = "runtimeCapabilityUnavailable";

  constructor(
    readonly runtimeId: string,
    readonly missing: readonly RuntimeCapability[],
  ) {
    super(`Runtime ${runtimeId} does not support: ${missing.join(", ")}`);
    this.name = "RuntimeCapabilityError";
  }
}

export function assertRuntimeCapabilities(
  runtime: Pick<AgentRuntime, "id" | "capabilities">,
  required: readonly RuntimeCapability[],
): void {
  const missing = required.filter((capability) => !runtime.capabilities.has(capability));
  if (missing.length > 0) throw new RuntimeCapabilityError(runtime.id, missing);
}

export class RuntimeRegistry {
  readonly #runtimes: ReadonlyMap<string, AgentRuntime>;

  constructor(runtimes: readonly AgentRuntime[]) {
    const entries = new Map<string, AgentRuntime>();
    for (const runtime of runtimes) {
      if (entries.has(runtime.id)) throw new Error(`Duplicate runtime id: ${runtime.id}`);
      entries.set(runtime.id, runtime);
    }
    this.#runtimes = entries;
  }

  select(runtimeId: string, required: readonly RuntimeCapability[]): AgentRuntime {
    const runtime = this.#runtimes.get(runtimeId);
    if (runtime === undefined) {
      throw new RuntimeCapabilityError(runtimeId, required);
    }
    assertRuntimeCapabilities(runtime, required);
    return runtime;
  }
}

export const EVENT_TYPES = [
  "conversation.created",
  "conversation.titleChanged",
  "conversation.stateChanged",
  "turn.started",
  "turn.interrupted",
  "turn.completed",
  "turn.failed",
  "message.user",
  "message.assistant.delta",
  "message.assistant.completed",
  "plan.updated",
  "tool.started",
  "tool.output.delta",
  "tool.completed",
  "tool.failed",
  "file.changeProposed",
  "file.changed",
  "approval.requested",
  "approval.resolved",
  "approval.expired",
  "run.queued",
  "run.started",
  "run.progress",
  "run.completed",
  "run.failed",
  "health.evidenceProduced",
  "tracker.changeProposed",
  "diagnostic.warning",
  "diagnostic.error",
  "stream.heartbeat",
] as const;

export const VersionResponseSchema = Type.Object(
  {
    apiVersion: Type.Literal(API_VERSION),
    service: Type.String(),
    serviceVersion: Type.String(),
    providers: Type.Object(
      {
        supabase: Type.Boolean(),
        github: Type.Boolean(),
        codex: Type.Boolean(),
        eve: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
  },
  { $id: "shipglows.v1.version.response", additionalProperties: false },
);

export const ApiErrorSchema = Type.Object(
  {
    error: Type.Object(
      {
        code: Type.String(),
        message: Type.String(),
        requestId: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
  },
  { $id: "shipglows.v1.error.response", additionalProperties: false },
);

export const NormalizedEventSchema = Type.Object(
  {
    cursor: Type.Integer({ minimum: 0 }),
    id: Type.String(),
    type: Type.String(),
    payload: Type.Record(Type.String(), Type.Unknown()),
    occurredAt: Type.String(),
  },
  { $id: "shipglows.v1.conversation.event", additionalProperties: false },
);

export const CommandRequestSchemas = {
  createConversation: Type.Object({ projectId: Type.String(), title: Type.String() }, { additionalProperties: false }),
  message: Type.Object({ text: Type.String() }, { additionalProperties: false }),
  audit: Type.Object({ scope: Type.String({ minLength: 1, maxLength: 128 }) }, { additionalProperties: false }),
  fix: Type.Object(
    {
      issueId: Type.String({ minLength: 1, maxLength: 128, pattern: "^[A-Za-z0-9_.:-]+$" }),
      instruction: Type.String({ minLength: 1, maxLength: 4000 }),
    },
    { additionalProperties: false },
  ),
  interrupt: Type.Object({}, { additionalProperties: false }),
  approval: Type.Object(
    { approvalId: Type.String(), decision: Type.Union([Type.Literal("approve"), Type.Literal("deny")]) },
    { additionalProperties: false },
  ),
  resume: Type.Object({}, { additionalProperties: false }),
};

export class SecretPayloadError extends Error {
  constructor() {
    super("Payload contains a restricted secret or internal field");
    this.name = "SecretPayloadError";
  }
}

const forbiddenKey = /authorization|cookie|token|secret|privatekey|clonepath|rawcommand|headers?|credential/i;
const tokenLikeValue = /(?:ghs_|gho_|github_pat_|sk-|eyJ[A-Za-z0-9_-]{20,})/;

export function assertSecretSafe(value: unknown): void {
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === "string") {
      if (tokenLikeValue.test(node)) throw new SecretPayloadError();
      return;
    }
    if (node === null || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (forbiddenKey.test(key)) throw new SecretPayloadError();
      visit(child);
    }
  };
  visit(value);
}

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function installErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
    }
    if (error.validation !== undefined) {
      return reply.status(400).send({ error: { code: "invalidRequest", message: "The request is invalid." } });
    }
    return reply.status(500).send({
      error: { code: "internalError", message: "The managed runner could not complete the request." },
    });
  });
}
