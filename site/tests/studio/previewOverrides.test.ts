import { describe, expect, it } from "vitest";

import { previewOverridePlan } from "../../src/studio/previewOverrides";
import type { StudioPreviewCommand } from "../../src/studio/heroContract";

const command = (capability: StudioPreviewCommand["capability"], parameters: StudioPreviewCommand["parameters"], anchorId: StudioPreviewCommand["anchorId"] = "hero.title"): StudioPreviewCommand => ({ commandId: "cmd_1", revision: 1, anchorId, capability, parameters });

describe("semantic preview overrides", () => {
  it("maps presets to bounded internal values rather than client CSS", () => {
    expect(previewOverridePlan(command("token.set", { token: "color.accent", value: "violet" }, "hero.root"))).toEqual({ kind: "apply", mutations: [{ property: "--accent", value: "#6d28d9" }] });
    expect(previewOverridePlan(command("transform.set", { axis: "translateX", value: 12 }))).toEqual({ kind: "apply", mutations: [{ property: "--sg-studio-translateX", value: "12px" }] });
    expect(previewOverridePlan(command("motion.duration", { milliseconds: 420 }))).toEqual({ kind: "apply", mutations: [{ property: "--sg-studio-motion-duration", value: "420ms" }] });
  });
});
