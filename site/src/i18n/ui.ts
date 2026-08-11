export type Locale = "en" | "fr";

export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "fr"];

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français"
};

const localizedPaths: Record<string, Record<Locale, string>> = {
  "/": { en: "/", fr: "/fr/" },
  "/about": { en: "/about", fr: "/fr/about" },
  "/contact": { en: "/contact", fr: "/fr/contact" },
  "/docs": { en: "/docs", fr: "/fr/docs" },
  "/blog": { en: "/blog", fr: "/fr/blog" },
  "/faq": { en: "/faq", fr: "/fr/faq" },
  "/install": { en: "/install", fr: "/fr/install" },
  "/focus-tags": { en: "/focus-tags", fr: "/fr/focus-tags" },
  "/pricing": { en: "/pricing", fr: "/fr/pricing" },
  "/skills": { en: "/skills", fr: "/fr/skills" },
  "/skill-modes": { en: "/skill-modes", fr: "/fr/skill-modes" },
  "/why-not-just-prompts": {
    en: "/why-not-just-prompts",
    fr: "/fr/pourquoi-pas-de-simples-prompts"
  },
  "/remote-mcp-oauth-tunnel": {
    en: "/remote-mcp-oauth-tunnel",
    fr: "/fr/tunnel-oauth-mcp-distant"
  }
};

export function pathFor(path: string, locale: Locale): string {
  if (path.startsWith("http")) return path;

  const [basePath, hash = ""] = path.split("#");
  if (basePath.startsWith("/blog/")) {
    const slug = basePath.replace("/blog/", "");
    const localized = locale === "fr" ? `/fr/blog/${slug}` : `/blog/${slug}`;
    return hash ? `${localized}#${hash}` : localized;
  }
  if (basePath.startsWith("/fr/blog/")) {
    const slug = basePath.replace("/fr/blog/", "");
    const localized = locale === "fr" ? `/fr/blog/${slug}` : `/blog/${slug}`;
    return hash ? `${localized}#${hash}` : localized;
  }
  const localized = localizedPaths[basePath]?.[locale] ?? basePath;
  return hash ? `${localized}#${hash}` : localized;
}

export function alternatePath(path: string, locale: Locale): string {
  return pathFor(path, locale);
}

export function siteUrl(path: string): string {
  return new URL(path, "https://shipglows.dev").toString();
}

export const navCopy = {
  en: {
    aria: "Primary",
    mobileToggle: "Menu",
    mobileOpen: "Open navigation menu",
    mobileClose: "Close navigation menu",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["About", "/about"],
      ["FAQ", "/faq"],
      ["Why not just prompts?", "/why-not-just-prompts"],
      ["How it works", "/#how-it-works"],
      ["Pricing", "/pricing"],
      ["Docs", "/docs"],
      ["Contact", "/contact"]
    ],
    github: "GitHub",
    language: "Français"
  },
  fr: {
    aria: "Navigation principale",
    mobileToggle: "Menu",
    mobileOpen: "Ouvrir le menu de navigation",
    mobileClose: "Fermer le menu de navigation",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["À propos", "/about"],
      ["FAQ", "/faq"],
      ["Pourquoi pas de simples prompts ?", "/why-not-just-prompts"],
      ["Fonctionnement", "/#how-it-works"],
      ["Prix", "/pricing"],
      ["Docs", "/docs"],
      ["Contact", "/contact"]
    ],
    github: "GitHub",
    language: "English"
  }
} satisfies Record<Locale, {
  aria: string;
  links: [string, string][];
  github: string;
  language: string;
  mobileToggle: string;
  mobileOpen: string;
  mobileClose: string;
}>;

export const footerCopy = {
  en: {
    body:
      "Built for solo founders who want less ambiguity, stronger agent handoffs, and simpler server-side shipping.",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["GitHub", "https://github.com/dianedef/ShipGlows"],
      ["Framework", "/#how-it-works"]
    ]
  },
  fr: {
    body:
      "Conçu pour les fondateurs solo qui veulent moins d’ambiguïté, des passages de relais plus solides entre agents et une livraison serveur plus simple.",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["GitHub", "https://github.com/dianedef/ShipGlows"],
      ["Framework", "/#how-it-works"]
    ]
  }
} satisfies Record<Locale, { body: string; links: [string, string][] }>;

