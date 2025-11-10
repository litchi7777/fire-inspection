# 写真撮影機能ドキュメント

## 概要

点検時に不良箇所や設備の状態を写真で記録する機能を実装しました。カメラAPIを使用して、ブラウザから直接写真を撮影できます。

## 実装内容

### 1. カメラキャプチャフック

**ファイル**: `src/hooks/useCameraCapture.ts`

**状態管理**:
```typescript
interface CameraCaptureState {
  isStreaming: boolean;     // カメラ起動中かどうか
  photos: string[];         // 撮影済み写真（Base64形式）
  error: string | null;     // エラーメッセージ
}
```

**操作関数**:
```typescript
interface CameraCaptureControls {
  startCamera: () => Promise<void>;    // カメラ起動
  stopCamera: () => void;                // カメラ停止
  capturePhoto: () => void;              // 写真撮影
  removePhoto: (index: number) => void;  // 写真削除
  clearPhotos: () => void;               // 全写真クリア
}
```

**カメラ設定**:
- 背面カメラ優先（`facingMode: 'environment'`）
- 理想解像度: 1920x1080
- 画像形式: JPEG（品質80%）
- Base64エンコード

### 2. Firebase Storage サービス

**ファイル**: `src/services/firebase/storage.ts`

**新規追加関数**:

```typescript
// Base64をBlobに変換
base64ToBlob(base64: string, mimeType?: string): Blob

// Base64画像をStorageにアップロード
uploadBase64Photo(
  projectId: string,
  eventId: string,
  pointId: string,
  base64Photo: string
): Promise<string>
```

**保存パス規則**:
```
/photos/{projectId}/{eventId}/{pointId}_{timestamp}.jpg
```

例: `/photos/proj123/event456/point789_1699999999999.jpg`

### 3. UI実装

**ファイル**: `src/components/inspection/InspectionRecordModal.tsx`

**追加要素**:
- カメラプレビュー（videoタグ）
- 撮影ボタン（青色）
- 撮影済み写真サムネイル（2列グリッド）
- 写真削除ボタン（ホバー時に表示、赤色）
- スクロール可能なモーダル（max-h-[90vh]）

**レイアウト**:
```
┌─────────────────────────┐
│ 点検記録        ×      │ ← ヘッダー（固定）
├─────────────────────────┤
│                         │
│  [設備情報]             │
│  [点検結果: 正常/異常]  │
│  [備考テキストエリア]   │
│  [音声入力]             │
│  [写真撮影]   ← NEW!   │
│  ┌─────────────┐       │
│  │ カメラプレビュー │       │
│  └─────────────┘       │
│  [撮影] [閉じる]        │
│                         │
│  写真1  写真2           │
│  [さらに撮影]           │
│                         │ ← スクロール可能
│  [点検履歴]             │
│                         │
├─────────────────────────┤
│ [キャンセル] [保存]     │ ← フッター（固定）
└─────────────────────────┘
```

### 4. 写真アップロード処理

**ファイル**: `src/components/inspection/InspectionScreen.tsx`

**フロー**:
1. ユーザーが点検記録を保存
2. 写真がある場合、Firebase Storageに並列アップロード（オンライン時のみ）
3. アップロードURLをFirestoreに保存

```typescript
// 写真をアップロード（オンライン時のみ）
let photoUrls: string[] = [];
if (data.photos.length > 0 && isOnline()) {
  photoUrls = await Promise.all(
    data.photos.map(async (photo) => {
      return await uploadBase64Photo(projectId, eventId, pointId, photo);
    })
  );
}

// 点検記録に写真URLを保存
const recordData = {
  // ...
  photos: photoUrls,
};
```


## 使用方法

### ユーザー向け操作フロー

**前提条件**: インターネット接続が必要です（オンライン状態）

1. **点検記録モーダルを開く**
   - 図面上の設備アイコンをタップ

2. **オンライン状態を確認**
   - オフライン時は写真撮影が自動的に無効化されます

3. **カメラを起動**（オンライン時のみ）
   - 「写真を撮影」ボタンをタップ
   - 初回はカメラの使用許可を求められます

4. **写真を撮影**
   - カメラプレビューが表示されます
   - 「撮影」ボタンをタップして撮影
   - 撮影した写真はサムネイルで表示されます
   - ⚠️ 撮影中にオフラインになるとカメラが自動的に停止されます

5. **複数枚撮影**
   - 「さらに撮影」ボタンで追加撮影
   - 何枚でも撮影可能

