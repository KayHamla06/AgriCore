/* ============================================
   AgriCore — Visit Log Panel (Advisor)
   Field visit history + create new visit.
   Uses real API: /api/visits
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'visitLog',
    panelId: 'panel-visits',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Visit Log</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Track and record all field visits.</p>
          </div>
          <button class="btn btn-primary" id="newVisitBtn"><i data-lucide="plus"></i> Log Visit</button>
        </div>

        <div class="overview-cards" id="visitStatsCards">
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon blue"><i data-lucide="map-pin"></i></div></div>
            <div class="overview-card-value" id="visitTotalVal">--</div>
            <div class="overview-card-label">Total Visits</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon green"><i data-lucide="calendar-check"></i></div></div>
            <div class="overview-card-value" id="visitThisMonthVal">--</div>
            <div class="overview-card-label">This Month</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon yellow"><i data-lucide="users"></i></div></div>
            <div class="overview-card-value" id="visitFarmersVal">--</div>
            <div class="overview-card-label">Farmers Visited</div>
          </div>
        </div>

        <!-- New Visit Form (hidden by default) -->
        <div class="card" id="newVisitForm" style="display:none;">
          <h3 style="margin-bottom:12px;"><i data-lucide="clipboard-plus" style="width:18px;height:18px;"></i> New Visit</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Farmer</label>
              <select id="visitFarmerSelect" class="form-input"><option value="">-- Select farmer --</option></select>
            </div>
            <div class="form-group">
              <label>Location Name</label>
              <input type="text" id="visitLocation" class="form-input" placeholder="Farm name or area" maxlength="200">
            </div>
            <div class="form-group">
              <label>Visit Date</label>
              <input type="datetime-local" id="visitDate" class="form-input">
            </div>
            <div class="form-group">
              <label>Purpose</label>
              <input type="text" id="visitPurpose" class="form-input" placeholder="Reason for visit" maxlength="500">
            </div>
            <div class="form-group" style="grid-column:1/-1;">
              <label>Findings</label>
              <textarea id="visitFindings" class="form-input" rows="3" placeholder="What did you observe?" maxlength="5000"></textarea>
            </div>
            <div class="form-group" style="grid-column:1/-1;">
              <label>Recommendations</label>
              <textarea id="visitRecommendations" class="form-input" rows="3" placeholder="Suggested actions..." maxlength="5000"></textarea>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn btn-primary" id="submitVisitBtn"><i data-lucide="check"></i> Submit Visit</button>
            <button class="btn btn-ghost" id="cancelVisitBtn">Cancel</button>
          </div>
        </div>

        <!-- Visit List -->
        <div class="card">
          <div id="visitListLoader"></div>
          <div id="visitList"></div>
        </div>
      `;
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;
      var visits = [];
      var farmersMap = {};

      // Load farmers for select dropdown
      function loadFarmerOptions() {
        AgriCore.apiGet('/farmers?page=1&limit=200').then(function(res) {
          if (!res.success || !res.data) return;
          var farmers = res.data.data || res.data;
          var sel = document.getElementById('visitFarmerSelect');
          if (!sel) return;
          farmers.forEach(function(f) {
            farmersMap[f.id] = f.name;
            var opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name + (f.district ? ' (' + f.district + ')' : '');
            sel.appendChild(opt);
          });
        });
      }

      function loadVisits() {
        var loader = document.getElementById('visitListLoader');
        if (loader) AgriCore.showLoading(loader);

        AgriCore.apiGet('/visits').then(function(res) {
          if (loader) loader.innerHTML = '';

          if (!res.success || !res.data) {
            var list = document.getElementById('visitList');
            if (list) list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:24px;">No visits recorded yet.</p>';
            return;
          }

          visits = Array.isArray(res.data) ? res.data : (res.data.data || []);
          renderStats();
          renderVisitList();
        });
      }

      function renderStats() {
        var now = new Date();
        var thisMonth = visits.filter(function(v) {
          var d = new Date(v.visit_date || v.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        var uniqueFarmers = {};
        visits.forEach(function(v) { if (v.farmer_id) uniqueFarmers[v.farmer_id] = true; });

        var el1 = document.getElementById('visitTotalVal');
        var el2 = document.getElementById('visitThisMonthVal');
        var el3 = document.getElementById('visitFarmersVal');
        if (el1) el1.textContent = visits.length;
        if (el2) el2.textContent = thisMonth.length;
        if (el3) el3.textContent = Object.keys(uniqueFarmers).length;
      }

      function renderVisitList() {
        var list = document.getElementById('visitList');
        if (!list) return;

        if (visits.length === 0) {
          list.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:24px;">No visits recorded yet. Click "Log Visit" to get started.</p>';
          return;
        }

        list.innerHTML = visits.map(function(v) {
          var date = v.visit_date ? new Date(v.visit_date).toLocaleDateString('en-ZA', { year:'numeric', month:'short', day:'numeric' }) : 'N/A';
          var farmerName = farmersMap[v.farmer_id] || v.farmer_id || 'Unknown';
          return '<div class="visit-card">' +
            '<div class="visit-card-header">' +
              '<div>' +
                '<strong>' + escape(v.location_name || v.purpose || 'Field Visit') + '</strong>' +
                '<span class="visit-farmer-tag"><i data-lucide="user" style="width:12px;height:12px;"></i> ' + escape(farmerName) + '</span>' +
              '</div>' +
              '<span class="badge badge-success">' + date + '</span>' +
            '</div>' +
            (v.purpose ? '<div class="visit-detail"><strong>Purpose:</strong> ' + escape(v.purpose) + '</div>' : '') +
            (v.findings ? '<div class="visit-detail"><strong>Findings:</strong> ' + escape(v.findings) + '</div>' : '') +
            (v.recommendations ? '<div class="visit-detail"><strong>Recommendations:</strong> ' + escape(v.recommendations) + '</div>' : '') +
          '</div>';
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
      }

      // Toggle form
      var newVisitBtn = document.getElementById('newVisitBtn');
      var newVisitForm = document.getElementById('newVisitForm');
      var cancelVisitBtn = document.getElementById('cancelVisitBtn');

      if (newVisitBtn) {
        newVisitBtn.addEventListener('click', function() {
          if (newVisitForm) newVisitForm.style.display = newVisitForm.style.display === 'none' ? 'block' : 'none';
          // Set default date
          var dateInput = document.getElementById('visitDate');
          if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().slice(0, 16);
          }
          if (typeof lucide !== 'undefined') lucide.createIcons();
        });
      }

      if (cancelVisitBtn) {
        cancelVisitBtn.addEventListener('click', function() {
          if (newVisitForm) newVisitForm.style.display = 'none';
        });
      }

      // Submit visit
      var submitVisitBtn = document.getElementById('submitVisitBtn');
      if (submitVisitBtn) {
        submitVisitBtn.addEventListener('click', function() {
          var farmerId = document.getElementById('visitFarmerSelect').value;
          var location = document.getElementById('visitLocation').value.trim();
          var date = document.getElementById('visitDate').value;
          var purpose = document.getElementById('visitPurpose').value.trim();
          var findings = document.getElementById('visitFindings').value.trim();
          var recommendations = document.getElementById('visitRecommendations').value.trim();

          if (!location || !purpose) {
            AgriCore.showToast('Please fill in location and purpose.', 'error');
            return;
          }

          submitVisitBtn.disabled = true;
          submitVisitBtn.textContent = 'Submitting...';

          var body = {
            location_name: location,
            purpose: purpose,
            visit_date: date ? new Date(date).toISOString() : new Date().toISOString()
          };
          if (farmerId) body.farmer_id = farmerId;
          if (findings) body.findings = findings;
          if (recommendations) body.recommendations = recommendations;

          AgriCore.apiPost('/visits', body).then(function(res) {
            submitVisitBtn.disabled = false;
            submitVisitBtn.textContent = 'Submit Visit';

            if (res.success) {
              AgriCore.showToast('Visit logged successfully!', 'success');
              if (newVisitForm) newVisitForm.style.display = 'none';
              // Clear form
              document.getElementById('visitFarmerSelect').value = '';
              document.getElementById('visitLocation').value = '';
              document.getElementById('visitPurpose').value = '';
              document.getElementById('visitFindings').value = '';
              document.getElementById('visitRecommendations').value = '';
              loadVisits();
            } else {
              AgriCore.showToast(res.error || 'Failed to log visit.', 'error');
            }
          });
        });
      }

      // Initial load
      loadFarmerOptions();
      loadVisits();
    }
  });
})();
