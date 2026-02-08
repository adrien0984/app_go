/**
 * Playwright Global Setup
 * Exécuté une fois avant tous les tests E2E
 */

import { chromium } from '@playwright/test';

async function globalSetup() {
  // Optionnel : Pré-charger l'app pour cache warming
  console.log('🚀 Démarrage tests E2E...');
  
  // Vérifier que le serveur dev est accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    console.log('✅ App accessible');
  } catch (error) {
    console.error('❌ App non accessible sur http://localhost:5173');
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
