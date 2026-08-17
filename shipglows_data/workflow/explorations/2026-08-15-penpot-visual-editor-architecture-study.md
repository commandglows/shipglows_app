---
artifact: exploration_report
metadata_schema_version: "1.0"
artifact_version: "1.0.1"
project: shipglows_app
created: "2026-08-15"
updated: "2026-08-15"
status: draft
source_skill: 010-sg-technical
scope: "Penpot architecture lessons for a ShipGlows-native code-first visual studio and deferred-generation laboratory"
owner: Diane
confidence: high
risk_level: high
security_impact: yes
docs_impact: yes
linked_systems:
  - app/lib/shipglows/
  - runner/src/
  - shipglows_data/technical/design-system-authority.md
  - shipglows_data/technical/managed-runner-foundation.md
  - shipglows_data/workflow/specs/shipglows-visual-studio-and-laboratory-mvp.md
  - "ShipGlows core approved-surface-protection-and-product-atlas contract"
depends_on:
  - artifact: shipglows_data/workflow/explorations/2026-08-15-open-source-design-workflow-alternatives.md
    artifact_version: "1.0.0"
    required_status: draft
supersedes:
  - shipglows_data/workflow/explorations/2026-08-15-open-source-design-workflow-alternatives.md
evidence:
  - "Static inspection of Penpot develop commit 59ef07633aae46450c7e8738ee8b1fd1bbd2ea86."
  - "Pinned Penpot source files covering shapes, changes, transforms, selection, constraints, components, persistence, collaboration, and rendering."
  - "Mozilla MPL 2.0 FAQ, Flutter rendering and embedding documentation, and Astro development-toolbar documentation."
  - "ShipGlows Visual Studio and Laboratory MVP draft created from this study on 2026-08-15."
next_step: "Run readiness review for the ShipGlows Visual Studio and Laboratory MVP before implementation."
---

# Etude d'architecture : Penpot vers le Studio visuel ShipGlows

## Decision

ShipGlows ne doit pas devenir un clone de Penpot, ni placer Penpot au centre de son produit. La bonne architecture est un **Studio code-first integre a l'application Flutter ShipGlows**, dans lequel le rendu reel Astro ou Flutter reste l'autorite visuelle et le code du projet reste l'autorite persistante.

Le Studio ajoute une projection editable au-dessus de ce rendu. Tant que l'operateur explore, les changements vivent dans un journal de commandes et dans des surcharges de previsualisation temporaires. **Aucun fichier source n'est genere ou modifie avant l'action explicite `Compiler en code`.** Lorsque la modification devient structurelle, ambiguë ou multidimensionnelle, l'icone Laboratoire s'allume et la session bascule dans un espace de variantes, toujours sans generation de code.

Penpot est ici une source de recherche architecturale uniquement. Son clone est isole, aucun paquet n'a ete installe, aucun code n'a ete execute et aucun fichier Penpot ne doit etre copie, translittere vers Dart ou integre au produit.

## Les deux promesses produit

ShipGlows peut porter deux promesses coherentes dans une meme application :

1. **Piloter le travail produit en securite** : conversations, agents, validations, worktrees, preuves, protections et restauration.
2. **Creer visuellement le produit reel** : selectionner une surface vivante, modifier son intention visuelle et comportementale, experimenter sans toucher aux sources, puis compiler une variante approuvee en code Astro ou Flutter maintenable.

La deuxieme promesse ne doit pas prendre la forme d'un outil de dessin autonome. Elle prolonge la premiere : chaque operation visuelle devient une intention tracable, chaque compilation passe par le meme controle de revision, les memes protections et les memes preuves que le reste de ShipGlows.

## Option 1 et option 2 : la difference structurante

| | Option 1 : Studio du produit reel | Option 2 : canevas autonome |
| --- | --- | --- |
| Autorite visuelle | L'application Astro ou Flutter en cours d'execution | Un document de design recreant l'application |
| Autorite persistante | Les composants et tokens du depot | Le document, puis un exporteur |
| Edition | Projection et surcharges temporaires sur le vrai runtime | Formes, calques et contraintes propres au canevas |
| Passage au code | Compilation semantique d'intentions acceptees | Generation ou traduction du document entier |
| Risque principal | Mapper precisement runtime, source et composant | Derive entre maquette et produit, code genere difficile a maintenir |
| Astro et Flutter | Adaptateurs natifs autour d'un contrat commun | Plus petit denominateur commun ou deux exporteurs complexes |

