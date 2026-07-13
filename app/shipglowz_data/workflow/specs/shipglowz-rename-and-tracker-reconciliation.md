---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipglowz_app"
created: "2026-07-11"
created_at: "2026-07-11 20:37:55 UTC"
updated: "2026-07-11"
updated_at: "2026-07-11 20:43:00 UTC"
status: ready
source_skill: 100-sg-spec
source_model: "GPT-5 Codex"
scope: "repository-wide-product-rename-and-governance-reconciliation"
owner: "Diane"
confidence: high
user_story: "En tant qu'operatrice ShipGlowz, je veux que l'application, le site et leur gouvernance utilisent le nom ShipGlowz de facon coherente afin que l'ancien nom ShipGlowz ne cree plus de confusion dans le produit ou les chantiers actifs."
risk_level: high
security_impact: none
docs_impact: yes
linked_systems:
  - "app/"
  - "site/"
  - "shipglowz_data/"
  - "/home/claude/shipglowz"
  - "/home/claude/shipglowz compatibility symlink"
depends_on:
  - artifact: "shipglowz_data/technical/architecture.md"
    artifact_version: unknown
    required_status: active
  - artifact: "shipglowz_data/technical/markdown-source-of-truth.md"
    artifact_version: unknown
    required_status: active
supersedes: []
evidence:
  - "The repository contains 172 tracked or untracked files with ShipGlowz/shipglowz references."
  - "The active application directory is shipglowz_app and its governance corpus is shipglowz_app/shipglowz_data."
  - "The global /home/claude/shipglowz path is already a compatibility symlink to /home/claude/shipglowz."
  - "TASKS.md reports several completed implementations while their specs still expose stale ready states and unchecked tasks."
next_step: "/104-sg-end ShipGlowz rename and tracker reconciliation"
---

# Spec: ShipGlowz rename and tracker reconciliation

🟢 [shipglowz_app] spec: ShipGlowz rename and tracker reconciliation | status: ready | path: shipglowz_data/workflow/specs/shipglowz-rename-and-tracker-reconciliation.md | next: /104-sg-end ShipGlowz rename and tracker reconciliation

## Title

ShipGlowz rename and tracker reconciliation

## Status

Ready for implementation.

## User Story

En tant qu'operatrice ShipGlowz, je veux que l'application, le site et leur gouvernance utilisent le nom ShipGlowz de facon coherente afin que l'ancien nom ShipGlowz ne cree plus de confusion dans le produit ou les chantiers actifs.

## Minimal Behavior Contract

La migration remplace le nom produit ShipGlowz par ShipGlowz dans toutes les surfaces actives du depot, renomme les chemins et identifiants internes qui portent encore l'ancien nom, preserve les compatibilites externes explicitement necessaires, et rend les trackers coherents avec l'implementation constatee. Si un renommage rend un import, un chemin de donnees ou une commande invalide, les validations bloquent la fin du chantier; les archives historiques peuvent conserver l'ancien terme uniquement lorsqu'il designe explicitement l'etat passe.

## Success Behavior

- L'application et le site affichent ShipGlowz sur les surfaces actives.
- Le monorepo utilise `app/`, `app/shipglowz_data/`, `lib/shipglowz/` et `lib/data/shipglowz_sources/` comme chemins canoniques.
- Le package Dart et les symboles actifs utilisent `shipglowz` sans imports `package:shipglowz_app`.
- Les scripts, tests, docs et commandes pointent vers les nouveaux chemins.
- Les specs terminees sont alignees avec les preuves existantes; les specs encore ouvertes ne sont pas fermees artificiellement.
- Le lien global `/home/claude/shipglowz -> /home/claude/shipglowz` reste une compatibilite externe documentee.

## Error Behavior

- Une reference active restante a ShipGlowz bloque la cloture, sauf allowlist historique ou compatibilite documentee.
- Un test, analyse Flutter, build Astro ou controle de chemins en echec laisse le chantier ouvert.
- Une spec sans preuve suffisante conserve son statut actuel et est signalee comme dette de reconciliation.

## Problem

Le produit a change de nom, mais le depot conserve l'ancien nom dans sa structure, son code, son contenu public et sa gouvernance. En parallele, le tracker principal et plusieurs specs ne decrivent pas le meme etat d'avancement.

## Solution

