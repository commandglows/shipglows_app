import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import { detectProjectTargets, projectCapabilityEvidenceDigest, type ProjectTargetDetectorIo } from "../../src/studio/projectTargetDetector.js";

const roots: string[] = [];
const base = { projectId: "project_1", sourceRevision: "a".repeat(40), repositoryDigest: "b".repeat(64), observedAt: "2026-08-16T10:00:00.000Z", expiresAt: "2026-08-16T10:10:00.000Z" };

afterEach(async () => { await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

async function root(): Promise<string> { const path = await mkdtemp(join(tmpdir(), "sg-route-")); roots.push(path); return path; }
async function file(rootPath: string, path: string, contents = "fixture"): Promise<void> { const full = join(rootPath, path); await mkdir(join(full, ".."), { recursive: true }); await writeFile(full, contents); }

async function flutterFixture(rootPath: string): Promise<void> {
  await file(rootPath, "app/pubspec.yaml", "name: fixture\ndependencies:\n  flutter:\n    sdk: flutter\n");
  await file(rootPath, "app/pubspec.lock");
  await file(rootPath, "app/web/index.html");
  await file(rootPath, "app/android/settings.gradle.kts");
  await file(rootPath, "app/windows/CMakeLists.txt");
  await file(rootPath, "app/ios/Runner.xcodeproj/project.pbxproj");
}

describe("server-owned project target detector", () => {
  it("detects Astro from bounded manifest evidence", async () => {
    const repositoryRoot = await root();
    await file(repositoryRoot, "site/package.json", JSON.stringify({ packageManager: "pnpm@10.14.0", dependencies: { astro: "5.0.0" } }));
    await file(repositoryRoot, "site/pnpm-lock.yaml");
    const result = await detectProjectTargets({ repositoryRoot, ...base });
    if (!result.detected) assert.fail(result.reason);
    assert.deepEqual(result.capability.declaredTargets, ["astroWeb"]);
    assert.equal(result.capability.evidenceDigest, projectCapabilityEvidenceDigest(result.capability));
    assert.ok(Object.isFrozen(result.capability));
    assert.ok(Object.isFrozen(result.capability.declaredTargets));
  });

  it("changes project evidence when an actual manifest byte changes", async () => {
    const repositoryRoot = await root();
    await file(repositoryRoot, "site/package.json", JSON.stringify({ packageManager: "pnpm@10.14.0", dependencies: { astro: "5.0.0" } }));
    await file(repositoryRoot, "site/pnpm-lock.yaml", "lockfileVersion: '9.0'");
    const first = await detectProjectTargets({ repositoryRoot, ...base });
    if (!first.detected) assert.fail(first.reason);
    await file(repositoryRoot, "site/pnpm-lock.yaml", "lockfileVersion: '9.1'");
    const second = await detectProjectTargets({ repositoryRoot, ...base });
    if (!second.detected) assert.fail(second.reason);
    assert.notEqual(first.capability.evidenceDigest, second.capability.evidenceDigest);
  });

  it("rejects a file that changes during its bounded read", async () => {
    const repositoryRoot = await root();
    await file(repositoryRoot, "site/package.json", JSON.stringify({ packageManager: "pnpm@10.14.0", dependencies: { astro: "5.0.0" } }));
    await file(repositoryRoot, "site/pnpm-lock.yaml");
    const unstable: ProjectTargetDetectorIo = { readSnapshot: async () => ({ bytes: Buffer.from("{}"), stable: false }) };
    assert.deepEqual(await detectProjectTargets({ repositoryRoot, ...base }, unstable), { detected: false, reason: "unstableEvidence" });
  });

  it("detects all declared Flutter platforms without claiming workers", async () => {
    const repositoryRoot = await root(); await flutterFixture(repositoryRoot);
    const result = await detectProjectTargets({ repositoryRoot, ...base });
    if (!result.detected) assert.fail(result.reason);
    assert.deepEqual(result.capability.declaredTargets, ["flutterWeb", "flutterAndroid", "flutterWindows", "flutterIos"]);
  });

  it("rejects unknown, ambiguous, malformed, oversized, and expired identities", async () => {
    const unknown = await root();
    assert.deepEqual(await detectProjectTargets({ repositoryRoot: unknown, ...base }), { detected: false, reason: "unknownProject" });
    const ambiguous = await root(); await flutterFixture(ambiguous);
    await file(ambiguous, "site/package.json", JSON.stringify({ packageManager: "pnpm@10.0.0", devDependencies: { astro: "5" } })); await file(ambiguous, "site/pnpm-lock.yaml");
    assert.deepEqual(await detectProjectTargets({ repositoryRoot: ambiguous, ...base }), { detected: false, reason: "ambiguousProject" });
    assert.deepEqual(await detectProjectTargets({ repositoryRoot: ambiguous, ...base, repositoryDigest: "bad" }), { detected: false, reason: "invalidIdentity" });
    const huge = await root(); await file(huge, "site/package.json", "x".repeat(64 * 1024 + 1)); await file(huge, "site/pnpm-lock.yaml");
    assert.deepEqual(await detectProjectTargets({ repositoryRoot: huge, ...base }), { detected: false, reason: "unknownProject" });
  });

  it("does not accept comments or unrelated YAML keys as a Flutter SDK declaration", async () => {
    const repositoryRoot = await root();
    await file(repositoryRoot, "app/pubspec.yaml", "name: fake\n# dependencies:\nmetadata:\n  flutter:\n    sdk: flutter\n"); await file(repositoryRoot, "app/pubspec.lock");
    assert.deepEqual(await detectProjectTargets({ repositoryRoot, ...base }), { detected: false, reason: "unknownProject" });
  });

  it("rejects a symlinked repository root", async (context) => {
    const target = await root(); await flutterFixture(target);
    const parent = await root(); const linked = join(parent, "linked");
    try { await symlink(target, linked, process.platform === "win32" ? "junction" : "dir"); } catch { context.skip("Symlinks are unavailable on this host."); return; }
    assert.deepEqual(await detectProjectTargets({ repositoryRoot: linked, ...base }), { detected: false, reason: "unsafeRepositoryRoot" });
  });

  it("rejects a symlinked platform marker", async (context) => {
    const target = await root(); await flutterFixture(target);
    await rm(join(target, "app/web/index.html"));
    try { await symlink(join(target, "app/pubspec.lock"), join(target, "app/web/index.html")); } catch { context.skip("File symlinks are unavailable on this host."); return; }
    const result = await detectProjectTargets({ repositoryRoot: target, ...base });
    if (!result.detected) assert.fail(result.reason);
    assert.equal(result.capability.declaredTargets.includes("flutterWeb"), false);
  });
});
