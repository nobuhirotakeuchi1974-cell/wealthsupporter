# チャットメッセージモデル（データベーステーブル定義）
# 初心者向け解説：AIとのチャット履歴を保存するテーブル

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ChatMessage(Base):
    """
    チャットメッセージテーブル
    
    注目ポイント：
    - ユーザーの質問と、AIの応答の両方を保存
    - 履歴を見返せる
    """
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # どのユーザーのチャットか
    
    message = Column(Text, nullable=False)
    # ユーザーが送信したメッセージ（質問）
    
    response = Column(Text, nullable=False)
    # AIの応答
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    # なぜ index：日付順で並べることが多いので
    
    # === リレーション ===
    user = relationship("User", back_populates="chat_messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, user_id={self.user_id})>"
