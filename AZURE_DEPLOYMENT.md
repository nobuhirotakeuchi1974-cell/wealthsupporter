# Azure デプロイガイド

このアプリケーションをAzureにデプロイする手順を説明します。

## アーキテクチャ

- **Frontend**: Azure Static Web Apps (Next.js)
- **Backend**: Azure App Service (FastAPI/Python)
- **Database**: Azure Database for MySQL

---

## 📋 前提条件

1. **Azureアカウント**: https://azure.microsoft.com/ja-jp/free/
2. **GitHubアカウント**: https://github.com
3. **Azure CLI**: インストール済みであること

```powershell
# Azure CLIのインストール確認
az --version

# インストールされていない場合
winget install -e --id Microsoft.AzureCLI
```

---

## 🚀 デプロイ手順

### ステップ1: GitHubリポジトリの準備

```powershell
# 1. Gitリポジトリを初期化（まだの場合）
git init

# 2. ファイルを追加
git add .

# 3. コミット
git commit -m "Initial commit for Azure deployment"

# 4. GitHubで新しいリポジトリを作成
# https://github.com/new で作成

# 5. リモートを追加してプッシュ
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### ステップ2: Azure CLIでログイン

```powershell
# Azureにログイン
az login

# サブスクリプションを確認
az account list --output table

# 使用するサブスクリプションを設定（複数ある場合）
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### ステップ3: リソースグループの作成

```powershell
# リソースグループを作成
az group create `
  --name WealthSupporter-RG `
  --location japaneast
```

### ステップ4: Azure Database for MySQL の作成

```powershell
# MySQL Flexible Serverを作成
az mysql flexible-server create `
  --name wealthsupporter-mysql-server `
  --resource-group WealthSupporter-RG `
  --location japaneast `
  --admin-user mysqladmin `
  --admin-password 'YourStrongPassword123!' `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --version 8.0.21 `
  --storage-size 32 `
  --public-access 0.0.0.0-255.255.255.255

# データベースを作成
az mysql flexible-server db create `
  --resource-group WealthSupporter-RG `
  --server-name wealthsupporter-mysql-server `
  --database-name wealthsupporter

# ファイアウォールルールを追加（Azure サービスからのアクセス許可）
az mysql flexible-server firewall-rule create `
  --resource-group WealthSupporter-RG `
  --name wealthsupporter-mysql-server `
  --rule-name AllowAzureServices `
  --start-ip-address 0.0.0.0 `
  --end-ip-address 0.0.0.0
```

### ステップ5: バックエンド (App Service) のデプロイ

```powershell
# App Service Planを作成
az appservice plan create `
  --name WealthSupporter-ASP `
  --resource-group WealthSupporter-RG `
  --location japaneast `
  --is-linux `
  --sku B1

# Web Appを作成
az webapp create `
  --name wealthsupporter-backend `
  --resource-group WealthSupporter-RG `
  --plan WealthSupporter-ASP `
  --runtime "PYTHON:3.11"

# 環境変数を設定
az webapp config appsettings set `
  --name wealthsupporter-backend `
  --resource-group WealthSupporter-RG `
  --settings `
    DATABASE_URL="mysql+pymysql://mysqladmin:YourStrongPassword123!@wealthsupporter-mysql-server.mysql.database.azure.com:3306/wealthsupporter?ssl_ca=/etc/ssl/certs/ca-certificates.crt" `
    SECRET_KEY="your-production-secret-key-change-this" `
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY" `
    DEBUG="False" `
    CORS_ORIGINS='["https://YOUR-STATIC-WEB-APP.azurestaticapps.net","http://localhost:3000"]'

# スタートアップコマンドを設定
az webapp config set `
  --name wealthsupporter-backend `
  --resource-group WealthSupporter-RG `
  --startup-file "startup.sh"

# GitHubからデプロイ
az webapp deployment source config `
  --name wealthsupporter-backend `
  --resource-group WealthSupporter-RG `
  --repo-url https://github.com/YOUR_USERNAME/YOUR_REPO_NAME `
  --branch main `
  --manual-integration
```

### ステップ6: フロントエンド (Static Web Apps) のデプロイ

#### 方法A: Azure Portal から（推奨）

