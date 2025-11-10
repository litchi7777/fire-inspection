# Word テンプレートセットアップガイド

## 概要
このガイドでは、消防設備点検報告書をWord形式で出力するためのテンプレート設定方法を説明します。

## 前提条件
- Microsoft Word（.doc → .docx変換用）
- テンプレートファイル: `docs/報告書フォーマット_word/tenkenhyou01.doc`

---

## セットアップ手順

### ステップ1: .doc → .docx 変換

1. **Wordで開く**
   ```
   E:\GDGoC\fire-inspection\docs\報告書フォーマット_word\tenkenhyou01.doc
   ```

2. **名前を付けて保存**
   - ファイル → 名前を付けて保存
   - ファイル形式: `Word文書 (*.docx)`
   - 保存先: `E:\GDGoC\fire-inspection\public\templates\tenkenhyou01.docx`

### ステップ2: プレースホルダーの設定

変換した `tenkenhyou01.docx` をWordで開き、以下のプレースホルダーを適切な箇所に挿入してください。

#### 基本情報

| プレースホルダー | 説明 | 例 |
|---|---|---|
| `{customerName}` | 物件名（顧客名） | "○○ビル" |
| `{address}` | 物件所在地 | "東京都千代田区..." |
| `{year}` | 点検年月 | "2024年11月" |
| `{inspectorName}` | 点検責任者名 | "山田太郎" |
| `{inspectionDate}` | 点検実施日 | "2024年11月09日" |
| `{reportCreatedDate}` | 報告書作成日 | "2024年11月09日" |

#### サマリー情報

| プレースホルダー | 説明 |
|---|---|
| `{totalPoints}` | 総設備数 |
| `{inspectedPoints}` | 点検済み件数 |
| `{okPoints}` | 正常件数 |
| `{failPoints}` | 異常件数 |
| `{uninspectedPoints}` | 未点検件数 |

#### 点検詳細（繰り返し処理）

テンプレート内で繰り返し処理を行う部分に以下を設定：

```
{#points}
設備名: {name}
種別: {type}
結果: {status}
備考: {notes}
{hasConflict}競合あり{/hasConflict}
{/points}
```

**プレースホルダー説明:**
- `{#points}...{/points}`: 点検ポイントのループ
- `{name}`: 設備名（例: "消火器 1"）
- `{type}`: 設備種別（日本語、例: "消火器"）
- `{status}`: 点検結果（"正常", "異常", "未点検"）
- `{notes}`: 備考・メモ
- `{hasConflict}...{/hasConflict}`: 競合がある場合のみ表示

### ステップ3: テンプレートの配置

編集したテンプレートを以下のパスに配置：
```
E:\GDGoC\fire-inspection\public\templates\tenkenhyou01.docx
```

**重要:** `public/templates/` フォルダに配置することで、ブラウザからアクセス可能になります。

---

## 使用方法

### 開発環境で動作確認

1. **開発サーバー起動**
   ```bash
   pnpm dev
   ```

2. **点検イベント詳細画面に移動**
   - プロジェクト選択 → 点検イベント選択

3. **Word出力ボタンをクリック**
   - 「Word出力」ボタンをクリック
   - ダウンロードされたファイルを確認

### トラブルシューティング

#### エラー: テンプレートファイルが見つかりません

**原因:** テンプレートが正しいパスに配置されていない

**解決策:**
```bash
# ファイルの存在確認
ls public/templates/tenkenhyou01.docx

# 存在しない場合は配置
# docs/報告書フォーマット_word/tenkenhyou01.doc を .docx に変換して配置
```

#### エラー: プレースホルダーが正しく置換されない

**原因:** プレースホルダーの記述ミス

**解決策:**
1. `{customerName}` のように波括弧で囲む
2. スペルミスがないか確認
3. Wordの自動修正機能でプレースホルダーが壊れていないか確認

#### エラー: 繰り返し処理が動作しない

**原因:** ループ構文のミス

**解決策:**
```
正しい: {#points}...{/points}
誤り:   {points}...{/points}
```

---

## プレースホルダー記述例

### 基本的な文書テンプレート

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
     消防設備点検票
━━━━━━━━━━━━━━━━━━━━━━━━━━━

物件名: {customerName}
所在地: {address}
点検年月: {year}
点検責任者: {inspectorName}
点検開始日: {inspectionDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
     点検結果サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━

総設備数: {totalPoints}件
点検済み: {inspectedPoints}件
正常: {okPoints}件
異常: {failPoints}件
未点検: {uninspectedPoints}件

━━━━━━━━━━━━━━━━━━━━━━━━━━━
     点検詳細
━━━━━━━━━━━━━━━━━━━━━━━━━━━

{#points}
■ {name} [{type}]
  結果: {status}
  {#notes}備考: {notes}{/notes}
  {#hasConflict}⚠ 競合が検出されています{/hasConflict}

{/points}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
報告書作成日: {reportCreatedDate}
```

---

## 高度な機能

### 条件分岐

特定の条件でのみ表示する場合:

```
{#failPoints}
※ 異常が検出された設備があります
{/failPoints}
```

### 空判定

値が空でない場合のみ表示:

```
{#notes}
備考: {notes}
{/notes}
```

---

## 参考リンク

- [docxtemplater 公式ドキュメント](https://docxtemplater.com/)
- [プレースホルダー記法](https://docxtemplater.com/docs/tag-types/)
- [ループ処理](https://docxtemplater.com/docs/tag-types/#loops)

---

## 今後の拡張

### Excel テンプレート対応

現在、以下のExcelテンプレートも存在します：
```
docs/報告書フォーマット_excel/
├── 自動火災報知設備.xlsm
├── 消火器具.xlsm
├── 屋内消火栓設備.xlsm
└── ...（18種類）
```

将来的には、`xlsx-populate` または `exceljs` を使用してExcel出力も実装可能です。

### 写真の埋め込み

点検時に撮影した写真をWord文書に埋め込む場合は、`docxtemplater-image-module` を使用します：

```bash
pnpm add docxtemplater-image-module
```

テンプレート内:
```
{%photos}
```
