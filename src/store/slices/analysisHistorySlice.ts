/**
 * Redux Slice pour Historique Analyses KataGo
 * @module store/slices/analysisHistorySlice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AnalysisHistoryEntry } from '@/types/katago';

interface AnalysisHistoryState {
  /** Map gameId -> list of analysis entries */
  byGameId: Record<string, AnalysisHistoryEntry[]>;
}

const initialState: AnalysisHistoryState = {
  byGameId: {},
};

const MAX_ENTRIES_PER_GAME = 100;

export const analysisHistorySlice = createSlice({
  name: 'analysisHistory',
  initialState,
  reducers: {
    /**
     * Ajouter une entrée d'analyse à l'historique
     * Respecte la limite MAX_ENTRIES_PER_GAME (supprime les plus anciennes)
     */
    addAnalysisEntry: (state, action: PayloadAction<AnalysisHistoryEntry>) => {
      const { gameId } = action.payload;

      if (!state.byGameId[gameId]) {
        state.byGameId[gameId] = [];
      }

      // Ajouter en début (nouvelles analyses en premier)
      state.byGameId[gameId].unshift(action.payload);

      // Limiter à MAX_ENTRIES_PER_GAME
      if (state.byGameId[gameId].length > MAX_ENTRIES_PER_GAME) {
        state.byGameId[gameId].pop();  // Supprimer la plus ancienne
      }
    },

    /**
     * Charger historique complet d'une partie
     */
    loadHistoryForGame: (
      state,
      action: PayloadAction<{ gameId: string; entries: AnalysisHistoryEntry[] }>
    ) => {
      const { gameId, entries } = action.payload;
      state.byGameId[gameId] = entries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },

    /**
     * Supprimer une entrée d'analyse spécifique
     */
    deleteHistoryEntry: (
      state,
      action: PayloadAction<{ gameId: string; entryId: string }>
    ) => {
      const { gameId, entryId } = action.payload;

      if (state.byGameId[gameId]) {
        state.byGameId[gameId] = state.byGameId[gameId].filter(e => e.id !== entryId);
      }
    },

    /**
     * Supprimer tout l'historique d'une partie
     */
    clearHistoryForGame: (state, action: PayloadAction<string>) => {
      const gameId = action.payload;
      delete state.byGameId[gameId];
    },

    /**
     * Vider l'historique complètement
     */
    clearAllHistory: (state) => {
      state.byGameId = {};
    },
  },
});

export const {
  addAnalysisEntry,
  loadHistoryForGame,
  deleteHistoryEntry,
  clearHistoryForGame,
  clearAllHistory,
} = analysisHistorySlice.actions;

// Selectors (manuels, sans utiliser createSlice.selectors)

/**
 * Sélecteur pour obtenir l'historique d'une partie
 */
export const selectGameHistory = (state: AnalysisHistoryState, gameId: string) => 
  state.byGameId[gameId] || [];

/**
 * Sélecteur pour obtenir les statistiques d'une partie
 */
export const selectGameHistoryStats = (state: AnalysisHistoryState, gameId: string) => {
  const entries = state.byGameId[gameId] || [];

  if (entries.length === 0) {
    return null;
  }

  const profiles = entries.map((e: AnalysisHistoryEntry) => e.profile);
  const profileCounts = profiles.reduce(
    (acc: Record<string, number>, p: string) => ({
      ...acc,
      [p]: (acc[p] ?? 0) + 1,
    }),
    {} as Record<string, number>
  );

  const avgWinrate =
    entries.reduce((sum: number, e: AnalysisHistoryEntry) => sum + e.result.rootInfo.winrate, 0) / entries.length;

  const avgScore =
    entries.reduce((sum: number, e: AnalysisHistoryEntry) => sum + e.result.rootInfo.scoreLead, 0) / entries.length;

  const avgTime =
    entries.reduce((sum: number, e: AnalysisHistoryEntry) => sum + e.analysisTime, 0) / entries.length;

  const mostUsedProfile = (
    Object.entries(profileCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0] || []
  )[0];

  return {
    totalAnalyses: entries.length,
    mostUsedProfile,
    avgWinrate,
    avgScore,
    avgAnalysisTime: Math.round(avgTime),
    lastAnalysis: entries[0],
  };
};

/**
 * Sélecteur pour obtenir une analyse spécifique par ID
 */
export const selectAnalysisById = (state: AnalysisHistoryState, { gameId, entryId }: { gameId: string; entryId: string }) => {
  return state.byGameId[gameId]?.find((e: AnalysisHistoryEntry) => e.id === entryId);
};

export default analysisHistorySlice.reducer;

