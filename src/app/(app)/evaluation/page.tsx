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
import { mockEvaluations, mockEmployees, mockAttendance, mockContracts } from "@/lib/mock-data";
import type { Evaluation } from "@/types";
import { Plus, Search, Eye, Star, Sparkles, Edit, Lock, Unlock, Loader2 } from "lucide-react";

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

// --- AI自動評価ロジック ---
function generateAiEvaluation(employeeId: string): {
  performanceScore: number;
  skillScore: number;
  attitudeScore: number;
  overallScore: number;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  comments: string;
} {
  const emp = mockEmployees.find((e) => e.id === employeeId);
  if (!emp) return { performanceScore: 3, skillScore: 3, attitudeScore: 3, overallScore: 3, strengths: "", areasForImprovement: "", goals: "", comments: "" };

  // スキル評価: スキル数と資格数に基づく
  const skillCount = emp.skills.length;
  const certCount = emp.certifications.length;
  const skillScore = Math.min(5, Math.round((skillCount * 0.5 + certCount * 0.8 + 1) * 10) / 10);

  // 勤怠評価: 出勤率・遅刻率に基づく
  const attendance = mockAttendance.filter((a) => a.employeeId === employeeId);
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present").length;
  const lateDays = attendance.filter((a) => a.status === "late").length;
  const attendanceRate = totalDays > 0 ? presentDays / totalDays : 0.8;
  const lateRate = totalDays > 0 ? lateDays / totalDays : 0;
  const attitudeScore = Math.min(5, Math.max(1, Math.round((attendanceRate * 5 - lateRate * 2) * 10) / 10));

  // 業績評価: 契約数・経験年数に基づく
  const contractCount = mockContracts.filter((c) => c.employeeId === employeeId).length;
  const expYears = emp.experience.reduce((sum, exp) => {
    const start = new Date(exp.startDate).getTime();
    const end = exp.endDate ? new Date(exp.endDate).getTime() : Date.now();
    return sum + (end - start) / (1000 * 60 * 60 * 24 * 365);
  }, 0);
  const performanceScore = Math.min(5, Math.max(1, Math.round((contractCount * 0.8 + expYears * 0.3 + 1.5) * 10) / 10));

  const overallScore = Math.round(((performanceScore + skillScore + attitudeScore) / 3) * 10) / 10;

  // テキスト生成
  const skillList = emp.skills.slice(0, 3).join("、");
  const strengths = [
    skillCount >= 4 ? `${skillList}など${skillCount}つのスキルを保有し、多方面での活躍が期待できる。` : "",
    certCount > 0 ? `${emp.certifications[0]}等の資格を保有。` : "",
    contractCount > 0 ? `過去${contractCount}件の請負実績があり、安定した稼働が見込める。` : "",
    attendanceRate >= 0.95 ? "出勤率が高く、安定した勤務態度。" : "",
  ].filter(Boolean).join(" ");

  const areasForImprovement = [
    skillCount < 3 ? "スキルの幅をさらに広げることを推奨。" : "",
    lateRate > 0.1 ? "遅刻の頻度が見られるため、時間管理の改善を推奨。" : "",
    contractCount === 0 ? "請負実績を積むことで評価向上が期待できる。" : "",
  ].filter(Boolean).join(" ") || "現状の業務品質を維持しつつ、新しい領域への挑戦を期待。";

  const goals = expYears > 3
    ? "チームリーダーまたはメンター役としての役割拡大。"
    : "担当業務の品質向上と技術スキルの深化。";

  const comments = `AI自動評価: スキル${skillCount}件、資格${certCount}件、請負実績${contractCount}件、出勤率${Math.round(attendanceRate * 100)}%のデータに基づき評価。`;

  return { performanceScore, skillScore, attitudeScore, overallScore, strengths, areasForImprovement, goals, comments };
}

