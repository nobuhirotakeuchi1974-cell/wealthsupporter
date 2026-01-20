# キャリア設計モデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Career(Base):
    """キャリア設計を管理するテーブル"""
    __tablename__ = "careers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    career_type = Column(String(50), nullable=False)  # 転職、副業、起業など
    description = Column(String(200), nullable=False)
    expected_income = Column(Float, nullable=True)
    currency = Column(String(10), default="JPY")
    target_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    # 未来計画用フィールド
    timeline = Column(String(20), default="future")  # current/future
    event_year = Column(Integer, nullable=True)  # イベント発生予定年
    salary_increase_rate = Column(Float, nullable=True)  # 昇給率（%）
    
    user = relationship("User", back_populates="careers")