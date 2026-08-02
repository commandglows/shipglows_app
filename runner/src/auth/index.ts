import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";

import { HttpError } from "../contracts/index.js";

declare module "fastify" {
  interface FastifyRequest {
    shipglowzActor?: ActorContext;
  }
}

export interface ActorContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly subject: string;
  readonly sessionId?: string;
}

export interface AuthenticationAdapter {
  authenticate(request: Pick<FastifyRequest, "headers">): Promise<ActorContext | null>;
}

export interface SupabaseJwtVerifier {
  verify(accessToken: string): Promise<{ readonly subject: string }>;
}

export interface ActorResolver {
  resolve(input: { readonly subject: string; readonly tenantId: string }): Promise<ActorContext | null>;
}

export class DisabledAuthenticationAdapter implements AuthenticationAdapter {
  authenticate(): Promise<null> {
    return Promise.resolve(null);
  }
}

function oneHeaderValue(
  headers: FastifyRequest["headers"],
  name: string,
): string | undefined {
  const value = headers[name];
  if (typeof value === "string") return value;
  return undefined;
}

function bearerToken(headers: FastifyRequest["headers"]): string | undefined {
  const authorization = oneHeaderValue(headers, "authorization");
  if (authorization === undefined) return undefined;
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization);
  return match?.[1];
}

function tenantHeader(headers: FastifyRequest["headers"]): string | undefined {
  const tenantId = oneHeaderValue(headers, "x-shipglowz-tenant");
  if (tenantId === undefined || tenantId.length === 0 || tenantId.length > 128) return undefined;
  if (!/^[A-Za-z0-9_-]+$/.test(tenantId)) return undefined;
  return tenantId;
}

export class SupabaseAuthenticationAdapter implements AuthenticationAdapter {
  constructor(
    private readonly verifier: SupabaseJwtVerifier,
    private readonly actors: ActorResolver,
  ) {}

  async authenticate(request: Pick<FastifyRequest, "headers">): Promise<ActorContext | null> {
    const token = bearerToken(request.headers);
    const tenantId = tenantHeader(request.headers);
    if (token === undefined || tenantId === undefined) return null;

    try {
      const { subject } = await this.verifier.verify(token);
      return await this.actors.resolve({ subject, tenantId });
    } catch {
      return null;
    }
  }
}

function readSubject(payload: JWTPayload): string {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Supabase token has no subject.");
  }
  return payload.sub;
}

export function createSupabaseJwksVerifier(input: {
  readonly projectUrl: string;
  readonly audience: string;
}): SupabaseJwtVerifier {
  const projectUrl = new URL(input.projectUrl);
  const issuer = new URL("/auth/v1", projectUrl).toString().replace(/\/$/, "");
  const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", projectUrl);
  const jwks = createRemoteJWKSet(jwksUrl);

  return {
    verify: async (accessToken) => {
      const { payload } = await jwtVerify(accessToken, jwks, {
        issuer,
        audience: input.audience,
        algorithms: ["ES256", "RS256"],
      });
      return { subject: readSubject(payload) };
    },
  };
}

export function authenticationGuard(adapter: AuthenticationAdapter): preHandlerAsyncHookHandler {
  return async (request): Promise<void> => {
    const actor = await adapter.authenticate(request);
    if (actor === null) {
      throw new HttpError(401, "unauthorized", "Authentication is required.");
    }
    request.shipglowzActor = actor;
  };
}
