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
    label: 'FE CREDIT',
    primary: '#E31837',
    accent: '#1e3a5f',
  },
  blue: {
    label: 'VPBank Blue',
    primary: '#1e3a5f',
    accent: '#E31837',
  },
  emerald: {
    label: 'Emerald',
    primary: '#10b981',
    accent: '#1e3a5f',
  },
  amber: {
    label: 'Amber',
    primary: '#f59e0b',
    accent: '#1e3a5f',
  },
  violet: {
    label: 'Violet',
    primary: '#8b5cf6',
    accent: '#E31837',
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
        mode: 'light',
        color: 'fecredit',
      },
      setMode: (mode) => set((state) => ({ config: { ...state.config, mode } })),
      setColor: (color) => set((state) => ({ config: { ...state.config, color } })),
    }),
    {
      name: 'collection-portal-theme',
    }
  )
);
