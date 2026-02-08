# Tests E2E Playwright - GoAI Editor

## 📋 Vue d'Ensemble

Tests E2E complets pour la fonctionnalité **Board Interactif 19×19 (US-2)**.

**32 scénarios de test** couvrant :
- ✅ Affichage initial (CA-01)
- ✅ Placement coups (CA-02, CA-03)
- ✅ Numérotation (CA-04)
- ✅ Hover preview (CA-05)
- ✅ Validation coups (CA-06)
- ✅ Navigation & Undo (CA-07, CA-08)
- ✅ Responsive mobile/desktop (CA-10)
- ✅ Performance (CA-13)
- ✅ Accessibilité
- ✅ Offline
- ✅ Performance détaillée

---

## 🚀 Installation & Setup

### Prérequis

```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation Dépendances

```bash
npm install
```

### Installation Navigateurs Playwright

```bash
npx playwright install
```

---

## ▶️ Exécution Tests

### Tous les Tests (tous navigateurs)

```bash
npm run test:e2e
```

### Tests Navigateur Spécifique

```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit
```

### Tests Mobile

```bash
# iPhone 12
npx playwright test --project="Mobile Safari"

# Pixel 5 (Android Chrome)
npx playwright test --project="Mobile Chrome"
```

### Mode Debug

```bash
npx playwright test --debug
```

### Mode UI (Interactive)

```bash
npx playwright test --ui
```

### Exécution Simple Test File

```bash
npx playwright test tests/e2e/board.spec.ts
```

---

## 📊 Résultats & Reports

### HTML Report

```bash
npx playwright show-report test-results
```

Génère un rapport HTML interactif avec :
- ✅ Résumé tests
- 📸 Screenshots
- 🎥 Videos (sur failure)
- 🔍 Traces

**Localisation** : `test-results/index.html`

### JSON Results

```bash
cat test-results/results.json
```

---

## 📝 Structure Tests

### Suites de Tests

```
tests/e2e/board.spec.ts
├── [CA-01] Affichage Initial
│   ├── Should display 19x19 board
│   ├── Should have ARIA labels
│   └── Should display responsive sizing
│
├── [CA-02 & CA-03] Placement Coup
│   ├── Should place black stone
│   ├── Should alternate colors
│   └── Should reject occupied intersection
│
├── [CA-04] Numérotation Coups
│   ├── Should display move numbers
│   └── Should have good contrast
│
├── [CA-05] Hover Preview
│   ├── Should show hover preview
│   ├── Should clear on mouse leave
│   └── Should show correct color
│
├── [CA-06] Validation Coups
│   ├── Should prevent occupied move
│   └── Should allow empty intersection
│
├── [CA-07 & CA-08] Navigation
│   ├── Should undo with Ctrl+Z
│   ├── Should navigate prev/next
│   └── Should disable buttons at limits
│
├── [CA-10] Responsive
│   ├── Should resize on mobile
│   ├── Should resize on desktop
│   └── Should support touch
│
├── [CA-13] Performance
│   ├── Should maintain 60 FPS
│   ├── Should respond < 500ms
│   └── Should be stable with 50+ moves
│
├── [Accessibilité]
│   ├── Should have ARIA labels
│   ├── Should have button labels
│   ├── Should have region role
│   └── Should have color contrast
│
├── [Offline]
│   ├── Should work offline
│   └── Should have no console errors
│
└── [Performance Détaillée]
    ├── Should measure paint times
    └── Should have stable rendering
```

---

## 🧪 Écriture de Nouveaux Tests

### Template Test

```typescript
test('Should [description]', async ({ page }) => {
  // Arrange
  await page.goto('http://localhost:5173');
  await page.waitForSelector('canvas.board-canvas');
  
  const canvas = page.locator('canvas.board-canvas');
  const boundingBox = await canvas.boundingBox();
  
  if (!boundingBox) throw new Error('Canvas not found');
  
  // Act
  const canvasSize = boundingBox.width;
  const cellSize = canvasSize / 19;
  const offset = cellSize;
  
  const clickX = boundingBox.x + offset + 3 * cellSize;
  const clickY = boundingBox.y + offset + 3 * cellSize;
  
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(200);
  
  // Assert
  const statusText = page.locator('.status-text');
  await expect(statusText).toContainText('Coup 1');
});
```

### Bonnes Pratiques

1. **Toujours attendre le Canvas**
   ```typescript
   await page.waitForSelector('canvas.board-canvas', { timeout: 5000 });
   ```

2. **Attendre le re-render après action**
   ```typescript
   await page.waitForTimeout(200); // ou await expect()
   ```

3. **Utiliser des locators**
   ```typescript
   const canvas = page.locator('canvas.board-canvas');
   await expect(canvas).toBeVisible();
   ```

4. **Screenshot sur failure**
   ```typescript
   const screenshot = await canvas.screenshot();
   ```

---

## 🔧 Configuration

### playwright.config.ts

Configuration principale avec :
- **Timeouts** : 30s global, 5s expect
- **Reporters** : HTML, JSON, list
- **Projects** : Chrome, Firefox, Safari, Mobile
- **Screenshots** : Failure only
- **Videos** : Failure only
- **Traces** : On first retry

### Modification Custom

```typescript
// Augmenter timeout pour tests lents
export default defineConfig({
  timeout: 60 * 1000,
  expect: { timeout: 10000 }
});
```

---

## 🐛 Debug & Troubleshooting

### Test échoue : "Canvas not found"

```typescript
// Augmenter timeout
await page.waitForSelector('canvas.board-canvas', { timeout: 10000 });
```

### Test échoue : "Timeout waiting for locator"

```typescript
// Ajouter debug
await page.pause(); // ou --debug mode
```

### Test lent sur mobile

```typescript
// Augmenter delays
await page.waitForTimeout(500); // au lieu de 200
```

### Performance API non accessible

```typescript
// Fallback
const metrics = await page.evaluate(() => {
  return performance.timing || {};
});
```

---

## 📈 Continuous Integration

### GitHub Actions Example

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
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

---

## 🎯 Checklist Avant Merge

- [ ] Tous tests passent : `npm run test:e2e`
- [ ] Pas d'erreurs ESLint : `npm run lint`
- [ ] TypeScript valid : `npm run type-check`
- [ ] Tests unitaires passent : `npm test`
- [ ] No console errors durant tests E2E
- [ ] Screenshots on failure générées
- [ ] Report HTML généré

---

## 📚 Ressources

- [Playwright Docs](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)

---

## ✅ Status Validation Phase 2A

**Date** : 3 février 2026  
**Tests E2E** : ✅ **32 scénarios créés**  
**Status** : ✅ **PRÊT POUR EXÉCUTION**

### Exécuter Tests

```bash
npm run test:e2e
```

### Voir Report

```bash
npx playwright show-report test-results
```

---

**Créé par** : @qa  
**Date** : 3 février 2026  
**Validateur** : @qa

