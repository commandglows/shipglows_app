---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-09"
created_at: "2026-05-09 11:46:31 UTC"
updated: "2026-05-09"
updated_at: "2026-05-09 16:44:03 UTC"
status: ready
source_skill: sf-spec
source_model: "GPT-5 Codex"
scope: "project-source-onboarding"
owner: "Diane"
confidence: medium
user_story: "En tant que fondatrice de ShipFlow, je veux onboarder des projets ShipFlow comme repositories GitHub canoniques, afin que le dashboard sache quel repo lire, indexer et synchroniser sans separer artificiellement projet et repo GitHub."
risk_level: "high"
security_impact: "yes"
docs_impact: "yes"
linked_systems:
  - "lib/shipflow/"
  - "lib/data/shipflow_sources/"
  - "lib/domain/project_health/"
  - "lib/data/models/project.dart"
  - "lib/presentation/screens/onboarding/onboarding_screen.dart"
  - "shipflow_data/technical/markdown-source-of-truth.md"
  - "backup/local-supabase-wip-2026-05-08"
depends_on:
  - artifact: "shipflow_data/technical/markdown-source-of-truth.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/technical/shipflow-legacy-reuse-roadmap.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/technical/legacy-contentflow-inventory.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/technical/recovered-branch-reality.md"
    artifact_version: "0.1.0"
    required_status: "draft"
  - artifact: "shipflow_data/technical/shipflow-foundational-architecture.md"
    artifact_version: "0.1.0"
    required_status: "draft"
supersedes: []
evidence:
  - "User direction on 2026-05-09: feedback can wait; project/source onboarding is most important."
  - "User direction on 2026-05-09: a ShipFlow project is necessarily a GitHub repository."
  - "User direction on 2026-05-09: local clone and remote database were already decided as architecture pieces."
  - "User direction on 2026-05-09: clone is mandatory, infrastructure-managed, user-hidden, and V1 is read-only."
  - "Local branch backup/local-supabase-wip-2026-05-08 contains unpushed Supabase migration WIP, including shipflow_data/workflow/specs/full-supabase-migration.md and Supabase service/migration files."
  - "Current active ShipFlow runtime reads Markdown and project registries but has no first-class onboarding flow."
  - "Legacy ContentFlow project/onboarding code exists but is backend/workspace/content-pipeline oriented."
next_step: "/sf-ready ShipFlow Project Source Onboarding"
---

# Title

ShipFlow Project Source Onboarding

# Status

Ready spec. User decisions captured on 2026-05-09: in ShipFlow, a project is necessarily a GitHub repository; each onboarded project has a mandatory infrastructure-managed clone for repository/Markdown indexing; a remote database exists as projection/sync/index layer. V1 is read-only.

# User Story

En tant que fondatrice de ShipFlow, je veux onboarder des projets ShipFlow comme repositories GitHub canoniques, afin que le dashboard sache quel repo lire, indexer et synchroniser sans separer artificiellement projet et repo GitHub.

# Minimal Behavior Contract

Le chantier definit un modele `ShipFlowProject` dont l'identite canonique est un repository GitHub (`owner/repo`, URL GitHub, provider metadata). L'interface permet de connecter ou declarer un repo GitHub, puis l'infrastructure ShipFlow verifie ou cree un clone gere et indexe les fichiers Markdown attendus. La base distante est une projection/sync/index du repo et du clone gere; elle ne remplace pas le repository GitHub ni les Markdown comme source de verite. L'edge case facile a rater est d'exposer le chemin du clone comme preference utilisateur alors qu'il doit rester un detail d'infrastructure.

# Success Behavior

- Etant donne une URL GitHub valide, l'utilisateur peut la declarer comme projet ShipFlow.
- Etant donne un repo GitHub connecte ou declare, le dashboard sait quelle identite projet utiliser (`owner/repo`).
- Etant donne un projet onboarde, un clone gere existe ou l'app indique explicitement qu'il doit etre cree/synchronise.
- Etant donne un clone gere du repo, il sert de source de lecture/index Markdown si elle correspond au repo GitHub.
- Etant donne une base distante configuree, elle sert de projection/index/sync et non de source canonique.
- Etant donne un repo inaccessible ou incomplet, l'app affiche les gaps avec diagnostics.
- Etant donne les decisions actuelles, aucune base de donnees, Firebase, FastAPI ou pipeline ContentFlow n'est requise pour cette V1.

# Error Behavior

- Si l'URL GitHub est vide, invalide, ou non GitHub, l'app n'enregistre pas le projet.
- Si le repo n'est pas encore accessible par API ou clone gere, l'app peut enregistrer l'identite GitHub avec un statut `needs-clone` ou `needs-access`.
- Si les fichiers Markdown attendus manquent, l'app enregistre un diagnostic sans inventer de donnees.
- Si une copie locale est fournie et contient des segments sensibles, les diagnostics doivent redacter le chemin.
- Si une future ecriture Markdown est demandee, elle est hors scope de cette spec.

