import { describe, expect, it } from "vitest";
import { installPages } from "../../src/data/installPages";

describe("public installer pages", () => {
  it("publishes paired English and French content", () => {
    expect(Object.keys(installPages.shipglows)).toEqual(["en", "fr"]);
    expect(Object.keys(installPages.dotfiles)).toEqual(["en", "fr"]);
  });

  it("uses only the canonical ShipGlows installer origin", () => {
    const serialized = JSON.stringify(installPages);
    expect(serialized).toContain("https://shipglows.com/shipglows-script");
    expect(serialized).toContain("https://shipglows.com/dotfiles-script");
    expect(serialized).not.toContain("commandglows.com");
  });

  it("keeps unsupported Termux full mode unavailable", () => {
    for (const locale of ["en", "fr"] as const) {
      const variant = installPages.shipglows[locale].variants.find((item) => item.id === "termux-full");
      expect(variant).toMatchObject({ available: false, command: "" });
    }
  });
});
