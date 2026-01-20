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
  const [formData, setFormData] = useState({
    retirement_type: '年金',
    name: '',
    retirement_age: '',
    monthly_amount: '',
    total_amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchUserData();
    fetchRetirements();

    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated') {
        fetchRetirements(); // データ再取得
      }
    };

    return () => {
      channel.close();
    };
  }, []);

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
      
      console.log('Submitting retirement data:', {
        retirement_type: formData.retirement_type,
        name: formData.name,
        retirement_age: formData.retirement_age ? parseInt(formData.retirement_age) : null,
        monthly_amount: formData.monthly_amount ? parseFloat(formData.monthly_amount) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        notes: formData.notes || null
      });
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          retirement_type: formData.retirement_type,
          name: formData.name,
          retirement_age: formData.retirement_age ? parseInt(formData.retirement_age) : null,
          monthly_amount: formData.monthly_amount ? parseFloat(formData.monthly_amount) : null,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
          notes: formData.notes || null
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        alert(`エラー: ${response.status} - ${errorText}`);
        return;
      }
      
      const result = await response.json();
      console.log('Success:', result);
      
      setShowModal(false);
      setEditingId(null);
      setFormData({
        retirement_type: '年金',
        name: '',
        retirement_age: '',
        monthly_amount: '',
        total_amount: '',
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
      retirement_age: retirement.retirement_age ? retirement.retirement_age.toString() : '',
      monthly_amount: retirement.monthly_amount ? retirement.monthly_amount.toString() : '',
      total_amount: retirement.total_amount ? retirement.total_amount.toString() : '',
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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

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
                  retirement_age: '',
                  monthly_amount: '',
                  total_amount: '',
                  notes: ''
                });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 新規追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての老後情報を削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(retirements.map(retirement => 
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
                  総額
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
                    {retirement.retirement_type === '年金' && retirement.monthly_amount 
                      ? `${retirement.monthly_amount.toLocaleString()}円/月` 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {retirement.total_amount ? `${retirement.total_amount.toLocaleString()}円` : '-'}
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

        {/* AI チャット */}
        <PageChat pageContext="老後資金" onDataUpdated={fetchRetirements} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '老後情報を編集' : '老後情報を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  種類 <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.retirement_type}
                  onChange={(e) => setFormData({...formData, retirement_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="年金">年金</option>
                  <option value="退職金">退職金</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder={formData.retirement_type === '年金' ? '例: 厚生年金' : formData.retirement_type === '退職金' ? '例: 会社退職金' : '例: iDeCo'}
                />
              </div>

              {/* 年金の場合 */}
              {formData.retirement_type === '年金' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      支給開始年齢 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.retirement_age}
                      onChange={(e) => setFormData({...formData, retirement_age: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="65"
                      min="55"
                      max="80"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月額年金 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.monthly_amount}
                      onChange={(e) => setFormData({...formData, monthly_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="150000"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      総額（見込）
                    </label>
                    <input
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="30000000"
                    />
                  </div>
                </>
              )}

              {/* 退職金の場合 */}
              {formData.retirement_type === '退職金' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      退職年齢 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.retirement_age}
                      onChange={(e) => setFormData({...formData, retirement_age: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="60"
                      min="50"
                      max="70"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      総額 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.total_amount}
                      onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="20000000"
                    />
                  </div>
                </>
              )}

              {/* その他の場合 */}
              {formData.retirement_type === 'その他' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    総額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.total_amount}
                    onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="5000000"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備考
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="補足情報があれば記入してください"
                ></textarea>
              </div>
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
