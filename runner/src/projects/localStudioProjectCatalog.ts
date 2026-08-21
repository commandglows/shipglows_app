import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";

import type { CockpitProjectRecord } from "../db/index.js";
import type { HealthDimension } from "../health/index.js";
import { HttpError } from "../contracts/index.js";
import type { StudioProjectId } from "../studio/profiles.js";
import type { ProjectAccessRepository } from "./projectAccess.js";
import type { SelectedGitHubRepository } from "./githubProjectSource.js";

export const LOCAL_STUDIO_TENANT_ID = "local_studio";
export const LOCAL_STUDIO_USER_ID = "local_operator";

const dimensions = Object.freeze(["tech", "content", "seo", "performance", "security"] as const satisfies readonly HealthDimension[]);
const platformNames = Object.freeze(["astro", "flutter", "node", "python", "rust"] as const);
type ProjectReadiness = "ready" | "degraded" | "accessLost";
type ProjectSourceKind = "local" | "github";
type DeliveryBranch = "main" | "preview";

interface PersistedGitHubBinding {
  readonly installationId: number;
  readonly repositoryId: number;
  readonly defaultBranch: string;
  readonly state: "ready" | "degraded" | "accessLost";
}

export interface LocalManagedProject {
  readonly id: string;
  readonly name: string;
  readonly repositoryFullName: string;
  readonly repositoryPath?: string;
  readonly localGitHubOrigin?: string;
  readonly github?: PersistedGitHubBinding;
  readonly detectedPlatforms: readonly string[];
  readonly isDefault: boolean;
  readonly isArchived: boolean;
  readonly builtin: boolean;
  readonly studioAvailable: boolean;
  readonly deliveryBranch: DeliveryBranch;
}

export interface PublicManagedProject {
  readonly id: string;
  readonly name: string;
  readonly repositoryFullName: string;
  readonly sourceKinds: readonly ProjectSourceKind[];
  readonly readiness: ProjectReadiness;
  readonly detectedPlatforms: readonly string[];
  readonly capabilities: {
    readonly cockpit: boolean;
    readonly studio: boolean;
    readonly conversations: boolean;
    readonly workspace: boolean;
  };
  readonly isDefault: boolean;
  readonly isArchived: boolean;
  readonly builtin: boolean;
  /** Compatibility field for older Flutter clients. */
  readonly studioAvailable: boolean;
  readonly deliveryBranch: DeliveryBranch;
}

export interface LocalProjectManagement {
  list(input: { readonly tenantId: string; readonly userId: string }): readonly PublicManagedProject[];
  connect(input: { readonly tenantId: string; readonly userId: string; readonly repositoryPath: string; readonly name?: string }): PublicManagedProject;
  connectGitHub(input: { readonly tenantId: string; readonly userId: string; readonly repository: SelectedGitHubRepository }): PublicManagedProject;
  update(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string; readonly name?: string; readonly isDefault?: boolean; readonly isArchived?: boolean }): PublicManagedProject;
  disconnect(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }): void;
  disconnectGitHub(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }): PublicManagedProject | null;
  updateGitHubReadiness(input: { readonly tenantId: string; readonly userId: string; readonly installationId: number; readonly state: "ready" | "degraded" | "accessLost" }): void;
  resolveLocalRepository(input: { readonly tenantId: string; readonly userId: string; readonly projectId: string }): { readonly root: string; readonly deliveryBranch: DeliveryBranch } | null;
}

interface LocalCockpitStore {
  listCockpitProjects(input: { readonly tenantId: string; readonly userId: string }): readonly CockpitProjectRecord[];
}

function isLocalStudioActor(input: { readonly tenantId: string; readonly userId: string }): boolean {
  return input.tenantId === LOCAL_STUDIO_TENANT_ID && input.userId === LOCAL_STUDIO_USER_ID;
}

function sourceKinds(project: LocalManagedProject): readonly ProjectSourceKind[] {
  return Object.freeze([
    ...(project.repositoryPath === undefined ? [] : ["local" as const]),
    ...(project.github === undefined ? [] : ["github" as const]),
  ]);
}

function readiness(project: LocalManagedProject): ProjectReadiness {
  if (project.github?.state === "accessLost" && project.repositoryPath === undefined) return "accessLost";
  if (project.github?.state === "degraded" || project.github?.state === "accessLost") return "degraded";
  return "ready";
}

