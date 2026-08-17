---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.4.1"
project: "shipglows_app"
created: "2026-08-15"
created_at: "2026-08-15 19:09:04 UTC"
updated: "2026-08-16"
updated_at: "2026-08-16 13:26:33 UTC"
status: active
source_skill: "100-sg-spec"
source_model: "gpt-5.6-sol"
scope: "shipglows-visual-studio-and-laboratory-mvp"
owner: "Diane"
confidence: high
user_story: "As a ShipGlows operator, I want to edit the real rendered product visually, explore complex variants without generating source code, and compile only the accepted result into a safe reviewable patch."
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - "app/lib/shipglows/router.dart"
  - "app/lib/shipglows/presentation/screens/project_detail_screen.dart"
  - "app/lib/presentation/theme/app_theme.dart"
  - "site/src/components/Hero.astro"
  - "site/src/styles/global.css"
  - "runner/src/app.ts"
  - "runner/src/studio/session.ts"
  - "runner/src/studio/workerProvider.ts"
  - "runner/src/workspaces/index.ts"
  - "app/lib/shipglows/presentation/screens/studio_screen.dart"
  - "app/lib/shipglows/providers/studio_provider.dart"
  - "site/src/studio/heroContract.ts"
  - "shipglows_data/business/product.md"
  - "shipglows_data/technical/design-system-authority.md"
  - "shipglows_data/technical/managed-runner-foundation.md"
  - "shipglows_data/technical/operator-guides/studio-oci-worker.md"
  - "shipglows_data/technical/platforms/vercel.md"
  - "shipglows_data/workflow/explorations/2026-08-15-open-source-design-workflow-alternatives.md"
  - "shipglows_data/workflow/explorations/2026-08-15-penpot-visual-editor-architecture-study.md"
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "2.2.0"
    required_status: reviewed
  - artifact: "shipglows_data/technical/design-system-authority.md"
    artifact_version: "1.3.1"
    required_status: active
  - artifact: "shipglows_data/technical/managed-runner-foundation.md"
    artifact_version: "3.2.0"
    required_status: draft
  - artifact: "shipglows_data/workflow/explorations/2026-08-15-penpot-visual-editor-architecture-study.md"
    artifact_version: "1.0.1"
    required_status: draft
supersedes:
  - "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md@1.4.0"
  - "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md@1.3.1"
  - "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md@1.3.0"
  - "shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md@1.2.0"
evidence:
  - "Operator decision: ShipGlows has two product promises, safe agent/project control and visual creation of the real product with production-ready code output."
  - "Operator decision: Studio remains tied to the actual Astro or Flutter runtime instead of becoming an autonomous design-file authority."
  - "Operator decision: Laboratory activates when complexity crosses an explicit threshold and generates no source code until the operator accepts a variant."
  - "Static Penpot architecture study pinned to commit 59ef07633aae46450c7e8738ee8b1fd1bbd2ea86, used as prior art without copying code or assets."
  - "Official Flutter, Astro, Mozilla MPL, OWASP Top 10:2025, OWASP LLM Top 10:2025, and OWASP Agentic AI guidance checked on 2026-08-15."
  - "Readiness review corrected the runtime, attachment, ASVS, Atlas, performance, retry, and batching contracts but found no installed or selected sandbox capable of safely executing agent-generated worktree code."
  - "Operator approved a dedicated self-hosted Linux OCI worker as the sandbox direction for generated worktrees."
  - "Architecture review selected a ShipGlows-owned OCI provider contract backed in the MVP by containerd 2.x and gVisor runsc/Systrap, with separate generation and verification sandboxes and no host-process fallback."
  - "Operator decision on 2026-08-16 superseded the unprovisioned self-hosted containerd/gVisor worker with a provider-neutral managed-sandbox contract, managed microVM isolation as the primary direction, and Vercel Sandbox as the first adapter; the old decision remains historical evidence, not an implementation instruction."
  - "Official Vercel Sandbox product, GA, snapshot/persistence, network-policy, credential-injection, file-retrieval, duration, resource, port, and pricing/limit sources checked on 2026-08-16; they support adapter design but do not prove this account, project, private-preview boundary, quota, cost, or hostile-workload containment."
  - "Final Studio defect-fix proof on 2026-08-16: site 13/13 plus check/build/production exclusion; runner 35/35 plus typecheck/lint; Flutter 24 Studio plus five theme tests (29/29 combined) plus analyze/format."
  - "The final audit closed five bounded defects: exact bridge handshake, loop/revision ordering, atomic idempotency, separate 256 KiB bridge-envelope and 16 KiB command limits, and cleanup of late provider results after timeout."
  - "Live local evidence confirms the exact Studio profile and eight anchors at 127.0.0.1:3003, and the 127.0.0.1:3005 Studio route loads the Flutter bundle without browser console warnings; screenshot and semantics capture remain unavailable, so visual proof is pending."
  - "Full-suite evidence remains qualified: runner 144/146 with Windows symlink and line-ending failures; Flutter 213 passes then eight pre-existing source-reader/indexer and Cockpit-golden failures; the site full command reaches one pre-existing installer-parity failure."
  - "Provider-neutral managed-sandbox admission and account-free injected Vercel facade conformance passed independent local verification on 2026-08-16: 48/48 focused tests, 73/73 full Studio tests, typecheck, lint, diff check, and zero high-severity offline dependency-audit findings."
  - "No Vercel SDK/package, account, credential, provider/network call, production wiring, execution, preview, persistence, export, or availability proof exists."
next_step: "Obtain separate credential/cost authority and independently prove bounded real Vercel admission/probe/release before production wiring, compilation, or any availability claim."
---

# Spec: ShipGlows Visual Studio And Laboratory MVP

# Title

ShipGlows Visual Studio And Laboratory MVP

# Status

Implementation is in progress. The trusted first-party Astro preview, semantic bridge, Flutter Studio session UI, closed runner command journal, undo/redo, bounded variants, Laboratory policy, runtime/repository attestation, provider-neutral managed-sandbox admission/evidence contracts, and the account-free injected Vercel adapter facade are implemented and locally tested. Batches A-B are complete and independently verified locally; Batches C-D-E remain pending. The prior self-hosted containerd/gVisor worker direction is superseded before provisioning. No Vercel SDK/package, real provider call, account proof, credential use, cost-bearing run, production wiring, private-preview proof, generated execution, persistence, patch export, compiled reload, or hosted proof exists. Compile therefore remains admission-only and fail-closed, and no availability claim is permitted.

# User Story

As a ShipGlows operator working on an authorized project, I want to open the actual running product inside ShipGlows, select meaningful surfaces, try visual and behavioral changes without writing source files, compare variants in a Laboratory when the change becomes complex, and explicitly compile only the accepted variant into one isolated reviewable patch so that I can reach high-fidelity Astro and later Flutter output without wasteful code generation.

# Minimal Behavior Contract

Given an authorized project with a supported, explicitly instrumented Astro preview, opening Studio starts an isolated runtime from a pinned repository revision and displays that real runtime as the visual authority. Selecting an eligible surface exposes only supported semantic properties. Every edit remains a reversible preview command and does not change repository files. A hard complexity trigger moves the session into Laboratory; soft triggers recommend it. The operator may compare bounded variants and must explicitly choose `Compile to code` before ShipGlows creates one managed worktree patch from the accepted command journal. If authorization, source mapping, revision, protection, compilation, or post-compile proof fails, the canonical source remains unchanged and the session shows a recoverable bounded error. The easiest missed edge case is a source revision change during a long Laboratory session: compilation must report a conflict and must never rebase or overwrite silently.

# Success Behavior

## Operator-visible result

- Project detail exposes `Open Studio` only when the runner reports a supported target and the actor has the required project capability.
- Studio displays the actual Astro runtime, not a screenshot or reconstructed canvas.
- Hover and selection identify meaningful instrumented surfaces without turning every DOM node into a product surface.
- The inspector distinguishes resolved values, semantic token references, component ownership, responsive state, interaction state, capability support, source-mapping confidence, and protected dimensions.
- Visual commands update the preview with interaction-grade latency and remain reversible through undo/redo.
- Studio clearly states `No source changes` while the session contains preview-only commands.
- The Laboratory icon changes state with text, shape, and color cues; color is never the only signal.
- Laboratory stores up to eight named variants for the current session, compares them at representative viewports, and preserves the active accepted candidate.
- `Compile to code` summarizes affected surfaces, dimensions, expected files, protections, base revision, and required proof before starting the mutation.
- A successful compilation reloads the actual runtime from the isolated worktree, compares before/after evidence, and shows the generated patch for review.
- Commit, push, merge, deployment, baseline approval, and Gold/Diamond protection remain separate explicit actions.

## System result

- The server owns project identity, runtime command, repository path, worktree path, preview origin, source mapping, capability policy, limits, and cleanup.
- Preview commands use typed closed schemas and an immutable session/base revision.
- Continuous pointer events are compacted into semantic final commands before they enter the journal.
- A compile request freezes one accepted `CompileIntent`; retries use idempotency and cannot create concurrent duplicate compilation runs.
- The agent receives a bounded semantic intent and the minimum project context required to implement it, not arbitrary instructions extracted from rendered content.
- Generation and verification execute in separate fresh managed microVM sandboxes through a ShipGlows-owned provider port; no exact hypervisor, container runtime, or provider brand is part of the domain contract, and the runner host never executes generated source, build hooks, dependencies, or runtime output.
- Vercel Sandbox is the first adapter. Its real availability remains `unproved` until account-scoped authentication, isolation attestation, private-preview mediation, network policy, credential brokering, quotas, cleanup, bounded artifact export, and hostile fixtures pass without fallback.
- The generation sandbox receives only a single-job model-gateway capability brokered outside the guest, while the verification sandbox receives no model capability or provider credential and has outbound network denied.
- Post-compile evidence binds the patch, source/base revision, target revision, viewport/state matrix, and proof result.

# Error Behavior

| Condition | Required visible behavior | Required system behavior |
| --- | --- | --- |
| Unsupported or uninstrumented project | Explain that the project is view-only and name the missing capability | Do not infer source anchors or offer compilation |
| Preview runtime fails to start | Show a bounded start failure and retry action | Clean partial runtime resources; persist no secret/path-bearing error |
| Preview origin or session expires | Show reconnect/expired state without losing the last client-visible summary | Require a fresh authorized ticket; never reuse an expired capability |
| Surface has no unique source anchor | Mark mapping as ambiguous and activate Laboratory | Disable compilation for that surface until mapping is resolved |
| Unsupported property or target capability | Explain the unsupported dimension | Reject the command with no fallback to a different semantic operation |
| Protected dimension | Show the protection and required approval | Refuse compile preflight until the explicit project-side rule is satisfied |
| Repository revision changed | Show conflict and offer refresh into a new session | Preserve the old Lab session read-only; never overwrite, force, or auto-rebase |
| Compile generation fails | Keep the accepted variant and show a bounded failure | Remove or quarantine the failed worktree according to cleanup policy |
| Managed sandbox provider is unconfigured, unavailable, incompatible, over quota, cost-blocked, or cannot prove the required isolation capabilities | Show compilation temporarily unavailable while preserving the accepted variant and a safe reason code | Start no sandbox and never fall back to runner-host execution or another unproved provider |
| Provider preview URL cannot be proved private to the authenticated ShipGlows session | Show private preview unavailable; retain the accepted variant and proof plan | Expose no provider URL or port to Flutter; stop or clean the sandbox and require a proved provider-native or runner-mediated ingress boundary |
| Snapshot, persistence, or resume state is missing, stale, cross-tenant, or outside retention policy | Show the session as interrupted or expired with explicit recovery | Reject restore, revoke capabilities, delete or quarantine the snapshot, and never resume from ambiguous state |
| Provider cleanup or lifecycle reconciliation fails | Show a bounded cleanup-pending state with no verified claim | Quarantine the job, revoke its capabilities, deny identifier/snapshot reuse, and alert the operator without exposing project content |
| Patch or evidence export is oversized, malformed, truncated, or digest-mismatched | Preserve the accepted variant and show export verification failed | Reject the artifact, clean or quarantine provider state, produce no runner-side worktree mutation, and never label the run compiled or verified |
| Post-compile proof fails | Show the mismatched viewports/states and return to Laboratory | Do not mark verified or update a baseline |
| Connection drops during preview | Show reconnecting then interrupted | Reconcile by session revision; reject duplicated/out-of-order commands |
| Session reaches a limit | Explain the exact limit and safest recovery | Fail closed; compact or require a new variant/session without truncating silently |

