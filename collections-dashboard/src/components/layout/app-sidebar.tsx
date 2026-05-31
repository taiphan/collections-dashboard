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
    title: 'Tổng quan',
    href: '/',
    icon: BarChart3,
  },
  {
    title: 'Hồ sơ Thu hồi',
    href: '/cases',
    icon: Briefcase,
  },
  {
    title: 'Chiến lược',
    href: '/strategies',
    icon: GitBranch,
  },
  {
    title: 'Phân tích',
    href: '/analytics',
    icon: LineChart,
  },
];

const managementNavItems = [
  {
    title: 'Nhân viên & Nhóm',
    href: '/agents',
    icon: Users,
  },
  {
    title: 'Mô hình Chấm điểm',
    href: '/scoring',
    icon: Zap,
  },
  {
    title: 'Tuân thủ',
    href: '/compliance',
    icon: Shield,
  },
];

const systemNavItems = [
  {
    title: 'Cài đặt',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Giới thiệu',
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
            <SidebarMenuButton size="lg" tooltip="FE CREDIT Collection">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-700">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">FE CREDIT</span>
                <span className="text-xs text-muted-foreground">Thu hồi Nợ</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Thu hồi Nợ</SidebarGroupLabel>
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
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
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
          <SidebarGroupLabel>Hệ thống</SidebarGroupLabel>
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
            <SidebarMenuButton tooltip="Đăng xuất" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs">Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
