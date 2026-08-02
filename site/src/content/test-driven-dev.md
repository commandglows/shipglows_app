s raison. Les skills doivent être technologies-agnostiques par défaut.

 La bonne approche n’est pas:
 ShipGlowz = règles Flutter                                                                                                                                                                                           mais:                                                                                                                                                                                                               ShipGlowz = règles de preuve génériques
  + profils par stack quand détectés                                                                                                                                                                                  Donc le cœur des skills doit dire:                                                                                                                                                                                  1. Ne pas demander un test manuel avant d’avoir tenté les preuves automatisables.
  2. Choisir la preuve la moins chère et la plus fiable selon la surface.                                   3. Créer une checklist manuelle fichier seulement pour ce qui reste humain ou environnement-spécifique.
  4. Ne jamais considérer une preuve manuelle comme substitut à un test automatisable.                                                                                                                                Ensuite seulement, on ajoute des profils:                                                               
  - Flutter app: unit/widget, Web smoke, integration/device, APK.
  - Astro site: build, typecheck/content schema, Playwright/browser smoke, link/a11y/SEO checks.            - Python backend/tooling: unit tests, contract tests, lint/typecheck, security/deps, CLI smoke.           - API frontend/backend: contract tests, mocked API, integration tests, prod/preview smoke.
  - Auth: sf-auth-debug.
  - UI web non-auth: sf-browser.                                                                          
  Donc oui: j’ai trop ramené la discussion vers Flutter parce que l’exemple APK venait de là. Mais la
  gouvernance ShipGlowz doit rester abstraite:

  Proof Ladder:                                                                                             1. Static checks                                                                                          2. Unit tests
  3. Component/widget/module tests
  4. Contract/integration tests                                                                             5. Browser/runtime smoke
  6. Device/provider/production proof
  7. Manual checklist only for what remains                                                                                                                                                                           Puis chaque projet mappe ça à sa stack.                                                                                                                                                                             Pour Astro, par exemple:

  npm build
  content schema validation
  unit/component tests si présents                                                                          Playwright smoke via sf-browser                                                                           SEO/a11y checks                                                                                           manual checklist seulement pour review éditoriale ou rendu subjectif                                    
  Pour Python:

  pytest
  type/lint si configuré
  contract tests API
  security/deps audit
  CLI smoke
  manual checklist seulement pour décision humaine ou provider externe

  Donc la spec TDD doit être ajustée pour dire Stack-Agnostic Proof Ladder, avec Flutter seulement comme
  exemple/profil, pas comme cœur de doctrine.
