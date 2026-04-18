/* ============================================
   AgriCore — Notice Board Panel
   Shows targeted notices on dashboard.
   Auto-hides if no active notices.
   ============================================ */
(function() {
  'use strict';

  window.AgriPanels = window.AgriPanels || [];
  window.AgriPanels.push({
    key: 'notices',
    panelId: 'panel-notices',
    getHTML: function() {
      return '<div class="notice-board-container">' +
        '<div class="notice-board-header">' +
          '<div class="notice-board-title"><i data-lucide="megaphone"></i> Notice Board</div>' +
          '<button class="btn btn-ghost btn-sm notice-board-collapse" id="noticeCollapseBtn" title="Collapse">' +
            '<i data-lucide="chevron-up"></i>' +
          '</button>' +
        '</div>' +
        '<div class="notice-board-body" id="noticeBoardBody">' +
          '<div class="notice-loader"><i data-lucide="loader" class="spin"></i> Loading notices...</div>' +
        '</div>' +
      '</div>';
    },
    init: function(ctx) {
      var user = ctx.user;
      var token = user.token || '';
      var API_BASE = window.AGRICORE_API_BASE || '/api';
      var body = document.getElementById('noticeBoardBody');
      var container = document.getElementById('panel-notices');
      var collapseBtn = document.getElementById('noticeCollapseBtn');

      if (!body || !container) return;

      // Collapse toggle
      var collapsed = false;
      if (collapseBtn) {
        collapseBtn.addEventListener('click', function() {
          collapsed = !collapsed;
          body.style.display = collapsed ? 'none' : 'block';
          collapseBtn.innerHTML = collapsed
            ? '<i data-lucide="chevron-down"></i>'
            : '<i data-lucide="chevron-up"></i>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        });
      }

      // Fetch active notices
      fetch(API_BASE + '/notices/active', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(function(res) { return res.json(); })
      .then(function(res) {
        if (!res.success || !res.data || res.data.length === 0) {
          // Hide notice board entirely
          container.style.display = 'none';
          return;
        }

        container.style.display = 'block';
        var notices = res.data;
        var html = '';

        notices.forEach(function(notice) {
          var isExpiring = false;
          var expiryText = '';
          if (notice.expiry_date) {
            var now = new Date();
            var exp = new Date(notice.expiry_date);
            var daysLeft = Math.ceil((exp - now) / 86400000);
            if (daysLeft <= 0) return; // skip expired
            isExpiring = daysLeft <= 3;
            expiryText = daysLeft === 1 ? 'Expires tomorrow' : 'Expires in ' + daysLeft + ' days';
          }

          var pinClass = notice.is_pinned ? ' notice-card-pinned' : '';
          var urgentClass = isExpiring ? ' notice-card-urgent' : '';

          html += '<div class="notice-card' + pinClass + urgentClass + '" data-notice-id="' + notice.id + '">';
          html += '<div class="notice-card-header">';
          if (notice.is_pinned) html += '<span class="notice-pin"><i data-lucide="pin"></i></span>';
          html += '<h4 class="notice-card-title">' + escapeHtml(notice.title) + '</h4>';
          html += '<span class="notice-card-meta">' + escapeHtml(notice.created_by_role) + ' &bull; ' + formatDate(notice.created_at) + '</span>';
          html += '</div>';
          html += '<p class="notice-card-message">' + escapeHtml(notice.message) + '</p>';

          // Targets display
          var targetTags = buildTargetTags(notice.notice_targets || []);
          if (targetTags) html += '<div class="notice-card-tags">' + targetTags + '</div>';

          if (expiryText) {
            html += '<div class="notice-card-expiry' + (isExpiring ? ' notice-expiry-urgent' : '') + '">';
            html += '<i data-lucide="clock"></i> ' + expiryText;
            html += '</div>';
          }

          html += '</div>';

          // Record view (fire-and-forget)
          fetch(API_BASE + '/notices/' + notice.id + '/view', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
          }).catch(function() {});
        });

        body.innerHTML = html || '<p class="notice-empty">No notices at this time.</p>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      })
      .catch(function() {
        container.style.display = 'none';
      });

      function buildTargetTags(targets) {
        if (!targets || targets.length === 0) return '';
        var tags = [];
        targets.forEach(function(t) {
          if (t.province) tags.push('<span class="notice-tag"><i data-lucide="map-pin"></i> ' + escapeHtml(t.province) + '</span>');
          if (t.district) tags.push('<span class="notice-tag">' + escapeHtml(t.district) + '</span>');
          if (t.role) tags.push('<span class="notice-tag"><i data-lucide="user"></i> ' + escapeHtml(t.role) + '</span>');
        });
        return tags.join(' ');
      }

      function formatDate(d) {
        if (!d) return '';
        var dt = new Date(d);
        return dt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }
    }
  });
})();