Effectuer une migration mecanique controlee suivie d'une revue semantique: renommer les chemins canoniques, les identifiants et le texte actif; conserver une allowlist historique minimale; puis reconciler les specs avec les preuves de code, tests et verification deja presentes.

## Scope In

- `shipglowz_app/` renomme en `app/`.
- `shipglowz_data/` renomme en `shipglowz_data/` dans l'application.
- Modules, tests, scripts, package Dart, textes et fichiers contenant `shipglowz`.
- Site Astro, y compris les fichiers deja modifies, avec editions ciblees qui preservent leur WIP.
- `TASKS.md`, specs actives et documents de verification lies a l'etat deja implemente.

## Scope Out

- Suppression du lien de compatibilite global `/home/claude/shipglowz`.
- Renommage de depots GitHub, domaines, comptes fournisseurs ou ressources externes non observes dans le depot.
- Refonte fonctionnelle du dashboard, Firebase ou write-back.
- Reecriture des archives ContentFlow sans rapport avec le nom ShipGlowz.

## Constraints

- Preserver les changements utilisateur non commites dans `site/` et `PITCH.md`.
- Ne pas effectuer de remplacement dans les artefacts generes, caches ou dependances.
- Les references historiques doivent etre rares, explicites et verifiables par allowlist.
- Les chemins absolus actifs doivent utiliser `/home/claude/shipglowz` et `/home/claude/shipglowz_app`.

## Test Contract

- Profil: monorepo Flutter desktop + Astro.
- Preuve automatisee: controle des references restantes, `flutter test`, `flutter analyze`, scripts de frontiere renommes, `npm run build` pour le site.
- Preuve contractuelle: validation des chemins de sources et des parseurs Markdown.
- Preuve manuelle: non requise pour le renommage si les builds et tests de widgets passent; la verification visuelle du dashboard reste un chantier produit separe.
- Ordre: recherche statique -> tests cibles -> suite Flutter -> analyse -> build Astro -> coherence git.

## Dependencies

- Flutter/Dart et Astro deja verrouilles par les lockfiles du depot.
- Aucun comportement externe nouveau; fresh-docs not needed.
- Le symlink global existant fournit la compatibilite des anciens appels aux outils.

## Invariants

- Markdown et repositories restent les sources de verite.
- Le dashboard demeure read-only.
- Aucun secret ni chemin sensible supplementaire n'est expose.
- Le WIP utilisateur reste present et fonctionnel.

## Links & Consequences

- Le changement touche imports Dart, chemins de fichiers, tests, scripts CI, documentation publique et corpus de gouvernance.
- Les consommateurs externes des anciens chemins locaux restent couverts uniquement par le symlink global; les chemins internes au depot migrent sans alias permanent.
- Les slugs publics existants peuvent conserver une redirection si leur renommage casserait des liens; sinon ils migrent vers ShipGlowz.

## Documentation Coherence

- Mettre a jour README, CLAUDE, AGENT, CHANGELOG, docs techniques, contenus du site et cartes de documentation.
- Renommer les specs et preuves ShipGlowz actives; conserver les mentions historiques dans les paragraphes qui decrivent explicitement la migration.
- Reparer les commandes obsoletes `/home/claude/shipglowz_app` et `shipglowz_data`.

## Edge Cases

- Les termes `shipglowz` peuvent designer une compatibilite globale encore volontaire.
- Les fichiers non suivis du site contiennent deja du travail utilisateur.
- Les noms Android/Linux/Web et le package Dart peuvent avoir des contraintes distinctes.
- Des specs cochees incompletement peuvent pourtant avoir une verification durable; la preuve prime sur la case, mais doit etre citee.

## Implementation Tasks

- [x] Task 1: Establish rename inventory and historical compatibility allowlist
  - File: `app/shipglowz_data/workflow/specs/shipglowz-rename-and-tracker-reconciliation.md`
  - Action: Record canonical target names and allowed legacy references.
  - User story link: Prevent ambiguous or incomplete rename behavior.
  - Depends on: none
  - Validate with: scoped `rg -i shipglowz` inventory.
- [x] Task 2: Rename repository paths and Dart package/module identifiers
  - File: `shipglowz_app/`, `shipglowz_app/shipglowz_data/`, `lib/shipglowz/`, `lib/data/shipglowz_sources/`, `test/shipglowz/`
  - Action: Move to `app/`, `shipglowz_data/`, `lib/shipglowz/`, `lib/data/shipglowz_sources/`, and `test/shipglowz/`; update imports and scripts.
  - User story link: Make ShipGlowz canonical in the active implementation.
  - Depends on: Task 1
  - Validate with: Dart import scan and boundary scripts.
