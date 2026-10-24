// ==========================================================================
// app.js - HanYoung Presbyterian Church Mobile Bulletin Logic
// 5 Tabs, Offering Realtime Search, Bible Quiz, Audio Narration, Zoom
// ==========================================================================

let currentBulletin = null;
let currentService = 'worship_2'; // Default: 2부 대예배
let userQuizAnswers = {};

document.addEventListener('DOMContentLoaded', async () => {
  initAccessibilityBar();
  initTabs();
  initSubServiceToggle();
  initAccountCopy();
  initScriptureToggle();
  initOfferingSearch();
  initAudioNarration();

  // Load and render bulletin
  await loadBulletinContent();
});

/**
 * 1. Accessibility Controls: Font Zoom, Share
 */
function initAccessibilityBar() {
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnShare = document.getElementById('btnShareBulletin');

  let currentZoom = parseFloat(localStorage.getItem('hy_font_zoom') || '1.0');
  applyZoom(currentZoom);

  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', () => {
      if (currentZoom < 1.35) {
        currentZoom = parseFloat((currentZoom + 0.1).toFixed(2));
        applyZoom(currentZoom);
        showToast(`글자 크기 확대 (${Math.round(currentZoom * 100)}%)`);
      }
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', () => {
      if (currentZoom > 0.85) {
        currentZoom = parseFloat((currentZoom - 0.1).toFixed(2));
        applyZoom(currentZoom);
        showToast(`글자 크기 축소 (${Math.round(currentZoom * 100)}%)`);
      }
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareData = {
        title: '한영교회 스마트 모바일 주보',
        text: '주님의 기쁨이 되는 한영교회 이번 주 주보입니다.',
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') copyLink();
        }
      } else {
        copyLink();
      }
    });
  }
}

function applyZoom(zoom) {
  document.documentElement.style.fontSize = `${16 * zoom}px`;
  localStorage.setItem('hy_font_zoom', zoom);
}

function copyLink() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    showToast('주보 링크가 복사되었습니다.');
  }
}

/**
 * 2. Mobile Tabs (5개 탭)
 */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-nav-btn');
  const panes = document.querySelectorAll('.tab-content-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(target);
      if (targetPane) targetPane.classList.add('active');
      window.scrollTo({ top: 320, behavior: 'smooth' });
    });
  });
}

/**
 * 3. Sub Service Toggle: 1부 / 2부 대예배
 */
function initSubServiceToggle() {
  const btns = document.querySelectorAll('.btn-sub-service');
  btns.forEach(b => {
    b.addEventListener('click', () => {
      btns.forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');
      currentService = b.dataset.service;
      renderWorshipOrders(currentBulletin);
    });
  });
}

/**
 * 4. Scripture Accordion Toggle
 */
function initScriptureToggle() {
  const btn = document.getElementById('btnToggleScripture');
  const body = document.getElementById('scriptureBody');
  if (!btn || !body) return;

  btn.addEventListener('click', () => {
    const isOpen = body.classList.toggle('open');
    btn.textContent = isOpen ? '말씀 닫기 ▲' : '말씀 읽기 ▼';
  });
}

/**
 * 5. One-Touch Account Copy
 */
function initAccountCopy() {
  const btnCopy = document.getElementById('btnCopyAccount');
  if (!btnCopy) return;

  btnCopy.addEventListener('click', async () => {
    const accountNum = '089501-04-256536';
    const copyTarget = `국민은행 ${accountNum} 한영교회`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyTarget);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = copyTarget;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('국민은행 헌금 계좌번호가 복사되었습니다.');
    } catch (err) {
      showToast('계좌: ' + copyTarget);
    }
  });
}

/**
 * 6. Audio Narration (낭독 모드)
 */
let isSpeaking = false;
function initAudioNarration() {
  const btn = document.getElementById('btnAudioNarration');
  if (!btn) return;

  if (!('speechSynthesis' in window)) {
    btn.style.display = 'none';
    return;
  }

  btn.addEventListener('click', () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      isSpeaking = false;
      btn.classList.remove('active');
      btn.innerHTML = '🔊 낭독';
      showToast('낭독이 중단되었습니다.');
    } else {
      const textToRead = getNarrationText();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9; // Elderly-friendly clear pace

      utterance.onend = () => {
        isSpeaking = false;
        btn.classList.remove('active');
        btn.innerHTML = '🔊 낭독';
      };

      utterance.onerror = () => {
        isSpeaking = false;
        btn.classList.remove('active');
        btn.innerHTML = '🔊 낭독';
      };

      window.speechSynthesis.speak(utterance);
      isSpeaking = true;
      btn.classList.add('active');
      btn.innerHTML = '⏹ 낭독 중지';
      showToast('주보 낭독을 시작합니다.');
    }
  });
}

