"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockEmployees, mockJobPostings, mockEvaluations, mockContracts, mockAttendance } from "@/lib/mock-data";
import type { Employee, JobPosting, EnhancedMatchResult } from "@/types";
import { Sparkles, ArrowRight, User, Briefcase } from "lucide-react";

// --- 総合マッチングスコア計算 ---
function calculateEnhancedScore(employee: Employee, requiredSkills: string[]): EnhancedMatchResult {
  // 1. スキルスコア（40%）
  const empSkillsLower = employee.skills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((s) => empSkillsLower.includes(s.toLowerCase()));
  const missing = requiredSkills.filter((s) => !empSkillsLower.includes(s.toLowerCase()));
  const skillScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 100 : 0;

  // 2. 評価スコア（25%）
  const evals = mockEvaluations.filter((e) => e.employeeId === employee.id);
  const avgEvaluation = evals.length > 0 ? evals.reduce((s, e) => s + e.overallScore, 0) / evals.length : 3.0;
  const evaluationScore = (avgEvaluation / 5) * 100;

  // 3. 出勤状況スコア（20%）
  const attendance = mockAttendance.filter((a) => a.employeeId === employee.id);
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const lateDays = attendance.filter((a) => a.status === "late").length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 80;
  const lateDeduction = totalDays > 0 ? (lateDays / totalDays) * 10 : 0;
  const attendanceScore = Math.max(0, attendanceRate - lateDeduction);

  // 4. 請負実績スコア（15%）
  const contractCount = mockContracts.filter((c) => c.employeeId === employee.id).length;
  const experienceScore = Math.min(100, contractCount * 25 + (employee.experience.length * 15));

  // 総合スコア（重み付け平均）
  const totalScore = Math.round(
    skillScore * 0.40 +
    evaluationScore * 0.25 +
    attendanceScore * 0.20 +
    experienceScore * 0.15
  );

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    skillScore: Math.round(skillScore),
    evaluationScore: Math.round(evaluationScore),
    attendanceScore: Math.round(attendanceScore),
    experienceScore: Math.round(experienceScore),
    totalScore,
    matchedSkills: matched,
    missingSkills: missing,
    details: {
      avgEvaluation: Math.round(avgEvaluation * 10) / 10,
      contractCount,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    },
  };
}

// --- 案件マッチングスコア（人→案件）---
function calculateJobMatchScore(employee: Employee, job: JobPosting) {
  const empSkillsLower = employee.skills.map((s) => s.toLowerCase());
  const matched = job.requiredSkills.filter((s) => empSkillsLower.includes(s.toLowerCase()));
  const missing = job.requiredSkills.filter((s) => !empSkillsLower.includes(s.toLowerCase()));
  const skillScore = job.requiredSkills.length > 0 ? (matched.length / job.requiredSkills.length) * 100 : 0;

  const salaryMatch = employee.desiredSalary
    ? (employee.desiredSalary >= job.salaryMin && employee.desiredSalary <= job.salaryMax ? 100 : 50)
    : 70;

  const totalScore = Math.round(skillScore * 0.7 + salaryMatch * 0.3);

  return { jobId: job.id, jobTitle: job.title, clientCompany: job.clientCompany, totalScore, skillScore: Math.round(skillScore), salaryMatch, matchedSkills: matched, missingSkills: missing, location: job.location, salaryRange: `¥${job.salaryMin.toLocaleString()}〜¥${job.salaryMax.toLocaleString()}` };
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right font-medium">{score}</span>
    </div>
  );
}

