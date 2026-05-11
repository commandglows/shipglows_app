---
title: "sf-deploy"
slug: "sf-deploy"
tagline: "Run the whole release confidence loop instead of stitching checks, ship, prod, browser proof, and verification by hand."
summary: "A release orchestration skill for moving work through technical checks, bounded shipping, deployment readiness, post-deploy evidence, final verification, and optional changelog routing."
category: "Operate & Ship"
audience:
  - "Founders who want one release command path after implementation"
  - "Operators who need deployment proof without losing the difference between push, deploy, and verified behavior"
problem: "Release work often fragments across separate commands, and a green build or pushed commit can be mistaken for proof that the product works live."
outcome: "You get a stricter release loop that names each gate, routes the right proof skill, and keeps unproven behavior visible."
founder_angle: "This skill protects the last mile of shipping. It turns release into evidence gathering instead of a vibe check after git push."
when_to_use:
  - "When implementation is ready and you want to release the current bounded scope"
  - "When a project needs post-push deployment truth before browser or manual testing"
  - "When you want one report for checks, ship, deployment, evidence, verification, and release notes"
what_you_give:
  - "The current repository state or a target project"
  - "Optional target environment such as preview or production"
  - "Any explicit skip-check or no-changelog intent"
what_you_get:
  - "A phased release report"
  - "A route through sf-check, sf-ship, and sf-prod"
  - "Correct post-deploy evidence routing to sf-browser, sf-auth-debug, or sf-test"
  - "A final verification gate before release completion is claimed"
example_prompts:
  - "/sf-deploy"
  - "/sf-deploy --preview"
  - "/sf-deploy skip-check"
  - "/sf-deploy https://example.vercel.app"
argument_modes:
  - argument: "no argument"
    effect: "Deploys the current bounded release scope through checks, ship, deployment truth, evidence routing, and verification."
    consequence: "Stops at the first failing gate instead of overclaiming release readiness."
  - argument: "skip-check"
    effect: "Skips the pre-ship sf-check phase only."
    consequence: "The report must preserve the validation gap; ship, prod, evidence, and verify gates still apply."
  - argument: "--preview / --prod"
    effect: "Biases the deployment and evidence target toward preview/staging or production."
    consequence: "Production proof stays read-only or reversible unless a risky action is explicitly approved."
  - argument: "no-changelog"
    effect: "Skips optional release-note routing after verification."
    consequence: "Does not weaken the deploy, proof, or verification gates."
limits:
  - "It orchestrates release skills; it does not replace sf-ship, sf-prod, sf-browser, sf-auth-debug, sf-test, or sf-verify"
  - "A pushed commit, successful deployment, or 200 OK response is not treated as complete release proof"
  - "It blocks when required evidence or verification is missing"
related_skills:
  - "sf-check"
  - "sf-ship"
  - "sf-prod"
  - "sf-browser"
  - "sf-auth-debug"
  - "sf-test"
  - "sf-verify"
  - "sf-changelog"
featured: false
order: 505
---
