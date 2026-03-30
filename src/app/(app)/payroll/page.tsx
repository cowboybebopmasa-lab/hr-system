"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { mockPayrolls } from "@/lib/mock-data";
import type { PayrollRecord } from "@/types";
import { Eye, CheckCircle, Wallet } from "lucide-react";

const statusLabels: Record<PayrollRecord["status"], string> = {
  draft: "下書き", confirmed: "確定", paid: "支払済",
};
const statusVariants: Record<PayrollRecord["status"], "default" | "secondary" | "outline"> = {
  draft: "secondary", confirmed: "default", paid: "outline",
};

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(mockPayrolls);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const handleConfirm = (id: string) => {
    setPayrolls(payrolls.map((p) =>
      p.id === id ? { ...p, status: "confirmed" as const, updatedAt: new Date().toISOString() } : p
    ));
  };

  const handlePay = (id: string) => {
    setPayrolls(payrolls.map((p) =>
      p.id === id ? { ...p, status: "paid" as const, paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : p
    ));
  };

  const fmt = (n: number) => `¥${n.toLocaleString()}`;

  return (
    <>
      <AppHeader title="給与管理" />
      <main className="flex-1 overflow-auto p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">総支給額</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{fmt(payrolls.reduce((s, p) => s + p.grossPay, 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">総控除額</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{fmt(payrolls.reduce((s, p) => s + p.totalDeductions, 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">総手取額</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{fmt(payrolls.reduce((s, p) => s + p.netPay, 0))}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>従業員</TableHead>
                  <TableHead>対象月</TableHead>
                  <TableHead className="text-right">基本給</TableHead>
                  <TableHead className="text-right">総支給</TableHead>
                  <TableHead className="text-right">控除合計</TableHead>
                  <TableHead className="text-right">手取り</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.employeeName}</TableCell>
                    <TableCell>{p.month}</TableCell>
                    <TableCell className="text-right">{fmt(p.baseSalary)}</TableCell>
                    <TableCell className="text-right">{fmt(p.grossPay)}</TableCell>
                    <TableCell className="text-right">{fmt(p.totalDeductions)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(p.netPay)}</TableCell>
                    <TableCell><Badge variant={statusVariants[p.status]}>{statusLabels[p.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="icon" onClick={() => setSelectedPayroll(p)} />}>
                            <Eye className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>{p.employeeName} - {p.month} 給与明細</DialogTitle></DialogHeader>
                            <div className="space-y-4 text-sm">
                              <div>
                                <p className="font-medium mb-2">支給</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground">基本給</span><span className="text-right">{fmt(p.baseSalary)}</span>
                                  <span className="text-muted-foreground">残業手当</span><span className="text-right">{fmt(p.overtimePay)}</span>
                                  <span className="text-muted-foreground">通勤手当</span><span className="text-right">{fmt(p.transportationAllowance)}</span>
                                  <span className="text-muted-foreground">その他手当</span><span className="text-right">{fmt(p.otherAllowances)}</span>
                                  <span className="font-medium">総支給額</span><span className="text-right font-medium">{fmt(p.grossPay)}</span>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium mb-2">控除</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground">健康保険</span><span className="text-right">{fmt(p.healthInsurance)}</span>
                                  <span className="text-muted-foreground">厚生年金</span><span className="text-right">{fmt(p.pensionInsurance)}</span>
                                  <span className="text-muted-foreground">雇用保険</span><span className="text-right">{fmt(p.employmentInsurance)}</span>
                                  <span className="text-muted-foreground">所得税</span><span className="text-right">{fmt(p.incomeTax)}</span>
                                  <span className="text-muted-foreground">住民税</span><span className="text-right">{fmt(p.residentTax)}</span>
                                  <span className="font-medium">控除合計</span><span className="text-right font-medium">{fmt(p.totalDeductions)}</span>
                                </div>
                              </div>
                              <div className="border-t pt-3">
                                <div className="flex justify-between text-lg font-bold">
                                  <span>差引支給額</span><span>{fmt(p.netPay)}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {p.status === "draft" && (
                          <Button variant="ghost" size="icon" onClick={() => handleConfirm(p.id)} title="確定">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {p.status === "confirmed" && (
                          <Button variant="ghost" size="icon" onClick={() => handlePay(p.id)} title="支払処理">
                            <Wallet className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
