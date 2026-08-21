---
title: "Votre agent a modifié le code. Mais votre travail est-il vraiment sauvegardé ?"
description: "Pourquoi le développement assisté par IA a besoin de commits par jalon, de persistance distante, de reprise après interruption et d’une distinction claire entre sauvegarde et déploiement."
summary: "Écrire des fichiers ne suffit pas à protéger un chantier. ShipGlows utilise des jalons Git et des états de livraison explicites pour garder le travail des agents traçable et récupérable."
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
readingTime: "6 min"
---

Un agent IA peut modifier vingt fichiers, réussir tous les contrôles locaux et laisser malgré tout le résultat entier vulnérable sur une seule machine.

C’est l’écart inconfortable entre **générer du code** et **assurer la continuité d’un chantier**. Un working tree n’est pas une sauvegarde. Un commit local n’est pas une sauvegarde distante. Un push n’est pas un déploiement.

Pour un solopreneur, ces distinctions comptent. Il n’y a pas forcément un second développeur qui surveille la branche, un release manager qui vérifie ce qui a atteint GitHub ou une équipe d’exploitation qui reconstruira le travail après un incident. Le workflow doit rendre l’état visible lui-même.

## Le risque caché du travail resté local

Le développement agentique permet d’accumuler rapidement beaucoup de travail utile. Il permet aussi de croire que, puisque l’agent présente son travail comme terminé, ce travail doit être en sécurité.

Plusieurs situations fréquentes contredisent cette impression :

- des fichiers ont été modifiés sans être committés ;
- un commit existe uniquement sur la machine actuelle ;
- la branche pointe vers un dépôt distant inattendu ;
- des modifications locales sans rapport ont été mélangées à la livraison ;
- le code a été poussé, mais personne n’a prouvé que le commit attendu a été déployé.

Aucun de ces états n’est exceptionnel. Le problème est de les laisser invisibles.

## Protéger des jalons cohérents, pas chaque frappe clavier

La solution n’est pas de committer après chaque sauvegarde de fichier. Cela créerait du bruit plutôt que des points de reprise utiles.

ShipGlows considère comme jalon une tranche cohérente de travail, avec un résultat stable et une preuve proportionnée réussie. Une fois cette tranche validée, le workflow gouverné impose un commit au périmètre exact et un push ordinaire vers le dépôt distant résolu avant de commencer le jalon suivant.

On obtient ainsi des points de reprise utiles sans transformer l’historique Git en flux de captures arbitraires.

Le même principe s’applique à la fin d’un chantier : un travail modifié ne peut pas être présenté comme proprement clôturé si son commit existe seulement en local ou si son push a échoué.

## Trois états à ne jamais confondre

ShipGlows sépare trois états de preuve.

### Local

Les changements ne sont pas committés, ou le commit concerné n’est pas encore prouvé accessible depuis le dépôt distant résolu. Le travail peut être utile et validé, mais il dépend toujours de la machine actuelle.

### Sauvegardé

Le commit du chantier est prouvé accessible depuis le dépôt Git distant résolu. Pour beaucoup de projets, ce dépôt est GitHub, mais la preuve porte sur la configuration réelle du dépôt — pas sur une supposition liée au logo d’un fournisseur.

### Déployé

Une preuve faisant autorité du fournisseur d’hébergement confirme le commit attendu sur une cible nommée de preview, staging ou production.

Un push peut établir le deuxième état. Il ne peut pas établir le troisième.

## La reprise doit rester silencieuse quand tout va bien

Un garde-fou devient contre-productif s’il interrompt chaque action normale.

ShipGlows utilise donc un contrôle de persistance léger et en lecture seule uniquement aux frontières existantes du cycle :

- avant la première écriture d’un chantier avec mutations ;
- à la reprise d’un chantier interrompu ;
- avant une opération sensible ;
- avant de classer la clôture.

Lorsque le dépôt, la branche, le remote, l’ownership et la persistance sont cohérents, le contrôle reste silencieux. Il ne crée ni écran, ni questionnaire, ni approbation supplémentaire.

Lorsqu’un élément reste vulnérable, la réponse est concrète : identifier le commit resté local, préserver les modifications sans rapport, refuser de deviner un remote ambigu ou retrouver le dernier point distant prouvé avec le reliquat local.

## Les opérations sensibles demandent d’abord un point de reprise distant

L’authentification, les paiements, les permissions, les migrations, les changements destructifs, les frontières de tenant, les secrets, les données privées et la production ont un rayon d’impact plus large qu’une modification ordinaire.

Avant ce type de mutation, ShipGlows exige que l’état de référence concerné soit sauvegardé à distance. Il ne fabrique pas un commit rassurant à partir d’un travail en échec, incomplet, porteur de secrets, ambigu ou sans rapport.

Cette limite est essentielle : un point de reprise n’est utile que si son contenu et son ownership sont fiables.

## Ce que cette approche promet — et ce qu’elle ne promet pas

ShipGlows peut décrire honnêtement un workflow Git gouverné qui :

- committe et pousse les jalons validés ;
- refuse une clôture propre pour un travail modifié resté local ;
- contrôle l’état vulnérable aux frontières utiles ;
- préserve les modifications sans rapport hors du périmètre livré ;
- distingue persistance distante et preuve de déploiement.

Il ne garantit ni la disponibilité de GitHub, ni l’absence absolue de perte, ni les protections du dépôt, ni le succès de la CI, ni une mise en production sans surveillance. Ces affirmations demandent des preuves fournisseur et une configuration propre au projet.

La valeur n’est pas une garantie magique. Elle réside dans le refus du workflow de masquer l’état réel du travail.

## Une question pratique à poser à tout agent de code

Après qu’un agent a annoncé « terminé », demandez :

1. Quel commit exact contient le résultat ?
2. Ce commit est-il accessible depuis la branche distante attendue ?
3. Les changements locaux sans rapport ont-ils été exclus ?
4. Si un déploiement est annoncé, quelle preuve fournisseur correspond à ce commit ?
5. Si la session s’arrête maintenant, quel est le dernier point de reprise prouvé ?

Si ces réponses manquent, le code a peut-être changé sans que le travail soit réellement livré en sécurité.

ShipGlows est conçu pour garder cette distinction visible. [Lisez le contrat de continuité Git dans la documentation publique](/fr/docs#git-continuity), ou [inspectez la source du workflow sur GitHub](https://github.com/commandglows/shipglows).