function getNarrationText() {
  if (!currentBulletin) return '한영교회 스마트 주보입니다.';
  return `대한예수교장로회 한영교회 주보입니다. 
  2026년도 교회 표어는 요한복음 14장 17절로 18절 말씀, 주님의 기쁨이 되는 교회입니다. 
  이번 주일 말씀은 송선우 담임목사님께서 전하시는, 누가복음 19장 1절에서 10절 본문의, 그리스도인의 삶의 자세입니다. 
  교회 소식입니다. ${currentBulletin.announcements?.map(a => a.content).join(' ')}`;
}

/**
 * 7. Realtime Offering Name Search (향기로운 예물 검색)
 */
function initOfferingSearch() {
  const input = document.getElementById('offeringSearchInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    const pills = document.querySelectorAll('.name-pill');
    let matchedCount = 0;

    pills.forEach(pill => {
      const name = pill.textContent.trim().toLowerCase();
      if (query && name.includes(query)) {
        pill.classList.add('matched');
        matchedCount++;
      } else {
        pill.classList.remove('matched');
      }
    });

    const countDisplay = document.getElementById('searchCountDisplay');
    if (countDisplay) {
      if (query) {
        countDisplay.textContent = matchedCount > 0 ? `검색 결과: ${matchedCount}건 일치` : '일치하는 명단이 없습니다.';
      } else {
        countDisplay.textContent = '';
      }
    }
  });
}

/**
 * Toast Notification Helper
 */
let toastTimeout = null;
function showToast(msg) {
  let toast = document.getElementById('hyToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'hyToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

/**
 * Fetch and Render Bulletin Content
 */
async function loadBulletinContent() {
  try {
    const b = await GraceClient.fetchLatestBulletin();
    currentBulletin = b;
    renderBulletin(b);
  } catch (err) {
    console.error('Error fetching bulletin:', err);
    currentBulletin = getHanYoungFallback();
    renderBulletin(currentBulletin);
  }
}

function renderBulletin(b) {
  if (!b) return;

  // Header & Title
  setText('churchPastorDisplay', b.pastor || '송선우 담임목사');
  setText('sermonTitleDisplay', b.title || b.sermon_title || '그리스도인의 삶의 자세');
  setText('sermonPreacherDisplay', b.pastor || '송선우 담임목사');
  setText('sermonScriptureDisplay', b.sermon_scripture || b.scripture || '누가복음 19:1-10');
  setText('themeVerseDisplay', b.theme_verse || '너희는 그를 아나니 그는 너희와 함께 거하심이요...');
  setText('readingWeekDisplay', b.bible_reading_week || '월~토: 마태복음 21장 ~ 마가복음 15장');

  // Render Tab 1: Worship Orders
  renderWorshipOrders(b);

  // Render Tab 2: Afternoon, Wednesday, Prayer Meetings
  renderAfternoonAndMeetings(b);

  // Render Tab 3: Announcements & Directory
  renderAnnouncements(b.announcements || []);

  // Render Tab 4: Offering Records
  renderOfferings(b.offering_records || {});

  // Render Tab 5: Bible Quiz & Reading Checklist
  renderBibleQuiz(b.bible_quiz || []);
}

function renderWorshipOrders(b) {
  const container = document.getElementById('worshipFlowTableBody');
  if (!container || !b) return;

  const orders = b.service_orders?.[currentService] || b.order_of_worship || [];
  container.innerHTML = orders.map(item => {
    let rowClass = '';
    const title = item.order || item.title || '';
    if (title.includes('말씀') || title.includes('설교')) rowClass = 'row-highlight-sermon';
    if (title.includes('찬양')) rowClass = 'row-highlight-choir';

    const leaderBadge = formatLeaderBadge(item.leader);
    return `
      <tr class="${rowClass}">
        <td class="col-order-title">${escapeHtml(title)}</td>
        <td class="col-order-leader">${leaderBadge}</td>
        <td class="col-order-detail">${escapeHtml(item.detail || '')}</td>
      </tr>
    `;
  }).join('');
}

function formatLeaderBadge(leader) {
  if (!leader) return '';
  const l = leader.trim();
  if (l.includes('다함께')) return `<span class="leader-badge badge-all">${escapeHtml(l)}</span>`;
  if (l.includes('목사') || l.includes('인도자')) return `<span class="leader-badge badge-pastor">${escapeHtml(l)}</span>`;
  if (l.includes('찬양대') || l.includes('시온')) return `<span class="leader-badge badge-choir">${escapeHtml(l)}</span>`;
  if (l.includes('장로') || l.includes('집사') || l.includes('권사')) return `<span class="leader-badge badge-elder">${escapeHtml(l)}</span>`;
  return `<span class="leader-badge">${escapeHtml(l)}</span>`;
}

function renderAfternoonAndMeetings(b) {
  const svc = b.service_orders || {};
  
  // Afternoon Service
  if (svc.afternoon) {
    setText('afternoonTime', svc.afternoon.time || '주일 오후 14:30');
    setText('afternoonPraise', svc.afternoon.praise_leader || '아도나이 찬양단 (신광은 목사)');
    setText('afternoonSermon', `${svc.afternoon.sermon_title} (${svc.afternoon.scripture}) - ${svc.afternoon.preacher}`);
    setText('afternoonChoir', svc.afternoon.choir || '임마누엘 찬양대');
  }

  // Wednesday Service
  if (svc.wednesday) {
    setText('wednesdayTime', svc.wednesday.time || '수요일 저녁 19:30');
    setText('wednesdayTitle', `${svc.wednesday.title} - ${svc.wednesday.preacher}`);
    setText('wednesdayPrayer', `기도: ${svc.wednesday.prayer}`);
    setText('wednesdayChoir', svc.wednesday.choir || '헵시바 찬양대');
  }
}

function renderAnnouncements(items) {
  const list = document.getElementById('announcementsList');
  if (!list) return;

  list.innerHTML = items.map(a => {
    let catClass = 'cat-general';
    const cat = a.category || '알림';
    if (cat.includes('환영')) catClass = 'cat-newcomer';
    else if (cat.includes('소식') || cat.includes('성도')) catClass = 'cat-worship';
    else if (cat.includes('찬양')) catClass = 'cat-choir';
    else if (cat.includes('봉사') || cat.includes('섬김')) catClass = 'cat-service';

    return `
      <li class="announcement-item">
        <span class="announcement-badge ${catClass}">${escapeHtml(cat)}</span>
        <div class="announcement-content">${escapeHtml(a.content)}</div>
      </li>
    `;
  }).join('');
}

function renderOfferings(records) {
  renderNameCloud('titheList', records.tithe || []);
  renderNameCloud('thanksgivingList', records.thanksgiving || []);
  renderNameCloud('missionList', records.mission || []);
  renderSpecialList('specialList', records.special || []);
}

function renderNameCloud(containerId, names) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = names.map(n => `<span class="name-pill">${escapeHtml(n)}</span>`).join('');
}

function renderSpecialList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(it => `<div style="font-size:0.9rem; margin-bottom:4px;">• <strong>${escapeHtml(it)}</strong></div>`).join('');
}

