// ==========================================================================
// admin-guard.js - HanYoung Church Admin Dashboard & Editor Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const authStateLoading = document.getElementById('authStateLoading');
  const loggedOutSection = document.getElementById('loggedOutSection');
  const loggedInSection = document.getElementById('loggedInSection');
  const pendingAlert = document.getElementById('pendingAlert');
  const adminPanel = document.getElementById('adminPanel');
  const usersTabBtn = document.getElementById('usersTabBtn');

  // Attach Google Login Button
  const btnGoogleLogin = document.getElementById('btnGoogleLogin');
  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => GraceAuth.signInWithGoogle());
  }

  // Attach Logout Button
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => GraceAuth.signOut());
  }

  // Initialize and check current user
  try {
    const user = await GraceAuth.getCurrentUser();
    if (authStateLoading) authStateLoading.style.display = 'none';

    if (!user) {
      if (loggedOutSection) loggedOutSection.style.display = 'block';
      if (loggedInSection) loggedInSection.style.display = 'none';
      return;
    }

    // User is logged in
    if (loggedOutSection) loggedOutSection.style.display = 'none';
    if (loggedInSection) loggedInSection.style.display = 'block';

    // Populate user info header
    const adminUserName = document.getElementById('adminUserName');
    const adminUserRoleBadge = document.getElementById('adminUserRoleBadge');
    if (adminUserName) adminUserName.textContent = `${user.name} (${user.email})`;
    if (adminUserRoleBadge) {
      adminUserRoleBadge.textContent = getRoleLabel(user.role);
      adminUserRoleBadge.className = `user-badge badge-${user.role}`;
    }
    if (btnLogout) btnLogout.style.display = 'inline-block';

    // Role-based Access Control
    if (user.role === 'pending') {
      if (pendingAlert) pendingAlert.style.display = 'block';
      if (adminPanel) adminPanel.style.display = 'none';
      return;
    }

    // Approved: editor or admin
    if (pendingAlert) pendingAlert.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';

    if (user.role === 'admin') {
      if (usersTabBtn) usersTabBtn.style.display = 'inline-block';
      loadUserManagementTable();
    } else {
      if (usersTabBtn) usersTabBtn.style.display = 'none';
    }

    // Load Bulletin Editor with current bulletin data
    loadBulletinEditor();

  } catch (err) {
    console.error('Initialization error in admin-guard:', err);
    if (authStateLoading) authStateLoading.style.display = 'none';
    if (loggedOutSection) loggedOutSection.style.display = 'block';
  }
});

function getRoleLabel(role) {
  switch (role) {
    case 'admin': return '최고관리자 (Admin)';
    case 'editor': return '승인 편집자 (Editor)';
    case 'pending':
    default: return '승인 대기중 (Pending)';
  }
}

/**
 * Tab Switching Logic
 */
window.switchAdminTab = function(tabName) {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(t => t.classList.remove('active'));
  panes.forEach(p => p.style.display = 'none');

  if (tabName === 'editor') {
    document.getElementById('editorTabBtn')?.classList.add('active');
    document.getElementById('editorTabPane').style.display = 'block';
  } else if (tabName === 'users') {
    document.getElementById('usersTabBtn')?.classList.add('active');
    document.getElementById('usersTabPane').style.display = 'block';
    loadUserManagementTable();
  }
};

/**
 * Load and render User Approval Table (Admin Only)
 */
async function loadUserManagementTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">사용자 목록을 불러오는 중...</td></tr>';

  try {
    const profiles = await GraceClient.fetchProfiles();
    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">등록된 사용자가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = profiles.map(p => `
      <tr>
        <td><strong>${escapeHtml(p.full_name || '이름 없음')}</strong></td>
        <td>${escapeHtml(p.email || '-')}</td>
        <td>
          <span class="user-badge badge-${p.role || 'pending'}">
            ${getRoleLabel(p.role || 'pending')}
          </span>
        </td>
        <td>${p.created_at ? new Date(p.created_at).toLocaleDateString('ko-KR') : '-'}</td>
        <td>
          ${p.role !== 'editor' ? `<button class="btn-role-action btn-role-approve" onclick="changeUserRole('${p.id}', 'editor')">편집자 승인</button>` : ''}
          ${p.role !== 'admin' ? `<button class="btn-role-action" onclick="changeUserRole('${p.id}', 'admin')">관리자 승격</button>` : ''}
          ${p.role !== 'pending' ? `<button class="btn-role-action" onclick="changeUserRole('${p.id}', 'pending')">대기로 변경</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load profiles:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center; padding: 20px;">권한 부족 또는 불러오기 오류: ${escapeHtml(err.message)}</td></tr>`;
  }
}

window.changeUserRole = async function(userId, newRole) {
  if (!confirm(`사용자 권한을 '${getRoleLabel(newRole)}'(으)로 변경하시겠습니까?`)) return;

  try {
    await GraceClient.updateUserRole(userId, newRole);
    alert('권한이 성공적으로 변경되었습니다.');
    loadUserManagementTable();
  } catch (err) {
    alert('권한 변경 실패: ' + err.message);
  }
};

/**
 * Load Bulletin Data into Editor Form
 */
let currentEditingBulletin = null;

async function loadBulletinEditor() {
  try {
    const bulletin = await GraceClient.fetchLatestBulletin();
    currentEditingBulletin = bulletin;
    populateEditorForm(bulletin);
  } catch (err) {
    console.error('Error loading bulletin into editor:', err);
  }
}

