import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { assertProductionExcludesStudio } from "./assertProductionExclusion.mjs";

const temporary: string[] = [];
afterEach(async () => Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

describe("Studio production exclusion guard", () => {
  it("accepts ordinary production output and rejects every Studio marker", async () => {
    const clean = await mkdtemp(join(tmpdir(), "shipglows-studio-clean-"));
    temporary.push(clean);
    await writeFile(join(clean, "index.html"), "<main>ShipGlows</main>");
    await expect(assertProductionExcludesStudio(clean)).resolves.toBeUndefined();

    const leaked = await mkdtemp(join(tmpdir(), "shipglows-studio-leak-"));
    temporary.push(leaked);
    await writeFile(join(leaked, "entry.js"), 'const version="shipglows.studio.bridge.v1";');
    await expect(assertProductionExcludesStudio(leaked)).rejects.toThrow(/leaked into production/i);
  });
});