export const homeCopy = {
  en: {
    title: "ShipGlows | Ship with agents without losing context",
    description:
      "ShipGlows helps solo founders give AI agents clear work, visible completion evidence, and connected delivery context.",
    hero: {
      eyebrow: "For Solo Founders Shipping With Agents",
      title: "Give AI agents a clearer path through important work—with evidence you can inspect.",
      body:
        "ShipGlows helps you hand off serious work without repeatedly reconstructing the project or mistaking a confident answer for a finished result. Context maps, task contracts, proportional quality and security checks, verification gates, and server controls keep the supporting evidence close to the work.",
      points: [
        "new agents can start without making you reconstruct the project",
        "important work is framed before the product changes",
        "completion considers relevant behavior, risks, and evidence—not only speed"
      ],
      actions: [
        ["Explore Skills", "/skills", "button button-primary"],
        ["View Repository", "https://github.com/dianedef/ShipGlows", "button button-secondary"],
        ["How It Works", "/#how-it-works", "button button-secondary"]
      ],
      blocks: [
        ["Without a shared path", "Repeated repo explanations, vague requests, confident output, and documentation that drifts."],
        ["With ShipGlows", "A clearer handoff: entry point, context map, scoped task, decision-quality contract, and verification loop."],
        ["When it is time to deliver", "The delivery context stays visible through Flox environments, PM2 processes, Caddy routing, and SSH access."]
      ],
      note: "One operating layer for the work AI assists with and the systems that deliver it."
    },
    features: {
      eyebrow: "Why ShipGlows Exists",
      title: "The problem is no longer typing code. It is directing the system around it.",
      body:
        "AI can scaffold easy parts quickly. The harder work is making the intended change clear, giving the right context, surfacing drift, and keeping delivery connected to the promise you made.",
      items: [
        ["New agents can start without a full project recap", "An operational context map gives a fresh agent relevant entry points, constraints, and documents instead of asking you to rebuild the story from memory."],
        ["Important work is clearer before code changes", "Task contracts, specs, readiness checks, and boundaries make the intended change explicit before an agent has to interpret it."],
        ["Trade-offs stay visible when speed is tempting", "The decision-quality contract prioritizes relevant correctness, security posture, maintainability, performance, and proof rather than treating the shortest path as the default."],
        ["A green build is not the only completion signal", "Verification compares the stated behavior with relevant edge-case, code-quality, security, documentation, and contract-drift checks; it does not turn those checks into a guarantee."],
        ["Delivery context stays connected to the work", "ShipGlows keeps relevant environments, processes, tunnels, publishing, health, and server state visible around real delivery."]
      ]
    },
    agentLoop: {
      eyebrow: "The Agent Loop",
      title: "ShipGlows helps you direct and inspect the work around an agent—not only the prompt you send it.",
      body:
        "The useful question is not whether AI can write code. It can. The useful question is whether the work is clear enough to direct, inspect, run, and explain without rewarding a fragile shortcut.",
      items: [
        ["01", "Make important work clear before changes begin", "Turn a loose request into a task contract with context, scope, acceptance criteria, constraints, and a proof path."],
        ["02", "Give the agent relevant context before editing", "Use the repository map, active contracts, quality bar, relevant docs, and operational commands to reduce avoidable reconstruction."],
        ["03", "Make completion evidence visible", "Compare stated behavior with relevant documentation, public claims, edge cases, security posture, and workflow impact before calling a change complete."],
        ["04", "Keep delivery context visible", "Keep environments, processes, tunnels, publishing, health, and logs close enough to the workflow to inspect and act on them."]
      ]
    },
    ctaCards: [
      [
        "Understand skill arguments before you guess the workflow",
        "ShipGlows skills do not all interpret arguments the same way. Some arguments describe a task. Others switch the execution path entirely.",
        "Read the launch cheatsheet",
        "/skill-modes"
      ],
      [
        "Treat the user like a founder",
        "When the conversation is business-facing, the agent should optimize for useful decisions, growth, and clarity instead of drifting into technical detail.",
        "Read the founder tag",
        "/focus-tags#business-recenter-tags"
      ],
      [
        "Treat ShipGlows like a portfolio asset",
        "When the conversation is about ShipGlows itself or adjacent assets, the agent should think in terms of operator ownership and portfolio-level arbitration.",
        "Read the ShipGlows-owner tag",
        "/focus-tags#system-recenter-tags"
      ],
      [
        "Start with the direct questions",
        "If you want a shorter entry point than the docs overview, the FAQ answers the recurring questions about workflow, documentation, and what ShipGlows is actually trying to solve.",
        "Open the FAQ",
        "/faq"
      ],
      [
        "Steer the AI with simple tags",
        "You do not always need a new prompt. A small tag pack like #offer #cta #clarity can recenter the conversation faster.",
        "Open the tag cheatsheet",
        "/focus-tags"
      ]
    ]
  },
  fr: {
    title: "ShipGlows | Livrer avec des agents sans perdre le contexte",
    description:
      "ShipGlows aide les fondateurs solo à confier un travail clair aux agents IA, à rendre la preuve de fin visible et à garder le contexte de livraison connecté.",
    hero: {
      eyebrow: "Pour les fondateurs solo qui livrent avec des agents",
      title: "Donnez aux agents IA un chemin plus clair pour avancer sur un travail important — avec des preuves que vous pouvez inspecter.",
      body:
        "ShipGlows vous aide à confier du travail sérieux sans reconstruire le projet à chaque passage de relais ni prendre une réponse assurée pour un résultat terminé. Cartes de contexte, contrats de tâche, contrôles qualité et sécurité proportionnés, portes de vérification et contrôles serveur gardent les éléments de preuve près du travail.",
      points: [
        "les nouveaux agents peuvent commencer sans vous faire reconstruire le projet",
        "les changements importants sont cadrés avant de modifier le produit",
        "la fin du travail considère comportement, risques pertinents et preuves — pas seulement la vitesse"
      ],
      actions: [
        ["Explorer les skills", "/skills", "button button-primary"],
        ["Voir le dépôt", "https://github.com/dianedef/ShipGlows", "button button-secondary"],
        ["Voir le fonctionnement", "/#how-it-works", "button button-secondary"]
      ],
      blocks: [
        ["Sans chemin partagé", "Explications répétées du dépôt, demandes floues, sortie assurée et documentation qui dérive."],
        ["Avec ShipGlows", "Un passage de relais plus clair : point d’entrée, carte de contexte, tâche cadrée, contrat de qualité de décision et boucle de vérification."],
        ["Quand il faut livrer", "Le contexte de livraison reste visible avec les environnements Flox, processus PM2, routage Caddy et accès SSH."]
      ],
      note: "Une seule couche opérationnelle pour le travail auquel l’IA contribue et les systèmes qui le livrent."
    },
    features: {
      eyebrow: "Pourquoi ShipGlows existe",
      title: "Le problème n’est plus de taper du code. C’est de diriger le système autour.",
      body:
        "L’IA peut échafauder rapidement les parties faciles. Le travail plus difficile consiste à rendre le changement attendu clair, fournir le bon contexte, faire remonter les dérives et garder la livraison reliée à la promesse faite.",
      items: [
        ["Les nouveaux agents peuvent commencer sans récapitulatif complet du projet", "Une carte de contexte opérationnelle donne à un nouvel agent les points d’entrée, contraintes et documents pertinents au lieu de vous faire reconstruire l’histoire de mémoire."],
        ["Les changements importants sont plus clairs avant le code", "Les contrats de tâche, specs, vérifications de préparation et limites rendent le changement attendu explicite avant que l’agent doive l’interpréter."],
        ["Les arbitrages restent visibles lorsque la vitesse tente", "Le contrat de qualité de décision donne la priorité à la correction pertinente, la posture sécurité, la maintenabilité, la performance et la preuve, plutôt que de faire du chemin le plus court la norme."],
        ["Un build vert n’est pas le seul signal de fin", "La vérification compare le comportement attendu avec des contrôles pertinents sur les cas limites, la qualité du code, la sécurité, la documentation et les dérives de contrat ; elle ne transforme pas ces contrôles en garantie."],
        ["Le contexte de livraison reste relié au travail", "ShipGlows garde les environnements, processus, tunnels, publication, santé et état serveur pertinents visibles autour de la livraison réelle."]
      ]
    },
    agentLoop: {
      eyebrow: "La boucle agent",
      title: "ShipGlows vous aide à diriger et inspecter le travail autour de l’agent, pas seulement le prompt envoyé.",
      body:
        "La question utile n’est pas de savoir si l’IA peut écrire du code. Elle le peut. La question utile est de savoir si le travail est assez clair pour être dirigé, inspecté, exécuté et expliqué sans récompenser un raccourci fragile.",
      items: [
        ["01", "Rendre les changements importants clairs avant de commencer", "Transformer une demande floue en contrat de tâche avec contexte, périmètre, critères d’acceptation, contraintes et chemin de preuve."],
        ["02", "Donner à l’agent le contexte pertinent avant l’édition", "Utiliser la carte du dépôt, les contrats actifs, le niveau d’exigence, les docs pertinentes et les commandes opérationnelles pour limiter les reconstructions évitables."],
        ["03", "Rendre la preuve de fin visible", "Comparer le comportement attendu avec les docs, claims publics, cas limites, posture sécurité et impact workflow pertinents avant de considérer un changement terminé."],
        ["04", "Garder le contexte de livraison visible", "Garder environnements, processus, tunnels, publications, états de santé et logs assez proches du workflow pour les inspecter et agir dessus."]
      ]
    },
    ctaCards: [
      [
        "Comprendre les arguments de skills avant de deviner le workflow",
        "Les skills ShipGlows n’interprètent pas tous les arguments de la même façon. Certains décrivent une tâche. D’autres changent entièrement le chemin d’exécution.",
        "Lire l’aide au lancement",
        "/skill-modes"
      ],
      [
        "Traiter l’utilisateur comme un founder",
        "Quand la conversation est orientée business, l’agent doit viser des décisions utiles, la croissance et la clarté plutôt que la dérive technique.",
        "Lire le tag founder",
        "/focus-tags#business-recenter-tags"
      ],
      [
        "Traiter ShipGlows comme un actif de portefeuille",
        "Quand la conversation concerne ShipGlows ou ses actifs adjacents, l’agent doit raisonner en propriétaire et arbitrer au niveau portefeuille.",
        "Lire le tag ShipGlows-owner",
        "/focus-tags#system-recenter-tags"
      ],
      [
        "Commencer par les questions directes",
        "Pour une entrée plus courte que la vue d’ensemble des docs, la FAQ répond aux questions récurrentes sur le workflow, la documentation et ce que ShipGlows cherche vraiment à résoudre.",
        "Ouvrir la FAQ",
        "/faq"
      ],
      [
        "Recentrer l’IA avec des tags simples",
        "Vous n’avez pas toujours besoin d’un nouveau prompt. Un petit pack comme #offer #cta #clarity recentre plus vite la conversation.",
        "Ouvrir la cheatsheet tags",
        "/focus-tags"
      ]
    ]
  }
} as const;

