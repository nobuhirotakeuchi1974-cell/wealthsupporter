from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class FamilyMember(Base):
    """
    家族構成メンバーモデル
    
    フィールド：
    - id: プライマリーキー
    - user_id: ユーザーID（外部キー）
    - relationship_type: 続柄（本人/配偶者/子供1/子供2/子供3/その他）
    - name: 名前（任意）
    - gender: 性別（男/女/その他）
    - birth_date: 生年月日
    - school_type: 学校種別（未就学/公立/私立/なし）
    - employment_status: 就業状況（正社員/パート/専業主婦・主夫/学生/なし）
    - notes: 補足コメント
    """
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # 本人/配偶者/子供1/子供2/子供3/その他
    name = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=False)  # 男/女/その他
    birth_date = Column(Date, nullable=False)
    school_type = Column(String(50), nullable=True)  # 未就学/公立/私立/なし
    employment_status = Column(String(50), nullable=True)  # 正社員/パート/専業主婦・主夫/学生/なし
    notes = Column(String(500), nullable=True)
    
    # リレーション
    user = relationship("User", back_populates="family_members")
