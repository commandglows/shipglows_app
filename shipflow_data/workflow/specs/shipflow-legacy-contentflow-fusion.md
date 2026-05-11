---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-08"
created_at: "2026-05-08 20:09:28 UTC"
updated: "2026-05-10"
updated_at: "2026-05-10 10:36:30 UTC"
status: active
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "migration-fusion"
owner: "user"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux fusionner proprement l'heritage ContentFlow dans ShipFlow en classant chaque brique avant suppression, afin de repartir de la branche distante saine sans perdre les idees reutilisables."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "Flutter desktop/web runtime"
  - "Markdown repository source of truth"
  - "Legacy ContentFlow runtime"
  - "Future auth and BYOK integrations"
  - "Future projection database"
  - "shipflow_data/technical/legacy-file-migration-tracker.md"
depends_on:
  - artifact: "README.md"
    artifact_version: "unknown"
    required_status: "active"
  - artifact: "shipflow_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipflow-inventory.md"
    artifact_version: "0.1.0"
    required_status: "active"
  - artifact: "CLAUDE.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "AGENT.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "shipflow_data/workflow/TASKS.md"
    artifact_version: "unknown"
    required_status: "unknown"
  - artifact: "shipflow_data/technical/legacy-file-migration-tracker.md"
    artifact_version: "0.1.0"
    required_status: "draft"
supersedes: []
evidence:
  - "origin/main is the sane base; local Supabase WIP was archived on backup/local-supabase-wip-2026-05-08"
  - "README.md and pubspec.yaml identify ShipFlow as current project, while legacy ContentFlow files remain embedded"
  - "User direction: keep Markdown as source of truth; database is a projection/sync layer"
  - "User direction: do not delete legacy auth, BYOK, feedback, or pipeline ideas before classification"
next_step: "/sf-ready ShipFlow Legacy ContentFlow Fusion"
---

# Title

ShipFlow Legacy ContentFlow Fusion

# Status

In progress. The spec is ready for the first migration/fusion slice, the technical governance corpus has been bootstrapped, root guidance has been redirected to ShipFlow, and low-risk test/package rename cleanup has started. Remaining work is legacy classification refinement and later decision-specific shipflow_data/workflow/specs.

# User Story

En tant que fondatrice de ShipFlow, je veux fusionner proprement l'heritage ContentFlow dans ShipFlow en classant chaque brique avant suppression, afin de repartir de la branche distante saine sans perdre les idees reutilisables.

# Minimal Behavior Contract

Le chantier accepte l'etat actuel du repo avec un runtime ShipFlow par defaut et un runtime legacy ContentFlow encore present. Il doit produire une frontiere explicite entre le produit actif et l'heritage, classer chaque brique legacy en `keep`, `adapt`, `park`, `archive`, ou `delete-later`, puis appliquer uniquement les changements dont l'intention est claire et reversible. En cas d'ambiguite, de conflit de donnees, de securite ou de risque de perte d'idee produit, le chantier laisse le code intact, documente la decision manquante, et demande une decision utilisateur avant suppression. L'edge case facile a rater est de supprimer une brique ContentFlow qui ne sert plus au runtime actuel mais qui correspond a un besoin ShipFlow deja confirme: auth, BYOK OpenRouter, feedback texte, pipeline, ou futur runner d'agents.

# Success Behavior

- Etant donne `origin/main`, le repo conserve ShipFlow comme produit actif et ne reintegre pas le WIP Supabase local comme base de travail.
- Etant donne un fichier ou module ContentFlow, il a une classification documentee avant tout deplacement ou suppression.
- Etant donne une mention active de ContentFlow dans les guides racine, elle est soit renommee vers ShipFlow, soit marquee comme legacy/archive avec raison.
- Etant donne `APP_TARGET=shipflow`, le runtime par defaut reste ShipFlow et le mode `legacy/contentflow` reste disponible temporairement pour audit.
- Etant donne les decisions produit, les shipflow_data indiquent que les fichiers Markdown du repo utilisateur sont source de verite et que toute base de donnees future est une projection/index/sync.
- Etant donne les decisions ouvertes, Firebase/Firestore, Firebase Auth, FastAPI, terminal web, runner d'agents, BYOK et feedback ne sont pas implementes dans ce chantier sans spec dediee.

