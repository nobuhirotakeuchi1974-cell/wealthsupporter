'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Liability {
  id: number;
  asset_type: string;
  name: string;
  amount: number;
  currency: string;
  purchase_date: string;
  notes?: string;
}

export default function LiabilityPage() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    asset_type: 'ローン',
    name: '',
    amount: '',
    currency: 'JPY',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchLiabilities();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated') {
        fetchLiabilities(); // データ再取得
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchLiabilities = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/assets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // 負債のみフィルタリング（マイナス金額）
        setLiabilities(data.filter((item: Liability) => item.amount < 0));
      }
    } catch (error) {
      console.error('負債の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/assets/${editingId}`
        : 'http://localhost:8000/api/assets';
      const method = editingId ? 'PUT' : 'POST';
      
      // 負債は自動的にマイナスにする
      let amount = parseFloat(formData.amount);
      if (amount > 0) {
        amount = -amount;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_type: formData.asset_type,
          name: formData.name,
          amount: amount,
          currency: formData.currency,
          notes: formData.notes || null
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          asset_type: 'ローン',
          name: '',
          amount: '',
          currency: 'JPY',
          purchase_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchLiabilities();
      } else {
        const errorData = await response.json();
        console.error('更新エラー:', errorData);
        alert(`更新に失敗しました: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('負債の追加に失敗しました:', error);
      alert(`エラーが発生しました: ${error}`);
    }
  };

  const handleEdit = (liability: Liability) => {
    setEditingId(liability.id);
    // 編集時は絶対値で表示
    setFormData({
      asset_type: liability.asset_type,
      name: liability.name,
      amount: Math.abs(liability.amount).toString(),
      currency: liability.currency,
      purchase_date: liability.purchase_date,
      notes: liability.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      asset_type: 'ローン',
      name: '',
      amount: '',
      currency: 'JPY',
      purchase_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この負債を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchLiabilities();
      }
    } catch (error) {
      console.error('負債の削除に失敗しました:', error);
    }
  };

  // 合計金額を計算（絶対値）
  const totalAmount = Math.abs(liabilities.reduce((sum, liability) => sum + liability.amount, 0));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">【④負債】</h1>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              負債合計：<span className="text-red-600">{totalAmount.toLocaleString()} JPY</span>
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 負債を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての負債を削除しますか？')) return;
                const token = localStorage.getItem('access_token');
                for (const liability of liabilities) {
                  await fetch(`http://localhost:8000/api/assets/${liability.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                }
                fetchLiabilities();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={liabilities.length === 0}
            >
              すべて削除
            </button>
            <Link              href="/chat"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              AIチャット
            </Link>
            <Link              href="/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  負債タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  金額
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
              {liabilities.map((liability) => (
                <tr key={liability.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {liability.asset_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {liability.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {Math.abs(liability.amount).toLocaleString()} {liability.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {liability.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(liability)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(liability.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {liabilities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    負債データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="現在の負債状況" onDataUpdated={fetchLiabilities} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '負債を編集' : '負債を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  負債タイプ
                </label>
                <select
                  required
                  value={formData.asset_type}
                  onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="ローン">ローン</option>
                  <option value="借金">借金</option>
                  <option value="その他負債">その他負債</option>
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
                  placeholder="住宅ローン"
                />
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
                  placeholder="30000000"
                />
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
                  <option value="EUR">EUR</option>
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
                  placeholder="メモや補足情報"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
