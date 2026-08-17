import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const forbiddenStudioProductionMarkers = Object.freeze([
  "shipglows.studio.bridge.v1",
  "shipglows.studio.v1",
  "shipglows.astro.hero.v1",
  "data-sg-studio-anchor",
  "data-sg-studio-overlay",
  "heroBridge.ts",
  "studio.attach",
  "studio.ready",
  "studio.selected",
  "studio.preview-command",
  "studio.commands",
]);

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export async function assertProductionExcludesStudio(outputDirectory) {
  const matches = [];
  for (const path of await filesBelow(outputDirectory)) {
    const content = (await readFile(path)).toString("utf8");
    for (const marker of forbiddenStudioProductionMarkers) {
      if (content.includes(marker)) matches.push(`${path}: ${marker}`);
    }
  }
  if (matches.length > 0) throw new Error(`Studio development bridge leaked into production output:\n${matches.join("\n")}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  await assertProductionExcludesStudio(resolve(process.cwd(), "dist"));
  process.stdout.write("Studio production exclusion: passed\n");
}
