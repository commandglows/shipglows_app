---
artifact: spec
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: contentflow_app
created: "2026-04-25"
updated: "2026-04-27"
status: ready
source_skill: sf-docs
scope: feature
owner: unknown
confidence: low
risk_level: medium
security_impact: unknown
docs_impact: yes
user_story: "unknown (legacy spec migrated to ShipFlow metadata)"
linked_systems: []
depends_on: []
supersedes: []
evidence: []
next_step: "/sf-docs audit specs/late-integration-finalization.md"
---
# Spec: Finaliser l'integration LATE/Zernio

Date: 2026-03-23

## Probleme

Le projet a une integration LATE/Zernio partiellement branchee:
- le backend expose des endpoints de publication;
- le frontend tente de publier lors de l'approbation;
- mais les comptes connectes, les vrais `account_id`, le flow OAuth et le feedback UI ne sont pas finalises.

Resultat: le produit donne l'impression d'etre integre, mais le parcours reel "connecter un channel -> approuver -> publier -> verifier" n'est pas encore fiable de bout en bout.

## Solution

Finaliser l'integration en 4 couches:
1. corriger les contrats API et les bugs bloquants;
2. brancher les comptes publish dans l'etat Flutter;
3. implementer le vrai flow de connexion channel et la selection des comptes;
4. ajouter le feedback de publication, les tests et la doc d'exploitation.

## Scope In

- Backend publish router et contrat de publication
- Flutter settings publishing channels
- Association plateforme -> compte connecte
- Flow d'approbation/publish
- Gestion des erreurs et feedback utilisateur
- Tests minimums backend/frontend
- Documentation setup et verification

## Scope Out

- Billing
- Auth multi-tenant complet
- Analytics post-publication
- Preview avance par plateforme
- Refonte UI globale

## Audit synthetique

### Fait

- Routeur backend de publication present: `POST /api/publish`, `GET /api/publish/accounts`, `GET /api/publish/status/{post_id}`
- Routeur branche dans l'app FastAPI
- Flutter dispose de `fetchPublishAccounts()` et `publishContent()`
- L'action `approve()` tente une publication automatique apres transition vers `approved`

### Manquant / incomplet

- Aucun vrai account mapping cote Flutter, `account_id` est force a `default`
- L'UI Settings n'utilise pas `/api/publish/accounts`
- Le bouton `Connect` est un placeholder, pas un flow reel
- Les channels WordPress et Ghost ne sont pas mappes vers une plateforme publiable
- Les resultats de publication ne sont pas exploites pour mettre a jour l'UI et le statut detaille
- Pas de tests cibles sur le router publish ni sur le flow Flutter
- Pas de doc projet pour variables d'environnement et procedure de validation

### Bugs / risques techniques

- Mismatch HTTP method sur le scheduling: Flutter envoie `POST /api/status/content/{id}/schedule` alors que FastAPI expose `PATCH`
- Le frontend avale silencieusement les erreurs d'approve/publish
- Le backend publie puis essaie de transitionner directement vers `published` sans persister `target_url`, `post_id` ou `platform_urls`
- L'etat "Connected" dans l'UI est hardcode et peut mentir a l'utilisateur

## Taches d'implementation

- [ ] Tache 1: Corriger les contrats API existants
  - Fichier: `lib/data/services/api_service.dart`
  - Action: Aligner `scheduleContent()` sur `PATCH`, definir des modeles de reponse typed pour publish/accounts, et faire remonter les erreurs plutot que retourner uniquement des maps libres.
  - Notes: Normaliser les payloads et eviter la logique basee sur des strings implicites.

- [ ] Tache 2: Durcir le backend publish
  - Fichier: `/home/claude/contentflow/api/routers/publish.py`
  - Action: Persister dans le `ContentRecord` les metadonnees de publication utiles (`post_id`, `platform_urls`, potentiellement `target_url` principal) avant ou apres transition vers `published`.
  - Notes: Definir une regle claire pour `publish_now` vs `scheduled_for`.

- [ ] Tache 3: Introduire un modele Flutter pour les comptes publish
  - Fichier: `lib/data/models/app_settings.dart`
  - Action: Etendre `ChannelConfig` pour stocker `accountId`, `platform`, `username/displayName`, `status`.
  - Notes: L'etat settings doit pouvoir representer plusieurs comptes par plateforme ou, au minimum, le compte selectionne.

- [ ] Tache 4: Exposer les comptes connectes dans Riverpod
  - Fichier: `lib/providers/providers.dart`
  - Action: Ajouter un provider dedie pour `/api/publish/accounts` et un mecanisme pour resoudre `PublishingChannel -> account_id`.
  - Notes: Le flow `approve()` doit s'appuyer sur de vraies donnees et refuser proprement la publication si aucun compte n'est connecte.

- [ ] Tache 5: Finaliser l'UI Settings des channels
  - Fichier: `lib/presentation/screens/settings/settings_screen.dart`
  - Action: Remplacer les badges statiques par des donnees reelles, afficher loading/error/empty states, et permettre la connexion ou la reconnexion par channel.
  - Notes: L'utilisateur doit voir quel compte est connecte, pas juste "Connected".

