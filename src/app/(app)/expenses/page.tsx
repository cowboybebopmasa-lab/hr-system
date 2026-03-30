"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockExpenses, mockEmployees } from "@/lib/mock-data";
import type { ExpenseRecord } from "@/types";
import { Plus, Search, CheckCircle, XCircle } from "lucide-react";

const categoryLabels: Record<ExpenseRecord["category"], string> = {
  transportation: "交通費", meals: "食事代", supplies: "消耗品",
  communication: "通信費", training: "研修費", other: "その他",
};
const statusLabels: Record<ExpenseRecord["status"], string> = {
  draft: "下書き", submitted: "申請中", approved: "承認済", rejected: "却下",
};
const statusVariants: Record<ExpenseRecord["status"], "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary", submitted: "default", approved: "outline", rejected: "destructive",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(mockExpenses);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "", date: "", category: "transportation" as ExpenseRecord["category"],
    description: "", amount: "", notes: "",
  });

  const filtered = expenses.filter(
    (e) => e.employeeName.includes(search) || e.description.includes(search)
  );

  const handleAdd = () => {
    const emp = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!emp || !formData.amount) return;
    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: emp.name,
      date: formData.date,
      category: formData.category,
      description: formData.description,
      amount: Number(formData.amount),
      status: "draft",
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExpenses([newExpense, ...expenses]);
    setShowForm(false);
    setFormData({ employeeId: "", date: "", category: "transportation", description: "", amount: "", notes: "" });
  };

  const handleApprove = (id: string) => {
    setExpenses(expenses.map((e) => e.id === id ? { ...e, status: "approved" as const, approvedBy: "管理者", updatedAt: new Date().toISOString() } : e));
  };
  const handleReject = (id: string) => {
    setExpenses(expenses.map((e) => e.id === id ? { ...e, status: "rejected" as const, updatedAt: new Date().toISOString() } : e));
  };

  const totalApproved = expenses.filter((e) => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter((e) => e.status === "submitted").reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <AppHeader title="経費管理" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-3 md:space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardHeader className="pb-0 md:pb-2"><CardTitle className="text-[10px] md:text-sm text-muted-foreground">承認済合計</CardTitle></CardHeader>
            <CardContent><p className="text-sm md:text-2xl font-bold">¥{totalApproved.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0 md:pb-2"><CardTitle className="text-[10px] md:text-sm text-muted-foreground">申請中合計</CardTitle></CardHeader>
            <CardContent><p className="text-sm md:text-2xl font-bold">¥{totalPending.toLocaleString()}</p></CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardHeader className="pb-0 md:pb-2"><CardTitle className="text-[10px] md:text-sm text-muted-foreground">総件数</CardTitle></CardHeader>
            <CardContent><p className="text-sm md:text-2xl font-bold">{expenses.length}件</p></CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="従業員名、内容で検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />経費申請
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>経費申請</DialogTitle></DialogHeader>
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
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>日付</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div>
                    <Label>カテゴリ</Label>
                    <Select value={formData.category} onValueChange={(v) => v && setFormData({ ...formData, category: v as ExpenseRecord["category"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>内容</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div><Label>金額（円）</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
                <div><Label>備考</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
                <Button onClick={handleAdd} className="w-full">申請</Button>
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
                  <TableHead>日付</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium whitespace-nowrap">{e.employeeName}</TableCell>
                    <TableCell className="whitespace-nowrap">{e.date}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{categoryLabels[e.category]}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate">{e.description}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">¥{e.amount.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={statusVariants[e.status]}>{statusLabels[e.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      {e.status === "submitted" && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(e.id)} title="承認">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleReject(e.id)} title="却下">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
