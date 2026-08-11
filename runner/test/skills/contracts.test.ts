import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PROJECT_CONTEXT_SCHEMA_VERSION,
  SKILL_EVIDENCE_SCHEMA_VERSION,
  SkillEvidenceContractError,
  type SkillEvidenceEnvelope,
  validateSkillEvidenceEnvelope,
} from "../../src/skills/contracts.js";

function envelope(): SkillEvidenceEnvelope {
  return {
    context: {
      schemaVersion: PROJECT_CONTEXT_SCHEMA_VERSION,
      bundleId: "ctx_000000000001",
      tenantId: "ten_000000000001",
      projectId: "prj_000000000001",
      sourceCommit: "abc123",
      createdAt: "2026-08-11T10:00:00.000Z",
      sources: [{
        kind: "repositorySnapshot",
        reference: "repository:default-branch",
        sha256: "a".repeat(64),
      }],
      redactionCount: 0,
    },
    run: {
      schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
      skillRunId: "skr_000000000001",
      tenantId: "ten_000000000001",
      projectId: "prj_000000000001",
      skillId: "103-sg-verify",
      skillVersion: "1.0.0",
      contextBundleId: "ctx_000000000001",
      startedAt: "2026-08-11T10:01:00.000Z",
      completedAt: "2026-08-11T10:02:00.000Z",
      outcome: "completed",
    },
    evidence: [{
      schemaVersion: SKILL_EVIDENCE_SCHEMA_VERSION,
      evidenceId: "evd_000000000001",
      skillRunId: "skr_000000000001",
      contextBundleId: "ctx_000000000001",
      dimension: "tech",
      status: "healthy",
      summary: { text: "Verified checks pass." },
      sourceCommit: "abc123",
      observedAt: "2026-08-11T10:01:30.000Z",
    }],
  };
}

function firstEvidence(value: SkillEvidenceEnvelope): SkillEvidenceEnvelope["evidence"][number] {
  const item = value.evidence[0];
  assert.ok(item);
  return item;
}

function firstSource(value: SkillEvidenceEnvelope): SkillEvidenceEnvelope["context"]["sources"][number] {
  const item = value.context.sources[0];
  assert.ok(item);
  return item;
}

describe("versioned ShipGlows skill evidence contracts", () => {
  it("accepts a bounded run whose evidence is attributable to one project context", () => {
    assert.doesNotThrow(() => validateSkillEvidenceEnvelope(envelope()));
  });

  it("rejects cross-project or detached evidence provenance", () => {
    const crossProject = envelope();
    const detachedEvidence = envelope();
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...crossProject,
        run: { ...crossProject.run, projectId: "prj_other" },
      }),
      SkillEvidenceContractError,
    );
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...detachedEvidence,
        evidence: [{ ...firstEvidence(detachedEvidence), skillRunId: "skr_other" }],
      }),
      SkillEvidenceContractError,
    );
  });

  it("rejects invalid chronology, unbounded sources, and evidence from a failed run", () => {
    const invalidChronology = envelope();
    const tooManySources = envelope();
    const failedWithEvidence = envelope();
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...invalidChronology,
        run: { ...invalidChronology.run, completedAt: "2026-08-11T09:59:00.000Z" },
      }),
      SkillEvidenceContractError,
    );
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...tooManySources,
        context: { ...tooManySources.context, sources: Array(129).fill(firstSource(tooManySources)) },
      }),
      SkillEvidenceContractError,
    );
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...failedWithEvidence,
        run: { ...failedWithEvidence.run, outcome: "failed" },
      }),
      SkillEvidenceContractError,
    );
  });

  it("rejects duplicate dimensions and unknown context source kinds", () => {
    const duplicate = envelope();
    const unknownSource = envelope();
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...duplicate,
        evidence: [firstEvidence(duplicate), {
          ...firstEvidence(duplicate),
          evidenceId: "evd_000000000002",
        }],
      }),
      SkillEvidenceContractError,
    );
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...unknownSource,
        context: {
          ...unknownSource.context,
          sources: [{
            ...firstSource(unknownSource),
            kind: "clientUpload" as "repositorySnapshot",
          }],
        },
      }),
      SkillEvidenceContractError,
    );
  });

  it("rejects secret-bearing evidence before it reaches persistence or the Cockpit", () => {
    const secret = envelope();
    assert.throws(
      () => validateSkillEvidenceEnvelope({
        ...secret,
        evidence: [{ ...firstEvidence(secret), summary: { accessToken: "hidden" } }],
      }),
      /restricted secret/i,
    );
  });
});
