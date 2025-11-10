# Firebase 初期設定ガイド

このガイドでは、消防点検DXアプリケーションで使用するFirebaseプロジェクトの初期設定手順を説明します。

## 1. Firebaseプロジェクトの作成

### 1-1. Firebase Consoleにアクセス
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. Googleアカウントでログイン

### 1-2. 新しいプロジェクトを作成
1. 「プロジェクトを追加」をクリック
2. プロジェクト名を入力（例: `fire-inspection`）
3. Google Analyticsの設定（推奨: 有効にする）
4. 「プロジェクトを作成」をクリック

## 2. Webアプリの登録

### 2-1. アプリを追加
1. プロジェクトの概要ページで「</>」（Web）アイコンをクリック
2. アプリのニックネームを入力（例: `fire-inspection-web`）
3. 「Firebase Hostingを設定」にチェック（推奨）
4. 「アプリを登録」をクリック

### 2-2. Firebase SDK設定情報を取得
以下のような設定情報が表示されます。**この情報をコピーして保存してください。**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## 3. Authentication（認証）の設定

### 3-1. Authenticationを有効化
1. 左メニューから「Authentication」をクリック
2. 「始める」をクリック

### 3-2. メール/パスワード認証を有効化
1. 「Sign-in method」タブをクリック
2. 「メール/パスワード」をクリック
3. 「有効にする」をオンに切り替え
4. 「保存」をクリック

### 3-3. 承認済みドメインの確認
1. 「Settings」タブをクリック
2. 「承認済みドメイン」セクションで `localhost` が含まれていることを確認
3. 本番環境のドメインを追加する場合は「ドメインを追加」をクリック

## 4. Firestore Database の設定

### 4-1. Firestoreを作成
1. 左メニューから「Firestore Database」をクリック
2. 「データベースの作成」をクリック

### 4-2. ロケーションを選択
1. 本番環境モードまたはテストモードを選択
   - **推奨**: テストモードで開始（後でセキュリティルールを設定）
2. ロケーションを選択
   - **推奨**: `asia-northeast1`（東京）または `asia-northeast2`（大阪）
3. 「有効にする」をクリック

### 4-3. セキュリティルールの設定（後で変更可能）
開発中は以下のルールを設定:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 開発中: 認証済みユーザーは全てのドキュメントにアクセス可能
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**注意**: 本番環境では必ず適切なセキュリティルールに変更してください。

## 5. Cloud Storage の設定

### 5-1. Storageを有効化
1. 左メニューから「Storage」をクリック
2. 「始める」をクリック

### 5-2. セキュリティルールの設定
開発中は以下のルールを設定:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 開発中: 認証済みユーザーは全てのファイルにアクセス可能
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5-3. ロケーションを選択
- Firestoreと同じロケーションを選択することを推奨

## 6. 環境変数の設定

### 6-1. .env ファイルの作成
プロジェクトルートに `.env` ファイルを作成します。

```bash
cp .env.example .env
```

### 6-2. Firebase設定情報を記入
`.env` ファイルに以下の情報を記入してください（手順2-2で取得した情報を使用）:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Google Gemini API（音声入力機能で使用）
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**重要**: `.env` ファイルは `.gitignore` に含まれており、Gitにコミットされません。

## 7. Firebase CLI のインストール（オプション）

デプロイやエミュレータを使用する場合は、Firebase CLIをインストールします。

```bash
# グローバルインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクトの初期化
firebase init

# 選択する機能:
# - Firestore
# - Storage
# - Hosting
```

## 8. 初期ユーザーの作成（開発用）

### 8-1. 管理者ユーザーの作成
1. Firebase Console の「Authentication」→「Users」タブ
2. 「ユーザーを追加」をクリック
3. メールアドレスとパスワードを入力
4. ユーザーIDをコピーして保存

### 8-2. Firestoreに会社情報を追加
1. Firestore Database を開く
2. 以下のドキュメントを手動で作成:

**コレクション**: `companies`
**ドキュメントID**: 任意（例: `company_001`）

```json
{
  "name": "テスト消防設備株式会社",
  "address": "東京都千代田区...",
  "adminUsers": ["手順8-1で取得したユーザーID"],
  "members": ["手順8-1で取得したユーザーID"],
  "createdAt": "2025-11-08T00:00:00.000Z",
  "updatedAt": "2025-11-08T00:00:00.000Z"
}
```

### 8-3. Firestoreにユーザー情報を追加
**コレクション**: `users`
**ドキュメントID**: 手順8-1で取得したユーザーID

```json
{
  "email": "admin@example.com",
  "name": "管理者",
  "companyId": "company_001",
  "role": "admin",
  "isActive": true,
  "mustChangePassword": false,
  "devices": [],
  "createdAt": "2025-11-08T00:00:00.000Z",
  "createdBy": "手順8-1で取得したユーザーID",
  "lastLogin": null
}
```

## 9. Gemini API の設定（音声入力機能用）

### 9-1. Google AI Studio にアクセス
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Get API key」をクリック
3. APIキーを生成
4. APIキーをコピーして `.env` の `VITE_GEMINI_API_KEY` に設定

## 10. 設定完了の確認

以下を確認してください:

- [ ] Firebaseプロジェクトが作成されている
- [ ] Authentication（メール/パスワード）が有効になっている
- [ ] Firestore Databaseが作成されている
- [ ] Cloud Storageが有効になっている
- [ ] `.env` ファイルにFirebase設定情報が記入されている
- [ ] 開発用の管理者ユーザーが作成されている
- [ ] Gemini API キーが設定されている（音声入力を使う場合）

## トラブルシューティング

### エラー: "Firebase: Error (auth/operation-not-allowed)"
→ Authentication の「メール/パスワード」が有効になっていることを確認

### エラー: "Missing or insufficient permissions"
→ Firestore のセキュリティルールを確認（開発中は `request.auth != null` で許可）

### エラー: "Storage object not found"
→ Cloud Storage が有効になっていることを確認

## 参考リンク

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Google AI Studio](https://makersuite.google.com/)
