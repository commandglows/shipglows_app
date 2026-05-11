---
artifact: brand_context
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_app
created: "2026-04-25"
updated: "2026-04-27"
status: reviewed
source_skill: sf-docs
scope: brand
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
brand_voice: clear, practical, direct
trust_posture: transparency over hype
evidence:
  - shipflow_data/business/business.md
  - README.md
depends_on:
  - shipflow_data/business/business.md@1.0.0
supersedes: []
next_review: "2026-07-26"
next_step: /sf-docs audit shipflow_data/business/branding.md
---
# Branding Guide

## Brand

- **Brand name**: ContentFlow
- **Category**: AI-assisted content operations product
- **Primary message**: "AI-assisted, human-led content execution"
- **Primary promise**: Reduce cognitive overhead so teams publish with intention.

## Brand Positioning

ContentFlow is not sold as a fully automated content factory. It is framed as an execution assistant that combines:

- idea intake,
- structured curation,
- review gates,
- scheduling control,
- resilient continuity when backend services are unavailable.

## Voice and Tone

- Clear, practical, and direct.
- Professional but not corporate.
- Concise with explicit status states (especially around sync health and offline behavior).
- Encourage trust through transparency rather than hype.
- Avoid overpromising autonomy; prefer human-in-the-loop language.

## Language

- Primary language in app copy is English.
- When writing in French, use informal address ("tu") consistently (never "vous").
- When writing in French, always keep proper French accents.
- Use short, explicit labels in navigation and status surfaces.
- Prefer terms already used in product UI: **workspace**, **onboarding**, **feed**, **drip**, **sync queue**.

## Visual and UX Language

- Interface should remain functional-first with strong affordances and readable hierarchy.
- Status badges, progress text, and banners are part of the brand trust model.
- Accessibility and feedback clarity (especially for errors and retries) are branding concerns, not just technical details.

## Terms to Use

- "degraded mode"
- "sync queue"
- "queued action"
- "reconciled ID"
- "offline access"
- "bootstrap"
- "human review"

## Terms to Avoid

- "miracle", "fully automatic", "no oversight required"
- "works without internet"
- "perfect sync guaranteed"
- exaggerated AI claims that imply no user judgment.

## Experience Principles

- If backend is unavailable, keep the product useful and explain what is blocked.
- Make waiting states understandable in 1 sentence.
- Preserve user momentum with explicit recovery paths.
- Make retry, pause, and dependency waits visible.
