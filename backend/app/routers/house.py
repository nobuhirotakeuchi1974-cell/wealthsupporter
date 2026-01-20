# 住宅APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.house import House
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_houses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの住宅情報一覧を取得"""
    houses = db.query(House).filter(House.user_id == current_user.id).all()
    return [{
        "id": h.id,
        "house_type": h.house_type,
        "name": h.name,
        "amount": h.amount,
        "currency": h.currency,
        "start_date": str(h.start_date) if h.start_date else None,
        "notes": h.notes,
        "timeline": h.timeline,
        "purchase_year": h.purchase_year,
        "loan_term": h.loan_term,
        "loan_rate": float(h.loan_rate) if h.loan_rate else None,
        "down_payment": float(h.down_payment) if h.down_payment else None
    } for h in houses]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_house(
    house_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しい住宅情報を追加"""
    db_house = House(
        user_id=current_user.id,
        house_type=house_data.get('house_type'),
        name=house_data.get('name'),
        amount=house_data.get('amount'),
        currency=house_data.get('currency', 'JPY'),
        notes=house_data.get('notes'),
        timeline=house_data.get('timeline', 'future'),
        purchase_year=house_data.get('purchase_year'),
        loan_term=house_data.get('loan_term'),
        loan_rate=house_data.get('loan_rate'),
        down_payment=house_data.get('down_payment')
    )
    
    db.add(db_house)
    db.commit()
    db.refresh(db_house)
    
    return {
        "id": db_house.id,
        "house_type": db_house.house_type,
        "name": db_house.name,
        "amount": db_house.amount,
        "currency": db_house.currency,
        "start_date": str(db_house.start_date) if db_house.start_date else None,
        "notes": db_house.notes,
        "timeline": db_house.timeline,
        "purchase_year": db_house.purchase_year,
        "loan_term": db_house.loan_term,
        "loan_rate": float(db_house.loan_rate) if db_house.loan_rate else None,
        "down_payment": float(db_house.down_payment) if db_house.down_payment else None
    }

@router.put("/{house_id}")
async def update_house(
    house_id: int,
    house_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """住宅情報を更新"""
    db_house = db.query(House).filter(
        House.id == house_id,
        House.user_id == current_user.id
    ).first()
    
    if not db_house:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="住宅情報が見つかりません"
        )
    
    for key, value in house_data.items():
        if hasattr(db_house, key):
            setattr(db_house, key, value)
    
    db.commit()
    db.refresh(db_house)
    
    return {
        "id": db_house.id,
        "house_type": db_house.house_type,
        "name": db_house.name,
        "amount": db_house.amount,
        "currency": db_house.currency,
        "start_date": str(db_house.start_date) if db_house.start_date else None,
        "notes": db_house.notes,
        "timeline": db_house.timeline,
        "purchase_year": db_house.purchase_year,
        "loan_term": db_house.loan_term,
        "loan_rate": float(db_house.loan_rate) if db_house.loan_rate else None,
        "down_payment": float(db_house.down_payment) if db_house.down_payment else None
    }

@router.delete("/{house_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_house(
    house_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """住宅情報を削除"""
    db_house = db.query(House).filter(
        House.id == house_id,
        House.user_id == current_user.id
    ).first()
    
    if not db_house:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="住宅情報が見つかりません"
        )
    
    db.delete(db_house)
    db.commit()
    
    return None