# Problem

ShipFlow sait lire des sources Markdown deja referencees, mais il n'a pas encore un modele produit clair pour ajouter ou gerer les repositories GitHub depuis l'interface. Le legacy ContentFlow a des ecrans projets/onboarding, mais ils melangent backend, workspace, contenu, pipeline et auth. Il faut garder l'idee GitHub/project sans importer cette architecture.

# Solution

Definir une couche ShipFlow dediee `project = GitHub repository`: nom, `owner/repo`, URL GitHub, statut d'acces, clone gere, source de lecture Markdown, diagnostics, et statut de projection distante. Le modele laisse de la place pour GitHub OAuth, workspace multi-user et choix final du provider de base distante, sans confondre ces couches.

# Scope In

- Definir le vocabulaire ShipFlow: project = GitHub repository, managed clone = copie de travail interne/source de lecture-indexation, remote database = projection/sync/index, workspace = futur regroupement multi-user.
- Creer un modele ShipFlow project/repository distinct du `Project` legacy ou l'adapter sans dependances backend.
- Ajouter une UI d'onboarding projet GitHub qui affiche le statut du clone gere sans demander a l'utilisateur de choisir son chemin.
- Reutiliser `isValidGithubRepositoryUrl` et `extractGithubRepositoryName`.
- Garder `SourcePathPolicy` pour les lecteurs locaux existants, mais ne pas en faire une preference utilisateur dans l'onboarding cloud cible.
- Afficher les fichiers Markdown detectes/manquants quand une source lisible existe.
- Documenter comment ce modele se projette plus tard vers une base de donnees.

# Scope Out

- Auth multi-user.
- GitHub OAuth complet ou import automatique de tous les repositories.
- Firebase/Firestore implementation.
- Supabase implementation.
- Choix final du provider de base distante.
- FastAPI/local runner.
- Ecriture dans les Markdown.
- Migration ou suppression du legacy `lib/presentation/screens/onboarding/`.
- Pipeline/drip/content workflow.

# Constraints

- Markdown/repo reste source de verite.
- L'identite projet est GitHub, pas le chemin local.
- Un clone gere est requis pour les workflows de lecture/indexation Markdown.
- V1 ne fait aucune ecriture Markdown, aucun commit et aucun push.
- La base distante est requise comme projection/sync/index dans l'architecture cible, mais son provider reste hors implementation ici.
- Les chemins locaux restent allowlistes et rediges si sensibles.
- Le web runtime ne peut pas lire le filesystem local sans runner/clone/projection.
- Le modele ne doit pas dependre de Clerk, FastAPI, Supabase, Firebase ou OpenRouter.
- Le legacy peut inspirer les validations, mais pas choisir l'architecture.

# Dependencies

- `lib/data/shipflow_sources/source_path_policy.dart`
- `lib/data/shipflow_sources/source_file_reader.dart`
- `lib/data/shipflow_sources/parsers/projects_parser.dart`
- `lib/shipflow/providers/dashboard_provider.dart`
- `lib/shipflow/presentation/widgets/settings_panel.dart`
- Fresh external shipflow_data: not needed because this spec does not implement external providers.

# Invariants

- Active implementation targets `lib/shipflow/**`, `lib/data/shipflow_sources/**`, and reusable validation helpers.
- Legacy `Project` remains reference/adapt-candidate until a dedicated model decision is made.
- No project source is made canonical in a remote backend in this chantier.
- Diagnostics must be user-readable and safe.

# Links & Consequences

- Data: this spec shapes remote DB projection keys around GitHub `owner/repo`.
- Auth: no auth dependency now, but future workspaces may map sources to users/teams.
- Security: local file paths and repo contents are sensitive.
- Product: project/source model becomes the foundation for onboarding, settings, sync and future agents.
- Docs: update `shipflow_data/technical/markdown-source-of-truth.md`, `shipflow_data/technical/code-docs-map.md`, and `README.md`.

# Documentation Coherence

- `shipflow_data/technical/shipflow-legacy-reuse-roadmap.md` should mark project/source onboarding as first active reuse chantier.
- `shipflow_data/technical/markdown-source-of-truth.md` should describe source registration if implementation proceeds.
- `shipflow_data/editorial/content-map.md` should add any new source registry or UI surface.
- `README.md` should document how to add/configure a local source if UI behavior is implemented.

# Edge Cases