# Error Behavior

- Si une brique ne peut pas etre rattachee avec confiance a ShipFlow, elle reste en place et recoit une classification `park` ou `needs-decision`.
- Si une suppression semble plausible mais touche auth, secrets, feedback, pipeline, agents, terminal, donnees utilisateur, ou contenu Markdown, elle est bloquee avant mutation.
- Si les tests ou checks montrent une regression du runtime ShipFlow par defaut, le chantier corrige ou annule uniquement la derniere mutation du chantier, sans toucher aux changements utilisateur non lies.
- Si une documentation externe recente devient necessaire pour Firebase, Firestore, FastAPI, OpenRouter, Clerk ou un SDK auth, la spec de cette integration doit consulter les shipflow_data officielles avant implementation.

# Problem

Le repo contient un melange entre ShipFlow et un heritage ContentFlow. La branche distante semble etre la version saine, tandis que le local contient un WIP Supabase archive et des idees non fiables comme base de merge. Les shipflow_data et une partie du code parlent encore de ContentFlow, Clerk, FastAPI, OpenRouter, feedback, pipeline et autres briques qui ne sont pas toutes actives pour ShipFlow. Supprimer trop vite ferait perdre des idees utiles; garder tout sans frontiere rend le projet illisible.

# Solution

Creer une frontiere documentaire et technique entre ShipFlow actif et ContentFlow legacy, puis faire une migration/fusion par classification. Le chantier commence par les shipflow_data de gouvernance et l'inventaire, preserve le runtime ShipFlow par defaut, garde le legacy temporairement, et reporte les choix de stack lourds dans des shipflow_data/workflow/specs separees.

# Scope In

- Creer ou promouvoir un inventaire durable des briques legacy ContentFlow et de leur decision ShipFlow.
- Mettre a jour les guides racine pour dire clairement que le projet actif est ShipFlow.
- Documenter que Markdown/repo est la source de verite et que la base future sera une projection.
- Documenter la frontiere runtime entre `APP_TARGET=shipflow` et `APP_TARGET=legacy/contentflow`.
- Classer les zones legacy: auth, feedback, BYOK/OpenRouter, pipeline, API service, providers, models, web auth, shipflow_data/workflow/specs, tasks, shipflow_data.
- Corriger les incoherences simples de nommage ou d'import qui empechent les checks actifs, quand la correction ne deplace pas de logique produit.
- Produire une liste de decisions restantes utilisable pour des shipflow_data/workflow/specs futures.

# Scope Out

- Implementer Firebase, Firestore, Firebase Auth, ou une autre base de donnees.
- Implementer FastAPI, terminal web, runner d'agents, ou orchestration serveur.
- Supprimer les ecrans pipeline ou les flows ContentFlow avant classification.
- Remplacer Clerk, OpenRouter, Supabase ou FastAPI par une autre stack dans ce chantier.
- Modifier le modele de donnees utilisateur ou ecrire dans des repos Markdown utilisateur.
- Faire un merge automatique du WIP Supabase local dans `main`.
- Publier, deployer, ou changer des secrets.

# Constraints

- La branche `origin/main` est la base saine.
- Le WIP local Supabase reste archive sur `backup/local-supabase-wip-2026-05-08`.
- Les fichiers Markdown du repo utilisateur priment sur toute base de donnees.
- Toute base future doit etre traitee comme projection, index ou cache synchronise.
- ShipFlow aura probablement besoin de multi-user, auth, BYOK OpenRouter et feedback, mais chaque integration aura sa spec.
- Aucun code lie aux secrets, auth, terminal, agents ou donnees utilisateur ne doit etre active par accident.
- Ne pas supprimer une brique legacy uniquement parce qu'elle porte le nom ContentFlow.

