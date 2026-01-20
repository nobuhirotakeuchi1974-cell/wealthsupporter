# 家モデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class House(Base):
    """住宅情報を管理するテーブル"""
    __tablename__ = "houses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    house_type = Column(String(50), nullable=False)  # 購入、賃貸、リフォームなど
    name = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="JPY")
    start_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    # 未来計画用フィールド
    timeline = Column(String(20), default="future")  # current/future
    purchase_year = Column(Integer, nullable=True)  # 購入予定年
    loan_term = Column(Integer, nullable=True)  # ローン期間（年）
    loan_rate = Column(Float, nullable=True)  # 金利（%）
    down_payment = Column(Float, nullable=True)  # 頭金
    
    user = relationship("User", back_populates="houses")