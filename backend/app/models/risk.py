# リスクモデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Risk(Base):
    """リスク管理を管理するテーブル"""
    __tablename__ = "risks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    risk_type = Column(String(50), nullable=False)  # 生命保険、医療保険、老後資金など
    name = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="JPY")
    start_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    # 保険用フィールド
    timeline = Column(String(20), default="future")  # current/future
    insurance_type = Column(String(50), nullable=True)  # life, medical, fire, earthquake
    coverage_amount = Column(Float, nullable=True)  # 保障額
    monthly_premium = Column(Float, nullable=True)  # 月額保険料
    coverage_period = Column(Integer, nullable=True)  # 保障期間（年）
    
    user = relationship("User", back_populates="risks")