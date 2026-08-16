import type { AstroIntegration } from "astro";

export const STUDIO_BRIDGE_MODULE = "/src/studio/heroBridge.ts";

export function studioPreviewIntegration(parentOrigin: string): AstroIntegration {
  const normalizedParentOrigin = new URL(parentOrigin).origin;
  return {
    name: "shipglows-studio-preview",
    hooks: {
      "astro:config:setup": ({ command, injectScript }) => {
        if (command !== "dev") return;
        injectScript(
          "page",
          `window.__SHIPGLOWS_STUDIO_PARENT_ORIGIN__=${JSON.stringify(normalizedParentOrigin)};import ${JSON.stringify(STUDIO_BRIDGE_MODULE)};`,
        );
      },
    },
  };
}
