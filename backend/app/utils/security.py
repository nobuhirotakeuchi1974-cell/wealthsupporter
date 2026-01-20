# セキュリティユーティリティ
# 初心者向け解説：パスワード保護と認証トークンを扱います

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

# === パスワードハッシュ化の設定 ===
# なぜ bcrypt を使うのか：
# - 強力な暗号化アルゴリズム
# - 同じパスワードでも毎回違うハッシュ（salt付き）
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# === JWT認証の設定 ===
# Bearer トークン方式（Authorization: Bearer <token>）
security = HTTPBearer()

def get_password_hash(password: str) -> str:
    """
    パスワードをハッシュ化
    
    なぜ必要なのか：
    - データベースに平文パスワードを保存しない
    - 万が一流出しても元のパスワードが分からない
    
    例：
    "password123" → "$2b$12$KIXx9..."（復号不可能）
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    パスワード検証
    
    ログイン時に使用：
    1. ユーザーが入力したパスワード（平文）
    2. データベースに保存されたハッシュ
    を比較して一致するか確認
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWTアクセストークン生成
    
    なぜ JWT を使うのか：
    - サーバー側でセッション管理不要
    - トークン自体に情報を含められる
    - 有効期限を設定できる
    
    トークンの中身例：
    {
        "sub": "user@example.com",  # ユーザー識別子
        "exp": 1640000000  # 有効期限（Unixタイムスタンプ）
    }
    """
    to_encode = data.copy()
    
    # 有効期限を設定
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # デフォルト：30分
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    # トークン生成（SECRET_KEY で署名）
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    現在ログイン中のユーザーを取得
    
    なぜ Depends を使うのか：
    - FastAPIの依存性注入システム
    - 各エンドポイントで自動的に認証チェック
    
    使い方例：
    @app.get("/protected")
    def protected_route(current_user: User = Depends(get_current_user)):
        return {"user": current_user.email}
    
    注目ポイント：
    1. リクエストヘッダーからトークン取得
    2. トークンを検証
    3. トークンからメールアドレス取得
    4. データベースからユーザー検索
    5. ユーザーを返す
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="認証情報が無効です",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # トークンをデコード
        token = credentials.credentials
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        # トークンからメールアドレス取得
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # データベースからユーザー検索
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    return user
