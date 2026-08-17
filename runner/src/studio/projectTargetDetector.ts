import { createHash } from "node:crypto";
import { constants as fileConstants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const COMPILATION_ROUTING_CONTRACT_VERSION = "shipglows.compilation-routing.v1" as const;

export const COMPILATION_TARGETS = Object.freeze([
  "astroWeb", "flutterWeb", "flutterAndroid", "flutterWindows", "flutterIos",
] as const);

export type CompilationTarget = (typeof COMPILATION_TARGETS)[number];
export type ProjectKind = "astro" | "flutter";

export interface ProjectCapabilityDetection {
  readonly contractVersion: typeof COMPILATION_ROUTING_CONTRACT_VERSION;
  readonly projectId: string;
  readonly projectKind: ProjectKind;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly declaredTargets: readonly CompilationTarget[];
  /** Detector output always supplies this; optional only for fail-closed migration of older callers. */
  readonly artifactDigests?: readonly { readonly path: string; readonly digest: string }[];
  readonly evidenceDigest: string;
  readonly observedAt: string;
  readonly expiresAt: string;
}

export type ProjectCapabilityDetectionResult =
  | { readonly detected: true; readonly capability: ProjectCapabilityDetection }
  | { readonly detected: false; readonly reason: "unknownProject" | "ambiguousProject" | "unsafeRepositoryRoot" | "invalidIdentity" | "unstableEvidence" };

export interface ProjectTargetDetectorInput {
  readonly repositoryRoot: string;
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly repositoryDigest: string;
  readonly observedAt: string;
  readonly expiresAt: string;
}

export interface ProjectTargetDetectorIo {
  readSnapshot(path: string, maximumBytes: number): Promise<{ readonly bytes: Uint8Array; readonly stable: boolean } | undefined>;
}

export type ProjectCapabilityEvidenceInput = Pick<ProjectCapabilityDetection,
  "projectId" | "projectKind" | "sourceRevision" | "repositoryDigest" | "declaredTargets" | "artifactDigests" | "observedAt" | "expiresAt">;

/** Single canonical digest shared by detection, routing validation, and cross-language fixtures. */
export function projectCapabilityEvidenceDigest(value: ProjectCapabilityEvidenceInput): string {
  return sha256(JSON.stringify([
    COMPILATION_ROUTING_CONTRACT_VERSION, value.projectId, value.projectKind, value.sourceRevision,
    value.repositoryDigest, value.declaredTargets, value.artifactDigests, value.observedAt, value.expiresAt,
  ]));
}

const MAX_MANIFEST_BYTES = 64 * 1024;
const opaque = /^[A-Za-z0-9._:-]{1,128}$/;
const revision = /^[a-f0-9]{7,64}$/i;
const digest = /^[a-f0-9]{64}$/i;

/** Reads bounded, canonical server-owned project evidence. It never executes a manifest or command. */
export async function detectProjectTargets(input: ProjectTargetDetectorInput, io: ProjectTargetDetectorIo = defaultIo): Promise<ProjectCapabilityDetectionResult> {
  if (!validIdentity(input)) return frozenFailure("invalidIdentity");
  const root = await canonicalRoot(input.repositoryRoot);
  if (root === undefined) return frozenFailure("unsafeRepositoryRoot");

  const astro = await detectAstro(root, io);
  const flutter = await detectFlutter(root, io);
  if (astro.unstable || flutter.unstable) return frozenFailure("unstableEvidence");
  if (astro.detected && flutter.targets !== undefined) return frozenFailure("ambiguousProject");
  if (!astro.detected && flutter.targets === undefined) return frozenFailure("unknownProject");

  const projectKind: ProjectKind = astro.detected ? "astro" : "flutter";
  const declaredTargets: readonly CompilationTarget[] = astro.detected ? ["astroWeb"] : flutter.targets ?? [];
  const artifacts = astro.detected ? astro.artifacts : flutter.artifacts;
  const artifactDigests = artifacts.map((artifact) => Object.freeze({ path: artifact.path, digest: sha256Bytes(artifact.bytes) })).sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const evidenceDigest = projectCapabilityEvidenceDigest({ projectId: input.projectId, projectKind, sourceRevision: input.sourceRevision,
    repositoryDigest: input.repositoryDigest, declaredTargets, artifactDigests, observedAt: input.observedAt, expiresAt: input.expiresAt });
  return Object.freeze({
    detected: true as const,
    capability: Object.freeze({
      contractVersion: COMPILATION_ROUTING_CONTRACT_VERSION,
      projectId: input.projectId,
      projectKind,
      sourceRevision: input.sourceRevision,
      repositoryDigest: input.repositoryDigest,
      declaredTargets: Object.freeze([...declaredTargets]),
      artifactDigests: Object.freeze(artifactDigests),
      evidenceDigest,
      observedAt: input.observedAt,
      expiresAt: input.expiresAt,
    }),
  });
}

function validIdentity(input: ProjectTargetDetectorInput): boolean {
  if (!opaque.test(input.projectId) || !revision.test(input.sourceRevision) || !digest.test(input.repositoryDigest)) return false;
  const observed = Date.parse(input.observedAt);
  const expires = Date.parse(input.expiresAt);
  return Number.isFinite(observed) && Number.isFinite(expires) && expires > observed && expires - observed <= 15 * 60 * 1000;
}

async function canonicalRoot(candidate: string): Promise<string | undefined> {
  if (!isAbsolute(candidate)) return undefined;
  try {
    const resolved = resolve(candidate);
    const canonical = await realpath(resolved);
    const metadata = await lstat(resolved);
    return metadata.isDirectory() && !metadata.isSymbolicLink() && samePath(resolved, canonical) ? canonical : undefined;
  } catch { return undefined; }
}

interface Artifact { readonly path: string; readonly bytes: Uint8Array; }
interface Detection<T> { readonly detected?: boolean; readonly targets?: T; readonly artifacts: readonly Artifact[]; readonly unstable: boolean; }

async function detectAstro(root: string, io: ProjectTargetDetectorIo): Promise<Detection<never>> {
  const manifest = await boundedRegularFile(root, "site/package.json", io);
  const lock = await boundedRegularFile(root, "site/pnpm-lock.yaml", io);
  if (manifest?.unstable || lock?.unstable) return { detected: false, artifacts: [], unstable: true };
  if (manifest === undefined || lock === undefined) return { detected: false, artifacts: [], unstable: false };
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(manifest.bytes));
    if (!isRecord(value)) return { detected: false, artifacts: [], unstable: false };
    const packageManager = value["packageManager"];
    const dependencies = value["dependencies"];
    const devDependencies = value["devDependencies"];
    const detected = typeof packageManager === "string" && /^pnpm@[0-9]+(?:\.[0-9]+){1,2}$/.test(packageManager) && (hasVersion(dependencies, "astro") || hasVersion(devDependencies, "astro"));
    return { detected, artifacts: detected ? [{ path: "site/package.json", bytes: manifest.bytes }, { path: "site/pnpm-lock.yaml", bytes: lock.bytes }] : [], unstable: false };
  } catch { return { detected: false, artifacts: [], unstable: false }; }
}

