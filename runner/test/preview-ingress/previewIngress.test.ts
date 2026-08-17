import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CloudProjectCatalogEntry } from "../../src/cloud-projects/index.js";
import { PreviewIngressError, PreviewIngressService } from "../../src/preview-ingress/index.js";

const project: CloudProjectCatalogEntry = {
  projectId: "prj_alpha",
  displayName: "Alpha",
  previewSlug: "alpha",
  status: "online",
  capabilities: { preview: true, workspace: true },
  privateRuntime: { cwd: "/srv/private/alpha", port: 4173, tmuxSession: "alpha" },
};

function service(now: () => number = () => 1_000) {
  return new PreviewIngressService(
    { resolveByHost: (host) => host === "alpha.preview.shipglows.com" ? project : null },
    { hasAccess: ({ tenantId, userId, projectId }) => tenantId === "tenant" && userId === "user" && projectId === "prj_alpha" },
    "https://app.shipglows.com",
    now,
    100,
    1_000,
  );
}

describe("PreviewIngressService", () => {
  it("exchanges a one-time actor/project/host ticket for a host-only secure cookie", async () => {
    const ingress = service();
    const ticket = await ingress.createTicket({ tenantId: "tenant", userId: "user", projectId: "prj_alpha", host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    const cookie = await ingress.consumeTicket({ tenantId: "tenant", userId: "user", ticketId: ticket.id, secret: ticket.secret, host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    assert.equal(cookie.name, "__Host-shipglows_preview");
    assert.equal(cookie.attributes, "Path=/; HttpOnly; Secure; SameSite=Strict");
    await assert.rejects(ingress.consumeTicket({ tenantId: "tenant", userId: "user", ticketId: ticket.id, secret: ticket.secret, host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" }), PreviewIngressError);
    assert.deepEqual(await ingress.authorize({ cookie: cookie.value, host: "alpha.preview.shipglows.com", websocket: false }), { projectId: "prj_alpha", upstreamPort: 4173 });
  });

  it("denies hostile origins, host swaps, actor swaps and websocket upgrades without exact Origin", async () => {
    const ingress = service();
    await assert.rejects(ingress.createTicket({ tenantId: "tenant", userId: "user", projectId: "prj_alpha", host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com.evil" }), (error) => error instanceof PreviewIngressError && error.code === "previewOriginDenied");
    const ticket = await ingress.createTicket({ tenantId: "tenant", userId: "user", projectId: "prj_alpha", host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    await assert.rejects(ingress.consumeTicket({ tenantId: "tenant", userId: "other", ticketId: ticket.id, secret: ticket.secret, host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" }), PreviewIngressError);
    const fresh = await ingress.createTicket({ tenantId: "tenant", userId: "user", projectId: "prj_alpha", host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    const cookie = await ingress.consumeTicket({ tenantId: "tenant", userId: "user", ticketId: fresh.id, secret: fresh.secret, host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    await assert.rejects(ingress.authorize({ cookie: cookie.value, host: "beta.preview.shipglows.com", websocket: false }), PreviewIngressError);
    await assert.rejects(ingress.authorize({ cookie: cookie.value, host: "alpha.preview.shipglows.com", websocket: true }), (error) => error instanceof PreviewIngressError && error.code === "previewOriginDenied");
    assert.deepEqual(await ingress.authorize({ cookie: cookie.value, host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com", websocket: true }), { projectId: "prj_alpha", upstreamPort: 4173 });
  });

  it("fails closed when the catalog is stale/stopped or membership is lost", async () => {
    const mutableProject = { ...project };
    let allowed = true;
    const ingress = new PreviewIngressService(
      { resolveByHost: () => mutableProject },
      { hasAccess: () => allowed },
      "https://app.shipglows.com",
      () => 1_000,
    );
    const ticket = await ingress.createTicket({ tenantId: "tenant", userId: "user", projectId: "prj_alpha", host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    const cookie = await ingress.consumeTicket({ tenantId: "tenant", userId: "user", ticketId: ticket.id, secret: ticket.secret, host: "alpha.preview.shipglows.com", origin: "https://app.shipglows.com" });
    allowed = false;
    await assert.rejects(ingress.authorize({ cookie: cookie.value, host: "alpha.preview.shipglows.com", websocket: false }), (error) => error instanceof PreviewIngressError && error.code === "previewDenied");
    allowed = true;
    Object.assign(mutableProject, { status: "stopped" });
    await assert.rejects(ingress.authorize({ cookie: cookie.value, host: "alpha.preview.shipglows.com", websocket: false }), (error) => error instanceof PreviewIngressError && error.code === "previewUnavailable");
  });
});
