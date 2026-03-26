/* ============================================
   AgriCore — Comparison Panel (Gov)
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'comparison',
    panelId: 'panel-compare',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Farmer Comparison</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Compare farmer performance within the same area.</p>
          </div>
        </div>

        <div class="compare-controls">
          <div class="form-group">
            <label class="form-label">Filter by Province</label>
            <select class="form-select" id="compareProvince">
              <option value="all">All Provinces</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data Types</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <label style="font-size:.8125rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" value="livestock" class="compare-data-type" checked> Livestock</label>
              <label style="font-size:.8125rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" value="crops" class="compare-data-type" checked> Crops</label>
              <label style="font-size:.8125rem;display:flex;align-items:center;gap:4px;"><input type="checkbox" value="soil" class="compare-data-type" checked> Soil</label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Time Range</label>
            <div style="display:flex;gap:8px;">
              <input type="date" class="form-input" id="compareFromDate" placeholder="From" style="max-width:150px;">
              <input type="date" class="form-input" id="compareToDate" placeholder="To" style="max-width:150px;">
            </div>
          </div>
          <button class="btn btn-primary" id="downloadComparisonPdfBtn"><i data-lucide="file-down"></i> Download Comparison PDF</button>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Farm</th>
                <th>Province</th>
                <th>Yield (t/ha)</th>
                <th>Score</th>
                <th>Status</th>
                <th>Warnings</th>
              </tr>
            </thead>
            <tbody id="compareTableBody"></tbody>
          </table>
        </div>
      `;
    },

    init: function(ctx) {
      if (!ctx.isGov) return;

      var escape = AgriCore.escapeHtml;

      function populateComparisonTable(province) {
        var tbody = document.getElementById('compareTableBody');
        if (!tbody) return;

        var farmers = AgriCore.mockFarmers;
        if (province && province !== 'all') {
          farmers = farmers.filter(function(f) { return f.province === province; });
        }

        farmers = farmers.slice().sort(function(a, b) {
          return AgriCore.calculatePerformanceScore(b) - AgriCore.calculatePerformanceScore(a);
        });

        tbody.innerHTML = farmers.map(function(f) {
          var score = AgriCore.calculatePerformanceScore(f);
          var level = AgriCore.getScoreLevel(score);
          var warnings = AgriCore.detectWarnings(f);
          var lastYield = f.yieldHistory[f.yieldHistory.length - 1];

          var warningTags = warnings.slice(0, 2).map(function(w) {
            return '<span class="warning-tag ' + w.type + '"><i data-lucide="' + escape(w.icon) + '"></i> ' + escape(w.message) + '</span>';
          }).join(' ');

          return '<tr>' +
            '<td><strong>' + escape(f.name) + '</strong></td>' +
            '<td>' + escape(f.farmName) + '</td>' +
            '<td>' + escape(f.province) + '</td>' +
            '<td><strong>' + lastYield + 't</strong></td>' +
            '<td><div class="compare-table-score"><strong style="color:' + level.color + '">' + score + '</strong>' +
            '<div class="score-bar-bg"><div class="score-bar-fill ' + level.cssClass + '" style="width:' + score + '%"></div></div></div></td>' +
            '<td><span class="badge badge-' + (level.level === 'good' ? 'success' : level.level === 'stable' ? 'warning' : 'danger') + '">' + escape(level.label) + '</span></td>' +
            '<td>' + (warningTags || '<span style="color:var(--gray-400);font-size:.75rem;">None</span>') + '</td></tr>';
        }).join('');

        lucide.createIcons();
      }

      // Province filter
      var select = document.getElementById('compareProvince');
      if (select) {
        var provinces = [];
        var seen = {};
        AgriCore.mockFarmers.forEach(function(f) {
          if (!seen[f.province]) { seen[f.province] = true; provinces.push(f.province); }
        });
        provinces.sort().forEach(function(p) {
          var opt = document.createElement('option');
          opt.value = p;
          opt.textContent = p;
          select.appendChild(opt);
        });
        select.addEventListener('change', function() { populateComparisonTable(select.value); });
      }

      populateComparisonTable('all');

      // === Comparison PDF Download ===
      var compPdfBtn = document.getElementById('downloadComparisonPdfBtn');
      if (compPdfBtn) {
        compPdfBtn.addEventListener('click', function() {
          // Get selected farmer IDs from the current, visible table
          var farmerIds = AgriCore.mockFarmers.map(function(f) { return f.id; });
          var province = select ? select.value : 'all';
          if (province && province !== 'all') {
            farmerIds = AgriCore.mockFarmers.filter(function(f) { return f.province === province; }).map(function(f) { return f.id; });
          }

          if (farmerIds.length < 2) {
            AgriCore.showToast('At least 2 farmers are needed for comparison.', 'error');
            return;
          }

          // Get selected data types
          var dataTypes = [];
          document.querySelectorAll('.compare-data-type:checked').forEach(function(cb) {
            dataTypes.push(cb.value);
          });
          if (dataTypes.length === 0) dataTypes = ['livestock', 'crops', 'soil'];

          // Get time range
          var fromDate = document.getElementById('compareFromDate');
          var toDate = document.getElementById('compareToDate');
          var timeRange = {};
          if (fromDate && fromDate.value) timeRange.from = fromDate.value;
          if (toDate && toDate.value) timeRange.to = toDate.value;

          compPdfBtn.disabled = true;
          compPdfBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var token = ctx.user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';

          fetch(API_BASE + '/pdf/compare', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
              farmerIds: farmerIds,
              dataTypes: dataTypes,
              timeRange: timeRange,
            }),
          })
          .then(function(res) {
            if (!res.ok) throw new Error('Failed to generate comparison PDF');
            return res.blob();
          })
          .then(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'AgriCore_Comparison_Report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            AgriCore.showToast('Comparison report downloaded!', 'success');
          })
          .catch(function() {
            AgriCore.showToast('Failed to generate comparison report.', 'error');
          })
          .finally(function() {
            compPdfBtn.disabled = false;
            compPdfBtn.innerHTML = '<i data-lucide="file-down"></i> Download Comparison PDF';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        });
      }
    }
  });
})();
