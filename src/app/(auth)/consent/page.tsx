"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Shield, Database, Globe, Lock, AlertTriangle } from "lucide-react";

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    const user = auth.currentUser;
    if (user?.email) {
      localStorage.setItem(`privacy_consent_${user.email}`, new Date().toISOString());
    }
    router.push("/dashboard");
  };

  const handleDecline = () => {
    auth.signOut();
    router.push("/login");
  };

  return (
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Shield className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-xl">個人情報の取扱いに関する同意</CardTitle>
        <p className="text-sm text-muted-foreground">
          本システムをご利用いただくにあたり、以下の内容をご確認のうえ同意をお願いいたします。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 1. 収集する個人情報 */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-sm">1. 収集する個人情報</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-1 ml-6">
            <p>本システムでは、業務遂行に必要な以下の個人情報を収集・管理します。</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>氏名、フリガナ、メールアドレス、電話番号、住所</li>
              <li>生年月日、性別</li>
              <li>職歴、保有スキル、資格情報</li>
              <li>勤怠情報（出退勤時刻、休暇取得状況）</li>
              <li>給与情報（基本給、手当、控除、支給額）</li>
              <li>契約情報（派遣先、契約期間、単価）</li>
              <li>人事評価情報</li>
            </ul>
          </div>
        </section>

        <Separator />

        {/* 2. 利用目的 */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold text-sm">2. 利用目的</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-1 ml-6">
            <ul className="list-disc ml-4 space-y-1">
              <li>人材派遣業務における従業員管理・勤怠管理・給与計算</li>
              <li>AIによる企業案件と人材のマッチング</li>
              <li>契約期限管理および自動アラート通知</li>
              <li>人事評価の記録・管理</li>
              <li>業務効率化のためのデータ分析</li>
            </ul>
          </div>
        </section>

        <Separator />

        {/* 3. 外部サービスへのデータ提供 */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold text-sm">3. 外部サービスへのデータ提供</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-1 ml-6">
            <p>本システムでは以下の外部サービスを利用します。</p>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Firebase</Badge>
                <span>データの保管・認証（Google Cloud, 米国）</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Google Drive</Badge>
                <span>バックアップデータの暗号化保管</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">AI API</Badge>
                <span>スキルマッチング・OCRデータ解析（匿名化後に送信）</span>
              </div>
            </div>
            <div className="mt-2 rounded border border-orange-200 bg-orange-50 p-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <p className="text-xs">
                  AI APIへの送信時には個人を特定できる情報（氏名・連絡先等）は匿名化処理を行います。
                  バックアップデータはAES-256-GCM方式で暗号化した上でGoogle Driveに保管されます。
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* 4. セキュリティ対策 */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm">4. セキュリティ対策</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-1 ml-6">
            <ul className="list-disc ml-4 space-y-1">
              <li>通信の暗号化（HTTPS/TLS）</li>
              <li>Firebase認証によるアクセス制御</li>
              <li>バックアップデータのAES-256-GCM暗号化</li>
              <li>サービスアカウントキーの定期ローテーション（90日ごと）</li>
              <li>Firestoreセキュリティルールによるデータ保護</li>
            </ul>
          </div>
        </section>

        <Separator />

        {/* 5. 権利 */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-cyan-600" />
            <h3 className="font-semibold text-sm">5. お客様の権利</h3>
          </div>
          <div className="text-sm text-muted-foreground ml-6">
            <p>
              お客様は、ご自身の個人情報について、開示・訂正・削除を請求する権利を有します。
              また、本同意はいつでも撤回することができます。同意を撤回された場合、本システムの利用を停止させていただきます。
            </p>
          </div>
        </section>

        <Separator />

        {/* 同意チェックボックスとボタン */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">
              上記の個人情報の取扱いについて理解し、同意します。
            </span>
          </label>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1"
            >
              同意しない（ログアウト）
            </Button>
            <Button
              onClick={handleAgree}
              disabled={!agreed}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              同意してシステムを利用する
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
