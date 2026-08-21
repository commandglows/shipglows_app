---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: shipglows_app
created: "2026-08-21"
updated: "2026-08-21"
status: ready
source_skill: 007-sg-content
scope: educational-handoff-article
owner: Diane
user_story: "As a solo founder or beginner vibe coder, I want to understand what a handoff is and how ShipGlows skills make it reliable, so I can change conversations without losing the useful state of my project."
confidence: high
risk_level: medium
security_impact: yes
docs_impact: yes
linked_systems:
  - site/src/content/articles/fr/
  - site/src/content/articles/en/
  - site/src/content/skills/sg-resume.md
  - site/src/content/skills/sg-context.md
  - site/src/content/articles/fr/votre-travail-agent-est-il-vraiment-sauvegarde.md
  - site/src/content/articles/en/is-your-agent-work-actually-backed-up.md
depends_on: []
supersedes: []
evidence:
  - "Operator request 2026-08-21: create an educational article explaining handoffs and their practical details."
  - "Operator clarification 2026-08-21: the article must both teach the basic concept and serve as an entry point into ShipGlows skills."
  - "Operator decision 2026-08-21: recommend a fresh conversation when useful context becomes unreliable, not merely because a thread is long or its topic changes."
next_step: Draft and validate the paired French and English articles, then ship them on the current site PR branch.
---

# Educational Handoff Article

## Status

ready

## Acceptance Criteria

- Publish one source-faithful French article and one locale-native English peer with the same `articleKey`, reciprocal slugs, publication state, caveats, and core meaning.
- Teach the basic handoff concept before introducing ShipGlows terminology or skills.
- Explain why a long conversation can remain healthy and why degraded useful context, not length alone, motivates a fresh conversation.
- Show what a useful handoff contains, what it excludes, and how it differs from a generic summary or full transcript.
- Explain the ShipGlows flow: preserve governed decisions and open work, verify Git state, commit/push authorized mutations, generate the handoff, let the operator open a new conversation, then revalidate before mutation.
- Link naturally to `sg-resume`, `sg-context`, the skills catalog, the public workflow docs, and the Git/GitHub continuity article.
- Never claim that Codex restarts itself, that every topic change requires a new thread, or that a handoff guarantees perfect recovery.
- Run locale parity, content/schema shape, link-target existence, claim/redaction scan, and diff hygiene without a local build.

## Implementation Tasks

- [x] Resolve audience, surface, dual angle, claims, locale parity, and internal-link destinations.
- [ ] Draft the French article.
- [ ] Adapt the English peer idiomatically.
- [ ] Run focused article and claim validation without a build.
- [ ] Record editorial delivery and push each validated milestone.

## Current Chantier Flow

`operator intent ✅ -> dual angle clarified ✅ -> plan approved ✅ -> spec ready ✅ -> FR/EN draft -> focused proof -> commit/push`

## Skill Run History

| Date | Skill | Result | Evidence | Next step |
| --- | --- | --- | --- | --- |
| 2026-08-21 | sg-content | ready | The operator approved an article that teaches handoff fundamentals and demonstrates how ShipGlows skills operationalize them. | draft both locale peers |
