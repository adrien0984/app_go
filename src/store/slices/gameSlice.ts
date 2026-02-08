import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Game, Position } from '@/types/game';
import { GameService } from '@/services/GameService';

export interface GameState {
  current: Game | null;
  games: Game[];
  currentMoveIndex: number;
  loading: boolean;
  error: string | null;
}

const initialState: GameState = {
  current: null,
  games: [],
  currentMoveIndex: -1,
  loading: false,
  error: null,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * Définit le jeu actuel
     */
    setCurrentGame: (state: GameState, action: PayloadAction<Game | null>) => {
      state.current = action.payload;
      state.currentMoveIndex = action.payload ? action.payload.rootMoves.length - 1 : -1;
    },

    /**
     * Définit la liste des jeux
     */
    setGames: (state: GameState, action: PayloadAction<Game[]>) => {
      state.games = action.payload;
    },

    /**
     * Ajoute un jeu à la liste (en tête)
     */
    addGameToList: (state: GameState, action: PayloadAction<Game>) => {
      state.games = [action.payload, ...state.games];
    },

    /**
     * Met à jour un jeu dans la liste
     */
    updateGameInList: (state: GameState, action: PayloadAction<Game>) => {
      const index = state.games.findIndex((g: Game) => g.id === action.payload.id);
      if (index !== -1) {
        state.games[index] = action.payload;
      }
    },

    /**
     * Supprime un jeu de la liste
     */
    deleteGameFromList: (state: GameState, action: PayloadAction<string>) => {
      state.games = state.games.filter((g: Game) => g.id !== action.payload);
    },

    /**
     * Définit l'état de chargement
     */
    setLoading: (state: GameState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Définit le message d'erreur
     */
    setError: (state: GameState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Définit l'index du coup actuel (navigation historique)
     */
    setCurrentMoveIndex: (state: GameState, action: PayloadAction<number>) => {
      if (!state.current) return;

      const maxIndex = state.current.rootMoves.length - 1;
      state.currentMoveIndex = Math.max(-1, Math.min(action.payload, maxIndex));
    },

    /**
     * Ajoute un coup au jeu actuel
     * Valide le coup et alterne les couleurs automatiquement
     */
    addMove: (state: GameState, action: PayloadAction<Position>) => {
      if (!state.current) return;

      // Valider le coup
      if (!GameService.isValidMove(state.current, action.payload)) {
        state.error = 'Coup invalide : intersection occupée ou hors limites';
        return;
      }

      // Ajouter le coup
      state.current = GameService.addMove(state.current, action.payload);
      state.currentMoveIndex = state.current.rootMoves.length - 1;
      state.error = null;
    },

    /**
     * Annule le dernier coup
     */
    undoMove: (state: GameState) => {
      if (!state.current || state.current.rootMoves.length === 0) return;

      state.current = GameService.undoMove(state.current);
      state.currentMoveIndex = state.current.rootMoves.length - 1;
      state.error = null;
    },

    /**
     * Avance au coup suivant (dans l'historique)
     */
    nextMove: (state: GameState) => {
      if (!state.current) return;

      const maxIndex = state.current.rootMoves.length - 1;
      if (state.currentMoveIndex < maxIndex) {
        state.currentMoveIndex++;
      }
    },

    /**
     * Revient au coup précédent (dans l'historique)
     */
    previousMove: (state: GameState) => {
      if (state.currentMoveIndex > -1) {
        state.currentMoveIndex--;
      }
    },

    /**
     * Réinitialise le jeu actuel (plateau vide)
     */
    resetGame: (state: GameState) => {
      if (!state.current) return;

      state.current.rootMoves = [];
      state.currentMoveIndex = -1;
      state.error = null;
    },
  },
});

export const {
  setCurrentGame,
  setGames,
  addGameToList,
  updateGameInList,
  deleteGameFromList,
  setLoading,
  setError,
  setCurrentMoveIndex,
  addMove,
  undoMove,
  nextMove,
  previousMove,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
