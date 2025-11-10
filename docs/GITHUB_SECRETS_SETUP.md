# GitHub Secrets セットアップガイド

GitHub Actionsによる自動デプロイを有効化するために、以下のSecretsを設定する必要があります。

## 設定手順

### 1. GitHubリポジトリの設定ページにアクセス

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左サイドバーの **Secrets and variables** → **Actions** をクリック
4. **New repository secret** ボタンをクリック

### 2. 必要なSecretsを追加

以下のSecretsを1つずつ追加してください。

#### Firebase関連（必須）

| Secret名 | 取得方法 | 例 |
|---------|---------|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → プロジェクト設定 → サービスアカウント → 新しい秘密鍵の生成 | JSON全体 |
| `VITE_FIREBASE_API_KEY` | `.env`ファイルを参照 | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `.env`ファイルを参照 | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `.env`ファイルを参照 | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `.env`ファイルを参照 | `your-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `.env`ファイルを参照 | `123456789` |
| `VITE_FIREBASE_APP_ID` | `.env`ファイルを参照 | `1:123:web:abc` |

#### Gemini API関連（必須）

| Secret名 | 取得方法 | 例 |
|---------|---------|---|
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) | `AIza...` |

## 3. Firebase Service Accountの取得方法

### 手順:

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクトを選択
3. ⚙️ **プロジェクトの設定** をクリック
4. **サービス アカウント** タブをクリック
5. **新しい秘密鍵の生成** ボタンをクリック
6. JSONファイルがダウンロードされる
7. JSONファイルの**内容全体**をコピー
8. GitHubの`FIREBASE_SERVICE_ACCOUNT` Secretに貼り付け

### 注意事項:
- ⚠️ **このJSONファイルは機密情報です。絶対にGitにコミットしないでください**
- ⚠️ ファイルは安全な場所に保管してください
- ⚠️ 不要になった場合は、Firebase Consoleから鍵を削除してください

## 4. 自動デプロイの有効化

Secretsの設定が完了したら、以下のファイルを編集して自動デプロイを有効化します：

### `.github/workflows/firebase-hosting-merge.yml`

```yaml
on:
  workflow_dispatch:  # 手動実行のみ
  # 以下のコメントを解除
  push:
    branches:
      - main
```

### `.github/workflows/firebase-hosting-pull-request.yml`

```yaml
on:
  workflow_dispatch:  # 手動実行のみ
  # 以下のコメントを解除
  pull_request
```

## 5. 動作確認

1. 変更をコミット・プッシュ
2. GitHub Actions タブで実行状況を確認
3. ✅ デプロイが成功すれば設定完了

## トラブルシューティング

### エラー: `Input required and not supplied: firebaseServiceAccount`
→ `FIREBASE_SERVICE_ACCOUNT` Secretが設定されていません。手順3を確認してください。

### エラー: `Firebase authentication failed`
→ Service AccountのJSON形式が正しくありません。JSONファイル全体をコピーしてください。

### エラー: `Firebase API key is invalid`
→ `.env`ファイルのFirebase設定が間違っています。Firebase Consoleで確認してください。

## 参考リンク

- [Firebase Service Account ドキュメント](https://firebase.google.com/docs/admin/setup)
- [GitHub Secrets ドキュメント](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)
