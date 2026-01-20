'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Risk {
  id: number;
  risk_type: string;
  name: string;
  insurance_type?: string;
  coverage_amount?: number;
  monthly_premium?: number;
  coverage_period?: number;
  amount: number;
  currency: string;
  start_date: string;
  notes?: string;
}

export default function RiskPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    risk_type: '',
    name: '',
    insurance_type: '',
    coverage_amount: '',
    monthly_premium: '',
    coverage_period: '',
    amount: '',
    currency: 'JPY',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchRisks();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated' && event.data.context === 'リスク・保険管理') {
        fetchRisks(); // データ再取得
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchRisks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/risk', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRisks(data);
      }
    } catch (error) {
      console.error('リスク情報の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/risk/${editingId}`
        : 'http://localhost:8000/api/risk';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          risk_type: formData.risk_type,
          name: formData.name,
          insurance_type: formData.insurance_type || null,
          coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : null,
          monthly_premium: formData.monthly_premium ? parseFloat(formData.monthly_premium) : null,
          coverage_period: formData.coverage_period ? parseInt(formData.coverage_period) : null,
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
          risk_type: '',
          name: '',
          insurance_type: '',
          coverage_amount: '',
          monthly_premium: '',
          coverage_period: '',
          amount: '',
          currency: 'JPY',
          start_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchRisks();
      }
    } catch (error) {
      console.error('リスク情報の追加に失敗しました:', error);
    }
  };

  const handleEdit = (risk: Risk) => {
    setEditingId(risk.id);
    setFormData({
      risk_type: risk.risk_type,
      name: risk.name,
      insurance_type: risk.insurance_type || '',
      coverage_amount: risk.coverage_amount?.toString() || '',
      monthly_premium: risk.monthly_premium?.toString() || '',
      coverage_period: risk.coverage_period?.toString() || '',
      amount: risk.amount.toString(),
      currency: risk.currency,
      start_date: risk.start_date,
      notes: risk.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      risk_type: '',
      name: '',
      amount: '',
      currency: 'JPY',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このリスク情報を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/risk/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchRisks();
      }
    } catch (error) {
      console.error('リスク情報の削除に失敗しました:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">【⑨リスク･その他】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + リスクを追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべてのリスクデータを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(risks.map(risk => 
                    fetch(`http://localhost:8000/api/risk/${risk.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchRisks();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={risks.length === 0}
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  保険種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  補償額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  月額保険料
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  保障期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  補足
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {risks.map((risk) => (
                <tr key={risk.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.insurance_type || risk.risk_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.coverage_amount ? `${risk.coverage_amount.toLocaleString()}円` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.monthly_premium ? `${risk.monthly_premium.toLocaleString()}円` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {risk.coverage_period ? `${risk.coverage_period}年` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {risk.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(risk)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(risk.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {risks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    リスクデータがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="リスク・保険管理" onDataUpdated={fetchRisks} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingId ? 'リスクを編集' : 'リスクを追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  保険種別
                </label>
                <select
                  required
                  value={formData.insurance_type}
                  onChange={(e) => setFormData({...formData, insurance_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="">選択してください</option>
                  <option value="生命保険">生命保険</option>
                  <option value="医療保険">医療保険</option>
                  <option value="がん保険">がん保険</option>
                  <option value="傷害保険">傷害保険</option>
                  <option value="火災保険">火災保険</option>
                  <option value="地震保険">地震保険</option>
                  <option value="自動車保険">自動車保険</option>
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
                  placeholder="例: ○○生命保険"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    補償額（円）
                  </label>
                  <input
                    type="number"
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData({...formData, coverage_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="10000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    月額保険料（円）
                  </label>
                  <input
                    type="number"
                    value={formData.monthly_premium}
                    onChange={(e) => setFormData({...formData, monthly_premium: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    保障期間（年）
                  </label>
                  <input
                    type="number"
                    value={formData.coverage_period}
                    onChange={(e) => setFormData({...formData, coverage_period: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="20"
                  />
                </div>
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
