'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('taro@example.com');
  const [password, setPassword] = useState('password123');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // クライアント側バリデーション
    let valid = true;
    
    if (!email.trim()) {
      setEmailError('メールアドレスは必須です。');
      valid = false;
    } else {
      setEmailError('');
    }
    
    if (!password.trim()) {
      setPasswordError('パスワードは必須です。');
      valid = false;
    } else {
      setPasswordError('');
    }
    
    if (!valid) return;
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'ログインに失敗しました');
      }
      
      const data = await response.json();
      
      // トークンをlocalStorageに保存
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('token_type', data.token_type);
      
      // ダッシュボードへリダイレクト
      router.push('/dashboard');
    } catch (error) {
      console.error('ログインエラー:', error);
      setLoginError(error instanceof Error ? error.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 text-gray-900 font-sans min-h-screen flex flex-col">
      <header className="py-4 text-center bg-white shadow-sm">
        <h1 className="text-3xl font-bold text-yellow-900 select-none">
          Wealth Supporter
        </h1>
      </header>

      <main className="flex justify-center items-center flex-grow px-4 py-12">
        <section className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">
            ログイン
          </h2>

          {loginError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-gray-700 font-semibold mb-2"
              >
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                placeholder="例: user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-colors"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p
                  id="email-error"
                  className="text-red-700 text-sm mt-1"
                  role="alert"
                >
                  {emailError}
                </p>
              )}
            </div>

            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-gray-700 font-semibold mb-2"
              >
                パスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-yellow-500 focus:ring-2 focus:ring-yellow-400 transition-colors"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && (
                <p
                  id="password-error"
                  className="text-red-700 text-sm mt-1"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <div className="mb-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="ログイン"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link
                href="/register"
                className="text-orange-700 font-semibold hover:underline focus:underline"
              >
                新規登録
              </Link>
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-300 py-4 mt-auto text-center text-sm text-gray-600">
        <nav className="space-x-4 inline-flex justify-center">
          <a
            href="#"
            className="text-orange-700 hover:underline focus:underline"
          >
            利用規約
          </a>
          <a
            href="#"
            className="text-orange-700 hover:underline focus:underline"
          >
            プライバシーポリシー
          </a>
          <a
            href="#"
            className="text-orange-700 hover:underline focus:underline"
          >
            ヘルプ・FAQ
          </a>
        </nav>
      </footer>
    </div>
  );
}
