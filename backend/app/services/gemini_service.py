# Gemini AIサービス
# 初心者向け解説：Gemini APIを使ってチャット機能を実装します

import google.generativeai as genai
import json
import re
from app.config import settings
from typing import List, Dict, Optional, Tuple

# === Gemini API の初期化 ===
# なぜ configure が必要：APIキーを設定して認証
genai.configure(api_key=settings.GEMINI_API_KEY)

# === モデルの選択 ===
# models/gemini-flash-latest：テキスト生成用の最新無料モデル
# なぜ gemini-flash-latest：無料版で使える、日本語対応、高速
model = genai.GenerativeModel('models/gemini-flash-latest')

class GeminiService:
    """
    Gemini AIとの対話を管理するサービスクラス
    
    初心者向け解説：
    - ユーザーの質問を受け取る
    - Gemini APIに送信
    - AIの回答を返す
    """
    
    @staticmethod
    async def extract_income_info(message: str) -> Optional[Dict]:
        """
        ユーザーのメッセージから収入情報を抽出
        
        例：「月収30万円です」
        → {"income_type": "月収", "amount": 300000}
        
        例：「年収500万円あります」
        → {"income_type": "年収", "amount": 5000000}
        """
        
        prompt = f"""
以下のメッセージから収入情報を抽出してください。
収入に関する情報がない場合は、"NO_INCOME" と返してください。

メッセージ: {message}

抽出する情報：
1. income_type: 収入の種類（月収、年収、ボーナス、副業、その他のいずれか）
2. amount: 金額（数値のみ、単位なし）

重要なルール：
- 月収、年収、給料、収入、ボーナス などの表現がある場合のみ抽出
- 金額は「万円」「億円」を数値に変換（例：30万円 → 300000、500万円 → 5000000）
- 収入情報が明確でない場合は "NO_INCOME" と返す
- 結果は必ずJSON形式で返す

出力形式（収入情報がある場合）：
{{"income_type": "種類", "amount": 金額}}

出力形式（収入情報がない場合）：
NO_INCOME
"""
        
        try:
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            if "NO_INCOME" in result_text:
                return None
            
            # JSON部分を抽出
            json_match = re.search(r'\{.*?\}', result_text, re.DOTALL)
            if json_match:
                income_info = json.loads(json_match.group())
                
                # 必須フィールドの検証
                if all(key in income_info for key in ['income_type', 'amount']):
                    # 金額を数値型に変換
                    income_info['amount'] = float(income_info['amount'])
                    return income_info
            
            return None
            
        except Exception as e:
            print(f"収入情報抽出エラー: {str(e)}")
            return None
    
    @staticmethod
    async def extract_all_info(message: str) -> Dict:
        """
        ユーザーのメッセージから全カテゴリの情報を抽出
        
        戻り値：{"income": {...}, "expense": {...}, "asset": {...}, "house": {...}, "education": {...}, "career": {...}, "risk": {...}, "retirement": {...}}
        """
        
        prompt = f"""
以下のユーザーのメッセージを分析して、該当する情報を各カテゴリに振り分けてください。

【ユーザーのメッセージ】
{message}

【重要：判定優先順位】
1. 「収入」「稼ぐ」という表現があれば → income カテゴリ
   （家賃収入、配当金、副業収入なども含む）
2. 住居費用（支払い）がある場合 → house カテゴリ
   （家賃、住宅ローンなど）
3. 「払う」「支出」「使う」などの表現があれば → expense カテゴリ
4. 資産の保有や購入があれば → asset カテゴリ

【振り分けるカテゴリと必須フィールド】

1. income（収入）★柔軟に判定★
   - income_type: 以下から適切なものを選択、または具体的な内容を記載
     * 月収/年収/ボーナス/給料/副業/副収入/家賃収入/配当金/利子/投資収益/不動産収入/その他
   - amount: 金額（数値）
   
   判定基準：
   - 「収入」「稼ぐ」「給料」「ボーナス」「もらう」などがある
   - 「○○収入」という表現（家賃収入、副業収入など）
   - 「配当」「利子」「不動産収入」など収入源が明示されている
   - 周期（月、年）と金額が記載されている
   
   例：
   - 「月収30万円」→ {{"income_type": "月収", "amount": 300000}}
   - 「家賃収入 月10万円」→ {{"income_type": "家賃収入", "amount": 100000}}
   - 「副業で月5万円稼いでいます」→ {{"income_type": "副業", "amount": 50000}}
   - 「配当金が年20万円」→ {{"income_type": "配当金", "amount": 200000}}
   - 「ボーナス年100万円」→ {{"income_type": "ボーナス", "amount": 1000000}}
   - 「不動産から月15万の収入」→ {{"income_type": "不動産収入", "amount": 150000}}

2. expense（支出）
   - expense_type: 固定費/変動費/その他
   - category: 食費/光熱費/交通費/通信費/娯楽費/医療費/教育費/その他
   - amount: 金額（数値）
   
   判定基準：
   - 「払う」「支出」「使う」「かかる」「費用」などがある
   - 具体的な支出項目（食費、光熱費など）が記載されている
   - ただし、家賃・住宅ローンは除外（house カテゴリ）
   
   例：
   - 「食費5万円」→ {{"expense_type": "変動費", "category": "食費", "amount": 50000}}
   - 「毎月5万円使っています」→ {{"expense_type": "その他", "category": "その他", "amount": 50000}}
   - 「光熱費月2万円」→ {{"expense_type": "固定費", "category": "光熱費", "amount": 20000}}

3. asset（資産）
   - asset_type: 株式/貯金/不動産/投資信託/暗号資産/債券/ローン/その他
   - name: 具体的な名前
   - amount: 金額（数値、負債はマイナス）
   
   判定基準：
   - 「持っている」「保有」「買った」「購入」などがある
   - 資産の種類（株、貯金、投資信託など）が明示されている
   - ただし、住宅ローンは除外（house カテゴリ）
   
   例：
   - 「トヨタ株50万円」→ {{"asset_type": "株式", "name": "トヨタ株", "amount": 500000}}
   - 「貯金300万円」→ {{"asset_type": "貯金", "name": "貯金", "amount": 3000000}}
   - 「車のローン100万円」→ {{"asset_type": "ローン", "name": "車のローン", "amount": -1000000}}

4. house（家賃・住宅ローン）
   - house_type: 賃貸/持ち家/購入予定/住宅ローン/その他
   - name: 物件名や説明
   - amount: 金額
   
   判定基準：
   - 「家賃」「賃貸」「住宅ローン」「マンション」「持ち家」などがある
   - 住居に関連する費用や資産である
   - 注意：「家賃収入」は income カテゴリに振り分け
   
   例：
   - 「家賃10万円」→ {{"house_type": "賃貸", "name": "家賃", "amount": 100000}}
   - 「住宅ローン月8万円」→ {{"house_type": "住宅ローン", "name": "住宅ローン", "amount": 80000}}
   - 「持ち家3000万円」→ {{"house_type": "持ち家", "name": "持ち家", "amount": 30000000}}

5. education（子供教育）
   - child_name: 子供の名前
   - child_age: 子供の年齢（数値）
   - schools: 各学校段階の設定（オブジェクト）
     * elementary: 小学校（"public"=公立, "private"=私立, "none"=通わせない）
     * junior_high: 中学校（"public"=公立, "private"=私立, "none"=通わせない）
     * high_school: 高校（"public"=公立, "private"=私立, "none"=通わせない）
     * university: 大学（"public"=公立, "private"=私立, "none"=通わせない）
     * graduate_school: 大学院（"public"=公立, "private"=私立, "none"=通わせない）
   - amount: 費用（省略可）
   
   判定基準：
   - 子供に関する情報がある
   - 学校や教育に関する記載がある
   
   例：
   - 「10歳の息子、小学校は公立、中学からは私立」→ {{"child_name": "息子", "child_age": 10, "schools": {{"elementary": "public", "junior_high": "private", "high_school": "private", "university": "private"}}, "amount": 0}}
   - 「5歳の娘、すべて私立」→ {{"child_name": "娘", "child_age": 5, "schools": {{"elementary": "private", "junior_high": "private", "high_school": "private", "university": "private"}}, "amount": 0}}
   重要：「中学から私立」などの表現は、それ以降の全段階を私立に設定。明示されていない過去の学校段階は"none"に設定

6. career（キャリア設計）
   - career_type: 転職/昇進/独立/副業/その他
   - description: 説明
   - expected_income: 予想収入
   
   判定基準：
   - 「転職」「昇進」「独立」「起業」などがある

7. risk（リスク）
   - risk_type: 生命保険/医療保険/損害保険/貯蓄型保険/その他
   - name: 保険名等
   - amount: 保険料や保障額
   
   判定基準：
   - 「保険」「リスク」などがある

8. retirement（老後資金）
   - retirement_type: 年金/一時金（退職金など）/その他
   - name: 名称（国民年金、厚生年金、企業年金、退職金など）
   - retirement_age: 受給開始年齢（数値）
   - monthly_amount: 月額（年金の場合）
   - total_amount: 年間総額または一時金総額
   
   判定基準：
   - 「年金」「退職金」「老後」「定年」などがある
   - 将来の収入に関する記載がある
   
   例：
   - 「65歳から年金月15万円」→ {{"retirement_type": "年金", "name": "年金", "retirement_age": 65, "monthly_amount": 150000, "total_amount": 1800000}}
   - 「退職金2000万円」→ {{"retirement_type": "一時金（退職金など）", "name": "退職金", "retirement_age": 65, "total_amount": 20000000}}
   - 「厚生年金月額10万円」→ {{"retirement_type": "年金", "name": "厚生年金", "monthly_amount": 100000, "total_amount": 1200000}}

【金額の変換ルール】
- 「1万円」→ 10000
- 「10万円」→ 100000
- 「30万円」→ 300000
- 「100万円」→ 1000000
- 「500万円」→ 5000000
- 「2000万円」→ 20000000
- 「1億円」→ 100000000

【出力形式】
該当情報がある場合（必ずJSONのみ）：
{{
  "income": {{"income_type": "家賃収入", "amount": 100000}},
  "expense": {{"expense_type": "変動費", "category": "食費", "amount": 50000}},
  "retirement": {{"retirement_type": "年金", "name": "厚生年金", "retirement_age": 65, "monthly_amount": 150000, "total_amount": 1800000}}
}}

該当情報がない場合：
{{}}

※説明文は一切不要です。JSONのみを返してください。
※「○○収入」という表現は必ず income カテゴリです。
※「年金」「退職金」「老後」に関する表現は retirement カテゴリです。
"""
        
        try:
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            print(f"=== Gemini生成テキスト ===")
            print(result_text)
            print(f"=========================")
            
            # ```json ブロックがある場合は中身を抽出
            if "```json" in result_text:
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', result_text, re.DOTALL)
                if json_match:
                    result_text = json_match.group(1)
            
            # JSON部分を抽出
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                
                # 各カテゴリの金額を数値型に変換
                for category in ['income', 'expense', 'asset', 'house', 'education', 'career', 'risk']:
                    if category in result and isinstance(result[category], dict):
                        if 'amount' in result[category]:
                            try:
                                result[category]['amount'] = float(result[category]['amount'])
                            except:
                                pass
                        if category == 'career' and 'expected_income' in result[category]:
                            try:
                                result[category]['expected_income'] = float(result[category]['expected_income'])
                            except:
                                pass
                
                print(f"=== パース後のJSON ===")
                print(result)
                print(f"=====================")
                
                return result
            
            return {}
            
        except Exception as e:
            print(f"情報抽出エラー: {str(e)}")
            return {}
    
    @staticmethod
    async def extract_asset_info(message: str) -> Optional[Dict]:
        """
        ユーザーのメッセージから資産情報を抽出
        
        例：「マンション2000万円購入しています」
        → {"asset_type": "不動産", "name": "マンション", "amount": 20000000}
        """
        
        prompt = f"""
以下のメッセージから資産の購入・保有情報を抽出してください。
資産の購入や保有を示す表現がない場合は、"NO_ASSET" と返してください。

メッセージ: {message}

抽出する情報：
1. asset_type: 資産の種類（株式、投資信託、債券、預金、不動産、仮想通貨、その他のいずれか）
2. name: 資産の名前（具体的な名称）
3. amount: 金額（数値のみ、単位なし）

重要なルール：
- 購入、保有、買った、持っている などの表現がある場合のみ抽出
- 金額は「万円」「億円」を数値に変換（例：2000万円 → 20000000）
- 資産情報が明確でない場合は "NO_ASSET" と返す
- 結果は必ずJSON形式で返す

出力形式（資産情報がある場合）：
{{"asset_type": "種類", "name": "名前", "amount": 金額}}

出力形式（資産情報がない場合）：
NO_ASSET
"""
        
        try:
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            if "NO_ASSET" in result_text:
                return None
            
            # JSON部分を抽出（```json ブロックがある場合に対応）
            json_match = re.search(r'\{.*?\}', result_text, re.DOTALL)
            if json_match:
                asset_info = json.loads(json_match.group())
                
                # 必須フィールドの検証
                if all(key in asset_info for key in ['asset_type', 'name', 'amount']):
                    # 金額を数値型に変換
                    asset_info['amount'] = float(asset_info['amount'])
                    return asset_info
            
            return None
            
        except Exception as e:
            print(f"資産情報抽出エラー: {str(e)}")
            return None
    
    @staticmethod
    async def generate_response(
        message: str,
        user_assets: List[Dict] = None,
        asset_added: bool = False
    ) -> str:
        """
        Gemini AIから回答を生成
        
        引数：
            message: ユーザーのメッセージ
            user_assets: ユーザーの資産情報（コンテキストとして使用）
            asset_added: 資産が追加された場合True
        
        戻り値：
            AIの回答テキスト
        """
        
        # === コンテキストの構築 ===
        # なぜコンテキストが必要：
        # - ユーザーの資産情報を元にアドバイスできる
        # - より具体的で役立つ回答が得られる
        
        context = "あなたは資産管理のアドバイザーです。ユーザーの質問に親切に答えてください。\n\n"
        
        if asset_added:
            context += "【重要】ユーザーが資産を追加しました。資産の追加を確認し、簡単なアドバイスをしてください。\n\n"
        
        if user_assets and len(user_assets) > 0:
            context += "ユーザーの現在の資産情報：\n"
            total_amount = 0
            
            for asset in user_assets:
                context += f"- {asset['name']} ({asset['asset_type']}): {asset['amount']:,.0f} {asset['currency']}\n"
                total_amount += asset['amount']
            
            context += f"\n合計資産: {total_amount:,.0f} JPY\n\n"
        else:
            context += "ユーザーはまだ資産を登録していません。\n\n"
        
        context += f"ユーザーの質問: {message}\n\n"
        context += "回答は簡潔で分かりやすく、具体的なアドバイスを含めてください。"
        
        try:
            # === Gemini APIへリクエスト ===
            # なぜ generate_content：テキスト生成のメインメソッド
            response = model.generate_content(context)
            
            # 注目ポイント：response.text で回答テキストを取得
            return response.text
            
        except Exception as e:
            # エラーハンドリング
            # なぜ必要：API制限やネットワークエラーに対応
            print(f"Gemini API エラー: {str(e)}")
            
            # ユーザーにフレンドリーなエラーメッセージ
            if "quota" in str(e).lower():
                return "申し訳ございません。現在、AIサービスの利用上限に達しています。しばらく待ってから再度お試しください。"
            elif "api_key" in str(e).lower():
                return "申し訳ございません。AIサービスの設定に問題があります。管理者にお問い合わせください。"
            else:
                return f"申し訳ございません。AIサービスでエラーが発生しました。もう一度お試しください。"
    
    @staticmethod
    async def generate_asset_advice(user_assets: List[Dict]) -> str:
        """
        資産に基づいた一般的なアドバイスを生成
        
        使用例：ダッシュボードで表示する自動アドバイス
        """
        if not user_assets or len(user_assets) == 0:
            return "資産を登録すると、AIがアドバイスを提供します。"
        
        total = sum(asset['amount'] for asset in user_assets)
        
        prompt = f"""
ユーザーの資産ポートフォリオを分析して、簡潔なアドバイスを提供してください。

資産情報：
"""
        for asset in user_assets:
            prompt += f"- {asset['name']}: {asset['amount']:,.0f} {asset['currency']}\n"
        
        prompt += f"\n合計: {total:,.0f} JPY\n\n"
        prompt += "3つのポイントに絞って、具体的なアドバイスをしてください。"
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API エラー: {str(e)}")
            return "現在、アドバイス生成サービスが利用できません。"
