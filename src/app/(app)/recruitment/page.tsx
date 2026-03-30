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
import { mockJobPostings } from "@/lib/mock-data";
import type { JobPosting } from "@/types";
import { Plus, Search, Users } from "lucide-react";

const statusLabels: Record<JobPosting["status"], string> = {
  open: "募集中", filled: "充足", closed: "終了", on_hold: "保留",
};
const statusVariants: Record<JobPosting["status"], "default" | "secondary" | "destructive" | "outline"> = {
  open: "default", filled: "secondary", closed: "outline", on_hold: "destructive",
};

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>(mockJobPostings);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [formData, setFormData] = useState({
    clientCompany: "", title: "", description: "", requiredSkills: "",
    preferredSkills: "", location: "", salaryMin: "", salaryMax: "",
    startDate: "", duration: "",
  });

  const filtered = jobs.filter(
    (j) => j.title.includes(search) || j.clientCompany.includes(search) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    const newJob: JobPosting = {
      id: `job-${Date.now()}`,
      clientCompany: formData.clientCompany,
      title: formData.title,
      description: formData.description,
      requiredSkills: formData.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      preferredSkills: formData.preferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      location: formData.location,
      salaryMin: Number(formData.salaryMin),
      salaryMax: Number(formData.salaryMax),
      startDate: formData.startDate,
      duration: formData.duration,
      status: "open",
      matchedCandidates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setJobs([newJob, ...jobs]);
    setShowForm(false);
  };

  return (
    <>
      <AppHeader title="採用管理" />
      <main className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="案件名、企業名、スキルで検索..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />新規案件
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>新規案件登録</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>企業名</Label><Input value={formData.clientCompany} onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })} /></div>
                  <div><Label>案件名</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                </div>
                <div><Label>説明</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div><Label>必須スキル（カンマ区切り）</Label><Input value={formData.requiredSkills} onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })} placeholder="React, TypeScript" /></div>
                <div><Label>歓迎スキル（カンマ区切り）</Label><Input value={formData.preferredSkills} onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>勤務地</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} /></div>
                  <div><Label>期間</Label><Input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="6ヶ月" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>下限月給</Label><Input type="number" value={formData.salaryMin} onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} /></div>
                  <div><Label>上限月給</Label><Input type="number" value={formData.salaryMax} onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} /></div>
                  <div><Label>開始日</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} /></div>
                </div>
                <Button onClick={handleAdd} className="w-full">登録</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filtered.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{job.clientCompany} | {job.location}</p>
                  </div>
                  <Badge variant={statusVariants[job.status]}>{statusLabels[job.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{job.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>¥{job.salaryMin.toLocaleString()} ~ ¥{job.salaryMax.toLocaleString()}</span>
                  <span>開始: {job.startDate}</span>
                  <span>期間: {job.duration}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {job.requiredSkills.map((s) => <Badge key={s} variant="default" className="text-xs">{s}</Badge>)}
                  {job.preferredSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                </div>
                {job.matchedCandidates.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">マッチ候補 ({job.matchedCandidates.length}名)</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>候補者</TableHead>
                          <TableHead>スコア</TableHead>
                          <TableHead>一致スキル</TableHead>
                          <TableHead>不足スキル</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.matchedCandidates.map((m) => (
                          <TableRow key={m.employeeId}>
                            <TableCell className="font-medium">{m.employeeName}</TableCell>
                            <TableCell>
                              <Badge variant={m.score >= 80 ? "default" : m.score >= 60 ? "secondary" : "outline"}>
                                {m.score}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">{m.matchedSkills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">{m.missingSkills.map((s) => <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>)}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
