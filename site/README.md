# ShipGlows Public Site

Canonical Astro source for the public ShipGlows website.

## Canonical ownership

- Canonical source: `/home/claude/shipglowz_app/site`
- Git repository: `shipglows_app`
- Vercel project: `shipglows-site`
- Previous source `/home/claude/shipglowz/shipglows-site` was migrated here on 2026-08-02 and must not be recreated or edited as a second public surface.
- A deployed URL or `.vercel` link identifies the delivery target; it does not override this source-ownership decision.

Live URL:

```text
https://shipglows.com
```

This site is the public explanation, docs, FAQ, pricing hypothesis, blog, and skill-discovery surface for ShipGlows. It should stay aligned with the repository README and the governance corpus under `app/shipglows_data/` until that corpus is normalized at the monorepo root.

## Commands

```bash
corepack enable
pnpm install
pnpm dev
```

Build for production:

```bash
pnpm build
pnpm preview
```

## Runtime

- Node.js 24.x
- pnpm 11.15.0 via the `packageManager` pin

## Structure

- `src/pages/index.astro` - landing page
- `src/pages/docs.astro` - public docs overview
- `src/pages/blog/index.astro` and `src/pages/blog/[slug].astro` - indexed blog hub and article pages
- `src/pages/skills/index.astro` - public skill index
- `src/pages/skills/[slug].astro` - public skill detail pages
- `src/pages/pricing.astro` - pricing hypothesis
- `src/pages/faq.astro` - public FAQ
- `src/pages/about.astro` and `src/pages/contact.astro` - trust and contact pages
- `src/pages/skill-modes.astro` - public skill launch guide
- `src/pages/remote-mcp-oauth-tunnel.astro` - remote MCP OAuth tunnel explanation
- `src/pages/why-not-just-prompts.astro` - positioning page
- standalone long-form editorial pages still live directly under `src/pages/` when they own a narrow route intent; the indexed blog now lives in `src/content/articles/` plus `/blog` routes
- `src/pages/fr/` - French public routes for the main site navigation
- `src/pages/fr/blog/index.astro` and `src/pages/fr/blog/[slug].astro` - French blog hub and article pages
- `src/content/articles/` - public long-form editorial content for the declared blog surface
- `src/content/skills/` - public skill descriptions; do not paste full internal `SKILL.md` prompts
- `src/content.config.ts` - Astro content schema; keep generated content compatible
- `src/layouts/BaseLayout.astro` - base document shell
- `src/components/` - reusable page sections
- `src/styles/global.css` - global visual system

## Content Rules

- Do not publish `shipglows_data/technical/` as public site content.
- Do not expose secrets, private logs, credentials, private hostnames, or operator-only traces.
- Keep public claims aligned with `shipglows_data/business/`, `shipglows_data/editorial/`, and the current product reality.
- Keep plugin packaging claims aligned with `shipglows_data/technical/codex-plugin-packaging.md`.
- French routes may localize navigation and explanatory framing, but skill descriptions stay in English by default because agents consume the English skill contracts more reliably.
- From the monorepo root, run `pnpm --dir site build` after changing rendered site content or schemas.
