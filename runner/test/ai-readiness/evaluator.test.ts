import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { BoundedProjectAiReadinessEvaluator } from "../../src/ai-readiness/index.js";

async function fixture(): Promise<string> {
  return mkdtemp(join(tmpdir(), "shipglows-ai-readiness-"));
}

describe("Project AI readiness evaluator", () => {
  it("scores a complete web project from explainable metadata", async () => {
    const root = await fixture();
    await mkdir(join(root, "src"));
    await mkdir(join(root, "schemas"));
    await mkdir(join(root, "public"));
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "node --test", lint: "eslint ." }, dependencies: { astro: "1.0.0", "@astrojs/sitemap": "1.0.0" } }));
    await writeFile(join(root, "package-lock.json"), "{}");
    await writeFile(join(root, "AGENTS.md"), "instructions");
    await writeFile(join(root, "llms.txt"), "project map");
    await writeFile(join(root, "schemas", "project.schema.json"), "{}");

    const result = await new BoundedProjectAiReadinessEvaluator({ now: () => new Date("2026-08-20T08:00:00Z") }).evaluate(root);

    assert.equal(result.version, "shipglows.ai-readiness.v1");
    assert.equal(result.status, "ready");
    assert.equal(result.score, 100);
    assert.equal(result.coverage, 1);
    assert.equal(result.checks.length, 6);
    assert.deepEqual(result.recommendations, []);
  });

  it("excludes sitemap from a non-web project and returns prioritized improvements", async () => {
    const root = await fixture();
    await mkdir(join(root, "lib"));
    await writeFile(join(root, "pubspec.yaml"), "name: example\n");
    await writeFile(join(root, "pubspec.lock"), "packages: {}\n");

    const result = await new BoundedProjectAiReadinessEvaluator().evaluate(root);

    assert.equal(result.checks.find((check) => check.id === "sitemap")?.outcome, "notApplicable");
    assert.equal(result.score, 33);
    assert.equal(result.status, "needsWork");
    assert.equal(result.recommendations[0], "Add project-level AGENTS.md or equivalent agent guidance.");
  });

  it("does not follow symlinks outside the project", async () => {
    const root = await fixture();
    const outside = await fixture();
    await writeFile(join(outside, "AGENTS.md"), "outside guidance");
    await writeFile(join(root, "package.json"), "{}");
    await mkdir(join(root, "src"));
    await symlink(outside, join(root, "linked"));

    const result = await new BoundedProjectAiReadinessEvaluator().evaluate(root);

    assert.equal(result.checks.find((check) => check.id === "agentGuidance")?.outcome, "missing");
  });

  it("returns partial without a score when the entry budget is exhausted", async () => {
    const root = await fixture();
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(root, "a.txt"), "a");

    const result = await new BoundedProjectAiReadinessEvaluator({ maxEntries: 1 }).evaluate(root);

    assert.equal(result.status, "partial");
    assert.equal(result.score, null);
    assert.equal(result.checks.some((check) => check.outcome === "missing" || check.outcome === "warning"), false);
    assert.match(result.recommendations[0] ?? "", /bounded readiness scan/i);
  });

  it("rejects a repository reached through an ancestor symlink", async () => {
    const root = await fixture();
    const outside = await fixture();
    await mkdir(join(outside, "project"));
    await symlink(outside, join(root, "linked"));

    const result = await new BoundedProjectAiReadinessEvaluator().evaluate(join(root, "linked", "project"));

    assert.equal(result.status, "unavailable");
    assert.equal(result.checks.length, 0);
  });

  it("keeps incomplete manifest coverage partial instead of fabricating missing evidence", async () => {
    const root = await fixture();
    await mkdir(join(root, "src"));
    await mkdir(join(root, "packages"));
    await mkdir(join(root, "packages", "second"));
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(root, "packages", "second", "package.json"), JSON.stringify({ scripts: { test: "node --test" } }));

    const result = await new BoundedProjectAiReadinessEvaluator({ maxPackageManifests: 1 }).evaluate(root);

    assert.equal(result.status, "partial");
    assert.equal(result.score, null);
    assert.equal(result.checks.some((check) => check.id === "sitemap" || check.id === "fastFeedback"), false);
  });

  it("does not award structure, machine-readable, or fast-feedback evidence from nested or empty conventions", async () => {
    const root = await fixture();
    await mkdir(join(root, "src"));
    await mkdir(join(root, "contracts"));
    await mkdir(join(root, "packages"));
    await mkdir(join(root, "packages", "child"));
    await mkdir(join(root, "tests"));
    await writeFile(join(root, "packages", "child", "package.json"), "{}");
    await writeFile(join(root, "package-lock.json"), "{}");
    await writeFile(join(root, "contracts", "README.md"), "human notes");

    const result = await new BoundedProjectAiReadinessEvaluator().evaluate(root);

    assert.equal(result.checks.find((check) => check.id === "structure")?.outcome, "warning");
    assert.equal(result.checks.find((check) => check.id === "schemas")?.outcome, "missing");
    assert.equal(result.checks.find((check) => check.id === "fastFeedback")?.outcome, "warning");
  });

  it("opens case-preserved manifests and keeps critical missing checks out of ready", async () => {
    const root = await fixture();
    await mkdir(join(root, "src"));
    await mkdir(join(root, "schemas"));
    await mkdir(join(root, "public"));
    await writeFile(join(root, "PACKAGE.JSON"), JSON.stringify({ scripts: { test: "node --test" }, dependencies: { astro: "1", "@astrojs/sitemap": "1" } }));
    await writeFile(join(root, "package-lock.json"), "{}");
    await writeFile(join(root, "llms.txt"), "map");
    await writeFile(join(root, "schemas", "project.schema.json"), "{}");

    const result = await new BoundedProjectAiReadinessEvaluator().evaluate(root);

    assert.equal(result.checks.find((check) => check.id === "fastFeedback")?.outcome, "passed");
    assert.equal(result.score, 80);
    assert.equal(result.status, "needsWork");
  });

  it("coalesces concurrent scans of one repository", async () => {
    const root = await fixture();
    let clockReads = 0;
    const evaluator = new BoundedProjectAiReadinessEvaluator({
      now: () => {
        clockReads += 1;
        return new Date("2026-08-20T08:00:00Z");
      },
    });

    await Promise.all([evaluator.evaluate(root), evaluator.evaluate(root), evaluator.evaluate(root)]);

    assert.equal(clockReads, 1);
  });

  it("treats malformed or oversized manifests as missing executable feedback evidence", async () => {
    for (const packageJson of ["{", JSON.stringify({ scripts: { test: "node --test" } })]) {
      const root = await fixture();
      await mkdir(join(root, "src"));
      await writeFile(join(root, "package.json"), packageJson);
      const result = await new BoundedProjectAiReadinessEvaluator({ maxMetadataBytes: 4 }).evaluate(root);
      assert.equal(result.checks.find((check) => check.id === "fastFeedback")?.outcome, "missing");
      assert.equal(result.status, "needsWork");
    }
  });

  it("returns a redacted unavailable result for missing or symlink roots", async () => {
    const root = await fixture();
    const link = `${root}-link`;
    await symlink(root, link);
    const evaluator = new BoundedProjectAiReadinessEvaluator();

    for (const target of [join(root, "missing"), link]) {
      const result = await evaluator.evaluate(target);
      assert.equal(result.status, "unavailable");
      assert.equal(result.score, null);
      assert.equal(JSON.stringify(result).includes(target), false);
    }
  });
});
