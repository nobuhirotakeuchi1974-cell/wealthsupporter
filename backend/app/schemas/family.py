from pydantic import BaseModel
from datetime import date
from typing import Optional

class FamilyMemberBase(BaseModel):
    """家族メンバーの基本スキーマ"""
    relationship_type: str  # 本人/配偶者/子供1/子供2/子供3/その他
    name: Optional[str] = None
    gender: str  # 男/女/その他
    birth_date: date
    school_type: Optional[str] = None  # 未就学/公立/私立/なし
    employment_status: Optional[str] = None  # 正社員/パート/専業主婦・主夫/学生/なし
    notes: Optional[str] = None

class FamilyMemberCreate(FamilyMemberBase):
    """家族メンバー作成時のスキーマ"""
    pass

class FamilyMemberUpdate(FamilyMemberBase):
    """家族メンバー更新時のスキーマ"""
    pass

class FamilyMemberResponse(FamilyMemberBase):
    """家族メンバーレスポンススキーマ"""
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
