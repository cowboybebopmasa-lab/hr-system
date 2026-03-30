"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScanText, Loader2 } from "lucide-react";

interface OcrUploadButtonProps {
  documentType: "resume" | "job_posting" | "contract";
  onResult: (data: Record<string, unknown>) => void;
  label?: string;
}

export function OcrUploadButton({ documentType, onResult, label }: OcrUploadButtonProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", documentType);

      const res = await fetch("/api/ocr/image", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok && data.structuredData) {
        onResult(data.structuredData);
      }
    } catch {
      // エラー時は何もしない（手動入力にフォールバック）
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />読取中...</>
        ) : (
          <><ScanText className="mr-1 h-3 w-3" />{label || "OCR読取"}</>
        )}
      </Button>
    </>
  );
}
