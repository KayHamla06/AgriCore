/* ============================================
   AgriCore — Dashboard Router
   Loads panel content, handles navigation,
   auth, sidebar, topbar, and shared utilities.
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // =============================================
  //  AUTH CHECK
  // =============================================
  var user = AgriCore.getCurrentUser();
  if (!user || !user.token) {
    AgriCore.clearCurrentUser();
    window.location.href = '/auth/login';
    return;
  }

  // Advisor users must be verified to access the dashboard
  if (user.role === 'advisor' && user.verification_status !== 'verified') {
    window.location.href = '/pending-verification';
    return;
  }

  var isFarmer = user.role === 'farmer';
  var isGov = user.role === 'advisor';

  // =============================================
  //  DOM REFERENCES — Shell elements
  // =============================================
  var sidebar = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebarOverlay');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var topbarTitle = document.getElementById('topbarTitle');
  var topbarSubtitle = document.getElementById('topbarSubtitle');
  var sidebarAvatar = document.getElementById('sidebarAvatar');
  var sidebarUserName = document.getElementById('sidebarUserName');
  var sidebarUserRole = document.getElementById('sidebarUserRole');
  var topbarAvatar = document.getElementById('topbarAvatar');
  var dashboardContent = document.getElementById('dashboardContent');
  var modalContainer = document.getElementById('modalContainer');

  // =============================================
  //  USER INFO — Sidebar & Topbar
  // =============================================
  var initials = AgriCore.getInitials(user.name);
  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (topbarAvatar) topbarAvatar.textContent = initials;
  if (sidebarUserName) sidebarUserName.textContent = user.name;
  if (sidebarUserRole) sidebarUserRole.textContent = isFarmer ? 'Farmer' : 'Advisor';
  if (topbarSubtitle) topbarSubtitle.textContent = 'Welcome back, ' + user.name.split(' ')[0];

  // Hide gov-only sidebar items for farmers
  if (isFarmer) {
    var sidebarFarmers = document.getElementById('sidebarFarmers');
    var sidebarCompare = document.getElementById('sidebarCompare');
    var sidebarVisits = document.getElementById('sidebarVisits');
    var sidebarTasks = document.getElementById('sidebarTasks');
    if (sidebarFarmers) sidebarFarmers.style.display = 'none';
    if (sidebarCompare) sidebarCompare.style.display = 'none';
    if (sidebarVisits) sidebarVisits.style.display = 'none';
    if (sidebarTasks) sidebarTasks.style.display = 'none';
  }

  // =============================================
  //  INJECT PANEL HTML
  // =============================================
  var panels = window.AgriPanels || [];
  var modals = window.AgriModals || [];

  // Panel ID mapping for navigation
  var panelKeyToId = {};

  panels.forEach(function(panel) {
    var div = document.createElement('div');
    div.className = 'panel';
    div.id = panel.panelId;
    div.innerHTML = panel.getHTML();
    dashboardContent.appendChild(div);
    panelKeyToId[panel.key] = panel.panelId;
  });

  // Inject modals
  modals.forEach(function(modal) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = modal.modalId;
    overlay.innerHTML = modal.getHTML();
    modalContainer.appendChild(overlay);
  });

  // =============================================
  //  SHOW CORRECT DEFAULT DASHBOARD
  // =============================================
  var farmerPanel = document.getElementById('panel-dashboard-farmer');
  var govPanel = document.getElementById('panel-dashboard-gov');
  if (isFarmer && farmerPanel) farmerPanel.classList.add('active');
  if (isGov && govPanel) govPanel.classList.add('active');

  // =============================================
  //  SHARED UTILITIES — Modal management
  // =============================================
  function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  window.openModal = openModal;
  window.closeModal = closeModal;

  // Close modals via close / cancel buttons and overlay click
  document.querySelectorAll('.modal-close').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var overlay = btn.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-cancel').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var overlay = btn.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // =============================================
  //  PANEL SWITCHING
  // =============================================
  var titleMap = {
    'dashboard': 'Dashboard',
    'farmers': 'Farmer Directory',
    'farmer-profile': 'Farmer Profile',
    'analytics': 'Analytics',
    'plans': 'Plans',
    'settings': 'Settings',
    'compare': 'Compare Farmers',
    'map': 'Map View',
    'support': 'Support',
    'visits': 'Visit Log',
    'tasks': 'Tasks & Calendar'
  };

  function switchPanel(panelName) {
    // Map navigation names to panel IDs
    var idMap = {
      'dashboard': isFarmer ? 'panel-dashboard-farmer' : 'panel-dashboard-gov',
      'farmers': 'panel-farmers',
      'farmer-profile': 'panel-farmer-profile',
      'analytics': 'panel-analytics',
      'plans': 'panel-plans',
      'settings': 'panel-settings',
      'compare': 'panel-compare',
      'map': 'panel-map',
      'support': 'panel-support',
      'visits': 'panel-visits',
      'tasks': 'panel-tasks'
    };

    var targetId = idMap[panelName];
    if (!targetId) return;

    // Hide all panels
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });

    // Show target
    var target = document.getElementById(targetId);
    if (target) target.classList.add('active');

    // Update topbar
    if (topbarTitle) topbarTitle.textContent = titleMap[panelName] || 'Dashboard';

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(function(item) { item.classList.remove('active'); });
    var sidebarItem = document.querySelector('.nav-item[data-panel="' + panelName + '"]');
    if (sidebarItem) sidebarItem.classList.add('active');
    // Also activate dashboard nav for farmer-profile
    if (panelName === 'farmer-profile') {
      var dashItem = document.querySelector('.nav-item[data-panel="dashboard"]');
      if (dashItem) dashItem.classList.add('active');
    }

    // Trigger analytics rendering on demand
    if (panelName === 'analytics') {
      if (typeof window.renderAnalyticsData === 'function') window.renderAnalyticsData();
      if (typeof window.renderAnalyticsCharts === 'function') window.renderAnalyticsCharts();
    }

    // Ensure map never leaks into non-map panels
    if (panelName !== 'map' && typeof window.destroyFarmerMap === 'function') {
      window.destroyFarmerMap();
    }

    // Lazy-init map
    if (panelName === 'map') {
      setTimeout(function() {
        if (typeof window.initFarmerMap === 'function') window.initFarmerMap();
      }, 150);
    }

    // Close mobile sidebar
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
  }

  window.switchPanel = switchPanel;

  // =============================================
  //  SIDEBAR NAVIGATION
  // =============================================
  document.querySelectorAll('.nav-item[data-panel]').forEach(function(item) {
    item.addEventListener('click', function() {
      switchPanel(item.dataset.panel);
    });
  });

  // Sidebar toggle (mobile)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      if (sidebar) sidebar.classList.toggle('open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', function() {
      if (sidebar) sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Logout
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      AgriCore.clearCurrentUser();
      window.location.href = '/auth/login';
    });
  }

  // =============================================
  //  INIT ALL PANELS & MODALS
  // =============================================
  var ctx = {
    user: user,
    isFarmer: isFarmer,
    isGov: isGov,
    switchPanel: switchPanel,
    openModal: openModal,
    closeModal: closeModal
  };

  panels.forEach(function(panel) {
    if (typeof panel.init === 'function') panel.init(ctx);
  });

  modals.forEach(function(modal) {
    if (typeof modal.init === 'function') modal.init(ctx);
  });

  // =============================================
  //  NOTIFICATIONS SYSTEM (Real API)
  // =============================================
  var notifCountEl = document.getElementById('notifCount');
  var notifDot = document.getElementById('notifDot');
  var notifList = document.getElementById('notifList');
  var notifDropdown = document.getElementById('notifDropdown');
  var notifBtn = document.getElementById('notifBtn');

  function loadNotifications() {
    return AgriCore.apiGet('/notifications?unread=true').then(function(res) {
      var notifications = (res.success && res.data) ? res.data : [];
      if (notifCountEl) notifCountEl.textContent = notifications.length;
      if (notifDot) notifDot.style.display = notifications.length > 0 ? '' : 'none';

      if (notifList) {
        if (notifications.length === 0) {
          notifList.innerHTML = '<div class="notif-empty">No notifications</div>';
        } else {
          var escape = AgriCore.escapeHtml;
          notifList.innerHTML = notifications.slice(0, 15).map(function(n) {
            var iconName = 'bell';
            if (n.type && n.type.indexOf('verif') > -1) iconName = 'badge-check';
            else if (n.type && n.type.indexOf('delet') > -1) iconName = 'trash-2';
            else if (n.type && n.type.indexOf('data') > -1) iconName = 'database';
            else if (n.type && n.type.indexOf('ticket') > -1) iconName = 'message-circle';
            else if (n.type && n.type.indexOf('plan') > -1) iconName = 'clipboard-list';
            else if (n.type && n.type.indexOf('task') > -1) iconName = 'check-square';
            var timeAgo = n.created_at ? new Date(n.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) : '';
            return '<div class="notif-item" data-notif-id="' + escape(n.id) + '">' +
              '<div class="notif-icon info"><i data-lucide="' + iconName + '"></i></div>' +
              '<div class="notif-body">' +
              '<div class="notif-farmer">' + escape(n.title || '') + '</div>' +
              '<div class="notif-message">' + escape(n.body || '') + '</div>' +
              '<div class="notif-time">' + timeAgo + '</div>' +
              '</div></div>';
          }).join('');

          // Mark as read on click
          notifList.querySelectorAll('.notif-item').forEach(function(item) {
            item.addEventListener('click', function() {
              var nid = item.dataset.notifId;
              if (nid) {
                AgriCore.apiPatch('/notifications/' + nid + '/read')
                  .then(function() { loadNotifications(); })
                  .catch(function() {});
                item.style.opacity = '0.5';
              }
            });
          });
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }).catch(function() {
      // Back off on errors (likely 429)
      notifPollMs = Math.min(notifPollMs * 2, 300000);
      if (notifCountEl) notifCountEl.textContent = '0';
      if (notifDot) notifDot.style.display = 'none';
    });
  }

  loadNotifications();

  // Near-real-time notifications (polling with backoff)
  var notifPollMs = 30000;
  var notifPollTimer = null;
  var notifInFlight = false;

  function scheduleNotifPoll() {
    if (notifPollTimer) clearTimeout(notifPollTimer);
    notifPollTimer = setTimeout(function() {
      if (notifInFlight || document.hidden) { scheduleNotifPoll(); return; }
      notifInFlight = true;
      loadNotifications().finally(function() {
        notifInFlight = false;
        scheduleNotifPoll();
      });
    }, notifPollMs);
  }
  scheduleNotifPoll();

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && !notifInFlight) {
      notifInFlight = true;
      loadNotifications().finally(function() { notifInFlight = false; });
    }
  });

  if (notifBtn) {
    notifBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (notifDropdown) {
        notifDropdown.classList.toggle('open');
        lucide.createIcons({ attrs: { class: ['lucide'] } });
      }
    });
  }

  document.addEventListener('click', function(e) {
    if (notifDropdown && !notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.classList.remove('open');
    }
  });

  // =============================================
  //  TRUST / VERIFIED BADGES
  // =============================================
  var isVerified = user.verification_status === 'verified' || user.verification_status === 'none';
  if (isVerified) {
    if (isFarmer) {
      var farmerBadge = document.getElementById('farmerVerifiedBadge');
      if (farmerBadge) farmerBadge.style.display = 'inline-flex';
    }
    if (isGov) {
      var govBadge = document.getElementById('govVerifiedBadge');
      if (govBadge) govBadge.style.display = 'inline-flex';
    }
    if (sidebarUserRole) {
      sidebarUserRole.innerHTML = AgriCore.escapeHtml(sidebarUserRole.textContent) +
        ' <span class="verified-badge" style="font-size:.6rem;padding:2px 6px;"><i data-lucide="badge-check" style="width:10px;height:10px;"></i> Verified</span>';
    }
  }

  // =============================================
  //  FINAL: Re-init all Lucide icons
  // =============================================
  lucide.createIcons();

});
