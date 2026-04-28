---
artifact: content_map
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "contentflow_app"
created: "2026-04-26"
updated: "2026-04-27"
status: "reviewed"
source_skill: sf-docs
scope: content_map
owner: "Diane"
confidence: "medium"
risk_level: "low"
docs_impact: "yes"
security_impact: "none"
evidence:
  - "lib/router.dart"
  - "web/index.html"
  - "web_auth/sign-in.html"
  - "web_auth/sign-up.html"
  - "web_auth/sso-callback.html"
  - "README.md"
  - "CLAUDE.md"
  - "specs/*.md"
  - "CHANGELOG.md"
  - "TASKS.md"
depends_on:
  - "BUSINESS.md@1.0.0"
  - "BRANDING.md@1.0.0"
  - "GUIDELINES.md@1.0.0"
supersedes: []
content_surfaces:
  - web runtime shell (Flutter app)
  - web auth handoff pages (`/sign-in`, `/sign-up`, `/sso-callback`)
  - app navigation and workflow screens
  - operational docs and changelog references
  - specs and design/verification notes
next_review: "2026-07-26"
next_step: "/sf-docs audit CONTENT_MAP.md"
---

# Content Map — contentflow_app

## Purpose of this map
`contentflow_app` is a Flutter application repository with a production web shell plus Clerk web auth assets. It has limited in-repo marketing/content pages; most public-facing acquisition copy lives outside this repo.

## 1) Public-facing runtime entrypoints (repo-owned)

### App shell (Flutter web)
- `web/index.html`: Flutter bootstrap page used by the web bundle.
- `web/manifest.json`, `web/icons/*`: installability and app icons.
- `lib/main.dart`: app bootstrapping entry for runtime.
- `lib/router.dart`: canonical route graph and auth/state-aware redirects.

### Auth web assets
- `web_auth/sign-in.html`
- `web_auth/sign-up.html`
- `web_auth/sso-callback.html`

These are explicitly injected/copied into web builds and referenced by deployment scripts.

## 2) Route surface (app navigation)

Primary shell routes:
- `/entry`
- `/auth`
- `/onboarding`
- `/feed`
- `/calendar`
- `/history`
- `/activity`
- `/affiliations`
- `/runs`
- `/templates`
- `/newsletter`
- `/research`
- `/reels`
- `/seo`
- `/drip`
- `/content-tools`
- `/analytics`
- `/idea-pool`
- `/work-domains`
- `/performance`
- `/uptime`
- `/settings`
- `/projects`
- `/feedback`
- `/feedback-admin`
- `/editor/:id`
- `/ritual`
- `/personas`
- `/personas/new`
- `/personas/:id`
- `/angles`
- `/settings/integrations`

## 3) Operational documentation surfaces

### Decision and context documents
- `README.md`
- `CLAUDE.md`
- `BUSINESS.md`
- `BRANDING.md`
- `GUIDELINES.md`
- `CHANGELOG.md`
- `AUDIT_LOG.md`

### Execution and technical specs
- `specs/*.md` (active spec set for current and next implementation phase).

### Task and verification surface
- `TASKS.md`

## 4) Scripts and runtime tool surface

- `build.sh`, `pm2-web.sh`, `scripts/vercel-*.sh`, `scripts/validate-clerk-runtime.sh`, `scripts/install-web-auth.sh`
- `.env.example`

## 5) Cross-repo links / navigation assumptions

- `contentflow_site` (external) is the primary acquisition/landing ecosystem surface and not documented in detail here.
- `contentflow_lab` (external API/service owner) is the backend + AI/automation context referenced by code and specs.
- Internal routing/docs should treat those repos as separate canonical sources for their own surfaces.

## 6) Documentation mapping by user intent

- **Get started / run locally**: `README.md` → scripts + env sample.
- **Onboard as operator**: `/entry`, `/onboarding`, then authenticated dashboard routes.
- **Recover during incidents**: `/uptime`, `/performance`, and changelog/spec evidence.
- **Support requests**: `Feedback` route + admin route and feedback API contract specs.

## 7) Gaps (explicit)

- No in-repo Astro/marketing landing markdown pages.
- No dedicated help center or FAQ page in this repository.
- Publish integration is represented in code/spec state, but not yet fully closed end-to-end.
