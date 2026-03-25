/* ============================================
   AgriCore — Admin Dashboard Logic
   Handles deletion request management,
   user management, and system stats.
   ============================================ */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // =============================================
  //  AUTH CHECK — admin only
  // =============================================
  var user = AgriCore.getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  // API base: adjust this to match your backend URL
  var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';
  var token = user.token || '';

  function apiHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    };
  }

  // =============================================
  //  DOM REFERENCES
  // =============================================
  var sidebar = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var topbarTitle = document.getElementById('topbarTitle');
  var sidebarAvatar = document.getElementById('sidebarAvatar');
  var sidebarUserName = document.getElementById('sidebarUserName');
  var topbarAvatar = document.getElementById('topbarAvatar');

  // Stats
  var statTotalUsers = document.getElementById('statTotalUsers');
  var statTotalFarmers = document.getElementById('statTotalFarmers');
  var statTotalPlans = document.getElementById('statTotalPlans');
  var statPendingDeletions = document.getElementById('statPendingDeletions');

  // Lists
  var overviewDeletionsList = document.getElementById('overviewDeletionsList');
  var deletionRequestList = document.getElementById('deletionRequestList');
  var usersTableBody = document.getElementById('usersTableBody');
  var deletionDot = document.getElementById('deletionDot');

  // Modal
  var reviewModal = document.getElementById('reviewModal');
  var reviewModalTitle = document.getElementById('reviewModalTitle');
  var reviewModalDesc = document.getElementById('reviewModalDesc');
  var adminNotes = document.getElementById('adminNotes');
  var reviewApproveBtn = document.getElementById('reviewApproveBtn');
  var reviewRejectBtn = document.getElementById('reviewRejectBtn');
  var reviewCancelBtn = document.getElementById('reviewCancelBtn');

  // =============================================
  //  USER INFO
  // =============================================
  var initials = AgriCore.getInitials(user.name);
  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (topbarAvatar) topbarAvatar.textContent = initials;
  if (sidebarUserName) sidebarUserName.textContent = user.name;

  // =============================================
  //  SIDEBAR / NAVIGATION
  // =============================================
  var titleMap = {
    'overview': 'Admin Overview',
    'deletions': 'Deletion Requests',
    'users': 'All Users',
  };

  function switchPanel(panelName) {
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.remove('active');
    });
    var target = document.getElementById('panel-' + panelName);
    if (target) target.classList.add('active');
    if (topbarTitle) topbarTitle.textContent = titleMap[panelName] || 'Admin';

    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.classList.remove('active');
    });
    var sidebarItem = document.querySelector('.nav-item[data-panel="' + panelName + '"]');
    if (sidebarItem) sidebarItem.classList.add('active');

    // Close mobile sidebar
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  document.querySelectorAll('.nav-item[data-panel]').forEach(function (item) {
    item.addEventListener('click', function () {
      switchPanel(item.getAttribute('data-panel'));
    });
  });

  // Sidebar toggle (mobile)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function () {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Logout
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      AgriCore.clearCurrentUser();
      window.location.href = 'login.html';
    });
  }

  // View all deletions shortcut
  var viewAllDeletionsBtn = document.getElementById('viewAllDeletionsBtn');
  if (viewAllDeletionsBtn) {
    viewAllDeletionsBtn.addEventListener('click', function () {
      switchPanel('deletions');
    });
  }

  // Refresh button
  var refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      loadAllData();
    });
  }

  // =============================================
  //  API CALLS
  // =============================================

  function apiFetch(path) {
    return fetch(API_BASE + path, { headers: apiHeaders() })
      .then(function (res) { return res.json(); })
      .catch(function () { return { success: false, error: 'Network error' }; });
  }

  function apiPost(path, body) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(body || {}),
    })
      .then(function (res) { return res.json(); })
      .catch(function () { return { success: false, error: 'Network error' }; });
  }

  // =============================================
  //  LOAD DATA
  // =============================================

  function loadAllData() {
    loadStats();
    loadDeletionRequests();
    loadUsers();
  }

  // ------ Stats ------
  function loadStats() {
    apiFetch('/admin/stats').then(function (res) {
      if (res.success && res.data) {
        var d = res.data;
        if (statTotalUsers) statTotalUsers.textContent = d.totalUsers.toLocaleString();
        if (statTotalFarmers) statTotalFarmers.textContent = d.totalFarmers.toLocaleString();
        if (statTotalPlans) statTotalPlans.textContent = d.totalPlans.toLocaleString();
        if (statPendingDeletions) statPendingDeletions.textContent = d.pendingDeletions.toLocaleString();
        if (deletionDot) deletionDot.style.display = d.pendingDeletions > 0 ? '' : 'none';
      }
    });
  }

  // ------ Deletion Requests ------
  var currentFilter = '';

  function loadDeletionRequests(status) {
    if (status !== undefined) currentFilter = status;
    var url = '/admin/deletions' + (currentFilter ? '?status=' + currentFilter : '');

    apiFetch(url).then(function (res) {
      if (!res.success || !res.data) {
        renderDeletionList(deletionRequestList, []);
        renderDeletionList(overviewDeletionsList, []);
        return;
      }
      renderDeletionList(deletionRequestList, res.data);
      // Overview shows only latest 5 pending
      var pending = res.data.filter(function (r) { return r.status === 'pending'; });
      renderDeletionList(overviewDeletionsList, pending.slice(0, 5));
    });
  }

  function renderDeletionList(container, requests) {
    if (!container) return;
    if (!requests || requests.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="inbox"></i><p>No requests found</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = requests.map(function (req) {
      var userData = req.users || {};
      var name = AgriCore.escapeHtml(userData.name || 'Unknown');
      var email = AgriCore.escapeHtml(userData.email || '');
      var initials = AgriCore.getInitials(userData.name || '??');
      var reason = AgriCore.escapeHtml(req.reason || 'No reason provided');
      var date = new Date(req.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      var actionsHtml = '';
      if (req.status === 'pending') {
        actionsHtml = '<div class="request-actions">' +
          '<button class="btn-approve" data-action="approve" data-id="' + req.id + '" data-name="' + name + '">Approve</button>' +
          '<button class="btn-reject" data-action="reject" data-id="' + req.id + '" data-name="' + name + '">Reject</button>' +
          '</div>';
      }

      return '<div class="request-card">' +
        '<div class="request-avatar">' + initials + '</div>' +
        '<div class="request-info">' +
        '<div class="request-name">' + name + '</div>' +
        '<div class="request-email">' + email + '</div>' +
        '<div class="request-reason">Reason: ' + reason + '</div>' +
        '</div>' +
        '<div class="request-meta">' +
        '<span class="request-date">' + date + '</span>' +
        '<span class="request-status ' + req.status + '">' + req.status + '</span>' +
        '</div>' +
        actionsHtml +
        '</div>';
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindRequestActions(container);
  }

  // ------ Deletion Filter Tabs ------
  var deletionFilters = document.getElementById('deletionFilters');
  if (deletionFilters) {
    deletionFilters.addEventListener('click', function (e) {
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;
      deletionFilters.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      loadDeletionRequests(tab.getAttribute('data-status'));
    });
  }

  // ------ Approve/Reject actions ------
  var pendingAction = null;

  function bindRequestActions(container) {
    container.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-action');
        var id = btn.getAttribute('data-id');
        var name = btn.getAttribute('data-name');
        openReviewModal(action, id, name);
      });
    });
  }

  function openReviewModal(action, requestId, userName) {
    pendingAction = { action: action, requestId: requestId };

    if (action === 'approve') {
      reviewModalTitle.textContent = 'Approve Deletion Request';
      reviewModalDesc.textContent = 'This will permanently delete ' + userName + '\'s account and all associated data. This action cannot be undone.';
      reviewApproveBtn.style.display = '';
      reviewRejectBtn.style.display = 'none';
    } else {
      reviewModalTitle.textContent = 'Reject Deletion Request';
      reviewModalDesc.textContent = 'The user (' + userName + ') will be notified that their request was rejected. Their account will remain active.';
      reviewApproveBtn.style.display = 'none';
      reviewRejectBtn.style.display = '';
    }

    adminNotes.value = '';
    reviewModal.classList.add('active');
  }

  function closeReviewModal() {
    reviewModal.classList.remove('active');
    pendingAction = null;
  }

  if (reviewCancelBtn) reviewCancelBtn.addEventListener('click', closeReviewModal);
  if (reviewModal) {
    reviewModal.addEventListener('click', function (e) {
      if (e.target === reviewModal) closeReviewModal();
    });
  }

  function processAction() {
    if (!pendingAction) return;
    var action = pendingAction.action;
    var id = pendingAction.requestId;
    var notes = adminNotes.value.trim();

    var url = '/admin/deletions/' + id + '/' + action;
    apiPost(url, { admin_notes: notes || undefined }).then(function (res) {
      if (res.success) {
        AgriCore.showToast(
          action === 'approve' ? 'Account deleted successfully.' : 'Deletion request rejected.',
          'success'
        );
        closeReviewModal();
        loadAllData();
      } else {
        AgriCore.showToast(res.error || 'Action failed.', 'error');
      }
    });
  }

  if (reviewApproveBtn) reviewApproveBtn.addEventListener('click', processAction);
  if (reviewRejectBtn) reviewRejectBtn.addEventListener('click', processAction);

  // ------ Users ------
  var currentUserFilter = '';

  function loadUsers(role) {
    if (role !== undefined) currentUserFilter = role;
    var url = '/admin/users' + (currentUserFilter ? '?role=' + currentUserFilter : '');

    apiFetch(url).then(function (res) {
      if (!res.success || !res.data || res.data.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>No users found</p></td></tr>';
        return;
      }

      usersTableBody.innerHTML = res.data.map(function (u) {
        var date = new Date(u.created_at).toLocaleDateString('en-ZA', {
          year: 'numeric', month: 'short', day: 'numeric',
        });
        return '<tr>' +
          '<td>' + AgriCore.escapeHtml(u.name) + '</td>' +
          '<td>' + AgriCore.escapeHtml(u.email) + '</td>' +
          '<td><span class="role-badge ' + u.role + '">' + u.role + '</span></td>' +
          '<td>' + AgriCore.escapeHtml(u.phone || '—') + '</td>' +
          '<td>' + date + '</td>' +
          '</tr>';
      }).join('');
    });
  }

  var userFilters = document.getElementById('userFilters');
  if (userFilters) {
    userFilters.addEventListener('click', function (e) {
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;
      userFilters.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      loadUsers(tab.getAttribute('data-role'));
    });
  }

  // =============================================
  //  INITIAL LOAD
  // =============================================
  loadAllData();
});
