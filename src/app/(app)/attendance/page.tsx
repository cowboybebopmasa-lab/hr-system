"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockAttendance, mockEmployees } from "@/lib/mock-data";
import type { AttendanceRecord } from "@/types";
import { Plus, Clock, Search } from "lucide-react";

const statusLabels: Record<AttendanceRecord["status"], string> = {
  present: "出勤", absent: "欠勤", late: "遅刻",
  early_leave: "早退", holiday: "休日", paid_leave: "有給",
};

const statusVariants: Record<AttendanceRecord["status"], "default" | "secondary" | "destructive" | "outline"> = {
  present: "default", absent: "destructive", late: "destructive",
  early_leave: "secondary", holiday: "outline", paid_leave: "secondary",
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "", date: "", clockIn: "", clockOut: "",
    breakMinutes: "60", status: "present" as AttendanceRecord["status"], notes: "",
  });

  const filtered = records.filter(
    (r) => r.employeeName.includes(search) || r.date.includes(search)
  );

  const handleAdd = () => {
    const emp = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!emp) return;
    const clockInMin = formData.clockIn ? parseInt(formData.clockIn.split(":")[0]) * 60 + parseInt(formData.clockIn.split(":")[1]) : 0;
    const clockOutMin = formData.clockOut ? parseInt(formData.clockOut.split(":")[0]) * 60 + parseInt(formData.clockOut.split(":")[1]) : 0;
    const breakMin = parseInt(formData.breakMinutes) || 0;
    const workMin = Math.max(0, clockOutMin - clockInMin - breakMin);
    const overtimeMin = Math.max(0, workMin - 480);

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: emp.name,
      date: formData.date,
      clockIn: formData.clockIn || undefined,
      clockOut: formData.clockOut || undefined,
      breakMinutes: breakMin,
      workMinutes: workMin,
      overtimeMinutes: overtimeMin,
      status: formData.status,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };
    setRecords([newRecord, ...records]);
    setShowForm(false);
  };

  // Summary calc
  const summaryMap = new Map<string, { present: number; absent: number; late: number; leave: number; totalWork: number; totalOT: number }>();
  records.forEach((r) => {
    const current = summaryMap.get(r.employeeId) || { present: 0, absent: 0, late: 0, leave: 0, totalWork: 0, totalOT: 0 };
    if (r.status === "present") current.present++;
    if (r.status === "absent") current.absent++;
    if (r.status === "late") current.late++;
    if (r.status === "paid_leave") current.leave++;
    current.totalWork += r.workMinutes;
    current.totalOT += r.overtimeMinutes;
    summaryMap.set(r.employeeId, current);
  });

  return (
    <>
      <AppHeader title="勤怠管理" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-3 md:space-y-4">
        <Tabs defaultValue="records">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="records">勤怠記録</TabsTrigger>
              <TabsTrigger value="summary">月次集計</TabsTrigger>
            </TabsList>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />打刻登録
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>勤怠登録</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>従業員</Label>
                    <Select value={formData.employeeId} onValueChange={(v) => v && setFormData({ ...formData, employeeId: v })}>
                      <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                      <SelectContent>
                        {mockEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>日付</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>出勤時刻</Label><Input type="time" value={formData.clockIn} onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })} /></div>
                    <div><Label>退勤時刻</Label><Input type="time" value={formData.clockOut} onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>休憩(分)</Label><Input type="number" value={formData.breakMinutes} onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })} /></div>
                    <div>
                      <Label>ステータス</Label>
                      <Select value={formData.status} onValueChange={(v) => v && setFormData({ ...formData, status: v as AttendanceRecord["status"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">出勤</SelectItem>
                          <SelectItem value="late">遅刻</SelectItem>
                          <SelectItem value="absent">欠勤</SelectItem>
                          <SelectItem value="paid_leave">有給</SelectItem>
                          <SelectItem value="early_leave">早退</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full">登録</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="records" className="mt-4">
            <div className="mb-3 md:mb-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="名前、日付で検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>従業員</TableHead>
                      <TableHead>日付</TableHead>
                      <TableHead>出勤</TableHead>
                      <TableHead>退勤</TableHead>
                      <TableHead>実働</TableHead>
                      <TableHead>残業</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.clockIn || "-"}</TableCell>
                        <TableCell>{r.clockOut || "-"}</TableCell>
                        <TableCell>{r.workMinutes > 0 ? `${Math.floor(r.workMinutes / 60)}h${r.workMinutes % 60}m` : "-"}</TableCell>
                        <TableCell>{r.overtimeMinutes > 0 ? `${Math.floor(r.overtimeMinutes / 60)}h${r.overtimeMinutes % 60}m` : "-"}</TableCell>
                        <TableCell><Badge variant={statusVariants[r.status]}>{statusLabels[r.status]}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>従業員</TableHead>
                      <TableHead>出勤日数</TableHead>
                      <TableHead>欠勤</TableHead>
                      <TableHead>遅刻</TableHead>
                      <TableHead>有給</TableHead>
                      <TableHead>総勤務時間</TableHead>
                      <TableHead>残業時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(summaryMap.entries()).map(([empId, s]) => {
                      const emp = mockEmployees.find((e) => e.id === empId);
                      return (
                        <TableRow key={empId}>
                          <TableCell className="font-medium">{emp?.name || empId}</TableCell>
                          <TableCell>{s.present}日</TableCell>
                          <TableCell>{s.absent}日</TableCell>
                          <TableCell>{s.late}日</TableCell>
                          <TableCell>{s.leave}日</TableCell>
                          <TableCell>{(s.totalWork / 60).toFixed(1)}h</TableCell>
                          <TableCell>{(s.totalOT / 60).toFixed(1)}h</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
