---
title: "shipglows"
slug: "shipglows"
tagline: "Start with one plain instruction and let ShipGlows choose the right workflow."
summary: "The primary non-technical router for answering questions, executing deterministic micro-edits directly, or handing substantive work to the right ShipGlows skill."
category: "Plan & Decide"
audience:
  - "Founders who do not want to memorize internal command paths"
  - "Operators who know the outcome but not the right workflow route"
  - "Teams that want routing decisions kept visible in the main thread"
problem: "A user can lose momentum before work starts by having to choose between build, bug, maintenance, content, design, deploy, skill, and audit workflows."
outcome: "You get one first command that answers directly, performs deterministic micro-edits with focused validation, routes substantive work to the right ShipGlows skill, or asks one numbered clarification question when no context-safe route exists."
founder_angle: "The router keeps the first move simple. You describe the business or product need, and ShipGlows chooses whether the work is conversation, build, maintenance, bug, release, content, design, skill maintenance, or audit. The router also steers requests into product-aware content and docs paths when declared products or public claims are part of the work."
when_to_use:
  - "When you want the recommended first command and do not know which skill to launch"
  - "When the request might be a feature, bug, maintenance run, content task, design task, deploy proof, skill change, audit, or simple question"
  - "When you want the selected master skill to own its normal lifecycle after routing"
  - "When you want the first answer to preserve product coherence instead of treating claims or surfaces as incidental"
what_you_give:
  - "A plain-language instruction"
  - "Any known target file, feature, bug symptom, deployment, content surface, or audit concern"
what_you_get:
  - "A direct conversational answer for pure questions"
  - "Direct execution with focused validation for deterministic micro-edits"
  - "A direct main-thread handoff to the selected skill for substantive work"
  - "One numbered question when the route is ambiguous"
  - "No hidden master-skill-in-subagent nesting"
  - "A route that keeps product governance, claims, and surface coherence visible when the task touches shipped or market-facing material"
example_prompts:
  - "shipglows explain which docs govern skill runtime"
  - "shipglows fix the checkout bug"
  - "shipglows prepare this change for deploy proof"
  - "shipglows core improve the skill routing doctrine"
argument_modes:
  - argument: "<instruction>"
    effect: "Classifies the request and either answers directly, executes a deterministic micro-edit directly, or hands the main thread to the selected ShipGlows skill."
    consequence: "Routes feature/code/docs to sg-build, mixed build-plus-customer requests to sg-build first with a post-build sg-customer gate, maintenance to sg-maintain, bugs to sg-bug, release/deploy/prod proof to sg-deploy, content to sg-content, design to sg-design, customer-experience work to sg-customer, internal skill maintenance to the internal 900 core workflow, and obvious specialist audits to sg-audit-*."
limits:
  - "It does not replace the selected skill's lifecycle gates"
  - "It uses context-safe defaults only when they are clear, low-risk, reversible, and verifiable"
  - "It asks a numbered question with the reason and recommended route instead of guessing when routing is ambiguous"
  - "It does not run master skills inside hidden subagents"
related_skills:
  - "sg-development"
  - "sg-maintenance"
  - "sg-bug"
  - "sg-release"
  - "sg-content"
  - "sg-design"
  - "sg-experience"
  - "sg-engineering"
featured: true
order: 5
---

## The First Command

Use `shipglows <instruction>` when you want ShipGlows to choose the route. It is
for the first moment of a request, before you know whether the work is a build,
bug loop, maintenance run, release proof, content task, design task, skill change, audit, or
just a question.

## URL Shortcuts: Watch, Competitor, Inspiration

For a single URL, start the instruction with the intent you want:

- `shipglows veille <URL>` analyses the source and proposes the relevant follow-up; it does not add it to a register automatically.
- `shipglows concurrent <URL>` verifies the source and adds it to the project's internal competitor register if it is not already present.
- `shipglows inspiration <URL>` does the same for the internal inspiration register.
- `shipglows veille concurrent <URL>` or `shipglows veille inspiration <URL>` remains analysis-first: `veille` takes priority.

Add `prix`, `comparatif`, `positionnement`, `recommandation`, or `roadmap` when you want a deeper market study rather than source triage or a register update.

## Named Profiles And Focus Tags

If you want the same router with a different decision posture, use a named
profile with `%<Profile>`.

- `%Victoire` biases toward growth, leverage, and explicit prioritization.
- `%Prudence` biases toward risk surfacing and coherence control.
- `%Ariane` biases toward clean sequencing, dependency mapping, and a bounded first slice.
- `%Adhesion` biases toward end-user trust, clarity, and friction review.
- `%SEO-specialist` biases toward search intent, discoverability, and page coherence.

Keep focus tags separate. `#growth`, `#clarity`, or `#Adhesion` are recentering
signals, not named profile activation.

Example:

```text
shipglows %Ariane update the internal docs and external surfaces #Adhesion
```

That means: keep Ariane's planning posture active, keep adhesion concerns
visible, and let ShipGlows still route the work to the right owner skill.

## Codex Expert Shortcuts

Short forms such as `shipglows build`, `shipglows fix`, and
`shipglows deploy` resolve through `sg-development build`, `sg-bug fix`, and
`sg-release deploy` before selecting an internal engine. They are convenience
routes, not a second skill hierarchy. `verify` preserves an explicit
specialist owner; `core` is the sole hard context switch to ShipGlows-system
maintenance.

## Install Path

Install ShipGlows in Codex by adding the repository marketplace source:

```bash
codex plugin marketplace add dianedef/ShipGlows --ref main --sparse .agents/plugins --sparse plugins/shipglows
```

Then restart Codex, open the plugin directory, install `shipglows` from the
`ShipGlows` marketplace, and begin with:

```text
$shipglows help me choose the right workflow
```

The router keeps the handoff visible. If it selects a master skill, that skill
takes over the main thread and owns its own delegated sequential execution.
If the request is only a deterministic micro-edit, the router keeps execution
direct and runs focused validation without loading a lifecycle skill.
If no route is safely implied by the instruction and project context, the router
asks one numbered decision question with the reason and recommended route.
