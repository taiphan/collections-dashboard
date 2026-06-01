'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/auth-store';
import { canAccessRoute } from '@/lib/permissions';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Trưởng phòng Thu hồi',
  collector: 'Nhân viên Thu hồi',
  viewer: 'Người xem Tuân thủ',
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Always allow if no user (login page handles auth)
  if (!user) return <>{children}</>;

  if (canAccessRoute(user.role, pathname)) {
    return <>{children}</>;
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-bold tracking-tight">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vai trò hiện tại của bạn không có quyền xem trang này.
            Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground">Đường dẫn:</span>
            <code className="rounded bg-muted px-2 py-1 font-mono">{pathname}</code>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Vai trò:</span>
            <Badge variant="outline" className="text-[10px]">
              {ROLE_LABELS[user.role] || user.role}
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button size="sm" className="cursor-pointer gap-2" render={<Link href="/" />}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Về trang chủ
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2"
              render={<Link href="/guide" />}
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Xem quyền hạn của bạn
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
