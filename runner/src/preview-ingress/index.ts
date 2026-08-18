import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import type { CloudProjectCatalogEntry } from "../cloud-projects/index.js";

const HOST_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export interface PreviewActor {
  readonly tenantId: string;
  readonly userId: string;
}

export interface PreviewBootstrapTicket {
  readonly id: string;
  readonly secret: string;
  readonly expiresAt: string;
}

export interface PreviewCookie {
  readonly name: "__Host-shipglows_preview";
  readonly value: string;
  readonly attributes: "Path=/; HttpOnly; Secure; SameSite=Strict";
  readonly maxAgeSeconds: number;
}

export interface PreviewAuthorization {
  readonly projectId: string;
  readonly upstreamPort: number;
}

export interface PreviewProjectResolver {
  resolveByHost(host: string): Promise<CloudProjectCatalogEntry | null> | CloudProjectCatalogEntry | null;
}

export interface PreviewAccessPolicy {
  hasAccess(input: PreviewActor & { readonly projectId: string }): Promise<boolean> | boolean;
}

interface TicketRecord extends PreviewActor {
  readonly id: string;
  readonly secretHash: Buffer;
  readonly projectId: string;
  readonly host: string;
  readonly expiresAt: number;
  consumed: boolean;
}

interface SessionRecord extends PreviewActor {
  readonly tokenHash: Buffer;
  readonly projectId: string;
  readonly host: string;
  readonly expiresAt: number;
}

type PreviewEligibleProject = CloudProjectCatalogEntry & {
  readonly privateRuntime: CloudProjectCatalogEntry["privateRuntime"] & { readonly port: number };
};

export class PreviewIngressError extends Error {
  constructor(
    readonly code: "previewDenied" | "previewExpired" | "previewUnavailable" | "previewOriginDenied",
    readonly statusCode: number,
  ) {
    super("Preview access is unavailable.");
  }
}

export class PreviewIngressService {
  private readonly tickets = new Map<string, TicketRecord>();
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(
    private readonly projects: PreviewProjectResolver,
    private readonly access: PreviewAccessPolicy,
    private readonly allowedAppOrigin: string,
    private readonly now: () => number = Date.now,
    private readonly ticketLifetimeMs = 30_000,
    private readonly sessionLifetimeMs = 300_000,
  ) {}

  async createTicket(input: PreviewActor & { readonly projectId: string; readonly host: string; readonly origin: string }): Promise<PreviewBootstrapTicket> {
    const host = normalizeHost(input.host);
    if (input.origin !== this.allowedAppOrigin) throw new PreviewIngressError("previewOriginDenied", 403);
    const project = await this.eligibleProject(host, input.projectId);
    if (!(await this.access.hasAccess({ tenantId: input.tenantId, userId: input.userId, projectId: project.projectId }))) denied();
    const id = `pvt_${randomUUID()}`;
    const secret = randomBytes(32).toString("base64url");
    const expiresAt = this.now() + this.ticketLifetimeMs;
    this.tickets.set(id, {
      id,
      secretHash: digest(secret),
      tenantId: input.tenantId,
      userId: input.userId,
      projectId: project.projectId,
      host,
      expiresAt,
      consumed: false,
    });
    return { id, secret, expiresAt: new Date(expiresAt).toISOString() };
  }

  async consumeTicket(input: PreviewActor & { readonly ticketId: string; readonly secret: string; readonly host: string; readonly origin: string }): Promise<PreviewCookie> {
    const host = normalizeHost(input.host);
    if (input.origin !== this.allowedAppOrigin) throw new PreviewIngressError("previewOriginDenied", 403);
    const ticket = this.tickets.get(input.ticketId);
    if (ticket === undefined || ticket.consumed || ticket.expiresAt <= this.now()) throw new PreviewIngressError("previewExpired", 403);
    if (ticket.tenantId !== input.tenantId || ticket.userId !== input.userId || ticket.host !== host || !safeDigest(ticket.secretHash, input.secret)) denied();
    await this.eligibleProject(host, ticket.projectId);
    if (!(await this.access.hasAccess({ tenantId: input.tenantId, userId: input.userId, projectId: ticket.projectId }))) denied();
    ticket.consumed = true;
    this.tickets.delete(ticket.id);
    const value = randomBytes(32).toString("base64url");
    const expiresAt = this.now() + this.sessionLifetimeMs;
    this.sessions.set(sessionKey(value), {
      tokenHash: digest(value),
      tenantId: input.tenantId,
      userId: input.userId,
      projectId: ticket.projectId,
      host,
      expiresAt,
    });
    return {
      name: "__Host-shipglows_preview",
      value,
      attributes: "Path=/; HttpOnly; Secure; SameSite=Strict",
      maxAgeSeconds: Math.max(1, Math.floor(this.sessionLifetimeMs / 1_000)),
    };
  }

  async authorize(input: { readonly cookie: string | undefined; readonly host: string; readonly origin?: string | undefined; readonly websocket: boolean }): Promise<PreviewAuthorization> {
    const host = normalizeHost(input.host);
    const token = input.cookie;
    if (token === undefined || token.length < 32 || token.length > 128) denied();
    const session = this.sessions.get(sessionKey(token));
    if (session === undefined) throw new PreviewIngressError("previewExpired", 403);
    if (session.host !== host || session.expiresAt <= this.now() || !safeDigest(session.tokenHash, token)) throw new PreviewIngressError("previewExpired", 403);
    if (input.websocket && input.origin !== this.allowedAppOrigin && input.origin !== `https://${session.host}`) {
      throw new PreviewIngressError("previewOriginDenied", 403);
    }
    const project = await this.eligibleProject(host, session.projectId);
    if (!(await this.access.hasAccess({ tenantId: session.tenantId, userId: session.userId, projectId: session.projectId }))) denied();
    return { projectId: project.projectId, upstreamPort: project.privateRuntime.port };
  }

  revoke(cookie: string): void {
    this.sessions.delete(sessionKey(cookie));
  }

  prune(): void {
    for (const [id, ticket] of this.tickets) if (ticket.expiresAt <= this.now()) this.tickets.delete(id);
    for (const [key, session] of this.sessions) if (session.expiresAt <= this.now()) this.sessions.delete(key);
  }

  private async eligibleProject(host: string, expectedProjectId: string): Promise<PreviewEligibleProject> {
    const project = await this.projects.resolveByHost(host);
    if (project === null) throw new PreviewIngressError("previewUnavailable", 503);
    if (project.projectId !== expectedProjectId || !project.capabilities.preview || project.status !== "online" || project.privateRuntime.port === undefined) {
      throw new PreviewIngressError("previewUnavailable", 503);
    }
    return { ...project, privateRuntime: { ...project.privateRuntime, port: project.privateRuntime.port } };
  }
}

function normalizeHost(host: string): string {
  const normalized = host.trim().toLowerCase().replace(/\.$/, "");
  if (normalized.length > 253 || !HOST_PATTERN.test(normalized) || normalized.includes(":")) denied();
  return normalized;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function safeDigest(expected: Buffer, value: string): boolean {
  const received = digest(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function sessionKey(value: string): string {
  return digest(value).toString("hex");
}

function denied(): never {
  throw new PreviewIngressError("previewDenied", 403);
}
