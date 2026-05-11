contenu éditorial existe déjà comme couche, mais il est surtout    traité comme cartographie et audit de copy. Le manque semble être   
une doctrine durable de “documentation éditoriale proche du produit”  qui dit quoi mettre à jour, qui le fait, et comment éviter les        promesses publiques qui dérivent du code. Pas juste 


Le Reader n’est plus seulement “celui qui lit le code” : il       devient aussi le gardien read-only du corpus documentaire. Comme  les executors peuvent modifier le code dans des workspaces/
  zspaces séparés, c’est lui qui garde la vue transversale pour
  dire où la doc technique doit être mise à jour.

  Ajouts dans specs/sf-build-autonomous-master-skill.md :

  - Reader charge le corpus documentaire : specs, docs projet,
    README, guides techniques, workflow docs, contrats internes.
  - Reader maintient une carte code-docs.
  - Reader produit un Documentation Update Plan.
  - Les executors n’écrivent pas du code sans évaluation Reader
    sur les docs techniques impactées.
  - Le Reader reste strictement read-only : il indique les
    fichiers docs à mettre à jour, mais l’executor ou
    l’intégrateur applique.



L’état actuel est déjà bon sur la base : CONTENT_MAP.md existe, sf-docs sait l’auditer, sf-
  audit-copy vérifie les promesses publiques, et sf-redact / sf-enrich savent produire ou
  améliorer du contenu. Le manque, c’est une couche durable qui dit : quand le code change,
  quelles surfaces éditoriales doivent être revues, quels claims publics sont autorisés, et qui
  met à jour quoi sans conflit.

  Je proposerais une spec dédiée :

  $sf-spec ShipFlow Editorial Content Governance Layer for AI Agents
                                                                                                  Le plan de tête :

  1. Garder CONTENT_MAP.md comme carte canonique des surfaces éditoriales : landing pages, docs
     publiques, FAQ, pricing, changelog, pages skills, blog, support, newsletters si présentes.   2. Ajouter une couche docs/editorial/ ou équivalent :                                               - docs/editorial/README.md : doctrine éditoriale pour agents.                                   - docs/editorial/page-intent-map.md : chaque page, son rôle, son audience, son CTA, ses           sources de vérité.                                                                            - docs/editorial/claim-register.md : registre des promesses publiques sensibles, avec             preuve, source, statut, pages concernées.                                                     - docs/editorial/update-gate.md : quand une modification code/produit impose une mise à           jour éditoriale.                                                                          3. Étendre le rôle du Reader :                                                                      - il lit BUSINESS.md, PRODUCT.md, BRANDING.md, GTM.md, CONTENT_MAP.md, les pages Astro et         les docs publiques ;                                                                          - il produit un Editorial Update Plan en plus du Documentation Update Plan ;                    - il reste read-only ;                                                                          - il dit quelles pages ou claims doivent être mis à jour, mais ce sont l’executor ou              l’integrator qui écrivent.                                                                4. Ajouter une gate de cohérence éditoriale :
      - si une feature change un comportement visible, vérifier landing, docs, FAQ, onboarding,
        pricing, support copy, changelog ;                                                            - si une promesse publique devient fausse ou trop forte, bloquer ou marquer claim                 mismatch ;
      - si le comportement n’est pas encore stable, autoriser pending final copy avec raison
        explicite.
  5. Sécurité anti-conflit :
      - fichiers partagés comme CONTENT_MAP.md, claim-register.md, nav/footer, landing
        principale, pricing : toujours séquentiel ;
      - parallélisme seulement sur fichiers éditoriaux exclusifs, par exemple un agent par
        article/page, si la spec définit les ownerships ;
      - intégration finale obligatoire pour relire liens internes, cohérence des claims, CTA,
        ton, et sources de vérité.

  Donc oui : même logique que la documentation technique, mais avec un vocabulaire différent. La
  couche technique répond à “quel code/document technique est impacté ?”. La couche éditoriale
  répond à “quelle promesse publique, quel contenu utilisateur, quelle page commerciale ou
  support devient impactée ?”.
