# Firebase Hosting デプロイ手順

## 概要
このプロジェクトはFirebase Hostingにデプロイされ、GitHub Actionsで自動デプロイが設定されています。

## 前提条件
- Firebase CLIがインストール済み: `npm install -g firebase-tools`
- Firebaseプロジェクトが作成済み
- GitHubリポジトリがセットアップ済み

## 初回セットアップ

### 1. Firebase初期化（既に完了している場合はスキップ）
```bash
firebase login
firebase init hosting
```

### 2. GitHub Secretsの設定
GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：

#### 必須のシークレット
- `VITE_FIREBASE_API_KEY`: FirebaseのAPIキー
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase認証ドメイン
- `VITE_FIREBASE_PROJECT_ID`: FirebaseプロジェクトID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebaseストレージバケット
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebaseメッセージング送信者ID
- `VITE_FIREBASE_APP_ID`: FirebaseアプリID
- `VITE_GEMINI_API_KEY`: Google Gemini APIキー
- `FIREBASE_SERVICE_ACCOUNT`: Firebaseサービスアカウントキー（JSON形式）

#### Firebaseサービスアカウントキーの取得方法
1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードしたJSONファイルの内容をそのまま `FIREBASE_SERVICE_ACCOUNT` にコピー

または、Firebase CLIで自動生成：
```bash
firebase init hosting:github
```
このコマンドを実行すると、GitHub Actionsワークフローとシークレットが自動設定されます。

## 手動デプロイ

### ローカルでビルドしてデプロイ
```bash
# 依存関係のインストール
pnpm install

# プロダクションビルド
pnpm build

# Firebaseにデプロイ
firebase deploy --only hosting
```

### プレビューチャンネルへのデプロイ（テスト用）
```bash
pnpm build
firebase hosting:channel:deploy preview
```

## 自動デプロイ（GitHub Actions）

### 本番環境への自動デプロイ
1. `main`ブランチにコードをpush
2. GitHub Actionsが自動的に実行される
3. ビルドとデプロイが完了すると、本番環境に反映される

**ワークフロー**: `.github/workflows/firebase-hosting-merge.yml`

### Pull Requestのプレビュー
1. Pull Requestを作成
2. GitHub Actionsが自動的にプレビュー環境を作成
3. PRのコメントにプレビューURLが表示される

**ワークフロー**: `.github/workflows/firebase-hosting-pull-request.yml`

## デプロイ前のチェックリスト

### ビルドの確認
```bash
pnpm build
```

### 型チェック
```bash
pnpm exec tsc --noEmit
```

### リンター
```bash
pnpm lint
```

### ローカルでプレビュー
```bash
pnpm preview
```

## トラブルシューティング

### エラー: "Firebase service account not found"
→ GitHub Secretsに `FIREBASE_SERVICE_ACCOUNT` が正しく設定されているか確認

### エラー: "Build failed"
→ ローカルで `pnpm build` を実行して、エラーを確認

### エラー: "Permission denied"
→ Firebaseサービスアカウントに適切な権限があるか確認
  - Firebase Console > IAM と管理 > サービスアカウント
  - 「Firebase Hosting 管理者」ロールを付与

### デプロイ後にページが表示されない
→ Firebase Hostingの設定を確認：
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 環境変数が反映されない
→ GitHub Secretsが正しく設定されているか確認
→ `.env.example` と照合して漏れがないか確認

## デプロイ先URL

### 本番環境
```
https://<project-id>.web.app
または
https://<project-id>.firebaseapp.com
```

### カスタムドメインの設定
Firebase Console > Hosting > カスタムドメインを追加

## Firestore Rules と Storage Rulesのデプロイ

Hostingと一緒にデプロイする場合：
```bash
firebase deploy
```

個別にデプロイする場合：
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## ロールバック

以前のデプロイバージョンに戻す：
```bash
firebase hosting:clone <source-site-id>:<source-version> <target-site-id>
```

Firebase Consoleからも可能：
Hosting > リリース履歴 > 以前のバージョンを選択 > ロールバック

## モニタリング

### デプロイ履歴の確認
```bash
firebase hosting:releases:list
```

### ログの確認
Firebase Console > Hosting > 使用状況

GitHub Actions: リポジトリ > Actions タブ

## 参考リンク
- [Firebase Hosting ドキュメント](https://firebase.google.com/docs/hosting)
- [GitHub Actions for Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html)
