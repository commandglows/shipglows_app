---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglows_app"
created: "2026-08-02"
created_at: "2026-08-02 20:24:00 UTC"
updated: "2026-08-02"
updated_at: "2026-08-02 20:51:53 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "fundamental brand, identifier, repository, deployment, and domain migration"
owner: "Diane"
confidence: high
user_story: "En tant que propriétaire de ShipGlows, je veux que toutes les surfaces actives utilisent ShipGlows et shipglows.com afin que le produit, son code, ses intégrations et ses dépôts ne portent plus une identité contradictoire."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "/home/claude/shipglows"
  - "/home/claude/shipglows_app"
  - "GitHub repositories dianedef/shipglows and diane-defores/shipglows_app"
  - "Vercel project prj_30cynIwaQhjjuCUwuzAToj2OBafZ"
  - "shipglows.com"
depends_on:
  - artifact: "/home/claude/shipglowz/shipglows_data/business/business.md"
    artifact_version: "1.2.0"
    required_status: "reviewed"
  - artifact: "/home/claude/shipglowz/shipglows_data/branding/branding.md"
    artifact_version: "1.1.0"
    required_status: "reviewed"
  - artifact: "/home/claude/shipglows_app/shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.0.0"
    required_status: "draft"
supersedes:
  - "ShipGlows and ShipGlows naming across active surfaces"
evidence:
  - "Operator decision 2026-08-02: ShipGlows is the new universal name; only current project parent folders keep their existing names."
  - "Local inventory: 810 files in /home/claude/shipglows and 249 files in /home/claude/shipglows_app contain ShipGlows or ShipGlows references."
  - "Current Git remotes: dianedef/shipglows and diane-defores/shipglows_app."
  - "Current Vercel project metadata: projectName shipglows_site, id prj_30cynIwaQhjjuCUwuzAToj2OBafZ."
  - "GitHub official repository-renaming documentation: old Git URLs redirect but local remotes should be changed."
  - "Vercel official project documentation: a project is attached to one Git repository and its domain, Git and environment settings require project-level review."
next_step: "/102-sg-start ShipGlows total identity migration"
---

# Title

ShipGlows Total Identity Migration

# Status

Ready. The operator has fixed the target identity and the local-parent-directory exception. Task 1 must produce the complete rename manifest before any irreversible remote rename.

# User Story

En tant que propriétaire de ShipGlows, je veux que toutes les surfaces actives utilisent `ShipGlows`, `shipglows`, and `shipglows.com`, afin que les utilisateurs, les agents, les dépôts, les variables, les plugins et les déploiements racontent une seule identité cohérente.

# Minimal Behavior Contract

The migration accepts the operator-approved target name `ShipGlows` and changes every active human-readable, machine-readable, runtime and remote identifier from the prior identities to the target identity, while preserving only the names of the current parent project directories `/home/claude/shipglows` and `/home/claude/shipglows_app`. When a reference is a historical record, a generated artifact, a credential value, or an external integration that cannot be safely rewritten, the migration records and resolves it through an explicit exception or replacement rather than silently leaving it. The easy-to-miss case is an integration whose name remains old even after code and copy are renamed: GitHub remotes, Vercel Git linkage, domains, deployment variables, package/plugin identifiers and generated build labels all need independently observable proof.

# Success Behavior

- The public site presents ShipGlows and uses `https://shipglows.com` as its canonical public URL.
- Both active repositories, their local `origin` URLs, plugin package names, public installation commands, environment variable prefixes, runtime labels and generated artifacts use ShipGlows identifiers.
- No active source, configuration, file name, package name, public route, artifact label, deployment setting, remote repository, Vercel project, domain, environment-variable key or command retains the previous identity.
- Only the two operator-exempt parent folders remain named `/home/claude/shipglows` and `/home/claude/shipglows_app`; their contents must not use those legacy names after migration.
- A mechanical scan, focused runtime builds, GitHub remote inspection, Vercel inspection and browser proof show the intended final state.

# Error Behavior

