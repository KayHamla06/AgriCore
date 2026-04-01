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
  if (!user) {
    window.location.href = '/auth/login';
    return;
  }

  // Government users must be verified to access the dashboard
  if (user.role === 'government' && user.verification_status !== 'verified') {
    window.location.href = '/pending-verification';
    return;
  }

  var isFarmer = user.role === 'farmer';
  var isGov = user.role === 'government';

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
  if (sidebarUserRole) sidebarUserRole.textContent = isFarmer ? 'Farmer' : 'Government Rep';
  if (topbarSubtitle) topbarSubtitle.textContent = 'Welcome back, ' + user.name.split(' ')[0];

  // Hide gov-only sidebar items for farmers
  if (isFarmer) {
    var sidebarFarmers = document.getElementById('sidebarFarmers');
    var sidebarCompare = document.getElementById('sidebarCompare');
    var sidebarMap = document.getElementById('sidebarMap');
    if (sidebarFarmers) sidebarFarmers.style.display = 'none';
    if (sidebarCompare) sidebarCompare.style.display = 'none';
    if (sidebarMap) sidebarMap.style.display = 'none';
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
    'support': 'Support'
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
      'support': 'panel-support'
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
  //  NOTIFICATIONS SYSTEM
  // =============================================
  var notifications = isGov ? AgriCore.generateNotifications() : [];
  var notifCountEl = document.getElementById('notifCount');
  var notifDot = document.getElementById('notifDot');
  var notifList = document.getElementById('notifList');
  var notifDropdown = document.getElementById('notifDropdown');
  var notifBtn = document.getElementById('notifBtn');

  if (notifCountEl) notifCountEl.textContent = notifications.length;
  if (notifDot && notifications.length === 0) notifDot.style.display = 'none';

  if (notifList) {
    if (notifications.length === 0) {
      notifList.innerHTML = '<div class="notif-empty">No notifications</div>';
    } else {
      var escape = AgriCore.escapeHtml;
      notifList.innerHTML = notifications.slice(0, 15).map(function(n) {
        return '<div class="notif-item" data-farmer-id="' + escape(n.farmerId) + '">' +
          '<div class="notif-icon ' + escape(n.type) + '"><i data-lucide="' + escape(n.icon) + '"></i></div>' +
          '<div class="notif-body">' +
          '<div class="notif-farmer">' + escape(n.farmerName) + '</div>' +
          '<div class="notif-message">' + escape(n.message) + '</div>' +
          '<div class="notif-time">' + escape(n.time) + '</div>' +
          '</div></div>';
      }).join('');

      notifList.querySelectorAll('.notif-item').forEach(function(item) {
        item.addEventListener('click', function() {
          var fid = item.dataset.farmerId;
          if (fid && window.viewFarmerProfile) window.viewFarmerProfile(fid);
          if (notifDropdown) notifDropdown.classList.remove('open');
        });
      });
    }
  }

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
  var currentMockUser = AgriCore.mockUsers.find(function(u) { return u.email === user.email; });
  if (currentMockUser && currentMockUser.verified) {
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
