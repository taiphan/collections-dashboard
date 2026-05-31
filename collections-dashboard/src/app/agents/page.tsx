'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, UserPlus, Award, Target } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  team: string;
  casesAssigned: number;
  casesResolved: number;
  recoveryRate: number;
  status: 'online' | 'busy' | 'offline';
}

const AGENTS: Agent[] = [
  { id: '1', name: 'Nguyen Minh Tuan', role: 'Senior Collector', team: 'Team Alpha', casesAssigned: 45, casesResolved: 32, recoveryRate: 71, status: 'online' },
  { id: '2', name: 'Tran Thi Lan', role: 'Collector', team: 'Team Alpha', casesAssigned: 38, casesResolved: 22, recoveryRate: 58, status: 'online' },
  { id: '3', name: 'Le Van Duc', role: 'Field Collector', team: 'Team Beta', casesAssigned: 28, casesResolved: 18, recoveryRate: 64, status: 'busy' },
  { id: '4', name: 'Pham Thi Mai', role: 'Team Lead', team: 'Team Beta', casesAssigned: 52, casesResolved: 41, recoveryRate: 79, status: 'online' },
  { id: '5', name: 'Hoang Van Nam', role: 'Legal Specialist', team: 'Legal', casesAssigned: 15, casesResolved: 8, recoveryRate: 53, status: 'offline' },
];

const STATUS_DOT: Record<Agent['status'], string> = {
  online: 'bg-green-500',
  busy: 'bg-amber-500',
  offline: 'bg-gray-400',
};

export default function AgentsPage() {
  const totalCases = AGENTS.reduce((sum, a) => sum + a.casesAssigned, 0);
  const totalResolved = AGENTS.reduce((sum, a) => sum + a.casesResolved, 0);
  const avgRecovery = AGENTS.reduce((sum, a) => sum + a.recoveryRate, 0) / AGENTS.length;

  return (
    <>
      <AppHeader title="Nhân viên & Nhóm" description="Quản lý nhân sự thu hồi" />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{AGENTS.length}</p>
                    <p className="text-xs text-muted-foreground">Active Agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950">
                    <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalCases}</p>
                    <p className="text-xs text-muted-foreground">Cases Assigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950">
                    <Award className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalResolved}</p>
                    <p className="text-xs text-muted-foreground">Cases Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                    <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgRecovery.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Avg Recovery Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agents Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Collection Agents</CardTitle>
                  <CardDescription>Manage team members and workload distribution</CardDescription>
                </div>
                <Button className="cursor-pointer gap-2">
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Add Agent
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Cases</TableHead>
                      <TableHead>Recovery Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AGENTS.map((agent) => (
                      <TableRow key={agent.id} className="cursor-pointer">
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {agent.role}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {agent.team}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {agent.casesResolved}/{agent.casesAssigned}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={agent.recoveryRate} className="h-1.5 w-16" />
                            <span className="text-xs font-medium">{agent.recoveryRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${STATUS_DOT[agent.status]}`} aria-hidden="true" />
                            <span className="text-xs capitalize">{agent.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
