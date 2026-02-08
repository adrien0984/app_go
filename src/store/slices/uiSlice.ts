import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  showAnalysis: boolean;
  selectedVariant: string | null;
  boardSize: number;
  highlighted: { x: number; y: number } | null;
  sidebarOpen: boolean;
  analysisLoading: boolean;
}

const initialState: UIState = {
  showAnalysis: false,
  selectedVariant: null,
  boardSize: 19,
  highlighted: null,
  sidebarOpen: true,
  analysisLoading: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleAnalysis: state => {
      state.showAnalysis = !state.showAnalysis;
    },
    setAnalysisVisible: (state, action: PayloadAction<boolean>) => {
      state.showAnalysis = action.payload;
    },
    setSelectedVariant: (state, action: PayloadAction<string | null>) => {
      state.selectedVariant = action.payload;
    },
    setHighlighted: (
      state,
      action: PayloadAction<{ x: number; y: number } | null>
    ) => {
      state.highlighted = action.payload;
    },
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setAnalysisLoading: (state, action: PayloadAction<boolean>) => {
      state.analysisLoading = action.payload;
    },
  },
});

export const {
  toggleAnalysis,
  setAnalysisVisible,
  setSelectedVariant,
  setHighlighted,
  toggleSidebar,
  setAnalysisLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
