# チャットスキーマ（API入出力定義）
# 初心者向け解説：チャット機能のやり取りに使う形を定義

from pydantic import BaseModel, Field
from datetime import datetime

class ChatMessageCreate(BaseModel):
    """
    チャット送信時の入力データ
    
    使用例：POST /chat
    {
        "message": "今月の支出を教えて"
    }
    """
    message: str = Field(..., min_length=1, max_length=2000)
    # なぜ max_length：長すぎるメッセージを防ぐ

class ChatMessageResponse(BaseModel):
    """
    チャットメッセージのレスポンス
    
    使用例：GET /chat/history のレスポンス
    [
        {
            "id": 1,
            "user_id": 1,
            "message": "今月の支出を教えて",
            "response": "今月の支出は30万円です。",
            "created_at": "2024-01-01T00:00:00"
        }
    ]
    """
    id: int
    user_id: int
    message: str
    response: str
    created_at: datetime
    
    class Config:
        from_attributes = True
