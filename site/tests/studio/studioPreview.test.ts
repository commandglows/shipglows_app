import { describe, expect, it, vi } from "vitest";

import {
  STUDIO_BRIDGE_MODULE,
  studioPreviewIntegration,
} from "../../src/integrations/studioPreview";

describe("Studio preview integration", () => {
  it("injects the bridge only for the Astro development command", () => {
    const integration = studioPreviewIntegration("http://127.0.0.1:3005");
    const setup = integration.hooks["astro:config:setup"]!;
    const injectScript = vi.fn();
    setup({ command: "dev", injectScript } as never);
    expect(injectScript).toHaveBeenCalledOnce();
    expect(injectScript).toHaveBeenCalledWith("page", expect.stringContaining(STUDIO_BRIDGE_MODULE));

    injectScript.mockClear();
    setup({ command: "build", injectScript } as never);
    setup({ command: "preview", injectScript } as never);
    expect(injectScript).not.toHaveBeenCalled();
  });

  it("normalizes and freezes the configured parent origin in injected code", () => {
    const integration = studioPreviewIntegration("http://127.0.0.1:3005/path");
    const setup = integration.hooks["astro:config:setup"]!;
    const injectScript = vi.fn();
    setup({ command: "dev", injectScript } as never);
    expect(injectScript.mock.calls[0]?.[1]).toContain('"http://127.0.0.1:3005"');
    expect(injectScript.mock.calls[0]?.[1]).not.toContain("/path");
  });
});
