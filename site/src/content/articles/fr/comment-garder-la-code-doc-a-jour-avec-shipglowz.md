---
title: "Comment garder la code doc à jour avec ShipGlowz"
description: "Une méthode simple pour vérifier et mettre à jour la documentation technique d'un projet via les skills ShipGlowz."
summary: "ShipGlowz évite la redécouverte permanente du code en combinant carte de contexte, map code-docs, behavior indexes et commandes d'audit documentaire pilotées par agents."
publishDate: 2026-07-11
locale: "fr"
articleKey: "keeping-code-docs-current-with-shipglowz"
slug: "comment-garder-la-code-doc-a-jour-avec-shipglowz"
alternateSlug: "keeping-code-docs-current-with-shipglowz"
tags:
  - "documentation"
  - "code-docs"
  - "gouvernance"
  - "agents"
  - "shipglowz"
featured: false
draft: false
readingTime: "5 min"
---

Dans une grosse base de code, la documentation technique devient vite inutile si elle dépend de la mémoire des conversations.

Le vrai problème n'est pas seulement d'avoir des docs. Le problème est de pouvoir repartir d'un mot comme `swipe`, `auth`, `sync` ou `checkout` et retrouver rapidement le bon comportement, le bon fichier, la bonne doc propriétaire et la bonne commande de vérification.

ShipGlowz traite ce problème comme un système de navigation, pas comme un simple effort de commentaire.

## La règle simple

Quand du code change, la documentation associée doit être revue dans le même flux de travail.

Dans ShipGlowz, cela passe par deux obligations simples :

- un changement de code mappé doit produire un `Documentation Update Plan`
- ou une justification explicite de type `no-impact`

Autrement dit, on ne laisse pas la question documentaire dans le flou jusqu'au prochain chantier.

## Les quatre couches à ne pas mélanger

ShipGlowz sépare la navigation technique en plusieurs couches, chacune avec un rôle précis.

`context.md` sert à comprendre les grandes surfaces du projet.

`context-function-tree.md` sert à repérer la structure et les grands points d'entrée quand le code est procédural ou dense.

`code-docs-map.md` sert à répondre à la question : si ce fichier change, quelle doc est propriétaire, quelle validation doit tourner, et quel trigger documentaire s'applique ?

Le behavior index sert à partir d'un terme ambigu, par exemple `swipe`, pour le transformer en comportements nommés, puis en symboles, fichiers, tests et artefacts liés.

Cette séparation évite deux erreurs classiques :

- tout mettre dans une énorme context map illisible
- compter sur des commentaires de code pour remplacer la navigation globale

## Ce qu'il faut lancer manuellement

Si tu veux vérifier que la code doc est à jour, l'entrée canonique est `300-sg-docs`.

Pour une vérification documentaire ciblée ou générale :

- `/300-sg-docs technical audit`
- `/300-sg-docs audit <fichier-ou-zone>`

Pour pousser une mise à jour documentaire :

- `/300-sg-docs technical`
- `/300-sg-docs update <fichier-ou-zone>`

Ces commandes ne sont pas là pour produire du texte décoratif. Elles sont là pour relire la couche de gouvernance technique à partir de la map canonique et détecter :

- les docs manquantes
- les docs en drift
- les terms recovery gaps
- les behavior indexes manquants
- les symboles trop complexes qui devraient porter un commentaire de contrat ou d'invariant

## Quand un simple commentaire ne suffit pas

Commenter une fonction aide, mais ce n'est pas une stratégie de navigation suffisante.

Un commentaire local répond à une question locale :

- qu'est-ce que cette fonction garantit ?
- quel invariant doit rester vrai ici ?
- pourquoi cette logique d'arbitrage existe dans ce symbole ?

Mais il ne répond pas à une question transversale comme :

- si je parle de `swipe`, quel comportement exact est concerné ?
- dans quel fichier commence la récupération ?
- quels tests, specs ou bugs sont liés ?
- quelle doc propriétaire doit être mise à jour si ce comportement change ?

C'est pour cela qu'un behavior index et une `code-docs-map` ont une vraie valeur durable. Ils réduisent le coût de redécouverte au lieu de l'étaler dans des conversations ou des commentaires dispersés.

## Le rôle utile de `#feature:swipe`

Le tag `#feature:<term>` sert de raccourci de navigation, pas de nouveau langage de commande.

Par exemple, `#feature:swipe` dit à l'agent :

- ne commence pas par une recherche large dans tout le repo
- charge d'abord la couche de term recovery
- résous le terme vers le bon behavior index
- puis reboucle vers les fichiers, docs et validations concernés

Le point important est que ce tag n'invente pas une nouvelle documentation. Il pointe vers une documentation déjà propriétaire.

## Les références d'hygiène à garder sous la main

ShipGlowz porte déjà les règles d'hygiène documentaire dans des références séparées.

`documentation-governance-rules.md` définit la discipline documentaire : placement canonique, ownership, metadata, drift et obligations de mise à jour.

`code-navigation-and-function-docs.md` définit le modèle de navigation : context map, function tree, code-docs map, behavior index, commentaires locaux et frontière avec les ADR.

`technical-docs-corpus.md` explique à quel moment les skills doivent charger cette couche avant de coder, vérifier ou clôturer.

En pratique, ce triptyque évite de transformer la documentation en bricolage au fil des threads.

## Le workflow minimal qui tient dans le temps

Si tu veux une routine simple, elle tient en trois temps :

1. tu modifies le code
2. tu lances `/300-sg-docs technical audit #docs #canon`
3. si drift détecté, tu lances `/300-sg-docs update <zone concernée> #docs`

Et si ton point d'entrée est un terme ambigu, tu ajoutes le tag correspondant, par exemple `#feature:swipe`.

Cette discipline est plus petite qu'un grand système de knowledge management, mais plus solide qu'une base de code où chacun doit tout redécouvrir à la main.
