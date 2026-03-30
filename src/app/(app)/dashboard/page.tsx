"use client";

import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  mockDashboardStats,
  mockContracts,
  mockAttendance,
  mockJobPostings,
  mockEmployees,
  mockPayrolls,
} from "@/lib/mock-data";
import { Users, Briefcase, FileText, Clock, AlertTriangle, Wallet, ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// --- Stat cards with links ---
const statCards = [
  {
    title: "総従業員数",
    value: mockDashboardStats.totalEmployees,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    href: "/employees",
  },
  {
    title: "稼働中アサイン",
    value: mockDashboardStats.activeAssignments,
    icon: Briefcase,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    href: "/contracts",
  },
  {
    title: "契約期限間近",
    value: mockDashboardStats.expiringContracts,
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    href: "/contracts",
  },
  {
    title: "募集中案件",
    value: mockDashboardStats.openPositions,
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    href: "/recruitment",
  },
  {
    title: "出勤率",
    value: `${mockDashboardStats.attendanceRate}%`,
    icon: Clock,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    href: "/attendance",
  },
  {
    title: "未確定給与",
    value: `${mockDashboardStats.pendingPayrolls}件`,
    icon: Wallet,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    href: "/payroll",
  },
];

// --- Chart data ---
const statusCounts = {
  active: mockEmployees.filter((e) => e.status === "active").length,
  on_assignment: mockEmployees.filter((e) => e.status === "on_assignment").length,
  available: mockEmployees.filter((e) => e.status === "available").length,
  inactive: mockEmployees.filter((e) => e.status === "inactive").length,
};

const employeeStatusData = [
  { name: "在籍", value: statusCounts.active, color: "#3b82f6" },
  { name: "稼働中", value: statusCounts.on_assignment, color: "#22c55e" },
  { name: "待機中", value: statusCounts.available, color: "#f59e0b" },
  { name: "退職", value: statusCounts.inactive, color: "#ef4444" },
].filter((d) => d.value > 0);

const attendanceStatusData = (() => {
  const present = mockAttendance.filter((a) => a.status === "present").length;
  const late = mockAttendance.filter((a) => a.status === "late").length;
  const absent = mockAttendance.filter((a) => a.status === "absent").length;
  const paidLeave = mockAttendance.filter((a) => a.status === "paid_leave").length;
  return [
    { name: "出勤", value: present, color: "#22c55e" },
    { name: "遅刻", value: late, color: "#f59e0b" },
    { name: "欠勤", value: absent, color: "#ef4444" },
    { name: "有給", value: paidLeave, color: "#8b5cf6" },
  ].filter((d) => d.value > 0);
})();

const payrollComparisonData = mockPayrolls.map((p) => ({
  name: p.employeeName,
  総支給: p.grossPay,
  控除合計: p.totalDeductions,
  手取り: p.netPay,
}));

const skillsDistribution = (() => {
  const skillMap: Record<string, number> = {};
  mockEmployees.forEach((e) => {
    e.skills.forEach((s) => {
      skillMap[s] = (skillMap[s] || 0) + 1;
    });
  });
  return Object.entries(skillMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
})();

export default function DashboardPage() {
  return (
    <>
      <AppHeader title="ダッシュボード" />
      <main className="flex-1 overflow-auto p-3 space-y-3 md:p-6 md:space-y-6">
        {/* Charts Row - Mobile: compact 2-col grid at top */}
        <div className="grid grid-cols-2 gap-2 md:gap-6 md:grid-cols-2">
          {/* Employee Status Pie Chart */}
          <Card size="sm" className="md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="pb-0 md:pb-auto">
              <CardTitle className="text-xs md:text-base">従業員ステータス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={employeeStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {employeeStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Status Pie Chart */}
          <Card size="sm" className="md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="pb-0 md:pb-auto">
              <CardTitle className="text-xs md:text-base">勤怠ステータス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendanceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skills Distribution Bar Chart */}
          <Card size="sm" className="md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="pb-0 md:pb-auto">
              <CardTitle className="text-xs md:text-base">スキル分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsDistribution} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="人数" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Comparison Bar Chart */}
          <Card size="sm" className="md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="pb-0 md:pb-auto">
              <CardTitle className="text-xs md:text-base">給与比較</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                    <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="総支給" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="控除合計" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="手取り" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid - Compact on mobile (3-col), full on desktop */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-3 lg:grid-cols-6 md:gap-4">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href} className="group">
              <Card size="sm" className="transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/20 cursor-pointer h-full md:[&]:py-4 md:[&]:gap-4">
                <CardHeader className="flex flex-row items-center justify-between pb-0 md:pb-2">
                  <CardTitle className="text-[10px] leading-tight md:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-md p-1 md:p-1.5 ${stat.bgColor}`}>
                    <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-base md:text-2xl font-bold">{stat.value}</div>
                  <div className="hidden md:flex items-center gap-1 mt-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>詳細を見る</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-2 md:gap-6 md:grid-cols-2">
          {/* Expiring Contracts */}
          <Card size="sm" className="md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs md:text-base">契約期限アラート</CardTitle>
              <Link href="/contracts" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1">
                一覧へ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 md:space-y-3">
                {mockContracts
                  .filter((c) => c.status === "expiring_soon")
                  .map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between rounded-lg border p-2 md:p-3">
                      <div>
                        <p className="font-medium text-xs md:text-sm">{contract.employeeName}</p>
                        <p className="text-[10px] md:text-sm text-muted-foreground">{contract.clientCompany}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-[10px] md:text-xs">期限間近</Badge>
                        <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">{contract.endDate}</p>
                      </div>
                    </div>
                  ))}
                {mockContracts.filter((c) => c.status === "expiring_soon").length === 0 && (
                  <p className="text-xs md:text-sm text-muted-foreground">期限間近の契約はありません</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Open Positions */}
          <Card size="sm" className="md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs md:text-base">募集中案件</CardTitle>
              <Link href="/recruitment" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1">
                一覧へ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 md:space-y-3">
                {mockJobPostings
                  .filter((j) => j.status === "open")
                  .map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border p-2 md:p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs md:text-sm truncate">{job.title}</p>
                        <p className="text-[10px] md:text-sm text-muted-foreground">{job.clientCompany}</p>
                      </div>
                      <div className="text-right ml-2">
                        <Badge variant="secondary" className="text-[10px] md:text-xs">{job.matchedCandidates.length}名候補</Badge>
                        <p className="text-[10px] md:text-sm text-muted-foreground mt-0.5">開始: {job.startDate}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card size="sm" className="md:col-span-2 md:[&]:py-4 md:[&]:gap-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xs md:text-base">最近の勤怠記録</CardTitle>
              <Link href="/attendance" className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1">
                一覧へ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 md:space-y-2">
                {mockAttendance.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between rounded-lg border p-1.5 md:p-3">
                    <div className="flex items-center gap-1.5 md:gap-3">
                      <p className="font-medium text-[10px] md:text-sm w-16 md:w-28 truncate">{record.employeeName}</p>
                      <p className="text-[10px] md:text-sm text-muted-foreground">{record.date}</p>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-3">
                      <span className="text-[10px] md:text-sm hidden sm:inline">
                        {record.clockIn || "--:--"} ~ {record.clockOut || "--:--"}
                      </span>
                      <Badge
                        className="text-[10px] md:text-xs"
                        variant={
                          record.status === "present" ? "default" :
                          record.status === "late" ? "destructive" :
                          "secondary"
                        }
                      >
                        {record.status === "present" ? "出勤" :
                         record.status === "late" ? "遅刻" :
                         record.status === "absent" ? "欠勤" :
                         record.status === "paid_leave" ? "有給" :
                         record.status}
                      </Badge>
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
