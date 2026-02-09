/**
 * Tests unitaires pour analysisHistorySlice Redux
 * @vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import analysisHistoryReducer, {
  addAnalysisEntry,
  loadHistoryForGame,
  deleteHistoryEntry,
  clearHistoryForGame,
  clearAllHistory,
  selectGameHistory,
  selectGameHistoryStats,
  selectAnalysisById,
} from '@/store/slices/analysisHistorySlice';
import type { AnalysisHistoryEntry } from '@/types/katago';

describe('analysisHistorySlice', () => {
  const mockEntry = (overrides = {}): AnalysisHistoryEntry => ({
    id: 'entry-1',
    gameId: 'game-1',
    moveIndex: 5,
    moveNotation: 'D3',
    profile: 'standard',
    timestamp: new Date('2026-02-08T12:00:00Z'),
    analysisTime: 1500,
    result: {
      id: 'result-1',
      timestamp: new Date('2026-02-08T12:00:00Z'),
      rootInfo: {
        currentPlayer: 'B',
        winrate: 0.58,
        scoreLead: 2.1,
        visits: 100,
        utility: 0.58,
      },
      moveInfos: [
        {
          move: { x: 3, y: 3 },
          moveSGF: 'D3',
          visits: 80,
          winrate: 0.60,
          scoreLead: 2.5,
          prior: 0.08,
          lcb: 0.55,
          utility: 0.60,
        },
      ],
      policy: Array(19).fill(Array(19).fill(0.0026)),
      ownership: null,
      confidence: 0.95,
      analysisTime: 1500,
    },
    katagoVersion: '1.0 MVP',
    notes: 'Test analysis',
    ...overrides,
  });

  describe('addAnalysisEntry', () => {
    it('devrait ajouter une entrée au début de la liste', () => {
      const initialState = analysisHistoryReducer(undefined, { type: 'unknown' });
      const entry = mockEntry();

      const nextState = analysisHistoryReducer(
        initialState,
        addAnalysisEntry(entry)
      );

      expect(nextState.byGameId['game-1']).toEqual([entry]);
    });

    it('devrait maintenir l\'ordre chronologique inverse (plus récent en premier)', () => {
      let state = analysisHistoryReducer(undefined, { type: 'unknown' });
      const entry1 = mockEntry({ id: 'entry-1', timestamp: new Date('2026-02-08T10:00:00Z') });
      const entry2 = mockEntry({ id: 'entry-2', timestamp: new Date('2026-02-08T12:00:00Z') });

      state = analysisHistoryReducer(state, addAnalysisEntry(entry1));
      state = analysisHistoryReducer(state, addAnalysisEntry(entry2));

      expect(state.byGameId['game-1']).toHaveLength(2);
      expect(state.byGameId['game-1'][0].id).toBe('entry-2');
      expect(state.byGameId['game-1'][1].id).toBe('entry-1');
    });

    it('devrait respecter la limite de MAX_ENTRIES_PER_GAME (100)', () => {
      let state = analysisHistoryReducer(undefined, { type: 'unknown' });

      // Ajouter 101 entrées
      for (let i = 0; i < 101; i++) {
        const entry = mockEntry({
          id: `entry-${i}`,
          timestamp: new Date(new Date('2026-02-08T12:00:00Z').getTime() + i * 1000),
        });
        state = analysisHistoryReducer(state, addAnalysisEntry(entry));
      }

      expect(state.byGameId['game-1']).toHaveLength(100);
      expect(state.byGameId['game-1'][0].id).toBe('entry-100');
    });
  });

  describe('loadHistoryForGame', () => {
    it('devrait charger un historique complet et trier par timestamp inversé', () => {
      const initialState = analysisHistoryReducer(undefined, { type: 'unknown' });
      const entries = [
        mockEntry({ id: 'entry-1', timestamp: new Date('2026-02-08T10:00:00Z') }),
        mockEntry({ id: 'entry-2', timestamp: new Date('2026-02-08T12:00:00Z') }),
        mockEntry({ id: 'entry-3', timestamp: new Date('2026-02-08T11:00:00Z') }),
      ];

      const nextState = analysisHistoryReducer(
        initialState,
        loadHistoryForGame({ gameId: 'game-1', entries })
      );

      expect(nextState.byGameId['game-1']).toHaveLength(3);
      expect(nextState.byGameId['game-1'][0].id).toBe('entry-2'); // Dernière
      expect(nextState.byGameId['game-1'][1].id).toBe('entry-3');
      expect(nextState.byGameId['game-1'][2].id).toBe('entry-1'); // Première
    });
  });

  describe('deleteHistoryEntry', () => {
    it('devrait supprimer une entrée spécifique', () => {
      let state = analysisHistoryReducer(undefined, { type: 'unknown' });
      state = analysisHistoryReducer(state, addAnalysisEntry(mockEntry({ id: 'entry-1' })));
      state = analysisHistoryReducer(state, addAnalysisEntry(mockEntry({ id: 'entry-2' })));

      state = analysisHistoryReducer(
        state,
        deleteHistoryEntry({ gameId: 'game-1', entryId: 'entry-1' })
      );

      expect(state.byGameId['game-1']).toHaveLength(1);
      expect(state.byGameId['game-1'][0].id).toBe('entry-2');
    });

    it('ne devrait rien faire si l\'entrée n\'existe pas', () => {
      const state = analysisHistoryReducer(undefined, { type: 'unknown' });
      const nextState = analysisHistoryReducer(
        state,
        deleteHistoryEntry({ gameId: 'game-1', entryId: 'entry-999' })
      );
      expect(nextState).toEqual(state);
    });
  });

  describe('clearHistoryForGame', () => {
    it('devrait supprimer tout l\'historique d\'une partie', () => {
      let state = analysisHistoryReducer(undefined, { type: 'unknown' });
      state = analysisHistoryReducer(state, addAnalysisEntry(mockEntry()));
      state = analysisHistoryReducer(state, addAnalysisEntry(mockEntry({ id: 'entry-2' })));

      state = analysisHistoryReducer(state, clearHistoryForGame('game-1'));

      expect(state.byGameId['game-1']).toBeUndefined();
    });
  });

  describe('clearAllHistory', () => {
    it('devrait vider complètement l\'historique', () => {
      let state = analysisHistoryReducer(undefined, { type: 'unknown' });
      state = analysisHistoryReducer(state, addAnalysisEntry(mockEntry({ gameId: 'game-1' })));
      state = analysisHistoryReducer(
        state,
        addAnalysisEntry(mockEntry({ gameId: 'game-2', id: 'entry-2' }))
      );

      state = analysisHistoryReducer(state, clearAllHistory());

      expect(state.byGameId).toEqual({});
    });
  });

  describe('Selectors', () => {
    describe('selectGameHistory', () => {
      it('devrait retourner l\'historique d\'une partie', () => {
        const state = {
          byGameId: {
            'game-1': [mockEntry({ id: 'entry-1' })],
            'game-2': [mockEntry({ id: 'entry-2' })],
          },
        };

        const history = selectGameHistory(state as any, 'game-1');
        expect(history).toHaveLength(1);
        expect(history[0].id).toBe('entry-1');
      });

      it('devrait retourner array vide si la partie n\'existe pas', () => {
        const state = { byGameId: {} };
        const history = selectGameHistory(state as any, 'game-1');
        expect(history).toEqual([]);
      });
    });

    describe('selectGameHistoryStats', () => {
      it('devrait calculer les statistiques correctes', () => {
        const entries = [
          mockEntry({
            id: 'entry-1',
            profile: 'fast',
            analysisTime: 1000,
            result: { ...mockEntry().result, rootInfo: { ...mockEntry().result.rootInfo, winrate: 0.50, scoreLead: 0 } },
          }),
          mockEntry({
            id: 'entry-2',
            profile: 'standard',
            analysisTime: 1500,
            result: { ...mockEntry().result, rootInfo: { ...mockEntry().result.rootInfo, winrate: 0.60, scoreLead: 3 } },
          }),
        ];

        const state = {
          byGameId: {
            'game-1': entries,
          },
        };

        const stats = selectGameHistoryStats(state as any, 'game-1');

        expect(stats?.totalAnalyses).toBe(2);
        expect(stats?.avgWinrate).toBe(0.55);
        expect(stats?.avgScore).toBe(1.5);
        expect(stats?.avgAnalysisTime).toBe(1250);
      });

      it('devrait retourner null si aucune analyse', () => {
        const state = { byGameId: {} };
        const stats = selectGameHistoryStats(state as any, 'game-1');
        expect(stats).toBeNull();
      });
    });

    describe('selectAnalysisById', () => {
      it('devrait retourner une analyse spécifique par ID', () => {
        const state = {
          byGameId: {
            'game-1': [mockEntry({ id: 'entry-1' }), mockEntry({ id: 'entry-2' })],
          },
        };

        const analysis = selectAnalysisById(state as any, {
          gameId: 'game-1',
          entryId: 'entry-1',
        });

        expect(analysis?.id).toBe('entry-1');
      });

      it('devrait retourner undefined si l\'analyse n\'existe pas', () => {
        const state = { byGameId: { 'game-1': [] } };
        const analysis = selectAnalysisById(state as any, {
          gameId: 'game-1',
          entryId: 'entry-999',
        });
        expect(analysis).toBeUndefined();
      });
    });
  });
});