async function detectFlutter(root: string, io: ProjectTargetDetectorIo): Promise<Detection<readonly CompilationTarget[]>> {
  const manifest = await boundedRegularFile(root, "app/pubspec.yaml", io);
  const lock = await boundedRegularFile(root, "app/pubspec.lock", io);
  if (manifest?.unstable || lock?.unstable) return { artifacts: [], unstable: true };
  if (manifest === undefined || lock === undefined || !declaresFlutterSdk(new TextDecoder().decode(manifest.bytes))) return { artifacts: [], unstable: false };
  const targets: CompilationTarget[] = [];
  const artifacts: Artifact[] = [{ path: "app/pubspec.yaml", bytes: manifest.bytes }, { path: "app/pubspec.lock", bytes: lock.bytes }];
  const markers = [["flutterWeb", "app/web/index.html"], ["flutterAndroid", await firstSafeMarker(root, ["app/android/settings.gradle", "app/android/settings.gradle.kts"])], ["flutterWindows", "app/windows/CMakeLists.txt"], ["flutterIos", "app/ios/Runner.xcodeproj/project.pbxproj"]] as const;
  for (const [target, marker] of markers) {
    if (marker === undefined) continue;
    const snapshot = await boundedRegularFile(root, marker, io);
    if (snapshot?.unstable) return { artifacts: [], unstable: true };
    if (snapshot !== undefined) { targets.push(target); artifacts.push({ path: marker, bytes: snapshot.bytes }); }
  }
  return { targets, artifacts, unstable: false };
}

