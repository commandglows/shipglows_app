import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertFixRequest, assertFixRuntime } from "../../src/runs/fix.js";

describe("fix command policy", () => {
  it("accepts bounded issue references and instructions", () => {
    assert.doesNotThrow(() => assertFixRequest({ issueId: "issue-42", instruction: "Apply the safe fix." }));
  });

  it("rejects path-shaped issue references and oversized instructions", () => {
    assert.throws(() => assertFixRequest({ issueId: "../secret", instruction: "fix" }));
    assert.throws(() => assertFixRequest({ issueId: "issue-42", instruction: "x".repeat(4001) }));
  });

  it("requires the isolated workspace capability before execution", () => {
    assert.throws(
      () => assertFixRuntime({ id: "fake", capabilities: new Set(["sessions"]) }),
      /isolatedWorkspaces/,
    );
    assert.doesNotThrow(() => assertFixRuntime({ id: "fake", capabilities: new Set(["isolatedWorkspaces"]) }));
  });
});
