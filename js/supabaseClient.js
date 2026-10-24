// ==========================================================================
// supabaseClient.js - Grace Weekly Supabase Client Module
// ==========================================================================

const SUPABASE_CONFIG = {
  url: 'https://bzgtchffxmkkdsctrdtq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Z3RjaGZmeG1ra2RzY3RyZHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODI3NjAsImV4cCI6MjEwNzQ1ODc2MH0.4CrkdfhIPg4dGBz2vnPRu0lyot6J9GjpfuPRRHcLQ_c'
};

// Initialize Supabase Client
let supabase = null;

if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} else {
  console.warn('Supabase SDK not loaded yet. Waiting for script...');
  window.addEventListener('load', () => {
    if (window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
  });
}

/**
 * Fetch the latest published bulletin
 */
async function fetchLatestBulletin() {
  try {
    const client = supabase || window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client
      .from('bulletins')
      .select('*')
      .eq('is_published', true)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching bulletin from Supabase:', error);
      return getFallbackBulletin();
    }
    return data || getFallbackBulletin();
  } catch (err) {
    console.warn('Network error fetching bulletin, using local fallback:', err);
    return getFallbackBulletin();
  }
}

/**
 * Fetch all bulletins for editor/admin
 */
async function fetchAllBulletins() {
  const client = supabase || window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('bulletins')
    .select('*')
    .order('publish_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Save / Update a weekly bulletin
 */
async function upsertBulletin(bulletinData) {
  const client = supabase || window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('bulletins')
    .upsert(bulletinData, { onConflict: 'publish_date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch user profiles (Admin only)
 */
async function fetchProfiles() {
  const client = supabase || window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update user role (Admin only)
 */
async function updateUserRole(userId, newRole) {
  const client = supabase || window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  if (!client) throw new Error('Supabase client not initialized');

  const { data, error } = await client
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Robust fallback bulletin data matching PRD specifications
 */
function getFallbackBulletin() {
  return {
    id: 1,
    publish_date: '2026-10-25',
    theme_verse: '그러므로 너희가 그리스도 예수를 주로 받았으니 그 안에서 행하되 그 안에 뿌리를 박으며 세움을 받아 교훈을 받은 대로 믿음에 굳게 서서 감사함을 넘치게 하라 (골로새서 2:6-7)',
    sermon_title: '말씀 위에 든든히 서가는 은혜의 공동체',
    preacher: '이은혜 담임목사',
    scripture: '골로새서 2장 6절 ~ 7절',
    scripture_text: '6 그러므로 너희가 그리스도 예수를 주로 받았으니 그 안에서 행하되\n7 그 안에 뿌리를 박으며 세움을 받아 교훈을 받은 대로 믿음에 굳게 서서 감사함을 넘치게 하라',
    order_of_worship: [
      { order: 1, title: '예배의 부름', leader: '인도자', detail: '시편 100:1-5' },
      { order: 2, title: '경배와 찬양', leader: '다함께', detail: '찬송가 28장 (복의 근원 강림하사)' },
      { order: 3, title: '신앙고백', leader: '다함께', detail: '사도신경' },
      { order: 4, title: '교독문', leader: '인도자 / 회중', detail: '교독문 45번 (시편 103편)' },
      { order: 5, title: '대표기도', leader: '김진호 장로', detail: '(1부: 권사회 / 2부: 김진호 장로)' },
      { order: 6, title: '성경봉독', leader: '인도자', detail: '골로새서 2장 6절 ~ 7절' },
      { order: 7, title: '찬양대 찬양', leader: '찬양대', detail: '1부: 임마누엘 찬양대 - "참 좋으신 주님" / 2부: 시온 찬양대 - "주의 은혜라"' },
      { order: 8, title: '말씀 선포', leader: '이은혜 담임목사', detail: '말씀 위에 든든히 서가는 은혜의 공동체' },
      { order: 9, title: '응답의 기도', leader: '다함께', detail: '합심 통성기도' },
      { order: 10, title: '봉헌 및 기도', leader: '다함께 / 인도자', detail: '찬송가 50장 (큰 영화로신 주)' },
      { order: 11, title: '교회 소식', leader: '인도자', detail: '교제 및 환영' },
      { order: 12, title: '축도', leader: '이은혜 담임목사', detail: '축도' }
    ],
    choir_emmanuel: '참 좋으신 주님 (작곡: 김기영) - 주일 1부 예배 (권사 중심 은혜 찬양)',
    choir_zion: '주의 은혜라 (작곡: 손경민) - 주일 2부 대예배',
    choir_hephzibah: '나의 힘이 되신 여호와여 (작곡: 김석균) - 수요예배 특송',
    announcements: [
      { category: '예배/모임', content: '오늘 2부 예배 후 각 전도회 및 구역 월례회가 각 지정 장소에서 모입니다.' },
      { category: '찬양대', content: '시온 찬양대(2부) 및 임마누엘 찬양대(1부) 연습이 예배 전후로 본당과 찬양대실에서 진행됩니다.' },
      { category: '수요예배', content: '이번 주 수요기도회(오후 7:30)는 헵시바 찬양대 헌신 특송 순서가 있습니다.' },
      { category: '봉사/섬김', content: '이번 주 주일 애찬 봉사는 제3구역(권사회) 섬김으로 진행됩니다. 수고에 감사드립니다.' },
      { category: '새가족', content: '주님의 이름으로 교회를 찾으신 모든 분들을 진심으로 환영합니다. (새가족실 문의: 교역자실)' }
    ],
    next_prayers: {
      next_date: '2026-11-01',
      prayer_1: '최선호 권사 (1부)',
      prayer_2: '이원철 장로 (2부)',
      flower: '정영근 장로 가정 (범사 감사)',
      kitchen: '제4구역 (남선교회)',
      usher: '김성수 안수집사, 박영숙 권사'
    },
    is_published: true
  };
}

window.GraceClient = {
  get client() { return supabase || window.supabase?.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey); },
  fetchLatestBulletin,
  fetchAllBulletins,
  upsertBulletin,
  fetchProfiles,
  updateUserRole,
  getFallbackBulletin
};
