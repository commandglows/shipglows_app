import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const siteRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");
const shipglowsRoot = process.env.SHIPGLOWS_ROOT
  ? resolve(process.env.SHIPGLOWS_ROOT)
  : resolve(siteRoot, "../../shipglows");
const dotfilesRoot = resolve(siteRoot, "../../dotfiles");

describe("generated installer parity", () => {
  it.each([
    ["install-shipglows.sh", "shipglows-installer.sh"],
    ["install-shipglows.ps1", "shipglows-installer.ps1"],
  ])("keeps %s byte-identical", async (canonical, generated) => {
    await expect(readFile(resolve(siteRoot, "src/generated", generated))).resolves.toEqual(
      await readFile(resolve(shipglowsRoot, canonical)),
    );
  });
});

describe("generated Dotfiles installer parity", () => {
  it.each([
    ["dotfiles/install-dotfiles.sh", "dotfiles-installer.sh"],
    ["install-dotfiles.ps1", "dotfiles-installer.ps1"],
  ])("keeps %s byte-identical", async (canonical, generated) => {
    await expect(readFile(resolve(siteRoot, "src/generated", generated))).resolves.toEqual(
      await readFile(resolve(dotfilesRoot, canonical)),
    );
  });
});
