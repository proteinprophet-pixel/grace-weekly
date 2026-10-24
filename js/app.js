// ==========================================================================
// app.js - Congregation Mobile Bulletin Viewer Logic
// Enhanced with rich liturgical styling & dynamic color tags
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initLargeTextToggle();
  initAccountCopy();
  initScriptureToggle();
  initShareActions();

  // Load and render bulletin
  await loadBulletinContent();
});

/**
 * Large Text Mode Toggle (장년층 큰 글씨 모드)
 */
function initLargeTextToggle() {
  const btnToggle = document.getElementById('btnToggleFontSize');
  if (!btnToggle) return;

  const isLarge = localStorage.getItem('grace_large_text') === 'true';
  if (isLarge) {
    document.body.classList.add('large-text-mode');
    btnToggle.classList.add('active');
    btnToggle.textContent = '보통 글씨';
  }

  btnToggle.addEventListener('click', () => {
    const currentlyLarge = document.body.classList.toggle('large-text-mode');
    localStorage.setItem('grace_large_text', currentlyLarge);
    btnToggle.classList.toggle('active', currentlyLarge);
    btnToggle.textContent = currentlyLarge ? '보통 글씨' : '큰 글씨';
    showToast(currentlyLarge ? '큰 글씨 모드가 켜졌습니다.' : '보통 글씨 모드로 변경되었습니다.');
  });
}

/**
 * Scripture Accordion Toggle (말씀 본문 펼치기)
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
 * One-Touch Offering Account Copy (원터치 헌금 계좌 복사)
 */
function initAccountCopy() {
  const btnCopy = document.getElementById('btnCopyAccount');
  if (!btnCopy) return;

  btnCopy.addEventListener('click', async () => {
    const accountText = document.getElementById('accountNumberText')?.textContent.trim() || '301-1234-5678-91';
    const copyTarget = `농협 ${accountText} 그레이스교회`;

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
      showToast('헌금 계좌번호가 복사되었습니다.');
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      showToast('계좌: ' + copyTarget);
    }
  });
}

/**
 * Share & Print Actions
 */
function initShareActions() {
  const btnShare = document.getElementById('btnShareBulletin');
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareData = {
        title: '그레이스교회 스마트 모바일 주보',
        text: '이번 주일 그레이스교회 주보를 함께 나눕니다.',
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') copyPageLink();
        }
      } else {
        copyPageLink();
      }
    });
  }
}

function copyPageLink() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    showToast('주보 링크가 복사되었습니다. 카카오톡 등에 전달해 주세요.');
  } else {
    showToast('주소창의 링크를 복사하여 전달해 주세요.');
  }
}

/**
 * Toast Notification Helper
 */
