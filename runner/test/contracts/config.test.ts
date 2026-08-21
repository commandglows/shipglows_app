import assert from "node:assert/strict";
import { resolve } from "node:path";
import { describe, it } from "node:test";

import {
  ConfigError,
  loadConfig,
  publicConfig,
} from "../../src/config.js";

describe("runner configuration", () => {
  it("loads provider integrations disabled by default", () => {
    const config = loadConfig({ RUNNER_ENV: "test" }, { cwd: "/srv/runner" });

    assert.equal(config.integrations.firebase.enabled, false);
    assert.equal(config.integrations.github.enabled, false);
    assert.equal(config.runtimes.codex.enabled, false);
    assert.equal(config.runtimes.eve.enabled, false);
    assert.equal(config.server.host, "127.0.0.1");
    assert.equal(config.server.port, 3210);
    assert.deepEqual(publicConfig(config), {
      environment: "test",
      host: "127.0.0.1",
      port: 3210,
      allowedOrigins: [],
      maxConcurrentRunsPerTenant: 2,
      maxRunDurationMs: 900000,
      firebaseEnabled: false,
      githubEnabled: false,
      sentryEnabled: false,
      codexEnabled: false,
      eveEnabled: false,
      operatorWorkspaceCount: 0,
      personalCloudEnabled: false,
      studioEnabled: false,
      localStudioAuthEnabled: false,
    });
  });

  it("keeps Sentry disabled by default and validates explicit safe configuration", () => {
    assert.equal(loadConfig({ RUNNER_ENV: "test" }).integrations.sentry.enabled, false);
    assert.throws(() => loadConfig({ SENTRY_ENABLED: "true" }), /SENTRY_DSN/);
    assert.throws(() => loadConfig({ SENTRY_ENABLED: "true", SENTRY_DSN: "http:\/\/public@example.com/1", SENTRY_RELEASE: "release-1" }), /SENTRY_DSN/);
    const config = loadConfig({
      SENTRY_ENABLED: "true",
      SENTRY_DSN: "https:\/\/public@example.com/1",
      SENTRY_RELEASE: "runner-a1b2c3d",
    });
    assert.deepEqual(config.integrations.sentry, {
      enabled: true,
      dsn: "https:\/\/public@example.com/1",
      release: "runner-a1b2c3d",
    });
    assert.equal(publicConfig(config).sentryEnabled, true);
    assert.equal("dsn" in publicConfig(config), false);
  });

  it("rejects invalid and unknown runner settings", () => {
    assert.throws(
      () => loadConfig({ RUNNER_PORT: "not-a-port" }),
      (error: unknown) => error instanceof ConfigError,
    );
    assert.throws(
      () => loadConfig({ RUNNER_UNSAFE_SHELL: "yes" }),
      (error: unknown) =>
        error instanceof ConfigError && error.issues.includes("RUNNER_UNSAFE_SHELL"),
    );
  });

  it("normalizes configured browser origins", () => {
    const config = loadConfig({
      RUNNER_ALLOWED_ORIGINS: "https://cockpit.example.com/, https://cockpit.example.com",
    });

    assert.deepEqual(config.server.allowedOrigins, ["https://cockpit.example.com"]);
  });

  it("accepts only absolute server-owned operator Workspace mappings", () => {
    const config = loadConfig({ RUNNER_OPERATOR_WORKSPACES: '{"project":{"cwd":"/srv/project","tmuxSession":"shipglows-project"}}' });
    assert.deepEqual(config.operatorWorkspaces, { project: { cwd: "/srv/project", tmuxSession: "shipglows-project" } });
    assert.throws(() => loadConfig({ RUNNER_OPERATOR_WORKSPACES: '{"project":{"cwd":"../escape","tmuxSession":"bad name"}}' }), /RUNNER_OPERATOR_WORKSPACES/);
  });

  it("requires a Firebase project ID only when the Firebase adapter is explicitly enabled", () => {
    assert.throws(
      () => loadConfig({ FIREBASE_AUTH_ENABLED: "true" }),
      (error: unknown) =>
        error instanceof ConfigError &&
        error.issues.includes("FIREBASE_PROJECT_ID"),
    );
  });

  it("fails closed when a production runner is missing browser and authentication gates", () => {
    assert.throws(
      () => loadConfig({ RUNNER_ENV: "production" }),
      (error: unknown) =>
        error instanceof ConfigError &&
        error.issues.includes("FIREBASE_AUTH_ENABLED=true is required in production") &&
        error.issues.includes("RUNNER_ALLOWED_ORIGINS is required in production"),
    );
  });

  it("admits personal cloud only with fixed Firebase identity and private filesystem bounds", () => {
    const env = {
      RUNNER_PERSONAL_CLOUD_ENABLED: "true",
      FIREBASE_AUTH_ENABLED: "true",
      FIREBASE_PROJECT_ID: "shipglows-prod",
      RUNNER_ALLOWED_ORIGINS: "https://app.shipglows.com",
      RUNNER_CLOUD_PROJECT_CATALOG_PATH: "/srv/shipglows/state/cli-project-catalog.v1.json",
      RUNNER_CLOUD_ALLOWED_ROOTS: "/srv/projects",
      RUNNER_PREVIEW_DOMAIN: "shipglows.com",
      RUNNER_PERSONAL_CLOUD_APP_ORIGIN: "https://app.shipglows.com",
      RUNNER_PERSONAL_CLOUD_FIREBASE_UID: "firebase-owner",
      RUNNER_PERSONAL_CLOUD_TENANT_ID: "ten_personal",
      RUNNER_PERSONAL_CLOUD_USER_ID: "usr_owner",
    };
    assert.equal(loadConfig(env).personalCloud.enabled, true);
    assert.throws(() => loadConfig({ ...env, RUNNER_PERSONAL_CLOUD_FIREBASE_UID: "" }), /FIREBASE_UID/);
    assert.throws(() => loadConfig({ ...env, FIREBASE_AUTH_ENABLED: "false" }), /requires FIREBASE_AUTH_ENABLED/);
    assert.throws(() => loadConfig({ ...env, RUNNER_ENV: "production" }), /RUNNER_OPERATOR_WORKSPACE_USER/);
    assert.equal(loadConfig({ ...env, RUNNER_ENV: "production", RUNNER_OPERATOR_WORKSPACE_USER: "shipglows-workspace" }).operatorWorkspaceUser, "shipglows-workspace");
  });

  it("keeps Studio disabled by default and rejects production or incomplete enablement", () => {
    assert.equal(loadConfig({ RUNNER_ENV: "test" }).studio.enabled, false);
    assert.throws(() => loadConfig({ RUNNER_ENV: "production", RUNNER_STUDIO_ENABLED: "true" }), /forbidden in production/);
    assert.throws(() => loadConfig({ RUNNER_ENV: "development", RUNNER_STUDIO_ENABLED: "true" }), /RUNNER_STUDIO_PROJECT_ID/);
    const config = loadConfig({
      RUNNER_ENV: "development",
      RUNNER_STUDIO_ENABLED: "true",
      RUNNER_STUDIO_PROJECT_ID: "shipglows_app",
      RUNNER_STUDIO_ORIGIN: "http://127.0.0.1:3003",
      RUNNER_STUDIO_SOURCE_REVISION: "a".repeat(40),
      RUNNER_STUDIO_REPOSITORY_DIGEST: "b".repeat(64),
      RUNNER_STUDIO_ADAPTER_VERSION: "1.0.0",
      RUNNER_STUDIO_CAPABILITY_VERSION: "1.0.0",
    });
    assert.equal(config.studio.enabled, true);
  });

  it("admits only the exact GoCharbon profile, origin, and server-owned repository root", () => {
    const studio = {
      RUNNER_ENV: "development",
      RUNNER_STUDIO_ENABLED: "true",
      RUNNER_STUDIO_PROJECT_ID: "gocharbon",
      RUNNER_STUDIO_ORIGIN: "http://127.0.0.1:3002",
      RUNNER_STUDIO_REPOSITORY_ROOT: resolve("test-fixtures/gocharbon"),
      RUNNER_STUDIO_SOURCE_REVISION: "a".repeat(40),
      RUNNER_STUDIO_REPOSITORY_DIGEST: "b".repeat(64),
      RUNNER_STUDIO_ADAPTER_VERSION: "1.0.0",
      RUNNER_STUDIO_CAPABILITY_VERSION: "1.0.0",
    };
    const config = loadConfig(studio);
    assert.equal(config.studio.enabled && config.studio.projectId, "gocharbon");
    assert.equal(config.studio.enabled && config.studio.repositoryRoot, studio.RUNNER_STUDIO_REPOSITORY_ROOT);
    assert.throws(() => loadConfig({ ...studio, RUNNER_STUDIO_ORIGIN: "http://127.0.0.1:3003" }), /RUNNER_STUDIO_ORIGIN/);
    assert.throws(() => loadConfig({ ...studio, RUNNER_STUDIO_REPOSITORY_ROOT: "..\\gocharbon" }), /absolute path/);
  });

  it("admits local Studio auth only for the exact development loopback pilot", () => {
    const studio = {
      RUNNER_ENV: "development",
      RUNNER_STUDIO_ENABLED: "true",
      RUNNER_STUDIO_PROJECT_ID: "shipglows_app",
      RUNNER_STUDIO_ORIGIN: "http://127.0.0.1:3003",
      RUNNER_STUDIO_SOURCE_REVISION: "a".repeat(40),
      RUNNER_STUDIO_REPOSITORY_DIGEST: "b".repeat(64),
      RUNNER_STUDIO_ADAPTER_VERSION: "1.0.0",
      RUNNER_STUDIO_CAPABILITY_VERSION: "1.0.0",
      RUNNER_LOCAL_STUDIO_AUTH_ENABLED: "true",
      RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005",
    };
    assert.equal(loadConfig(studio).localStudioAuthEnabled, true);
    assert.throws(() => loadConfig({ ...studio, RUNNER_ENV: "production" }), /development-only/);
    assert.throws(() => loadConfig({ ...studio, RUNNER_HOST: "0.0.0.0", RUNNER_ALLOW_PUBLIC_BINDING: "true" }), /loopback host/);
    assert.throws(() => loadConfig({ ...studio, RUNNER_ALLOWED_ORIGINS: "http://localhost:3005" }), /exact local app origin/);
    assert.throws(() => loadConfig({ ...studio, FIREBASE_AUTH_ENABLED: "true", FIREBASE_PROJECT_ID: "project" }), /cannot be combined/);
  });

  it("requires GitHub App credentials and rejects classic GitHub tokens", () => {
    assert.throws(
      () => loadConfig({ GITHUB_ENABLED: "true" }),
      (error: unknown) => error instanceof ConfigError && error.issues.includes("GITHUB_APP_ID"),
    );
    assert.throws(
      () => loadConfig({ GITHUB_TOKEN: "legacy-token" }),
      (error: unknown) => error instanceof ConfigError && error.issues.some((issue) => issue.startsWith("GITHUB_TOKEN")),
    );
    const config = loadConfig({
      GITHUB_ENABLED: "true",
      GITHUB_APP_ID: "42",
      GITHUB_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nvalue\\n-----END PRIVATE KEY-----",
    });
    assert.equal(config.integrations.github.enabled, true);
    assert.equal(config.integrations.github.appId, "42");
    assert.equal(config.integrations.github.appSlug, undefined);
    assert.equal(config.integrations.github.setupUrl, undefined);
    assert.match(config.integrations.github.privateKey ?? "", /\n/);
    assert.equal("privateKey" in publicConfig(config), false);
    const localHub = {
      GITHUB_ENABLED: "true",
      GITHUB_APP_ID: "42",
      GITHUB_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nvalue\\n-----END PRIVATE KEY-----",
      RUNNER_ENV: "development",
      RUNNER_STUDIO_ENABLED: "true",
      RUNNER_STUDIO_PROJECT_ID: "shipglows_app",
      RUNNER_STUDIO_ORIGIN: "http://127.0.0.1:3003",
      RUNNER_STUDIO_SOURCE_REVISION: "a".repeat(40),
      RUNNER_STUDIO_REPOSITORY_DIGEST: "b".repeat(64),
      RUNNER_STUDIO_ADAPTER_VERSION: "1.0.0",
      RUNNER_STUDIO_CAPABILITY_VERSION: "1.0.0",
      RUNNER_LOCAL_STUDIO_AUTH_ENABLED: "true",
      RUNNER_ALLOWED_ORIGINS: "http://127.0.0.1:3005",
    };
    assert.throws(() => loadConfig(localHub), /GITHUB_APP_SLUG/);
    const hubConfig = loadConfig({
      ...localHub,
      GITHUB_APP_SLUG: "shipglows-local",
      GITHUB_APP_SETUP_URL: "http://127.0.0.1:3005/projects/github/setup",
    });
    assert.equal(hubConfig.integrations.github.appSlug, "shipglows-local");
    assert.equal(hubConfig.integrations.github.setupUrl, "http://127.0.0.1:3005/projects/github/setup");
    assert.throws(() => loadConfig({
      ...localHub,
      GITHUB_APP_SLUG: "bad slug",
      GITHUB_APP_SETUP_URL: "http://example.com/setup#token",
    }), /GITHUB_APP_SLUG/);
  });

  it("rejects retired Clerk settings without echoing secret values", () => {
    const secret = "sk_test_must_never_appear";
    let thrown: unknown;

    try {
      loadConfig({
        CLERK_ENABLED: "false",
        CLERK_SECRET_KEY: secret,
      });
    } catch (error) {
      thrown = error;
    }

    assert.ok(thrown instanceof ConfigError);
    assert.doesNotMatch(thrown.message, new RegExp(secret));
    assert.doesNotMatch(JSON.stringify(thrown), new RegExp(secret));
  });

  it("requires an explicit opt-in before binding publicly", () => {
    assert.throws(
      () => loadConfig({ RUNNER_HOST: "0.0.0.0" }),
      (error: unknown) =>
        error instanceof ConfigError &&
        error.issues.includes("RUNNER_ALLOW_PUBLIC_BINDING=true is required for a non-loopback host"),
    );
  });
});
