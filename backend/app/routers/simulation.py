from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.asset import Asset
from app.models.house import House
from app.models.education import Education
from app.models.family import FamilyMember
from app.models.career import Career
from app.models.retirement import Retirement
from app.routers.auth import get_current_user
from app.services.gemini_service import GeminiService
from datetime import datetime
from typing import List, Dict
import google.generativeai as genai
from app.config import settings

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

# Gemini モデルの初期化
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-flash-latest')

@router.get("/cashflow")
async def get_cashflow_simulation(
    years: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    キャッシュフローシミュレーションを計算
    
    Returns:
        years: 年のリスト
        annual_income: 年間収入のリスト
        annual_expense: 年間支出のリスト
        net_cashflow: 年間収支のリスト（収入-支出）
        cumulative_assets: 累積資産のリスト
    """
    
    # 現在のデータを取得
    incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()
    houses = db.query(House).filter(House.user_id == current_user.id).all()
    educations = db.query(Education).filter(Education.user_id == current_user.id).all()
    family_members = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()
    careers = db.query(Career).filter(Career.user_id == current_user.id).all()
    retirements = db.query(Retirement).filter(Retirement.user_id == current_user.id).all()
    
    # 本人の年齢を取得
    current_age = None
    person = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id,
        FamilyMember.relationship_type == '本人'
    ).first()
    
    if person and person.birth_date:
        birth_year = person.birth_date.year
        current_age = datetime.now().year - birth_year
    
    # 現在の年を取得
    current_year = datetime.now().year
    
    # 初期資産合計を計算
    initial_assets = sum(asset.amount for asset in assets)
    
    # キャリア設計からベース設定を取得（localStorage相当）
    base_income = 5000000  # デフォルト
    base_increase_rate = 2  # デフォルト
    retirement_age = 65  # デフォルト
    
    # 収入ページから現在の年収を取得
    for income in incomes:
        if income.income_type in ['月収', '月給']:
            base_income = income.amount * 12
            break
        elif income.income_type in ['年収', '年俸']:
            base_income = income.amount
            break
    
    # 副業収入を計算
    side_job_income = 0
    for income in incomes:
        if '副業' in income.income_type or '副収入' in income.income_type:
            if income.occurrence_type in ['月収', '12']:
                side_job_income += income.amount * 12
            else:
                side_job_income += income.amount
    
    # キャリアイベントから副業開始を加算
    for career in careers:
        if ('副業' in career.career_type) and career.expected_income:
            if not career.event_year or career.event_year <= current_year:
                side_job_income += career.expected_income
    
    # キャリアイベントを年でソート
    sorted_careers = sorted([c for c in careers if c.event_year], key=lambda x: x.event_year)
    
    # 年間支出を計算
    annual_expense_base = 0
    for expense in expenses:
        if expense.occurrence_type in ['月収', '12']:
            annual_expense_base += expense.amount * 12
        else:
            annual_expense_base += expense.amount
    
    print(f"[DEBUG] 支出合計: {annual_expense_base:,.0f}円")
    
    # 家賃・住宅ローン（年次計算はループ内で実施）
    # ここでは初期値のみ設定
    print(f"[DEBUG] 住宅データ件数: {len(houses)}")
    for house in houses:
        print(f"[DEBUG] 住宅: {house.house_type}, 月額: {house.amount:,.0f}円, 購入年: {house.purchase_year}, ローン期間: {house.loan_term}年")
    
    # 住宅ローン残高を管理（各住宅のローン残高を追跡）
    loan_balances = {}  # {house_id: balance}
    
    # シミュレーション結果を格納
    simulation_years = []
    annual_incomes = []
    annual_expenses = []
    net_cashflows = []
    cumulative_assets_list = []
    
    cumulative_assets = initial_assets
    
    for year in range(years + 1):
        target_year = current_year + year
        target_age = current_age + year if current_age else None
        simulation_years.append(target_year)
        
        # === 収入計算（キャリア設計 + 老後設計） ===
        year_income = 0
        
        # 定年前：キャリア設計の総年収（本業 + 副業）
        if target_age and target_age < retirement_age:
            # その年のキャリアイベントを探す
            event = next((c for c in sorted_careers if c.event_year == target_year), None)
            
            if year == 0:
                # 初年度は現在の年収
                year_income = base_income + side_job_income
            elif event:
                # イベントがある年は予想収入を使用
                year_income = (event.expected_income or 0) + side_job_income
            else:
                # イベントがない年は前年から昇給率で計算
                prev_income = annual_incomes[-1] if annual_incomes else base_income
                # 適用される昇給率を取得
                applicable_rate = base_increase_rate
                prev_events = [c for c in sorted_careers if c.event_year and c.event_year < target_year]
                if prev_events:
                    latest_event = prev_events[-1]
                    if latest_event.salary_increase_rate is not None:
                        applicable_rate = latest_event.salary_increase_rate
                
                # 本業収入のみ昇給を適用、副業収入は固定
                prev_main_income = prev_income - side_job_income
                year_income = prev_main_income * (1 + applicable_rate / 100) + side_job_income
        
        # 定年後：老後設計（年金など）
        else:
            for retirement in retirements:
                # 各老後資金の開始年齢を取得（デフォルト65歳）
                ret_start_age = retirement.retirement_age if retirement.retirement_age else retirement_age
                
                # retirement_typeに基づいた処理
                if retirement.retirement_type == '年金':
                    # 年金は開始年齢以降、毎年継続的に受け取る
                    if target_age and target_age >= ret_start_age and retirement.monthly_amount:
                        year_income += retirement.monthly_amount * 12
                elif retirement.retirement_type == '一時金（退職金など）':
                    # 一時金は開始年齢に達した年のみ
                    if target_age == ret_start_age:
                        if retirement.total_amount:
                            year_income += retirement.total_amount
                        elif retirement.monthly_amount:
                            year_income += retirement.monthly_amount * 12
                else:  # 'その他'
                    # その他は開始年齢以降、継続的な収入として扱う
                    if target_age and target_age >= ret_start_age:
                        if retirement.monthly_amount:
                            year_income += retirement.monthly_amount * 12
                        elif retirement.total_amount:
                            year_income += retirement.total_amount
        
        # === 支出計算（支出 + 住宅 + 教育） ===
        year_expense = annual_expense_base
        
        # 住宅費用を年次で計算（購入年とローン期間を考慮）
        annual_housing_cost = 0
        loan_principal_payments = 0  # 元金返済額の合計（資産増加分）
        loan_new_debt = 0  # 新規ローン借入額（負債増加）
        
        for house in houses:
            # 賃貸は常に計算
            if house.house_type in ['賃貸', '家賃']:
                annual_housing_cost += house.amount * 12
            
            # 住宅ローンは負債として扱う
            elif house.house_type in ['住宅ローン', 'マンションローン', '購入', '新築マンション']:
                if house.purchase_year and house.loan_term and house.amount:
                    # amountが購入価格の場合
                    purchase_price = house.amount
                    down_payment = house.down_payment or 0
                    loan_amount = purchase_price - down_payment  # ローン元金
                    
                    # 金利を考慮した月々返済額を計算（元利均等返済）
                    if house.loan_rate and house.loan_rate > 0:
                        annual_rate = house.loan_rate / 100  # %を小数に変換
                        monthly_rate = annual_rate / 12
                        num_payments = house.loan_term * 12
                        
                        # 元利均等返済の計算式
                        # 月々返済額 = ローン元金 × (月利 × (1 + 月利)^返済回数) / ((1 + 月利)^返済回数 - 1)
                        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
                        annual_payment = monthly_payment * 12
                        total_repayment = monthly_payment * num_payments  # 返済総額（元金+利息）
                    else:
                        # 金利0%の場合は単純計算
                        monthly_payment = loan_amount / (house.loan_term * 12)
                        annual_payment = monthly_payment * 12
                        total_repayment = loan_amount
                    
                    # 購入年の処理
                    if target_year == house.purchase_year:
                        # 頭金を支出
                        if house.down_payment:
                            annual_housing_cost += house.down_payment
                        
                        # 返済総額（元金+利息）を負債として記録
                        loan_balances[house.id] = total_repayment
                        
                        # 返済総額を負債として記録（後で累積資産から引く）
                        loan_new_debt += total_repayment
                        
                        print(f"[DEBUG] {target_year}年 住宅購入: 購入価格={purchase_price:,.0f}円, 頭金={down_payment:,.0f}円, ローン元金={loan_amount:,.0f}円, 返済総額={total_repayment:,.0f}円, 年間返済額={annual_payment:,.0f}円")
                    
                    # 返済期間の処理（購入年も含む）
                    if house.purchase_year <= target_year < house.purchase_year + house.loan_term:
                        # 購入年は返済額を支出に含めない（既に頭金で支出済み）
                        if target_year != house.purchase_year:
                            annual_housing_cost += annual_payment
                        
                        # 年間返済額がそのまま資産増加（負債減少）となる
                        loan_principal_payments += annual_payment
                        
                        # ローン残高を減らす
                        if house.id in loan_balances:
                            loan_balances[house.id] -= annual_payment
                            if target_year == house.purchase_year or (target_year - house.purchase_year) % 5 == 0:
                                print(f"[DEBUG] {target_year}年 ローン返済: 年間返済額={annual_payment:,.0f}円, 残高={loan_balances[house.id]:,.0f}円")
                else:
                    # 購入年やローン期間が未設定の場合は従来通り支出として計算
                    annual_housing_cost += house.amount * 12
        
        year_expense += annual_housing_cost
        
        # 教育費を年次で計算（開始年と終了年を考慮）
        education_cost = 0
        for education in educations:
            if education.amount:
                # start_year と end_year が設定されている場合
                if education.start_year and education.end_year:
                    if education.start_year <= target_year <= education.end_year:
                        # annual_cost が設定されていればそれを使用、なければamount
                        if education.annual_cost:
                            education_cost += education.annual_cost
                        else:
                            education_cost += education.amount
                # 年次が設定されていない場合は全期間で計算
                else:
                    education_cost += education.amount
        
        year_expense += education_cost
        
        if target_year == current_year:  # 初年度のみログ出力
            print(f"[DEBUG] 初年度支出内訳 ({target_year}年):")
            print(f"  - 支出: {annual_expense_base:,.0f}円")
            print(f"  - 住宅: {annual_housing_cost:,.0f}円")
            print(f"  - 教育: {education_cost:,.0f}円")
            print(f"  - 合計: {year_expense:,.0f}円")
        
        # 年間収支
        net_cashflow = year_income - year_expense
        
        # 累積資産を更新
        # 1. 収支を加算
        cumulative_assets += net_cashflow
        # 2. 新規ローン借入を負債として減算
        cumulative_assets -= loan_new_debt
        # 3. ローン元金返済分を資産として加算
        cumulative_assets += loan_principal_payments
        
        if loan_new_debt > 0 or loan_principal_payments > 0:
            print(f"[DEBUG] {target_year}年 累積資産変動: 収支={net_cashflow:,.0f}円, 新規借入=-{loan_new_debt:,.0f}円, 元金返済=+{loan_principal_payments:,.0f}円, 累積資産={cumulative_assets:,.0f}円")
        
        annual_incomes.append(round(year_income))
        annual_expenses.append(round(year_expense))
        net_cashflows.append(round(net_cashflow))
        cumulative_assets_list.append(round(cumulative_assets))
    
    # AIによる分析と提案を生成
    ai_suggestions = await generate_ai_suggestions(
        initial_assets=initial_assets,
        annual_income=annual_incomes[0] if annual_incomes else 0,
        annual_expense=annual_expenses[0] if annual_expenses else 0,
        net_cashflow=net_cashflows[0] if net_cashflows else 0,
        final_assets=cumulative_assets_list[-1] if cumulative_assets_list else 0,
        family_count=len(family_members),
        has_children=len([f for f in family_members if '子供' in f.relationship_type]) > 0
    )
    
    return {
        "years": simulation_years,
        "annual_income": annual_incomes,
        "annual_expense": annual_expenses,
        "net_cashflow": net_cashflows,
        "cumulative_assets": cumulative_assets_list,
        "initial_assets": round(initial_assets),
        "current_age": current_age,
        "ai_suggestions": ai_suggestions
    }


async def generate_ai_suggestions(
    initial_assets: float,
    annual_income: float,
    annual_expense: float,
    net_cashflow: float,
    final_assets: float,
    family_count: int,
    has_children: bool
) -> Dict:
    """
    AIによるキャッシュフロー改善提案を生成
    """
    
    prompt = f"""
あなたはファイナンシャルプランナーです。以下のキャッシュフロー情報を分析し、改善ポイントと具体的なアクション提案を日本語で提供してください。

【現在の状況】
- 初期資産: {int(initial_assets):,}円
- 年間収入: {int(annual_income):,}円
- 年間支出: {int(annual_expense):,}円
- 年間収支: {int(net_cashflow):,}円
- 50年後の累積資産: {int(final_assets):,}円
- 家族構成: {family_count}人
- 子供の有無: {'有' if has_children else '無'}

【出力形式】
以下のJSON形式で返してください：
{{
  "summary": "現在の財務状況の総評（1-2文）",
  "improvement_points": [
    "改善ポイント1",
    "改善ポイント2",
    "改善ポイント3"
  ],
  "action_items": [
    "具体的なアクション1",
    "具体的なアクション2",
    "具体的なアクション3"
  ],
  "risk_alerts": [
    "注意すべきリスク1",
    "注意すべきリスク2"
  ]
}}

注意事項：
- 改善ポイントは具体的かつ実行可能なものにしてください
- アクション提案は今すぐ始められるものを優先してください
- ポジティブなトーンで、実現可能な範囲で提案してください
"""

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # JSON部分を抽出
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()
        
        import json
        suggestions = json.loads(result_text)
        return suggestions
        
    except Exception as e:
        print(f"AI提案生成エラー: {e}")
        # エラー時はデフォルトの提案を返す
        return {
            "summary": "現在の収支状況を分析中です。データを入力して最適な提案を受け取りましょう。",
            "improvement_points": [
                "収入と支出のバランスを定期的に見直しましょう",
                "緊急時のための資金を確保しましょう",
                "長期的な資産形成を計画しましょう"
            ],
            "action_items": [
                "月次の家計簿を記録して支出を可視化する",
                "収入の10-20%を貯蓄に回す",
                "投資信託などの資産運用を検討する"
            ],
            "risk_alerts": [
                "収入が途絶えた場合の備えを確認しましょう",
                "ライフイベント（教育費、住宅購入等）に備えましょう"
            ]
        }

