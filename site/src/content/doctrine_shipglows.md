# Doctrine ShipGlows: master skills et owner skills

ShipGlows distingue les master skills des owner skills.

Une master skill decide le parcours, cadre le probleme, garde les gates,
integre les resultats et continue jusqu'au ship ou a la cloture quand le
contexte le permet. Elle ne doit pas devenir elle-meme l'executant principal de
tous les patchs.

Une owner skill, ou un sous-agent borne, fait le travail concret: lire le code,
patcher, tester, retester et verifier dans un perimetre clair.

Le parallelisme ne doit apparaitre que lorsqu'une spec contient des lots
d'execution prets et sans conflit d'ecriture.

Pour `sg-bug`, la doctrine cible est donc:

- recevoir le probleme utilisateur;
- creer ou retrouver le dossier bug;
- choisir la preuve manquante via `sg-test`, `sg-browser` ou `sg-auth-debug`;
- deleguer la correction a `sg-fix` ou a un sous-agent borne quand c'est utile;
- router le retest;
- router la verification;
- router le ship si le bug ne bloque plus.

`sg-bug` ne devrait pas etre seulement un GPS qui indique quelle commande taper
ensuite quand le contexte permet de continuer. Elle ne devrait pas non plus
patcher directement dans son propre fil master.
