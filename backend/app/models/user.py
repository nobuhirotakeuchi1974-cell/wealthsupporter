# ユーザーモデル（データベーステーブル定義）
# 初心者向け解説：MySQLの users テーブルの設計図です

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    """
    ユーザーテーブル
    
    注目ポイント：
    - __tablename__ でテーブル名を指定
    - Column() で各カラム（列）を定義
    - relationship() で他のテーブルとの関連を定義
    """
    __tablename__ = "users"
    
    # === カラム定義 ===
    
    id = Column(Integer, primary_key=True, index=True)
    # なぜ primary_key：一意の識別子（重複しない）
    # なぜ index：検索が速くなる
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    # なぜ unique：同じメールアドレスで複数登録できないように
    # なぜ nullable=False：必須項目（空欄NG）
    
    username = Column(String(100), nullable=False)
    
    password_hash = Column(String(255), nullable=False)
    # 注目：平文パスワードは保存しない！必ずハッシュ化
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # default=datetime.utcnow：レコード作成時に自動で現在時刻
    
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False
    )
    # onupdate：更新時に自動で現在時刻
    
    # === リレーション定義 ===
    # なぜ relationship を使うのか：
    # - user.assets でユーザーの全資産を取得できる
    # - SQLのJOINを意識しなくて済む
    
    assets = relationship("Asset", back_populates="owner", cascade="all, delete-orphan")
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    houses = relationship("House", back_populates="user", cascade="all, delete-orphan")
    educations = relationship("Education", back_populates="user", cascade="all, delete-orphan")
    careers = relationship("Career", back_populates="user", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="user", cascade="all, delete-orphan")
    retirements = relationship("Retirement", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    family_members = relationship("FamilyMember", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
