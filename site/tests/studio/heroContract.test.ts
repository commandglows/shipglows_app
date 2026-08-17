import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  HERO_STUDIO_ANCHORS,
  STUDIO_BRIDGE_VERSION,
  STUDIO_COMMAND_LIMIT_BYTES,
  STUDIO_MESSAGE_LIMIT_BYTES,
  STUDIO_PARENT_ORIGIN,
  createStudioReadyMessage,
  createStudioSelectedMessage,
  isWithinStudioCommandLimit,
  isWithinStudioMessageLimit,
  isTrustedStudioOrigin,
  parseStudioHostMessage,
} from "../../src/studio/heroContract";

const envelope = { version: STUDIO_BRIDGE_VERSION, channelId: "channel_1234" } as const;
const visualCommand = {
  schemaVersion: "shipglows.studio.v1",
  commandId: "cmd_1",
  sessionId: "session_1",
  kind: "transform.set",
  parameters: { axis: "translateX", value: 12 },
  affectedRuntimeNodeIds: ["hero.title"],
  affectedDimensions: ["design"],
  provenance: { actorType: "operator", actorId: "operator_1" },
  revision: 1,
  idempotencyKey: "idem_1",
  previewOnly: true,
  requiredCapability: "transform.set",
  requiredUnprotectedDimensions: [],
  compactionKey: "hero.title.transform",
};

describe("Hero Studio contract", () => {
  it("defines eight unique dev-only anchors with exact source metadata", async () => {
    const source = await readFile(fileURLToPath(new URL("../../src/components/Hero.astro", import.meta.url)), "utf8");
    expect(Object.keys(HERO_STUDIO_ANCHORS)).toHaveLength(8);
    expect(new Set(Object.keys(HERO_STUDIO_ANCHORS)).size).toBe(8);
    for (const [anchorId, contract] of Object.entries(HERO_STUDIO_ANCHORS)) {
      expect(source).toContain(`studioAnchorAttributes("${anchorId}")`);
      expect(contract.source.path).toBe("site/src/components/Hero.astro");
      expect(contract.source.confidence).toBe("exact");
      expect(contract.capabilities).not.toContain("inspect");
    }
    expect(source).not.toContain("data-sg-studio-anchor=");
  });

  it("accepts only closed attach and bidirectional select envelopes", () => {
    expect(parseStudioHostMessage({ ...envelope, type: "studio.attach" })?.type).toBe("studio.attach");
    expect(parseStudioHostMessage({ ...envelope, type: "studio.select", anchorId: "hero.title" })?.type).toBe("studio.select");
    expect(parseStudioHostMessage({ ...envelope, type: "studio.select", anchorId: "hero.unknown" })).toBeNull();
    expect(parseStudioHostMessage({ ...envelope, type: "studio.attach", selector: "body" })).toBeNull();
    expect(parseStudioHostMessage({ ...envelope, type: "studio.select", anchorId: "hero.title", path: "/tmp" })).toBeNull();
  });

  it("accepts bounded semantic preview commands and rejects executable or unsupported input", () => {
    const batch = { ...envelope, type: "studio.commands", revision: 1, commands: [visualCommand] };
    expect(parseStudioHostMessage(batch)?.type).toBe("studio.commands");
    expect(parseStudioHostMessage({ ...batch, commands: [{ ...visualCommand, parameters: { selector: "body" } }] })).toBeNull();
    expect(parseStudioHostMessage({ ...batch, commands: [{ ...visualCommand, kind: "javascript", requiredCapability: "javascript", parameters: { value: "alert(1)" } }] })).toBeNull();
    expect(parseStudioHostMessage({ ...batch, commands: [{ ...visualCommand, affectedRuntimeNodeIds: ["hero.eyebrow"], kind: "spacing.set", requiredCapability: "spacing.set", parameters: { property: "gap", value: 12 } }] })).toBeNull();
    expect(parseStudioHostMessage({ ...batch, commands: [{ ...visualCommand, parameters: { axis: "translateX", value: 97 } }] })).toBeNull();
    expect(parseStudioHostMessage({ ...batch, commands: [{ ...visualCommand, extra: true }] })).toBeNull();
    expect(parseStudioHostMessage({ ...batch, revision: 2 })?.type).toBe("studio.commands");
    expect(parseStudioHostMessage({ ...batch, revision: 0 })).toBeNull();
    expect(parseStudioHostMessage({ ...batch, commands: [{ ...visualCommand, commandId: "x".repeat(STUDIO_MESSAGE_LIMIT_BYTES) }] })).toBeNull();
  });

  it("projects the exact closed ready and selected anchor fixtures", () => {
    const definition = HERO_STUDIO_ANCHORS["hero.title"];
    const snapshot = { id: "hero.title" as const, ...definition, bounds: { x: 1, y: 2, width: 300, height: 80 } };
    expect(createStudioReadyMessage("channel_1234", [snapshot]).anchors).toEqual([{
      id: "hero.title", label: "Title", sourceSymbol: "Hero.title", capabilities: definition.capabilities,
    }]);
    expect(createStudioSelectedMessage("channel_1234", snapshot).anchor).toEqual({
      id: "hero.title", label: "Title", sourceSymbol: "Hero.title", capabilities: definition.capabilities,
      bounds: { x: 1, y: 2, width: 300, height: 80 },
    });
  });

  it("enforces the shared total bridge budget in UTF-8 bytes at N and N+1", () => {
    const overhead = new TextEncoder().encode(JSON.stringify({ pad: "" })).byteLength;
    expect(isWithinStudioMessageLimit({ pad: "a".repeat(STUDIO_MESSAGE_LIMIT_BYTES - overhead) })).toBe(true);
    expect(isWithinStudioMessageLimit({ pad: "a".repeat(STUDIO_MESSAGE_LIMIT_BYTES - overhead + 1) })).toBe(false);
    expect(new TextEncoder().encode(JSON.stringify({ pad: "é" })).byteLength).toBe(JSON.stringify({ pad: "é" }).length + 1);
    expect(isWithinStudioCommandLimit({ pad: "a".repeat(STUDIO_COMMAND_LIMIT_BYTES - overhead) })).toBe(true);
    expect(isWithinStudioCommandLimit({ pad: "a".repeat(STUDIO_COMMAND_LIMIT_BYTES - overhead + 1) })).toBe(false);
  });

  it("matches only the exact configured parent origin", () => {
    expect(isTrustedStudioOrigin(STUDIO_PARENT_ORIGIN)).toBe(true);
    expect(isTrustedStudioOrigin("http://localhost:3005")).toBe(false);
    expect(isTrustedStudioOrigin("http://127.0.0.1:3005.evil.test")).toBe(false);
    expect(isTrustedStudioOrigin("http://127.0.0.1:3005/")).toBe(false);
    expect(isTrustedStudioOrigin("not-an-origin")).toBe(false);
  });
});
