---
title: "Sommes-nous en train de réinventer Nix ? ShipGlows face à Flox, mise, WinGet Configuration et Dev Containers"
description: "Comparer les modèles d'environnement reproductible pour déterminer si ShipGlows doit remplacer les outils existants ou les orchestrer."
summary: "Nix, Flox, mise, WinGet Configuration et Dev Containers ne reproduisent pas la même chose. Cette comparaison cherche la frontière utile de ShipGlows."
publishDate: 2026-08-16
locale: "fr"
articleKey: "shipglows-reinventer-nix-environnements-reproductibles"
slug: "sommes-nous-en-train-de-reinventer-nix"
alternateSlug: "are-we-reinventing-nix"
tags: ["environnements reproductibles", "Nix", "Flox", "mise", "WinGet", "Dev Containers", "Windows", "agents IA"]
featured: false
draft: true
readingTime: "14 min"
---

# Sommes-nous en train de réinventer Nix ?

La question est inconfortable, donc elle est probablement utile.

Nous avons commencé par un problème très concret : préparer une machine Windows pour qu'un développeur — humain ou agent IA — puisse réellement travailler. Pas seulement ouvrir un terminal, mais trouver les bons CLI, construire une application Flutter, lancer Android, utiliser Playwright avec la bonne révision de Chromium, connecter des MCP et savoir quelles authentifications restent à effectuer.

Très vite, l'installateur a commencé à ressembler à autre chose qu'un installateur.

Il détecte un état existant. Il résout des versions. Il télécharge des outils. Il préserve certaines configurations. Il demande l'acceptation de licences. Il diagnostique ce qui fonctionne. Il explique ce qui reste incomplet.

À ce stade, une question s'impose : **sommes-nous en train de reconstruire maladroitement ce que Nix, Flox, mise, WinGet Configuration ou les Dev Containers savent déjà faire ?**

La réponse courte est : parfois oui, mais pas toujours.

La réponse intéressante est que ces outils ne cherchent pas tous à reproduire la même chose.

## « Reproductible » recouvre plusieurs promesses

Le mot peut désigner au moins cinq objectifs différents :

1. retrouver les mêmes versions d'outils ;
2. reconstruire un environnement de shell cohérent ;
3. remettre une machine dans un état désiré ;
4. isoler le développement du système hôte ;
5. prouver à un humain ou à un agent ce qui fonctionne réellement.

Un outil peut être excellent sur une de ces dimensions et laisser les autres au système hôte, à un IDE ou à une procédure manuelle.

Cette distinction change toute la comparaison. Une liste de paquets n'est pas une machine configurée. Une machine configurée n'est pas un environnement isolé. Un environnement isolé ne garantit pas qu'un émulateur Android peut exploiter la virtualisation de l'hôte. Et aucun fichier déclaratif ne devrait accepter une licence ou se connecter à un compte à la place de son propriétaire.

## Nix : la référence conceptuelle, mais pas une réponse universelle

Nix part d'une idée puissante : les dépendances et les instructions de construction doivent être décrites explicitement, puis les résultats stockés de façon isolée. Son modèle rend possibles des environnements de développement déclaratifs et limite les dépendances implicites entre paquets.

Il faut néanmoins éviter une simplification fréquente. Même la documentation Nix rappelle qu'utiliser des dérivations et un sandbox constitue un excellent point de départ pour des builds reproductibles, mais ne suffit pas à éliminer toutes les sources de non-déterminisme, comme les horodatages.

Nix est donc une référence pour penser :

- la déclaration des dépendances ;
- l'isolation des versions ;
- le verrouillage des entrées ;
- le partage d'environnements ;
- la séparation entre configuration et état produit.

Mais Nix ne répond pas automatiquement à chaque contrainte d'un poste Windows natif. Il ne décide pas à lui seul comment gérer un workload Visual Studio, une stratégie d'émulateur Android, une authentification GitHub ou Firebase, les configurations propres à plusieurs agents, ni l'état d'un service de développement attaché à une interface graphique.

