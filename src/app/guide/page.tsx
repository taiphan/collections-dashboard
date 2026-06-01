'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/lib/auth-store';
import {
  ShieldCheck,
  Briefcase,
  Phone,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Users,
  GitBranch,
  BarChart3,
  Zap,
  Shield,
  Settings,
  LineChart,
} from 'lucide-react';
import Link from 'next/link';

type RoleKey = 'admin' | 'manager' | 'collector' | 'viewer';

interface RoleGuide {
  key: RoleKey;
  label: string;
  vietnameseLabel: string;
  description: string;
  icon: typeof ShieldCheck;
  color: string;
  badgeClass: string;
  permissions: string[];
  workflows: { title: string; steps: string[]; href?: string; icon: typeof BarChart3 }[];
  tips: string[];
}

const ROLES: Record<RoleKey, RoleGuide> = {
  admin: {
    key: 'admin',
    label: 'Administrator',
    vietnameseLabel: 'Quản trị viên',
    description: 'Toàn quyền cấu hình hệ thống, quản lý người dùng và mô hình ML',
    icon: ShieldCheck,
    color: 'bg-purple-600',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    permissions: [
      'Cấu hình toàn bộ hệ thống và tham số',
      'Quản lý người dùng, phân quyền theo nhóm',
      'Triển khai và giám sát mô hình ML',
      'Xem toàn bộ dữ liệu, báo cáo, audit log',
      'Cấu hình tích hợp hệ thống bên ngoài',
    ],
    workflows: [
      {
        title: 'Thiết lập ban đầu',
        icon: Settings,
        href: '/settings',
        steps: [
          'Cấu hình tham số hệ thống tại trang Cài đặt',
          'Thêm người dùng mới và gán vai trò phù hợp',
          'Cấu hình tích hợp với core banking, CRM, SMS gateway',
          'Thiết lập SLA cho từng nhóm nợ B1-B5',
        ],
      },
      {
        title: 'Quản lý mô hình ML',
        icon: Zap,
        href: '/scoring',
        steps: [
          'Truy cập Mô hình Chấm điểm để xem các model đang chạy',
          'Theo dõi drift, accuracy, AUC của từng mô hình',
          'Phê duyệt triển khai mô hình mới (champion-challenger)',
          'Quản lý phiên bản và rollback khi cần thiết',
        ],
      },
      {
        title: 'Tuân thủ & Audit',
        icon: Shield,
        href: '/compliance',
        steps: [
          'Xem báo cáo tuân thủ theo NHNN, GDPR',
          'Audit log tất cả thao tác critical',
          'Cấu hình retention policy cho dữ liệu',
          'Export báo cáo cho cơ quan quản lý',
        ],
      },
    ],
    tips: [
      'Bật MFA cho tất cả tài khoản admin để bảo mật',
      'Review audit log hàng tuần để phát hiện bất thường',
      'Backup cấu hình trước khi thay đổi tham số quan trọng',
      'Sử dụng môi trường staging để test mô hình mới',
    ],
  },
  manager: {
    key: 'manager',
    label: 'Collection Manager',
    vietnameseLabel: 'Trưởng phòng Thu hồi',
    description: 'Lập chiến lược, phân công nhân sự, theo dõi KPI nhóm',
    icon: Briefcase,
    color: 'bg-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    permissions: [
      'Thiết kế và triển khai chiến lược thu hồi',
      'Phân công hồ sơ cho collectors',
      'Xem báo cáo hiệu suất nhóm và cá nhân',
      'Phê duyệt promise-to-pay, dàn xếp đặc biệt',
      'Cấu hình rules cho decision engine',
    ],
    workflows: [
      {
        title: 'Lập chiến lược thu hồi',
        icon: GitBranch,
        href: '/strategies',
        steps: [
          'Truy cập Chiến lược để xem các template có sẵn',
          'Tạo chiến lược mới: chọn nhóm B1-B5 đối tượng',
          'Cấu hình chuỗi liên hệ: SMS → Email → Call → Visit',
          'Đặt rules tự động: ngày X gửi SMS, ngày Y gọi, etc.',
          'Activate chiến lược, theo dõi tỷ lệ thành công',
        ],
      },
      {
        title: 'Phân công & Theo dõi đội ngũ',
        icon: Users,
        href: '/agents',
        steps: [
          'Vào trang Nhân viên để xem workload từng collector',
          'Gán hồ sơ cho collector dựa trên năng lực và workload',
          'Theo dõi KPI: contact rate, promise rate, recovery rate',
          'Xử lý escalation cases khi collector gặp khó khăn',
        ],
      },
      {
        title: 'Phân tích hiệu suất',
        icon: LineChart,
        href: '/analytics',
        steps: [
          'Mở trang Phân tích để xem dashboard tổng',
          'Compare champion vs challenger strategies',
          'Drill-down theo nhóm nợ, vùng địa lý, loại sản phẩm',
          'Export báo cáo tuần/tháng cho ban giám đốc',
        ],
      },
    ],
    tips: [
      'Chạy challenger A/B test trên 10-20% portfolio trước khi rollout',
      'Theo dõi roll rate B1→B2→B3 để phát hiện sớm vấn đề',
      'Họp 15 phút sáng với team để review hồ sơ ưu tiên',
      'Đảm bảo collectors tuân thủ giờ liên hệ theo quy định NHNN',
    ],
  },
  collector: {
    key: 'collector',
    label: 'Field Collector',
    vietnameseLabel: 'Nhân viên Thu hồi',
    description: 'Liên hệ khách hàng, ghi nhận kết quả, cập nhật trạng thái hồ sơ',
    icon: Phone,
    color: 'bg-amber-600',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    permissions: [
      'Xem danh sách hồ sơ được phân công',
      'Liên hệ khách hàng (call, SMS, email, in-person)',
      'Cập nhật trạng thái: contacted, promised, paid, dispute',
      'Ghi chú chi tiết tương tác với khách hàng',
      'Thực hiện promise-to-pay theo limit cho phép',
    ],
    workflows: [
      {
        title: 'Quy trình hàng ngày',
        icon: Briefcase,
        href: '/cases',
        steps: [
          'Đăng nhập, vào trang Hồ sơ Thu hồi để xem worklist',
          'Sắp xếp theo priority: critical → high → medium → low',
          'Bắt đầu với các hồ sơ B4-B5 cần liên hệ ngay',
          'Click vào từng hồ sơ để xem 360° thông tin khách hàng',
        ],
      },
      {
        title: 'Liên hệ khách hàng',
        icon: Phone,
        href: '/cases',
        steps: [
          'Mở case detail, click "Call Customer"',
          'Theo script được hệ thống gợi ý cho từng nhóm nợ',
          'Sau cuộc gọi: chọn outcome (contacted/no-answer/wrong-number)',
          'Nếu khách hứa trả: ghi promise-to-pay với ngày & số tiền',
          'Nếu cần follow-up: đặt reminder cho ngày tiếp theo',
        ],
      },
      {
        title: 'Cập nhật & Báo cáo',
        icon: CheckCircle2,
        href: '/cases',
        steps: [
          'Cập nhật trạng thái mỗi case: pending/contacted/promised/paid',
          'Ghi note đầy đủ về từng tương tác (cho audit)',
          'Khi khách thanh toán: chuyển status sang "paid"',
          'Cuối ngày: review danh sách promise-to-pay sắp đến hạn',
        ],
      },
    ],
    tips: [
      'Luôn xác minh danh tính khách hàng trước khi tiết lộ thông tin',
      'Tuân thủ giờ liên hệ: 7h-21h ngày thường, không gọi chủ nhật',
      'Ghi note rõ ràng, đầy đủ ngày giờ - audit sẽ kiểm tra',
      'Báo escalation cho manager nếu khách có dấu hiệu gặp khó khăn thực sự',
      'KHÔNG đe dọa, gây áp lực hay xúc phạm khách hàng',
    ],
  },
  viewer: {
    key: 'viewer',
    label: 'Compliance Viewer',
    vietnameseLabel: 'Người xem Tuân thủ',
    description: 'Xem dữ liệu chỉ đọc, kiểm tra tuân thủ, trích xuất báo cáo',
    icon: Eye,
    color: 'bg-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    permissions: [
      'Xem tất cả hồ sơ thu hồi (read-only)',
      'Truy cập báo cáo và phân tích',
      'Xem audit log và compliance reports',
      'Export dữ liệu để báo cáo nội bộ',
      'KHÔNG thể chỉnh sửa dữ liệu',
    ],
    workflows: [
      {
        title: 'Kiểm tra tuân thủ',
        icon: Shield,
        href: '/compliance',
        steps: [
          'Mở trang Tuân thủ để xem dashboard compliance',
          'Review case audit log: ai, làm gì, khi nào',
          'Kiểm tra collector tuân thủ giờ liên hệ',
          'Verify lệnh thu hồi đặc biệt (high-value, dispute)',
        ],
      },
      {
        title: 'Trích xuất báo cáo',
        icon: BarChart3,
        href: '/analytics',
        steps: [
          'Vào trang Phân tích để xem các báo cáo có sẵn',
          'Filter theo period (ngày/tuần/tháng/quý)',
          'Export sang Excel/PDF cho báo cáo nội bộ',
          'Forward cho team Risk hoặc cơ quan quản lý',
        ],
      },
      {
        title: 'Theo dõi KPI',
        icon: LineChart,
        href: '/',
        steps: [
          'Dashboard tổng quan hiển thị các KPI quan trọng',
          'Theo dõi recovery rate, contact rate, promise kept',
          'So sánh hiệu suất so với benchmark ngành',
          'Báo cáo bất thường cho compliance officer',
        ],
      },
    ],
    tips: [
      'Báo cáo vi phạm tuân thủ ngay lập tức cho compliance officer',
      'Kiểm tra ngẫu nhiên 5-10% case mỗi tuần',
      'Lưu evidence trước khi escalate (screenshot, export)',
      'Đảm bảo dữ liệu xuất ra không chứa PII không cần thiết',
    ],
  },
};

