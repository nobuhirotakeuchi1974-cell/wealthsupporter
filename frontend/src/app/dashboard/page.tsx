'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  username: string;
}

interface Asset {
  id: number;
  asset_type: string;
  name: string;
  amount: number;
  currency: string;
  purchase_date: string;
  notes: string;
}

interface Income {
  id: number;
  income_type: string;
  amount: number;
  currency: string;
}

interface Expense {
  id: number;
  expense_type: string;
  amount: number;
}

interface House {
  id: number;
  house_type: string;
}

interface Education {
  id: number;
  education_type: string;
}

interface Career {
  id: number;
  career_type: string;
}

interface Risk {
  id: number;
  risk_type: string;
}

interface Retirement {
  id: number;
  retirement_type: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  
  // 資産追加モーダル用の状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetType, setAssetType] = useState('株式');
  const [assetName, setAssetName] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // ユーザー情報を取得
    fetchUserData(token);
    // 全カテゴリの情報を取得
    fetchAssets(token);
    fetchIncomes(token);
    fetchExpenses(token);
    fetchHouses(token);
    fetchEducations(token);
    fetchCareers(token);
    fetchRisks(token);
    fetchRetirements(token);
  }, [router]);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('認証エラー');
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      localStorage.removeItem('access_token');
      router.push('/login');
    }
  };

  const fetchAssets = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/assets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('資産情報取得エラー');
      }

      const assetsData = await response.json();
      setAssets(assetsData);
      
      // 合計金額を計算
      const total = assetsData.reduce((sum: number, asset: Asset) => sum + asset.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('資産情報取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncomes = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/income', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIncomes(data);
        const total = data.reduce((sum: number, income: Income) => sum + income.amount, 0);
        setTotalIncome(total);
      }
    } catch (error) {
      console.error('収入情報取得エラー:', error);
    }
  };

  const fetchExpenses = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/expense', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        const total = data.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        setTotalExpense(total);
      }
    } catch (error) {
      console.error('支出情報取得エラー:', error);
    }
  };

  const fetchHouses = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/house', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
      }
    } catch (error) {
      console.error('家情報取得エラー:', error);
    }
  };

  const fetchEducations = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/education', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEducations(data);
      }
    } catch (error) {
      console.error('教育情報取得エラー:', error);
    }
  };

  const fetchCareers = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/career', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCareers(data);
      }
    } catch (error) {
      console.error('キャリア情報取得エラー:', error);
    }
  };

  const fetchRisks = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/risk', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRisks(data);
      }
    } catch (error) {
      console.error('リスク情報取得エラー:', error);
    }
  };

  const fetchRetirements = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/retirement', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRetirements(data);
      }
    } catch (error) {
      console.error('老後情報取得エラー:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/assets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_type: assetType,
          name: assetName,
          amount: parseFloat(amount),
          currency: 'JPY',
          purchase_date: purchaseDate || null,
          notes: notes || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '資産の追加に失敗しました');
      }

      // 資産リストを再取得
      await fetchAssets(token);
      
      // フォームをリセット
      setAssetType('株式');
      setAssetName('');
      setAmount('');
      setPurchaseDate('');
      setNotes('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('資産追加エラー:', error);
      setSubmitError(error instanceof Error ? error.message : '資産の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: number) => {
    if (!confirm('この資産を削除しますか？')) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('資産の削除に失敗しました');
      }

      // 資産リストを再取得
      await fetchAssets(token);
    } catch (error) {
      console.error('資産削除エラー:', error);
      alert('資産の削除に失敗しました');
    }
  };

  const handleDeleteAllData = async () => {
    if (!confirm('すべてのダッシュボードデータを削除しますか？\nこの操作は取り消せません。')) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // 各カテゴリのすべてのアイテムを削除
      const deletePromises = [
        ...incomes.map(item => fetch(`http://localhost:8000/api/income/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        ...expenses.map(item => fetch(`http://localhost:8000/api/expense/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        ...assets.map(item => fetch(`http://localhost:8000/api/assets/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        ...houses.map(item => fetch(`http://localhost:8000/api/house/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        ...educations.map(item => fetch(`http://localhost:8000/api/education/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        ...careers.map(item => fetch(`http://localhost:8000/api/career/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })),
        ...risks.map(item => fetch(`http://localhost:8000/api/risk/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }))
      ];

      await Promise.all(deletePromises);

      // すべてのデータを再取得
      await Promise.all([
        fetchIncomes(token),
        fetchExpenses(token),
        fetchAssets(token),
        fetchHouses(token),
        fetchEducations(token),
        fetchCareers(token),
        fetchRisks(token)
      ]);

      alert('すべてのデータを削除しました');
    } catch (error) {
      console.error('データ一括削除エラー:', error);
      alert('データの削除中にエラーが発生しました');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-yellow-900 cursor-pointer hover:text-yellow-900">Wealth Supporter</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">ようこそ、{user?.username}さん</span>
            <Link
              href="/profile"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
            >
              設定
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* ナビゲーション */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4">
            <Link
              href="/dashboard"
              className="text-yellow-900 border-b-2 border-yellow-900 px-3 py-2 font-semibold"
            >
              ダッシュボード
            </Link>
            <Link
              href="/chat"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
            >
              AIチャット
            </Link>
            <Link
              href="/simulation"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
            >
              シミュレーション
            </Link>
            <Link
              href="/family"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
            >
              家族構成
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">あなたのライフプランダッシュボード</h2>
            <button
              onClick={handleDeleteAllData}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            >
              ダッシュボードをすべて削除
            </button>
          </div>

          {/* ＜現状＞セクション */}
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-black">＜現状＞</h3>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* 収入 */}
              <Link href="/dashboard/income">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【①収入】</h3>
                    <div className={`w-3 h-3 rounded-full ${incomes.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={incomes.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">給与や副収入を入力して、年間収入を確認しましょう。</p>
                  <p className="text-sm">
                    {incomes.length > 0 ? <span className="font-bold text-green-600">登録数: {incomes.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${incomes.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* 支出 */}
              <Link href="/dashboard/expense">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【②支出】</h3>
                    <div className={`w-3 h-3 rounded-full ${expenses.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={expenses.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">生活費や固定費を記録して、年間支出を把握しましょう。</p>
                  <p className="text-sm">
                    {expenses.length > 0 ? <span className="font-bold text-green-600">登録数: {expenses.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${expenses.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* 資産 */}
              <Link href="/dashboard/assets?type=asset">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【③資産】</h3>
                    <div className={`w-3 h-3 rounded-full ${assets.filter(a => a.amount > 0).length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={assets.filter(a => a.amount > 0).length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">預貯金、株式、不動産などの資産を登録・管理しましょう。</p>
                  <p className="text-sm">
                    {assets.filter(a => a.amount > 0).length > 0 ? <span className="font-bold text-green-600">登録数: {assets.filter(a => a.amount > 0).length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${assets.filter(a => a.amount > 0).length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* 負債 */}
              <Link href="/dashboard/liabilities">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【④負債】</h3>
                    <div className={`w-3 h-3 rounded-full ${assets.filter(a => a.amount < 0).length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={assets.filter(a => a.amount < 0).length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">住宅ローンや借入金などの返済状況を管理しましょう。</p>
                  <p className="text-sm">
                    {assets.filter(a => a.amount < 0).length > 0 ? <span className="font-bold text-green-600">登録数: {assets.filter(a => a.amount < 0).length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${assets.filter(a => a.amount < 0).length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>
            </section>
          </div>

          {/* ＜将来＞セクション */}
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-black">＜将来＞</h3>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* 家 */}
              <Link href="/dashboard/house">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【⑤住宅購入費】</h3>
                    <div className={`w-3 h-3 rounded-full ${houses.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={houses.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">住宅購入やリフォーム計画、ローン返済プラン。</p>
                  <p className="text-sm">
                    {houses.length > 0 ? <span className="font-bold text-green-600">登録数: {houses.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${houses.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* 子ども教育 */}
              <Link href="/dashboard/education">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【⑥子供教育費】</h3>
                    <div className={`w-3 h-3 rounded-full ${educations.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={educations.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">教育費用の計画、公立・私立の選択肢比較。</p>
                  <p className="text-sm">
                    {educations.length > 0 ? <span className="font-bold text-green-600">登録数: {educations.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${educations.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* キャリア設計 */}
              <Link href="/dashboard/career">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【⑦収入見込】</h3>
                    <div className={`w-3 h-3 rounded-full ${careers.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={careers.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">転職、副業、起業など複数選択肢の比較検討。</p>
                  <p className="text-sm">
                    {careers.length > 0 ? <span className="font-bold text-green-600">登録数: {careers.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${careers.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* 老後 */}
              <Link href="/dashboard/retirement">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【⑧老後資金】</h3>
                    <div className={`w-3 h-3 rounded-full ${retirements.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={retirements.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">年金、退職金、老後資金の計画。</p>
                  <p className="text-sm">
                    {retirements.length > 0 ? <span className="font-bold text-green-600">登録数: {retirements.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${retirements.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>

              {/* リスク */}
              <Link href="/dashboard/risk">
                <div className="bg-white rounded-lg p-5 shadow hover:bg-yellow-50 cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-yellow-900">【⑨リスク･その他】</h3>
                    <div className={`w-3 h-3 rounded-full ${risks.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`} title={risks.length > 0 ? '完了' : '未設定'}></div>
                  </div>
                  <p className="text-gray-600 mb-3">生命保険、医療保険、老後資金のリスク管理。</p>
                  <p className="text-sm">
                    {risks.length > 0 ? <span className="font-bold text-green-600">登録数: {risks.length}件</span> : <span className="font-bold text-orange-500">未登録</span>}
                  </p>
                  <div className={`mt-3 h-1 rounded-full ${risks.length > 0 ? 'bg-green-600' : 'bg-orange-500'}`}></div>
                </div>
              </Link>
            </section>
          </div>

      {/* 資産追加モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">資産を追加</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSubmitError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label htmlFor="asset-type" className="block text-sm font-medium text-gray-700 mb-1">
                    資産種類 <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="asset-type"
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="株式">株式</option>
                    <option value="投資信託">投資信託</option>
                    <option value="債券">債券</option>
                    <option value="預金">預金</option>
                    <option value="不動産">不動産</option>
                    <option value="仮想通貨">仮想通貨</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="asset-name" className="block text-sm font-medium text-gray-700 mb-1">
                    名称 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="asset-name"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    required
                    placeholder="例: トヨタ自動車"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    金額 (円) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    placeholder="例: 500000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label htmlFor="purchase-date" className="block text-sm font-medium text-gray-700 mb-1">
                    購入日
                  </label>
                  <input
                    type="date"
                    id="purchase-date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="メモや備考を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSubmitError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '追加中...' : '追加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-300 py-4 text-center text-sm text-gray-600">
        <nav className="space-x-4 inline-flex">
          <a href="#" className="text-orange-700 hover:underline">利用規約</a>
          <a href="#" className="text-orange-700 hover:underline">プライバシーポリシー</a>
          <a href="#" className="text-orange-700 hover:underline">ヘルプ・FAQ</a>
        </nav>
      </footer>
    </div>
  );
}
