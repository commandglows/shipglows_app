import { readFile } from "node:fs/promises";
import { isAbsolute, normalize, resolve } from "node:path";

export const CLI_PROJECT_CATALOG_VERSION = "shipglows.cli-project-catalog.v1";

const DEFAULT_MAX_BYTES = 1_048_576;
const DEFAULT_MAX_ENTRIES = 256;
const ID_PATTERN = /^prj_[a-f0-9]{32}$/;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_PREVIEW_SLUGS = new Set(["app", "api", "runner", "www"]);
const TMUX_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

export type CloudProjectRuntimeStatus = "online" | "launching" | "stopped" | "unavailable";

export interface CloudProjectCatalogEntry {
  readonly projectId: string;
  readonly displayName: string;
  readonly previewSlug: string;
  readonly status: CloudProjectRuntimeStatus;
  readonly deliveryBranch: "main" | "preview";
  readonly capabilities: {
    readonly preview: boolean;
    readonly workspace: boolean;
  };
  readonly privateRuntime: {
    readonly cwd: string;
    readonly port?: number;
    readonly tmuxSession?: string;
  };
}

export interface CloudProjectCatalogSnapshot {
  readonly version: typeof CLI_PROJECT_CATALOG_VERSION;
  readonly generatedAt: string;
  readonly entries: readonly CloudProjectCatalogEntry[];
}

export interface RedactedCloudProject {
  readonly projectId: string;
  readonly displayName: string;
  readonly previewSlug: string;
  readonly status: CloudProjectRuntimeStatus;
  readonly capabilities: CloudProjectCatalogEntry["capabilities"];
}

export interface CloudProjectCatalogReader {
  read(): Promise<CloudProjectCatalogSnapshot>;
}

export class CloudProjectCatalogError extends Error {
  constructor(readonly code: "catalogUnavailable" | "catalogInvalid" | "catalogStale") {
    super(code === "catalogStale" ? "The project catalog is stale." : "The project catalog is unavailable.");
  }
}

export class FileCloudProjectCatalogReader implements CloudProjectCatalogReader {
  private cachedRaw: string | undefined;
  private cachedSnapshot: CloudProjectCatalogSnapshot | undefined;

  constructor(
    private readonly catalogPath: string,
    private readonly allowedRoots: readonly string[],
    private readonly now: () => number = Date.now,
    private readonly maxAgeMs = 120_000,
    private readonly maxBytes = DEFAULT_MAX_BYTES,
    private readonly load: (path: string) => Promise<string> = async (path) => readFile(path, "utf8"),
  ) {
    // The catalog is server-configured state and intentionally lives outside
    // project roots. Project cwd values remain constrained by allowedRoots
    // when the snapshot is parsed.
    if (!isAbsolute(catalogPath)) {
      throw new CloudProjectCatalogError("catalogInvalid");
    }
  }

  async read(): Promise<CloudProjectCatalogSnapshot> {
    let raw: string;
    try {
      raw = await this.load(this.catalogPath);
    } catch {
      throw new CloudProjectCatalogError("catalogUnavailable");
    }
    if (Buffer.byteLength(raw, "utf8") > this.maxBytes) throw new CloudProjectCatalogError("catalogInvalid");
    const snapshot = raw === this.cachedRaw && this.cachedSnapshot !== undefined
      ? this.cachedSnapshot
      : parseCloudProjectCatalog(raw, this.allowedRoots);
    const generatedAt = Date.parse(snapshot.generatedAt);
    if (generatedAt > this.now() + 30_000 || this.now() - generatedAt > this.maxAgeMs) {
      throw new CloudProjectCatalogError("catalogStale");
    }
    this.cachedRaw = raw;
    this.cachedSnapshot = snapshot;
    return snapshot;
  }
}

export function parseCloudProjectCatalog(
  raw: string,
  allowedRoots: readonly string[],
  maxEntries = DEFAULT_MAX_ENTRIES,
): CloudProjectCatalogSnapshot {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new CloudProjectCatalogError("catalogInvalid");
  }
  if (!isRecord(value) || !hasOnlyKeys(value, ["schemaVersion", "generatedAt", "projects"])) invalid();
  if (value["schemaVersion"] !== CLI_PROJECT_CATALOG_VERSION || typeof value["generatedAt"] !== "string") invalid();
  if (!Array.isArray(value["projects"]) || value["projects"].length > maxEntries) invalid();
  if (!Number.isFinite(Date.parse(value["generatedAt"]))) invalid();

  const projectIds = new Set<string>();
  const slugs = new Set<string>();
  const entries = value["projects"].map((entry): CloudProjectCatalogEntry => {
    const parsed = parseEntry(entry, allowedRoots);
    if (projectIds.has(parsed.projectId) || slugs.has(parsed.previewSlug)) invalid();
    projectIds.add(parsed.projectId);
    slugs.add(parsed.previewSlug);
    return parsed;
  });
  return { version: CLI_PROJECT_CATALOG_VERSION, generatedAt: value["generatedAt"], entries };
}