Autrement dit, Nix donne un modèle très fort pour les paquets et les environnements. Il ne possède pas nécessairement toute l'expérience de travail.

Sources : [Nix, declarative builds and deployments](https://nixos.org/), [NixOS Reproducible Builds](https://reproducible.nixos.org/).

## Flox : rendre la puissance de Nix plus accessible

Flox construit au-dessus de Nix un modèle plus direct pour les équipes. Un environnement contient un manifeste déclaratif, un lockfile, des variables et des scripts d'activation. Il se superpose au système dans un sous-shell plutôt que de placer tout le travail dans un conteneur.

Ce choix est particulièrement intéressant pour ShipGlows : Flox permet de conserver l'éditeur, les alias et les personnalisations du poste tout en donnant priorité aux outils de l'environnement actif. Le manifeste et son lockfile peuvent être versionnés avec le projet.

Flox couvre officiellement macOS, Linux et Windows à travers WSL 2. Ce dernier point est décisif : **WSL n'est pas le Windows natif**. Un environnement Linux dans WSL peut être excellent pour Node, Python ou Rust, tout en restant insuffisant pour certains outils graphiques, workloads Windows, périphériques, pilotes ou chaînes mobiles qui vivent du côté hôte.

Flox semble donc être un très bon moteur Unix pour ShipGlows, sans constituer à lui seul le moteur de convergence d'une machine Windows native.

Sources : [What is a Flox environment?](https://flox.dev/docs/concepts/environments), [Install Flox](https://flox.dev/docs/install-flox/install).

## mise : une couche légère et pragmatique pour les outils de projet

mise se place plus près du quotidien du développeur. Un `mise.toml` peut déclarer des versions d'outils, des variables d'environnement et des tâches. Son lockfile peut enregistrer versions exactes, URL et sommes de contrôle selon les backends disponibles. Sa documentation prévoit aussi des variantes par plateforme, dont Windows.

Cette approche convient bien aux outils comme Node, Python, Java, Go ou différents CLI. Elle évite de transformer chaque installation de runtime en code PowerShell propre à ShipGlows.

Mais mise n'est pas une machine virtuelle et ne prétend pas posséder tout l'hôte. Il ne remplace pas automatiquement :

- les composants Windows installés par WinGet ;
- un workload Visual Studio ;
- l'activation de la virtualisation ;
- une image Android et son AVD ;
- les connexions utilisateur ;
- les formats MCP propres à chaque agent.

mise pourrait donc devenir le moteur de versions des outils projet sous Windows, pendant que ShipGlows conserve l'orchestration, le diagnostic et les frontières humaines.

Sources : [mise walkthrough](https://mise.jdx.dev/walkthrough.html), [mise.lock](https://mise.jdx.dev/dev-tools/mise-lock.html), [mise environments](https://mise.jdx.dev/environments/).

## WinGet Configuration : converger l'état de la machine Windows

WinGet Configuration se situe à un autre niveau. Microsoft le présente comme un moyen de décrire un état de développement désiré avec des paquets et d'autres réglages système. Les commandes permettent notamment de valider une configuration, de la tester et de l'appliquer.

Ce modèle paraît plus naturel que des dizaines de fonctions PowerShell indépendantes pour installer des applications et rapprocher Windows d'un état attendu.

Mais la convergence d'une machine ne garantit pas l'identité parfaite de deux environnements. Les ressources disponibles, les installateurs externes et l'état préalable du système peuvent conserver des différences. Microsoft demande d'ailleurs de vérifier la provenance et le contenu d'un fichier de configuration avant de l'exécuter.

WinGet Configuration ressemble donc moins à Nix qu'à un moteur de **desired state** pour Windows. Cela peut être exactement la bonne brique pour la couche machine, à condition que ShipGlows ne transforme pas « configuration appliquée » en « environnement entièrement prouvé ».

Source : [WinGet configure command](https://learn.microsoft.com/windows/package-manager/winget/configure).

## Dev Containers : reproduire l'espace de travail sans posséder l'hôte

La Development Container Specification définit un format `devcontainer.json` utilisable par plusieurs outils et services. Son but n'est pas d'inventer un nouvel orchestrateur de conteneurs, mais d'ajouter les métadonnées nécessaires à un environnement de développement conteneurisé.

Pour beaucoup de projets backend ou web, c'est une frontière élégante : système de fichiers, runtime, extensions, commandes et services peuvent vivre dans un espace cohérent, localement ou dans le cloud.

La limite apparaît dès que le projet dépend fortement de l'hôte :

- accélération matérielle ;
- émulateur Android ;
- appareil USB ;
- applications graphiques natives ;
- navigateur ou cache installé hors du conteneur ;
- politiques et identifiants de la machine ;
- workloads de compilation Windows.

Un Dev Container peut décrire les exigences de l'hôte. Il ne les rend pas vraies par magie.

Sources : [Development Container Specification overview](https://containers.dev/overview), [supporting tools and services](https://containers.dev/supporting.html).

## La comparaison utile

| Solution | Unité principale | Force dominante | Windows natif | Isolation | Ce qu'elle laisse généralement ailleurs |
| --- | --- | --- | --- | --- | --- |
| Nix | dérivation, paquet, environnement ou système NixOS | dépendances déclaratives et isolation des versions | limité selon les usages | forte dans son modèle | contraintes hôte Windows, consentements, comptes et UX multi-outils |
| Flox | manifeste et lockfile d'environnement | environnement Nix accessible et partageable | via WSL 2 | sous-shell, sans conteneur | outils Windows natifs et matériel hôte |
| mise | configuration d'outils, variables et tâches | versions de CLI et ergonomie projet | oui | faible à moyenne | applications système, pilotes, workloads et consentements |
| WinGet Configuration | état désiré d'une machine Windows | paquets et réglages Windows convergents | oui | aucune isolation générale | identité parfaite de l'environnement projet et état des agents |
| Dev Containers | environnement de développement conteneurisé | portabilité entre outils et services compatibles | via un moteur de conteneurs | forte au niveau conteneur | matériel, GUI et politiques de l'hôte |
| ShipGlows aujourd'hui | bootstrap, diagnostics et contexte opérationnel | coordination entre machine, projet, agents et actions humaines | oui, avec un chemin distinct d'Unix | variable selon les outils utilisés | manifeste unifié, backends déclaratifs stabilisés et attestation complète |

Cette table ne désigne pas un vainqueur. Elle montre surtout que les unités de gestion sont différentes.

## Là où ShipGlows risque réellement de réinventer l'existant

ShipGlows réinventerait l'eau chaude s'il écrivait son propre mécanisme pour :

- télécharger et conserver chaque version de runtime ;
- résoudre seul toutes les dépendances de paquets ;
- inventer un nouveau format de conteneur ;
- remplacer les ressources Windows déjà exprimables en DSC ;
- recréer un lockfile sans avantage propre.

Ce travail est coûteux, difficile à sécuriser et rarement différenciant.

Le meilleur scénario n'est probablement pas « ShipGlows remplace Nix ». Il serait plutôt :

- Flox ou Nix pour les environnements Unix reproductibles ;
- mise pour une partie des outils projet, notamment sous Windows natif ;
- WinGet Configuration pour l'état de la machine Windows ;
- Dev Containers lorsque la frontière conteneur correspond au projet ;
- ShipGlows pour choisir, orchestrer, vérifier et expliquer ces moteurs.

Ce n'est encore qu'une hypothèse d'architecture. Elle doit être testée sur de vrais projets avant de devenir une promesse produit.

## Là où une couche d'orchestration reste utile

Les incidents rencontrés pendant la préparation de Flutter et Android montrent un espace que les gestionnaires de paquets couvrent mal lorsqu'ils sont pris isolément.

Installer une commande n'est pas suffisant. Il faut parfois :

- vérifier que le processus de l'agent voit réellement le bon `PATH` ;
- aligner une version de Playwright avec la révision de Chromium attendue ;
- distinguer Android Studio, les command-line tools, le SDK, l'émulateur, l'image système et l'AVD ;
- expliquer que Visual Studio et Visual Studio Code ne remplissent pas le même rôle ;
- demander une acceptation de licence sans répondre à la place de l'utilisateur ;
- préserver une configuration MCP existante et ses secrets ;
- constater qu'un outil est installé mais inutilisable dans la surface qui doit l'appeler ;
- proposer un téléphone réel ou un appareil hébergé lorsque l'accélération locale est indisponible.

La valeur possible de ShipGlows se situe dans cette coordination entre couches, et surtout dans la différence entre **présence**, **configuration** et **capacité prouvée**.

## Un modèle à explorer : desired, resolved, observed

La prochaine architecture pourrait séparer trois états.

### Desired

Ce que le projet demande : runtimes, versions, services, outils d'agent, cibles de compilation et capacités attendues.

### Resolved

Ce que le moteur a sélectionné pour une plateforme donnée : paquet Flox, backend mise, ressource WinGet, image de conteneur, composant SDK ou action interactive.

### Observed

Ce qui est réellement visible et fonctionnel : version exécutée, chemin trouvé, diagnostic réussi, appareil disponible, MCP joignable ou authentification encore absente.

Cette séparation empêcherait plusieurs raccourcis dangereux :

- « installé » ne signifierait plus « opérationnel » ;
- « configuration appliquée » ne signifierait plus « machine identique » ;
- « commande présente dans mon terminal » ne signifierait plus « disponible pour tous les agents » ;
- « émulateur téléchargé » ne signifierait plus « appareil virtuel démarrable ».

## Les questions que cette comparaison laisse ouvertes

Avant de modifier l'architecture ShipGlows, il faudrait répondre expérimentalement à ces questions :

1. Un manifeste ShipGlows doit-il être une nouvelle source de vérité ou une couche qui référence les manifestes natifs de Flox, mise, WinGet et Dev Containers ?
2. Quelles propriétés sont réellement portables entre Unix, Windows natif et conteneurs ?
3. Comment éviter que le plus petit dénominateur commun rende le manifeste inutile ?
4. Quels outils appartiennent à la machine, au projet, à l'utilisateur ou à l'agent ?
5. Comment représenter une licence, une authentification ou une politique sans stocker un consentement ni un secret ?
6. À partir de quelle preuve ShipGlows peut-il déclarer une capacité `ready` ?
7. Faut-il produire une attestation d'environnement lisible par les humains et les agents ?
8. Comment détecter la dérive sans reprendre la propriété des configurations existantes ?

## La conclusion provisoire

Oui, ShipGlows touche un territoire déjà très exploré. C'est une bonne nouvelle : nous disposons de modèles solides, de standards ouverts et de moteurs éprouvés.

Le risque serait de les ignorer.

Mais les assembler n'est pas automatiquement redondant. Entre un manifeste de paquets et un développeur réellement capable de travailler, il reste des frontières : l'hôte, le matériel, les IDE, les agents, les comptes, les licences, les diagnostics et les explications.

La question d'architecture n'est donc probablement pas :

> Comment construire notre propre Nix ?

Elle ressemble davantage à ceci :

> Comment donner à chaque projet un contrat d'environnement commun, puis laisser les meilleurs moteurs de chaque plateforme l'exécuter — sans mentir sur ce qu'ils ne peuvent pas reproduire ?

Ce brouillon est le point de départ de cette réponse, pas sa conclusion.
