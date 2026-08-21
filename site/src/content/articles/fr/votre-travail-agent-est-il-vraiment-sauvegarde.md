---
title: "Comment ShipGlows protège votre travail du début à la fin avec Git et GitHub"
description: "Un guide accessible pour comprendre Git, GitHub, les commits, la sauvegarde distante, la reprise après interruption et la protection du travail des agents avec ShipGlows."
summary: "ShipGlows n’attend pas la fin pour protéger votre code. Il crée des points de reprise utiles, repère le travail resté local et distingue clairement sauvegarde et mise en ligne."
publishDate: 2026-08-21
locale: "fr"
articleKey: "git-backed-agent-work"
slug: "votre-travail-agent-est-il-vraiment-sauvegarde"
alternateSlug: "is-your-agent-work-actually-backed-up"
tags:
  - "git"
  - "github"
  - "agents-ia"
  - "livraison"
  - "reprise"
featured: false
draft: false
readingTime: "8 min"
---

Un agent IA peut modifier vingt fichiers, réussir tous les contrôles et annoncer que le travail est terminé. Pourtant, le résultat entier peut encore exister sur un seul ordinateur.

C’est l’un des risques les moins visibles du développement assisté par IA. Le code peut sembler terminé sans être correctement enregistré, sauvegardé ailleurs ou disponible en ligne.

ShipGlows protège le travail tout au long d’un chantier technique au lieu de traiter Git comme un rangement de dernière minute. C’est particulièrement important pour les solopreneurs et les vibe coders débutants : il n’y a pas forcément un second développeur qui surveille le dépôt ni un responsable de livraison qui vérifie ce qui a atteint GitHub. Le workflow doit rendre la situation claire lui-même.

## D’abord, à quoi servent Git et GitHub ?

Vous n’avez pas besoin de devenir expert de Git pour comprendre le principe de protection.

- **Git** enregistre l’historique d’un projet. Il montre quels fichiers ont changé et regroupe un bloc cohérent de travail dans un enregistrement nommé **commit**.
- Un **commit** est un point de reprise utile. On peut l’inspecter, le comparer au travail précédent ou y revenir si nécessaire.
- **GitHub** peut conserver une copie distante de cet historique Git, ailleurs que sur votre ordinateur. ShipGlows peut également fonctionner avec un autre dépôt Git configuré.
- Un **push** envoie les commits locaux vers ce dépôt distant.

Ces actions sont liées, mais elles ne signifient pas la même chose. Modifier un fichier ne crée pas un commit. Créer un commit ne l’envoie pas sur GitHub. Envoyer du code sur GitHub ne met pas le produit en ligne.

Voilà pourquoi « l’agent a modifié le code » ne constitue pas une preuve suffisante.

## Avant de commencer : repérer ce qui est déjà fragile

Avant de modifier un projet technique, ShipGlows examine la situation existante sans rien changer. Sommes-nous dans le bon dépôt et sur la bonne branche ? Du travail n’a-t-il pas encore été enregistré dans Git ? Un commit existe-t-il uniquement sur cet ordinateur ? D’autres modifications locales sont-elles déjà présentes ?

Quand tout va bien, ce contrôle reste silencieux. Il n’ajoute ni questionnaire ni écran d’approbation. Lorsqu’un élément est fragile ou ambigu, ShipGlows rend le risque visible avant d’empiler de nouvelles modifications dessus.

Ce premier contrôle protège aussi le travail qui peut provenir d’une ancienne session, d’un autre outil ou de vos propres modifications manuelles. ShipGlows ne suppose pas que chaque fichier modifié lui appartient.

## Pendant le chantier : sauvegarder les blocs de travail terminés

Protéger le travail en continu ne signifie pas créer un commit après chaque frappe clavier. Cela remplirait l’historique de captures arbitraires difficiles à comprendre.

ShipGlows attend plutôt qu’un bloc cohérent produise le résultat attendu et passe les contrôles adaptés. Ensuite, il :

1. sélectionne uniquement les fichiers qui appartiennent à ce bloc ;
2. crée un commit qui décrit le résultat terminé ;
3. envoie ce commit vers le dépôt Git distant du projet ;
4. confirme si la sauvegarde distante a réussi.

Le projet obtient ainsi des points de reprise faciles à comprendre. Cette méthode évite aussi de mélanger silencieusement des modifications locales sans rapport avec la livraison.

