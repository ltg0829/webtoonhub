-- ================================================
--  웹툰허브 Supabase DB 스키마
--  Supabase → SQL Editor 에서 전체 복붙 후 실행
-- ================================================

-- 1. 작품 테이블
CREATE TABLE IF NOT EXISTS works (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  platform    TEXT NOT NULL,
  schedule    TEXT,                    -- 요일 (월/화/수/목/금/토/일)
  genre       TEXT,
  is_ended    BOOLEAN DEFAULT FALSE,   -- 완결 여부
  page_link   TEXT,                    -- 플랫폼 바로가기 URL
  emoji       TEXT DEFAULT '📖',
  bg_color    TEXT DEFAULT '#16161f',
  tags        TEXT[],                  -- 태그 배열
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id          BIGSERIAL PRIMARY KEY,
  work_id     BIGINT REFERENCES works(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL,
  stars       INTEGER CHECK (stars BETWEEN 1 AND 5),
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 2 AND 80),
  helpful     INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(work_id, user_id)             -- 작품당 1리뷰
);

-- 3. 도움돼요 투표 테이블
CREATE TABLE IF NOT EXISTS helpful_votes (
  id          BIGSERIAL PRIMARY KEY,
  review_id   BIGINT REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(review_id, user_id)
);

-- 4. 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
  id          BIGSERIAL PRIMARY KEY,
  work_id     BIGINT REFERENCES works(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 2 AND 300),
  parent_id   BIGINT REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 요일 알림 구독 테이블
CREATE TABLE IF NOT EXISTS schedule_subscriptions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  days        TEXT[],                  -- ['월','수','금'] 구독 요일
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 6. 유저 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT UNIQUE NOT NULL,
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
--  RLS (Row Level Security) 정책
-- ================================================

-- works: 누구나 읽기, 관리자만 쓰기
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "works_read"   ON works FOR SELECT USING (TRUE);
CREATE POLICY "works_admin"  ON works FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE));

-- reviews: 누구나 읽기, 로그인 유저만 본인 리뷰 쓰기/삭제
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read"   ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- helpful_votes: 로그인 유저만
ALTER TABLE helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read"   ON helpful_votes FOR SELECT USING (TRUE);
CREATE POLICY "votes_insert" ON helpful_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_delete" ON helpful_votes FOR DELETE
  USING (auth.uid() = user_id);

-- comments: 누구나 읽기, 로그인 유저만 쓰기/삭제
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read"   ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- profiles: 본인만 읽기/수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- schedule_subscriptions: 본인만
ALTER TABLE schedule_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_all" ON schedule_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ================================================
--  함수: 신규 유저 가입 시 프로필 자동 생성
-- ================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================
--  함수: 평균 별점 뷰
-- ================================================
CREATE OR REPLACE VIEW works_with_stats AS
SELECT
  w.*,
  COALESCE(ROUND(AVG(r.stars)::NUMERIC, 1), 0) AS avg_stars,
  COUNT(DISTINCT r.id) AS review_count,
  COUNT(DISTINCT c.id) AS comment_count
FROM works w
LEFT JOIN reviews r ON r.work_id = w.id
LEFT JOIN comments c ON c.work_id = w.id
GROUP BY w.id;
