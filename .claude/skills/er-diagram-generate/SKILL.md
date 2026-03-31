---
name: er-diagram-generate
description: コードベースの型定義(types/index.ts)を解析し、テーブル間・項目間のリレーションを含むインタラクティブER図HTMLを自動生成・更新する。
allowed-tools: Read, Grep, Glob, Write, Bash(git *)
---

# ER図 自動生成スキル

コードベースの型定義ファイルを解析し、`public/er-diagram.html` にインタラクティブなER図を生成・更新します。

## 対象
$ARGUMENTS

---

## 実行手順

### Step 1: 型定義の解析

`src/types/index.ts` を読み取り、以下を抽出する:

1. **エンティティ（テーブル）一覧** — `export interface` で定義された各型
2. **フィールド一覧** — 各interfaceのプロパティ名・型・オプショナル(`?`)
3. **リレーション** — `xxxId: string` パターンからFK関係を自動検出
4. **埋め込みリレーション** — `xxx: YyyType[]` パターンから埋め込み参照を検出

### Step 2: レイアウト計算

エンティティを以下のルールで配置する:

- **中心テーブル**: FK参照が最も多いテーブルを中心（通常 employees）
- **放射配置**: 中心テーブルを参照するテーブルを周囲に配置
- **間隔**: テーブル間は最低200px以上の間隔を確保
- **独立テーブル**: FK関係がないテーブルは外周に配置

### Step 3: HTML生成

以下の仕様で `public/er-diagram.html` を生成する:

#### テーブルカード仕様
```html
<div class="tbl tbl-{カラーclass}" id="tbl-{テーブル名}" style="left:{X}px;top:{Y}px">
  <div class="tbl-head">{emoji} {テーブル名} <small>{日本語名}</small></div>
  <!-- セクション（あれば） -->
  <div class="tbl-section">{セクション名}</div>
  <!-- PK行 -->
  <div class="tbl-row pk">
    <span class="col-icon">🔑</span>
    <span class="col-name">id</span>
    <span class="col-type">string (auto)</span>
  </div>
  <!-- FK行 -->
  <div class="tbl-row fk">
    <span class="col-icon">🔗</span>
    <span class="col-name">{fk名}</span>
    <span class="col-type">&rarr; {参照先}.id</span>
  </div>
  <!-- 通常行 -->
  <div class="tbl-row">
    <span class="col-icon"></span>
    <span class="col-name">{フィールド名}</span>
    <span class="col-type">{型}</span>
  </div>
  <!-- 注釈行 -->
  <div class="tbl-row">
    <span class="col-icon"></span>
    <span class="col-name"></span>
    <span class="col-note">{補足説明}</span>
  </div>
  <!-- タイムスタンプ行 -->
  <div class="tbl-row">
    <span class="col-icon">🕐</span>
    <span class="col-name">createdAt / updatedAt</span>
    <span class="col-type">ISO string</span>
  </div>
</div>
```

#### カラー割当ルール
テーブルごとに一意のカラーを割り当てる。推奨パレット:
```
#3b5bdb (blue)    — 中心テーブル（employees等）
#ea580c (orange)  — contracts
#0891b2 (cyan)    — attendance
#059669 (green)   — payroll
#7c3aed (purple)  — jobPostings
#d946ef (pink)    — evaluations
#d97706 (amber)   — expenses
#64748b (slate)   — users/auth系
#ef4444 (red)     — logs/audit系
#0284c7 (sky)     — 追加テーブル用
#be185d (rose)    — 追加テーブル用
```

#### リレーション描画仕様

**2レイヤー方式で描画する:**

1. **テーブルレベル（太い実線）**
   - テーブルの辺の中点からベジェ曲線で接続
   - 線幅: 2.5px、不透明度: 0.85
   - 中央にラベル（`1:N`, `N:N` 等）とFK名を表示
   - ラベルは暗い背景矩形の上に配置

2. **項目レベル（薄い破線）**
   - FK項目の行位置 → PK項目の行位置を破線で接続
   - 線幅: 1.5px、破線（6 3）、不透明度: 0.4
   - 始点・終点にドット（半径3px）を表示
   - FK/PK行に色付き左ボーダー + 薄い背景ハイライト

**リレーション検出ロジック:**
```javascript
const RELATIONS = [
  // 1:N — FK参照（xxxId フィールド）
  { from: "tbl-{参照先}", to: "tbl-{テーブル}", label: "1 : N",
    fk: "{fkフィールド名}", color: "{toテーブルの色}",
    fromField: "id", toField: "{fkフィールド名}" },
  // N:N — 埋め込み配列
  { from: "tbl-{テーブル}", to: "tbl-{参照先}", label: "N : N",
    fk: "{配列フィールド名}", color: "{fromテーブルの色}",
    fromField: "{配列フィールド名}", toField: "id" },
];
```

#### 接続方向の決定
```javascript
function bestSide(fromEl, toEl) {
  // fromの中心X < toの中心X → from:right, to:left
  // fromの中心X > toの中心X → from:left, to:right
}
```

#### 項目位置の取得
```javascript
function getFieldRowY(tableEl, fieldName) {
  // テーブル内の .tbl-row > .col-name からfieldNameを検索
  // 行のoffsetTop + height/2 をテーブルのoffsetTopに加算
}
```

### Step 4: インタラクティブ機能

以下の機能を含める:

1. **パン＆ズーム** — マウスドラッグでパン、ホイールでズーム、ピンチズーム対応
2. **全体表示ボタン** — 全テーブルが画面内に収まるようにフィットする `⊞` ボタン
3. **ズームコントロール** — 右下に `+` / `-` / `↺`（リセット）ボタン
4. **ミニマップ** — 左下に全体を縮小表示、クリックでジャンプ
5. **凡例** — 右下にテーブル名と色の一覧
6. **設計方針メモ** — 左下に非正規化・ベクトル検索等の設計ノート

### Step 5: 初期化

```javascript
window.addEventListener("load", () => {
  drawArrows();  // リレーション描画
  fitAll();      // 全体表示
});
window.addEventListener("resize", () => {
  drawArrows();
  updateMinimap();
});
```

---

## 出力

`public/er-diagram.html` に単一HTMLファイルとして出力する。外部依存なし（CSS/JSはすべてインライン）。

## 検証

生成後、以下を確認:
1. 全テーブルが表示されているか
2. 全リレーション（FK参照）が太い線 + 薄い線の2レイヤーで表示されているか
3. 矢印がテーブルの辺に正しく接続されているか
4. パン/ズームが動作するか
5. ミニマップが正しく表示されるか