export default function EvaluationPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(mockEvaluations);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // loading state per evaluation id or "all"
  const [formData, setFormData] = useState({
    employeeId: "", evaluatorName: "", period: "",
    performanceScore: "3", skillScore: "3", attitudeScore: "3",
    strengths: "", areasForImprovement: "", goals: "", comments: "",
  });

  const filtered = evaluations.filter(
    (e) => e.employeeName.includes(search) || e.period.includes(search)
  );

  const resetForm = () => {
    setFormData({ employeeId: "", evaluatorName: "", period: "", performanceScore: "3", skillScore: "3", attitudeScore: "3", strengths: "", areasForImprovement: "", goals: "", comments: "" });
    setEditingId(null);
  };

  const handleAdd = () => {
    const emp = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!emp) return;
    const p = Number(formData.performanceScore);
    const s = Number(formData.skillScore);
    const a = Number(formData.attitudeScore);

    if (editingId) {
      // 編集モード
      setEvaluations(evaluations.map((ev) =>
        ev.id === editingId ? {
          ...ev,
          performanceScore: p, skillScore: s, attitudeScore: a,
          overallScore: Math.round(((p + s + a) / 3) * 10) / 10,
          strengths: formData.strengths, areasForImprovement: formData.areasForImprovement,
          goals: formData.goals, comments: formData.comments,
          evaluatorName: formData.evaluatorName, period: formData.period,
          updatedAt: new Date().toISOString(),
        } : ev
      ));
    } else {
      // 新規作成
      const newEval: Evaluation = {
        id: `eval-${Date.now()}`,
        employeeId: formData.employeeId, employeeName: emp.name,
        evaluatorName: formData.evaluatorName, period: formData.period,
        performanceScore: p, skillScore: s, attitudeScore: a,
        overallScore: Math.round(((p + s + a) / 3) * 10) / 10,
        strengths: formData.strengths, areasForImprovement: formData.areasForImprovement,
        goals: formData.goals, comments: formData.comments,
        status: "draft", locked: false,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      setEvaluations([newEval, ...evaluations]);
    }
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (ev: Evaluation) => {
    setEditingId(ev.id);
    setFormData({
      employeeId: ev.employeeId, evaluatorName: ev.evaluatorName, period: ev.period,
      performanceScore: String(ev.performanceScore), skillScore: String(ev.skillScore),
      attitudeScore: String(ev.attitudeScore), strengths: ev.strengths,
      areasForImprovement: ev.areasForImprovement, goals: ev.goals, comments: ev.comments,
    });
    setShowForm(true);
  };

  const handleToggleLock = (id: string) => {
    setEvaluations(evaluations.map((ev) =>
      ev.id === id ? { ...ev, locked: !ev.locked, updatedAt: new Date().toISOString() } : ev
    ));
  };

  // 個別AI自動評価
  const handleAiEvaluate = async (id: string) => {
    const ev = evaluations.find((e) => e.id === id);
    if (!ev || ev.locked) return;

    setAiLoading(id);
    // AI処理のシミュレーション（実際にはAPI呼び出し）
    await new Promise((r) => setTimeout(r, 800));

    const aiResult = generateAiEvaluation(ev.employeeId);
    setEvaluations(evaluations.map((e) =>
      e.id === id ? {
        ...e, ...aiResult,
        evaluatorName: "AI自動評価",
        updatedAt: new Date().toISOString(),
      } : e
    ));
    setAiLoading(null);
  };

  // 一括AI自動評価
  const handleAiEvaluateAll = async () => {
    setAiLoading("all");
    await new Promise((r) => setTimeout(r, 1200));

    setEvaluations(evaluations.map((ev) => {
      if (ev.locked) return ev;
      const aiResult = generateAiEvaluation(ev.employeeId);
      return { ...ev, ...aiResult, evaluatorName: "AI自動評価", updatedAt: new Date().toISOString() };
    }));
    setAiLoading(null);
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
          <div className="flex gap-2 flex-wrap">
            {/* 一括AI自動評価 */}
            <Button
              variant="outline"
              onClick={handleAiEvaluateAll}
              disabled={aiLoading !== null}
            >
              {aiLoading === "all" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />評価中...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />全員AI評価</>
              )}
            </Button>
            {/* 新規評価 */}
            <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) resetForm(); }}>
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />新規評価
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{editingId ? "評価を編集" : "新規評価作成"}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>対象従業員</Label>
                      <Select value={formData.employeeId} onValueChange={(v) => v && setFormData({ ...formData, employeeId: v })} disabled={!!editingId}>
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
                  <Button onClick={handleAdd} className="w-full">{editingId ? "更新" : "登録"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                  <TableRow key={ev.id} className={ev.locked ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {ev.locked && <Lock className="h-3 w-3 text-orange-500" />}
                        {ev.employeeName}
                      </div>
                    </TableCell>
                    <TableCell>{ev.period}</TableCell>
                    <TableCell>
                      <span className={ev.evaluatorName === "AI自動評価" ? "text-purple-600 font-medium" : ""}>
                        {ev.evaluatorName}
                      </span>
                    </TableCell>
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
                      <div className="flex justify-end gap-0.5">
                        {/* AI個別評価 */}
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleAiEvaluate(ev.id)}
                          disabled={ev.locked || aiLoading !== null}
                          title={ev.locked ? "ロック中" : "AI自動評価"}
                        >
                          {aiLoading === ev.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-purple-500" />
                          )}
                        </Button>
                        {/* 編集 */}
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleEdit(ev)}
                          disabled={ev.locked}
                          title={ev.locked ? "ロック中" : "編集"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {/* ロック/アンロック */}
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleToggleLock(ev.id)}
                          title={ev.locked ? "ロック解除" : "評価ロック"}
                        >
                          {ev.locked ? (
                            <Lock className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Unlock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        {/* 詳細 */}
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="icon" />}>
                            <Eye className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>{ev.employeeName} - {ev.period}</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              {ev.locked && (
                                <div className="flex items-center gap-2 rounded border border-orange-200 bg-orange-50 p-2 text-xs text-orange-700">
                                  <Lock className="h-3 w-3" />評価ロック中（AI自動評価・編集不可）
                                </div>
                              )}
                              {ev.evaluatorName === "AI自動評価" && (
                                <div className="flex items-center gap-2 rounded border border-purple-200 bg-purple-50 p-2 text-xs text-purple-700">
                                  <Sparkles className="h-3 w-3" />AI自動評価による結果
                                </div>
                              )}
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
