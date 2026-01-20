# キャリア設計APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.career import Career
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_careers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーのキャリア設計情報一覧を取得"""
    careers = db.query(Career).filter(Career.user_id == current_user.id).all()
    return [{
        "id": c.id,
        "career_type": c.career_type,
        "description": c.description,
        "expected_income": c.expected_income,
        "currency": c.currency,
        "target_date": str(c.target_date) if c.target_date else None,
        "notes": c.notes,
        "timeline": c.timeline if hasattr(c, 'timeline') else None,
        "event_year": c.event_year if hasattr(c, 'event_year') else None,
        "salary_increase_rate": c.salary_increase_rate if hasattr(c, 'salary_increase_rate') else None
    } for c in careers]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_career(
    career_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しいキャリア設計情報を追加"""
    db_career = Career(
        user_id=current_user.id,
        career_type=career_data.get('career_type'),
        description=career_data.get('description'),
        expected_income=career_data.get('expected_income'),
        currency=career_data.get('currency', 'JPY'),
        notes=career_data.get('notes'),
        timeline=career_data.get('timeline'),
        event_year=career_data.get('event_year'),
        salary_increase_rate=career_data.get('salary_increase_rate')
    )
    
    db.add(db_career)
    db.commit()
    db.refresh(db_career)
    
    return {
        "id": db_career.id,
        "career_type": db_career.career_type,
        "description": db_career.description,
        "expected_income": db_career.expected_income,
        "currency": db_career.currency,
        "target_date": str(db_career.target_date) if db_career.target_date else None,
        "notes": db_career.notes,
        "timeline": db_career.timeline if hasattr(db_career, 'timeline') else None,
        "event_year": db_career.event_year if hasattr(db_career, 'event_year') else None,
        "salary_increase_rate": db_career.salary_increase_rate if hasattr(db_career, 'salary_increase_rate') else None
    }

@router.put("/{career_id}")
async def update_career(
    career_id: int,
    career_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """キャリア設計情報を更新"""
    db_career = db.query(Career).filter(
        Career.id == career_id,
        Career.user_id == current_user.id
    ).first()
    
    if not db_career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="キャリア設計情報が見つかりません"
        )
    
    for key, value in career_data.items():
        if hasattr(db_career, key):
            setattr(db_career, key, value)
    
    db.commit()
    db.refresh(db_career)
    
    return {
        "id": db_career.id,
        "career_type": db_career.career_type,
        "description": db_career.description,
        "expected_income": db_career.expected_income,
        "currency": db_career.currency,
        "target_date": str(db_career.target_date) if db_career.target_date else None,
        "notes": db_career.notes,
        "timeline": db_career.timeline if hasattr(db_career, 'timeline') else None,
        "event_year": db_career.event_year if hasattr(db_career, 'event_year') else None,
        "salary_increase_rate": db_career.salary_increase_rate if hasattr(db_career, 'salary_increase_rate') else None
    }

@router.delete("/{career_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_career(
    career_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """キャリア設計情報を削除"""
    db_career = db.query(Career).filter(
        Career.id == career_id,
        Career.user_id == current_user.id
    ).first()
    
    if not db_career:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="キャリア設計情報が見つかりません"
        )
    
    db.delete(db_career)
    db.commit()
    
    return None
