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
import { Eye, CheckCircle, Wallet, FileDown } from "lucide-react";

const statusLabels: Record<PayrollRecord["status"], string> = {
  draft: "下書き", confirmed: "確定", paid: "支払済",
};
const statusVariants: Record<PayrollRecord["status"], "default" | "secondary" | "outline"> = {
  draft: "secondary", confirmed: "default", paid: "outline",
};

// --- PDF生成（ブラウザ印刷API利用） ---
function generatePayrollPdf(p: PayrollRecord) {
  const fmt = (n: number) => `¥${n.toLocaleString()}`;
  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>給与明細 - ${p.employeeName} ${p.month}</title>
<style>
  body { font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif; margin: 40px; color: #333; }
  h1 { text-align: center; font-size: 22px; border-bottom: 3px double #333; padding-bottom: 10px; }
  .info { display: flex; justify-content: space-between; margin: 20px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; }
  th { background: #f5f5f5; text-align: left; width: 40%; }
  td { text-align: right; }
  .section-title { background: #333; color: #fff; padding: 6px 12px; font-size: 13px; font-weight: bold; margin-top: 20px; }
  .total-row th, .total-row td { background: #f0f0f0; font-weight: bold; font-size: 15px; }
  .grand-total { text-align: center; font-size: 20px; font-weight: bold; margin-top: 20px; padding: 15px; border: 2px solid #333; }
  .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #999; }
  @media print { body { margin: 20px; } }
</style></head>
<body>
  <h1>給 与 明 細 書</h1>
  <div class="info">
    <div><strong>${p.employeeName}</strong> 様</div>
    <div>${p.month} 分</div>
  </div>

  <div class="section-title">支 給</div>
  <table>
    <tr><th>基本給</th><td>${fmt(p.baseSalary)}</td></tr>
    <tr><th>残業手当</th><td>${fmt(p.overtimePay)}</td></tr>
    <tr><th>通勤手当</th><td>${fmt(p.transportationAllowance)}</td></tr>
    <tr><th>その他手当</th><td>${fmt(p.otherAllowances)}</td></tr>
    <tr class="total-row"><th>総支給額</th><td>${fmt(p.grossPay)}</td></tr>
  </table>

  <div class="section-title">控 除</div>
  <table>
    <tr><th>健康保険</th><td>${fmt(p.healthInsurance)}</td></tr>
    <tr><th>厚生年金</th><td>${fmt(p.pensionInsurance)}</td></tr>
    <tr><th>雇用保険</th><td>${fmt(p.employmentInsurance)}</td></tr>
    <tr><th>所得税</th><td>${fmt(p.incomeTax)}</td></tr>
    <tr><th>住民税</th><td>${fmt(p.residentTax)}</td></tr>
    ${p.otherDeductions > 0 ? `<tr><th>その他控除</th><td>${fmt(p.otherDeductions)}</td></tr>` : ""}
    <tr class="total-row"><th>控除合計</th><td>${fmt(p.totalDeductions)}</td></tr>
  </table>

  <div class="grand-total">差引支給額　${fmt(p.netPay)}</div>

  <div class="footer">
    発行日: ${new Date().toLocaleDateString("ja-JP")} ｜ HR管理システム
  </div>
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(mockPayrolls);

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
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-3 md:space-y-4">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardHeader className="pb-0 md:pb-2"><CardTitle className="text-[10px] md:text-sm text-muted-foreground">総支給額</CardTitle></CardHeader>
            <CardContent><p className="text-sm md:text-2xl font-bold">{fmt(payrolls.reduce((s, p) => s + p.grossPay, 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0 md:pb-2"><CardTitle className="text-[10px] md:text-sm text-muted-foreground">総控除額</CardTitle></CardHeader>
            <CardContent><p className="text-sm md:text-2xl font-bold">{fmt(payrolls.reduce((s, p) => s + p.totalDeductions, 0))}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0 md:pb-2"><CardTitle className="text-[10px] md:text-sm text-muted-foreground">総手取額</CardTitle></CardHeader>
            <CardContent><p className="text-sm md:text-2xl font-bold">{fmt(payrolls.reduce((s, p) => s + p.netPay, 0))}</p></CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
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
                        {/* 明細表示 */}
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="icon" />}>
                            <Eye className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <div className="flex items-center justify-between">
                                <DialogTitle>{p.employeeName} - {p.month} 給与明細</DialogTitle>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generatePayrollPdf(p)}
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                >
                                  <FileDown className="mr-1 h-3 w-3" />PDF出力
                                </Button>
                              </div>
                            </DialogHeader>
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
                        {/* PDF直接出力 */}
                        <Button variant="ghost" size="icon" onClick={() => generatePayrollPdf(p)} title="PDF出力">
                          <FileDown className="h-4 w-4 text-red-600" />
                        </Button>
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
