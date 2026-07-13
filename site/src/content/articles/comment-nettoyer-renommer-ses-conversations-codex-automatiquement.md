---
title: "Comment nettoyer et renommer ses conversations Codex automatiquement pour s'y retrouver dans ses chantiers"
description: "Un workflow concret pour transformer l'historique Codex en mémoire de chantier exploitable, avec titres explicites, statuts clairs et suivis visibles."
date: "2026-06-26"
category: "Workflow"
excerpt: "Quand les sessions Codex s'accumulent, elles deviennent un historique opaque. Voici comment les transformer en système clair pour retrouver ses chantiers et montrer son univers."
keywords:
  - Codex
  - sessions
  - tri
  - workflow
  - productivité
  - tâches
---

## Pourquoi ce tri devient vite utile

Quand on utilise Codex souvent, la liste des conversations finit par ressembler à un carnet de bord sans étiquettes. Une session peut contenir une idée, un correctif, une vérification, un plan ou une tâche encore ouverte. Sur le moment, tout va bien. Trois jours plus tard, on ne sait plus quel fil était terminé, quel fil attendait une suite, ni quel fil méritait d’être converti en tâche durable.

Le vrai problème n’est pas le volume. C’est la perte de repères. Et quand les repères disparaissent, on perd aussi la valeur marketing de ce qu’on a construit.

## Le principe

Le workflow que nous avons mis en place repose sur trois gestes très simples:

1. repérer les sessions liées au repo courant
2. leur donner un titre explicite
3. ajouter un suffixe comme `done` ou `ok` quand le chantier est réellement clos

L’idée n’est pas de faire de la déco. L’idée est de transformer l’historique Codex en index de travail, puis en preuve concrète qu’un CLI peut aider à garder le cap sur ses chantiers.

## Où ça vit techniquement

Codex garde l’état visible de ses conversations dans `~/.codex/state_5.sqlite`. C’est là que le menu “Resume a previous session” lit les titres de conversation.

Le champ utile est simple:

- `threads.cwd` permet de filtrer les sessions du dossier courant
- `threads.title` contrôle le nom affiché
- `threads.preview` aide à retrouver le sujet quand le titre est trop générique

En pratique, ça veut dire qu’un renommage utile ne se fait pas juste dans un cache d’affichage. Il faut toucher la vraie source de vérité du menu, sinon la liste reste obscure et l’outil perd son intérêt.

## Comment on trie

Le tri le plus simple suit ce rythme:

1. filtrer les sessions du projet courant
2. relire le titre ou le premier message pour comprendre le sujet
3. renommer la session avec une phrase lisible
4. ajouter `(done)` ou `(ok)` seulement si le travail est réellement terminé
5. déplacer les suivis durables dans `TASKS.md`

Exemples de titres utiles:

- `Inventaire des skills du repo (done)`
- `Renommage des sessions Codex (done)`
- `Article sur le tri des conversations Codex`

## Pourquoi c’est utile

Ce workflow apporte trois gains concrets:

- on retrouve plus vite les chantiers passés
- on évite de laisser des conversations mortes envahir la liste
- on transforme les restes de discussion en tâches visibles et actionnables

Pour un indépendant ou une petite équipe, c’est précieux parce que la conversation Codex devient une couche de mémoire opérationnelle, pas seulement un tchat d’exécution. Et quand cette mémoire est lisible, elle devient aussi un argument de produit.

## Le lien avec `TASKS.md`

Une bonne conversation n’est pas toujours une tâche finie. Parfois elle révèle un vrai follow-up: documentation à écrire, workflow à formaliser, surface à publier, ou nettoyage à reprendre plus tard.

Dans ce cas, le bon réflexe est de:

- renommer la session pour qu’elle soit retrouvable
- marquer son état si le chantier est clos
- créer ou mettre à jour l’entrée correspondante dans `TASKS.md`

Le titre de session aide à s’y retrouver. `TASKS.md` garde la suite réelle.

## Ce que ça ouvre côté produit

Au-delà du ménage, ce petit workflow sert aussi à montrer l’univers du produit:

- une CLI et des skills qui savent organiser le travail
- un système de tâches qui capture les chantiers durables
- une manière plus fiable de reprendre un contexte après coup

Autrement dit, la feature n’est pas seulement un outil interne. C’est une preuve que l’outil sait aider à garder le cap quand le contexte s’accumule, et ça parle très vite aux gens qui vivent dans leurs chantiers.

## En pratique

Si tu dois résumer ce workflow en une phrase:

> Trier les conversations Codex, c’est rendre le contexte navigable au lieu de le laisser s’éparpiller.

Et si tu veux le rendre réutilisable:

- garde le même format de titre
- utilise toujours le même suffixe de clôture
- rattache chaque vrai follow-up au tracker du repo

Ça suffit souvent à faire passer une liste de conversations de “bruit” à “mémoire de chantier”.