# Problem

High-end generated images communicate art direction but do not encode responsive layout, component identity, content states, interaction, motion, accessibility, performance, or platform adaptation. Current attempts to translate those images directly into Astro have produced poor fidelity and repeated manual correction.

Traditional design-file workflows create a second authority that can drift from the repository. Code generation after every visual attempt wastes model calls, produces noisy patches, and makes it difficult to distinguish exploration from accepted product intent. Existing visual builders are either tied to another SaaS, to React-specific architectures, to their own document model, or to an exported site rather than ShipGlows-owned Astro and Flutter components.

# Solution

ShipGlows adds a code-first Visual Studio to the existing Flutter control plane. Studio projects a typed editable surface graph over the real target runtime. A separate Laboratory retains complex experiments, variants, commands, and evidence without writing source. Only an explicit accepted `CompileIntent` crosses the mutation boundary and enters the existing managed-runner, isolated-worktree, agent, approval, and proof architecture.

Penpot contributes architectural lessons only: stable identities, typed reversible changes, temporary modifiers, spatial selection, semantic layout intent, grouped overrides, selective invalidation, revision control, and invariant tests. ShipGlows does not use Penpot as a runtime dependency, design authority, renderer, file format, or source-code donor.

# Product Decision And Critical Moments

## Decision chain

- Decision ID: `product.shipglows.visual-studio-laboratory`
- State: `confirmed`
- Upstream goal: make sophisticated software creation faster and more faithful while preserving operator control and repository safety.
- Customer need: move from ambitious visual direction to maintainable real product code without becoming an expert in an external design SaaS or paying for repeated failed generations.
- Before: ShipGlows is a visual control plane for project health, agent conversations, approvals, and an advanced operator workspace.
- After: ShipGlows retains that control plane and adds a planned second promise: visually create and edit the actual product, then compile only an accepted result.
- Preserved invariants: repository authority, explicit approval, isolated mutation, no automatic push/merge/deploy, provider neutrality, evidence-backed states, and hidden server paths/credentials.

## Sandbox decision change

- Decision state: `confirmed`; previous self-hosted OCI decision state: `superseded`.
- Trigger: the operator replaced the unprovisioned self-hosted containerd/gVisor worker direction with managed sandbox infrastructure to reduce operational burden while preserving isolation and portability.
- Before: one ShipGlows-operated Linux worker, containerd 2.x, and gVisor `runsc`/Systrap were mandatory implementation brands.
- After: the contract admits only providers that attest the required isolation, lifecycle, ingress, egress, credential, quota, persistence, cleanup, and export capabilities. Managed microVMs are the primary deployment class, and Vercel Sandbox is the first adapter and proof target.
- Direct consequences: replace runtime-brand admission with capability attestation; add a Vercel adapter behind the existing runner boundary; make provider account, cost, and real-workload proof explicit gates; keep provider URLs, credentials, raw events, and guest filesystem paths out of Flutter.
- Dependent review: managed-runner foundation, worker operator guide, project-local Vercel usage note, code-docs map, public capability copy, incident/retention guidance, and any pricing statement must be reconciled from actual implementation and provider evidence.
- Preserved invariants: generation and verification remain fresh and separated; verification has no model credential or egress; no generated code executes on the runner host; no fallback, commit, push, deploy, or availability claim is implied.

## Critical moments

| Moment | Trigger | Visible result | Desired emotion | Failure/recovery | Success signal |
| --- | --- | --- | --- | --- | --- |
| First useful result | Open Studio on the pilot project | The real hero loads and selectable surfaces highlight | Recognition and confidence | Unsupported mapping becomes explicit view-only mode | First surface selected with a source anchor and supported properties |
| Creative freedom | Change a visual property | The real preview changes immediately and says `No source changes` | Freedom without fear | Undo restores the prior preview deterministically | Multiple commands applied with zero repository diff |
| Complexity transition | Structural, responsive, protected, motion, or 3D intent appears | Laboratory icon activates and explains why | Guidance, not interruption | Operator can inspect triggers and preserve the current variant | Correct Lab state and retained command journal |
| Trust decision | Choose `Compile to code` | A concise impact/protection/proof summary appears | Control | Cancel returns to the unchanged Lab session | One accepted intent freezes against the base revision |
| Proof and recovery | Compilation completes or fails | Real target reload plus before/after evidence, or a bounded recoverable failure | Confidence, never uncertainty | Failed proof returns to Lab with source authority preserved | Patch is reviewable and every required viewport/state passes |

# Product And Platform Footprint

## MVP platform

- Control surface: Flutter Web inside the existing `shipglows_app` product.
- Target runtime: the existing ShipGlows Astro site under `site/`, initially bounded to `site/src/components/Hero.astro`, plus the separately allowlisted GoCharbon Astro homepage Hero portability pilot under `site/src/pages/index.astro`; each profile retains its own exact origin, repository root, revision/digest, surfaces, and source path.
- Full precision editing: expanded desktop viewport first.
- Compact Flutter viewport: session status, variant comparison, approval, failure, and proof review; no precision canvas promise in MVP.
- Windows, Android, iPhone/iPad, and Flutter-target preview adapters remain compatible future consumers of the same domain contracts, not MVP delivery claims.
- Native iOS build/sign/test remains a future macOS boundary. Codemagic may serve as that later hosted macOS build adapter, but it is outside this Astro-first managed-sandbox MVP and receives no present availability, credential, cost, or integration claim.

## Atlas impact

The canonical `shipglows_data/workflow/atlas/approved-surfaces.json` now maps these Studio IDs and the first implementation paths. All assessments remain `unknown` with no automatic protection:

- surfaces: `project.studio`, `project.studio.preview`, `project.studio.inspector`, `project.studio.laboratory`;
- functions: `studio.open`, `studio.select-surface`, `studio.preview-command`, `studio.manage-variant`, `studio.compile-variant`, `studio.verify-compile`.

These IDs describe meaningful operator outcomes, not DOM wrappers, handles, panels, or individual source nodes.

# Experience And State Contract

## Primary composition

- Project detail owns the entry action and current Studio capability summary.
- Top bar owns project/target identity, viewport/state selector, connection state, undo/redo, Laboratory status, and `Compile to code`.
- Center owns the real target preview plus a ShipGlows overlay for selection, guides, bounds, focus, and proof markers.
- Left rail owns meaningful surface hierarchy and named variants; it does not expose a raw DOM tree by default.
- Right inspector owns source confidence, component/token/layout intent, responsive state, protected dimensions, and supported controls.
- Bottom region appears only when the accepted intent needs comparison, motion, state transitions, or evidence; an empty permanent timeline is forbidden.

All Flutter visuals consume `AppTheme`, `AppThemePalette`, and `AppThemeTokens`. New Studio spacing, overlay, icon-state, responsive, focus, and motion values must become named semantic tokens before screen consumption.

## State machine

```text
unavailable
  -> starting
  -> ready
       -> previewing
       -> laboratory
            -> compiling
            -> verifying
            -> verified
       -> conflict
       -> interrupted
       -> failed
  -> closed
```

- `ready` and `previewing` never imply source mutation.
- `laboratory` may contain several variants but exactly one active candidate.
- `compiling` freezes the accepted intent; new edits create a later variant rather than changing the in-flight intent.
- `verified` applies only to the isolated worktree result and does not imply commit, push, merge, deploy, or baseline approval.
- `conflict`, `interrupted`, and `failed` preserve a bounded recoverable session summary and never become `verified` through fallback.

## Laboratory policy v1

Laboratory is mandatory when any hard trigger is true:

- source anchor is missing, ambiguous, stale, or below the accepted confidence threshold;
- node creation, deletion, reparenting, component-boundary change, or other structural edit is requested;
- a shared component master or protected/shared dependency is affected;
- more than one breakpoint, interaction state, or target platform is affected;
- a timeline, state machine, continuous scroll/pointer effect, 3D scene, or interactive media behavior is introduced;
- a protected dimension requires approval;
- the base revision or target capability matrix has changed.

Laboratory is recommended when at least two soft triggers are true:

- more than three meaningful surfaces are affected;
- more than five dependent property commands remain after compaction;
- the predicted patch spans more than one source file;
- the visual delta is large or responsive propagation is uncertain;
- Astro and Flutter require intentional target-specific adaptations.

The operator may enter Laboratory manually at any time. A hard trigger cannot be bypassed; resolving its cause may return a session to ordinary preview.

## Laboratory icon states

| State | Visual/semantic signal | Meaning |
| --- | --- | --- |
| Studio | neutral outline plus `Studio` label/tooltip | Preview-only editing below the complexity threshold |
| Recommended | amber halo plus `Laboratory recommended` | Soft threshold reached; current work is still preserved |
| Active | solid violet shape plus `Laboratory active` | Variants and complex intent are isolated from source |
| Compiling | blue progress treatment plus live text | One frozen intent is producing an isolated patch |
| Verified | green check plus `Verified in worktree` | Required evidence passed for the patch only |
| Conflict/error | red badge plus explicit text | Revision, protection, capability, compile, or proof failure |

# Data Contracts

## `StudioNode`

| Field | Contract |
| --- | --- |
| `surfaceId` | Stable Atlas surface ID when available; meaningful project surface, never arbitrary DOM identity |
| `runtimeNodeId` | Opaque session-scoped ID; cannot authorize source access |
| `sourceAnchor` | Project-relative file/symbol/range or adapter-owned equivalent plus confidence and revision |
| `target` | `astro` in MVP; future target identifiers are versioned capabilities |
| `parentId`, `order` | Derived surface hierarchy and stable sibling order |
| `bounds`, `transform` | Runtime geometry in preview coordinates; never persisted as layout intent by itself |
| `layoutIntent` | Semantic flex/grid/flow/absolute/constraint meaning and responsive ownership |
| `tokens` | Token references and resolved preview values kept as separate fields |
| `component` | Optional component/master/instance identity and grouped override state |
| `state` | Viewport, interaction, theme, content-fixture, and reduced-motion state |
| `capabilities` | Closed list of editable semantic properties/actions for the active adapter |
| `protection` | Copy, Design, Structure, Function, Motion, Accessibility, and Performance impact/protection summary |
| `revision` | Session projection revision used for ordering and conflict detection |

## `VisualCommand`

- versioned command type and bounded typed parameters;
- inverse command or deterministic pre-command snapshot reference;
- affected node IDs and dimensions;
- operator/agent provenance without credentials or raw prompt data;
- monotonic session revision and idempotency key;
- `previewOnly: true` until included in an accepted compile intent;
- capability and protection preconditions;
- compaction key for continuous or repeated scalar edits.

The MVP command family is limited to semantic token/value changes, supported typography/color/spacing/radius/opacity changes, layout ordering within an already instrumented container, bounded transforms, visibility/state toggles, and the pilot motion parameters. Arbitrary JavaScript, CSS text, shell commands, file paths, selectors supplied by the client, prompts, or source snippets are invalid command parameters.

## `LabSession`

- opaque tenant/project/actor-scoped session ID;
- immutable source commit, repository digest, adapter version, and capability matrix;
- preview target, viewport/state matrix, and content fixture identity;
- compacted command journal and undo/redo cursor;
- zero to eight named variants and exactly one active candidate;
- hard/soft triggers with human-readable reasons;
- monotonic state and conflict/interruption reason;
- server-owned idle/absolute expiry and cleanup state.

MVP Laboratory content is ephemeral. It lives in runner memory and an isolated temporary session directory, not in the operational SQLite projection. The session expires after 30 minutes idle or four hours absolute duration; temporary content is removed at close or within a 24-hour cleanup grace. SQLite may retain only bounded opaque lifecycle, usage, and failure metadata that satisfies the existing secret-safety contract. Runner restart may interrupt the draft session and must say so visibly.

## `CompileIntent`

- accepted variant ID and frozen command revision;
- source/base commit and expected adapter/capability versions;
- affected surfaces, semantic dimensions, invariants, and protection decisions;
- predicted project-relative impact paths without server filesystem paths;
- target-specific requirements and unsupported intent decisions;
- required viewport/state/evidence matrix;
- explicit operator action, actor ID, idempotency key, and creation time;
- immutable status from preflight through one terminal result.

## `RenderEvidence`

