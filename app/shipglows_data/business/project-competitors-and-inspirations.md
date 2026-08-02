---
artifact: competitive_intelligence
metadata_schema_version: "1.0"
artifact_version: "1.5.0"
project: "shipglows_app"
created: "2026-05-11"
updated: "2026-08-01"
status: reviewed
source_skill: sf-veille
scope: "project-competitors-and-inspirations"
owner: "Diane"
confidence: high
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "Initial competitor and inspiration triage captured in legacy root concurrent.md."
  - "ShipGlows App is a local dashboard surface for ShipGlows project data and action state."
  - "Fresh 2026-08-01 open-source scan covered multi-project agent dashboards, remote Codex clients, terminal workspaces, file browsers, Git/worktree orchestration, sandbox control planes, skill/evidence supervision, and simulated Bash execution."
  - "Fresh 2026-08-01 Vercel Ship scan covered Open Agents, AI SDK 7, WorkflowAgent, Vercel Sandbox, scoped credentials, and agent observability patterns."
  - "CTO reframe 2026-08-01: ShipGlows is a multi-agent control plane; Codex is the first adapter, while OpenCode, Kilo and ACP are staged runtime paths behind a ShipGlows-owned capability contract."
depends_on:
  - artifact: "shipglows_data/business/product.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "shipglows_data/business/gtm.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes:
  - "concurrent.md"
next_review: "2026-09-01"
next_step: "/sf-market-study shipglows_app"
target_projects:
  - shipglows_app
reference_categories:
  - indirect_competitor
  - product_inspiration
  - workflow_inspiration
source_policy: "Track public sources only; do not copy private positioning, paid assets, credentials, or non-public customer data."
---

# Concurrents et inspirations — ShipGlows App

## Lecture projet

Ce dossier correspond probablement à l'application ShipGlows locale. Les meilleurs liens concernent dashboard, mémoire, fichiers, analytics et pilotage exécutif.

## Liens retenus

