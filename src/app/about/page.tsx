'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { APP_VERSION, CHANGELOG } from '@/lib/version';
import { BarChart3, GitCommit, Calendar, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <AppHeader title="About" description="Platform information & changelog" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Platform Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <BarChart3 className="h-7 w-7 text-primary-foreground" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Collection Portal</h1>
                  <p className="text-sm text-muted-foreground">
                    FE CREDIT · VPB SMBC Finance Company
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
              <CardTitle className="text-base">Platform Capabilities</CardTitle>
              <CardDescription>
                Inspired by CRIF Digital — end-to-end collection management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Data Enrichment & Validation',
                    description: 'External data integration, portfolio enrichment, quality scoring',
                  },
                  {
                    title: 'Customer Segmentation & Scoring',
                    description: 'ML-driven persona clustering, self-cure prediction, roll rate models',
                  },
                  {
                    title: 'Process Management',
                    description: 'Workflow automation, CTI, mobile app, self-collection portal',
                  },
                  {
                    title: 'Decision Engine',
                    description: 'No-code strategy designer, real-time decisioning, explainability',
                  },
                  {
                    title: 'AI Optimization',
                    description: 'Workforce planning, what-if simulation, constraint optimization',
                  },
                  {
                    title: 'Monitoring & BI',
                    description: 'Champion-challenger, strategy optimizer, performance dashboards',
                  },
                  {
                    title: 'Advanced Analytics',
                    description: 'Risk assessment, predictive models, Open Banking enrichment',
                  },
                  {
                    title: 'Multi-Theme Support',
                    description: '5 color themes, dark/light/system modes, accessible design',
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
              <CardTitle className="text-base">Changelog</CardTitle>
              <CardDescription>Version history and release notes</CardDescription>
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
              <CardTitle className="text-base">References</CardTitle>
              <CardDescription>
                Platform design inspired by industry-leading solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  This platform is built for FE CREDIT&apos;s collection operations,
                  integrating modern AI/ML technology for consumer finance in Vietnam.
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
