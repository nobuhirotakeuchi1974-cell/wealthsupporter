from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.family import FamilyMember
from app.models.user import User
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/family", tags=["family"])

@router.get("/", response_model=List[FamilyMemberResponse])
async def get_family_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """現在のユーザーの家族構成を取得"""
    family_members = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).all()
    return family_members

@router.post("/", response_model=FamilyMemberResponse)
async def create_family_member(
    family_member: FamilyMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """家族メンバーを追加"""
    db_family_member = FamilyMember(
        user_id=current_user.id,
        **family_member.dict()
    )
    db.add(db_family_member)
    db.commit()
    db.refresh(db_family_member)
    return db_family_member

@router.put("/{member_id}", response_model=FamilyMemberResponse)
async def update_family_member(
    member_id: int,
    family_member: FamilyMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """家族メンバーを更新"""
    db_family_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not db_family_member:
        raise HTTPException(status_code=404, detail="Family member not found")
    
    for key, value in family_member.dict().items():
        setattr(db_family_member, key, value)
    
    db.commit()
    db.refresh(db_family_member)
    return db_family_member

@router.delete("/{member_id}")
async def delete_family_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """家族メンバーを削除"""
    db_family_member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not db_family_member:
        raise HTTPException(status_code=404, detail="Family member not found")
    
    db.delete(db_family_member)
    db.commit()
    return {"message": "Family member deleted successfully"}
