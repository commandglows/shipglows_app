---
artifact: repurpose_pack
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: ShipGlows App
created: "2026-07-17"
updated: "2026-07-17"
status: active
source_skill: 007-sg-content
scope: verbatim-flutter-codex-tmux
owner: Diane
confidence: high
risk_level: low
security_impact: none
docs_impact: yes
source_type: conversation
source_ref: "two messages immediately preceding $007-sg-content repurpose verbatim 2"
linked_systems: []
depends_on: []
supersedes: []
evidence:
  - "Operator-requested verbatim archive of two preceding conversation messages."
next_step: null
message_count: 2
---

# Verbatim archive: Flutter, Codex, and Tmux

Message count: 2

## Message 1 — User

On est où dans l'application ? Normalement on a l'intention de créer une application Flutter, c'est ça ? On est bien sur une application Flutter. Et ensuite j'aimerais bien qu'on puisse commander des sessions codex via notre application et du coup je me dis qu'on pourrait le faire et les afficher via Tmux Ou alors créer notre propre interface Tmux !?

## Message 2 — Assistant

Oui : l’application produit est bien une application Flutter, située dans [`app/`](/home/claude/shipglows_app/app). Le dépôt est propre, sur `main`, synchronisé avec `origin/main`.

Aujourd’hui, ShipGlows est déjà un cockpit opérationnel en lecture seule :

- runtime Flutter actif par défaut ;
- Riverpod + GoRouter ;
- écrans Overview, détail projet, diagnostics et réglages ;
- lecture sécurisée des fichiers Markdown et projections locales ;
- contrats Firestore, indexation GitHub et droits produit déjà préparés ;
- ancien ContentFlow conservé comme runtime legacy, mais ce n’est plus la direction produit.

Le point d’entrée le confirme dans [`main.dart`](/home/claude/shipglows_app/app/lib/main.dart), et les routes actives sont dans [`shipglows/router.dart`](/home/claude/shipglows_app/app/lib/shipglows/router.dart).

Il existe toutefois une incohérence : le README annonce Linux desktop comme cible principale, mais seuls Android et Web ont actuellement leurs runners Flutter versionnés. Il faudra donc rétablir/valider le runner Linux avant d’intégrer un agent local.

Pour Codex, ton idée est exactement la prochaine grosse tranche produit, mais je ne construirais pas « notre propre Tmux » comme fondation principale.

L’architecture que je recommande :

```text
Interface Flutter ShipGlows
        │
        │ protocole applicatif local
        ▼
ShipGlows Agent Daemon
        │
        ├── Codex app-server
        │     ├── threads et tours
        │     ├── événements en streaming
        │     ├── validations/autorisations
        │     └── commandes, diffs et outils
        │
        └── Tmux/PTY optionnel
              └── terminal brut de secours
```

Codex fournit officiellement `codex app-server` pour construire des clients riches : conversations, historique, approbations et événements agent en streaming. C’est précisément le niveau adapté à notre interface Flutter. Le protocole est JSON-RPC et sait créer, reprendre, piloter ou interrompre des threads. [Documentation Codex App Server](https://learn.chatgpt.com/docs/app-server.md)

Comme il n’existe pas de SDK Dart officiel documenté, je placerais un petit service local Node.js ou Python entre Flutter et Codex. Les SDK officiels sont prévus pour être exécutés côté serveur, et permettent notamment de démarrer et reprendre des threads. [Documentation Codex SDK](https://learn.chatgpt.com/docs/codex-sdk.md)

Tmux resterait très utile, mais comme couche secondaire :

- maintenir un shell ou des processus auxiliaires ;
- ouvrir une console brute pour déboguer ;
- permettre à un utilisateur avancé de reprendre manuellement une session ;
- fournir un mode de secours si l’interface structurée ne couvre pas encore une opération.

Créer une véritable interface Tmux implique de gérer un PTY, les séquences ANSI, le redimensionnement, la sélection, les raccourcis, les processus et la reconnexion. C’est beaucoup de complexité, alors que `app-server` fournit déjà les concepts dont notre produit a réellement besoin : sessions, messages, outils, validations, état et progression.

La prochaine tranche logique serait donc :

1. Restaurer et valider la cible Flutter Linux.
2. Spécifier la frontière sécurisée du « ShipGlows Agent Runner ».
3. Créer un daemon local enveloppant `codex app-server` via `stdio` ou socket Unix.
4. Ajouter dans Flutter :
   - liste des sessions ;
   - création/reprise d’une session ;
   - conversation en streaming ;
   - événements de commandes et fichiers modifiés ;
   - demandes d’autorisation ;
   - arrêt et reprise.
5. Ajouter ensuite un onglet Terminal/Tmux avancé comme échappatoire.

Point de sécurité important : l’app-server ne devrait pas être exposé directement sur Internet. Pour une utilisation distante mobile/web, il faudra un relais authentifié, chiffré et fortement limité, ou un tunnel privé. La documentation Codex recommande également de ne pas exposer directement ce transport sur un réseau partagé.

Donc : oui à Flutter, oui au pilotage de Codex, oui à Tmux comme outil complémentaire — mais notre vraie interface devrait être une interface Codex native construite sur `app-server`, pas un clone de terminal.
