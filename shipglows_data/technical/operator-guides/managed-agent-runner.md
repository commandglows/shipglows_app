---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "1.2.0"
project: "shipglows_app"
created: "2026-08-11"
updated: "2026-08-21"
status: draft
source_skill: "001-sg-build"
scope: "managed-agent-runner-operations"
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "runner/src/observability/index.ts"
  - "runner/src/app.ts"
  - "runner/src/db/index.ts"
  - "runner/scripts/backup-operational-store.ts"
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md"
depends_on:
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "3.2.0"
    required_status: draft
  - artifact: "shipglows_data/workflow/specs/shipglows-managed-codex-cockpit-mvp.md"
    artifact_version: "1.20.0"
    required_status: ready
supersedes:
  - "shipglows_data/technical/operator-guides/managed-agent-runner.md@1.1.1"
  - "shipglows_data/technical/operator-guides/managed-agent-runner.md@1.1.0"
  - "shipglows_data/technical/operator-guides/managed-agent-runner.md@1.0.0"
evidence:
  - "Local liveness, authenticated diagnostic, redaction, SQLite migration, backup and restore tests on 2026-08-11."
  - "Studio-specific enablement, session, compile-admission, and OCI incident rules moved to the dedicated Studio/OCI operations guide on 2026-08-16."
  - "The Studio operations guide now owns the provider-neutral managed-sandbox direction and account-free Vercel facade; its legacy OCI filename is retained for compatibility only."
next_review: "2026-08-25"
next_step: "Add provider-backed error reporting and execute the hosted recovery drill before claiming production readiness."
---

# Managed Agent Runner Operations

Studio enablement and managed-sandbox incidents are governed separately by `shipglows_data/technical/operator-guides/studio-oci-worker.md`; the legacy filename is retained for compatibility, while its operative content is provider-neutral. Do not infer Studio, Vercel-account, or generated-code readiness from general runner liveness, diagnostics, backup, Workspace, local fake-provider conformance, or unrelated provider health.

## Safe status checks

Use `GET /health/live` only for process liveness. Its complete successful body is `{ "status": "ok" }`; it intentionally proves neither database health nor provider readiness.

Use authenticated `GET /v1/diagnostics` for bounded operational state. It exposes the runner release/build identity, UTC and Europe/Paris timestamps, and normalized probe results. It must never include exception text, environment values, filesystem paths, credentials, repository data, prompts or terminal output. A dependency failure returns `503` with `dependencyFailure` rather than the original error.

## SQLite backup

Run from the repository's `runner` directory with a private, access-controlled destination:

```bash
npm run backup:sqlite -- --database /absolute/path/live.sqlite --destination-dir /absolute/path/backups
```

The command requires an existing regular SQLite file, creates a unique destination, refuses overwrite, uses SQLite's online backup mechanism, and validates both `PRAGMA integrity_check` and schema v9. Successful output contains only the generated basename, schema version, page count and creation timestamp. Treat the backup as sensitive even though routine runner payloads are secret-safe.

## Restore drill

1. Stop writes to the target environment; do not overwrite the live database in place.
2. Copy the selected backup to a new private path.
3. Start an isolated runner against that copy with the normal secret environment withheld unless the drill explicitly needs it.
4. Run the local runner test gates and verify schema version, expected tenant/project counts and authenticated diagnostics.
5. Promote only through the deployment's controlled rollback procedure; retain the prior live file until the restored runner is stable.

The automated proof covers migration from schema v2 to v9, backup integrity, restored tenant data, and the durable one-open-conversation constraint. It does not prove retention policy, remote storage, encryption-at-rest, hosted rollback or disaster recovery.

## Conversation and delivery recovery

- `projectBusy`: open the existing conversation. Close it explicitly only after its queued/running work has ended; do not edit SQLite to bypass the lease.
- `deliveryBranchMismatch`: switch the repository through the normal operator workflow to its server-configured `main` or `preview` branch, then retry.
- `deliveryCheckoutDirty`: inspect and commit or deliberately discard changes outside the runner. The runner never resets them.
- `deliveryRemoteAdvanced` or `deliveryDiverged`: synchronize manually and restore a clean, non-divergent checkout. The runner never rebases or force-pushes.
- `deliveryPushRejected`: inspect branch protection and remote state. Do not add a fallback branch or force flag.

The active runner creates no managed audit/fix worktree. Pre-existing `.shipglows-workspaces` content is historical state: preserve it until an operator separately reviews and authorizes cleanup.

## Incident boundaries

- Liveness fails: restart or inspect the supervised process without publishing logs containing environment values.
- Diagnostics returns `401`: repair authentication; never make diagnostics public.
- Diagnostics returns `503`: use the normalized failed probe to choose the internal investigation path; do not add raw exception output to the API.
- Backup fails: preserve the live database, remove only an incomplete generated destination, and retry after checking private destination capacity and permissions.
- Suspected secret exposure: rotate the affected credential and preserve only redacted evidence.

Sentry/provider-backed error reporting, cleanup dry-run, hosted backup retention and a real recovery exercise remain required before Task 12 can close.

## Validation

```bash
cd runner
npm test
npm run typecheck
npm run lint
npm run audit
```

## Maintenance Rule

Update this guide whenever liveness, diagnostic authentication/schema, build identity, backup API, SQLite schema, retention, restore or incident procedures change.
