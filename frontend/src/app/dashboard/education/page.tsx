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

type SchoolAttendance = 'none' | 'public' | 'private';

interface SchoolSelection {
  attend: SchoolAttendance;
  is_private: boolean;
}

export default function EducationPage() {
  const [educations, setEducations] = useState<Education[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [editingChildName, setEditingChildName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    child_name: '',
    birth_year_month: '',
    schools: {
      nursery: { attend: 'none' as SchoolAttendance, is_private: false },
      kindergarten: { attend: 'none' as SchoolAttendance, is_private: false },
      elementary: { attend: 'none' as SchoolAttendance, is_private: false },
      junior_high: { attend: 'none' as SchoolAttendance, is_private: false },
      high_school: { attend: 'none' as SchoolAttendance, is_private: false },
      university: { attend: 'none' as SchoolAttendance, is_private: false },
      graduate_school: { attend: 'none' as SchoolAttendance, is_private: false }
    }
  });

  useEffect(() => {
    fetchUserData();
    fetchEducations();
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated' && event.data.context === '子供教育計画') {
        fetchEducations(); // データ再取得
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
      nursery: { startAge: 0, duration: 6 },
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
      nursery: '保育園',
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
  const updateSchoolAttendance = (schoolType: string, attendance: SchoolAttendance) => {
    setFormData(prev => ({
      ...prev,
      schools: {
        ...prev.schools,
        [schoolType]: {
          attend: attendance,
          is_private: attendance === 'private'
        }
      }
    }));
  };

  // 費用目安を取得（万円単位）
  const getCostEstimate = (schoolType: string, isPrivate: boolean): string => {
    const costs: { [key: string]: { public: string; private: string } } = {
      nursery: { public: '45万円', private: '80万円' },
      kindergarten: { public: '22万円', private: '53万円' },
      elementary: { public: '32万円', private: '160万円' },
      junior_high: { public: '49万円', private: '141万円' },
      high_school: { public: '46万円', private: '97万円' },
      university: { public: '54万円', private: '135万円' },
      graduate_school: { public: '54万円', private: '115万円' }
    };
    const schoolCosts = costs[schoolType];
    if (!schoolCosts) return '';
    return isPrivate ? schoolCosts.private : schoolCosts.public;
  };

  // 費用を数値に変換（万円単位の文字列を円に変換）
  const parseCostToNumber = (costString: string): number => {
    const match = costString.match(/(\d+)万円/);
    if (match) {
      return parseInt(match[1]) * 10000;
    }
    return 0;
  };

  // 学校段階が未来かどうかを判定
  const isFutureSchool = (education: Education): boolean => {
    const currentYear = new Date().getFullYear();
    // 終了年が現在より先なら未来
    return (education.end_year || 0) >= currentYear;
  };

  // 現在の年齢を計算（学校の開始年と学校種別から逆算）
  const calculateCurrentAge = (education: Education): number | null => {
    if (!education.start_year || !education.school_type) {
      return education.child_age || null;
    }

    const { startAge } = getSchoolAgeAndDuration(education.school_type);
    const birthYear = education.start_year - startAge;
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear;

    return currentAge >= 0 ? currentAge : null;
  };

  // 学校種別ごとの総額を計算（未来のもののみ、残りの年数で計算）
  const calculateTotalCost = (education: Education): number => {
    if (!isFutureSchool(education)) return 0;
    if (!education.annual_cost || !education.start_year || !education.end_year) return 0;
    
    const currentYear = new Date().getFullYear();
    
    // まだ始まっていない（開始年が未来）
    if (education.start_year > currentYear) {
      const totalYears = education.end_year - education.start_year + 1;
      return education.annual_cost * totalYears;
    }
    
    // 既に始まっている（開始年が過去または現在）
    const remainingYears = Math.max(0, education.end_year - currentYear + 1);
    return education.annual_cost * remainingYears;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.child_name || !formData.birth_year_month) {
      alert('子供の名前と生年月を入力してください');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const [birthYear] = formData.birth_year_month.split('-').map(Number);
      const age = calculateAge(formData.birth_year_month);

      // 編集モードの場合、既存データをすべて削除
      if (editingChildName) {
        const childEducations = educations.filter(edu => edu.child_name === editingChildName);
        await Promise.all(childEducations.map(edu => 
          fetch(`http://localhost:8000/api/education/${edu.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ));
      }

      // 各学校段階ごとにデータを作成
      const schoolTypes = ['nursery', 'kindergarten', 'elementary', 'junior_high', 'high_school', 'university', 'graduate_school'];
      
      for (const schoolType of schoolTypes) {
        const schoolData = formData.schools[schoolType as keyof typeof formData.schools];
        
        // 「行かない」が選択されている場合はスキップ
        if (schoolData.attend === 'none') continue;

        const { startAge, duration } = getSchoolAgeAndDuration(schoolType);
        const startYear = birthYear + startAge;
        const endYear = startYear + duration - 1;
        const isPrivate = schoolData.attend === 'private';
        
        // 年間費用を計算
        const costEstimate = getCostEstimate(schoolType, isPrivate);
        const annualCost = parseCostToNumber(costEstimate);

        await fetch('http://localhost:8000/api/education', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            education_type: 'planned',
            child_name: formData.child_name,
            child_age: age,
            school_type: schoolType,
            is_private: isPrivate,
            start_year: startYear,
            end_year: endYear,
            annual_cost: annualCost,
            amount: annualCost * duration,
            currency: 'JPY',
            start_date: new Date().toISOString().split('T')[0],
            notes: null
          })
        });
      }

      setShowModal(false);
      setEditingChildName(null);
      setFormData({
        child_name: '',
        birth_year_month: '',
        schools: {
          nursery: { attend: 'none', is_private: false },
          kindergarten: { attend: 'none', is_private: false },
          elementary: { attend: 'none', is_private: false },
          junior_high: { attend: 'none', is_private: false },
          high_school: { attend: 'none', is_private: false },
          university: { attend: 'none', is_private: false },
          graduate_school: { attend: 'none', is_private: false }
        }
      });
      fetchEducations();
    } catch (error) {
      console.error('教育情報の追加に失敗しました:', error);
    }
  };

  const handleAdd = () => {
    setEditingChildName(null);
    setFormData({
      child_name: '',
      birth_year_month: '',
      schools: {
        nursery: { attend: 'none', is_private: false },
        kindergarten: { attend: 'none', is_private: false },
        elementary: { attend: 'none', is_private: false },
        junior_high: { attend: 'none', is_private: false },
        high_school: { attend: 'none', is_private: false },
        university: { attend: 'none', is_private: false },
        graduate_school: { attend: 'none', is_private: false }
      }
    });
    setShowModal(true);
  };

  const handleEdit = (childName: string) => {
    // 同じ子供名のすべてのデータを取得
    const childEducations = educations.filter(edu => edu.child_name === childName);
    if (childEducations.length === 0) return;

    // 生年月を逆算（保存されている場合は取得できないので、年齢から推定）
    const firstEdu = childEducations[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const birthYear = currentYear - (firstEdu.child_age || 0);
    const birthYearMonth = `${birthYear}-${String(currentMonth).padStart(2, '0')}`;

    // 各学校の選択状況を復元
    const schools: any = {
      nursery: { attend: 'none', is_private: false },
      kindergarten: { attend: 'none', is_private: false },
      elementary: { attend: 'none', is_private: false },
      junior_high: { attend: 'none', is_private: false },
      high_school: { attend: 'none', is_private: false },
      university: { attend: 'none', is_private: false },
      graduate_school: { attend: 'none', is_private: false }
    };

    childEducations.forEach(edu => {
      if (edu.school_type) {
        schools[edu.school_type] = {
          attend: edu.is_private ? 'private' : 'public',
          is_private: edu.is_private || false
        };
      }
    });

    setEditingChildName(childName);
    setFormData({
      child_name: childName,
      birth_year_month: birthYearMonth,
      schools: schools
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

  // 未来の教育費総額を計算
  const totalEducationCost = educations.reduce((sum, edu) => {
    return sum + calculateTotalCost(edu);
  }, 0);

  // 子供ごとの教育費を計算
  const educationCostByChild = educations.reduce((acc, edu) => {
    const childName = edu.child_name;
    if (!acc[childName]) {
      acc[childName] = 0;
    }
    acc[childName] += calculateTotalCost(edu);
    return acc;
  }, {} as { [key: string]: number });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">【⑥子供教育費】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + 子供を追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべての教育データを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(educations.map(edu => 
                    fetch(`http://localhost:8000/api/education/${edu.id}`, {
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

        {/* 教育費総額サマリー */}
        {educations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">未来の教育費総額</h2>
            
            {/* 子供ごとの内訳 */}
            <div className="space-y-3 mb-4">
              {Object.entries(educationCostByChild).map(([childName, cost]) => (
                cost > 0 && (
                  <div key={childName} className="flex justify-between items-center bg-gray-50 p-4 rounded">
                    <span className="font-medium text-gray-700">{childName}</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {cost.toLocaleString()}円
                    </span>
                  </div>
                )
              ))}
            </div>

            {/* 総合計 */}
            <div className="border-t pt-4">
              <div className="bg-blue-50 p-6 rounded">
                <p className="text-sm text-gray-600 mb-2">これから必要な教育費の合計</p>
                <p className="text-4xl font-bold text-blue-600">
                  {totalEducationCost.toLocaleString()}円
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
                  子供の名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  現在の年齢
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
                  総額
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
                    {(() => {
                      const currentAge = calculateCurrentAge(education);
                      return currentAge !== null ? `${currentAge}歳` : '-';
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getSchoolName(education.school_type || '')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={education.is_private ? 'text-red-600' : 'text-blue-600'}>
                      {education.is_private ? '私立' : '公立'}
                    </span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {(() => {
                      const total = calculateTotalCost(education);
                      return total > 0 ? `${total.toLocaleString()}円` : '-';
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {education.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(education.child_name)}
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
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    教育データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="子供教育計画" onDataUpdated={fetchEducations} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingChildName ? '子供の教育計画を編集' : '子供の教育計画を追加'}</h2>
            <form onSubmit={handleSubmit}>
              {/* 子供の基本情報 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    子供の名前 <span className="text-red-500">*</span>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生年月 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={formData.birth_year_month}
                    onChange={(e) => setFormData({...formData, birth_year_month: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 2015-04"
                  />
                  {formData.birth_year_month && (
                    <p className="text-sm text-gray-600 mt-1">
                      現在の年齢: {calculateAge(formData.birth_year_month)}歳
                    </p>
                  )}
                </div>
              </div>

              {/* 学校選択 */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">各学校段階の進学予定</h3>
                <div className="space-y-4">
                  {[
                    { key: 'nursery', label: '保育園' },
                    { key: 'kindergarten', label: '幼稚園' },
                    { key: 'elementary', label: '小学校' },
                    { key: 'junior_high', label: '中学校' },
                    { key: 'high_school', label: '高校' },
                    { key: 'university', label: '大学' },
                    { key: 'graduate_school', label: '大学院' }
                  ].map((school) => {
                    const schoolData = formData.schools[school.key as keyof typeof formData.schools];
                    const { startAge, duration } = getSchoolAgeAndDuration(school.key);
                    const [birthYear] = formData.birth_year_month ? formData.birth_year_month.split('-').map(Number) : [0];
                    const startYear = birthYear + startAge;
                    const endYear = startYear + duration - 1;

                    return (
                      <div key={school.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                        <div className="w-24 font-medium text-gray-700">{school.label}</div>
                        <div className="flex gap-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`school_${school.key}`}
                              checked={schoolData.attend === 'none'}
                              onChange={() => updateSchoolAttendance(school.key, 'none')}
                              className="mr-2"
                            />
                            行かない
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`school_${school.key}`}
                              checked={schoolData.attend === 'public'}
                              onChange={() => updateSchoolAttendance(school.key, 'public')}
                              className="mr-2"
                            />
                            公立
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`school_${school.key}`}
                              checked={schoolData.attend === 'private'}
                              onChange={() => updateSchoolAttendance(school.key, 'private')}
                              className="mr-2"
                            />
                            私立
                          </label>
                        </div>
                        {formData.birth_year_month && schoolData.attend !== 'none' && (
                          <div className="text-sm text-gray-600 ml-auto">
                            <div>{startYear}年〜{endYear}年</div>
                            <div className="text-xs text-blue-600 mt-1">
                              目安: {getCostEstimate(school.key, schoolData.attend === 'private')}/年
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
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
                  {editingChildName ? '更新' : '追加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
