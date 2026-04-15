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

        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="createPlanFromProfileBtn"><i data-lucide="clipboard-plus"></i> Create Plan</button>
          <button class="btn btn-secondary" id="downloadFarmerProfilePdfBtn"><i data-lucide="file-down"></i> Download Farmer Report</button>
          <button class="btn btn-ghost" id="logVisitFromProfileBtn"><i data-lucide="map-pin"></i> Log Visit</button>
          <button class="btn btn-ghost" id="addNoteFromProfileBtn"><i data-lucide="sticky-note"></i> Add Note</button>
          <button class="btn btn-danger" id="flagFarmerBtn"><i data-lucide="alert-triangle"></i> Flag for Follow-up</button>
        </div>

        <!-- Advisor Edit Section (gov only) -->
        <div class="card profile-section" id="advisorEditSection" style="margin-top:20px;display:none;">
          <div class="profile-section-header">
            <h3 class="chart-card-title"><i data-lucide="edit-3"></i> Edit Farm Data</h3>
            <span class="badge badge-warning">Requires Admin Approval</span>
          </div>
          <p style="color:var(--gray-500);font-size:.8rem;margin-bottom:12px;">Changes will be submitted for admin review before going live.</p>
          <div class="advisor-edit-tabs">
            <button class="filter-btn active" data-edit-tab="livestock">Livestock</button>
            <button class="filter-btn" data-edit-tab="crops">Crops</button>
            <button class="filter-btn" data-edit-tab="soil">Soil Data</button>
          </div>

          <!-- Livestock edit -->
          <div class="advisor-edit-form" id="editLivestockForm">
            <div class="form-grid">
              <div class="form-group"><label>Animal Type</label><input type="text" id="editLsType" class="form-input" placeholder="e.g. Cattle"></div>
              <div class="form-group"><label>Total</label><input type="number" id="editLsTotal" class="form-input" min="0"></div>
              <div class="form-group"><label>Born</label><input type="number" id="editLsBorn" class="form-input" min="0"></div>
              <div class="form-group"><label>Sold</label><input type="number" id="editLsSold" class="form-input" min="0"></div>
              <div class="form-group"><label>Young</label><input type="number" id="editLsYoung" class="form-input" min="0"></div>
              <div class="form-group"><label>Diseases</label><input type="text" id="editLsDiseases" class="form-input" placeholder="Comma-separated"></div>
            </div>
            <button class="btn btn-primary btn-sm" id="submitLivestockEditBtn" style="margin-top:10px;"><i data-lucide="send"></i> Submit for Approval</button>
          </div>

          <!-- Crop edit -->
          <div class="advisor-edit-form" id="editCropForm" style="display:none;">
            <div class="form-grid">
              <div class="form-group"><label>Crop Type</label><input type="text" id="editCrType" class="form-input" placeholder="e.g. Maize"></div>
              <div class="form-group"><label>Hectares</label><input type="number" id="editCrHectares" class="form-input" min="0" step="0.1"></div>
              <div class="form-group"><label>Yield (tonnes)</label><input type="number" id="editCrYield" class="form-input" min="0" step="0.1"></div>
              <div class="form-group"><label>Season</label><input type="text" id="editCrSeason" class="form-input" placeholder="e.g. 2025/2026"></div>
              <div class="form-group"><label>Status</label>
                <select id="editCrStatus" class="form-input">
                  <option value="planted">Planted</option>
                  <option value="growing">Growing</option>
                  <option value="harvested">Harvested</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="submitCropEditBtn" style="margin-top:10px;"><i data-lucide="send"></i> Submit for Approval</button>
          </div>

          <!-- Soil edit -->
          <div class="advisor-edit-form" id="editSoilForm" style="display:none;">
            <div class="form-grid">
              <div class="form-group"><label>pH Level</label><input type="number" id="editSoilPh" class="form-input" min="0" max="14" step="0.1"></div>
              <div class="form-group"><label>Nitrogen (mg/kg)</label><input type="number" id="editSoilN" class="form-input" min="0" step="0.1"></div>
              <div class="form-group"><label>Phosphorus (mg/kg)</label><input type="number" id="editSoilP" class="form-input" min="0" step="0.1"></div>
              <div class="form-group"><label>Potassium (mg/kg)</label><input type="number" id="editSoilK" class="form-input" min="0" step="0.1"></div>
              <div class="form-group"><label>Organic Matter (%)</label><input type="number" id="editSoilOm" class="form-input" min="0" max="100" step="0.1"></div>
              <div class="form-group"><label>Soil Type</label><input type="text" id="editSoilType" class="form-input" placeholder="e.g. Loam"></div>
            </div>
            <button class="btn btn-primary btn-sm" id="submitSoilEditBtn" style="margin-top:10px;"><i data-lucide="send"></i> Submit for Approval</button>
          </div>
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

      // Quick action: Log Visit from profile
      var logVisitProfileBtn = document.getElementById('logVisitFromProfileBtn');
      if (logVisitProfileBtn) {
        logVisitProfileBtn.addEventListener('click', function() {
          ctx.switchPanel('visits');
          setTimeout(function() {
            var newVisitBtn = document.getElementById('newVisitBtn');
            if (newVisitBtn) newVisitBtn.click();
            // Pre-select farmer
            var sel = document.getElementById('visitFarmerSelect');
            if (sel && window._currentProfileFarmerId) sel.value = window._currentProfileFarmerId;
          }, 200);
        });
      }

      // Quick action: Add Note
      var addNoteBtn = document.getElementById('addNoteFromProfileBtn');
      if (addNoteBtn) {
        addNoteBtn.addEventListener('click', function() {
          AgriCore.showToast('Opening notes...', 'info');
          // If a note modal/panel exists, link to it; otherwise show toast
        });
      }

      // Advisor Edit Section — show only for gov roles
      if (ctx.isGov) {
        var editSection = document.getElementById('advisorEditSection');
        if (editSection) editSection.style.display = 'block';

        // Tab switching
        document.querySelectorAll('[data-edit-tab]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            document.querySelectorAll('[data-edit-tab]').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById('editLivestockForm').style.display = btn.dataset.editTab === 'livestock' ? 'block' : 'none';
            document.getElementById('editCropForm').style.display = btn.dataset.editTab === 'crops' ? 'block' : 'none';
            document.getElementById('editSoilForm').style.display = btn.dataset.editTab === 'soil' ? 'block' : 'none';
          });
        });

        // Submit livestock change
        var submitLsBtn = document.getElementById('submitLivestockEditBtn');
        if (submitLsBtn) {
          submitLsBtn.addEventListener('click', function() {
            var farmerId = window._currentProfileFarmerId;
            if (!farmerId) { AgriCore.showToast('No farmer selected.', 'error'); return; }
            var animalType = document.getElementById('editLsType').value.trim();
            if (!animalType) { AgriCore.showToast('Animal type is required.', 'error'); return; }

            var diseases = document.getElementById('editLsDiseases').value.trim();
            var payload = {
              animal_type: animalType,
              total: parseInt(document.getElementById('editLsTotal').value) || 0,
              born: parseInt(document.getElementById('editLsBorn').value) || 0,
              sold: parseInt(document.getElementById('editLsSold').value) || 0,
              young: parseInt(document.getElementById('editLsYoung').value) || 0,
              diseases: diseases ? diseases.split(',').map(function(d) { return d.trim(); }) : []
            };

            submitLsBtn.disabled = true;
            submitLsBtn.textContent = 'Submitting...';

            AgriCore.apiPost('/data-approval/submit', {
              resource_type: 'livestock',
              farmer_id: farmerId,
              payload: payload
            }).then(function(res) {
              submitLsBtn.disabled = false;
              submitLsBtn.innerHTML = '<i data-lucide="send"></i> Submit for Approval';
              if (typeof lucide !== 'undefined') lucide.createIcons();
              if (res.success) {
                AgriCore.showToast('Livestock data submitted for admin approval!', 'success');
              } else {
                AgriCore.showToast(res.error || 'Submission failed.', 'error');
              }
            });
          });
        }

        // Submit crop change
        var submitCrBtn = document.getElementById('submitCropEditBtn');
        if (submitCrBtn) {
          submitCrBtn.addEventListener('click', function() {
            var farmerId = window._currentProfileFarmerId;
            if (!farmerId) { AgriCore.showToast('No farmer selected.', 'error'); return; }
            var cropType = document.getElementById('editCrType').value.trim();
            if (!cropType) { AgriCore.showToast('Crop type is required.', 'error'); return; }

            var payload = {
              crop_type: cropType,
              hectares_planted: parseFloat(document.getElementById('editCrHectares').value) || 0,
              yield_tonnes: parseFloat(document.getElementById('editCrYield').value) || 0,
              season: document.getElementById('editCrSeason').value.trim(),
              status: document.getElementById('editCrStatus').value
            };

            submitCrBtn.disabled = true;
            submitCrBtn.textContent = 'Submitting...';

            AgriCore.apiPost('/data-approval/submit', {
              resource_type: 'crops',
              farmer_id: farmerId,
              payload: payload
            }).then(function(res) {
              submitCrBtn.disabled = false;
              submitCrBtn.innerHTML = '<i data-lucide="send"></i> Submit for Approval';
              if (typeof lucide !== 'undefined') lucide.createIcons();
              if (res.success) {
                AgriCore.showToast('Crop data submitted for admin approval!', 'success');
              } else {
                AgriCore.showToast(res.error || 'Submission failed.', 'error');
              }
            });
          });
        }

        // Submit soil change
        var submitSoilBtn = document.getElementById('submitSoilEditBtn');
        if (submitSoilBtn) {
          submitSoilBtn.addEventListener('click', function() {
            var farmerId = window._currentProfileFarmerId;
            if (!farmerId) { AgriCore.showToast('No farmer selected.', 'error'); return; }

            var payload = {
              ph: parseFloat(document.getElementById('editSoilPh').value) || null,
              nitrogen: parseFloat(document.getElementById('editSoilN').value) || null,
              phosphorus: parseFloat(document.getElementById('editSoilP').value) || null,
              potassium: parseFloat(document.getElementById('editSoilK').value) || null,
              organic_matter: parseFloat(document.getElementById('editSoilOm').value) || null,
              soil_type: document.getElementById('editSoilType').value.trim()
            };

            submitSoilBtn.disabled = true;
            submitSoilBtn.textContent = 'Submitting...';

            AgriCore.apiPost('/data-approval/submit', {
              resource_type: 'soil_data',
              farmer_id: farmerId,
              payload: payload
            }).then(function(res) {
              submitSoilBtn.disabled = false;
              submitSoilBtn.innerHTML = '<i data-lucide="send"></i> Submit for Approval';
              if (typeof lucide !== 'undefined') lucide.createIcons();
              if (res.success) {
                AgriCore.showToast('Soil data submitted for admin approval!', 'success');
              } else {
                AgriCore.showToast(res.error || 'Submission failed.', 'error');
              }
            });
          });
        }
      }

      // PDF download from profile
      var pdfProfileBtn = document.getElementById('downloadFarmerProfilePdfBtn');
      if (pdfProfileBtn) {
        pdfProfileBtn.addEventListener('click', function() {
          // Get the currently viewed farmer ID
          var currentFarmerId = window._currentProfileFarmerId;
          if (!currentFarmerId) {
            AgriCore.showToast('No farmer selected.', 'error');
            return;
          }

          pdfProfileBtn.disabled = true;
          pdfProfileBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var user = ctx.user;
          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || '/api';

          fetch(API_BASE + '/pdf/farmer/' + currentFarmerId, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
          })
          .then(function(res) {
            if (!res.ok) throw new Error('Failed to generate PDF');
            return res.blob();
          })
          .then(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'AgriCore_Farm_Report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            AgriCore.showToast('Report downloaded!', 'success');
          })
          .catch(function() {
            AgriCore.showToast('Failed to download report. Please try again.', 'error');
          })
          .finally(function() {
            pdfProfileBtn.disabled = false;
            pdfProfileBtn.innerHTML = '<i data-lucide="file-down"></i> Download Farmer Report';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        });
      }

      // === viewFarmerProfile — exposed globally ===
      window.viewFarmerProfile = function(farmerId) {
        // Track current farmer for PDF download
        window._currentProfileFarmerId = farmerId;
        ctx.switchPanel('farmer-profile');

        var user = ctx.user;
        var token = user.token || '';
        var API_BASE = window.AGRICORE_API_BASE || '/api';
        var headers = { 'Authorization': 'Bearer ' + token };

        // Show loading state
        var header = document.getElementById('profileHeader');
        if (header) header.innerHTML = '<div style="text-align:center;padding:40px;color:var(--gray-400)"><i data-lucide="loader"></i> Loading farmer profile...</div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Fetch farmer + crops + livestock + soil in parallel
        Promise.all([
          fetch(API_BASE + '/farmers/' + farmerId, { headers: headers }).then(function(r) { return r.json(); }),
          fetch(API_BASE + '/farmers/' + farmerId + '/crops', { headers: headers }).then(function(r) { return r.json(); }),
          fetch(API_BASE + '/farmers/' + farmerId + '/livestock', { headers: headers }).then(function(r) { return r.json(); }),
          fetch(API_BASE + '/farmers/' + farmerId + '/soil', { headers: headers }).then(function(r) { return r.json(); })
        ]).then(function(results) {
          var profileRes = results[0];
          var cropsRes = results[1];
          var livestockRes = results[2];
          var soilRes = results[3];

          if (!profileRes.success || !profileRes.data) {
            if (header) header.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger)">Failed to load farmer profile.</div>';
            return;
          }

          var farmer = profileRes.data;
          var crops = (cropsRes.success && cropsRes.data) ? cropsRes.data : [];
          var livestock = (livestockRes.success && livestockRes.data) ? livestockRes.data : [];
          var soilData = (soilRes.success && soilRes.data) ? soilRes.data : [];

          // Build a farmerData object compatible with score calculation
          // Sort crops oldest → newest (same as farmer-dashboard) for consistent trend calculation
          var sortedCrops = crops.slice().sort(function(a, b) {
            return new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0);
          });
          var yieldHistory = sortedCrops.map(function(c) { return parseFloat(c.yield_tonnes) || 0; });
          if (yieldHistory.length === 0) yieldHistory = [0, 0];
          var totalLivestock = livestock.reduce(function(sum, l) { return sum + (parseInt(l.total) || 0); }, 0);

          var farmerData = {
            id: farmer.id,
            name: farmer.name || 'Unknown',
            province: farmer.province || '',
            district: farmer.district || '',
            farmName: farmer.farm_size_hectares ? farmer.farm_size_hectares + ' ha Farm' : 'Farm',
            yieldHistory: yieldHistory,
            productionHistory: yieldHistory,
            livestock: totalLivestock,
            hectares: farmer.farm_size_hectares || 0,
            status: 'stable'
          };

          var score = AgriCore.calculatePerformanceScore(farmerData);
          var level = AgriCore.getScoreLevel(score);
          var warnings = AgriCore.detectWarnings(farmerData);

          // Profile header
          if (header) {
            var warningHtml = warnings.length > 0
              ? '<div class="profile-warnings">' + warnings.map(function(w) {
                return '<span class="warning-tag ' + w.type + '"><i data-lucide="' + escape(w.icon) + '"></i> ' + escape(w.message) + '</span>';
              }).join(' ') + '</div>'
              : '';

            var latestYield = yieldHistory[yieldHistory.length - 1];
            var badgeClass = level.level === 'good' ? 'success' : level.level === 'stable' ? 'warning' : level.level === 'no-data' ? 'secondary' : 'danger';

            header.innerHTML =
              '<div class="profile-avatar">' + escape(AgriCore.getInitials(farmer.name || 'U')) + '</div>' +
              '<div class="profile-info">' +
              '<h2>' + escape(farmer.name || 'Unknown') + '</h2>' +
              '<p>' + escape(farmerData.farmName) + '</p>' +
              '<p style="color:var(--gray-500)">' + escape(farmer.province || '') + ', ' + escape(farmer.district || '') + '</p>' +
              '<div class="profile-stats">' +
              '<div class="stat"><span class="stat-value" style="color:' + level.color + '">' + score + '</span><span class="stat-label">Score</span></div>' +
              '<div class="stat"><span class="stat-value">' + latestYield + 't</span><span class="stat-label">Yield</span></div>' +
              '<div class="stat"><span class="stat-value">' + totalLivestock + '</span><span class="stat-label">Livestock</span></div>' +
              '<div class="stat"><span class="stat-value">' + (farmer.farm_size_hectares || 0) + 'ha</span><span class="stat-label">Land</span></div>' +
              '</div>' +
              warningHtml +
              '</div>' +
              '<span class="badge badge-' + badgeClass + '">' + escape(level.label) + '</span>';
          }

          // Profile charts
          if (typeof window.renderProfileCharts === 'function') {
            window.renderProfileCharts(farmerData);
          }

          // Render all sections with real data
          renderProfileLivestock(livestock);
          renderProfileCrops(crops);
          renderProfileHealth(livestock);
          renderProfileEnvironment(farmer, soilData);
          renderProfileInsights(farmerData, crops, livestock);
          renderProfileRisk(farmerData);

          // Timeline from crop records (sorted newest first)
          var timeline = document.getElementById('profileTimeline');
          if (timeline) {
            var sorted = crops.slice().sort(function(a, b) {
              return new Date(b.recorded_at || 0) - new Date(a.recorded_at || 0);
            });
            if (sorted.length === 0) {
              timeline.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No upload history available.</p>';
            } else {
              timeline.innerHTML = sorted.map(function(c) {
                var date = c.recorded_at ? new Date(c.recorded_at).toLocaleDateString('en-ZA') : '--';
                return '<div class="timeline-item">' +
                  '<div class="timeline-dot"></div>' +
                  '<div class="timeline-content">' +
                  '<div class="timeline-date">' + date + '</div>' +
                  '<div class="timeline-text">' + escape(c.crop_name || 'Crop') + ': ' + (c.yield_tonnes || 0) + 't | ' + (c.hectares_planted || 0) + ' ha</div>' +
                  '</div></div>';
              }).join('');
            }
          }

          lucide.createIcons();
        }).catch(function() {
          if (header) header.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger)">Failed to load farmer profile. Please try again.</div>';
        });
      };

      // === Render Functions (using real API data) ===
      function renderProfileLivestock(livestock) {
        var grid = document.getElementById('profileLivestockGrid');
        var totalEl = document.getElementById('profileLivestockTotal');
        var growthEl = document.getElementById('profileLivestockGrowth');
        if (!grid) return;

        var totalAnimals = livestock.reduce(function(sum, l) { return sum + (parseInt(l.total) || 0); }, 0);
        if (totalEl) totalEl.textContent = totalAnimals + ' animals';

        if (livestock.length === 0) {
          grid.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No livestock data available.</p>';
          if (growthEl) growthEl.innerHTML = '';
          return;
        }

        var icons = { Cattle: 'beef', Goats: 'rabbit', Sheep: 'cloud', Chickens: 'bird', Ducks: 'bird', Pigs: 'piggy-bank', Horses: 'heart', Donkeys: 'heart' };

        grid.innerHTML = livestock.map(function(r) {
          var diseases = Array.isArray(r.diseases) ? r.diseases : [];
          var diseaseClass = diseases.length > 0 ? 'has-disease' : '';
          var diseaseHtml = diseases.length > 0
            ? '<div class="livestock-card-diseases">' + diseases.map(function(d) { return '<span class="disease-tag small">' + escape(d) + '</span>'; }).join('') + '</div>'
            : '<div class="livestock-card-diseases"><span class="disease-tag healthy small">Healthy</span></div>';
          return '<div class="livestock-card ' + diseaseClass + '">' +
            '<div class="livestock-card-icon"><i data-lucide="' + (icons[r.animal_type] || 'paw-print') + '"></i></div>' +
            '<div class="livestock-card-name">' + escape(r.animal_type || 'Unknown') + '</div>' +
            '<div class="livestock-card-count">' + (r.total || 0) + '</div>' +
            '<div class="livestock-card-meta">Born: ' + (r.born || 0) + ' | Sold: ' + (r.sold || 0) + ' | Young: ' + (r.young || 0) + '</div>' +
            diseaseHtml + '</div>';
        }).join('');

        if (growthEl) {
          var totalBorn = livestock.reduce(function(s, l) { return s + (parseInt(l.born) || 0); }, 0);
          var totalSold = livestock.reduce(function(s, l) { return s + (parseInt(l.sold) || 0); }, 0);
          var netGrowth = totalAnimals > 0 ? (((totalBorn - totalSold) / totalAnimals) * 100).toFixed(1) : 0;
          var rateClass = netGrowth > 0 ? 'positive' : netGrowth < 0 ? 'negative' : 'neutral';
          growthEl.innerHTML = '<div class="growth-indicator ' + rateClass + '">' +
            '<span>Livestock Growth Rate:</span> <strong>' + (netGrowth > 0 ? '+' : '') + netGrowth + '%</strong></div>';
        }
      }

      function renderProfileCrops(crops) {
        var table = document.getElementById('profileCropTable');
        var totalEl = document.getElementById('profileCropTotal');
        if (!table) return;

        var totalYield = crops.reduce(function(s, c) { return s + (parseFloat(c.yield_tonnes) || 0); }, 0);
        if (totalEl) totalEl.textContent = totalYield.toFixed(1) + ' t total';

        if (crops.length === 0) {
          table.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No crop data available.</p>';
          return;
        }

        var rows = crops.map(function(c) {
          var ha = parseFloat(c.hectares_planted) || 0;
          var yld = parseFloat(c.yield_tonnes) || 0;
          var prod = ha > 0 ? (yld / ha).toFixed(1) : '0.0';
          return '<tr><td><strong>' + escape(c.crop_name || c.crop_type || 'Unknown') + '</strong></td><td>' + ha + ' ha</td><td>' + yld + ' t</td><td>' + prod + ' t/ha</td></tr>';
        }).join('');

        table.innerHTML = '<table class="table"><thead><tr><th>Crop</th><th>Area</th><th>Yield</th><th>Productivity</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }

      function renderProfileHealth(livestock) {
        var content = document.getElementById('profileHealthContent');
        var countBadge = document.getElementById('profileDiseaseCount');
        if (!content) return;

        var allDiseases = [];
        livestock.forEach(function(r) {
          var diseases = Array.isArray(r.diseases) ? r.diseases : [];
          diseases.forEach(function(d) {
            if (d) allDiseases.push({ disease: d, animal: r.animal_type || 'Unknown', treatment: r.treatment || '', lastDosed: r.last_dosed || 'N/A' });
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

      function renderProfileEnvironment(farmer, soilData) {
        var grid = document.getElementById('profileEnvGrid');
        if (!grid) return;

        var soil = soilData && soilData.length > 0 ? soilData[0] : {};

        // If farmer has coordinates, fetch weather; otherwise show placeholders
        if (farmer.latitude && farmer.longitude) {
          var lat = parseFloat(farmer.latitude);
          var lng = parseFloat(farmer.longitude);
          var today = new Date().toISOString().split('T')[0];
          var weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
          fetch('https://archive-api.open-meteo.com/v1/archive?latitude=' + lat + '&longitude=' + lng +
            '&start_date=' + weekAgo + '&end_date=' + today +
            '&daily=temperature_2m_max,precipitation_sum&hourly=relative_humidity_2m&timezone=auto')
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (!data || !data.daily) return;
              var d = data.daily;
              var rain = d.precipitation_sum ? d.precipitation_sum.reduce(function(s, v) { return s + (v || 0); }, 0).toFixed(1) : '0';
              var temps = d.temperature_2m_max || [];
              var avgT = temps.length > 0 ? (temps.reduce(function(s, v) { return s + v; }, 0) / temps.length).toFixed(1) : '--';
              var humArr = data.hourly && data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m : [];
              var avgH = humArr.length > 0 ? Math.round(humArr.reduce(function(s, v) { return s + v; }, 0) / humArr.length) : '--';
              var droughtR = parseFloat(rain) < 5 ? 'High' : parseFloat(rain) < 15 ? 'Moderate' : 'Low';
              renderEnvGrid(grid, rain, avgT, avgH, droughtR, soil);
            }).catch(function() {
              renderEnvGrid(grid, '--', '--', '--', 'N/A', soil);
            });
        } else {
          renderEnvGrid(grid, '--', '--', '--', 'N/A', soil);
        }
      }

      function renderEnvGrid(grid, rain, temp, hum, drought, soil) {
        grid.innerHTML =
          '<div class="env-card"><div class="env-card-icon rain"><i data-lucide="cloud-rain"></i></div><div class="env-card-value">' + rain + ' mm</div><div class="env-card-label">Weekly Rainfall</div></div>' +
          '<div class="env-card"><div class="env-card-icon temp"><i data-lucide="thermometer"></i></div><div class="env-card-value">' + temp + '\u00B0C</div><div class="env-card-label">Avg Temperature</div></div>' +
          '<div class="env-card"><div class="env-card-icon humidity"><i data-lucide="droplets"></i></div><div class="env-card-value">' + hum + '%</div><div class="env-card-label">Humidity</div></div>' +
          '<div class="env-card"><div class="env-card-icon drought"><i data-lucide="sun"></i></div><div class="env-card-value">' + drought + '</div><div class="env-card-label">Drought Risk</div></div>' +
          '<div class="env-card"><div class="env-card-icon green"><i data-lucide="mountain"></i></div><div class="env-card-value">' + escape(soil.soil_type || soil.soilType || '--') + '</div><div class="env-card-label">Soil Type</div></div>' +
          '<div class="env-card"><div class="env-card-icon purple"><i data-lucide="droplet"></i></div><div class="env-card-value">' + escape(soil.irrigation_type || 'None') + '</div><div class="env-card-label">Irrigation</div></div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }

      function renderProfileInsights(farmerData, crops, livestock) {
        var list = document.getElementById('profileInsightsList');
        if (!list) return;

        var insights = [];
        var score = AgriCore.calculatePerformanceScore(farmerData);

        if (score === 0) {
          insights.push({ type: 'info', icon: 'info', text: 'No farm data submitted yet. Encourage the farmer to submit their first data upload.' });
        } else if (score >= 70) {
          insights.push({ type: 'success', icon: 'trending-up', text: 'This farmer is performing well. Consider as a model for peer learning programs.' });
        } else if (score < 40) {
          insights.push({ type: 'danger', icon: 'alert-triangle', text: 'Performance is declining. Prioritize this farmer for field visit and support plan.' });
        }

        if (crops.length === 0) {
          insights.push({ type: 'warning', icon: 'wheat', text: 'No crop records on file. Request crop data during next interaction.' });
        }
        if (livestock.length === 0) {
          insights.push({ type: 'warning', icon: 'beef', text: 'No livestock records on file. Verify if this is a crop-only farm.' });
        }

        var allDiseases = [];
        livestock.forEach(function(l) { if (Array.isArray(l.diseases)) allDiseases = allDiseases.concat(l.diseases); });
        if (allDiseases.length > 0) {
          insights.push({ type: 'danger', icon: 'bug', text: 'Active diseases detected: ' + allDiseases.join(', ') + '. Arrange veterinary support.' });
        }

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

      function renderProfileRisk(farmerData) {
        var content = document.getElementById('profileRiskContent');
        var levelBadge = document.getElementById('profileRiskLevel');
        if (!content) return;

        var score = AgriCore.calculatePerformanceScore(farmerData);
        var reasons = [];
        var riskScore = 0;

        if (score === 0) {
          riskScore = 30;
          reasons.push('No data submitted — unable to assess');
        } else if (score < 40) {
          riskScore = 70;
          reasons.push('Performance score is critically low (' + score + ')');
        } else if (score < 60) {
          riskScore = 40;
          reasons.push('Performance score below average (' + score + ')');
        }

        if (farmerData.livestock === 0 && farmerData.yieldHistory.every(function(y) { return y === 0; })) {
          riskScore = Math.max(riskScore, 50);
          reasons.push('No crop yield or livestock recorded');
        }

        var riskLevel = riskScore >= 60 ? 'High' : riskScore >= 40 ? 'Medium' : riskScore >= 20 ? 'Low' : 'Minimal';
        var fillClass = riskScore >= 60 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';

        if (levelBadge) {
          levelBadge.textContent = riskLevel + ' (' + riskScore + ')';
          levelBadge.className = 'profile-section-badge ' + (riskScore >= 60 ? 'danger' : riskScore >= 40 ? 'warning' : 'good');
        }

        var factorsHtml = '';
        if (reasons.length > 0) {
          factorsHtml = '<div class="risk-factors">' +
            reasons.map(function(r) { return '<div class="risk-factor"><div class="risk-factor-dot ' + fillClass + '"></div>' + escape(r) + '</div>'; }).join('') +
            '</div>';
        } else {
          factorsHtml = '<p style="color:var(--gray-400);font-size:.875rem;">No significant risk factors detected.</p>';
        }

        content.innerHTML = '<div class="risk-meter"><div class="risk-meter-fill ' + fillClass + '" style="width:' + riskScore + '%"></div></div>' + factorsHtml;
      }
    }
  });
})();
