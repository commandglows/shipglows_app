import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, it } from "node:test";

import { openOperationalStore } from "../../src/db/index.js";

async function fixturePaths(): Promise<{ readonly live: string; readonly backup: string }> {
  const root = await mkdtemp(join(tmpdir(), "shipglows-backup-proof-"));
  return { live: join(root, "live.sqlite"), backup: join(root, "backup.sqlite") };
}

describe("SQLite operational backup", () => {
  it("backs up a live projection and restores tenant data with schema integrity", async () => {
    const paths = await fixturePaths();
    const live = await openOperationalStore(paths.live);
    live.createTenant({ id: "ten_backup_fixture", identityRef: "firebase-backup-fixture" });

    const result = await live.backupTo(paths.backup);
    assert.equal(result.schemaVersion, 8);
    assert.ok(result.pages >= 1);
    live.close();

    const restored = await openOperationalStore(paths.backup);
    assert.equal(restored.schemaVersion(), 8);
    assert.deepEqual(restored.listTenantIds(), ["ten_backup_fixture"]);
    restored.close();
  });

  it("migrates a legacy v2 fixture before producing a restorable v8 backup", async () => {
    const paths = await fixturePaths();
    const fixture = new DatabaseSync(paths.live);
    fixture.exec("CREATE TABLE meta(version INTEGER NOT NULL); INSERT INTO meta VALUES(2);");
    fixture.close();

    const migrated = await openOperationalStore(paths.live);
    assert.equal(migrated.schemaVersion(), 8);
    await migrated.backupTo(paths.backup);
    migrated.close();

    const restored = await openOperationalStore(paths.backup);
    assert.equal(restored.schemaVersion(), 8);
    restored.close();
  });

  it("never overwrites an existing backup destination", async () => {
    const paths = await fixturePaths();
    const live = await openOperationalStore(paths.live);
    await live.backupTo(paths.backup);
    await assert.rejects(live.backupTo(paths.backup), /already exists/);
    live.close();
  });
});
