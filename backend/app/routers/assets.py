# 資産管理ルーター
# 初心者向け解説：資産のCRUD（作成・読取・更新・削除）

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[AssetResponse])
async def get_assets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ログインユーザーの全資産を取得
    
    初心者向け解説：
    - List[AssetResponse]：資産のリストを返す
    - current_user：認証済みユーザー（自動取得）
    
    注目ポイント：
    - filter(Asset.user_id == current_user.id)
    - 自分の資産だけ取得（他人の資産は見えない）
    """
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()
    return assets

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    特定の資産を取得
    
    初心者向け解説：
    - {asset_id}：URLパラメータ（/assets/1 → asset_id=1）
    """
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="資産が見つかりません"
        )
    
    return asset

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    新しい資産を作成
    
    初心者向け解説：
    1. リクエストボディから資産情報を受け取る
    2. user_id を自動設定（ログインユーザー）
    3. データベースに保存
    
    注目ポイント：
    - **asset_data.dict()：Pydanticモデルを辞書に変換
    - user_id=current_user.id：自動設定
    """
    db_asset = Asset(
        **asset_data.dict(),
        user_id=current_user.id
    )
    
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    return db_asset

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    資産情報を更新
    
    初心者向け解説：
    1. 資産が存在するかチェック
    2. 自分の資産かチェック
    3. 提供されたフィールドのみ更新
    
    注目ポイント：
    - exclude_unset=True：値が設定されたフィールドのみ取得
    - 部分更新が可能（金額だけ変更など）
    """
    # 資産を検索
    db_asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not db_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="資産が見つかりません"
        )
    
    # 更新（提供されたフィールドのみ）
    update_data = asset_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_asset, field, value)
    
    db.commit()
    db.refresh(db_asset)
    
    return db_asset

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    資産を削除
    
    初心者向け解説：
    - status_code=204：削除成功（コンテンツなし）
    - return None：何も返さない
    """
    db_asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not db_asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="資産が見つかりません"
        )
    
    db.delete(db_asset)
    db.commit()
    
    return None
