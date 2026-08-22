---
title: "ShipGlows et T3 Code : la même conviction, un périmètre différent"
description: "Pourquoi ShipGlows admire T3 Code, ce que les deux projets partagent, ce qui les distingue et pourquoi ShipGlows n’utilise pas aujourd’hui T3 Code comme backend runtime."
summary: "T3 Code prouve que les agents de code méritent une excellente interface. ShipGlows partage cette conviction tout en construisant un framework business plus large autour d’une vérité commune, de métiers responsables, de l’exécution et de la preuve."
publishDate: 2026-08-21
locale: "fr"
articleKey: "shipglows-and-t3-code"
slug: "shipglows-et-t3-code-meme-conviction-perimetre-different"
alternateSlug: "shipglows-and-t3-code-same-conviction-different-scope"
tags:
  - "T3 Code"
  - "agents de code"
  - "runtime"
  - "produit"
featured: true
draft: false
readingTime: "7 min"
---

Commençons par le point le plus important : [T3 Code](https://github.com/pingdotgg/t3code) est un projet formidable.

Il s’attaque à un problème qui compte beaucoup pour ShipGlows : les agents de code ne devraient pas obliger les gens à vivre dans un terminal illisible. L’agent peut travailler en arrière-plan. L’utilisateur devrait disposer d’une conversation claire, d’un contexte durable, d’actions visibles, d’approbations compréhensibles et d’un moyen fiable de reprendre le travail plus tard.

Theo Browne fait partie des créateurs qui ont rendu cette conviction visible à grande échelle. Nous admirons son instinct produit autant que le travail de toute l’équipe T3 Code. Ils ont construit un produit open source ambitieux, l’ont décliné sur le Web, le bureau et le mobile, et ont montré qu’une interface d’agent pouvait ressembler à un véritable produit plutôt qu’à une fine couche posée sur une ligne de commande.

ShipGlows ne se présente pas comme un rival de T3 Code et ne prétend ni jouer à la même échelle ni avoir atteint le même niveau de maturité. Nous sommes un projet plus jeune qui apprend d’un travail que nous respectons. Cet article explique simplement ce que T3 Code nous inspire, le problème différent que nous explorons et pourquoi nous ne l’avons pas intégré comme fondation.

## La conviction que nous partageons

T3 Code se présente comme une surface de contrôle pour les agent harnesses. Son serveur possède les sessions des agents, les espaces de travail, le contrôle de version, les terminaux et l’accès aux fichiers. Ses clients communiquent avec ce serveur au moyen d’une connexion temps réel authentifiée. Le projet prend actuellement en charge plusieurs fournisseurs d’agents, dont Codex et OpenCode.

Cette architecture confirme plusieurs choix également importants pour ShipGlows :

- le runtime de l’agent doit rester derrière l’interface, pas à l’intérieur de celle-ci
- une conversation doit être durable et pouvoir être reprise
- les protocoles propres aux fournisseurs ne doivent pas contaminer l’expérience utilisateur
- les approbations et la progression méritent des états explicites dans l’interface
- l’accès distant ne devrait pas consister à diffuser un terminal brut dans un navigateur
- l’utilisateur devrait pouvoir choisir entre plusieurs agents de code

En ce sens, T3 Code et ShipGlows participent au même mouvement : rendre le travail assisté par les agents compréhensible, gouvernable et fiable.

## Ce que T3 Code fait déjà remarquablement bien

T3 Code se concentre remarquablement bien sur l’expérience développeur de pilotage des agents de code. Son périmètre produit comprend les fils, les tours, les adaptateurs de fournisseurs, le contrôle de source, les terminaux, les checkpoints, les environnements distants et les clients pour plusieurs appareils.

Cette concentration est une force. Elle donne à T3 Code l’espace nécessaire pour rendre l’interaction avec les agents rapide, directe et soignée.

Si votre besoin principal est une excellente interface graphique pour piloter les agents de code déjà installés sur votre machine, T3 Code est une réponse très convaincante. Nous préférons le dire franchement plutôt que d’inventer une différence là où il n’y en a pas.

## Le problème adjacent que ShipGlows explore

ShipGlows est un framework business pour les humains et les agents IA. Une interface de conversation sémantique pour les agents de code constitue une surface technique de ce framework plus large, pas sa définition. La question centrale est de savoir comment humains et agents peuvent travailler depuis la même vérité business à travers l’identité, la marque, le contenu, le produit, la technologie, la croissance, la livraison et la preuve.

ShipGlows cherche à relier le travail des humains et des agents à :

- la santé du projet et son contexte opérationnel
- des responsabilités explicites en identité, marque, contenu, produit, ingénierie, croissance, maintenance et livraison
- des plans gouvernés et des limites d’approbation
- des preuves issues des tests, audits, documentations et livraisons
- une distinction claire entre discussion, implémentation, vérification et mise en production
- des règles projet concernant les branches, les permissions et le déploiement

La différence n’est donc pas « interface graphique contre terminal ». Sur ce point, nous sommes d’accord avec T3 Code.

La distinction porte donc sur le périmètre, pas sur l’ambition ou la qualité. T3 Code offre une surface de contrôle mature pour les agents de code. ShipGlows relie le travail des humains et des agents à des questions comme : pourquoi une ambition compte, quel métier la porte, comment l’identité et le business restent reliés à l’exécution technique, quelles preuves rendent le résultat digne de confiance et quand il est véritablement livré.

Ce périmètre plus large crée d’autres contraintes. ShipGlows a besoin d’un contrat runtime neutre qui reste subordonné à la gouvernance du projet. L’agent est un exécutant dans le workflow produit ; il n’est pas le propriétaire de l’ensemble du workflow.

## Pourquoi nous n’avons pas intégré T3 Code comme backend

La réponse courte n’est pas « parce que nous ne pouvions pas ». C’est « parce que la frontière de responsabilité ne serait pas la bonne pour nous aujourd’hui ».

T3 Code dispose d’une véritable API serveur utilisée par ses propres clients. Son architecture actuelle documente une connexion Effect RPC authentifiée sur WebSocket, avec des commandes typées et des flux serveur. Il s’agit d’un contrat interne substantiel, pas d’une interface factice.

Cependant, le contrat client-serveur documenté fait partie du produit T3 Code et évolue avec lui. L’architecture officielle dirige les clients T3 vers des packages internes partagés pour les contrats et le runtime client. Une RFC communautaire a proposé un `@t3tools/sdk` public plus étroit, précisément pour permettre à des applications externes de consommer les fils, commandes et abonnements sans reproduire toute cette mécanique interne. Au moment où nous écrivons ces lignes, ShipGlows ne s’appuie pas sur un tel SDK public et pris en charge.

Dépendre directement de la surface RPC interne couplerait ShipGlows au modèle d’orchestration de T3 Code, à son authentification, à ses règles d’espaces de travail, à son comportement Git et à son rythme de publication. Embarquer ou forker le serveur transférerait une surface de maintenance encore plus importante dans ShipGlows.

Cela créerait également deux plans de contrôle. T3 Code posséderait les sessions, les espaces de travail, les opérations Git et les processus fournisseurs, tandis que ShipGlows posséderait séparément les règles projet, les approbations, la santé, les preuves et la livraison. Déterminer quel système détient l’autorité finale serait plus difficile que de se connecter directement aux agents.

ShipGlows conserve donc sa propre frontière `AgentRuntime`, volontairement réduite. Codex est le premier runtime éprouvé. OpenCode et d’autres agents peuvent rejoindre le même contrat de conversation normalisé. L’interface utilisateur reçoit des événements sémantiques ; elle ne reçoit ni transcription de terminal ni protocole propre à un fournisseur.

C’est une décision d’architecture produit, pas un rejet de T3 Code.

## L’open source change malgré tout la relation

T3 Code est publié sous [licence MIT](https://github.com/pingdotgg/t3code/blob/main/LICENSE). C’est important.

Cela signifie que le projet peut être étudié, servir de source d’apprentissage, être adapté et — lorsque c’est pertinent — réutilisé en conservant la notice requise. Plus encore, son architecture est visible. Nous pouvons comparer honnêtement nos hypothèses au lieu de deviner à partir d’une page marketing.

Nous comptons continuer à apprendre du travail de T3 Code sur le design des conversations, la normalisation des fournisseurs, l’accès distant, la reconnexion, les approbations et les clients multi-appareils. Si T3 Code publie un jour un SDK externe stable, un connecteur ShipGlows limité pourrait devenir une option pertinente.

Mais l’admiration n’exige pas une dépendance architecturale. Parfois, la réponse la plus respectueuse à un excellent projet open source consiste à comprendre profondément ses idées, à les créditer clairement et à rester honnête sur les endroits où son propre produit a besoin d’une frontière différente.

## Notre position en une phrase

T3 Code construit une excellente surface de contrôle pour les agents de code ; ShipGlows apprend de cette vision tout en construisant un framework business que les humains utilisent directement et à travers lequel les agents peuvent agir.

Nous sommes assez proches pour apprendre les uns des autres, assez différents pour justifier des architectures séparées, et reconnaissants que T3 Code existe.

Pour comprendre les idées de workflow que ShipGlows explore autour de cette interface, [poursuivez avec la documentation ShipGlows](/fr/docs).

### Sources

- [Dépôt et présentation de T3 Code](https://github.com/pingdotgg/t3code)
- [Architecture interne de T3 Code](https://github.com/pingdotgg/t3code/blob/main/docs/internals/overview.md)
- [Documentation de l’accès distant T3 Code](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md)
- [RFC communautaire pour un SDK T3 Code](https://github.com/pingdotgg/t3code/issues/6419)
- [Licence MIT de T3 Code](https://github.com/pingdotgg/t3code/blob/main/LICENSE)
