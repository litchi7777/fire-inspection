# 音声入力機能ドキュメント

## 概要

消防点検作業中に、片手が埋まってしまう課題を解決するため、音声入力機能を実装しました。Google Gemini マルチモーダルAPIを使用して、音声を自動的にテキストに変換します。

## 実装内容

### 1. Google Gemini API統合

**ファイル**: `src/services/gemini/audioTranscription.ts`

**機能**:
- 音声データ（Blob）をテキストに変換
- Gemini 1.5 Flash モデルを使用
- 消防点検記録に適したプロンプト最適化

**主な関数**:
```typescript
// 音声をテキストに変換
transcribeAudio(audioBlob: Blob): Promise<string>

// マイク使用許可の確認
checkMicrophonePermission(): Promise<boolean>
```

**プロンプト設計**:
- 消防点検の記録として適切なテキストを抽出
- 点検結果（正常、異常など）や設備の状態を正確に記録
- 不要な言葉（えー、あのー、など）を除外
- 簡潔で明瞭な日本語に変換

### 2. 音声録音カスタムフック

**ファイル**: `src/hooks/useAudioRecorder.ts`

**状態管理**:
```typescript
interface AudioRecorderState {
  isRecording: boolean;    // 録音中かどうか
  isPaused: boolean;       // 一時停止中かどうか
  recordingTime: number;   // 録音時間（秒）
  audioBlob: Blob | null;  // 録音データ
}
```

**操作関数**:
```typescript
interface AudioRecorderControls {
  startRecording: () => Promise<void>;  // 録音開始
  stopRecording: () => void;             // 録音停止
  pauseRecording: () => void;            // 一時停止
  resumeRecording: () => void;           // 再開
  clearRecording: () => void;            // データクリア
}
```

**対応フォーマット**:
- 優先: `audio/webm`
- フォールバック: `audio/mp4`

### 3. UI実装

**ファイル**: `src/components/inspection/InspectionRecordModal.tsx`

**追加要素**:
- 音声入力ボタン（青色、マイクアイコン）- オンライン時のみ有効
- オフライン時の無効化メッセージ（グレー、WifiOffアイコン）
- 録音中インジケーター（赤色、アニメーション付き）
- 録音時間表示（MM:SS形式）
- テキスト化ボタン（録音完了後）
- キャンセルボタン
- オンライン/オフライン状態の自動検出と切り替え

## 使用方法

### ユーザー向け操作フロー

**前提条件**: インターネット接続が必要です（オンライン状態）

1. **点検記録モーダルを開く**
   - 図面上の設備アイコンをタップ

2. **オンライン状態を確認**
   - モーダル上部のステータスで「オンライン」を確認
   - オフライン時は音声入力が自動的に無効化されます

3. **音声入力を開始**
   - 「音声で入力」ボタンをタップ
   - 初回はマイクの使用許可を求められます

4. **録音**
   - 赤色の「録音中」表示が出ます
   - 点検内容を話します
   - 例: 「消火器、正常です」「煙感知器、異常なし」「スプリンクラー、動作確認OK」
   - ⚠️ 録音中にオフラインになると自動的に停止されます

5. **録音停止**
   - 「録音停止」ボタンをタップ
   - 録音データが保存されます

6. **テキスト化**
   - 「テキスト化」ボタンをタップ
   - Gemini APIが音声を解析（オンライン接続必須）
   - 変換されたテキストが「備考・特記事項」欄に自動入力されます

7. **保存**
   - 点検結果（正常/異常）を選択
   - 「記録を保存」ボタンをタップ

### オフライン時の使用方法

オフライン時は音声入力が使用できません：

1. **グレーアウト表示**
   - 「オフライン時は音声入力を使用できません」メッセージが表示されます

2. **手動入力を使用**
   - 「備考・特記事項」欄に直接キーボードで入力してください
   - テキスト入力は常に利用可能です

3. **オンライン復帰**
   - インターネット接続が回復すると自動的に音声入力が有効化されます

### 開発者向け使用例

#### 音声録音フックの使用

```typescript
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const MyComponent = () => {
  const [audioState, audioControls] = useAudioRecorder();

  const handleRecord = async () => {
    if (audioState.isRecording) {
      audioControls.stopRecording();
    } else {
      await audioControls.startRecording();
    }
  };

  return (
    <div>
      <button onClick={handleRecord}>
        {audioState.isRecording ? '停止' : '録音開始'}
      </button>
      {audioState.recordingTime > 0 && <p>録音時間: {audioState.recordingTime}秒</p>}
    </div>
  );
};
```

#### 音声変換APIの使用

```typescript
import { transcribeAudio } from '@/services/gemini/audioTranscription';

const handleTranscribe = async (audioBlob: Blob) => {
  try {
    const text = await transcribeAudio(audioBlob);
    console.log('変換結果:', text);
  } catch (error) {
    console.error('変換エラー:', error);
  }
};
```

## 技術仕様

### Gemini API設定

**.env設定**:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**モデル**: `gemini-1.5-flash`
- マルチモーダル対応（音声、画像、テキスト）
- 高速処理
- コスト効率が良い