export function redactCloudProject(entry: CloudProjectCatalogEntry): RedactedCloudProject {
  return {
    projectId: entry.projectId,
    displayName: entry.displayName,
    previewSlug: entry.previewSlug,
    status: entry.status,
    capabilities: { ...entry.capabilities },
  };
}

export function findCloudProjectByHost(
  snapshot: CloudProjectCatalogSnapshot,
  host: string,
  previewSuffix: string,
): CloudProjectCatalogEntry | null {
  const normalizedHost = host.toLowerCase();
  const suffix = previewSuffix.toLowerCase();
  if (!normalizedHost.endsWith(`.${suffix}`)) return null;
  const slug = normalizedHost.slice(0, -(suffix.length + 1));
  return snapshot.entries.find((entry) => entry.previewSlug === slug) ?? null;
}

function parseEntry(value: unknown, allowedRoots: readonly string[]): CloudProjectCatalogEntry {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "displayName", "previewSlug", "status", "source", "cwd", "port", "tmuxSession", "deliveryBranch"], ["port", "tmuxSession", "deliveryBranch"])) invalid();
  const projectId = value["id"];
  const displayName = value["displayName"];
  const previewSlug = value["previewSlug"];
  const rawStatus = value["status"];
  const source = value["source"];
  const cwd = value["cwd"];
  const port = value["port"];
  const tmuxSession = value["tmuxSession"];
  const deliveryBranch = value["deliveryBranch"] ?? "main";
  if (typeof projectId !== "string" || !ID_PATTERN.test(projectId)) invalid();
  if (!isCliText(displayName, 255)) invalid();
  if (typeof previewSlug !== "string" || !SLUG_PATTERN.test(previewSlug) || RESERVED_PREVIEW_SLUGS.has(previewSlug)) invalid();
  if (!isCliRuntimeStatus(rawStatus) || !isCliSource(source)) invalid();
  if (!isCliText(cwd, 4_096) || !isAbsolute(cwd) || !isContained(cwd, allowedRoots)) invalid();
  if (port !== null && (!Number.isInteger(port) || (port as number) < 1 || (port as number) > 65_535)) invalid();
  if (tmuxSession !== null && !isCliText(tmuxSession, 255)) invalid();
  if (deliveryBranch !== "main" && deliveryBranch !== "preview") invalid();
  const live = rawStatus === "online" || rawStatus === "launching";
  const validTmuxSession = typeof tmuxSession === "string" && TMUX_PATTERN.test(tmuxSession) ? tmuxSession : undefined;
  const status: CloudProjectRuntimeStatus = rawStatus === "errored" || rawStatus === "unknown" ? "unavailable" : rawStatus;
  return {
    projectId,
    displayName,
    previewSlug,
    status,
    deliveryBranch,
    capabilities: { preview: live && typeof port === "number", workspace: validTmuxSession !== undefined },
    privateRuntime: {
      cwd: resolve(cwd),
      ...(typeof port === "number" ? { port } : {}),
      ...(validTmuxSession !== undefined ? { tmuxSession: validTmuxSession } : {}),
    },
  };
}

function isContained(path: string, roots: readonly string[]): boolean {
  const candidate = normalize(resolve(path));
  return roots.some((root) => {
    const normalizedRoot = normalize(resolve(root));
    return candidate === normalizedRoot || candidate.startsWith(`${normalizedRoot}${process.platform === "win32" ? "\\" : "/"}`);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[], optional: readonly string[] = ["port", "tmuxSession"]): boolean {
  const allowed = new Set(keys);
  const optionalKeys = new Set(optional);
  return Object.keys(value).every((key) => allowed.has(key)) && keys.filter((key) => !optionalKeys.has(key)).every((key) => key in value);
}

function isCliRuntimeStatus(value: unknown): value is "online" | "launching" | "stopped" | "errored" | "unknown" {
  return value === "online" || value === "launching" || value === "stopped" || value === "errored" || value === "unknown";
}

function isCliSource(value: unknown): value is "pm2" | "flutter-web" | "pm2+flutter-web" {
  return value === "pm2" || value === "flutter-web" || value === "pm2+flutter-web";
}

function isCliText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength && !/[\u0000-\u001f|]/.test(value);
}

function invalid(): never {
  throw new CloudProjectCatalogError("catalogInvalid");
}