function isReadable(project: LocalManagedProject): boolean {
  return project.repositoryPath !== undefined || project.github?.state === "ready";
}

function githubIdentity(project: LocalManagedProject): string | null {
  if (project.github !== undefined) return normalizedGitHubFullName(project.repositoryFullName);
  return project.localGitHubOrigin ?? null;
}

function publicProject(project: LocalManagedProject): PublicManagedProject {
  const active = !project.isArchived;
  const readable = isReadable(project);
  return Object.freeze({
    id: project.id,
    name: project.name,
    repositoryFullName: project.repositoryFullName,
    sourceKinds: sourceKinds(project),
    readiness: readiness(project),
    detectedPlatforms: Object.freeze([...project.detectedPlatforms]),
    capabilities: Object.freeze({
      cockpit: active,
      studio: active && readable && project.studioAvailable,
      conversations: active && readable,
      workspace: false,
    }),
    isDefault: project.isDefault,
    isArchived: project.isArchived,
    builtin: project.builtin,
    studioAvailable: active && readable && project.studioAvailable,
    deliveryBranch: project.deliveryBranch,
  });
}

function projectRecord(project: LocalManagedProject): CockpitProjectRecord {
  return Object.freeze({
    id: project.id,
    name: project.name,
    repositoryFullName: project.repositoryFullName,
    accessState: readiness(project) === "accessLost" ? "unavailable" : "available",
    health: Object.freeze({
      overallStatus: "unknown",
      coverage: 0,
      dimensions: Object.freeze(dimensions.map((dimension) => Object.freeze({
        dimension,
        status: "notReported" as const,
        summary: Object.freeze({ text: "No evidence reported." }),
        producer: "none",
        evidenceCount: 0,
        sourceCommit: null,
        checkedAt: null,
        skillRunId: null,
        contextBundleId: null,
      }))),
    }),
    conversationCount: 0,
    activeRunCount: 0,
  });
}

function safeName(value: string | undefined, fallback: string): string {
  const name = (value ?? fallback).trim();
  if (name.length < 1 || name.length > 80) throw new HttpError(400, "invalidProjectName", "Project name must contain between 1 and 80 characters.");
  return name;
}

function isWithin(root: string, target: string): boolean {
  const child = relative(root, target);
  return child === "" || (!child.startsWith("..") && !isAbsolute(child));
}

