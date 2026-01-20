-- データベース構造整理: 未来計画用の追加カラム
-- 実行日: 2026-01-16

-- ⑦老後設計テーブル（未来計画）
ALTER TABLE retirements 
ADD COLUMN retirement_age INT COMMENT '退職年齢',
ADD COLUMN monthly_amount DECIMAL(15,2) COMMENT '月額受取額',
ADD COLUMN total_amount DECIMAL(15,2) COMMENT '一時金総額';

-- ⑧リスク・その他テーブル（未来対策）
ALTER TABLE risks 
ADD COLUMN insurance_type VARCHAR(50) COMMENT '保険種別: life, medical, fire, earthquake',
ADD COLUMN coverage_amount DECIMAL(15,2) COMMENT '保障額',
ADD COLUMN monthly_premium DECIMAL(15,2) COMMENT '月額保険料',
ADD COLUMN coverage_period INT COMMENT '保障期間（年）';

-- 完了
SELECT 'Migration completed: additional columns added to retirements and risks' AS status;
