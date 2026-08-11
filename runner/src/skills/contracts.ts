import { assertSecretSafe, type SafePayload } from "../contracts/index.js";
import {
  HEALTH_DIMENSIONS,
  type EvidenceHealthStatus,
  type HealthDimension,
} from "../health/index.js";

export const SKILL_EVIDENCE_SCHEMA_VERSION = "shipglows.skill-evidence.v1" as const;
export const PROJECT_CONTEXT_SCHEMA_VERSION = "shipglows.project-context.v1" as const;

export type ProjectContextSourceKind = "repositorySnapshot" | "shipglowsArtifact";

export interface ProjectContextSource {
  readonly kind: ProjectContextSourceKind;
  readonly reference: string;
  readonly sha256: string;
}

export interface ProjectContextBundle {
  readonly schemaVersion: typeof PROJECT_CONTEXT_SCHEMA_VERSION;
  readonly bundleId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly sourceCommit: string;
  readonly createdAt: string;
  readonly sources: readonly ProjectContextSource[];
  readonly redactionCount: number;
}

export interface VersionedSkillRun {
  readonly schemaVersion: typeof SKILL_EVIDENCE_SCHEMA_VERSION;
  readonly skillRunId: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly skillId: string;
  readonly skillVersion: string;
  readonly contextBundleId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly outcome: "completed" | "failed";
}

export interface VersionedSkillEvidence {
  readonly schemaVersion: typeof SKILL_EVIDENCE_SCHEMA_VERSION;
  readonly evidenceId: string;
  readonly skillRunId: string;
  readonly contextBundleId: string;
  readonly dimension: HealthDimension;
  readonly status: EvidenceHealthStatus;
  readonly summary: SafePayload;
  readonly sourceCommit: string;
  readonly observedAt: string;
}

export interface SkillEvidenceEnvelope {
  readonly context: ProjectContextBundle;
  readonly run: VersionedSkillRun;
  readonly evidence: readonly VersionedSkillEvidence[];
}

export class SkillEvidenceContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillEvidenceContractError";
  }
}

const opaquePattern = /^[A-Za-z0-9._:-]{1,128}$/;
const versionPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const sourceCommitPattern = /^[A-Za-z0-9._/-]{1,200}$/;
const sourceReferencePattern = /^[A-Za-z0-9._:/-]{1,240}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new SkillEvidenceContractError(`${label} is invalid.`);
  return parsed;
}

function opaque(value: string, label: string): void {
  if (!opaquePattern.test(value)) throw new SkillEvidenceContractError(`${label} is invalid.`);
}

function supportedVersion(value: string, expected: string, label: string): void {
  if (value !== expected) throw new SkillEvidenceContractError(`${label} schema version is unsupported.`);
}

export function validateSkillEvidenceEnvelope(envelope: SkillEvidenceEnvelope): void {
  const { context, run, evidence } = envelope;
  supportedVersion(context.schemaVersion, PROJECT_CONTEXT_SCHEMA_VERSION, "Project context");
  supportedVersion(run.schemaVersion, SKILL_EVIDENCE_SCHEMA_VERSION, "Skill run");
  for (const [value, label] of [
    [context.bundleId, "Context bundle identifier"],
    [context.tenantId, "Tenant identifier"],
    [context.projectId, "Project identifier"],
    [run.skillRunId, "Skill run identifier"],
    [run.tenantId, "Skill run tenant identifier"],
    [run.projectId, "Skill run project identifier"],
    [run.contextBundleId, "Skill run context identifier"],
    [run.skillId, "Skill identifier"],
  ] as const) opaque(value, label);
  if (!versionPattern.test(run.skillVersion)) {
    throw new SkillEvidenceContractError("Skill version is invalid.");
  }
  if (!sourceCommitPattern.test(context.sourceCommit)) {
    throw new SkillEvidenceContractError("Context source commit is invalid.");
  }
  if (!Number.isSafeInteger(context.redactionCount) || context.redactionCount < 0) {
    throw new SkillEvidenceContractError("Context redaction count is invalid.");
  }
  if (context.sources.length > 128) {
    throw new SkillEvidenceContractError("Project context contains too many sources.");
  }
  for (const source of context.sources) {
    if (!["repositorySnapshot", "shipglowsArtifact"].includes(source.kind) ||
        !sourceReferencePattern.test(source.reference) || !sha256Pattern.test(source.sha256)) {
      throw new SkillEvidenceContractError("Project context source is invalid.");
    }
  }
  assertSecretSafe(context.sources);
  const contextCreatedAt = timestamp(context.createdAt, "Context creation time");
  const startedAt = timestamp(run.startedAt, "Skill run start time");
  const completedAt = timestamp(run.completedAt, "Skill run completion time");
  if (completedAt < startedAt || startedAt < contextCreatedAt) {
    throw new SkillEvidenceContractError("Skill run chronology is invalid.");
  }
  if (run.tenantId !== context.tenantId || run.projectId !== context.projectId ||
      run.contextBundleId !== context.bundleId) {
    throw new SkillEvidenceContractError("Skill run context provenance does not match.");
  }
  if (run.outcome === "failed" && evidence.length > 0) {
    throw new SkillEvidenceContractError("A failed skill run cannot publish health evidence.");
  }
  if (evidence.length > HEALTH_DIMENSIONS.length ||
      new Set(evidence.map((item) => item.dimension)).size !== evidence.length) {
    throw new SkillEvidenceContractError("A skill run may publish at most one result per health dimension.");
  }
  for (const item of evidence) {
    supportedVersion(item.schemaVersion, SKILL_EVIDENCE_SCHEMA_VERSION, "Skill evidence");
    opaque(item.evidenceId, "Evidence identifier");
    if (item.skillRunId !== run.skillRunId || item.contextBundleId !== context.bundleId) {
      throw new SkillEvidenceContractError("Health evidence provenance does not match.");
    }
    if (!HEALTH_DIMENSIONS.includes(item.dimension) ||
        !["healthy", "warning", "critical", "unknown"].includes(item.status)) {
      throw new SkillEvidenceContractError("Health evidence classification is invalid.");
    }
    if (item.sourceCommit !== context.sourceCommit) {
      throw new SkillEvidenceContractError("Health evidence source commit does not match its context.");
    }
    const observedAt = timestamp(item.observedAt, "Health evidence observation time");
    if (observedAt < startedAt || observedAt > completedAt) {
      throw new SkillEvidenceContractError("Health evidence chronology is invalid.");
    }
    assertSecretSafe(item.summary);
  }
}
