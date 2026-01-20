'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Asset {
  id: number;
  asset_type: string;
  name: string;
  amount: number;
  currency: string;
  purchase_date: string;
  notes?: string;
}

export default function AssetPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    asset_type: '株式',
    name: '',
    amount: '',
    currency: 'JPY',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const assetTypeOptions = [
    { value: '株式', label: '株式' },
    { value: '債券', label: '債券' },
    { value: '投資信託', label: '投資信託' },
    { value: '預金', label: '預金' },
    { value: '不動産', label: '不動産' },
    { value: 'その他資産', label: 'その他資産' },
    { value: 'ローン', label: 'ローン' },
    { value: '借金', label: '借金' },
    { value: 'クレジットカード', label: 'クレジットカード' },
    { value: 'その他負債', label: 'その他負債' }
  ];

  useEffect(() => {
    fetchAssets();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated' && event.data.context === '現在の資産状況') {
        fetchAssets(); // データ再取得
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchAssets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/assets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // 資産のみフィルタリング（プラス金額）
        setAssets(data.filter((item: Asset) => item.amount >= 0));
      }
    } catch (error) {
      console.error('資産の取得に失敗しました:', error);
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
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset_type: formData.asset_type,
          name: formData.name,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          notes: formData.notes || null
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          asset_type: '株式',
          name: '',
          amount: '',
          currency: 'JPY',
          purchase_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchAssets();
      } else {
        const errorData = await response.json();
        console.error('更新エラー:', errorData);
        alert(`更新に失敗しました: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('資産の追加に失敗しました:', error);
      alert(`エラーが発生しました: ${error}`);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setFormData({
      asset_type: asset.asset_type,
      name: asset.name,
      amount: asset.amount.toString(),
      currency: asset.currency,
      purchase_date: asset.purchase_date,
      notes: asset.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      asset_type: '株式',
      name: '',
      amount: '',
      currency: 'JPY',
      purchase_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この資産を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/assets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchAssets();
      }
    } catch (error) {
      console.error('資産の削除に失敗しました:', error);
    }
  };

  // 合計金額を計算
  const totalAmount = assets.reduce((sum, asset) => sum + asset.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">【③資産】</h1>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              資産合計：<span className="text-green-600">{totalAmount.toLocaleString()} JPY</span>
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 資産を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての資産データを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(assets.map(asset => 
                    fetch(`http://localhost:8000/api/assets/${asset.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchAssets();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={assets.length === 0}
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
                  資産タイプ
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
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {asset.asset_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asset.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={asset.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {asset.amount.toLocaleString()} {asset.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {asset.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    資産データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="現在の資産状況" onDataUpdated={fetchAssets} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '資産を編集' : '資産を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  資産タイプ
                </label>
                <select
                  required
                  value={formData.asset_type}
                  onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <optgroup label="資産">
                    <option value="株式">株式</option>
                    <option value="預金">預金</option>
                    <option value="不動産">不動産</option>
                    <option value="投資信託">投資信託</option>
                    <option value="債券">債券</option>
                    <option value="暗号資産">暗号資産</option>
                    <option value="その他資産">その他資産</option>
                  </optgroup>
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
                  placeholder="トヨタ株、ビットコイン"
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
                  placeholder="例：500000"
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
