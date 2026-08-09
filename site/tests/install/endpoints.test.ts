import { describe, expect, it } from "vitest";
import { GET as getShipGlows } from "../../src/pages/shipglows-script";
import { GET as getDotfiles } from "../../src/pages/dotfiles-script";

const context = (url: string) => ({ url: new URL(url) }) as Parameters<typeof getShipGlows>[0];

describe("ShipGlows installer endpoint", () => {
  it.each(["powershell", "ps1", "windows"])("serves PowerShell for %s", async (format) => {
    const response = await getShipGlows(context(`https://shipglows.com/shipglows-script?format=${format}`));
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=300");
    expect(await response.text()).toMatch(/^# ShipGlows|^<#[\s\S]*ShipGlows|^param\(/);
  });

  it.each(["", "unknown"])("serves shell by default for '%s'", async (format) => {
    const suffix = format ? `?format=${format}` : "";
    const response = await getShipGlows(context(`https://shipglows.com/shipglows-script${suffix}`));
    expect(await response.text()).toMatch(/^#!\/usr\/bin\/env (bash|sh)/);
  });
});

describe("dotfiles endpoint", () => {
  it("serves the safe canonical bootstrap", async () => {
    const response = await getDotfiles({} as Parameters<typeof getDotfiles>[0]);
    const body = await response.text();
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toContain("raw.githubusercontent.com/dianedef/dotfiles/main/dotfiles/install-dotfiles.sh");
    expect(body).toContain('exec sh "$tmp_file"');
  });
});
