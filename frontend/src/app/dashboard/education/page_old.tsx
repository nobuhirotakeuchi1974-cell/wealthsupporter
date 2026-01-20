'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Education {
  id: number;
  education_type: string;
  child_name: string;
  child_age?: number;
  school_type?: string;
  is_private?: boolean;
  start_year?: number;
  end_year?: number;
  annual_cost?: number;
  amount: number;
  currency: string;
  start_date: string;
  notes?: string;
}

export default function EducationPage() {
  const [educations, setEducations] = useState<Education[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({
    child_name: '',
    birth_year_month: '',
    schools: {
      kindergarten: { attend: 'none', is_private: false },
      elementary: { attend: 'none', is_private: false },
      junior_high: { attend: 'none', is_private: false },
      high_school: { attend: 'none', is_private: false },
      university: { attend: 'none', is_private: false },
      graduate_school: { attend: 'none', is_private: false }
    }
  });

  useEffect(() => {
    fetchUserData();
    fetchEducations();
  }, []);

  // 生年月から年齢を計算
  const calculateAge = (birthYearMonth: string): number => {
    if (!birthYearMonth) return 0;
    const [year, month] = birthYearMonth.split('-').map(Number);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    let age = currentYear - year;
    if (currentMonth < month) {
      age--;
    }
    return age;
  };

  // 学校種別に応じて標準的な入学年齢と修業年限を取得
  const getSchoolAgeAndDuration = (schoolType: string): { startAge: number; duration: number } => {
    const schoolInfo: { [key: string]: { startAge: number; duration: number } } = {
      kindergarten: { startAge: 3, duration: 3 },
      elementary: { startAge: 6, duration: 6 },
      junior_high: { startAge: 12, duration: 3 },
      high_school: { startAge: 15, duration: 3 },
      university: { startAge: 18, duration: 4 },
      graduate_school: { startAge: 22, duration: 2 }
    };
    return schoolInfo[schoolType] || { startAge: 0, duration: 0 };
  };

  // 学校種別の表示名を取得
  const getSchoolName = (schoolType: string): string => {
    const names: { [key: string]: string } = {
      kindergarten: '幼稚園',
      elementary: '小学校',
      junior_high: '中学校',
      high_school: '高校',
      university: '大学',
      graduate_school: '大学院'
    };
    return names[schoolType] || schoolType;
  };

  // 学校の選択状態を更新
  const updateSchoolAttendance = (schoolType: string, attendance: string) => {
    setFormData(prev => ({
      ...prev,
      schools: {
        ...prev.schools,
        [schoolType]: {
          ...prev.schools[schoolType as keyof typeof prev.schools],
          attend: attendance,
          is_private: attendance === 'private'
        }
      }
    }));
  };

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

  const fetchEducations = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/education', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEducations(data);
      }
    } catch (error) {
      console.error('教育情報の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/education/${editingId}`
        : 'http://localhost:8000/api/education';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          education_type: formData.education_type,
          child_name: formData.child_name,
          child_age: formData.child_age ? parseInt(formData.child_age) : null,
          school_type: formData.school_type || null,
          is_private: formData.is_private,
          start_year: formData.start_year ? parseInt(formData.start_year) : null,
          end_year: formData.end_year ? parseInt(formData.end_year) : null,
          annual_cost: formData.annual_cost ? parseFloat(formData.annual_cost) : null,
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
          education_type: '',
          child_name: '',
          child_age: '',
          birth_year_month: '',
          school_type: '',
          is_private: false,
          start_year: new Date().getFullYear().toString(),
          end_year: '',
          annual_cost: '',
          amount: '',
          currency: 'JPY',
          start_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchEducations();
      }
    } catch (error) {
      console.error('教育情報の追加に失敗しました:', error);
    }
  };

  const handleEdit = (education: Education) => {
    setEditingId(education.id);
    setFormData({
      education_type: education.education_type,
      child_name: education.child_name,
      child_age: education.child_age?.toString() || '',
      birth_year_month: '',
      school_type: education.school_type || '',
      is_private: education.is_private || false,
      start_year: education.start_year?.toString() || '',
      end_year: education.end_year?.toString() || '',
      annual_cost: education.annual_cost?.toString() || '',
      amount: education.amount.toString(),
      currency: education.currency,
      start_date: education.start_date,
      notes: education.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      education_type: '',
      child_name: '',
      child_age: '',
      birth_year_month: '',
      school_type: '',
      is_private: false,
      start_year: '',
      end_year: '',
      annual_cost: '',
      amount: '',
      currency: 'JPY',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この教育情報を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/education/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchEducations();
      }
    } catch (error) {
      console.error('教育情報の削除に失敗しました:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">【⑤子供教育】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 教育情報を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての教育データを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(educations.map(education => 
                    fetch(`http://localhost:8000/api/education/${education.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchEducations();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={educations.length === 0}
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
                  子供名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  現在年齢
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  学校種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  公立/私立
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  期間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  年間費用
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
              {educations.map((education) => (
                <tr key={education.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {education.child_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {education.child_age !== null && education.child_age !== undefined ? `${education.child_age}歳` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {education.school_type === 'kindergarten' && '幼稚園'}
                    {education.school_type === 'elementary' && '小学校'}
                    {education.school_type === 'junior_high' && '中学校'}
                    {education.school_type === 'high_school' && '高校'}
                    {education.school_type === 'university' && '大学'}
                    {!education.school_type && '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {education.is_private ? '私立' : '公立'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {education.start_year && education.end_year 
                      ? `${education.start_year}〜${education.end_year}年` 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {education.annual_cost 
                      ? `${education.annual_cost.toLocaleString()}円/年` 
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {education.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(education)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(education.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {educations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    教育データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="子供教育計画" />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingId ? '教育情報を編集' : '教育情報を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    子供の名前
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.child_name}
                    onChange={(e) => setFormData({...formData, child_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 太郎"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生年月
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.birth_year_month}
                    onChange={(e) => handleBirthYearMonthChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 2015-04"
                  />
                  {formData.birth_year_month && (
                    <p className="text-sm text-gray-600 mt-1">
                      現在の年齢: {formData.child_age}歳
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学校種別
                  </label>
                  <select
                    required
                    value={formData.school_type}
                    onChange={(e) => updateSchoolYears(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">選択してください</option>
                    <option value="kindergarten">幼稚園</option>
                    <option value="elementary">小学校</option>
                    <option value="junior_high">中学校</option>
                    <option value="high_school">高校</option>
                    <option value="university">大学</option>
                    <option value="graduate_school">大学院</option>
                  </select>
                  {formData.school_type && formData.start_year && formData.end_year && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.start_year}年 〜 {formData.end_year}年
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.is_private}
                      onChange={(e) => setFormData({...formData, is_private: e.target.checked})}
                      className="mr-2 w-4 h-4"
                    />
                    私立（チェックなし=公立）
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始年
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2050"
                    value={formData.start_year}
                    onChange={(e) => setFormData({...formData, start_year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 2024"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    終了年
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2060"
                    value={formData.end_year}
                    onChange={(e) => setFormData({...formData, end_year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 2030"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年間費用（円）
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.annual_cost}
                  onChange={(e) => setFormData({...formData, annual_cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: 300000"
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
