'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: number;
  message: string;
  response: string;
  created_at: string;
}

interface ChatDisplay {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: ChatDisplay[];
  savedAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [messages, setMessages] = useState<ChatDisplay[]>([
    {
      type: 'ai',
      content: 'こんにちは！今日はどのようなご相談でしょうか？',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // チャット履歴を読み込む
    const savedHistories = localStorage.getItem('chatHistories');
    if (savedHistories) {
      setChatHistories(JSON.parse(savedHistories));
    }

    // 現在のチャットを読み込む
    const savedCurrentChat = localStorage.getItem('currentChat');
    if (savedCurrentChat) {
      const chatData = JSON.parse(savedCurrentChat);
      setMessages(chatData.messages);
      setCurrentChatId(chatData.id);
    } else {
      // 新しいチャットIDを生成
      setCurrentChatId(Date.now().toString());
    }

    // ユーザー情報を取得
    fetchUserData(token);
  }, [router]);

  useEffect(() => {
    // 現在のチャットをlocalStorageに保存
    if (currentChatId) {
      localStorage.setItem('currentChat', JSON.stringify({
        id: currentChatId,
        messages: messages
      }));
    }
  }, [messages, currentChatId]);

  useEffect(() => {
    // 新しいメッセージが追加されたら最下部にスクロール
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

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
      setUsername(userData.username);
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      localStorage.removeItem('access_token');
      router.push('/login');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // テキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // ユーザーメッセージを追加
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('チャット送信エラー');
      }

      const data = await response.json();
      
      // AIの応答を追加
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: data.response,
          timestamp: data.created_at,
        },
      ]);
      
      // タブ間通信でデータ更新を通知
      const channel = new BroadcastChannel('data-updates');
      channel.postMessage({ type: 'dataUpdated', timestamp: Date.now() });
      channel.close();
      
    } catch (error) {
      console.error('チャットエラー:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    router.push('/login');
  };

  const handleNewChat = () => {
    // 現在のチャットにメッセージがある場合、確認ダイアログを表示
    if (messages.length > 1) {
      const userChoice = window.confirm(
        '現在のチャットを保存しますか？\n\nOK: 保存する\nキャンセル: 削除する'
      );
      
      if (userChoice) {
        // 保存を選択した場合
        handleSaveChat();
      }
    }
    
    // 新しいチャットを開始
    setMessages([
      {
        type: 'ai',
        content: 'こんにちは！今日はどのようなご相談でしょうか？',
        timestamp: new Date().toISOString(),
      },
    ]);
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    localStorage.setItem('currentChat', JSON.stringify({
      id: newChatId,
      messages: [{
        type: 'ai',
        content: 'こんにちは！今日はどのようなご相談でしょうか？',
        timestamp: new Date().toISOString(),
      }]
    }));
  };

  const handleSaveChat = () => {
    if (messages.length <= 1) {
      alert('保存するメッセージがありません');
      return;
    }

    // チャットのタイトルを最初のユーザーメッセージから生成
    const firstUserMessage = messages.find(m => m.type === 'user');
    const title = firstUserMessage 
      ? firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '')
      : '新しいチャット';

    const newHistory: ChatHistory = {
      id: currentChatId,
      title: title,
      messages: messages,
      savedAt: new Date().toISOString()
    };

    const updatedHistories = [newHistory, ...chatHistories.filter(h => h.id !== currentChatId)];
    setChatHistories(updatedHistories);
    localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
  };

  const loadChatHistory = (history: ChatHistory) => {
    setMessages(history.messages);
    setCurrentChatId(history.id);
    localStorage.setItem('currentChat', JSON.stringify({
      id: history.id,
      messages: history.messages
    }));
  };

  const deleteChatHistory = (historyId: string) => {
    if (!confirm('この履歴を削除しますか？')) return;
    
    const updatedHistories = chatHistories.filter(h => h.id !== historyId);
    setChatHistories(updatedHistories);
    localStorage.setItem('chatHistories', JSON.stringify(updatedHistories));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // 自動的に高さを調整
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 240; // 約10行分（24px * 10）
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enterで送信（Enterのみで改行）
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleDeleteCurrentChat = () => {
    if (messages.length <= 1) {
      alert('削除するメッセージがありません');
      return;
    }

    if (!confirm('現在のチャットを削除しますか？')) return;

    // 新しいチャットを開始
    setMessages([
      {
        type: 'ai',
        content: 'こんにちは！今日はどのようなご相談でしょうか？',
        timestamp: new Date().toISOString(),
      },
    ]);
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    localStorage.setItem('currentChat', JSON.stringify({
      id: newChatId,
      messages: [{
        type: 'ai',
        content: 'こんにちは！今日はどのようなご相談でしょうか？',
        timestamp: new Date().toISOString(),
      }]
    }));
  };

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
              className="text-yellow-900 border-b-2 border-yellow-900 px-3 py-2 font-semibold"
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
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <section className="flex h-full p-6">
            <div className="flex-1 flex flex-col mr-4">
              {/* ボタングループ */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={handleNewChat}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                >
                  新しいチャット
                </button>
                <button
                  onClick={handleDeleteCurrentChat}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                >
                  現在のチャットを削除
                </button>
                <button
                  onClick={handleSaveChat}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                  保存
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold inline-flex items-center"
                >
                  ダッシュボードに戻る
                </Link>
              </div>

              {/* 推奨サジェストメッセージ */}
              <div className="mb-4 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded shadow">
                <p className="text-sm mb-2 text-red-600 font-bold">
                  先に、【①収入】【②支出】【③資産･負債】【④家賃･住宅ローン】【⑤教育】【⑥キャリア設計】【⑦リスク･その他】に関する情報を入力して下さい。
                </p>
                <p className="text-sm">
                  こんな質問をしてみましょう:
                  <strong>「住宅購入のベストタイミングは？」</strong>,
                  <strong>「将来の収支バランスを教えて」</strong>,
                  <strong>「教育費はどう計画すべき？」</strong>
                </p>
              </div>

              {/* チャットログ表示 */}
              <div
                ref={chatLogRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg shadow-sm border border-yellow-200"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#ffbf24 #fff7d6',
                }}
              >
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 max-w-[80%] ${
                      msg.type === 'ai'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-yellow-100 border border-yellow-300 self-end ml-auto text-right'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-[80%]">
                    <p className="text-gray-500">AI が考え中...</p>
                  </div>
                )}
              </div>

              {/* 入力フォーム */}
              <form
                onSubmit={handleSubmit}
                className="mt-4 flex bg-white rounded-lg shadow-sm border border-yellow-300 overflow-hidden"
              >
                <label htmlFor="chat-input" className="sr-only">
                  メッセージ入力
                </label>
                <textarea
                  ref={textareaRef}
                  id="chat-input"
                  required
                  placeholder="メッセージを入力してください（Shift+Enterで送信）"
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 p-3 focus:outline-yellow-400 focus:ring-2 focus:ring-yellow-400 border-none disabled:bg-gray-100 resize-none overflow-y-auto"
                  style={{ minHeight: '48px', maxHeight: '240px' }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-5 font-bold transition-colors self-end"
                >
                  <i className="fas fa-paper-plane"></i> 送信
                </button>
              </form>
            </div>

            {/* チャット履歴サイドバー */}
            <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-y-auto">
              <h2 className="text-lg font-bold mb-4 text-gray-800">チャット履歴</h2>
              {chatHistories.length === 0 ? (
                <p className="text-gray-500 text-sm">保存された履歴はありません</p>
              ) : (
                <div className="space-y-2">
                  {chatHistories.map((history) => (
                    <div
                      key={history.id}
                      className={`p-3 rounded border cursor-pointer hover:bg-yellow-50 ${
                        history.id === currentChatId ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div onClick={() => loadChatHistory(history)}>
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {history.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(history.savedAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatHistory(history.id);
                        }}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-300 py-4 text-center text-sm text-gray-600">
        <nav className="space-x-4 flex justify-center">
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

      {/* Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
      />
    </div>
  );
}
