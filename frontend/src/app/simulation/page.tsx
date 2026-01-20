'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AIsuggestions {
  summary: string;
  improvement_points: string[];
  action_items: string[];
  risk_alerts: string[];
}

interface SimulationData {
  years: number[];
  annual_income: number[];
  annual_expense: number[];
  net_cashflow: number[];
  cumulative_assets: number[];
  initial_assets: number;
  current_age: number | null;
  ai_suggestions: AIsuggestions | null;
}

export default function SimulationPage() {
  const router = useRouter();
  const [data, setData] = useState<SimulationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserData(token);
    
    // 保存されたシミュレーション結果を復元
    const savedSimulation = localStorage.getItem('simulation_data');
    if (savedSimulation) {
      try {
        const parsedData = JSON.parse(savedSimulation);
        setData(parsedData);
      } catch (error) {
        console.error('シミュレーションデータの復元エラー:', error);
      }
    }
    
    setIsLoading(false);
  }, [router]);

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

  const handleStartSimulation = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/simulation/cashflow?years=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const simData = await response.json();
        setData(simData);
        // シミュレーション結果をlocalStorageに保存
        localStorage.setItem('simulation_data', JSON.stringify(simData));
      }
    } catch (error) {
      console.error('シミュレーションデータ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSimulationData = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/simulation/cashflow?years=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const simData = await response.json();
        setData(simData);
      }
    } catch (error) {
      console.error('シミュレーションデータ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  const formatChartData = () => {
    if (!data) return [];
    
    return data.years.map((year, index) => ({
      year: data.current_age ? data.current_age + index : year,
      収入: Math.round(data.annual_income[index] / 10000),
      支出: Math.round(data.annual_expense[index] / 10000),
      収支: Math.round(data.net_cashflow[index] / 10000),
      累積資産: Math.round(data.cumulative_assets[index] / 10000),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  const chartData = formatChartData();

  return (
    <div className="bg-yellow-50 min-h-screen flex flex-col">
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
              className="text-yellow-900 border-b-2 border-yellow-900 px-3 py-2 font-semibold"
            >
              シミュレーション
            </Link>
            <Link
              href="/family"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
            >
              家族構成
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">キャッシュフローシミュレーション（50年）</h2>
          <button
            onClick={handleStartSimulation}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
          >
            {isLoading ? 'シミュレーション実行中...' : 'シミュレーション開始'}
          </button>
        </div>

        {!data && !isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-xl text-gray-700 mb-4">
              「シミュレーション開始」ボタンをクリックして、50年間のキャッシュフローシミュレーションを実行してください。
            </p>
            <p className="text-sm text-gray-600">
              ダッシュボードに登録された情報（収入、支出、資産、住宅、教育、キャリア、退職）を元に計算されます。
            </p>
          </div>
        )}

        {/* サマリー */}
        {data && (
          <><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">初期資産</h3>
            <p className="text-3xl font-bold text-blue-600">
              {data ? Math.round(data.initial_assets / 10000).toLocaleString() : 0}万円
            </p>
            {data?.current_age && (
              <p className="text-sm text-gray-500 mt-2">現在 {data.current_age}歳</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">現在の年間収支</h3>
            <p className="text-3xl font-bold text-green-600">
              {data ? Math.round(data.net_cashflow[0] / 10000).toLocaleString() : 0}万円/年
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">50年後の累積資産</h3>
            <p className="text-3xl font-bold text-purple-600">
              {data ? Math.round(data.cumulative_assets[50] / 10000).toLocaleString() : 0}万円
            </p>
            {data?.current_age && (
              <p className="text-sm text-gray-500 mt-2">{data.current_age + 50}歳時点</p>
            )}
          </div>
        </div>

        {/* 年齢別の累積資産推移 */}
        {data?.current_age && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">年齢別の累積資産推移</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[5, 10, 20, 30, 40, 50].map((yearOffset) => {
                const age = data.current_age! + yearOffset;
                const assets = data.cumulative_assets[yearOffset];
                return (
                  <div key={yearOffset} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">{yearOffset}年後</p>
                    <p className="text-lg font-bold text-purple-700 mb-1">{age}歳</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(assets / 10000).toLocaleString()}
                      <span className="text-sm ml-1">万円</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 年間収支グラフ */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">年間収入・支出・収支推移</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: '年齢（歳）', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: '金額（万円）', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="収入" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="支出" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="収支" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 累積資産グラフ */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">累積資産推移</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                label={{ value: '年齢（歳）', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: '累積資産（万円）', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="累積資産" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AIからの改善提案 */}
        {data?.ai_suggestions && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-8 h-8 mr-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AIからの財務アドバイス
            </h3>

            {/* サマリー */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-gray-800 leading-relaxed">{data.ai_suggestions.summary}</p>
            </div>

            {/* 改善ポイント */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                改善ポイント
              </h4>
              <ul className="space-y-2">
                {data.ai_suggestions.improvement_points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-green-100 text-green-700 rounded-full text-center font-semibold mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 次のアクション */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                次のアクション
              </h4>
              <ul className="space-y-2">
                {data.ai_suggestions.action_items.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-center font-semibold mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* リスクアラート */}
            {data.ai_suggestions.risk_alerts.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  注意すべきリスク
                </h4>
                <div className="space-y-2">
                  {data.ai_suggestions.risk_alerts.map((alert, index) => (
                    <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <svg className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-800 leading-relaxed">{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 注記 */}
        {data && (
          <div className="mt-8 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-800">
              <strong>注意：</strong>このシミュレーションは現在の収入・支出データに基づいた簡易的な試算です。
              インフレ率、投資リターン、税金、ライフイベントによる変動は考慮されていません。
            </p>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
