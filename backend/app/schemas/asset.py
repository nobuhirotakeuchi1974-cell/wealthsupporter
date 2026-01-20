# 資産スキーマ（API入出力定義）
# 初心者向け解説：資産情報のやり取りに使う形を定義

from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional

class AssetBase(BaseModel):
    """
    資産の基本情報
    """
    asset_type: str = Field(..., max_length=50)
    # 例："stock", "savings", "real_estate"
    
    name: str = Field(..., max_length=200)
    # 例："トヨタ株", "定期預金"
    
    amount: float
    # 資産はプラス、負債はマイナスで表現
    
    currency: str = Field(default="JPY", max_length=10)
    # デフォルトは円
    
    purchase_date: Optional[date] = None
    # Optional：省略可能（日付のみ、時刻不要）
    
    notes: Optional[str] = None

class AssetCreate(AssetBase):
    """
    資産作成時の入力データ
    
    使用例：POST /assets
    {
        "asset_type": "stock",
        "name": "トヨタ株",
        "amount": 500000,
        "currency": "JPY",
        "purchase_date": "2024-01-01T00:00:00",
        "notes": "100株購入"
    }
    """
    pass  # AssetBase をそのまま使う

class AssetUpdate(BaseModel):
    """
    資産更新時の入力データ
    
    注目ポイント：全て Optional（一部だけ更新できる）
    
    使用例：PUT /assets/1
    {
        "amount": 550000  # 金額だけ更新
    }
    """
    asset_type: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=200)
    amount: Optional[float] = None
    currency: Optional[str] = Field(None, max_length=10)
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None

class AssetResponse(AssetBase):
    """
    資産情報のレスポンス
    
    使用例：GET /assets のレスポンス
    [
        {
            "id": 1,
            "user_id": 1,
            "asset_type": "stock",
            "name": "トヨタ株",
            "amount": 500000,
            "currency": "JPY",
            "purchase_date": "2024-01-01T00:00:00",
            "notes": "100株購入",
            "created_at": "2024-01-01T00:00:00",
            "updated_at": "2024-01-01T00:00:00"
        }
    ]
    """
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
