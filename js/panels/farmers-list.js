/* ============================================
   AgriCore — Farmers List Panel (Gov only)
   Fetches real data via API with pagination,
   search, and status filters.
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
            <input type="text" id="farmerSearchInput" placeholder="Search by name, location...">
          </div>
          <div class="filter-group">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="verified">Verified</button>
            <button class="filter-btn" data-filter="unverified">Unverified</button>
          </div>
        </div>

        <div class="card">
          <div id="farmersListLoader"></div>
          <table class="table" id="farmersTable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Province</th>
                <th>District</th>
                <th>Farm Size</th>
                <th>Status</th>
                <th>Last Visit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="farmersTableBody"></tbody>
          </table>
          <div class="pagination" id="farmersPagination"></div>
        </div>
      `;
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;
      var currentPage = 1;
      var pageSize = 20;
      var currentFilter = 'all';
      var searchQuery = '';
      var allFarmers = [];
      var searchTimer = null;

      function loadFarmers(page) {
        var loader = document.getElementById('farmersListLoader');
        if (loader) AgriCore.showLoading(loader);

        AgriCore.apiGet('/farmers?page=' + page + '&limit=100').then(function(res) {
          if (loader) loader.innerHTML = '';

          if (!res.success || !res.data) {
            var tbody = document.getElementById('farmersTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-500);">Failed to load farmers.</td></tr>';
            return;
          }

          var result = res.data;
          allFarmers = result.data || result;

          // Load last-visit info in background
          loadLastVisits();

          renderTable();
        });
      }

      // Fetch last visit dates for all farmers (background)
      var lastVisitMap = {};
      function loadLastVisits() {
        AgriCore.apiGet('/visits').then(function(res) {
          if (res.success && res.data) {
            var visits = Array.isArray(res.data) ? res.data : (res.data.data || []);
            visits.forEach(function(v) {
              if (v.farmer_id) {
                var existing = lastVisitMap[v.farmer_id];
                var vDate = new Date(v.visit_date || v.created_at);
                if (!existing || vDate > existing) {
                  lastVisitMap[v.farmer_id] = vDate;
                }
              }
            });
            renderTable(); // re-render with visit dates
          }
        }).catch(function() {});
      }

      function getFilteredFarmers() {
        var filtered = allFarmers;

        // Status filter
        if (currentFilter === 'verified') {
          filtered = filtered.filter(function(f) { return f.verified === true; });
        } else if (currentFilter === 'unverified') {
          filtered = filtered.filter(function(f) { return !f.verified; });
        }

        // Search
        if (searchQuery) {
          var q = searchQuery.toLowerCase();
          filtered = filtered.filter(function(f) {
            return (f.name && f.name.toLowerCase().indexOf(q) > -1) ||
                   (f.province && f.province.toLowerCase().indexOf(q) > -1) ||
                   (f.district && f.district.toLowerCase().indexOf(q) > -1) ||
                   (f.email && f.email.toLowerCase().indexOf(q) > -1);
          });
        }

        return filtered;
      }

      function renderTable() {
        var tbody = document.getElementById('farmersTableBody');
        if (!tbody) return;

        var filtered = getFilteredFarmers();
        var totalPages = Math.ceil(filtered.length / pageSize) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        var start = (currentPage - 1) * pageSize;
        var pageData = filtered.slice(start, start + pageSize);

        if (pageData.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-500);">No farmers found.</td></tr>';
          renderPagination(0, 1);
          return;
        }

        tbody.innerHTML = pageData.map(function(f) {
          var lastVisit = lastVisitMap[f.id];
          var visitText = 'Never';
          var visitClass = 'badge-danger';
          if (lastVisit) {
            var daysAgo = Math.floor((Date.now() - lastVisit.getTime()) / 86400000);
            if (daysAgo === 0) { visitText = 'Today'; visitClass = 'badge-success'; }
            else if (daysAgo === 1) { visitText = 'Yesterday'; visitClass = 'badge-success'; }
            else if (daysAgo <= 14) { visitText = daysAgo + 'd ago'; visitClass = 'badge-success'; }
            else if (daysAgo <= 30) { visitText = daysAgo + 'd ago'; visitClass = 'badge-warning'; }
            else { visitText = daysAgo + 'd ago'; visitClass = 'badge-danger'; }
          }

          return '<tr>' +
            '<td><strong>' + escape(f.name || '') + '</strong>' +
            (f.email ? '<br><span style="font-size:.75rem;color:var(--gray-500);">' + escape(f.email) + '</span>' : '') + '</td>' +
            '<td>' + escape(f.province || 'N/A') + '</td>' +
            '<td>' + escape(f.district || 'N/A') + '</td>' +
            '<td>' + (f.farm_size_hectares ? escape(f.farm_size_hectares) + ' ha' : 'N/A') + '</td>' +
            '<td><span class="badge ' + (f.verified ? 'badge-success' : 'badge-warning') + '">' + (f.verified ? 'Verified' : 'Unverified') + '</span></td>' +
            '<td><span class="badge ' + visitClass + '">' + visitText + '</span></td>' +
            '<td>' +
              '<button class="btn btn-primary btn-sm view-farmer-btn" data-id="' + escape(f.id) + '"><i data-lucide="eye" style="width:14px;height:14px;"></i> View</button>' +
            '</td>' +
            '</tr>';
        }).join('');

        renderPagination(filtered.length, totalPages);

        tbody.querySelectorAll('.view-farmer-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (window.viewFarmerProfile) window.viewFarmerProfile(btn.dataset.id);
          });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
      }

      function renderPagination(total, totalPages) {
        var pag = document.getElementById('farmersPagination');
        if (!pag) return;

        if (totalPages <= 1) {
          pag.innerHTML = '<span style="font-size:.8rem;color:var(--gray-500);">Showing ' + total + ' farmer' + (total !== 1 ? 's' : '') + '</span>';
          return;
        }

        var html = '<span style="font-size:.8rem;color:var(--gray-500);">Page ' + currentPage + ' of ' + totalPages + ' (' + total + ' farmers)</span><div class="pagination-btns">';

        if (currentPage > 1) html += '<button class="btn btn-ghost btn-sm" data-page="' + (currentPage - 1) + '">&laquo; Prev</button>';

        // Show max 5 page buttons
        var startP = Math.max(1, currentPage - 2);
        var endP = Math.min(totalPages, startP + 4);
        for (var i = startP; i <= endP; i++) {
          html += '<button class="btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-ghost') + '" data-page="' + i + '">' + i + '</button>';
        }

        if (currentPage < totalPages) html += '<button class="btn btn-ghost btn-sm" data-page="' + (currentPage + 1) + '">Next &raquo;</button>';
        html += '</div>';
        pag.innerHTML = html;

        pag.querySelectorAll('[data-page]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            currentPage = parseInt(btn.dataset.page);
            renderTable();
          });
        });
      }

      // Initial load
      loadFarmers(1);

      // Filter buttons
      document.querySelectorAll('.filter-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          currentPage = 1;
          renderTable();
        });
      });

      // Search with debounce
      var searchInput = document.getElementById('farmerSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          clearTimeout(searchTimer);
          searchTimer = setTimeout(function() {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            renderTable();
          }, 300);
        });
      }
    }
  });
})();
