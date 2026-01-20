'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Income {
  id: number;
  income_type: string;
  occurrence_type?: string;
  amount: number;
  currency: string;
  start_date: string;
  notes?: string;
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    income_type: '月収',
    occurrence_type: '月収',
    amount: '',
    currency: 'JPY',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchIncomes();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      console.log('[Income] Received broadcast:', event.data);
      if (event.data.type === 'data-updated' && event.data.context === '現在の収入状況') {
        console.log('[Income] Context matched, fetching data...');
        fetchIncomes(); // データ再取得
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchIncomes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/income', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setIncomes(data);
      }
    } catch (error) {
      console.error('収入情報の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/income/${editingId}`
        : 'http://localhost:8000/api/income';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          income_type: formData.income_type,
          occurrence_type: formData.occurrence_type,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          start_date: formData.start_date,
          notes: formData.notes || null
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          income_type: '給与',
          occurrence_type: '12',
          amount: '',
          currency: 'JPY',
          start_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchIncomes();
      } else {
        const errorData = await response.json();
        console.error('エラーレスポンス:', errorData);
        alert(`保存に失敗しました: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('収入の追加に失敗しました:', error);
      alert('収入の追加に失敗しました');
    }
  };

  const handleEdit = (income: Income) => {
    setEditingId(income.id);
    setFormData({
      income_type: income.income_type,
      occurrence_type: income.occurrence_type || '定期',
      amount: income.amount.toString(),
      currency: income.currency,
      start_date: income.start_date,
      notes: income.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      income_type: '給与',
      occurrence_type: '12',
      amount: '',
      currency: 'JPY',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この収入を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/income/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchIncomes();
      }
    } catch (error) {
      console.error('収入の削除に失敗しました:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">【①収入】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 収入を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての収入データを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(incomes.map(income => 
                    fetch(`http://localhost:8000/api/income/${income.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchIncomes();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={incomes.length === 0}
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
        
        {/* 総年収表示 */}
        <div className="mb-6 text-lg font-semibold text-gray-700">
          総年収入: <span className="text-green-600">{incomes.reduce((total, income) => {
            const frequency = parseInt(income.occurrence_type || '1');
            return total + (income.amount * frequency);
          }, 0).toLocaleString()} JPY</span>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  収入タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  頻度（年）
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  年収入
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  補足コメント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incomes.map((income) => {
                const frequency = parseInt(income.occurrence_type || '1');
                const annualIncome = income.amount * frequency;
                return (
                <tr key={income.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {income.income_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {income.occurrence_type || '1'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {income.amount.toLocaleString()} {income.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {annualIncome.toLocaleString()} {income.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {income.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(income)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              )})}
              {incomes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    収入データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="現在の収入状況" onDataUpdated={fetchIncomes} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '収入を編集' : '収入を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  収入タイプ
                </label>
                <select
                  required
                  value={formData.income_type}
                  onChange={(e) => setFormData({...formData, income_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="給与">給与</option>
                  <option value="ボーナス">ボーナス</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  頻度（年回数）
                </label>
                <select
                  required
                  value={formData.occurrence_type}
                  onChange={(e) => setFormData({...formData, occurrence_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="1">年1回</option>
                  <option value="2">年2回</option>
                  <option value="3">年3回</option>
                  <option value="4">年4回</option>
                  <option value="5">年5回</option>
                  <option value="6">年6回</option>
                  <option value="7">年7回</option>
                  <option value="8">年8回</option>
                  <option value="9">年9回</option>
                  <option value="10">年10回</option>
                  <option value="11">年11回</option>
                  <option value="12">毎月（年12回）</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金額
                </label>
                <input
                  type="text"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 300000"
                />
                {formData.amount && formData.occurrence_type && (
                  <p className="mt-2 text-sm text-gray-600">
                    年収入: {(parseFloat(formData.amount) * parseInt(formData.occurrence_type)).toLocaleString()} {formData.currency}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通貨
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="JPY">JPY</option>
                  <option value="USD">USD</option>
                </select>
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
                  onClick={() => setShowModal(false)}
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
