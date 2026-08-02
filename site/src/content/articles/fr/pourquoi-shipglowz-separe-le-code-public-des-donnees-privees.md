---
title: "Pourquoi ShipGlowz sépare le code public des données privées"
description: "Une explication pratique de la raison pour laquelle ShipGlowz utilise un dépôt Git privé séparé pour les données opérateur durables."
summary: "ShipGlowz sépare le code du framework des données opérateur privées durables afin de garder une frontière claire entre versioning, sauvegarde et confidentialité."
publishDate: 2026-07-09
locale: "fr"
articleKey: "shipglowz-private-data-repo"
slug: "pourquoi-shipglowz-separe-le-code-public-des-donnees-privees"
alternateSlug: "shipglowz-private-data-repo"
tags:
  - "documentation"
  - "gouvernance"
  - "donnees-privees"
  - "git"
featured: false
draft: false
readingTime: "4 min"
---

ShipGlowz ne traite pas tous les états locaux de la même manière.

Cette distinction compte parce que certaines données doivent rester publiques et réutilisables dans le framework, d’autres doivent rester privées mais durables, et d’autres encore doivent rester privées mais éphémères.

## La règle simple

ShipGlowz sépare trois classes d’état :

- le code public du framework et sa gouvernance
- les données opérateur privées durables
- l’état runtime privé éphémère

Le framework public reste dans le dépôt ShipGlowz.

Les données opérateur privées durables vont sous `~/.shipglowz/private/data/`.

L’état runtime éphémère va ailleurs, avec sa propre politique de rétention.

## Pourquoi un dépôt privé séparé existe

Le working tree privé sous `~/.shipglowz/private/data/` est destiné à être son propre dépôt Git.

Cela donne aux opérateurs ShipGlowz un endroit propre pour versionner et sauvegarder leur mémoire opérationnelle privée sans la mélanger aux dépôts projets publics ni au dépôt du framework ShipGlowz lui-même.

C’est utile pour des choses comme :

- des fiches projets
- des résumés privés de sources réutilisables
- des rapports privés
- des registres déclaratifs locaux, comme de futurs états de gestion d’e-mails

## Ce qui n’y a pas sa place

Un dépôt de données privées n’est pas pour autant un coffre à secrets.

Il ne doit pas stocker :

- des secrets OAuth
- des refresh tokens
- des cookies
- des clés SSH
- des identifiants bruts

Il peut aussi conserver un état opérationnel de courte rétention quand le versioning améliore la reprise, sans devenir une archive de messages bruts.

Par exemple, une file de revue d’e-mails peut vivre dans `~/.shipglowz/private/data/mail-intake/`. Elle ne contient que des fiches de revue redigérées, pas les corps bruts des messages.

## Pourquoi le remote reste configurable

ShipGlowz n’est pas conçu pour une seule opératrice.

C’est pourquoi le remote du dépôt privé doit être piloté par la configuration plutôt que hardcodé dans la doctrine partagée. Un bootstrap ou un installateur peut le résoudre via une variable comme `SHIPGLOWZ_PRIVATE_DATA_REPO`, mais la doc publique doit expliquer le contrat, pas l’URL GitHub d’une personne.

## Le sens de cette séparation

Cette séparation n’est pas de la bureaucratie.

Elle réduit les fuites accidentelles, garde les sauvegardes cohérentes et facilite le raisonnement sur ce qui doit être public, ce qui doit être privé et versionné, et ce qui doit rester temporaire.
