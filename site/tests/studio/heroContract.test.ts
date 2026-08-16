import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  HERO_STUDIO_ANCHORS,
  STUDIO_BRIDGE_VERSION,
  isTrustedStudioOrigin,
  parseStudioAttachMessage,
} from "../../src/studio/heroContract";

describe("Hero Studio contract", () => {
  it("defines eight unique read-only semantic anchors mapped by Hero", async () => {
    const source = await readFile(
      fileURLToPath(new URL("../../src/components/Hero.astro", import.meta.url)),
      "utf8",
    );
    expect(Object.keys(HERO_STUDIO_ANCHORS)).toHaveLength(8);
    expect(new Set(Object.keys(HERO_STUDIO_ANCHORS)).size).toBe(8);
    for (const [anchorId, contract] of Object.entries(HERO_STUDIO_ANCHORS)) {
      expect(source).toContain(`studioAnchorAttributes("${anchorId}")`);
      expect(contract.capabilities).toEqual(["inspect"]);
    }
  });

  it("accepts only the closed versioned attach message", () => {
    const valid = {
      version: STUDIO_BRIDGE_VERSION,
      type: "studio.attach",
      channelId: "channel_1234",
    };
    expect(parseStudioAttachMessage(valid)).toEqual(valid);
    expect(parseStudioAttachMessage({ ...valid, selector: "body" })).toBeNull();
    expect(parseStudioAttachMessage({ ...valid, type: "studio.command" })).toBeNull();
    expect(parseStudioAttachMessage({ ...valid, channelId: "short" })).toBeNull();
  });

  it("matches only the exact configured parent origin", () => {
    const expected = "http://127.0.0.1:3005";
    expect(isTrustedStudioOrigin(expected, expected)).toBe(true);
    expect(isTrustedStudioOrigin("http://localhost:3005", expected)).toBe(false);
    expect(isTrustedStudioOrigin("http://127.0.0.1:3005.evil.test", expected)).toBe(false);
    expect(isTrustedStudioOrigin("not-an-origin", expected)).toBe(false);
  });
});