/**
 * 8. Bible Quiz Interactive Logic
 */
function renderBibleQuiz(quizItems) {
  const container = document.getElementById('bibleQuizContainer');
  if (!container) return;

  if (!quizItems || quizItems.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px;">이번 주 성경 퀴즈를 준비 중입니다.</p>';
    return;
  }

  container.innerHTML = quizItems.map((q, idx) => `
    <div class="quiz-card" data-qid="${q.id}">
      <div class="quiz-question">${idx + 1}. ${escapeHtml(q.question)}</div>
      <div class="quiz-options">
        ${q.options.map((opt, oIdx) => `
          <button type="button" class="quiz-option-btn" onclick="selectQuizOption(${q.id}, ${oIdx})">
            <span>(${oIdx + 1})</span> ${escapeHtml(opt)}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

window.selectQuizOption = function(qId, optionIdx) {
  userQuizAnswers[qId] = optionIdx;
  const card = document.querySelector(`.quiz-card[data-qid="${qId}"]`);
  if (!card) return;

  const btns = card.querySelectorAll('.quiz-option-btn');
  btns.forEach((btn, idx) => {
    btn.classList.toggle('selected', idx === optionIdx);
  });
};

window.submitQuizAnswers = function() {
  const quizList = currentBulletin?.bible_quiz || [];
  if (quizList.length === 0) return;

  let score = 0;
  quizList.forEach(q => {
    const userChoice = userQuizAnswers[q.id];
    const card = document.querySelector(`.quiz-card[data-qid="${q.id}"]`);
    if (!card) return;

    const btns = card.querySelectorAll('.quiz-option-btn');
    btns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.answer) {
        btn.classList.add('correct');
      } else if (idx === userChoice) {
        btn.classList.add('wrong');
      }
    });

    if (userChoice === q.answer) {
      score++;
    }
  });

  const resultBox = document.getElementById('quizResultBox');
  if (resultBox) {
    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="background:#FFF9ED; border:2px solid #D4A034; border-radius:8px; padding:16px; text-align:center; margin-top:16px;">
        <h4 style="color:#234B73; font-size:1.15rem; margin-bottom:6px;">🎉 채점 결과: 총 10문제 중 ${score}문제 정답!</h4>
        <p style="font-size:0.9rem; color:#4E5551;">말씀을 사모하며 성경 퀴즈에 참여해 주셔서 감사합니다.</p>
      </div>
    `;
    resultBox.scrollIntoView({ behavior: 'smooth' });
  }
};

window.toggleReadingDay = function(btn) {
  btn.classList.toggle('checked');
  btn.textContent = btn.classList.contains('checked') ? '✓ 완료' : '미완료';
};

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getHanYoungFallback() {
  return {
    publish_date: '2026-10-25',
    title: '그리스도인의 삶의 자세',
    pastor: '송선우 담임목사',
    sermon_scripture: '눅 19:1-10',
    bible_reading_week: '월~토: 마태복음 21장 ~ 마가복음 15장',
    theme_verse: '너희는 그를 아나니 그는 너희와 함께 거하심이요 또 너희 속에 계시겠음이라 내가 너희를 고아와 같이 버려두지 아니하고 너희에게로 오리라 (요 14:17-18)',
    service_orders: {
      worship_1: [
        { order: '예배의 부름', leader: '인도자 (송선우 목사)', detail: '경배와 찬양' },
        { order: '송 영', leader: '찬양대', detail: '임재의 노래' },
        { order: '기 원', leader: '인도자', detail: '송선우 목사' },
        { order: '찬 송', leader: '다함께', detail: '찬송가 83장' },
        { order: '신앙고백', leader: '다함께', detail: '사도신경' },
        { order: '성시교독', leader: '다함께', detail: '교독문 83번' },
        { order: '기 도', leader: '회성순 안수집사', detail: '(다음 주: 이종훈 안수집사)' },
        { order: '찬 송', leader: '다함께', detail: '찬송가 286장' },
        { order: '성경봉독', leader: '인도자', detail: '눅 19:1-10' },
        { order: '찬 양', leader: '찬양대', detail: '"난 만족합니다"' },
        { order: '말 씀', leader: '송선우 담임목사', detail: '"그리스도인의 삶의 자세"' },
        { order: '헌 금', leader: '다함께', detail: '"내게 있는 향유 옥합"' },
        { order: '봉헌기도', leader: '송선우 목사', detail: '감사와 간구' },
        { order: '교회소식', leader: '인도자', detail: '환영 및 교제' },
        { order: '찬 송', leader: '다함께', detail: '찬송가 293장' },
        { order: '축 도', leader: '송선우 담임목사', detail: '축도' }
      ],
      worship_2: [
        { order: '예배의 부름', leader: '인도자 (최선열 목사)', detail: '시편 100편' },
        { order: '송 영', leader: '시온 찬양대', detail: '임재의 노래' },
        { order: '기 원', leader: '인도자', detail: '최선열 목사' },
        { order: '찬 송', leader: '다함께', detail: '찬송가 83장' },
        { order: '신앙고백', leader: '다함께', detail: '사도신경' },
        { order: '성시교독', leader: '다함께', detail: '교독문 83번' },
        { order: '기 도', leader: '예민구 장로', detail: '(다음 주: 김재형 장로)' },
        { order: '찬 송', leader: '다함께', detail: '찬송가 286장' },
        { order: '성경봉독', leader: '인도자', detail: '눅 19:1-10' },
        { order: '찬 양', leader: '시온 찬양대', detail: '주의 은혜라 (지휘 김남규 / 반주 문제철 / 대장 조익한)' },
        { order: '말 씀', leader: '송선우 담임목사', detail: '"그리스도인의 삶의 자세"' },
        { order: '헌 금', leader: '다함께', detail: '"내게 있는 향유 옥합"' },
        { order: '봉헌기도', leader: '송선우 목사', detail: '봉헌과 축복' },
        { order: '교회소식', leader: '인도자', detail: '공동체 소식' },
        { order: '찬 송', leader: '다함께', detail: '찬송가 293장' },
        { order: '축 도', leader: '송선우 담임목사', detail: '축도' }
      ],
      afternoon: {
        time: '주일 오후 14:30',
        praise_leader: '아도나이 찬양단 (인도: 신광은 목사)',
        sermon_title: '"귀 좋으신 주님"',
        scripture: '행 5:1-11',
        preacher: '신광은 목사',
        choir: '임마누엘 찬양대 (권사 중심 찬양 / 반주: 최신아, 대장: 김태형)'
      },
      wednesday: {
        time: '수요일 저녁 19:30',
        title: '수요 성서연구 (마태복음 강해)',
        preacher: '송선우 담임목사',
        prayer: '김영효 권사 (다음 주: 이정애 권사)',
        choir: '헵시바 찬양대 (지휘: 신광은 / 반주: 이지혜 / 대장: 윤영임)'
      }
    },
    announcements: [
      { category: '환영', content: '한영교회에 처음 방문하신 모든 성도님들을 주님의 이름으로 진심으로 환영하고 축복합니다.' },
      { category: '성도소식', content: '구역공과: 각 구역별 성경공부와 나눔이 금주 처소에서 진행됩니다.' },
      { category: '성도소식', content: '수험생을 위한 기도: 대학수학능력시험을 앞둔 수험생 자녀들을 위해 성도님들의 뜨거운 중보기도를 부탁드립니다.' },
      { category: '봉사/섬김', content: '이번 주 식당 봉사는 제3구역 및 권사회 섬김으로 진행됩니다.' },
      { category: '찬양대', content: '시온, 임마누엘, 헵시바 찬양대원 상시 모집' }
    ],
    offering_records: {
      tithe: ['송선우', '이태호', '최태선', '김기동', '예민구', '김재형', '이정태', '문태응', '유연봉', '최진업', '회성순', '이종훈', '김남규', '문제철', '조익한', '김태형', '윤영임'],
      thanksgiving: ['송선우', '이태호', '김기동', '예민구', '문태응', '최진업', '이종훈', '조익한', '김재형', '이정태', '윤영임', '김영효'],
      mission: ['이태호', '최태선', '김기동', '예민구', '김재형', '이정태', '청년회', '제1여전도회', '제2남선교회'],
      special: ['김기동 장로 가정 (범사 감사 및 자녀 축복)', '예민구 장로 가정 (생일 감사)', '조익한 집사 가정 (건강 회복 감사)']
    },
    bible_quiz: [
      { id: 1, question: '예수께서 여리고로 들어가 지나가실 때, 삭개오의 직업은 무엇이었습니까?', options: ['어부', '세리장이며 부자', '로마 백부장', '바리새인'], answer: 1 },
      { id: 2, question: '삭개오는 키가 작아 예수를 보기 위해 어디에 올라갔습니까?', options: ['감람나무', '돌무화과나무(뽕나무)', '포도나무', '성벽 위'], answer: 1 },
      { id: 3, question: '예수께서 삭개오를 보시고 무엇이라 말씀하셨습니까?', options: ['회개하라', '삭개오야 속히 내려오라 내가 오늘 네 집에 유하여야 하겠다', '네 믿음이 너를 구원하였다', '재산을 다 팔라'], answer: 1 },
      { id: 4, question: '삭개오는 주께 자신의 소유 중 얼마를 가난한 자들에게 주겠다고 고백했습니까?', options: ['십분의 일', '절반 (2분의 1)', '삼분의 일', '전부'], answer: 1 },
      { id: 5, question: '삭개오가 만일 누구의 것을 속여 빼앗은 일이 있으면 몇 갑절로 갚겠다고 했습니까?', options: ['두 갑절', '세 갑절', '네 갑절', '다섯 갑절'], answer: 2 },
      { id: 6, question: '예수께서 오늘 이 집에 무엇이 이르렀다고 선포하셨습니까?', options: ['평안', '구원', '축복', '영생'], answer: 1 },
      { id: 7, question: '예수님은 삭개오 역시 누구의 자손이라고 말씀하셨습니까?', options: ['다윗의 자손', '아브라함의 자손', '모세의 자손', '야곱의 자손'], answer: 1 },
      { id: 8, question: '인자가 온 것은 누구를 찾아 구원하려 함입니까? (눅 19:10)', options: ['의인', '잃어버린 자', '부자', '제자들'], answer: 1 },
      { id: 9, question: '한영교회의 2026년도 표어 성경 구절은 요한복음 몇 장 몇 절입니까?', options: ['요한복음 3:16', '요한복음 14:17-18', '요한복음 15:5', '요한복음 10:10'], answer: 1 },
      { id: 10, question: '한영교회의 3대 실천 목표 중 첫 번째는 무엇입니까?', options: ['하나님의 말씀을 사랑하는 교회', '오직 믿음으로 일하는 교회', '땅끝까지 선교하는 교회', '모이기에 힘쓰는 교회'], answer: 0 }
    ]
  };
}
