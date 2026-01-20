# 資産モデル（データベーステーブル定義）
# 初心者向け解説：ユーザーの資産情報を保存するテーブル

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Asset(Base):
    """
    資産テーブル
    
    注目ポイント：
    - ForeignKey でユーザーテーブルと紐付け
    - asset_type で資産の種類を分類
    """
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # === 外部キー（他のテーブルとの関連） ===
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # なぜ ForeignKey：ユーザーIDを参照（存在しないユーザーIDは入れられない）
    # なぜ index：user_idで検索することが多いので高速化
    
    # === 資産情報 ===
    asset_type = Column(String(50), nullable=False)
    # 例："stock"（株）, "savings"（貯金）, "real_estate"（不動産）
    
    name = Column(String(200), nullable=False)
    # 例："トヨタ株", "定期預金", "マンション"
    
    amount = Column(Float, nullable=False)
    # 金額（浮動小数点）
    # 注意：金融アプリでは Decimal を使う方が正確（今回は簡略化）
    
    currency = Column(String(10), default="JPY", nullable=False)
    # 通貨コード（"JPY", "USD" など）
    
    purchase_date = Column(Date, nullable=True)
    # 購入日（日付のみ、時刻不要）
    # 購入日（任意）
    
    notes = Column(Text, nullable=True)
    # メモ欄（長文OK）
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # === リレーション ===
    owner = relationship("User", back_populates="assets")
    # asset.owner でこの資産の所有者（User）を取得できる
    
    def __repr__(self):
        return f"<Asset(id={self.id}, name={self.name}, amount={self.amount})>"
