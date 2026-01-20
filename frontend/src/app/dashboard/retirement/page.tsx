'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Retirement {
  id: number;
  retirement_type: string;
  name: string;
  retirement_age?: number;
  monthly_amount?: number;
  total_amount?: number;
  notes?: string;
}

export default function RetirementPage() {
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [baseSettings, setBaseSettings] = useState({
    retirement_age: '65',
    life_expectancy: '90',
    current_age: '30'
  });
  const [formData, setFormData] = useState({
    retirement_type: '年金',
    name: '',
    start_age: '',
    monthly_amount: '',
    annual_amount: '',
    currency: 'JPY',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    // localStorageからベース設定を読み込み
    const savedSettings = localStorage.getItem('retirementBaseSettings');
    if (savedSettings) {
      setBaseSettings(JSON.parse(savedSettings));
    }
    
    fetchUserData();
    fetchRetirements();
    fetchUserAge();

    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      console.log('[Retirement] Received broadcast:', event.data);
      if (event.data.type === 'data-updated' && event.data.context === 'retirement') {
        console.log('[Retirement] Context matched, fetching data...');
        fetchRetirements();
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const fetchUserAge = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/family', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const families = await response.json();
        const person = families.find((f: any) => f.relationship_type === '本人');
        if (person && person.birth_date) {
          const birthDate = new Date(person.birth_date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          setBaseSettings((prev: typeof baseSettings) => ({ ...prev, current_age: age.toString() }));
        }
      }
    } catch (error) {
      console.error('家族情報の取得に失敗:', error);
    }
  };

  useEffect(() => {
    // ベース設定をlocalStorageに保存
    localStorage.setItem('retirementBaseSettings', JSON.stringify(baseSettings));
  }, [baseSettings]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
      }
    } catch (error) {
      console.error('ユーザー情報の取得に失敗:', error);
    }
  };

  const fetchRetirements = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/retirement/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('取得した老後資金データ:', data);
        setRetirements(data);
      }
    } catch (error) {
      console.error('老後情報の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/retirement/${editingId}`
        : 'http://localhost:8000/api/retirement/';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          retirement_type: formData.retirement_type,
          name: formData.name,
          retirement_age: formData.start_age ? parseInt(formData.start_age) : null,
          monthly_amount: formData.monthly_amount ? parseFloat(formData.monthly_amount) : null,
          total_amount: formData.annual_amount ? parseFloat(formData.annual_amount) : null,
          amount: formData.annual_amount ? parseFloat(formData.annual_amount) : (formData.monthly_amount ? parseFloat(formData.monthly_amount) * 12 : 0),
          currency: formData.currency,
          start_date: formData.start_date,
          notes: formData.notes || null
        })
      });
      
      console.log('送信したデータ:', {
        retirement_type: formData.retirement_type,
        name: formData.name,
        retirement_age: formData.start_age ? parseInt(formData.start_age) : null,
        monthly_amount: formData.monthly_amount ? parseFloat(formData.monthly_amount) : null,
        total_amount: formData.annual_amount ? parseFloat(formData.annual_amount) : null,
        amount: formData.annual_amount ? parseFloat(formData.annual_amount) : (formData.monthly_amount ? parseFloat(formData.monthly_amount) * 12 : 0),
        currency: formData.currency,
        start_date: formData.start_date,
        notes: formData.notes || null
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        alert(`エラー: ${response.status} - ${errorText}`);
        return;
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({
        retirement_type: '年金',
        name: '',
        start_age: '',
        monthly_amount: '',
        annual_amount: '',
        currency: 'JPY',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchRetirements();
    } catch (error) {
      console.error('老後情報の追加に失敗しました:', error);
      alert('エラーが発生しました: ' + error);
    }
  };

  const handleEdit = (retirement: Retirement) => {
    setEditingId(retirement.id);
    setFormData({
      retirement_type: retirement.retirement_type,
      name: retirement.name,
      start_age: retirement.retirement_age ? retirement.retirement_age.toString() : '',
      monthly_amount: retirement.monthly_amount ? retirement.monthly_amount.toString() : '',
      annual_amount: retirement.total_amount ? retirement.total_amount.toString() : '',
      currency: 'JPY',
      start_date: new Date().toISOString().split('T')[0],
      notes: retirement.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この老後情報を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/retirement/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchRetirements();
      }
    } catch (error) {
      console.error('削除に失敗しました:', error);
    }
  };

  // 老後資金の推移を計算
  const calculateRetirementProjection = () => {
    const retirementAge = parseInt(baseSettings.retirement_age) || 65;
    const lifeExpectancy = parseInt(baseSettings.life_expectancy) || 90;
    const currentAge = parseInt(baseSettings.current_age) || 30;
    const currentYear = new Date().getFullYear();
    const retirementYear = currentYear + (retirementAge - currentAge);
    
    const projection = [];
    let cumulativeIncome = 0;
    
    for (let year = retirementYear; year <= currentYear + (lifeExpectancy - currentAge); year++) {
      const age = retirementAge + (year - retirementYear);
      let yearIncome = 0;
      let pensionIncome = 0;
      let lumpSumIncome = 0;
      let otherIncome = 0;
      
      // 各老後資金項目を計算
      retirements.forEach((ret: Retirement) => {
        const startAge = ret.retirement_age || retirementAge;
        
        if (age >= startAge) {
          let amount = 0;
          
          if (ret.retirement_type === '年金') {
            // 年金は開始年齢以降継続
            if (ret.monthly_amount) {
              amount = ret.monthly_amount * 12;
            } else if (ret.total_amount) {
              amount = ret.total_amount;
            }
            pensionIncome += amount;
          } else if (ret.retirement_type === '一時金（退職金など）') {
            // 一時金は開始年齢の年のみ
            if (age === startAge) {
              amount = ret.total_amount || 0;
              lumpSumIncome += amount;
            }
          } else if (ret.retirement_type === 'その他') {
            // その他は開始年齢以降継続
            if (ret.monthly_amount) {
              amount = ret.monthly_amount * 12;
            } else if (ret.total_amount) {
              amount = ret.total_amount;
            }
            otherIncome += amount;
          }
        }
      });
      
      yearIncome = pensionIncome + lumpSumIncome + otherIncome;
      cumulativeIncome += yearIncome;
      
      projection.push({
        year,
        age,
        pensionIncome,
        lumpSumIncome,
        otherIncome,
        totalIncome: yearIncome,
        cumulative: cumulativeIncome
      });
    }
    
    return projection;
  };

  const projection = calculateRetirementProjection();
  const next10Years = projection.slice(0, Math.min(10, projection.length));
  const totalNext10Years = next10Years.reduce((sum, p) => sum + p.totalIncome, 0);
  const totalUntilDeath = projection.reduce((sum, p) => sum + p.totalIncome, 0);
  const peakIncome = Math.max(...projection.map(p => p.totalIncome));
  const peakYear = projection.find(p => p.totalIncome === peakIncome)?.year;
  const allYears = projection;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">【⑧老後資金】</h1>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  retirement_type: '年金',
                  name: '',
                  start_age: '',
                  monthly_amount: '',
                  annual_amount: '',
                  currency: 'JPY',
                  start_date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 老後資金を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての老後資金情報を削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(retirements.map((retirement: Retirement) => 
                    fetch(`http://localhost:8000/api/retirement/${retirement.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchRetirements();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={retirements.length === 0}
            >
              すべて削除
            </button>
            <Link
              href="/chat"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              AIチャット
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* ベース設定 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ベース設定</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                定年年齢
              </label>
              <input
                type="number"
                value={baseSettings.retirement_age}
                onChange={(e) => setBaseSettings({...baseSettings, retirement_age: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 65"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                平均寿命（想定）
              </label>
              <input
                type="number"
                value={baseSettings.life_expectancy}
                onChange={(e) => setBaseSettings({...baseSettings, life_expectancy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在の年齢
              </label>
              <input
                type="number"
                value={baseSettings.current_age}
                onChange={(e) => setBaseSettings({...baseSettings, current_age: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 30"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 老後資金サマリー */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">老後資金サマリー</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">定年後10年間の合計</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalNext10Years.toLocaleString()}円
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">生涯老後収入合計</p>
              <p className="text-2xl font-bold text-green-600">
                {totalUntilDeath.toLocaleString()}円
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">ピーク年収</p>
              <p className="text-2xl font-bold text-purple-600">
                {peakIncome.toLocaleString()}円
              </p>
              <p className="text-xs text-gray-500">{peakYear}年</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">老後期間</p>
              <p className="text-2xl font-bold text-orange-600">
                {projection.length}年
              </p>
              <p className="text-xs text-gray-500">{baseSettings.retirement_age}歳～{baseSettings.life_expectancy}歳</p>
            </div>
          </div>
        </div>

        {/* 老後資金データテーブル */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">登録済み老後資金</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  種類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  年齢
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  月額年金
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  年総額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  備考
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retirements.map((retirement) => (
                <tr key={retirement.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {retirement.retirement_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {retirement.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {retirement.retirement_age ? (
                      retirement.retirement_type === '年金' ? `${retirement.retirement_age}歳～` : `${retirement.retirement_age}歳`
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(retirement.retirement_type === '年金' || retirement.retirement_type === 'その他') && retirement.monthly_amount 
                      ? `${retirement.monthly_amount.toLocaleString()}円/月` 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {retirement.total_amount ? `${retirement.total_amount.toLocaleString()}円` : 
                     (retirement.monthly_amount && (retirement.retirement_type === '年金' || retirement.retirement_type === 'その他') 
                      ? `${(retirement.monthly_amount * 12).toLocaleString()}円` 
                      : '-')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {retirement.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(retirement)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(retirement.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {retirements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    老後資金情報がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* 老後資金推移（全期間） */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">老後資金推移（{baseSettings.retirement_age}歳～{baseSettings.life_expectancy}歳）</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">年</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">年齢</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">年金</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">一時金</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">その他</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">合計収入</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">累計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allYears.map((p) => (
                  <tr key={p.year} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{p.year}</td>
                    <td className="px-4 py-2 text-sm">{p.age}歳</td>
                    <td className="px-4 py-2 text-sm text-right">{p.pensionIncome.toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm text-right text-orange-600 font-semibold">
                      {p.lumpSumIncome > 0 ? `${p.lumpSumIncome.toLocaleString()}円` : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">{p.otherIncome.toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm text-right font-semibold">{p.totalIncome.toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-600">{p.cumulative.toLocaleString()}円</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <PageChat 
            pageContext="retirement"
            onDataUpdated={fetchRetirements}
          />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {editingId ? '老後資金情報を編集' : '老後資金を追加'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種類
                </label>
                <select
                  required
                  value={formData.retirement_type}
                  onChange={(e) => setFormData({...formData, retirement_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="年金">年金</option>
                  <option value="一時金（退職金など）">一時金（退職金など）</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名称
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 厚生年金"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始年齢
                </label>
                <input
                  type="number"
                  value={formData.start_age}
                  onChange={(e) => setFormData({...formData, start_age: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 65"
                  min="55"
                  max="80"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  月額
                </label>
                <input
                  type="number"
                  value={formData.monthly_amount}
                  onChange={(e) => setFormData({...formData, monthly_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 150000"
                />
                {formData.monthly_amount && (
                  <p className="mt-2 text-sm text-gray-600">
                    年総額: {(parseFloat(formData.monthly_amount) * 12).toLocaleString()} 円
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年総額（または一時金）
                </label>
                <input
                  type="number"
                  value={formData.annual_amount}
                  onChange={(e) => setFormData({...formData, annual_amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 1800000"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  補足コメント
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="任意の補足コメント"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData({
                      retirement_type: '年金',
                      name: '',
                      start_age: '',
                      monthly_amount: '',
                      annual_amount: '',
                      currency: 'JPY',
                      start_date: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
