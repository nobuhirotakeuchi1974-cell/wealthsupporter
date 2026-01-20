# チャットルーター - 全カテゴリ自動振り分け対応
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.asset import Asset
from app.models.income import Income
from app.models.expense import Expense
from app.models.house import House
from app.models.education import Education
from app.models.career import Career
from app.models.risk import Risk
from app.models.retirement import Retirement
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.utils.security import get_current_user
from app.services.gemini_service import GeminiService

router = APIRouter()

@router.post("/", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """チャットメッセージを送信 - 全カテゴリ自動振り分け"""
    all_info = await GeminiService.extract_all_info(message_data.message)
    
    # デバッグログ: AIが抽出した情報を出力
    print(f"=== AIが抽出した情報 ===")
    print(f"ユーザーメッセージ: {message_data.message}")
    print(f"抽出結果: {all_info}")
    print(f"retirement情報: {all_info.get('retirement', 'なし')}")
    print(f"========================")
    
    added_items = []
    
    try:
        if "income" in all_info and all_info["income"]:
            info = all_info["income"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ 収入を追加: {info}")
                db.add(Income(
                    user_id=current_user.id, 
                    income_type=info.get('income_type', 'その他'),
                    occurrence_type=info.get('occurrence_type', '12'),
                    amount=float(info.get('amount', 0)), 
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("収入")
        
        if "expense" in all_info and all_info["expense"]:
            info = all_info["expense"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ 支出を追加: {info}")
                db.add(Expense(
                    user_id=current_user.id, 
                    expense_type=info.get('expense_type', 'その他'),
                    occurrence_type=info.get('occurrence_type', '12'),
                    category=info.get('category', 'その他'), 
                    amount=float(info.get('amount', 0)), 
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("支出")
        
        if "asset" in all_info and all_info["asset"]:
            info = all_info["asset"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ 資産を追加: {info}")
                db.add(Asset(
                    user_id=current_user.id, 
                    asset_type=info.get('asset_type', 'その他'), 
                    name=info.get('name', '資産'), 
                    amount=float(info.get('amount', 0)), 
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("資産")
        
        if "house" in all_info and all_info["house"]:
            info = all_info["house"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ 家を追加: {info}")
                db.add(House(
                    user_id=current_user.id, 
                    house_type=info.get('house_type', 'その他'), 
                    name=info.get('name', '住宅'), 
                    amount=float(info.get('amount', 0)), 
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("家")
        
        if "education" in all_info and all_info["education"]:
            info = all_info["education"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info and info.get('child_name'):
                child_name = info.get('child_name', '子供')
                child_age = info.get('child_age', 10)
                schools = info.get('schools', {})
                
                print(f"✅ 子供教育を追加: {child_name}, {child_age}歳, schools={schools}")
                
                # 年齢から生年を計算
                from datetime import datetime
                current_year = datetime.now().year
                birth_year = current_year - child_age
                
                # 費用マスタデータ
                cost_data = {
                    'nursery': {'public': 450000, 'private': 800000, 'start_age': 0, 'duration': 6},
                    'kindergarten': {'public': 220000, 'private': 530000, 'start_age': 3, 'duration': 3},
                    'elementary': {'public': 320000, 'private': 1600000, 'start_age': 6, 'duration': 6},
                    'junior_high': {'public': 490000, 'private': 1410000, 'start_age': 12, 'duration': 3},
                    'high_school': {'public': 460000, 'private': 970000, 'start_age': 15, 'duration': 3},
                    'university': {'public': 540000, 'private': 1350000, 'start_age': 18, 'duration': 4},
                    'graduate_school': {'public': 540000, 'private': 1150000, 'start_age': 22, 'duration': 2}
                }
                
                # 各学校段階を追加（まだ卒業していない段階、schoolsの指定に従う）
                for school_type, data in cost_data.items():
                    # 卒業年齢 = 入学年齢 + 期間 - 1
                    end_age = data['start_age'] + data['duration'] - 1
                    
                    # 現在の年齢が卒業年齢以下の場合のみ追加（まだ卒業していない）
                    if child_age <= end_age:
                        # schoolsオブジェクトから該当学校の設定を取得
                        school_setting = schools.get(school_type, 'none')
                        
                        # "none"の場合はスキップ
                        if school_setting == 'none':
                            continue
                        
                        is_private = (school_setting == 'private')
                        start_year = birth_year + data['start_age']
                        end_year = start_year + data['duration'] - 1
                        annual_cost = data['private'] if is_private else data['public']
                        
                        db.add(Education(
                            user_id=current_user.id,
                            education_type='planned',
                            child_name=child_name,
                            child_age=child_age,
                            school_type=school_type,
                            is_private=is_private,
                            start_year=start_year,
                            end_year=end_year,
                            annual_cost=annual_cost,
                            amount=annual_cost * data['duration'],
                            currency='JPY',
                            start_date=datetime.now().date(),
                            notes=f"AIチャットから自動追加: {message_data.message}"
                        ))
                
                added_items.append("子供教育")
        
        if "career" in all_info and all_info["career"]:
            info = all_info["career"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ キャリア設計を追加: {info}")
                db.add(Career(
                    user_id=current_user.id, 
                    career_type=info.get('career_type', 'その他'), 
                    description=info.get('description', ''), 
                    expected_income=float(info.get('expected_income', 0)) if info.get('expected_income') else None, 
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("キャリア設計")
        
        if "risk" in all_info and all_info["risk"]:
            info = all_info["risk"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ リスクを追加: {info}")
                db.add(Risk(
                    user_id=current_user.id, 
                    risk_type=info.get('risk_type', 'その他'), 
                    name=info.get('name', 'リスク'), 
                    amount=float(info.get('amount', 0)), 
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("リスク")
        
        if "retirement" in all_info and all_info["retirement"]:
            info = all_info["retirement"]
            # リストの場合は最初の要素を使用
            if isinstance(info, list):
                info = info[0] if info else None
            if info:
                print(f"✅ 老後資金を追加: {info}")
                # monthly_amountとtotal_amountのどちらかが設定されている場合
                monthly_amount = info.get('monthly_amount')
                total_amount = info.get('total_amount')
                
                # amountフィールド（後方互換性のため）
                # 一時金の場合はtotal_amount、年金の場合は年間総額を使用
                amount = total_amount if total_amount else (monthly_amount * 12 if monthly_amount else 0)
                
                db.add(Retirement(
                    user_id=current_user.id, 
                    retirement_type=info.get('retirement_type', 'その他'),
                    name=info.get('name', '老後資金'),
                    retirement_age=int(info.get('retirement_age', 65)) if info.get('retirement_age') else None,
                    monthly_amount=float(monthly_amount) if monthly_amount else None,
                    total_amount=float(total_amount) if total_amount else None,
                    amount=float(amount),
                    currency='JPY', 
                    notes=f"AIチャットから自動追加: {message_data.message}"
                ))
                added_items.append("老後資金")
        
        if added_items:
            db.commit()
            print(f"✅ データベースにコミット完了: {', '.join(added_items)}")
    except Exception as e:
        print(f"❌ エラー発生: {str(e)}")
        db.rollback()
        raise
    
    # シンプルな確認メッセージのみ
    if added_items:
        ai_response = f"✅ 以下の情報を登録しました: {', '.join(added_items)}"
    else:
        ai_response = "情報を確認しましたが、登録できる項目がありませんでした。"
    
    db_chat = ChatMessage(user_id=current_user.id, message=message_data.message, response=ai_response)
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.get("/history", response_model=List[ChatMessageResponse])
async def get_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), limit: int = 50):
    return db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).order_by(ChatMessage.created_at.desc()).limit(limit).all()
