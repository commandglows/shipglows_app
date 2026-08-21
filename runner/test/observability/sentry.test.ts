import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSentryErrorReporter, scrubSentryEvent, type SentrySdk } from "../../src/observability/index.js";

describe("runner Sentry error reporting", () => {
  it("stays inert until explicitly configured", () => {
    const calls: string[] = [];
    const sdk: SentrySdk = {
      init: () => { calls.push("init"); },
      captureMessage: () => { calls.push("capture"); },
    };
    createSentryErrorReporter({ enabled: false }, "production", sdk).capture("httpRequestFailed");
    assert.deepEqual(calls, []);
  });

  it("initializes without automatic collection and emits only a stable failure code", () => {
    let options: Parameters<SentrySdk["init"]>[0] | undefined;
    const messages: unknown[][] = [];
    const sdk: SentrySdk = {
      init: (input) => { options = input; },
      captureMessage: (...input) => { messages.push(input); },
    };
    const reporter = createSentryErrorReporter({
      enabled: true,
      dsn: "https://public@example.com/1",
      release: "runner-a1b2c3d",
    }, "production", sdk);
    reporter.capture("httpRequestFailed");
    assert.ok(options);
    assert.equal(options.defaultIntegrations, false);
    assert.deepEqual(options.dataCollection, {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: false, response: false },
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    });
    assert.equal(options.tracesSampleRate, 0);
    assert.equal(options.maxBreadcrumbs, 0);
    assert.deepEqual(messages, [["shipglows.runner.httpRequestFailed", "error"]]);
  });

  it("removes request, user, stack, breadcrumbs, tags and hostile provider context", () => {
    const scrubbed = scrubSentryEvent({
      type: undefined,
      event_id: "event-id",
      timestamp: 1,
      release: "runner-a1b2c3d",
      environment: "production",
      message: "token secret path /srv/private prompt",
      request: { url: "https://runner.example.test/private?token=secret" },
      user: { id: "tenant-user" },
      breadcrumbs: [{ message: "conversation text" }],
      tags: { projectId: "private-project" },
      extra: { prompt: "private prompt" },
      exception: { values: [{ value: "secret", stacktrace: { frames: [{ filename: "/srv/private/file.ts" }] } }] },
    });
    assert.deepEqual(scrubbed, {
      type: undefined,
      event_id: "event-id",
      timestamp: 1,
      release: "runner-a1b2c3d",
      environment: "production",
      level: "error",
      platform: "node",
      message: "shipglows.runner.failure",
    });
  });

  it("does not propagate an SDK capture failure", () => {
    const sdk: SentrySdk = {
      init: () => undefined,
      captureMessage: () => { throw new Error("provider unavailable"); },
    };
    assert.doesNotThrow(() => createSentryErrorReporter({
      enabled: true,
      dsn: "https://public@example.com/1",
      release: "runner-a1b2c3d",
    }, "production", sdk).capture("httpRequestFailed"));
  });
});
