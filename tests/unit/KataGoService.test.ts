/**
 * Tests unitaires pour KataGoService
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KataGoService } from '@/services/KataGoService';
import { GameService } from '@/services/GameService';
import type { Game } from '@/types/game';

describe('KataGoService', () => {
  let service: KataGoService;
  let testGame: Game;

  beforeEach(() => {
    service = KataGoService.getInstance();
    
    // Créer partie de test
    testGame = GameService.createGame(
      'Test Game',
      'Black Player',
      'White Player'
    );
    
    // Ajouter quelques coups
    testGame = GameService.addMove(testGame, { x: 3, y: 3 }); // D4
    testGame = GameService.addMove(testGame, { x: 15, y: 15 }); // Q16
    testGame = GameService.addMove(testGame, { x: 15, y: 3 }); // Q4
  });

  describe('Singleton Pattern', () => {
    it('devrait retourner la même instance', () => {
      const instance1 = KataGoService.getInstance();
      const instance2 = KataGoService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize()', () => {
    it('devrait initialiser le service', async () => {
      await expect(service.initialize()).resolves.toBeUndefined();
    });

    it('ne devrait pas réinitialiser si déjà initialisé', async () => {
      await service.initialize();
      const consoleSpy = vi.spyOn(console, 'log');
      await service.initialize();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Déjà initialisé')
      );
    });
  });

  describe('analyzePosition()', () => {
    it('devrait analyser une position et retourner résultat', async () => {
      const result = await service.analyzePosition(testGame);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.rootInfo).toBeDefined();
      expect(result.rootInfo.currentPlayer).toMatch(/[BW]/);
      expect(result.rootInfo.winrate).toBeGreaterThanOrEqual(0);
      expect(result.rootInfo.winrate).toBeLessThanOrEqual(1);
      expect(result.moveInfos).toBeInstanceOf(Array);
      expect(result.moveInfos.length).toBeGreaterThan(0);
    });

    it('devrait utiliser le cache par défaut', async () => {
      const result1 = await service.analyzePosition(testGame);
      const result2 = await service.analyzePosition(testGame, undefined, {
        useCache: true,
      });

      expect(result2.id).toBe(result1.id);
      expect(result2.timestamp).toEqual(result1.timestamp);
    });

    it('devrait forcer refresh si demandé', async () => {
      const result1 = await service.analyzePosition(testGame);
      const result2 = await service.analyzePosition(testGame, undefined, {
        forceRefresh: true,
      });

      expect(result2.id).not.toBe(result1.id);
    });

    it('devrait analyser moveIndex spécifique', async () => {
      const result = await service.analyzePosition(testGame, 0);
      expect(result).toBeDefined();
      expect(result.rootInfo.currentPlayer).toBe('W'); // Après coup noir
    });

    it('devrait respecter config personnalisée', async () => {
      const result = await service.analyzePosition(testGame, undefined, {
        config: { topMoves: 3, visits: 10 },
        forceRefresh: true, // Éviter cache des tests précédents
      });

      expect(result.moveInfos.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getTopMoves()', () => {
    it('devrait retourner top N moves', async () => {
      const topMoves = await service.getTopMoves(testGame, undefined, 3);

      expect(topMoves).toBeInstanceOf(Array);
      expect(topMoves.length).toBeLessThanOrEqual(3);
      topMoves.forEach((move) => {
        expect(move.move).toBeDefined();
        expect(move.moveSGF).toBeDefined();
        expect(move.winrate).toBeGreaterThanOrEqual(0);
        expect(move.winrate).toBeLessThanOrEqual(1);
      });
    });

    it('devrait trier par winrate décroissant', async () => {
      const topMoves = await service.getTopMoves(testGame, undefined, 5);

      for (let i = 0; i < topMoves.length - 1; i++) {
        expect(topMoves[i].winrate).toBeGreaterThanOrEqual(topMoves[i + 1].winrate);
      }
    });
  });

  describe('clearCache()', () => {
    it('devrait vider le cache', async () => {
      await service.analyzePosition(testGame);
      service.clearCache();

      const consoleSpy = vi.spyOn(console, 'log');
      await service.analyzePosition(testGame, undefined, { useCache: true });

      // Nouvelle analyse (pas de cache hit)
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('depuis cache')
      );
    });
  });

  describe('terminate()', () => {
    it('devrait terminer le service proprement', () => {
      service.terminate();
      // Pas d'erreur levée
      expect(true).toBe(true);
    });
  });

  describe('Validation des résultats', () => {
    it('devrait générer des moveInfos avec coordonnées valides', async () => {
      const result = await service.analyzePosition(testGame);

      result.moveInfos.forEach((move) => {
        expect(move.move.x).toBeGreaterThanOrEqual(0);
        expect(move.move.x).toBeLessThan(19);
        expect(move.move.y).toBeGreaterThanOrEqual(0);
        expect(move.move.y).toBeLessThan(19);
      });
    });

    it('devrait générer notation SGF correcte', async () => {
      const result = await service.analyzePosition(testGame);

      result.moveInfos.forEach((move) => {
        expect(move.moveSGF).toMatch(/^[A-S]\d{1,2}$/);
      });
    });

    it('devrait avoir confiance réaliste', async () => {
      const result = await service.analyzePosition(testGame);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('devrait avoir analysisTime positif', async () => {
      const result = await service.analyzePosition(testGame);

      expect(result.analysisTime).toBeGreaterThan(0);
    });

    it('devrait générer policy 19x19', async () => {
      const result = await service.analyzePosition(testGame);

      expect(result.policy).toBeDefined();
      expect(result.policy).toBeInstanceOf(Array);
      expect(result.policy.length).toBe(19);
      result.policy.forEach((row) => {
        expect(row.length).toBe(19);
      });
    });

    it('devrait avoir policy normalisée (somme ~1.0)', async () => {
      const result = await service.analyzePosition(testGame);

      let totalProb = 0;
      for (let y = 0; y < 19; y++) {
        for (let x = 0; x < 19; x++) {
          totalProb += result.policy[y][x];
        }
      }

      // Tolérance pour erreurs d'arrondi
      expect(totalProb).toBeGreaterThan(0.99);
      expect(totalProb).toBeLessThan(1.01);
    });

    it('devrait avoir probabilités policy entre 0 et 1', async () => {
      const result = await service.analyzePosition(testGame);

      result.policy.forEach((row) => {
        row.forEach((prob) => {
          expect(prob).toBeGreaterThanOrEqual(0);
          expect(prob).toBeLessThanOrEqual(1);
        });
      });
    });

    it('devrait avoir policy plus élevée aux top moves', async () => {
      const result = await service.analyzePosition(testGame);

      // Vérifier que les top moves ont plus forte probabilité
      const topMove = result.moveInfos[0];
      const topMoveProb = result.policy[topMove.move.y][topMove.move.x];

      // Chercher probabilité moyenne hors top moves
      let avgOtherProb = 0;
      let countOther = 0;
      for (let y = 0; y < 19; y++) {
        for (let x = 0; x < 19; x++) {
          const isTopMove = result.moveInfos.some(
            (m) => m.move.x === x && m.move.y === y
          );
          if (!isTopMove) {
            avgOtherProb += result.policy[y][x];
            countOther++;
          }
        }
      }
      avgOtherProb /= countOther;

      expect(topMoveProb).toBeGreaterThan(avgOtherProb * 10); // Au moins 10x plus
    });

    it('policy devrait être 0 sur intersections occupées', async () => {
      const result = await service.analyzePosition(testGame);

      // Vérifier coups joués ont policy = 0
      testGame.rootMoves.forEach((move) => {
        expect(result.policy[move.y][move.x]).toBe(0);
      });
    });
  });
});
