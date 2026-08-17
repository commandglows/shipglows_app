import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import { GitStudioRepositoryAttestor, HttpStudioRuntimeAttestor, STUDIO_BRIDGE_VERSION, STUDIO_PROFILE_ID, STUDIO_SURFACES, createTrustedBaseStudioResolver } from "../../src/studio/capability.js";
import { GOCHARBON_STUDIO_SURFACES, STUDIO_PROFILE_DEFINITIONS } from "../../src/studio/profiles.js";

const temporaryDirectories: string[] = [];
afterEach(async () => { await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

describe("Studio capability attestation", () => {
  it("binds capability to an exact clean Git tree and rejects dirty site content", async () => {
    const root = await mkdtemp(join(tmpdir(), "shipglows-studio-attestation-"));
    temporaryDirectories.push(root);
    await mkdir(join(root, "site"));
    await writeFile(join(root, "site", "fixture.txt"), "trusted\n", "utf8");
    git(root, ["init"]); git(root, ["config", "user.email", "test@example.invalid"]); git(root, ["config", "user.name", "Studio Test"]); git(root, ["add", "site/fixture.txt"]); git(root, ["commit", "-m", "fixture"]);
    const revision = git(root, ["rev-parse", "HEAD"]).trim();
    const tree = git(root, ["rev-parse", "HEAD^{tree}"]).trim();
    const digest = createHash("sha256").update(`git-tree:${tree}\n`, "utf8").digest("hex");
    const attestor = new GitStudioRepositoryAttestor(root);
    assert.deepEqual(await attestor.attest({ expectedSourceRevision: revision, expectedRepositoryDigest: digest }), { sourceRevision: revision, repositoryDigest: digest });
    await writeFile(join(root, "site", "fixture.txt"), "dirty\n", "utf8");
    assert.equal(await attestor.attest({ expectedSourceRevision: revision, expectedRepositoryDigest: digest }), null);
  });

  it("can scope local cleanliness to the reviewed site while still rejecting site drift", async () => {
    const root = await mkdtemp(join(tmpdir(), "shipglows-studio-scoped-attestation-"));
    temporaryDirectories.push(root);
    await mkdir(join(root, "site"));
    await mkdir(join(root, "runner"));
    await writeFile(join(root, "site", "fixture.txt"), "trusted\n", "utf8");
    await writeFile(join(root, "runner", "fixture.txt"), "runner\n", "utf8");
    git(root, ["init"]); git(root, ["config", "user.email", "test@example.invalid"]); git(root, ["config", "user.name", "Studio Test"]); git(root, ["add", "."]); git(root, ["commit", "-m", "fixture"]);
    const revision = git(root, ["rev-parse", "HEAD"]).trim();
    const tree = git(root, ["rev-parse", "HEAD^{tree}"]).trim();
    const digest = createHash("sha256").update(`git-tree:${tree}\n`, "utf8").digest("hex");
    const attestor = new GitStudioRepositoryAttestor(root, "site");
    await writeFile(join(root, "runner", "fixture.txt"), "local runner change\n", "utf8");
    assert.deepEqual(await attestor.attest({ expectedSourceRevision: revision, expectedRepositoryDigest: digest }), { sourceRevision: revision, repositoryDigest: digest });
    await writeFile(join(root, "site", "fixture.txt"), "dirty site\n", "utf8");
    assert.equal(await attestor.attest({ expectedSourceRevision: revision, expectedRepositoryDigest: digest }), null);
  });

  it("requires healthy public profile, bridge version, and exact anchors", async () => {
    const originalFetch = globalThis.fetch;
    const document = STUDIO_SURFACES.map((surface) => `<div data-sg-studio-profile=\"${STUDIO_PROFILE_ID}\" data-sg-studio-anchor=\"${surface.id}\"></div>`).join("");
    let calls = 0;
    globalThis.fetch = async (url) => {
      calls += 1;
      const value = requestUrl(url);
      return response(value, calls === 1 ? document : `${STUDIO_PROFILE_ID} ${STUDIO_BRIDGE_VERSION} ${STUDIO_SURFACES.map((surface) => `\"${surface.id}\"`).join(" ")}`);
    };
    try {
      assert.deepEqual(await new HttpStudioRuntimeAttestor().attest({ previewOrigin: "http://127.0.0.1:3003", sourceRevision: "a".repeat(40), repositoryDigest: "b".repeat(64), profileId: STUDIO_PROFILE_ID, surfaces: STUDIO_SURFACES, documentLimitBytes: STUDIO_PROFILE_DEFINITIONS.shipglows_app.documentLimitBytes }), { healthy: true, profileId: STUDIO_PROFILE_ID, bridgeVersion: STUDIO_BRIDGE_VERSION });
      calls = 0;
      globalThis.fetch = async (url) => response(requestUrl(url), "mismatched runtime");
      assert.equal(await new HttpStudioRuntimeAttestor().attest({ previewOrigin: "http://127.0.0.1:3003", sourceRevision: "a".repeat(40), repositoryDigest: "b".repeat(64), profileId: STUDIO_PROFILE_ID, surfaces: STUDIO_SURFACES, documentLimitBytes: STUDIO_PROFILE_DEFINITIONS.shipglows_app.documentLimitBytes }), null);
    } finally { globalThis.fetch = originalFetch; }
  });

  it("attests the GoCharbon profile only on its exact origin and anchors", async () => {
    const originalFetch = globalThis.fetch;
    const profileId = "gocharbon.astro.hero.v1" as const;
    const document = GOCHARBON_STUDIO_SURFACES.map((surface) => `<div data-sg-studio-profile=\"${profileId}\" data-sg-studio-anchor=\"${surface.id}\"></div>`).join("");
    let calls = 0;
    globalThis.fetch = async (url) => response(requestUrl(url), ++calls === 1 ? document : `${profileId} ${STUDIO_BRIDGE_VERSION} ${GOCHARBON_STUDIO_SURFACES.map((surface) => `\"${surface.id}\"`).join(" ")}`);
    try {
      assert.deepEqual(await new HttpStudioRuntimeAttestor().attest({ previewOrigin: "http://127.0.0.1:3002", sourceRevision: "a".repeat(40), repositoryDigest: "b".repeat(64), profileId, surfaces: GOCHARBON_STUDIO_SURFACES, documentLimitBytes: STUDIO_PROFILE_DEFINITIONS.gocharbon.documentLimitBytes }), { healthy: true, profileId, bridgeVersion: STUDIO_BRIDGE_VERSION });
    } finally { globalThis.fetch = originalFetch; }
  });

  it("keeps the document budget closed and profile-specific", async () => {
    const originalFetch = globalThis.fetch;
    const revision = "a".repeat(40);
    const digest = "b".repeat(64);
    const gocharbonProfile = STUDIO_PROFILE_DEFINITIONS.gocharbon;
    const shipglowsProfile = STUDIO_PROFILE_DEFINITIONS.shipglows_app;
    const gocharbonMarkers = GOCHARBON_STUDIO_SURFACES.map((surface) => `<div data-sg-studio-profile=\"${gocharbonProfile.profileId}\" data-sg-studio-anchor=\"${surface.id}\"></div>`).join("");
    const shipglowsMarkers = STUDIO_SURFACES.map((surface) => `<div data-sg-studio-profile=\"${shipglowsProfile.profileId}\" data-sg-studio-anchor=\"${surface.id}\"></div>`).join("");
    const bridge = (profileId: string, surfaces: readonly { readonly id: string }[]) => `${profileId} ${STUDIO_BRIDGE_VERSION} ${surfaces.map((surface) => `\"${surface.id}\"`).join(" ")}`;
    try {
      let calls = 0;
      globalThis.fetch = async (url) => response(requestUrl(url), ++calls === 1 ? `${gocharbonMarkers}${"x".repeat(300 * 1024)}` : bridge(gocharbonProfile.profileId, GOCHARBON_STUDIO_SURFACES));
      assert.deepEqual(await new HttpStudioRuntimeAttestor().attest({ previewOrigin: gocharbonProfile.previewOrigin, sourceRevision: revision, repositoryDigest: digest, profileId: gocharbonProfile.profileId, surfaces: gocharbonProfile.surfaces, documentLimitBytes: gocharbonProfile.documentLimitBytes }), { healthy: true, profileId: gocharbonProfile.profileId, bridgeVersion: STUDIO_BRIDGE_VERSION });

      globalThis.fetch = async (url) => response(requestUrl(url), `${gocharbonMarkers}${"x".repeat(gocharbonProfile.documentLimitBytes)}`);
      assert.equal(await new HttpStudioRuntimeAttestor().attest({ previewOrigin: gocharbonProfile.previewOrigin, sourceRevision: revision, repositoryDigest: digest, profileId: gocharbonProfile.profileId, surfaces: gocharbonProfile.surfaces, documentLimitBytes: gocharbonProfile.documentLimitBytes }), null);

      globalThis.fetch = async (url) => response(requestUrl(url), `${shipglowsMarkers}${"x".repeat(300 * 1024)}`);
      assert.equal(await new HttpStudioRuntimeAttestor().attest({ previewOrigin: shipglowsProfile.previewOrigin, sourceRevision: revision, repositoryDigest: digest, profileId: shipglowsProfile.profileId, surfaces: shipglowsProfile.surfaces, documentLimitBytes: shipglowsProfile.documentLimitBytes }), null);
    } finally { globalThis.fetch = originalFetch; }
  });

  it("keeps the resolver unavailable on repository or runtime mismatch", async () => {
    const configuration = { projectId: "shipglows_app" as const, previewOrigin: "http://127.0.0.1:3003", expectedSourceRevision: "a".repeat(40), expectedRepositoryDigest: "b".repeat(64), adapterVersion: "1.0.0", capabilityVersion: "1.0.0" };
    const repository = { attest: async () => ({ sourceRevision: configuration.expectedSourceRevision, repositoryDigest: configuration.expectedRepositoryDigest }) };
    const mismatch = createTrustedBaseStudioResolver({ configuration, repository, runtime: { attest: async () => null } });
    assert.equal(await mismatch.resolve({ tenantId: "ten_1", userId: "usr_1", projectId: "shipglows_app" }), null);
    let runtimeCalled = false;
    const dirty = createTrustedBaseStudioResolver({ configuration, repository: { attest: async () => null }, runtime: { attest: async () => { runtimeCalled = true; return null; } } });
    assert.equal(await dirty.resolve({ tenantId: "ten_1", userId: "usr_1", projectId: "shipglows_app" }), null);
    assert.equal(runtimeCalled, false);
  });
});

function git(cwd: string, args: readonly string[]): string { return execFileSync("git", [...args], { cwd, encoding: "utf8", windowsHide: true }); }
function response(url: string, body: string): Response { const result = new Response(body, { status: 200 }); Object.defineProperty(result, "url", { value: url }); return result; }
function requestUrl(input: string | URL | Request): string { return typeof input === "string" ? input : input instanceof URL ? input.href : input.url; }
