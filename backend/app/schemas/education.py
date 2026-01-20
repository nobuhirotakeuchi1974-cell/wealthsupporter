# 教育費用スキーマ
from pydantic import BaseModel
from typing import Optional
from datetime import date

class EducationBase(BaseModel):
    education_type: str
    child_name: str
    amount: float
    currency: str = "JPY"
    start_date: Optional[date] = None
    notes: Optional[str] = None
    
    # 未来計画用フィールド
    timeline: str = "future"
    child_age: Optional[int] = None
    school_type: Optional[str] = None
    is_private: bool = False
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    annual_cost: Optional[float] = None

class EducationCreate(EducationBase):
    pass

class EducationUpdate(EducationBase):
    pass

class EducationResponse(EducationBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
