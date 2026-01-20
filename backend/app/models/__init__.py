# __init__.py でモデルをまとめてインポート
# なぜ必要なのか：Alembicがマイグレーション時に自動検出できる

from app.models.user import User
from app.models.asset import Asset
from app.models.chat import ChatMessage
from app.models.family import FamilyMember
from app.models.retirement import Retirement

__all__ = ["User", "Asset", "ChatMessage", "FamilyMember", "Retirement"]
