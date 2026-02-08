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
  coordinateColor: '#4A3728', // Brun foncé pour les coordonnées
};

/**
 * Labels de colonnes Go : A-T en excluant I (convention internationale)
 * 19 lettres pour 19 colonnes
 */
export const COLUMN_LABELS = 'ABCDEFGHJKLMNOPQRST';

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
 * Layer 4 : Dessine les coordonnées (A-T sans I pour colonnes, 1-19 pour lignes)
 * Convention Go : colonnes A-T (skip I), lignes 1 (bas) à 19 (haut)
 * Labels affichés sur les 4 côtés du plateau dans les marges
 *
 * @param ctx - Contexte Canvas 2D
 * @param cellSize - Taille d'une cellule en pixels
 */
export const drawCoordinates = (
  ctx: CanvasRenderingContext2D,
  cellSize: number
): void => {
  const offset = cellSize; // Marge identique à drawGrid
  const boardSize = cellSize * 18;
  const fontSize = Math.max(9, Math.round(cellSize * 0.4));

  ctx.fillStyle = STYLE.coordinateColor;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Colonnes (A-T sans I) — en haut et en bas
  for (let i = 0; i < 19; i++) {
    const x = offset + i * cellSize;
    const label = COLUMN_LABELS[i];

    // En haut (milieu de la marge supérieure)
    ctx.fillText(label, x, offset * 0.45);

    // En bas (milieu de la marge inférieure)
    ctx.fillText(label, x, offset + boardSize + offset * 0.55);
  }

  // Lignes (1-19, bas=1, haut=19) — à gauche et à droite
  for (let i = 0; i < 19; i++) {
    const y = offset + i * cellSize;
    const label = String(19 - i); // y=0 → 19, y=18 → 1

    // À gauche (milieu de la marge gauche)
    ctx.fillText(label, offset * 0.45, y);

    // À droite (milieu de la marge droite)
    ctx.fillText(label, offset + boardSize + offset * 0.55, y);
  }
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
 * Layer 8 (optionnel) : Dessine la heatmap policy/ownership
 * Affiche une couche semi-transparente colorée sur chaque intersection
 * Couleurs : bleu (faible probabilité) → vert → jaune → rouge (haute probabilité)
 *
 * @param ctx - Contexte Canvas 2D
 * @param policy - Matrice 19×19 de probabilités (0.0-1.0)
 * @param cellSize - Taille d'une cellule en pixels
 * @param moves - Coups joués (pour exclure intersections occupées)
 * @param opacity - Opacité globale de la heatmap (0.0-1.0, défaut 0.45)
 */
export const drawPolicyHeatmap = (
  ctx: CanvasRenderingContext2D,
  policy: number[][],
  cellSize: number,
  moves: Move[],
  opacity = 0.45
): void => {
  if (!policy || policy.length !== 19) return;

  // Construire set des positions occupées pour lookup O(1)
  const occupied = new Set<string>();
  moves.forEach((m: Move) => occupied.add(`${m.x},${m.y}`));

  // Trouver max pour normalisation visuelle
  let maxProb = 0;
  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      if (!occupied.has(`${x},${y}`) && policy[y][x] > maxProb) {
        maxProb = policy[y][x];
      }
    }
  }

  if (maxProb === 0) return;

  const stoneRadius = calculateStoneRadius(cellSize);

  ctx.save();
  ctx.globalAlpha = opacity;

  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 19; x++) {
      // Ne pas dessiner sur pierres existantes
      if (occupied.has(`${x},${y}`)) continue;

      const prob = policy[y][x];
      if (prob <= 0) continue;

      // Normaliser par rapport au max pour un meilleur contraste
      const normalized = prob / maxProb;

      // Seuil minimum pour ne pas dessiner des valeurs insignifiantes
      if (normalized < 0.02) continue;

      const { px, py } = goCoordToPixel({ x, y }, cellSize);
      const color = policyValueToColor(normalized);

      // Dégradé radial pour un rendu plus naturel
      const radius = stoneRadius * (0.4 + 0.6 * normalized);
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, colorWithAlpha(color, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

/**
 * Convertit une valeur normalisée (0-1) en couleur de heatmap
 * Palette : bleu → cyan → vert → jaune → rouge
 *
 * @param value - Valeur normalisée entre 0.0 et 1.0
 * @returns Couleur CSS rgba
 */
export const policyValueToColor = (value: number): string => {
  const clamped = Math.max(0, Math.min(1, value));

  let r: number, g: number, b: number;

  if (clamped < 0.25) {
    // Bleu → Cyan (0.0 - 0.25)
    const t = clamped / 0.25;
    r = 0;
    g = Math.round(150 * t);
    b = 200;
  } else if (clamped < 0.5) {
    // Cyan → Vert (0.25 - 0.5)
    const t = (clamped - 0.25) / 0.25;
    r = 0;
    g = 150 + Math.round(105 * t);
    b = Math.round(200 * (1 - t));
  } else if (clamped < 0.75) {
    // Vert → Jaune (0.5 - 0.75)
    const t = (clamped - 0.5) / 0.25;
    r = Math.round(255 * t);
    g = 255;
    b = 0;
  } else {
    // Jaune → Rouge (0.75 - 1.0)
    const t = (clamped - 0.75) / 0.25;
    r = 255;
    g = Math.round(255 * (1 - t));
    b = 0;
  }

  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Ajoute un canal alpha à une couleur CSS rgb
 *
 * @param color - Couleur CSS au format rgb(r, g, b)
 * @param alpha - Valeur alpha (0.0 - 1.0)
 * @returns Couleur CSS rgba
 */
const colorWithAlpha = (color: string, alpha: number): string => {
  return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
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
 * @param policy - Distribution policy NN 19×19 (optionnel, pour heatmap)
 */
export const renderBoard = (
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  moves: Move[],
  lastMove: Move | null,
  hoverPosition: Position | null,
  nextColor: Color,
  policy?: number[][] | null
): void => {
  const cellSize = canvasSize / 19;

  // Layer pipeline
  drawBackground(ctx, canvasSize);
  drawGrid(ctx, canvasSize, cellSize);
  drawHoshi(ctx, cellSize);
  drawCoordinates(ctx, cellSize);

  // Layer 8 (optionnel) : Heatmap policy (entre grille et pierres)
  if (policy) {
    drawPolicyHeatmap(ctx, policy, cellSize, moves);
  }

  drawStones(ctx, moves, cellSize);
  drawMoveNumbers(ctx, moves, cellSize);
  drawHighlights(ctx, lastMove, cellSize);
  drawHover(ctx, hoverPosition, cellSize, nextColor);
};
