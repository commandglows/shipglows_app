import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CloudProjectCatalogError,
  FileCloudProjectCatalogReader,
  findCloudProjectByHost,
  parseCloudProjectCatalog,
  redactCloudProject,
} from "../../src/cloud-projects/index.js";

const validCatalog = JSON.stringify({
  schemaVersion: "shipglows.cli-project-catalog.v1",
  generatedAt: "2026-08-18T10:00:00.000Z",
  projects: [{
    id: "prj_0123456789abcdef0123456789abcdef",
    displayName: "Alpha",
    previewSlug: "alpha",
    status: "online",
    source: "pm2+flutter-web",
    cwd: "/srv/shipglows/alpha",
    port: 4173,
    tmuxSession: "shipglows-flutter-alpha",
  }],
});

describe("CLI cloud project catalog", () => {
  it("parses a closed catalog and redacts every private runtime field", () => {
    const snapshot = parseCloudProjectCatalog(validCatalog, ["/srv/shipglows"]);
    const entry = snapshot.entries[0];
    assert.ok(entry);
    const redacted = redactCloudProject(entry);
    assert.deepEqual(redacted, {
      projectId: "prj_0123456789abcdef0123456789abcdef",
      displayName: "Alpha",
      previewSlug: "alpha",
      status: "online",
      capabilities: { preview: true, workspace: true },
    });
    assert.equal(JSON.stringify(redacted).includes("/srv/"), false);
    assert.equal(JSON.stringify(redacted).includes("4173"), false);
    assert.equal(JSON.stringify(redacted).includes("tmux"), false);
    assert.equal(findCloudProjectByHost(snapshot, "alpha.shipglows.com", "shipglows.com")?.projectId, "prj_0123456789abcdef0123456789abcdef");
  });

  it("mirrors the exact CLI fixture and derives capabilities instead of trusting them", () => {
    const fixture = JSON.stringify({
      schemaVersion: "shipglows.cli-project-catalog.v1",
      generatedAt: "2026-08-18T10:00:00.000Z",
      projects: [
        { id: "prj_00000000000000000000000000000001", displayName: "PM2 live", previewSlug: "pm2-live", status: "online", source: "pm2", cwd: "/srv/shipglows/pm2", port: 3005, tmuxSession: null },
        { id: "prj_00000000000000000000000000000002", displayName: "Flutter", previewSlug: "flutter", status: "launching", source: "flutter-web", cwd: "/srv/shipglows/flutter", port: 3010, tmuxSession: "shipglows-flutter-demo" },
        { id: "prj_00000000000000000000000000000003", displayName: "Errored", previewSlug: "errored", status: "errored", source: "pm2+flutter-web", cwd: "/srv/shipglows/errored", port: null, tmuxSession: "shipglows-errored" },
        { id: "prj_00000000000000000000000000000004", displayName: "Unknown", previewSlug: "unknown", status: "unknown", source: "pm2", cwd: "/srv/shipglows/unknown", port: null, tmuxSession: null },
      ],
    });
    const snapshot = parseCloudProjectCatalog(fixture, ["/srv/shipglows"]);
    assert.deepEqual(snapshot.entries.map(({ status, capabilities }) => ({ status, capabilities })), [
      { status: "online", capabilities: { preview: true, workspace: false } },
      { status: "launching", capabilities: { preview: true, workspace: true } },
      { status: "unavailable", capabilities: { preview: false, workspace: true } },
      { status: "unavailable", capabilities: { preview: false, workspace: false } },
    ]);
  });

  it("rejects duplicate or reserved slugs, unknown fields and boundary-escaping paths", () => {
    const parsed = JSON.parse(validCatalog) as { projects: Record<string, unknown>[] };
    parsed.projects.push({ ...parsed.projects[0], id: "prj_abcdefabcdefabcdefabcdefabcdefab" });
    assert.throws(() => parseCloudProjectCatalog(JSON.stringify(parsed), ["/srv/shipglows"]), (error) => error instanceof CloudProjectCatalogError && error.code === "catalogInvalid");
    const unknown = JSON.parse(validCatalog) as { unexpected?: boolean };
    unknown.unexpected = true;
    assert.throws(() => parseCloudProjectCatalog(JSON.stringify(unknown), ["/srv/shipglows"]), CloudProjectCatalogError);
    const escape = validCatalog.replace("/srv/shipglows/alpha", "/srv/private/alpha");
    assert.throws(() => parseCloudProjectCatalog(escape, ["/srv/shipglows"]), CloudProjectCatalogError);
    const reserved = validCatalog.replace('"previewSlug":"alpha"', '"previewSlug":"app"');
    assert.throws(() => parseCloudProjectCatalog(reserved, ["/srv/shipglows"]), CloudProjectCatalogError);
  });

  it("fails closed for unavailable, stale, future and oversized snapshots", async () => {
    const stale = new FileCloudProjectCatalogReader("/srv/catalog.json", ["/srv"], () => Date.parse("2026-08-18T10:03:00Z"), 60_000, 1_000_000, async () => validCatalog);
    await assert.rejects(stale.read(), (error) => error instanceof CloudProjectCatalogError && error.code === "catalogStale");
    const future = new FileCloudProjectCatalogReader("/srv/catalog.json", ["/srv"], () => Date.parse("2026-08-18T09:00:00Z"), 60_000, 1_000_000, async () => validCatalog);
    await assert.rejects(future.read(), (error) => error instanceof CloudProjectCatalogError && error.code === "catalogStale");
    const unavailable = new FileCloudProjectCatalogReader("/srv/catalog.json", ["/srv"], Date.now, 60_000, 1_000_000, async () => { throw new Error("missing"); });
    await assert.rejects(unavailable.read(), (error) => error instanceof CloudProjectCatalogError && error.code === "catalogUnavailable");
    const oversized = new FileCloudProjectCatalogReader("/srv/catalog.json", ["/srv"], Date.now, 60_000, 8, async () => validCatalog);
    await assert.rejects(oversized.read(), (error) => error instanceof CloudProjectCatalogError && error.code === "catalogInvalid");
  });

  it("allows the private catalog file outside project roots but rejects relative paths", async () => {
    const reader = new FileCloudProjectCatalogReader(
      "/var/lib/shipglows/cli-project-catalog.v1.json",
      ["/srv/projects"],
      () => Date.parse("2026-08-18T10:00:30Z"),
      60_000,
      1_000_000,
      async () => validCatalog.replaceAll("/srv/shipglows/alpha", "/srv/projects/alpha"),
    );
    assert.equal((await reader.read()).entries.length, 1);
    assert.throws(() => new FileCloudProjectCatalogReader("catalog.json", ["/srv/projects"]), CloudProjectCatalogError);
  });
});
