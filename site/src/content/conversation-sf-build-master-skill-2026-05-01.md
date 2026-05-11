---
title: "Export conversation - SF Build Autonomous Master Skill"
date: "2026-05-01"
status: "conversation-export"
scope: "Transcript utilisateur visible et synthese operationnelle"
---

# Export conversation - SF Build Autonomous Master Skill

Date d'export : 2026-05-01

Note : cet export reprend le contexte visible de la conversation courante. Les messages assistant anterieurs ne sont pas disponibles mot pour mot dans le contexte courant ; ils sont donc representes par une synthese operationnelle des decisions et points de vision.

## Transcript utilisateur visible

### Message 1

```text
$sf-ready sf-build autonomous master skill
```

### Message 2

```text
$sf-spec  sf-build Autonomous Master Skill
```

### Message 3

```text
$sf-spec  sf-build Autonomous Master Skill
```

### Message 4

```text
$sf-ready
```

### Message 5

```text
explique moi ça : The spec now blocks automatic subagent spawning, unsafe single-
    agent degradation, ambiguous staging, failed verification, and all-dirty
    misuse.
```

### Message 6

```text
explique moi ça : The spec now blocks automatic subagent spawning, unsafe single-
    agent degradation, ambiguous staging, failed verification, and all-dirty
    misuse.
```

### Message 7

```text
Pourquoi SF Build ne peut pas lancer des sous-agents automatiquement?
```

### Message 8

```text
$sf-explore  A propos du scope et de la sécurité est-ce que tu peux faire un audit un petit peu sur l'état actuel des choses, parce que c'est très important ce que tu dis? Il faut qu'on n'ait aucun risque de conflit d'édition dans notre workflow. C'est pas un truc qu'on veut laisser de porte d'entrée à ça.

C'est pour ça que normalement SF Spec doit recommander des lots précis d'exécution qui touchent des fichiers différents. Donc après, je ne sais pas si Codex peut lancer plusieurs agents en même temps. Si oui, je crois que oui. C'est là qu'il faut des lots d'exécution qui sont exclusifs, qui ont aucune nécessité, qui n'ont pas d'overlap. Est-ce que tu vois ce que je veux dire?

Et sinon il faut les faire dans l'ordre, les uns après les autres, et il faut aussi regarder s'il y a un graphe de dépendance. Est-ce qu'il y a des choses qui doivent être faites après d'autres? Et ça, je ne sais pas si SF Spec respecte bien ce concept de dépendance et de zéro risque de conflit et également qu'on cherche quand même à optimiser la rapidité. Donc on veut lancer des agents en même temps mais uniquement si c'est 100 % safe. Est-ce que tu peux auditer un petit peu cette question?
```

### Message 9

```text
Mais si on a un gros, gros, gros chantier
```

### Message 10

```text
Je suis entièrement d'accord avec toi. Est-ce que tu as des questions à me poser pour valider la vision?
```

### Message 11

```text
Je crois que ma politique, ça va être d'utiliser des sous-agents tout le temps parce que je préfère, quand je suis sur une tâche, rester dans la même conversation. Comme c'est toujours mieux d'avoir un contexte frais pour de l'exécution, je suis obligée d'ouvrir des tâches séparées. Je ne vois pas l'intérêt de rester dans une conversation, en fait, sachant que les tâches que je fais ne sont jamais très bien. Les tâches qui sont très bien, c'est pas moi qui les fais, c'est l'agent qui les planifie.

Donc pour moi je ne sais pas ce que tu en penses mais pour moi plus j'utilise des sous-agents souvent, mieux c'est, parce que ça ne pollue pas le contexte de ma conversation. Du coup ça ne pollue pas mon contexte intellectuel ni celui de l'agent. Qu'est-ce que tu en penses?
```

### Message 12

```text
Voilà, je suis tout à fait d'accord avec ça et pour moi même, pour les micros fixes, on devrait utiliser des sous-agents, parce que peut-être que ça ne pollue pas le contexte de la conversation.

Si c'est par exemple juste changer un paragraphe dans un fichier, tu vas me dire : "je pense que ça ne pollue pas trop le contexte". Par contre visuellement, ça pollue la conversation. C'est d'un point de vue visuel. Au lieu que les messages s'enchaînent avec l'agent, il y a des bouts de fichiers par-ci, des commandes par-là et c'est ça qui pollue visuellement la conversation, moi je trouve.

Qu'est-ce que tu en penses?
```

### Message 13

