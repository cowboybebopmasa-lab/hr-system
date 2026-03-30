"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockEmployees } from "@/lib/mock-data";
import type { Employee } from "@/types";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";

const statusLabels: Record<Employee["status"], string> = {
  active: "在籍",
  inactive: "退職",
  available: "待機中",
  on_assignment: "稼働中",
};

const statusVariants: Record<Employee["status"], "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "destructive",
  available: "secondary",
  on_assignment: "default",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", nameKana: "", email: "", phone: "", address: "",
    dateOfBirth: "", gender: "male" as Employee["gender"],
    skills: "", employmentType: "dispatch" as Employee["employmentType"],
    desiredSalary: "", preferredLocations: "", notes: "",
  });

  const filtered = employees.filter(
    (e) =>
      e.name.includes(search) ||
      e.nameKana.includes(search) ||
      e.email.includes(search) ||
      e.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: formData.name,
      nameKana: formData.nameKana,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      certifications: [],
      experience: [],
      employmentType: formData.employmentType,
      status: "active",
      desiredSalary: formData.desiredSalary ? Number(formData.desiredSalary) : undefined,
      preferredLocations: formData.preferredLocations.split(",").map((s) => s.trim()).filter(Boolean),
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEmployees([newEmployee, ...employees]);
    setShowForm(false);
    setFormData({ name: "", nameKana: "", email: "", phone: "", address: "", dateOfBirth: "", gender: "male", skills: "", employmentType: "dispatch", desiredSalary: "", preferredLocations: "", notes: "" });
  };

  const handleDelete = (id: string) => {
    setEmployees(employees.filter((e) => e.id !== id));
  };

  return (
    <>
      <AppHeader title="従業員管理" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-3 md:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="名前、スキル、メールで検索..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />新規登録
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>従業員新規登録</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>氏名</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="山田 太郎" /></div>
                  <div><Label>フリガナ</Label><Input value={formData.nameKana} onChange={(e) => setFormData({ ...formData, nameKana: e.target.value })} placeholder="ヤマダ タロウ" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>メール</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                  <div><Label>電話番号</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                </div>
                <div><Label>住所</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>生年月日</Label><Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
                  <div><Label>希望月給</Label><Input type="number" value={formData.desiredSalary} onChange={(e) => setFormData({ ...formData, desiredSalary: e.target.value })} placeholder="450000" /></div>
                </div>
                <div><Label>スキル（カンマ区切り）</Label><Input value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} placeholder="React, TypeScript, Node.js" /></div>
                <div><Label>希望勤務地（カンマ区切り）</Label><Input value={formData.preferredLocations} onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })} placeholder="東京都, 神奈川県" /></div>
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
                  <TableHead>氏名</TableHead>
                  <TableHead>スキル</TableHead>
                  <TableHead>雇用形態</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>希望月給</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-sm text-muted-foreground">{emp.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {emp.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {emp.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{emp.skills.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{emp.employmentType === "dispatch" ? "派遣" : emp.employmentType}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[emp.status]}>{statusLabels[emp.status]}</Badge>
                    </TableCell>
                    <TableCell>{emp.desiredSalary ? `¥${emp.desiredSalary.toLocaleString()}` : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(emp)} />}>
                            <Eye className="h-4 w-4" />
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{emp.name} の詳細</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-muted-foreground">フリガナ:</span> {emp.nameKana}</div>
                                <div><span className="text-muted-foreground">メール:</span> {emp.email}</div>
                                <div><span className="text-muted-foreground">電話:</span> {emp.phone}</div>
                                <div><span className="text-muted-foreground">住所:</span> {emp.address}</div>
                                <div><span className="text-muted-foreground">生年月日:</span> {emp.dateOfBirth}</div>
                                <div><span className="text-muted-foreground">希望月給:</span> ¥{emp.desiredSalary?.toLocaleString() || "-"}</div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">スキル</p>
                                <div className="flex flex-wrap gap-1">
                                  {emp.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">資格</p>
                                <div className="flex flex-wrap gap-1">
                                  {emp.certifications.map((c) => <Badge key={c} variant="secondary">{c}</Badge>)}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">職歴</p>
                                {emp.experience.map((exp, i) => (
                                  <div key={i} className="rounded border p-3 mb-2">
                                    <p className="font-medium text-sm">{exp.company} - {exp.role}</p>
                                    <p className="text-sm text-muted-foreground">{exp.startDate} ~ {exp.endDate || "現在"}</p>
                                    <p className="text-sm mt-1">{exp.description}</p>
                                  </div>
                                ))}
                              </div>
                              <div><span className="text-muted-foreground text-sm">希望勤務地:</span> {emp.preferredLocations.join(", ")}</div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
