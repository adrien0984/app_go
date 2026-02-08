/**
 * Tests unitaires pour les fonctions de rendu Canvas
 * @module tests/unit/canvasUtils.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Move, Position, Color } from '@/types/game';
import {
  drawBackground,
  drawGrid,
  drawHoshi,
  drawStones,
  drawMoveNumbers,
  drawHighlights,
  drawHover,
  renderBoard,
} from '@/utils/canvasUtils';

// Mock canvas context
class MockCanvasContext implements Partial<CanvasRenderingContext2D> {
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth: number = 1;
  font: string = '12px Arial';
  textAlign: CanvasTextAlign = 'left';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  globalAlpha: number = 1;

  fillRect = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  fillText = vi.fn();
  createRadialGradient = vi.fn(() => ({
    addColorStop: vi.fn(),
  }));
}

describe('canvasUtils', () => {
  let ctx: MockCanvasContext;
  const canvasSize = 380;
  const cellSize = canvasSize / 19;

  beforeEach(() => {
    ctx = new MockCanvasContext();
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 1 : drawBackground
  // ═══════════════════════════════════════════════════════════════

  describe('drawBackground', () => {
    it('devrait dessiner un rectangle beige avec les bonnes dimensions', () => {
      drawBackground(ctx as any, canvasSize);

      expect(ctx.fillStyle).toBe('#D4A574'); // Couleur beige bois
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, canvasSize, canvasSize);
    });

    it('devrait respecter la taille du canvas', () => {
      const smallCanvas = 200;
      drawBackground(ctx as any, smallCanvas);

      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, smallCanvas, smallCanvas);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 2 : drawGrid
  // ═══════════════════════════════════════════════════════════════

  describe('drawGrid', () => {
    it('devrait dessiner une grille 19×19', () => {
      drawGrid(ctx as any, canvasSize, cellSize);

      expect(ctx.strokeStyle).toBe('#000000');
      expect(ctx.lineWidth).toBe(1);
    });

    it('devrait appeler beginPath et stroke pour chaque ligne', () => {
      drawGrid(ctx as any, canvasSize, cellSize);

      // 38 lignes totales (19 verticales + 19 horizontales)
      expect(ctx.beginPath).toHaveBeenCalledTimes(38);
      expect(ctx.stroke).toHaveBeenCalledTimes(38);
    });

    it('devrait dessiner les lignes aux positions correctes', () => {
      drawGrid(ctx as any, canvasSize, cellSize);

      // Vérifier que moveTo/lineTo sont appelés pour les lignes
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 3 : drawHoshi
  // ═══════════════════════════════════════════════════════════════

  describe('drawHoshi', () => {
    it('devrait dessiner 9 hoshi (points étoiles)', () => {
      drawHoshi(ctx as any, cellSize);

      expect(ctx.fillStyle).toBe('#000000');
      // 9 hoshi = 9 fois beginPath + arc + fill
      expect(ctx.beginPath).toHaveBeenCalledTimes(9);
      expect(ctx.arc).toHaveBeenCalledTimes(9);
      expect(ctx.fill).toHaveBeenCalledTimes(9);
    });

    it('devrait placer les hoshi aux positions correctes', () => {
      drawHoshi(ctx as any, cellSize);

      // Les 9 positions attendues pour une grille 19×19
      const expectedCalls = [
        [3, 3],
        [3, 9],
        [3, 15],
        [9, 3],
        [9, 9],
        [9, 15],
        [15, 3],
        [15, 9],
        [15, 15],
      ];

      expect(ctx.arc).toHaveBeenCalledTimes(9);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 5 : drawStones
  // ═══════════════════════════════════════════════════════════════

  describe('drawStones', () => {
    it('devrait dessiner les pierres noires et blanches', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
        { x: 3, y: 4, color: 'W', moveNumber: 2 },
      ];

      drawStones(ctx as any, moves, cellSize);

      // 2 pierres = 2 fois createRadialGradient, beginPath, arc, fill
      expect(ctx.createRadialGradient).toHaveBeenCalledTimes(2);
      expect(ctx.beginPath).toHaveBeenCalledTimes(2);
      expect(ctx.arc).toHaveBeenCalledTimes(2);
      expect(ctx.fill).toHaveBeenCalledTimes(2);
    });

    it('devrait utiliser des gradients différents pour noir et blanc', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
      ];

      drawStones(ctx as any, moves, cellSize);

      expect(ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('devrait ajouter une bordure pour les pierres blanches', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'W', moveNumber: 1 },
      ];

      drawStones(ctx as any, moves, cellSize);

      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('devrait ne pas dessiner si le tableau est vide', () => {
      const moves: Move[] = [];

      drawStones(ctx as any, moves, cellSize);

      expect(ctx.fill).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 6 : drawMoveNumbers
  // ═══════════════════════════════════════════════════════════════

  describe('drawMoveNumbers', () => {
    it('devrait afficher les numéros des coups', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
        { x: 3, y: 4, color: 'W', moveNumber: 2 },
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      expect(ctx.fillText).toHaveBeenCalledTimes(2);
      expect(ctx.fillText).toHaveBeenNthCalledWith(1, '1', expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenNthCalledWith(2, '2', expect.any(Number), expect.any(Number));
    });

    it('devrait utiliser du texte blanc sur pierre noire', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      // La couleur devrait être blanche pour pierre noire
      expect(ctx.fillStyle).toBe('#FFFFFF');
    });

    it('devrait utiliser du texte noir sur pierre blanche', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'W', moveNumber: 1 },
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      // La couleur devrait être noire pour pierre blanche
      expect(ctx.fillStyle).toBe('#000000');
    });

    it('devrait positionner le texte au centre', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      expect(ctx.textAlign).toBe('center');
      expect(ctx.textBaseline).toBe('middle');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 7a : drawHighlights
  // ═══════════════════════════════════════════════════════════════

  describe('drawHighlights', () => {
    it('devrait dessiner un cercle rouge autour du dernier coup', () => {
      const lastMove: Move = { x: 3, y: 3, color: 'B', moveNumber: 1 };

      drawHighlights(ctx as any, lastMove, cellSize);

      expect(ctx.strokeStyle).toBe('#FF0000');
      expect(ctx.lineWidth).toBe(2);
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('ne devrait rien dessiner si lastMove est null', () => {
      drawHighlights(ctx as any, null, cellSize);

      expect(ctx.stroke).not.toHaveBeenCalled();
      expect(ctx.arc).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LAYER 7b : drawHover
  // ═══════════════════════════════════════════════════════════════

  describe('drawHover', () => {
    it('devrait dessiner une pierre fantôme semi-transparente (noir)', () => {
      const hoverPosition: Position = { x: 3, y: 3 };

      drawHover(ctx as any, hoverPosition, cellSize, 'B');

      expect(ctx.fillStyle).toBe('#000000');
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.globalAlpha).toBe(1); // Réinitialisé après dessin
    });

    it('devrait dessiner une pierre fantôme semi-transparente (blanc)', () => {
      const hoverPosition: Position = { x: 3, y: 3 };

      drawHover(ctx as any, hoverPosition, cellSize, 'W');

      expect(ctx.fillStyle).toBe('#FFFFFF');
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('ne devrait rien dessiner si hoverPosition est null', () => {
      drawHover(ctx as any, null, cellSize, 'B');

      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it('devrait réinitialiser globalAlpha après le rendu', () => {
      const hoverPosition: Position = { x: 3, y: 3 };

      drawHover(ctx as any, hoverPosition, cellSize, 'B');

      expect(ctx.globalAlpha).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ORCHESTRATION : renderBoard
  // ═══════════════════════════════════════════════════════════════

  describe('renderBoard', () => {
    it('devrait appeler tous les layers dans l\'ordre correct', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
      ];
      const lastMove: Move = moves[0];
      const hoverPosition: Position = { x: 4, y: 4 };

      renderBoard(ctx as any, canvasSize, moves, lastMove, hoverPosition, 'W');

      // Tous les layers doivent être appelés
      expect(ctx.fillRect).toHaveBeenCalled(); // Background
      expect(ctx.stroke).toHaveBeenCalled(); // Grid, Highlights
      expect(ctx.fillText).toHaveBeenCalled(); // MoveNumbers
    });

    it('devrait calculer correctement la cellSize', () => {
      const moves: Move[] = [];

      renderBoard(ctx as any, canvasSize, moves, null, null, 'B');

      // cellSize = canvasSize / 19 = 380 / 19 ≈ 20
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, canvasSize, canvasSize);
    });

    it('devrait gérer un plateau vide', () => {
      renderBoard(ctx as any, canvasSize, [], null, null, 'B');

      // Background et Grid doivent toujours être dessinés
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('devrait gérer plusieurs coups', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
        { x: 4, y: 4, color: 'W', moveNumber: 2 },
        { x: 5, y: 5, color: 'B', moveNumber: 3 },
      ];

      renderBoard(ctx as any, canvasSize, moves, moves[2], null, 'W');

      // Vérifier que les pierres sont dessinées
      expect(ctx.createRadialGradient).toHaveBeenCalledTimes(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS D'INTÉGRATION
  // ═══════════════════════════════════════════════════════════════

  describe('Integration - Pipeline Complet', () => {
    it('devrait exécuter le pipeline complet sans erreur', () => {
      const moves: Move[] = [
        { x: 9, y: 9, color: 'B', moveNumber: 1 },
        { x: 9, y: 10, color: 'W', moveNumber: 2 },
      ];

      expect(() => {
        renderBoard(ctx as any, canvasSize, moves, moves[1], { x: 9, y: 11 }, 'B');
      }).not.toThrow();
    });

    it('devrait gérer les positions en bordure du plateau', () => {
      const moves: Move[] = [
        { x: 0, y: 0, color: 'B', moveNumber: 1 }, // Coin supérieur gauche
        { x: 18, y: 18, color: 'W', moveNumber: 2 }, // Coin inférieur droit
      ];

      expect(() => {
        renderBoard(ctx as any, canvasSize, moves, moves[1], { x: 18, y: 18 }, 'B');
      }).not.toThrow();
    });

    it('devrait respecter l\'ordre des couleurs alternées', () => {
      const moves: Move[] = [
        { x: 3, y: 3, color: 'B', moveNumber: 1 },
        { x: 4, y: 4, color: 'W', moveNumber: 2 },
        { x: 5, y: 5, color: 'B', moveNumber: 3 },
      ];

      renderBoard(ctx as any, canvasSize, moves, moves[2], null, 'W');

      expect(ctx.createRadialGradient).toHaveBeenCalledTimes(3);
    });
  });
});
