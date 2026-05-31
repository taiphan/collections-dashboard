'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  GitBranch,
  LineChart,
  Settings,
  Users,
  Shield,
  Zap,
  Info,
  LogOut,
  User,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { APP_VERSION } from '@/lib/version';
import { useAuthStore } from '@/lib/auth-store';

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: BarChart3,
  },
  {
    title: 'Cases',
    href: '/cases',
    icon: Briefcase,
  },
  {
    title: 'Strategies',
    href: '/strategies',
    icon: GitBranch,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: LineChart,
  },
];

const managementNavItems = [
  {
    title: 'Agents & Teams',
    href: '/agents',
    icon: Users,
  },
  {
    title: 'Scoring Models',
    href: '/scoring',
    icon: Zap,
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: Shield,
  },
];

const systemNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'About',
    href: '/about',
    icon: Info,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="CLever Collection Hub">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">CLever</span>
                <span className="text-xs text-muted-foreground">Collection Hub</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Collection</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={user?.name || 'User'}>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <User className="h-3 w-3 text-primary" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0 leading-none">
                <span className="text-xs font-medium">{user?.name}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{user?.role}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
