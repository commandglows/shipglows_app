import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BlacksmithCompilationError,
  GitHubBlacksmithCompilationGateway,
  type BlacksmithTokenBroker,
} from "../../src/github/blacksmithCompilation.js";

const request = {
  repositoryId: 101,
  workflowRef: "codex/blacksmith-managed-flutter-proof",
  sourceSha: "a".repeat(40),
  operationId: "managed_1234",
  target: "flutterAndroid",
} as const;

const tokens: BlacksmithTokenBroker = {
  withActionsToken: async (_repositoryId, operation) => operation("server-only-token"),
};

describe("Blacksmith managed compilation gateway", () => {
  it("dispatches only the fixed workflow with closed inputs", async () => {
    let url = "";
    let body = "";
    const gateway = new GitHubBlacksmithCompilationGateway(tokens, async (input, init) => {
      url = input instanceof URL ? input.toString() : typeof input === "string" ? input : input.url;
      body = typeof init?.body === "string" ? init.body : "";
      assert.equal((init?.headers as Record<string, string>)["authorization"], "Bearer server-only-token");
      return new Response(null, { status: 204 });
    });

    await gateway.dispatch(request);
    assert.equal(url, "https://api.github.com/repositories/101/actions/workflows/studio-managed-flutter-blacksmith.yml/dispatches");
    assert.deepEqual(JSON.parse(body), {
      ref: request.workflowRef,
      inputs: { operation_id: request.operationId, source_sha: request.sourceSha, target: request.target },
    });
  });

  it("finds only the run bound to operation, target, and source revision", async () => {
    const gateway = new GitHubBlacksmithCompilationGateway(tokens, async () => new Response(JSON.stringify({
      workflow_runs: [
        { id: 6, display_title: "studio-managed-managed_1234-flutterAndroid", head_sha: "b".repeat(40), status: "completed", conclusion: "success" },
        { id: 7, display_title: "studio-managed-managed_1234-flutterAndroid", head_sha: request.sourceSha, status: "completed", conclusion: "success" },
      ],
    })));
    assert.deepEqual(await gateway.findRun(request), { runId: 7, status: "completed", conclusion: "success" });
  });

  it("downloads exactly one unexpired bounded artifact", async () => {
    let calls = 0;
    const gateway = new GitHubBlacksmithCompilationGateway(tokens, async () => {
      calls += 1;
      return calls === 1
        ? new Response(JSON.stringify({ artifacts: [{ id: 55, expired: false }] }))
        : new Response(new Uint8Array([80, 75, 3, 4]));
    });
    assert.deepEqual(await gateway.downloadArtifact(101, 7), new Uint8Array([80, 75, 3, 4]));
  });

  it("rejects commands, paths, unknown targets, and malformed revisions before network", async () => {
    let called = false;
    const gateway = new GitHubBlacksmithCompilationGateway(tokens, async () => {
      called = true;
      return new Response(null, { status: 204 });
    });
    await assert.rejects(gateway.dispatch({ ...request, workflowRef: "../main" }), BlacksmithCompilationError);
    await assert.rejects(gateway.dispatch({ ...request, sourceSha: "main" }), BlacksmithCompilationError);
    await assert.rejects(gateway.dispatch({ ...request, target: "shell" as never }), BlacksmithCompilationError);
    assert.equal(called, false);
  });
});
