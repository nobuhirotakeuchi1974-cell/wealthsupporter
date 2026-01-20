'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [termsAgree, setTermsAgree] = useState(false);
  
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [termsError, setTermsError] = useState('');
  const [registerError, setRegisterError] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    let valid = true;
    
    if (!username.trim()) {
      setUsernameError('ユーザー名は必須です。');
      valid = false;
    } else {
      setUsernameError('');
    }
    
    if (!email.trim()) {
      setEmailError('メールアドレスは必須です。');
      valid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('パスワードは必須です。');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください。');
      valid = false;
    } else {
      setPasswordError('');
    }
    
    if (!passwordConfirm) {
      setPasswordConfirmError('パスワード確認は必須です。');
      valid = false;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError('パスワードが一致しません。');
      valid = false;
    } else {
      setPasswordConfirmError('');
    }
    
    if (!termsAgree) {
      setTermsError('利用規約とプライバシーポリシーに同意してください。');
      valid = false;
    } else {
      setTermsError('');
    }
    
    if (!valid) return;
    
    setIsLoading(true);
    setRegisterError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '登録に失敗しました');
      }
      
      // 登録成功後、自動ログイン
      const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!loginResponse.ok) {
        throw new Error('登録は成功しましたが、自動ログインに失敗しました');
      }
      
      const loginData = await loginResponse.json();
      
      // トークンを保存
      localStorage.setItem('access_token', loginData.access_token);
      localStorage.setItem('token_type', loginData.token_type);
      
      // ダッシュボードへリダイレクト
      router.push('/dashboard');
    } catch (error) {
      console.error('登録エラー:', error);
      setRegisterError(error instanceof Error ? error.message : '登録に失敗しました');
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
          <h2 className="text-2xl font-semibold mb-6">ユーザー登録</h2>
          
          <p className="text-sm text-gray-700 mb-4">
            メールアドレスとパスワードを入力し、<br />
            プライバシーポリシーと利用規約に同意のうえ登録してください。
          </p>

          {registerError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {registerError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ユーザー名 */}
            <div>
              <label
                htmlFor="username"
                className="block mb-1 font-medium text-gray-800"
              >
                ユーザー名 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="例: 太郎"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 transition"
                aria-invalid={!!usernameError}
                aria-describedby={usernameError ? 'username-error' : undefined}
              />
              {usernameError && (
                <p id="username-error" className="mt-1 text-sm text-red-600" role="alert">
                  {usernameError}
                </p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label
                htmlFor="email"
                className="block mb-1 font-medium text-gray-800"
              >
                メールアドレス <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 transition"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            {/* パスワード */}
            <div>
              <label
                htmlFor="password"
                className="block mb-1 font-medium text-gray-800"
              >
                パスワード <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                required
                placeholder="8文字以上のパスワード"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 transition"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && (
                <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            {/* パスワード確認 */}
            <div>
              <label
                htmlFor="password-confirm"
                className="block mb-1 font-medium text-gray-800"
              >
                パスワード確認 <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                id="password-confirm"
                name="password-confirm"
                autoComplete="new-password"
                required
                placeholder="パスワードと同じ文字を入力"
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 transition"
                aria-invalid={!!passwordConfirmError}
                aria-describedby={passwordConfirmError ? 'password-confirm-error' : undefined}
              />
              {passwordConfirmError && (
                <p id="password-confirm-error" className="mt-1 text-sm text-red-600" role="alert">
                  {passwordConfirmError}
                </p>
              )}
            </div>

            {/* 同意チェックボックス */}
            <div>
              <div className="flex items-start space-x-3">
                <input
                  id="terms-agree"
                  name="terms-agree"
                  type="checkbox"
                  required
                  checked={termsAgree}
                  onChange={(e) => setTermsAgree(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border border-gray-400 focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 transition"
                  aria-invalid={!!termsError}
                  aria-describedby={termsError ? 'terms-error' : undefined}
                />
                <label htmlFor="terms-agree" className="text-gray-800 leading-relaxed select-none">
                  プライバシーポリシーおよび利用規約に同意します
                  <span className="text-red-600">*</span>
                </label>
              </div>
              {termsError && (
                <p id="terms-error" className="mt-1 text-sm text-red-600" role="alert">
                  {termsError}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2">
                <a href="#" className="text-orange-700 hover:underline">
                  プライバシーポリシー
                </a>
                ・
                <a href="#" className="text-orange-700 hover:underline">
                  利用規約
                </a>
                を必ずご確認ください。
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '登録中...' : '登録'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700">
            すでにアカウントをお持ちですか？　
            <Link
              href="/login"
              className="text-orange-700 font-semibold hover:underline focus:underline"
            >
              ログインはこちら
            </Link>
          </p>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-300 py-4 text-center text-sm text-gray-600">
        <nav className="space-x-4">
          <a href="#" className="text-orange-700 hover:underline">
            利用規約
          </a>
          <a href="#" className="text-orange-700 hover:underline">
            プライバシーポリシー
          </a>
          <a href="#" className="text-orange-700 hover:underline">
            ヘルプ・FAQ
          </a>
        </nav>
      </footer>
    </div>
  );
}
