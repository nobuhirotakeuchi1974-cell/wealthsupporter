# 収入APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[IncomeResponse])
async def get_incomes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの収入情報一覧を取得"""
    incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    return incomes

@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
async def create_income(
    income_data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しい収入情報を追加"""
    db_income = Income(
        user_id=current_user.id,
        **income_data.model_dump()
    )
    
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    
    return db_income

@router.put("/{income_id}", response_model=IncomeResponse)
async def update_income(
    income_id: int,
    income_data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """収入情報を更新"""
    db_income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not db_income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="収入情報が見つかりません"
        )
    
    for key, value in income_data.model_dump(exclude_unset=True).items():
        setattr(db_income, key, value)
    
    db.commit()
    db.refresh(db_income)
    
    return db_income

@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """収入情報を削除"""
    db_income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not db_income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="収入情報が見つかりません"
        )
    
    db.delete(db_income)
    db.commit()
    
    return None
