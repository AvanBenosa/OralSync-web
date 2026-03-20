import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaletteMode } from '@mui/material';

type ThemeState = {
  mode: PaletteMode;
  toggleColorMode: () => void;
  setColorMode: (mode: PaletteMode) => void;
  resetColorMode: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleColorMode: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
      setColorMode: (mode) => set({ mode }),
      resetColorMode: () => set({ mode: 'light' }),
    }),
    {
      name: 'dmd-theme-mode',
    }
  )
);

