import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

describe("installer route contract", () => {
  it.each(["shipglows.astro", "dotfiles.astro", "fr/shipglows.astro", "fr/dotfiles.astro"])("defines %s", async (route) => {
    await expect(readFile(resolve(root, "src/pages", route), "utf8")).resolves.toContain("InstallPage");
  });

  it.each([["install.astro", 'href="/shipglows"'], ["fr/install.astro", 'href="/fr/shipglows"']])("keeps %s plugin-first with a local runtime link", async (route, link) => {
    const source = await readFile(resolve(root, "src/pages", route), "utf8");
    expect(source).toContain("codex plugin marketplace add commandglows/shipglows");
    expect(source).toContain("codex plugin add shipglows@shipglows");
    expect(source).not.toContain("dianedef/ShipGlows");
    expect(source).toContain(link);
  });
});
