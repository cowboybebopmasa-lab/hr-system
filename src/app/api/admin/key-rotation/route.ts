import { NextRequest, NextResponse } from "next/server";

// GET: キーローテーション状態の確認
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({
      mode: "dry_run",
      message: "GOOGLE_SERVICE_ACCOUNT_KEY未設定のため、ドライランモードです",
      status: { serviceAccountKey: { status: "未設定" }, encryptionKey: { status: "未設定" } },
      history: [],
    });
  }

  try {
    const { checkKeyRotationStatus, getRotationHistory } = await import("@/services/backup/key-rotation");
    const status = await checkKeyRotationStatus();
    const history = await getRotationHistory(10);

    return NextResponse.json({ status, history });
  } catch (error) {
    console.error("Key rotation status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: キーローテーション実行の記録
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_KEY未設定" }, { status: 503 });
  }

  try {
    const { recordKeyRotation } = await import("@/services/backup/key-rotation");
    const body = await request.json();
    const { keyType, rotatedBy, notes } = body as {
      keyType: "service_account" | "encryption_key";
      rotatedBy: string;
      notes?: string;
    };

    if (!keyType || !rotatedBy) {
      return NextResponse.json({ error: "keyType and rotatedBy are required" }, { status: 400 });
    }

    const logId = await recordKeyRotation(keyType, rotatedBy, notes || "");
    return NextResponse.json({ success: true, logId, message: `${keyType} のローテーションが記録されました` });
  } catch (error) {
    console.error("Key rotation record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
