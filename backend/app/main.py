# FastAPI メインアプリケーション
# 初心者向け解説：バックエンドの入り口です

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base

# モデルをインポートしてテーブル作成を有効化
import app.models

# データベーステーブルを作成
# 注目：実際にはAlembicを使うべき（後で説明）
Base.metadata.create_all(bind=engine)

# === FastAPI アプリ作成 ===
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="WealthSupporter API - 資産管理アプリのバックエンド",
    docs_url="/docs",  # Swagger UI（APIドキュメント）
    redoc_url="/redoc",  # ReDoc（別のドキュメント）
)

# === CORS設定 ===
# なぜ必要なのか：
# - フロントエンド（localhost:3000）からのアクセスを許可
# - ブラウザのセキュリティ制限を回避
# - 本番環境では許可するドメインを制限すべき

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # 許可するドメイン
    allow_credentials=True,  # Cookieを許可
    allow_methods=["*"],  # 全HTTPメソッドを許可（GET, POST, PUT, DELETE）
    allow_headers=["*"],  # 全ヘッダーを許可
)

# === ルーター登録 ===
# なぜ別ファイルに分けるのか：
# - 機能ごとに整理
# - ファイルが長くなりすぎない
# - チーム開発で分担しやすい

from app.routers import auth, assets, chat, income, expense, house, education, career, risk, retirement, family, simulation

app.include_router(auth.router, prefix="/api/auth", tags=["認証"])
app.include_router(assets.router, prefix="/api/assets", tags=["資産"])
app.include_router(income.router, prefix="/api/income", tags=["収入"])
app.include_router(expense.router, prefix="/api/expense", tags=["支出"])
app.include_router(house.router, prefix="/api/house", tags=["家"])
app.include_router(education.router, prefix="/api/education", tags=["子供教育"])
app.include_router(career.router, prefix="/api/career", tags=["キャリア設計"])
app.include_router(risk.router, prefix="/api/risk", tags=["リスク"])
app.include_router(retirement.router, prefix="/api/retirement", tags=["老後"])
app.include_router(chat.router, prefix="/api/chat", tags=["チャット"])
app.include_router(family.router, tags=["家族構成"])
app.include_router(simulation.router, tags=["シミュレーション"])

# === ヘルスチェックエンドポイント ===
# なぜ必要なのか：
# - サーバーが正常に動いているか確認
# - Azure App Service などで使われる

@app.get("/", tags=["ヘルスチェック"])
def read_root():
    """
    ルートエンドポイント
    
    ブラウザで http://localhost:8000/ にアクセスすると表示される
    """
    return {
        "message": "WealthSupporter API is running",
        "version": settings.APP_VERSION,
        "docs": "/docs",  # Swagger UI へのリンク
    }

@app.get("/health", tags=["ヘルスチェック"])
def health_check():
    """
    ヘルスチェック
    
    Azureのヘルスプローブで使用
    """
    return {"status": "healthy"}

# === 起動時の処理 ===
@app.on_event("startup")
async def startup_event():
    """
    アプリ起動時に実行される処理
    
    ここでデータベース接続確認などを行える
    """
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} が起動しました")
    print(f"📚 APIドキュメント: http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """
    アプリ終了時に実行される処理
    
    クリーンアップ処理など
    """
    print("👋 アプリケーションを終了します")
