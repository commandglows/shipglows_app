import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const siteRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

describe("Windows toolchain public surfaces", () => {
  it("keeps the Codex install handoff aligned in English and French", async () => {
    const english = (await readFile(resolve(siteRoot, "src/pages/install.astro"), "utf8")).replace(
      /\s+/g,
      " ",
    );
    const french = (await readFile(resolve(siteRoot, "src/pages/fr/install.astro"), "utf8")).replace(
      /\s+/g,
      " ",
    );

    expect(english).toContain("complete Windows development environment");
    expect(english).toContain("Flutter for web, Android, and Windows");
    expect(english).toContain("Codex, Claude, OpenCode, Kilo, and Gemini");
    expect(english).toContain("Dart, Playwright, Firebase, Convex, and Clerk MCP readiness");
    expect(english).toContain("official read-only GitHub MCP");
    expect(english).toContain("$shipglows context");
    expect(french).toContain("environnement de développement Windows complet");
    expect(french).toContain("Flutter pour le Web, Android et Windows");
    expect(french).toContain("Codex, Claude, OpenCode, Kilo et Gemini");
    expect(french).toContain("MCP Dart, Playwright, Firebase, Convex et Clerk");
    expect(french).toContain("MCP GitHub officiel en lecture seule");
    expect(french).toContain("$shipglows context");
  });

  it("serves an installer whose introduction names every Flutter target", async () => {
    const installer = await readFile(
      resolve(siteRoot, "src/generated/shipglows-installer.ps1"),
      "utf8",
    );
    expect(installer).toContain("Flutter for web, Android, and Windows");
    expect(installer).toContain("ShipGlows.AgentInstructions.psm1");
    expect(installer).toContain("$entries.Count -ne 6");
  });
});
