/* ============================================
   AgriCore — Map View Panel
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'mapView',
    panelId: 'panel-map',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Farmer Location Map</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">View farmer locations color-coded by performance.</p>
          </div>
        </div>
        <div class="map-container" id="farmerMap"></div>
        <div class="map-legend">
          <div class="legend-item"><span class="legend-dot good"></span> Performing Well (70\u2013100)</div>
          <div class="legend-item"><span class="legend-dot stable"></span> Stable (40\u201369)</div>
          <div class="legend-item"><span class="legend-dot declining"></span> Declining (0\u201339)</div>
        </div>
      `;
    },

    init: function(ctx) {
      var farmerMap = null;

      window.initFarmerMap = function() {
        if (farmerMap) {
          farmerMap.invalidateSize();
          return;
        }

        var container = document.getElementById('farmerMap');
        if (!container || typeof L === 'undefined') return;

        farmerMap = L.map('farmerMap').setView([-28.5, 25.5], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(farmerMap);

        var colorMap = { good: '#2e7d32', stable: '#f9a825', declining: '#c62828' };
        var escape = AgriCore.escapeHtml;

        AgriCore.mockFarmers.forEach(function(f) {
          if (!f.coordinates) return;
          var score = AgriCore.calculatePerformanceScore(f);
          var level = AgriCore.getScoreLevel(score);
          var warnings = AgriCore.detectWarnings(f);
          var lastYield = f.yieldHistory[f.yieldHistory.length - 1];

          var warningText = warnings.length > 0
            ? '<br><strong style="color:#c62828;">Warnings:</strong> ' + warnings.map(function(w) { return escape(w.message); }).join(', ')
            : '';

          var marker = L.circleMarker([f.coordinates.lat, f.coordinates.lng], {
            radius: 10,
            fillColor: colorMap[level.level] || '#999',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
          }).addTo(farmerMap);

          marker.bindPopup(
            '<div style="min-width:180px;">' +
            '<strong>' + escape(f.name) + '</strong><br>' +
            escape(f.farmName) + '<br>' +
            '<span style="color:var(--gray-500);font-size:.8rem;">' + escape(f.province) + ', ' + escape(f.district) + '</span><br><br>' +
            'Score: <strong style="color:' + level.color + '">' + score + '</strong> &mdash; ' + escape(level.label) + '<br>' +
            'Yield: <strong>' + lastYield + 't/ha</strong><br>' +
            'Livestock: <strong>' + f.livestock + '</strong>' +
            warningText + '</div>'
          );
        });
      };
    }
  });
})();