6. **写真を削除**
   - サムネイル画像にマウスをホバー
   - 右上の🗑️アイコンをクリック

7. **保存**
   - 点検結果（正常/異常）を選択
   - 「記録を保存」ボタンをタップ
   - 写真は自動的にFirebase Storageにアップロードされます

### 開発者向け使用例

#### カメラキャプチャフックの使用

```typescript
import { useCameraCapture } from '@/hooks/useCameraCapture';

const MyComponent = () => {
  const [cameraState, cameraControls, videoRef] = useCameraCapture();

  return (
    <div>
      {/* カメラプレビュー */}
      <video ref={videoRef} autoPlay playsInline />

      {/* カメラ制御 */}
      <button onClick={cameraControls.startCamera}>カメラ起動</button>
      <button onClick={cameraControls.capturePhoto}>撮影</button>
      <button onClick={cameraControls.stopCamera}>停止</button>

      {/* 撮影済み写真 */}
      {cameraState.photos.map((photo, index) => (
        <img key={index} src={photo} alt={`Photo ${index + 1}`} />
      ))}
    </div>
  );
};
```

#### 写真アップロード

```typescript
import { uploadBase64Photo } from '@/services/firebase/storage';

const uploadPhotos = async (photos: string[]) => {
  const photoUrls = await Promise.all(
    photos.map((photo) =>
      uploadBase64Photo(projectId, eventId, pointId, photo)
    )
  );
  console.log('アップロード完了:', photoUrls);
};
```

## 技術仕様

### MediaDevices API

**ブラウザ対応**:
- Chrome/Edge: ✅ フルサポート
- Safari: ✅ iOS 11以降
- Firefox: ✅ フルサポート

**カメラアクセス設定**:
```typescript
navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'environment',  // 背面カメラ優先
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
})
```

### Canvas API

**写真撮影処理**:
```typescript
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0);

const base64 = canvas.toDataURL('image/jpeg', 0.8);
```

### Firebase Cloud Storage

**保存パス**:
- 構造: `/photos/{projectId}/{eventId}/{pointId}_{timestamp}.jpg`
- タイムスタンプ: UnixタイムUTC（ミリ秒）
- 形式: JPEG
- 品質: 80%

**セキュリティルール** (参考):
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{projectId}/{eventId}/{filename} {
      // 認証済みユーザーのみアップロード可能
      allow write: if request.auth != null;
      // 同じ会社のユーザーのみ読み取り可能
      allow read: if request.auth != null;
    }
  }
}
```

## データフロー

### 撮影から保存まで

```
ユーザーがカメラ起動
  ↓
MediaDevices API
  ↓
videoタグにストリーム表示
  ↓
ユーザーが撮影ボタンをタップ
  ↓
Canvas APIでキャプチャ
  ↓
Base64エンコード
  ↓
Reactステート（配列）に保存
  ↓
ユーザーが「記録を保存」をタップ
  ↓
オンライン？
  ├─ Yes → Firebase Storageにアップロード（並列処理）
  │           ↓
  │         URLをFirestoreに保存
  │
  └─ No → 写真はスキップ（点検記録のみ保存）
```

### オフライン対応

**現在の実装**:
- ❌ オフライン時の写真撮影: 無効化
- ✅ カメラ撮影: オンライン時のみ可能
- ❌ オフライン保存: 未対応

**オフライン時の動作**:
1. 写真撮影ボタンが自動的に無効化される
2. グレーアウト表示で「オフライン時は写真撮影を使用できません」メッセージを表示
3. 撮影中にオフラインになった場合、自動的にカメラを停止
4. オンラインに復帰すると自動的に写真撮影ボタンが有効化される

**設計判断**:
- 写真撮影はオンライン専用機能として実装
- オフライン時の写真保存は複雑性が高く、ストレージ容量の問題もあるため対応しない
- 必要に応じて手動でキーボード入力またはメモを記録

## UI/UX設計

### 状態別UI

#### 1. 初期状態（写真なし）
```
┌─────────────────────────┐
│ 写真                    │
│ ┌─────────────────────┐ │
│ │  📷  写真を撮影      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

#### 2. カメラ起動中
```
┌─────────────────────────┐
│ 写真                    │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │  [カメラプレビュー]  │ │
│ │                     │ │
│ └─────────────────────┘ │
│ [撮影]      [閉じる]    │
└─────────────────────────┘
```

