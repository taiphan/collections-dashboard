'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeStore, ThemeMode } from '@/lib/theme-store';

const modes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle() {
  const { config, setMode } = useThemeStore();
  const currentMode = modes.find((m) => m.value === config.mode) || modes[1];
  const Icon = currentMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            aria-label="Toggle theme"
          >
            <Icon className="h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {modes.map((mode) => (
          <DropdownMenuItem
            key={mode.value}
            onClick={() => setMode(mode.value)}
            className="cursor-pointer gap-2"
          >
            <mode.icon className="h-4 w-4" aria-hidden="true" />
            {mode.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
