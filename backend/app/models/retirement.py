# 老後モデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Retirement(Base):
    """老後計画を管理するテーブル"""
    __tablename__ = "retirements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    retirement_type = Column(String(50), nullable=False)  # 年金、貯蓄、退職金など
    name = Column(String(200), nullable=False)
    retirement_age = Column(Integer, nullable=True)  # 退職年齢
    monthly_amount = Column(Float, nullable=True)  # 月額年金
    total_amount = Column(Float, nullable=True)  # 総額
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="JPY")
    start_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    user = relationship("User", back_populates="retirements")
