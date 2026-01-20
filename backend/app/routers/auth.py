# 認証ルーター
# 初心者向け解説：ログイン、新規登録、ユーザー情報取得のエンドポイント

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, UserUpdate, PasswordChange
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)
from app.config import settings

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    新規ユーザー登録
    
    初心者向け解説：
    1. メールアドレスの重複チェック
    2. パスワードをハッシュ化
    3. データベースに保存
    4. 登録したユーザー情報を返す
    
    注目ポイント：
    - response_model=UserResponse：パスワードは返さない
    - status_code=201：作成成功
    """
    
    # メールアドレスの重複チェック
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に登録されています"
        )
    
    # 新規ユーザーの作成
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password)
        # なぜ get_password_hash：平文パスワードは保存しない
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)  # IDなどを取得
    
    return db_user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    ログイン
    
    初心者向け解説：
    1. メールアドレスでユーザー検索
    2. パスワード検証
    3. JWTトークン生成
    4. トークンを返す
    
    注目ポイント：
    - フロントエンドはこのトークンを保存して、以降のリクエストに使う
    """
    
    # ユーザーを検索
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # ユーザーが存在しない or パスワードが違う
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # アクセストークンを生成
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},  # sub: subject（ユーザー識別子）
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    現在ログイン中のユーザー情報を取得
    
    初心者向け解説：
    - Depends(get_current_user)：トークンから自動でユーザーを取得
    - 認証が必要なエンドポイントの例
    
    使い方：
    - フロントエンドでログイン状態を確認する時に使う
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ユーザー情報を更新（ユーザー名）
    """
    if user_update.username:
        current_user.username = user_update.username
        db.commit()
        db.refresh(current_user)
    
    return current_user

@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    パスワード変更
    """
    # 現在のパスワードを検証
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="現在のパスワードが正しくありません"
        )
    
    # 新しいパスワードをハッシュ化して保存
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "パスワードを変更しました"}
