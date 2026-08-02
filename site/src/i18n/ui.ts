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
  return new URL(path, "https://shipflow.dev").toString();
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
      ["GitHub", "https://github.com/dianedef/ShipGlowz"],
      ["Framework", "/#how-it-works"]
    ]
  },
  fr: {
    body:
      "Conçu pour les fondateurs solo qui veulent moins d’ambiguïté, des passages de relais plus solides entre agents et une livraison serveur plus simple.",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["GitHub", "https://github.com/dianedef/ShipGlowz"],
      ["Framework", "/#how-it-works"]
    ]
  }
} satisfies Record<Locale, { body: string; links: [string, string][] }>;

export const homeCopy = {
  en: {
    title: "ShipGlowz | Ship with agents without losing context",
    description:
      "ShipGlowz is a unified framework for server delivery and AI-assisted execution discipline for solo founders and autonomous builders.",
    hero: {
      eyebrow: "For Solo Founders Shipping With Agents",
      title: "AI made building faster. It also made weak handoffs more expensive.",
      body:
        "ShipGlowz gives each agent run a context map, a task contract, a quality bar, verification gates, and the server controls needed to ship real projects. The point is not to make agents move faster at any cost. The point is to stop handing serious work to a blank thread and hoping it reconstructs the system correctly.",
      points: [
        "fresh agents start from a known map, not chat residue",
        "non-trivial work gets shaped before code starts",
        "shortcuts lose to correctness, security, maintainability, and proof"
      ],
      actions: [
        ["Explore Skills", "/skills", "button button-primary"],
        ["View Repository", "https://github.com/dianedef/ShipGlowz", "button button-secondary"],
        ["How It Works", "/#how-it-works", "button button-secondary"]
      ],
      blocks: [
        ["Without a system", "Same repo explanation, vague prompt, confident output, stale docs."],
        ["With ShipGlowz", "Entry point, context map, scoped task, quality contract, verification loop."],
        ["Real shipping", "Flox environments, PM2 processes, Caddy routing, SSH access."]
      ],
      note: "One operating layer for the work AI writes and the systems that run it."
    },
    features: {
      eyebrow: "Why ShipGlowz Exists",
      title: "The problem is no longer typing code. It is directing the system around it.",
      body:
        "AI can scaffold the easy parts quickly. The hard part is deciding what deserves a professional solution, feeding the right context, catching drift, and keeping the deployment path connected to the promise you made.",
      items: [
        ["Context becomes infrastructure", "A fresh thread gets a point of entry, an operational map, and explicit contracts instead of rebuilding the same story from memory."],
        ["Planning happens before prompting", "Specs, readiness checks, and task boundaries turn a loose request into work an agent can execute without guessing the product."],
        ["Quality beats the shortest path", "Model choice, routing, implementation, and verification optimize for correctness, security, maintainability, relevant performance, and proof before speed or convenience."],
        ["Review has something to test against", "Verification is not optimism after a green build. It checks behavior, docs, and contract drift against what the work was supposed to change."],
        ["The server path stays in the loop", "ShipGlowz also keeps operational reality visible: environments, processes, tunnels, publishing, health, and the server state around real delivery."]
      ]
    },
    agentLoop: {
      eyebrow: "The Agent Loop",
      title: "ShipGlowz covers the work around the agent, not only the prompt you send it.",
      body:
        "The useful question is not whether AI can write code. It can. The useful question is whether your system can direct, inspect, run, and explain that work without rewarding the fastest fragile path.",
      items: [
        ["01", "Frame the work before the agent starts", "Turn a loose request into context, scope, acceptance criteria, and constraints the agent can actually follow."],
        ["02", "Choose the professional path before editing", "Give the agent the repo map, the active contracts, the quality bar, the relevant docs, and the operational commands before it edits."],
        ["03", "Verify against the promise and the quality bar", "Check behavior, docs, public claims, edge cases, security posture, and workflow impact before treating a change as done."],
        ["04", "Ship with the server state still visible", "Keep environments, processes, tunnels, publishing, health, and logs close enough to the agent workflow to act on them."]
      ]
    },
    ctaCards: [
      [
        "Understand skill arguments before you guess the workflow",
        "ShipGlowz skills do not all interpret arguments the same way. Some arguments describe a task. Others switch the execution path entirely.",
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
        "Treat ShipGlowz like a portfolio asset",
        "When the conversation is about ShipGlowz itself or adjacent assets, the agent should think in terms of operator ownership and portfolio-level arbitration.",
        "Read the ShipGlowz-owner tag",
        "/focus-tags#system-recenter-tags"
      ],
      [
        "Start with the direct questions",
        "If you want a shorter entry point than the docs overview, the FAQ answers the recurring questions about workflow, documentation, and what ShipGlowz is actually trying to solve.",
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
    title: "ShipGlowz | Livrer avec des agents sans perdre le contexte",
    description:
      "ShipGlowz est un framework unifié pour la livraison serveur et la discipline d’exécution assistée par IA, pensé pour les fondateurs solo et les builders autonomes.",
    hero: {
      eyebrow: "Pour les fondateurs solo qui livrent avec des agents",
      title: "L’IA a accéléré la construction. Elle a aussi rendu les mauvais passages de relais plus coûteux.",
      body:
        "ShipGlowz donne à chaque exécution d’agent une carte de contexte, un contrat de tâche, un niveau d’exigence, des portes de vérification et les contrôles serveur nécessaires pour livrer de vrais projets. Le but n’est pas de faire aller les agents plus vite à tout prix. Le but est d’arrêter de confier du travail sérieux à un fil vide en espérant qu’il reconstruise correctement le système.",
      points: [
        "les nouveaux agents partent d’une carte connue, pas de résidus de chat",
        "le travail non trivial est cadré avant le code",
        "les raccourcis passent après la correction, la sécurité, la maintenabilité et la preuve"
      ],
      actions: [
        ["Explorer les skills", "/skills", "button button-primary"],
        ["Voir le dépôt", "https://github.com/dianedef/ShipGlowz", "button button-secondary"],
        ["Voir le fonctionnement", "/#how-it-works", "button button-secondary"]
      ],
      blocks: [
        ["Sans système", "Même explication du dépôt, prompt vague, sortie assurée, docs périmées."],
        ["Avec ShipGlowz", "Point d’entrée, carte de contexte, tâche cadrée, contrat qualité, boucle de vérification."],
        ["Livraison réelle", "Environnements Flox, processus PM2, routage Caddy, accès SSH."]
      ],
      note: "Une seule couche opérationnelle pour le travail écrit par l’IA et les systèmes qui l’exécutent."
    },
    features: {
      eyebrow: "Pourquoi ShipGlowz existe",
      title: "Le problème n’est plus de taper du code. C’est de diriger le système autour.",
      body:
        "L’IA peut échafauder rapidement les parties faciles. Le plus difficile est de décider ce qui mérite une solution professionnelle, de fournir le bon contexte, de détecter les dérives et de garder le chemin de déploiement relié à la promesse faite.",
      items: [
        ["Le contexte devient une infrastructure", "Un nouveau fil reçoit un point d’entrée, une carte opérationnelle et des contrats explicites au lieu de reconstruire la même histoire de mémoire."],
        ["La planification précède le prompt", "Les specs, les vérifications de préparation et les limites de tâche transforment une demande floue en travail exécutable sans deviner le produit."],
        ["La qualité passe avant le chemin le plus court", "Le choix du modèle, le routage, l’implémentation et la vérification optimisent la correction, la sécurité, la maintenabilité, la performance utile et la preuve avant la vitesse ou la commodité."],
        ["La revue a quelque chose à tester", "La vérification n’est pas de l’optimisme après un build vert. Elle contrôle le comportement, les docs et les dérives de contrat face à ce que le travail devait changer."],
        ["Le chemin serveur reste dans la boucle", "ShipGlowz garde aussi la réalité opérationnelle visible : environnements, processus, tunnels, publication, santé et état serveur autour de la livraison réelle."]
      ]
    },
    agentLoop: {
      eyebrow: "La boucle agent",
      title: "ShipGlowz couvre le travail autour de l’agent, pas seulement le prompt envoyé.",
      body:
        "La question utile n’est pas de savoir si l’IA peut écrire du code. Elle le peut. La question utile est de savoir si votre système peut diriger, inspecter, exécuter et expliquer ce travail sans récompenser le chemin fragile le plus rapide.",
      items: [
        ["01", "Cadrer le travail avant le départ de l’agent", "Transformer une demande floue en contexte, périmètre, critères d’acceptation et contraintes réellement suivables."],
        ["02", "Choisir le chemin professionnel avant l’édition", "Donner à l’agent la carte du dépôt, les contrats actifs, le niveau d’exigence, les docs pertinentes et les commandes opérationnelles avant qu’il modifie les fichiers."],
        ["03", "Vérifier face à la promesse et au niveau d’exigence", "Contrôler le comportement, les docs, les claims publics, les cas limites, la posture sécurité et l’impact workflow avant de considérer le changement terminé."],
        ["04", "Livrer avec l’état serveur toujours visible", "Garder les environnements, processus, tunnels, publications, états de santé et logs assez proches du workflow agent pour agir dessus."]
      ]
    },
    ctaCards: [
      [
        "Comprendre les arguments de skills avant de deviner le workflow",
        "Les skills ShipGlowz n’interprètent pas tous les arguments de la même façon. Certains décrivent une tâche. D’autres changent entièrement le chemin d’exécution.",
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
        "Traiter ShipGlowz comme un actif de portefeuille",
        "Quand la conversation concerne ShipGlowz ou ses actifs adjacents, l’agent doit raisonner en propriétaire et arbitrer au niveau portefeuille.",
        "Lire le tag ShipGlowz-owner",
        "/focus-tags#system-recenter-tags"
      ],
      [
        "Commencer par les questions directes",
        "Pour une entrée plus courte que la vue d’ensemble des docs, la FAQ répond aux questions récurrentes sur le workflow, la documentation et ce que ShipGlowz cherche vraiment à résoudre.",
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
      eyebrow: "What ShipGlowz Is",
      title: "The operating model around AI-generated work.",
      body:
        "AI can produce code faster than your old process can safely absorb it. ShipGlowz connects the agent workflow, the decision contracts, and the server lifecycle so the output has somewhere disciplined to land.",
      panels: [
        ["Delivery discipline for agents", ["route a fresh agent to the right context fast", "shape non-trivial work before coding starts", "verify against contracts instead of hope", "keep business, product, and docs traceable"]],
        ["Server control for real shipping", ["run isolated environments with Flox", "manage processes and lifecycle with PM2", "publish through Caddy and DuckDNS", "use tunnels, checks, and runtime operations without duct tape"]]
      ]
    },
    proof: {
      eyebrow: "Proof, Not Hype",
      title: "The mechanism is visible before you buy the story.",
      body:
        "ShipGlowz should not ask you to trust vague automation claims. The proof is in the files, workflows, gates, and operations you can inspect.",
      pills: [
        "AGENT.md + operational context",
        "sf-spec -> sf-ready -> sf-start -> sf-verify",
        "decision-quality contract",
        "artifact templates",
        "Python stdlib metadata linter",
        "verification and audit skills",
        "PM2 + Flox + Caddy operations"
      ]
    },
    pricing: {
      eyebrow: "Pricing Hypothesis",
      title: "The commercial model is still open. The buying motion should stay simple.",
      body:
        "ShipGlowz is being framed for solo founders first. That means the offer should stay legible, autonomy-oriented, and compatible with a short decision cycle.",
      cards: [
        ["Likely fit", "Productized software, paid access, or a lightweight hybrid with setup and support. The key is a simple founder-friendly path, not an enterprise sales machine."],
        ["What matters first", "Strong positioning, visible proof, real usage, and a clear reason to trust the framework before pricing pressure becomes the main question."]
      ]
    },
    docs: {
      eyebrow: "Documentation Entry",
      title: "Start with the docs that actually move the work.",
      body:
        "If you want to understand ShipGlowz fast, begin with the routing and context layer, then follow the workflow and decision contracts.",
      links: [
        ["Documentation overview", "/docs"],
        ["AGENT + CONTEXT entrypoint", "/docs#artifact-corpus"],
        ["Workflow doctrine", "/docs#execution-logic"]
      ]
    },
    cta: {
      eyebrow: "Start Here",
      title: "If your agents move fast but your handoffs keep leaking context, start here.",
      body:
        "Start with the repo, read the docs like working contracts, and inspect how ShipGlowz turns context, execution, verification, and server operations into one practical system.",
      actions: [
        ["Open The Repository", "https://github.com/dianedef/ShipGlowz", "button button-primary"],
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
        ["Is ShipGlowz a server tool or an AI workflow framework?", "Both. The point is to keep agent execution discipline and server delivery inside one coherent operating model."],
        ["Why not just prompt agents harder?", "Because the main failure mode is not only prompt quality. It is lost context, weak handoffs, silent ambiguity, and drift between docs, product intent, and implementation."],
        ["Does ShipGlowz optimize for speed?", "Only after quality is safe. The default is correctness, security, maintainability, relevant performance, and proof before speed, cost, or the shortest path."],
        ["Do I need the full documentation layer to get value?", "No. But the docs become more valuable as the work gets less trivial. The framework is designed so a fresh agent can orient quickly without rebuilding the same context from scratch."],
        ["How do skill arguments actually work?", "Some skills treat the argument as plain task text, while others use it as a mode switch or a structured input. The behavior is defined by the skill contract, not guessed from the command name."],
        ["Is this a general-purpose PaaS?", "No. ShipGlowz is not trying to abstract every hosting model. It is a practical framework for running and shipping real projects while guiding AI-assisted delivery more tightly."]
      ]
    }
  },
  fr: {
    product: {
      eyebrow: "Ce qu’est ShipGlowz",
      title: "Le modèle opérationnel autour du travail généré par IA.",
      body:
        "L’IA peut produire du code plus vite que votre ancien processus ne peut l’absorber en sécurité. ShipGlowz relie le workflow agent, les contrats de décision et le cycle de vie serveur pour que la sortie ait un cadre discipliné où atterrir.",
      panels: [
        ["Discipline de livraison pour agents", ["orienter vite un nouvel agent vers le bon contexte", "cadrer le travail non trivial avant le code", "vérifier face aux contrats plutôt qu’espérer", "garder business, produit et docs traçables"]],
        ["Contrôle serveur pour livrer réellement", ["exécuter des environnements isolés avec Flox", "gérer les processus et leur cycle de vie avec PM2", "publier via Caddy et DuckDNS", "utiliser tunnels, contrôles et opérations runtime sans bricolage"]]
      ]
    },
    proof: {
      eyebrow: "Preuve, pas storytelling",
      title: "Le mécanisme est visible avant d’acheter l’histoire.",
      body:
        "ShipGlowz ne devrait pas vous demander de croire des promesses d’automatisation vagues. La preuve est dans les fichiers, workflows, portes et opérations inspectables.",
      pills: [
        "AGENT.md + contexte opérationnel",
        "sf-spec -> sf-ready -> sf-start -> sf-verify",
        "contrat de qualité de décision",
        "templates d’artefacts",
        "linter de métadonnées en bibliothèque standard Python",
        "skills de vérification et d’audit",
        "opérations PM2 + Flox + Caddy"
      ]
    },
    pricing: {
      eyebrow: "Hypothèse tarifaire",
      title: "Le modèle commercial reste ouvert. Le parcours d’achat doit rester simple.",
      body:
        "ShipGlowz est d’abord cadré pour les fondateurs solo. L’offre doit donc rester lisible, orientée autonomie et compatible avec un cycle de décision court.",
      cards: [
        ["Ajustement probable", "Logiciel packagé, accès payant ou hybride léger avec setup et support. L’essentiel est un chemin simple pour fondateurs, pas une machine commerciale enterprise."],
        ["Ce qui compte d’abord", "Positionnement fort, preuve visible, usage réel et raison claire de faire confiance au framework avant que la pression tarifaire devienne la question principale."]
      ]
    },
    docs: {
      eyebrow: "Entrée documentation",
      title: "Commencez par les docs qui font réellement avancer le travail.",
      body:
        "Pour comprendre ShipGlowz vite, partez de la couche de routage et de contexte, puis suivez le workflow et les contrats de décision.",
      links: [
        ["Vue d’ensemble des docs", "/docs"],
        ["Point d’entrée AGENT + CONTEXT", "/docs#artifact-corpus"],
        ["Doctrine de workflow", "/docs#execution-logic"]
      ]
    },
    cta: {
      eyebrow: "Commencer ici",
      title: "Si vos agents vont vite mais que vos passages de relais perdent le contexte, commencez ici.",
      body:
        "Commencez par le dépôt, lisez les docs comme des contrats de travail et inspectez comment ShipGlowz transforme contexte, exécution, vérification et opérations serveur en système pratique.",
      actions: [
        ["Ouvrir le dépôt", "https://github.com/dianedef/ShipGlowz", "button button-primary"],
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
        ["ShipGlowz est-il un outil serveur ou un framework de workflow IA ?", "Les deux. Le but est de garder la discipline d’exécution des agents et la livraison serveur dans un même modèle opérationnel cohérent."],
        ["Pourquoi ne pas simplement mieux prompter les agents ?", "Parce que le mode d’échec principal n’est pas seulement la qualité du prompt. C’est le contexte perdu, les passages de relais faibles, l’ambiguïté silencieuse et la dérive entre docs, intention produit et implémentation."],
        ["ShipGlowz optimise-t-il pour la vitesse ?", "Seulement quand la qualité est sûre. Par défaut, la correction, la sécurité, la maintenabilité, la performance pertinente et la preuve passent avant la vitesse, le coût ou le chemin le plus court."],
        ["Faut-il toute la couche documentaire pour obtenir de la valeur ?", "Non. Mais les docs deviennent plus précieuses à mesure que le travail devient moins trivial. Le framework est conçu pour qu’un nouvel agent s’oriente vite sans reconstruire le même contexte depuis zéro."],
        ["Comment fonctionnent vraiment les arguments de skills ?", "Certains skills traitent l’argument comme du texte de tâche, d’autres comme un commutateur de mode ou une entrée structurée. Le comportement est défini par le contrat du skill, pas deviné depuis son nom."],
        ["Est-ce un PaaS généraliste ?", "Non. ShipGlowz ne cherche pas à abstraire tous les modèles d’hébergement. C’est un framework pratique pour exécuter et livrer de vrais projets tout en guidant plus strictement la livraison assistée par IA."]
      ]
    }
  }
} as const;

export const roleMapCopy = {
  en: {
    eyebrow: "How It Stays Coherent",
    title: "Every document has one job.",
    body:
      "ShipGlowz documentation is not trying to be encyclopedic. It is designed to be complete for fast agent navigation, with one explicit and exclusive role per artifact.",
    docs: [
      ["AGENT.md (compat)", "point of entry for a fresh agent"],
      ["shipglowz_data/*", "project-local governance corpus for adopted repos"],
      ["shipglowz_data/technical/context.md", "operational map of the repository"],
      ["shipglowz_data/technical/context-function-tree.md", "structural index for large procedural files"],
      ["shipglowz_data/editorial/content-map.md", "where content lives and how it is repurposed"],
      ["shipglowz_data/business/business.md", "for whom, what value, what model"],
      ["shipglowz_data/business/product.md", "what, workflows, non-goals"],
      ["shipglowz_data/branding/branding.md", "how the product speaks"],
      ["shipglowz_data/business/gtm.md", "how the product is presented and distributed"],
      ["shipglowz_data/technical/architecture.md", "how the system is organized"],
      ["shipglowz_data/technical/guidelines.md", "how contributors should work inside it"],
      ["shipglowz_data/technical/decisions/project-governance-layout.md", "where project governance artifacts belong"]
    ]
  },
  fr: {
    eyebrow: "Comment l’ensemble reste cohérent",
    title: "Chaque document a un seul rôle.",
    body:
      "La documentation ShipGlowz ne cherche pas à être encyclopédique. Elle est conçue pour orienter vite les agents, avec un rôle explicite et exclusif pour chaque artefact.",
    docs: [
      ["AGENT.md (compat)", "point d’entrée pour un nouvel agent"],
      ["shipglowz_data/*", "corpus de gouvernance local au projet pour les dépôts adoptés"],
      ["shipglowz_data/technical/context.md", "carte opérationnelle du dépôt"],
      ["shipglowz_data/technical/context-function-tree.md", "index structurel pour les grands fichiers procéduraux"],
      ["shipglowz_data/editorial/content-map.md", "où vit le contenu et comment il est réutilisé"],
      ["shipglowz_data/business/business.md", "pour qui, quelle valeur, quel modèle"],
      ["shipglowz_data/business/product.md", "quoi, workflows, non-objectifs"],
      ["shipglowz_data/branding/branding.md", "comment le produit s’exprime"],
      ["shipglowz_data/business/gtm.md", "comment le produit est présenté et distribué"],
      ["shipglowz_data/technical/architecture.md", "comment le système est organisé"],
      ["shipglowz_data/technical/guidelines.md", "comment contribuer dans le dépôt"],
      ["shipglowz_data/technical/decisions/project-governance-layout.md", "où doivent vivre les artefacts de gouvernance projet"]
    ]
  }
} as const;
