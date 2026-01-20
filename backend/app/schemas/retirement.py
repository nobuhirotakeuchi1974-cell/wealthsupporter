# 老後スキーマ
from pydantic import BaseModel
from datetime import date
from typing import Optional

class RetirementBase(BaseModel):
    retirement_type: str
    name: str
    amount: float
    currency: str = "JPY"
    start_date: Optional[date] = None
    notes: Optional[str] = None

class RetirementCreate(RetirementBase):
    pass

class RetirementUpdate(RetirementBase):
    pass

class Retirement(RetirementBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
