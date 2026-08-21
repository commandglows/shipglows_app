---
title: "Qu’est-ce qu’un handoff, et comment ShipGlows prépare un vrai passage de relais ?"
description: "Comprendre le handoff entre conversations IA : quand il devient utile, ce qu’il doit contenir et comment les skills ShipGlows protègent la reprise d’un chantier."
summary: "Un handoff n’est ni un résumé vague ni une copie du chat. C’est un passage de relais vérifiable qui permet à une nouvelle conversation de reprendre le bon chantier sans repartir de zéro."
publishDate: 2026-08-21
locale: "fr"
articleKey: "shipglows-conversation-handoff"
slug: "quest-ce-quun-handoff-avec-shipglows"
alternateSlug: "what-is-a-handoff-with-shipglows"
tags:
  - "handoff"
  - "skills"
  - "agents-ia"
  - "contexte"
  - "reprise"
featured: false
draft: false
readingTime: "9 min"
---

Vous travaillez depuis plusieurs heures avec un agent IA. Des décisions ont été prises, des fichiers ont changé, des contrôles sont passés et plusieurs idées ont été écartées. Puis la conversation commence à perdre le fil : elle mélange deux projets, repose une question déjà tranchée ou s’appuie sur une ancienne version du code.

Faut-il continuer pour ne pas « perdre le contexte », ou ouvrir une nouvelle conversation au risque de tout réexpliquer ?

Le **handoff** sert précisément à sortir de ce faux choix. C’est un passage de relais : l’ancienne conversation sécurise et transmet l’état utile du chantier, puis une nouvelle conversation peut reprendre depuis des preuves durables plutôt que depuis un souvenir approximatif.

ShipGlows transforme ce principe général en workflow. Ses skills ne se contentent pas de produire un paragraphe de résumé : ils relient le contexte, les décisions, les tâches, les preuves et l’état Git afin que la reprise soit vérifiable.

## Un handoff, c’est quoi exactement ?

Dans une équipe humaine, un handoff arrive lorsqu’une personne transmet un travail à une autre. Elle ne raconte pas chaque minute de sa journée. Elle communique ce qui permet de poursuivre correctement : l’objectif, les décisions prises, l’état actuel, les risques et la prochaine action.

Avec un agent IA, le principe est identique. Un bon handoff est un message de reprise suffisamment complet pour qu’une nouvelle conversation puisse comprendre :

- sur quel projet et quel chantier elle travaille ;
- quel résultat a été validé ;
- ce qui est terminé, incomplet ou bloqué ;
- où se trouvent les sources de vérité ;
- quelles preuves ont déjà été obtenues ;
- quelles contraintes ne doivent pas être oubliées ;
- quelle vérification effectuer avant de modifier quoi que ce soit.

Le handoff n’est donc pas le travail lui-même. C’est la carte fiable qui permet de le retrouver.

## Ce n’est pas la longueur qui décide

Une conversation longue peut rester excellente. Si l’objectif demeure clair, que les décisions sont cohérentes et que l’agent consulte les bonnes sources, il n’existe aucune raison de la couper uniquement après un certain nombre de messages.

À l’inverse, une conversation plus courte peut déjà être fragile si elle confond les dépôts, mélange plusieurs produits ou traite une hypothèse comme une décision validée.

Le bon signal est donc la qualité du **contexte utile**. Une nouvelle conversation devient intéressante lorsque l’historique accumulé commence à réduire la fiabilité :

- l’agent repose régulièrement des questions déjà résolues ;
- des décisions anciennes et nouvelles se contredisent ;
- le mauvais projet, dépôt ou branche apparaît dans le raisonnement ;
- une information devenue obsolète continue d’être utilisée ;
- il faut reconstruire le périmètre à presque chaque réponse ;
- les contraintes importantes disparaissent malgré les rappels.

Même dans ce cas, ShipGlows ne doit pas abandonner immédiatement la conversation. Il commence par relire les sources canoniques et tente de restaurer un contexte fiable. Le handoff intervient lorsque cette remise à niveau ne suffit plus ou que la reprise dans un espace propre réduit réellement le risque.

## Pourquoi un simple résumé ne suffit pas toujours

Un résumé peut être utile pour se rappeler une discussion. Mais il reste souvent narratif : « nous avons parlé de la fonctionnalité, corrigé quelques problèmes et il reste des tests ».

Un handoff opérationnel doit être plus précis. Il sépare notamment :

- une décision confirmée d’une hypothèse ;
- une modification locale d’un commit sauvegardé à distance ;
- une implémentation d’une fonctionnalité réellement vérifiée ;
- une prochaine idée d’une tâche déjà autorisée ;
- une ancienne information d’une source encore valide.

Cette distinction évite au nouvel agent de transformer une phrase plausible en vérité produit.

## Ce que ShipGlows sécurise avant le passage de relais

Le handoff arrive à la fin d’une petite chaîne de protection, pas à sa place.

### 1. Retrouver l’objectif principal

