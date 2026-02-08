/**
 * Playwright Global Teardown
 * Exécuté une fois après tous les tests E2E
 */

async function globalTeardown() {
  console.log('\n✅ Tests E2E terminés');
  console.log('📊 Résultats : test-results/');
  console.log('📈 Report HTML : test-results/index.html');
}

export default globalTeardown;
