/**
 * Fonctions de rendu Canvas pour le plateau Go
 * Pipeline de 7 layers pour un rendu optimisé
 * @module utils/canvasUtils
 */

import type { Move, Position, Color } from '@/types/game';
import { goCoordToPixel, calculateStoneRadius } from './boardUtils';

// Constantes de style
const STYLE = {
  background: '#D4A574', // Beige bois
  gridColor: '#000000',
  gridWidth: 1,
  hoshiRadius: 4,
  stoneRadiusRatio: 0.4,
  lastMoveColor: '#FF0000',
  lastMoveWidth: 2,
  hoverOpacity: 0.3,
  hoverColor: '#FFD700', // Or pour hover
  numberFont: '12px Arial',
  numberOffset: 0,
};

// Positions des hoshi (points étoiles) sur grille 19×19
const HOSHI_POSITIONS: Array<[number, number]> = [
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

/**
 * Layer 1 : Dessine le fond beige du plateau (bois)
 *
 * @param ctx - Contexte Canvas 2D
 * @param canvasSize - Taille du canvas en pixels
 */
export const drawBackground = (
  ctx: CanvasRenderingContext2D,
  canvasSize: number
): void => {
  ctx.fillStyle = STYLE.background;
  ctx.fillRect(0, 0, canvasSize, canvasSize);
};

/**
 * Layer 2 : Dessine la grille 19×19 (lignes noires)
 *
 * @param ctx - Contexte Canvas 2D
 * @param canvasSize - Taille du canvas en pixels
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  cellSize: number
): void => {
  ctx.strokeStyle = STYLE.gridColor;
  ctx.lineWidth = STYLE.gridWidth;

  const boardSize = cellSize * 18; // 18 espaces entre 19 lignes
  const offset = cellSize; // Marge d'un cellSize

  // Lignes verticales (19 lignes)
  for (let i = 0; i < 19; i++) {
    const x = offset + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, offset);
    ctx.lineTo(x, offset + boardSize);
    ctx.stroke();
  }

  // Lignes horizontales (19 lignes)
  for (let i = 0; i < 19; i++) {
    const y = offset + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(offset, y);
    ctx.lineTo(offset + boardSize, y);
    ctx.stroke();
  }
};

/**
 * Layer 3 : Dessine les 9 hoshi (points étoiles)
 *
 * @param ctx - Contexte Canvas 2D
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawHoshi = (
  ctx: CanvasRenderingContext2D,
  cellSize: number
): void => {
  ctx.fillStyle = STYLE.gridColor;

  HOSHI_POSITIONS.forEach(([x, y]) => {
    const { px, py } = goCoordToPixel({ x, y }, cellSize);

    ctx.beginPath();
    ctx.arc(px, py, STYLE.hoshiRadius, 0, Math.PI * 2);
    ctx.fill();
  });
};

/**
 * Layer 4 (optionnel) : Dessine les coordonnées (A-S, 1-19)
 * Non implémenté pour MVP v1.0
 *
 * @param ctx - Contexte Canvas 2D
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawCoordinates = (
  ctx: CanvasRenderingContext2D,
  cellSize: number
): void => {
  // À implémenter en Phase 2B
  // Affichage des labels A-S (colonnes) et 1-19 (lignes)
};

/**
 * Layer 5 : Dessine les pierres (noires et blanches) avec dégradé 3D
 *
 * @param ctx - Contexte Canvas 2D
 * @param moves - Tableau des coups joués
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawStones = (
  ctx: CanvasRenderingContext2D,
  moves: Move[],
  cellSize: number
): void => {
  const stoneRadius = calculateStoneRadius(cellSize);

  moves.forEach((move) => {
    const { px, py } = goCoordToPixel({ x: move.x, y: move.y }, cellSize);

    // Créer dégradé radial pour effet 3D
    const gradient = ctx.createRadialGradient(
      px - stoneRadius * 0.3,
      py - stoneRadius * 0.3,
      0,
      px,
      py,
      stoneRadius
    );

    if (move.color === 'B') {
      // Pierre noire : gradient gris → noir
      gradient.addColorStop(0, '#444444');
      gradient.addColorStop(1, '#000000');
      ctx.fillStyle = gradient;
    } else {
      // Pierre blanche : gradient blanc → gris clair
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, '#CCCCCC');
      ctx.fillStyle = gradient;

      // Bordure pour pierre blanche
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 1;
    }

    // Dessiner pierre
    ctx.beginPath();
    ctx.arc(px, py, stoneRadius, 0, Math.PI * 2);
    ctx.fill();

    // Trait pour pierre blanche
    if (move.color === 'W') {
      ctx.stroke();
    }
  });
};

/**
 * Layer 6 : Dessine les numéros des coups sur les pierres
 *
 * @param ctx - Contexte Canvas 2D
 * @param moves - Tableau des coups joués
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawMoveNumbers = (
  ctx: CanvasRenderingContext2D,
  moves: Move[],
  cellSize: number
): void => {
  ctx.font = STYLE.numberFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000000'; // Défaut noir

  moves.forEach((move) => {
    const { px, py } = goCoordToPixel({ x: move.x, y: move.y }, cellSize);

    // Couleur inversée pour lisibilité
    ctx.fillStyle = move.color === 'B' ? '#FFFFFF' : '#000000';

    // Afficher numéro du coup
    ctx.fillText(move.moveNumber.toString(), px, py);
  });
};

/**
 * Layer 7a : Dessine les highlights (dernière pierre jouée)
 *
 * @param ctx - Contexte Canvas 2D
 * @param lastMove - Dernier coup joué ou null
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawHighlights = (
  ctx: CanvasRenderingContext2D,
  lastMove: Move | null,
  cellSize: number
): void => {
  if (!lastMove) return;

  const { px, py } = goCoordToPixel({ x: lastMove.x, y: lastMove.y }, cellSize);
  const stoneRadius = calculateStoneRadius(cellSize);

  // Cercle rouge autour de la dernière pierre
  ctx.strokeStyle = STYLE.lastMoveColor;
  ctx.lineWidth = STYLE.lastMoveWidth;
  ctx.beginPath();
  ctx.arc(px, py, stoneRadius + 3, 0, Math.PI * 2);
  ctx.stroke();
};

/**
 * Layer 7b : Dessine l'aperçu hover (pierre fantôme semi-transparente)
 *
 * @param ctx - Contexte Canvas 2D
 * @param hoverPosition - Position du survol ou null
 * @param cellSize - Taille d'une cellule en pixels
 * @param nextColor - Couleur du prochain coup
 */
export const drawHover = (
  ctx: CanvasRenderingContext2D,
  hoverPosition: Position | null,
  cellSize: number,
  nextColor: Color
): void => {
  if (!hoverPosition) return;

  const { px, py } = goCoordToPixel(hoverPosition, cellSize);
  const stoneRadius = calculateStoneRadius(cellSize);

  // Pierre fantôme semi-transparente
  ctx.globalAlpha = 0.5;

  if (nextColor === 'B') {
    ctx.fillStyle = '#000000';
  } else {
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1;
  }

  ctx.beginPath();
  ctx.arc(px, py, stoneRadius, 0, Math.PI * 2);
  ctx.fill();

  if (nextColor === 'W') {
    ctx.stroke();
  }

  // Réinitialiser alpha
  ctx.globalAlpha = 1;
};

/**
 * Fonction complète de rendu du plateau
 * Enchaîne tous les layers dans l'ordre correct
 *
 * @param ctx - Contexte Canvas 2D
 * @param canvasSize - Taille du canvas
 * @param moves - Coups à afficher
 * @param lastMove - Dernier coup (pour highlight)
 * @param hoverPosition - Position du survol
 * @param nextColor - Couleur du prochain coup
 */
export const renderBoard = (
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  moves: Move[],
  lastMove: Move | null,
  hoverPosition: Position | null,
  nextColor: Color
): void => {
  const cellSize = canvasSize / 19;

  // Layer pipeline
  drawBackground(ctx, canvasSize);
  drawGrid(ctx, canvasSize, cellSize);
  drawHoshi(ctx, cellSize);
  drawStones(ctx, moves, cellSize);
  drawMoveNumbers(ctx, moves, cellSize);
  drawHighlights(ctx, lastMove, cellSize);
  drawHover(ctx, hoverPosition, cellSize, nextColor);
};
