import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Evaluation } from '@/types/game';

export interface EvaluationsState {
  results: Record<string, Evaluation>;
  loading: boolean;
  error: string | null;
}

const initialState: EvaluationsState = {
  results: {},
  loading: false,
  error: null,
};

export const evaluationsSlice = createSlice({
  name: 'evaluations',
  initialState,
  reducers: {
    setEvaluation: (state, action: PayloadAction<Evaluation>) => {
      state.results[action.payload.moveId] = action.payload;
    },
    setEvaluations: (state, action: PayloadAction<Record<string, Evaluation>>) => {
      state.results = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearEvaluations: state => {
      state.results = {};
    },
  },
});

export const { setEvaluation, setEvaluations, setLoading, setError, clearEvaluations } =
  evaluationsSlice.actions;

export default evaluationsSlice.reducer;
