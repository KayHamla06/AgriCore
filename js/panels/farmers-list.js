/* ============================================
   AgriCore — Farmers List Panel (Gov only)
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'farmersList',
    panelId: 'panel-farmers',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Farmer Directory</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">View and manage all registered farmers.</p>
          </div>
        </div>

        <div class="farmers-toolbar">
          <div class="search-box">
            <i data-lucide="search"></i>
            <input type="text" id="farmerSearchInput" placeholder="Search farmers...">
          </div>
          <div class="filter-group">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="improving">Improving</button>
            <button class="filter-btn" data-filter="declining">Declining</button>
          </div>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Farm</th>
                <th>Location</th>
                <th>Type</th>
                <th>Performance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="farmersTableBody"></tbody>
          </table>
        </div>
      `;
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;

      function populateFarmersTable(filter) {
        var tbody = document.getElementById('farmersTableBody');
        if (!tbody) return;

        var farmers = [];
        if (filter && filter !== 'all') {
          farmers = farmers.filter(function(f) { return f.status === filter; });
        }

        tbody.innerHTML = farmers.map(function(f) {
          var score = AgriCore.calculatePerformanceScore(f);
          var level = AgriCore.getScoreLevel(score);
          return '<tr>' +
            '<td><strong>' + escape(f.name) + '</strong></td>' +
            '<td>' + escape(f.farmName) + '</td>' +
            '<td>' + escape(f.province) + ', ' + escape(f.district) + '</td>' +
            '<td>' + escape(f.type) + '</td>' +
            '<td><strong style="color:' + level.color + '">' + score + '</strong></td>' +
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

      // Initial population
      populateFarmersTable('all');

      // Filter buttons
      document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          populateFarmersTable(btn.dataset.filter);
        });
      });

      // Search
      var searchInput = document.getElementById('farmerSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          var query = searchInput.value.toLowerCase();
          var rows = document.querySelectorAll('#farmersTableBody tr');
          rows.forEach(function(row) {
            row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
          });
        });
      }
    }
  });
})();
