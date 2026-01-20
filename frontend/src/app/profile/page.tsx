'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  username: string;
}

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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // ユーザー名編集
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  
  // パスワード変更
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 家族構成
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);
  const [familyFormData, setFamilyFormData] = useState({
    relationship_type: '本人',
    name: '',
    gender: '男',
    birth_date: '',
    school_type: 'なし',
    employment_status: 'なし',
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserData(token);
  }, [router]);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('認証エラー');
      }

      const userData = await response.json();
      setUser(userData);
      setNewUsername(userData.username);
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      localStorage.removeItem('access_token');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('ユーザー名は必須です');
      return;
    }

    setIsUpdatingUsername(true);
    setUsernameError('');

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ユーザー名の更新に失敗しました');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditingUsername(false);
    } catch (error) {
      console.error('ユーザー名更新エラー:', error);
      setUsernameError(error instanceof Error ? error.message : 'ユーザー名の更新に失敗しました');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('全てのフィールドを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('新しいパスワードは8文字以上で入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }

    setIsUpdatingPassword(true);

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'パスワードの変更に失敗しました');
      }

      setPasswordSuccess('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('パスワード変更エラー:', error);
      setPasswordError(error instanceof Error ? error.message : 'パスワードの変更に失敗しました');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 min-h-screen">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-3xl font-bold text-yellow-900 cursor-pointer hover:text-yellow-900">Wealth Supporter</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">ようこそ、{user?.username}さん</span>
            <Link
              href="/profile"
              className="text-yellow-900 px-3 py-2 font-semibold border-b-2 border-yellow-900"
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
              className="text-gray-600 hover:text-gray-900 px-3 py-2 font-semibold"
            >
              家族構成
            </Link>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">プロフィール設定</h2>

          {/* ユーザー情報 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-yellow-700 border-b border-yellow-300 pb-2 mb-4">
              基本情報
            </h3>

            {/* メールアドレス */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                メールアドレス
              </label>
              <div className="px-4 py-3 bg-gray-100 rounded-md text-gray-600">
                {user?.email}
              </div>
              <p className="text-sm text-gray-500 mt-1">メールアドレスは変更できません</p>
            </div>

            {/* ユーザー名 */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                ユーザー名
              </label>
              {isEditingUsername ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  />
                  {usernameError && (
                    <p className="text-sm text-red-600">{usernameError}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateUsername}
                      disabled={isUpdatingUsername}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUpdatingUsername ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(user?.username || '');
                        setUsernameError('');
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="px-4 py-3 bg-gray-100 rounded-md text-gray-900 flex-1">
                    {user?.username}
                  </div>
                  <button
                    onClick={() => setIsEditingUsername(true)}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                  >
                    編集
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* パスワード変更 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-yellow-700 border-b border-yellow-300 pb-2 mb-4">
              パスワード変更
            </h3>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-gray-700 font-medium mb-2">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  placeholder="現在のパスワードを入力"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-gray-700 font-medium mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  placeholder="8文字以上のパスワード"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-gray-700 font-medium mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400"
                  placeholder="新しいパスワードを再入力"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? 'パスワード変更中...' : 'パスワードを変更'}
              </button>
            </form>
          </div>

          {/* アカウント情報 */}
          <div>
            <h3 className="text-lg font-semibold text-yellow-700 border-b border-yellow-300 pb-2 mb-4">
              アカウント情報
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>ユーザーID: {user?.id}</p>
              <p>登録日: 2026年1月14日</p>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-300 py-4 mt-12 text-center text-sm text-gray-600">
        <nav className="space-x-4">
          <a href="#" className="text-orange-700 hover:underline">利用規約</a>
          <a href="#" className="text-orange-700 hover:underline">プライバシーポリシー</a>
          <a href="#" className="text-orange-700 hover:underline">ヘルプ・FAQ</a>
        </nav>
      </footer>
    </div>
  );
}