1. Azure Portal (https://portal.azure.com) にログイン
2. 「Static Web Apps」を検索して選択
3. 「+ 作成」をクリック
4. 以下を設定：
   - **サブスクリプション**: 使用するサブスクリプション
   - **リソースグループ**: `WealthSupporter-RG`
   - **名前**: `wealthsupporter-frontend`
   - **リージョン**: `East Asia`
   - **SKU**: `Free`
5. **デプロイの詳細**:
   - **ソース**: `GitHub`
   - GitHubでサインイン
   - **組織**: あなたのGitHubユーザー名
   - **リポジトリ**: 作成したリポジトリ名
   - **ブランチ**: `main`
6. **ビルドの詳細**:
   - **ビルドプリセット**: `Next.js`
   - **アプリの場所**: `/frontend`
   - **API の場所**: (空白)
   - **出力場所**: (空白 - 自動検出)
7. 「確認および作成」→「作成」

#### 方法B: Azure CLI から

```powershell
# Static Web Appを作成（GitHubトークンが必要）
az staticwebapp create `
  --name wealthsupporter-frontend `
  --resource-group WealthSupporter-RG `
  --source https://github.com/YOUR_USERNAME/YOUR_REPO_NAME `
  --location "East Asia" `
  --branch main `
  --app-location "/frontend" `
  --output-location "" `
  --token YOUR_GITHUB_TOKEN
```

### ステップ7: 環境変数の設定（フロントエンド）

Static Web Appに環境変数を追加：

```powershell
# Azure Portalで設定するか、以下のコマンドを使用
az staticwebapp appsettings set `
  --name wealthsupporter-frontend `
  --resource-group WealthSupporter-RG `
  --setting-names `
    NEXT_PUBLIC_API_URL="https://wealthsupporter-backend.azurewebsites.net/api"
```

### ステップ8: CORSの更新（バックエンド）

Static Web AppのURLが確定したら、バックエンドのCORS設定を更新：

```powershell
# Static Web AppのURLを取得
$STATIC_WEB_APP_URL = az staticwebapp show `
  --name wealthsupporter-frontend `
  --resource-group WealthSupporter-RG `
  --query "defaultHostname" `
  --output tsv

# CORS設定を更新
az webapp config appsettings set `
  --name wealthsupporter-backend `
  --resource-group WealthSupporter-RG `
  --settings `
    CORS_ORIGINS="[`"https://$STATIC_WEB_APP_URL`",`"http://localhost:3000`"]"
```

---

## 🔧 デプロイ後の設定

### データベースの初期化

```powershell
# SSHでApp Serviceに接続
az webapp ssh --name wealthsupporter-backend --resource-group WealthSupporter-RG

# SSH内で実行
cd /home/site/wwwroot
python -m alembic upgrade head
```

### 接続テスト

```powershell
# バックエンドのヘルスチェック
curl https://wealthsupporter-backend.azurewebsites.net/api/

# フロントエンドにアクセス
# https://wealthsupporter-frontend.azurestaticapps.net
```

---

## 📊 モニタリング

### Application Insights を有効化

```powershell
# Application Insightsを作成
az monitor app-insights component create `
  --app wealthsupporter-insights `
  --location japaneast `
  --resource-group WealthSupporter-RG

# インストルメンテーションキーを取得
$INSIGHTS_KEY = az monitor app-insights component show `
  --app wealthsupporter-insights `
  --resource-group WealthSupporter-RG `
  --query "instrumentationKey" `
  --output tsv

# App Serviceに接続
az webapp config appsettings set `
  --name wealthsupporter-backend `
  --resource-group WealthSupporter-RG `
  --settings `
    APPINSIGHTS_INSTRUMENTATIONKEY="$INSIGHTS_KEY"
```

---

## 💰 コスト見積もり

- **App Service (B1)**: 約 ¥1,800/月
- **MySQL Flexible Server (B1ms)**: 約 ¥2,500/月
- **Static Web Apps (Free)**: 無料
- **合計**: 約 ¥4,300/月

---

## 🔄 CI/CD (自動デプロイ)

GitHub Actionsが自動的に設定されます：
- mainブランチにプッシュすると自動デプロイ
- `.github/workflows/` にワークフローファイルが作成されます

---

## 📝 重要なURL

デプロイ後、以下のURLをメモしてください：

- **フロントエンド**: `https://wealthsupporter-frontend.azurestaticapps.net`
- **バックエンド**: `https://wealthsupporter-backend.azurewebsites.net`
- **API ドキュメント**: `https://wealthsupporter-backend.azurewebsites.net/docs`

---

## ❗ トラブルシューティング

### バックエンドが起動しない

```powershell
# ログを確認
az webapp log tail --name wealthsupporter-backend --resource-group WealthSupporter-RG

# または
az webapp log download --name wealthsupporter-backend --resource-group WealthSupporter-RG
```

### データベース接続エラー

- ファイアウォールルールを確認
- 接続文字列が正しいか確認
- SSL証明書のパスを確認

### フロントエンドがバックエンドに接続できない

- CORS設定を確認
- 環境変数 `NEXT_PUBLIC_API_URL` を確認
- ネットワークタブでリクエストを確認

---

## 🗑️ リソースの削除

すべてを削除する場合：

```powershell
az group delete --name WealthSupporter-RG --yes --no-wait
```

---

## 📚 参考リンク

- [Azure App Service ドキュメント](https://docs.microsoft.com/ja-jp/azure/app-service/)
- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/ja-jp/azure/static-web-apps/)
- [Azure Database for MySQL ドキュメント](https://docs.microsoft.com/ja-jp/azure/mysql/)
