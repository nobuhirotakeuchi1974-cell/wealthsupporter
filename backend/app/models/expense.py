# 支出モデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    """支出情報を管理するテーブル"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expense_type = Column(String(50), nullable=False)  # 生活費、固定費、変動費など
    occurrence_type = Column(String(10), nullable=True)  # 頻度（年回数）
    category = Column(String(50), nullable=False)  # 食費、住居費、交通費など
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="JPY")
    expense_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    user = relationship("User", back_populates="expenses")