# Dependencies

- Flutter/Dart local pour les checks du runtime actuel.
- Documentation projet actuelle: `README.md`, `CLAUDE.md`, `AGENT.md`, `shipflow_data/workflow/TASKS.md`, `shipflow_data/`, `shipflow_data/workflow/specs/`.
- Exploration source: `shipflow_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipflow-inventory.md`.
- Fresh external shipflow_data: not needed for this chantier because it does not implement Firebase, Firestore, FastAPI, OpenRouter, Clerk, or Supabase behavior. Future stack shipflow_data/workflow/specs must check official docs at that time.

# Invariants

- `lib/main.dart` continue de lancer ShipFlow par defaut.
- Les chemins ShipFlow actuels restent proprietaires du runtime actif: `lib/shipflow/`, `lib/data/shipflow_sources/`, `lib/domain/project_health/`.
- Le legacy runtime peut rester accessible temporairement via target explicite.
- Les classifications doivent preceder les suppressions.
- Les shipflow_data ne doivent pas presenter ContentFlow comme produit actif.
- Les decisions ouvertes doivent etre explicites, pas cachees dans le code.

# Links & Consequences

- Data: la decision Markdown source-of-truth bloque les designs ou la DB devient canonique.
- Auth: l'heritage auth est informatif, mais non actif pour ShipFlow tant qu'une spec auth n'existe pas.
- Security: BYOK, secrets, terminal web et runner d'agents sont a haut risque et restent hors implementation.
- Product: feedback texte, pipeline, et OpenRouter sont des idees reutilisables, pas des obligations immediates.
- Ops: le choix futur doit eviter les serveurs gratuits qui dorment ou qui demandent une maintenance lourde.
- Tests: les checks doivent verifier le runtime ShipFlow, pas seulement compiler des chemins legacy.

# Documentation Coherence

- `README.md` doit rester coherent avec le produit actif ShipFlow.
- `CLAUDE.md` et `AGENT.md` doivent arreter de guider les agents comme si ContentFlow etait le projet actif.
- `shipflow_data/workflow/TASKS.md` doit distinguer backlog ShipFlow, archives ContentFlow, et decisions en attente.
- `shipflow_data/technical/` doit exister ou etre cree pour les decisions d'architecture.
- `shipflow_data/technical/code-docs-map.md` et `shipflow_data/editorial/content-map.md` doivent etre crees ou audites avant une execution de code large.
- Les anciennes shipflow_data/workflow/specs ContentFlow doivent etre classees, pas melangees aux shipflow_data/workflow/specs actives ShipFlow.
- `shipflow_data/technical/legacy-file-migration-tracker.md` doit suivre tout futur mouvement, archivage ou suppression de fichier legacy avant mutation.

# Edge Cases

- Une brique legacy peut etre obsolete dans son implementation mais utile comme intention produit.
- Un nom ContentFlow peut etre purement historique et ne justifie pas une suppression.
- Un import `contentflow_app` peut casser les tests meme si le runtime utilisateur fonctionne.
- Le mode legacy peut masquer des dependances mortes qui ne doivent pas etre activees en production.
- Une base de donnees projection peut devenir source de verite par erreur si les regles d'ecriture ne sont pas documentees.
- Un futur terminal web peut creer un risque de commande arbitraire si traite comme simple UI.

# Implementation Tasks

