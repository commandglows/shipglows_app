import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolvePersonalCloudActorProvisioning, resolvePersonalCloudProjectCapability } from "../../src/auth/personalCloudProvisioning.js";

describe("Personal Cloud actor provisioning", () => {
  const projectMembers = { authorized: { shipglows: "mutate" }, reader: { docs: "read" } } as const;

  it("places an explicitly authorized user in the shared project tenant with its exact capability", () => {
    const actor = resolvePersonalCloudActorProvisioning({
      subject: "authorized",
      projectTenantId: "ten_shipglows",
      projectMembers,
    });
    assert.equal(actor.tenantId, "ten_shipglows");
    assert.match(actor.userId, /^usr_firebase_[a-f0-9]{24}$/);
  });

  it("provisions every other authenticated user into a deterministic isolated tenant", () => {
    const first = resolvePersonalCloudActorProvisioning({
      subject: "outsider",
      projectTenantId: "ten_shipglows",
      projectMembers,
    });
    const second = resolvePersonalCloudActorProvisioning({
      subject: "another-outsider",
      projectTenantId: "ten_shipglows",
      projectMembers,
    });
    assert.match(first.tenantId, /^ten_personal_[a-f0-9]{24}$/);
    assert.notEqual(first.tenantId, second.tenantId);
    assert.notEqual(first.userId, second.userId);
  });

  it("grants only the project explicitly assigned to the authenticated subject", () => {
    assert.equal(resolvePersonalCloudProjectCapability({ subject: "authorized", projectId: "shipglows", projectMembers }), "mutate");
    assert.equal(resolvePersonalCloudProjectCapability({ subject: "authorized", projectId: "another-project", projectMembers }), undefined);
    assert.equal(resolvePersonalCloudProjectCapability({ subject: "outsider", projectId: "shipglows", projectMembers }), undefined);
  });
});
