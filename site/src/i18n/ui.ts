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
  "/shipglows": { en: "/shipglows", fr: "/fr/shipglows" },
  "/fr/shipglows": { en: "/shipglows", fr: "/fr/shipglows" },
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
  return new URL(path, "https://shipglows.com").toString();
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
      ["Product status", "/pricing"],
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
      ["Statut produit", "/pricing"],
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
      "A business-aware delivery partner for founders who want better decisions, owned execution, and proof they can inspect.",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["GitHub", "https://github.com/commandglows/shipglows"],
      ["Framework", "/#how-it-works"]
    ]
  },
  fr: {
    body:
      "Un partenaire business et delivery pour les fondateurs qui veulent de meilleures décisions, une exécution portée et des preuves inspectables.",
    links: [
      ["Skills", "/skills"],
      ["Blog", "/blog"],
      ["GitHub", "https://github.com/commandglows/shipglows"],
      ["Framework", "/#how-it-works"]
    ]
  }
} satisfies Record<Locale, { body: string; links: [string, string][] }>;

export const homeCopy = {
  en: {
    title: "ShipGlows | A business-aware delivery partner",
    description:
      "ShipGlows turns governed business truth into useful decisions, owned chantiers, and verified delivery for founders working with AI agents.",
    hero: {
      eyebrow: "Business-aware delivery for founders",
      title: "Give your AI agents a partner that understands what the business is trying to achieve.",
      body:
        "ShipGlows connects your business truth to the work agents perform. It challenges weak framing, recommends a direction, routes the right métier, and carries bounded chantiers through visible proof—while delivery infrastructure stays in its supporting role.",
      points: [
        "business, product, market, and brand context shape the decision",
        "one accountable métier owns the outcome from intent to proof",
        "important choices expose their business consequence—not just their technical path"
      ],
      actions: [
        ["Meet The Métiers", "/skills", "button button-primary"],
        ["See How It Works", "/#how-it-works", "button button-secondary"],
        ["Inspect The Proof", "https://github.com/commandglows/shipglows", "button button-secondary"]
      ],
      blocks: [
        ["Truth before tasks", "Governed business, product, GTM, and brand context establishes what matters before a solution is chosen."],
        ["A useful point of view", "ShipGlows can question the brief, compare credible directions, and recommend the one that best serves the product."],
        ["Ownership through proof", "The right métier carries the chosen outcome through bounded execution, verification, and an explicit business-facing handoff."]
      ],
      note: "Infrastructure, environments, and release controls remain available as delivery capabilities—not as the product’s leading promise."
    },
    features: {
      eyebrow: "Why This Partnership Matters",
      title: "Technical execution is only valuable when it advances the right outcome.",
      body:
        "AI can produce work quickly. The harder problem is preserving the product’s direction, making trade-offs visible, and keeping delivery accountable to the promise behind the task.",
      items: [
        ["Decisions start from governed truth", "Applicable business, product, market, brand, and operational contracts keep the work connected to the customer and the product—not only the repository."],
        ["Weak framing gets challenged early", "When a brief leaves a material business choice unresolved, ShipGlows surfaces the consequence and proposes a professional direction instead of silently guessing."],
        ["One métier owns the outcome", "Planning, design, development, marketing, documentation, experience, quality, and release remain distinct expert responsibilities without making you orchestrate their internals."],
        ["Choices look beyond the next task", "Plans and handoffs frame options around customer value, trust, leverage, risk, and durable priority rather than short-sighted technical controls."],
        ["Completion stays tied to evidence", "Verification checks the accepted outcome, relevant risks, public claims, documentation, and delivery state before a chantier is presented as complete."]
      ]
    },
    agentLoop: {
      eyebrow: "From Intent To Outcome",
      title: "A business question becomes a governed chantier—not a pile of disconnected agent tasks.",
      body:
        "ShipGlows keeps one outcome active across clarification, specialist work, execution, proof, and closure. You steer the direction; the métiers own the mechanics.",
      items: [
        ["01", "Resolve what matters", "Connect the request to the right project, product, audience, promise, and governed business context."],
        ["02", "Make the decision useful", "Expose material trade-offs, ask only for authority-owned truth, and recommend a direction when the evidence supports one."],
        ["03", "Assign accountable métier ownership", "Route the outcome to the specialist best placed to carry it, while keeping one coherent public handoff."],
        ["04", "Deliver through proof", "Execute within an approved scope, verify the promised outcome, and return business-relevant evidence plus the next strategic decision when one exists."]
      ]
    },
    ctaCards: [
      [
        "Start from the outcome",
        "Describe the business or product result in plain language. The ShipGlows router resolves context and selects the accountable métier without making you supervise the lifecycle.",
        "Meet the router",
        "/skills/shipglows"
      ],
      [
        "Choose a métier when ownership is already clear",
        "Thirteen public métiers cover creation, quality, publishing, growth, governance, and organization while internal mechanics stay behind the responsible owner.",
        "Explore the métiers",
        "/skills"
      ],
      [
        "Inspect what governs the judgment",
        "Business, product, GTM, brand, decision, and proof contracts make the reasoning inspectable without pretending that more documentation guarantees a correct answer.",
        "Open the contracts",
        "/docs"
      ],
      [
        "Challenge the promise",
        "The FAQ states where ShipGlows can advise, what remains your decision, what evidence means, and which outcomes it does not guarantee.",
        "Open the FAQ",
        "/faq"
      ]
    ]
  },
  fr: {
    title: "ShipGlows | Partenaire business et delivery",
    description:
      "ShipGlows transforme une vérité business gouvernée en décisions utiles, chantiers portés et livraison vérifiée pour les fondateurs qui travaillent avec des agents IA.",
    hero: {
      eyebrow: "Delivery business-aware pour fondateurs",
      title: "Donnez à vos agents IA un partenaire qui comprend ce que le business cherche à accomplir.",
      body:
        "ShipGlows relie votre vérité business au travail réalisé par les agents. Il questionne les cadrages faibles, recommande une direction, mobilise le bon métier et porte des chantiers bornés jusqu’à une preuve visible — tandis que l’infrastructure de livraison reste à sa juste place de soutien.",
      points: [
        "le contexte business, produit, marché et marque façonne la décision",
        "un métier responsable porte le résultat de l’intention jusqu’à la preuve",
        "les choix importants exposent leur conséquence business — pas seulement leur chemin technique"
      ],
      actions: [
        ["Découvrir les métiers", "/skills", "button button-primary"],
        ["Voir le fonctionnement", "/#how-it-works", "button button-secondary"],
        ["Inspecter les preuves", "https://github.com/commandglows/shipglows", "button button-secondary"]
      ],
      blocks: [
        ["La vérité avant les tâches", "Le contexte business, produit, GTM et marque gouverné établit ce qui compte avant de choisir une solution."],
        ["Un point de vue utile", "ShipGlows peut questionner le brief, comparer des directions crédibles et recommander celle qui sert le mieux le produit."],
        ["Une responsabilité jusqu’à la preuve", "Le bon métier porte le résultat choisi à travers l’exécution bornée, la vérification et un handoff lisible pour le business."]
      ],
      note: "Infrastructure, environnements et contrôles de release restent disponibles comme capacités de livraison — pas comme promesse principale du produit."
    },
    features: {
      eyebrow: "Pourquoi ce partenariat compte",
      title: "L’exécution technique n’a de valeur que si elle fait avancer le bon résultat.",
      body:
        "L’IA peut produire vite. Le problème plus difficile est de préserver la direction produit, rendre les arbitrages visibles et garder la livraison responsable devant la promesse qui motive la tâche.",
      items: [
        ["Les décisions partent d’une vérité gouvernée", "Les contrats business, produit, marché, marque et opérationnels applicables gardent le travail relié au client et au produit — pas seulement au dépôt."],
        ["Les cadrages faibles sont questionnés tôt", "Lorsqu’un brief laisse un choix business matériel non résolu, ShipGlows expose la conséquence et propose une direction professionnelle au lieu de deviner en silence."],
        ["Un métier porte le résultat", "Planning, design, développement, marketing, documentation, expérience, qualité et release restent des responsabilités expertes distinctes sans vous obliger à orchestrer leurs rouages."],
        ["Les choix regardent au-delà de la prochaine tâche", "Plans et handoffs cadrent les options autour de la valeur client, de la confiance, du levier, du risque et des priorités durables plutôt que de contrôles techniques à courte vue."],
        ["La fin reste liée aux preuves", "La vérification confronte le résultat accepté, les risques pertinents, les claims publics, la documentation et l’état de livraison avant de présenter un chantier comme terminé."]
      ]
    },
    agentLoop: {
      eyebrow: "De l’intention au résultat",
      title: "Une question business devient un chantier gouverné — pas une pile de tâches d’agents déconnectées.",
      body:
        "ShipGlows garde un résultat actif à travers la clarification, le travail spécialiste, l’exécution, la preuve et la clôture. Vous pilotez la direction ; les métiers portent les mécaniques.",
      items: [
        ["01", "Résoudre ce qui compte", "Relier la demande au bon projet, produit, public, engagement et contexte business gouverné."],
        ["02", "Rendre la décision utile", "Exposer les arbitrages matériels, demander seulement la vérité détenue par le donneur d’ordre et recommander une direction lorsque les preuves le permettent."],
        ["03", "Confier le résultat à un métier responsable", "Router le résultat vers le spécialiste le mieux placé pour le porter, tout en conservant un handoff public cohérent."],
        ["04", "Livrer jusqu’à la preuve", "Exécuter dans un périmètre approuvé, vérifier le résultat promis et restituer des preuves utiles au business avec la prochaine décision stratégique lorsqu’elle existe."]
      ]
    },
    ctaCards: [
      [
        "Partir du résultat",
        "Décrivez le résultat business ou produit en langage courant. Le routeur ShipGlows résout le contexte et choisit le métier responsable sans vous faire superviser le cycle de vie.",
        "Découvrir le routeur",
        "/skills/shipglows"
      ],
      [
        "Choisir un métier lorsque la responsabilité est claire",
        "Treize métiers publics couvrent création, qualité, publication, croissance, gouvernance et organisation tandis que les mécaniques internes restent derrière l’owner responsable.",
        "Explorer les métiers",
        "/skills"
      ],
      [
        "Inspecter ce qui gouverne le jugement",
        "Les contrats business, produit, GTM, marque, décision et preuve rendent le raisonnement inspectable sans prétendre que davantage de documentation garantit une réponse juste.",
        "Ouvrir les contrats",
        "/docs"
      ],
      [
        "Mettre la promesse à l’épreuve",
        "La FAQ précise où ShipGlows peut conseiller, ce qui reste votre décision, ce que vaut une preuve et quels résultats il ne garantit pas.",
        "Ouvrir la FAQ",
        "/faq"
      ]
    ]
  }
} as const;

