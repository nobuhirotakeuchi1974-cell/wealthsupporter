# 収入モデル
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Income(Base):
    """
    収入情報を管理するテーブル
    
    カラム：
    - id: 主キー
    - user_id: ユーザーID（外部キー）
    - income_type: 収入種類（月収、年収、ボーナス、副業など）
    - amount: 金額
    - currency: 通貨
    - start_date: 開始日
    - notes: 備考
    """
    __tablename__ = "incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    income_type = Column(String(50), nullable=False)  # 月収、年収、ボーナス、副業など
    occurrence_type = Column(String(20), default="定期")  # 定期、一時
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="JPY")
    start_date = Column(Date, nullable=True)
    notes = Column(String(500), nullable=True)
    
    # リレーションシップ
    user = relationship("User", back_populates="incomes")
