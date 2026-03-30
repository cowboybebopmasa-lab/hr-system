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
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockEvaluations, mockEmployees } from "@/lib/mock-data";
import type { Evaluation } from "@/types";
import { Plus, Search, Eye, Star } from "lucide-react";

const statusLabels: Record<Evaluation["status"], string> = {
  draft: "下書き", submitted: "提出済", approved: "承認済",
};
const statusVariants: Record<Evaluation["status"], "default" | "secondary" | "outline"> = {
  draft: "secondary", submitted: "default", approved: "outline",
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-24 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-medium">{score}</span>
    </div>
  );
}

export default function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(mockEvaluations);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "", evaluatorName: "", period: "",
    performanceScore: "3", skillScore: "3", attitudeScore: "3",
    strengths: "", areasForImprovement: "", goals: "", comments: "",
  });

  const filtered = evaluations.filter(
    (e) => e.employeeName.includes(search) || e.period.includes(search)
  );

  const handleAdd = () => {
    const emp = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!emp) return;
    const p = Number(formData.performanceScore);
    const s = Number(formData.skillScore);
    const a = Number(formData.attitudeScore);
    const newEval: Evaluation = {
      id: `eval-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: emp.name,
      evaluatorName: formData.evaluatorName,
      period: formData.period,
      performanceScore: p, skillScore: s, attitudeScore: a,
      overallScore: Math.round(((p + s + a) / 3) * 10) / 10,
      strengths: formData.strengths,
      areasForImprovement: formData.areasForImprovement,
      goals: formData.goals,
      comments: formData.comments,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEvaluations([newEval, ...evaluations]);
    setShowForm(false);
  };

  return (
    <>
      <AppHeader title="評価管理" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-3 md:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="従業員名、評価期間で検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />新規評価
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>新規評価作成</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>対象従業員</Label>
                    <Select value={formData.employeeId} onValueChange={(v) => v && setFormData({ ...formData, employeeId: v })}>
                      <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                      <SelectContent>
                        {mockEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>評価者名</Label><Input value={formData.evaluatorName} onChange={(e) => setFormData({ ...formData, evaluatorName: e.target.value })} /></div>
                </div>
                <div><Label>評価期間</Label><Input value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} placeholder="2024年上期" /></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "performanceScore", label: "業績" },
                    { key: "skillScore", label: "スキル" },
                    { key: "attitudeScore", label: "態度" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label>{label}（1-5）</Label>
                      <Select value={formData[key as keyof typeof formData]} onValueChange={(v) => v && setFormData({ ...formData, [key]: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div><Label>強み</Label><Textarea value={formData.strengths} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} /></div>
                <div><Label>改善点</Label><Textarea value={formData.areasForImprovement} onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })} /></div>
                <div><Label>目標</Label><Textarea value={formData.goals} onChange={(e) => setFormData({ ...formData, goals: e.target.value })} /></div>
                <div><Label>コメント</Label><Textarea value={formData.comments} onChange={(e) => setFormData({ ...formData, comments: e.target.value })} /></div>
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
                  <TableHead>評価期間</TableHead>
                  <TableHead>評価者</TableHead>
                  <TableHead>業績</TableHead>
                  <TableHead>スキル</TableHead>
                  <TableHead>態度</TableHead>
                  <TableHead>総合</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell className="font-medium">{ev.employeeName}</TableCell>
                    <TableCell>{ev.period}</TableCell>
                    <TableCell>{ev.evaluatorName}</TableCell>
                    <TableCell>{ev.performanceScore}/5</TableCell>
                    <TableCell>{ev.skillScore}/5</TableCell>
                    <TableCell>{ev.attitudeScore}/5</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{ev.overallScore}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={statusVariants[ev.status]}>{statusLabels[ev.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
                          <Eye className="h-4 w-4" />
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader><DialogTitle>{ev.employeeName} - {ev.period}</DialogTitle></DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <ScoreBar score={ev.performanceScore} label="業績" />
                              <ScoreBar score={ev.skillScore} label="スキル" />
                              <ScoreBar score={ev.attitudeScore} label="態度" />
                              <div className="flex items-center gap-2 pt-2 border-t">
                                <span className="w-24 font-medium">総合評価</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-lg font-bold">{ev.overallScore}/5.0</span>
                                </div>
                              </div>
                            </div>
                            <div><p className="text-sm font-medium">強み</p><p className="text-sm mt-1">{ev.strengths}</p></div>
                            <div><p className="text-sm font-medium">改善点</p><p className="text-sm mt-1">{ev.areasForImprovement}</p></div>
                            <div><p className="text-sm font-medium">目標</p><p className="text-sm mt-1">{ev.goals}</p></div>
                            <div><p className="text-sm font-medium">コメント</p><p className="text-sm mt-1">{ev.comments}</p></div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
