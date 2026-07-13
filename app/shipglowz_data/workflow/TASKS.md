# Tasks - ShipGlowz App

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Flutter, Riverpod, Vercel, Firebase/Firestore projection specs, GitHub App target
**Phase**: Read-only ShipGlowz projection foundation

**Top priority**: Ship the dashboard read-only projection local contract, then decide the next product slice: wire the projection panel into the active dashboard route or start real Firebase/Firestore read integration.

🔴 [shipglowz_app] task: Run `/sf-ready` for `shipglowz-github-managed-clone-indexer.md` so the managed clone/indexer boundary can move from draft to implementation-ready | status: done
🔴 [shipglowz_app] task: Implement the GitHub managed clone/indexer slice after readiness: server-side access-check contract, local/fake runner, projection DTOs, stale/deleted/parse-failed tests | status: done
🔴 [shipglowz_app] task: Run `/sf-verify` for `shipglowz-github-managed-clone-indexer.md` before closing or shipping the implementation | status: done
🟠 [shipglowz_app] task: Ready the deferred foundational specs for auth/GitHub access, project onboarding, dashboard read-only projection, and Markdown artifact governance | status: done
🟠 [shipglowz_app] task: Implement the dashboard read-only projection contract after readiness, keeping Firestore projection non-canonical and dashboard reads user-scoped | status: done
🔴 [shipglowz_app] task: Implement and verify ShipGlowz Product Entitlements Compliance local-contract-first gate | status: done
🟡 [shipglowz_app] task: Verify and close `shipglowz-legacy-file-migration-tracker.md`, then decide whether to close the parent legacy fusion chantier | status: done
🟢 [shipglowz_app] task: Close the traffic-first operational record live migration and web-reader contract after verified zero-legacy migration proof | status: done
🟢 [shipglowz_app] task: Keep the `site/` facade aligned with app positioning when product copy changes | status: todo
🟢 [shipglowz_app] task: Garder `origin/main` comme base saine et conserver le WIP Supabase local en archive | status: done
🟢 [shipglowz_app] task: Nettoyer les mentions ContentFlow résiduelles dans les surfaces actives (README, CLAUDE, AGENT, content-map) | status: done
🟢 [shipglowz_app] task: Corriger les imports/tests obsoletes dans l'ordre des artefacts actifs après classification | status: done
🟢 [shipglowz_app] task: Stabiliser la frontiere ShipGlowz actif / ContentFlow legacy | status: done
🟢 [shipglowz_app] task: Classer les briques ContentFlow avant suppression (lib/data/services + lib/presentation) | status: done
🟢 [shipglowz_app] task: Centraliser les accès legacy dans un contrat de test (`test/legacy_contract.dart`) | status: done
🟢 [shipglowz_app] task: Ajouter un garde `scripts/validate-legacy-test-boundary.sh` pour bloquer les imports legacy directs en tests | status: done
🟢 [shipglowz_app] task: Ajouter un garde `scripts/validate-shipglowz-runtime-boundary.sh` pour bloquer les imports legacy directs dans `lib/shipglowz` | status: done
🟢 [shipglowz_app] task: Ajouter `scripts/validate-boundary-suite.sh` (orchestration locale/CI des checks de frontière) | status: done
🟢 [shipglowz_app] task: Intégrer `validate-boundary-suite.sh` dans le workflow CI | status: done
🟢 [shipglowz_app] task: Documenter Markdown/repo comme source de verite et DB future comme projection | status: done
🟢 [shipglowz_app] task: Creer le gate canonique de coherence fondation ShipGlowz avant implementation Firebase/GitHub/Firestore | status: done
🟢 [shipglowz_app] task: Implementer le modele Firestore documentaire et les contrats Dart purs (`lib/data/firestore_projection/*`) avec tests cibles | status: done
🟢 [shipglowz_app] task: Deplacer le contenu actif vers `app/` et réarmer la façade `site/` avec le contenu ShipGlowz App en gardant le design | status: done
🟠 [shipglowz_app] task: Implementer Firebase Auth, GitHub App access, Firestore rules, and Cloud Functions only after the ready specs and fresh official-doc checks pass | status: deferred
🟠 [shipglowz_app] task: Spec future write-back, agent runner, terminal, BYOK, and feedback separately; keep them out of the V1 read-only implementation | status: deferred

## Current Active Backlog


## Historical Completed Work


## Backlog


Primary references:

- `shipglowz_data/workflow/specs/shipglowz-legacy-contentflow-fusion.md`
- `shipglowz_data/workflow/specs/shipglowz-github-managed-clone-indexer.md`
- `shipglowz_data/workflow/specs/shipglowz-firestore-data-model.md`
- `shipglowz_data/workflow/specs/shipglowz-dashboard-readonly-projection.md`
- `shipglowz_data/workflow/specs/shipglowz-auth-github-access.md`
- `shipglowz_data/workflow/specs/shipglowz-project-onboarding-flow.md`
- `shipglowz_data/technical/legacy-contentflow-inventory.md`
- `shipglowz_data/technical/runtime-boundary.md`
- `shipglowz_data/technical/markdown-source-of-truth.md`
- `shipglowz_data/editorial/content-map.md`

This historical ContentFlow section below is retained as legacy reference while the migration/fusion is in progress. It is explicitly not the active ShipGlowz backlog.

---

# Legacy Tasks — ContentFlow (Flutter)

> **Priority:** 🔴 P0 blocker · 🟠 P1 high · 🟡 P2 normal · 🟢 P3 low · ⚪ deferred
> **Status:** 📋 todo · 🔄 in progress · ✅ done · ⛔ blocked · 💤 deferred