const SIDEBAR_GUIDE = [
  { icon: BarChart3, name: 'Tổng quan', desc: 'KPI dashboard tổng portfolio' },
  { icon: Briefcase, name: 'Hồ sơ Thu hồi', desc: 'Worklist hồ sơ, chi tiết khách hàng' },
  { icon: GitBranch, name: 'Chiến lược', desc: 'Thiết kế và quản lý collection strategy' },
  { icon: LineChart, name: 'Phân tích', desc: 'Báo cáo, A/B test, ML insights' },
  { icon: Users, name: 'Nhân viên & Nhóm', desc: 'Quản lý collectors và workload' },
  { icon: Zap, name: 'Mô hình Chấm điểm', desc: 'ML scoring models, drift monitoring' },
  { icon: Shield, name: 'Tuân thủ', desc: 'Audit log, compliance reports' },
  { icon: Settings, name: 'Cài đặt', desc: 'Cấu hình hệ thống, tham số' },
];

export default function GuidePage() {
  const { user } = useAuthStore();
  const [activeRole, setActiveRole] = useState<RoleKey>(
    (user?.role as RoleKey) || 'collector'
  );

  const role = ROLES[activeRole];
  const isCurrentRole = user?.role === activeRole;

  return (
    <>
      <AppHeader title="Hướng dẫn" description="Hướng dẫn sử dụng hệ thống theo vai trò" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E31837]/10">
                  <BookOpen className="h-6 w-6 text-[#E31837]" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">Chào mừng đến FE CREDIT Collection</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hướng dẫn này giúp bạn nắm rõ cách sử dụng hệ thống theo từng vai trò.
                    Chọn vai trò bên dưới để xem hướng dẫn chi tiết.
                  </p>
                  {user && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Bạn đang đăng nhập với vai trò:</span>
                      <Badge className={ROLES[user.role as RoleKey]?.badgeClass + ' border-0'}>
                        {ROLES[user.role as RoleKey]?.vietnameseLabel}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Tabs */}
          <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as RoleKey)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              {(Object.values(ROLES) as RoleGuide[]).map((r) => {
                const Icon = r.icon;
                return (
                  <TabsTrigger key={r.key} value={r.key} className="cursor-pointer gap-2">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">{r.vietnameseLabel}</span>
                    <span className="sm:hidden">{r.label.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(Object.values(ROLES) as RoleGuide[]).map((r) => (
              <TabsContent key={r.key} value={r.key} className="space-y-6">
                {/* Role Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${r.color}`}>
                        <r.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle>{r.vietnameseLabel}</CardTitle>
                          <Badge variant="outline" className="text-[10px]">{r.label}</Badge>
                          {isCurrentRole && (
                            <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-[10px]">
                              Vai trò của bạn
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1.5">{r.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Permissions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      Quyền hạn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {r.permissions.map((perm, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                          <span>{perm}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Workflows */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Quy trình công việc</h3>
                  {r.workflows.map((workflow, i) => {
                    const WorkflowIcon = workflow.icon;
                    return (
                      <Card key={i}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E31837]/10 text-[10px] font-bold text-[#E31837]">
                                {i + 1}
                              </span>
                              <WorkflowIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              {workflow.title}
                            </CardTitle>
                            {workflow.href && (
                              <Link
                                href={workflow.href}
                                className="flex items-center gap-1 text-xs text-[#E31837] hover:underline"
                              >
                                Đi đến trang
                                <ArrowRight className="h-3 w-3" aria-hidden="true" />
                              </Link>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ol className="space-y-2.5 ml-2">
                            {workflow.steps.map((step, j) => (
                              <li key={j} className="flex items-start gap-3 text-sm">
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                  {j + 1}
                                </span>
                                <span className="flex-1">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Tips */}
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      Mẹo & Lưu ý
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {r.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Sidebar Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cấu trúc hệ thống</CardTitle>
              <CardDescription>Tổng quan các trang trong sidebar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {SIDEBAR_GUIDE.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="bg-gradient-to-br from-[#E31837]/5 to-blue-500/5">
            <CardContent className="p-6 text-center">
              <Phone className="mx-auto h-8 w-8 text-[#E31837]" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Cần hỗ trợ thêm?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Liên hệ IT Support hoặc tham khảo tài liệu chi tiết
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                <Badge variant="outline">Hotline: 1900 6535</Badge>
                <Badge variant="outline">Email: it-support@fecredit.com.vn</Badge>
                <Badge variant="outline">Wiki nội bộ: confluence.fecredit.vn</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
