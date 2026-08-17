import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, it } from "node:test";

import { HttpError } from "../../src/contracts/index.js";
import { GitHubAppProjectSource } from "../../src/projects/githubProjectSource.js";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture() {
  const root = mkdtempSync(resolve(tmpdir(), "shipglows-github-source-"));
  roots.push(root);
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = new Date("2026-08-17T12:00:00.000Z");
  const calls: { url: string; authorization: string }[] = [];
  let installationAvailable = true;
  let accountLabel = "ShipGlows";
  let repositoryFullName = "shipglows/shipglows_app";
  let tokenFailureStatus: number | null = null;
  let repositoryFailureStatus: number | null = null;
  let sequence = 0;
  const connectionStates: string[] = [];
  const fetch: typeof globalThis.fetch = async (request, init) => {
    const url = request instanceof URL ? request : new URL(typeof request === "string" ? request : request.url);
    const headers = new Headers(init?.headers);
    calls.push({ url: url.toString(), authorization: headers.get("authorization") ?? "" });
    if (url.pathname === "/app/installations/42") {
      return installationAvailable
        ? Response.json({ id: 42, account: { login: accountLabel } })
        : Response.json({ message: "not found" }, { status: 404 });
    }
    if (url.pathname === "/app/installations/42/access_tokens") {
      if (tokenFailureStatus !== null) return Response.json({ message: "token failure" }, { status: tokenFailureStatus });
      return Response.json({ token: "ghs_server_only", expires_at: "2026-08-17T12:30:00.000Z" });
    }
    if (url.pathname === "/installation/repositories") {
      assert.equal(headers.get("authorization"), "Bearer ghs_server_only");
      return Response.json({ total_count: 1, repositories: [{
        id: 101, full_name: repositoryFullName, default_branch: "main", private: true, archived: false,
      }] });
    }
    if (url.pathname === "/repositories/101") {
      if (repositoryFailureStatus !== null) return Response.json({ message: "repository failure" }, { status: repositoryFailureStatus });
      assert.equal(headers.get("authorization"), "Bearer ghs_server_only");
      return Response.json({ id: 101, full_name: repositoryFullName, default_branch: "main", private: true, archived: false });
    }
    return Response.json({ message: "unexpected" }, { status: 500 });
  };
  const source = new GitHubAppProjectSource({
    appId: "7",
    appSlug: "shipglows-local",
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    setupUrl: "http://127.0.0.1:3005/projects/github/setup",
    storagePath: resolve(root, "state", "github.json"),
    apiBaseUrl: "https://api.github.test/",
    fetch,
    now: () => now,
    random: () => `opaque_${++sequence}_${"x".repeat(24)}`,
    onConnectionState: ({ installationId, state }) => { connectionStates.push(`${installationId}:${state}`); },
  });
  return {
    source,
    storagePath: resolve(root, "state", "github.json"),
    actor: { tenantId: "tenant_a", userId: "user_a" },
    otherActor: { tenantId: "tenant_a", userId: "user_b" },
    calls,
    loseAccess: () => { installationAvailable = false; },
    restoreAccess: () => { installationAvailable = true; },
    setAccountLabel: (value: string) => { accountLabel = value; },
    setRepositoryFullName: (value: string) => { repositoryFullName = value; },
    failTokenWith: (status: number | null) => { tokenFailureStatus = status; },
    failRepositoryWith: (status: number | null) => { repositoryFailureStatus = status; },
    connectionStates,
  };
}

