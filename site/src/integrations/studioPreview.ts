import type { AstroIntegration } from "astro";

import { STUDIO_PARENT_ORIGIN } from "../studio/heroContract";

export const STUDIO_BRIDGE_MODULE = "/src/studio/heroBridge.ts";

export function studioPreviewIntegration(): AstroIntegration {
  return {
    name: "shipglows-studio-preview",
    hooks: {
      "astro:config:setup": ({ command, injectScript }) => {
        if (command !== "dev") return;
        injectScript(
          "page",
          `import { installHeroStudioBridge } from ${JSON.stringify(STUDIO_BRIDGE_MODULE)};installHeroStudioBridge({parentOrigin:${JSON.stringify(STUDIO_PARENT_ORIGIN)}});`,
        );
      },
    },
  };
}