- [ ] Tache 6: Implementer le flow de connexion channel
  - Fichier: `lib/presentation/screens/settings/settings_screen.dart`
  - Action: Brancher le bouton `Connect` sur un vrai endpoint backend ou une URL OAuth retournee par le backend.
  - Notes: Si LATE impose un flow web externe, ouvrir le navigateur puis re-fetch `/api/publish/accounts` au retour.

- [ ] Tache 7: Corriger le flow approve -> publish
  - Fichier: `lib/providers/providers.dart`
  - Action: Verifier les channels publiables, resoudre les `account_id`, traiter la reponse de publication, et afficher un feedback utilisateur en cas de succes partiel ou d'echec.
  - Notes: Ne pas supprimer silencieusement le contenu de la liste si la publication reelle a echoue sans information claire.

- [ ] Tache 8: Clarifier le support plateforme
  - Fichier: `lib/providers/providers.dart`
  - Action: Decider explicitement si `wordpress` et `ghost` passent par LATE ou par d'autres routes, puis coder cette decision.
  - Notes: Si non supporte par LATE, les exclure du publish auto avec message explicite.

- [ ] Tache 9: Ajouter des tests backend
  - Fichier: `/home/claude/contentflow/tests/` (nouveaux fichiers)
  - Action: Ajouter des tests pour `/api/publish`, `/api/publish/accounts`, erreurs de cle API, timeout, et persistance des metadonnees de publication.
  - Notes: Mock de `httpx.AsyncClient`.

- [ ] Tache 10: Ajouter des tests Flutter cibles
  - Fichier: `test/` (nouveaux fichiers)
  - Action: Tester la resolution des channels, la gestion des comptes connectes, et le comportement d'`approve()` sur succes/echec.
  - Notes: Prioriser les providers et le parsing des reponses.

- [ ] Tache 11: Documenter setup et verification
  - Fichier: `README.md`
  - Action: Ajouter la configuration `ZERNIO_API_KEY` / `LATE_API_KEY`, la sequence de connexion des comptes, et la checklist de verification manuelle.
  - Notes: Inclure les endpoints utilises et les cas de panne attendus.

## Criteres d'acceptation

- [ ] CA1: Given une API key valide et au moins un compte Twitter connecte, when un contenu avec channel Twitter est approuve, then l'app envoie le vrai `account_id` et la publication retourne un succes exploitable.
- [ ] CA2: Given aucun compte connecte pour un channel requis, when l'utilisateur approuve un contenu, then l'app n'essaie pas de publier a l'aveugle et affiche une erreur claire.
- [ ] CA3: Given la page Settings s'ouvre, when `/api/publish/accounts` repond, then chaque channel affiche son etat reel et l'identite du compte connecte.
- [ ] CA4: Given le backend publish reussit, when il recoit `content_record_id`, then le record de statut stocke au minimum le statut final et les informations de publication utiles.
- [ ] CA5: Given le backend LATE renvoie une erreur 401 ou timeout, when le frontend tente de publier, then l'utilisateur recoit un feedback exploitable et l'erreur n'est pas avalee silencieusement.
- [ ] CA6: Given un contenu est programme, when le frontend appelle le backend, then la methode HTTP et le payload correspondent bien au contrat FastAPI.
- [ ] CA7: Given la doc projet est lue par un agent frais, when il doit lancer et verifier l'integration, then il trouve la configuration env, les endpoints et la procedure de test sans historique supplementaire.

## Strategie de test

- Backend:
  - tests unitaires du router `publish.py` avec mock `httpx`
  - test d'erreur sans variable d'environnement
  - test de persistance du metadata publish sur `content_record_id`

- Flutter:
  - tests unitaires de mapping `PublishingChannel -> platform`
  - tests providers pour `approve()` avec comptes presents/absents
  - verification manuelle UI Settings sur online/loading/error/empty

- Manuel end-to-end:
  - connecter un compte social
  - verifier son apparition dans Settings
  - approuver un contenu cible
  - verifier la reponse publish et le statut backend
  - verifier les liens publies ou URL retournees

## Risques

- Le vrai flow OAuth peut dependre d'un endpoint backend non encore expose par LATE/Zernio
- Le modele "1 account default par plateforme" peut etre insuffisant si plusieurs comptes existent
- Le statut `approved` supprime aujourd'hui l'item de la file avant confirmation de publication, ce qui peut masquer des echecs
- Le support WordPress/Ghost doit etre tranche avant implementation pour eviter une UX incoherente

## Ordre recommande

1. Corriger les bugs de contrat et la remontée d'erreur
2. Brancher les comptes publish dans l'etat Flutter
3. Finaliser l'UI Settings avec donnees reelles
4. Implementer le flow OAuth/connection
5. Durcir approve -> publish
6. Ajouter tests et doc
