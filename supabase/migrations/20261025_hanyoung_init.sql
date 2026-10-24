-- ====================================================================
-- 대한예수교장로회 한영교회(HANYOUNG PRESBYTERIAN CHURCH) 맞춤형 스마트 주보 DB
-- ====================================================================

-- 1. bulletins 테이블 칼럼 추가 및 보완 (기존 테이블 호환성 유지)
ALTER TABLE public.bulletins 
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '그리스도인의 삶의 자세',
  ADD COLUMN IF NOT EXISTS pastor TEXT DEFAULT '송선우 담임목사',
  ADD COLUMN IF NOT EXISTS sermon_scripture TEXT DEFAULT '눅 19:1-10',
  ADD COLUMN IF NOT EXISTS bible_reading_week TEXT DEFAULT '월~토: 마태복음 21장 ~ 마가복음 15장',
  ADD COLUMN IF NOT EXISTS service_orders JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS offering_records JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bible_quiz JSONB DEFAULT '[]'::jsonb;

-- RLS 정책 재확인
ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view bulletins" ON public.bulletins;
CREATE POLICY "Anyone can view bulletins" ON public.bulletins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Editors can modify bulletins" ON public.bulletins;
CREATE POLICY "Editors can modify bulletins" ON public.bulletins FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('editor', 'admin')
  )
);

