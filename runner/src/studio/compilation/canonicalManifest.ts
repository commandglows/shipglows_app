import { createHash } from "node:crypto";

const digestPattern = /^[a-f0-9]{64}$/;
const drive = /^[A-Za-z]:/;

export function canonicalPath(input: string): string {
  const value = input.normalize("NFC");
  if (value !== input || value === "" || value.startsWith("/") || value.endsWith("/") || drive.test(value) || value.includes("\\") || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error("Manifest path is not canonical.");
  const segments = value.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) throw new Error("Manifest path is not canonical.");
  return value;
}

export function canonicalManifestBytes(value: unknown): Uint8Array {
  assertCanonicalValue(value);
  const encoded = JSON.stringify(value);
  if (typeof encoded !== "string") throw new Error("Canonical manifest is not serializable.");
  return new TextEncoder().encode(`${encoded}\n`);
}

export function canonicalJsonDigest(value: unknown): string { return sha256(canonicalManifestBytes(value)); }

export function manifestAggregateDigest(entries: readonly { readonly path: string; readonly sizeBytes: number; readonly fileDigest: string }[]): string {
  const hash = createHash("sha256"); let previous: Uint8Array | undefined; const collisions = new Set<string>();
  for (const entry of entries) {
    const path = canonicalPath(entry.path); const bytes = new TextEncoder().encode(path);
    const collision = path.toLowerCase(); if (collisions.has(collision)) throw new Error("Manifest path collision."); collisions.add(collision);
    if (previous !== undefined && Buffer.compare(bytes, previous) <= 0) throw new Error("Manifest entries are not in canonical order.");
    previous = bytes;
    if (!Number.isSafeInteger(entry.sizeBytes) || entry.sizeBytes < 0 || !digestPattern.test(entry.fileDigest)) throw new Error("Manifest entry is invalid.");
    hash.update(bytes).update(Buffer.from([0])).update(String(entry.sizeBytes)).update(Buffer.from([0])).update(entry.fileDigest).update("\n");
  }
  return hash.digest("hex");
}

export function digestProjection<T extends Record<string, unknown>>(value: T, selfKey: keyof T): string {
  const projection: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) if (key !== selfKey) projection[key] = item;
  return canonicalJsonDigest(projection);
}

function sha256(value: Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }
function assertCanonicalValue(value:unknown):void {if(value===null||typeof value==="string"||typeof value==="boolean")return;if(typeof value==="number"){if(!Number.isFinite(value))throw new Error("Canonical manifest contains a non-finite number.");return;}if(Array.isArray(value)){for(const item of value)assertCanonicalValue(item);return;}if(typeof value==="object"){for(const item of Object.values(value as Record<string,unknown>))assertCanonicalValue(item);return;}throw new Error("Canonical manifest contains an unsupported value.");}
