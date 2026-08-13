export type PublicSkill = {
  slug: string;
  name: string;
  domain: string;
  purpose: string;
  modes: string;
};

/**
 * The human-facing catalog. Runtime and lifecycle helpers deliberately remain
 * outside this list: they are selected by the owning métier when needed.
 */
export const publicSkillCatalog: PublicSkill[] = [
  { slug: "shipglows", name: "shipglows", domain: "Start here", purpose: "Describe the outcome in plain language and let ShipGlows connect governed business truth, useful judgment, and the accountable métier.", modes: "<instruction>" },
  { slug: "sg-build", name: "sg-development", domain: "Create", purpose: "Build a product, feature, integration, or site change from intent to verified result.", modes: "<goal>" },
  { slug: "sg-design", name: "sg-design", domain: "Create", purpose: "Shape UI, design systems, accessibility, and motion without losing implementation proof.", modes: "system · playground · audit · animation · redesign · migration" },
  { slug: "sg-customer", name: "sg-experience", domain: "Create", purpose: "Make journeys, onboarding, trust, recovery, and first success clear for end users.", modes: "audit · flow · onboarding · recovery" },
  { slug: "sg-bug", name: "sg-bug", domain: "Quality", purpose: "Carry a reported failure through diagnosis, repair, retest, and proof.", modes: "<bug> · --fix · --retest · --verify" },
  { slug: "sg-technical", name: "sg-engineering", domain: "Quality", purpose: "Own architecture, code quality, dependencies, performance, migrations, sync, access, and platform parity.", modes: "audit · deps · performance · migrate · github · sync · access · parity" },
  { slug: "sg-maintain", name: "sg-maintenance", domain: "Quality", purpose: "Keep an existing project healthy through a coherent maintenance lifecycle.", modes: "full · quick · security · deps · docs · audits · no-ship" },
  { slug: "sg-deploy", name: "sg-release", domain: "Publish", purpose: "Connect checks, shipping, deployment truth, and release proof.", modes: "<target> · --preview · --prod · skip-check · no-changelog" },
  { slug: "sg-content", name: "sg-content", domain: "Grow audience", purpose: "Own public documentation, articles, landing pages, FAQ, and content lifecycles.", modes: "plan · repurpose · draft · enrich · audit · apply · ship" },
  { slug: "sg-marketing", name: "sg-marketing", domain: "Grow audience", purpose: "Study the market and improve GTM, copy clarity, or persuasion with evidence.", modes: "market · gtm · copy · copywriting" },
  { slug: "sg-seo", name: "sg-seo", domain: "Grow audience", purpose: "Improve search discovery, technical SEO, and content structure.", modes: "audit · launch · monitor · fix" },
  { slug: "sg-docs", name: "sg-docs", domain: "Govern", purpose: "Maintain internal documentation, architecture context, metadata, and governance.", modes: "docs · audit · metadata · migrate-layout" },
  { slug: "sg-planning", name: "sg-planning", domain: "Organize", purpose: "Turn portfolio, product, priority, and backlog decisions into a focused execution path.", modes: "tasks · backlog · priorities · review · session" },
  { slug: "sg-help", name: "sg-help", domain: "Organize", purpose: "Explain the public catalog, modes, and the next appropriate move.", modes: "help · mode" }
];

export const publicDomains = ["Start here", "Create", "Quality", "Publish", "Grow audience", "Govern", "Organize"] as const;