Si le push échoue, ShipGlows ne prétend pas que le travail est sauvegardé à distance. Le commit peut être valide et utile, mais il dépend encore de l’ordinateur actuel tant que le dépôt distant ne l’a pas confirmé.

## Avant une modification sensible : conserver un retour sûr

Certaines opérations comportent plus de risques qu’une simple modification d’interface : authentification, paiements, permissions, migration de base de données, action destructive, secrets, données privées ou configuration de production.

Avant ce type de travail, ShipGlows exige que le point de départ concerné existe dans le dépôt distant. Si la nouvelle modification échoue, une version connue reste disponible pour être inspectée ou restaurée.

Ce garde-fou possède une limite importante : ShipGlows ne fabrique pas un commit rassurant à partir d’un travail cassé, incomplet, contenant des secrets, ambigu ou sans rapport. Un point de reprise n’est utile que si son contenu est fiable.

## Après une interruption : repartir des preuves, pas de mémoire

Un ordinateur peut redémarrer. Un terminal peut se fermer. Une session d’agent peut perdre son contexte. Vous pouvez aussi revenir sur le projet plusieurs jours plus tard.

À la reprise, ShipGlows examine de nouveau le dépôt avant de continuer. Il cherche le dernier commit confirmé sur le dépôt distant et identifie le travail qui existe encore uniquement en local. Cela permet de répondre à deux questions concrètes :

- Quelle est la dernière version dont la sauvegarde est certaine ?
- Quel travail inachevé doit encore être compris et préservé ?

ShipGlows préserve les modifications sans rapport et s’arrête lorsqu’il ne peut pas identifier le bon dépôt distant de manière sûre. Deviner rendrait la reprise moins fiable, pas davantage.

## Avant de terminer : ne pas laisser le résultat sur une seule machine

À la fin, ShipGlows contrôle de nouveau l’état de la livraison. Un travail modifié ne peut pas être présenté comme proprement terminé si son commit existe uniquement en local ou si son push a échoué.

Le compte rendu final indique ce qui a été enregistré et si cela a été envoyé vers le dépôt distant. Vous n’avez donc pas besoin de mémoriser des commandes Git pendant que vous vous concentrez sur le produit.

## Local, sauvegardé et déployé sont trois états différents

ShipGlows sépare ces états parce qu’ils répondent chacun à une question différente.

### Local

Les modifications ou commits dépendent encore de l’ordinateur actuel. Le travail peut être utile et testé, mais aucune copie distante n’est encore confirmée.

### Sauvegardé

Le commit concerné est disponible depuis GitHub ou le dépôt Git distant configuré pour le projet. Le travail ne dépend plus d’une seule machine.

### Déployé

La plateforme d’hébergement confirme que la version attendue fonctionne sur un environnement identifié de prévisualisation, de test ou de production.

Un push peut prouver la sauvegarde distante. Il ne peut pas prouver le déploiement.

## Ce que cette protection ne garantit pas

Git et GitHub améliorent fortement la traçabilité et la reprise, mais ils ne sont pas magiques. ShipGlows ne garantit ni la disponibilité de GitHub, ni l’absence absolue de perte, ni la bonne configuration des protections du dépôt, ni le succès des contrôles automatiques, ni une mise en production sans surveillance. Ces états dépendent du fournisseur et de la configuration de chaque projet.

La promesse est plus précise : ShipGlows vérifie la situation aux moments utiles, sauvegarde les blocs cohérents, les envoie vers le dépôt distant quand celui-ci est prêt, préserve les modifications sans rapport et refuse de masquer si le résultat est local, sauvegardé ou déployé.

## Cinq questions simples après qu’un agent annonce « terminé »

Vous pouvez évaluer n’importe quel agent de code avec la même liste :

1. Quel travail terminé a été enregistré ?
2. A-t-il été envoyé vers le bon dépôt GitHub ou Git ?
3. Les modifications sans rapport ont-elles été exclues de ce commit ?
4. Si le produit est annoncé en ligne, quelle preuve confirme son déploiement ?
5. Si la session s’arrête maintenant, où se trouve la dernière version sûre ?

Vous n’avez pas besoin de manipuler Git manuellement tout au long du chantier pour bénéficier de ces questions. ShipGlows est conçu pour y répondre dans le workflow, afin que vous puissiez vous concentrer sur le produit sans confondre « modifié », « sauvegardé » et « en ligne ».

[Découvrez les trois états de livraison dans la documentation publique](/fr/docs#git-continuity), ou [inspectez le workflow ShipGlows sur GitHub](https://github.com/commandglows/shipglows).
