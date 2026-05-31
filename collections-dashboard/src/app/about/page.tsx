'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { APP_VERSION, CHANGELOG } from '@/lib/version';
import { GitCommit, Calendar, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <AppHeader title="Giới thiệu" description="Thông tin nền tảng & lịch sử phiên bản" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Platform Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold">FE CREDIT Collection</h1>
                  <p className="text-sm text-muted-foreground">
                    Nền tảng quản lý thu hồi nợ đa kênh — VPB SMBC Finance Company
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      v{APP_VERSION}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Production
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tính năng Nền tảng</CardTitle>
              <CardDescription>
                Quản lý thu hồi nợ toàn diện — từ phân khúc đến tối ưu hóa chiến lược
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Làm giàu & Xác thực Dữ liệu',
                    description: 'Tích hợp dữ liệu bên ngoài, làm giàu danh mục, chấm điểm chất lượng',
                  },
                  {
                    title: 'Phân khúc & Chấm điểm Khách hàng',
                    description: 'Phân cụm ML, dự đoán tự trả, mô hình roll rate',
                  },
                  {
                    title: 'Quản lý Quy trình',
                    description: 'Tự động hóa workflow, CTI, ứng dụng di động, cổng tự thu hồi',
                  },
                  {
                    title: 'Công cụ Quyết định',
                    description: 'Thiết kế chiến lược no-code, quyết định real-time, giải thích được',
                  },
                  {
                    title: 'Tối ưu hóa AI',
                    description: 'Lập kế hoạch nhân sự, mô phỏng what-if, tối ưu ràng buộc',
                  },
                  {
                    title: 'Giám sát & BI',
                    description: 'Champion-challenger, tối ưu chiến lược, bảng điều khiển hiệu suất',
                  },
                  {
                    title: 'Phân tích Nâng cao',
                    description: 'Đánh giá rủi ro, mô hình dự đoán, làm giàu Open Banking',
                  },
                  {
                    title: 'Giao diện Đa chủ đề',
                    description: 'Chủ đề FE CREDIT, chế độ sáng/tối, thiết kế accessible',
                  },
                ].map((capability) => (
                  <div key={capability.title} className="rounded-lg border p-3">
                    <h3 className="text-sm font-medium">{capability.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Changelog */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lịch sử Phiên bản</CardTitle>
              <CardDescription>Ghi chú phát hành và cập nhật</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {CHANGELOG.map((entry, index) => (
                  <div key={entry.version}>
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <GitCommit className="h-4 w-4 text-primary" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            v{entry.version}
                          </Badge>
                          <span className="text-sm font-semibold">{entry.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {entry.date}
                        </div>
                        <ul className="mt-3 space-y-1.5">
                          {entry.changes.map((change, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400"
                                aria-hidden="true"
                              />
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tham khảo</CardTitle>
              <CardDescription>
                Nền tảng được xây dựng dựa trên các giải pháp hàng đầu ngành
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Hệ thống thu hồi nợ FE CREDIT được thiết kế theo tiêu chuẩn quốc tế,
                  tích hợp công nghệ AI/ML hiện đại cho tài chính tiêu dùng Việt Nam.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'FE CREDIT',
                    'VPB SMBC FC',
                    'Consumer Finance',
                    'Next.js 16',
                    'React 19',
                    'shadcn/ui',
                    'Tailwind CSS 4',
                    'Zustand',
                    'Recharts',
                  ].map((ref) => (
                    <Badge key={ref} variant="outline" className="text-[10px]">
                      {ref}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
