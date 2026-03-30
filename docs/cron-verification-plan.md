# Vercel Cron 実行時間制限 検証計画

## 概要

Vercel Cronジョブの実行時間制限内でバックアップ処理が完了するかを検証する。

## Vercel プラン別制限

| プラン | Functions実行時間 | Cronジョブ数 | 頻度 |
|--------|-------------------|-------------|------|
| Hobby | 10秒 | 2 | 1日1回 |
| Pro | 60秒 | 40 | 1日1回〜1分ごと |
| Enterprise | 900秒 | 無制限 | カスタム |

**現在の設定:** `maxDuration = 60`（Proプラン前提）

---

## 検証項目

### Phase 1: ベースライン計測（データ少量時）

| # | テスト項目 | 目標時間 | 計測方法 |
|---|-----------|---------|---------|
| 1 | Firestore全コレクション読取（〜100件） | < 3秒 | API直接呼出 + durationMs確認 |
| 2 | JSONシリアライズ + AES-256-GCM暗号化（〜1MB） | < 1秒 | API直接呼出 |
| 3 | Google Drive フォルダ検索 + 作成 | < 3秒 | API直接呼出 |
| 4 | Google Drive ファイルアップロード（〜1MB） | < 5秒 | API直接呼出 |
| 5 | 古いバックアップ削除（〜10フォルダ） | < 3秒 | API直接呼出 |
| 6 | **全体の合計** | **< 15秒** | Cronレスポンスの durationMs |

### Phase 2: スケールテスト

| データ量 | 想定JSON size | 暗号化後size | 想定処理時間 |
|---------|--------------|-------------|------------|
| 100件 | ~200KB | ~200KB | ~10秒 |
| 500件 | ~1MB | ~1MB | ~15秒 |
| 1,000件 | ~2MB | ~2MB | ~20秒 |
| 5,000件 | ~10MB | ~10MB | ~35秒 |
| 10,000件 | ~20MB | ~20MB | ~50秒 ⚠️ |
| 10,000件超 | >20MB | >20MB | >60秒 ❌ |

### Phase 3: タイムアウト対策

10,000件を超える場合の対策:

1. **コレクション分割バックアップ**
   - 1回のCron実行で1-2コレクションのみ処理
   - 7つのコレクションを曜日ごとに分散
   - `schedule: "0 17 * * 0"` (日曜=employees), `"0 17 * * 1"` (月曜=contracts) ...

2. **差分バックアップ**
   - `updatedAt` フィールドで前回バックアップ以降の変更分のみエクスポート
   - フルバックアップは週1回、差分は毎日

3. **Vercel Background Functions (Beta)**
   - `export const runtime = 'nodejs'` + `maxDuration = 300`
   - Proプランで最大300秒（5分）まで延長可能

---

## 検証手順

### Step 1: 手動テスト実行

```bash
# ローカルでの実行
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/backup-gdrive

# Vercel上での実行
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://hr-system-umber.vercel.app/api/cron/backup-gdrive
```

### Step 2: レスポンスの確認

```json
{
  "success": true,
  "backup": {
    "totalDocuments": 100,
    "sizeBytes": 204800
  },
  "performance": {
    "durationMs": 12345
  }
}
```

### Step 3: Vercel Logs での確認

- Vercel Dashboard > Functions > Logs で実行時間を確認
- 50秒を超える場合は対策を検討

---

## 判定基準

| 結果 | 判定 | アクション |
|------|------|-----------|
| < 30秒 | ✅ 安全 | 現行構成で運用可 |
| 30-50秒 | ⚠️ 注意 | データ増加時の対策を準備 |
| 50-60秒 | ⚠️ 危険 | コレクション分割を即実装 |
| > 60秒 | ❌ タイムアウト | 分割 or Background Functions必須 |

---

## スケジュール

| 日程 | 内容 |
|------|------|
| Week 1 | Phase 1 ベースライン計測（テストデータ100件） |
| Week 2 | Phase 2 スケールテスト（500件→1,000件→5,000件） |
| Week 3 | 結果に基づきPhase 3の対策実装（必要な場合のみ） |
| Week 4 | 本番環境での検証 + 監視設定 |