- If a target repository name, GitHub account permission, Vercel project setting, DNS verification, domain attachment, package/marketplace name, or environment variable change is unavailable, the affected activation remains blocked and the prior live integration is retained until a rollback-safe switch is possible.
- If a rename would expose, overwrite, invalidate or log a secret, the operation stops before writing the affected configuration; secrets are rotated or re-entered only through the owning provider’s secure settings.
- If an occurrence belongs to immutable history or a third-party-owned URL, it is classified in the manifest and never falsely reported as migrated.
- Partial completion must be visible as `partial`; the site must not claim the new domain as live until browser and provider evidence confirm it.

# Problem

ShipGlows and ShipGlows are both present throughout two active repositories, the public site, public skills, package/plugin assets, names of files, generated labels and deployment metadata. This causes brand confusion and makes later automation or external deployment configuration unsafe. The product has a new domain, `shipglows.com`, and requires one coherent identity.

# Solution

Run a staged, manifest-driven identity migration from the two preserved parent folders. First inventory and classify every legacy identifier; then rename local source and configuration in dependency order; then rename GitHub and Vercel external identities, attach and verify `shipglows.com`, and finally remove every active legacy reference with proof and rollback points.

# Scope In

- Canonical product name: `ShipGlows`.
- Canonical compact machine name: `shipglows`.
- Canonical public domain: `shipglows.com` and its required `www`/deployment aliases.
- All active source, packages, plugins, skills, scripts, commands, paths below the two parent directories, test labels, artifact names, workflow names, environment-variable keys, configuration, public docs, translations, public routes, site metadata and favicons.
- Both active local Git repositories and their remote GitHub repository names, Git URLs, README links, marketplace URLs and consumers.
- Vercel project identity, connected Git repository, production domain, aliases, build-root setting, environment-variable keys and deployment labels.
- Existing public site location `site/` inside `/home/claude/shipglows_app`.
- Historical Markdown, archived reports, test evidence and file names inside the active repositories, except Git’s immutable commit history; their text/file names are migrated or consciously retained as one documented external-reference exception.
- Generated/disposable outputs are cleaned and regenerated after the rename; they are never treated as canonical source.

# Scope Out

- Renaming the two current parent project directories: `/home/claude/shipglows` and `/home/claude/shipglows_app`.
- Rewriting Git’s immutable commit history, third-party caches, external mentions that are not owned by Diane, or credentials/secrets themselves.
- Changing product behavior, database schema, access policy, pricing, visual design tokens or the underlying product proposition beyond its name and identity.
- Deleting old GitHub repository redirects before all owned consumers have migrated and the operator approves their retirement.

# Constraints

- Preserve git history and a rollback-capable state for each remote operation.
- Never bulk replace credentials, opaque IDs, hashes, binary assets, lockfiles or vendored dependencies.
- Treat case-sensitive paths, plugin identifiers, shell environment variables and URLs as separate namespaces.
- Preserve the site design system and application behavior; only labels, IDs, URLs and required configuration bindings may change.
- Use a generated, versioned rename manifest with `source`, `target`, `classification`, `owner`, `consumer`, `proof`, and `rollback` fields before applying replacements.
- Do not rename a live GitHub repository, Vercel project, custom domain or external package without first proving target availability and export/backup of its current configuration.

# Test Contract

Profile: mixed Astro, Flutter/Dart, Node/PNPM, Python/shell tooling, GitHub, Vercel, DNS/domain and Codex plugin distribution.

- Surface: public site, Flutter app, local tooling, plugins, GitHub repositories, Vercel deployment and DNS.
- Proof profile: exhaustive identifier migration with external integration cutover.
- Proof order: manifest baseline → local source/config proof → builds and tests → GitHub remote proof → Vercel preview → DNS/production browser proof → final residual scan.
- Checklist path: `shipglows_data/workflow/test-checklists/shipglows-total-identity-migration.md`.
- Required scenario IDs: `NAME-LOCAL`, `NAME-PATHS`, `NAME-PLUGIN`, `NAME-GITHUB`, `NAME-VERCEL`, `NAME-DOMAIN`, `NAME-SECRETS`, `NAME-RESIDUAL`.
- Required results: every scenario passes or is recorded as a provider-owned blocked state; no active legacy identity remains at closure.
- Exception with proof: Git commit history and external third-party references remain untouched; final scan excludes `.git` and the manifest names each retained external reference.

