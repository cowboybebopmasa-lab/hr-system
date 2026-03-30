import { NextRequest, NextResponse } from "next/server";
import { performBackup, cleanupOldBackups } from "@/services/backup/gdrive-backup";
import { checkKeyRotationStatus } from "@/services/backup/key-rotation";

// Vercel Cron: 毎日 JST 02:00 (UTC 17:00) に実行
// vercel.json: { "path": "/api/cron/backup-gdrive", "schedule": "0 17 * * *" }

export const maxDuration = 60; // Vercel Pro: 最大60秒

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Step 1: キーローテーション状態チェック
    let keyAlerts: string[] = [];
    try {
      const keyStatus = await checkKeyRotationStatus();
      keyAlerts = keyStatus.alerts;
    } catch {
      keyAlerts = ["キーローテーション状態の確認をスキップしました（DB未設定の可能性）"];
    }

    // Step 2: バックアップ実行
    const backupResult = await performBackup();

    // Step 3: 古いバックアップの削除（30日保持）
    const deletedCount = await cleanupOldBackups(30);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      backup: {
        fileId: backupResult.fileId,
        fileName: backupResult.fileName,
        totalDocuments: backupResult.totalDocuments,
        sizeBytes: backupResult.sizeBytes,
        encrypted: true,
        algorithm: "AES-256-GCM",
      },
      cleanup: {
        deletedFolders: deletedCount,
        retentionDays: 30,
      },
      keyRotation: {
        alerts: keyAlerts,
        hasAlerts: keyAlerts.length > 0,
      },
      performance: {
        durationMs: duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Backup cron error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        performance: { durationMs: duration },
      },
      { status: 500 }
    );
  }
}