1. Creer `shipflow_data/technical/legacy-contentflow-inventory.md` depuis `shipflow_data/workflow/research/explorations/2026-05-08-legacy-contentflow-shipflow-inventory.md`, avec une table `path`, `current role`, `ShipFlow decision`, `risk`, `next action`.
2. Creer `shipflow_data/technical/markdown-source-of-truth.md` pour formaliser: Markdown/repo utilisateur canonique, base de donnees projection, ecriture applicative par modification Markdown, gestion des conflits par Git/review.
3. Creer `shipflow_data/technical/runtime-boundary.md` pour documenter `APP_TARGET=shipflow`, `APP_TARGET=legacy/contentflow`, et les conditions de retrait futur du legacy.
4. Creer ou mettre a jour `shipflow_data/technical/code-docs-map.md` pour lier les modules actifs ShipFlow, les modules legacy, les shipflow_data/workflow/specs actives, et les shipflow_data techniques.
5. Creer ou mettre a jour `shipflow_data/editorial/content-map.md` pour distinguer contenu produit actif, shipflow_data techniques, shipflow_data/workflow/specs, archives, et exploration.
6. Mettre a jour `CLAUDE.md` pour decrire ShipFlow comme projet actif, les invariants Markdown, la prudence legacy, et les decisions stack ouvertes.
7. Mettre a jour `AGENT.md` avec les memes contraintes operationnelles pour agents futurs.
8. Mettre a jour `shipflow_data/workflow/TASKS.md` en conservant les informations legacy utiles sous une section archive ou decision, puis en mettant le backlog ShipFlow migration/fusion en tete.
9. Mettre a jour `README.md` pour que les sections d'usage locales, `APP_TARGET`, et les limitations actuelles ne contredisent pas ShipFlow.
10. Classer les anciennes shipflow_data/workflow/specs `shipflow_data/workflow/specs/*.md` dans `shipflow_data/technical/legacy-contentflow-inventory.md` sans les deplacer tant qu'une decision d'archive n'est pas explicite.
10b. Creer et maintenir `shipflow_data/technical/legacy-file-migration-tracker.md` comme gate operationnelle avant tout deplacement, archivage ou suppression legacy.
11. Scanner les imports de tests et corriger uniquement les imports de package manifestement obsoletes qui empechent les checks actifs.
12. Executer les checks disponibles et peu destructifs: analyse statique Flutter/Dart si disponible, tests cibles existants, et recherche des mentions ContentFlow actives restantes.
13. Mettre a jour cette spec avec le resultat `sf-start`, `sf-verify`, et les decisions bloquees restantes.

# Acceptance Criteria

- Une personne ou un agent frais comprend depuis les shipflow_data racine que ShipFlow est le produit actif.
- Chaque grande zone ContentFlow identifiee a une classification documentee.
- Aucune suppression de code legacy risquee n'a lieu sans decision explicite.
- La strategie Markdown source-of-truth et DB projection est documentee.
- La frontiere runtime ShipFlow/legacy est documentee.
- Les choix Firebase/Firestore/FastAPI/Auth/BYOK/feedback sont correctement marques comme futurs chantiers.
- Les checks actifs du repo passent ou les echecs restants sont documentes avec cause et fichier.

# Test Strategy

- `rg -n "ContentFlow|contentflow|contentflow_app" README.md CLAUDE.md AGENT.md shipflow_data/workflow/TASKS.md shipflow_data/technical shipflow_data/workflow/specs lib test` pour distinguer mentions actives, legacy et archives.
- `rg -n "APP_TARGET|LegacyShipFlowApp|ShipFlowApp" lib test` pour verifier la frontiere runtime.
- `flutter test` si l'environnement Flutter est disponible et raisonnablement installe.
- `dart analyze` ou commande equivalente si le repo la supporte.
- Verification manuelle des shipflow_data modifiees: elles doivent etre coherentes sans lire l'historique de conversation.

# Risks

- Risque haut de suppression prematuree d'une idee reutilisable.
- Risque moyen de shipflow_data qui presentent une decision stack comme acquise alors qu'elle est ouverte.
- Risque haut futur autour terminal web, runner d'agents, secrets BYOK et auth multi-user.
- Risque moyen que les tests legacy cassent a cause du rename package alors que le runtime actif est sain.
- Risque moyen de garder trop longtemps un mode legacy qui entretient la confusion.

# Execution Notes

