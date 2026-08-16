import type { StudioPreviewCommand } from "./heroContract";

export interface PreviewStyleMutation {
  readonly property: string;
  readonly value: string;
}

export type PreviewOverridePlan = Readonly<{ kind: "apply"; mutations: readonly PreviewStyleMutation[] }>;

const colors = {
  brand: { accent: "#115e59", panel: "rgba(255, 255, 255, 0.92)" },
  mint: { accent: "#0f766e", panel: "rgba(224, 247, 242, 0.94)" },
  amber: { accent: "#a16207", panel: "rgba(255, 247, 214, 0.94)" },
  violet: { accent: "#6d28d9", panel: "rgba(243, 232, 255, 0.94)" },
} as const;

const spacingProperties = {
  gap: "gap", paddingTop: "padding-top", paddingRight: "padding-right", paddingBottom: "padding-bottom", paddingLeft: "padding-left",
  marginTop: "margin-top", marginRight: "margin-right", marginBottom: "margin-bottom", marginLeft: "margin-left",
} as const;
const radiusProperties = { all: "border-radius", topLeft: "border-top-left-radius", topRight: "border-top-right-radius", bottomRight: "border-bottom-right-radius", bottomLeft: "border-bottom-left-radius" } as const;

export function previewOverridePlan(command: StudioPreviewCommand): PreviewOverridePlan {
  const parameters = command.parameters as Record<string, unknown>;
  switch (command.capability) {
    case "token.set": {
      const token = parameters.token === "color.accent" ? "accent" : "panel";
      const preset = parameters.value as keyof typeof colors;
      return { kind: "apply", mutations: [{ property: token === "accent" ? "--accent" : "--panel-strong", value: colors[preset][token] }] };
    }
    case "spacing.set": {
      const property = spacingProperties[parameters.property as keyof typeof spacingProperties];
      return { kind: "apply", mutations: [{ property, value: `${parameters.value}px` }] };
    }
    case "radius.set":
      return { kind: "apply", mutations: [{ property: radiusProperties[parameters.corner as keyof typeof radiusProperties], value: `${parameters.value}px` }] };
    case "opacity.set":
      return { kind: "apply", mutations: [{ property: "opacity", value: String(parameters.value) }] };
    case "transform.set":
      return { kind: "apply", mutations: [{ property: `--sg-studio-${parameters.axis}`, value: parameters.axis === "scale" ? String(parameters.value) : `${parameters.value}${parameters.axis === "rotate" ? "deg" : "px"}` }] };
    case "visibility.set":
      return { kind: "apply", mutations: [{ property: "visibility", value: parameters.visible ? "visible" : "hidden" }] };
    case "motion.duration":
      return { kind: "apply", mutations: [{ property: "--sg-studio-motion-duration", value: `${parameters.milliseconds}ms` }] };
    case "motion.easing":
      return { kind: "apply", mutations: [{ property: "--sg-studio-motion-easing", value: String(parameters.easing) }] };
  }
}
