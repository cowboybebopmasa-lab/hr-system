# HR System プロジェクトタスク管理

最終更新: 2026-03-30

---

## 完了済みタスク

### Phase 0: 基盤構築
- [x] Next.js 16 プロジェクト初期化（TypeScript + Tailwind CSS v4）
- [x] shadcn/ui (base-ui) デザインシステム導入
- [x] Firebase Auth + Firestore 設定・接続
- [x] 共通レイアウト（サイドバー + ヘッダー）
- [x] Vercel デプロイ + GitHub連携

### Phase 1: コア機能
- [x] ダッシュボード（統計カード・グラフ表示・リンク付き）
- [x] 従業員管理（CRUD・検索・詳細・スキル管理）
- [x] AIマッチングエンジン（スキルベースマッチング・スコアリング）

### Phase 2: 業務管理
- [x] 勤怠管理（打刻登録・月次集計・残業計算）
- [x] 契約管理（期限アラート・残日数表示・請求単価管理）
- [x] 契約期限自動アラート（Vercel Cron 毎日実行）

### Phase 3: 給与・採用
- [x] 給与管理（明細表示・確定/支払ワークフロー）
- [x] 採用管理（案件登録・候補者マッチング表示）

### Phase 4: 評価・OCR
- [x] 評価管理（評価作成・スコアバー・承認フロー）
- [x] OCR・データ自動入力（画像/PDF OCR + URLスクレイピング）

### Phase 5: セキュリティ・バックアップ
- [x] Firebase Admin SDK 導入（サーバーサイドFirestoreアクセス）
- [x] AES-256-GCM バックアップデータ暗号化
- [x] サービスアカウントキー ローテーション管理システム（90日サイクル）
- [x] ログインページ（Firebase Auth メール/パスワード認証）
- [x] 個人情報保護法 同意ページ（初回ログイン時）
- [x] Google Drive 日次自動バックアップ（Vercel Cron JST 02:00）
- [x] 古いバックアップ自動削除（30日保持）
- [x] スマートフォン レスポンシブ対応
- [x] Vercel Cron 実行時間制限 検証計画策定

---

## 未完了タスク（本番運用に向けて）

### 環境変数設定（優先度: 高）

| 環境変数 | 用途 | 状態 | 手順 |
|---------|------|------|------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Firebase Admin + Google Drive API | 未設定 | GCPコンソールでサービスアカウントキーを作成し、JSONを1行に圧縮してVercelに設定 |
| `GDRIVE_BACKUP_FOLDER_ID` | バックアップ先Google Driveフォルダ | 未設定 | hr-system@neofrontia.com のDriveにフォルダを作成し、IDを設定 |
| `BACKUP_ENCRYPTION_KEY` | バックアップ暗号化キー | ローカルのみ設定済 | Vercel環境変数にも設定 |
| `CRON_SECRET` | Cronジョブ認証トークン | ローカルのみ設定済 | Vercel環境変数にも設定 |
| `OPENAI_API_KEY` | AIマッチング・OCR構造化 | 未設定 | OpenAIダッシュボードでAPI Key発行 |
| `GEMINI_API_KEY` | AI代替（Gemini） | 未設定 | Google AI StudioでAPI Key発行 |
| `GOOGLE_CLOUD_API_KEY` | Cloud Vision OCR | 未設定 | GCPコンソールでCloud Vision APIを有効化しキー発行 |
| `SENDGRID_API_KEY` | 契約アラートメール送信 | 未設定 | SendGridアカウント作成・キー発行 |

### 機能改善（優先度: 中）

- [ ] Firestoreへのモックデータ投入スクリプト作成
- [ ] ダッシュボードに「最終バックアップ日時」表示追加
- [ ] 管理者向け「手動バックアップ実行」ボタン追加
- [ ] バックアップ成功/失敗のSlack通知連携
- [ ] バックアップリストア手順書の作成
- [ ] テストコード追加（Jest + Playwright、カバレッジ80%目標）
- [ ] ダークモード完全対応（rechartsグラフのテキスト色）

