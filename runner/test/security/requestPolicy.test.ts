import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { stateChangingOriginGuard } from "../../src/security/requestPolicy.js";

const reply = undefined as never;

describe("state-changing origin policy", () => {
  it("allows native requests without an Origin header", async () => {
    const guard = stateChangingOriginGuard([]);
    await guard.call(undefined as never, { method: "POST", headers: {} } as never, reply);
  });

  it("rejects untrusted origins and allows normalized configured origins", async () => {
    const guard = stateChangingOriginGuard(["https://cockpit.example.com"]);
    assert.throws(
      () => guard.call(undefined as never, { method: "POST", headers: { origin: "https://evil.example" } } as never, reply),
      (error: unknown) => error instanceof Error && "code" in error && error.code === "originNotAllowed",
    );
    await guard.call(undefined as never, { method: "POST", headers: { origin: "https://cockpit.example.com" } } as never, reply);
  });

  it("does not apply the state-changing policy to reads", async () => {
    const guard = stateChangingOriginGuard([]);
    await guard.call(undefined as never, { method: "GET", headers: { origin: "https://evil.example" } } as never, reply);
  });
});
