# 子供教育モデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Education(Base):
    """教育費用を管理するテーブル"""
    __tablename__ = "educations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    education_type = Column(String(50), nullable=False)  # 学費、塾、習い事など
    child_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="JPY")
    start_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    # 未来計画用フィールド
    timeline = Column(String(20), default="future")  # current/future
    child_age = Column(Integer, nullable=True)  # 現在の年齢
    school_type = Column(String(50), nullable=True)  # kindergarten, elementary, junior_high, high_school, university
    is_private = Column(Integer, default=0)  # 0=公立, 1=私立 (MySQLのBooleanはtinyint)
    start_year = Column(Integer, nullable=True)  # 開始年
    end_year = Column(Integer, nullable=True)  # 終了年
    annual_cost = Column(Float, nullable=True)  # 年間費用
    
    user = relationship("User", back_populates="educations")
