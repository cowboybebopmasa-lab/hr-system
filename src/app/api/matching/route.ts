import { NextRequest, NextResponse } from "next/server";

// AIマッチングAPI — スキルベースのマッチング
// 将来的にはFirestoreベクトル検索 + LLM(Gemini/OpenAI)を統合

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requiredSkills, location, salaryMax } = body as {
      requiredSkills: string[];
      location?: string;
      salaryMax?: number;
    };

    if (!requiredSkills || requiredSkills.length === 0) {
      return NextResponse.json({ error: "requiredSkills is required" }, { status: 400 });
    }

    // TODO: Firestoreからavailable/activeな従業員を取得
    // TODO: LLM APIでスキルをベクトル化
    // TODO: Firestoreベクトル検索で類似度マッチング
    // TODO: ルールベースフィルタ（勤務地、給与）を適用

    // 現在はモックレスポンス
    return NextResponse.json({
      success: true,
      candidates: [],
      message: "Firebase/AI API接続後にマッチング結果が返されます",
    });
  } catch (error) {
    console.error("Matching API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