**Stack**: Flutter 3.41, Riverpod, GoRouter, Dio, flutter_card_swiper, Google Fonts | **Phase**: Phase 11 — Offline sync V2 shipped

**Backend**: Python FastAPI (23 agents CrewAI/PydanticAI) at ContentFlow_lab/

**Top priority**: Déployer les endpoints FastAPI feedback sur le serveur, puis reprendre Polar billing et finir la passe i18n secondaire

---

## Phase 1 — Scaffold & Core Screens ✅


## Phase 2 — Psychology Engine & Onboarding ✅


## Phase 3 — Backend Integration & Polish ✅


## Phase 3b — Fixes & Wiring ✅


## Phase 4 — Auth & Workspace Migration ✅


---

## Phase 5 — Unified Content Pipeline (2026-03-26) ✅

> Unifier les 3 pipelines déconnectés (Psychology, SEO, Newsletter) en un flux unique:
> Sources → Idea Pool → Angles enrichis → Pipelines par format → Review Queue

### Backend (contentflow/)


### Flutter (contentflow-app/)


## Phase 6 — DataForSEO Integration (2026-03-27) ✅

> Intégrer DataForSEO API v3 comme source de données SEO réelles dans tout le pipeline.
> Remplace SerpApi (SERP-only) + Advertools (combos mock) par une API unifiée.

### Backend (contentflow/)


## Phase 7 — Legacy Domain Migration (2026-03-28) ✅

> Re-implement all 13 domains deleted with legacy Node.js chatbot.
> Scrollable nav replaces fixed 4-tab NavigationBar. Pattern: SQL migration + Pydantic + store + router + Flutter screen.

### Backend Lab — New domains


### Flutter — New screens (13 écrans)


---

## P1 — Prochaines priorités

| Pri | Task | Impact | Effort | Notes |
|-----|------|--------|--------|-------|
| ✅ | Regrouper les 17 tabs en sections (Content, Create, Analyze, System) | High | Low | ✅ done — dividers visuels entre sections |
| ✅ | Validation runtime Clerk (site sign-in réel, handoff web, restore session, `/api/bootstrap`) | High | Medium | ✅ done — auth web directe via ClerkJS sur le domaine app, bootstrap validé |
| ✅ | OAuth flow pour connecter les channels (via LATE/Zernio) | High | Medium | ✅ done — Connect + Disconnect complets |
| ✅ | Landing page produit (ContentFlow_site rebrand complet) | High | Medium | ✅ done — Hero, Features, How It Works, Pricing Free/19/49, Use Cases, FAQ |
| ✅ | Feedback Admin v1 côté Flutter — soumission texte/audio, historique local léger, accès anonyme et écran admin in-app | High | Medium | ✅ done — client FastAPI prêt, build-time allowlist + shipglowz_data ajoutés |
| ✅ | Localisation app EN/FR — préférence de langue (système/anglais/français) + couverture FR sur les écrans shell, debug et drip | High | Medium | ✅ done — AppLanguage, persistance SharedPreferences et passe UI sur settings/editor/drip/uptime/work domains/runs/research |
| ✅ | Système de thème complet — light/dark/system persisté + réglage utilisateur + thème éditorial partagé | High | Medium | ✅ done — préférence normalisée, `ThemeMode` branché sur l'app Flutter, palette/tokens centralisés |
| ✅ | Purger les couleurs hard-codées des écrans Flutter pour rendre le light mode réellement cohérent | High | High | ✅ done — écrans migrés vers `Theme.of(context)` / `AppTheme.paletteOf(context)` sur tout `lib/presentation/screens` |
| 🟠 | Déployer le backend FastAPI feedback (`/api/feedback/*`), le stockage audio S3-compatible et les URLs signées de lecture admin sur le serveur | High | Medium | 🔄 in progress — contrat backend rédigé, implémentation serveur hors repo |
| 🔴 | Project flows selection onboarding archive — source URL optionnelle, no-selection explicite persistante, archive/unarchive alignés app+API | High | High | ✅ done |
| 🟠 | Polar.sh Billing (free, 19€, 49€) | High | Medium | Débloqué maintenant que l'auth Clerk web est stable |
| ✅ | Tests end-to-end pipeline | High | Low | ✅ done — test_e2e_pipeline.py + test_new_domains.py dans lab |
| 🟡 | DataForSEO — credentials OK dans Doppler, ajouter credits au compte DFS | High | Low | Auth OK (20000), mais 402 Payment Required — ajouter credits sur dataforseo.com/billing |
| 🟠 | Exposer l'audit structuré des actions (`actor_type/id/label`) dans l'UI debug/admin | High | Medium | Le backend persiste déjà transitions, edits et reviews avec acteurs structurés |

## Phase 11 — Offline Sync V2 (2026-04-20) ✅

> Garder l'app authentifiée utilisable quand FastAPI tombe, avec cache persistant, queue de replay locale, temp IDs réconciliés et surfaces UI explicites pour l'état de sync.


### 🟡 P2 — Polish & Engagement


### Audit: Design (2026-04-21 — Feed mobile page — Overall: C→B)


### 🟠 P1 — Content Drip (Publication Progressive)


### 🟢 P3 — Backlog


---

> **Priority last updated**: 2026-04-20
> **Criteria**: Impact/effort matrix — "what makes the product actually work"
> **Recommended next**: Déployer les endpoints FastAPI feedback sur le serveur, puis brancher Polar billing, finir la passe i18n secondaire et finaliser les crédits DataForSEO

### Audit: Code (2026-04-27)


### Audit: Deps (2026-04-27)
