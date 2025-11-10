# Firestore データベースのセットアップ

## 問題の診断

現在、アプリケーションで以下のエラーが発生しています:
- `ERR_CONNECTION_REFUSED` (ポート 5176)
- Firebase Authentication は正常に動作（ユーザー作成成功）
- Firestore への書き込みが失敗

## 原因

Firestore データベースが Firebase Console で初期化されていない可能性があります。

## セットアップ手順

### 1. Firebase Console にアクセス

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト `gdgoc-fire-inspection` を選択

### 2. Firestore Database を有効化

1. 左メニューから **「Firestore Database」** を選択
2. **「データベースを作成」** ボタンをクリック
3. セキュリティルールの選択:
   - **「テストモードで開始」** を選択（開発中）
   - または **「本番環境モードで開始」** を選択し、後でルールを設定
4. ロケーションの選択:
   - 推奨: `asia-northeast1` (東京) または `asia-northeast2` (大阪)
   - ※一度設定すると変更できません
5. **「有効にする」** をクリック

### 3. セキュリティルールの設定

データベース作成後、以下のセキュリティルールを設定してください:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証済みユーザーは全てのドキュメントにアクセス可能
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // 未認証ユーザーでも新規登録時にユーザーと会社を作成可能
    match /users/{userId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    match /companies/{companyId} {
      allow create: if true;
      allow read, write: if request.auth != null;
    }
  }
}
```

#### セキュリティルールの適用方法:

1. Firestore Database ページで **「ルール」** タブをクリック
2. 上記のルールをエディタに貼り付け
3. **「公開」** ボタンをクリック

### 4. 本番環境用のセキュリティルール（推奨）

テストが完了したら、以下のより厳格なルールに変更してください:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザードキュメント
    match /users/{userId} {
      // 新規登録時のユーザー作成を許可
      allow create: if request.auth == null || request.auth.uid == userId;
      // 自分のユーザー情報のみ読み取り・更新可能
      allow read, update: if request.auth != null && request.auth.uid == userId;
      // 削除は管理者のみ
      allow delete: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // 会社ドキュメント
    match /companies/{companyId} {
      // 新規登録時の会社作成を許可
      allow create: if true;
      // 会社のメンバーのみ読み取り・更新可能
      allow read, write: if request.auth != null &&
                            request.auth.uid in resource.data.members;
    }

    // プロジェクトドキュメント
    match /projects/{projectId} {
      allow read, write: if request.auth != null &&
                            request.auth.uid in get(/databases/$(database)/documents/companies/$(resource.data.companyId)).data.members;
    }

    // 図面ドキュメント
    match /projects/{projectId}/drawings/{drawingId} {
      allow read, write: if request.auth != null;
    }

    // 点検ポイントドキュメント
    match /projects/{projectId}/drawings/{drawingId}/points/{pointId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## トラブルシューティング

### エラー: "Failed to get document because the client is offline"

**原因**: Firestore が有効化されていない、またはセキュリティルールがアクセスをブロックしている

**解決策**:
1. Firebase Console で Firestore Database が有効になっているか確認
2. セキュリティルールが正しく設定されているか確認
3. ブラウザのキャッシュをクリア
4. アプリケーションを再起動

### エラー: "ERR_CONNECTION_REFUSED"

**原因**: ローカルの Firestore エミュレータに接続しようとしている

**解決策**:
1. Firebase エミュレータが起動していないか確認: `firebase emulators:stop`
2. 環境変数 `FIRESTORE_EMULATOR_HOST` が設定されていないか確認
3. ブラウザの開発者ツールでストレージをクリア
4. アプリケーションを完全に再起動

### Firestore が本番環境に接続されているか確認

ブラウザのコンソールで以下を確認:

```
Firebase Config: {
  apiKey: '設定済み',
  authDomain: 'gdgoc-fire-inspection.firebaseapp.com',
  projectId: 'gdgoc-fire-inspection',
  storageBucket: 'gdgoc-fire-inspection.firebasestorage.app'
}
```

## 確認手順

1. Firebase Console で Firestore Database が有効化されている
2. セキュリティルールが設定されている
3. アプリケーションを再起動
4. 新規登録を試す
5. Firebase Console の Firestore データタブで、`companies` と `users` コレクションにデータが作成されているか確認

## 参考リンク

- [Firestore 公式ドキュメント](https://firebase.google.com/docs/firestore)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
