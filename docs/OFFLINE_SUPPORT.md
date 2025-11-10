# オフライン対応機能ドキュメント

## 概要

消防点検アプリにオフライン対応機能を実装しました。これにより、インターネット接続がない環境でも点検作業を継続でき、オンラインに復帰した際に自動的にデータが同期されます。

## 実装された機能

### 1. Service Worker (PWA)

**ファイル**: `public/sw.js`

- 静的リソースのキャッシュ
- オフライン時のフォールバック処理
- Firebase APIリクエストは除外（リアルタイム同期が必要なため）

**特徴**:
- キャッシュファースト戦略
- 自動的なキャッシュ更新
- ページナビゲーションのオフライン対応

### 2. IndexedDB データキャッシュ

**ファイル**: `src/services/db/indexedDB.ts`

**ストア構成**:
- `projects`: プロジェクト情報
- `drawings`: 図面情報
- `points`: 点検ポイント
- `events`: 点検イベント
- `results`: 点検結果
- `offlineQueue`: オフライン時の操作キュー

**主な機能**:
- 型安全なヘルパー関数
- インデックスによる高速検索
- プロジェクトデータの完全なキャッシュ

### 3. オフラインキュー

**ファイル**: `src/services/db/offlineQueue.ts`

オフライン時の操作を記録し、オンライン復帰時に自動実行:

```typescript
interface OfflineQueueItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  documentId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}
```

**機能**:
- CREATE/UPDATE/DELETE操作の記録
- リトライ機能（最大3回）
- タイムスタンプ付き

### 4. 自動同期サービス

**ファイル**: `src/services/sync/syncService.ts`

**機能**:
- オンライン状態の監視
- オフラインキューの処理
- 定期同期（60秒ごと）
- エラーハンドリングとリトライ

**使用方法**:
```typescript
// main.tsxで自動的に開始
startOnlineMonitoring();
startPeriodicSync(60000);
```

### 5. オフライン対応Firestoreラッパー

**ファイル**: `src/services/firebase/offlineFirestore.ts`

通常のFirestore操作をオフライン対応にラップ:

**主な関数**:
- `saveInspectionResultOffline()`: 点検結果の保存（オフライン対応）
- `getInspectionResultOffline()`: 点検結果の取得（IndexedDBフォールバック）
- `getInspectionResultsOffline()`: 点検結果一覧の取得

**動作**:
1. **オンライン時**: Firestoreに保存 + IndexedDBにキャッシュ
2. **オフライン時**: IndexedDBに保存 + オフラインキューに追加
3. **Firestore失敗時**: IndexedDBから取得

### 6. UIでのオフライン表示

**ファイル**: `src/components/inspection/InspectionScreen.tsx`

**追加機能**:
- オンライン/オフライン状態インジケーター
- リアルタイム状態監視
- オフライン時のIndexedDBフォールバック

**表示**:
- 緑色の「オンライン」バッジ（Wifiアイコン）
- 黄色の「オフライン」バッジ（WifiOffアイコン）

## データフロー

### オンライン時の保存フロー

```
点検結果入力
  ↓
saveInspectionResultOffline()
  ↓
├─→ Firestore保存（成功）
│     ↓
│   IndexedDBにキャッシュ
│
└─→ Firestore保存（失敗）
      ↓
    IndexedDBに保存
      ↓
    オフラインキューに追加
```

### オフライン時の保存フロー

```
点検結果入力
  ↓
saveInspectionResultOffline()
  ↓
IndexedDBに保存
  ↓
オフラインキューに追加
  ↓
（オンライン復帰時）
  ↓
自動同期 → Firestoreに保存
```

### データ取得フロー

```
データ取得リクエスト
  ↓
getInspectionResultsOffline()
  ↓
オンライン？
  ├─ Yes → Firestoreから取得 → IndexedDBにキャッシュ → 返却
  │           ↓（失敗時）
  │         IndexedDBから取得 → 返却
  │
  └─ No → IndexedDBから取得 → 返却
```

## PWA設定

### manifest.json

**ファイル**: `public/manifest.json`

```json
{
  "name": "消防点検DXアプリ",
  "short_name": "消防点検",
  "display": "standalone",
  "theme_color": "#10b981"
}
```

### index.html

Service WorkerとPWA manifest の読み込み:

```html
<meta name="theme-color" content="#10b981" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

## 使用方法

### 開発者向け

1. **オフライン対応の保存**:
```typescript
import { saveInspectionResultOffline } from '@/services/firebase/offlineFirestore';

await saveInspectionResultOffline(projectId, eventId, pointId, recordData);
```

2. **オフライン対応の取得**:
```typescript
import { getInspectionResultsOffline } from '@/services/firebase/offlineFirestore';

const results = await getInspectionResultsOffline(projectId, eventId);
```

3. **オンライン状態の確認**:
```typescript
import { isOnline } from '@/services/sync/syncService';

if (isOnline()) {
  // オンライン時の処理
} else {
  // オフライン時の処理
}
```

### ユーザー向け

1. **オフライン作業**:
   - インターネット接続が切れても点検作業を継続可能
   - 画面上部のステータスバーでオンライン/オフライン状態を確認

2. **自動同期**:
   - インターネットに再接続すると自動的にデータが同期される
   - 同期中もアプリは使用可能

3. **データの安全性**:
   - オフライン時のデータはブラウザのIndexedDBに保存
   - 最大3回までリトライ
   - 同期失敗時はコンソールにエラーログが出力

## 制限事項

1. **初回アクセス時**:
   - 初回はオンライン接続が必要
   - プロジェクトデータをキャッシュするため

2. **画像ファイル**:
   - 図面のPNG画像はService Workerでキャッシュされる
   - キャッシュサイズに制限あり

3. **競合解決**:
   - 複数デバイスでのオフライン編集は競合が発生する可能性あり
   - 最後に同期されたデータが優先される

4. **Service Worker**:
   - 本番環境（`pnpm build`でビルド）のみ有効
   - 開発環境では無効

## トラブルシューティング

### キャッシュのクリア

```javascript
// ブラウザコンソールで実行
await caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))));
```

### IndexedDBのクリア

```javascript
// ブラウザコンソールで実行
indexedDB.deleteDatabase('FireInspectionDB');
```

### Service Workerの再登録

```javascript
// ブラウザコンソールで実行
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

## 今後の改善案

1. **Background Sync API**:
   - バックグラウンドでの同期処理
   - より確実なデータ同期

2. **競合解決UI**:
   - 複数デバイス編集時の競合をユーザーに通知
   - マージ機能の実装

3. **オフライン容量管理**:
   - キャッシュサイズの監視
   - 古いデータの自動削除

4. **同期進捗表示**:
   - 同期中の進捗バー
   - 同期待ちアイテム数の表示

5. **選択的キャッシュ**:
   - ユーザーが選択したプロジェクトのみキャッシュ
   - ストレージ容量の最適化
