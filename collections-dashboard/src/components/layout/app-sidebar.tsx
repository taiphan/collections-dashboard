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
  Phone,
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E31837] shadow-md">
                <span className="text-[10px] font-black text-white leading-none">FC</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-bold tracking-tight text-sidebar-foreground">
                  FE CREDIT
                </span>
                <span className="text-[10px] text-sidebar-foreground/60">
                  Hệ thống Thu hồi Nợ
                </span>
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

        {/* Hotline — matching fecredit.com.vn footer */}
        <div className="mt-auto px-4 pb-2">
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/70">
              <Phone className="h-3 w-3" aria-hidden="true" />
              <span>Hotline: <strong className="text-sidebar-foreground">1900 6535</strong></span>
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={user?.name || 'User'}>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E31837]/10 border border-[#E31837]/20">
                <User className="h-3 w-3 text-[#E31837]" aria-hidden="true" />
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
