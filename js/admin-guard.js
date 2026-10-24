// ==========================================================================
// admin-guard.js - Role Verification & Admin Dashboard Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const authStateLoading = document.getElementById('authStateLoading');
  const loggedOutSection = document.getElementById('loggedOutSection');
  const loggedInSection = document.getElementById('loggedInSection');
  const pendingAlert = document.getElementById('pendingAlert');
  const adminPanel = document.getElementById('adminPanel');
  const usersTabBtn = document.getElementById('usersTabBtn');
  const usersTabPane = document.getElementById('usersTabPane');
  const editorTabPane = document.getElementById('editorTabPane');

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

function populateEditorForm(b) {
  if (!b) return;

  document.getElementById('editPublishDate').value = b.publish_date || '';
  document.getElementById('editThemeVerse').value = b.theme_verse || '';
  document.getElementById('editSermonTitle').value = b.sermon_title || '';
  document.getElementById('editPreacher').value = b.preacher || '이은혜 담임목사';
  document.getElementById('editScripture').value = b.scripture || '';
  document.getElementById('editScriptureText').value = b.scripture_text || '';
  document.getElementById('editChoirZion').value = b.choir_zion || '';
  document.getElementById('editChoirEmmanuel').value = b.choir_emmanuel || '';
  document.getElementById('editChoirHephzibah').value = b.choir_hephzibah || '';
  document.getElementById('editIsPublished').checked = Boolean(b.is_published);

  // Render Worship Flow list
  renderWorshipOrderRows(b.order_of_worship || []);

  // Render Announcements list
  renderAnnouncementRows(b.announcements || []);

  // Next prayers
  const next = b.next_prayers || {};
  document.getElementById('editNextDate').value = next.next_date || '';
  document.getElementById('editNextPrayer1').value = next.prayer_1 || '';
  document.getElementById('editNextPrayer2').value = next.prayer_2 || '';
  document.getElementById('editNextFlower').value = next.flower || '';
  document.getElementById('editNextKitchen').value = next.kitchen || '';
  document.getElementById('editNextUsher').value = next.usher || '';
}

function renderWorshipOrderRows(items) {
  const container = document.getElementById('worshipOrderContainer');
  if (!container) return;

  container.innerHTML = items.map((item, idx) => `
    <div class="dynamic-item-card" data-idx="${idx}">
      <button type="button" class="btn-remove-row" onclick="removeWorshipRow(${idx})">✕</button>
      <div class="form-grid form-grid-2">
        <div class="form-group">
          <label class="form-label">순서명 (예: 경배와 찬양, 성경봉독)</label>
          <input type="text" class="form-input worship-title" value="${escapeHtml(item.title || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">인도자 / 담당 (예: 다함께, 인도자)</label>
          <input type="text" class="form-input worship-leader" value="${escapeHtml(item.leader || '')}">
        </div>
      </div>
      <div class="form-group" style="margin-top:6px;">
        <label class="form-label">세부 내용 / 찬송가 / 구절</label>
        <input type="text" class="form-input worship-detail" value="${escapeHtml(item.detail || '')}">
      </div>
    </div>
  `).join('');
}

window.addWorshipRow = function() {
  const container = document.getElementById('worshipOrderContainer');
  const count = container.children.length;
  const div = document.createElement('div');
  div.className = 'dynamic-item-card';
  div.dataset.idx = count;
  div.innerHTML = `
    <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">✕</button>
    <div class="form-grid form-grid-2">
      <div class="form-group">
        <label class="form-label">순서명</label>
        <input type="text" class="form-input worship-title" required>
      </div>
      <div class="form-group">
        <label class="form-label">인도자 / 담당</label>
        <input type="text" class="form-input worship-leader" value="다함께">
      </div>
    </div>
    <div class="form-group" style="margin-top:6px;">
      <label class="form-label">세부 내용 / 찬송가 / 구절</label>
      <input type="text" class="form-input worship-detail">
    </div>
  `;
  container.appendChild(div);
};

window.removeWorshipRow = function(idx) {
  const card = document.querySelector(`#worshipOrderContainer .dynamic-item-card[data-idx="${idx}"]`);
  if (card) card.remove();
};

function renderAnnouncementRows(items) {
  const container = document.getElementById('announcementsContainer');
  if (!container) return;

  container.innerHTML = items.map((item, idx) => `
    <div class="dynamic-item-card" data-idx="${idx}">
      <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()">✕</button>
      <div class="form-group" style="margin-bottom:6px;">
        <label class="form-label">구분/분류 (예: 예배/모임, 찬양대, 봉사)</label>
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
      <input type="text" class="form-input announce-cat" value="교회 소식">
    </div>
    <div class="form-group">
      <label class="form-label">광고 내용</label>
      <textarea class="form-textarea announce-content" rows="2"></textarea>
    </div>
  `;
  container.appendChild(div);
};

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

  // Collect worship orders
  const worshipRows = document.querySelectorAll('#worshipOrderContainer .dynamic-item-card');
  const orderOfWorship = Array.from(worshipRows).map((row, i) => ({
    order: i + 1,
    title: row.querySelector('.worship-title')?.value.trim() || '',
    leader: row.querySelector('.worship-leader')?.value.trim() || '',
    detail: row.querySelector('.worship-detail')?.value.trim() || ''
  })).filter(item => item.title);

  // Collect announcements
  const announceRows = document.querySelectorAll('#announcementsContainer .dynamic-item-card');
  const announcements = Array.from(announceRows).map(row => ({
    category: row.querySelector('.announce-cat')?.value.trim() || '알림',
    content: row.querySelector('.announce-content')?.value.trim() || ''
  })).filter(item => item.content);

  const payload = {
    publish_date: publishDate,
    theme_verse: document.getElementById('editThemeVerse').value.trim(),
    sermon_title: document.getElementById('editSermonTitle').value.trim(),
    preacher: document.getElementById('editPreacher').value.trim(),
    scripture: document.getElementById('editScripture').value.trim(),
    scripture_text: document.getElementById('editScriptureText').value.trim(),
    choir_zion: document.getElementById('editChoirZion').value.trim(),
    choir_emmanuel: document.getElementById('editChoirEmmanuel').value.trim(),
    choir_hephzibah: document.getElementById('editChoirHephzibah').value.trim(),
    order_of_worship: orderOfWorship,
    announcements: announcements,
    next_prayers: {
      next_date: document.getElementById('editNextDate').value.trim(),
      prayer_1: document.getElementById('editNextPrayer1').value.trim(),
      prayer_2: document.getElementById('editNextPrayer2').value.trim(),
      flower: document.getElementById('editNextFlower').value.trim(),
      kitchen: document.getElementById('editNextKitchen').value.trim(),
      usher: document.getElementById('editNextUsher').value.trim()
    },
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
    alert('주보가 성공적으로 저장 및 반영되었습니다!');
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
