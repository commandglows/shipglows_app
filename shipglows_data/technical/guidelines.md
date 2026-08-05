---
artifact: technical_guidelines
metadata_schema_version: "1.0"
artifact_version: "2.1.0"
project: "shipglows_app"
created: "2026-04-25"
updated: "2026-08-03"
status: reviewed
source_skill: 300-sg-docs
scope: technical
owner: "Diane"
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/"
  - "runner/"
  - "site/"
  - "shipglows_data/technical/code-docs-map.md"
depends_on:
  - artifact: "shipglows_data/technical/architecture.md"
    artifact_version: "2.1.0"
    required_status: reviewed
supersedes:
  - "shipglows_data/workflow/archives/contentflow-governance/guidelines.md"
evidence:
  - "Current ShipGlows runtime boundaries and managed-runner implementation."
next_review: "2026-09-03"
next_step: "Revalidate after public authenticated Workspace proof."
---

# Technical Guidelines

## Active Ownership

- Product work targets `app/lib/shipglows/**` and `runner/src/**`.
- Legacy ContentFlow modules remain reference material until explicitly adapted.
- Root `shipglows_data/` is the only canonical governance corpus.
- `shipglows_data/technical/code-docs-map.md` routes code changes to their owner docs.

## Security Rules

- Keep privileged credentials, provider tokens, GitHub installation tokens, paths, PTY handles, and runtime transports on the server.
- Authenticate first, then resolve tenant membership and project capability server-side.
- Fail closed when authentication, identity mapping, capability, repository binding, or Workspace gateway is unavailable.
- Do not persist raw terminal output, credentials, cookies, authorization headers, or host paths.
- Never let Flutter choose a filesystem path, tmux session, shell command, runtime transport, or execution permission.
- Carry the short-lived Workspace capability outside URLs so proxy access logs do not receive it.

## Execution Rules

- Use server-owned audit and fix presets with bounded user input.
- Require idempotency for state-changing commands.
- Keep audits read-only and fixes isolated.
- Stop before push, merge, deployment, or canonical-branch mutation unless a later approved contract adds them.
- Preserve runtime-neutral interfaces and normalized semantic events.

## UI Rules

- Cockpit and semantic conversations are the default experience.
- Missing evidence must remain unknown.
- Advanced Workspace controls appear only for authorized projects and remain visibly unavailable without the gateway.
- Keep hosted-unavailable states explicit while TLS or identity provisioning prevents the implemented gateway from being reached.
- Do not expose infrastructure terminology to ordinary users unless it is necessary to understand an operator-only capability.

## Documentation Rules

- Update the mapped technical owner whenever behavior changes.
- Preserve historical ContentFlow material under `shipglows_data/workflow/archives/`, legacy inventories, and historical specs.
- Do not use archived ContentFlow claims as current ShipGlows product truth.

## Validation

```bash
cd app && flutter analyze && flutter test
cd ../runner && npm run typecheck && npm test
python3 /home/claude/shipglows/tools/audit_project_governance_topology.py .
```

## Maintenance Rule

Update these guidelines when execution authority, security boundaries, repository policy, UI trust rules, or canonical documentation ownership changes.
