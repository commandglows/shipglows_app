import { createHash } from "node:crypto";

export interface PersonalCloudActorProvisioning {
  readonly tenantId: string;
  readonly userId: string;
}

export function resolvePersonalCloudActorProvisioning(input: {
  readonly subject: string;
  readonly projectTenantId: string;
  readonly projectMembers: Readonly<Record<string, Readonly<Record<string, "read" | "mutate">>>>;
}): PersonalCloudActorProvisioning {
  const digest = createHash("sha256").update(input.subject).digest("hex").slice(0, 24);
  const projectAssignments = input.projectMembers[input.subject];
  return {
    tenantId: projectAssignments === undefined ? `ten_personal_${digest}` : input.projectTenantId,
    userId: `usr_firebase_${digest}`,
  };
}

export function resolvePersonalCloudProjectCapability(input: {
  readonly subject: string;
  readonly projectId: string;
  readonly projectMembers: Readonly<Record<string, Readonly<Record<string, "read" | "mutate">>>>;
}): "read" | "mutate" | undefined {
  return input.projectMembers[input.subject]?.[input.projectId];
}

export function resolvePersonalCloudMembershipReconciliation(input: {
  readonly subject: string;
  readonly catalogProjectIds: readonly string[];
  readonly managedProjectIds?: readonly string[];
  readonly projectMembers: Readonly<Record<string, Readonly<Record<string, "read" | "mutate">>>>;
}): readonly { readonly projectId: string; readonly capability: "read" | "mutate" | undefined }[] {
  const assignments = input.projectMembers[input.subject] ?? {};
  const catalogProjectIds = new Set(input.catalogProjectIds);
  const candidateProjectIds = new Set([
    ...catalogProjectIds,
    ...Object.keys(assignments),
    ...(input.managedProjectIds ?? []),
  ]);
  return [...candidateProjectIds].map((projectId) => ({
    projectId,
    capability: catalogProjectIds.has(projectId) ? assignments[projectId] : undefined,
  }));
}
