import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  JustBashSkillProducer,
  SkillHealthService,
  SkillSandboxError,
} from "../../src/skills/sandbox.js";

function producer(): JustBashSkillProducer {
  const times = [
    new Date("2026-08-11T10:00:00.000Z"),
    new Date("2026-08-11T10:00:01.000Z"),
    new Date("2026-08-11T10:00:02.000Z"),
  ];
  let id = 0;
  return new JustBashSkillProducer({
    now: () => {
      const time = times.shift();
      if (time === undefined) throw new Error("Test clock exhausted.");
      return time;
    },
    createId: (prefix) => `${prefix}_00000000000${++id}`,
  });
}

describe("bounded just-bash skill producer", () => {
  it("produces attributable healthy evidence from an isolated in-memory snapshot", async () => {
    const envelope = await producer().runTechSnapshotAudit({
      tenantId: "ten_000000000001",
      projectId: "prj_000000000001",
      sourceCommit: "abc123",
      snapshot: {
        files: {
          "package.json": "{\"name\":\"safe-project\"}",
          "src/index.ts": "export const answer = 42;",
        },
        redactionCount: 1,
      },
    });

    const evidence = envelope.evidence[0];
    assert.ok(evidence);
    assert.equal(evidence.status, "healthy");
    assert.equal(evidence.skillRunId, envelope.run.skillRunId);
    assert.equal(evidence.contextBundleId, envelope.context.bundleId);
    assert.equal(envelope.context.sources.length, 2);
    assert.ok(envelope.context.sources.every((source) => /^[a-f0-9]{64}$/.test(source.sha256)));
  });

  it("reports a deterministic warning without exposing matching source content", async () => {
    const envelope = await producer().runTechSnapshotAudit({
      tenantId: "ten_000000000001",
      projectId: "prj_000000000001",
      sourceCommit: "def456",
      snapshot: {
        files: { "src/unsafe.ts": "globalThis.eval('2 + 2');" },
        redactionCount: 0,
      },
    });

    const evidence = envelope.evidence[0];
    assert.ok(evidence);
    assert.equal(evidence.status, "warning");
    assert.deepEqual(evidence.summary, {
      text: "Dynamic eval usage found.",
      issueCount: 1,
    });
    assert.doesNotMatch(JSON.stringify(envelope.evidence), /globalThis/);
  });

  it("persists exactly the validated envelope produced by the bounded skill", async () => {
    let persisted: unknown;
    const service = new SkillHealthService(producer(), {
      persistSkillEvidenceEnvelope: (envelope) => {
        persisted = envelope;
      },
    });
    const envelope = await service.runTechSnapshotAudit({
      tenantId: "ten_000000000001",
      projectId: "prj_000000000001",
      sourceCommit: "abc123",
      snapshot: { files: { "src/index.ts": "export const answer = 42;" }, redactionCount: 0 },
    });

    assert.equal(persisted, envelope);
  });

  it("rejects traversal, empty snapshots, and oversized snapshots before execution", async () => {
    await assert.rejects(
      producer().runTechSnapshotAudit({
        tenantId: "ten_000000000001",
        projectId: "prj_000000000001",
        sourceCommit: "abc123",
        snapshot: { files: { "../secret.txt": "hidden" }, redactionCount: 0 },
      }),
      SkillSandboxError,
    );
    await assert.rejects(
      producer().runTechSnapshotAudit({
        tenantId: "ten_000000000001",
        projectId: "prj_000000000001",
        sourceCommit: "abc123",
        snapshot: { files: {}, redactionCount: 0 },
      }),
      SkillSandboxError,
    );
    await assert.rejects(
      producer().runTechSnapshotAudit({
        tenantId: "ten_000000000001",
        projectId: "prj_000000000001",
        sourceCommit: "abc123",
        snapshot: { files: { "large.txt": "x".repeat(512 * 1024 + 1) }, redactionCount: 0 },
      }),
      SkillSandboxError,
    );
  });
});
