# ユーザースキーマ（API入出力定義）
# 初心者向け解説：APIでやり取りするデータの形を定義します

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

# === なぜ複数のスキーマを作るのか ===
# 1. 新規登録時：パスワードを受け取る
# 2. ログイン時：メールとパスワードのみ
# 3. レスポンス時：パスワードは返さない
# → それぞれ違う形なので、分けて定義

class UserBase(BaseModel):
    """
    ユーザーの基本情報（共通部分）
    """
    email: EmailStr  # EmailStr：メールアドレス形式をチェック
    username: str = Field(..., min_length=1, max_length=100)
    # Field(...) の ... は「必須」の意味
    # min_length, max_length：文字数制限

class UserCreate(UserBase):
    """
    新規登録時の入力データ
    
    使用例：POST /auth/register
    {
        "email": "user@example.com",
        "username": "太郎",
        "password": "securepassword"
    }
    """
    password: str = Field(..., min_length=8)
    # なぜ min_length=8：セキュリティ上、短すぎるパスワードNG

class UserLogin(BaseModel):
    """
    ログイン時の入力データ
    
    使用例：POST /auth/login
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    """
    email: EmailStr
    password: str

class UserResponse(UserBase):
    """
    ユーザー情報のレスポンス
    
    注目ポイント：password_hash は含めない！
    
    使用例：GET /auth/me のレスポンス
    {
        "id": 1,
        "email": "user@example.com",
        "username": "太郎",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00"
    }
    """
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        # なぜ orm_mode：SQLAlchemyモデルから自動変換
        # これがないと user = User(...) を返せない
        from_attributes = True  # Pydantic v2 の新しい書き方

class Token(BaseModel):
    """
    認証トークンのレスポンス
    
    使用例：POST /auth/login のレスポンス
    {
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "token_type": "bearer"
    }
    """
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    """
    トークンに含まれるデータ
    内部的に使用（認証チェック時）
    """
    email: Optional[str] = None

class UserUpdate(BaseModel):
    """
    ユーザー情報更新
    """
    username: Optional[str] = Field(None, min_length=1, max_length=100)

class PasswordChange(BaseModel):
    """
    パスワード変更
    """
    current_password: str
    new_password: str = Field(..., min_length=8)
