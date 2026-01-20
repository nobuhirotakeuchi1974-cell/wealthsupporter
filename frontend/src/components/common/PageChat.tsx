'use client';

import { useState } from 'react';

interface PageChatProps {
  pageContext: string; // 例: "収入管理", "支出管理"
  onDataUpdated?: () => void; // データ更新時のコールバック
}

export default function PageChat({ pageContext, onDataUpdated }: PageChatProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `${pageContext}ページに関する質問: ${chatInput}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.response || data.message || 'AIから応答がありました');
        
        // データが更新された場合、親コンポーネントに通知
        if (data.data_updated || data.response?.includes('登録しました') || data.response?.includes('追加しました')) {
          // BroadcastChannelで同じpageContextのみに通知
          const channel = new BroadcastChannel('data-updates');
          channel.postMessage({ type: 'data-updated', context: pageContext });
          channel.close();
          
          // 親コンポーネントのコールバックを呼び出す
          if (onDataUpdated) {
            setTimeout(() => {
              onDataUpdated();
            }, 500); // 少し遅延させてバックエンドの処理完了を待つ
          }
        }
        
        // 入力欄をクリア
        setChatInput('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || 'エラー: AIからの応答を取得できませんでした';
        
        if (errorMessage.includes('利用上限') || response.status === 429) {
          setChatResponse('⚠️ AIサービスの利用上限に達しています。数分後に再度お試しください。\n\nヒント: メインの「AIチャット」ページからも同様の質問ができます。');
        } else {
          setChatResponse(`エラー: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('チャットエラー:', error);
      setChatResponse('エラー: 接続に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        AI アシスタント
      </h3>
      
      <form onSubmit={handleChatSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`${pageContext}についてお聞かせください...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !chatInput.trim()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : '送信'}
          </button>
        </div>
      </form>

      {chatResponse && (
        <div className={`rounded-lg p-4 border ${chatResponse.includes('⚠️') || chatResponse.includes('エラー') ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
          <p className="text-sm font-medium text-gray-600 mb-2">AI からの回答:</p>
          <p className="text-gray-800 whitespace-pre-wrap">{chatResponse}</p>
        </div>
      )}
    </div>
  );
}
