import { NextRequest, NextResponse } from "next/server";

// Vercel Cron: 毎日 JST 02:00 (UTC 17:00) に実行
// vercel.json: { "path": "/api/cron/backup-gdrive", "schedule": "0 17 * * *" }

export const maxDuration = 60; // Vercel Pro: 最大60秒

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const missingEnvVars: string[] = [];

  // 必要な環境変数のチェック
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) missingEnvVars.push("GOOGLE_SERVICE_ACCOUNT_KEY");
  if (!process.env.GDRIVE_BACKUP_FOLDER_ID) missingEnvVars.push("GDRIVE_BACKUP_FOLDER_ID");
  if (!process.env.BACKUP_ENCRYPTION_KEY) missingEnvVars.push("BACKUP_ENCRYPTION_KEY");

  // テスト環境: 環境変数未設定の場合はドライラン
  if (missingEnvVars.length > 0) {
    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      mode: "dry_run",
      message: "テスト環境: 以下の環境変数が未設定のため、ドライランで実行しました",
      missingEnvVars,
      performance: { durationMs: duration, timestamp: new Date().toISOString() },
    });
  }

  try {
    // 動的インポート（環境変数チェック後に読み込み）
    const { performBackup, cleanupOldBackups } = await import("@/services/backup/gdrive-backup");
    const { checkKeyRotationStatus } = await import("@/services/backup/key-rotation");

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
      mode: "production",
      backup: {
        fileId: backupResult.fileId,
        fileName: backupResult.fileName,
        totalDocuments: backupResult.totalDocuments,
        sizeBytes: backupResult.sizeBytes,
        encrypted: true,
        algorithm: "AES-256-GCM",
      },
      cleanup: { deletedFolders: deletedCount, retentionDays: 30 },
      keyRotation: { alerts: keyAlerts, hasAlerts: keyAlerts.length > 0 },
      performance: { durationMs: duration, timestamp: new Date().toISOString() },
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