| Lien | Type | Score | Usage concret |
|---|---:|:---:|---|
| [Airbin](https://betalist.com/startups/airbin) | Inspiration workspace | 8/10 | Interface de fichiers privés + recherche contexte: très proche d'un dashboard lisible sur `shipglows_data`. |
| [Web-Analytics.ai](https://web-analytics.ai/) | Inspiration reporting | 7/10 | Bons patterns pour transformer métriques/projets en résumés actionnables. |
| [VenturOS](https://betalist.com/startups/venturos) | Inspiration pilotage | 7/10 | Modèle d'OS de décision: utile pour vues priorités, risques, prochaine action. |
| [MemoryPlugin](https://betalist.com/startups/memoryplugin) | Inspiration mémoire | 6/10 | À regarder pour UX de mémoire persistante sans perdre le contrôle utilisateur. |
| [Spec27](https://betalist.com/startups/spec27) | Inspiration validation | 6/10 | Utile pour afficher état specs/tests/agents dans l'app. |
| [Webmux](https://github.com/windmill-labs/webmux) | Inspiration produit directe | 10/10 | Référence la plus proche du Cockpit combiné : projets, worktrees, agents, terminal, chat mobile, PR/CI et santé des services. |
| [Happier](https://github.com/happier-dev/happier) | Inspiration continuité distante | 9/10 | Reprise et prise de contrôle de sessions Codex existantes sur web/mobile/desktop, avec relais auto-hébergeable et chiffrement de bout en bout. |
| [Handler](https://github.com/Launchable-AI/handler.dev) | Inspiration workspace sécurisé | 9/10 | tmux persistant, terminal, fichiers, statuts d'agents, worktrees, Docker et Firecracker ; référence pour le mode opérateur. |
| [T3 Code](https://github.com/pingdotgg/t3code) | Inspiration runtime multi-agent | 9/10 | Référence pour app-server, contrats typés, permissions par capacité, reconnexion et contrôle distant ; pas un socle complet à forker ni une raison de centrer le produit sur Codex. |
| [CloudCLI](https://github.com/siteboon/claudecodeui) | Inspiration UX tout-en-un | 8/10 | Preuve concrète d'une interface chat + terminal + fichiers + Git + sessions Codex. AGPL : inspiration seulement sans décision explicite de licence. |
| [Yep Anywhere](https://github.com/kzahel/yepanywhere) | Inspiration remote légère | 8/10 | Auto-hébergement simple, découverte des sessions existantes, mobile, fichiers et relais E2E. |
| [Harnss](https://github.com/OpenSource03/harnss) | Inspiration interaction agent | 7/10 | Cartes d'outils, diffs, terminal, Git, navigateur et MCP ; utile pour le rendu riche des conversations. |
| [OpenTag](https://getopentag.com/) | Inspiration collaboration agents | 7/10 | Inbox unifiée, canaux et agents interchangeables ; pertinent pour une future couche équipe. |
| [Maestro](https://www.maestrodev.ai/) | Inspiration supervision skills | 9/10 | Boucle planifier → revoir → approuver → implémenter → valider, findings reliés aux sources et artefacts persistants : référence la plus proche de la discipline d'exécution ShipGlows. Produit desktop/local-first en alpha ; dépôt AGPL, donc inspiration prioritaire. |
| [Maestro CLI](https://github.com/ReinaMacCredy/maestro) | Inspiration preuves et handoffs | 8/10 | Missions, milestones, assertions, preuves, handoffs et skills synchronisées : intéressant pour rendre les runs ShipGlows auditables. CLI/TUI local, pas une solution web/mobile. |
| [just-bash](https://github.com/vercel-labs/just-bash) | Brique sandbox skills | 8/10 | Faux terminal Bash sécurisé, système de fichiers virtuel et réseau filtrable : candidat pour exécuter des checks ShipGlows sur un snapshot sans exposer Hetzner. Ne remplace pas le vrai terminal tmux/Neovim. |
| [Open Agents](https://github.com/vercel-labs/open-agents) | Inspiration architecture agent | 9/10 | Référence claire pour séparer interface, workflow durable, agent et sandbox : très proche de la séparation Flutter → runner → exécution que nous voulons. À adapter, pas à forker comme produit. |
| [Vercel AI SDK 7](https://vercel.com/changelog/ai-sdk-7) | Brique d'adaptation TypeScript | 8/10 | Peut uniformiser streaming, outils, harness Codex/Claude/OpenCode et observabilité côté runner. Surface expérimentale : spike derrière notre contrat, jamais contrat public de ShipGlows. |
| [eve](https://github.com/vercel/eve) | Inspiration d'agent packs | 8/10 | Convention filesystem-first pour instructions, tools, skills, channels et schedules. Apache-2.0 mais bêta : emprunter la structure, ne pas lui confier le contrôle produit. |
| [OpenCode ACP](https://dev.opencode.ai/docs/acp/) | Transport éditeur/agent | 7/10 | Bon connecteur local JSON-RPC/stdio pour un futur adaptateur. ACP n'est ni notre API distante, ni notre modèle d'identité, ni notre journal de preuves. |
| [Kilo CLI runtime](https://kilo.ai/docs/contributing/architecture/cli-runtime) | Inspiration adapter local | 7/10 | Démontre une surface locale HTTP/SSE et des worktrees isolés. À mesurer derrière le même contrat, sans promettre une compatibilité complète avant spike. |
| [Vercel Connect](https://vercel.com/kb/guide/vercel-connect) | Inspiration capability broker | 8/10 | Tokens courts, limités et audités : modèle à reproduire pour GitHub, MCP/OAuth et terminal. Ne remplace pas notre GitHub App. |
| [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/models-and-providers) | Inspiration gouvernance modèles | 7/10 | Routage, budgets, attribution et fallback pour les appels modèles natifs. Fournisseur optionnel derrière un port ShipGlows, pas une dépendance du runtime Codex. |
| [Vercel Sandbox](https://vercel.com/docs/sandbox) | Brique isolation exécution | 8/10 | MicroVM éphémère pour code généré, audits ou previews. Très intéressant pour les runs bornés, mais pas pour le tmux/Neovim persistant et potentiellement dépendant d'un fournisseur. |
| [Vercel Workflow](https://vercel.com/kb/guide/what-is-workflowagent) | Inspiration durabilité des runs | 8/10 | Retries, étapes persistées, reprise et approvals durables : exigences à conserver dans notre runner, même si l'implémentation initiale reste auto-hébergée. |

## Ce qui reste propre à ShipGlows

Ces projets fournissent des briques ou des modèles d'interface, mais aucun ne connaît nos skills ShipGlows ni notre définition de la santé d'un projet. Le Cockpit doit garder un évaluateur versionné : les skills portables produisent des preuves, les règles ShipGlows calculent les dimensions de santé, puis Flutter affiche les résultats et les prochaines actions. Le cœur du produit est le control plane ShipGlows — identité, politiques, preuves, santé, coûts, environnements et expérience — pas un agent particulier. Les concurrents sont donc des références de surface et d'infrastructure, pas l'autorité métier.

## Briques techniques retenues

| Brique | Rôle envisagé | Statut |
| --- | --- | --- |
| `AgentRuntime` ShipGlows | Contrat stable pour sessions, capabilities, approvals, événements et diagnostics | Autorité d'intégration runtime |
| [OpenAI Codex app-server](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md) | Premier adaptateur réel : conversations, tours, outils, diffs et validations sémantiques | Premier runtime prouvé, pas autorité produit |
| [OpenCode ACP](https://dev.opencode.ai/docs/acp/) / [Kilo runtime](https://kilo.ai/docs/contributing/architecture/cli-runtime) | Adaptateurs futurs à mesurer | Chemins de compatibilité, hors promesse MVP |
| `ExecutionProvider` ShipGlows | Sépare sandbox agent jetable, worktree et Workspace tmux persistant | Contrat de sécurité/exécution |
| `CapabilityBroker` ShipGlows | Tokens et droits courts pour GitHub, outils et terminal | Contrat de sécurité |
| [`xterm.dart`](https://pub.dev/packages/xterm) | Terminal Flutter Web/Android/Windows | Spike prioritaire |
| [ttyd](https://github.com/tsl0922/ttyd) | Preuve rapide tmux/Neovim derrière HTTPS et authentification | Prototype jetable possible |
| [xterm.js](https://github.com/xtermjs/xterm.js) | Référence terminal web mature | Inspiration/benchmark |
| [Vercel Open Agents](https://github.com/vercel-labs/open-agents) | Contrôle séparé agent → workflow → sandbox | Architecture de référence, pas dépendance MVP |
| [Vercel Sandbox](https://vercel.com/docs/sandbox) | Exécution isolée de code non fiable ou généré | Comparaison future avec le runner auto-hébergé et `just-bash` |
