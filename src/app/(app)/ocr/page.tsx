"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  Globe,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  FileText,
  User,
} from "lucide-react";

type OcrResult = {
  success: boolean;
  extractedText?: string;
  structuredData?: Record<string, unknown>;
  error?: string;
};

export default function OcrPage() {
  // Image OCR state
  const [file, setFile] = useState<File | null>(null);
  const [imageDocType, setImageDocType] = useState<string>("resume");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<OcrResult | null>(null);

  // URL scraping state
  const [url, setUrl] = useState("");
  const [urlDocType, setUrlDocType] = useState<string>("job_posting");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState<OcrResult | null>(null);

  // Image OCR handler
  const handleImageOcr = async () => {
    if (!file) return;
    setImageLoading(true);
    setImageResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", imageDocType);

      const res = await fetch("/api/ocr/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setImageResult({ success: true, extractedText: data.extractedText, structuredData: data.structuredData });
      } else {
        setImageResult({ success: false, error: data.error });
      }
    } catch {
      setImageResult({ success: false, error: "通信エラーが発生しました" });
    } finally {
      setImageLoading(false);
    }
  };

  // URL scraping handler
  const handleUrlScrape = async () => {
    if (!url) return;
    setUrlLoading(true);
    setUrlResult(null);

    try {
      const res = await fetch("/api/ocr/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type: urlDocType }),
      });
      const data = await res.json();

      if (res.ok) {
        setUrlResult({ success: true, structuredData: data.structuredData });
      } else {
        setUrlResult({ success: false, error: data.error });
      }
    } catch {
      setUrlResult({ success: false, error: "通信エラーが発生しました" });
    } finally {
      setUrlLoading(false);
    }
  };

  const copyToClipboard = (data: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  return (
    <>
      <AppHeader title="OCR・データ自動入力" />
      <main className="flex-1 overflow-auto p-3 md:p-6 space-y-4 md:space-y-6">
        <Tabs defaultValue="image">
          <TabsList>
            <TabsTrigger value="image">
              <FileUp className="mr-2 h-4 w-4" />
              画像・PDF読取
            </TabsTrigger>
            <TabsTrigger value="url">
              <Globe className="mr-2 h-4 w-4" />
              URL読取
            </TabsTrigger>
          </TabsList>

          {/* ===== 画像/PDF OCR ===== */}
          <TabsContent value="image" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileUp className="h-5 w-5" />
                  履歴書・求人票の画像/PDFからデータを自動抽出
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>書類タイプ</Label>
                    <Select value={imageDocType} onValueChange={(v) => v && setImageDocType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resume">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            履歴書・職務経歴書
                          </div>
                        </SelectItem>
                        <SelectItem value="job_posting">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            求人票・案件情報
                          </div>
                        </SelectItem>
                        <SelectItem value="contract">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            契約書
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ファイル選択</Label>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileUp className="h-4 w-4" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}

                <Button
                  onClick={handleImageOcr}
                  disabled={!file || imageLoading}
                  className="w-full"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      OCR処理中...
                    </>
                  ) : (
                    <>
                      <FileUp className="mr-2 h-4 w-4" />
                      読み取り実行
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {imageResult && (
              <ResultCard result={imageResult} onCopy={copyToClipboard} />
            )}
          </TabsContent>

          {/* ===== URL スクレイピング ===== */}
          <TabsContent value="url" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  URLから企業案件・人材情報を自動抽出
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>URL</Label>
                  <Input
                    type="url"
                    placeholder="https://example.com/job/12345"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>ページタイプ</Label>
                  <Select value={urlDocType} onValueChange={(v) => v && setUrlDocType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job_posting">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          求人・採用ページ
                        </div>
                      </SelectItem>
                      <SelectItem value="resume">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          人材・経歴ページ
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleUrlScrape}
                  disabled={!url || urlLoading}
                  className="w-full"
                >
                  {urlLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      URL解析実行
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {urlResult && (
              <ResultCard result={urlResult} onCopy={copyToClipboard} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

// --- 構造化データ表示 ---
function StructuredDataView({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([key]) => !key.startsWith("_"));

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const renderValue = () => {
          if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-muted-foreground">-</span>;
            if (typeof value[0] === "object") {
              return (
                <div className="space-y-2">
                  {value.map((item, i) => (
                    <div key={i} className="rounded border p-2 text-xs">
                      {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-muted-foreground">{k}:</span> {String(v)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="flex flex-wrap gap-1">
                {value.map((v, i) => (
                  <Badge key={i} variant="outline">{String(v)}</Badge>
                ))}
              </div>
            );
          }
          return <>{String(value || "-")}</>;
        };

        return (
          <div key={key} className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 text-sm">
            <span className="font-medium text-muted-foreground col-span-1">
              {fieldLabels[key] || key}
            </span>
            <span className="col-span-3">{renderValue()}</span>
          </div>
        );
      })}
    </div>
  );
}

// --- 結果表示コンポーネント ---
function ResultCard({
  result,
  onCopy,
}: {
  result: OcrResult;
  onCopy: (data: Record<string, unknown>) => void;
}) {
  if (!result.success) {
    return (
      <Card className="border-red-300">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{result.error}</p>
        </CardContent>
      </Card>
    );
  }

  const data = result.structuredData || {};

  return (
    <div className="space-y-4">
      {/* 抽出テキスト */}
      {result.extractedText && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              抽出テキスト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={result.extractedText}
              readOnly
              className="min-h-[120px] text-sm font-mono"
            />
          </CardContent>
        </Card>
      )}

      {/* 構造化データ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              構造化データ
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => onCopy(data)}>
              <Copy className="mr-1 h-3 w-3" />
              コピー
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* フィールド一覧 */}
          <StructuredDataView data={data} />

          {/* 注意事項 */}
          {typeof data._note === "string" && (
            <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              {data._note}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- フィールド名の日本語ラベル ---
const fieldLabels: Record<string, string> = {
  name: "氏名",
  nameKana: "フリガナ",
  email: "メール",
  phone: "電話番号",
  address: "住所",
  dateOfBirth: "生年月日",
  gender: "性別",
  skills: "スキル",
  certifications: "資格",
  experience: "職歴",
  desiredSalary: "希望月給",
  preferredLocations: "希望勤務地",
  clientCompany: "企業名",
  title: "職種名",
  description: "業務内容",
  requiredSkills: "必須スキル",
  preferredSkills: "歓迎スキル",
  location: "勤務地",
  salaryMin: "月給下限",
  salaryMax: "月給上限",
  startDate: "開始日",
  endDate: "終了日",
  duration: "期間",
  employeeName: "従業員名",
  role: "業務内容・役職",
  hourlySalary: "時給",
  billingRate: "請求単価",
  workLocation: "勤務地",
  workHours: "勤務時間",
  notes: "備考",
};
