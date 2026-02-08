import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '@/types/i18n';

export interface SettingsState {
  language: Language;
  theme: 'light' | 'dark';
  autoSave: boolean;
  soundEnabled: boolean;
}

const initialState: SettingsState = {
  language: 'fr',
  theme: 'dark',
  autoSave: true,
  soundEnabled: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      localStorage.setItem('i18nextLng', action.payload);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
  },
});

export const { setLanguage, setTheme, setAutoSave, setSoundEnabled } =
  settingsSlice.actions;

export default settingsSlice.reducer;
