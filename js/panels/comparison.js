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
    }
  });
})();
