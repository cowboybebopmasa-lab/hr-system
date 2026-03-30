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
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats Grid - Clickable Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((stat) => (
            <Link key={stat.title} href={stat.href} className="group">
              <Card className="transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-primary/20 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-md p-1.5 ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>詳細を見る</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Employee Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">従業員ステータス分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={employeeStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}名`}
                    >
                      {employeeStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">勤怠ステータス分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}件`}
                    >
                      {attendanceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Skills Distribution Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">スキル分布（上位8件）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsDistribution} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="人数" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">給与比較</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                    <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="総支給" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="控除合計" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="手取り" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Expiring Contracts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">契約期限アラート</CardTitle>
              <Link href="/contracts" className="text-sm text-primary hover:underline flex items-center gap-1">
                一覧へ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockContracts
                  .filter((c) => c.status === "expiring_soon")
                  .map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{contract.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{contract.clientCompany}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">期限間近</Badge>
                        <p className="text-sm text-muted-foreground mt-1">{contract.endDate}</p>
                      </div>
                    </div>
                  ))}
                {mockContracts.filter((c) => c.status === "expiring_soon").length === 0 && (
                  <p className="text-sm text-muted-foreground">期限間近の契約はありません</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Open Positions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">募集中案件</CardTitle>
              <Link href="/recruitment" className="text-sm text-primary hover:underline flex items-center gap-1">
                一覧へ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockJobPostings
                  .filter((j) => j.status === "open")
                  .map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.clientCompany}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{job.matchedCandidates.length}名候補</Badge>
                        <p className="text-sm text-muted-foreground mt-1">開始: {job.startDate}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">最近の勤怠記録</CardTitle>
              <Link href="/attendance" className="text-sm text-primary hover:underline flex items-center gap-1">
                一覧へ <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockAttendance.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-sm w-28">{record.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{record.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {record.clockIn || "--:--"} ~ {record.clockOut || "--:--"}
                      </span>
                      <Badge
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