let toastTimeout = null;
function showToast(msg) {
  let toast = document.getElementById('graceToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'graceToast';
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
 * Fetch and Render Bulletin Data
 */
async function loadBulletinContent() {
  try {
    const b = await GraceClient.fetchLatestBulletin();
    renderBulletin(b);
  } catch (err) {
    console.error('Error rendering bulletin:', err);
    renderBulletin(GraceClient.getFallbackBulletin());
  }
}

function getLeaderBadgeHtml(leader) {
  if (!leader) return '';
  const l = leader.trim();
  if (l.includes('다함께')) {
    return `<span class="leader-badge badge-all">${escapeHtml(l)}</span>`;
  }
  if (l.includes('인도자') || l.includes('목사')) {
    return `<span class="leader-badge badge-pastor">${escapeHtml(l)}</span>`;
  }
  if (l.includes('찬양대')) {
    return `<span class="leader-badge badge-choir">${escapeHtml(l)}</span>`;
  }
  if (l.includes('장로') || l.includes('권사') || l.includes('집사')) {
    return `<span class="leader-badge badge-elder">${escapeHtml(l)}</span>`;
  }
  return `<span class="leader-badge">${escapeHtml(l)}</span>`;
}

function getWorshipRowClass(title) {
  if (!title) return '';
  if (title.includes('말씀') || title.includes('설교')) return 'row-highlight-sermon';
  if (title.includes('찬양대')) return 'row-highlight-choir';
  if (title.includes('축도')) return 'row-highlight-benediction';
  return '';
}

function getCategoryBadgeClass(category) {
  if (!category) return 'cat-general';
  if (category.includes('예배') || category.includes('모임')) return 'cat-worship';
  if (category.includes('찬양대')) return 'cat-choir';
  if (category.includes('수요')) return 'cat-wednesday';
  if (category.includes('봉사') || category.includes('식당')) return 'cat-service';
  if (category.includes('새가족')) return 'cat-newcomer';
  return 'cat-general';
}

function renderBulletin(b) {
  if (!b) return;

  // 1. Date & Issue Meta
  const publishDate = b.publish_date ? new Date(b.publish_date + 'T00:00:00') : new Date();
  const dateFormatted = `${publishDate.getFullYear()}년 ${publishDate.getMonth() + 1}월 ${publishDate.getDate()}일 주일`;
  setText('bulletinDateDisplay', dateFormatted);

  // 2. Theme verse
  if (b.theme_verse) {
    setText('bulletinThemeVerse', b.theme_verse);
  }

  // 3. Sermon Info
  setText('sermonTitleDisplay', b.sermon_title || '말씀 위에 든든히 서가는 은혜의 공동체');
  setText('sermonPreacherDisplay', b.preacher || '이은혜 담임목사');
  setText('sermonScriptureDisplay', b.scripture || '골로새서 2장 6절 ~ 7절');
  setText('scriptureBody', b.scripture_text || '말씀을 묵상하며 은혜를 나눕니다.');

  // 4. Worship Flow with Colored Row Highlights and Badges
  const worshipContainer = document.getElementById('worshipFlowTableBody');
  if (worshipContainer && Array.isArray(b.order_of_worship)) {
    worshipContainer.innerHTML = b.order_of_worship.map(item => {
      const rowClass = getWorshipRowClass(item.title);
      const leaderBadge = getLeaderBadgeHtml(item.leader);
      return `
        <tr class="${rowClass}">
          <td class="col-order-title">${escapeHtml(item.title)}</td>
          <td class="col-order-leader">${leaderBadge}</td>
          <td class="col-order-detail">${escapeHtml(item.detail || '')}</td>
        </tr>
      `;
    }).join('');
  }

  // 5. Special Choir Highlights
  setText('choirEmmanuelTitle', b.choir_emmanuel || '참 좋으신 주님 - 1부 (권사 중심 은혜 찬양)');
  setText('choirZionTitle', b.choir_zion || '주의 은혜라 - 2부 대예배');
  setText('choirHephzibahTitle', b.choir_hephzibah || '나의 힘이 되신 여호와여 - 수요예배 특송');

  // 6. Announcements with Distinct Color Categories
  const announceContainer = document.getElementById('announcementsList');
  if (announceContainer && Array.isArray(b.announcements)) {
    announceContainer.innerHTML = b.announcements.map(a => {
      const catClass = getCategoryBadgeClass(a.category);
      return `
        <li class="announcement-item">
          <span class="announcement-badge ${catClass}">${escapeHtml(a.category || '알림')}</span>
          <div class="announcement-content">${escapeHtml(a.content)}</div>
        </li>
      `;
    }).join('');
  }

  // 7. Next Week Prayers & Service
  const next = b.next_prayers || {};
  if (next.next_date) {
    const nd = new Date(next.next_date + 'T00:00:00');
    setText('nextWeekDateLabel', `${nd.getMonth() + 1}월 ${nd.getDate()}일 다음 주`);
  }
  setText('nextPrayer1', next.prayer_1 || '최선호 권사 (1부)');
  setText('nextPrayer2', next.prayer_2 || '이원철 장로 (2부)');
  setText('nextFlower', next.flower || '정영근 장로 가정');
  setText('nextKitchen', next.kitchen || '제4구역 (남선교회)');
  setText('nextUsher', next.usher || '김성수 안수집사, 박영숙 권사');
}

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
