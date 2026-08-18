import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";

import { HttpError } from "../contracts/index.js";

declare module "fastify" {
  interface FastifyRequest {
    shipglowsActor?: ActorContext;
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

export interface FirebaseIdTokenVerifier {
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
  const tenantId = oneHeaderValue(headers, "x-shipglows-tenant");
  if (tenantId === undefined || tenantId.length === 0 || tenantId.length > 128) return undefined;
  if (!/^[A-Za-z0-9_-]+$/.test(tenantId)) return undefined;
  return tenantId;
}

export class FirebaseAuthenticationAdapter implements AuthenticationAdapter {
  constructor(
    private readonly verifier: FirebaseIdTokenVerifier,
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

export interface PersonalActorProvisioner {
  resolveOrProvision(input: { readonly subject: string }): Promise<ActorContext>;
}

export type AuthenticationFailureReason = "missingBearer" | "invalidToken" | "provisioningFailed";

export class FixedSingleUserFirebaseAuthenticationAdapter implements AuthenticationAdapter {
  constructor(
    private readonly verifier: FirebaseIdTokenVerifier,
    private readonly expectedSubject: string,
    private readonly tenantId: string,
    private readonly userId: string,
  ) {}

  async authenticate(request: Pick<FastifyRequest, "headers">): Promise<ActorContext | null> {
    const token = bearerToken(request.headers);
    if (token === undefined) return null;
    try {
      const { subject } = await this.verifier.verify(token);
      if (subject !== this.expectedSubject) return null;
      return { subject, tenantId: this.tenantId, userId: this.userId };
    } catch { return null; }
  }
}

export class PersonalCloudFirebaseAuthenticationAdapter implements AuthenticationAdapter {
  constructor(
    private readonly verifier: FirebaseIdTokenVerifier,
    private readonly actors: PersonalActorProvisioner,
    private readonly onFailure: (reason: AuthenticationFailureReason) => void = () => undefined,
  ) {}

  async authenticate(request: Pick<FastifyRequest, "headers">): Promise<ActorContext | null> {
    const token = bearerToken(request.headers);
    if (token === undefined) {
      this.onFailure("missingBearer");
      return null;
    }
    let subject: string;
    try {
      ({ subject } = await this.verifier.verify(token));
    } catch {
      this.onFailure("invalidToken");
      return null;
    }
    try {
      return await this.actors.resolveOrProvision({ subject });
    } catch {
      this.onFailure("provisioningFailed");
      return null;
    }
  }
}

function readSubject(payload: JWTPayload): string {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Firebase ID token has no subject.");
  }
  return payload.sub;
}

export function createFirebaseIdTokenVerifier(input: {
  readonly projectId: string;
}): FirebaseIdTokenVerifier {
  const issuer = `https://securetoken.google.com/${input.projectId}`;
  const jwksUrl = new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  const jwks = createRemoteJWKSet(jwksUrl);

  return {
    verify: async (accessToken) => {
      const { payload } = await jwtVerify(accessToken, jwks, {
        issuer,
        audience: input.projectId,
        algorithms: ["RS256"],
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
    request.shipglowsActor = actor;
  };
}
