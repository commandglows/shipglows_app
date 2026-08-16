import {
  HERO_STUDIO_ANCHORS,
  STUDIO_BRIDGE_VERSION,
  STUDIO_PROFILE_ID,
  isTrustedStudioOrigin,
  parseStudioAttachMessage,
  type HeroStudioAnchorId,
} from "./heroContract";

declare global {
  interface Window {
    __SHIPGLOWS_STUDIO_PARENT_ORIGIN__?: string;
  }
}

const parentOrigin = window.__SHIPGLOWS_STUDIO_PARENT_ORIGIN__;
let attachedChannelId: string | null = null;

function geometry(element: Element) {
  const bounds = element.getBoundingClientRect();
  return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
}

function send(type: "studio.ready" | "studio.selected", payload: Record<string, unknown>) {
  if (!parentOrigin || !attachedChannelId || window.parent === window) return;
  window.parent.postMessage(
    { version: STUDIO_BRIDGE_VERSION, type, channelId: attachedChannelId, ...payload },
    parentOrigin,
  );
}

window.addEventListener("message", (event) => {
  if (!parentOrigin || event.source !== window.parent || !isTrustedStudioOrigin(event.origin, parentOrigin)) return;
  const message = parseStudioAttachMessage(event.data);
  if (!message) return;
  attachedChannelId = message.channelId;
  send("studio.ready", {
    profileId: STUDIO_PROFILE_ID,
    anchors: Object.entries(HERO_STUDIO_ANCHORS).map(([id, value]) => ({ id, ...value })),
  });
});

document.addEventListener("click", (event) => {
  if (!attachedChannelId || !(event.target instanceof Element)) return;
  const element = event.target.closest<HTMLElement>("[data-sg-studio-anchor]");
  const anchorId = element?.dataset.sgStudioAnchor as HeroStudioAnchorId | undefined;
  if (!element || !anchorId || !(anchorId in HERO_STUDIO_ANCHORS)) return;
  event.preventDefault();
  event.stopPropagation();
  send("studio.selected", {
    anchor: { id: anchorId, ...HERO_STUDIO_ANCHORS[anchorId], bounds: geometry(element) },
  });
});