describe("GitHub App project source", () => {
  it("binds one authenticated actor with one-time setup state and persists only the installation association", async () => {
    const { source, actor, otherActor, storagePath } = fixture();
    const setup = await source.beginSetup(actor);
    const action = new URL(setup.actionUrl);
    const state = action.searchParams.get("state");
    assert.equal(action.pathname, "/apps/shipglows-local/installations/new");
    assert.ok(state?.startsWith("ghs_opaque_"));
    assert.equal(setup.setupUrl, "http://127.0.0.1:3005/projects/github/setup");
    await assert.rejects(
      source.completeSetup({ ...otherActor, installationId: 42, state: state ?? "" }),
      (error: unknown) => error instanceof HttpError && error.code === "githubSetupStateInvalid",
    );
    const completed = await source.completeSetup({ ...actor, installationId: 42, state: state ?? "" });
    assert.equal(completed.state, "ready");
    assert.equal(completed.accountLabel, "ShipGlows");
    await assert.rejects(
      source.completeSetup({ ...actor, installationId: 42, state: state ?? "" }),
      (error: unknown) => error instanceof HttpError && error.code === "githubSetupStateInvalid",
    );
    const persisted = readFileSync(storagePath, "utf8");
    assert.match(persisted, /"installationId": 42/);
    assert.match(persisted, /"accountLabel": "ShipGlows"/);
    assert.doesNotMatch(persisted, /token|repositoryId|candidate/i);
  });

  it("lists opaque actor-bound candidates with an installation token and revalidates immutable metadata before selection", async () => {
    const { source, actor, otherActor, calls } = fixture();
    const setup = await source.beginSetup(actor);
    await source.completeSetup({ ...actor, installationId: 42, state: new URL(setup.actionUrl).searchParams.get("state") ?? "" });
    const page = await source.listRepositories(actor);
    assert.equal(page.repositories.length, 1);
    const candidate = page.repositories[0];
    assert.ok(candidate?.candidateId.startsWith("ghc_opaque_"));
    assert.equal(JSON.stringify(candidate).includes("101"), false);
    assert.equal(JSON.stringify(candidate).includes("42"), false);
    await assert.rejects(
      source.selectRepository({ ...otherActor, candidateId: candidate?.candidateId ?? "" }),
      (error: unknown) => error instanceof HttpError && error.code === "githubCandidateUnavailable",
    );
    const selected = await source.selectRepository({ ...actor, candidateId: candidate?.candidateId ?? "" });
    assert.equal(selected.repositoryId, 101);
    assert.equal(selected.installationId, 42);
    assert.equal(selected.fullName, "shipglows/shipglows_app");
    assert.ok(calls.some((call) => call.url.includes("/installation/repositories?per_page=100&page=1") && call.authorization === "Bearer ghs_server_only"));
    assert.ok(calls.some((call) => call.url.endsWith("/repositories/101") && call.authorization === "Bearer ghs_server_only"));
    assert.equal(calls.some((call) => call.authorization === "Bearer ghs_server_only" && call.url.includes("app/installations")), false);
  });

  it("reports access loss honestly and removes only the actor installation association", async () => {
    const { source, actor, loseAccess, restoreAccess, connectionStates } = fixture();
    const setup = await source.beginSetup(actor);
    await source.completeSetup({ ...actor, installationId: 42, state: new URL(setup.actionUrl).searchParams.get("state") ?? "" });
    loseAccess();
    assert.equal((await source.status(actor)).state, "accessLost");
    restoreAccess();
    assert.equal((await source.status(actor)).state, "ready");
    assert.deepEqual(connectionStates.slice(-2), ["42:accessLost", "42:ready"]);
    await source.disconnect(actor);
    assert.equal((await source.status(actor)).state, "disconnected");
  });

  it("fails closed on unsafe upstream account and repository metadata", async () => {
    const invalidAccount = fixture();
    const accountSetup = await invalidAccount.source.beginSetup(invalidAccount.actor);
    invalidAccount.setAccountLabel("<script>");
    await assert.rejects(
      invalidAccount.source.completeSetup({
        ...invalidAccount.actor,
        installationId: 42,
        state: new URL(accountSetup.actionUrl).searchParams.get("state") ?? "",
      }),
      (error: unknown) => error instanceof HttpError && error.code === "githubInstallationUnavailable",
    );

    const invalidRepository = fixture();
    const repositorySetup = await invalidRepository.source.beginSetup(invalidRepository.actor);
    await invalidRepository.source.completeSetup({
      ...invalidRepository.actor,
      installationId: 42,
      state: new URL(repositorySetup.actionUrl).searchParams.get("state") ?? "",
    });
    invalidRepository.setRepositoryFullName("shipglows/../escape");
    await assert.rejects(
      invalidRepository.source.listRepositories(invalidRepository.actor),
      (error: unknown) => error instanceof HttpError && error.code === "githubDegraded",
    );
    assert.equal(invalidRepository.connectionStates.at(-1), "42:degraded");
  });

  it("projects installation-scoped list and selection failures immediately", async () => {
    const fixtureValue = fixture();
    const setup = await fixtureValue.source.beginSetup(fixtureValue.actor);
    await fixtureValue.source.completeSetup({
      ...fixtureValue.actor,
      installationId: 42,
      state: new URL(setup.actionUrl).searchParams.get("state") ?? "",
    });
    fixtureValue.failTokenWith(403);
    await assert.rejects(
      fixtureValue.source.listRepositories(fixtureValue.actor),
      (error: unknown) => error instanceof HttpError && error.code === "githubAccessLost",
    );
    assert.equal(fixtureValue.connectionStates.at(-1), "42:accessLost");

    fixtureValue.failTokenWith(null);
    const page = await fixtureValue.source.listRepositories(fixtureValue.actor);
    assert.equal(fixtureValue.connectionStates.at(-1), "42:ready");
    fixtureValue.failRepositoryWith(500);
    await assert.rejects(
      fixtureValue.source.selectRepository({
        ...fixtureValue.actor,
        candidateId: page.repositories[0]?.candidateId ?? "",
      }),
      (error: unknown) => error instanceof HttpError && error.code === "githubDegraded",
    );
    assert.equal(fixtureValue.connectionStates.at(-1), "42:degraded");
  });
});
