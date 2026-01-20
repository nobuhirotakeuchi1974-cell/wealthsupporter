# リスク管理APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.risk import Risk
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_risks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーのリスク管理情報一覧を取得"""
    risks = db.query(Risk).filter(Risk.user_id == current_user.id).all()
    return [{"id": r.id, "risk_type": r.risk_type, "name": r.name, "amount": r.amount, "currency": r.currency, "start_date": str(r.start_date) if r.start_date else None, "notes": r.notes} for r in risks]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_risk(
    risk_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しいリスク管理情報を追加"""
    db_risk = Risk(
        user_id=current_user.id,
        risk_type=risk_data.get('risk_type'),
        name=risk_data.get('name'),
        amount=risk_data.get('amount'),
        currency=risk_data.get('currency', 'JPY'),
        notes=risk_data.get('notes')
    )
    
    db.add(db_risk)
    db.commit()
    db.refresh(db_risk)
    
    return {"id": db_risk.id, "risk_type": db_risk.risk_type, "name": db_risk.name, "amount": db_risk.amount, "currency": db_risk.currency, "start_date": str(db_risk.start_date) if db_risk.start_date else None, "notes": db_risk.notes}

@router.put("/{risk_id}")
async def update_risk(
    risk_id: int,
    risk_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """リスク管理情報を更新"""
    db_risk = db.query(Risk).filter(
        Risk.id == risk_id,
        Risk.user_id == current_user.id
    ).first()
    
    if not db_risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="リスク管理情報が見つかりません"
        )
    
    for key, value in risk_data.items():
        if hasattr(db_risk, key):
            setattr(db_risk, key, value)
    
    db.commit()
    db.refresh(db_risk)
    
    return {"id": db_risk.id, "risk_type": db_risk.risk_type, "name": db_risk.name, "amount": db_risk.amount, "currency": db_risk.currency, "start_date": str(db_risk.start_date) if db_risk.start_date else None, "notes": db_risk.notes}

@router.delete("/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_risk(
    risk_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """リスク管理情報を削除"""
    db_risk = db.query(Risk).filter(
        Risk.id == risk_id,
        Risk.user_id == current_user.id
    ).first()
    
    if not db_risk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="リスク管理情報が見つかりません"
        )
    
    db.delete(db_risk)
    db.commit()
    
    return None