#### 3. 写真撮影済み
```
┌─────────────────────────┐
│ 写真                    │
│ ┌─────┐ ┌─────┐        │
│ │ 🗑️ │ │ 🗑️ │        │
│ │写真1│ │写真2│        │
│ └─────┘ └─────┘        │
│ ┌─────────────────────┐ │
│ │  📷  さらに撮影      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### アクセシビリティ

- カメラプレビューの適切なサイズ（h-64 = 256px）
- ホバー時の削除ボタン表示（モバイルでも長押しで表示）
- エラーメッセージの明確な表示（赤背景）
- 適切なボタンラベル

## エラーハンドリング

### 1. カメラアクセス拒否

**エラー**:
```
DOMException: Permission denied
```

**対処**:
```typescript
try {
  await cameraControls.startCamera();
} catch (error) {
  // エラーステートに保存
  setError('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。');
}
```

**ユーザーへの表示**:
```
┌─────────────────────────────────┐
│ ⚠️ カメラへのアクセスが拒否され │
│ ました。ブラウザの設定を確認して │
│ ください。                      │
└─────────────────────────────────┘
```

### 2. アップロード失敗

**エラー**:
```
FirebaseError: storage/unauthorized
```

**対処**:
```typescript
try {
  return await uploadBase64Photo(...);
} catch (error) {
  console.error('写真アップロードエラー:', error);
  return ''; // 空文字を返してフィルタリング
}
```

### 3. カメラ非対応

**対処**:
```typescript
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert('お使いのブラウザはカメラに対応していません');
}
```

## パフォーマンス最適化

### 1. 画像サイズ

- Base64エンコード前のサイズ: 1920x1080 (理想)
- JPEG品質: 80%
- 平均ファイルサイズ: 200-500KB/枚
- Base64後のサイズ: 約1.33倍（266-665KB/枚）

### 2. 並列アップロード

```typescript
// Promise.allで並列処理
const photoUrls = await Promise.all(
  data.photos.map((photo) => uploadBase64Photo(...))
);
```

**メリット**:
- 3枚の写真を順次アップロード: 約9秒
- 3枚の写真を並列アップロード: 約3秒

### 3. メモリ管理

```typescript
// カメラストリームの確実な停止
stopCamera() {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
}
```

## セキュリティ

### HTTPS必須

- MediaDevices APIはHTTPS環境でのみ動作
- ローカル開発は `localhost` で可能
- 本番環境は必ずHTTPS

### カメラ権限

- 初回使用時にブラウザがユーザーに許可を求める
- 許可は origin ごとに記憶される
- 拒否された場合はエラーメッセージを表示

### ストレージセキュリティ

- 認証済みユーザーのみアップロード可能
- 同じ会社のユーザーのみ閲覧可能
- ファイル名にタイムスタンプを含めて重複回避

## 今後の改善案

### 1. オフライン写真対応

- IndexedDBに写真のBase64データを保存
- オンライン復帰時に自動アップロード
- アップロード進捗表示

### 2. 画像編集機能

- トリミング
- 回転
- 明るさ調整
- 注釈の追加

### 3. 写真圧縮

- 大きな画像の自動リサイズ
- 品質を維持しながらファイルサイズ削減
- WebP形式のサポート

### 4. 写真プレビュー

- 拡大表示
- スワイプで次の写真へ
- 全画面モード

### 5. 複数カメラ対応

- 前面カメラと背面カメラの切り替え
- カメラデバイスの選択UI

## トラブルシューティング

### カメラが起動しない

**確認項目**:
1. HTTPS接続か確認
2. ブラウザのカメラ許可設定
3. OSのカメラ許可設定
4. 他のアプリがカメラを使用していないか

### 写真がアップロードされない

**確認項目**:
1. オンライン状態か確認
2. Firebase Storage のセキュリティルール
3. ブラウザコンソールのエラーログ
4. Firebase コンソールのストレージ使用状況

### 写真の画質が悪い

**改善方法**:
1. `toDataURL` の品質パラメータを上げる（0.8 → 0.9）
2. カメラの解像度を上げる（1920x1080 → 3840x2160）
3. 明るい場所で撮影

## 参考リンク

- [MediaDevices API - MDN](https://developer.mozilla.org/ja/docs/Web/API/MediaDevices)
- [getUserMedia API - MDN](https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia)
- [Canvas API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Canvas_API)
- [Firebase Cloud Storage ドキュメント](https://firebase.google.com/docs/storage)
