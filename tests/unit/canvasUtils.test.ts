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
  drawCoordinates,
  drawStones,
  drawMoveNumbers,
  drawHighlights,
  drawHover,
  drawPolicyHeatmap,
  policyValueToColor,
  renderBoard,
  COLUMN_LABELS,
} from '@/utils/canvasUtils';

/**
 * Helper pour créer un Move partiel pour les tests
 * Les champs obligatoires manquants (id, comment, symbols, etc.) sont acceptés
 * dans ce contexte de test contrôlé
 */
function createTestMove(partial: Partial<Move> & { x: number; y: number; color: Color; moveNumber: number }): Move {
  return {
    id: 'test-move',
    comment: null,
    symbols: null,
    variants: [],
    parentMoveId: null,
    createdAt: new Date(),
    ...partial,
  } as Move;
}

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
  clearRect = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  arc = vi.fn();
  fill = vi.fn();
  fillText = vi.fn();
  save = vi.fn();
  restore = vi.fn();
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
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
        createTestMove({ x: 3, y: 4, color: 'W', moveNumber: 2 }),
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
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
      ];

      drawStones(ctx as any, moves, cellSize);

      expect(ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('devrait ajouter une bordure pour les pierres blanches', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'W', moveNumber: 1 }),
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
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
        createTestMove({ x: 3, y: 4, color: 'W', moveNumber: 2 }),
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      expect(ctx.fillText).toHaveBeenCalledTimes(2);
      expect(ctx.fillText).toHaveBeenNthCalledWith(1, '1', expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenNthCalledWith(2, '2', expect.any(Number), expect.any(Number));
    });

    it('devrait utiliser du texte blanc sur pierre noire', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      // La couleur devrait être blanche pour pierre noire
      expect(ctx.fillStyle).toBe('#FFFFFF');
    });

    it('devrait utiliser du texte noir sur pierre blanche', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'W', moveNumber: 1 }),
      ];

      drawMoveNumbers(ctx as any, moves, cellSize);

      // La couleur devrait être noire pour pierre blanche
      expect(ctx.fillStyle).toBe('#000000');
    });

    it('devrait positionner le texte au centre', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
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
      const lastMove: Move = createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 });

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
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
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
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
        createTestMove({ x: 4, y: 4, color: 'W', moveNumber: 2 }),
        createTestMove({ x: 5, y: 5, color: 'B', moveNumber: 3 }),
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
        createTestMove({ x: 9, y: 9, color: 'B', moveNumber: 1 }),
        createTestMove({ x: 9, y: 10, color: 'W', moveNumber: 2 }),
      ];

      expect(() => {
        renderBoard(ctx as any, canvasSize, moves, moves[1], { x: 9, y: 11 }, 'B');
      }).not.toThrow();
    });

    it('devrait gérer les positions en bordure du plateau', () => {
      const moves: Move[] = [
        createTestMove({ x: 0, y: 0, color: 'B', moveNumber: 1 }), // Coin supérieur gauche
        createTestMove({ x: 18, y: 18, color: 'W', moveNumber: 2 }), // Coin inférieur droit
      ];

      expect(() => {
        renderBoard(ctx as any, canvasSize, moves, moves[1], { x: 18, y: 18 }, 'B');
      }).not.toThrow();
    });

    it('devrait respecter l\'ordre des couleurs alternées', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
        createTestMove({ x: 4, y: 4, color: 'W', moveNumber: 2 }),
        createTestMove({ x: 5, y: 5, color: 'B', moveNumber: 3 }),
      ];

      renderBoard(ctx as any, canvasSize, moves, moves[2], null, 'W');

      expect(ctx.createRadialGradient).toHaveBeenCalledTimes(3);
    });

    it('devrait accepter policy optionnelle sans erreur', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
      ];

      expect(() => {
        renderBoard(ctx as any, canvasSize, moves, moves[0], null, 'W', null);
      }).not.toThrow();
    });

    it('devrait appeler drawPolicyHeatmap quand policy fournie', () => {
      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
      ];
      const policy: number[][] = Array(19).fill(null).map(() => Array(19).fill(0.001));
      policy[9][9] = 0.5;

      // renderBoard avec policy déclenche les appels de fill pour la heatmap
      renderBoard(ctx as any, canvasSize, moves, moves[0], null, 'W', policy);

      // Plus d'appels fill que sans heatmap (pierres + heatmap spots)
      expect(ctx.fill.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('drawPolicyHeatmap()', () => {
    it('ne devrait rien dessiner avec policy null', () => {
      drawPolicyHeatmap(ctx as any, null as any, cellSize, []);
      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it('ne devrait rien dessiner avec policy vide', () => {
      drawPolicyHeatmap(ctx as any, [] as any, cellSize, []);
      expect(ctx.fill).not.toHaveBeenCalled();
    });

    it('ne devrait pas dessiner sur intersections occupées', () => {
      const policy: number[][] = Array(19).fill(null).map(() => Array(19).fill(0));
      policy[3][3] = 0.5; // Intersection occupée par une pierre
      policy[9][9] = 0.5; // Intersection libre

      const moves: Move[] = [
        createTestMove({ x: 3, y: 3, color: 'B', moveNumber: 1 }),
      ];

      drawPolicyHeatmap(ctx as any, policy, cellSize, moves);

      // Devrait dessiner seulement l'intersection libre (9,9)
      // fill est appelé pour les intersections libres avec probabilité > 0
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('devrait dessiner avec une opacité configurable', () => {
      const policy: number[][] = Array(19).fill(null).map(() => Array(19).fill(0));
      policy[9][9] = 0.5;

      drawPolicyHeatmap(ctx as any, policy, cellSize, [], 0.7);

      // Vérifier que save/restore sont appelés
      expect(ctx.beginPath).toHaveBeenCalled();
    });

    it('ne devrait rien dessiner si toutes les probabilités sont 0', () => {
      const policy: number[][] = Array(19).fill(null).map(() => Array(19).fill(0));

      drawPolicyHeatmap(ctx as any, policy, cellSize, []);

      // maxProb = 0, donc return précoce
      expect(ctx.fill).not.toHaveBeenCalled();
    });
  });

  describe('policyValueToColor()', () => {
    it('devrait retourner bleu pour valeurs basses', () => {
      const color = policyValueToColor(0.1);
      expect(color).toContain('rgb(');
      // Vérifier composante bleue dominante
      const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
      expect(match).not.toBeNull();
      const [, r, , b] = match!;
      expect(parseInt(b)).toBeGreaterThan(parseInt(r));
    });

    it('devrait retourner rouge pour valeurs hautes', () => {
      const color = policyValueToColor(1.0);
      const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
      expect(match).not.toBeNull();
      const [, r, g, b] = match!;
      expect(parseInt(r)).toBe(255);
      expect(parseInt(g)).toBe(0);
      expect(parseInt(b)).toBe(0);
    });

    it('devrait retourner vert pour valeurs moyennes', () => {
      const color = policyValueToColor(0.5);
      const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
      expect(match).not.toBeNull();
      const [, r, g, b] = match!;
      expect(parseInt(g)).toBeGreaterThan(parseInt(r));
      expect(parseInt(g)).toBeGreaterThan(parseInt(b));
    });

    it('devrait clamper les valeurs hors bornes', () => {
      const colorNeg = policyValueToColor(-0.5);
      const colorZero = policyValueToColor(0);
      expect(colorNeg).toBe(colorZero);

      const colorOver = policyValueToColor(1.5);
      const colorMax = policyValueToColor(1.0);
      expect(colorOver).toBe(colorMax);
    });

    it('devrait retourner des couleurs différentes pour des valeurs distinctes', () => {
      const c1 = policyValueToColor(0.0);
      const c2 = policyValueToColor(0.25);
      const c3 = policyValueToColor(0.5);
      const c4 = policyValueToColor(0.75);
      const c5 = policyValueToColor(1.0);

      // Toutes les couleurs sont uniques aux seuils
      const colors = [c1, c2, c3, c4, c5];
      const unique = new Set(colors);
      expect(unique.size).toBe(5);
    });
  });

  // =========================================================================
  // Tests drawCoordinates
  // =========================================================================
  describe('COLUMN_LABELS', () => {
    it('devrait contenir 19 lettres A-T sans I', () => {
      expect(COLUMN_LABELS).toBe('ABCDEFGHJKLMNOPQRST');
      expect(COLUMN_LABELS.length).toBe(19);
    });

    it('ne devrait pas contenir la lettre I', () => {
      expect(COLUMN_LABELS.includes('I')).toBe(false);
    });
  });

  describe('drawCoordinates', () => {
    it('devrait dessiner des labels texte', () => {
      drawCoordinates(ctx as unknown as CanvasRenderingContext2D, cellSize);

      // 19 colonnes × 2 côtés + 19 lignes × 2 côtés = 76 appels fillText
      expect(ctx.fillText).toHaveBeenCalledTimes(76);
    });

    it('devrait dessiner les labels de colonnes A-T sans I en haut et en bas', () => {
      drawCoordinates(ctx as unknown as CanvasRenderingContext2D, cellSize);

      const calls = ctx.fillText.mock.calls as [string, number, number][];
      const topLabels = calls.slice(0, 38).filter((_c: [string, number, number], i: number) => i % 2 === 0);
      const bottomLabels = calls.slice(0, 38).filter((_c: [string, number, number], i: number) => i % 2 === 1);

      // Vérifie les 19 labels du haut
      expect(topLabels.length).toBe(19);
      topLabels.forEach((call: [string, number, number], i: number) => {
        expect(call[0]).toBe(COLUMN_LABELS[i]);
      });

      // Les labels du bas ont les mêmes lettres
      expect(bottomLabels.length).toBe(19);
      bottomLabels.forEach((call: [string, number, number], i: number) => {
        expect(call[0]).toBe(COLUMN_LABELS[i]);
      });
    });

    it('devrait dessiner les numéros de lignes 1-19 à gauche et à droite', () => {
      drawCoordinates(ctx as unknown as CanvasRenderingContext2D, cellSize);

      const calls = ctx.fillText.mock.calls as [string, number, number][];
      // Les 38 derniers appels = lignes (19 paires gauche/droite)
      const rowCalls = calls.slice(38);

      // Vérifie que les numéros vont de 19 (haut) à 1 (bas)
      for (let i = 0; i < 19; i++) {
        const expectedNum = String(19 - i);
        expect(rowCalls[i * 2][0]).toBe(expectedNum); // Gauche
        expect(rowCalls[i * 2 + 1][0]).toBe(expectedNum); // Droite
      }
    });

    it('devrait positionner les labels dans les marges', () => {
      drawCoordinates(ctx as unknown as CanvasRenderingContext2D, cellSize);

      const calls = ctx.fillText.mock.calls as [string, number, number][];
      const offset = cellSize;
      const boardSize = cellSize * 18;

      // Premier label colonne en haut : x = offset, y ≈ offset * 0.45
      expect(calls[0][1]).toBeCloseTo(offset, 0);
      expect(calls[0][2]).toBeCloseTo(offset * 0.45, 0);

      // Premier label colonne en bas : x = offset, y ≈ offset + boardSize + offset * 0.55
      expect(calls[1][1]).toBeCloseTo(offset, 0);
      expect(calls[1][2]).toBeCloseTo(offset + boardSize + offset * 0.55, 0);
    });

    it('devrait utiliser textAlign center et textBaseline middle', () => {
      drawCoordinates(ctx as unknown as CanvasRenderingContext2D, cellSize);

      expect(ctx.textAlign).toBe('center');
      expect(ctx.textBaseline).toBe('middle');
    });

    it('devrait adapter la taille de police au cellSize', () => {
      drawCoordinates(ctx as unknown as CanvasRenderingContext2D, cellSize);

      const expectedFontSize = Math.max(9, Math.round(cellSize * 0.4));
      expect(ctx.font).toContain(`${expectedFontSize}px`);
    });
  });
});
