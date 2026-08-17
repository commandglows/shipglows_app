import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  LocalProjectContextGenerator,
  ProjectContextGenerationError,
} from "../src/projectContextGenerator.js";
import { openOperationalStore } from "../src/db/index.js";
import type { ProjectContextBundle, SkillEvidenceEnvelope } from "../src/skills/contracts.js";

const actor = { tenantId: "ten_context_000001", userId: "usr_context_000001", projectId: "prj_context_000001" };

describe("local project context generator", () => {
  it("indexes only bounded allowlisted files and coalesces concurrent refreshes", async () => {
    const fixture = repository();
    try {
      const packageBefore = snapshot(join(fixture.root, "package.json"));
      const artifactBefore = snapshot(join(fixture.root, "shipglows_data", "technical", "architecture.md"));
      let latest: ProjectContextBundle | undefined;
      let persisted = 0;
      const generator = new LocalProjectContextGenerator(
        { resolveLocalRepository: (input) => input.projectId === actor.projectId ? fixture.root : null },
        {
          getLatestProjectContextBundle: () => latest,
          ensureLocalProjectContextTarget: () => undefined,
          persistSkillEvidenceEnvelope: (envelope: SkillEvidenceEnvelope) => {
            persisted += 1;
            latest = envelope.context;
          },
        },
      );

      const [first, second] = await Promise.all([generator.refresh(actor), generator.refresh(actor)]);
      const repeated = await generator.refresh(actor);

      assert.equal(first.bundleId, second.bundleId);
      assert.equal(repeated.bundleId, first.bundleId);
      assert.equal(persisted, 1);
      assert.match(first.sourceCommit, /^[a-f0-9]{40}$/);
      assert.deepEqual(first.sources.map((source) => source.kind), ["repositorySnapshot", "shipglowsArtifact"]);
      assert.equal(first.sources.some((source) => source.reference.includes("architecture.md")), false);
      assert.equal(first.sources.every((source) => /^[a-zA-Z]+:[a-f0-9]{24}$/.test(source.reference)), true);
      assert.deepEqual(snapshot(join(fixture.root, "package.json")), packageBefore);
      assert.deepEqual(snapshot(join(fixture.root, "shipglows_data", "technical", "architecture.md")), artifactBefore);
    } finally {
      rmSync(fixture.parent, { recursive: true, force: true });
    }
  });

  it("fails closed on symlinks and oversized sources", async () => {
    const linked = repository();
    try {
      const outside = join(linked.parent, "outside.md");
      writeFileSync(outside, "outside", "utf8");
      symlinkSync(outside, join(linked.root, "README.md"), "file");
      const generator = generatorFor(linked.root);
      await assert.rejects(generator.refresh(actor), (error: unknown) =>
        error instanceof ProjectContextGenerationError && error.code === "contextBoundaryViolation");
    } finally {
      rmSync(linked.parent, { recursive: true, force: true });
    }

    const oversized = repository();
    try {
      writeFileSync(join(oversized.root, "README.md"), Buffer.alloc(256 * 1024 + 1, 1));
      await assert.rejects(generatorFor(oversized.root).refresh(actor), (error: unknown) =>
        error instanceof ProjectContextGenerationError && error.code === "contextLimitExceeded");
    } finally {
      rmSync(oversized.parent, { recursive: true, force: true });
    }
  });

  it("provisions only the authorized local projection target before atomic persistence", async () => {
    const fixture = repository();
    const store = await openOperationalStore(join(fixture.parent, "runner.sqlite"));
    try {
      const generator = new LocalProjectContextGenerator(
        { resolveLocalRepository: (input) => input.projectId === actor.projectId ? fixture.root : null },
        store,
      );

      const bundle = await generator.refresh(actor);

      assert.equal(
        store.getLatestProjectContextBundle({ tenantId: actor.tenantId, projectId: actor.projectId })?.bundleId,
        bundle.bundleId,
      );
      assert.equal(
        store.getLatestProjectContextBundle({ tenantId: "ten_other_000001", projectId: actor.projectId }),
        undefined,
      );
    } finally {
      store.close();
      rmSync(fixture.parent, { recursive: true, force: true });
    }
  });
});

function generatorFor(root: string): LocalProjectContextGenerator {
  return new LocalProjectContextGenerator(
    { resolveLocalRepository: () => root },
    {
      getLatestProjectContextBundle: () => undefined,
      ensureLocalProjectContextTarget: () => undefined,
      persistSkillEvidenceEnvelope: () => undefined,
    },
  );
}

function repository(): { parent: string; root: string } {
  const parent = mkdtempSync(join(tmpdir(), "shipglows-context-"));
  const root = join(parent, "repository");
  mkdirSync(join(root, "shipglows_data", "technical"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{\"name\":\"fixture\"}\n", "utf8");
  writeFileSync(join(root, "ignored.txt"), "not indexed\n", "utf8");
  writeFileSync(join(root, "shipglows_data", "technical", "architecture.md"), "# Architecture\n", "utf8");
  execFileSync("git", ["init", "--quiet"], { cwd: root, windowsHide: true });
  execFileSync("git", ["config", "user.email", "context@example.invalid"], { cwd: root, windowsHide: true });
  execFileSync("git", ["config", "user.name", "Context Test"], { cwd: root, windowsHide: true });
  execFileSync("git", ["add", "."], { cwd: root, windowsHide: true });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root, windowsHide: true });
  return { parent, root };
}

function snapshot(path: string): { content: string; size: number; modified: number } {
  const stat = statSync(path);
  return { content: readFileSync(path, "utf8"), size: stat.size, modified: stat.mtimeMs };
}
