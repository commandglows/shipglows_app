import { describe, expect, it } from "vitest";
import { installPages } from "../../src/data/installPages";
import { alternatePath } from "../../src/i18n/ui";

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

  it("switches the public installer between its English and French routes", () => {
    expect(alternatePath("/shipglows", "fr")).toBe("/fr/shipglows");
    expect(alternatePath("/fr/shipglows", "en")).toBe("/shipglows");
  });

  it("explains the complete Windows Flutter toolchain in both locales", () => {
    const english = JSON.stringify(installPages.shipglows.en);
    const french = JSON.stringify(installPages.shipglows.fr);

    for (const marker of [
      "Flutter for web, Android, and Windows",
      "Android Studio",
      "Visual Studio Community",
      "Firebase Device Streaming",
      "hardware acceleration",
      "exact next action",
    ]) {
      expect(english).toContain(marker);
    }
    for (const marker of [
      "Flutter pour le Web, Android et Windows",
      "Android Studio",
      "Visual Studio Community",
      "Firebase Device Streaming",
      "accélération matérielle",
      "prochaine action exacte",
    ]) {
      expect(french).toContain(marker);
    }

    expect(english).not.toContain("optional Flutter Web SDK");
    expect(french).not.toContain("SDK Flutter Web optionnel");
  });
});
