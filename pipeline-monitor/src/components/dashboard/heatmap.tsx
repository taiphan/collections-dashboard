'use client';

import { HeatmapCell, DATA_SOURCES, SEVERITY_COLORS, getSeverity } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';

interface HeatmapProps {
  data: HeatmapCell[];
}

function getHeatmapBg(severity: HeatmapCell['severity']): string {
  const map = {
    good: 'bg-green-200 dark:bg-green-800',
    warning: 'bg-amber-200 dark:bg-amber-700',
    danger: 'bg-orange-300 dark:bg-orange-700',
    critical: 'bg-red-400 dark:bg-red-700',
  };
  return map[severity];
}

export function Heatmap({ data }: HeatmapProps) {
  // Get unique dates sorted
  const dates = [...new Set(data.map((d) => d.date))].sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Flow Heatmap</CardTitle>
        <CardDescription>
          Difference % between BOD source and Pega — darker = larger gap
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">Severity:</span>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-800" aria-hidden="true" />
              <span>≤1%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-amber-200 dark:bg-amber-700" aria-hidden="true" />
              <span>1-3%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-orange-300 dark:bg-orange-700" aria-hidden="true" />
              <span>3-5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-red-400 dark:bg-red-700" aria-hidden="true" />
              <span>&gt;5%</span>
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="overflow-x-auto">
            <table className="w-full" role="grid" aria-label="Pipeline data flow heatmap">
              <thead>
                <tr>
                  <th className="pb-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                    Source
                  </th>
                  {dates.map((date) => (
                    <th
                      key={date}
                      className="pb-2 px-1 text-center text-xs font-medium text-muted-foreground"
                    >
                      {format(parseISO(date), 'MM/dd')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DATA_SOURCES.map((source) => (
                  <tr key={source}>
                    <td className="py-1 pr-3 text-sm font-medium whitespace-nowrap">
                      {source}
                    </td>
                    {dates.map((date) => {
                      const cell = data.find(
                        (d) => d.date === date && d.source === source
                      );
                      const value = cell?.value || 0;
                      const severity = cell?.severity || getSeverity(0);

                      return (
                        <td key={`${source}-${date}`} className="px-1 py-1">
                          <Tooltip>
                            <TooltipTrigger
                              className={`
                                flex h-10 w-full min-w-[48px] cursor-pointer items-center justify-center
                                rounded-md text-xs font-mono font-medium
                                transition-all duration-200 hover:scale-105 hover:shadow-md
                                ${getHeatmapBg(severity)}
                              `}
                              role="gridcell"
                              aria-label={`${source} on ${format(parseISO(date), 'MMM d')}: ${value.toFixed(2)}% difference`}
                            >
                              {value.toFixed(1)}%
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-medium">{source} — {format(parseISO(date), 'MMM d, yyyy')}</p>
                                <p>Difference: {value.toFixed(2)}%</p>
                                <p className="capitalize">Status: {severity}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