```text
Voilà de toute façon si la correction demandée est trop grosse au point qu'elle demande plusieurs agents, c'est probablement qu'elle demande carrément une spec. À ce moment-là la master skis devrait nous dire que ce qu'on demande, la maintenance, elle nécessite une spec.

Merci. Merci à vous.

Et par défaut c'est du séquentiel. De toute façon la question de séquentiel ou parallèle ne se pose pas vraiment, parce que la première question qui arrive, c'est : est-ce qu'une spec est nécessaire ou pas pour la tâche qui est demandée. Si jamais l'agent se pose la question « est-ce que je dois faire des agents en parallèle », c'est qu'il a mal fait son travail, parce qu'il devrait d'abord proposer une spec. Probablement que c'est le seul chemin.
```

### Message 14

```text
C'est parfait, tu as très bien verbalisé ce que je désire.
```

### Message 15

```text
Attends mais, du coup, c'est une nouvelle spec qu'on lance là? Parce que, où est-ce que c'est la continuité de notre spec de master skill?
```

### Message 16

```text
Voilà c'est bien ce que je me disais. Donc ça veut dire que de toi-même tu aurais été capable de créer une nouvelle spec, alors qu'en fait il faut regarder si on est en train de continuer une spec existante et de la mettre à jour ou si c'est un nouveau chantier.

Est-ce qu'il y a déjà un garde-fou quelque part pour éviter de recréer un nouveau chantier sur quelque chose qu'on devrait continuer en fait? Je sais pas si on doit continuer les choses ou si on doit toujours créer des nouvelles spec. Je sais pas ce que tu en penses, je suis pas développeuse moi.
```

### Message 17

```text
h d'accord, qu'est-ce qu'on devrait faire pour compléter ça à ton avis?
```

### Message 18

```text
ok:vazy
```

### Message 19

```text
èsf-spec sf-build Autonomous Master Skill wuth delegated sequential by default and spec-gated parallelism
```

### Message 20

```text
$sf-spec  sf-build Autonomous Master Skill wuth delegated sequential by default and spec-gated parallelism
```

### Message 21

```text
Ah ok j'ai une idée. Est-ce qu'on a le droit de réutiliser des agents, des sous-agents? Parce que si oui ce serait pas mal, comme ça on aurait un seul agent pour la lecture. Ça veut dire qu'il aurait tout le contexte de lecture et un seul agent pour l'exécution.
```

### Message 22

```text
Ok mais est-ce que c'est raisonnable, sachant qu'il y a une parallélisation, qu'il y a différents lots, différents waves? Comment on va s'organiser?
```

### Message 23

```text
Est-ce qu'on doit faire des skis pour les exécuteurs et les ruideurs?
```

### Message 24

```text
Oui, je suis d'accord. Par contre je pense qu'il faut effectivement faire un fichier pour chaque rôle.
```

### Message 25

```text
est ce que tu peux exporter notre conversation actuelle dans un fichier .md dans site/src/content ?
```

## Synthese operationnelle

### Vision confirmee

- SF Build doit privilegier la delegation pour garder la conversation principale lisible et conserver un contexte frais pour l'execution.
- La delegation ne doit pas devenir une porte d'entree vers des conflits d'edition.
- Le comportement par defaut doit etre sequentiel.
- Le parallelisme ne doit etre autorise que lorsqu'une spec explicite prouve que les lots d'execution sont independants, sans overlap de fichiers, sans dependance bloquante et avec un plan de verification.
- Si une demande est assez grosse pour poser la question du parallelisme, elle doit probablement passer par une spec avant execution.
- Avant de creer une nouvelle spec, SF Spec doit verifier s'il faut continuer un chantier existant.
- Les roles d'agents doivent etre explicites et documentes dans des fichiers separes.

### Regles de securite a integrer

- Aucun sous-agent ne doit etre lance automatiquement sans cadre clair.
- Aucun mode degrade "single agent" ne doit contourner les protections prevues.
- Aucun staging ambigu ne doit etre accepte.
- Une verification echouee doit bloquer la cloture.
- Un worktree entierement sale ne doit pas etre utilise comme surface d'ecriture indistincte.
- Les lots paralleles doivent etre exclusifs par fichiers et par responsabilite.
- Les dependances entre lots doivent etre explicites sous forme de graphe ou d'ordre de waves.
- En absence de preuve de parallelisme sur, l'execution reste sequentielle.

### Organisation cible

- Master : decide si la demande releve d'une correction simple, d'une continuation de spec existante ou d'une nouvelle spec.
- Reader : lit, cartographie, diagnostique et relit ; role read-only.
- Executor : applique les changements dans un scope d'ecriture donne.
- Integrator : valide l'ensemble, gere les frontieres entre waves et controle la verification finale.
- Documentation role : met a jour la documentation technique lorsque les changements stabilises l'exigent.

### Question structurante restante

Chaque role doit avoir son propre fichier de reference afin que les sous-agents aient un contrat clair, stable et reutilisable sans polluer la conversation principale.
