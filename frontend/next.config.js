/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境でのリダイレクト設定
  async rewrites() {
    return [
      {
        // /api/* へのリクエストをバックエンドに転送
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
      },
    ]
  },
  // 画像の最適化設定
  images: {
    domains: ['localhost'],
  },
  // 厳格モード有効化（初心者は潜在的なバグを見つけやすい）
  reactStrictMode: true,
}

module.exports = nextConfig
