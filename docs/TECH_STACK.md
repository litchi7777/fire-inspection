# 技術スタック詳細

## 選定理由と特徴

### Vite
**選定理由**:
- 高速な開発サーバー起動(ESビルド使用)
- HMR(Hot Module Replacement)が非常に高速
- TypeScript、React、PWAのサポートが優れている
- ビルド時間が短い

**設定ファイル**: `vite.config.ts`

---

### React 18 + TypeScript
**選定理由**:
- Concurrent Featuresによるパフォーマンス向上
- 型安全性による開発効率とバグ削減
- 豊富なエコシステム

**主要機能**:
- Suspense for Data Fetching
- Automatic Batching
- useTransition (UI更新の優先度制御)

---

### Zustand
**選定理由**: [ADR-001](./ADR-001-state-management.md) 参照

**主要機能**:
- シンプルなAPI
- TypeScript完全サポート
- Persist middleware (IndexedDB連携)
- DevTools middleware

**推奨ストア構成**:
```
src/stores/
  ├── useAuthStore.ts      # 認証状態
  ├── useProjectStore.ts   # 案件データ
  ├── useInspectionStore.ts # 点検データ
  ├── useUIStore.ts        # UI状態
  └── useOfflineStore.ts   # オフライン同期キュー
```

---

### Tailwind CSS
**選定理由**:
- ユーティリティファーストで開発速度が速い
- レスポンシブ対応が容易
- バンドルサイズ最適化(PurgeCSS内蔵)
- カスタマイズ性が高い

**主要設定**:
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'status-uninspected': '#000000',
        'status-ok': '#22c55e',
        'status-fail': '#ef4444',
        'status-conflict': '#eab308',
      },
    },
  },
}
```

---

### react-zoom-pan-pinch
**選定理由**:
- タッチ操作、マウス操作両対応
- パン、ズーム、ピンチズームをサポート
- TypeScript対応
- パフォーマンスが良い

**主要機能**:
- ダブルタップでズーム
- ホイールでズーム
- ドラッグでパン
- 最小/最大ズーム制限

---

### PDF.js
**選定理由**:
- Mozillaが開発する信頼性の高いライブラリ
- ブラウザ上でPDF処理が可能
- Canvas APIでPNGに変換可能

**処理フロー**:
1. ユーザーがPDFをアップロード
2. PDF.jsでPDFを読み込み
3. 各ページをCanvasにレンダリング
4. Canvas.toBlob()でPNGに変換
5. Firebase Cloud Storageにアップロード
6. Firestoreにメタデータを保存

---

### Firebase
**選定理由**:
- フルマネージド(インフラ管理不要)
- リアルタイム同期機能
- 認証機能が充実
- 無料枠が充実

**使用サービス**:
- **Authentication**: メール/パスワード認証
- **Firestore**: NoSQLデータベース
- **Cloud Storage**: ファイルストレージ
- **Hosting**: PWAホスティング

**Firestoreセキュリティルール例**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/projects/$(projectId)).data.companyId ==
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId;
    }
  }
}
```

---

### Workbox (Service Worker)
**選定理由**:
- PWAのベストプラクティスを実装
- オフライン対応が容易
- キャッシュ戦略が豊富

**キャッシュ戦略**:
- **Network First**: API呼び出し(オンライン優先、オフライン時はキャッシュ)
- **Cache First**: 静的アセット(画像、CSS、JS)
- **Stale While Revalidate**: 図面PNG(キャッシュを表示しつつバックグラウンドで更新)

---

### ESLint + Prettier
**選定理由**:
- コード品質の統一
- バグの早期発見
- チーム開発での一貫性

**推奨設定**:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react/react-in-jsx-scope": "off"
  }
}
```

---

## パッケージ一覧

### 必須パッケージ
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "firebase": "^10.7.0",
    "react-zoom-pan-pinch": "^3.3.0",
    "pdfjs-dist": "^3.11.0",
    "@google/generative-ai": "^0.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.0",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "workbox-window": "^7.0.0"
  }
}
```

---

## フォルダ構成

```
fire-inspection/
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── auth/           # 認証関連
│   │   ├── project/        # 案件管理
│   │   ├── drawing/        # 図面表示
│   │   ├── inspection/     # 点検機能
│   │   └── common/         # 共通コンポーネント
│   ├── stores/             # Zustand ストア
│   ├── hooks/              # カスタムフック
│   ├── services/           # API・ビジネスロジック
│   │   ├── firebase/       # Firebase操作
│   │   ├── pdf/            # PDF処理
│   │   └── gemini/         # Gemini API
│   ├── types/              # TypeScript型定義
│   ├── utils/              # ユーティリティ関数
│   ├── App.tsx             # ルートコンポーネント
│   └── main.tsx            # エントリーポイント
├── public/                 # 静的ファイル
├── docs/                   # ドキュメント
│   ├── DESIGN_DOC.md
│   ├── TECH_STACK.md
│   └── ADR-001-state-management.md
├── 報告書フォーマット/      # Excelテンプレート
├── 報告書フォーマット_word/ # Wordテンプレート
├── .eslintrc.json
├── .prettierrc
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 開発フロー

1. **セットアップ**
   ```bash
   npm install
   ```

2. **開発サーバー起動**
   ```bash
   npm run dev
   ```

3. **リンター実行**
   ```bash
   npm run lint
   npm run format
   ```

4. **ビルド**
   ```bash
   npm run build
   ```

5. **プレビュー**
   ```bash
   npm run preview
   ```

6. **デプロイ**
   ```bash
   firebase deploy
   ```
