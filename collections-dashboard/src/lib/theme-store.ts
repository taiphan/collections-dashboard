import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColor = 'fecredit' | 'blue' | 'emerald' | 'amber' | 'violet';

export interface ThemeConfig {
  mode: ThemeMode;
  color: ThemeColor;
}

export const THEME_COLORS: Record<ThemeColor, { label: string; primary: string; accent: string }> = {
  fecredit: {
    label: 'FE CREDIT Red',
    primary: 'oklch(0.52 0.22 25)',
    accent: 'oklch(0.55 0.2 250)',
  },
  blue: {
    label: 'VPBank Blue',
    primary: 'oklch(0.546 0.245 262.881)',
    accent: 'oklch(0.681 0.162 75.834)',
  },
  emerald: {
    label: 'Emerald',
    primary: 'oklch(0.577 0.174 142.495)',
    accent: 'oklch(0.681 0.162 75.834)',
  },
  amber: {
    label: 'Amber',
    primary: 'oklch(0.681 0.162 75.834)',
    accent: 'oklch(0.546 0.245 262.881)',
  },
  violet: {
    label: 'Violet',
    primary: 'oklch(0.541 0.281 293.009)',
    accent: 'oklch(0.681 0.162 75.834)',
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
        color: 'fecredit',
      },
      setMode: (mode) => set((state) => ({ config: { ...state.config, mode } })),
      setColor: (color) => set((state) => ({ config: { ...state.config, color } })),
    }),
    {
      name: 'collections-theme-storage',
    }
  )
);
