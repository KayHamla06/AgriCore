/* ============================================
   AgriCore — Government Dashboard Panel
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'govDashboard',
    panelId: 'panel-dashboard-gov',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Government Dashboard</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Monitor farmer progress across all regions.</p>
          </div>
          <span class="verified-badge" id="govVerifiedBadge" style="display:none;"><i data-lucide="badge-check"></i> Verified Gov Official</span>
        </div>

        <div class="unverified-warning" id="govUnverifiedWarning" style="display:none;">
          <i data-lucide="alert-triangle"></i>
          <span>Your account is not verified. Please upload verification documents in Settings to get your verified badge ✓</span>
        </div>

        <div class="attention-banner" id="govAttentionBanner">
          <i data-lucide="alert-triangle"></i>
          <strong><span id="attentionCount">0</span> farmers need attention today</strong>
          <button class="btn btn-ghost btn-sm" id="viewAttentionBtn">View All</button>
        </div>

        <div class="overview-cards">
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon blue"><i data-lucide="users"></i></div>
            </div>
            <div class="overview-card-value">2,547</div>
            <div class="overview-card-label">Total Farmers</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon green"><i data-lucide="trending-up"></i></div>
            </div>
            <div class="overview-card-value">1,892</div>
            <div class="overview-card-label">Farmers Improving</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon red"><i data-lucide="trending-down"></i></div>
            </div>
            <div class="overview-card-value">655</div>
            <div class="overview-card-label">Farmers Declining</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon amber"><i data-lucide="clipboard-list"></i></div>
            </div>
            <div class="overview-card-value">148</div>
            <div class="overview-card-label">Plans Created</div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">Farmer Performance Distribution</h3>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="govPerformanceChart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">Plans by Month</h3>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="govPlansChart"></canvas>
            </div>
          </div>
        </div>

        <div class="section-header" style="margin-top:28px;">
          <div>
            <h3 class="section-title"><i data-lucide="map" style="width:20px;height:20px;display:inline;vertical-align:middle;"></i> District Overview</h3>
            <p style="color:var(--gray-500);font-size:.875rem;">Aggregated performance by district.</p>
          </div>
        </div>
        <div class="district-cards" id="govDistrictCards"></div>

        <div class="section-header" style="margin-top:28px;">
          <div>
            <h3 class="section-title"><i data-lucide="bell-ring" style="width:20px;height:20px;display:inline;vertical-align:middle;"></i> Smart Alerts</h3>
            <p style="color:var(--gray-500);font-size:.875rem;">Automated alerts from district and farmer data.</p>
          </div>
        </div>
        <div class="smart-alerts-list" id="govSmartAlerts"></div>

        <div class="section-header" style="margin-top:28px;">
          <h3 class="section-title">Recent Farmer Activity</h3>
          <button class="btn btn-secondary btn-sm" id="viewAllFarmersBtn">View All</button>
        </div>
        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Location</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="govRecentFarmersTbody"></tbody>
          </table>
        </div>
      `;
    },

    init: function(ctx) {
      if (!ctx.isGov) return;

      var escape = AgriCore.escapeHtml;

      // === Verification Badge & Warning ===
      var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';
      var token = ctx.user.token || '';
      fetch(API_BASE + '/verification/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(function(res) { return res.json(); })
      .then(function(res) {
        if (res.success && res.data) {
          var badge = document.getElementById('govVerifiedBadge');
          var warning = document.getElementById('govUnverifiedWarning');
          if (res.data.status === 'verified') {
            if (badge) { badge.style.display = 'inline-flex'; badge.innerHTML = '<span style="color:#16a34a;">✓</span> Verified Gov Official'; }
            if (warning) warning.style.display = 'none';
          } else {
            if (badge) badge.style.display = 'none';
            if (warning) warning.style.display = 'flex';
          }
        }
      })
      .catch(function() {});

      // === Attention Count ===
      var needAttention = AgriCore.getFarmersNeedingAttention();
      var countEl = document.getElementById('attentionCount');
      if (countEl) countEl.textContent = needAttention.length;

      var viewAttentionBtn = document.getElementById('viewAttentionBtn');
      if (viewAttentionBtn) viewAttentionBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      // === Recent Farmers ===
      var tbody = document.getElementById('govRecentFarmersTbody');
      if (tbody) {
        var recent = AgriCore.mockFarmers.slice(0, 5);
        tbody.innerHTML = recent.map(function(f) {
          var score = AgriCore.calculatePerformanceScore(f);
          var level = AgriCore.getScoreLevel(score);
          return '<tr>' +
            '<td><strong>' + escape(f.name) + '</strong><br><small style="color:var(--gray-500)">' + escape(f.farmName) + '</small></td>' +
            '<td>' + escape(f.province) + '</td>' +
            '<td><span class="badge badge-' + (level.level === 'good' ? 'success' : level.level === 'stable' ? 'warning' : 'danger') + '">' + escape(level.label) + '</span></td>' +
            '<td><button class="btn btn-ghost btn-sm view-farmer-btn" data-id="' + escape(f.id) + '">View</button></td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('.view-farmer-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (window.viewFarmerProfile) window.viewFarmerProfile(btn.dataset.id);
          });
        });
      }

      // === View All Farmers Button ===
      var viewAllBtn = document.getElementById('viewAllFarmersBtn');
      if (viewAllBtn) viewAllBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      // === District Cards ===
      var distContainer = document.getElementById('govDistrictCards');
      if (distContainer) {
        var districts = AgriCore.getDistrictSummary();
        distContainer.innerHTML = districts.map(function(d) {
          var scoreLevel = AgriCore.getScoreLevel(d.avgScore);
          var fillColor = d.avgScore >= 70 ? 'var(--success)' : d.avgScore >= 40 ? 'var(--warning)' : 'var(--danger)';
          var diseaseTags = d.diseases.length > 0
            ? '<div class="district-diseases">' + d.diseases.map(function(dis) { return '<span class="disease-tag">' + escape(dis) + '</span>'; }).join('') + '</div>'
            : '';
          return '<div class="district-card">' +
            '<div class="district-card-title">' + escape(d.district) + '</div>' +
            '<div class="district-card-province">' + escape(d.province) + '</div>' +
            '<div class="district-stats">' +
            '<div class="district-stat"><div class="district-stat-value">' + d.farmerCount + '</div><div class="district-stat-label">Farmers</div></div>' +
            '<div class="district-stat"><div class="district-stat-value">' + d.totalLivestock.toLocaleString() + '</div><div class="district-stat-label">Livestock</div></div>' +
            '<div class="district-stat"><div class="district-stat-value">' + d.totalCrops.toLocaleString() + 't</div><div class="district-stat-label">Crop Yield</div></div>' +
            '<div class="district-stat"><div class="district-stat-value">' + d.decliningCount + '</div><div class="district-stat-label">At Risk</div></div>' +
            '</div>' +
            '<div class="district-score-bar"><span class="district-score-value" style="color:' + fillColor + '">' + d.avgScore + '</span>' +
            '<div class="district-score-track"><div class="district-score-fill" style="width:' + d.avgScore + '%;background:' + fillColor + '"></div></div>' +
            '<span style="color:var(--gray-500)">' + escape(scoreLevel.label) + '</span></div>' +
            diseaseTags + '</div>';
        }).join('');
      }

      // === Smart Alerts ===
      var alertContainer = document.getElementById('govSmartAlerts');
      if (alertContainer) {
        var alerts = AgriCore.generateSmartAlerts();
        if (alerts.length === 0) {
          alertContainer.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No active alerts.</p>';
        } else {
          alertContainer.innerHTML = alerts.slice(0, 12).map(function(a) {
            return '<div class="smart-alert ' + escape(a.type) + '">' +
              '<div class="smart-alert-icon"><i data-lucide="' + escape(a.icon) + '"></i></div>' +
              '<div class="smart-alert-text">' + escape(a.message) + '</div>' +
              '<span class="smart-alert-district">' + escape(a.district) + '</span></div>';
          }).join('');
        }
      }

      lucide.createIcons();
    }
  });
})();
