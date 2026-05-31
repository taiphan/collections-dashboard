import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

export interface ThemeConfig {
  mode: ThemeMode;
  color: ThemeColor;
}

export const THEME_COLORS: Record<ThemeColor, { label: string; primary: string; accent: string }> = {
  blue: {
    label: 'Ocean Blue',
    primary: 'oklch(0.546 0.245 262.881)',
    accent: 'oklch(0.681 0.162 75.834)',
  },
  emerald: {
    label: 'Emerald',
    primary: 'oklch(0.577 0.174 142.495)',
    accent: 'oklch(0.681 0.162 75.834)',
  },
  violet: {
    label: 'Violet',
    primary: 'oklch(0.541 0.281 293.009)',
    accent: 'oklch(0.681 0.162 75.834)',
  },
  amber: {
    label: 'Amber',
    primary: 'oklch(0.681 0.162 75.834)',
    accent: 'oklch(0.546 0.245 262.881)',
  },
  rose: {
    label: 'Rose',
    primary: 'oklch(0.577 0.245 27.325)',
    accent: 'oklch(0.546 0.245 262.881)',
  },
};

interface ThemeState {
  config: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      config: {
        mode: 'dark',
        color: 'blue',
      },
      setMode: (mode) => set((state) => ({ config: { ...state.config, mode } })),
      setColor: (color) => set((state) => ({ config: { ...state.config, color } })),
    }),
    {
      name: 'collections-theme-storage',
    }
  )
);
