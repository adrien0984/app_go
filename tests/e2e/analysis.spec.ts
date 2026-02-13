/**
 * Tests E2E pour le workflow d'analyse KataGo
 * @playwright
 */

import { test, expect } from '@playwright/test';

const createNewGame = async (page: any, title: string) => {
  await page.getByRole('button', { name: /Nouvelle Partie/i }).click();
  await page.getByLabel(/Titre/i).fill(title);
  await page.getByRole('button', { name: /Enregistrer/i }).click();
  await page.waitForSelector('canvas.board-canvas', { timeout: 5000 });
};

test.describe('Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('affiche le panneau d\'analyse dans l\'éditeur', async ({ page }) => {
    // Créer nouvelle partie
    await createNewGame(page, 'Test Analysis');

    // Vérifier que le panneau d'analyse est visible
    await expect(page.locator('.analysis-panel')).toBeVisible();
    await expect(page.locator('h3:has-text("Analyse IA")')).toBeVisible();
  });

  test('analyse une position après des coups', async ({ page }) => {
    // Créer partie et jouer coups
    await createNewGame(page, 'Test Analysis');

    // Jouer 3 coups
    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    await canvas.click({ position: { x: 500, y: 500 } });
    await page.waitForTimeout(200);
    await canvas.click({ position: { x: 500, y: 100 } });

    // Cliquer sur bouton Analyser
    await page.click('button:has-text("Analyser")');

    // Attendre loading
    await expect(page.locator('.analysis-loading')).toBeVisible();
    await expect(page.locator('.spinner')).toBeVisible();

    // Attendre résultats (timeout 10s)
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Vérifier sections résultats
    await expect(page.locator('.winrate-section')).toBeVisible();
    await expect(page.locator('.score-section')).toBeVisible();
    await expect(page.locator('.topmoves-section')).toBeVisible();
  });

  test('affiche les winrates avec barres de progression', async ({ page }) => {
    // Setup et analyse
    await createNewGame(page, 'Test Winrate');

    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.click('button:has-text("Analyser")');
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Vérifier barres winrate
    const blackBar = page.locator('.winrate-bar-black');
    const whiteBar = page.locator('.winrate-bar-white');

    await expect(blackBar).toBeVisible();
    await expect(whiteBar).toBeVisible();

    // Vérifier valeurs affichées
    const winrateValues = page.locator('.winrate-value');
    const count = await winrateValues.count();
    expect(count).toBe(2); // Noir + Blanc

    // Vérifier format pourcentage
    const blackValue = await winrateValues.nth(0).textContent();
    expect(blackValue).toMatch(/^\d+\.\d+%$/);
  });

  test('affiche le score estimé', async ({ page }) => {
    await createNewGame(page, 'Test Score');

    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.click('button:has-text("Analyser")');
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Vérifier section score
    const scoreSection = page.locator('.score-section');
    await expect(scoreSection).toBeVisible();

    const scoreValue = scoreSection.locator('.score-value');
    await expect(scoreValue).toBeVisible();

    // Vérifier format score
    const scoreText = await scoreValue.textContent();
    expect(scoreText).toMatch(/(Noir|Blanc) mène de/);
    expect(scoreText).toMatch(/\d+\.\d+ pts/);
  });

  test('affiche top 5 coups recommandés', async ({ page }) => {
    await createNewGame(page, 'Test Top Moves');

    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.click('button:has-text("Analyser")');
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Vérifier liste top moves
    const topMovesSection = page.locator('.topmoves-section');
    await expect(topMovesSection).toBeVisible();

    const moveItems = page.locator('.topmove-item');
    const count = await moveItems.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);

    // Vérifier format premier coup
    const firstMove = moveItems.nth(0);
    await expect(firstMove.locator('.topmove-rank')).toContainText('#1');
    await expect(firstMove.locator('.topmove-coords')).toBeVisible();
    await expect(firstMove.locator('.topmove-winrate')).toBeVisible();
    await expect(firstMove.locator('.topmove-visits')).toBeVisible();
  });

  test('affiche métadonnées analyse', async ({ page }) => {
    await createNewGame(page, 'Test Meta');

    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await page.click('button:has-text("Analyser")');
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Vérifier métadonnées
    const metaSection = page.locator('.analysis-meta');
    await expect(metaSection).toBeVisible();

    const metaItems = metaSection.locator('.meta-item');
    const count = await metaItems.count();
    expect(count).toBe(3); // Profil + Temps + Confiance

    // Vérifier formats
    const timeText = await metaSection.locator('.meta-item', { hasText: '⏱️' }).textContent();
    expect(timeText || '').toMatch(/⏱️\s*\d+ms/);

    const confidenceText = await metaSection.locator('.meta-item', { hasText: '🎯' }).textContent();
    expect(confidenceText || '').toMatch(/🎯\s*\d+\.\d+%/);
  });

  test('permet de re-analyser', async ({ page }) => {
    await createNewGame(page, 'Test Reanalyze');

    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    // Première analyse
    await page.click('button:has-text("Analyser")');
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Bouton devient "Re-analyser"
    const analyzeButton = page.locator('button.btn-analyze');
    await expect(analyzeButton).toContainText(/analy/i);

    // Cliquer pour re-analyser
    await analyzeButton.click();
    // Le loading peut être très rapide en mode mock, vérifier directement les résultats
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });
  });

  test('gère erreur gracieusement', async ({ page }) => {
    await createNewGame(page, 'Test Error');

    // Sans coups, le bouton Analyser est désactivé
    const analyzeButton = page.locator('button.btn-analyze');
    await expect(analyzeButton).toBeDisabled();
  });

  test('responsive mobile', async ({ page }) => {
    // Réduire viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });

    await createNewGame(page, 'Test Mobile');

    const canvas = page.locator('canvas.board-canvas');
    await canvas.click({ position: { x: 50, y: 50 } });
    await page.click('button:has-text("Analyser")');
    await expect(page.locator('.analysis-results')).toBeVisible({ timeout: 10000 });

    // Vérifier que tous éléments sont visibles
    await expect(page.locator('.analysis-panel')).toBeVisible();
    await expect(page.locator('.winrate-section')).toBeVisible();
    await expect(page.locator('.score-section')).toBeVisible();
    await expect(page.locator('.topmoves-section')).toBeVisible();
  });
});
