# データベース接続設定
# 初心者向け解説：MySQLに接続して、テーブル操作できるようにします

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# === なぜ create_engine を使うのか ===
# - データベースへの接続プールを管理
# - 毎回接続しなくて済む（高速化）
# - 接続数を制御できる

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # 接続が切れてないかチェック
    echo=settings.DEBUG,  # SQLログを出力（開発時便利）
)

# === セッションの作成 ===
# セッション = データベースとのやり取りを管理するオブジェクト
# なぜ autocommit=False：手動でcommitする（安全性UP）
# なぜ autoflush=False：明示的にflushする（挙動が明確）
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# === Base クラス ===
# 全てのモデル（テーブル定義）の親クラス
Base = declarative_base()

# === 依存性注入用の関数 ===
# なぜ必要なのか：FastAPIの各エンドポイントでDBセッションを使う
# try-finally で必ずcloseする = 接続漏れを防ぐ
def get_db():
    """
    データベースセッションを取得
    
    使い方例：
    @app.get("/users")
    def get_users(db: Session = Depends(get_db)):
        return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db  # ここでセッションを渡す
    finally:
        db.close()  # 必ず閉じる