### セキュリティ・法務（優先度: 高）

- [ ] Firestore Security Rules の詳細設計（コレクション別ルール）
- [ ] RBAC（ロールベースアクセス制御）の実装（管理者/コーディネーター/閲覧者）
- [ ] AI APIへの個人情報送信時のPII匿名化レイヤー実装
- [ ] プライバシーポリシーの法務顧問レビュー
- [ ] 従業員データ削除リクエスト対応機能
- [ ] 監査ログ（誰がいつ何を変更したか）

### インフラ・DevOps（優先度: 中）

- [ ] CI/CD パイプライン構築（GitHub Actions）
- [ ] Sentry エラートラッキング導入
- [ ] Vercel Analytics 設定
- [ ] ステージング環境の構築
- [ ] Vercel Cron 実行時間の本番検証（docs/cron-verification-plan.md参照）

---

## アーキテクチャ概要

```
src/
├── app/
│   ├── (app)/          # 認証後のメインアプリ（サイドバー付きレイアウト）
│   │   ├── dashboard/  # ダッシュボード
│   │   ├── employees/  # 従業員管理
│   │   ├── attendance/ # 勤怠管理
│   │   ├── payroll/    # 給与管理
│   │   ├── contracts/  # 契約管理
│   │   ├── recruitment/# 採用管理
│   │   ├── matching/   # AIマッチング
│   │   ├── ocr/        # OCR・データ自動入力
│   │   └── evaluation/ # 評価管理
│   ├── (auth)/         # 認証関連（レイアウト別）
│   │   ├── login/      # ログインページ
│   │   └── consent/    # 個人情報保護同意ページ
│   └── api/
│       ├── cron/
│       │   ├── contract-alerts/  # 契約期限アラート（日次Cron）
│       │   └── backup-gdrive/   # Google Driveバックアップ（日次Cron）
│       ├── matching/             # AIマッチングAPI
│       ├── ocr/
│       │   ├── image/           # 画像/PDF OCR API
│       │   └── url/             # URLスクレイピングAPI
│       └── admin/
│           └── key-rotation/    # キーローテーション管理API
├── components/
│   ├── layout/         # サイドバー・ヘッダー
│   └── ui/             # shadcn/ui コンポーネント
├── lib/
│   ├── firebase.ts     # Firebase Client SDK
│   ├── firebase-admin.ts # Firebase Admin SDK（遅延初期化）
│   ├── firestore.ts    # Firestore CRUD ヘルパー
│   ├── mock-data.ts    # 開発用モックデータ
│   └── utils.ts        # ユーティリティ
├── services/
│   └── backup/
│       ├── encryption.ts        # AES-256-GCM 暗号化/復号
│       ├── firestore-export.ts  # Firestore全コレクションエクスポート
│       ├── gdrive-backup.ts     # Google Drive アップロード/世代管理
│       └── key-rotation.ts      # キーローテーション管理
└── types/
    └── index.ts        # TypeScript型定義
```

---

## デプロイ情報

| 項目 | 値 |
|------|-----|
| GitHub | https://github.com/cowboybebopmasa-lab/hr-system |
| Vercel | https://hr-system-umber.vercel.app |
| Firebase Project | hr-system-956bc |
| バックアップ先 | hr-system@neofrontia.com Google Drive |
| Cron: 契約アラート | 毎日 UTC 00:00 (JST 09:00) |
| Cron: バックアップ | 毎日 UTC 17:00 (JST 02:00) |

---

## コスト見積もり（月額）

| 項目 | 金額 |
|------|------|
| Vercel Pro | ¥3,000 |
| Firebase (Blaze) | ¥3,000〜¥8,000 |
| Google Workspace | ¥1,000 |
| AI API (OpenAI/Gemini) | ¥3,000〜¥8,000 |
| Cloud Vision OCR | ¥1,000〜¥3,000 |
| SendGrid | ¥0〜¥3,000 |
| **合計** | **¥11,000〜¥26,000/月** |
