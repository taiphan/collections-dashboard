'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { AlertCircle } from 'lucide-react';

const DEMO_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Quản trị viên',
    role: 'Administrator · IT Dept',
    initials: 'QA',
    color: 'bg-purple-600',
  },
  {
    username: 'manager',
    password: 'manager123',
    name: 'Phạm Thị Mai',
    role: 'Collection Manager · Recovery Dept',
    initials: 'PM',
    color: 'bg-blue-600',
  },
  {
    username: 'collector',
    password: 'collector123',
    name: 'Nguyễn Minh Tuấn',
    role: 'Senior Collector · Field Ops',
    initials: 'NT',
    color: 'bg-amber-600',
  },
  {
    username: 'viewer',
    password: 'viewer123',
    name: 'Lê Văn Đức',
    role: 'Compliance Viewer · Risk Dept',
    initials: 'LD',
    color: 'bg-emerald-600',
  },
];

export function LoginForm() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = login(username.trim(), password);
      if (!result.success) {
        setError(result.error || 'Đăng nhập thất bại');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — FE CREDIT branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#E31837] via-[#c41530] to-[#8b0a1f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-lg">
              FC
            </div>
            <div>
              <span className="text-lg font-bold">FE CREDIT</span>
              <p className="text-[10px] text-red-100 opacity-80">VPB SMBC Finance Company</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Hệ thống Quản lý<br />Thu hồi Nợ
            </h2>
            <p className="text-red-100 text-sm leading-relaxed max-w-md">
              Nền tảng thu hồi nợ đa kênh — Quản lý hồ sơ B1-B5, chiến lược thu hồi
              thông minh, phân tích AI/ML. Phục vụ hơn 13 triệu khách hàng FE CREDIT.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Stat label="Tỷ lệ thu hồi" value="72%" />
              <Stat label="Hồ sơ đang xử lý" value="850+" />
              <Stat label="Thời gian liên hệ" value="<24h" />
              <Stat label="Đội ngũ thu hồi" value="120+" />
            </div>
          </div>

          <p className="text-red-200 text-xs">
            © 2026 VPB SMBC Finance · Hiện thực hóa hàng triệu ước mơ
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[#E31837] flex items-center justify-center">
                <span className="text-sm font-black text-white">FC</span>
              </div>
              <span className="font-semibold">FE CREDIT Collection</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Đăng nhập để truy cập hệ thống quản lý thu hồi nợ
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" aria-hidden="true" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-[13px] font-medium">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full h-10 px-3.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder="admin"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[13px] font-medium">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full h-10 px-3.5 bg-background border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
                placeholder="Nhập mật khẩu"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t">
            <p className="text-[12px] font-medium text-muted-foreground mb-3">
              Tài khoản Demo
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.username}
                  type="button"
                  onClick={() => {
                    setUsername(user.username);
                    setPassword(user.password);
                    setError('');
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${user.color}`}>
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.role}</p>
                  </div>
                  <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded hidden sm:block">
                    {user.username}
                  </code>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              Mật khẩu cho mỗi tài khoản: <code className="px-1 py-0.5 bg-muted rounded">{'<role>'}123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-white/10 backdrop-blur">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-red-100">{label}</p>
    </div>
  );
}
