# 老後APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.retirement import Retirement
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_retirements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの老後計画情報一覧を取得"""
    retirements = db.query(Retirement).filter(Retirement.user_id == current_user.id).all()
    return [{
        "id": r.id,
        "retirement_type": r.retirement_type,
        "name": r.name,
        "retirement_age": r.retirement_age,
        "monthly_amount": r.monthly_amount,
        "total_amount": r.total_amount,
        "amount": r.amount,
        "currency": r.currency,
        "start_date": str(r.start_date) if r.start_date else None,
        "notes": r.notes
    } for r in retirements]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_retirement(
    retirement_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しい老後計画情報を追加"""
    db_retirement = Retirement(
        user_id=current_user.id,
        retirement_type=retirement_data.get('retirement_type'),
        name=retirement_data.get('name'),
        retirement_age=retirement_data.get('retirement_age'),
        monthly_amount=retirement_data.get('monthly_amount'),
        total_amount=retirement_data.get('total_amount'),
        amount=retirement_data.get('amount'),
        currency=retirement_data.get('currency', 'JPY'),
        start_date=retirement_data.get('start_date'),
        notes=retirement_data.get('notes')
    )
    
    db.add(db_retirement)
    db.commit()
    db.refresh(db_retirement)
    
    return {
        "id": db_retirement.id,
        "retirement_type": db_retirement.retirement_type,
        "name": db_retirement.name,
        "retirement_age": db_retirement.retirement_age,
        "monthly_amount": db_retirement.monthly_amount,
        "total_amount": db_retirement.total_amount,
        "amount": db_retirement.amount,
        "currency": db_retirement.currency,
        "start_date": str(db_retirement.start_date) if db_retirement.start_date else None,
        "notes": db_retirement.notes
    }

@router.put("/{retirement_id}")
async def update_retirement(
    retirement_id: int,
    retirement_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """老後計画情報を更新"""
    db_retirement = db.query(Retirement).filter(
        Retirement.id == retirement_id,
        Retirement.user_id == current_user.id
    ).first()
    
    if not db_retirement:
        raise HTTPException(status_code=404, detail="Retirement not found")
    
    db_retirement.retirement_type = retirement_data.get('retirement_type', db_retirement.retirement_type)
    db_retirement.name = retirement_data.get('name', db_retirement.name)
    db_retirement.retirement_age = retirement_data.get('retirement_age', db_retirement.retirement_age)
    db_retirement.monthly_amount = retirement_data.get('monthly_amount', db_retirement.monthly_amount)
    db_retirement.total_amount = retirement_data.get('total_amount', db_retirement.total_amount)
    db_retirement.amount = retirement_data.get('amount', db_retirement.amount)
    db_retirement.currency = retirement_data.get('currency', db_retirement.currency)
    db_retirement.start_date = retirement_data.get('start_date', db_retirement.start_date)
    db_retirement.notes = retirement_data.get('notes', db_retirement.notes)
    
    db.commit()
    db.refresh(db_retirement)
    
    return {
        "id": db_retirement.id,
        "retirement_type": db_retirement.retirement_type,
        "name": db_retirement.name,
        "retirement_age": db_retirement.retirement_age,
        "monthly_amount": db_retirement.monthly_amount,
        "total_amount": db_retirement.total_amount,
        "amount": db_retirement.amount,
        "currency": db_retirement.currency,
        "start_date": str(db_retirement.start_date) if db_retirement.start_date else None,
        "notes": db_retirement.notes
    }

@router.delete("/{retirement_id}")
async def delete_retirement(
    retirement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """老後計画情報を削除"""
    db_retirement = db.query(Retirement).filter(
        Retirement.id == retirement_id,
        Retirement.user_id == current_user.id
    ).first()
    
    if not db_retirement:
        raise HTTPException(status_code=404, detail="Retirement not found")
    
    db.delete(db_retirement)
    db.commit()
    
    return {"message": "Retirement deleted successfully"}
