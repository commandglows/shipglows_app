import type { FastifyRequest, preHandlerAsyncHookHandler } from "fastify";

import { HttpError } from "../contracts/index.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function stateChangingOriginGuard(allowedOrigins: readonly string[]): preHandlerAsyncHookHandler {
  return (request: FastifyRequest): Promise<void> => {
    if (safeMethods.has(request.method)) return Promise.resolve();
    const origin = request.headers.origin;
    if (origin === undefined) return Promise.resolve();
    if (typeof origin !== "string" || !allowedOrigins.includes(origin)) {
      throw new HttpError(403, "originNotAllowed", "The request origin is not allowed.");
    }
    return Promise.resolve();
  };
}
