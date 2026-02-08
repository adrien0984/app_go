# 🧪 GUIDE D'EXÉCUTION TESTS E2E - Phase 2A

**Date** : 3 février 2026  
**Feature** : Board Interactif 19×19 (US-2)  
**Tests E2E** : 32 scénarios Playwright

---

## 🚀 Quick Start

### 1️⃣ Installer Dépendances

```bash
npm install
npx playwright install
```

### 2️⃣ Démarrer Dev Server

```bash
# Terminal 1 - Dev server
npm run dev

# L'app est accessible à : http://localhost:5173
```

### 3️⃣ Exécuter Tests E2E

```bash
# Terminal 2 - Tests E2E
npm run test:e2e

# Ou avec script
./run-e2e-tests.sh        # Linux/Mac
.\run-e2e-tests.ps1       # Windows
```

### 4️⃣ Voir le Rapport

```bash
npx playwright show-report test-results/
```

---

## 📋 Options Exécution

### Tous les Tests (Défaut)

```bash
npm run test:e2e
# ou
./run-e2e-tests.sh all
.\run-e2e-tests.ps1 -TestType all
```

Exécute sur : Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

### Test Navigateur Spécifique

```bash
# Chrome uniquement
./run-e2e-tests.sh chromium
.\run-e2e-tests.ps1 -TestType chromium

# Firefox
./run-e2e-tests.sh firefox
.\run-e2e-tests.ps1 -TestType firefox

# Safari (WebKit)
./run-e2e-tests.sh webkit
.\run-e2e-tests.ps1 -TestType webkit
```

### Tests Mobile

```bash
./run-e2e-tests.sh mobile
.\run-e2e-tests.ps1 -TestType mobile
```

Teste : iPhone 12, Pixel 5

### Mode Debug

```bash
./run-e2e-tests.sh debug
.\run-e2e-tests.ps1 -TestType debug
```

Lance Playwright Inspector avec debugging interactif.

### Mode UI

```bash
./run-e2e-tests.sh ui
.\run-e2e-tests.ps1 -TestType ui
```

Interface visuelle pour exécuter & débugger les tests.

### Mode Headed

```bash
./run-e2e-tests.sh headed
.\run-e2e-tests.ps1 -TestType headed
```

Voir les navigateurs en action (non headless).

---

## 🎯 Exécution Test File Spécifique

```bash
npx playwright test tests/e2e/board.spec.ts
```

---

## 📊 Résultats & Reports

### HTML Report (Interactif)

```bash
npx playwright show-report test-results/
```

Ouvre rapport HTML avec :
- ✅ Résumé des tests (passed/failed)
- 📸 Screenshots
- 🎥 Videos
- 🔍 Traces

### JSON Results

```bash
cat test-results/results.json
```

---

## 🐛 Déboguer Tests

### Avec DevTools

```bash
npx playwright test --debug tests/e2e/board.spec.ts
```

Lance Playwright Inspector (interactive debugging).

### Pause dans Test

```typescript
// Dans test.ts
await page.pause();  // Stop et ouvre Inspector
```

### Trace sur Failure

Automatiquement généré quand test échoue.

Ouvrir trace :
```bash
npx playwright show-trace test-results/trace.zip
```

---

## ⚡ Performance Considerations

### Timeouts

- Global timeout : 30 secondes
- Expect timeout : 5 secondes
- Configuration : `playwright.config.ts`

### Parallelization

Par défaut : tests en parallèle (workers multiples)

Désactiver :
```bash
npx playwright test --workers=1
```

### Re-runs

- Local : 0 retries
- CI : 2 retries

---

## 🔧 Dépannage

### ❌ "Canvas not found"

```typescript
// Augmenter timeout
await page.waitForSelector('canvas.board-canvas', { timeout: 10000 });
```

### ❌ "Test timeout"

```bash
# Augmenter timeout global
npx playwright test --timeout=60000
```

### ❌ App inaccessible

Vérifier :
```bash
# 1. Dev server tourne
npm run dev

# 2. Port 5173 accessible
curl http://localhost:5173

# 3. Playwright peut voir app
npx playwright test --debug
```

### ❌ Navigateurs non installés

```bash
npx playwright install --with-deps
```

---

## 📊 Test Summary

### 32 Scénarios E2E

```
✅ CA-01 : Affichage initial      (3 tests)
✅ CA-02/03 : Placement coup      (3 tests)
✅ CA-04 : Numérotation           (2 tests)
✅ CA-05 : Hover preview          (3 tests)
✅ CA-06 : Validation coups       (2 tests)
✅ CA-07/08 : Navigation & Undo   (3 tests)
✅ CA-10 : Responsive             (3 tests)
✅ CA-13 : Performance            (3 tests)
✅ Accessibilité                  (4 tests)
✅ Offline                        (2 tests)
✅ Performance Détaillée          (2 tests)

TOTAL : 32 tests ✅
```

---

## 🎯 CI/CD Integration

### GitHub Actions

Exemple configuration pour CI automatique :

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build  # build if needed
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

---

## 📚 Ressources

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-test)

---

## ✅ Checklist Avant Push

- [ ] Tous tests passent : `npm run test:e2e`
- [ ] Pas d'erreurs TypeScript : `npm run type-check`
- [ ] ESLint OK : `npm run lint`
- [ ] Tests unitaires OK : `npm test`
- [ ] No console errors
- [ ] Report généré

---

## 🎯 Success Criteria

### ✅ Tous Tests Passent

```bash
npm run test:e2e
# Résultat : ✅ All tests passed
```

### ✅ Report Généré

```
test-results/
├── index.html      (rapport interactif)
├── results.json    (résultats JSON)
├── screenshots/    (si failures)
├── videos/         (si failures)
└── traces/         (si failures)
```

### ✅ Aucune Erreur Console

Tous tests incluent vérification `no console errors`.

---

## 📞 Support

Questions sur les tests E2E ?

**Documentation** :
- [QA-REPORTS.md](QA-REPORTS.md#rapport-002) - Rapport complet
- [tests/e2e/README.md](tests/e2e/README.md) - Guide E2E
- [run-e2e-tests.sh](run-e2e-tests.sh) - Script Bash
- [run-e2e-tests.ps1](run-e2e-tests.ps1) - Script PowerShell

**Validateur QA** : @qa

---

## 🚀 Status

**Phase 2A Board 19×19** :
- ✅ Tests E2E créés : 32 scénarios
- ✅ Configuration Playwright : OK
- ✅ Scripts exécution : OK (Bash + PowerShell)
- ✅ Documentation : Complète
- ✅ Status : **READY FOR EXECUTION**

---

**Créé par** : @qa  
**Date** : 3 février 2026

