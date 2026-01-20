import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-yellow-50 text-gray-900 font-sans min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="py-4 text-center bg-white shadow-sm">
        <h1 className="text-3xl font-bold text-yellow-900 select-none">
          Wealth Supporter
        </h1>
      </header>

      {/* メインコンテンツ */}
      <main className="flex justify-center items-center flex-grow px-4 py-12">
        <section className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              あなたの資産管理をサポートします
            </h2>
            <p className="text-lg text-gray-700">
              株式、投資信託、不動産など、あらゆる資産を一元管理。<br />
              AIアシスタントがあなたの資産運用をサポートします。
            </p>
          </div>

          {/* カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Link 
              href="/login" 
              className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-semibold text-yellow-900 mb-3">
                ログイン →
              </h3>
              <p className="text-gray-700">
                既存ユーザーの方はこちらからログインしてください
              </p>
            </Link>
            
            <Link 
              href="/register" 
              className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-2xl font-semibold text-yellow-900 mb-3">
                新規登録 →
              </h3>
              <p className="text-gray-700">
                初めての方はこちらから無料でアカウントを作成
              </p>
            </Link>
          </div>

          {/* 機能紹介 */}
          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              主な機能
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  資産の一元管理
                </h4>
                <p className="text-sm text-gray-600">
                  株式、投資信託、不動産など、あらゆる資産を一箇所で管理
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🤖</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  AIアシスタント
                </h4>
                <p className="text-sm text-gray-600">
                  Gemini AIがあなたの資産運用に関する質問に答えます
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📈</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  リアルタイム分析
                </h4>
                <p className="text-sm text-gray-600">
                  資産の推移をグラフで可視化し、投資判断をサポート
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-300 py-4 mt-auto text-center text-sm text-gray-600">
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