window.loadPreviousWeekBulletin = async function() {
  if (!confirm('현재 에디터에 지난주 주보 내용을 복사하여 불러오시겠습니까?')) return;
  loadBulletinEditor();
};

function populateEditorForm(b) {
  if (!b) return;

  document.getElementById('editPublishDate').value = b.publish_date || '';
  document.getElementById('editPreacher').value = b.pastor || b.preacher || '송선우 담임목사';
  document.getElementById('editSermonTitle').value = b.title || b.sermon_title || '그리스도인의 삶의 자세';
  document.getElementById('editScripture').value = b.sermon_scripture || b.scripture || '눅 19:1-10';
  document.getElementById('editReadingWeek').value = b.bible_reading_week || '월~토: 마태복음 21장 ~ 마가복음 15장';
  document.getElementById('editThemeVerse').value = b.theme_verse || '요한복음 14:17-18';

  document.getElementById('editChoirZion').value = b.choir_zion || '주의 은혜라';
  document.getElementById('editChoirEmmanuel').value = b.choir_emmanuel || '권사 중심 은혜 찬양';
  document.getElementById('editChoirHephzibah').value = b.choir_hephzibah || '수요 헌신 특송';

  // Announcements
  renderAnnouncementRows(b.announcements || []);

  // Offering Records Parser
  const offerings = b.offering_records || {};
  document.getElementById('editTitheText').value = (offerings.tithe || []).join(', ');
  document.getElementById('editThanksText').value = (offerings.thanksgiving || []).join(', ');
  document.getElementById('editMissionText').value = (offerings.mission || []).join(', ');
}

function renderAnnouncementRows(items) {
  const container = document.getElementById('announcementsContainer');
  if (!container) return;

  container.innerHTML = items.map((item, idx) => `
    <div class="dynamic-item-card" data-idx="${idx}">
      <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">✕</button>
      <div class="form-group" style="margin-bottom:6px;">
        <label class="form-label">구분/분류 (예: 환영, 성도소식, 봉사/섬김, 찬양대)</label>
        <input type="text" class="form-input announce-cat" value="${escapeHtml(item.category || '')}">
      </div>
      <div class="form-group">
        <label class="form-label">광고 내용</label>
        <textarea class="form-textarea announce-content" rows="2">${escapeHtml(item.content || '')}</textarea>
      </div>
    </div>
  `).join('');
}

window.addAnnouncementRow = function() {
  const container = document.getElementById('announcementsContainer');
  const div = document.createElement('div');
  div.className = 'dynamic-item-card';
  div.innerHTML = `
    <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">✕</button>
    <div class="form-group" style="margin-bottom:6px;">
      <label class="form-label">구분/분류</label>
      <input type="text" class="form-input announce-cat" value="성도소식">
    </div>
    <div class="form-group">
      <label class="form-label">광고 내용</label>
      <textarea class="form-textarea announce-content" rows="2"></textarea>
    </div>
  `;
  container.appendChild(div);
};

function parseNames(text) {
  if (!text) return [];
  return text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Handle Bulletin Save / Publish Form Submit
 */
window.handleSaveBulletin = async function(e) {
  e.preventDefault();

  const publishDate = document.getElementById('editPublishDate').value;
  if (!publishDate) {
    alert('발행 일자를 입력해 주세요.');
    return;
  }

  // Collect announcements
  const announceRows = document.querySelectorAll('#announcementsContainer .dynamic-item-card');
  const announcements = Array.from(announceRows).map(row => ({
    category: row.querySelector('.announce-cat')?.value.trim() || '알림',
    content: row.querySelector('.announce-content')?.value.trim() || ''
  })).filter(item => item.content);

  // Parse offerings
  const offeringRecords = {
    tithe: parseNames(document.getElementById('editTitheText').value),
    thanksgiving: parseNames(document.getElementById('editThanksText').value),
    mission: parseNames(document.getElementById('editMissionText').value),
    special: currentEditingBulletin?.offering_records?.special || []
  };

  const payload = {
    publish_date: publishDate,
    title: document.getElementById('editSermonTitle').value.trim(),
    sermon_title: document.getElementById('editSermonTitle').value.trim(),
    pastor: document.getElementById('editPreacher').value.trim(),
    preacher: document.getElementById('editPreacher').value.trim(),
    sermon_scripture: document.getElementById('editScripture').value.trim(),
    scripture: document.getElementById('editScripture').value.trim(),
    bible_reading_week: document.getElementById('editReadingWeek').value.trim(),
    theme_verse: document.getElementById('editThemeVerse').value.trim(),
    choir_zion: document.getElementById('editChoirZion').value.trim(),
    choir_emmanuel: document.getElementById('editChoirEmmanuel').value.trim(),
    choir_hephzibah: document.getElementById('editChoirHephzibah').value.trim(),
    announcements: announcements,
    offering_records: offeringRecords,
    service_orders: currentEditingBulletin?.service_orders || {},
    bible_quiz: currentEditingBulletin?.bible_quiz || [],
    is_published: document.getElementById('editIsPublished').checked,
    updated_at: new Date().toISOString()
  };

  const btnSave = document.getElementById('btnSaveBulletin');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = '저장 중...';
  }

  try {
    await GraceClient.upsertBulletin(payload);
    alert('한영교회 주보가 성공적으로 저장 및 발행되었습니다!');
  } catch (err) {
    console.error('Error saving bulletin:', err);
    alert('저장 실패: ' + err.message);
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = '주보 저장 및 발행';
    }
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