export const sharedHomeSections = {
  en: {
    product: {
      eyebrow: "What ShipGlows Is",
      title: "A practical way to direct and check AI-assisted work.",
      body:
        "ShipGlows helps turn an agent’s output into work you can understand, inspect, and carry through delivery. It connects the agent workflow, decision contracts, verification, and server lifecycle without asking you to treat automation as proof.",
      panels: [
        ["Help agents start with the right context", ["give a fresh agent a route to relevant context", "frame non-trivial work before coding starts", "compare completion with explicit contracts", "keep business, product, and documentation traceable"]],
        ["Keep delivery context visible", ["run isolated environments with Flox", "manage processes and lifecycle with PM2", "publish through Caddy and DuckDNS", "inspect tunnels, checks, and runtime operations without duct tape"]]
      ]
    },
    proof: {
      eyebrow: "Proof, Not Hype",
      title: "Inspect the mechanisms behind the promise.",
      body:
        "ShipGlows does not ask you to trust vague automation claims. The supporting evidence is in the files, workflows, checks, and operations you can inspect; those checks are visible signals, not guarantees.",
      pills: [
        "AGENT.md + operational context",
        "sg-spec -> sg-ready -> sg-start -> sg-verify",
        "decision-quality contract",
        "artifact templates",
        "Python stdlib metadata linter",
        "edge-case, code-quality, and security gates",
        "verification and audit skills",
        "PM2 + Flox + Caddy operations"
      ]
    },
    pricing: {
      eyebrow: "Pricing Hypothesis",
      title: "The commercial model is still open. The buying motion should stay simple.",
      body:
        "ShipGlows is being framed for solo founders first. That means the offer should stay legible, autonomy-oriented, and compatible with a short decision cycle.",
      cards: [
        ["Likely fit", "Productized software, paid access, or a lightweight hybrid with setup and support. The key is a simple founder-friendly path, not an enterprise sales machine."],
        ["What matters first", "Strong positioning, visible proof, real usage, and a clear reason to trust the framework before pricing pressure becomes the main question."]
      ]
    },
    docs: {
      eyebrow: "Documentation Entry",
      title: "Start with the docs that actually move the work.",
      body:
        "If you want to understand ShipGlows fast, begin with the routing and context layer, then follow the workflow and decision contracts.",
      links: [
        ["Documentation overview", "/docs"],
        ["AGENT + CONTEXT entrypoint", "/docs#artifact-corpus"],
        ["Workflow doctrine", "/docs#execution-logic"]
      ]
    },
    cta: {
      eyebrow: "Start Here",
      title: "If agent handoffs keep losing context, start with a clearer path.",
      body:
        "Start with the repository, read the docs as working contracts, and inspect how ShipGlows connects context, execution, verification, and delivery operations in one practical system.",
      actions: [
        ["Open The Repository", "https://github.com/dianedef/ShipGlows", "button button-primary"],
        ["Read The Docs", "/docs", "button button-secondary"]
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "The obvious questions, answered directly.",
      bodyPrefix: "If you want a deeper walkthrough of argument-triggered workflows, read the",
      bodyMiddle: " skill launch cheatsheet",
      bodySuffix: ". If you want the broader set of common questions in one place, open the",
      bodyEnd: "full FAQ page",
      items: [
        ["Is ShipGlows a server tool or an AI workflow framework?", "Both. The point is to keep agent execution discipline and server delivery inside one coherent operating model."],
        ["Why not just prompt agents harder?", "Because the main failure mode is not only prompt quality. It is lost context, weak handoffs, silent ambiguity, and drift between docs, product intent, and implementation."],
        ["Does ShipGlows optimize for speed?", "Only after quality is safe. The default is correctness, security, maintainability, relevant performance, and proof before speed, cost, or the shortest path."],
        ["Do I need the full documentation layer to get value?", "No. But the docs become more valuable as the work gets less trivial. The framework is designed so a fresh agent can orient quickly without rebuilding the same context from scratch."],
        ["How do skill arguments actually work?", "Some skills treat the argument as plain task text, while others use it as a mode switch or a structured input. The behavior is defined by the skill contract, not guessed from the command name."],
        ["Is this a general-purpose PaaS?", "No. ShipGlows is not trying to abstract every hosting model. It is a practical framework for running and shipping real projects while guiding AI-assisted delivery more tightly."]
      ]
    }
  },
  fr: {
    product: {
      eyebrow: "Ce qu’est ShipGlows",
      title: "Une façon pratique de diriger et vérifier le travail assisté par IA.",
      body:
        "ShipGlows aide à transformer la sortie d’un agent en travail que vous pouvez comprendre, inspecter et mener jusqu’à la livraison. Il relie le workflow agent, les contrats de décision, la vérification et le cycle de vie serveur sans prendre l’automatisation pour une preuve.",
      panels: [
        ["Aider les agents à partir du bon contexte", ["donner à un nouvel agent un chemin vers le contexte pertinent", "cadrer le travail non trivial avant le code", "comparer la fin du travail à des contrats explicites", "garder business, produit et documentation traçables"]],
        ["Garder le contexte de livraison visible", ["exécuter des environnements isolés avec Flox", "gérer les processus et leur cycle de vie avec PM2", "publier via Caddy et DuckDNS", "inspecter tunnels, contrôles et opérations runtime sans bricolage"]]
      ]
    },
    proof: {
      eyebrow: "Preuve, pas storytelling",
      title: "Inspectez les mécanismes qui soutiennent la promesse.",
      body:
        "ShipGlows ne vous demande pas de croire des promesses d’automatisation vagues. Les éléments qui soutiennent la promesse sont dans les fichiers, workflows, contrôles et opérations inspectables ; ces contrôles sont des signaux visibles, pas des garanties.",
      pills: [
        "AGENT.md + contexte opérationnel",
        "sg-spec -> sg-ready -> sg-start -> sg-verify",
        "contrat de qualité de décision",
        "templates d’artefacts",
        "linter de métadonnées en bibliothèque standard Python",
        "portes de cas limites, qualité du code et sécurité",
        "skills de vérification et d’audit",
        "opérations PM2 + Flox + Caddy"
      ]
    },
    pricing: {
      eyebrow: "Hypothèse tarifaire",
      title: "Le modèle commercial reste ouvert. Le parcours d’achat doit rester simple.",
      body:
        "ShipGlows est d’abord cadré pour les fondateurs solo. L’offre doit donc rester lisible, orientée autonomie et compatible avec un cycle de décision court.",
      cards: [
        ["Ajustement probable", "Logiciel packagé, accès payant ou hybride léger avec setup et support. L’essentiel est un chemin simple pour fondateurs, pas une machine commerciale enterprise."],
        ["Ce qui compte d’abord", "Positionnement fort, preuve visible, usage réel et raison claire de faire confiance au framework avant que la pression tarifaire devienne la question principale."]
      ]
    },
    docs: {
      eyebrow: "Entrée documentation",
      title: "Commencez par les docs qui font réellement avancer le travail.",
      body:
        "Pour comprendre ShipGlows vite, partez de la couche de routage et de contexte, puis suivez le workflow et les contrats de décision.",
      links: [
        ["Vue d’ensemble des docs", "/docs"],
        ["Point d’entrée AGENT + CONTEXT", "/docs#artifact-corpus"],
        ["Doctrine de workflow", "/docs#execution-logic"]
      ]
    },
    cta: {
      eyebrow: "Commencer ici",
      title: "Si vos passages de relais perdent le contexte, commencez par un chemin plus clair.",
      body:
        "Commencez par le dépôt, lisez les docs comme des contrats de travail et inspectez comment ShipGlows relie contexte, exécution, vérification et opérations de livraison dans un système pratique.",
      actions: [
        ["Ouvrir le dépôt", "https://github.com/dianedef/ShipGlows", "button button-primary"],
        ["Lire les docs", "/docs", "button button-secondary"]
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "Les questions évidentes, avec des réponses directes.",
      bodyPrefix: "Pour une explication plus complète des workflows déclenchés par arguments, lisez",
      bodyMiddle: " l’aide au lancement des skills",
      bodySuffix: ". Pour toutes les questions fréquentes au même endroit, ouvrez la",
      bodyEnd: "FAQ complète",
      items: [
        ["ShipGlows est-il un outil serveur ou un framework de workflow IA ?", "Les deux. Le but est de garder la discipline d’exécution des agents et la livraison serveur dans un même modèle opérationnel cohérent."],
        ["Pourquoi ne pas simplement mieux prompter les agents ?", "Parce que le mode d’échec principal n’est pas seulement la qualité du prompt. C’est le contexte perdu, les passages de relais faibles, l’ambiguïté silencieuse et la dérive entre docs, intention produit et implémentation."],
        ["ShipGlows optimise-t-il pour la vitesse ?", "Seulement quand la qualité est sûre. Par défaut, la correction, la sécurité, la maintenabilité, la performance pertinente et la preuve passent avant la vitesse, le coût ou le chemin le plus court."],
        ["Faut-il toute la couche documentaire pour obtenir de la valeur ?", "Non. Mais les docs deviennent plus précieuses à mesure que le travail devient moins trivial. Le framework est conçu pour qu’un nouvel agent s’oriente vite sans reconstruire le même contexte depuis zéro."],
        ["Comment fonctionnent vraiment les arguments de skills ?", "Certains skills traitent l’argument comme du texte de tâche, d’autres comme un commutateur de mode ou une entrée structurée. Le comportement est défini par le contrat du skill, pas deviné depuis son nom."],
        ["Est-ce un PaaS généraliste ?", "Non. ShipGlows ne cherche pas à abstraire tous les modèles d’hébergement. C’est un framework pratique pour exécuter et livrer de vrais projets tout en guidant plus strictement la livraison assistée par IA."]
      ]
    }
  }
} as const;

export const roleMapCopy = {
  en: {
    eyebrow: "How It Stays Coherent",
    title: "Every document has one job.",
    body:
      "ShipGlows documentation is not trying to be encyclopedic. It is designed to be complete for fast agent navigation, with one explicit and exclusive role per artifact.",
    docs: [
      ["AGENT.md (compat)", "point of entry for a fresh agent"],
      ["shipglows_data/*", "project-local governance corpus for adopted repos"],
      ["shipglows_data/technical/context.md", "operational map of the repository"],
      ["shipglows_data/technical/context-function-tree.md", "structural index for large procedural files"],
      ["shipglows_data/editorial/content-map.md", "where content lives and how it is repurposed"],
      ["shipglows_data/business/business.md", "for whom, what value, what model"],
      ["shipglows_data/business/product.md", "what, workflows, non-goals"],
      ["shipglows_data/branding/branding.md", "how the product speaks"],
      ["shipglows_data/business/gtm.md", "how the product is presented and distributed"],
      ["shipglows_data/technical/architecture.md", "how the system is organized"],
      ["shipglows_data/technical/guidelines.md", "how contributors should work inside it"],
      ["shipglows_data/technical/decisions/project-governance-layout.md", "where project governance artifacts belong"]
    ]
  },
  fr: {
    eyebrow: "Comment l’ensemble reste cohérent",
    title: "Chaque document a un seul rôle.",
    body:
      "La documentation ShipGlows ne cherche pas à être encyclopédique. Elle est conçue pour orienter vite les agents, avec un rôle explicite et exclusif pour chaque artefact.",
    docs: [
      ["AGENT.md (compat)", "point d’entrée pour un nouvel agent"],
      ["shipglows_data/*", "corpus de gouvernance local au projet pour les dépôts adoptés"],
      ["shipglows_data/technical/context.md", "carte opérationnelle du dépôt"],
      ["shipglows_data/technical/context-function-tree.md", "index structurel pour les grands fichiers procéduraux"],
      ["shipglows_data/editorial/content-map.md", "où vit le contenu et comment il est réutilisé"],
      ["shipglows_data/business/business.md", "pour qui, quelle valeur, quel modèle"],
      ["shipglows_data/business/product.md", "quoi, workflows, non-objectifs"],
      ["shipglows_data/branding/branding.md", "comment le produit s’exprime"],
      ["shipglows_data/business/gtm.md", "comment le produit est présenté et distribué"],
      ["shipglows_data/technical/architecture.md", "comment le système est organisé"],
      ["shipglows_data/technical/guidelines.md", "comment contribuer dans le dépôt"],
      ["shipglows_data/technical/decisions/project-governance-layout.md", "où doivent vivre les artefacts de gouvernance projet"]
    ]
  }
} as const;