- Execution mode for this spec: `main-only` until readiness and governance corpus exist, then sequential implementation.
- No safe `Execution Batches` are declared because several files racine and shipflow_data overlap.
- This chantier is not a stack migration. It prepares later shipflow_data/workflow/specs for Firebase/Firestore/Auth/FastAPI/BYOK/feedback.
- If the governance corpus is missing, create it before code implementation rather than relying on chat memory.
- Any archive move must preserve history and be easy to review.
- Any legacy move/archive/delete must cite `shipflow_data/technical/legacy-file-migration-tracker.md` and preserve the non-destructive gate unless a later cleanup spec explicitly authorizes mutation.

# Open Questions

None for this migration/fusion preparation chantier. Stack choices remain deliberately scoped out and require future specs before implementation.

# Skill Run History

| Timestamp UTC | Skill | Model | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-08 20:09:28 UTC | sf-spec | GPT-5 Codex | draft | Created chantier spec from user direction and local repo audit. |
| 2026-05-08 20:16:43 UTC | sf-ready | GPT-5 Codex | ready | Spec has no placeholders; unresolved stack choices are scoped out into future specs. |
| 2026-05-08 20:16:43 UTC | sf-docs | GPT-5 Codex | created | Bootstrapped `shipflow_data/technical/`, refreshed `shipflow_data/editorial/content-map.md`, and updated root guidance. |
| 2026-05-08 20:16:43 UTC | sf-start | GPT-5 Codex | partial | Fixed mechanical test package imports and desktop test assumptions; no legacy deletion. |
| 2026-05-08 20:16:43 UTC | sf-verify | GPT-5 Codex | partial | Targeted tests pass; analyze passes with `--no-fatal-infos` and reports 8 legacy deprecation infos. |
| 2026-05-08 20:16:43 UTC | sf-build | GPT-5 Codex | partial | First chantier slice executed; broader legacy cleanup remains. |
| 2026-05-08 20:57:15 UTC | sf-start | GPT-5 Codex | partial | Migrated deprecated RadioListTile usage to RadioGroup, fixed full-test auth assumptions, and classified legacy specs. |
| 2026-05-08 20:57:15 UTC | sf-verify | GPT-5 Codex | verified | `flutter analyze` and full `flutter test` pass. |
| 2026-05-08 20:57:15 UTC | sf-build | GPT-5 Codex | partial | Second chantier slice completed; no destructive legacy removal. |
| 2026-05-09 11:39:42 UTC | sf-docs | GPT-5 Codex | partial | Added `shipflow_data/technical/shipflow-legacy-reuse-roadmap.md` with recommended reuse order and decision questions. |
| 2026-05-09 11:39:42 UTC | sf-build | GPT-5 Codex | partial | Converted legacy audit into brick-by-brick decision roadmap; implementation remains gated by future specs. |
| 2026-05-10 10:36:30 UTC | sf-start | GPT-5 Codex | partial | Created `shipflow_data/technical/legacy-file-migration-tracker.md` and linked it as the non-destructive gate before future legacy file movement. |

# Current Chantier Flow

| Step | Status | Notes |
| --- | --- | --- |
| sf-spec | done | Spec created in `shipflow_data/workflow/specs/shipflow-legacy-contentflow-fusion.md`. |
| sf-ready | ready | Ready for first safe migration/fusion slice; future stack choices remain scoped out. |
| governance corpus gate | created | `shipflow_data/technical/`, `shipflow_data/technical/code-docs-map.md`, and `shipflow_data/editorial/content-map.md` now exist for ShipFlow. |
| sf-start | partial | Docs/root guidance, package import cleanup, Flutter deprecation cleanup, test fixes, initial spec classification, reuse roadmap, and legacy file migration tracker done; no destructive legacy moves. |
| sf-verify | verified | `flutter analyze` and full `flutter test` pass. |
| sf-end | pending | Run after the next cleanup slice or when user accepts this as a closure point. |
| sf-ship | pending | Run only with bounded staging scope. |
