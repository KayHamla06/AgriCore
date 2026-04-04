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
    window.location.href = '/auth/login';
    return;
  }

  // API base: adjust this to match your backend URL
  var API_BASE = window.AGRICORE_API_BASE || '/api';
  var authRedirecting = false;
  var notifPollTimer = null;
  var notifPollDelayMs = 60000;

  function getToken() {
    var u = AgriCore.getCurrentUser();
    return (u && u.token) ? u.token : '';
  }

  function apiHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
    };
  }

  function handleUnauthorized() {
    if (authRedirecting) return;
    authRedirecting = true;
    AgriCore.clearCurrentUser();
    AgriCore.showToast('Session expired. Please log in again.', 'error');
    setTimeout(function() { window.location.href = '/auth/login'; }, 300);
  }

  function verifyAdminSession() {
    return fetch(API_BASE + '/auth/me', {
      method: 'GET',
      headers: apiHeaders()
    }).then(function(res) {
      if (!res.ok) {
        handleUnauthorized();
        return false;
      }
      return res.json().then(function(body) {
        return !!(body && body.success && body.data && body.data.role === 'admin');
      }).catch(function() { return false; });
    }).catch(function() {
      return false;
    });
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
  var adminDashboardContent = document.getElementById('adminDashboardContent');
  var adminDataLoader = document.getElementById('adminDataLoader');

  // Stats
  var statTotalUsers = document.getElementById('statTotalUsers');
  var statTotalFarmers = document.getElementById('statTotalFarmers');
  var statTotalPlans = document.getElementById('statTotalPlans');
  var statPendingDeletions = document.getElementById('statPendingDeletions');

  // Lists
  var overviewDeletionsList = document.getElementById('overviewDeletionsList');
  var deletionRequestList = document.getElementById('deletionRequestList');
  var usersTableBody = document.getElementById('usersTableBody');
  var usersDebugMeta = document.getElementById('usersDebugMeta');
  var deletionDot = document.getElementById('deletionDot');

  var usersDebugEnabled = (function () {
    try {
      var query = new URLSearchParams(window.location.search || '');
      if (query.get('debugUsers') === '1') return true;
      return localStorage.getItem('agricore_debug_users') === '1';
    } catch (_e) {
      return false;
    }
  })();

  function setUsersDebugMeta(text) {
    if (!usersDebugMeta || !usersDebugEnabled) return;
    usersDebugMeta.style.display = 'block';
    usersDebugMeta.textContent = text;
  }

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
    'user-detail': 'User Details',
    'verification': 'Verification Requests',
    'data-approval': 'Data Approval',
    'tickets': 'Support Tickets',
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
      window.location.href = '/auth/login';
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
    if (authRedirecting) return Promise.resolve({ success: false, error: 'Session expired' });
    return fetch(API_BASE + path, {
        headers: apiHeaders()
    }).then(function(res) {
        if (res.status === 401) {
        handleUnauthorized();
            return { success: false, error: 'Session expired' };
        }
        return res.json().then(function(body) {
            if (!res.ok) {
                return { success: false, error: (body && body.error) || 'Server error: ' + res.status };
            }
            return body;
        }).catch(function() {
            return { success: false, error: 'Server error: ' + res.status };
        });
    }).catch(function(err) {
        console.error('[Admin] Network error on ' + path, err);
        return { success: false, error: 'Network error' };
    });
  }

  function apiPost(path, body) {
    if (authRedirecting) return Promise.resolve({ success: false, error: 'Session expired' });
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify(body || {}),
    })
      .then(function (res) {
        if (res.status === 401) {
          handleUnauthorized();
          return { success: false, error: 'Session expired' };
        }
        return res.json().then(function(data) {
          if (!res.ok) return { success: false, error: (data && data.error) || 'Server error: ' + res.status };
          return data;
        }).catch(function() { return { success: false, error: 'Server error: ' + res.status }; });
      })
      .catch(function () { return { success: false, error: 'Network error' }; });
  }

  function apiPut(path, body) {
    if (authRedirecting) return Promise.resolve({ success: false, error: 'Session expired' });
    return fetch(API_BASE + path, {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify(body || {}),
    })
      .then(function (res) {
        if (res.status === 401) {
          handleUnauthorized();
          return { success: false, error: 'Session expired' };
        }
        return res.json().then(function(data) {
          if (!res.ok) return { success: false, error: (data && data.error) || 'Server error: ' + res.status };
          return data;
        }).catch(function() { return { success: false, error: 'Server error: ' + res.status }; });
      })
      .catch(function () { return { success: false, error: 'Network error' }; });
  }

  // =============================================
  //  LOAD DATA
  // =============================================

  function showAdminLoader() {
    if (adminDashboardContent) adminDashboardContent.classList.add('farmer-panel-loading');
    if (adminDataLoader) adminDataLoader.classList.remove('hidden');
  }

  function hideAdminLoader() {
    if (adminDataLoader) adminDataLoader.classList.add('hidden');
  }

  function loadAllData() {
    return Promise.allSettled([
      loadStats(),
      loadDeletionRequests(),
      loadUsers(),
      loadVerificationRequests(),
      loadDataApprovalRequests(),
      loadTickets(),
      loadAdminNotifications(),
    ]);
  }

  // ------ Stats ------
  function loadStats() {
    var pStats = apiFetch('/admin/stats').then(function (res) {
      if (res.success && res.data) {
        var d = res.data;
        if (statTotalUsers) statTotalUsers.textContent = d.totalUsers.toLocaleString();
        if (statTotalFarmers) statTotalFarmers.textContent = d.totalFarmers.toLocaleString();
        if (statTotalPlans) statTotalPlans.textContent = d.totalPlans.toLocaleString();
        if (statPendingDeletions) statPendingDeletions.textContent = d.pendingDeletions.toLocaleString();
        if (deletionDot) deletionDot.style.display = d.pendingDeletions > 0 ? '' : 'none';

        // Ticket stats
        var statOpenTickets = document.getElementById('statOpenTickets');
        if (statOpenTickets) statOpenTickets.textContent = (d.openTickets || 0).toLocaleString();
        var ticketDot = document.getElementById('ticketDot');
        if (ticketDot) ticketDot.style.display = (d.openTickets || 0) > 0 ? '' : 'none';
      }
    });

    // Load verification stats
    var pVer = apiFetch('/verification/pending').then(function (res) {
      var count = (res.success && res.data) ? res.data.length : 0;
      var el = document.getElementById('statPendingVerifications');
      if (el) el.textContent = count.toLocaleString();
      var dot = document.getElementById('verificationDot');
      if (dot) dot.style.display = count > 0 ? '' : 'none';
    });

    // Load data approval stats
    var pData = apiFetch('/data-approval/stats').then(function (res) {
      if (res.success && res.data) {
        var el = document.getElementById('statPendingData');
        if (el) el.textContent = res.data.pendingData.toLocaleString();
        var dot = document.getElementById('dataApprovalDot');
        if (dot) dot.style.display = res.data.pendingData > 0 ? '' : 'none';
      }
    });

    return Promise.allSettled([pStats, pVer, pData]);
  }

  // ------ Deletion Requests ------
  var currentFilter = '';

  function loadDeletionRequests(status) {
    if (status !== undefined) currentFilter = status;
    var url = '/admin/deletions' + (currentFilter ? '?status=' + currentFilter : '');

    return apiFetch(url).then(function (res) {
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
  var lastUsersCache = [];
  var usersRetryTimer = null;

  function getActiveUsersFilterFromUi() {
    var active = document.querySelector('#userFilters .filter-tab.active');
    if (!active) return '';
    return active.getAttribute('data-role') || '';
  }

  function scheduleUsersRetry(delayMs) {
    if (usersRetryTimer) clearTimeout(usersRetryTimer);
    usersRetryTimer = setTimeout(function() {
      loadUsers();
    }, delayMs || 3000);
  }

  function renderUsersTable(users) {
    if (!usersTableBody) return;
    if (!users || users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>No users found</p></td></tr>';
      return;
    }

    usersTableBody.innerHTML = users.map(function (u) {
      var createdAt = u && u.created_at ? new Date(u.created_at) : null;
      var date = createdAt && !isNaN(createdAt.getTime()) ? createdAt.toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
      }) : '—';
      var verStatus = (u && u.verification_status) || 'unverified';
      var roleName = (u && u.role) || 'farmer';
      var userName = (u && u.name) || 'Unknown User';
      var userEmail = (u && u.email) || '—';
      var verBadge = '';
      if (verStatus === 'verified') {
        var badgeClass = roleName === 'farmer' ? 'badge-verified-farmer' : 'badge-verified-gov';
        verBadge = '<span class="ver-badge ' + badgeClass + '">✓</span>';
      } else if (verStatus === 'pending') {
        verBadge = '<span class="ver-badge badge-pending">⏳</span>';
      } else {
        verBadge = '<span class="ver-badge badge-unverified">✗</span>';
      }
      return '<tr data-user-id="' + (u && u.id ? u.id : '') + '">' +
        '<td>' + AgriCore.escapeHtml(userName) + ' ' + verBadge + '</td>' +
        '<td>' + AgriCore.escapeHtml(userEmail) + '</td>' +
        '<td><span class="role-badge ' + roleName + '">' + roleName + '</span></td>' +
        '<td><span class="ver-status-badge ' + verStatus + '">' + verStatus + '</span></td>' +
        '<td>' + AgriCore.escapeHtml((u && u.phone) || '—') + '</td>' +
        '<td>' + date + '</td>' +
        '</tr>';
    }).join('');

    usersTableBody.querySelectorAll('tr[data-user-id]').forEach(function(row) {
      row.addEventListener('click', function() {
        openUserDetail(row.getAttribute('data-user-id'));
      });
    });
  }

  function loadUsers(role) {
    if (role !== undefined) {
      currentUserFilter = role;
    } else {
      currentUserFilter = getActiveUsersFilterFromUi();
    }
    var url = '/admin/users' + (currentUserFilter ? '?role=' + currentUserFilter : '');

    if (!usersTableBody) return Promise.resolve();

    return apiFetch(url).then(function (res) {
      var users = (res && res.success && Array.isArray(res.data)) ? res.data : [];
      var at = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (!res || !res.success) {
        setUsersDebugMeta('[Users API] failed at ' + at + ' | filter=' + (currentUserFilter || 'all') + ' | error=' + ((res && res.error) || 'unknown'));
        if (lastUsersCache.length > 0) {
          renderUsersTable(lastUsersCache);
        } else {
          usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>Failed to load users. Retrying...</p></td></tr>';
        }

        if ((res && typeof res.error === 'string' && res.error.indexOf('429') > -1) || (res && res.error === 'Network error')) {
          scheduleUsersRetry(5000);
        }
        return;
      } else {
        setUsersDebugMeta('[Users API] ok at ' + at + ' | filter=' + (currentUserFilter || 'all') + ' | returned=' + users.length);
      }

      lastUsersCache = users;
      renderUsersTable(users);
    }).catch(function() {
      var at = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setUsersDebugMeta('[Users API] network/parsing error at ' + at + ' | filter=' + (currentUserFilter || 'all'));
      if (lastUsersCache.length > 0) {
        renderUsersTable(lastUsersCache);
      } else {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>Failed to load users. Retrying...</p></td></tr>';
      }
      scheduleUsersRetry(5000);
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
  //  VERIFICATION REQUESTS
  // =============================================
  var verificationRequestList = document.getElementById('verificationRequestList');
  var currentVerFilter = 'pending';

  function loadVerificationRequests(vstatus) {
    if (vstatus !== undefined) currentVerFilter = vstatus;
    var url = currentVerFilter ? '/verification/all?status=' + currentVerFilter : '/verification/all';

    return apiFetch(url).then(function (res) {
      if (!res.success || !res.data || res.data.length === 0) {
        if (verificationRequestList) {
          verificationRequestList.innerHTML = '<div class="empty-state"><i data-lucide="inbox"></i><p>No verification requests</p></div>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        return;
      }
      renderVerificationList(res.data);
    });
  }

  function renderVerificationList(requests) {
    if (!verificationRequestList) return;

    verificationRequestList.innerHTML = requests.map(function (req) {
      var name = AgriCore.escapeHtml(req.name || 'Unknown');
      var email = AgriCore.escapeHtml(req.email || '');
      var initials = AgriCore.getInitials(req.name || '??');
      var status = req.verification_status || 'unverified';
      var docCount = req.documents ? req.documents.length : 0;
      var date = new Date(req.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      var actionsHtml = '';
      if (status === 'pending' && docCount > 0) {
        actionsHtml = '<div class="request-actions">' +
          '<button class="btn-approve" data-ver-action="approve" data-user-id="' + req.id + '" data-user-name="' + name + '">Approve ✓</button>' +
          '<button class="btn-reject" data-ver-action="reject" data-user-id="' + req.id + '" data-user-name="' + name + '">Reject</button>' +
          '<button class="btn btn-ghost btn-sm" data-ver-action="view-docs" data-user-id="' + req.id + '" data-user-name="' + name + '">View Docs (' + docCount + ')</button>' +
          '</div>';
      }

      return '<div class="request-card">' +
        '<div class="request-avatar">' + initials + '</div>' +
        '<div class="request-info">' +
        '<div class="request-name">' + name + ' <span class="role-badge ' + req.role + '">' + req.role + '</span></div>' +
        '<div class="request-email">' + email + '</div>' +
        '<div class="request-reason">Documents: ' + docCount + '</div>' +
        '</div>' +
        '<div class="request-meta">' +
        '<span class="request-date">' + date + '</span>' +
        '<span class="request-status ' + status + '">' + status + '</span>' +
        '</div>' +
        actionsHtml +
        '</div>';
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindVerificationActions();
  }

  function bindVerificationActions() {
    if (!verificationRequestList) return;
    verificationRequestList.querySelectorAll('[data-ver-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-ver-action');
        var userId = btn.getAttribute('data-user-id');
        var userName = btn.getAttribute('data-user-name');

        if (action === 'view-docs') {
          openVerificationModal(userId, userName);
        } else {
          openVerificationModal(userId, userName, action);
        }
      });
    });
  }

  // Verification Modal
  var verificationModal = document.getElementById('verificationModal');
  var verModalTitle = document.getElementById('verModalTitle');
  var verModalUser = document.getElementById('verModalUser');
  var verModalDocs = document.getElementById('verModalDocs');
  var verNotes = document.getElementById('verNotes');
  var verApproveBtn = document.getElementById('verApproveBtn');
  var verRejectBtn = document.getElementById('verRejectBtn');
  var verCancelBtn = document.getElementById('verCancelBtn');
  var pendingVerAction = null;

  function openVerificationModal(userId, userName, action) {
    pendingVerAction = { userId: userId, action: action };
    if (verModalTitle) verModalTitle.textContent = 'Review: ' + userName;
    if (verModalUser) verModalUser.textContent = 'User ID: ' + userId;
    if (verNotes) verNotes.value = '';

    // Load documents
    apiFetch('/verification/all').then(function (res) {
      if (res.success && res.data) {
        var userData = res.data.find(function (u) { return u.id === userId; });
        if (userData && userData.documents && verModalDocs) {
          verModalDocs.innerHTML = userData.documents.map(function (doc) {
            return '<div style="padding:.5rem;border:1px solid var(--gray-200);border-radius:6px;margin-bottom:.5rem;">' +
              '<strong>' + AgriCore.escapeHtml(doc.document_type) + '</strong>' +
              '<span class="request-status ' + doc.status + '" style="margin-left:.5rem;">' + doc.status + '</span>' +
              '<br><a href="' + AgriCore.escapeHtml(doc.file_url) + '" target="_blank" rel="noopener noreferrer" style="font-size:.8125rem;color:var(--primary-600);">View Document</a>' +
              '<br><small style="color:var(--gray-500);">Uploaded: ' + new Date(doc.uploaded_at).toLocaleDateString('en-ZA') + '</small>' +
              '</div>';
          }).join('');
        } else if (verModalDocs) {
          verModalDocs.innerHTML = '<p style="color:var(--gray-500);">No documents uploaded.</p>';
        }
      }
    });

    if (verificationModal) verificationModal.classList.add('active');
  }

  function closeVerificationModal() {
    if (verificationModal) verificationModal.classList.remove('active');
    pendingVerAction = null;
  }

  if (verCancelBtn) verCancelBtn.addEventListener('click', closeVerificationModal);
  if (verificationModal) {
    verificationModal.addEventListener('click', function (e) {
      if (e.target === verificationModal) closeVerificationModal();
    });
  }

  if (verApproveBtn) {
    verApproveBtn.addEventListener('click', function () {
      if (!pendingVerAction) return;
      var notes = verNotes ? verNotes.value.trim() : '';
      apiPost('/verification/' + pendingVerAction.userId + '/approve', { notes: notes || undefined }).then(function (res) {
        if (res.success) {
          AgriCore.showToast('User verified successfully.', 'success');
          closeVerificationModal();
          loadAllData();
        } else {
          AgriCore.showToast(res.error || 'Verification failed.', 'error');
        }
      });
    });
  }

  if (verRejectBtn) {
    verRejectBtn.addEventListener('click', function () {
      if (!pendingVerAction) return;
      var notes = verNotes ? verNotes.value.trim() : '';
      apiPost('/verification/' + pendingVerAction.userId + '/reject', { notes: notes || undefined }).then(function (res) {
        if (res.success) {
          AgriCore.showToast('Verification rejected.', 'success');
          closeVerificationModal();
          loadAllData();
        } else {
          AgriCore.showToast(res.error || 'Action failed.', 'error');
        }
      });
    });
  }

  // Verification filter tabs
  var verificationFilters = document.getElementById('verificationFilters');
  if (verificationFilters) {
    verificationFilters.addEventListener('click', function (e) {
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;
      verificationFilters.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      loadVerificationRequests(tab.getAttribute('data-vstatus'));
    });
  }

  // =============================================
  //  DATA APPROVAL
  // =============================================
  var dataApprovalList = document.getElementById('dataApprovalList');
  var currentDataFilter = 'pending';

  function loadDataApprovalRequests(dstatus) {
    if (dstatus !== undefined) currentDataFilter = dstatus;
    var url = currentDataFilter ? '/data-approval/all?status=' + currentDataFilter : '/data-approval/all';

    return apiFetch(url).then(function (res) {
      if (!res.success || !res.data || res.data.length === 0) {
        if (dataApprovalList) {
          dataApprovalList.innerHTML = '<div class="empty-state"><i data-lucide="inbox"></i><p>No data submissions</p></div>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        return;
      }
      renderDataApprovalList(res.data);
    });
  }

  function renderDataApprovalList(requests) {
    if (!dataApprovalList) return;

    dataApprovalList.innerHTML = requests.map(function (req) {
      var userName = req.users ? AgriCore.escapeHtml(req.users.name || 'Unknown') : 'Unknown';
      var resourceType = AgriCore.escapeHtml((req.resource_type || '').replace('_', ' '));
      var date = new Date(req.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      var actionsHtml = '';
      if (req.status === 'pending') {
        actionsHtml = '<div class="request-actions">' +
          '<button class="btn-approve" data-data-action="approve" data-request-id="' + req.id + '">Approve & Publish</button>' +
          '<button class="btn-reject" data-data-action="reject" data-request-id="' + req.id + '">Reject</button>' +
          '<button class="btn btn-ghost btn-sm" data-data-action="view" data-request-id="' + req.id + '">View Data</button>' +
          '</div>';
      }

      return '<div class="request-card">' +
        '<div class="request-avatar" style="background:var(--primary-100);color:var(--primary-700);"><i data-lucide="database" style="width:16px;height:16px;"></i></div>' +
        '<div class="request-info">' +
        '<div class="request-name">' + resourceType + ' <span style="font-weight:400;color:var(--gray-500);">(' + req.action + ')</span></div>' +
        '<div class="request-email">By: ' + userName + '</div>' +
        '</div>' +
        '<div class="request-meta">' +
        '<span class="request-date">' + date + '</span>' +
        '<span class="request-status ' + req.status + '">' + req.status + '</span>' +
        '</div>' +
        actionsHtml +
        '</div>';
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindDataApprovalActions(requests);
  }

  // Data Approval Modal
  var dataModal = document.getElementById('dataModal');
  var dataModalTitle = document.getElementById('dataModalTitle');
  var dataModalDesc = document.getElementById('dataModalDesc');
  var dataModalPayload = document.getElementById('dataModalPayload');
  var dataNotes = document.getElementById('dataNotes');
  var dataApproveBtn = document.getElementById('dataApproveBtn');
  var dataRejectBtn = document.getElementById('dataRejectBtn');
  var dataCancelBtn = document.getElementById('dataCancelBtn');
  var pendingDataAction = null;

  function bindDataApprovalActions(requests) {
    if (!dataApprovalList) return;
    dataApprovalList.querySelectorAll('[data-data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-data-action');
        var requestId = btn.getAttribute('data-request-id');
        var reqData = requests.find(function (r) { return r.id === requestId; });
        openDataModal(action, requestId, reqData);
      });
    });
  }

  function openDataModal(action, requestId, reqData) {
    pendingDataAction = { requestId: requestId, action: action };
    var resourceType = reqData ? reqData.resource_type : 'unknown';
    if (dataModalTitle) dataModalTitle.textContent = 'Review: ' + resourceType.replace('_', ' ');
    if (dataModalDesc) dataModalDesc.textContent = 'Action: ' + (reqData ? reqData.action : 'unknown') + ' | Resource ID: ' + (reqData ? reqData.resource_id : 'unknown');

    if (dataModalPayload && reqData && reqData.payload) {
      var payloadHtml = Object.keys(reqData.payload).map(function (key) {
        return '<div><strong>' + AgriCore.escapeHtml(key) + ':</strong> ' + AgriCore.escapeHtml(String(reqData.payload[key])) + '</div>';
      }).join('');
      dataModalPayload.innerHTML = payloadHtml;
    } else if (dataModalPayload) {
      dataModalPayload.innerHTML = '<p style="color:var(--gray-500);">No payload data</p>';
    }

    if (dataNotes) dataNotes.value = '';
    if (dataModal) dataModal.classList.add('active');
  }

  function closeDataModal() {
    if (dataModal) dataModal.classList.remove('active');
    pendingDataAction = null;
  }

  if (dataCancelBtn) dataCancelBtn.addEventListener('click', closeDataModal);
  if (dataModal) {
    dataModal.addEventListener('click', function (e) {
      if (e.target === dataModal) closeDataModal();
    });
  }

  if (dataApproveBtn) {
    dataApproveBtn.addEventListener('click', function () {
      if (!pendingDataAction) return;
      var notes = dataNotes ? dataNotes.value.trim() : '';
      apiPost('/data-approval/' + pendingDataAction.requestId + '/approve', { notes: notes || undefined }).then(function (res) {
        if (res.success) {
          AgriCore.showToast('Data approved and published.', 'success');
          closeDataModal();
          loadAllData();
        } else {
          AgriCore.showToast(res.error || 'Approval failed.', 'error');
        }
      });
    });
  }

  if (dataRejectBtn) {
    dataRejectBtn.addEventListener('click', function () {
      if (!pendingDataAction) return;
      var notes = dataNotes ? dataNotes.value.trim() : '';
      apiPost('/data-approval/' + pendingDataAction.requestId + '/reject', { notes: notes || undefined }).then(function (res) {
        if (res.success) {
          AgriCore.showToast('Data submission rejected.', 'success');
          closeDataModal();
          loadAllData();
        } else {
          AgriCore.showToast(res.error || 'Action failed.', 'error');
        }
      });
    });
  }

  // Data Approval filter tabs
  var dataApprovalFilters = document.getElementById('dataApprovalFilters');
  if (dataApprovalFilters) {
    dataApprovalFilters.addEventListener('click', function (e) {
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;
      dataApprovalFilters.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      loadDataApprovalRequests(tab.getAttribute('data-dstatus'));
    });
  }

  // =============================================
  //  TICKETS
  // =============================================
  var ticketList = document.getElementById('ticketList');
  var currentTicketStatus = '';
  var currentTicketType = '';
  var currentTicketUrgency = '';

  function loadTickets() {
    var params = [];
    if (currentTicketStatus) params.push('status=' + currentTicketStatus);
    if (currentTicketType) params.push('type=' + currentTicketType);
    if (currentTicketUrgency) params.push('urgency=' + currentTicketUrgency);
    var qs = params.length ? '?' + params.join('&') : '';

    return apiFetch('/admin/tickets' + qs).then(function(res) {
      if (!res.success || !res.data || res.data.length === 0) {
        if (ticketList) {
          ticketList.innerHTML = '<div class="empty-state"><i data-lucide="inbox"></i><p>No tickets found</p></div>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        return;
      }
      renderTicketList(res.data);
    });
  }

  function renderTicketList(tickets) {
    if (!ticketList) return;

    ticketList.innerHTML = tickets.map(function(t) {
      var userName = t.users ? AgriCore.escapeHtml(t.users.name || 'Unknown') : 'Unknown';
      var userEmail = t.users ? AgriCore.escapeHtml(t.users.email || '') : '';
      var initials = AgriCore.getInitials(userName);
      var title = AgriCore.escapeHtml(t.title || '');
      var typeLbl = (t.type || '').replace('_', ' ');
      var statusLbl = (t.status || '').replace('_', ' ');
      var date = new Date(t.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
      var attachment = t.attachment_url ? ' · <a href="' + AgriCore.escapeHtml(t.attachment_url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--primary-600);font-size:.75rem;">📎 Attachment</a>' : '';

      var urgencyColor = t.urgency === 'high' ? 'var(--danger)' : t.urgency === 'medium' ? 'var(--warning)' : 'var(--success)';
      var statusColor = t.status === 'open' ? 'var(--info)' : t.status === 'in_progress' ? 'var(--warning)' : 'var(--success)';

      var actionsHtml = '<div class="request-actions">' +
        '<button class="btn btn-ghost btn-sm" data-ticket-review="' + t.id + '">Review</button>' +
        '</div>';

      return '<div class="request-card">' +
        '<div class="request-avatar">' + initials + '</div>' +
        '<div class="request-info">' +
        '<div class="request-name">' + title + '</div>' +
        '<div class="request-email">' + userName + ' &middot; ' + userEmail + '</div>' +
        '<div class="request-reason" style="display:flex;gap:.375rem;flex-wrap:wrap;margin-top:.25rem;">' +
        '<span style="padding:1px 6px;border-radius:10px;font-size:.6875rem;font-weight:600;background:' + (t.type === 'bug' ? 'var(--danger-light)' : t.type === 'feature_request' ? 'var(--warning-light)' : 'var(--info-light)') + ';color:' + (t.type === 'bug' ? 'var(--danger)' : t.type === 'feature_request' ? '#e65100' : 'var(--info)') + ';">' + typeLbl + '</span>' +
        '<span style="padding:1px 6px;border-radius:10px;font-size:.6875rem;font-weight:600;border:1px solid ' + urgencyColor + ';color:' + urgencyColor + ';">' + t.urgency + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="request-meta">' +
        '<span class="request-date">' + date + attachment + '</span>' +
        '<span class="request-status" style="background:color-mix(in srgb, ' + statusColor + ' 12%, white);color:' + statusColor + ';">' + statusLbl + '</span>' +
        '</div>' +
        actionsHtml +
        '</div>';
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    bindTicketReviewActions(tickets);
  }

  function bindTicketReviewActions(tickets) {
    if (!ticketList) return;
    ticketList.querySelectorAll('[data-ticket-review]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var ticketId = btn.getAttribute('data-ticket-review');
        var ticket = tickets.find(function(t) { return t.id === ticketId; });
        if (ticket) openTicketModal(ticket);
      });
    });
  }

  // Ticket Filter Tabs
  var ticketFilters = document.getElementById('ticketFilters');
  if (ticketFilters) {
    ticketFilters.addEventListener('click', function(e) {
      var tab = e.target.closest('.filter-tab');
      if (!tab) return;
      ticketFilters.querySelectorAll('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentTicketStatus = tab.getAttribute('data-tstatus');
      loadTickets();
    });
  }

  var ticketTypeFilter = document.getElementById('ticketTypeFilter');
  var ticketUrgencyFilter = document.getElementById('ticketUrgencyFilter');
  if (ticketTypeFilter) {
    ticketTypeFilter.addEventListener('change', function() {
      currentTicketType = ticketTypeFilter.value;
      loadTickets();
    });
  }
  if (ticketUrgencyFilter) {
    ticketUrgencyFilter.addEventListener('change', function() {
      currentTicketUrgency = ticketUrgencyFilter.value;
      loadTickets();
    });
  }

  // Ticket Review Modal
  var ticketModal = document.getElementById('ticketModal');
  var ticketModalTitle = document.getElementById('ticketModalTitle');
  var ticketModalMeta = document.getElementById('ticketModalMeta');
  var ticketModalBody = document.getElementById('ticketModalBody');
  var ticketModalAttachment = document.getElementById('ticketModalAttachment');
  var ticketModalStatus = document.getElementById('ticketModalStatus');
  var ticketNotes = document.getElementById('ticketNotes');
  var ticketSaveBtn = document.getElementById('ticketSaveBtn');
  var ticketCancelBtn = document.getElementById('ticketCancelBtn');
  var pendingTicketId = null;

  function openTicketModal(ticket) {
    pendingTicketId = ticket.id;
    var userName = ticket.users ? ticket.users.name || 'Unknown' : 'Unknown';
    if (ticketModalTitle) ticketModalTitle.textContent = 'Review: ' + AgriCore.escapeHtml(ticket.title);
    if (ticketModalMeta) ticketModalMeta.textContent = 'From: ' + userName + ' | Type: ' + (ticket.type || '').replace('_', ' ') + ' | Urgency: ' + ticket.urgency;
    if (ticketModalBody) ticketModalBody.textContent = ticket.description || 'No description provided.';
    if (ticketModalAttachment) {
      ticketModalAttachment.innerHTML = ticket.attachment_url
        ? '<a href="' + AgriCore.escapeHtml(ticket.attachment_url) + '" target="_blank" rel="noopener noreferrer" style="color:var(--primary-600);font-size:.8125rem;">📎 View Attachment</a>'
        : '';
    }
    if (ticketModalStatus) ticketModalStatus.value = ticket.status || 'open';
    if (ticketNotes) ticketNotes.value = ticket.admin_notes || '';
    if (ticketModal) ticketModal.classList.add('active');
  }

  function closeTicketModal() {
    if (ticketModal) ticketModal.classList.remove('active');
    pendingTicketId = null;
  }

  if (ticketCancelBtn) ticketCancelBtn.addEventListener('click', closeTicketModal);
  if (ticketModal) {
    ticketModal.addEventListener('click', function(e) {
      if (e.target === ticketModal) closeTicketModal();
    });
  }

  if (ticketSaveBtn) {
    ticketSaveBtn.addEventListener('click', function() {
      if (!pendingTicketId) return;
      var status = ticketModalStatus ? ticketModalStatus.value : 'open';
      var notes = ticketNotes ? ticketNotes.value.trim() : '';

      ticketSaveBtn.disabled = true;
      ticketSaveBtn.textContent = 'Saving...';

      fetch(API_BASE + '/tickets/' + pendingTicketId, {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ status: status, admin_notes: notes || undefined }),
      })
        .then(function(res) { return res.json(); })
        .then(function(res) {
          if (res.success) {
            AgriCore.showToast('Ticket updated.', 'success');
            closeTicketModal();
            loadTickets();
            loadStats();
          } else {
            AgriCore.showToast(res.error || 'Update failed.', 'error');
          }
        })
        .catch(function() {
          AgriCore.showToast('Network error.', 'error');
        })
        .finally(function() {
          ticketSaveBtn.disabled = false;
          ticketSaveBtn.textContent = 'Save Changes';
        });
    });
  }

  // =============================================
  //  USER DETAIL PANEL
  // =============================================
  var currentDetailUserId = null;
  var currentDetailUser = null;
  var udLoginMap = null;

  // Back button
  var backToUsersBtn = document.getElementById('backToUsersBtn');
  if (backToUsersBtn) {
    backToUsersBtn.addEventListener('click', function() {
      switchPanel('users');
    });
  }

  // Tabs
  var userDetailTabs = document.getElementById('userDetailTabs');
  if (userDetailTabs) {
    userDetailTabs.addEventListener('click', function(e) {
      var tab = e.target.closest('.ud-tab');
      if (!tab) return;
      userDetailTabs.querySelectorAll('.ud-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.ud-tab-content').forEach(function(c) { c.classList.remove('active'); });
      var target = document.getElementById('udtab-' + tab.getAttribute('data-udtab'));
      if (target) target.classList.add('active');

      // Initialize map when map tab selected
      if (tab.getAttribute('data-udtab') === 'map' && currentDetailUserId) {
        setTimeout(function() { initLoginMap(); }, 100);
      }
    });
  }

  function openUserDetail(userId) {
    currentDetailUserId = userId;
    switchPanel('user-detail');
    loadUserDetail(userId);
  }

  function loadUserDetail(userId) {
    // Load user details, files, login activity, permissions, edit history in parallel
    Promise.all([
      apiFetch('/admin/users/' + userId),
      apiFetch('/admin/users/' + userId + '/files'),
      apiFetch('/admin/users/' + userId + '/logins'),
      apiFetch('/admin/users/' + userId + '/permissions'),
      apiFetch('/admin/users/' + userId + '/edit-history'),
    ]).then(function(results) {
      var userRes = results[0];
      var filesRes = results[1];
      var loginsRes = results[2];
      var permRes = results[3];
      var historyRes = results[4];

      if (!userRes.success || !userRes.data) {
        AgriCore.showToast('Failed to load user details.', 'error');
        switchPanel('users');
        return;
      }

      currentDetailUser = userRes.data;
      renderUserHeader(userRes.data);
      renderUserProfile(userRes.data);
      renderUserPhotos((filesRes.success && Array.isArray(filesRes.data)) ? filesRes.data : []);
      renderLoginActivity((loginsRes.success && Array.isArray(loginsRes.data)) ? loginsRes.data : []);
      renderPermission((permRes.success && permRes.data) ? permRes.data : { can_edit_profile: true });
      renderEditHistory((historyRes.success && Array.isArray(historyRes.data)) ? historyRes.data : []);

      if (typeof lucide !== 'undefined') lucide.createIcons();
    }).catch(function() {
      AgriCore.showToast('Failed to load user details.', 'error');
      switchPanel('users');
    });
  }

  function renderUserHeader(u) {
    var udAvatar = document.getElementById('udAvatar');
    var udName = document.getElementById('udName');
    var udEmail = document.getElementById('udEmail');
    var udRole = document.getElementById('udRole');
    var udStatus = document.getElementById('udStatus');
    var userDetailTitle = document.getElementById('userDetailTitle');

    if (udName) udName.textContent = u.name || '—';
    if (udEmail) udEmail.textContent = u.email || '—';
    if (userDetailTitle) userDetailTitle.textContent = u.name || 'User Details';

    if (udRole) {
      udRole.textContent = u.role || '—';
      udRole.className = 'role-badge ' + (u.role || '');
    }

    var verStatus = u.verification_status || 'unverified';
    if (udStatus) {
      udStatus.textContent = verStatus;
      udStatus.className = 'ver-status-badge ' + verStatus;
    }

    if (udAvatar) {
      if (u.profile_image_url) {
        udAvatar.innerHTML = '<img src="' + AgriCore.escapeHtml(u.profile_image_url) + '" alt="Profile">';
      } else {
        udAvatar.textContent = AgriCore.getInitials(u.name || '??');
        udAvatar.style.backgroundImage = '';
      }
    }

    // Show Verify / Approve button for unverified or pending users
    var verifyBtn = document.getElementById('verifyUserBtn');
    if (verifyBtn) {
      if (verStatus !== 'verified') {
        verifyBtn.style.display = '';
        verifyBtn.textContent = '';
        if (u.role === 'government' && verStatus === 'pending') {
          verifyBtn.innerHTML = '<i data-lucide="check-circle" style="width:14px;height:14px;margin-right:4px;"></i> Approve & Send Email';
        } else {
          verifyBtn.innerHTML = '<i data-lucide="badge-check" style="width:14px;height:14px;margin-right:4px;"></i> Verify User';
        }
        verifyBtn.onclick = function() {
          verifyBtn.disabled = true;
          verifyBtn.textContent = 'Processing...';
          apiPost('/verification/' + u.id + '/approve', { notes: 'Approved by admin' }).then(function(res) {
            if (res.success) {
              AgriCore.showToast(
                u.role === 'government'
                  ? 'Government official approved and verification email sent.'
                  : 'User verified!',
                'success'
              );
              verifyBtn.style.display = 'none';
              if (udStatus) { udStatus.textContent = 'verified'; udStatus.className = 'ver-status-badge verified'; }
              loadAllData();
            } else {
              AgriCore.showToast(res.error || 'Verification failed.', 'error');
              verifyBtn.disabled = false;
              verifyBtn.innerHTML = u.role === 'government'
                ? '<i data-lucide="check-circle" style="width:14px;height:14px;margin-right:4px;"></i> Approve & Send Email'
                : '<i data-lucide="badge-check" style="width:14px;height:14px;margin-right:4px;"></i> Verify User';
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        };
      } else {
        verifyBtn.style.display = 'none';
      }
    }
  }

  function renderUserProfile(u) {
    var grid = document.getElementById('udProfileGrid');
    if (!grid) return;

    var fields = [
      { label: 'Full Name', value: u.name },
      { label: 'Email', value: u.email },
      { label: 'Phone', value: u.phone },
      { label: 'Role', value: u.role },
      { label: 'Address Number', value: u.address_number },
      { label: 'Street Name', value: u.street_name },
      { label: 'Suburb', value: u.suburb },
      { label: 'Town / City', value: u.town },
      { label: 'Province', value: u.province },
      { label: 'Postal Code', value: u.postal_code },
      { label: 'Account Created', value: u.created_at ? new Date(u.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
      { label: 'Verification Status', value: u.verification_status || 'unverified' },
    ];

    // Add farmer-specific fields
    if (u.farmer) {
      var f = u.farmer;
      fields.push(
        { label: 'Farm District', value: f.district },
        { label: 'Farm Size (ha)', value: f.farm_size_hectares },
        { label: 'Farm Latitude', value: f.latitude },
        { label: 'Farm Longitude', value: f.longitude },
        { label: 'Verified Farmer', value: f.verified ? 'Yes' : 'No' }
      );
    }

    grid.innerHTML = fields.map(function(f) {
      var val = f.value != null && f.value !== '' ? AgriCore.escapeHtml(String(f.value)) : '<span style="color:var(--gray-400);">—</span>';
      return '<div class="ud-field">' +
        '<div class="ud-field-label">' + AgriCore.escapeHtml(f.label) + '</div>' +
        '<div class="ud-field-value">' + val + '</div>' +
        '</div>';
    }).join('');
  }

  function renderUserPhotos(files) {
    var gallery = document.getElementById('udPhotoGallery');
    if (!gallery) return;

    if (!files || files.length === 0) {
      gallery.innerHTML = '<div class="empty-state"><i data-lucide="image"></i><p>No uploaded files</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    gallery.innerHTML = files.map(function(f) {
      var typeLabel = (f.type || 'file').replace(/_/g, ' ');
      return '<div class="ud-photo-card">' +
        '<img src="' + AgriCore.escapeHtml(f.url) + '" alt="' + AgriCore.escapeHtml(typeLabel) + '" onclick="window.open(\'' + AgriCore.escapeHtml(f.url) + '\', \'_blank\')">' +
        '<div class="ud-photo-type">' + AgriCore.escapeHtml(typeLabel) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderLoginActivity(logins) {
    var tbody = document.getElementById('udLoginTableBody');
    if (!tbody) return;

    if (!logins || logins.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state"><p>No login activity recorded</p></td></tr>';
      return;
    }

    // Store logins for map
    currentDetailUser._logins = logins;

    tbody.innerHTML = logins.map(function(login) {
      var dt = new Date(login.login_at);
      var dateStr = dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
      var timeStr = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var loc = [login.city, login.region, login.country].filter(Boolean).join(', ') || '—';
      var ip = login.ip_address || '—';
      var ua = login.user_agent || '—';

      // Parse user agent for display
      var browser = '—';
      if (ua !== '—') {
        if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else browser = ua.substring(0, 40) + (ua.length > 40 ? '...' : '');
      }

      return '<tr>' +
        '<td><div style="font-weight:500;">' + dateStr + '</div><div style="font-size:.75rem;color:var(--gray-500);">' + timeStr + '</div></td>' +
        '<td><code style="font-size:.8125rem;background:var(--gray-100);padding:2px 6px;border-radius:4px;">' + AgriCore.escapeHtml(ip) + '</code></td>' +
        '<td>' + AgriCore.escapeHtml(loc) + '</td>' +
        '<td style="font-size:.8125rem;">' + AgriCore.escapeHtml(browser) + '</td>' +
        '</tr>';
    }).join('');
  }

  // =============================================
  //  LOGIN MAP
  // =============================================
  function initLoginMap() {
    var mapContainer = document.getElementById('udLoginMap');
    if (!mapContainer) return;

    var logins = (currentDetailUser && currentDetailUser._logins) || [];
    var geoLogins = logins.filter(function(l) { return l.latitude && l.longitude; });

    // Destroy existing map
    if (udLoginMap) {
      udLoginMap.remove();
      udLoginMap = null;
    }

    if (typeof L === 'undefined') {
      mapContainer.innerHTML = '<div class="empty-state"><p>Map library not loaded</p></div>';
      return;
    }

    if (geoLogins.length === 0) {
      mapContainer.innerHTML = '<div class="empty-state" style="display:flex;align-items:center;justify-content:center;height:100%;"><p>No location data available</p></div>';
      return;
    }

    // Reset map container
    mapContainer.innerHTML = '';
    mapContainer.style.minHeight = '450px';

    udLoginMap = L.map(mapContainer).setView([geoLogins[0].latitude, geoLogins[0].longitude], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(udLoginMap);

    var bounds = L.latLngBounds();

    geoLogins.forEach(function(login) {
      var dt = new Date(login.login_at);
      var dateStr = dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
      var timeStr = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
      var loc = [login.city, login.region, login.country].filter(Boolean).join(', ');

      var marker = L.marker([login.latitude, login.longitude]).addTo(udLoginMap);
      marker.bindPopup(
        '<strong>' + AgriCore.escapeHtml(loc) + '</strong><br>' +
        '<span style="font-size:.8125rem;">IP: ' + AgriCore.escapeHtml(login.ip_address || '—') + '</span><br>' +
        '<span style="font-size:.8125rem;">' + dateStr + ' ' + timeStr + '</span>'
      );

      bounds.extend([login.latitude, login.longitude]);
    });

    if (geoLogins.length > 1) {
      udLoginMap.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  // =============================================
  //  PERMISSION TOGGLE
  // =============================================
  var currentUserPermission = true;

  function renderPermission(perm) {
    currentUserPermission = perm.can_edit_profile !== false;
    var permBtnText = document.getElementById('permBtnText');
    var togglePermBtn = document.getElementById('togglePermBtn');

    if (permBtnText) {
      permBtnText.textContent = currentUserPermission ? 'Revoke Edit' : 'Grant Edit';
    }
    if (togglePermBtn) {
      togglePermBtn.className = currentUserPermission
        ? 'btn btn-ghost btn-sm'
        : 'btn btn-primary btn-sm';
    }
  }

  var togglePermBtn = document.getElementById('togglePermBtn');
  if (togglePermBtn) {
    togglePermBtn.addEventListener('click', function() {
      if (!currentDetailUserId) return;
      var newPerm = !currentUserPermission;
      var msg = newPerm
        ? 'Grant this user permission to edit their own profile?'
        : 'Revoke this user\'s ability to edit their own profile?';

      if (!confirm(msg)) return;

      apiPut('/admin/users/' + currentDetailUserId + '/permissions', {
        can_edit_profile: newPerm,
      }).then(function(res) {
        if (res.success) {
          AgriCore.showToast(newPerm ? 'Edit permission granted.' : 'Edit permission revoked.', 'success');
          renderPermission({ can_edit_profile: newPerm });
        } else {
          AgriCore.showToast(res.error || 'Failed to update permission.', 'error');
        }
      });
    });
  }

  // =============================================
  //  EDIT USER MODAL
  // =============================================
  var editUserModal = document.getElementById('editUserModal');
  var editUserCancelBtn = document.getElementById('editUserCancelBtn');
  var editUserSaveBtn = document.getElementById('editUserSaveBtn');
  var editUserBtn = document.getElementById('editUserBtn');

  if (editUserBtn) {
    editUserBtn.addEventListener('click', function() {
      if (!currentDetailUser) return;
      var u = currentDetailUser;
      document.getElementById('editName').value = u.name || '';
      document.getElementById('editPhone').value = u.phone || '';
      document.getElementById('editRole').value = u.role || 'farmer';
      document.getElementById('editAddressNumber').value = u.address_number || '';
      document.getElementById('editStreetName').value = u.street_name || '';
      document.getElementById('editSuburb').value = u.suburb || '';
      document.getElementById('editTown').value = u.town || '';
      document.getElementById('editProvince').value = u.province || '';
      document.getElementById('editPostalCode').value = u.postal_code || '';
      document.getElementById('editReason').value = '';
      document.getElementById('editUserModalDesc').textContent = 'Editing profile for ' + AgriCore.escapeHtml(u.name || 'user');

      if (editUserModal) editUserModal.classList.add('active');
    });
  }

  function closeEditUserModal() {
    if (editUserModal) editUserModal.classList.remove('active');
  }

  if (editUserCancelBtn) editUserCancelBtn.addEventListener('click', closeEditUserModal);
  if (editUserModal) {
    editUserModal.addEventListener('click', function(e) {
      if (e.target === editUserModal) closeEditUserModal();
    });
  }

  if (editUserSaveBtn) {
    editUserSaveBtn.addEventListener('click', function() {
      if (!currentDetailUserId) return;

      var updates = {
        name: document.getElementById('editName').value.trim(),
        phone: document.getElementById('editPhone').value.trim(),
        role: document.getElementById('editRole').value,
        address_number: document.getElementById('editAddressNumber').value.trim(),
        street_name: document.getElementById('editStreetName').value.trim(),
        suburb: document.getElementById('editSuburb').value.trim(),
        town: document.getElementById('editTown').value.trim(),
        province: document.getElementById('editProvince').value.trim(),
        postal_code: document.getElementById('editPostalCode').value.trim(),
      };

      // Remove empty strings
      Object.keys(updates).forEach(function(k) {
        if (updates[k] === '') delete updates[k];
      });

      var reason = document.getElementById('editReason').value.trim();

      editUserSaveBtn.disabled = true;
      editUserSaveBtn.textContent = 'Saving...';

      apiPut('/admin/users/' + currentDetailUserId, {
        updates: updates,
        reason: reason || undefined,
      }).then(function(res) {
        if (res.success) {
          AgriCore.showToast('User profile updated.', 'success');
          closeEditUserModal();
          loadUserDetail(currentDetailUserId);
        } else {
          AgriCore.showToast(res.error || 'Update failed.', 'error');
        }
      }).finally(function() {
        editUserSaveBtn.disabled = false;
        editUserSaveBtn.textContent = 'Save Changes';
      });
    });
  }

  // =============================================
  //  EDIT HISTORY
  // =============================================
  function renderEditHistory(history) {
    var container = document.getElementById('udEditHistory');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = '<div class="empty-state"><i data-lucide="history"></i><p>No admin edits recorded</p></div>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    container.innerHTML = history.map(function(edit) {
      var admin = edit.admin || {};
      var dt = new Date(edit.edited_at);
      var dateStr = dt.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
      var timeStr = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

      var changesHtml = '';
      if (edit.fields_changed && edit.previous_values && edit.new_values) {
        changesHtml = Object.keys(edit.fields_changed).map(function(field) {
          var oldVal = edit.previous_values[field] != null ? String(edit.previous_values[field]) : '(empty)';
          var newVal = edit.new_values[field] != null ? String(edit.new_values[field]) : '(empty)';
          return '<div class="ud-edit-change-item">' +
            '<span class="ud-edit-field-name">' + AgriCore.escapeHtml(field.replace(/_/g, ' ')) + ':</span>' +
            '<span class="ud-edit-old">' + AgriCore.escapeHtml(oldVal) + '</span>' +
            '<span>→</span>' +
            '<span class="ud-edit-new">' + AgriCore.escapeHtml(newVal) + '</span>' +
            '</div>';
        }).join('');
      }

      var reasonHtml = edit.reason ? '<div style="margin-top:.375rem;font-size:.75rem;color:var(--gray-500);">Reason: ' + AgriCore.escapeHtml(edit.reason) + '</div>' : '';

      return '<div class="ud-edit-card">' +
        '<div class="ud-edit-header">' +
        '<span class="ud-edit-admin">by ' + AgriCore.escapeHtml(admin.name || 'Admin') + ' (' + AgriCore.escapeHtml(admin.email || '') + ')</span>' +
        '<span class="ud-edit-date">' + dateStr + ' ' + timeStr + '</span>' +
        '</div>' +
        '<div class="ud-edit-changes">' + changesHtml + '</div>' +
        reasonHtml +
        '</div>';
    }).join('');
  }

  // =============================================
  //  INITIAL LOAD
  // =============================================
  //  ADMIN NOTIFICATIONS (Real API)
  // =============================================

  var adminNotifBtn = document.getElementById('adminNotifBtn');
  var adminNotifDropdown = document.getElementById('adminNotifDropdown');
  var adminNotifDot = document.getElementById('adminNotifDot');
  var adminNotifCount = document.getElementById('adminNotifCount');
  var adminNotifList = document.getElementById('adminNotifList');
  var adminMarkAllRead = document.getElementById('adminMarkAllRead');

  function loadAdminNotifications() {
    return apiFetch('/notifications?unread=true').then(function(res) {
      var notifs = (res.success && res.data) ? res.data : [];
      var hitRateLimit = !res.success && typeof res.error === 'string' && res.error.indexOf('429') !== -1;

      if (hitRateLimit) {
        notifPollDelayMs = Math.min(notifPollDelayMs * 2, 300000);
      } else {
        notifPollDelayMs = 60000;
      }

      if (adminNotifCount) adminNotifCount.textContent = notifs.length;
      if (adminNotifDot) adminNotifDot.style.display = notifs.length > 0 ? '' : 'none';

      if (adminNotifList) {
        if (notifs.length === 0) {
          adminNotifList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--gray-400);font-size:.875rem;">No new notifications</div>';
        } else {
          adminNotifList.innerHTML = notifs.slice(0, 20).map(function(n) {
            var iconName = 'bell';
            if (n.type && n.type.indexOf('verif') > -1) iconName = 'badge-check';
            else if (n.type && n.type.indexOf('delet') > -1) iconName = 'trash-2';
            else if (n.type && n.type.indexOf('data') > -1) iconName = 'database';
            else if (n.type && n.type.indexOf('ticket') > -1) iconName = 'message-circle';
            var timeStr = n.created_at ? new Date(n.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            return '<div class="notif-item" data-notif-id="' + AgriCore.escapeHtml(n.id) + '" style="display:flex;gap:10px;padding:10px 12px;border-bottom:1px solid var(--gray-100);cursor:pointer;">' +
              '<div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:var(--primary-50);display:flex;align-items:center;justify-content:center;"><i data-lucide="' + iconName + '" style="width:16px;height:16px;color:var(--primary-600);"></i></div>' +
              '<div style="flex:1;min-width:0;">' +
              '<div style="font-weight:600;font-size:.8125rem;color:var(--gray-800);">' + AgriCore.escapeHtml(n.title || '') + '</div>' +
              '<div style="font-size:.75rem;color:var(--gray-500);margin-top:2px;">' + AgriCore.escapeHtml(n.body || '') + '</div>' +
              '<div style="font-size:.6875rem;color:var(--gray-400);margin-top:4px;">' + timeStr + '</div>' +
              '</div>' +
              '<div style="flex-shrink:0;width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:6px;" title="Unread"></div>' +
              '</div>';
          }).join('');

          adminNotifList.querySelectorAll('.notif-item').forEach(function(item) {
            item.addEventListener('click', function() {
              var nid = item.getAttribute('data-notif-id');
              if (!nid) return;
              fetch(API_BASE + '/notifications/' + nid + '/read', {
                method: 'PATCH',
                headers: apiHeaders()
              }).then(function() {
                loadAdminNotifications();
              });
            });
          });
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });
  }

  function scheduleAdminNotificationPoll() {
    if (notifPollTimer) clearTimeout(notifPollTimer);
    notifPollTimer = setTimeout(function() {
      if (authRedirecting) return;
      if (document.hidden) {
        scheduleAdminNotificationPoll();
        return;
      }
      loadAdminNotifications().finally(function() {
        scheduleAdminNotificationPoll();
      });
    }, notifPollDelayMs);
  }

  if (adminNotifBtn) {
    adminNotifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (adminNotifDropdown) adminNotifDropdown.classList.toggle('open');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  if (adminMarkAllRead) {
    adminMarkAllRead.addEventListener('click', function() {
      fetch(API_BASE + '/notifications/read-all', {
        method: 'PATCH',
        headers: apiHeaders()
      }).then(function() {
        loadAdminNotifications();
        AgriCore.showToast('All notifications marked as read.', 'success');
      });
    });
  }

  document.addEventListener('click', function(e) {
    if (adminNotifDropdown && !adminNotifDropdown.contains(e.target) && e.target !== adminNotifBtn && !adminNotifBtn.contains(e.target)) {
      adminNotifDropdown.classList.remove('open');
    }
  });

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      loadAdminNotifications();
    }
  });

  // =============================================
  showAdminLoader();
  verifyAdminSession().then(function(valid) {
    if (!valid) return;
    return loadAllData().then(function() {
      scheduleAdminNotificationPoll();
    });
  }).finally(function() {
    hideAdminLoader();
  });
});
