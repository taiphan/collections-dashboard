'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from './theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';

interface AppHeaderProps {
  title?: string;
  description?: string;
}

export function AppHeader({ title, description }: AppHeaderProps) {
  const { user } = useAuthStore();

  return (
    <div className="shrink-0">
      {/* Red accent stripe — FE CREDIT brand identity */}
      <div className="h-1 bg-[#E31837]" />

      <header className="flex h-14 items-center gap-2 border-b bg-card px-4">
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

        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Tìm kiếm..."
              className="h-8 w-48 pl-8 text-xs"
              aria-label="Tìm kiếm"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 cursor-pointer"
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            <Badge
              className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full p-0 text-[10px]"
              variant="destructive"
            >
              3
            </Badge>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User avatar */}
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E31837]/10 border border-[#E31837]/20">
              <span className="text-[10px] font-semibold text-[#E31837]">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="hidden text-xs font-medium sm:inline">{user?.name}</span>
          </div>
        </div>
      </header>
    </div>
  );
}
