import { NextRequest, NextResponse } from "next/server";

// Vercel Cron: 毎朝9時に実行 — 契約期限アラート
// vercel.json に cron 設定を追加:
// { "crons": [{ "path": "/api/cron/contract-alerts", "schedule": "0 0 * * *" }] }

const ALERT_DAYS = [60, 30, 14, 7, 3, 1];

export async function GET(request: NextRequest) {
  // Cron認証チェック
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Firestoreから有効な契約を取得
    // const contracts = await getDocuments<Contract>("contracts", {
    //   field: "status", op: "in", value: ["active", "expiring_soon"]
    // });

    // Mock: 契約期限チェックロジック
    const today = new Date();
    const alerts: { employeeName: string; clientCompany: string; daysUntilExpiry: number; endDate: string }[] = [];

    // TODO: 実際のFirestoreデータを使用
    // contracts.forEach((contract) => {
    //   const endDate = new Date(contract.endDate);
    //   const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    //   if (ALERT_DAYS.includes(diffDays)) {
    //     alerts.push({
    //       employeeName: contract.employeeName,
    //       clientCompany: contract.clientCompany,
    //       daysUntilExpiry: diffDays,
    //       endDate: contract.endDate,
    //     });
    //   }
    // });

    // TODO: SendGrid/Gmail APIでアラートメール送信
    // for (const alert of alerts) {
    //   await sendAlertEmail(alert);
    // }

    return NextResponse.json({
      success: true,
      timestamp: today.toISOString(),
      alertsSent: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error("Contract alert cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
