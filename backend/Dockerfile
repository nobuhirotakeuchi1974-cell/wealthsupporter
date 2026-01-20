# バックエンド用 Dockerfile
# 初心者向け解説：FastAPIアプリをコンテナ化

FROM python:3.11-slim

# なぜ python:3.11-slim：
# - 最新の安定版
# - slim は必要最小限（サイズ小）

# 作業ディレクトリ設定
WORKDIR /app

# 依存パッケージファイルをコピー
COPY requirements.txt .

# Pythonパッケージをインストール
RUN pip install --no-cache-dir -r requirements.txt

# なぜ --no-cache-dir：
# - キャッシュを残さない = イメージサイズ削減

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# アプリ起動コマンド（docker-compose.ymlで上書きされる）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
