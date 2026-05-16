-- スタンプパックテーブル
CREATE TABLE IF NOT EXISTS sticker_packs (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  preview     text NOT NULL,
  stickers    text[] NOT NULL DEFAULT '{}',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- テンプレカードパックテーブル
CREATE TABLE IF NOT EXISTS template_card_packs (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  preview     text NOT NULL,
  templates   jsonb NOT NULL DEFAULT '[]',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- RLS: 全ユーザー読み書き可（管理者は隠しURLで運用）
ALTER TABLE sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_card_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_sticker_packs"       ON sticker_packs       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_template_card_packs" ON template_card_packs FOR ALL USING (true) WITH CHECK (true);

-- 初期スタンプパックデータ
INSERT INTO sticker_packs (id, name, preview, stickers, sort_order) VALUES
  ('animals', 'どうぶつ', '🐰', ARRAY['🐰','🐇','🐱','🐮','🐷','🐸','🐹','🐭','🦊','🐻','🐼','🐨','🐯','🦁','🐔','🐧'], 0),
  ('nature',  'しぜん',   '🌸', ARRAY['🌸','🌺','🌻','🌷','🍀','🌈','🌙','☀️','⭐','🌟','💫','✨','🍁','🌊','🌿','🌵'], 1),
  ('food',    'たべもの', '🍓', ARRAY['🍓','🍊','🍋','🍇','🍒','🍑','🥝','🍉','🍎','🍧','🍦','🧁','🍩','🍰','🎂','🍭'], 2),
  ('kimochi', 'きもち',   '🥰', ARRAY['🥰','😍','😊','🤗','😘','😜','😎','🥹','😭','🤩','😴','🤭','🫶','💕','💖','💝'], 3),
  ('kawaii',  'ゆめかわ', '🎀', ARRAY['🎀','🎠','🧸','🪆','🎪','🎡','💎','🪄','🎩','🎨','🎭','🌂','🦋','🫧','🩷','🩵'], 4),
  ('sports',  'スポーツ', '⚽', ARRAY['⚽','🏀','🎾','🏐','⚾','🎱','🏓','🏸','🥊','🎯','🏆','🥇','🎽','🛹','🏄','🧗'], 5)
ON CONFLICT (id) DO NOTHING;
