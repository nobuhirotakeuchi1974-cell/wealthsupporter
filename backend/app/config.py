# 設定ファイル
# 初心者向け解説：環境変数を読み込んで、アプリ全体で使えるようにします

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """
    アプリケーション設定
    
    なぜ pydantic_settings を使うのか：
    - 環境変数を型付きで読み込める
    - デフォルト値を設定できる
    - バリデーション（検証）が自動
    """
    
    # アプリケーション情報
    APP_NAME: str = "WealthSupporter"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # データベース設定
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/wealthsupporter"
    
    # 認証設定
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS設定（どこからのアクセスを許可するか）
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Next.js開発サーバー
        "http://localhost:3001",  # 予備
    ]
    
    # Gemini API設定
    GEMINI_API_KEY: str = ""
    # なぜ必要：Gemini AIとの通信に必須
    # 取得方法：https://makersuite.google.com/app/apikey
    
    class Config:
        # .envファイルから自動読み込み
        env_file = ".env"
        case_sensitive = True

# シングルトンインスタンス（アプリ全体で1つだけ作る）
settings = Settings()
