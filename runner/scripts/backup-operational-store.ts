import { mkdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { openOperationalStore } from "../src/db/index.js";

class OperatorBackupError extends Error {
  constructor(readonly code: "invalidArguments" | "invalidSource") {
    super(code);
  }
}

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) throw new OperatorBackupError("invalidArguments");
  return value;
}

async function main(): Promise<void> {
  const databasePath = resolve(argument("--database"));
  const destinationDirectory = resolve(argument("--destination-dir"));
  try {
    const databaseStat = await stat(databasePath);
    if (!databaseStat.isFile()) throw new OperatorBackupError("invalidSource");
  } catch (error) {
    if (error instanceof OperatorBackupError) throw error;
    throw new OperatorBackupError("invalidSource");
  }
  await mkdir(destinationDirectory, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const destinationPath = join(destinationDirectory, `shipglows-operational-${stamp}-${randomUUID().slice(0, 8)}.sqlite`);
  const store = await openOperationalStore(databasePath);
  try {
    const result = await store.backupTo(destinationPath);
    process.stdout.write(`${JSON.stringify({
      status: "completed",
      file: basename(destinationPath),
      schemaVersion: result.schemaVersion,
      pages: result.pages,
      createdAt: result.createdAt,
    })}\n`);
  } finally {
    store.close();
  }
}

try {
  await main();
} catch (error) {
  const code = error instanceof OperatorBackupError ? error.code : "backupFailed";
  process.stderr.write(`${JSON.stringify({ status: "failed", code })}\n`);
  process.exitCode = 1;
}
