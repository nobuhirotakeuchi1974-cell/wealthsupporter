'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Expense {
  id: number;
  expense_type: string;
  occurrence_type?: string;
  category: string;
  amount: number;
  currency: string;
  expense_date: string;
  notes?: string;
}

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    expense_type: '生活費',
    occurrence_type: '12',
    category: '',
    amount: '',
    currency: 'JPY',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated' && event.data.context === '現在の支出状況') {
        fetchExpenses(); // データ再取得
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/expense', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('支出の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/expense/${editingId}`
        : 'http://localhost:8000/api/expense';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expense_type: formData.expense_type,
          occurrence_type: formData.occurrence_type,
          category: formData.category,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          expense_date: formData.expense_date,
          notes: formData.notes || null
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          expense_type: '生活費',
          occurrence_type: '12',
          category: '',
          amount: '',
          currency: 'JPY',
          expense_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchExpenses();
      } else {
        const errorData = await response.json();
        console.error('エラーレスポンス:', errorData);
        alert(`保存に失敗しました: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('支出の追加に失敗しました:', error);
      alert('支出の追加に失敗しました');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      expense_type: expense.expense_type,
      occurrence_type: expense.occurrence_type || '12',
      category: expense.category,
      amount: expense.amount.toString(),
      currency: expense.currency,
      expense_date: expense.expense_date,
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      expense_type: '生活費',
      occurrence_type: '12',
      category: '',
      amount: '',
      currency: 'JPY',
      expense_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この支出を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/expense/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error('支出の削除に失敗しました:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">【②支出】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 支出を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての支出データを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(expenses.map(expense => 
                    fetch(`http://localhost:8000/api/expense/${expense.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchExpenses();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={expenses.length === 0}
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
        
        {/* 総年支出表示 */}
        <div className="mb-6 text-lg font-semibold text-gray-700">
          総年支出: <span className="text-red-600">{expenses.reduce((total, expense) => {
            const frequency = parseInt(expense.occurrence_type || '1');
            return total + (expense.amount * frequency);
          }, 0).toLocaleString()} JPY</span>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  支出タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  頻度（年）
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  年支出
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
              {expenses.map((expense) => {
                const frequency = parseInt(expense.occurrence_type || '1');
                const annualExpense = expense.amount * frequency;
                return (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.expense_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.occurrence_type || '1'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {expense.amount.toLocaleString()} {expense.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    {annualExpense.toLocaleString()} {expense.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              )})}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    支出データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="現在の支出状況" onDataUpdated={fetchExpenses} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '支出を編集' : '支出を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支出タイプ
                </label>
                <select
                  required
                  value={formData.expense_type}
                  onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="生活費">生活費</option>
                  <option value="住居費">住居費</option>
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
                  placeholder="例: 50000"
                />
                {formData.amount && formData.occurrence_type && (
                  <p className="mt-2 text-sm text-gray-600">
                    年支出: {(parseFloat(formData.amount) * parseInt(formData.occurrence_type)).toLocaleString()} {formData.currency}
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
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
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
