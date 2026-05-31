'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from './theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  title?: string;
  description?: string;
}

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="cursor-pointer" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {title && (
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">{title}</h1>
          {description && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              — {description}
            </span>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <Badge
            className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full p-0 text-[10px]"
            variant="destructive"
          >
            3
          </Badge>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
