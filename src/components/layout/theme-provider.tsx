'use client';

import { useEffect } from 'react';
import { useThemeStore, THEME_COLORS } from '@/lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { config } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    // Handle mode
    if (config.mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);

      const listener = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
      };
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    } else {
      root.classList.toggle('dark', config.mode === 'dark');
    }
  }, [config.mode]);

  useEffect(() => {
    const root = document.documentElement;
    const themeColors = THEME_COLORS[config.color];

    root.style.setProperty('--theme-primary', themeColors.primary);
    root.style.setProperty('--theme-accent', themeColors.accent);
  }, [config.color]);

  return <>{children}</>;
}
