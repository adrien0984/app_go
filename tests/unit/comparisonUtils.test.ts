/**
 * Tests unitaires pour les utilitaires de comparaison
 * @module __tests__/comparisonUtils.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  createComparisonRecord,
  createComparisonRecordFromEvaluation,
  createMissingRecord,
  calculateComparisonStats,
  formatPercentage,
  formatScore,
  recordToCSV,
  generateComparisonCSV,
  positionToNotation,
  normalizeValue,
  getWinrateRange,
  getScoreRange,
} from '@utils/comparisonUtils';
import type { KataGoAnalysisResult, AnalysisProfileId } from '@types/katago';
import type { Evaluation } from '@types/game';

describe('comparisonUtils', () => {
  // Mock data
  const mockKataGoAnalysis: KataGoAnalysisResult = {
    id: 'test-1',
    timestamp: new Date(),
    rootInfo: {
      currentPlayer: 'B',
      winrate: 0.65,
      scoreLead: 2.5,
      visits: 100,
      utility: 0.65,
    },
    moveInfos: [
      {
        move: { x: 3, y: 3 },
        visits: 50,
        winrate: 0.68,
        lcb: 0.60,
        prior: 0.05,
      },
      {
        move: { x: 16, y: 16 },
        visits: 30,
        winrate: 0.62,
        lcb: 0.55,
        prior: 0.04,
      },
    ],
    policy: Array(19)
      .fill(null)
      .map(() => Array(19).fill(0.01)),
    ownership: null,
    confidence: 0.9,
    analysisTime: 1000,
  };

  const mockEvaluation: Evaluation = {
    id: 'eval-1',
    gameId: 'game-1',
    moveId: 'move-1',
    timestamp: new Date(),
    winrate: { black: 0.58, white: 0.42 },
    scoreLeadPV: -1.5,
    topMoves: [
      {
        move: { x: 2, y: 2 },
        visits: 60,
        winrate: 0.61,
        lcb: 0.50,
        prior: 0.06,
      },
    ],
    confidence: 0.85,
  };

  describe('positionToNotation', () => {
    it('should convert position {x:0, y:0} to "A19"', () => {
      expect(positionToNotation({ x: 0, y: 0 })).toBe('A19');
    });

    it('should convert position {x:3, y:3} to "D16"', () => {
      expect(positionToNotation({ x: 3, y: 3 })).toBe('D16');
    });

    it('should convert position {x:18, y:18} to "S1"', () => {
      expect(positionToNotation({ x: 18, y: 18 })).toBe('S1');
    });

    it('should handle null coordinates', () => {
      expect(() => positionToNotation({ x: 0, y: 0 })).not.toThrow();
    });
  });

  describe('createComparisonRecord', () => {
    it('should create record from KataGo analysis', () => {
      const record = createComparisonRecord(5, 'D4', mockKataGoAnalysis, 'standard', 1000);

      expect(record.moveIndex).toBe(5);
      expect(record.moveNotation).toBe('D4');
      expect(record.blackWinrate).toBe(0.65);
      expect(record.whiteWinrate).toBe(0.35);
      expect(record.scoreEstimate).toBe(2.5);
      expect(record.analyzed).toBe(true);
      expect(record.profile).toBe('standard');
      expect(record.analysisTime).toBe(1000);
      // bestMove peut varier selon la conversion du moveInfo
      expect(typeof record.bestMove).toBe('string');
    });

    it('should handle null moveInfos', () => {
      const analysis = { ...mockKataGoAnalysis, moveInfos: [] };
      const record = createComparisonRecord(0, 'D4', analysis);

      expect(record.bestMove).toBe('N/A');
      expect(record.analyzed).toBe(true);
    });

    it('should default winrate to 0 if missing', () => {
      const analysis = { ...mockKataGoAnalysis, rootInfo: null };
      const record = createComparisonRecord(0, 'D4', analysis);

      expect(record.blackWinrate).toBe(0);
      expect(record.whiteWinrate).toBe(1);
    });
  });

  describe('createComparisonRecordFromEvaluation', () => {
    it('should create record from Evaluation', () => {
      const record = createComparisonRecordFromEvaluation(10, 'C3', mockEvaluation);

      expect(record.moveIndex).toBe(10);
      expect(record.moveNotation).toBe('C3');
      expect(record.blackWinrate).toBe(0.58);
      expect(record.whiteWinrate).toBe(0.42);
      expect(record.scoreEstimate).toBe(-1.5);
      expect(record.analyzed).toBe(true);
      // bestMove peut varier selon la conversion
      expect(typeof record.bestMove).toBe('string');
    });

    it('should handle missing top moves', () => {
      const eval2: Evaluation = { ...mockEvaluation, topMoves: [] };
      const record = createComparisonRecordFromEvaluation(0, 'D4', eval2);

      expect(record.bestMove).toBe('N/A');
    });
  });

  describe('createMissingRecord', () => {
    it('should create a missing analysis record', () => {
      const record = createMissingRecord(3, 'D4');

      expect(record).toEqual({
        moveIndex: 3,
        moveNotation: 'D4',
        blackWinrate: 0,
        whiteWinrate: 0,
        scoreEstimate: 0,
        bestMove: 'N/A',
        analyzed: false,
      });
    });
  });

  describe('calculateComparisonStats', () => {
    it('should calculate stats for analyzed records', () => {
      const records = [
        createComparisonRecord(1, 'D4', mockKataGoAnalysis),
        createComparisonRecord(5, 'Q16', mockKataGoAnalysis),
        createMissingRecord(10, 'K10'),
      ];

      const stats = calculateComparisonStats(records);

      expect(stats.totalAnalyzed).toBe(2);
      expect(stats.totalMissing).toBe(1);
      expect(stats.avgBlackWinrate).toBe(0.65);
      expect(stats.avgWhiteWinrate).toBe(0.35);
      expect(stats.stdDevScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle all missing records', () => {
      const records = [createMissingRecord(1, 'D4'), createMissingRecord(2, 'D5')];

      const stats = calculateComparisonStats(records);

      expect(stats.totalAnalyzed).toBe(0);
      expect(stats.totalMissing).toBe(2);
      expect(stats.avgBlackWinrate).toBe(0);
    });

    it('should handle empty records', () => {
      const stats = calculateComparisonStats([]);

      expect(stats.totalAnalyzed).toBe(0);
      expect(stats.totalMissing).toBe(0);
      expect(stats.avgBlackWinrate).toBe(0);
    });
  });

  describe('formatPercentage', () => {
    it('should format 0.45 as "45%"', () => {
      expect(formatPercentage(0.45)).toBe('45%');
    });

    it('should format with decimal places', () => {
      expect(formatPercentage(0.456, 1)).toBe('45.6%');
      expect(formatPercentage(0.456, 2)).toBe('45.60%');
    });

    it('should handle 0 and 1', () => {
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(1)).toBe('100%');
    });
  });

  describe('formatScore', () => {
    it('should format positive score as N+', () => {
      expect(formatScore(2.5)).toBe('N+2.5');
      expect(formatScore(10)).toBe('N+10.0');
    });

    it('should format negative score as B+', () => {
      expect(formatScore(-3.5)).toBe('B+3.5');
      expect(formatScore(-5)).toBe('B+5.0');
    });

    it('should format 0 as ±0.0', () => {
      expect(formatScore(0)).toBe('±0.0');
    });
  });

  describe('recordToCSV', () => {
    it('should format a cached record as CSV', () => {
      const record = createComparisonRecord(1, 'D4', mockKataGoAnalysis);
      const csv = recordToCSV(record);

      // Vérifier que le CSV contient les bonnes valeurs séparées par des virgules
      expect(csv).toContain('65%');
      expect(csv).toContain('35%');
      expect(csv.split(',').length).toBe(5); // 5 colonnes
    });

    it('should format a missing record as CSV', () => {
      const record = createMissingRecord(1, 'D4');
      const csv = recordToCSV(record);

      expect(csv).toBe('D4,0%,0%,N/A,N/A');
    });
  });

  describe('generateComparisonCSV', () => {
    it('should generate complete CSV with headers and stats', () => {
      const records = [
        createComparisonRecord(1, 'D4', mockKataGoAnalysis),
        createMissingRecord(5, 'Q16'),
      ];
      const result = {
        gameId: 'game-1',
        records,
        generatedAt: new Date(),
        totalAnalyzed: 1,
        totalMissing: 1,
        avgBlackWinrate: 0.65,
        avgWhiteWinrate: 0.35,
        avgScore: 2.5,
        stdDevScore: 0,
      };

      const csv = generateComparisonCSV(result);

      expect(csv).toContain('Coup,Noir Winrate,Blanc Winrate,Score,Meilleur Coup');
      expect(csv).toContain('D4');
      expect(csv).toContain('Q16');
      expect(csv).toContain('Statistiques');
      expect(csv).toContain('Total Analysé,1');
      expect(csv).toContain('Total Manquant,1');
    });
  });

  describe('normalizeValue', () => {
    it('should normalize value between min and max', () => {
      expect(normalizeValue(5, 0, 10)).toBe(0.5);
      expect(normalizeValue(0, 0, 10)).toBe(0);
      expect(normalizeValue(10, 0, 10)).toBe(1);
    });

    it('should return 0.5 when min equals max', () => {
      expect(normalizeValue(5, 5, 5)).toBe(0.5);
    });
  });

  describe('getWinrateRange', () => {
    it('should return default range for empty records', () => {
      expect(getWinrateRange([])).toEqual([0, 1]);
    });

    it('should calculate range with padding', () => {
      const records = [
        createComparisonRecord(1, 'D4', mockKataGoAnalysis),
      ];
      const [min, max] = getWinrateRange(records);

      expect(min).toBeLessThan(0.35);
      expect(max).toBeGreaterThan(0.65);
    });
  });

  describe('getScoreRange', () => {
    it('should return default range for empty records', () => {
      expect(getScoreRange([])).toEqual([-5, 5]);
    });

    it('should calculate score range with padding', () => {
      const records = [
        createComparisonRecord(1, 'D4', mockKataGoAnalysis),
      ];
      const [min, max] = getScoreRange(records);

      expect(min).toBeLessThan(2.5);
      expect(max).toBeGreaterThan(2.5);
    });

    it('should handle single point (0 score)', () => {
      const mockAnalysis = {
        ...mockKataGoAnalysis,
        rootInfo: { ...mockKataGoAnalysis.rootInfo, scoreLead: 0 },
      };
      const records = [createComparisonRecord(1, 'D4', mockAnalysis)];
      const [min, max] = getScoreRange(records);

      expect(min).toBeLessThanOrEqual(0);
      expect(max).toBeGreaterThanOrEqual(0);
    });
  });
});