- compile run ID, source/base commit, generated target revision, and patch digest;
- before/after capture references for each required viewport/theme/state;
- bounded visual difference regions and intentional-change map;
- semantics, keyboard/focus, contrast, reduced-motion, console/runtime, and performance results;
- proof verdict with failures never coerced into success;
- cleanup/retention state and rollback target.

Raw screenshots and customer content remain ephemeral in MVP. Persisted evidence contains hashes, bounded summaries, and approved repository-relative proof references only.

## `StudioTargetProfile`

The runner owns a versioned `StudioTargetProfile`; the client receives only its safe capability projection. The supported pilot profile IDs are `shipglows.astro.hero.v1` and `gocharbon.astro.hero.v1`, selected by a closed server-side project allowlist, and each binds:

- the authorized project and exact source revision;
- the project-relative target root `site/`, pilot route/fixture IDs, adapter version, and six-to-ten semantic surfaces;
- the pinned package manager and runtime versions already declared by the project;
- server-owned dependency preflight, start, health, build, test, and proof operations, with no client-supplied executable, argument, environment key, host, port, path, or URL; any dependency bootstrap is a separate approved environment action and can never be triggered by a Studio session;
- loopback-only process binding, a runner-assigned private port, a per-session isolated browser origin, strict allowed origins/CSP/frame policy, and a production-exclusion assertion;
- resource, network, expiry, cleanup, and expected-impact policies;
- an allowlist of project-relative source roots and deterministic content/state fixtures.

Capability discovery fails closed when the profile, revision, dependency lock, adapter, runtime version, isolation provider, or proof operations do not match. The profile is project configuration, not data inferred from page content or submitted by Flutter.

## `PreviewRuntimeProvider`

Long-lived target preview is governed by a dedicated server-side port with `preflight`, `start`, `health`, `interrupt`, `stop`, and `cleanup` lifecycle operations. It is distinct from the current execution-admission `ExecutionProvider`, which does not launch or sandbox a runtime and therefore cannot by itself satisfy this contract.

The MVP may use a local development provider only to render the pinned, reviewed base revision of the first-party `shipglows_app/site` or `gocharbon/site` pilot after verifying the selected closed profile and its separately configured repository identity. That provider runs without runner/provider credentials, exposes only the profile's exact loopback port to the reverse proxy, receives a minimal environment allowlist, accesses only the approved base worktree and temporary session directory, denies outbound network throughout the live session, and enforces process-count, memory, CPU, duration, output, cancellation, and cleanup limits.

Arbitrary/customer-controlled repositories and every agent-generated worktree remain non-executable until a managed provider proves OS-level filesystem, process, secret, ingress, egress, cross-job, and lifecycle isolation. Generated code is untrusted even when its base repository is first-party. A missing, degraded, unproved, over-quota, or cost-blocked capability blocks compilation/post-compile rendering and returns an explicit unavailable state; it never falls back to launching generated or customer code on the runner host.

## Managed sandbox capability contract

ShipGlows owns a provider-neutral `ManagedSandboxProvider` port. Domain and API contracts ask for evidence-backed capabilities, never a provider brand, hypervisor, container runtime, region, image name, public hostname, or provider filesystem path. A provider can be selected only when its versioned attestation proves:

- `isolation`: one job/phase receives a separate managed microVM or an independently justified equivalent hardware-virtualized boundary; no host filesystem, runtime socket, host device, runner environment, or cross-job state is reachable;
- `lifecycle`: create, health, bounded command execution, interrupt/kill, stop, delete, timeout, orphan listing, and reconciliation are idempotent and observable;
- `sourceIn`: the runner uploads only a bounded content-addressed source archive or approved immutable snapshot; no runner-host bind mount exists;
- `artifactOut`: the runner retrieves only a size-limited patch archive and digest-bound structured evidence, verifies manifest/path/content/digest limits before applying anything to its worktree, and treats truncation or ambiguity as failure;
- `network`: creation starts deny-all or reaches deny-all before untrusted execution; generation may reach only the brokered model gateway, verification reaches nothing, and policy changes are auditable and fail closed;
- `credentials`: provider authentication remains in the runner/provider control plane and model credentials are injected or proxied outside the guest; raw long-lived credentials never enter guest environment, files, command arguments, logs, snapshots, or artifacts;
- `privatePreview`: preview ingress is provider-native private or runner-mediated, tenant/session authenticated, exact-origin bound, and unavailable to an unauthenticated request; raw provider URLs and ports never reach Flutter or durable logs;
- `persistence`: persistence is explicit per purpose, tenant/project/job scoped, encrypted according to provider guarantees, retention bounded, and deletable; compile sandboxes default to non-persistent and cannot resume after a terminal result;
- `snapshots`: only an approved toolchain/base snapshot may be reused across jobs; it contains no customer source, prompt, credential, patch, evidence, or runtime state and is bound to provider, toolchain, policy, provenance, expiry, and digest;
- `quotas`: CPU, memory, process, disk, duration, output, ports, concurrent jobs, provider API rate, model tokens/cost, and transfer cost are preflighted against ShipGlows policy before creation;
- `cleanup`: terminal completion, cancellation, timeout, runner loss, and provider outage trigger stop/delete plus snapshot/artifact revocation; uncertainty quarantines the job and blocks identifier or data reuse.

Capability attestation records the adapter and SDK/API version, account/project scope, observed provider configuration, tested scenarios, evidence time, expiry/invalidation conditions, and result. Marketing documentation or a provider's runtime-brand statement is supporting evidence only; it cannot replace a real ShipGlows account-scoped probe and hostile-workload proof.

## Vercel Sandbox first adapter

`VercelSandboxProvider` is the first implementation target. Current official Vercel sources describe on-demand Linux microVMs backed by Firecracker, network allow/deny policies, firewall-level outbound header injection, filesystem snapshots and named persistence, bounded timeouts/resources, exposed-port domains, stop operations, and SDK file retrieval. Those features make Vercel the primary adapter candidate; they do not prove ShipGlows configuration, private ingress, retention deletion, cost ceilings, artifact integrity, or hostile-workload containment.

Each compile identity uses two distinct fresh Vercel sandboxes created with customer-data persistence disabled:

1. **Generation sandbox:** starts from the approved toolchain snapshot or pinned OCI source, receives the frozen semantic intent and bounded source archive, and may reach only the authenticated model gateway through a deny-by-default policy with credential brokering outside the guest. It receives no raw provider or model credential.
2. **Verification sandbox:** starts independently from the same approved toolchain base plus the base source and validated candidate patch. It receives no generation snapshot/state, model capability, provider credential, runner credential, or outbound network. It performs locked build, tests, real-runtime render, capture, accessibility, console, and performance proof.

The adapter exposes no Vercel sandbox domain directly. For interactive preview it must route the provider port behind the existing authenticated runner/reverse-proxy attachment contract or prove an equivalent provider-native private ingress; an externally reachable provider URL without independent unauthenticated-denial proof is not an MVP private preview and keeps compilation unavailable.

Snapshots optimize only the approved toolchain/base. Automatic persistence is disabled for generation and verification because provider defaults may preserve filesystem state. Preview/Laboratory resume remains runner-owned and ephemeral in this MVP; provider-backed customer-workspace persistence is a future opt-in contract requiring retention, deletion, encryption, cost, and tenant-isolation proof.

The runner exports source into the sandbox through bounded file APIs, asks the sandbox to produce a canonical patch bundle plus manifest, retrieves it through bounded SDK file APIs, and verifies size, allowed project-relative paths, symlink/device absence, entry count, digest, and patch applicability before creating or updating any runner-side worktree. Raw guest archives, logs, screenshots, and provider events are never shown to Flutter or persisted as safe diagnostics.

No Vercel credential is used and no real or cost-bearing sandbox is created by this specification run. The real-provider batch cannot start until the operator separately authorizes account/credential use and the applicable spend ceiling. No implemented, hosted, verified, available, pricing, or reliability claim is allowed until that batch produces account-scoped evidence and independent verification.

# Astro Preview Adapter Contract

## Enablement

Two explicit first-party Astro pilots are allowlisted: ShipGlows `site/src/components/Hero.astro` and GoCharbon's homepage Hero in `site/src/pages/index.astro`. Each exposes exactly eight stable semantic surfaces through a development-only bridge; GoCharbon's second pilot exists only to validate portability and does not expand the supported profile set. Starting or editing a Studio session does not modify either integration or any source file. No capability response may generalize either approval to a different repository, project, route, component, origin, or revision.

The adapter must:

- run only in the development/Studio environment and be absent from production output;
- expose stable meaningful surfaces, source confidence, computed semantic properties, layout intent, and capability metadata;
- communicate through a versioned origin-checked message schema;
- apply only typed temporary overrides and reversible DOM operations allowed by the capability matrix;
- distinguish token reference from resolved value;
- support representative desktop, intermediate, and mobile viewports plus light/dark and reduced-motion state where the pilot uses them;
- refuse to claim an exact source anchor when one cannot be proven.

## Real-runtime rule

The target Astro dev server renders the center preview. ShipGlows may overlay selection and inject temporary development-only overrides, but it may not replace the preview with a reconstructed Flutter canvas or screenshot editor. After compilation, a proved sandboxed provider must restart the preview from the isolated generated worktree and clear all temporary overrides before proof. Without that provider, the patch may remain reviewable but cannot be executed, verified, or presented as the completed MVP loop.

## Performance budgets

The pilot uses deterministic local measurement after warm-up, with the same machine, browser, viewport, fixture, and build on both sides of a comparison:

- a scalar preview command is applied and acknowledged at p95 <= 100 ms over at least 50 representative commands;
- selection/overlay updates maintain p95 frame time <= 20 ms during a five-second pointer and keyboard trace, with no task longer than 50 ms attributable to Studio code;
- undo, redo, variant selection, and Laboratory trigger evaluation complete at p95 <= 50 ms for the maximum bounded journal;
- an already-installed preview reaches healthy state within 15 seconds or fails with an explicit timeout and cleanup state;
- the production Astro build contains zero Studio bridge bytes, endpoints, global symbols, or debug toolbar registration;
- the compiled target introduces no unexplained >10% regression in the fixed before/after runtime trace and keeps cumulative layout shift <= 0.1; an intentionally accepted performance trade-off must be named in the frozen intent and still pass accessibility and source-quality gates.

Compile/build duration is reported separately and never disguised as interaction latency. A slower or resource-constrained environment may record an informational baseline, but it cannot claim the measurable MVP performance acceptance without the fixed-profile proof above.

# Runner And API Contract

The endpoint family is versioned beneath the existing authenticated project boundary:

- `GET /v1/projects/:projectId/studio/capability`
- `POST /v1/projects/:projectId/studio-sessions`
- `GET /v1/projects/:projectId/studio-sessions/:sessionId`
- `GET /v1/projects/:projectId/studio-sessions/:sessionId/events`
- `POST /v1/projects/:projectId/studio-sessions/:sessionId/commands`
- `POST /v1/projects/:projectId/studio-sessions/:sessionId/variants`
- `POST /v1/projects/:projectId/studio-sessions/:sessionId/compile-intents`
- `POST /v1/projects/:projectId/studio-sessions/:sessionId/interrupt`
- `DELETE /v1/projects/:projectId/studio-sessions/:sessionId`

Every route resolves actor, tenant, project, capability, source revision, and session ownership server-side. State-changing requests require trusted Origin policy and durable idempotency. The client cannot select repository path, command, port, host, branch, worktree, runtime executable, agent provider, prompt, or proof bypass.

The iframe URL contains only a non-authorizing preview origin and opaque channel handle. A one-time attachment secret is sent only in an authenticated POST body or header to bind that channel server-side; it never appears in a URL, query string, fragment, browser history, redirect, referrer, log, target DOM, or target-runtime message. The browser bridge receives only the resulting bounded channel capability. The actual runtime process and bridge channel remain private behind the runner/reverse-proxy boundary.

Default MVP limits are server-owned and returned in the capability response: 256 projected Studio nodes, 128 compacted commands per variant, eight variants, three viewport profiles, one compile run per session, 16 KiB per semantic command, 256 KiB for the complete bridge message, 30 minutes idle, and four hours absolute session duration. Exceeding a limit fails explicitly; it never truncates source, intent, evidence, or history silently.

# Compile Boundary

`Compile to code` authorizes one local isolated patch attempt for the frozen intent. It does not authorize commit, push, merge, deployment, dependency installation outside the accepted implementation, protection renewal, or baseline approval.

