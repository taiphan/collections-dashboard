'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle2, AlertTriangle, Clock, FileText } from 'lucide-react';

export default function CompliancePage() {
  return (
    <>
      <AppHeader title="Compliance" description="Audit & regulatory compliance" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Compliance Score */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">96%</p>
                    <p className="text-xs text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">142</p>
                    <p className="text-xs text-muted-foreground">Audits Passed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Pending Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">28</p>
                    <p className="text-xs text-muted-foreground">Active Policies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Areas</CardTitle>
              <CardDescription>
                Regulatory compliance status across collection operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { area: 'Data Protection (GDPR/CCPA)', score: 98, status: 'compliant' },
                { area: 'Fair Debt Collection Practices', score: 95, status: 'compliant' },
                { area: 'Communication Frequency Limits', score: 100, status: 'compliant' },
                { area: 'Consent Management', score: 92, status: 'compliant' },
                { area: 'Audit Trail Completeness', score: 88, status: 'review' },
                { area: 'Strategy Peer Review (4-Eyes)', score: 96, status: 'compliant' },
                { area: 'Decision Explainability', score: 85, status: 'review' },
              ].map((item) => (
                <div key={item.area} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.area}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{item.score}%</span>
                      <Badge
                        className={`border-0 text-[10px] ${
                          item.status === 'compliant'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {item.status === 'compliant' ? 'Compliant' : 'Under Review'}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={item.score} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Audit Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Audit Events</CardTitle>
              <CardDescription>Latest compliance-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: 'Strategy "Early Soft Reminder" approved via 4-eyes review', time: '2h ago', type: 'approval' },
                  { event: 'Decision engine audit log exported for Q2 review', time: '5h ago', type: 'export' },
                  { event: 'Communication frequency limit triggered for ACC-234', time: '1d ago', type: 'limit' },
                  { event: 'New collection policy v2.3 deployed to production', time: '2d ago', type: 'deployment' },
                  { event: 'Consent refresh completed for 1,200 accounts', time: '3d ago', type: 'consent' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{item.event}</p>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
