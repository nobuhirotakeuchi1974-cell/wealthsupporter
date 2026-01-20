'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FamilyMember {
  id: number;
  relationship_type: string;
  name: string | null;
  gender: string;
  birth_date: string;
  school_type: string | null;
  employment_status: string | null;
  notes: string | null;
}

export default function FamilyPage() {
  const router = useRouter();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [username, setUsername] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    relationship_type: '本人',
    name: '',
    gender: '男',
    birth_date: '',
    school_type: 'なし',
    employment_status: 'なし',
    notes: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserData(token);
    fetchFamilyMembers();
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUsername(userData.username);
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/family/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data);
      }
    } catch (error) {
      console.error('家族情報の取得に失敗しました:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingId 
        ? `http://localhost:8000/api/family/${editingId}`
        : 'http://localhost:8000/api/family/';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          birth_date: formData.birth_date + '-01',
          name: formData.name || null,
          school_type: formData.school_type || null,
          employment_status: formData.employment_status || null,
          notes: formData.notes || null
        })
      });
      
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          relationship_type: '本人',
          name: '',
          gender: '男',
          birth_date: '',
          school_type: 'なし',
          employment_status: 'なし',
          notes: ''
        });
        fetchFamilyMembers();
      }
    } catch (error) {
      console.error('家族情報の保存に失敗しました:', error);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setFormData({
      relationship_type: member.relationship_type,
      name: member.name || '',
      gender: member.gender,
      birth_date: member.birth_date.substring(0, 7),
      school_type: member.school_type || 'なし',
      employment_status: member.employment_status || 'なし',
      notes: member.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      relationship_type: '本人',
      name: '',
      gender: '男',
      birth_date: '',
      school_type: 'なし',
      employment_status: 'なし',
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この家族メンバーを削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/family/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchFamilyMembers();
      }
    } catch (error) {
      console.error('削除に失敗しました:', error);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0) {
      age--;
    }
    return age;
  };

  return (
    <div className="bg-yellow-50 min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-yellow-900 cursor-pointer hover:text-yellow-900">Wealth Supporter</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">ようこそ、{username}さん</span>
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
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
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
              className="text-yellow-900 border-b-2 border-yellow-900 px-3 py-2 font-semibold"
            >
              家族構成
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">家族構成</h2>
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
            >
              家族メンバーを追加
            </button>
          </div>

          {familyMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              家族メンバーが登録されていません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      続柄
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      名前
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      性別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      生年月
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      年齢
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      学校種別
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      就業状況
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
                  {familyMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.relationship_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.birth_date.substring(0, 7).replace('-', '年') + '月'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateAge(member.birth_date)}歳
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.school_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.employment_status || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {member.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingId ? '家族メンバーを編集' : '家族メンバーを追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    続柄 <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={formData.relationship_type}
                    onChange={(e) => setFormData({...formData, relationship_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="本人">本人</option>
                    <option value="配偶者">配偶者</option>
                    <option value="子供1">子供1</option>
                    <option value="子供2">子供2</option>
                    <option value="子供3">子供3</option>
                    <option value="子供4">子供4</option>
                    <option value="子供5">子供5</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前（任意）
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 太郎"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性別 <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生年月 <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学校種別
                  </label>
                  <select
                    value={formData.school_type}
                    onChange={(e) => setFormData({...formData, school_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="なし">なし</option>
                    <option value="未就学">未就学</option>
                    <option value="公立">公立</option>
                    <option value="私立">私立</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    就業状況
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({...formData, employment_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="なし">なし</option>
                    <option value="正社員">正社員</option>
                    <option value="自営">自営</option>
                    <option value="パート">パート</option>
                    <option value="専業主婦・主夫">専業主婦・主夫</option>
                    <option value="学生">学生</option>
                  </select>
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
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
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
