import { describe, expect, it, vi } from "vitest";

import { STUDIO_BRIDGE_MODULE, studioPreviewIntegration } from "../../src/integrations/studioPreview";
import { STUDIO_PARENT_ORIGIN } from "../../src/studio/heroContract";

describe("Studio preview integration", () => {
  it("injects an explicit bridge installer only for Astro development", () => {
    const integration = studioPreviewIntegration();
    const setup = integration.hooks["astro:config:setup"]!;
    const injectScript = vi.fn();
    setup({ command: "dev", injectScript } as never);
    expect(injectScript).toHaveBeenCalledOnce();
    expect(injectScript).toHaveBeenCalledWith("page", expect.stringContaining(STUDIO_BRIDGE_MODULE));
    expect(injectScript.mock.calls[0]?.[1]).toContain("installHeroStudioBridge");
    expect(injectScript.mock.calls[0]?.[1]).toContain(JSON.stringify(STUDIO_PARENT_ORIGIN));

    injectScript.mockClear();
    for (const command of ["build", "preview", "sync"] as const) setup({ command, injectScript } as never);
    expect(injectScript).not.toHaveBeenCalled();
  });
});