Automated proof runs after each bounded batch: exact legacy-name scans excluding `.git`, `node_modules`, `dist`, `.astro` and `.vercel`; path-name scans; TypeScript/Astro build; Flutter analysis/tests; shell and Python syntax checks; metadata lint; `git diff --check`; and remote URL assertions. Manual proof is required for GitHub redirects, Vercel Git connection, domain DNS/certificate attachment, production redirect behavior and installed plugin discovery. The ordered proof path is inventory → local tests/builds → disposable deploy preview → remote renames/configuration → production browser/domain proof → final full scan.

# Dependencies

- GitHub administration access for `dianedef/shipglows` and `diane-defores/shipglows_app`; GitHub documents that renamed repositories redirect old URLs but existing local clones should update `origin`. Fresh docs checked: [GitHub repository renaming](https://docs.github.com/en/enterprise-cloud%40latest/repositories/creating-and-managing-repositories/renaming-a-repository).
- Vercel team access for `prj_30cynIwaQhjjuCUwuzAToj2OBafZ`; Vercel project settings own Git, domains, environment variables and build configuration. Fresh docs checked: [Vercel project settings](https://vercel.com/docs/project-configuration/project-settings).
- Registrar/DNS access for `shipglows.com` to attach and verify the production domain.
- Existing ShipGlows business and brand contracts; their product claims remain unchanged.

# Invariants

- Parent folders `/home/claude/shipglows` and `/home/claude/shipglows_app` remain unchanged.
- Public site source remains `/home/claude/shipglows_app/site`.
- Git history, repository visibility, branch protection, collaborators, issues, releases, secrets and deployment data remain intact unless an explicit provider action necessarily changes a binding.
- No secret or credential value is copied into source, logs, specs or reports.
- New identity never overstates unshipped capabilities.
- Every migration step has a named proof and rollback condition.

# Links & Consequences

Before → after:

| Layer | Before | After |
| --- | --- | --- |
| Product name | ShipGlows / ShipGlows | ShipGlows |
| Machine identifier | shipglows / shipglows | shipglows |
| Public domain | legacy Vercel and product domains | shipglows.com |
| GitHub skills repository | `dianedef/shipglows` | `dianedef/shipglows` |
| GitHub app/site repository | `diane-defores/shipglows_app` | `diane-defores/shipglows_app` |
| Local parent folders | preserved | preserved exactly |

Affected direct consumers include plugin marketplace installation commands, `SHIPGLOWS_*`/`SHIPGLOWS_*` variables, skills and runtime symlinks, generated package paths, Flutter source readers, Astro links, Vercel configuration and GitHub Action artifacts. Dependent review includes external documentation, previously distributed plugin copies, DNS, third-party OAuth callback/deployment variables and bookmarks. The product promise, app behavior and visual token values are preserved.

# Documentation Coherence

Update the public site, both repository READMEs, business/product/GTM/brand documents, technical runtime and design authority documents, operator guides, public skill pages, installation instructions, FAQ, site content map, migration tracker, source maps, test checklists and active specs. Historical records must either be rewritten to the new identity or placed in the manifest’s explicit immutable-external-reference class; no stale historical text may be mistaken for active command/documentation authority.

# Edge Cases

- A legacy string is a semantic command or a package/plugin slug, not display copy; consumers must migrate atomically.
- A legacy environment variable is configured remotely but absent from the repository; provider inventory must find it before its code consumer changes.
- GitHub redirects keep old remotes working temporarily, which must not be mistaken for evidence that all consumers migrated.
- Vercel project-name and Git repository-name changes may be independently successful while production still builds the wrong root or uses legacy environment variables.
- Existing previews, screenshots, snapshots, cached pages and binary images may contain visible old branding and require intentional replacement or removal.
- Case-only renames behave differently on case-insensitive filesystems; use intermediate names and verify final paths.
- `SG` abbreviations remain valid only where they are explicitly documented as `ShipGlows`; unqualified historical meanings must be updated.

# Implementation Tasks

- [x] Task 1: Produce and approve the complete rename manifest.
  - Files: new governed manifest under `shipglows_data/workflow/`, inventories from both repositories and provider read-only exports.
  - Action: classify every exact and case-variant legacy occurrence as active source, active config, generated output, historical record, external provider, secret-bearing key, or false positive; define its exact target, consumer and rollback.
  - User story link: one reliable identity.
  - Depends on: none.
  - Validate with: manifest completeness equals the baseline scan and contains no unresolved active entry.

- [x] Task 2: Rename local active identifiers and paths in dependency order.
  - Files: both repositories excluding their parent directory names; plugins, skills, site, Flutter app, scripts, workflows, configuration and tests.
  - Action: rename source paths and symbols, package/plugin identifiers, commands, environment-variable keys and public routes; update every local consumer in the same batch.
  - User story link: all executable and visible surfaces use ShipGlows.
  - Depends on: Task 1.
  - Validate with: scoped builds/tests, syntax checks, exact scans and `git diff --check`.

- [x] Task 3: Migrate public identity and domain configuration.
  - Files: Astro metadata, canonical URLs, sitemap/robots if present, favicons/assets, deployment config and public documentation.
  - Action: set ShipGlows branding and `shipglows.com`; create preview proof before production cutover; attach canonical and redirect domains after DNS verification.
  - User story link: visitors see one trusted public identity.
  - Depends on: Tasks 1-2 and DNS access.
  - Validate with: static build, preview browser check, production browser/HTTPS/redirect check.

- [x] Task 4: Rename and reconnect GitHub repositories.
  - Files: remote GitHub settings and both local `.git/config` origins.
  - Action: prove target availability, rename the two owned repositories, update local remotes, action badges, clone/install URLs, package marketplace references and remote consumers; retain GitHub redirects as rollback compatibility.
  - User story link: contributors and agents reach ShipGlows repositories.
  - Depends on: Tasks 1-2 and confirmed GitHub administration access.
  - Validate with: `gh repo view`, `git ls-remote`, `git remote -v`, clone/fetch against new URLs and redirects from previous URLs.

- [x] Task 5: Rebind Vercel and provider settings.
  - Files: Vercel project settings, `.vercel/project.json`, deployment env-key inventory and domain configuration.
  - Action: rename the Vercel project, reconnect it to the renamed canonical GitHub repository and `site/` root, migrate only environment-variable keys whose code consumer is migrated, attach `shipglows.com`, and preserve a config export for rollback.
  - User story link: pushes deploy the right public source under the new domain.
  - Depends on: Tasks 2-4 and DNS access.
  - Validate with: provider inspection, preview deployment, production deployment, domain certificate and Git-trigger proof.

- [x] Task 6: Migrate historical/recovery material and remove residual active legacy names.
  - Files: tracked archives, conversations, screenshots, test evidence, old file names and documentation within both repositories.
  - Action: rewrite or rename all owned records under the manifest, regenerate disposable artifacts, and document any immutable third-party reference; do not alter Git history.
  - User story link: agents do not rediscover or reuse the obsolete identity.
  - Depends on: Tasks 1-5.
  - Validate with: final exact content and path scans plus reviewed manifest exceptions.

- [ ] Task 7: Close with end-to-end proof and rollback posture.
  - Files: verification record, migration manifest and release notes.
  - Action: record final provider IDs, URLs, known redirects, checks and rollback instructions; confirm no legacy source authority remains.
  - User story link: migration remains recoverable and auditable.
  - Depends on: Tasks 1-6.
  - Validate with: full test strategy and an independent clean-clone/install/browser check.

# Acceptance Criteria

- [ ] AC 1: Given a fresh clone of each renamed repository, when an operator follows the public installation and build documentation, then only ShipGlows identifiers and URLs are used.
- [x] AC 2: Given a scan of both repository worktrees excluding generated dependencies and Git history, when searching case-insensitively for previous identity tokens, then no active source/config/path occurrence remains and every exception is manifest-backed.
- [x] AC 3: Given public site metadata and production deployment, when a visitor opens `https://shipglows.com`, then the page, title, favicon, canonical URL and navigation present ShipGlows without legacy labels.
- [x] AC 4: Given the two GitHub renames, when local and CI consumers fetch/push through the new origins, then both operations succeed and old URLs are only documented as provider redirects.
- [ ] AC 5: Given the Vercel project, when a commit lands in the canonical repository, then the correct `site/` root builds and deploys under the configured ShipGlows domain.
- [ ] AC 6: Given remote environment-variable inventory, when code switches from prior prefixes to the ShipGlows prefix, then every required provider key is present under the new name and no secret value appears in tracked files or logs.
- [x] AC 7: Given the Flutter, Astro, plugin and tooling surfaces, when their normal checks run, then the migration preserves their existing functional behavior.

# Test Strategy

1. Baseline and per-batch `rg` content/path inventory; review manifest deltas.
2. Astro `pnpm --dir site build`, route/link crawl and metadata inspection.
3. Flutter `flutter analyze`, relevant `flutter test`, generated artifact-name inspection and app browser/device smoke where available.
4. Python/shell `python3 -m py_compile`/`bash -n` for changed tools and scripts; plugin packaging checks.
5. GitHub API/CLI assertions for renamed repositories, remotes, branch protections and redirect behavior.
6. Vercel settings export/inspection, preview and production deployment proof, domain DNS/HTTPS/canonical/redirect browser proof.
7. Leak scan for secrets and final exact residual scan, followed by clean clone/install verification.

# Risks

- High: broad blind replacement can corrupt secrets, opaque identifiers, generated lockfiles, historical evidence or command compatibility.
- High: GitHub/Vercel/DNS changes can sever deployments if Git linkage, root directory, env keys or domain verification are switched in the wrong order.
- High: plugin/package slug changes can break existing installations and marketplace discovery.
- Medium: the two repositories use different GitHub accounts and currently mix ShipGlows/ShipGlows; ownership/availability must be proven before remote renames.
- Medium: old URLs may redirect but embedded clone commands, OAuth callbacks, webhooks and third-party integrations still require explicit migration.
- Medium: the operator-exempt parent-folder names can cause naive scanners to report false failures; scans need a deliberate exception only for those two paths.

# Execution Notes

- Read first: this spec; both repository `README.md` files; site `README.md`; current `.vercel/project.json`; `git remote -v`; plugin manifests; environment/config inventories; Flutter runtime-boundary scripts; public content config.
- Run Task 1 before any write. Create a frozen baseline count and a path-aware manifest. Never use a global find/replace over binaries, lockfiles, `.git`, `node_modules`, `dist`, `.astro`, `.vercel` generated outputs or secret files.
- Apply local source/config changes first, by named namespace. Commit separately per repository before remote-provider operations so rollback is available.
- Before each provider mutation, export/read current configuration, validate target availability and capture the current production deployment/domain binding. Do not rotate secrets unless the provider requires it.
- The parent-directory exception applies only to the exact directory names, not their contents, documentation, shell variables or emitted labels.
- Fresh-docs checked for GitHub repository renaming and Vercel project settings; validate current registrar-specific instructions at execution time.
- Stop before Task 3 if domain DNS access is absent; before Task 4 if target repository names are occupied or admin access fails; before Task 5 if a configuration export or preview proof is unavailable.

# Open Questions

None. The operator explicitly chose ShipGlows, `shipglows.com`, universal active-identity replacement, and the two parent-directory exceptions. Provider availability and credentials are execution inputs, not product decisions.

# Skill Run History

| Timestamp (UTC) | Skill | Model | Action | Result | Next |
| --- | --- | --- | --- | --- | --- |
| 2026-08-02 20:24:00 UTC | 100-sg-spec | GPT-5 Codex | Created the fundamental ShipGlows identity-migration contract from the operator’s explicit naming and scope decision, local two-repository inventory, and current GitHub/Vercel documentation. | drafted | Review readiness before any rename or remote mutation |
| 2026-08-02 20:51:53 UTC | 101-sg-ready | GPT-5 Codex | Reviewed structure, migration boundaries, provider dependencies, rollback posture, proof contract, security risks and cross-system consequences; added explicit proof scenarios and immutable-history exception. | ready | Build the rename manifest before local or remote mutation |
| 2026-08-02 21:10:00 UTC | 102-sg-start | GPT-5 Codex | Renamed active local paths, identifiers and public content; renamed both GitHub repositories and local origins; configured `shipglows-site` on Vercel with `site/` root and `shipglows.com`; removed active residual legacy names. | implemented; final Git push and clean-clone/provider-trigger proof pending | Push migration commits, then verify remote heads and deployment trigger |

# Current Chantier Flow

`100-sg-spec` (completed) -> `101-sg-ready` (completed) -> `102-sg-start` (implemented) -> `103-sg-verify` (in progress) -> `104-sg-end` -> `005-sg-ship`
