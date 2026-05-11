-- =============================================
--  웹툰허브 Supabase 스키마 (로그인 없는 버전)
--  SQL Editor에서 전체 복붙 후 Run
-- =============================================

-- 기존 테이블 있으면 삭제 후 재생성
DROP TABLE IF EXISTS works CASCADE;

-- works 테이블
CREATE TABLE works (
  id        BIGSERIAL PRIMARY KEY,
  title     TEXT NOT NULL,
  platform  TEXT NOT NULL,
  schedule  TEXT,
  genre     TEXT,
  is_ended  BOOLEAN DEFAULT FALSE,
  page_link TEXT,
  emoji     TEXT DEFAULT '📖',
  bg_color  TEXT DEFAULT '#14141e',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(title, platform)
);

-- 누구나 읽기 가능 (로그인 불필요)
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "works_public_read" ON works FOR SELECT USING (TRUE);

-- =============================================
--  CSV 데이터 삽입 방법
--  아래 INSERT 문을 작품 수만큼 추가하세요
--  또는 Supabase Table Editor에서 직접 CSV Import
-- =============================================

-- 예시 데이터 (삭제하고 본인 CSV 데이터 넣으세요)
INSERT INTO works (title, platform, schedule, genre, is_ended, page_link, emoji, bg_color) VALUES
  ('나 혼자만 레벨업', '카카오페이지', NULL,  '판타지', TRUE,  'https://page.kakao.com', '⚔️', '#1a1220'),
  ('신의 탑',          '네이버',       '월',   '판타지', FALSE, 'https://comic.naver.com', '🗼', '#0f1a10'),
  ('외모지상주의',     '네이버',       '화',   '학원',   FALSE, 'https://comic.naver.com', '💪', '#0d0f1a'),
  ('여신강림',         '네이버',       '수',   '로맨스', FALSE, 'https://comic.naver.com', '💌', '#1a0d18')
ON CONFLICT (title, platform) DO NOTHING;
