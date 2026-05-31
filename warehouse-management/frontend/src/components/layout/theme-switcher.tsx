import { useThemeStore, type Theme } from '@/stores/theme.store';

const themes: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            theme === t.value
              ? 'bg-background shadow-sm'
              : 'hover:bg-background/50'
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
