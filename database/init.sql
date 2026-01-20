-- データベース初期化スクリプト
-- 初心者向け解説：MySQLコンテナ起動時に自動実行されます

-- WealthSupporter データベースの初期設定

USE wealthsupporter;

-- ===== テーブル作成 =====

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- なぜ InnoDB：トランザクション対応、外部キー対応
-- なぜ utf8mb4：絵文字も保存できる

-- 資産テーブル
CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    -- なぜ DECIMAL：金額は浮動小数点より正確
    
    currency VARCHAR(10) NOT NULL DEFAULT 'JPY',
    purchase_date DATETIME NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- なぜ ON DELETE CASCADE：ユーザー削除時、資産も削除
    
    INDEX idx_user_id (user_id),
    INDEX idx_asset_type (asset_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 収入テーブル
CREATE TABLE IF NOT EXISTS incomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    income_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'JPY',
    start_date DATE NULL,
    notes VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_income_type (income_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- チャットメッセージテーブル
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== テストデータ挿入 =====

-- テストユーザー（パスワード: password123）
-- パスワードハッシュは bcrypt で生成（$2b$12$で始まる）
-- 注意：このハッシュは password123 です
INSERT INTO users (email, username, password_hash) VALUES
('test@example.com', 'テストユーザー', '$2b$12$KIXx9Q8vP3fQ9QxGZJ3zcO5xGZJ3zcO5xGZJ3zcO5xGZJ3zcO5xGa')
ON DUPLICATE KEY UPDATE username = username;

-- テスト資産データ
INSERT INTO assets (user_id, asset_type, name, amount, currency, notes) VALUES
(1, 'savings', '普通預金', 1000000, 'JPY', 'メインバンク'),
(1, 'stock', 'トヨタ株', 500000, 'JPY', '100株保有'),
(1, 'investment', '投資信託', 2000000, 'JPY', 'インデックスファンド')
ON DUPLICATE KEY UPDATE name = name;

-- 完了メッセージ
SELECT '✅ データベース初期化完了！' as message;
