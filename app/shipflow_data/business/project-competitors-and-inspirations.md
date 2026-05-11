---
artifact: competitive_intelligence
metadata_schema_version: "1.0"
artifact_version: "1.0.0"
project: "shipflow_app"
created: "2026-05-11"
updated: "2026-05-11"
status: reviewed
source_skill: sf-veille
scope: "project-competitors-and-inspirations"
owner: "Diane"
confidence: medium
risk_level: medium
security_impact: none
docs_impact: yes
evidence:
  - "Initial competitor and inspiration triage captured in legacy root concurrent.md."
  - "ShipFlow App is a local dashboard surface for ShipFlow project data and action state."
depends_on:
  - artifact: "shipflow_data/business/product.md"
    artifact_version: "1.0.0"
    required_status: reviewed
  - artifact: "shipflow_data/business/gtm.md"
    artifact_version: "1.0.0"
    required_status: reviewed
supersedes:
  - "concurrent.md"
next_review: "2026-06-11"
next_step: "/sf-market-study shipflow_app"
target_projects:
  - shipflow_app
reference_categories:
  - indirect_competitor
  - product_inspiration
  - workflow_inspiration
source_policy: "Track public sources only; do not copy private positioning, paid assets, credentials, or non-public customer data."
---

# Concurrents et inspirations — ShipFlow App

## Lecture projet

Ce dossier correspond probablement à l'application ShipFlow locale. Les meilleurs liens concernent dashboard, mémoire, fichiers, analytics et pilotage exécutif.

## Liens retenus

| Lien | Type | Score | Usage concret |
|---|---:|:---:|---|
| [Airbin](https://betalist.com/startups/airbin) | Inspiration workspace | 8/10 | Interface de fichiers privés + recherche contexte: très proche d'un dashboard lisible sur `shipflow_data`. |
| [Web-Analytics.ai](https://web-analytics.ai/) | Inspiration reporting | 7/10 | Bons patterns pour transformer métriques/projets en résumés actionnables. |
| [VenturOS](https://betalist.com/startups/venturos) | Inspiration pilotage | 7/10 | Modèle d'OS de décision: utile pour vues priorités, risques, prochaine action. |
| [MemoryPlugin](https://betalist.com/startups/memoryplugin) | Inspiration mémoire | 6/10 | À regarder pour UX de mémoire persistante sans perdre le contrôle utilisateur. |
| [Spec27](https://betalist.com/startups/spec27) | Inspiration validation | 6/10 | Utile pour afficher état specs/tests/agents dans l'app. |
