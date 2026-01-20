// TypeScript型定義ファイル
// 初心者向け解説：アプリ全体で使う「データの形」を定義します

// ユーザー情報の型
export interface User {
  id: number
  email: string
  username: string
  created_at: string
  updated_at: string
}

// ログインリクエストの型
export interface LoginRequest {
  email: string
  password: string
}

// ログインレスポンスの型
export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// 資産情報の型
export interface Asset {
  id: number
  user_id: number
  asset_type: string  // "stock", "savings", "real_estate" など
  name: string
  amount: number
  currency: string
  purchase_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// チャットメッセージの型
export interface ChatMessage {
  id: number
  user_id: number
  message: string
  response: string
  created_at: string
}

// API エラーレスポンスの型
export interface ApiError {
  detail: string
}
