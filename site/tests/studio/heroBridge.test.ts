import { describe, expect, it } from "vitest";

import {
  HERO_STUDIO_ANCHORS,
  STUDIO_BRIDGE_VERSION,
  STUDIO_PARENT_ORIGIN,
  type HeroStudioAnchorId,
  type StudioAnchorSnapshot,
  type StudioPreviewCommand,
  type StudioReadyMessage,
  type StudioSelectedMessage,
} from "../../src/studio/heroContract";
import { HeroStudioBridgeController, type HeroStudioBridgeRuntime } from "../../src/studio/heroBridge";

class FakeRuntime implements HeroStudioBridgeRuntime {
  readonly messages: (StudioReadyMessage | StudioSelectedMessage)[] = [];
  readonly commands: StudioPreviewCommand[] = [];
  resets = 0;
  complete = true;

  snapshots(): readonly StudioAnchorSnapshot[] {
    const entries = Object.entries(HERO_STUDIO_ANCHORS) as [HeroStudioAnchorId, (typeof HERO_STUDIO_ANCHORS)[HeroStudioAnchorId]][];
    const values = entries.map(([id, value], index) => ({ id, ...value, bounds: { x: index, y: index, width: 100, height: 40 } }));
    return this.complete ? values : values.slice(0, -1);
  }

  select(anchorId: HeroStudioAnchorId): StudioAnchorSnapshot | null {
    return this.snapshots().find((anchor) => anchor.id === anchorId) ?? null;
  }

  apply(command: StudioPreviewCommand): StudioAnchorSnapshot | null {
    this.commands.push(command);
    return this.select(command.anchorId);
  }

  reset(): void { this.resets += 1; }
  post(message: StudioReadyMessage | StudioSelectedMessage): void { this.messages.push(message); }
}

const attach = { version: STUDIO_BRIDGE_VERSION, type: "studio.attach", channelId: "channel_1234" } as const;
const visualCommand = {
  schemaVersion: "shipglows.studio.v1", commandId: "cmd_1", sessionId: "session_1", kind: "transform.set",
  parameters: { axis: "translateX", value: 4 }, affectedRuntimeNodeIds: ["hero.title"], affectedDimensions: ["design"],
  provenance: { actorType: "operator", actorId: "operator_1" }, revision: 1, idempotencyKey: "idem_1", previewOnly: true,
  requiredCapability: "transform.set", requiredUnprotectedDimensions: [], compactionKey: "hero.title.transform",
};

describe("Hero Studio bridge handshake", () => {
  it("attests all eight runtime anchors before ready and rejects hostile origins", () => {
    const runtime = new FakeRuntime();
    const bridge = new HeroStudioBridgeController(runtime);
    expect(bridge.receive({ origin: "http://evil.test", sourceIsParent: true, data: attach })).toBe(false);
    expect(bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: false, data: attach })).toBe(false);
    expect(runtime.messages).toHaveLength(0);
    expect(bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: attach })).toBe(true);
    expect(runtime.messages[0]).toMatchObject({ type: "studio.ready", channelId: "channel_1234", profileId: "shipglows.astro.hero.v1" });
    expect((runtime.messages[0] as StudioReadyMessage).anchors).toHaveLength(8);
    expect((runtime.messages[0] as StudioReadyMessage).anchors[0]).toEqual({
      id: "hero.root", label: "Hero", sourceSymbol: "Hero", capabilities: ["token.set", "spacing.set", "radius.set"],
    });

    const incomplete = new FakeRuntime();
    incomplete.complete = false;
    expect(new HeroStudioBridgeController(incomplete).receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: attach })).toBe(false);
  });

  it("keeps selection bidirectional and channel-bound", () => {
    const runtime = new FakeRuntime();
    const bridge = new HeroStudioBridgeController(runtime);
    bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: attach });
    expect(bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: { ...attach, type: "studio.select", anchorId: "hero.title" } })).toBe(true);
    expect(runtime.messages.at(-1)).toMatchObject({ type: "studio.selected", anchor: { id: "hero.title" } });
    expect(bridge.activate("hero.panel")).toBe(true);
    expect(runtime.messages.at(-1)).toMatchObject({ type: "studio.selected", anchor: { id: "hero.panel" } });
    expect(bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: { ...attach, type: "studio.select", channelId: "channel_other", anchorId: "hero.body" } })).toBe(false);
  });

  it("resets then replays each complete command journal deterministically", () => {
    const runtime = new FakeRuntime();
    const bridge = new HeroStudioBridgeController(runtime);
    bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: attach });
    const preview = (revision: number, commands: object[]) => bridge.receive({ origin: STUDIO_PARENT_ORIGIN, sourceIsParent: true, data: { ...attach, type: "studio.commands", revision, commands } });
    expect(preview(1, [visualCommand])).toBe(true);
    expect(runtime.resets).toBe(1);
    expect(runtime.commands).toHaveLength(1);
    expect(runtime.messages).toHaveLength(1);
    expect(preview(1, [visualCommand])).toBe(true);
    expect(runtime.resets).toBe(1);
    expect(runtime.commands).toHaveLength(1);
    expect(preview(1, [{ ...visualCommand, parameters: { axis: "translateX", value: 5 } }])).toBe(false);
    expect(preview(0, [])).toBe(false);
    expect(runtime.resets).toBe(1);
    expect(preview(2, [{ ...visualCommand, commandId: "cmd_2", revision: 2 }])).toBe(true);
    expect(runtime.resets).toBe(2);
    expect(preview(1, [{ ...visualCommand, parameters: { css: "body{}" } }])).toBe(false);
    expect(runtime.resets).toBe(2);
  });
});
