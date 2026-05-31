'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useThemeStore, THEME_COLORS, ThemeColor, ThemeMode } from '@/lib/theme-store';
import { Moon, Sun, Monitor, Check, Palette } from 'lucide-react';

const MODES: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Clean light interface' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow OS preference' },
];

export default function SettingsPage() {
  const { config, setMode, setColor } = useThemeStore();

  return (
    <>
      <AppHeader title="Settings" description="Platform configuration" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Theme Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-medium">Mode</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {MODES.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setMode(mode.value)}
                      className={`
                        relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4
                        transition-all duration-200
                        ${config.mode === mode.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      {config.mode === mode.value && (
                        <div className="absolute right-2 top-2">
                          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                        </div>
                      )}
                      <mode.icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm font-medium">{mode.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {mode.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Theme Color */}
              <div>
                <h3 className="mb-3 text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" aria-hidden="true" />
                  Color Theme
                </h3>
                <div className="grid gap-3 sm:grid-cols-5">
                  {(Object.entries(THEME_COLORS) as [ThemeColor, typeof THEME_COLORS[ThemeColor]][]).map(
                    ([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => setColor(key)}
                        className={`
                          relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3
                          transition-all duration-200
                          ${config.color === key
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        {config.color === key && (
                          <div className="absolute right-1.5 top-1.5">
                            <Check className="h-3 w-3 text-primary" aria-hidden="true" />
                          </div>
                        )}
                        <div
                          className="h-6 w-6 rounded-full"
                          style={{ background: theme.primary }}
                          aria-hidden="true"
                        />
                        <span className="text-[10px] font-medium">{theme.label}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform</CardTitle>
              <CardDescription>System information and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Platform</span>
                  <p className="text-sm font-medium">FE CREDIT Collection</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Version</span>
                  <p className="text-sm font-medium">
                    <Badge variant="secondary" className="font-mono">v2.0.0</Badge>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Framework</span>
                  <p className="text-sm font-medium">Next.js 16 + React 19</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Architecture</span>
                  <p className="text-sm font-medium">Microservices (CFF)</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Collection Modules</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Data Enrichment',
                    'Segmentation & Scoring',
                    'Process Management',
                    'Decision Engine',
                    'AI Optimization',
                    'Monitoring & BI',
                    'Advanced Analytics',
                    'Self-Collection Portal',
                  ].map((module) => (
                    <Badge key={module} variant="outline" className="text-xs">
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Data Management</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
