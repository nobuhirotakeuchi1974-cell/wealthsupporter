'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface House {
  id: number;
  house_type: string;
  name: string;
  amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  // 未来計画用フィールド
  timeline?: string;
  purchase_year?: number;
  loan_term?: number;
  loan_rate?: number;
  down_payment?: number;
}

export default function HousePage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    house_type: '',
    name: '',
    amount: '',
    currency: 'JPY',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    // 未来計画用フィールド
    purchase_year: new Date().getFullYear().toString(),
    loan_term: '',
    loan_rate: '',
    down_payment: ''
  });

  useEffect(() => {
    fetchHouses();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated' && event.data.context === '住宅購入計画') {
        fetchHouses(); // データ再取得
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchHouses = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/house', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHouses(data);
      }
    } catch (error) {
      console.error('家情報の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/house/${editingId}`
        : 'http://localhost:8000/api/house';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          house_type: formData.house_type,
          name: formData.name,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          notes: formData.notes || null,
          timeline: 'future',
          purchase_year: formData.purchase_year ? parseInt(formData.purchase_year) : null,
          loan_term: formData.loan_term ? parseInt(formData.loan_term) : null,
          loan_rate: formData.loan_rate ? parseFloat(formData.loan_rate) : null,
          down_payment: formData.down_payment ? parseFloat(formData.down_payment) : null
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          house_type: '',
          name: '',
          amount: '',
          currency: 'JPY',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          notes: '',
          purchase_year: '',
          loan_term: '',
          loan_rate: '',
          down_payment: ''
        });
        fetchHouses();
      }
    } catch (error) {
      console.error('家情報の追加に失敗しました:', error);
    }
  };

  const handleEdit = (house: House) => {
    setEditingId(house.id);
    setFormData({
      house_type: house.house_type,
      name: house.name,
      amount: house.amount.toString(),
      currency: house.currency,
      start_date: house.start_date,
      end_date: house.end_date || '',
      notes: house.notes || '',
      purchase_year: house.purchase_year?.toString() || '',
      loan_term: house.loan_term?.toString() || '',
      loan_rate: house.loan_rate?.toString() || '',
      down_payment: house.down_payment?.toString() || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      house_type: '',
      name: '',
      amount: '',
      currency: 'JPY',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
      purchase_year: '',
      loan_term: '',
      loan_rate: '',
      down_payment: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この家情報を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/house/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchHouses();
      }
    } catch (error) {
      console.error('家情報の削除に失敗しました:', error);
    }
  };

  // 元利均等返済の計算
  const calculateLoan = (house: House) => {
    if (!house.amount || !house.loan_term || !house.loan_rate) {
      return null;
    }

    const propertyPrice = house.amount;
    const downPayment = house.down_payment || 0;
    const loanAmount = propertyPrice - downPayment; // 借入額
    const annualRate = house.loan_rate / 100; // 年利（小数）
    const monthlyRate = annualRate / 12; // 月利
    const totalMonths = house.loan_term * 12; // 総返済回数

    // 月々の返済額（元利均等返済）
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const annualPayment = monthlyPayment * 12; // 年間支払額
    const totalPayment = monthlyPayment * totalMonths; // 返済総額

    return {
      monthlyPayment: Math.round(monthlyPayment),
      annualPayment: Math.round(annualPayment),
      totalPayment: Math.round(totalPayment),
      loanAmount: loanAmount
    };
  };

  // すべての住宅ローンの計算結果
  const loanSummary = houses.reduce(
    (acc, house) => {
      const calc = calculateLoan(house);
      if (calc) {
        acc.totalMonthly += calc.monthlyPayment;
        acc.totalAnnual += calc.annualPayment;
        acc.totalPayment += calc.totalPayment;
      }
      return acc;
    },
    { totalMonthly: 0, totalAnnual: 0, totalPayment: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">【⑤住宅購入費】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 家を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての家データを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(houses.map(house => 
                    fetch(`http://localhost:8000/api/house/${house.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchHouses();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={houses.length === 0}
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

        {/* ローン計算サマリー */}
        {houses.length > 0 && loanSummary.totalMonthly > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">住宅ローン返済額</h2>
              <div className="text-sm text-gray-600">
                <span className="mr-4">元利均等返済</span>
                <span className="mr-4">固定金利</span>
                <span>ボーナス返済（無）</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">月々の返済額</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loanSummary.totalMonthly.toLocaleString()}円
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">年間の支払い総額</p>
                <p className="text-2xl font-bold text-green-600">
                  {loanSummary.totalAnnual.toLocaleString()}円
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600 mb-1">返済総額（全期間）</p>
                <p className="text-2xl font-bold text-purple-600">
                  {loanSummary.totalPayment.toLocaleString()}円
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  購入予定年
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  物件価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  頭金
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ローン期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  金利
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  月々返済額
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
              {houses.map((house) => (
                <tr key={house.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.house_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.purchase_year ? `${house.purchase_year}年` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.amount.toLocaleString()}円
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.down_payment ? `${house.down_payment.toLocaleString()}円` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.loan_term ? `${house.loan_term}年` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {house.loan_rate ? `${house.loan_rate}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {(() => {
                      const calc = calculateLoan(house);
                      return calc ? `${calc.monthlyPayment.toLocaleString()}円` : '-';
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {house.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(house)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(house.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {houses.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                    家データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="住宅購入計画" onDataUpdated={fetchHouses} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '住宅購入計画を編集' : '住宅購入計画を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイプ
                  </label>
                  <select
                    required
                    value={formData.house_type}
                    onChange={(e) => setFormData({...formData, house_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">選択してください</option>
                    <option value="新築マンション">新築マンション</option>
                    <option value="中古マンション">中古マンション</option>
                    <option value="新築戸建て">新築戸建て</option>
                    <option value="中古戸建て">中古戸建て</option>
                    <option value="土地購入">土地購入</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    物件名称
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: ○○マンション"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    購入予定年
                  </label>
                  <input
                    type="number"
                    required
                    min="2024"
                    max="2050"
                    value={formData.purchase_year}
                    onChange={(e) => setFormData({...formData, purchase_year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 2027"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    物件価格（円）
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 50000000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    頭金（円）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.down_payment}
                    onChange={(e) => setFormData({...formData, down_payment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 10000000"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ローン期間（年）
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.loan_term}
                    onChange={(e) => setFormData({...formData, loan_term: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 35"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  金利（%）
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.loan_rate}
                  onChange={(e) => setFormData({...formData, loan_rate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 1.5"
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