One session owns at most one compile run identity. Replaying the same request and idempotency key returns that run; a changed payload is rejected. After any terminal compile result, including interruption or failure, another generation attempt requires a new Studio session rebased explicitly from the current authorized revision. The accepted Laboratory variant remains available only as a bounded read-only summary for deliberate transfer; no retry silently widens or refreshes its authority.

The compile coordinator must:

1. revalidate actor/project capability, base revision, source anchors, protections, target support, limits, and idempotency;
2. compact the accepted command journal into semantic intent;
3. create a server-owned isolated worktree from the exact base commit and export a bounded content-addressed source snapshot without a host bind mount;
4. select an attested managed provider, reserve the required account/project quota and cost budget, create a fresh non-persistent generation sandbox, and upload only the bounded snapshot, typed intent, and single-job brokered model-gateway capability, treating all project text and rendered content as untrusted data;
5. constrain predicted impact paths but allow the agent to report a necessary scope conflict instead of silently editing outside them;
6. retrieve the bounded patch bundle, verify its manifest, paths, size, entry types, digest, and applicability before applying it to the runner-owned worktree, then start a distinct fresh non-persistent verification sandbox with no model capability, credential, generation state, or outbound network;
7. build and render the real target without the temporary override layer, expose its preview only through the proved private-ingress boundary, run the required proof matrix, and bind the evidence to source, toolchain snapshot, adapter, provider attestation, patch, and policy digests;
8. retain only the reviewable runner-side worktree and bounded evidence required by policy; revoke capabilities and stop/delete or quarantine all managed sandbox, snapshot, port, and artifact resources through reconciliation.

If the required implementation scope materially exceeds the frozen intent, the run stops and returns to Laboratory with an impact explanation. It does not expand authority automatically.

# Scope In

- `Open Studio` entry from one authorized project detail.
- Flutter Web full Studio shell at expanded widths.
- One instrumented Astro hero with six to ten meaningful surfaces.
- One desktop and one mobile composition, plus an intermediate proof width.
- Actual-runtime selection overlay and semantic inspector.
- Temporary color, typography, spacing, radius, opacity, ordering, transform, visibility, and bounded pilot-motion edits.
- Reversible command journal, compaction, undo/redo, and up to eight variants.
- Hard and soft Laboratory threshold with accessible icon states.
- Explicit compile preflight and one isolated code-generation attempt.
- One real post-compile reload and before/after proof matrix.
- One provider-neutral managed-sandbox port plus a first Vercel Sandbox adapter with separate fresh generation and verification microVM sandboxes.
- Immutable toolchain snapshots, explicit non-persistence for customer compile phases, private-preview mediation, deny-by-default network policy, credential brokering, quotas/cost preflight, cleanup/reconciliation, and bounded patch export.
- Source/protection/revision/capability conflicts and cleanup.
- Domain contracts that future Flutter/mobile/3D adapters can implement without changing the source-authority model.

# Scope Out

- A Penpot fork, plugin, dependency, renderer, design-file format, code translation, or asset reuse.
- General-purpose vector drawing, illustration, photo editing, or 3D modelling.
- Zero-configuration source mapping for arbitrary Astro repositories.
- Preview or execution of arbitrary/customer-controlled repositories without a separately proven sandboxed `PreviewRuntimeProvider`.
- Host execution of agent-generated source, build hooks, dependencies, or runtime output without that sandboxed provider.
- A self-hosted containerd/gVisor worker, Kubernetes, a general customer container service, client-selected providers/images/runtimes, public-registry access during jobs, or direct access from Flutter/project code to provider control planes.
- Full production animation timeline, state-machine editor, shader graph, or 3D scene editor.
- Flutter-target runtime adapter, Android/iOS precision editor, and native mobile delivery in the MVP.
- Codemagic integration and any macOS/iOS build, signing, notarization, simulator, or App Store workflow; these remain a future native-build boundary.
- Multi-user realtime collaboration, comments, cursors, or shared Laboratory editing.
- Persistent customer screenshots, raw rendered content, or Laboratory drafts in SQLite.
- Automatic commit, push, merge, deployment, production mutation, or baseline approval.
- Importing a flat image and claiming automatic pixel-perfect production conversion.
- Public Awwwards-winning, fidelity, performance, accessibility, or platform-parity claims without representative proof.

# Constraints

- Repository source remains canonical; the Studio graph and Laboratory are derived operational projections.
- No experiment command may write project source before an explicit compile intent.
- The actual target runtime owns visual truth before and after compilation.
- Semantic layout intent outranks absolute coordinates unless absolute placement is deliberate and supported.
- Project/runtime content is untrusted and cannot become an instruction, path, selector authority, prompt policy, or executable command.
- The Flutter app consumes bounded typed data and never executes customer project code in its own isolate.
- All preview and mutation execution remains runner-owned, tenant/project scoped, isolated, resource bounded, and secret safe.
- The trusted local preview exception is limited to the two pinned first-party `shipglows_app/site` and `gocharbon/site` profiles; it is not a customer-preview architecture or production isolation claim.
- The trusted local exception ends at the reviewed base revision; agent-generated worktrees are always untrusted executable input.
- The managed provider remains a separate failure and administrative domain; co-locating generated execution with the primary runner does not satisfy the MVP contract.
- Generation and verification never share a sandbox, credential, mutable volume, process namespace, or reusable attachment capability.
- Provider brand or runtime marketing does not satisfy admission; a current account-scoped capability attestation and hostile proof do.
- Compile sandboxes are non-persistent by default; cross-job snapshots contain approved toolchains only and never customer data.
- Any provider port is treated as public until unauthenticated denial and runner-mediated/private ingress are proved.
- Quota or cost uncertainty fails before sandbox creation; it never becomes an unbounded provider call.
- Sensitive session or attachment material never appears in URLs, fragments, referrers, browser history, target DOM, target messages, or safe diagnostics.
- Existing design-system authority owns all ShipGlows UI values; target-project tokens remain target-project authority.
- Target-specific capability differences are explicit; no silent lowest-common-denominator conversion.
- Motion must preserve reduced motion; ambition cannot weaken accessibility, semantics, performance, or maintainability.
- Penpot-derived learning remains at the level of behavior, invariants, and independently implemented algorithms.

# Dependencies

- Current managed-runner authentication, project authorization, worktree manager, `AgentRuntime`, idempotency, cleanup, redaction, and event projection.
- A new `PreviewRuntimeProvider` lifecycle and server-owned `StudioTargetProfile`; the existing admission-only provider is insufficient until explicitly extended and proved.
- A provider-neutral `ManagedSandboxProvider` port and first `VercelSandboxProvider` adapter implementing versioned isolation attestation, account/project authentication, toolchain snapshots, non-persistent compile phases, private ingress, network and credential brokering, quotas/cost ceilings, lifecycle reconciliation, and bounded patch export.
- A separately approved Vercel account/project credential and spend ceiling before the first real provider proof; fake adapter and contract work require neither.
- An internal model gateway able to issue and revoke one-job, cost-bounded capabilities without placing raw provider credentials in a sandbox.
- Current Flutter `GoRouter`, Riverpod composition, project detail, theme/tokens, authenticated runner client, and responsive shell.
- The ShipGlows and GoCharbon Astro projects, each explicitly instrumented around its allowlisted Hero source path with eight stable semantic anchors and a production-excluded bridge.
- Surface Protection/Atlas contracts from ShipGlows Core, adopted project-locally before protected production use.
- Current official Flutter and Astro embedding/runtime behavior documented in the linked Penpot architecture study.
- Current OWASP web, LLM, and agentic risk guidance for the privileged compile boundary.

# Invariants

- `previewing` and `laboratory` produce zero repository diff.
- A compile intent is immutable, actor/project scoped, base-revision bound, and idempotent.
- A conflict never triggers silent rebase, overwrite, force, or broader source mutation.
- The source mapping confidence is visible; ambiguous mapping cannot compile.
- Surface IDs represent operator-meaningful product boundaries, not DOM implementation sprawl.
- Undo/redo round-trips the preview command journal without touching source.
- Preview overrides are removed before post-compile proof.
- `verified` means proof passed in the isolated worktree only.
- A preview ticket, runtime node ID, session ID, screenshot reference, or source anchor is not authorization.
- Client-controlled content cannot choose commands, paths, runtimes, providers, prompts, or proof policy.
- Raw screenshots, source content, prompts, secrets, and server paths are not stored in SQLite or emitted in safe diagnostics.
- Generated code and its dependencies never execute on the runner host; verification is performed in a new managed sandbox that cannot access the model gateway.
- A provider sandbox ID, runtime brand, snapshot ID, port domain, or job ID is bookkeeping, not authorization, isolation proof, or a tenant security boundary.
- No provider can become `available` from documentation, fake tests, SDK success, or one happy-path run; the full real-provider evidence matrix is mandatory.
- Unsupported Astro/Flutter capability differences are explicit and testable.
- ShipGlows UI visual literals do not bypass `AppThemeTokens`.
- Penpot code and assets never enter the product without a separate explicit licence review and approved scope change.

# OWASP Security Gate

## Web application lens

- A01 Broken Access Control: every session, command, variant, compile, event stream, and cleanup action rechecks tenant/project/actor ownership server-side.
- A02 Security Misconfiguration: preview runtimes use isolated origins, private authenticated ingress, closed schemas, explicit allowed origins, bounded CSP/sandbox configuration, and no production debug bridge; managed jobs deny host resources and network by default, disable customer-data persistence, and apply explicit resource/cost limits.
- A03 Software Supply Chain Failures: the pilot uses locked project dependencies and digest-bound approved toolchain snapshots or images with provenance, SBOM/vulnerability policy, expiry, and rotation; Studio enablement, adapter/SDK changes, snapshot rotation, and any new embedding package require dependency review and audit.
- A05 Injection: DOM text, source text, CSS values, URLs, project metadata, and agent output are untrusted; typed allowlisted operations replace raw CSS/JS/shell/prompt input.
- A06 Insecure Design: preview and compile permissions are separate; limits, conflicts, replay, cancellation, cleanup, and proof failure are explicit.
- A08 Software or Data Integrity Failures: base revision, patch digest, adapter version, event order, idempotency, and evidence bindings protect state transitions.
- A09 Security Logging and Alerting Failures: bounded lifecycle and denial events are logged without project content, secrets, screenshots, prompts, or server paths.
- A10 Mishandling of Exceptional Conditions: timeout, disconnect, partial runtime start, stale revision, compile interruption, cleanup failure, and proof failure all fail closed.
- A04/A07 remain governed by the existing managed-runner TLS, token, identity, and session contracts; this spec does not weaken or replace them.

Selected ASVS v5.0.0 requirements are scoped proof targets, not a claim of ASVS compliance:

| Requirement | MVP application | Required evidence |
| --- | --- | --- |
| `v5.0.0-2.1.3`, `v5.0.0-2.3.2`, `v5.0.0-2.4.1` | Documented per-session, per-actor, per-tenant, process, command, variant, duration, and cost limits | Limit-boundary, concurrency, rate/cost, and exhaustion tests |
| `v5.0.0-2.2.1`, `v5.0.0-2.2.2` | Positive closed-schema validation at the trusted runner layer | Malformed, additional-property, range, combination, and client-bypass rejection |
| `v5.0.0-2.3.1`, `v5.0.0-2.3.4` | Ordered state transitions and locking around the one compile identity | Step-skipping, stale-revision, duplicate-tab, replay, and concurrent-compile tests |
| `v5.0.0-3.4.2`, `v5.0.0-3.4.3`, `v5.0.0-3.4.6` | Exact-origin CORS, restrictive CSP, and explicit frame ancestry for the isolated preview | Header/browser tests for allowed and hostile origins, embedding, navigation, and resource loads |
| `v5.0.0-4.1.1`, `v5.0.0-4.1.4` | Explicit content types and HTTP methods for the Studio API/bridge | Contract tests reject wrong media types and unsupported methods |
| `v5.0.0-5.3.2` | Server-generated worktree/temp paths and project-relative allowlisted source paths | Traversal, symlink/junction, absolute-path, and scope-expansion fixtures |
| `v5.0.0-8.2.1`, `v5.0.0-8.2.2`, `v5.0.0-8.3.1` | Function/object authorization enforced server-side for every session resource | Cross-tenant, cross-project, forged-resource, revoked-capability, and UI-bypass denial |
| `v5.0.0-12.1.1` | Current recommended TLS for any non-loopback transport; local HTTP is restricted to loopback development | Hosted transport proof before any remote availability claim |
| `v5.0.0-13.1.3`, `v5.0.0-13.2.4`, `v5.0.0-13.2.5` | Explicit managed-sandbox lifecycle, single-job admission, timeouts/retries, quota/cost reservation, reconciliation, and outbound-resource allowlist | Fake and real provider lifecycle, replay, outage, timeout, cancellation, gateway allowlist, network-denial, orphan, and cleanup tests |
| `v5.0.0-13.4.2` | Studio integration and debug surfaces absent from production | Production build and route/global-symbol inspection |
| `v5.0.0-14.1.2`, `v5.0.0-14.2.1`, `v5.0.0-14.2.4`, `v5.0.0-14.2.7` | Classified ephemeral content, retention/cleanup rules, minimal persistence, and no sensitive URL material | Storage/log/URL/history scans plus expiry and failed-cleanup recovery |
| `v5.0.0-15.2.5` | Additional containment for dangerous project-runtime execution | Attested managed-microVM generation/verification separation plus filesystem, process, socket/device, credential, ingress, egress, cross-job, snapshot, quota/cost, export, and cleanup escape fixtures; customer preview remains unavailable without proof |
| `v5.0.0-16.3.3`, `v5.0.0-16.5.1`, `v5.0.0-16.5.3` | Redacted bypass logging, generic external errors, and fail-closed exceptions | Denial-event, secret-marker, unexpected-error, and partial-failure tests |

