import { NextRequest, NextResponse } from "next/server";

// 画像/PDF OCR API — Cloud Vision + LLM で履歴書・求人票を構造化データに変換
// Flow: アップロード画像 → Cloud Vision(テキスト抽出) → LLM(構造化) → JSON返却

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("type") as string | null; // "resume" | "job_posting"

    if (!file) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "対応形式: PNG, JPEG, WebP, PDF" },
        { status: 400 }
      );
    }

    // ファイルをBase64に変換
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Step 1: Cloud Vision API でテキスト抽出
    let extractedText = "";

    if (process.env.GOOGLE_CLOUD_API_KEY) {
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64 },
                features: [{ type: "TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );
      const visionData = await visionResponse.json();
      extractedText =
        visionData.responses?.[0]?.fullTextAnnotation?.text || "";
    } else {
      // Cloud Vision未設定時：デモ用のモックテキスト
      extractedText = generateMockOcrText(documentType || "resume");
    }

    if (!extractedText) {
      return NextResponse.json(
        { error: "テキストを抽出できませんでした。画像が鮮明か確認してください。" },
        { status: 422 }
      );
    }

    // Step 2: LLM (OpenAI/Gemini) で構造化データに変換
    let structuredData;

    if (process.env.OPENAI_API_KEY) {
      structuredData = await structureWithOpenAI(
        extractedText,
        documentType || "resume"
      );
    } else if (process.env.GEMINI_API_KEY) {
      structuredData = await structureWithGemini(
        extractedText,
        documentType || "resume"
      );
    } else {
      // LLM未設定時：簡易パース
      structuredData = simpleStructure(extractedText, documentType || "resume");
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      documentType: documentType || "resume",
      extractedText,
      structuredData,
    });
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json({ error: "OCR処理中にエラーが発生しました" }, { status: 500 });
  }
}

// --- OpenAI による構造化 ---
async function structureWithOpenAI(text: string, type: string) {
  const prompt = getStructurePrompt(text, type);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

// --- Gemini による構造化 ---
async function structureWithGemini(text: string, type: string) {
  const prompt = getStructurePrompt(text, type);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    }
  );
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(content);
}

// --- 構造化プロンプト ---
function getStructurePrompt(text: string, type: string): string {
  if (type === "contract") {
    return `以下は契約書から抽出したテキストです。JSONで構造化してください。

テキスト:
${text}

以下のJSON形式で出力してください:
{
  "employeeName": "従業員名/派遣スタッフ名",
  "clientCompany": "派遣先企業名/委託元企業名",
  "role": "業務内容・役職",
  "startDate": "契約開始日(YYYY-MM-DD)",
  "endDate": "契約終了日(YYYY-MM-DD)",
  "hourlySalary": 数値(時給、不明なら0),
  "billingRate": 数値(請求単価、不明なら0),
  "workLocation": "勤務地",
  "workHours": "勤務時間",
  "notes": "特記事項・備考"
}`;
  }

  if (type === "job_posting") {
    return `以下は求人票から抽出したテキストです。JSONで構造化してください。

テキスト:
${text}

以下のJSON形式で出力してください:
{
  "clientCompany": "企業名",
  "title": "職種名",
  "description": "業務内容の要約",
  "requiredSkills": ["スキル1", "スキル2"],
  "preferredSkills": ["歓迎スキル1"],
  "location": "勤務地",
  "salaryMin": 数値(月給下限),
  "salaryMax": 数値(月給上限),
  "startDate": "開始日(YYYY-MM-DD)",
  "duration": "期間"
}`;
  }

  return `以下は履歴書から抽出したテキストです。JSONで構造化してください。

テキスト:
${text}

以下のJSON形式で出力してください:
{
  "name": "氏名",
  "nameKana": "フリガナ",
  "email": "メールアドレス",
  "phone": "電話番号",
  "address": "住所",
  "dateOfBirth": "生年月日(YYYY-MM-DD)",
  "gender": "male/female/other",
  "skills": ["スキル1", "スキル2"],
  "certifications": ["資格1", "資格2"],
  "experience": [
    {
      "company": "会社名",
      "role": "役職",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD または null",
      "description": "業務内容"
    }
  ],
  "desiredSalary": 数値(希望月給),
  "preferredLocations": ["希望勤務地1"]
}`;
}

// --- LLM未設定時の簡易パース ---
function simpleStructure(text: string, type: string) {
  if (type === "contract") {
    return {
      employeeName: "", clientCompany: "", role: "",
      startDate: "", endDate: "", hourlySalary: 0, billingRate: 0,
      workLocation: "", workHours: "", notes: "",
      _note: "LLM APIキー未設定のため、手動での入力が必要です", _rawText: text,
    };
  }
  if (type === "job_posting") {
    return {
      clientCompany: "", title: "", description: text.slice(0, 200),
      requiredSkills: [], preferredSkills: [], location: "",
      salaryMin: 0, salaryMax: 0, startDate: "", duration: "",
      _note: "LLM APIキー未設定のため、手動での入力が必要です", _rawText: text,
    };
  }
  return {
    name: "", nameKana: "", email: "", phone: "", address: "",
    dateOfBirth: "", gender: "other", skills: [], certifications: [],
    experience: [], desiredSalary: 0, preferredLocations: [],
    _note: "LLM APIキー未設定のため、手動での入力が必要です", _rawText: text,
  };
}

// --- デモ用モックOCRテキスト ---
function generateMockOcrText(type: string): string {
  if (type === "contract") {
    return `業務委託契約書

甲（委託者）: 株式会社テックソリューション
乙（受託者）: 田中 太郎

第1条（業務内容）
甲は乙に対し、以下の業務を委託する。
業務内容: フロントエンドエンジニアとしてのWebアプリケーション開発

第2条（契約期間）
契約期間: 2024年4月1日 から 2024年9月30日 まで

第3条（報酬）
時間単価: 2,800円（税別）
請求単価: 4,500円（税別）
支払日: 翌月末日

第4条（勤務条件）
勤務地: 東京都渋谷区神南1-2-3 テックビル5F
勤務時間: 9:00〜18:00（休憩1時間）

第5条（特記事項）
リモートワーク併用可（週3日出社）`;
  }
  if (type === "job_posting") {
    return `求人票
株式会社テックイノベーション
募集職種: フルスタックエンジニア
業務内容: Next.js/React を用いた SaaS プロダクトの開発。
バックエンド API の設計・実装。CI/CD パイプラインの構築。
必要スキル: React, TypeScript, Node.js, PostgreSQL
歓迎スキル: AWS, Docker, GraphQL
勤務地: 東京都渋谷区（リモート併用可）
給与: 月給 45万円 〜 65万円
契約期間: 6ヶ月（更新あり）
開始日: 2024年8月1日`;
  }
  return `履歴書
氏名: 山田 太郎
フリガナ: ヤマダ タロウ
生年月日: 1990年5月15日
住所: 東京都渋谷区神南1-2-3
電話: 090-1234-5678
メール: yamada.taro@example.com
【職務経歴】
2018年4月 - 2022年3月 株式会社ABC フロントエンドエンジニア
React/Next.js を用いた SPA 開発を担当
2022年4月 - 現在 株式会社XYZ フルスタックエンジニア
マイクロサービス基盤の設計・構築
【保有スキル】
React, TypeScript, Node.js, AWS, Docker
【資格】
AWS Solutions Architect Associate
基本情報技術者
【希望条件】
希望月給: 45万円
希望勤務地: 東京都、神奈川県`;
}