- [x] Task 3: Rename active product copy and public documentation
  - File: `app/**/*.md`, `site/src/**`, `site/README.md`, `PITCH.md`
  - Action: Replace active brand references while preserving explicit historical context and current WIP.
  - User story link: Remove operator and user-facing naming confusion.
  - Depends on: Task 2
  - Validate with: active-surface reference scan and Astro build.
- [x] Task 4: Reconcile trackers and completed specs from durable evidence
  - File: `app/shipglowz_data/workflow/TASKS.md`, `app/shipglowz_data/workflow/specs/*.md`, `app/shipglowz_data/workflow/verification/*.md`
  - Action: Align lifecycle statuses, checked tasks, next steps, and operational summaries only where implementation or verification evidence exists.
  - User story link: Make the dashboard and governance reflect reality.
  - Depends on: Tasks 2-3
  - Validate with: metadata lint and cross-file status scan.
- [x] Task 5: Run full validation and record residual compatibility references
  - File: repository-wide
  - Action: Run Flutter, Astro, boundary, metadata, and git checks; document justified residuals.
  - User story link: Prove the renamed product remains operational.
  - Depends on: Tasks 1-4
  - Validate with: commands in Test Strategy.

## Acceptance Criteria

- [x] AC 1: No active UI, package, module, test, script, README or tracker identifies the product as ShipGlowz.
- [x] AC 2: Canonical repository paths are `app/` and `app/shipglowz_data/`.
- [x] AC 3: Flutter tests and analysis pass after import and path migration.
- [x] AC 4: Astro build passes with the user's pre-existing article WIP preserved.
- [x] AC 5: Remaining case-insensitive `shipglowz` references are limited to documented history or compatibility.
- [x] AC 6: Tracker/spec statuses agree where durable implementation or verification proof exists.
- [x] AC 7: The global compatibility symlink remains intact.

## Test Strategy

```bash
rg -n -i "shipglowz" app site PITCH.md
cd app && flutter test
cd app && flutter analyze
cd app && scripts/validate-boundary-suite.sh
cd site && npm run build
git diff --check
git status --short
```

## Risks

- Broad replacement may alter historical meaning or public URLs.
- Filesystem moves can invalidate generated Flutter metadata or CI paths.
- Tracker reconciliation can overstate completion without evidence.
- Existing site WIP can be accidentally overwritten by whole-file rewrites.

## Execution Notes

- Use mechanical replacements only on text files selected by `rg`, excluding generated/dependency directories.
- Review every remaining match after replacement.
- Prefer `git mv` for tracked paths; preserve untracked files in place.
- Do not commit or push while unrelated WIP remains mixed in the tree unless the user explicitly requests it.

## Open Questions

None. The user explicitly selected ShipGlowz as the new name; repository-local canonical paths follow that decision while the existing global symlink preserves compatibility.

## Skill Run History

| Date UTC | Skill | Model | Action | Result | Next step |
|----------|-------|-------|--------|--------|-----------|
| 2026-07-11 | 100-sg-spec | GPT-5 Codex | Created repository rename and tracker reconciliation contract | draft | /101-sg-ready ShipGlowz rename and tracker reconciliation |
| 2026-07-11 | 101-sg-ready | GPT-5 Codex | Reviewed scope, migration safety, proof contract, and WIP preservation | ready | /102-sg-start ShipGlowz rename and tracker reconciliation |
| 2026-07-11 | 102-sg-start | GPT-5 Codex | Renamed repository paths, Dart modules/package, governance corpus, scripts, tests, documentation, and public copy while preserving existing site WIP | implemented | /103-sg-verify ShipGlowz rename and tracker reconciliation |
| 2026-07-11 | 103-sg-verify | GPT-5 Codex | Verified zero residual ShipFlow references, 137 Flutter tests, Flutter analysis, boundary suite, Astro build, metadata lint, diff integrity, and compatibility symlink | verified | /104-sg-end ShipGlowz rename and tracker reconciliation |

## Current Chantier Flow

`100-sg-spec` complete -> `101-sg-ready` ready -> `102-sg-start` implemented -> `103-sg-verify` verified -> `104-sg-end` next -> `005-sg-ship` blocked by unrelated WIP
