---
title: "ShipGlows and T3 Code: the same conviction, a different scope"
description: "Why ShipGlows admires T3 Code, where the two projects overlap, how they differ, and why ShipGlows does not currently use T3 Code as its runtime backend."
summary: "T3 Code proves that coding agents deserve a great interface. ShipGlows shares that conviction while building a broader business framework around shared truth, accountable métiers, execution, and proof."
publishDate: 2026-08-21
locale: "en"
articleKey: "shipglows-and-t3-code"
slug: "shipglows-and-t3-code-same-conviction-different-scope"
alternateSlug: "shipglows-et-t3-code-meme-conviction-perimetre-different"
tags:
  - "T3 Code"
  - "coding agents"
  - "runtime"
  - "product"
featured: true
draft: false
readingTime: "7 min"
---

Let us start with the most important point: [T3 Code](https://github.com/pingdotgg/t3code) is a great project.

It addresses a problem we care deeply about at ShipGlows: coding agents should not force people to live inside an unreadable terminal. The agent can run behind the scenes. The user should get a clear conversation, durable context, visible actions, understandable approvals, and a reliable way to return to the work later.

Theo Browne is one of the creators who made that conviction visible at scale, and we admire both his product instinct and the work of the wider T3 Code team. They have built an ambitious open-source product, shipped it across web, desktop, and mobile, and shown that an agent interface can feel like a real product rather than a thin wrapper around a command line.

ShipGlows is not presenting itself as a rival to T3 Code, nor pretending to operate at the same scale or level of maturity. We are an earlier project learning from work we respect. This article simply explains what T3 Code inspires in us, the different problem we are exploring, and why we have not embedded it as our foundation.

## The conviction we share

T3 Code describes itself as an agent harness control surface. Its server owns agent sessions, workspaces, version control, terminals, and filesystem access. Its clients communicate with that server through an authenticated real-time connection. The project currently supports several agent providers, including Codex and OpenCode.

That architecture validates several choices that also matter to ShipGlows:

- the agent runtime belongs behind the interface, not inside it
- a conversation should remain durable and resumable
- provider-specific protocols should not leak into the user experience
- approvals and progress deserve explicit UI states
- remote access should not mean streaming a raw terminal into a browser
- users should be able to choose among coding agents

In that sense, T3 Code and ShipGlows are part of the same movement: making agent-assisted work understandable, governable, and dependable.

## What T3 Code already does remarkably well

T3 Code is exceptionally focused on the developer experience of controlling coding agents. Its product boundary includes threads, turns, provider drivers, source control, terminals, checkpoints, remote environments, and clients for several devices.

That focus is a strength. It gives T3 Code room to make the agent interaction fast, direct, and polished.

If your primary need is a high-quality graphical control surface for the coding agents already installed on your machine, T3 Code is a compelling answer. We would rather say that plainly than manufacture a difference where none exists.

## The adjacent problem ShipGlows is exploring

ShipGlows is a business framework for humans and AI agents. A semantic conversation interface for coding agents is one technical surface within that broader framework, not its definition. The larger question is how humans and agents can work from the same business truth across identity, brand, content, product, technology, growth, delivery, and proof.

ShipGlows aims to connect human and agent work to:

- project health and operational context
- explicit identity, brand, content, product, engineering, growth, maintenance, and release responsibilities
- governed plans and approval boundaries
- evidence from tests, audits, documentation, and delivery
- a clear distinction between discussion, implementation, verification, and release
- project-level rules about branches, permissions, and deployment

The difference is therefore not “GUI versus terminal.” We agree with T3 Code on that question.

The distinction is therefore one of scope, not ambition or quality. T3 Code provides a mature control surface for coding agents. ShipGlows connects human and agent work to questions such as why an ambition matters, which métier owns it, how identity and business stay connected to technical execution, what evidence makes the result trustworthy, and when it is genuinely delivered.

That broader scope creates different constraints. ShipGlows needs a runtime-neutral contract that stays subordinate to project governance. The agent is an executor within the product workflow; it is not the owner of the whole workflow.

## Why we did not integrate T3 Code as our backend

The short answer is not “because we could not.” It is “because the ownership boundary would be wrong for us today.”

T3 Code has a real server API used by its own clients. Its current architecture documents an authenticated Effect RPC connection over WebSocket, with typed commands and server streams. This is a substantial internal contract, not a toy interface.

However, the documented client/server contract is part of the T3 Code product and evolves with it. The official architecture points T3 clients toward shared internal contract and client-runtime packages. A community RFC has proposed a narrower public `@t3tools/sdk`, precisely so external applications could consume threads, commands, and subscriptions without reproducing that internal machinery. At the time of writing, we do not base ShipGlows on such a supported public SDK.

Depending directly on the internal RPC surface would couple ShipGlows to T3 Code's orchestration model, authentication flow, workspace rules, source-control behavior, and release cadence. Embedding or forking the server would transfer an even larger maintenance surface into ShipGlows.

That would also create two control planes. T3 Code would own sessions, workspaces, Git operations, and provider processes, while ShipGlows would separately own project rules, approvals, health, evidence, and delivery. Resolving which system has final authority would be harder than connecting to the agents directly.

So ShipGlows keeps its own small `AgentRuntime` boundary. Codex is the first proven runtime. OpenCode and other agents can sit behind the same normalized conversation contract. The user interface receives semantic events; it does not receive a terminal transcript or a provider-specific wire protocol.

This is a product architecture decision, not a rejection of T3 Code.

## Open source still changes the relationship

T3 Code is published under the [MIT License](https://github.com/pingdotgg/t3code/blob/main/LICENSE). That matters.

It means the project can be studied, learned from, adapted, and—when appropriate—reused with the required notice. More importantly, its architecture is visible. We can compare assumptions honestly instead of guessing from a marketing page.

We expect to keep learning from T3 Code's work on conversation design, provider normalization, remote access, reconnect behavior, approvals, and multi-device clients. If T3 Code publishes a stable external SDK in the future, a bounded ShipGlows connector may become a sensible option.

But admiration does not require architectural dependence. Sometimes the most respectful response to an excellent open-source project is to understand its ideas deeply, credit them clearly, and remain honest about where your own product needs a different boundary.

## The position in one sentence

T3 Code is building an excellent control surface for coding agents; ShipGlows learns from that vision while building a business framework that humans can use directly and agents can act through.

We are close enough to learn from one another, different enough to justify separate architectures, and grateful that T3 Code exists.

If you want to understand the workflow ideas ShipGlows is exploring around that interface, [continue with the ShipGlows documentation](/docs).

### Sources

- [T3 Code repository and product overview](https://github.com/pingdotgg/t3code)
- [T3 Code internal architecture](https://github.com/pingdotgg/t3code/blob/main/docs/internals/overview.md)
- [T3 Code remote access documentation](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md)
- [Community RFC for a T3 Code SDK](https://github.com/pingdotgg/t3code/issues/6419)
- [T3 Code MIT License](https://github.com/pingdotgg/t3code/blob/main/LICENSE)