- Local path exists but is outside allowlisted roots.
- Project name duplicates an existing source.
- Directory exists but no expected Markdown files are found.
- Directory has symlink escapes.
- Web runtime cannot read local files.
- Source path contains `.env`, token, key, auth, cookie or secret segments.
- GitHub repo is known but no local clone exists yet.
- Local clone exists but is not synced to the expected remote URL.
- Remote DB projection exists but is stale or rebuildable from repo/Markdown.
- GitHub repo is private and needs auth later.

# Implementation Tasks

1. Store V1 project registrations in a ShipFlow Markdown/registry file, with GitHub URL, `owner/repo`, clone path, and projection status.
2. Create or adapt a ShipFlow-specific project/repository model under `lib/shipflow/` or `lib/data/shipflow_sources/`.
3. Add validation helpers for GitHub URL, display name, duplicate `owner/repo`, required local clone path, clone remote match, and expected Markdown files.
4. Add a GitHub project + local clone onboarding UI in `lib/shipflow/presentation/`, reachable from settings or an empty dashboard state.
5. Wire project registration to dashboard refresh without changing legacy provider graphs.
6. Add tests for GitHub URL validation, duplicate repos, local clone path safety, clone remote mismatch, web/local-read unsupported state, and missing Markdown diagnostics.
7. Update docs: roadmap, source-of-truth, code-docs map, README.
8. Run `flutter analyze` and `flutter test`.

# Acceptance Criteria

- The active ShipFlow UI has a clear route or panel for adding a GitHub repository as a project.
- The UI records or requests a local clone path for that repository.
- The implementation does not use FastAPI, Clerk, Firebase, Supabase, or OpenRouter.
- Invalid GitHub URLs are rejected; unsafe local clone paths are rejected with redacted diagnostics.
- The remote DB is described as projection/sync/index, not canonical storage.
- Source registration does not make a database canonical.
- Tests cover the new model/validation and active UI path.
- Full `flutter analyze` and `flutter test` pass.

# Test Strategy

- Unit tests for GitHub project model and validation helpers.
- Widget test for GitHub project onboarding panel success and error states.
- Tests for clone path validation and Git remote mismatch when implemented.
- Existing `test/data/shipflow_sources` tests remain passing.
- Full `flutter analyze`.
- Full `flutter test`.

# Risks

- High risk of overfitting to legacy ContentFlow project/workspace model.
- Medium risk of under-designing GitHub auth/access for private repos.
- Medium risk of losing the already-started remote DB work if the archived WIP branch is ignored.
- High security risk if local paths are exposed or written unsafely.
- Medium product risk if "project", "source", "workspace" remain ambiguous.

# Execution Notes

- Recommended V1 model: `ShipFlowProject = GitHub owner/repo + URL + display name + local clone path + access/diagnostic status + projection status`.
- Recommended V1 storage: ShipFlow Markdown/registry file, not `shared_preferences`, because project identity should be portable and inspectable.
- Recommended route: settings panel first, not a full legacy onboarding wizard.
- Future GitHub OAuth, remote DB provider implementation, and multi-user workspace semantics should be additive.

# Open Questions

None for project identity. User decision captured: a ShipFlow project is necessarily a GitHub repository, with a local clone and remote database projection. V1 storage should be a ShipFlow Markdown/registry file unless implementation discovers a hard blocker.

# Skill Run History

| Timestamp UTC | Skill | Model | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-05-09 11:46:31 UTC | sf-spec | GPT-5 Codex | draft | Created spec after user prioritized project/source onboarding over feedback. |
| 2026-05-09 11:50:05 UTC | sf-ready | GPT-5 Codex | ready | Captured user decision: project identity is GitHub repository; registry storage defaults to Markdown. |
| 2026-05-09 11:58:00 UTC | sf-spec | GPT-5 Codex | ready | Corrected architecture: local clone and remote DB projection are decided pieces, not optional future ideas. |
| 2026-05-09 12:11:05 UTC | sf-docs | GPT-5 Codex | ready | Added durable branch reality note: Supabase WIP exists in backup branch and should be translated to Firebase/Firestore, not merged directly. |
| 2026-05-09 16:44:03 UTC | sf-docs | GPT-5 Codex | ready | Captured foundational architecture answers: clone is mandatory, infrastructure-managed, user-hidden, V1 read-only, GitHub wins. |

# Current Chantier Flow

| Step | Status | Notes |
| --- | --- | --- |
| sf-spec | done | Draft created in `shipflow_data/workflow/specs/shipflow-project-source-onboarding.md`. |
| sf-ready | ready | Project identity and V1 storage direction are decided. |
| governance corpus gate | already existed | `shipflow_data/technical/` and `shipflow_data/editorial/content-map.md` exist. |
| sf-start | pending | Ready to implement a GitHub-repository onboarding slice. |
| sf-verify | pending | Run after implementation. |
| sf-end | pending | Run after verification. |
| sf-ship | pending | Run only with bounded staging scope. |
