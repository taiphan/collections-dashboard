import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FE CREDIT Collection — Hệ thống Quản lý Thu hồi Nợ',
  description: 'Nền tảng quản lý thu hồi nợ đa kênh cho FE CREDIT. Theo dõi hồ sơ, chiến lược thu hồi, phân tích hiệu suất.',
  keywords: ['FE CREDIT', 'thu hồi nợ', 'collection', 'VPB SMBC FC', 'tài chính tiêu dùng'],
  authors: [{ name: 'FE CREDIT Technology' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