function normalizedGitHubFullName(value: string): string | null {
  const trimmed = value.trim().replace(/\.git$/i, "");
  const match = /^(?:https?:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/i.exec(trimmed);
  return match?.[1]?.toLowerCase() ?? null;
}

function repositoryOrigin(repositoryPath: string): string | null {
  const configPath = resolve(repositoryPath, ".git", "config");
  if (!existsSync(configPath)) return null;
  const config = readFileSync(configPath, "utf8");
  const originSection = /\[remote\s+"origin"\]([\s\S]*?)(?=\n\s*\[|$)/i.exec(config)?.[1];
  const url = originSection === undefined ? undefined : /^\s*url\s*=\s*(.+?)\s*$/im.exec(originSection)?.[1];
  return url === undefined ? null : normalizedGitHubFullName(url);
}

function detectPlatforms(repositoryPath: string): readonly string[] {
  const detected = new Set<string>();
  if (existsSync(resolve(repositoryPath, "pubspec.yaml"))) detected.add("flutter");
  const packagePath = resolve(repositoryPath, "package.json");
  if (existsSync(packagePath)) {
    detected.add("node");
    try {
      const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as Record<string, unknown>;
      const dependencies = { ...asRecord(packageJson["dependencies"]), ...asRecord(packageJson["devDependencies"]) };
      if (Object.hasOwn(dependencies, "astro")) detected.add("astro");
    } catch {
      // A malformed package file is a project diagnostic, not a registry failure.
    }
  }
  if (existsSync(resolve(repositoryPath, "pyproject.toml")) || existsSync(resolve(repositoryPath, "requirements.txt"))) detected.add("python");
  if (existsSync(resolve(repositoryPath, "Cargo.toml"))) detected.add("rust");
  return Object.freeze(platformNames.filter((platform) => detected.has(platform)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function assertGitHubRepository(repository: SelectedGitHubRepository): void {
  if (!/^[A-Za-z0-9_-]{8,160}$/.test(repository.candidateId) || normalizedGitHubFullName(repository.fullName) === null ||
      !Number.isSafeInteger(repository.installationId) || repository.installationId < 1 ||
      !Number.isSafeInteger(repository.repositoryId) || repository.repositoryId < 1 ||
      !/^[A-Za-z0-9._/-]+$/.test(repository.defaultBranch) || repository.defaultBranch.includes("..")) {
    throw new HttpError(400, "invalidGitHubRepository", "The selected GitHub repository is invalid.");
  }
  if (repository.archived) throw new HttpError(409, "githubRepositoryArchived", "Archived GitHub repositories cannot be connected.");
}

export class LocalProjectRegistry {
  readonly #storagePath: string;
  readonly #allowedRoot: string;
  readonly #studioProjectId: StudioProjectId;
  #projects: LocalManagedProject[];

  constructor(input: {
    readonly storagePath: string;
    readonly allowedRoot: string;
    readonly studioProjectId: StudioProjectId;
    readonly builtinProjects: readonly { readonly id: StudioProjectId; readonly name: string; readonly repositoryFullName: string; readonly repositoryPath: string }[];
  }) {
    this.#storagePath = resolve(input.storagePath);
    this.#allowedRoot = realpathSync(input.allowedRoot);
    this.#studioProjectId = input.studioProjectId;
    this.#projects = this.#load(input.builtinProjects);
  }

  readonly projectAccess: ProjectAccessRepository = Object.freeze({
    hasProjectAccess: (input: Parameters<ProjectAccessRepository["hasProjectAccess"]>[0]) =>
      isLocalStudioActor(input) && input.capability === "read" && this.#projects.some((project) => project.id === input.projectId && !project.isArchived && isReadable(project)),
  });

  readonly cockpitStore: LocalCockpitStore = Object.freeze({
    listCockpitProjects: (input: Parameters<LocalCockpitStore["listCockpitProjects"]>[0]) =>
      isLocalStudioActor(input) ? Object.freeze(this.#projects.filter((project) => !project.isArchived).map(projectRecord)) : Object.freeze([]),
  });

  readonly management: LocalProjectManagement = Object.freeze({
    list: (input: Parameters<LocalProjectManagement["list"]>[0]) => isLocalStudioActor(input) ? Object.freeze(this.#projects.map(publicProject)) : Object.freeze([]),
    resolveLocalRepository: (input: Parameters<LocalProjectManagement["resolveLocalRepository"]>[0]) => {
      if (!isLocalStudioActor(input)) return null;
      const project = this.#projects.find((item) => item.id === input.projectId && !item.isArchived);
      return project?.repositoryPath === undefined ? null : { root: project.repositoryPath, deliveryBranch: project.deliveryBranch };
    },
    connect: (input: Parameters<LocalProjectManagement["connect"]>[0]) => {
      this.#assertActor(input);
      const repositoryPath = this.#validatedRepository(input.repositoryPath);
      const duplicate = this.#projects.find((project) => project.repositoryPath === repositoryPath);
      if (duplicate !== undefined) throw new HttpError(409, "projectAlreadyConnected", "This repository is already connected.");
      const folder = basename(repositoryPath);
      const origin = repositoryOrigin(repositoryPath);
      const matchingGitHub = origin === null ? undefined : this.#projects.find((project) => project.github !== undefined && githubIdentity(project) === origin);
      if (matchingGitHub !== undefined && origin !== null) {
        const updated = Object.freeze({ ...matchingGitHub, repositoryPath, localGitHubOrigin: origin, detectedPlatforms: detectPlatforms(repositoryPath) });
        this.#projects = this.#projects.map((project) => project.id === updated.id ? updated : project);
        this.#save();
        return publicProject(updated);
      }
      const project: LocalManagedProject = Object.freeze({
        id: `local_${createHash("sha256").update(repositoryPath.toLowerCase()).digest("hex").slice(0, 16)}`,
        name: safeName(input.name, folder),
        repositoryFullName: origin ?? `${basename(dirname(repositoryPath))}/${folder}`,
        repositoryPath,
        ...(origin === null ? {} : { localGitHubOrigin: origin }),
        detectedPlatforms: detectPlatforms(repositoryPath),
        isDefault: this.#projects.length === 0,
        isArchived: false,
        builtin: false,
        studioAvailable: false,
        deliveryBranch: "main",
      });
      this.#projects = [...this.#projects, project];
      this.#save();
      return publicProject(project);
    },
    connectGitHub: (input: Parameters<LocalProjectManagement["connectGitHub"]>[0]) => {
      this.#assertActor(input);
      assertGitHubRepository(input.repository);
      const normalized = normalizedGitHubFullName(input.repository.fullName);
      if (normalized === null) throw new HttpError(400, "invalidGitHubRepository", "The selected GitHub repository is invalid.");
      const existing = this.#projects.find((project) => githubIdentity(project) === normalized);
      const github = Object.freeze({
        installationId: input.repository.installationId,
        repositoryId: input.repository.repositoryId,
        defaultBranch: input.repository.defaultBranch,
        state: "ready" as const,
      });
      if (existing !== undefined) {
        const updated = Object.freeze({ ...existing, repositoryFullName: input.repository.fullName, github, isArchived: false });
        this.#projects = this.#projects.map((project) => project.id === updated.id ? updated : project);
        this.#save();
        return publicProject(updated);
      }
      const repositoryName = input.repository.fullName.split("/").at(-1) ?? input.repository.fullName;
      const project: LocalManagedProject = Object.freeze({
        id: `github_${createHash("sha256").update(String(input.repository.repositoryId)).digest("hex").slice(0, 16)}`,
        name: safeName(undefined, repositoryName),
        repositoryFullName: input.repository.fullName,
        github,
        detectedPlatforms: Object.freeze([]),
        isDefault: this.#projects.length === 0,
        isArchived: false,
        builtin: false,
        studioAvailable: false,
        deliveryBranch: "main",
      });
      this.#projects = [...this.#projects, project];
      this.#save();
      return publicProject(project);
    },
    update: (input: Parameters<LocalProjectManagement["update"]>[0]) => {
      this.#assertActor(input);
      const index = this.#projects.findIndex((project) => project.id === input.projectId);
      const current = this.#projects[index];
      if (index < 0 || current === undefined) throw new HttpError(404, "projectNotFound", "The project is not connected.");
      if (input.isArchived === true && current.isDefault) throw new HttpError(409, "defaultProjectCannotBeArchived", "Choose another default project before archiving this one.");
      const updated = Object.freeze({
        ...current,
        ...(input.name === undefined ? {} : { name: safeName(input.name, current.name) }),
        ...(input.isArchived === undefined ? {} : { isArchived: input.isArchived }),
        ...(input.isDefault === true ? { isDefault: true, isArchived: false } : {}),
      });
      this.#projects = this.#projects.map((project, projectIndex) => projectIndex === index
        ? updated
        : input.isDefault === true ? Object.freeze({ ...project, isDefault: false }) : project);
      this.#save();
      return publicProject(updated);
    },
    disconnect: (input: Parameters<LocalProjectManagement["disconnect"]>[0]) => {
      this.#assertActor(input);
      const project = this.#projects.find((item) => item.id === input.projectId);
      if (project === undefined) throw new HttpError(404, "projectNotFound", "The project is not connected.");
      if (project.builtin) throw new HttpError(409, "builtinProjectCannotBeDisconnected", "Built-in projects can be archived but not disconnected.");
      if (project.isDefault) throw new HttpError(409, "defaultProjectCannotBeDisconnected", "Choose another default project before disconnecting this one.");
      const github = project.github;
      if (github === undefined) {
        this.#projects = this.#projects.filter((item) => item.id !== input.projectId);
      } else {
        this.#projects = this.#projects.map((item) => {
          if (item.id !== input.projectId) return item;
          return Object.freeze({
            id: item.id,
            name: item.name,
            repositoryFullName: item.repositoryFullName,
            github,
            detectedPlatforms: Object.freeze([]),
            isDefault: item.isDefault,
            isArchived: item.isArchived,
            builtin: item.builtin,
            studioAvailable: item.studioAvailable,
            deliveryBranch: item.deliveryBranch,
          });
        });
      }
      this.#save();
    },
    disconnectGitHub: (input: Parameters<LocalProjectManagement["disconnectGitHub"]>[0]) => {
      this.#assertActor(input);
      const project = this.#projects.find((item) => item.id === input.projectId);
      if (project === undefined) throw new HttpError(404, "projectNotFound", "The project is not connected.");
      if (project.github === undefined) throw new HttpError(409, "githubSourceNotConnected", "This project is not connected to GitHub.");
      if (project.isDefault && project.repositoryPath === undefined) throw new HttpError(409, "defaultProjectCannotBeDisconnected", "Choose another default project before disconnecting this one.");
      if (project.repositoryPath === undefined) {
        this.#projects = this.#projects.filter((item) => item.id !== project.id);
        this.#save();
        return null;
      }
      const updated: LocalManagedProject = Object.freeze({
        id: project.id,
        name: project.name,
        repositoryFullName: project.repositoryFullName,
        repositoryPath: project.repositoryPath,
        ...(project.localGitHubOrigin === undefined ? {} : { localGitHubOrigin: project.localGitHubOrigin }),
        detectedPlatforms: project.detectedPlatforms,
        isDefault: project.isDefault,
        isArchived: project.isArchived,
        builtin: project.builtin,
        studioAvailable: project.studioAvailable,
        deliveryBranch: project.deliveryBranch,
      });
      this.#projects = this.#projects.map((item) => item.id === project.id ? updated : item);
      this.#save();
      return publicProject(updated);
    },
    updateGitHubReadiness: (input: Parameters<LocalProjectManagement["updateGitHubReadiness"]>[0]) => {
      this.#assertActor(input);
      const changed = this.#projects.some((project) =>
        project.github?.installationId === input.installationId && project.github.state !== input.state);
      if (!changed) return;
      this.#projects = this.#projects.map((project) => {
        if (project.github?.installationId !== input.installationId || project.github.state === input.state) return project;
        return Object.freeze({
          ...project,
          github: Object.freeze({ ...project.github, state: input.state }),
        });
      });
      this.#save();
    },
  });

  #assertActor(input: { readonly tenantId: string; readonly userId: string }): void {
    if (!isLocalStudioActor(input)) throw new HttpError(403, "projectManagementForbidden", "Local project management is unavailable.");
  }

  #validatedRepository(candidate: string): string {
    const trimmed = candidate.trim();
    if (!isAbsolute(trimmed) || !existsSync(trimmed)) throw new HttpError(400, "invalidRepositoryPath", "Choose an existing absolute repository path.");
    const canonical = realpathSync(trimmed);
    if (!isWithin(this.#allowedRoot, canonical)) throw new HttpError(403, "repositoryOutsideWorkspace", "The repository must be inside the configured ShipGlows workspace.");
    if (!statSync(canonical).isDirectory() || !existsSync(resolve(canonical, ".git"))) throw new HttpError(400, "notGitRepository", "The selected folder is not a Git repository.");
    return canonical;
  }

  #load(builtins: readonly { readonly id: StudioProjectId; readonly name: string; readonly repositoryFullName: string; readonly repositoryPath: string }[]): LocalManagedProject[] {
    if (existsSync(this.#storagePath)) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(this.#storagePath, "utf8"));
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("schema");
        const catalog = parsed as Record<string, unknown>;
        if ((catalog["schemaVersion"] !== 1 && catalog["schemaVersion"] !== 2 && catalog["schemaVersion"] !== 3) || !Array.isArray(catalog["projects"])) throw new Error("schema");
        const projects = catalog["projects"].map((project: unknown) => this.#validatePersistedProject(project, catalog["schemaVersion"]));
        if (new Set(projects.map((project) => project.id)).size !== projects.length) throw new Error("duplicate id");
        if (projects.length > 0 && projects.filter((project) => project.isDefault && !project.isArchived).length !== 1) throw new Error("invalid default");
        if (catalog["schemaVersion"] !== 3) {
          this.#projects = projects;
          this.#save();
        }
        return projects;
      } catch {
        throw new HttpError(500, "localProjectRegistryInvalid", "The local project registry is invalid.");
      }
    }
    const projects = builtins.map((project, index) => {
      const repositoryPath = realpathSync(project.repositoryPath);
      const localGitHubOrigin = repositoryOrigin(repositoryPath) ?? normalizedGitHubFullName(project.repositoryFullName);
      return Object.freeze({
        ...project,
        repositoryPath,
        ...(localGitHubOrigin === null ? {} : { localGitHubOrigin }),
        detectedPlatforms: detectPlatforms(repositoryPath),
        isDefault: index === 0,
        isArchived: false,
        builtin: true,
        studioAvailable: project.id === this.#studioProjectId,
        deliveryBranch: "main" as const,
      });
    });
    this.#projects = projects;
    this.#save();
    return projects;
  }

  #validatePersistedProject(project: unknown, schemaVersion: unknown): LocalManagedProject {
    if (project === null || typeof project !== "object" || Array.isArray(project)) throw new Error("project shape");
    const record = project as Record<string, unknown>;
    const id = record["id"];
    const name = record["name"];
    const repositoryFullName = record["repositoryFullName"];
    const persistedPath = record["repositoryPath"];
    const isDefault = record["isDefault"];
    const isArchived = record["isArchived"];
    const builtin = record["builtin"];
    const deliveryBranchValue = record["deliveryBranch"];
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id) ||
      typeof name !== "string" || name.trim().length < 1 || name.length > 80 ||
      typeof repositoryFullName !== "string" || normalizedGitHubFullName(repositoryFullName) === null ||
      (persistedPath !== undefined && typeof persistedPath !== "string") ||
      (schemaVersion === 1 && typeof persistedPath !== "string") ||
      typeof isDefault !== "boolean" || typeof isArchived !== "boolean" ||
      typeof builtin !== "boolean") throw new Error("project shape");
    const repositoryPath = typeof persistedPath === "string"
      ? existsSync(persistedPath) ? realpathSync(persistedPath) : resolve(persistedPath)
      : undefined;
    if (repositoryPath !== undefined && !isWithin(this.#allowedRoot, repositoryPath)) throw new Error("project boundary");
    const github = this.#validateGitHubBinding(record["github"]);
    const localGitHubOriginValue = record["localGitHubOrigin"];
    if (localGitHubOriginValue !== undefined && (typeof localGitHubOriginValue !== "string" || normalizedGitHubFullName(localGitHubOriginValue) === null)) throw new Error("local github origin");
    const localGitHubOrigin = typeof localGitHubOriginValue === "string"
      ? normalizedGitHubFullName(localGitHubOriginValue) ?? undefined
      : schemaVersion === 1 && repositoryPath !== undefined
        ? repositoryOrigin(repositoryPath) ?? (builtin ? normalizedGitHubFullName(repositoryFullName) ?? undefined : undefined)
        : undefined;
    if (repositoryPath === undefined && github === undefined) throw new Error("project source");
    const deliveryBranch: DeliveryBranch = deliveryBranchValue === undefined && (schemaVersion === 1 || schemaVersion === 2)
      ? "main"
      : deliveryBranchValue === "main" || deliveryBranchValue === "preview"
        ? deliveryBranchValue
        : (() => { throw new Error("delivery branch"); })();
    const persistedPlatforms = record["detectedPlatforms"];
    const detectedPlatforms = Array.isArray(persistedPlatforms) && persistedPlatforms.every((item) => typeof item === "string" && platformNames.includes(item as typeof platformNames[number]))
      ? Object.freeze(persistedPlatforms.map((item) => String(item)))
      : repositoryPath === undefined ? Object.freeze([]) : detectPlatforms(repositoryPath);
    return Object.freeze({
      id,
      name: name.trim(),
      repositoryFullName,
      ...(repositoryPath === undefined ? {} : { repositoryPath }),
      ...(localGitHubOrigin === undefined ? {} : { localGitHubOrigin }),
      ...(github === undefined ? {} : { github }),
      detectedPlatforms,
      isDefault,
      isArchived,
      builtin,
      studioAvailable: id === this.#studioProjectId,
      deliveryBranch,
    });
  }

  #validateGitHubBinding(value: unknown): PersistedGitHubBinding | undefined {
    if (value === undefined) return undefined;
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("github binding");
    const binding = value as Record<string, unknown>;
    const installationId = binding["installationId"];
    const repositoryId = binding["repositoryId"];
    const defaultBranch = binding["defaultBranch"];
    const state = binding["state"];
    if (!Number.isSafeInteger(installationId) || (installationId as number) < 1 ||
        !Number.isSafeInteger(repositoryId) || (repositoryId as number) < 1 ||
        typeof defaultBranch !== "string" || !/^[A-Za-z0-9._/-]+$/.test(defaultBranch) || defaultBranch.includes("..") ||
        (state !== "ready" && state !== "degraded" && state !== "accessLost")) throw new Error("github binding");
    return Object.freeze({ installationId: installationId as number, repositoryId: repositoryId as number, defaultBranch, state });
  }

  #save(): void {
    mkdirSync(dirname(this.#storagePath), { recursive: true });
    const temporaryPath = `${this.#storagePath}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify({ schemaVersion: 3, projects: this.#projects }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, this.#storagePath);
  }
}

export function createLocalStudioProjectCatalog(input: ConstructorParameters<typeof LocalProjectRegistry>[0]): LocalProjectRegistry {
  return new LocalProjectRegistry(input);
}
