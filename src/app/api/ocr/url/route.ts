import { NextRequest, NextResponse } from "next/server";

// URLスクレイピングAPI — 企業採用ページや個人情報URLから構造化データを抽出
// Flow: URL → HTMLフェッチ → LLMで構造解析 → JSON返却

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type } = body as { url: string; type: "job_posting" | "resume" };

    if (!url) {
      return NextResponse.json({ error: "URLが指定されていません" }, { status: 400 });
    }

    // URL形式バリデーション
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "有効なURLを入力してください" }, { status: 400 });
    }

    // プライベートIPへのアクセスを防止（SSRF対策）
    const hostname = parsedUrl.hostname;
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname === "0.0.0.0"
    ) {
      return NextResponse.json({ error: "内部ネットワークへのアクセスは許可されていません" }, { status: 403 });
    }

    // Step 1: URLからHTMLを取得
    let htmlContent: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HRSystemBot/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `ページの取得に失敗しました (HTTP ${response.status})` },
          { status: 422 }
        );
      }

      htmlContent = await response.text();
    } catch (fetchError) {
      return NextResponse.json(
        { error: "ページの取得に失敗しました。URLが正しいか確認してください。" },
        { status: 422 }
      );
    }

    // HTMLからテキストを抽出（タグ除去）
    const textContent = htmlContent
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // LLMコンテキスト制限

    if (textContent.length < 50) {
      return NextResponse.json(
        { error: "ページから十分なテキストを抽出できませんでした" },
        { status: 422 }
      );
    }

    // Step 2: LLM で構造化データに変換
    let structuredData;
    const documentType = type || "job_posting";

    if (process.env.OPENAI_API_KEY) {
      structuredData = await structureUrlWithOpenAI(textContent, documentType, url);
    } else if (process.env.GEMINI_API_KEY) {
      structuredData = await structureUrlWithGemini(textContent, documentType, url);
    } else {
      // LLM未設定時
      structuredData = {
        _note: "LLM APIキー未設定のため、自動構造化ができません。手動での入力が必要です。",
        _rawText: textContent.slice(0, 2000),
        _sourceUrl: url,
      };
    }

    return NextResponse.json({
      success: true,
      sourceUrl: url,
      documentType,
      structuredData,
      textLength: textContent.length,
    });
  } catch (error) {
    console.error("URL scraping API error:", error);
    return NextResponse.json({ error: "URL解析中にエラーが発生しました" }, { status: 500 });
  }
}

// --- OpenAI による構造化 ---
async function structureUrlWithOpenAI(text: string, type: string, url: string) {
  const prompt = getUrlStructurePrompt(text, type, url);
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
async function structureUrlWithGemini(text: string, type: string, url: string) {
  const prompt = getUrlStructurePrompt(text, type, url);
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

// --- URL構造化プロンプト ---
function getUrlStructurePrompt(text: string, type: string, url: string): string {
  if (type === "resume") {
    return `以下はWebページから抽出したテキストです。個人の経歴・スキル情報を構造化してください。
URL: ${url}

テキスト:
${text}

以下のJSON形式で出力してください。情報が見つからない項目は空文字列または空配列にしてください:
{
  "name": "氏名",
  "nameKana": "フリガナ",
  "email": "メールアドレス",
  "phone": "電話番号",
  "address": "住所",
  "skills": ["スキル1", "スキル2"],
  "certifications": ["資格1"],
  "experience": [{"company": "会社名", "role": "役職", "startDate": "", "endDate": "", "description": "業務内容"}],
  "preferredLocations": ["勤務地"]
}`;
  }

  return `以下はWebページから抽出したテキストです。求人・案件情報を構造化してください。
URL: ${url}

テキスト:
${text}

以下のJSON形式で出力してください。情報が見つからない項目は空文字列・0・空配列にしてください:
{
  "clientCompany": "企業名",
  "title": "職種・ポジション名",
  "description": "業務内容の要約（200文字以内）",
  "requiredSkills": ["必須スキル1", "必須スキル2"],
  "preferredSkills": ["歓迎スキル1"],
  "location": "勤務地",
  "salaryMin": 月給下限(数値),
  "salaryMax": 月給上限(数値),
  "startDate": "開始日(YYYY-MM-DD形式、不明なら空文字)",
  "duration": "契約期間"
}`;
}