ShipGlows identifie le projet, le produit, la surface et le chantier concernés. Il conserve le résultat attendu, les décisions acceptées, les contraintes et les limites d’autorisation. Si ces éléments se contredisent, la contradiction reste visible au lieu d’être lissée dans un beau résumé.

### 2. Écrire l’état durable

Les informations qui doivent survivre à la conversation rejoignent leurs vraies sources : spec, tracker de tâches, documentation, dossier de bug, preuves ou journal d’audit. Le chat n’est pas traité comme l’unique mémoire du projet.

### 3. Protéger les modifications

Lorsqu’un chantier Git autorisé a modifié des fichiers, ShipGlows vérifie ce qui appartient réellement au travail, crée les commits nécessaires et les pousse vers le dépôt distant selon le contrat du projet. Il préserve les changements sans rapport et ne confond jamais « commit local », « sauvegardé sur GitHub » et « déployé ».

Pour comprendre cette protection en détail, lisez [comment ShipGlows protège le travail avec Git et GitHub](/fr/blog/votre-travail-agent-est-il-vraiment-sauvegarde).

### 4. Préparer le handoff

Le message final pointe vers les sources durables au lieu de recopier tout leur contenu. Il indique le dernier commit livré lorsqu’il existe, les preuves déjà obtenues, les limites restantes et la première vérification du prochain agent.

### 5. Laisser l’utilisateur ouvrir la nouvelle conversation

Codex ne peut pas décider de fermer puis redémarrer lui-même sa conversation active. ShipGlows peut recommander le passage, sécuriser ce qui le précède et fournir le message prêt à copier. L’ouverture de la nouvelle conversation reste une action de l’utilisateur.

## À quoi ressemble un bon handoff ShipGlows ?

Voici un exemple simplifié :

```text
Reprends le chantier « Scènes Bento » dans le dépôt CommunityGlows.

Objectif validé : permettre de composer, redimensionner et enregistrer
des espaces multi-réseaux sur desktop.

Source de vérité : la spec du chantier et son entrée dans TASKS.md.
Branche : codex/bento-scenes
Dernier commit livré : abc1234

État : la sauvegarde automatique locale et cloud est implémentée.
Preuves obtenues : tests de migration et de changement de profil réussis.
Reste à faire : revue visuelle desktop sur la preview.

Contraintes : aucun build local ; préserver les modifications sans rapport ;
utiliser les design tokens et les composants partagés.

Commence par vérifier la branche, HEAD et la spec avant toute modification.
Prochaine action : effectuer la revue visuelle de la preview desktop.
```

Ce message ne raconte pas toute la conversation. Il transmet juste assez de vérité pour que le nouvel agent puisse vérifier, puis agir.

## Ce qu’un handoff ne doit jamais contenir

Un passage de relais n’est pas une excuse pour déplacer des informations sensibles dans un nouveau chat. Il doit exclure :

- mots de passe, clés, tokens, cookies et identifiants de session ;
- données personnelles ou payloads privés inutiles ;
- logs complets lorsqu’un diagnostic expurgé suffit ;
- raisonnement interne caché de l’agent ;
- longues copies du transcript sans valeur opérationnelle ;
- suppositions présentées comme des décisions.

Le handoff transmet des pointeurs, des états et des preuves. Il ne duplique pas les secrets ni toute la mémoire brute.

## Quels skills participent à cette continuité ?

Le handoff n’est pas isolé dans un bouton magique. Plusieurs métiers et skills ShipGlows contribuent au résultat :

- [`sg-resume`](/skills/sg-resume) compresse le fil actuel pour rendre visibles les décisions, tâches, commits connus et suites ;
- [`sg-context`](/skills/sg-context) recharge les sources pertinentes lorsqu’une conversation commence ou qu’un contexte doit être rétabli ;
- les workflows de spécification, de tâches, de vérification et de fin de chantier maintiennent les vérités durables ;
- les garde-fous Git distinguent travail local, sauvegarde distante et déploiement ;
- le routage ShipGlows choisit le métier capable de reprendre le résultat au lieu de demander à l’utilisateur de reconstruire tout le workflow.

Vous pouvez [parcourir le catalogue des skills](/fr/skills) ou [lire la doctrine publique du workflow](/fr/docs) pour comprendre comment ces rôles se complètent.

## La checklist avant de changer de conversation

Avant d’accepter un handoff, posez cinq questions simples :

1. Le projet, le chantier et le résultat attendu sont-ils identifiés sans ambiguïté ?
2. Les décisions et tâches importantes existent-elles hors du chat ?
3. Les modifications autorisées sont-elles commitables et sauvegardées à distance, ou leur état incomplet est-il clairement signalé ?
4. Le message distingue-t-il les preuves, les inconnues et les hypothèses ?
5. Une nouvelle conversation sait-elle quoi vérifier en premier ?

Si la réponse est oui, ouvrir une nouvelle conversation ne signifie pas repartir de zéro. Cela signifie repartir depuis un état plus propre.

Le handoff est donc moins une technique de résumé qu’une discipline de continuité. Il permet aux agents de changer de contexte sans transformer votre projet en jeu de mémoire — et permet aux solopreneurs de garder leur attention sur les décisions qui comptent vraiment.
