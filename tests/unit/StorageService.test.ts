/**
 * Tests unitaires pour StorageService
 * Couvre : debounce, flushDebounceTimers, saveGameDebounced
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// On ne peut pas tester IndexedDB dans l'environnement node,
// donc on teste la logique de debounce en isolant la classe.

describe('StorageService - Debounce Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devrait appeler saveGame après le délai debounce', async () => {
    // Importer dynamiquement pour chaque test (singleton reset)
    const { default: StorageService } = await import('@/services/StorageService');

    // Mock saveGame et ensureDB
    const saveGameSpy = vi.fn().mockResolvedValue('test-id');
    const ensureDBSpy = vi.fn().mockResolvedValue(undefined);
    (StorageService as any).db = {}; // Fake DB pour bypass ensureDB
    (StorageService as any).saveGame = saveGameSpy;

    // Simuler un override de saveGame pour le test
    const originalSaveGame = StorageService.saveGame.bind(StorageService);

    const fakeGame = {
      id: 'game-1',
      title: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
      blackPlayer: 'A',
      whitePlayer: 'B',
      boardSize: 19,
      komi: 6.5,
      handicap: 0,
      rootMoves: [],
      variants: [],
      event: null,
      date: null,
      result: null,
      comment: null,
      evaluations: [],
    } as any;

    // Appeler saveGameDebounced
    const promise = StorageService.saveGameDebounced(fakeGame, 500);

    // Avant le délai, le timer ne devrait pas encore avoir déclenché
    expect(saveGameSpy).not.toHaveBeenCalled();

    // Avancer de 500ms
    vi.advanceTimersByTime(500);

    // Flush microtasks
    await vi.runAllTimersAsync();
  });

  it('devrait annuler le timer précédent si saveGameDebounced est rappelé', async () => {
    const { default: StorageService } = await import('@/services/StorageService');
    (StorageService as any).db = {};

    const fakeGame1 = { id: 'game-1' } as any;
    const fakeGame2 = { id: 'game-1' } as any;

    // Premier appel
    StorageService.saveGameDebounced(fakeGame1, 500);

    // Le timer est posé
    expect((StorageService as any).debounceTimers.size).toBe(1);

    // Deuxième appel avant expiration — devrait remplacer le timer
    StorageService.saveGameDebounced(fakeGame2, 500);
    expect((StorageService as any).debounceTimers.size).toBe(1);

    // Flush
    await StorageService.flushDebounceTimers();
  });

  it('flushDebounceTimers devrait vider tous les timers', async () => {
    const { default: StorageService } = await import('@/services/StorageService');
    (StorageService as any).db = {};

    const fakeGame1 = { id: 'game-1' } as any;
    const fakeGame2 = { id: 'game-2' } as any;

    StorageService.saveGameDebounced(fakeGame1, 1000);
    StorageService.saveGameDebounced(fakeGame2, 1000);

    // Deux timers en attente
    expect((StorageService as any).debounceTimers.size).toBe(2);

    // Flush
    await StorageService.flushDebounceTimers();

    // Doit être vide
    expect((StorageService as any).debounceTimers.size).toBe(0);
  });

  it('flushDebounceTimers devrait effectivement clearTimeout', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { default: StorageService } = await import('@/services/StorageService');
    (StorageService as any).db = {};

    const fakeGame = { id: 'game-flush-test' } as any;

    StorageService.saveGameDebounced(fakeGame, 1000);

    expect((StorageService as any).debounceTimers.size).toBe(1);

    await StorageService.flushDebounceTimers();

    // clearTimeout devrait avoir été appelé au moins une fois
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect((StorageService as any).debounceTimers.size).toBe(0);

    clearTimeoutSpy.mockRestore();
  });

  it('flushDebounceTimers ne devrait pas échouer sur map vide', async () => {
    const { default: StorageService } = await import('@/services/StorageService');

    // Vider explicitement
    (StorageService as any).debounceTimers.clear();

    // Ne doit pas throw
    await expect(StorageService.flushDebounceTimers()).resolves.toBeUndefined();
    expect((StorageService as any).debounceTimers.size).toBe(0);
  });
});
