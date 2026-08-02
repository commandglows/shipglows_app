---
title: "Pourquoi ShipGlowz ne doit pas figer trop vite des primitives globales"
description: "Une explication précise des raisons pour lesquelles les primitives runtime globales pour les profils et les tags doivent attendre que la sémantique soit stabilisée."
summary: "Les primitives globales sont élégantes, mais elles figent trop tôt la sémantique, le débogage et les obligations runtime."
publishDate: 2026-06-28
locale: "fr"
articleKey: "global-primitives-vs-local-conventions"
slug: "pourquoi-shipflow-ne-doit-pas-figer-trop-vite-des-primitives-globales"
alternateSlug: "global-primitives-vs-local-conventions"
tags:
  - "runtime"
  - "profils"
  - "focus-tags"
  - "gouvernance"
featured: true
draft: false
readingTime: "6 min"
---

Les primitives globales paraissent séduisantes parce qu’elles donnent l’impression que la syntaxe est native.

Si `%Victoire` ou `#Adhesion` devenaient de vraies primitives runtime, ils ne se comporteraient plus comme une convention locale chargée au début d’une conversation. Ils deviendraient une partie du contrat de la plateforme elle-même.

C’est précisément pour cela que ShipGlowz ne doit pas se précipiter.

## La distinction qui compte

Une convention locale est implémentée dans la couche ShipGlowz. On peut la faire évoluer, la renommer, la clarifier, voire la retirer, sans prétendre que le runtime hôte la comprend nativement.

Une primitive globale, c’est autre chose :

- elle est toujours disponible
- elle doit se comporter de manière cohérente entre les conversations
- elle exige une sémantique exacte de persistance et de reset
- elle doit rester déboguable quand elle interagit avec les skills, les tags et le routage

Dès que ce contrat existe, toute ambiguïté devient une dette produit.

## Pourquoi le timing compte

Le système de profils actuel est encore en train de prouver son modèle opératoire.

ShipGlowz connaît déjà la valeur de profils nommés comme `%Victoire`, `%Prudence` et `%Ariane` : ils changent la posture et l’arbitrage. Ils ne remplacent pas le skill propriétaire, et ils ne retirent pas le besoin de contexte projet.

Ce qui reste à stabiliser, c’est le comportement runtime autour d’eux :

- Est-ce qu’un profil persiste un seul tour ou tout le fil ?
- Est-ce que plusieurs profils peuvent se cumuler ?
- Si un profil entre en conflit avec un focus tag, lequel gagne ?
- Comment l’opérateur inspecte l’état actif des profils ?
- Quelle est la commande de reset ?

Si ces réponses ne sont pas figées d’abord, une primitive globale ne fait que masquer l’incertitude sous une syntaxe plus propre.

## Les raisons principales d’attendre

### 1. On ne contrôle peut-être pas encore assez profondément le runtime hôte

ShipGlowz peut documenter des conventions aujourd’hui parce que la documentation est sous notre contrôle.

Une primitive native exige un vrai point d’accroche dans la couche runtime. Si cette couche reste partielle, indirecte ou dépendante du plugin, la primitive devient trompeuse. Elle a l’air native, mais se comporte encore comme un contournement.

### 2. Une syntaxe globale fige trop tôt la sémantique

Dès qu’une primitive devient publique, les utilisateurs construisent des habitudes autour.

Changer ensuite sa portée coûte cher parce que cela casse les réflexes, les docs, les exemples et les hypothèses de débogage. Les conventions locales sont beaucoup plus faciles à faire évoluer tant que le modèle se précise.

### 3. La magie cachée devient plus difficile à déboguer

Si `%Victoire` change silencieusement l’arbitrage trois messages plus tard, l’opérateur doit comprendre pourquoi.

Une primitive ne se réduit donc pas à une syntaxe. Elle a besoin d’un état visible, de règles de conflit, d’un comportement de reset et probablement d’une surface d’inspection. Sans cela, le runtime paraît magique au lieu d’être fiable.

### 4. Les profils et les tags peuvent avoir besoin de cycles de vie différents

Ils se ressemblent, mais ils ne remplissent pas le même rôle.

- un profil change la posture
- un tag recentre l’objectif du moment

Ces deux concepts peuvent demander des règles de persistance différentes. Les traiter trop tôt comme une seule famille de primitives créerait de la dérive conceptuelle au lieu d’apporter de la clarté.

## La règle pragmatique

ShipGlowz devrait d’abord prouver le modèle localement :

1. documenter clairement la convention d’invocation
2. implémenter le routage au niveau du plugin, là où le comportement est contrôlé
3. observer les usages réels
4. figer la sémantique uniquement quand les conflits, la persistance et le reset sont explicites

Après cela, les primitives globales deviennent un mouvement de durcissement produit.

Avant cela, c’est surtout de l’API design prématuré.

## La version courte

La question n’est pas de savoir si les primitives globales sont élégantes. Elles le sont.

La vraie question est de savoir si ShipGlowz est prêt à promettre une sémantique runtime exacte pour les profils et les tags à travers les fils, les outils et les surfaces de débogage.

Pour l’instant, le choix le plus sûr est de faire mûrir le modèle d’abord, puis de le promouvoir.
