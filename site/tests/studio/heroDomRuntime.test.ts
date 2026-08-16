import { describe, expect, it } from "vitest";

import { HERO_STUDIO_ANCHORS, STUDIO_PARENT_ORIGIN, createStudioReadyMessage, type HeroStudioAnchorId, type StudioPreviewCommand } from "../../src/studio/heroContract";
import { BrowserHeroStudioRuntime } from "../../src/studio/heroBridge";

class FakeStyle {
  readonly values = new Map<string, string>();
  setProperty(property: string, value: string): void { this.values.set(property, value); }
  getPropertyValue(property: string): string { return this.values.get(property) ?? ""; }
  getPropertyPriority(): string { return ""; }
  removeProperty(property: string): string { const value = this.getPropertyValue(property); this.values.delete(property); return value; }
  set left(value: string) { this.setProperty("left", value); }
  set top(value: string) { this.setProperty("top", value); }
}

class FakeElement {
  readonly dataset: Record<string, string> = {};
  readonly attributes = new Map<string, string>();
  readonly style = new FakeStyle();
  textContent: string | null = null;
  removed = false;

  constructor(anchorId?: HeroStudioAnchorId) {
    if (anchorId) this.dataset.sgStudioAnchor = anchorId;
  }

  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  removeAttribute(name: string): void { this.attributes.delete(name); }
  getBoundingClientRect() { return { x: 12, y: 48, left: 12, top: 48, width: 320, height: 96 }; }
  remove(): void { this.removed = true; }
}

class FakeContainer {
  readonly children: FakeElement[] = [];
  append(element: FakeElement): void { this.children.push(element); }
}

class FakeDocument {
  readonly anchors = (Object.keys(HERO_STUDIO_ANCHORS) as HeroStudioAnchorId[]).map((id) => new FakeElement(id));
  readonly head = new FakeContainer();
  readonly body = new FakeContainer();

  querySelectorAll(): FakeElement[] { return this.anchors; }
  querySelector(selector: string): FakeElement | null {
    const attribute = selector.slice(1, -1);
    return [...this.head.children, ...this.body.children].find((element) => element.attributes.has(attribute)) ?? null;
  }
  createElement(): FakeElement { return new FakeElement(); }
}

describe("Hero browser DOM runtime", () => {
  it("renders an accessible responsive highlight and restores temporary styles", () => {
    const document = new FakeDocument();
    const posts: unknown[] = [];
    const parent = { postMessage: (message: unknown) => posts.push(message) };
    const runtime = new BrowserHeroStudioRuntime({ parent } as unknown as Window, document as unknown as Document);

    const anchors = runtime.snapshots();
    expect(anchors).toHaveLength(8);
    expect(runtime.select("hero.title")?.bounds).toEqual({ x: 12, y: 48, width: 320, height: 96 });
    const overlay = document.body.children[0]!;
    expect(overlay.attributes.get("role")).toBe("status");
    expect(overlay.attributes.get("aria-live")).toBe("polite");
    expect(overlay.textContent).toContain("Title");
    expect(overlay.style.getPropertyValue("left")).toBe("12px");
    expect(overlay.style.getPropertyValue("top")).toBe("18px");

    const command: StudioPreviewCommand = { commandId: "cmd_1", revision: 1, anchorId: "hero.title", capability: "opacity.set", parameters: { value: 0.5 } };
    expect(runtime.apply(command)?.id).toBe("hero.title");
    const title = document.anchors.find((element) => element.dataset.sgStudioAnchor === "hero.title")!;
    expect(title.style.getPropertyValue("opacity")).toBe("0.5");
    expect(title.attributes.get("data-sg-studio-overridden")).toBe("true");
    runtime.reset();
    expect(title.style.getPropertyValue("opacity")).toBe("");
    expect(title.attributes.has("data-sg-studio-overridden")).toBe(false);

    runtime.post(createStudioReadyMessage("channel_1234", anchors), STUDIO_PARENT_ORIGIN);
    expect(posts).toHaveLength(1);
  });
});