### MediaRecorder API

**ブラウザ対応**:
- Chrome/Edge: ✅ フルサポート
- Safari: ✅ iOS 14.3以降
- Firefox: ✅ フルサポート

**MIME Types**:
- 優先: `audio/webm` (Chrome, Firefox)
- フォールバック: `audio/mp4` (Safari)

### セキュリティ

**HTTPS必須**:
- MediaRecorder APIはHTTPS環境でのみ動作
- ローカル開発は `localhost` で可能

**マイク権限**:
- 初回使用時にブラウザがユーザーに許可を求める
- 許可が拒否された場合はエラーメッセージを表示

### オフライン対応

**オンライン専用機能**:
- 音声入力機能はオンライン時のみ利用可能
- Gemini APIでのテキスト変換にインターネット接続が必須

**オフライン時の動作**:
- 音声入力ボタンが自動的に無効化される
- グレーアウト表示で「オフライン時は音声入力を使用できません」メッセージを表示
- 録音中にオフラインになった場合、自動的に録音を停止してデータをクリア
- オンラインに復帰すると自動的に音声入力ボタンが有効化される

**代替手段**:
- オフライン時は手動でキーボード入力を使用
- テキスト入力は常に利用可能

## データフロー

```
ユーザーが話す
  ↓
MediaRecorder で録音
  ↓
Blob データ作成
  ↓
Base64 エンコード
  ↓
Gemini API に送信
  ↓
テキスト変換
  ↓
備考欄に自動入力
```

## UI/UX設計

### 状態別UI

#### 1. 初期状態（録音前）
- 青色ボタン「音声で入力」
- マイクアイコン表示

#### 2. 録音中
- 赤色枠の強調表示
- 赤色のパルスアニメーション
- 「録音中」テキスト
- 録音時間表示（MM:SS）
- 「録音停止」ボタン

#### 3. 録音完了
- 緑色枠の強調表示
- 「録音完了」テキスト
- 録音時間の最終表示
- 「テキスト化」ボタン（緑色）
- 「キャンセル」ボタン

#### 4. テキスト変換中
- ローディングアイコン（スピナー）
- 「変換中...」テキスト
- ボタン無効化

### アクセシビリティ

- 視覚的フィードバック（色、アイコン、アニメーション）
- 明確なボタンラベル
- 無効状態の適切な表示
- エラー時のアラート表示

## エラーハンドリング

### 1. マイク許可の拒否

**エラー**:
```
DOMException: Permission denied
```

**対処**:
- ユーザーにアラート表示
- ブラウザ設定の確認を促す

### 2. Gemini API エラー

**エラー**:
```
Error: 音声のテキスト変換に失敗しました
```

**原因**:
- APIキーが未設定
- ネットワークエラー
- 音声データが不正

**対処**:
- `.env` の `VITE_GEMINI_API_KEY` を確認
- ネットワーク接続を確認
- コンソールログでエラー詳細を確認

### 3. MediaRecorder 非対応

**対処**:
```typescript
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert('お使いのブラウザは音声録音に対応していません');
}
```

## パフォーマンス最適化

### 1. 音声データサイズ

- WebM形式は圧縮率が高い
- 平均サイズ: 約10KB/秒
- 30秒の録音: 約300KB

### 2. API レスポンス時間

- Gemini 1.5 Flash: 通常1〜3秒
- 長い音声（60秒以上）: 5〜10秒

### 3. メモリ管理

- 録音停止時にストリームを確実に停止
- Blobデータのクリア機能
- タイマーのクリーンアップ

## 今後の改善案

### 1. リアルタイム文字起こし

- Streaming APIの使用
- 話しながらリアルタイムにテキスト表示

### 2. 音声コマンド認識

- 「正常」→ 自動的に正常ボタンを選択
- 「異常」→ 自動的に異常ボタンを選択

### 3. オフライン音声認識

- Web Speech API の使用
- オフライン時のフォールバック

### 4. 音声プレビュー

- 録音データの再生機能
- テキスト化前に内容確認

### 5. 音声品質の向上

- ノイズキャンセリング
- 自動音量調整
- 音声品質チェック

### 6. 複数言語対応

- 英語、中国語などの認識
- 自動言語検出

## トラブルシューティング

### 音声が録音されない

**確認項目**:
1. マイク接続の確認
2. ブラウザのマイク許可設定
3. OS のマイク許可設定
4. HTTPS接続の確認

### テキスト変換が失敗する

**確認項目**:
1. `.env` の `VITE_GEMINI_API_KEY` が設定されているか
2. インターネット接続
3. ブラウザコンソールのエラーログ
4. Gemini API の利用制限

### 変換されたテキストが不正確

**改善方法**:
1. ゆっくり、はっきり話す
2. 静かな環境で録音
3. マイクを口元に近づける
4. 専門用語は避けて話す

## 参考リンク

- [Google Gemini API ドキュメント](https://ai.google.dev/docs)
- [MediaRecorder API - MDN](https://developer.mozilla.org/ja/docs/Web/API/MediaRecorder)
- [Web Audio API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)
