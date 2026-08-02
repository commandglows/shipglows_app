import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EventHub } from "../../src/events/index.js";

describe("event hub", () => {
  it("fans out only to subscribers of the conversation and closes cleanly", async () => {
    const hub = new EventHub();
    const first = hub.subscribe({ tenantId: "ten_1", conversationId: "cnv_1" });
    const second = hub.subscribe({ tenantId: "ten_1", conversationId: "cnv_2" });
    const event = {
      cursor: 1,
      id: "evt_1",
      tenantId: "ten_1",
      conversationId: "cnv_1",
      type: "run.started",
      payload: { runId: "run_1" },
      occurredAt: "2026-08-02T00:00:00.000Z",
    } as const;

    hub.publish(event);
    assert.deepEqual(await first.events[Symbol.asyncIterator]().next(), { done: false, value: event });
    const secondIterator = second.events[Symbol.asyncIterator]();
    second.close();
    assert.deepEqual(await secondIterator.next(), { done: true, value: undefined });
    first.close();
  });

  it("keeps equal conversation identifiers isolated across tenants", async () => {
    const hub = new EventHub();
    const subscription = hub.subscribe({ tenantId: "ten_1", conversationId: "cnv_shared" });
    hub.publish({
      cursor: 1,
      id: "evt_other_tenant",
      tenantId: "ten_2",
      conversationId: "cnv_shared",
      type: "run.started",
      payload: { runId: "run_other" },
      occurredAt: "2026-08-02T00:00:00.000Z",
    });
    subscription.close();
    assert.deepEqual(await subscription.events[Symbol.asyncIterator]().next(), { done: true, value: undefined });
  });
});
