-- ====================================================================
-- 그레이스 위클리 (Grace Weekly) 300명 맞춤형 스마트 주보 데이터베이스 스키마
-- ====================================================================

-- 1. profiles 테이블 권한 제약 및 보완
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'pending';
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 프로필 RLS 정책
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins full access to profiles" ON public.profiles;
CREATE POLICY "Admins full access to profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 신규 가입자 트리거 함수 (Google OAuth 로그인 시 자동 profiles 레코드 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(COALESCE(new.email, ''), '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    avatar_url = CASE WHEN public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE public.profiles.avatar_url END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. bulletins (주보) 테이블 생성
CREATE TABLE IF NOT EXISTS public.bulletins (
  id BIGSERIAL PRIMARY KEY,
  publish_date DATE NOT NULL UNIQUE,
  theme_verse TEXT,
  sermon_title TEXT NOT NULL,
  preacher TEXT DEFAULT '담임목사',
  scripture TEXT NOT NULL,
  scripture_text TEXT,
  order_of_worship JSONB,
  hymns JSONB,
  choir_zion TEXT,
  choir_emmanuel TEXT,
  choir_hephzibah TEXT,
  announcements JSONB,
  next_prayers JSONB,
  is_published BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

-- 주보 조회 정책
DROP POLICY IF EXISTS "Public read published bulletins" ON public.bulletins;
CREATE POLICY "Public read published bulletins" ON public.bulletins
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Approved users read all bulletins" ON public.bulletins;
CREATE POLICY "Approved users read all bulletins" ON public.bulletins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Approved editors can modify" ON public.bulletins;
CREATE POLICY "Approved editors can modify" ON public.bulletins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- 3. 초기 시드 데이터 (2026년 10월 25일 주보)
INSERT INTO public.bulletins (
  publish_date,
  theme_verse,
  sermon_title,
  preacher,
  scripture,
  scripture_text,
  order_of_worship,
  hymns,
  choir_zion,
  choir_emmanuel,
  choir_hephzibah,
  announcements,
  next_prayers,
  is_published
) VALUES (
  '2026-10-25',
  '그러므로 너희가 그리스도 예수를 주로 받았으니 그 안에서 행하되 그 안에 뿌리를 박으며 세움을 받아 교훈을 받은 대로 믿음에 굳게 서서 감사함을 넘치게 하라 (골로새서 2:6-7)',
  '말씀 위에 든든히 서가는 은혜의 공동체',
  '이은혜 담임목사',
  '골로새서 2장 6절 ~ 7절',
  '6 그러므로 너희가 그리스도 예수를 주로 받았으니 그 안에서 행하되
7 그 안에 뿌리를 박으며 세움을 받아 교훈을 받은 대로 믿음에 굳게 서서 감사함을 넘치게 하라',
  '[
    {"order": 1, "title": "예배의 부름", "leader": "인도자", "detail": "시편 100:1-5"},
    {"order": 2, "title": "경배와 찬양", "leader": "다함께", "detail": "찬송가 28장 (복의 근원 강림하사)"},
    {"order": 3, "title": "신앙고백", "leader": "다함께", "detail": "사도신경"},
    {"order": 4, "title": "교독문", "leader": "인도자 / 회중", "detail": "교독문 45번 (시편 103편)"},
    {"order": 5, "title": "대표기도", "leader": "김진호 장로", "detail": "(1부: 권사회 / 2부: 김진호 장로)"},
    {"order": 6, "title": "성경봉독", "leader": "인도자", "detail": "골로새서 2장 6절 ~ 7절"},
    {"order": 7, "title": "찬양대 찬양", "leader": "찬양대", "detail": "1부: 임마누엘 찬양대 - \"참 좋으신 주님\" / 2부: 시온 찬양대 - \"주의 은혜라\""},
    {"order": 8, "title": "말씀 선포", "leader": "이은혜 담임목사", "detail": "말씀 위에 든든히 서가는 은혜의 공동체"},
    {"order": 9, "title": "응답의 기도", "leader": "다함께", "detail": "합심기도"},
    {"order": 10, "title": "봉헌 및 기도", "leader": "다함께 / 인도자", "detail": "찬송가 50장 (큰 영화로신 주)"},
    {"order": 11, "title": "교회 소식", "leader": "인도자", "detail": "교제 및 광고"},
    {"order": 12, "title": "축도", "leader": "이은혜 담임목사", "detail": "축도"}
  ]'::jsonb,
  '[
    {"type": "입례찬송", "number": "28장", "title": "복의 근원 강림하사"},
    {"type": "설교전 찬송", "number": "310장", "title": "아 하나님의 은혜로"},
    {"type": "봉헌 찬송", "number": "50장", "title": "큰 영화로신 주"}
  ]'::jsonb,
  '주의 은혜라 (작곡: 손경민) - 주일 2부 대예배',
  '참 좋으신 주님 (작곡: 김기영) - 주일 1부 예배 (권사 중심 은혜 찬양)',
  '나의 힘이 되신 여호와여 (작곡: 김석균) - 수요예배 특송',
  '[
    {"category": "예배/모임", "content": "오늘 2부 예배 후 각 전도회 및 구역 월례회가 각 지정 장소에서 모입니다."},
    {"category": "찬양대", "content": "시온 찬양대(2부) 및 임마누엘 찬양대(1부) 연습이 예배 전후로 본당과 찬양대실에서 진행됩니다."},
    {"category": "수요예배", "content": "이번 주 수요기도회(오후 7:30)는 헵시바 찬양대 헌신 특송 순서가 있습니다."},
    {"category": "봉사/섬김", "content": "이번 주 주일 애찬 봉사는 제3구역(권사회) 섬김으로 진행됩니다. 수고에 감사드립니다."},
    {"category": "새가족", "content": "주님의 이름으로 교회를 찾으신 모든 분들을 진심으로 환영합니다. (새가족실 문의: 교역자실)"}
  ]'::jsonb,
  '{
    "next_date": "2026-11-01",
    "prayer_1": "최선호 권사 (1부)",
    "prayer_2": "이원철 장로 (2부)",
    "flower": "정영근 장로 가정 (범사 감사)",
    "kitchen": "제4구역 (남선교회)",
    "usher": "김성수 안수집사, 박영숙 권사"
  }'::jsonb,
  true
)
ON CONFLICT (publish_date) DO UPDATE SET
  theme_verse = EXCLUDED.theme_verse,
  sermon_title = EXCLUDED.sermon_title,
  preacher = EXCLUDED.preacher,
  scripture = EXCLUDED.scripture,
  scripture_text = EXCLUDED.scripture_text,
  order_of_worship = EXCLUDED.order_of_worship,
  hymns = EXCLUDED.hymns,
  choir_zion = EXCLUDED.choir_zion,
  choir_emmanuel = EXCLUDED.choir_emmanuel,
  choir_hephzibah = EXCLUDED.choir_hephzibah,
  announcements = EXCLUDED.announcements,
  next_prayers = EXCLUDED.next_prayers,
  is_published = EXCLUDED.is_published;
