import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const astroImage = new URL("../../images/astro-web/", import.meta.url);
const flutterImage = new URL("../../images/flutter-web/", import.meta.url);
const astroFixture = new URL("../fixtures/linux-compilation/astro-web/", import.meta.url);
const flutterFixture = new URL("../fixtures/linux-compilation/flutter-web/", import.meta.url);

describe("Linux compilation C2 image and fixture inputs", () => {
  it("keeps both image plans private, immutable-by-contract and non-routable", async () => {
    for (const root of [astroImage, flutterImage]) {
      const plan = await json(new URL("image-plan.json", root));
      assert.equal(plan.schemaVersion, "shipglows-toolchain-image-plan-v1");
      assert.equal(plan.status, "blocked_missing_immutable_inputs");
      assert.equal(plan.routable, false);
      assert.equal(plan.visibility, "private");
      assert.equal(plan.platform, "linux/amd64");
      assert.equal(plan.baseImage.reference, null);
      assert.equal(plan.baseImage.digest, null);
      assert.equal(plan.finalImage.repository, null);
      assert.equal(plan.finalImage.digest, null);
      assert.equal(plan.toolchain.toolchainDigest, null);
      assert.equal(plan.attestation.sbomDigest, null);
      assert.equal(plan.attestation.provenanceDigest, null);
      assert.equal(plan.attestation.vulnerabilityResultDigest, null);
      assert.ok(plan.blockers.includes("immutable_base_digest_unresolved"));
      assert.ok(plan.blockers.includes("final_image_digest_unresolved"));
      assert.ok(plan.blockers.includes("offline_store_unmaterialized"));
      assert.deepEqual(await fileNames(root), ["BUILD_BLOCKED.md", "image-plan.json"]);
    }
  });

  it("pins the Astro toolchain to official Node bytes and exact fixture versions", async () => {
    const plan = await json(new URL("image-plan.json", astroImage));
    const packageJson = await json(new URL("package.json", astroFixture));
    assert.equal(plan.target, "astro_web");
    assert.equal(plan.toolchain.nodeVersion, "24.19.0");
    assert.equal(plan.toolchain.nodeLinuxX64Archive, "https://nodejs.org/download/release/v24.19.0/node-v24.19.0-linux-x64.tar.xz");
    assert.equal(plan.toolchain.nodeLinuxX64Sha256, "14b342e71204f811bde6153be8e04b62aef63c236fef92b55f9c83154b409647");
    assert.equal(plan.toolchain.pnpmVersion, "11.15.0");
    assert.equal(plan.toolchain.pnpmArtifactSha256, null);
    assert.equal(packageJson.engines.node, "24.19.0");
    assert.equal(packageJson.packageManager, "pnpm@11.15.0");
    assert.equal(packageJson.dependencies.astro, "^6.4.6");
    assert.equal(packageJson.dependencies["@astrojs/vercel"], "^11.0.5");
    assert.equal(packageJson.devDependencies["@astrojs/check"], "^0.9.10");
    assert.equal(packageJson.devDependencies["@types/node"], "^26.2.0");
    assert.equal(packageJson.devDependencies.vitest, "^4.1.10");
    assert.ok(plan.blockers.includes("pnpm_artifact_digest_unresolved"));
    assert.ok(!plan.blockers.includes("fixture_lock_graph_incomplete"));
  });

  it("pins Flutter 3.41.7 to the canonical Linux release revision and archive", async () => {
    const plan = await json(new URL("image-plan.json", flutterImage));
    const fixtureFvm = await json(new URL(".fvmrc", flutterFixture));
    const projectFvm = await json(new URL("../../../app/.fvmrc", import.meta.url));
    const metadata = await readFile(new URL(".metadata", flutterFixture), "utf8");
    assert.equal(plan.target, "flutter_web");
    assert.equal(fixtureFvm.flutter, "3.41.7");
    assert.equal(fixtureFvm.flutter, projectFvm.flutter);
    assert.equal(plan.toolchain.flutterVersion, "3.41.7");
    assert.equal(plan.toolchain.flutterRevision, "cc0734ac716fbb8b90f3f9db8020958b1553afa7");
    assert.equal(plan.toolchain.dartVersion, "3.11.5");
    assert.equal(plan.toolchain.flutterLinuxX64Archive, "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.7-stable.tar.xz");
    assert.equal(plan.toolchain.flutterLinuxX64Sha256, "f344d5057db52abc2a63cd3a7c7370957b7685d1fca5e5fbe2ce4dfe74657a79");
    assert.match(metadata, /cc0734ac716fbb8b90f3f9db8020958b1553afa7/u);
    assert.doesNotMatch(metadata, /2c9eb20739dfec95e2c74bd3dfa4601b0a8a36aa/u);
  });

  it("binds each offline cache to the exact fixture lock bytes", async () => {
    const cases = [
      [astroImage, astroFixture, "pnpm-lock.yaml"],
      [flutterImage, flutterFixture, "pubspec.lock"],
    ] as const;
    for (const [imageRoot, fixtureRoot, lockName] of cases) {
      const plan = await json(new URL("image-plan.json", imageRoot));
      const bytes = await readFile(new URL(lockName, fixtureRoot));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), plan.offlineCache.fixtureLockSha256);
      assert.equal(plan.offlineCache.contentDigest, null);
      assert.equal(plan.offlineCache.networkAtRuntime, "deny_all");
      assert.equal(plan.offlineCache.cacheMissBehavior, "fail_closed");
    }
  });

  it("freezes commands, outputs and runtime isolation without a shell surface", async () => {
    const astro = await json(new URL("image-plan.json", astroImage));
    const flutter = await json(new URL("image-plan.json", flutterImage));
    assert.deepEqual(astro.execution.commands, [
      ["pnpm", "install", "--offline", "--frozen-lockfile", "--ignore-scripts"],
      ["pnpm", "exec", "astro", "check"],
      ["pnpm", "exec", "astro", "build"],
    ]);
    assert.deepEqual(flutter.execution.commands, [
      ["flutter", "pub", "get", "--offline", "--enforce-lockfile"],
      ["flutter", "build", "web", "--release", "--no-pub"],
    ]);
    assert.equal(astro.execution.outputRoot, "dist");
    assert.equal(flutter.execution.outputRoot, "build/web");
    for (const plan of [astro, flutter]) {
      assert.equal(plan.execution.user, "65532:65532");
      assert.equal(plan.execution.workingDirectory, "/workspace");
      assert.equal(plan.execution.timeoutMs, 600000);
      assert.equal(plan.execution.persistent, false);
      assert.equal(plan.execution.ports, 0);
      assert.equal(plan.execution.runtimeNetwork, "deny_all");
      assert.equal(plan.execution.guestCredentials, false);
      assert.ok(plan.execution.commands.every((argv: unknown[]) => argv.every((part) => typeof part === "string" && !/[;&|`$]/u.test(part))));
    }
  });

  it("contains only the closed source allowlists and no generated output", async () => {
    assert.deepEqual(await fileNames(astroFixture), [
      ".npmrc",
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "public/robots.txt",
      "src/pages/index.astro",
      "tsconfig.json",
    ]);
    assert.deepEqual(await fileNames(flutterFixture), [
      ".fvmrc",
      ".metadata",
      "analysis_options.yaml",
      "lib/main.dart",
      "pubspec.lock",
      "pubspec.yaml",
      "web/index.html",
      "web/manifest.json",
    ]);
    for (const root of [astroFixture, flutterFixture]) {
      const files = await fileNames(root);
      assert.ok(files.every((path) => !/(^|\/)(dist|build|node_modules|\.dart_tool|\.vercel)(\/|$)/u.test(path)));
      for (const path of files) {
        const text = await readFile(new URL(path, root), "utf8");
        assert.doesNotMatch(text, /(?:BEGIN [A-Z ]+PRIVATE KEY|VERCEL_TOKEN|Authorization:\s*Bearer|_authToken)/iu);
      }
    }
  });
});

// Test-only JSON fixtures are intentionally inspected dynamically and then
// asserted field by field against their closed contracts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(url: URL): Promise<any> {
  return JSON.parse(await readFile(url, "utf8"));
}

async function fileNames(root: URL, prefix = ""): Promise<string[]> {
  const names: string[] = [];
  for (const entry of await readdir(new URL(prefix, root), { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) names.push(...await fileNames(root, `${path}/`));
    else names.push(path);
  }
  return names.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
}
