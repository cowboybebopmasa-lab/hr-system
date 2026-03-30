"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { mockContracts, mockEmployees } from "@/lib/mock-data";
import type { Contract } from "@/types";
import { Plus, Search, AlertTriangle } from "lucide-react";

const statusLabels: Record<Contract["status"], string> = {
  active: "有効", expiring_soon: "期限間近", expired: "期限切れ", terminated: "解約",
};
const statusVariants: Record<Contract["status"], "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", expiring_soon: "destructive", expired: "outline", terminated: "secondary",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "", clientCompany: "", role: "",
    startDate: "", endDate: "", hourlySalary: "", billingRate: "", notes: "",
  });

  const filtered = contracts.filter(
    (c) => c.employeeName.includes(search) || c.clientCompany.includes(search)
  );

  const handleAdd = () => {
    const emp = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!emp) return;
    const newContract: Contract = {
      id: `con-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: emp.name,
      clientCompany: formData.clientCompany,
      startDate: formData.startDate,
      endDate: formData.endDate,
      role: formData.role,
      hourlySalary: Number(formData.hourlySalary),
      billingRate: Number(formData.billingRate),
      status: "active",
      alertSentDays: [],
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setContracts([newContract, ...contracts]);
    setShowForm(false);
  };

  const daysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <AppHeader title="契約管理" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-3 md:space-y-4">
        {/* Alert banner */}
        {contracts.some((c) => c.status === "expiring_soon") && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-orange-800">
                契約期限が30日以内の契約が {contracts.filter((c) => c.status === "expiring_soon").length} 件あります。更新対応をご確認ください。
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="従業員名、企業名で検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />新規契約
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>新規契約登録</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>従業員</Label>
                  <Select value={formData.employeeId} onValueChange={(v) => v && setFormData({ ...formData, employeeId: v })}>
                    <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>派遣先企業</Label><Input value={formData.clientCompany} onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })} /></div>
                <div><Label>役割</Label><Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>開始日</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
                  <div><Label>終了日</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>時給(円)</Label><Input type="number" value={formData.hourlySalary} onChange={(e) => setFormData({ ...formData, hourlySalary: e.target.value })} /></div>
                  <div><Label>請求単価(円)</Label><Input type="number" value={formData.billingRate} onChange={(e) => setFormData({ ...formData, billingRate: e.target.value })} /></div>
                </div>
                <div><Label>備考</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
                <Button onClick={handleAdd} className="w-full">登録</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>派遣先</TableHead>
                  <TableHead>役割</TableHead>
                  <TableHead>契約期間</TableHead>
                  <TableHead>残日数</TableHead>
                  <TableHead className="text-right">時給</TableHead>
                  <TableHead className="text-right">請求単価</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const days = daysUntilExpiry(c.endDate);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.employeeName}</TableCell>
                      <TableCell>{c.clientCompany}</TableCell>
                      <TableCell>{c.role}</TableCell>
                      <TableCell className="text-sm">{c.startDate} ~ {c.endDate}</TableCell>
                      <TableCell>
                        <span className={days <= 30 ? "text-red-600 font-medium" : ""}>
                          {days > 0 ? `${days}日` : "期限切れ"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">¥{c.hourlySalary.toLocaleString()}</TableCell>
                      <TableCell className="text-right">¥{c.billingRate.toLocaleString()}</TableCell>
                      <TableCell><Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
