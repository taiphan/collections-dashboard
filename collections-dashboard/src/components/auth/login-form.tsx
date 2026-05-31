'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const result = login(username.trim(), password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-red-50/30 dark:to-red-950/10 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Title — matching fecredit.com.vn brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/20">
            <span className="text-lg font-black text-white leading-none">FC</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FE CREDIT</h1>
            <p className="text-sm text-muted-foreground">Hệ thống Quản lý Thu hồi Nợ</p>
            <p className="mt-1 text-[11px] text-muted-foreground/70 italic">
              &ldquo;Hiện thực hóa hàng triệu ước mơ&rdquo;
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập thông tin đăng nhập để truy cập hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full cursor-pointer gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Đang đăng nhập...
                  </span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground">
              Tài khoản Demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { user: 'admin', pass: 'admin123', role: 'Admin' },
                { user: 'manager', pass: 'manager123', role: 'Manager' },
                { user: 'collector', pass: 'collector123', role: 'Collector' },
                { user: 'viewer', pass: 'viewer123', role: 'Viewer' },
              ].map((cred) => (
                <button
                  key={cred.user}
                  type="button"
                  onClick={() => {
                    setUsername(cred.user);
                    setPassword(cred.pass);
                    setError('');
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium">{cred.user}</p>
                    <p className="text-[10px] text-muted-foreground">{cred.pass}</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px]">
                    {cred.role}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer — matching fecredit.com.vn */}
        <p className="text-center text-[10px] text-muted-foreground/60">
          © {new Date().getFullYear()} VPB SMBC Finance Company Limited (FE CREDIT).
          Mọi quyền được bảo lưu.
        </p>
      </div>
    </div>
  );
}
