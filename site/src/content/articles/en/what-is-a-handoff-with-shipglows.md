---
title: "What is a handoff, and how does ShipGlows prepare a reliable one?"
description: "Learn what an AI conversation handoff is, when it becomes useful, what it should contain, and how ShipGlows skills protect project continuity."
summary: "A handoff is neither a vague summary nor a copy of the chat. It is a verifiable transfer that lets a fresh conversation resume the right work without starting over."
publishDate: 2026-08-21
locale: "en"
articleKey: "shipglows-conversation-handoff"
slug: "what-is-a-handoff-with-shipglows"
alternateSlug: "quest-ce-quun-handoff-avec-shipglows"
tags:
  - "handoff"
  - "skills"
  - "ai-agents"
  - "context"
  - "recovery"
featured: false
draft: false
readingTime: "9 min"
---

You have been working with an AI agent for several hours. Decisions were made, files changed, checks passed, and several ideas were rejected. Then the conversation starts losing the thread: it mixes up two projects, asks an already-settled question again, or relies on an older version of the code.

Should you keep going to avoid “losing context,” or open a new conversation and explain everything again?

A **handoff** offers a way out of that false choice. It is a transfer of responsibility: the old conversation secures and communicates the useful state of the work, then a new conversation resumes from durable evidence instead of approximate memory.

ShipGlows turns this general principle into a workflow. Its skills do more than produce a summary paragraph: they connect context, decisions, tasks, evidence, and Git state so that the next conversation can verify what it inherits.

## What exactly is a handoff?

In a human team, a handoff happens when one person passes work to another. They do not narrate every minute of their day. They communicate what the next person needs to continue correctly: the goal, decisions, current state, risks, and next action.

The same principle applies to an AI agent. A good handoff is a restart message complete enough for a fresh conversation to understand:

- which project and work item it owns;
- which outcome has been accepted;
- what is complete, incomplete, or blocked;
- where the sources of truth live;
- which evidence already exists;
- which constraints must survive the transition;
- what to verify before changing anything.

The handoff is not the work itself. It is the reliable map back to the work.

## Length is not the deciding factor

A long conversation can remain excellent. If its goal is clear, its decisions are coherent, and the agent consults the right sources, there is no reason to stop after an arbitrary number of messages.

A shorter conversation can already be fragile if it confuses repositories, mixes products, or treats a hypothesis as an accepted decision.

The meaningful signal is the quality of the **useful context**. A fresh conversation becomes valuable when accumulated history starts reducing reliability:

- the agent repeatedly asks questions that were already resolved;
- older and newer decisions conflict;
- the wrong project, repository, or branch enters the reasoning;
- stale information keeps being treated as current;
- the scope has to be rebuilt in almost every response;
- important constraints disappear despite reminders.

Even then, ShipGlows should not abandon the conversation immediately. It first rereads canonical sources and tries to restore a reliable context. The handoff becomes appropriate when that refresh is not enough or when a clean workspace materially reduces risk.

## Why a normal summary is not always enough

A summary can help you remember a discussion, but it is often narrative: “we discussed the feature, fixed a few issues, and some tests remain.”

An operational handoff has to be more precise. It distinguishes:

- a confirmed decision from a hypothesis;
- a local edit from a commit backed up remotely;
- an implementation from a feature that was actually verified;
- a possible next idea from already-authorized work;
- an old fact from a source that is still current.

Those distinctions prevent the next agent from turning a plausible sentence into product truth.

## What ShipGlows secures before the transfer

The handoff is the end of a small protection chain, not a replacement for it.

### 1. Recover the principal outcome

ShipGlows identifies the project, product, surface, and work item involved. It preserves the expected outcome, accepted decisions, constraints, and authority boundaries. If those elements conflict, the conflict remains visible instead of being smoothed over by a polished summary.

### 2. Write durable state

Information that must outlive the conversation goes to its proper source: a spec, task tracker, documentation, bug record, evidence artifact, or audit log. The chat is not treated as the project's only memory.

### 3. Protect the changes

When an authorized Git-backed chantier changed files, ShipGlows checks what actually belongs to that work, creates the necessary commits, and pushes them to the remote repository under the project's delivery contract. It preserves unrelated changes and never treats “local commit,” “backed up on GitHub,” and “deployed” as equivalent.

For a deeper explanation, read [how ShipGlows protects work with Git and GitHub](/blog/is-your-agent-work-actually-backed-up).

### 4. Prepare the handoff

The final message points to durable sources instead of copying all their contents. It names the last delivered commit when one exists, the evidence already obtained, remaining limits, and the first verification for the next agent.

### 5. Let the operator open the new conversation

Codex cannot choose to close and restart its own active conversation. ShipGlows can recommend the transition, secure the state that precedes it, and provide a ready-to-copy message. Opening the fresh conversation remains the user's action.

## What does a useful ShipGlows handoff look like?

Here is a simplified example:

```text
Resume the “Bento Scenes” work in the CommunityGlows repository.

Accepted outcome: let desktop users compose, resize, and save
multi-network workspaces.

Sources of truth: the chantier spec and its TASKS.md record.
Branch: codex/bento-scenes
Last delivered commit: abc1234

State: local and cloud autosave are implemented.
Evidence obtained: migration and profile-switch tests pass.
Remaining work: desktop visual review on the preview.

Constraints: no local build; preserve unrelated changes;
use design tokens and shared components.

First verify the branch, HEAD, and spec before any mutation.
Next outcome: complete the desktop preview review.
```

This message does not retell the full conversation. It transfers just enough truth for the next agent to verify, then act.

## What should never enter a handoff?

A transfer is not a reason to move sensitive information into another chat. Exclude:

- passwords, keys, tokens, cookies, and session identifiers;
- unnecessary personal data or private payloads;
- full logs when a redacted diagnosis is sufficient;
- the agent's hidden reasoning;
- long transcript excerpts with no operational value;
- assumptions presented as accepted decisions.

A handoff carries pointers, states, and evidence. It does not duplicate secrets or raw conversational memory.

## Which skills contribute to continuity?

The handoff does not live inside one magic button. Several ShipGlows skills and workflow roles contribute to it:

- [`sg-resume`](/skills/sg-resume) compresses the current thread so that decisions, tasks, visible commits, and next outcomes are easier to see;
- [`sg-context`](/skills/sg-context) loads the relevant sources when a conversation starts or context needs to be restored;
- specification, task, verification, and closure workflows maintain durable truth;
- Git safeguards distinguish local work, remote backup, and deployment;
- ShipGlows routing selects the métier able to continue the outcome instead of asking the user to reconstruct the whole workflow.

You can [browse the skills catalog](/skills) or [read the public workflow doctrine](/docs) to see how these roles work together.

## A checklist before changing conversations

Before trusting a handoff, ask five questions:

1. Are the project, work item, and expected outcome unambiguous?
2. Do important decisions and tasks exist outside the chat?
3. Are authorized changes committed and backed up remotely, or is their incomplete state clearly reported?
4. Does the message distinguish evidence, unknowns, and hypotheses?
5. Does the fresh conversation know what to verify first?

If the answer is yes, opening a new conversation does not mean starting over. It means restarting from a cleaner state.

A handoff is therefore less a summarization trick than a continuity discipline. It lets agents change context without turning your project into a memory game—and lets solo founders keep their attention on the decisions that matter.
