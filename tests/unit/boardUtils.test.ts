/**
 * Tests unitaires pour boardUtils
 * Conversion coordonnées, validation, calculs de taille
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  pixelToGoCoord,
  goCoordToPixel,
  isValidPosition,
  calculateCellSize,
  calculateStoneRadius,
  calculateCanvasSize,
} from '@/utils/boardUtils';
import type { Position } from '@/types/game';

describe('boardUtils', () => {
  describe('pixelToGoCoord', () => {
    it('should convert center click to valid Go coordinate', () => {
      // Setup canvas
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 380;

      // Mock getBoundingClientRect
      Object.defineProperty(canvas, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 380,
          height: 380,
          right: 380,
          bottom: 380,
        }),
      });

      // Mock mouse event at center (plain object to avoid readonly getter)
      const mockEvent = {
        clientX: 190,
        clientY: 190,
      } as any;

      // Test: should return valid coordinate
      const result = pixelToGoCoord(mockEvent, canvas, 380);
      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThanOrEqual(0);
      expect(result!.x).toBeLessThanOrEqual(18);
      expect(result!.y).toBeGreaterThanOrEqual(0);
      expect(result!.y).toBeLessThanOrEqual(18);
    });

    it('should return null for out of bounds click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 380;

      Object.defineProperty(canvas, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 380,
          height: 380,
          right: 380,
          bottom: 380,
        }),
      });

      // Click far outside
      const mockEvent = {
        clientX: 1000,
        clientY: 1000,
      } as any;

      const result = pixelToGoCoord(mockEvent, canvas, 380);
      expect(result).toBeNull();
    });

    it('should handle negative coordinates (left/top edge)', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 380;
      canvas.height = 380;

      Object.defineProperty(canvas, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          top: 0,
          width: 380,
          height: 380,
          right: 380,
          bottom: 380,
        }),
      });

      const mockEvent = {
        clientX: -10,
        clientY: 50,
      } as any;

      const result = pixelToGoCoord(mockEvent, canvas, 380);
      expect(result).toBeNull();
    });
  });

  describe('goCoordToPixel', () => {
    it('should convert Go coordinates to pixel coordinates', () => {
      const cellSize = 20;
      const position: Position = { x: 3, y: 5 };

      const result = goCoordToPixel(position, cellSize);

      // cellSize (offset) + position * cellSize
      expect(result.px).toBe(20 + 3 * 20); // 80
      expect(result.py).toBe(20 + 5 * 20); // 120
    });

    it('should handle corner positions', () => {
      const cellSize = 40;

      // Top-left corner
      let result = goCoordToPixel({ x: 0, y: 0 }, cellSize);
      expect(result.px).toBe(40);
      expect(result.py).toBe(40);

      // Bottom-right corner
      result = goCoordToPixel({ x: 18, y: 18 }, cellSize);
      expect(result.px).toBe(40 + 18 * 40); // 760
      expect(result.py).toBe(40 + 18 * 40); // 760
    });

    it('should scale correctly with different cell sizes', () => {
      const position: Position = { x: 9, y: 9 };

      const result380 = goCoordToPixel(position, 20);
      const result760 = goCoordToPixel(position, 40);

      expect(result760.px).toBe(result380.px * 2);
      expect(result760.py).toBe(result380.py * 2);
    });
  });

  describe('isValidPosition', () => {
    it('should accept valid positions', () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 9, y: 9 })).toBe(true);
      expect(isValidPosition({ x: 18, y: 18 })).toBe(true);
      expect(isValidPosition({ x: 3, y: 15 })).toBe(true);
    });

    it('should reject out of bounds positions', () => {
      expect(isValidPosition({ x: -1, y: 5 })).toBe(false);
      expect(isValidPosition({ x: 5, y: -1 })).toBe(false);
      expect(isValidPosition({ x: 19, y: 5 })).toBe(false);
      expect(isValidPosition({ x: 5, y: 19 })).toBe(false);
      expect(isValidPosition({ x: -1, y: -1 })).toBe(false);
      expect(isValidPosition({ x: 20, y: 20 })).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidPosition({ x: 0, y: 18 })).toBe(true);
      expect(isValidPosition({ x: 18, y: 0 })).toBe(true);
      expect(isValidPosition({ x: -0.5, y: 5 })).toBe(false); // floating point
    });
  });

  describe('calculateCellSize', () => {
    it('should calculate cell size for 19×19 grid with margins', () => {
      // canvasSize / 20 = 19 intersections + 2 marges
      expect(calculateCellSize(400)).toBe(20);
      expect(calculateCellSize(800)).toBe(40);
      expect(calculateCellSize(600)).toBe(30);
    });

    it('should handle various canvas sizes', () => {
      const sizes = [360, 380, 400, 600, 760, 800];

      sizes.forEach((canvasSize: number) => {
        const cellSize = calculateCellSize(canvasSize);
        expect(cellSize).toBe(canvasSize / 20);
        expect(cellSize).toBeGreaterThan(0);
      });
    });
  });

  describe('calculateStoneRadius', () => {
    it('should calculate stone radius as 40% of cell size', () => {
      expect(calculateStoneRadius(20)).toBe(8);
      expect(calculateStoneRadius(40)).toBe(16);
      expect(calculateStoneRadius(30)).toBe(12);
    });

    it('should scale proportionally', () => {
      const radius20 = calculateStoneRadius(20);
      const radius40 = calculateStoneRadius(40);

      expect(radius40).toBe(radius20 * 2);
    });

    it('should handle fractional sizes', () => {
      const radius = calculateStoneRadius(25);
      expect(radius).toBe(10);
    });
  });

  describe('calculateCanvasSize', () => {
    it('should respect minimum size (280px)', () => {
      // MIN_SIZE = 280, donc même un petit conteneur donne au moins 280
      expect(calculateCanvasSize(100)).toBe(280);
      expect(calculateCanvasSize(200)).toBe(280);
      expect(calculateCanvasSize(300)).toBe(280);
    });

    it('should respect maximum size (800px)', () => {
      expect(calculateCanvasSize(1000)).toBe(800);
      expect(calculateCanvasSize(2000)).toBe(800);
    });

    it('should return responsive size in between', () => {
      const size = calculateCanvasSize(500);
      expect(size).toBeGreaterThanOrEqual(280);
      expect(size).toBeLessThanOrEqual(800);
    });

    it('should account for padding', () => {
      // 400px container - 20px padding = 380px canvas
      const result1 = calculateCanvasSize(400);
      expect(result1).toBe(380);

      // 820px container - 20px padding = 800px (max)
      const result2 = calculateCanvasSize(820);
      expect(result2).toBe(800);
    });

    it('should match common viewport sizes', () => {
      // Mobile (375px - 20px padding = 355px)
      expect(calculateCanvasSize(375)).toBe(355);

      // Tablet (768px)
      const tabletSize = calculateCanvasSize(768);
      expect(tabletSize).toBeGreaterThan(280);
      expect(tabletSize).toBeLessThanOrEqual(800);

      // Desktop (1920px) → capped at 800
      expect(calculateCanvasSize(1920)).toBe(800);
    });
  });

  /**
   * Integration tests
   */
  describe('Integration: pixel ↔ Go conversions', () => {
    it('should be consistent: pixel → Go → pixel', () => {
      const cellSize = 20;
      const position: Position = { x: 5, y: 7 };

      // Go → Pixel → Go
      const pixels = goCoordToPixel(position, cellSize);

      // Reverse calculation
      const xBack = Math.round((pixels.px - cellSize) / cellSize);
      const yBack = Math.round((pixels.py - cellSize) / cellSize);

      expect(xBack).toBe(position.x);
      expect(yBack).toBe(position.y);
    });

    it('should handle all hoshi positions', () => {
      const hoshiPositions: Array<[number, number]> = [
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

      const cellSize = 40;

      hoshiPositions.forEach(([x, y]) => {
        expect(isValidPosition({ x, y })).toBe(true);

        const pixels = goCoordToPixel({ x, y }, cellSize);
        expect(pixels.px).toBeGreaterThan(0);
        expect(pixels.py).toBeGreaterThan(0);
      });
    });
  });
});
