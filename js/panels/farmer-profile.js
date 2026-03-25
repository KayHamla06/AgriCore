/* ============================================
   AgriCore — Farmer Profile Panel
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'farmerProfile',
    panelId: 'panel-farmer-profile',

    getHTML: function() {
      return `
        <div style="margin-bottom:20px;">
          <button class="btn btn-ghost" id="backToFarmersBtn"><i data-lucide="arrow-left"></i> Back to Farmers</button>
        </div>

        <div class="profile-header" id="profileHeader"></div>

        <div class="profile-charts-row">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">Performance Over Time</h3>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="profilePerformanceChart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">Monthly Yield</h3>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="profileYieldChart"></canvas>
            </div>
          </div>
        </div>

        <div class="card profile-section" id="profileLivestockSection" style="margin-bottom:20px;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="beef"></i> Livestock Breakdown</h3>
            <span class="profile-section-badge" id="profileLivestockTotal">0 animals</span>
          </div>
          <div class="livestock-grid" id="profileLivestockGrid"></div>
          <div class="livestock-growth-bar" id="profileLivestockGrowth"></div>
        </div>

        <div class="card profile-section" id="profileCropSection" style="margin-bottom:20px;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="wheat"></i> Crop Performance</h3>
            <span class="profile-section-badge" id="profileCropTotal">0 t total</span>
          </div>
          <div class="crop-table-wrapper" id="profileCropTable"></div>
          <div class="chart-canvas-wrapper" style="max-height:220px;margin-top:12px;">
            <canvas id="profileCropChart"></canvas>
          </div>
        </div>

        <div class="card profile-section" id="profileHealthSection" style="margin-bottom:20px;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="heart-pulse"></i> Health &amp; Disease</h3>
            <span class="profile-section-badge danger" id="profileDiseaseCount">0 active</span>
          </div>
          <div id="profileHealthContent"></div>
        </div>

        <div class="card profile-section" id="profileEnvironmentSection" style="margin-bottom:20px;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="cloud-sun"></i> Environmental Data</h3>
          </div>
          <div class="env-grid" id="profileEnvGrid"></div>
        </div>

        <div class="card profile-section" id="profileInsightsSection" style="margin-bottom:20px;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="brain"></i> System Insights</h3>
            <span class="auto-badge">AI-Generated</span>
          </div>
          <div class="insights-list" id="profileInsightsList"></div>
        </div>

        <div class="card profile-section" id="profileRiskSection" style="margin-bottom:20px;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="shield-alert"></i> Risk Assessment</h3>
            <span class="profile-section-badge" id="profileRiskLevel">--</span>
          </div>
          <div id="profileRiskContent"></div>
        </div>

        <div class="card" style="margin-bottom:28px;padding:24px;">
          <h3 class="chart-card-title" style="margin-bottom:16px;">History Timeline</h3>
          <div class="timeline" id="profileTimeline"></div>
        </div>

        <div style="display:flex;gap:12px;">
          <button class="btn btn-primary" id="createPlanFromProfileBtn"><i data-lucide="clipboard-plus"></i> Create Plan</button>
          <button class="btn btn-danger" id="flagFarmerBtn"><i data-lucide="alert-triangle"></i> Flag for Follow-up</button>
        </div>
      `;
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;

      // Back button
      var backBtn = document.getElementById('backToFarmersBtn');
      if (backBtn) backBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      // Create plan from profile
      var createPlanBtn = document.getElementById('createPlanFromProfileBtn');
      if (createPlanBtn) createPlanBtn.addEventListener('click', function() { ctx.openModal('createPlanModal'); });

      // Flag farmer
      var flagBtn = document.getElementById('flagFarmerBtn');
      if (flagBtn) flagBtn.addEventListener('click', function() { AgriCore.showToast('Farmer flagged for follow-up', 'warning'); });

      // === viewFarmerProfile — exposed globally ===
      window.viewFarmerProfile = function(farmerId) {
        var farmer = AgriCore.mockFarmers.find(function(f) { return f.id === farmerId; });
        if (!farmer) return;

        ctx.switchPanel('farmer-profile');

        var score = AgriCore.calculatePerformanceScore(farmer);
        var level = AgriCore.getScoreLevel(score);
        var warnings = AgriCore.detectWarnings(farmer);

        // Profile header
        var header = document.getElementById('profileHeader');
        if (header) {
          var warningHtml = warnings.length > 0
            ? '<div class="profile-warnings">' + warnings.map(function(w) {
              return '<span class="warning-tag ' + w.type + '"><i data-lucide="' + escape(w.icon) + '"></i> ' + escape(w.message) + '</span>';
            }).join(' ') + '</div>'
            : '';

          header.innerHTML =
            '<div class="profile-avatar">' + escape(AgriCore.getInitials(farmer.name)) + '</div>' +
            '<div class="profile-info">' +
            '<h2>' + escape(farmer.name) + '</h2>' +
            '<p>' + escape(farmer.farmName) + ' &mdash; ' + escape(farmer.type) + '</p>' +
            '<p style="color:var(--gray-500)">' + escape(farmer.province) + ', ' + escape(farmer.district) + '</p>' +
            '<div class="profile-stats">' +
            '<div class="stat"><span class="stat-value" style="color:' + level.color + '">' + score + '</span><span class="stat-label">Score</span></div>' +
            '<div class="stat"><span class="stat-value">' + farmer.yieldHistory[farmer.yieldHistory.length - 1] + 't</span><span class="stat-label">Yield</span></div>' +
            '<div class="stat"><span class="stat-value">' + farmer.livestock + '</span><span class="stat-label">Livestock</span></div>' +
            '<div class="stat"><span class="stat-value">' + farmer.hectares + 'ha</span><span class="stat-label">Land</span></div>' +
            '</div>' +
            warningHtml +
            '</div>' +
            '<span class="badge badge-' + (level.level === 'good' ? 'success' : level.level === 'stable' ? 'warning' : 'danger') + '">' + escape(level.label) + '</span>';
        }

        // Profile charts
        if (typeof window.renderProfileCharts === 'function') {
          window.renderProfileCharts(farmer);
        }

        // Render all sections
        renderProfileLivestock(farmer);
        renderProfileCrops(farmer);
        renderProfileHealth(farmer);
        renderProfileEnvironment(farmer);
        renderProfileInsights(farmer);
        renderProfileRisk(farmer);

        // Timeline
        var timeline = document.getElementById('profileTimeline');
        if (timeline && farmer.uploadHistory) {
          timeline.innerHTML = farmer.uploadHistory.slice().reverse().map(function(h) {
            return '<div class="timeline-item">' +
              '<div class="timeline-dot"></div>' +
              '<div class="timeline-content">' +
              '<div class="timeline-date">' + escape(h.date) + '</div>' +
              '<div class="timeline-text">Yield: ' + h.yield + 't/ha | Livestock: ' + h.livestock +
              (h.notes ? ' — ' + escape(h.notes) : '') +
              '</div></div></div>';
          }).join('');
        }

        lucide.createIcons();
      };

      // === Render Functions ===
      function renderProfileLivestock(farmer) {
        var grid = document.getElementById('profileLivestockGrid');
        var totalEl = document.getElementById('profileLivestockTotal');
        var growthEl = document.getElementById('profileLivestockGrowth');
        if (!grid) return;

        var records = farmer.livestockRecords || [];
        var growth = AgriCore.calculateLivestockGrowthRate(farmer);

        if (totalEl) totalEl.textContent = growth.totalAnimals + ' animals';

        if (records.length === 0) {
          grid.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No livestock data available.</p>';
          return;
        }

        var icons = { Cattle: 'beef', Goats: 'rabbit', Sheep: 'cloud', Chickens: 'bird', Ducks: 'bird', Pigs: 'piggy-bank', Horses: 'heart', Donkeys: 'heart' };

        grid.innerHTML = records.map(function(r) {
          var diseaseClass = r.diseases.length > 0 ? 'has-disease' : '';
          var diseaseHtml = r.diseases.length > 0
            ? '<div class="livestock-card-diseases">' + r.diseases.map(function(d) { return '<span class="disease-tag small">' + escape(d) + '</span>'; }).join('') + '</div>'
            : '<div class="livestock-card-diseases"><span class="disease-tag healthy small">Healthy</span></div>';
          return '<div class="livestock-card ' + diseaseClass + '">' +
            '<div class="livestock-card-icon"><i data-lucide="' + (icons[r.animalType] || 'paw-print') + '"></i></div>' +
            '<div class="livestock-card-name">' + escape(r.animalType) + '</div>' +
            '<div class="livestock-card-count">' + r.total + '</div>' +
            '<div class="livestock-card-meta">Born: ' + r.born + ' | Sold: ' + r.sold + ' | Young: ' + r.young + '</div>' +
            diseaseHtml + '</div>';
        }).join('');

        if (growthEl) {
          var rateClass = growth.rate > 0 ? 'positive' : growth.rate < 0 ? 'negative' : 'neutral';
          growthEl.innerHTML = '<div class="growth-indicator ' + rateClass + '">' +
            '<span>Livestock Growth Rate:</span> <strong>' + (growth.rate > 0 ? '+' : '') + growth.rate + '%</strong></div>';
        }
      }

      function renderProfileCrops(farmer) {
        var table = document.getElementById('profileCropTable');
        var totalEl = document.getElementById('profileCropTotal');
        if (!table) return;

        var cropProd = AgriCore.calculateCropProductivity(farmer);
        if (totalEl) totalEl.textContent = cropProd.totalYield + ' t total';

        if (cropProd.crops.length === 0) {
          table.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No crop data available.</p>';
          return;
        }

        var rows = cropProd.crops.map(function(c) {
          return '<tr><td><strong>' + escape(c.name) + '</strong></td><td>' + c.area + ' ha</td><td>' + c.yield + ' t</td><td>' + c.productivity + ' t/ha</td></tr>';
        }).join('');

        table.innerHTML = '<table class="table"><thead><tr><th>Crop</th><th>Area</th><th>Yield</th><th>Productivity</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }

      function renderProfileHealth(farmer) {
        var content = document.getElementById('profileHealthContent');
        var countBadge = document.getElementById('profileDiseaseCount');
        if (!content) return;

        var records = farmer.livestockRecords || [];
        var allDiseases = [];
        records.forEach(function(r) {
          r.diseases.forEach(function(d) {
            allDiseases.push({ disease: d, animal: r.animalType, treatment: r.treatment, lastDosed: r.lastDosed });
          });
        });

        if (countBadge) {
          countBadge.textContent = allDiseases.length + ' active';
          countBadge.className = 'profile-section-badge ' + (allDiseases.length > 0 ? 'danger' : 'good');
        }

        if (allDiseases.length === 0) {
          content.innerHTML = '<div class="health-status-good"><i data-lucide="heart"></i> All livestock healthy — no active diseases detected.</div>';
          return;
        }

        content.innerHTML = '<div class="disease-list">' + allDiseases.map(function(d) {
          return '<div class="disease-item">' +
            '<div class="disease-item-icon"><i data-lucide="bug"></i></div>' +
            '<div class="disease-item-info">' +
            '<strong>' + escape(d.disease) + '</strong> — ' + escape(d.animal) +
            (d.treatment ? '<div class="disease-treatment"><i data-lucide="syringe"></i> ' + escape(d.treatment) + '</div>' : '') +
            '<div class="disease-dosed">Last dosed: ' + escape(d.lastDosed) + '</div>' +
            '</div></div>';
        }).join('') + '</div>';
      }

      function renderProfileEnvironment(farmer) {
        var grid = document.getElementById('profileEnvGrid');
        if (!grid) return;

        var weather = farmer.weatherData || {};
        var soil = farmer.soilData || {};

        grid.innerHTML =
          '<div class="env-card"><div class="env-card-icon rain"><i data-lucide="cloud-rain"></i></div><div class="env-card-value">' + (weather.rainfall || 0) + ' mm</div><div class="env-card-label">Seasonal Rainfall</div></div>' +
          '<div class="env-card"><div class="env-card-icon temp"><i data-lucide="thermometer"></i></div><div class="env-card-value">' + (weather.avgTemp || 0) + '\u00B0C</div><div class="env-card-label">Avg Temperature</div></div>' +
          '<div class="env-card"><div class="env-card-icon humidity"><i data-lucide="droplets"></i></div><div class="env-card-value">' + (weather.humidity || 0) + '%</div><div class="env-card-label">Humidity</div></div>' +
          '<div class="env-card"><div class="env-card-icon drought"><i data-lucide="sun"></i></div><div class="env-card-value">' + (weather.droughtRisk || 'N/A') + '</div><div class="env-card-label">Drought Risk</div></div>' +
          '<div class="env-card"><div class="env-card-icon green"><i data-lucide="mountain"></i></div><div class="env-card-value">' + escape(soil.soilType || '--') + '</div><div class="env-card-label">Soil Type</div></div>' +
          '<div class="env-card"><div class="env-card-icon purple"><i data-lucide="droplet"></i></div><div class="env-card-value">' + (soil.irrigation ? escape(soil.irrigationType) : 'None') + '</div><div class="env-card-label">Irrigation</div></div>';
      }

      function renderProfileInsights(farmer) {
        var list = document.getElementById('profileInsightsList');
        if (!list) return;

        var insights = AgriCore.generateSystemInsights(farmer);
        if (insights.length === 0) {
          list.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No insights available.</p>';
          return;
        }

        list.innerHTML = insights.map(function(i) {
          return '<div class="insight-item ' + i.type + '">' +
            '<div class="insight-icon"><i data-lucide="' + escape(i.icon) + '"></i></div>' +
            '<span>' + escape(i.text) + '</span></div>';
        }).join('');
      }

      function renderProfileRisk(farmer) {
        var content = document.getElementById('profileRiskContent');
        var levelBadge = document.getElementById('profileRiskLevel');
        if (!content) return;

        var risk = AgriCore.calculateRiskScore(farmer);
        var fillClass = risk.score >= 60 ? 'critical' : risk.score >= 40 ? 'high' : risk.score >= 20 ? 'medium' : 'low';

        if (levelBadge) {
          levelBadge.textContent = risk.level + ' (' + risk.score + ')';
          levelBadge.className = 'profile-section-badge ' + (risk.score >= 60 ? 'danger' : risk.score >= 40 ? 'warning' : 'good');
        }

        var factorsHtml = '';
        if (risk.reasons.length > 0) {
          factorsHtml = '<div class="risk-factors">' +
            risk.reasons.map(function(r) { return '<div class="risk-factor"><div class="risk-factor-dot ' + fillClass + '"></div>' + escape(r) + '</div>'; }).join('') +
            '</div>';
        } else {
          factorsHtml = '<p style="color:var(--gray-400);font-size:.875rem;">No significant risk factors detected.</p>';
        }

        content.innerHTML = '<div class="risk-meter"><div class="risk-meter-fill ' + fillClass + '" style="width:' + risk.score + '%"></div></div>' + factorsHtml;
      }
    }
  });
})();
