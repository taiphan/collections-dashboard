'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/auth-store';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Trưởng phòng Thu hồi',
  collector: 'Nhân viên Thu hồi',
  viewer: 'Người xem Tuân thủ',
};

const ROLE_TIPS: Record<string, string> = {
  admin: 'Bắt đầu bằng việc cấu hình hệ thống và phân quyền người dùng.',
  manager: 'Xem worklist nhóm và thiết kế chiến lược thu hồi mới.',
  collector: 'Mở Hồ sơ Thu hồi để xem danh sách khách hàng cần liên hệ hôm nay.',
  viewer: 'Truy cập Phân tích để xem báo cáo và Tuân thủ để kiểm tra audit log.',
};

const STORAGE_KEY = 'collections-welcome-dismissed';

export function WelcomeBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    const key = `${STORAGE_KEY}:${user.id}`;
    setDismissed(localStorage.getItem(key) === '1');
  }, [user]);

  const handleDismiss = () => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEY}:${user.id}`, '1');
    setDismissed(true);
  };

  if (dismissed || !user) return null;

  const roleLabel = ROLE_LABELS[user.role] || user.role;
  const tip = ROLE_TIPS[user.role] || 'Khám phá hệ thống qua trang Hướng dẫn.';

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-[#E31837]/5 via-background to-blue-500/5 p-5">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-[#E31837]/10 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E31837] shadow-md">
          <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                Chào {user.name}, chào mừng đến FE CREDIT Collection
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Bạn đang đăng nhập với vai trò <strong className="text-foreground">{roleLabel}</strong>. {tip}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Đóng banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-8 cursor-pointer gap-1.5 text-xs" render={<Link href="/guide" />}>
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Xem hướng dẫn cho vai trò của bạn
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="h-8 cursor-pointer text-xs"
            >
              Bỏ qua
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
