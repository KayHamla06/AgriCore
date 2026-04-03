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
      var token = (ctx.user && ctx.user.token) || '';
      var API_BASE = window.AGRICORE_API_BASE || '/api';
      var mapPanelId = 'panel-map';

      function getMarkerColor(f) {
        var thirtyDays = 30 * 24 * 60 * 60 * 1000;
        var lastUpdate = f.updated_at ? new Date(f.updated_at).getTime() : 0;
        var isRecent = lastUpdate > 0 && (Date.now() - lastUpdate) < thirtyDays;
        if (f.verified && isRecent) return '#2e7d32';  // Green: Verified + active
        if (f.verified || isRecent) return '#f59e0b';  // Amber: Verified or recently active
        return '#dc2626';                               // Red: Not verified + no recent data
      }

      function addMarker(f) {
        if (!f || f.latitude == null || f.longitude == null) return;

        var marker = L.circleMarker([f.latitude, f.longitude], {
          radius: 10,
          fillColor: getMarkerColor(f),
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(farmerMap);

        marker.bindPopup(
          '<div style="min-width:180px;">' +
          '<strong>' + AgriCore.escapeHtml(f.name || 'Unknown Farmer') + '</strong><br>' +
          '<span style="color:var(--gray-500);font-size:.8rem;">' +
            AgriCore.escapeHtml(f.province || 'N/A') + ', ' + AgriCore.escapeHtml(f.district || 'N/A') +
          '</span><br>' +
          '<span style="font-size:.75rem;color:#666;">Lat: ' + f.latitude + ', Lng: ' + f.longitude + '</span>' +
          '</div>'
        );
      }

      window.initFarmerMap = function() {
        var mapPanel = document.getElementById(mapPanelId);
        if (!mapPanel || !mapPanel.classList.contains('active')) return;

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

        var endpoint = ctx.isFarmer ? '/farmers/me' : '/farmers?limit=200';
        fetch(API_BASE + endpoint, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            var farmers = [];
            if (ctx.isFarmer && data.success && data.data) {
              farmers = [data.data];
            } else if (!ctx.isFarmer && data.success && data.data && data.data.data) {
              farmers = data.data.data;
            }

            var hasAny = false;
            farmers.forEach(function(f) {
              addMarker(f);
              if (f && f.latitude != null && f.longitude != null) hasAny = true;
            });

            if (hasAny && farmers[0] && farmers[0].latitude != null && farmers[0].longitude != null) {
              farmerMap.setView([farmers[0].latitude, farmers[0].longitude], ctx.isFarmer ? 11 : 6);
            }
          })
          .catch(function() {
            // Keep map visible even when API fails.
          });
      };

      window.destroyFarmerMap = function() {
        if (farmerMap) {
          farmerMap.remove();
          farmerMap = null;
        }
        var container = document.getElementById('farmerMap');
        if (container) container.innerHTML = '';
      };
    }
  });
})();
