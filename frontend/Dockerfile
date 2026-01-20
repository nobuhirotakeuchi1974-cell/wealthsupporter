# フロントエンド用 Dockerfile
# 初心者向け解説：Next.jsアプリをコンテナ化

FROM node:20-alpine

# なぜ node:20-alpine：
# - Node.js 20 LTS（長期サポート版）
# - alpine は軽量

# 作業ディレクトリ設定
WORKDIR /app

# package.json をコピー
COPY package*.json ./

# npm パッケージをインストール
RUN npm install

# なぜ npm install：
# - package-lock.jsonがない場合はこちらを使う
# - 開発環境では柔軟に対応

# アプリケーションコードをコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# 開発サーバー起動（docker-compose.ymlで上書きされる）
CMD ["npm", "run", "dev"]
