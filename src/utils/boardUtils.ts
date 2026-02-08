/**
 * Utilitaires de conversion coordonnées Canvas ↔ Plateau Go
 * @module utils/boardUtils
 */

import type { Position } from '@/types/game';

/**
 * Convertit des coordonnées pixels en coordonnées Go (19×19)
 * Avec snap-to-grid et validation de limites
 *
 * @param e - Événement souris ou tactile
 * @param canvas - Élément Canvas
 * @param canvasSize - Taille du canvas en pixels
 * @returns Position Go {x: 0-18, y: 0-18} ou null si hors limites
 *
 * @example
 * const pos = pixelToGoCoord(mouseEvent, canvas, 380);
 * // { x: 3, y: 5 }
 */
export const pixelToGoCoord = (
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  canvasSize: number
): Position | null => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Extraire coordonnées client (souris ou doigt)
  let clientX: number;
  let clientY: number;

  if ('touches' in e) {
    if (e.touches.length === 0) return null;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // Convertir en coordonnées canvas avec DPI scaling
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;

  // Convertir en coordonnées Go
  const cellSize = canvasSize / 20; // 19 intersections + 2 marges
  const x = Math.round((canvasX - cellSize) / cellSize);
  const y = Math.round((canvasY - cellSize) / cellSize);

  // Valider limites (0-18)
  if (x < 0 || x > 18 || y < 0 || y > 18) {
    return null;
  }

  return { x, y };
};

/**
 * Convertit des coordonnées Go en coordonnées pixels Canvas
 *
 * @param position - Position Go {x: 0-18, y: 0-18}
 * @param cellSize - Taille d'une cellule en pixels
 * @returns Coordonnées pixels {px, py}
 *
 * @example
 * const pixels = goCoordToPixel({ x: 3, y: 5 }, 20);
 * // { px: 80, py: 120 }
 */
export const goCoordToPixel = (
  position: Position,
  cellSize: number
): { px: number; py: number } => {
  // offset = cellSize pour laisser marges de la grille
  const px = cellSize + position.x * cellSize;
  const py = cellSize + position.y * cellSize;
  return { px, py };
};

/**
 * Valide si une position Go est légale (dans les limites 19×19)
 *
 * @param position - Position à valider
 * @returns true si position valide, false sinon
 *
 * @example
 * isValidPosition({ x: 3, y: 5 }); // true
 * isValidPosition({ x: -1, y: 5 }); // false
 * isValidPosition({ x: 19, y: 5 }); // false
 */
export const isValidPosition = (position: Position): boolean => {
  return position.x >= 0 && position.x <= 18 && position.y >= 0 && position.y <= 18;
};

/**
 * Calcule la taille d'une cellule en fonction de la taille du canvas
 * Maintient une grille 19×19 avec marges
 *
 * @param canvasSize - Taille du canvas en pixels
 * @returns Taille d'une cellule en pixels
 *
 * @example
 * calculateCellSize(400); // 20 (400/20 pour 19 intersections + marges)
 * calculateCellSize(800); // 40
 */
export const calculateCellSize = (canvasSize: number): number => {
  return canvasSize / 20; // 19 intersections + 2 marges = 20 cellules
};

/**
 * Calcule le rayon d'une pierre (40% de la cellule)
 *
 * @param cellSize - Taille d'une cellule en pixels
 * @returns Rayon de la pierre en pixels
 *
 * @example
 * calculateStoneRadius(20); // 8
 * calculateStoneRadius(40); // 16
 */
export const calculateStoneRadius = (cellSize: number): number => {
  return cellSize * 0.4;
};

/**
 * Calcule la taille adaptée du canvas en fonction des dimensions du conteneur
 * Garantit un aspect ratio 1:1 (carré) en utilisant le minimum entre largeur et hauteur
 * Responsive : min 280px (petit mobile), max 800px (desktop)
 *
 * @param containerWidth - Largeur du conteneur parent
 * @param containerHeight - Hauteur du conteneur parent (optionnelle)
 * @returns Taille du canvas en pixels (carré)
 *
 * @example
 * calculateCanvasSize(375, 500); // 355 (min des deux - padding)
 * calculateCanvasSize(800, 600); // 580 (hauteur limite)
 */
export const calculateCanvasSize = (containerWidth: number, containerHeight?: number): number => {
  const MIN_SIZE = 280;
  const MAX_SIZE = 800;
  const PADDING = 20;

  // Utiliser le minimum entre largeur et hauteur pour garantir un carré
  const availableWidth = containerWidth - PADDING;
  const availableHeight = containerHeight ? containerHeight - PADDING : availableWidth;
  
  // Prendre la plus petite dimension pour garantir que le goban tient en entier
  const size = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.min(availableWidth, availableHeight)));

  return size;
};
