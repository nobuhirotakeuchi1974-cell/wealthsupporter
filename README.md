# WealthSupporter 💰

資産管理アプリ - Next.js + FastAPI + MySQL + Gemini AI

## 🎯 プロジェクト概要

WealthSupporter は、あなたの資産管理をサポートするフルスタック Web アプリケーションです。
株式、貯金、不動産などの資産を一元管理し、Gemini AI とのチャットで資産に関するアドバイスを受けられます。

## 📚 技術スタック

### フロントエンド

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Axios**（API 通信）
- **React Hook Form**（フォーム管理）

### バックエンド

- **FastAPI**（Python）
- **SQLAlchemy**（ORM）
- **Alembic**（マイグレーション）
- **JWT 認証**
- **Gemini API**（AI チャット）

### データベース

- **MySQL 8.0**

### インフラ

- **Docker & Docker Compose**
- **Azure**（デプロイ先）

## 📁 プロジェクト構成

```
WealthSupporter_260113/
├── frontend/              # Next.js フロントエンド
│   ├── src/
│   │   ├── app/          # App Router ページ
│   │   ├── components/   # 再利用コンポーネント
│   │   ├── lib/          # ユーティリティ・API
│   │   ├── hooks/        # カスタムフック
│   │   └── types/        # TypeScript型定義
│   └── package.json
├── backend/               # FastAPI バックエンド
│   ├── app/
│   │   ├── models/       # データベースモデル
│   │   ├── schemas/      # Pydanticスキーマ
│   │   ├── routers/      # APIエンドポイント
│   │   ├── services/     # ビジネスロジック
│   │   └── utils/        # ユーティリティ
│   └── requirements.txt
├── database/              # DB初期化スクリプト
└── docker-compose.yml     # Docker設定
```

## 🚀 セットアップ手順

### 前提条件

- Docker Desktop インストール済み
- Git インストール済み
- Gemini API キー取得済み（後述）

### 1. Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Google アカウントでログイン
3. 「Create API Key」をクリック
4. API キーをコピー（後で使います）

**初心者向け解説**：

- Gemini API は無料枠があります（月 60 回/分まで）
- API キーは秘密情報なので、絶対に公開しないでください

### 2. リポジトリのクローン

```bash
git clone <your-repo-url>
cd WealthSupporter_260113
```

### 3. 環境変数の設定

#### バックエンド

```bash
cd backend
cp .env.example .env
```

`.env` ファイルを開いて、以下を設定：

```bash
# Gemini API キーを設定（重要！）
GEMINI_API_KEY=your_gemini_api_key_here

# SECRET_KEY を生成（セキュリティ重要）
# 以下のコマンドで生成できます：
# python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your_generated_secret_key_here
```

#### フロントエンド

```bash
cd ../frontend
# .env.local は既に作成済みなので、確認のみ
cat .env.local
```

### 4. Docker で起動

プロジェクトルートに戻って：

```bash
cd ..
docker-compose up --build
```

**初心者向け解説**：

- 初回は 5-10 分かかります（イメージダウンロードのため）
- 以下のサービスが起動します：
  - MySQL: `localhost:3306`
  - バックエンド: `http://localhost:8000`
  - フロントエンド: `http://localhost:3000`

### 5. 動作確認

#### バックエンド API 確認

ブラウザで開く：

- API ドキュメント: http://localhost:8000/docs
- ヘルスチェック: http://localhost:8000/health

#### フロントエンド確認

- アプリ: http://localhost:3000

#### テストアカウントでログイン

- メールアドレス: `test@example.com`
- パスワード: `password123`

## 📖 使い方

### 新規ユーザー登録

1. http://localhost:3000 にアクセス
2. 「新規登録」をクリック
3. メールアドレス、ユーザー名、パスワードを入力

### 資産登録

1. ダッシュボードで「資産を追加」
2. 資産タイプ、名前、金額を入力

### AI チャット

1. チャットページで質問を入力
2. Gemini AI が資産に基づいたアドバイスを提供

## 🛠️ 開発コマンド

### Docker 環境

```bash
# 起動
docker-compose up

# バックグラウンド起動
docker-compose up -d

# 停止
docker-compose down

# 再ビルド
docker-compose up --build

# ログ確認
docker-compose logs -f backend
docker-compose logs -f frontend
```

### ローカル開発（Docker なし）

#### バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

## 📝 API エンドポイント

### 認証

- `POST /api/auth/register` - 新規登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報

### 資産管理

- `GET /api/assets` - 全資産取得
- `POST /api/assets` - 資産作成
- `PUT /api/assets/{id}` - 資産更新
- `DELETE /api/assets/{id}` - 資産削除

### チャット

- `POST /api/chat` - メッセージ送信（Gemini AI）
- `GET /api/chat/history` - チャット履歴取得

詳細は http://localhost:8000/docs を参照

## 🔒 セキュリティ注意事項

**初心者向け重要ポイント**：

1. **API キーは絶対に公開しない**

   - `.env` ファイルは `.gitignore` に含まれています
   - GitHub に誤って push しないよう注意

2. **本番環境では SECRET_KEY を変更**

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **データベースパスワードを変更**
   - `docker-compose.yml` の `MYSQL_ROOT_PASSWORD`
   - `.env` の `DATABASE_URL`

## 🐛 トラブルシューティング

### Docker 起動時のエラー

**MySQL 起動失敗**

```bash
# MySQL データを削除して再起動
docker-compose down -v
docker-compose up --build
```

**ポート競合エラー**

```bash
# 既存のプロセスを確認
lsof -i :3000  # フロントエンド
lsof -i :8000  # バックエンド
lsof -i :3306  # MySQL

# 該当プロセスを停止してから再起動
```

### Gemini API エラー

**"API key not found"**

- `.env` ファイルに `GEMINI_API_KEY` が設定されているか確認
- Docker 再起動：`docker-compose restart backend`

**レート制限エラー**

- Gemini 無料版は月 60 回/分の制限があります
- 少し待ってから再試行

## 📚 学習リソース

### 初心者向け

- **Next.js**: https://nextjs.org/learn
- **FastAPI**: https://fastapi.tiangolo.com/ja/tutorial/
- **Docker**: https://docs.docker.com/get-started/

### API 仕様

- **Gemini API**: https://ai.google.dev/docs

## 🚀 Azure へのデプロイ

デプロイ手順は `docs/DEPLOYMENT.md` を参照してください。

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエスト歓迎！

## 💬 サポート

質問があれば Issue を作成してください。

---

**プログラミング学習半年の方へ**：
このプロジェクトは学習目的で設計されています。各ファイルにコメントで解説を入れているので、コードを読みながら学んでください！
