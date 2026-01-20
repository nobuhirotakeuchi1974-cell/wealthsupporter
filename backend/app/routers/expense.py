# 支出APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの支出情報一覧を取得"""
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    return [{"id": e.id, "expense_type": e.expense_type, "occurrence_type": e.occurrence_type, "category": e.category, "amount": e.amount, "currency": e.currency, "expense_date": str(e.expense_date) if e.expense_date else None, "notes": e.notes} for e in expenses]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しい支出情報を追加"""
    db_expense = Expense(
        user_id=current_user.id,
        expense_type=expense_data.get('expense_type'),
        occurrence_type=expense_data.get('occurrence_type'),
        category=expense_data.get('category'),
        amount=expense_data.get('amount'),
        currency=expense_data.get('currency', 'JPY'),
        notes=expense_data.get('notes')
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    return {"id": db_expense.id, "expense_type": db_expense.expense_type, "occurrence_type": db_expense.occurrence_type, "category": db_expense.category, "amount": db_expense.amount, "currency": db_expense.currency, "expense_date": str(db_expense.expense_date) if db_expense.expense_date else None, "notes": db_expense.notes}

@router.put("/{expense_id}")
async def update_expense(
    expense_id: int,
    expense_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """支出情報を更新"""
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="支出情報が見つかりません"
        )
    
    for key, value in expense_data.items():
        if hasattr(db_expense, key):
            setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    
    return {"id": db_expense.id, "expense_type": db_expense.expense_type, "category": db_expense.category, "amount": db_expense.amount, "currency": db_expense.currency, "expense_date": str(db_expense.expense_date) if db_expense.expense_date else None, "notes": db_expense.notes}

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """支出情報を削除"""
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="支出情報が見つかりません"
        )
    
    db.delete(db_expense)
    db.commit()
    
    return None