export default function MatchingPage() {
  // 案件→人
  const [skills, setSkills] = useState("");
  const [jobResults, setJobResults] = useState<EnhancedMatchResult[]>([]);
  const [hasJobSearched, setHasJobSearched] = useState(false);

  // 人→案件
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [empResults, setEmpResults] = useState<ReturnType<typeof calculateJobMatchScore>[]>([]);
  const [hasEmpSearched, setHasEmpSearched] = useState(false);

  // 案件→人 マッチング
  const handleJobToEmployee = () => {
    const requiredSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    const candidates = mockEmployees
      .filter((e) => e.status === "available" || e.status === "active")
      .map((e) => calculateEnhancedScore(e, requiredSkills))
      .filter((r) => r.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
    setJobResults(candidates);
    setHasJobSearched(true);
  };

  // 人→案件 マッチング
  const handleEmployeeToJob = () => {
    const emp = mockEmployees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;
    const matches = mockJobPostings
      .filter((j) => j.status === "open")
      .map((j) => calculateJobMatchScore(emp, j))
      .sort((a, b) => b.totalScore - a.totalScore);
    setEmpResults(matches);
    setHasEmpSearched(true);
  };

  return (
    <>
      <AppHeader title="AIマッチング" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-4 md:space-y-6">
        <Tabs defaultValue="job-to-emp">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="job-to-emp" className="text-xs sm:text-sm">
              <Briefcase className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />案件→人材
            </TabsTrigger>
            <TabsTrigger value="emp-to-job" className="text-xs sm:text-sm">
              <User className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />人材→案件
            </TabsTrigger>
          </TabsList>

          {/* ===== 案件→人材 マッチング ===== */}
          <TabsContent value="job-to-emp" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5" />
                  案件条件から人材をマッチング
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>必要スキル（カンマ区切り）</Label>
                  <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" />
                </div>
                <Button onClick={handleJobToEmployee} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />マッチング実行
                </Button>
              </CardContent>
            </Card>

            {/* 既存案件からワンクリック */}
            <Card>
              <CardHeader><CardTitle className="text-sm md:text-base">募集中案件からマッチング</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {mockJobPostings.filter((j) => j.status === "open").map((job) => (
                  <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.clientCompany}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.requiredSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => { setSkills(job.requiredSkills.join(", ")); handleJobToEmployee(); }}>
                      <Sparkles className="mr-1 h-3 w-3" />マッチング
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 結果 */}
            {hasJobSearched && (
              <Card>
                <CardHeader><CardTitle className="text-sm md:text-base">マッチング結果 ({jobResults.length}名)</CardTitle></CardHeader>
                <CardContent>
                  {jobResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">条件に合う候補者が見つかりませんでした。</p>
                  ) : (
                    <div className="space-y-3">
                      {jobResults.map((r) => (
                        <div key={r.employeeId} className="rounded-lg border p-3 md:p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{r.employeeName}</p>
                                <Badge variant={r.totalScore >= 70 ? "default" : r.totalScore >= 50 ? "secondary" : "outline"}>
                                  総合 {r.totalScore}点
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-xs text-muted-foreground">一致:</span>
                                {r.matchedSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                                {r.missingSkills.length > 0 && (
                                  <>
                                    <span className="text-xs text-muted-foreground ml-1">不足:</span>
                                    {r.missingSkills.map((s) => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}
                                  </>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0"><ArrowRight className="h-4 w-4" /></Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            <ScoreBar label="スキル" score={r.skillScore} color="bg-blue-500" />
                            <ScoreBar label="評価" score={r.evaluationScore} color="bg-green-500" />
                            <ScoreBar label="出勤" score={r.attendanceScore} color="bg-cyan-500" />
                            <ScoreBar label="実績" score={r.experienceScore} color="bg-purple-500" />
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>評価: {r.details.avgEvaluation}/5.0</span>
                            <span>請負: {r.details.contractCount}件</span>
                            <span>出勤率: {r.details.attendanceRate}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== 人材→案件 マッチング ===== */}
          <TabsContent value="emp-to-job" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm md:text-base flex items-center gap-2">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  人材から適合案件を検索
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>人材を選択</Label>
                  <Select value={selectedEmployeeId} onValueChange={(v) => v && setSelectedEmployeeId(v)}>
                    <SelectTrigger><SelectValue placeholder="人材を選択してください" /></SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} — {e.skills.slice(0, 3).join(", ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedEmployeeId && (() => {
                  const emp = mockEmployees.find((e) => e.id === selectedEmployeeId);
                  if (!emp) return null;
                  return (
                    <div className="rounded border p-3 text-sm space-y-1">
                      <p className="font-medium">{emp.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {emp.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground">希望月給: ¥{emp.desiredSalary?.toLocaleString() || "-"} | {emp.preferredLocations.join(", ")}</p>
                    </div>
                  );
                })()}
                <Button onClick={handleEmployeeToJob} disabled={!selectedEmployeeId} className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />適合案件を検索
                </Button>
              </CardContent>
            </Card>

            {/* 結果 */}
            {hasEmpSearched && (
              <Card>
                <CardHeader><CardTitle className="text-sm md:text-base">適合案件 ({empResults.length}件)</CardTitle></CardHeader>
                <CardContent>
                  {empResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">適合する案件が見つかりませんでした。</p>
                  ) : (
                    <div className="space-y-3">
                      {empResults.map((r) => (
                        <div key={r.jobId} className="rounded-lg border p-3 md:p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{r.jobTitle}</p>
                                <Badge variant={r.totalScore >= 70 ? "default" : r.totalScore >= 50 ? "secondary" : "outline"}>
                                  {r.totalScore}点
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{r.clientCompany} | {r.location}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0"><ArrowRight className="h-4 w-4" /></Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-muted-foreground">一致:</span>
                            {r.matchedSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                            {r.missingSkills.length > 0 && (
                              <>
                                <span className="text-xs text-muted-foreground ml-1">不足:</span>
                                {r.missingSkills.map((s) => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>スキル適合: {r.skillScore}%</span>
                            <span>給与適合: {r.salaryMatch}%</span>
                            <span>{r.salaryRange}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