function declaresFlutterSdk(text: string): boolean {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  let dependenciesIndent: number | undefined;
  let flutterIndent: number | undefined;
  for (const raw of lines) {
    if (/^\s*(?:#.*)?$/.test(raw)) continue;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trim();
    if (indent === 0) { dependenciesIndent = line === "dependencies:" ? 0 : undefined; flutterIndent = undefined; continue; }
    if (dependenciesIndent === 0 && indent > 0 && line === "flutter:") { flutterIndent = indent; continue; }
    if (flutterIndent !== undefined && indent > flutterIndent && line === "sdk: flutter") return true;
    if (flutterIndent !== undefined && indent <= flutterIndent) flutterIndent = undefined;
  }
  return false;
}

async function firstSafeMarker(root: string, markers: readonly string[]): Promise<string | undefined> {
  for (const marker of markers) if (await safeEntry(root, marker, "file")) return marker;
  return undefined;
}

async function boundedRegularFile(root: string, relativePath: string, io: ProjectTargetDetectorIo): Promise<{ readonly bytes: Uint8Array; readonly unstable: boolean } | undefined> {
  const path = await safePath(root, relativePath, "file");
  if (path === undefined) return undefined;
  try {
    const metadata = await lstat(path);
    if (metadata.size > MAX_MANIFEST_BYTES) return undefined;
    const snapshot = await io.readSnapshot(path, MAX_MANIFEST_BYTES);
    return snapshot === undefined ? undefined : { bytes: new Uint8Array(snapshot.bytes), unstable: !snapshot.stable };
  } catch { return undefined; }
}

async function safeEntry(root: string, relativePath: string, kind: "file" | "directory"): Promise<boolean> {
  return (await safePath(root, relativePath, kind)) !== undefined;
}

async function safePath(root: string, relativePath: string, kind: "file" | "directory"): Promise<string | undefined> {
  if (relativePath === "" || isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes("..")) return undefined;
  const candidate = resolve(root, relativePath);
  if (!within(root, candidate)) return undefined;
  try {
    const metadata = await lstat(candidate);
    if (metadata.isSymbolicLink() || (kind === "file" ? !metadata.isFile() : !metadata.isDirectory())) return undefined;
    const canonical = await realpath(candidate);
    return within(root, canonical) && samePath(candidate, canonical) ? canonical : undefined;
  } catch { return undefined; }
}

function within(root: string, candidate: string): boolean {
  const result = relative(root, candidate);
  return result === "" || (!result.startsWith(`..${sep}`) && result !== ".." && !isAbsolute(result));
}

function samePath(left: string, right: string): boolean {
  return process.platform === "win32" ? left.toLowerCase() === right.toLowerCase() : left === right;
}

function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function hasVersion(value: unknown, name: string): boolean { return isRecord(value) && typeof value[name] === "string" && value[name].length <= 128; }
function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function sha256Bytes(value: Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
function frozenFailure(reason: Extract<ProjectCapabilityDetectionResult, { detected: false }>["reason"]): ProjectCapabilityDetectionResult {
  return Object.freeze({ detected: false as const, reason });
}

const defaultIo: ProjectTargetDetectorIo = Object.freeze({
  readSnapshot: async (path: string, maximumBytes: number) => {
    const flags = fileConstants.O_RDONLY | (process.platform === "win32" ? 0 : fileConstants.O_NOFOLLOW);
    const handle = await open(path, flags);
    try {
      const before = await handle.stat();
      if (!before.isFile() || before.size > maximumBytes) return undefined;
      const openedCanonical = await realpath(path);
      if (!samePath(path, openedCanonical)) return undefined;
      const bytes = await handle.readFile();
      const after = await handle.stat();
      const stable = before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs && bytes.byteLength === after.size;
      return { bytes, stable };
    } finally { await handle.close(); }
  },
});
