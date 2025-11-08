# 消防点検DXアプリケーション

消防点検業務をDXするPWAアプリケーション。タブレット・PC対応で、音声入力による点検業務の効率化と即日報告書作成を実現します。

## 主な機能

### 点検業務
- 図面上での点検ポイント管理
- 音声入力による点検結果記録 (Google Gemini API)
- マニュアル入力モード
- オフライン対応
- 複数デバイス同時編集 (競合検出機能付き)

### 報告書作成
- 点検結果からExcel/Word報告書を自動生成
- 政府指定フォーマット対応

### ユーザー管理
- ロールベース権限管理 (管理者/点検者/閲覧者)
- 会社単位でのデータ管理

## 技術スタック

### フロントエンド
- **ビルドツール**: Vite
- **フレームワーク**: React 18+ (TypeScript)
- **状態管理**: Zustand
- **UIライブラリ**: Tailwind CSS
- **ルーティング**: React Router v6
- **フォーム**: React Hook Form + Zod
- **図面操作**: react-zoom-pan-pinch
- **PDF処理**: PDF.js
- **日付**: date-fns
- **アイコン**: lucide-react

### バックエンド
- **認証**: Firebase Authentication
- **データベース**: Firestore
- **ストレージ**: Cloud Storage
- **音声入力**: Google Gemini API
- **ホスティング**: Firebase Hosting

## セットアップ

### 1. 依存パッケージのインストール

```bash
pnpm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、Firebase と Gemini API の設定を記入します。

```bash
cp .env.example .env
```

### 3. 開発サーバーの起動

```bash
pnpm dev
```

## スクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド |
| `pnpm preview` | ビルドしたアプリのプレビュー |
| `pnpm lint` | ESLintでコードチェック |
| `pnpm format` | Prettierでコード整形 |
| `pnpm test` | テスト実行 |

## フォルダ構成

```
src/
├── components/          # Reactコンポーネント
│   ├── auth/           # 認証関連
│   ├── project/        # 案件管理
│   ├── drawing/        # 図面表示
│   ├── inspection/     # 点検機能
│   └── common/         # 共通コンポーネント
├── stores/             # Zustand ストア
├── hooks/              # カスタムフック
├── services/           # API・ビジネスロジック
│   ├── firebase/       # Firebase操作
│   ├── pdf/            # PDF処理
│   └── gemini/         # Gemini API
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
├── App.tsx             # ルートコンポーネント
└── main.tsx            # エントリーポイント
```

## ドキュメント

- [DESIGN_DOC.md](./DESIGN_DOC.md) - 設計仕様書
- [docs/TECH_STACK.md](./docs/TECH_STACK.md) - 技術スタック詳細
- [docs/ADR-001-state-management.md](./docs/ADR-001-state-management.md) - 状態管理の選定理由
- [.claude/claude.md](./.claude/claude.md) - Claude Code設定

## コーディング規約

### 命名規則
- **コンポーネント**: PascalCase (`LoginForm.tsx`)
- **フック**: camelCase with `use` prefix (`useAuth.ts`)
- **ストア**: camelCase with `use` prefix (`useAuthStore.ts`)
- **ユーティリティ**: camelCase (`formatDate.ts`)
- **型定義**: PascalCase (`User.ts`)

### Git規則
- **ブランチ**: `feature/*`, `fix/*`
- **コミット**: Conventional Commits形式
  - `feat: 新機能追加`
  - `fix: バグ修正`
  - `docs: ドキュメント更新`
  - `style: コードフォーマット`
  - `refactor: リファクタリング`
  - `test: テスト追加・修正`

## ライセンス

Private
