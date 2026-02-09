import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import evaluationsReducer from './slices/evaluationsSlice';
import analysisHistoryReducer from './slices/analysisHistorySlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    ui: uiReducer,
    settings: settingsReducer,
    evaluations: evaluationsReducer,
    analysisHistory: analysisHistoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