export const sharedHomeSections = {
  en: {
    product: {
      eyebrow: "The Product Hierarchy",
      title: "Business partnership first. Delivery capabilities in support.",
      body:
        "ShipGlows is designed around four ordered layers. The first three create the customer promise; the fourth makes that promise operable across real projects and environments.",
      panels: [
        ["1–2 · Truth and partnership", ["load the smallest coherent business context", "connect work to audience, promise, and priority", "question material gaps without offloading research", "recommend useful business or product directions"]],
        ["3–4 · Execution and delivery", ["assign one accountable métier to the outcome", "bound mutations through explicit approval", "verify behavior, claims, and handoffs", "use environment and release operations as supporting proof"]]
      ]
    },
    proof: {
      eyebrow: "Proof, Not Hype",
      title: "Inspect the mechanisms behind the promise.",
      body:
        "ShipGlows does not ask you to trust vague automation claims. The supporting evidence is in the files, workflows, checks, and operations you can inspect; those checks are visible signals, not guarantees.",
      pills: [
        "governed business context",
        "thirteen public métiers + one router",
        "explicit mutation approval",
        "business-facing strategic choices",
        "decision-quality contract",
        "claim and documentation gates",
        "verification and audit proof",
        "environment and release operations"
      ]
    },
    pricing: {
      eyebrow: "Product Boundary",
      title: "ShipGlows is software, not a service offer.",
      body:
        "The business-partner promise is delivered by the autonomous product itself. ShipGlows does not lead to consulting, diagnostics, implementation missions, or human accompaniment.",
      cards: [
        ["Available today", "A product-led framework you can inspect and use through its repository, documentation, métier skills, governance contracts, and delivery tooling."],
        ["Possible later", "Cockpit may become a separate SaaS product. It does not exist today and carries no availability, roadmap, pricing, or waitlist promise."]
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
      title: "Bring ShipGlows the outcome—not a technical workflow to supervise.",
      body:
        "Describe the business or product result you want. ShipGlows resolves the relevant context, challenges material ambiguity, selects the accountable métier, and carries the approved work through proof.",
      actions: [
        ["Explore The Métiers", "/skills", "button button-primary"],
        ["Inspect The Contracts", "/docs", "button button-secondary"]
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "The obvious questions, answered directly.",
      body: "Understand where ShipGlows can advise, what remains your decision, and what the available proof can honestly establish.",
      bodyPrefix: "If you want a deeper walkthrough of argument-triggered workflows, read the",
      bodyMiddle: " skill launch cheatsheet",
      bodySuffix: ". If you want the broader set of common questions in one place, open the",
      bodyEnd: "full FAQ page",
      items: [
        ["Is ShipGlows a server tool or an AI workflow framework?", "Neither description captures the hierarchy. ShipGlows is a business-aware delivery partner first; agent workflows, governance, environments, and server operations are capabilities used to carry that promise through proof."],
        ["Does ShipGlows make business decisions for me?", "No. It can research discoverable facts, challenge weak framing, compare credible directions, and recommend one. Material choices about intent, promise, risk, cost, or authority remain yours."],
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
      eyebrow: "La hiérarchie produit",
      title: "Le partenariat business d’abord. Les capacités de livraison en soutien.",
      body:
        "ShipGlows est conçu autour de quatre couches ordonnées. Les trois premières créent la promesse client ; la quatrième rend cette promesse opérable dans des projets et environnements réels.",
      panels: [
        ["1–2 · Vérité et partenariat", ["charger le plus petit contexte business cohérent", "relier le travail au public, à la promesse et à la priorité", "questionner les lacunes matérielles sans déléguer la recherche", "recommander des directions business ou produit utiles"]],
        ["3–4 · Exécution et livraison", ["confier le résultat à un métier responsable", "borner les mutations par une approbation explicite", "vérifier comportement, claims et handoffs", "utiliser environnement et release comme preuves de soutien"]]
      ]
    },
    proof: {
      eyebrow: "Preuve, pas storytelling",
      title: "Inspectez les mécanismes qui soutiennent la promesse.",
      body:
        "ShipGlows ne vous demande pas de croire des promesses d’automatisation vagues. Les éléments qui soutiennent la promesse sont dans les fichiers, workflows, contrôles et opérations inspectables ; ces contrôles sont des signaux visibles, pas des garanties.",
      pills: [
        "contexte business gouverné",
        "treize métiers publics + un routeur",
        "approbation explicite des mutations",
        "choix stratégiques lisibles pour le business",
        "contrat de qualité de décision",
        "portes de claims et documentation",
        "preuves de vérification et d’audit",
        "opérations d’environnement et de release"
      ]
    },
    pricing: {
      eyebrow: "Frontière produit",
      title: "ShipGlows est un logiciel, pas une offre de services.",
      body:
        "La promesse de partenaire business est portée par le produit autonome lui-même. ShipGlows ne mène ni vers du conseil, ni vers un diagnostic, une mission d’implémentation ou un accompagnement humain.",
      cards: [
        ["Disponible aujourd’hui", "Un framework product-led que vous pouvez inspecter et utiliser grâce au dépôt, à la documentation, aux métiers, aux contrats de gouvernance et aux outils de livraison."],
        ["Possible plus tard", "Cockpit pourra devenir un produit SaaS distinct. Il n’existe pas aujourd’hui et ne porte aucune promesse de disponibilité, de roadmap, de prix ou de liste d’attente."]
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
      title: "Apportez à ShipGlows le résultat — pas un workflow technique à superviser.",
      body:
        "Décrivez le résultat business ou produit recherché. ShipGlows résout le contexte pertinent, questionne les ambiguïtés matérielles, choisit le métier responsable et porte le travail approuvé jusqu’à la preuve.",
      actions: [
        ["Explorer les métiers", "/skills", "button button-primary"],
        ["Inspecter les contrats", "/docs", "button button-secondary"]
      ]
    },
    faq: {
      eyebrow: "FAQ",
      title: "Les questions évidentes, avec des réponses directes.",
      body: "Comprenez où ShipGlows peut conseiller, ce qui reste votre décision et ce que les preuves disponibles peuvent honnêtement établir.",
      bodyPrefix: "Pour une explication plus complète des workflows déclenchés par arguments, lisez",
      bodyMiddle: " l’aide au lancement des skills",
      bodySuffix: ". Pour toutes les questions fréquentes au même endroit, ouvrez la",
      bodyEnd: "FAQ complète",
      items: [
        ["ShipGlows est-il un outil serveur ou un framework de workflow IA ?", "Aucune de ces descriptions ne restitue la hiérarchie. ShipGlows est d’abord un partenaire business et delivery ; workflows d’agents, gouvernance, environnements et opérations serveur servent cette promesse jusqu’à la preuve."],
        ["ShipGlows prend-il les décisions business à ma place ?", "Non. Il peut rechercher les faits accessibles, questionner un cadrage faible, comparer des directions crédibles et en recommander une. Les choix matériels d’intention, de promesse, de risque, de coût ou d’autorité restent les vôtres."],
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
    eyebrow: "How Judgment Stays Grounded",
    title: "One governed source for each kind of truth.",
    body:
      "ShipGlows does not treat business context as background reading. Each artifact has an explicit authority so a métier can find the relevant truth, detect conflicts, and avoid inventing strategy from repository clues.",
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
    eyebrow: "Comment le jugement reste ancré",
    title: "Une source gouvernée pour chaque type de vérité.",
    body:
      "ShipGlows ne traite pas le contexte business comme une lecture annexe. Chaque artefact possède une autorité explicite afin qu’un métier trouve la vérité pertinente, détecte les conflits et n’invente pas la stratégie depuis de simples indices du dépôt.",
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
