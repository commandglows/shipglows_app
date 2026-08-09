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
  it.each(["powershell", "ps1", "windows"])("serves PowerShell for %s", async (format) => {
    const response = await getDotfiles(context(`https://shipglows.com/dotfiles-script?format=${format}`));
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=300");
    expect(await response.text()).toMatch(/^# Native Windows Dotfiles bootstrap/);
  });

  it.each(["", "unknown"])("serves shell by default for '%s'", async (format) => {
    const suffix = format ? `?format=${format}` : "";
    const response = await getDotfiles(context(`https://shipglows.com/dotfiles-script${suffix}`));
    const body = await response.text();
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(body).toContain('exec bash "$DOTFILES_DIR/dotfiles/install.sh" "$@"');
  });
});