**Decision : option 1 comme fondation.** Le Laboratoire reprend certains avantages de l'option 2 — variantes, transformations libres, historique local, comparaison — mais il demeure une projection temporaire du produit reel. Il ne devient jamais une seconde source de verite.

## Perimetre et methode de l'etude

- Depot officiel : [penpot/penpot](https://github.com/penpot/penpot)
- Branche inspectee : `develop`
- Commit epingle : `59ef07633aae46450c7e8738ee8b1fd1bbd2ea86`
- Clone de recherche : `C:\Users\Shadow\shipglows\research-sources\penpot`
- Methode : lecture statique des sources, de la documentation interne et des tests
- Hors perimetre : lancement de Penpot, installation de dependances, benchmark runtime, integration dans `shipglows_app`

Cette etude observe les invariants et les compromis de Penpot. Elle ne cherche pas a reproduire ses API, ses noms internes, son modele de fichier ou son rendu Skia.

## Ce que l'architecture de Penpot nous apprend

### 1. Un graphe stable vaut mieux qu'un arbre de widgets mutable

Penpot represente les formes par des identifiants stables dans une table d'objets. Les relations `parent`, `frame` et l'ordre des enfants reconstruisent la hierarchie sans enfouir l'identite dans un arbre mutable. Les formes portent leurs dimensions, transformations, style, contraintes, liens de composant et metadonnees.

Pour ShipGlows, cette idee devient un **graphe de surfaces projete depuis le runtime**, pas un nouveau format de dessin. Chaque noeud connait son identite de surface, son ancre source, sa cible, ses limites visuelles, son parent, ses capacites editables et ses protections. Le graphe est derive et recreable ; il n'est pas l'autorite du produit.

Sources Penpot : [shape.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape.cljc), [page.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/page.cljc), [file.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/file.cljc).

### 2. Toute edition doit etre une commande typee et reversible

Penpot construit des changements `redo` et `undo` en paire, les valide, les applique localement puis les persiste. Son historique regroupe plusieurs mouvements dans une transaction et retient aussi la selection avant et apres l'operation.

Pour ShipGlows, une interaction visuelle produit un `VisualCommand` semantique : modifier un token, changer un espacement, deplacer un noeud dans une grille, creer une etape d'animation. La commande possede un inverse, une provenance, les surfaces affectees et un statut `previewOnly`. Le Laboratoire est donc un journal reversible de commandes, pas une suite de generations de fichiers.

Sources Penpot : [changes_builder.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/files/changes_builder.cljc), [changes.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/files/changes.cljc), [frontend changes.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/changes.cljs), [undo.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/undo.cljs).

### 3. La previsualisation interactive et la mutation canonique sont deux phases

Pendant un deplacement ou un redimensionnement, Penpot calcule des modificateurs temporaires, echantillonne les mouvements pour tenir le framerate, applique exactement le dernier evenement, puis transforme le resultat en transaction persistante. Cette separation est essentielle.

ShipGlows doit conserver la meme distinction :

```text
geste -> commande temporaire -> surcharge du runtime -> rendu reel actualise
     -> variante acceptee -> preflight -> compilation source unique
```

Les mouvements successifs peuvent etre compactes en une seule intention finale. Une exploration de vingt minutes ne doit produire ni vingt prompts de code, ni vingt patchs, ni vingt reconstructions de worktree.

Sources Penpot : [transforms.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/transforms.cljs), [modifiers.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/modifiers.cljs).

### 4. La selection performante combine index spatial et test precis

Penpot utilise un quadtree pour trouver rapidement les candidats, puis applique des tests plus fins selon le type de forme, les contours, le remplissage et le clipping. L'index est mis a jour incrementalement.

ShipGlows peut reprendre le principe en Dart : un index spatial pour les boites runtime, suivi d'un test de hit specifique a la cible. L'overlay de selection reste independant du moteur qui dessine le produit. Il peut ainsi choisir un element DOM, un composant Flutter, une surface 3D ou un calque interactif sans reconstruire leur rendu.

Sources Penpot : [worker selection.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/worker/selection.cljs), [workspace selection.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/selection.cljs), [viewport selection.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/viewport/selection.cljs).

### 5. L'intention de layout compte davantage que les coordonnees

Penpot modelise Flex, Grid, marges, gaps, padding, tailles fixes/remplies/automatiques, contraintes, min/max et positionnement absolu. Ses transformations propagent ensuite les effets dans la hierarchie.

Le Studio ne doit donc pas convertir aveuglement un glisser-deposer en `left: 347px`. Il doit identifier l'intention : ordre dans un flex, cellule de grille, alignement, token d'espacement, contrainte responsive ou position libre volontaire. Les adaptateurs Astro et Flutter expriment ensuite cette intention dans leurs primitives natives.

Sources Penpot : [shape layout.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/layout.cljc), [constraints.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/geom/shapes/constraints.cljc), [geometry modifiers.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/geom/modifiers.cljc).

### 6. Les instances ont besoin d'overrides par groupes semantiques

Penpot relie les instances a leur composant source et suit les groupes de proprietes touches : remplissage, texte, layout, geometrie, etc. Une instance peut ainsi garder un override local tout en recevant les autres mises a jour du composant.

Cette idee rejoint directement la Surface Protection ShipGlows. Les dimensions design, contenu, structure, fonction, motion, accessibilite et performance doivent etre gouvernees independamment. Une compilation peut modifier la couleur sans ecraser la structure protegee, ou faire evoluer le composant maitre sans supprimer une adaptation mobile approuvee.

Source Penpot : [component.cljc](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/component.cljc).

### 7. Le rendu rapide utilise invalidation selective et chemin interactif

Le renderer WASM de Penpot utilise Skia, des tuiles, des caches, une invalidation selective et un chemin rapide pendant les interactions. Son architecture maintient aussi plusieurs sorties de rendu a partir d'un arbre partage.

ShipGlows ne doit pas reconstruire ce renderer vectoriel. Le runtime Astro ou Flutter produit deja le rendu juste. Les enseignements utiles sont plus fins : invalider seulement les surfaces affectees, utiliser une qualite interactive pendant un geste, puis exiger un rendu precis pour les preuves ; rendre explicite la matrice de capacites de chaque cible ; tester exhaustivement la parite des adaptateurs.

Sources Penpot : [rendering architecture](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/rendering_architecture.md), [tile rendering](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/tile_rendering.md), [render.rs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/render.rs), [tiles.rs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/tiles.rs).

### 8. Le serveur reste autoritaire

Penpot offre une reponse optimiste locale, mais la persistence verifie les permissions, la revision du fichier, sa version et les conflits. Les notifications temps reel ne remplacent pas ces controles.

Pour ShipGlows, la previsualisation rapide ne signifie jamais qu'un patch est accepte. La compilation doit partir d'un commit ou digest de base, revalider les protections et refuser un ecrasement silencieux si le projet a evolue. Le conflit renvoie au Laboratoire avec une nouvelle capture et une proposition de rebase.

Sources Penpot : [persistence.cljs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/persistence.cljs), [files_update.clj](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/backend/src/app/rpc/commands/files_update.clj), [websocket.clj](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/backend/src/app/http/websocket.clj).

## Architecture ShipGlows recommandee

```text
Application Flutter ShipGlows
  StudioShell
    PreviewHost
      AstroPreviewAdapter  -> runtime Astro reel dans un worktree isole
      FlutterPreviewAdapter -> runtime Flutter reel sur processus/appareil isole
    SurfaceOverlayEngine    -> selection, guides, poignees, presence, preuves
    SurfaceGraphProjection  -> identites, ancres source, capacites, protections
    ExperimentStore         -> variantes et journal de commandes sans fichiers
    LaboratoryPolicy        -> seuil, icone et garde-fous
    CompileCoordinator      -> intention acceptee vers patch gere
    VerificationGate        -> rendu, diff, accessibilite, performance, rollback

Runner ShipGlows
  worktree isole + dev server/runtime + pont d'instrumentation
  mapping runtime/source + application des surcharges temporaires
  agent de compilation + tests + captures multi-etats
```

Le code de projet non fiable reste dans le runner et dans son processus isole. L'application ShipGlows recoit une scene serialisee, des evenements et des images ; elle ne charge pas arbitrairement le code client dans son propre isolate Flutter.

### Contrats de donnees minimaux

`StudioNode`

- `surfaceId`, stable dans le registre ShipGlows ;
- `runtimeNodeId`, valable pour la session de rendu ;
- `sourceAnchor`, avec fichier, composant, plage ou symbole et confiance ;
- `target`, `parentId`, ordre, limites et transformation ;
- `layoutIntent`, etats responsive et interaction ;
- references de tokens plutot que valeurs resolues seules ;
- capacites de l'adaptateur ;
- dimensions protegees et revision de base.

`VisualCommand`

- type semantique et parametres ;
- commande inverse ;
- noeuds et dimensions affectes ;
- provenance operateur/agent ;
- `previewOnly: true` jusqu'a la compilation ;
- exigences et limitations par cible.

`LabSession`

- commit, digest et revision de base ;
- cible, viewport, etat produit et donnees de test ;
- journal compactable de commandes ;
- variantes nommees et captures ;
- raisons ayant declenche le Laboratoire ;
- statut propre, en conflit, compilable ou invalide.

`CompileIntent`

- variante explicitement acceptee ;
- commandes semantiques compactees ;
- invariants de design, structure, contenu et fonction ;
- adaptateurs et fichiers probablement affectes ;
- protections et approbations requises ;
- preuves attendues apres patch.

`RenderEvidence`

- captures avant/apres par viewport, theme et etat ;
- ecart visuel et zones modifiees ;
- resultats semantiques, clavier, reduced motion et performance ;
- lien vers patch, commit de base et possibilite de rollback.

## Le Studio reel

Le Studio affiche le produit en execution, pas une approximation. Son overlay peut selectionner une surface, montrer ses contraintes, ses tokens et ses dependances, puis envoyer au runtime des surcharges temporaires : variables CSS, attributs de debug, valeurs de theme, parametres de composant ou transformations d'overlay selon la capacite de la cible.

Le premier produit doit volontairement desactiver l'ecriture immediate. Meme une edition simple reste une experience visuelle jusqu'au clic `Compiler en code`. Cela rend le modele mental constant : explorer est gratuit et reversible ; compiler est une mutation geree et prouvee.

### Adaptateur Astro

- Lance le vrai site Astro dans le worktree gere par le runner.
- Ajoute uniquement en developpement un pont d'instrumentation associant DOM, composants, tokens et ancres source.
- Utilise la page reelle comme preview dans une surface web isolee.
- Applique les essais simples par variables CSS ou couche temporaire, sans ecrire les fichiers.
- Traduit la variante acceptee vers les composants `.astro`, styles et tokens deja presents.
- Retire toute instrumentation de l'artefact de production.

Astro permet des applications de barre d'outils de developpement et Flutter peut integrer du contenu web ; ces mecanismes sont utiles pour un prototype, mais le choix exact de l'isolation doit etre valide sur Windows, Web, Android et iOS. Sources : [Astro dev toolbar](https://docs.astro.build/en/guides/dev-toolbar/), [Flutter web content](https://docs.flutter.dev/platform-integration/web/web-content-in-flutter), [Flutter web embedding](https://docs.flutter.dev/platform-integration/web/embedding-flutter-web).

### Adaptateur Flutter

- Lance l'application cible dans un processus ou appareil separe.
- Ajoute un paquet de developpement ShipGlows, par exemple `shipglows_studio_bridge`, qui expose des ancres explicites sur les composants editables.
- Remonte geometrie, semantics, theme, etats et capacites par un protocole versionne.
- Applique des overrides temporaires dans un scope de preview.
- Compile ensuite vers les widgets, themes, tokens et animations du depot.

Il faut eviter de fonder le produit sur des API privees de Widget Inspector. Les protocoles officiels de layout, paint, hit test et semantics de `RenderBox` sont stables comme concepts, mais l'instrumentation ShipGlows doit rester explicite et testable. Sources : [RenderBox](https://api.flutter.dev/flutter/rendering/RenderBox-class.html), [InteractiveViewer](https://api.flutter.dev/flutter/widgets/InteractiveViewer-class.html), [InteractiveViewer.builder](https://api.flutter.dev/flutter/widgets/InteractiveViewer/InteractiveViewer.builder.html), [Flutter testing](https://docs.flutter.dev/testing/overview).

### Parite sans plus petit denominateur commun

Astro et Flutter partagent des intentions — token de couleur, role semantique, ordre de lecture, breakpoint, etat, mouvement — mais pas une syntaxe ni toutes les capacites. Le coeur expose donc un contrat commun et chaque adaptateur annonce ses capacites. Une intention non supportee doit etre signalee ou adaptee consciemment, jamais approximee en silence.

## Le Laboratoire

Le Laboratoire est une **session d'experimentation multidimensionnelle sans mutation source**. Il apparait des que l'edition depasse la certitude d'une modification locale ou que son rayon d'impact justifie des variantes et des preuves plus riches.

### Politique de bascule v1

Le Laboratoire devient obligatoire si au moins une condition dure est vraie :

- ancre source ambigue, introuvable ou confiance insuffisante ;
- ajout, suppression, reparentage ou changement de structure ;
- modification d'un composant maitre ou d'une dependance partagee ;
- modification de plusieurs breakpoints, etats ou cibles ;
- creation d'une timeline, d'une machine d'etats, d'un effet continu, d'une scene 3D ou d'un media interactif ;
- dimension protegee exigeant validation ;
- conflit avec la revision de base.

Le Laboratoire est recommande lorsque deux conditions souples ou plus sont vraies :

- plus de trois surfaces affectees ;
- plus de cinq commandes de proprietes dependantes ;
- patch predit sur plus d'un fichier ;
- ecart visuel important ou propagation responsive incertaine ;
- adaptation specifique Astro/Flutter necessaire.

L'operateur peut entrer manuellement dans le Laboratoire a tout moment. Il ne peut pas contourner une condition dure sans resoudre la cause ou obtenir l'approbation requise.

### Etats de l'icone

| Etat | Signal | Signification |
| --- | --- | --- |
| Studio | contour neutre | Experience locale, toujours non ecrite |
| Laboratoire recommande | halo ambre | La complexite approche le seuil ; ouverture en un clic |
| Laboratoire actif | icone violette pleine | Variantes et commandes restent dans la session |
| Compilation | impulsion bleue | Preflight puis generation du patch acceptee |
| Verifie | coche verte | Code reel recharge et preuves valides |
| Conflit | badge rouge | Base modifiee, protection ou preuve en echec |

### Cycle complet

1. Capturer la revision de base et le rendu reel de chaque etat utile.
2. Deriver le graphe de surfaces et ses protections.
3. Enregistrer les gestes comme commandes temporaires et mettre a jour le runtime par overrides.
4. Compacter les evenements continus : cent positions de souris deviennent une transformation finale.
5. Creer et comparer des variantes nommees, sans aucun patch source.
6. Accepter explicitement une variante et geler son `CompileIntent`.
7. Revalider revision, droits, protections, capacites et invariants.
8. Generer une seule modification dans un worktree isole.
9. Recharger le vrai runtime et produire les preuves multi-viewports et multi-etats.
10. Accepter la nouvelle baseline ou revenir au Laboratoire sans ecrasement silencieux.

Cette boucle realise la promesse recherchee : le cout de generation n'est paye qu'une fois qu'une direction visuelle est suffisamment bonne pour meriter du code.

## Motion, effets et 3D

Le modele de prototype de Penpot couvre navigation, overlays et quelques transitions, mais il est insuffisant pour une experience Awwwards ambitieuse. ShipGlows doit representer :

- declencheurs discrets et continus : clic, scroll, pointer, viewport, temps, donnees ;
- timelines, ressorts, interpolations et machines d'etats ;
- relations entre animation, layout et contenu ;
- comportement `prefers-reduced-motion` ;
- cout GPU/CPU, budgets de frame et strategie de fallback ;
- scenes 3D, camera, lumieres, materiaux, interaction et chargement progressif ;
- variantes specifiques au web ou au mobile quand la parite exacte serait artificielle.

Le Laboratoire est le lieu naturel de ces dimensions. La scene ou la timeline reste une intention executable temporaire jusqu'a validation, puis l'adaptateur choisit la primitive de production approuvee pour la cible.

## Ce qui est reutilisable et ce qui ne l'est pas

### Principes a reimplementer de facon originale

- graphe plat a identites stables ;
- commandes typees avec inverse et transactions ;
- modificateurs temporaires avant commit ;
- selection en deux phases, index spatial puis hit test precis ;
- layout exprime en intentions et contraintes ;
- overrides par groupes semantiques ;
- invalidation selective et chemin interactif rapide ;
- revision optimiste avec serveur autoritaire ;
- tests d'invariants et de round-trip ;
- matrice de capacites exhaustive entre cibles.

### Elements a ne pas reprendre

- code ClojureScript, Clojure, Rust ou WASM de Penpot, meme traduit ;
- noms d'API, schemas ou serialisation Penpot ;
- renderer Skia et modele de formes generaliste ;
- assets, icones, textes ou snapshots Penpot ;
- pile collaborative complete dans le MVP ;
- modele d'animation de prototype limite ;
- document Penpot comme autorite ou dependance du produit.

### Discipline d'implementation independante

- transformer les observations en exigences ShipGlows et contrats cibles ;
- ecrire des tests a partir de ces exigences et des risques produit, pas en recopiant les tests Penpot ;
- conserver un registre de provenance pour les sources consultees ;
- interdire le collage et la translitteration de code ;
- utiliser des noms, interfaces, modeles et implementations originaux ;
- soumettre toute reutilisation future de code ou asset a une revue de licence distincte.

Penpot utilise la [Mozilla Public License 2.0](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/LICENSE). La [FAQ MPL officielle de Mozilla](https://www.mozilla.org/en-US/MPL/2.0/FAQ/) decrit un copyleft au niveau du fichier et explique notamment que du code MPL copie dans un nouveau fichier demeure couvert. Traduire du code dans un autre langage n'est donc pas une strategie de provenance acceptable. L'approche recommandee evite ce probleme en n'integrant ni code ni asset Penpot. Cette section est une regle d'ingenierie, pas un avis juridique.

## MVP recommande

Le premier prototype doit prouver la boucle, pas l'etendue d'un nouvel editeur universel.

### Cible pilote

Un hero Astro de niveau portfolio/Awwwards comportant :

- six a dix surfaces identifiables ;
- une composition desktop et mobile ;
- typographie, couleur, espacement et un composant partage ;
- une animation d'entree et une interaction continue simple ;
- une surface protegee ;
- un changement structurel qui declenche automatiquement le Laboratoire.

### Capacites v0

1. Instrumenter et selectionner les surfaces du vrai site Astro.
2. Modifier temporairement tokens, espacements et proprietes visuelles locales.
3. Enregistrer undo/redo et deux variantes sans ecriture source.
4. Allumer le Laboratoire sur les conditions du seuil v1.
5. Compiler une variante acceptee en un patch gere.
6. Recharger le runtime et comparer desktop/mobile avant/apres.
7. Refuser le patch si revision, protection ou preuve critique echoue.

Flutter doit etre present dans les contrats et dans la matrice de capacites des le debut, mais son adaptateur runtime peut suivre apres la preuve Astro. Cela evite de construire simultanement deux ponts avant d'avoir valide le modele d'interaction.

## Metriques de succes

- temps entre une reference visuelle et le premier rendu fidele ;
- nombre de generations de code par variante finalement acceptee ;
- nombre de corrections manuelles apres compilation ;
- precision du mapping surface/runtime/source ;
- ecart visuel par viewport et etat ;
- taux de compilation et de rollback ;
- violations de dimensions protegees ;
- churn du patch et maintenabilite du code produit ;
- regression performance, accessibilite et reduced motion ;
- confort percu : latence du geste, clarte du mode et confiance de l'operateur.

Le KPI signature devrait etre : **une seule generation de code pour une variante visuellement approuvee**, hors correction d'un echec de preuve explicite.

## Risques principaux

| Risque | Reponse architecturale |
| --- | --- |
| Mapping runtime/source fragile | Ancres explicites, niveau de confiance et Laboratoire obligatoire si ambigu |
| Preview differente du resultat compile | Le vrai runtime produit les deux rendus ; preuve apres compilation obligatoire |
| Code client non fiable | Execution dans runner/worktree/processus isole, protocole minimal vers l'app |
| Produit trop large | MVP Astro sur un hero ; pas de renderer generaliste ni de collaboration complete |
| Code genere de faible qualite | Intentions semantiques, adaptateur project-native, patch borne et revue des invariants |
| Explosion des etats | Viewports/etats nommes, matrices bornees et variantes explicites |
| Dependances Flutter privees | Pont ShipGlows explicite, versionne et teste |
| Regressions invisibles | Captures, semantics, accessibilite, performance et rollback avant baseline |
| Confusion sur Penpot/MPL | Clone recherche seulement, aucune copie/translitteration, revue si le perimetre change |

## Decision d'architecture a formaliser ensuite

La prochaine etape n'est pas d'implementer un clone d'editeur. Elle est de produire une specification bornee du **ShipGlows Visual Studio and Laboratory**, avec :

- machine d'etats Studio/Laboratoire/Compilation/Verification ;
- schemas `StudioNode`, `VisualCommand`, `LabSession`, `CompileIntent` et `RenderEvidence` ;
- protocole de l'adaptateur Astro ;
- regles exactes du seuil v1 ;
- integration Surface Protection ;
- scenario du hero pilote et budgets de preuve ;
- frontiere de securite app/runner ;
- contrat de provenance interdisant la copie Penpot.

## Inventaire des sources utilisees

### Penpot epingle au commit etudie

- [Depot et historique](https://github.com/penpot/penpot/tree/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86)
- [Licence MPL-2.0](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/LICENSE)
- [Modele de forme](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape.cljc)
- [Modele de page](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/page.cljc)
- [Modele de fichier](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/file.cljc)
- [Construction des changements](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/files/changes_builder.cljc)
- [Application des changements](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/files/changes.cljc)
- [Commit frontend](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/changes.cljs)
- [Undo et transactions](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/undo.cljs)
- [Transformations interactives](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/transforms.cljs)
- [Modificateurs temporaires](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/modifiers.cljs)
- [Index spatial et selection](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/worker/selection.cljs)
- [Selection workspace](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/selection.cljs)
- [Overlay de selection](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/viewport/selection.cljs)
- [Layout Flex et Grid](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/layout.cljc)
- [Contraintes](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/geom/shapes/constraints.cljc)
- [Propagation des modificateurs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/geom/modifiers.cljc)
- [Composants et overrides](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/component.cljc)
- [Interactions de prototype](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/interactions.cljc)
- [Tokens](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/token.cljc)
- [Persistence frontend](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/persistence.cljs)
- [Validation et revision backend](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/backend/src/app/rpc/commands/files_update.clj)
- [WebSocket et presence](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/backend/src/app/http/websocket.clj)
- [Architecture de rendu WASM](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/rendering_architecture.md)
- [Rendu par tuiles](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/tile_rendering.md)
- [Tests des changements](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/test/common_tests/files_changes_test.cljc)
- [Tests des composants](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/test/common_tests/types/components_test.cljc)
- [Tests du layout](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/test/common_tests/types/shape_layout_test.cljc)

### Sources officielles complementaires

- [Mozilla MPL 2.0 FAQ](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)
- [Flutter RenderBox](https://api.flutter.dev/flutter/rendering/RenderBox-class.html)
- [Flutter InteractiveViewer](https://api.flutter.dev/flutter/widgets/InteractiveViewer-class.html)
- [Flutter InteractiveViewer.builder](https://api.flutter.dev/flutter/widgets/InteractiveViewer/InteractiveViewer.builder.html)
- [Flutter web content embedding](https://docs.flutter.dev/platform-integration/web/web-content-in-flutter)
- [Flutter web embedding](https://docs.flutter.dev/platform-integration/web/embedding-flutter-web)
- [Flutter testing overview](https://docs.flutter.dev/testing/overview)
- [Astro development toolbar](https://docs.astro.build/en/guides/dev-toolbar/)

## Redaction Review

- Reviewed: yes
- Sensitive inputs seen: none
- Redactions applied: none required
- Notes: aucune cle, session, donnee client, capture privee ou information d'authentification n'a ete consultee ou persistee.
