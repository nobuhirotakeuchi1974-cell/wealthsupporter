// 認証フック
// 初心者向け解説：ログイン状態を管理するカスタムフックです
// なぜフックを作るのか：複数のコンポーネントで同じロジックを再利用できる

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import type { User, LoginRequest } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 初回マウント時にユーザー情報を取得
  // 注目ポイント：useEffect はコンポーネントが表示された時に1回実行される
  useEffect(() => {
    checkAuth()
  }, [])

  // ログイン状態チェック
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }

      // トークンがあれば、ユーザー情報を取得
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch (error) {
      // エラーならトークンを削除
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }

  // ログイン処理
  // 注目ポイント：成功したらトークンを保存してダッシュボードへ
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials)
      
      // トークンを保存
      localStorage.setItem('access_token', response.access_token)
      
      // ユーザー情報を状態に保存
      setUser(response.user)
      
      // ダッシュボードへ遷移
      router.push('/dashboard')
      
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'ログインに失敗しました',
      }
    }
  }

  // ログアウト処理
  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    router.push('/login')
  }

  // 新規登録処理
  const register = async (data: { email: string; username: string; password: string }) => {
    try {
      await authApi.register(data)
      
      // 登録成功後、自動ログイン
      return await login({ email: data.email, password: data.password })
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || '登録に失敗しました',
      }
    }
  }

  return {
    user,        // 現在のユーザー情報
    loading,     // 読み込み中かどうか
    login,       // ログイン関数
    logout,      // ログアウト関数
    register,    // 新規登録関数
    isAuthenticated: !!user,  // ログイン済みかどうか
  }
}
