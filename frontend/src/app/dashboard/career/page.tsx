'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageChat from '@/components/common/PageChat';

interface Career {
  id: number;
  career_type: string;
  description: string;
  expected_income: number;
  currency: string;
  start_date: string;
  notes?: string;
  // 未来計画用フィールド
  timeline?: string;
  event_year?: number;
  salary_increase_rate?: number;
}

interface Income {
  id: number;
  income_type: string;
  occurrence_type?: string;
  amount: number;
  currency: string;
  start_date: string;
  notes?: string;
}

export default function CareerPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [baseSettings, setBaseSettings] = useState({
    current_income: '5000000',
    base_increase_rate: '2',
    retirement_age: '65',
    current_age: '30'
  });
  const [formData, setFormData] = useState({
    career_type: '',
    description: '',
    expected_income: '',
    currency: 'JPY',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
    event_year: new Date().getFullYear().toString(),
    salary_increase_rate: ''
  });

  useEffect(() => {
    fetchCareers();
    fetchIncomes();
    fetchUserAge();
    // ベース設定をlocalStorageから読み込み
    const savedSettings = localStorage.getItem('careerBaseSettings');
    if (savedSettings) {
      setBaseSettings(JSON.parse(savedSettings));
    }
    
    // BroadcastChannelでデータ更新を監視
    const channel = new BroadcastChannel('data-updates');
    channel.onmessage = (event) => {
      if (event.data.type === 'data-updated' && event.data.context === 'キャリア設計') {
        fetchCareers(); // データ再取得
        fetchIncomes();
      }
    };
    
    return () => {
      channel.close();
    };
  }, []);

  const fetchUserAge = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/family', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const familyData = await response.json();
        // 本人の情報を探す
        const self = familyData.find((member: any) => 
          member.relationship_type === '本人' || 
          member.relationship_type === 'self' ||
          member.relationship_type === '自分'
        );
        if (self && self.birth_date) {
          const birthDate = new Date(self.birth_date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          setBaseSettings(prev => ({ ...prev, current_age: age.toString() }));
        }
      }
    } catch (error) {
      console.error('家族情報の取得に失敗:', error);
    }
  };

  useEffect(() => {
    // ベース設定をlocalStorageに保存
    localStorage.setItem('careerBaseSettings', JSON.stringify(baseSettings));
  }, [baseSettings]);

  const fetchCareers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/career', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCareers(data);
      }
    } catch (error) {
      console.error('キャリア情報の取得に失敗しました:', error);
    }
  };

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
        ? `http://localhost:8000/api/career/${editingId}`
        : 'http://localhost:8000/api/career';
      const method = editingId ? 'PUT' : 'POST';
      
      console.log(`キャリア${editingId ? '更新' : '追加'}リクエスト:`, {
        url,
        method,
        data: {
          career_type: formData.career_type,
          description: formData.description,
          expected_income: formData.expected_income ? parseFloat(formData.expected_income.toString().replace(/,/g, '')) : null,
          currency: formData.currency,
          target_date: formData.start_date || null,
          notes: formData.notes || null,
          timeline: 'future',
          event_year: formData.event_year ? parseInt(formData.event_year) : null,
          salary_increase_rate: formData.salary_increase_rate ? parseFloat(formData.salary_increase_rate.toString().replace(/,/g, '')) : null
        }
      });
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          career_type: formData.career_type,
          description: formData.description,
          expected_income: formData.expected_income ? parseFloat(formData.expected_income.toString().replace(/,/g, '')) : null,
          currency: formData.currency,
          target_date: formData.start_date || null,
          notes: formData.notes || null,
          timeline: 'future',
          event_year: formData.event_year ? parseInt(formData.event_year) : null,
          salary_increase_rate: formData.salary_increase_rate ? parseFloat(formData.salary_increase_rate.toString().replace(/,/g, '')) : null
        })
      });
      
      console.log('レスポンスステータス:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('レスポンスデータ:', result);
        
        setShowModal(false);
        setEditingId(null);
        setFormData({
          career_type: '',
          description: '',
          expected_income: '',
          currency: 'JPY',
          start_date: new Date().toISOString().split('T')[0],
          notes: '',
          event_year: new Date().getFullYear().toString(),
          salary_increase_rate: ''
        });
        
        // データを再取得
        await fetchCareers();
        console.log('キャリアデータを再取得完了');
      } else {
        const errorData = await response.json();
        console.error('エラーレスポンス:', errorData);
        alert('更新に失敗しました: ' + (errorData.detail || 'エラーが発生しました'));
      }
    } catch (error) {
      console.error('キャリア情報の追加/更新に失敗しました:', error);
      alert('エラーが発生しました: ' + error);
    }
  };

  const handleEdit = (career: Career) => {
    setEditingId(career.id);
    setFormData({
      career_type: career.career_type,
      description: career.description,
      expected_income: career.expected_income.toString(),
      currency: career.currency,
      start_date: career.start_date,
      notes: career.notes || '',
      event_year: career.event_year?.toString() || new Date().getFullYear().toString(),
      salary_increase_rate: career.salary_increase_rate?.toString() || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      career_type: '',
      description: '',
      expected_income: '',
      currency: 'JPY',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
      event_year: new Date().getFullYear().toString(),
      salary_increase_rate: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このキャリア情報を削除しますか？')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/career/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchCareers();
      }
    } catch (error) {
      console.error('キャリア情報の削除に失敗しました:', error);
    }
  };

  // 年収推移を計算
  const calculateIncomeProjection = (sideJobIncome: number) => {
    const currentYear = new Date().getFullYear();
    const currentIncome = parseFloat(baseSettings.current_income.replace(/,/g, '')) || 0;
    const baseRate = parseFloat(baseSettings.base_increase_rate) || 0;
    const retirementAge = parseInt(baseSettings.retirement_age) || 65;
    const currentAge = parseInt(baseSettings.current_age) || 30;
    const retirementYear = currentYear + (retirementAge - currentAge);
    
    // イベントを年でソート
    const sortedEvents = [...careers]
      .filter(c => c.event_year)
      .sort((a, b) => (a.event_year || 0) - (b.event_year || 0));
    
    const projection = [];
    let cumulativeIncome = 0;
    let cumulativeTotalIncome = 0;
    
    for (let year = currentYear; year <= retirementYear; year++) {
      // その年のイベントを探す
      const event = sortedEvents.find(e => e.event_year === year);
      
      let yearIncome;
      let changeRate = '';
      let eventName = '';
      
      if (year === currentYear) {
        yearIncome = currentIncome;
        eventName = '(現在)';
      } else if (event) {
        yearIncome = event.expected_income || 0;
        const prevYearIncome = projection[projection.length - 1].income;
        changeRate = prevYearIncome > 0 ? `${((yearIncome - prevYearIncome) / prevYearIncome * 100).toFixed(1)}%` : '';
        eventName = event.career_type;
      } else {
        // 前年の収入と昇給率を取得
        const prevYear = projection[projection.length - 1];
        const applicableRate = getApplicableRate(year, sortedEvents, baseRate);
        yearIncome = prevYear.income * (1 + applicableRate / 100);
        changeRate = `+${applicableRate}%`;
      }
      
      const totalIncome = yearIncome + sideJobIncome;
      cumulativeIncome += yearIncome;
      cumulativeTotalIncome += totalIncome;
      
      projection.push({
        year,
        age: currentAge + (year - currentYear),
        income: yearIncome,
        sideJobIncome: sideJobIncome,
        totalIncome: totalIncome,
        changeRate,
        event: eventName,
        cumulative: cumulativeIncome,
        cumulativeTotal: cumulativeTotalIncome
      });
    }
    
    return projection;
  };

  // その年に適用される昇給率を取得
  const getApplicableRate = (year: number, events: Career[], baseRate: number): number => {
    // その年より前の最新イベントを探す
    const prevEvents = events.filter(e => e.event_year && e.event_year < year);
    if (prevEvents.length === 0) return baseRate;
    
    const latestEvent = prevEvents[prevEvents.length - 1];
    // salary_increase_rateが設定されている場合（0を含む）はそれを使用、未設定の場合はbaseRateを使用
    return latestEvent.salary_increase_rate !== null && latestEvent.salary_increase_rate !== undefined 
      ? latestEvent.salary_increase_rate 
      : baseRate;
  };

  // 副業収入を計算（年収換算）
  // ⑦の見込み収入は、キャリアページの副業開始イベントのみを使用
  const calculateSideJobIncome = () => {
    console.log('=== 副業収入計算開始 ===');
    console.log('全キャリアデータ:', careers);
    
    let totalAnnualIncome = 0;
    
    // キャリアページから副業開始イベントを取得（現在または過去のイベントのみ）
    const currentYear = new Date().getFullYear();
    const sideJobsFromCareer = careers.filter(career => 
      (career.career_type === '副業開始' || 
       career.career_type === '副業' ||
       career.career_type.includes('副業')) &&
      (!career.event_year || career.event_year <= currentYear)
    );
    
    console.log('キャリアページの副業データ:', sideJobsFromCareer);
    
    sideJobsFromCareer.forEach(job => {
      console.log(`キャリア処理中: ${job.career_type}, 予想収入: ${job.expected_income}`);
      if (job.expected_income) {
        totalAnnualIncome += job.expected_income;
      }
    });
    
    console.log('副業年収合計（キャリアページのみ）:', totalAnnualIncome);
    console.log('===================');
    
    return totalAnnualIncome;
  };

  const sideJobAnnualIncome = calculateSideJobIncome();
  const projection = calculateIncomeProjection(sideJobAnnualIncome);
  const next10Years = projection.slice(0, Math.min(10, projection.length));
  const totalNext10Years = next10Years.reduce((sum, p) => sum + p.totalIncome, 0);
  const totalUntilRetirement = projection.reduce((sum, p) => sum + p.totalIncome, 0);
  const peakIncome = Math.max(...projection.map(p => p.totalIncome));
  const peakYear = projection.find(p => p.totalIncome === peakIncome)?.year;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">【⑦収入見込】</h1>
          <div className="flex gap-4">
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + キャリアを追加
            </button>
            <button
              onClick={async () => {
                if (!confirm('すべてのキャリアデータを削除しますか？この操作は取り消せません。')) return;
                try {
                  const token = localStorage.getItem('access_token');
                  await Promise.all(careers.map(career => 
                    fetch(`http://localhost:8000/api/career/${career.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                  ));
                  fetchCareers();
                } catch (error) {
                  console.error('削除エラー:', error);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              disabled={careers.length === 0}
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

        {/* ベース設定 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ベース設定</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在の年収（円）
              </label>
              <input
                type="number"
                value={baseSettings.current_income}
                onChange={(e) => setBaseSettings({...baseSettings, current_income: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 5000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                基本昇給率（%/年）
              </label>
              <input
                type="number"
                step="0.1"
                value={baseSettings.base_increase_rate}
                onChange={(e) => setBaseSettings({...baseSettings, base_increase_rate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                定年年齢
              </label>
              <input
                type="number"
                value={baseSettings.retirement_age}
                onChange={(e) => setBaseSettings({...baseSettings, retirement_age: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 65"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在の年齢
              </label>
              <input
                type="number"
                value={baseSettings.current_age}
                onChange={(e) => setBaseSettings({...baseSettings, current_age: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="例: 30"
              />
            </div>
          </div>
        </div>

        {/* 累計収入概要 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-200">
            <div className="text-sm text-gray-600 mb-1">今後10年間の累計収入</div>
            <div className="text-3xl font-bold text-blue-600">
              {(totalNext10Years / 10000).toFixed(0)}万円
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border-2 border-green-200">
            <div className="text-sm text-gray-600 mb-1">定年までの累計収入</div>
            <div className="text-3xl font-bold text-green-600">
              {(totalUntilRetirement / 100000000).toFixed(1)}億円
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-6 border-2 border-purple-200">
            <div className="text-sm text-gray-600 mb-1">ピーク年収</div>
            <div className="text-3xl font-bold text-purple-600">
              {(peakIncome / 10000).toFixed(0)}万円
            </div>
            <div className="text-xs text-gray-500 mt-1">({peakYear}年)</div>
          </div>
        </div>

        {/* キャリアイベント一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-bold text-gray-800">キャリアイベント</h2>
          </div>
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  イベントタイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  予定年
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  予想収入
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  副業年収
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  昇給率
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
              {careers.map((career) => (
                <tr key={career.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {career.career_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {career.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {career.event_year ? `${career.event_year}年` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {career.expected_income !== null ? `${career.expected_income.toLocaleString()}円` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {sideJobAnnualIncome > 0 ? `${sideJobAnnualIncome.toLocaleString()}円` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {career.salary_increase_rate !== null && career.salary_increase_rate !== undefined ? `${career.salary_increase_rate}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {career.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(career)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(career.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {careers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    キャリアデータがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 年収推移シミュレーション */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-bold text-gray-800">年収推移シミュレーション</h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    年度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    年齢
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    年収
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    昇給率
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    副業収入
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    総年収
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    イベント
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    累計収入
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projection.map((p, index) => (
                  <tr key={p.year} className={p.event && p.event !== '(現在)' ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {p.year}年
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                      {p.age}歳
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {(p.income / 10000).toFixed(0)}万円
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                      {p.changeRate || '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {p.sideJobIncome > 0 ? `${(p.sideJobIncome / 10000).toFixed(0)}万円` : '-'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-bold text-purple-600">
                      {(p.totalIncome / 10000).toFixed(0)}万円
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {p.event && p.event !== '(現在)' ? (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium">
                          {p.event}
                        </span>
                      ) : (
                        <span className="text-gray-400">{p.event || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                      {(p.cumulativeTotal / 10000).toFixed(0)}万円
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI チャット */}
        <PageChat pageContext="キャリア設計" onDataUpdated={() => { fetchCareers(); fetchIncomes(); }} />
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingId ? 'キャリア設計を編集' : 'キャリア設計を追加'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    イベントタイプ
                  </label>
                  <select
                    required
                    value={formData.career_type}
                    onChange={(e) => setFormData({...formData, career_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">選択してください</option>
                    <option value="転職">転職</option>
                    <option value="昇進">昇進</option>
                    <option value="減給">減給</option>
                    <option value="副業開始">副業開始</option>
                    <option value="独立・起業">独立・起業</option>
                    <option value="定年退職">定年退職</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    予定年
                  </label>
                  <input
                    type="number"
                    required
                    min="2024"
                    max="2070"
                    value={formData.event_year}
                    onChange={(e) => setFormData({...formData, event_year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 2028"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="例: ○○社に転職、部長に昇進"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    予想収入（年収、円）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.expected_income}
                    onChange={(e) => setFormData({...formData, expected_income: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 7000000"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    昇給率（%）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-50"
                    max="100"
                    value={formData.salary_increase_rate}
                    onChange={(e) => setFormData({...formData, salary_increase_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="例: 10（10%アップ）"
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