-- 2. 2026년 10월 25일 한영교회 실제 주보 시드 데이터 입력
INSERT INTO public.bulletins (
  publish_date,
  title,
  sermon_title,
  pastor,
  preacher,
  sermon_scripture,
  scripture,
  bible_reading_week,
  theme_verse,
  service_orders,
  choir_zion,
  choir_emmanuel,
  choir_hephzibah,
  announcements,
  offering_records,
  bible_quiz,
  is_published
) VALUES (
  '2026-10-25',
  '그리스도인의 삶의 자세',
  '그리스도인의 삶의 자세',
  '송선우 담임목사',
  '송선우 담임목사',
  '누가복음 19장 1절 ~ 10절 (눅 19:1-10)',
  '누가복음 19장 1절 ~ 10절 (눅 19:1-10)',
  '월~토: 마태복음 21장 ~ 마가복음 15장',
  '너희는 그를 아나니 그는 너희와 함께 거하심이요 또 너희 속에 계시겠음이라 내가 너희를 고아와 같이 버려두지 아니하고 너희에게로 오리라 (요 14:17-18)',
  '{
    "worship_1": [
      {"order": "예배의 부름", "leader": "인도자 (송선우 목사)", "detail": "경배와 찬양"},
      {"order": "송 영", "leader": "찬양대", "detail": "임재의 노래"},
      {"order": "기 원", "leader": "인도자", "detail": "송선우 목사"},
      {"order": "찬 송", "leader": "다함께", "detail": "찬송가 83장 (나의 맘에 근심 구름)"},
      {"order": "신앙고백", "leader": "다함께", "detail": "사도신경"},
      {"order": "성시교독", "leader": "다함께", "detail": "교독문 83번"},
      {"order": "기 도", "leader": "회성순 안수집사", "detail": "(다음 주: 이종훈 안수집사)"},
      {"order": "찬 송", "leader": "다함께", "detail": "찬송가 286장 (주 예수님 내 맘에 오사)"},
      {"order": "성경봉독", "leader": "인도자", "detail": "누가복음 19:1-10 (눅 19:1-10)"},
      {"order": "찬 양", "leader": "찬양대", "detail": "\"난 만족합니다\""},
      {"order": "말 씀", "leader": "송선우 담임목사", "detail": "\"그리스도인의 삶의 자세\""},
      {"order": "헌 금", "leader": "다함께", "detail": "\"내게 있는 향유 옥합\" (봉헌위원)"},
      {"order": "봉헌기도", "leader": "송선우 담임목사", "detail": "감사와 간구"},
      {"order": "교회소식", "leader": "인도자", "detail": "환영 및 교제"},
      {"order": "찬 송", "leader": "다함께", "detail": "찬송가 293장 (주의 사랑 비칠 때에)"},
      {"order": "축 도", "leader": "송선우 담임목사", "detail": "축도"}
    ],
    "worship_2": [
      {"order": "예배의 부름", "leader": "인도자 (최선열 목사)", "detail": "시편 100편"},
      {"order": "송 영", "leader": "시온 찬양대", "detail": "임재의 노래 (지휘 김남규 / 반주 문제철)"},
      {"order": "기 원", "leader": "인도자", "detail": "최선열 목사"},
      {"order": "찬 송", "leader": "다함께", "detail": "찬송가 83장"},
      {"order": "신앙고백", "leader": "다함께", "detail": "사도신경"},
      {"order": "성시교독", "leader": "다함께", "detail": "교독문 83번"},
      {"order": "기 도", "leader": "예민구 장로", "detail": "(다음 주: 김재형 장로)"},
      {"order": "찬 송", "leader": "다함께", "detail": "찬송가 286장"},
      {"order": "성경봉독", "leader": "인도자", "detail": "누가복음 19:1-10"},
      {"order": "찬 양", "leader": "시온 찬양대", "detail": "대장 조익한 / 곡명: \"주의 은혜라\""},
      {"order": "말 씀", "leader": "송선우 담임목사", "detail": "\"그리스도인의 삶의 자세\""},
      {"order": "헌 금", "leader": "다함께", "detail": "\"내게 있는 향유 옥합\" (봉헌위원)"},
      {"order": "봉헌기도", "leader": "송선우 담임목사", "detail": "봉헌과 축복"},
      {"order": "교회소식", "leader": "인도자", "detail": "공동체 소식"},
      {"order": "찬 송", "leader": "다함께", "detail": "찬송가 293장"},
      {"order": "축 도", "leader": "송선우 담임목사", "detail": "축도"}
    ],
    "afternoon": {
      "time": "주일 오후 14:30 (본당)",
      "praise_leader": "아도나이 찬양단 (인도: 신광은 목사)",
      "scripture": "사도행전 5장 1절 ~ 11절 (행 5:1-11)",
      "sermon_title": "\"귀 좋으신 주님\"",
      "preacher": "신광은 목사",
      "choir": "임마누엘 찬양대 (권사 중심 찬양 / 반주: 최신아, 대장: 김태형)"
    },
    "wednesday": {
      "time": "매주 수요일 저녁 19:30 (본당)",
      "title": "수요 성서연구 (마태복음 강해)",
      "preacher": "송선우 담임목사",
      "prayer": "김영효 권사 (다음 주: 이정애 권사)",
      "choir": "헵시바 찬양대 (지휘: 신광은, 반주: 이지혜, 대장: 윤영임)"
    },
    "prayer_meetings": [
      {"name": "금요 밤 기도회", "time": "매주 금요일 밤 21:00", "place": "소망관"},
      {"name": "새벽 기도회", "time": "월~금 매일 새벽 05:30", "place": "소망관", "leader": "송선우 담임목사"}
    ],
    "departments": [
      {"name": "유·초등부 (주일학교)", "time": "주일 오전 11:00", "place": "교육관 2층 (20명)"},
      {"name": "중·고등부", "time": "주일 오전 11:00", "place": "소예배실 3층 (20명)"},
      {"name": "청년회", "time": "주일 오전 11:00", "place": "본당 (20명)"}
    ]
  }'::jsonb,
  '주의 은혜라 (지휘: 김남규 / 반주: 문제철 / 대장: 조익한) - 주일 2부(11:00) 대예배',
  '권사 중심 찬양 (반주: 최신아 / 대장: 김태형) - 주일 오후(14:30) 찬양예배',
  '수요 성서연구 특송 (지휘: 신광은 / 반주: 이지혜 / 대장: 윤영임) - 수요일 저녁(19:30)',
  '[
    {"category": "환영", "content": "한영교회에 처음 방문하신 모든 성도님들을 주님의 이름으로 진심으로 환영하고 축복합니다. (예배 후 새가족실에서 교역자와 만남이 있습니다)"},
    {"category": "성도소식", "content": "구역공과: 각 구역별 성경공부와 나눔이 금주 지정된 처소에서 진행됩니다."},
    {"category": "성도소식", "content": "수험생을 위한 기도: 2027학년도 대학수학능력시험을 앞둔 수험생 자녀들을 위해 성도님들의 뜨거운 중보기도를 부탁드립니다."},
    {"category": "봉사/섬김", "content": "이번 주 주일 식당 애찬 봉사는 제3구역 및 권사회 섬김으로 진행됩니다. 수고에 감사드립니다."},
    {"category": "찬양대", "content": "찬양대원 모집: 시온 찬양대(2부), 임마누엘 찬양대(오후), 헵시바 찬양대(수요)에서 함께 찬양으로 하나님께 영광 돌릴 대원을 상시 모집합니다."},
    {"category": "예배위원", "content": "1부 안내/헌금: 회성순 집사, 최선옥 권사 | 2부 안내/헌금: 예민구 장로, 조익한 집사, 박영자 권사 | 강단 헌화: 김기동 장로 가정"}
  ]'::jsonb,
  '{
    "tithe": ["송선우", "이태호", "최태선", "김기동", "예민구", "김재형", "이정태", "문태응", "유연봉", "최진업", "회성순", "이종훈", "신광은", "최선열", "여은영", "김남규", "문제철", "조익한", "김태형", "윤영임", "서영숙", "김영효", "박영자", "최선옥", "이지혜", "최신아"],
    "thanksgiving": ["송선우", "이태호", "김기동", "예민구", "문태응", "최진업", "이종훈", "조익한", "김재형", "이정태", "윤영임", "김영효", "회성순", "무명(3명)"],
    "mission": ["이태호", "최태선", "김기동", "예민구", "김재형", "이정태", "청년회", "제1여전도회", "제2남선교회"],
    "special": ["김기동 장로 가정 (범사 감사 및 자녀 축복)", "예민구 장로 가정 (생일 감사)", "조익한 집사 가정 (건강 회복 감사)"]
  }'::jsonb,
  '[
    {"id": 1, "question": "예수께서 여리고로 들어가 지나가실 때, 삭개오의 직업은 무엇이었습니까?", "options": ["어부", "세리장이며 부자", "로마 백부장", "바리새인"], "answer": 1},
    {"id": 2, "question": "삭개오는 키가 작아 예수를 보기 위해 어디에 올라갔습니까?", "options": ["감람나무", "돌무화과나무(뽕나무)", "포도나무", "성벽 위"], "answer": 1},
    {"id": 3, "question": "예수께서 삭개오를 보시고 무엇이라 말씀하셨습니까?", "options": ["회개하라", "삭개오야 속히 내려오라 내가 오늘 네 집에 유하여야 하겠다", "네 믿음이 너를 구원하였다", "재산을 다 팔아 가난한 자에게 주라"], "answer": 1},
    {"id": 4, "question": "삭개오는 주께 자신의 소유 중 얼마를 가난한 자들에게 주겠다고 고백했습니까?", "options": ["십분의 일", "절반 (2분의 1)", "삼분의 일", "전부"], "answer": 1},
    {"id": 5, "question": "삭개오가 만일 누구의 것을 속여 빼앗은 일이 있으면 몇 갑절로 갚겠다고 했습니까?", "options": ["두 갑절", "세 갑절", "네 갑절", "다섯 갑절"], "answer": 2},
    {"id": 6, "question": "예수께서 오늘 이 집에 무엇이 이르렀다고 선포하셨습니까?", "options": ["평안", "구원", "축복", "영생"], "answer": 1},
    {"id": 7, "question": "예수님은 삭개오 역시 누구의 자손이라고 말씀하셨습니까?", "options": ["다윗의 자손", "아브라함의 자손", "모세의 자손", "야곱의 자손"], "answer": 1},
    {"id": 8, "question": "인자가 온 것은 누구를 찾아 구원하려 함입니까? (눅 19:10)", "options": ["의인", "잃어버린 자", "부자", "제자들"], "answer": 1},
    {"id": 9, "question": "한영교회의 2026년도 표어 성경 구절은 요한복음 몇 장 몇 절입니까?", "options": ["요한복음 3:16", "요한복음 14:17-18", "요한복음 15:5", "요한복음 10:10"], "answer": 1},
    {"id": 10, "question": "한영교회의 3대 실천 목표 중 첫 번째는 무엇입니까?", "options": ["하나님의 말씀을 사랑하는 교회", "오직 믿음으로 일하는 교회", "땅끝까지 선교하는 교회", "모이기에 힘쓰는 교회"], "answer": 0}
  ]'::jsonb,
  true
)
ON CONFLICT (publish_date) DO UPDATE SET
  title = EXCLUDED.title,
  sermon_title = EXCLUDED.sermon_title,
  pastor = EXCLUDED.pastor,
  preacher = EXCLUDED.preacher,
  sermon_scripture = EXCLUDED.sermon_scripture,
  scripture = EXCLUDED.scripture,
  bible_reading_week = EXCLUDED.bible_reading_week,
  theme_verse = EXCLUDED.theme_verse,
  service_orders = EXCLUDED.service_orders,
  choir_zion = EXCLUDED.choir_zion,
  choir_emmanuel = EXCLUDED.choir_emmanuel,
  choir_hephzibah = EXCLUDED.choir_hephzibah,
  announcements = EXCLUDED.announcements,
  offering_records = EXCLUDED.offering_records,
  bible_quiz = EXCLUDED.bible_quiz,
  is_published = true;
