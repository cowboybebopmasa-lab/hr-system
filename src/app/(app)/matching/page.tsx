"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { mockEmployees, mockJobPostings } from "@/lib/mock-data";
import type { Employee, MatchResult } from "@/types";
import { Sparkles, Search, ArrowRight } from "lucide-react";

function calculateMatchScore(employee: Employee, requiredSkills: string[]): MatchResult {
  const empSkillsLower = employee.skills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((s) => empSkillsLower.includes(s.toLowerCase()));
  const missing = requiredSkills.filter((s) => !empSkillsLower.includes(s.toLowerCase()));
  const score = requiredSkills.length > 0 ? Math.round((matched.length / requiredSkills.length) * 100) : 0;
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    score,
    matchedSkills: matched,
    missingSkills: missing,
  };
}

export default function MatchingPage() {
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleMatch = () => {
    const requiredSkills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    const candidates = mockEmployees
      .filter((e) => e.status === "available" || e.status === "active")
      .map((e) => calculateMatchScore(e, requiredSkills))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    setResults(candidates);
    setHasSearched(true);
  };

  return (
    <>
      <AppHeader title="AIマッチング" />
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              案件条件からマッチング
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>必要スキル（カンマ区切り）</Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, TypeScript, Node.js"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>勤務地</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="東京都" />
              </div>
              <div>
                <Label>上限月給</Label>
                <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="500000" />
              </div>
            </div>
            <Button onClick={handleMatch} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              マッチング実行
            </Button>
          </CardContent>
        </Card>

        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                マッチング結果 ({results.length}名)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">条件に合う候補者が見つかりませんでした。</p>
              ) : (
                <div className="space-y-3">
                  {results.map((r) => {
                    const emp = mockEmployees.find((e) => e.id === r.employeeId);
                    return (
                      <div key={r.employeeId} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="font-medium">{r.employeeName}</p>
                            <Badge
                              variant={r.score >= 80 ? "default" : r.score >= 60 ? "secondary" : "outline"}
                              className="text-sm"
                            >
                              {r.score}% マッチ
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">一致:</span>
                            {r.matchedSkills.map((s) => (
                              <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                          {r.missingSkills.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">不足:</span>
                              {r.missingSkills.map((s) => (
                                <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                          {emp && (
                            <p className="text-sm text-muted-foreground">
                              希望月給: ¥{emp.desiredSalary?.toLocaleString() || "-"} | {emp.preferredLocations.join(", ")}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick match from existing jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">募集中案件からマッチング</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockJobPostings.filter((j) => j.status === "open").map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.clientCompany}</p>
                    <div className="flex gap-1 mt-1">
                      {job.requiredSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSkills(job.requiredSkills.join(", "));
                      setLocation(job.location);
                      setSalaryMax(String(job.salaryMax));
                      handleMatch();
                    }}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    マッチング
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
