---
title: "Your agent changed the code. But is your work actually backed up?"
description: "Why AI-assisted development needs milestone commits, remote persistence, interruption recovery, and a clear distinction between backup and deployment."
summary: "Writing files is not the same as protecting a chantier. ShipGlows uses Git milestones and explicit delivery states to keep agent work traceable and recoverable."
publishDate: 2026-08-21
locale: "en"
articleKey: "git-backed-agent-work"
slug: "is-your-agent-work-actually-backed-up"
alternateSlug: "votre-travail-agent-est-il-vraiment-sauvegarde"
tags:
  - "git"
  - "github"
  - "ai-agents"
  - "delivery"
  - "recovery"
featured: false
draft: false
readingTime: "6 min"
---

An AI agent can change twenty files, pass every local check, and still leave the entire result vulnerable on one machine.

That is the uncomfortable gap between **code generation** and **delivery continuity**. A working tree is not a backup. A local commit is not a remote backup. A remote push is not a deployment.

For a solo founder, those distinctions matter. There may be no second engineer watching the branch, no release manager checking what reached GitHub, and no operations team reconstructing the work after a crash. The workflow itself has to make the state visible.

## The hidden local-only risk

Agentic development makes it easy to accumulate a large amount of useful work quickly. It also makes it easy to assume that because the agent described the work as complete, the work must be safe.

Several common states contradict that assumption:

- files were edited but never committed;
- a commit exists only on the current machine;
- the branch points to an unexpected remote;
- unrelated local changes were accidentally mixed into the delivery;
- the code was pushed, but nobody proved that the intended commit was deployed.

None of these states is inherently unusual. The problem is allowing them to stay invisible.

## Protect coherent milestones, not every keystroke

The answer is not to commit after every file save. That would produce noise rather than useful recovery points.

ShipGlows treats a milestone as a coherent slice of work with a stable outcome and proportional passing proof. Once that slice is validated, the governed workflow requires an exact-scope commit and an ordinary push to the resolved upstream before the next milestone begins.

This creates useful recovery points without turning Git history into a stream of arbitrary snapshots.

The same principle applies at the end of a chantier: changed work cannot be presented as cleanly closed while its commit exists only locally or its push has failed.

## Three states that should never be confused

ShipGlows separates three evidence states.

### Local

Changes are uncommitted, or the relevant commit is not yet proven reachable from the resolved upstream. The work may be useful and validated, but it still depends on the current machine.

### Backed up

The relevant chantier commit is proven reachable from the resolved Git upstream. For many projects that upstream is GitHub, but the evidence is about the configured repository—not an assumption based on a provider logo.

### Deployed

Authoritative hosting or provider evidence confirms the intended commit on a named preview, staging, or production target.

A push can establish the second state. It cannot establish the third.

## Recovery should be quiet when everything is healthy

Safety tooling becomes counterproductive when it interrupts every normal action.

ShipGlows therefore uses a lightweight, read-only persistence check only at existing lifecycle boundaries:

- before the first write of a mutating chantier;
- when an interrupted chantier resumes;
- before sensitive operations;
- before closure classification.

When the repository, branch, upstream, ownership, and persistence state are coherent, the check stays silent. It does not create another screen, questionnaire, or approval step.

When something is vulnerable, the result is actionable: identify the local-only commit, preserve unrelated dirty work, stop before guessing an ambiguous remote, or recover the last proven upstream point and the remaining local scope.

## Sensitive work needs a remote recovery point first

Authentication, payments, permissions, migrations, destructive changes, tenant boundaries, secrets, private data, and production operations have a larger blast radius than an ordinary edit.

Before that kind of mutation begins, ShipGlows requires the relevant pre-change baseline to be remotely backed up. It does not manufacture a reassuring commit from failing, incomplete, secret-bearing, ambiguous, or unrelated work.

That boundary matters: a recovery point is useful only when its contents and ownership are trustworthy.

## What this does—and does not—promise

ShipGlows can truthfully describe a governed Git workflow that:

- commits and pushes validated milestones;
- refuses clean closure for local-only changed work;
- checks for vulnerable state at meaningful boundaries;
- preserves unrelated changes outside the delivery scope;
- distinguishes remote persistence from deployment evidence.

It does not guarantee GitHub availability, zero data loss, repository protection settings, successful CI, or unattended production shipping. Those claims require provider evidence and project-specific configuration.

The value is not a magical guarantee. It is that the workflow refuses to hide which state the work is actually in.

## A practical question for any coding agent

After an agent says “done,” ask:

1. Which exact commit contains the result?
2. Is that commit reachable from the intended remote branch?
3. Were unrelated local changes excluded?
4. If deployment is claimed, which provider evidence matches that commit?
5. If the session stops now, what is the last proven recovery point?

If those answers are missing, the code may be changed without the work being safely delivered.

ShipGlows is designed to keep that distinction visible. [Read the Git continuity contract in the public docs](/docs#git-continuity), or [inspect the workflow source on GitHub](https://github.com/commandglows/shipglows).
