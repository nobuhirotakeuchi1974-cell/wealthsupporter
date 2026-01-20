# 収入スキーマ
from pydantic import BaseModel
from typing import Optional
from datetime import date

class IncomeBase(BaseModel):
    income_type: str
    occurrence_type: Optional[str] = None
    amount: float
    currency: str = "JPY"
    start_date: Optional[date] = None
    notes: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True
