# 教育費APIルーター
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.education import Education
from app.schemas.education import EducationCreate, EducationUpdate, EducationResponse
from app.utils.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_educations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ユーザーの教育費情報一覧を取得"""
    educations = db.query(Education).filter(Education.user_id == current_user.id).all()
    return [{
        "id": e.id,
        "education_type": e.education_type,
        "child_name": e.child_name,
        "child_age": e.child_age,
        "school_type": e.school_type,
        "is_private": bool(e.is_private) if e.is_private is not None else False,
        "start_year": e.start_year,
        "end_year": e.end_year,
        "annual_cost": float(e.annual_cost) if e.annual_cost else None,
        "amount": e.amount,
        "currency": e.currency,
        "start_date": str(e.start_date) if e.start_date else None,
        "notes": e.notes,
        "timeline": e.timeline
    } for e in educations]

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_education(
    education_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """新しい教育費情報を追加"""
    db_education = Education(
        user_id=current_user.id,
        education_type=education_data.get('education_type'),
        child_name=education_data.get('child_name'),
        child_age=education_data.get('child_age'),
        school_type=education_data.get('school_type'),
        is_private=1 if education_data.get('is_private') else 0,
        start_year=education_data.get('start_year'),
        end_year=education_data.get('end_year'),
        annual_cost=education_data.get('annual_cost'),
        amount=education_data.get('amount'),
        currency=education_data.get('currency', 'JPY'),
        start_date=education_data.get('start_date'),
        notes=education_data.get('notes'),
        timeline=education_data.get('timeline', 'future')
    )
    
    db.add(db_education)
    db.commit()
    db.refresh(db_education)
    
    return {
        "id": db_education.id,
        "education_type": db_education.education_type,
        "child_name": db_education.child_name,
        "child_age": db_education.child_age,
        "school_type": db_education.school_type,
        "is_private": bool(db_education.is_private),
        "start_year": db_education.start_year,
        "end_year": db_education.end_year,
        "annual_cost": float(db_education.annual_cost) if db_education.annual_cost else None,
        "amount": db_education.amount,
        "currency": db_education.currency,
        "start_date": str(db_education.start_date) if db_education.start_date else None,
        "notes": db_education.notes,
        "timeline": db_education.timeline
    }

@router.put("/{education_id}")
async def update_education(
    education_id: int,
    education_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """教育費情報を更新"""
    db_education = db.query(Education).filter(
        Education.id == education_id,
        Education.user_id == current_user.id
    ).first()
    
    if not db_education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="教育費情報が見つかりません"
        )
    
    # 更新可能なフィールドのマッピング
    update_fields = {
        'education_type': education_data.get('education_type'),
        'child_name': education_data.get('child_name'),
        'child_age': education_data.get('child_age'),
        'school_type': education_data.get('school_type'),
        'is_private': 1 if education_data.get('is_private') else 0,
        'start_year': education_data.get('start_year'),
        'end_year': education_data.get('end_year'),
        'annual_cost': education_data.get('annual_cost'),
        'amount': education_data.get('amount'),
        'currency': education_data.get('currency'),
        'start_date': education_data.get('start_date'),
        'notes': education_data.get('notes'),
        'timeline': education_data.get('timeline')
    }
    
    for key, value in update_fields.items():
        if value is not None:
            setattr(db_education, key, value)
    
    db.commit()
    db.refresh(db_education)
    
    return {
        "id": db_education.id,
        "education_type": db_education.education_type,
        "child_name": db_education.child_name,
        "child_age": db_education.child_age,
        "school_type": db_education.school_type,
        "is_private": bool(db_education.is_private),
        "start_year": db_education.start_year,
        "end_year": db_education.end_year,
        "annual_cost": float(db_education.annual_cost) if db_education.annual_cost else None,
        "amount": db_education.amount,
        "currency": db_education.currency,
        "start_date": str(db_education.start_date) if db_education.start_date else None,
        "notes": db_education.notes,
        "timeline": db_education.timeline
    }

@router.delete("/{education_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """教育費情報を削除"""
    db_education = db.query(Education).filter(
        Education.id == education_id,
        Education.user_id == current_user.id
    ).first()
    
    if not db_education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="教育費情報が見つかりません"
        )
    
    db.delete(db_education)
    db.commit()
    
    return None