Official requirement source: [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/tree/v5.0.0/5.0).

## LLM and agentic lens

- LLM01:2025 Prompt Injection: repository content, rendered text, comments, and metadata are data only; the compile policy and tool authority are server-owned and cannot be overridden by project content.
- LLM02:2025 Sensitive Information Disclosure: prompts and outputs use minimum redacted context; secrets, credentials, customer screenshots, absolute paths, and raw provider events are excluded.
- LLM05:2025 Improper Output Handling: agent output becomes a candidate patch inside an isolated worktree and must pass schema, scope, build, security, and rendered proof before review.
- LLM06:2025 Excessive Agency: the agent receives one frozen intent and no commit/push/merge/deploy authority; policy independently validates every side effect.
- LLM10:2025 Unbounded Consumption: session, command, variant, runtime, token/cost, duration, and compile concurrency limits are server-owned.

Fresh official sources: [OWASP Top 10:2025](https://owasp.org/Top10/), [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/), [OWASP Agentic AI threats and mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/), and [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html). These are awareness and requirement-selection inputs, not compliance claims.

# Test Contract

## Proof profiles

| Profile | Required proof |
| --- | --- |
| Domain | Unit tests for state machine, command inversion/compaction, Laboratory policy, variant limits, capability negotiation, and revision conflicts |
| Runner contract | Authentication, tenant/project ownership, closed schemas, idempotency, expiry, ordering, limits, redaction, cleanup, and one-compile invariant |
| Managed sandbox providers | Trusted-profile admission plus versioned capability attestation, account/project scope, fake-adapter parity, approved toolchain snapshot, separate fresh generation/verification sandboxes, private ingress, minimal environment, credential brokering, gateway/network policy, quota/cost preflight, bounded artifact export, reconciliation/cleanup, and fail-closed unsupported customer repository |
| Astro adapter | Deterministic fixture proving stable anchors, source confidence, computed properties, typed overrides, production exclusion, and zero source diff during preview |
| Flutter UI | Widget tests for all states, keyboard/focus, semantics, compact degradation, icon text/shape cues, and design-token consumption |
| Integration | Real Astro runtime opened through ShipGlows, commands/variants exercised, compile run created through the real Vercel adapter only after separate authority, bounded patch exported, and the actual generated runtime reloaded through the proved private preview from the fresh verification sandbox |
| Visual/performance | Before/after captures at desktop, intermediate, and mobile widths; light/dark where supported; reduced-motion state; only intended regions differ; fixed-profile latency/frame/start/build budgets pass |
| Security | Cross-tenant denial, forged session/node/ticket/admission rejection, replay, prompt injection, raw CSS/JS/path/command rejection, public preview access, origin failure, stale revision, host mount/socket/device access, credential/network escape, cross-job/snapshot access, toolchain mismatch, quota/cost exhaustion, artifact tampering, and secret-marker scans |
| Recovery | Preview crash, connection loss, runner/provider outage, compile interruption, timeout, persistence/snapshot mismatch, orphaned sandbox, failed cleanup, export failure, proof failure, and reconciliation remain bounded, quarantined when uncertain, and source-safe |

## Required commands after implementation

```bash
cd runner
npm test
npm run typecheck
npm run lint
npm run audit

cd ../app
flutter analyze
flutter test

cd ../site
pnpm check
pnpm test
pnpm build
```

Focused suites must include stable files equivalent to:

- `runner/test/studio-contract.test.ts`
- `runner/test/studio-security.test.ts`
- `runner/test/studio-compile.test.ts`
- `app/test/shipglows/studio/studio_state_test.dart`
- `app/test/shipglows/studio/laboratory_policy_test.dart`
- `app/test/shipglows/studio/studio_screen_test.dart`
- `app/test/shipglows/studio/studio_golden_test.dart`

The exact filenames may follow established repository grouping, but all named behaviors remain mandatory. Browser evidence uses the real pilot runtime and records zero console errors, no production bridge, zero pre-compile source diff, and a reviewable post-compile patch.

## Future Execution Batches and stop gates

These batches replace the superseded self-hosted-worker slice only. They are dependency-ordered and have non-overlapping write ownership; no batch may edit another batch's owned paths. The integration owner reviews combined behavior and runs the final cross-surface proof.

1. **Batch A — provider-neutral contract and fake proof**
   - Status: `completed` on 2026-08-16 with independent local verification.
   - Write ownership: `runner/src/studio/workerProvider.ts`, new provider-neutral contract/attestation modules under `runner/src/studio/providers/`, and new fake-provider contract/security tests only.
   - Action: replace runtime-brand admission with the capability contract; add lifecycle, persistence, snapshot, private-ingress, network, credential, quota/cost, cleanup, and export states; keep production provider injection absent.
   - Validation: fake-provider success plus every unavailable/over-quota/public-ingress/stale-snapshot/export-tamper/cleanup-failure scenario; runner typecheck/lint.
   - Stop: any contract permits host execution, a provider-brand shortcut, customer-data snapshot reuse, unbounded cost, raw credential injection, or optimistic availability.
2. **Batch B — Vercel adapter and account-free conformance**
   - Status: `completed` on 2026-08-16 without an SDK/package, credential, provider/network call, or billable action.
   - Depends on: Batch A.
   - Write ownership: new `runner/src/studio/providers/vercelSandboxProvider.ts`, its adapter tests/fixtures, and the runner dependency manifest/lockfile only if the approved implementation needs the official SDK.
   - Action: implement only admission, capability probe, and release against an injected mocked Vercel facade; leave command, file, snapshot, port, execution, preview, persistence, and patch-export surfaces absent.
   - Validation: deterministic facade/API conformance, schema/limit/redaction tests, independent evidence binding, lifecycle reservations, reconciliation, and offline dependency audit; zero real provider, credential, network, or billing calls.
   - Stop: the official API cannot express a required capability, the adapter would expose a sandbox domain, provider defaults cannot be overridden safely, or the SDK/dependency choice creates an unresolved security or licensing risk.
3. **Batch C — real-provider admission/probe/release proof**
   - Status: `pending`; requires new credential/cost approval.
   - Depends on: Batches A-B and separate operator approval for exact Vercel account/project credential use and spend ceiling.
   - Write ownership: durable redacted provider-proof fixtures under `runner/test/fixtures/studio-provider-proof/` only; no application, adapter, documentation, or package edits during the proof run.
   - Action: execute inert, bounded Vercel probes for account/project scope, managed-microVM/no-host capabilities, private-ingress feasibility, persistence defaults, network-policy and credential-brokering controls, quotas, timeout/cancellation, orphan cleanup, and release. Do not run project/generated code, issue a model call, enable product preview, or export a patch.
   - Validation: one deliberate denial or failure per probed control plus a successful create/probe/release lifecycle; capture only redacted capability manifests, hashes, timings, provider/adapter versions, cost receipt, and cleanup receipt.
   - Stop: missing authority, unexpected charge surface, public unauthenticated preview, credential visibility, cross-job access, incomplete cleanup, unverifiable provider result, or any need to weaken the capability contract.
4. **Batch D — fail-closed admission and release integration**
   - Status: `pending`; depends on accepted Batch C evidence.
   - Depends on: Batch C ready evidence.
   - Write ownership: `runner/src/studio/session.ts`, provider admission/release wiring in `runner/src/app.ts`, admission/release integration tests, and no provider-adapter files.
   - Action: inject the real adapter only for server-side admission/probe/release state, expose safe unavailable/attested reason codes, reconcile late provider results, and keep compile execution, provider preview, persistence, patch export, and generated worktree mutation disabled with the existing fail-closed response.
   - Validation: focused runner admission/security/recovery suites, attestation expiry/invalidation, release after timeout/cancellation/late result, no-host-execution assertion, no provider URL/secret leakage, and provider-disabled regression.
   - Stop: any path executes a command for compilation, creates a generated worktree, exports/applies a patch, exposes a provider port, weakens `503` fail-closed behavior, or causes commit/push/merge/deploy.
5. **Batch E — later compile, export, and private-preview slice**
   - Status: `pending`; not authorized by the current plan.
   - Depends on: Batches C-D, independent proof accepted, and a new explicit plan/readiness approval for project/generated execution and patch mutation.
   - Write ownership: new `runner/src/studio/managedSandboxCompileCoordinator.ts`, new `runner/src/studio/managedSandboxPreview.ts`, new compile/export/private-preview tests, and `runner/src/workspaces/index.ts`; no files owned by Batches A-D.
   - Action: add fresh non-persistent generation/verification sandboxes, brokered generation gateway, deny-all verification, bounded source upload, verified patch export/import, and authenticated runner-mediated preview without changing the provider adapter or admission wiring.
   - Validation: hostile real-provider generation/verification fixtures, artifact path/type/size/digest/applicability checks, unauthenticated preview denial, cleanup/reconciliation, and one authorized end-to-end minimal patch/reload flow.
   - Stop: the new approval is absent, proof is expired, public ingress is possible, credentials enter the guest, provider cost escapes the ceiling, cleanup is uncertain, or runner-host execution/fallback is attempted.
6. **Batch F — independent proof and documentation reconciliation**
   - Depends on: Batch D for admission-only documentation; repeat after Batch E before any compile availability claim.
   - Write ownership: browser/visual proof artifacts plus `shipglows_data/technical/code-docs-map.md`, `shipglows_data/technical/managed-runner-foundation.md`, `shipglows_data/technical/operator-guides/studio-oci-worker.md` or its approved replacement, `shipglows_data/technical/platforms/vercel.md`, and this spec history/flow only.
   - Action: run independent browser/security/recovery/performance verification, reconcile provider/retention/cost/incident guidance from actual evidence, and leave public product/pricing/onboarding copy unchanged until an explicit later editorial decision.
   - Validation: metadata/topology/link checks, evidence matrix, documentation claim audit, and explicit distinction among implemented, locally verified, real-provider verified, hosted verified, and publicly available.
   - Stop: any documentation would imply unproved availability, reliability, private preview, security compliance, iOS/Codemagic support, or price.

Each batch is independently reviewable and leaves the repository valid. Batches A and B are complete using local fakes only. Batch C is the first cost-bearing/provider-write batch and requires a new full approval. Batch D remains dependent on accepted real-provider evidence, and Batch E remains separately specified but unauthorized. A failed stop gate blocks dependent batches instead of selecting host execution or another unproved provider. The root integration owner owns cross-batch validation and readiness evidence.

# Links & Consequences

- Business/product: adds a planned second product promise without weakening the current managed-control-plane promise.
- Project detail: gains a capability-gated Studio entry and status, not a universal enabled button.
- Flutter router: gains a project-scoped Studio route whose target identity remains runner-resolved.
- Design system: requires Studio-specific semantic tokens and responsive/overlay/focus/motion proof before UI completion.
- Managed runner: gains a separate Studio capability/session/compile family; it must not reuse the privileged PTY capability as authorization.
- Managed sandbox provider: becomes a private runner-controlled dependency behind capability attestation, with its own account/project identity, adapter/API version, quotas/cost, toolchain snapshot, lifecycle, audit, cleanup, retention, and incident boundary; it is not a customer-visible infrastructure product.
- Workspaces: compilation reuses isolated worktree policy but preview sessions need their own ephemeral runtime cleanup.
- Conversations/agents: compile may project a normalized run/conversation result, but preview gestures must not become chat prompts or turns.
- Atlas/protection: implementation must draft meaningful surfaces/functions and run protection preflight before compile.
- Public site, pricing, onboarding, and support: no capability claim changes until verified representative proof and an explicit editorial update.
- Future Flutter/3D adapters: must implement the same capability, command, source-authority, Laboratory, compile, and evidence boundaries.
- Future iOS delivery: remains bounded to a hosted macOS build provider such as Codemagic after a separate product/security/cost decision; Vercel Sandbox does not imply macOS, signing, simulator, or App Store capability.

# Documentation Coherence

## Current documentation truth

- `shipglows_data/business/product.md`: records the second promise as planned; it is not a public availability claim.
- Penpot architecture study: points to this spec/readiness rather than asking for a future spec.
- `shipglows_data/technical/code-docs-map.md`: routes the implemented Astro, Flutter, runner Studio, provider-neutral managed-sandbox, and account-free Vercel adapter surfaces and their focused checks.
- `shipglows_data/technical/design-system-authority.md`: owns the Studio-specific Flutter token group and records local widget/state proof without claiming browser visual proof.
- `shipglows_data/technical/managed-runner-foundation.md`: records session, journal, Laboratory, provider-neutral evidence/admission, complete resource/cost budget, account-free Vercel facade, and fail-closed compile behavior.
- `shipglows_data/technical/operator-guides/studio-oci-worker.md`: retains its legacy filename for compatibility but now makes the managed-sandbox direction operative and preserves self-hosted OCI/containerd/gVisor only as explicitly superseded history.
- `shipglows_data/technical/platforms/vercel.md`: records current official sources, local adapter invariants, account-free proof, and all account/configuration/execution facts still unproved; it contains no secret or provider identifier.

## Still required before closure

- a Studio technical context/behavior index if the final module split creates non-trivial recovery cost;
- completed project Atlas/protection adoption for compile paths;
- real-provider account/project scope, attestation, adapter/API version, toolchain snapshot, quota/cost ceiling, monitoring, retention, private ingress, cleanup, recovery, and incident evidence;
- explicit snapshot/persistence and provider-data-deletion rules plus bounded patch-export verification;
- dependency/platform usage note only if the chosen embedding/runtime dependency changes local proof or security decisions.

Public documentation remains unchanged. Spec evidence, mocked adapter proof, SDK installation, or local implementation does not establish hosted availability, private preview, generated-code execution, patch review, reload proof, provider reliability, pricing, or a user-visible production promise.

# Edge Cases

## ZOMBIES coverage

| Heuristic | Required case |
| --- | --- |
| Zero | No authorized project, no Studio capability, empty surface projection, zero commands, zero variants, no source anchor, no evidence |
| One | One instrumented surface, one reversible property command, one accepted variant, one compile intent, one viewport proof |
| Many | Multiple surfaces, commands, variants, viewports/states, repeated events, ordered undo/redo, and concurrent actor/session attempts |
| Boundaries | 256 nodes, 128 compacted commands, eight variants, three viewports, body size, idle/absolute expiry, mapping confidence, and Laboratory soft/hard threshold edges |
| Interfaces | Flutter/runner, runner/preview, preview/overlay, runner/repository, compile/agent, agent/worktree, proof/patch, Atlas/protection, and human approval boundaries |
| Exceptional | Denial, expiry, origin mismatch, malformed command, unsupported capability, stale revision, prompt injection, runtime crash, disconnect, timeout, failed cleanup, compile failure, proof failure |
| Simple | One Astro hero and one compile loop before mobile, collaboration, full motion tooling, or 3D editing |

Additional cases:

- a token changes after the session starts;
- a component instance has a local override while its master changes;
- two selected surfaces have incompatible capabilities;
- the same idempotency key is replayed with a different payload;
- the operator compiles while a later variant is active in another tab;
- reduced-motion proof differs from the ordinary animation state;
- visual proof passes while keyboard semantics fail;
- temporary overrides accidentally remain after the compiled runtime reload;
- a source file lies outside predicted paths but is genuinely required;
- the target page tries to navigate, open a popup, read ShipGlows storage, or message an unexpected origin;
- cleanup fails while customer content exists in the temporary session directory.
- the provider reports the expected runtime brand but the account-scoped attestation is missing, expired, or capability-incomplete;
- provider automatic persistence is enabled unexpectedly for a compile sandbox;
- a toolchain snapshot contains customer data, is expired, belongs to another provider/project, or no longer matches policy;
- a provider port domain is reachable without the authenticated ShipGlows runner attachment;
- network policy changes race with untrusted command start or verification unexpectedly retains generation egress;
- brokered credentials appear in guest environment, process arguments, filesystem, logs, snapshots, or exported artifacts;
- provider quota, rate limit, transfer billing, or spend reservation changes between preflight and creation;
- patch export contains a symlink, device, absolute/traversal path, duplicate entry, oversized file, digest mismatch, or silent truncation;
- stop succeeds but delete/reconciliation cannot prove that sandbox, snapshot, port, and artifact state are gone.

# Implementation Tasks

## Task 1: Freeze domain contracts and capability matrix

- Target: new Studio domain modules in Flutter and runner.
- Action: implement versioned closed schemas for `StudioNode`, `VisualCommand`, `LabSession`, `CompileIntent`, `RenderEvidence`, `StudioTargetProfile`, `PreviewRuntimeProvider`, `ManagedSandboxProvider` capability attestation, state machine, limits, and adapter capability negotiation; draft/refresh the project Atlas and run protection preflight before downstream work.
- User-story link: establishes one target-neutral language without a design-file authority.
- Dependencies: this spec and existing runner contract patterns.
- Validation: round-trip schema tests, malformed/oversized input rejection, exhaustive state/capability tests, target-profile mismatch tests, provider lifecycle tests, Atlas mapping evidence, and protection preflight.
- Constraint: no runtime-specific or Penpot type crosses the public domain boundary.

## Task 2: Build runner-owned Studio session and managed-provider security

- Target: `runner/src/studio/**`, provider-neutral admission/probe/release contracts, the Vercel Sandbox first adapter, route installation, operational lifecycle metadata, and cleanup.
- Action: add capability discovery, session creation/read/events, out-of-URL preview attachment, command/variant operations, expiry, ordering, authorization, origin policy, account/project-scoped provider attestation, managed-microVM/no-host proof requirements, snapshot/persistence policy, private ingress, network/credential policy, quotas/cost admission, reconciliation, and release/cleanup. The first approved slice stops before compile execution and patch export.
- User-story link: lets an authorized operator experiment safely without exposing infrastructure.
- Dependencies: Task 1, current auth/project/workspace/idempotency/redaction contracts.
- Validation: runner and provider contract/security/recovery suites, fake Vercel conformance, real-provider probe only after separate authority, orphan reconciliation, release receipts, and secret-marker scans.
- Constraint: customer content and screenshots stay out of SQLite; client never selects commands, paths, ports, runtimes, providers, snapshots, prompts, or attachment secrets in URLs; provider control-plane access and raw credentials never reach a sandbox.

## Task 3: Create the instrumented Astro pilot and adapter

- Target: `site/src/components/Hero.astro`, its copy/token/style dependencies, deterministic fixture states, and a development-only Astro integration.
- Action: expose stable semantic anchors, source confidence, property/layout/token capabilities, message bridge, temporary overrides, responsive states, reduced motion, and production exclusion.
- User-story link: proves visual editing against the real target rather than a recreated canvas.
- Dependencies: Tasks 1-2 and explicit project enablement.
- Validation: real Astro dev render, adapter contract tests, production build inspection, zero source diff during preview.
- Constraint: no raw CSS/JS/path/selector/command input; ambiguous mapping remains view-only.

## Task 4: Add the Flutter Studio shell

- Target: project detail entry, router, providers, Studio screen, overlay, inspector, surface tree, variant rail, and proof panel.
- Action: implement unavailable/start/ready/preview/Lab/compile/verify/conflict/error states with accessible controls and tokenized responsive composition.
- User-story link: gives the operator a comfortable, understandable production surface.
- Dependencies: Tasks 1-3 and design-system authority.
- Validation: Flutter state/widget/semantics/golden tests at compact and expanded profiles plus drift scan.
- Constraint: Flutter does not execute target code; compact mode does not pretend to offer precision editing.

## Task 5: Implement the reversible command journal and Laboratory policy

- Target: Flutter/runner session projection and policy engine.
- Action: apply typed preview commands, inversion, compaction, undo/redo, variant branching, hard/soft triggers, icon reasons, and limits.
- User-story link: makes experimentation fast while preventing pointless code generation.
- Dependencies: Tasks 1-4.
- Validation: deterministic round trips, branch-after-undo behavior, limit boundaries, trigger table, restart/interruption behavior, and zero repository diff.
- Constraint: no command becomes a source write or agent prompt.

## Task 6: Integrate the explicit compile coordinator

- Target: runner Studio compile route, existing worktree manager, `AgentRuntime`, managed-sandbox execution/export methods, run events, and patch projection.
- Action: in a later separately approved slice, freeze intent, revalidate base/protection/capability/attestation/cost, create one runner worktree, invoke one bounded generation sandbox, verify the exported patch manifest and content before worktree mutation, handle scope conflict, enforce idempotency, and expose a reviewable patch.
- User-story link: converts only the accepted visual result into maintainable code.
- Dependencies: Tasks 1-5, real account-scoped Vercel capability proof, approved toolchain snapshot, proved private ingress and cleanup, separate credential/cost/execution approval, model-gateway capability issuance, and protection preflight adoption.
- Validation: compile success/failure/conflict/replay/concurrency tests, malicious project and sandbox-escape fixtures, persistence/phase/credential/network separation, patch export tamper/size/path tests, no runner-host execution, and no commit/push/merge/deploy assertions.
- Constraint: project content cannot expand agent authority; a material impact-path expansion returns to Laboratory.

## Task 7: Prove the real-runtime before/after loop

- Target: Astro build/runtime, capture/diff pipeline, semantics/accessibility/performance evidence, and Flutter proof UI.
- Action: clear overrides, render compiled worktree, capture required states, compare intentional regions, run console/semantics/focus/reduced-motion/performance checks, and bind evidence to the patch digest.
- User-story link: demonstrates that generated code matches the accepted visual intent.
- Dependencies: Tasks 3-6 and a fresh non-persistent verification sandbox with outbound network disabled and private preview proved.
- Validation: desktop/intermediate/mobile evidence, negative proof fixture, rollback/reopen-Lab flow.
- Constraint: visual similarity cannot hide semantic, accessibility, console, performance, or source-quality failure.

## Task 8: Align project governance and operating guidance

- Target: code-docs map, design-system authority, managed-runner foundation, Atlas, protection paths, managed-sandbox operator guide, project-local Vercel usage note, and this spec history.
- Action: document actual module ownership, provider decision supersession, account/project scope, enablement, snapshots/persistence, private ingress, network/credential policy, quota/cost limits, patch export, cleanup/recovery, and verified delivery state.
- User-story link: keeps the new promise understandable and maintainable after implementation.
- Dependencies: actual implementation evidence from Tasks 1-7.
- Validation: metadata lint, topology audit, link/path checks, documented validation commands, and no premature public claims.
- Constraint: distinguish planned, implemented, locally verified, hosted verified, and publicly available.

# Implementation Truth At 2026-08-16

| Area | Current evidence | Explicit limit |
| --- | --- | --- |
| Astro adapter | Development-only hero anchors and bridge are implemented; 13/13 focused tests, `pnpm check`, `pnpm build`, and the production-exclusion scan pass. Live `127.0.0.1:3003` confirms the exact profile and eight anchors. | No generated worktree/runtime is served and the broader site test command still reaches one pre-existing installer-parity failure. |
| Flutter Studio | Real iframe carrier, selection handshake, semantic command/session state, Laboratory/variant controls, canonical Studio tokens, and runner-aligned create/command/undo/redo/variant/compile-intent DTOs are implemented; 24 Studio tests plus five theme tests pass, for 29/29 in the combined focused command, with analysis and format clean. Live `127.0.0.1:3005` loads the Flutter bundle on the Studio route without browser console warnings. | Screenshot and semantics capture are unavailable; no visual/browser composition or accessibility proof is claimed. |
| Runner Studio | Repository/runtime attestation, authenticated tenant-scoped capability/session routes, closed command schemas, journal compaction, undo/redo, expiry, variants, Laboratory policy, immutable compile intent, provider-neutral managed-sandbox admission/evidence, and the account-free injected Vercel facade are implemented. The full Studio surface passes 73/73 with typecheck and lint. | Main injects no managed provider. Compile returns fail-closed `503`; it creates no generated worktree, executes no generated code, exports no patch, and reloads no compiled runtime. |
| Managed-sandbox adapter | The managed-sandbox focused surface passes 48/48 with independent review, diff check, and zero high-severity offline dependency-audit findings. Fixtures cover exact evidence/lease correlation, immutable complete budgets, phase separation, atomic lifecycle reservations, concurrency/idempotency, shared capacity, provider-wide rate accounting, release, quarantine, and reconciliation. | The adapter uses only an injected fake facade. No Vercel SDK/package, account, credential, provider/network call, production wiring, managed-microVM observation, private ingress, execution, preview, persistence, export, cost receipt, or availability proof exists. |
| Defect-fix audit | Focused tests close exact handshake validation, bridge loop/revision ordering, atomic idempotency under concurrency, the 256 KiB total-message/16 KiB per-command split, and late cleanup/release after provider timeout. | These are local contract proofs; they do not prove managed-microVM containment, a real Vercel account/configuration, private ingress, generated-code containment, or hosted recovery. |
| Full suites | Runner reaches 144/146 and Flutter reaches 213 passing tests before unrelated failures. | Runner is blocked by Windows symlink `EPERM` and LF/CRLF worktree expectations; Flutter has eight pre-existing source-reader/indexer and Cockpit-golden failures. These are not Studio verification. |
| Hosted/public delivery | None. | No authenticated hosted flow, public route, production availability, generated compile, visual diff, or release claim exists. |

# Acceptance Criteria

- [ ] An authorized operator opens Studio from a project whose runner capability is supported.
- [x] The MVP capability is offered only for the two pinned first-party `shipglows_app/site` and `gocharbon/site` profiles; every other project/profile/origin fails closed until independently approved and proved.
- [x] The local trusted provider can render only the reviewed base revision; agent-generated worktrees require a proved sandbox and never execute through a host-process fallback.
- [ ] The center surface is the real instrumented Astro runtime.
- [ ] Meaningful surfaces can be selected with visible source confidence and supported property groups.
- [ ] A property edit changes the preview and `git status` remains unchanged.
- [ ] Undo/redo deterministically restores the preview without source writes.
- [ ] A structural, multi-state, protected, motion, 3D, ambiguous, or stale-revision trigger activates Laboratory according to policy.
- [ ] Laboratory reasons are visible and accessible without relying on color.
- [ ] Up to eight bounded variants can be created, compared, selected, and removed in one session.
- [ ] Continuous gestures compact into semantic commands before compile.
- [ ] `Compile to code` is the only path from preview intent to repository mutation.
- [ ] Preflight shows affected surfaces/dimensions, protections, base revision, expected paths, and required proof.
- [ ] One accepted intent creates at most one isolated compile worktree/run under idempotent replay.
- [ ] Every generated-code run is admitted only by a currently attested managed-sandbox provider; Vercel Sandbox is the first adapter, while provider/runtime brand alone never satisfies admission.
- [ ] Generation and verification use separate fresh sandboxes; verification has no model/provider capability, credential, shared mutable generation volume, or outbound network.
- [ ] Generation and verification are created with customer-data persistence disabled; any cross-job snapshot contains only the approved digest-bound toolchain/base and passes expiry/deletion/provenance checks.
- [ ] No generated source, build hook, dependency, or runtime output executes on the primary runner host, and there is no host bind mount, provider control-plane access, or exposed runtime socket.
- [ ] Preview traffic is authenticated through a proved private/provider-native or runner-mediated boundary; raw provider URLs and ports never reach Flutter, logs, history, or persisted state, and unauthenticated access is denied.
- [ ] Generation egress is limited to the brokered model gateway, verification egress is deny-all, and no raw long-lived provider/model credential is visible inside either sandbox.
- [ ] CPU, memory, process, disk, duration, output, port, concurrency, API-rate, model-token, transfer, and monetary ceilings are preflighted before creation and fail closed when unavailable or exceeded.
- [ ] Hostile filesystem/process/socket/device/credential/ingress/egress/cross-job/snapshot/quota/export fixtures and provider-outage cleanup reconciliation fail closed before compilation is enabled.
- [x] A terminal compile result cannot be retried inside the same session; a new attempt requires an explicitly refreshed session and revision.
- [ ] Project content, DOM text, comments, and agent output cannot select commands, paths, runtimes, providers, prompts, permissions, or proof bypass.
- [ ] A stale base revision blocks compile with no overwrite or automatic rebase.
- [ ] Compile success exports one bounded manifest-and-digest-verified patch into the runner-owned worktree but no commit, push, merge, deploy, or baseline approval; malformed, oversized, symlink/device-bearing, truncated, or mismatched exports are rejected before mutation.
- [ ] The compiled runtime reloads without temporary overrides and passes the required viewport/state proof matrix.
- [ ] Visual success cannot override failed semantics, focus, accessibility, console, reduced-motion, performance, or source-quality proof.
- [ ] Failure preserves canonical source and returns a bounded recoverable result or cleanup state.
- [ ] Cross-tenant, forged-ticket, forged-node, expired-session, malformed-command, duplicate, oversized, and origin-mismatch cases fail closed.
- [ ] Preview attachment secrets are absent from URLs, fragments, history, referrers, logs, DOM, target-runtime messages, and safe diagnostics.
- [ ] Raw screenshots, project content, prompts, credentials, absolute paths, and provider events do not enter SQLite or safe diagnostics.
- [x] Production Astro output contains no Studio bridge.
- [ ] Fixed-profile command latency, frame time, journal operation, runtime-start, layout-shift, and before/after regression budgets pass.
- [ ] Flutter Studio UI consumes the canonical design system and passes token drift and representative golden/browser proof.
- [ ] Penpot code/assets are absent and provenance records point only to research sources and independent requirements.
- [x] Product/public documentation labels the capability accurately as planned, implemented, verified, or available according to actual evidence.
- [ ] No availability, reliability, private-preview, security-compliance, pricing, Vercel-account, or Codemagic/iOS capability claim exists before its exact real-provider proof and explicit editorial approval.

# Test Strategy

1. Implement pure domain/state/policy tests before UI or runtime integration.
2. Prove runner authorization, capability attestation, schemas, limits, cost/quota admission, idempotency, expiry, redaction, and release/cleanup with fake providers.
3. Prove the Astro adapter against a deterministic local fixture, including production exclusion and zero preview diff.
4. Prove Flutter states and accessibility against fake runner projections.
5. Implement Vercel admission/probe/release conformance without a real provider call; keep compile execution and patch export disabled.
6. After separate credential/cost approval, prove the real Vercel account/project boundary, private ingress, persistence defaults, network/credential policy, quotas, lifecycle release, and hostile isolation outcomes without enabling product compilation.
7. Only after that proof and a separately approved execution slice, run one real end-to-end preview/Laboratory/compile/export/reload flow with fresh generation and verification sandboxes.
8. Add hostile project and provider fixtures for prompt injection, malformed bridge messages, unexpected navigation/origin, source-scope expansion, public ingress, snapshot reuse, credential exposure, quota exhaustion, artifact tampering, and cleanup failure.
9. Produce deterministic visual evidence across the required matrix and a deliberate failing fixture.
10. Run the full app/runner validation suites only after focused failures are resolved.
11. Require independent readiness before each material provider/execution expansion and independent verification before any capability claim.

# Risks

| Risk | Impact | Mitigation and proof |
| --- | --- | --- |
| Runtime-to-source mapping is unreliable | Wrong code or false confidence | Explicit instrumentation, confidence, revision binding, ambiguous=view-only, mapping fixtures |
| Preview differs from compiled output | Broken product promise | Same real runtime before/after, overrides cleared, representative evidence matrix |
| Untrusted project compromises ShipGlows or another tenant | Credentials/data/code execution risk | Account-scoped capability attestation, managed-microVM/no-host boundary, separate generation/verification phases, private ingress, deny-by-default network, brokered credentials, hostile fixtures, and no host-process fallback |
| Trusted-pilot exception is generalized accidentally | Unsafe customer capability claim | Exact `StudioTargetProfile`, server-side project/revision match, unsupported-by-default response, and negative repository fixtures |
| Agent-generated Astro code executes on the runner host | Host compromise through build hooks, dependencies, or runtime code | Treat every generated worktree as untrusted and require a proved OS/container sandbox before build, render, or verification |
| Provider/runtime marketing is mistaken for proof | Cross-job, host, network, ingress, or secret compromise | Capability-level admission, observed account/project configuration, hostile real-provider probes, evidence expiry, and independent verification; brand or SDK success alone remains insufficient |
| Sandbox, snapshot, port, or artifact state survives cancellation/provider outage | Customer-data retention, public exposure, or capacity exhaustion | Non-persistent compile phases, explicit deletion, orphan reconciliation, quarantine on uncertainty, bounded alerts, and no identifier/snapshot/resource reuse |
| Toolchain snapshot, image, SDK, or dependency chain is replaced | Malicious build/runtime execution | Digest binding, provenance, SBOM/vulnerability policy, controlled source, frozen job dependencies, expiry/rotation, and adapter dependency audit |
| Attachment material leaks through browser surfaces | Session takeover or project-content exposure | No secret in URL/fragment/DOM/messages; authenticated body/header binding plus history/referrer/log scans |
| Project text prompt-injects compiler | Unauthorized or unsafe patch | Data/instruction separation, bounded typed intent, minimal context, independent policy checks, patch proof |
| Feature scope becomes a general design tool | Multi-year product distraction | One Astro hero, semantic surface model, no vector renderer/collaboration/full 3D in MVP |
| Generated code is visually correct but poor | Maintenance/performance/accessibility debt | Project-native adapter, semantic intent, source-quality and runtime gates, human review |
| Laboratory loses work on restart | Frustration | Explicit ephemeral MVP state, interruption warning, bounded session duration; provider-backed customer persistence stays future/opt-in despite snapshot support |
| Session data leaks customer content | Trust/privacy incident | No content/screenshots in SQLite, isolated temporary storage, expiry/cleanup, redaction scans |
| Flutter Web embedding restrictions block interaction | MVP feasibility risk | Explicit origin/message adapter and isolated pilot; readiness verifies browser constraints before build |
| Platform parity claim outruns proof | Customer trust damage | Capability matrix and no mobile/Flutter-target claim in MVP |
| Penpot research becomes accidental code reuse | Licence/provenance risk | No copy/transliteration/assets, original contracts/names/tests, provenance review |
| Provider/model/transfer cost grows or quota is exhausted | Commercial risk or denial of service | No generation during preview, one compile per session, pre-created spend reservation, CPU/memory/duration/port/concurrency/API/token/transfer ceilings, usage evidence, and no provider call when the ceiling is absent |
| Provider lock-in spreads into domain behavior | Portability and future migration cost | ShipGlows-owned capability contract, provider-neutral states/errors/evidence, Vercel-specific code isolated to one adapter, and parity fixtures for a future provider |
| Vercel sandbox port is treated as private by obscurity | Customer preview or project content becomes public | Never expose provider domains; require authenticated runner mediation or provider-native private ingress plus unauthenticated-denial proof |
| Patch export crosses the trust boundary unsafely | Arbitrary file write or corrupted worktree | Canonical bounded manifest, path/type/size/digest verification, symlink/device rejection, applicability check, and mutation only after complete retrieval |

Residual risk: two instrumented Astro Hero pilots and one managed provider validate bounded portability only; they do not prove zero-configuration compatibility with arbitrary repositories, universal isolation/reliability across provider changes, production deployment isolation, Flutter-target editing, or macOS/iOS delivery. Those claims remain explicitly unavailable.

# Execution Notes

## First-read files

1. `shipglows_data/workflow/explorations/2026-08-15-penpot-visual-editor-architecture-study.md`
2. `site/src/components/Hero.astro`
3. `site/src/styles/global.css`
4. `app/lib/shipglows/presentation/screens/project_detail_screen.dart`
5. `runner/src/app.ts`

## Conventions to preserve

- Riverpod providers isolate Flutter state and transport.
- `GoRouter` owns project-scoped navigation.
- The app uses `Theme.of`, `AppTheme.paletteOf`, and `AppTheme.tokensOf` rather than local visual systems.
- Runner routes use closed schemas, safe error codes, trusted Origin checks, server-side project resolution, and idempotency for mutations.
- Runtime and provider wire types stay behind ShipGlows-owned ports.
- Managed filesystem paths and credentials never reach Flutter.
- Worktree mutation is isolated and reviewable; no automatic remote action exists.

## Freshness verdict

`fresh-docs checked` on 2026-08-16. The architecture study still records current official Flutter `RenderBox`, `InteractiveViewer`, web-content/embedding and testing documentation, plus Astro development-toolbar documentation. This revision rechecked Flutter Web `HtmlElementView`, the Astro development integration path, OWASP Top 10:2025, OWASP LLM Top 10:2025, OWASP Agentic AI guidance, ASVS 5.0.0, the global Vercel platform note, and current official Vercel Sandbox product/changelog/knowledge-base sources. The project-local `shipglows_data/technical/platforms/vercel.md` now records the account-free adapter boundary and official source map without implying account proof. The MVP uses Flutter's existing `package:web` surface and adds no embedding dependency. No Vercel SDK/package is installed; adapter/API/SDK version, account/project scope, persistence behavior, quotas/cost, ingress, effective network policy, credential brokering, cleanup, and export remain unproved until the separately approved real-provider batch.

## Licence and provenance

Penpot is MPL-2.0 research prior art pinned to commit `59ef07633aae46450c7e8738ee8b1fd1bbd2ea86`. Implementers may use the behavior/invariant requirements in this spec but must not paste, translate, transliterate, or adapt Penpot code/assets. Any future code reuse requires a separate licence decision and materially expanded approval.

The superseded self-hosted direction was based on independent requirements and official [Open Container Initiative](https://opencontainers.org/), [containerd](https://github.com/containerd/containerd), [containerd namespaces](https://github.com/containerd/containerd/blob/main/docs/namespaces.md), [containerd leases](https://github.com/containerd/containerd/blob/main/docs/garbage-collection.md), [gVisor architecture](https://gvisor.dev/docs/architecture_guide/intro/), [gVisor security](https://gvisor.dev/docs/architecture_guide/security/), and [gVisor containerd integration](https://gvisor.dev/docs/user_guide/containerd/quick_start/) sources. That evidence is preserved for decision history and future adapter comparison; it no longer selects the MVP implementation.

The managed direction is based on official Vercel sources checked on 2026-08-16: [Vercel Sandbox product and capability overview](https://vercel.com/sandbox), [Sandbox general availability](https://vercel.com/changelog/vercel-sandboxes-ga), [duration and persistence](https://vercel.com/kb/guide/vercel-sandbox-duration-and-persistence), [filesystem snapshots](https://vercel.com/changelog/filesystem-snapshots-supported-on-vercel-sandboxes), [credential injection outside the guest](https://vercel.com/changelog/safely-inject-credentials-in-http-headers-with-vercel-sandbox), [firewall proxying and filtering](https://vercel.com/changelog/vercel-sandbox-firewall-now-supports-request-proxying-and-filtering), [bounded file retrieval APIs](https://vercel.com/changelog/simplified-file-retrieval-from-vercel-sandbox-environments), and [published platform limits](https://vercel.com/docs/limits). These are provider-capability inputs, not ShipGlows account, containment, private-ingress, cost, availability, compliance, or reliability proof. Adapter code must be independently implemented and preserve applicable SDK/package notices. This is a provenance rule, not legal advice.

# Open Questions

No material product or security decision remains open for the approved admission/probe/release implementation. The operator has selected a provider-neutral managed-sandbox contract, managed microVM primary direction, Vercel Sandbox first adapter, no host fallback, and no availability claim before real proof. Exact adapter/API/SDK version, Vercel account/project/region, credential mechanism, spend ceiling, quota, persistence retention, toolchain snapshot, and private-ingress configuration are execution facts to observe and pin during the separately authorized real-provider batch; uncertainty keeps the provider unavailable and may not weaken the contract.

The browser embedding path, trusted base-preview boundary, generation/verification split, model-gateway capability, snapshot/persistence restrictions, private-ingress rule, network/credential policy, cleanup/reconciliation, patch-export verification, out-of-URL attachment rule, ASVS proof crosswalk, Atlas preflight order, measurable performance budgets, one-attempt retry semantics, and non-overlapping execution batches are resolved. Batch E compile/execution/export remains outside the currently approved admission/probe/release implementation and requires a new explicit plan/readiness approval after Batch C proof. Codemagic/macOS remains only a future iOS build boundary.

# Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
| --- | --- | --- | --- | --- | --- |
| 2026-08-15 19:09:04 | 100-sg-spec | GPT-5 Codex | Converted the approved Studio/Laboratory research and operator decisions into one autonomous implementation contract. | Draft spec created; no implementation or readiness claim. | Run readiness review. |
| 2026-08-15 19:59:49 | 101-sg-ready | GPT-5 Codex | Challenged browser feasibility, runtime isolation, security mapping, Atlas order, performance proof, retries, and implementation batching. | Not ready: the contract was strengthened, but no approved sandbox can safely execute agent-generated worktree code. | Choose the sandbox direction, update the provider contract, and rerun readiness. |
| 2026-08-16 06:36:00 | 101-sg-ready | GPT-5 Codex | Applied the approved self-hosted OCI direction, specified the dedicated worker and two-phase gVisor boundary, and reran adversarial readiness. | Ready: a fresh implementation agent has bounded architecture, tasks, stop gates, and proof without needing the conversation; implementation and runtime proof remain pending. | Start Batch A through the governed implementation lifecycle. |
| 2026-08-16 07:22:00 | sg-development | GPT-5 Codex | Implemented the local Task 1 contract foundation: Atlas v2, Flutter domain state/profile negotiation, runner closed contracts, and fail-closed preview-provider port. | Focused Flutter and runner tests pass; no UI, route, preview launcher, OCI worker, generated execution, or availability claim exists. | Continue Batch A with the separately isolated Linux worker and hostile sandbox proof. |
| 2026-08-16 08:14:34 | sg-development | GPT-5 Codex | Implemented the first read-only Astro preview slice: eight development-only hero anchors, exact-origin bridge, authenticated runner capability projection, and Flutter Web preview/inspector shell. | Focused Astro, runner, and Flutter checks pass; production Astro output excludes Studio markers and the live Flutter app remains fail-closed without an authenticated capability resolver. | Wire the resolver into an authenticated local runner and prove real embedded selection; keep preview mutation and generated execution disabled. |
| 2026-08-16 09:40:09 | sg-docs | GPT-5 Codex | Reconciled the Studio spec and mapped technical/operator guidance with the integrated Astro, Flutter, and runner implementation evidence. | Local preview/session/journal/Laboratory contracts and the aligned cross-surface compile-intent DTO are documented as implemented and locally tested; compile remains admission-only and unavailable without a proved OCI worker, with no generated patch, reload, visual proof, hosted proof, or public claim. | Provision the dedicated Linux worker and execute independent compile/reload/visual proof. |
| 2026-08-16 10:03:28 | sg-docs | GPT-5 Codex | Refreshed the mapped evidence after the final Studio defect-fix pass and live local route checks. | Site 13/13, runner 35/35, and Flutter 24 Studio plus five theme tests (29/29 combined) pass; five audit defects are closed, the live profile/eight anchors and Flutter bundle/no-console-warning route are confirmed, while screenshot/semantics and all generated-worker proof remain pending. | Provision the dedicated Linux worker, then produce generated compile/reload and visual/semantics proof. |
| 2026-08-16 11:20:45 | 100-sg-spec | gpt-5.6-sol (high) | Replaced the active implementation direction with the confirmed provider-neutral managed-sandbox contract, managed microVM primary class, and Vercel first adapter while preserving the self-hosted OCI decision as superseded evidence. | User story, behavior, security, persistence/snapshots, private previews, network/credential policy, quotas/cost, cleanup, patch export, documentation consequences, and non-overlapping future batches are autonomous; no provider call or availability claim occurred. | Run adversarial readiness against the revised contract. |
| 2026-08-16 11:20:45 | 101-sg-ready | gpt-5.6-sol (high) | Re-ran scenario-first readiness for provider outage, public ingress, persistence leakage, credential exposure, quota/cost exhaustion, artifact tampering, cleanup uncertainty, and host fallback. | Ready: admission/probe/release can start account-free; real provider proof and later compile/export remain explicit approval/evidence gates and cannot be represented as available. | Start Batch A, then Batch B; stop before any real Vercel call. |
| 2026-08-17 04:00 | sg-development | GPT-5 Codex | Added an explicit local Studio authentication mode for manual pilot testing. | The mode is development-only, loopback-only, restricted to the single server-configured allowlisted Studio project and `127.0.0.1:3005` app origin, mutually exclusive with Firebase authentication, and disabled by default. | Prove the authenticated capability and live preview in the local Studio route. |
| 2026-08-17 10:58 | sg-development | GPT-5 Codex | Added the second bounded GoCharbon Astro homepage Hero portability pilot without enabling compile or persistence. | Eight development-only surfaces, the `gocharbon.astro.hero.v1` closed runner profile, exact `127.0.0.1:3002` origin/repository configuration, and profile-aware Flutter parsing are locally verified; production output excludes the bridge. | Run the separately owned live runner/app/browser proof against the GoCharbon route. |
| 2026-08-17 11:55 | sg-development | GPT-5 Codex | Repaired GoCharbon's development-only anchor emission and added a profile-specific bounded document allowance, then completed the live runner/app/browser proof. | The runner attests revision `51a0169f15e9256342579f3c9bf89fcb2c79532b` and eight surfaces; Studio shows `Aperçu connecté`, renders the real GoCharbon Hero, selects `Title` with its semantic overlay, and reports no browser console errors. Compile remains disabled and fail-closed. | Let the operator explore the live pilot; keep generation, persistence, patch export, push, and deployment outside this slice. |
| 2026-08-16 13:26:33 | sg-docs | gpt-5.6-sol (high) | Reconciled the provider-neutral managed-sandbox and account-free Vercel adapter implementation with canonical architecture, runner, operator, platform, and routing documentation after independent verification. | Batches A-B are documented as implemented and locally verified at 48/48 focused and 73/73 full Studio tests with clean static/audit gates; Batches C-D-E remain pending and no external/provider or availability claim was added. | Obtain a new credential/cost approval for bounded real-provider Batch C proof. |

# Current Chantier Flow

| Stage | Status | Evidence or gate |
| --- | --- | --- |
| Specification | completed | Durable implementation contract with confirmed product decision, superseded self-hosted history, provider-neutral managed-sandbox capabilities, managed microVM primary class, and Vercel first adapter |
| Readiness | ready | A fresh agent can implement account-free admission/probe/release and knows the exact authority/proof gates for real provider use and deferred compile/export without conversation history |
| Implementation | in_progress | Tasks 1, 3, 4, and the local session/journal/Laboratory portion of Tasks 2 and 5 are implemented; managed-provider Batches A-B are complete account-free, while Batches C-D-E remain pending, Task 6 remains at immutable compile admission, and Task 7 has not started |
| Verification | in_progress | The trusted ShipGlows and GoCharbon Astro pilots both have live visual/semantic proof; GoCharbon additionally passes 4/4 contract tests, a 23-page production build with zero Studio markers, runner Studio 42/42 plus typecheck/lint, and Flutter 12/12 plus focused analyze. Managed-sandbox local evidence is independently verified, while real-provider account/isolation/private-ingress, generated compile, patch export, reload, and the full evidence matrix remain pending. |
| Closure | pending | Requires implementation and independent proof |
| Shipping | pending | No public delivery or capability claim authorized |

Current next action: let the operator explore the live GoCharbon pilot. Any move beyond this bounded preview slice still requires a new full approval naming the Vercel account/project credential boundary and spend ceiling before inert Batch C admission/probe/release proof. Stop before project/generated execution, model calls, provider preview, persistence, patch export/import, production wiring, or availability language. The current local Studio can attest and display both trusted Astro bases and exchange semantic selection messages. The managed-sandbox admission contract and injected Vercel facade are locally verified but not wired. Compile remains disabled by default and fail-closed; it performs no generated execution, worktree mutation, patch, compiled reload, push, merge, deploy, hosted delivery, or public availability claim.
