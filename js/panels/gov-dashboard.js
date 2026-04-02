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

        <!-- Date/Time & Weather Strip -->
        <div class="datetime-weather-strip">
          <div class="datetime-widget">
            <div class="datetime-icon"><i data-lucide="calendar-clock"></i></div>
            <div class="datetime-info">
              <div class="datetime-date" id="govLiveDate">--</div>
              <div class="datetime-time" id="govLiveTime">--:--:--</div>
            </div>
          </div>
          <div class="weather-widget" id="govWeatherWidget">
            <div class="weather-widget-loading" id="govWeatherLoading">
              <i data-lucide="loader"></i> Loading regional weather...
            </div>
            <div class="weather-widget-content" id="govWeatherContent" style="display:none;">
              <div class="weather-main">
                <span class="weather-icon" id="govWeatherIcon"></span>
                <span class="weather-temp" id="govWeatherTemp">--°C</span>
                <span class="weather-desc" id="govWeatherDesc">--</span>
              </div>
              <div class="weather-details">
                <div class="weather-detail"><i data-lucide="droplets"></i> <span id="govWeatherHumidity">--%</span></div>
                <div class="weather-detail"><i data-lucide="wind"></i> <span id="govWeatherWind">-- km/h</span></div>
                <div class="weather-detail"><i data-lucide="cloud-rain"></i> <span id="govWeatherRain">-- mm</span></div>
              </div>
              <div class="weather-location" id="govWeatherLocation">Regional average</div>
            </div>
          </div>
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
            <div class="overview-card-value" id="govTotalFarmersVal">--</div>
            <div class="overview-card-label">Total Farmers</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon green"><i data-lucide="trending-up"></i></div>
            </div>
            <div class="overview-card-value" id="govActiveVal">--</div>
            <div class="overview-card-label">Active (30 days)</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon red"><i data-lucide="trending-down"></i></div>
            </div>
            <div class="overview-card-value" id="govInactiveVal">--</div>
            <div class="overview-card-label">Inactive / Unverified</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon amber"><i data-lucide="clipboard-list"></i></div>
            </div>
            <div class="overview-card-value" id="govDistrictsVal">--</div>
            <div class="overview-card-label">Districts Covered</div>
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

        <!-- Weather History Lookup -->
        <div class="card weather-history-card" style="margin-top:28px;padding:24px;">
          <div class="weather-history-header">
            <h3 class="chart-card-title"><i data-lucide="cloud-sun" style="width:18px;height:18px;display:inline;"></i> Weather History Lookup</h3>
            <p style="color:var(--gray-500);font-size:.813rem;margin-top:4px;">Select a farmer and date to view historical weather conditions.</p>
          </div>
          <div class="weather-history-controls">
            <div class="weather-history-field">
              <label for="govWeatherFarmerSelect">Farmer</label>
              <select id="govWeatherFarmerSelect" class="form-input"></select>
            </div>
            <div class="weather-history-field">
              <label for="govWeatherDateInput">Date</label>
              <input type="date" id="govWeatherDateInput" class="form-input">
            </div>
            <button class="btn btn-primary btn-sm" id="govWeatherLookupBtn"><i data-lucide="search"></i> Lookup</button>
          </div>
          <div class="weather-history-result" id="govWeatherHistoryResult" style="display:none;"></div>
        </div>
      `;
    },

    init: function(ctx) {
      if (!ctx.isGov) return;

      var escape = AgriCore.escapeHtml;
      var API_BASE = window.AGRICORE_API_BASE || '/api';
      var token = (ctx.user && ctx.user.token) || '';

      // === Real-Time Date & Time ===
      function updateGovDateTime() {
        var now = new Date();
        var dateEl = document.getElementById('govLiveDate');
        var timeEl = document.getElementById('govLiveTime');
        if (dateEl) {
          dateEl.textContent = now.toLocaleDateString('en-ZA', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });
        }
        if (timeEl) {
          timeEl.textContent = now.toLocaleTimeString('en-ZA', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
        }
      }
      updateGovDateTime();
      setInterval(updateGovDateTime, 1000);

      // === Real-Time Regional Weather (South Africa default, updated after farmer load) ===
      var weatherLoaded = false;
      function loadGovWeather(lat, lng, locationLabel) {
        if (weatherLoaded) return;
        weatherLoaded = true;
        var weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
          '&longitude=' + lng +
          '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation' +
          '&timezone=auto';

        fetch(weatherUrl)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.current) {
              var c = data.current;
              var loading = document.getElementById('govWeatherLoading');
              var content = document.getElementById('govWeatherContent');
              if (loading) loading.style.display = 'none';
              if (content) content.style.display = 'flex';

              var wmo = AgriCore.getWeatherFromCode ? AgriCore.getWeatherFromCode(c.weather_code) :
                ({ 0:'☀️ Clear sky',1:'🌤️ Mainly clear',2:'⛅ Partly cloudy',3:'☁️ Overcast',
                  45:'🌫️ Foggy',51:'🌦️ Light drizzle',61:'🌧️ Slight rain',63:'🌧️ Moderate rain',
                  65:'🌧️ Heavy rain',80:'🌦️ Rain showers',95:'⛈️ Thunderstorm' }[c.weather_code] || '🌡️ Unknown').split(' ');
              var icon = wmo[0] || '🌡️';
              var desc = wmo.slice(1).join(' ') || 'Unknown';

              var iconEl = document.getElementById('govWeatherIcon');
              var tempEl = document.getElementById('govWeatherTemp');
              var descEl = document.getElementById('govWeatherDesc');
              var humidEl = document.getElementById('govWeatherHumidity');
              var windEl = document.getElementById('govWeatherWind');
              var rainEl = document.getElementById('govWeatherRain');
              var locEl = document.getElementById('govWeatherLocation');

              if (iconEl) iconEl.textContent = icon;
              if (tempEl) tempEl.textContent = Math.round(c.temperature_2m) + '°C';
              if (descEl) descEl.textContent = desc;
              if (humidEl) humidEl.textContent = c.relative_humidity_2m + '%';
              if (windEl) windEl.textContent = Math.round(c.wind_speed_10m) + ' km/h';
              if (rainEl) rainEl.textContent = c.precipitation + ' mm';
              if (locEl) locEl.textContent = locationLabel;
            }
          })
          .catch(function() {
            var loading = document.getElementById('govWeatherLoading');
            if (loading) loading.innerHTML = '<i data-lucide="cloud-off"></i> Weather unavailable';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
      }
      loadGovWeather(-28.5, 25.5, 'South Africa');

      // === Weather History Lookup (Gov) — dropdown populated after farmer load ===
      var farmerSelect = document.getElementById('govWeatherFarmerSelect');
      var dateInput = document.getElementById('govWeatherDateInput');
      if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.max = new Date().toISOString().split('T')[0];
      }
      var lookupBtn = document.getElementById('govWeatherLookupBtn');
      if (lookupBtn) {
        lookupBtn.addEventListener('click', function() {
          var farmerId = farmerSelect ? farmerSelect.value : '';
          var dateVal = dateInput ? dateInput.value : '';
          if (!farmerId || !dateVal) return;
          var selectedOpt = farmerSelect ? farmerSelect.options[farmerSelect.selectedIndex] : null;
          var farmerLat = selectedOpt ? parseFloat(selectedOpt.dataset.lat) : NaN;
          var farmerLng = selectedOpt ? parseFloat(selectedOpt.dataset.lng) : NaN;
          var farmerName = selectedOpt ? (selectedOpt.dataset.name || 'Farmer') : 'Farmer';
          var farmerDistrict = selectedOpt ? (selectedOpt.dataset.district || '') : '';
          var farmerProvince = selectedOpt ? (selectedOpt.dataset.province || '') : '';
          if (!farmerLat || !farmerLng || isNaN(farmerLat) || isNaN(farmerLng)) {
            var resultDiv2 = document.getElementById('govWeatherHistoryResult');
            if (resultDiv2) { resultDiv2.style.display = 'block'; resultDiv2.innerHTML = '<div class="weather-history-empty"><i data-lucide="map-pin-off"></i> No coordinates for this farmer yet.</div>'; }
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
          }
          var resultDiv = document.getElementById('govWeatherHistoryResult');
          if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="weather-history-loading"><i data-lucide="loader"></i> Fetching weather for ' + escape(dateVal) + '...</div>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
          // Use Open-Meteo Archive API for historical weather
          var archiveUrl = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + farmerLat +
            '&longitude=' + farmerLng +
            '&start_date=' + dateVal + '&end_date=' + dateVal +
            '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max' +
            '&hourly=relative_humidity_2m' +
            '&timezone=auto';
          fetch(archiveUrl)
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (resultDiv) {
                if (data && data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max[0] !== null) {
                  var d = data.daily;
                  var humArr = data.hourly && data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m : [];
                  var avgHumidity = humArr.length > 0 ? Math.round(humArr.reduce(function(s,v){return s+v;},0)/humArr.length) : '--';
                  resultDiv.innerHTML =
                    '<div class="weather-history-result-card">' +
                    '<div class="weather-history-result-title"><i data-lucide="map-pin"></i> ' + escape(farmerName) + ' — ' + escape(farmerDistrict) + ', ' + escape(farmerProvince) + ' <span class="weather-history-date-badge">' + escape(dateVal) + '</span></div>' +
                    '<div class="weather-history-grid">' +
                    '<div class="weather-history-stat"><div class="weather-history-stat-icon red"><i data-lucide="thermometer"></i></div><div><div class="weather-history-stat-value">' + d.temperature_2m_max[0] + '°C</div><div class="weather-history-stat-label">Max Temp</div></div></div>' +
                    '<div class="weather-history-stat"><div class="weather-history-stat-icon blue"><i data-lucide="thermometer-snowflake"></i></div><div><div class="weather-history-stat-value">' + d.temperature_2m_min[0] + '°C</div><div class="weather-history-stat-label">Min Temp</div></div></div>' +
                    '<div class="weather-history-stat"><div class="weather-history-stat-icon cyan"><i data-lucide="cloud-rain"></i></div><div><div class="weather-history-stat-value">' + d.precipitation_sum[0] + ' mm</div><div class="weather-history-stat-label">Rainfall</div></div></div>' +
                    '<div class="weather-history-stat"><div class="weather-history-stat-icon green"><i data-lucide="droplets"></i></div><div><div class="weather-history-stat-value">' + avgHumidity + '%</div><div class="weather-history-stat-label">Avg Humidity</div></div></div>' +
                    '<div class="weather-history-stat"><div class="weather-history-stat-icon amber"><i data-lucide="wind"></i></div><div><div class="weather-history-stat-value">' + d.wind_speed_10m_max[0] + ' km/h</div><div class="weather-history-stat-label">Max Wind</div></div></div>' +
                    '</div></div>';
                } else {
                  resultDiv.innerHTML = '<div class="weather-history-empty"><i data-lucide="cloud-off"></i> No weather data available for this date. Historical data may not be available for dates before 1940 or future dates.</div>';
                }
                if (typeof lucide !== 'undefined') lucide.createIcons();
              }
            })
            .catch(function() {
              if (resultDiv) {
                resultDiv.innerHTML = '<div class="weather-history-empty"><i data-lucide="cloud-off"></i> Failed to fetch weather data. Please try again.</div>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
              }
            });
        });
      }

      // === Verification Badge & Warning ===
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
      var viewAttentionBtn = document.getElementById('viewAttentionBtn');
      if (viewAttentionBtn) viewAttentionBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      // === View All Farmers Button ===
      var viewAllBtn = document.getElementById('viewAllFarmersBtn');
      if (viewAllBtn) viewAllBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      lucide.createIcons();

      // === Load Real Farmer Data from API ===
      fetch(API_BASE + '/farmers?limit=200', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        if (!res.success || !res.data) return;
        var result = res.data;
        var farmers = result.data || [];
        var total = result.total || farmers.length;
        var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // --- Overview cards ---
        var totalEl = document.getElementById('govTotalFarmersVal');
        if (totalEl) totalEl.textContent = total.toLocaleString();

        var activeFarmers = farmers.filter(function(f) { return f.updated_at && f.updated_at > thirtyDaysAgo; });
        var inactiveFarmers = farmers.filter(function(f) { return !f.updated_at || f.updated_at <= thirtyDaysAgo; });
        var districts = {};
        farmers.forEach(function(f) { if (f.district) districts[f.district] = true; });

        var activeEl = document.getElementById('govActiveVal');
        if (activeEl) activeEl.textContent = activeFarmers.length.toLocaleString();
        var inactiveEl = document.getElementById('govInactiveVal');
        if (inactiveEl) inactiveEl.textContent = inactiveFarmers.length.toLocaleString();
        var distEl = document.getElementById('govDistrictsVal');
        if (distEl) distEl.textContent = Object.keys(districts).length.toLocaleString();

        // --- Attention count ---
        var needAttention = inactiveFarmers.length;
        var countEl = document.getElementById('attentionCount');
        if (countEl) countEl.textContent = needAttention;

        // --- Update weather widget with first farmer's real coordinates ---
        var firstWithCoords = farmers.find(function(f) { return f.latitude != null && f.longitude != null; });
        if (firstWithCoords) {
          loadGovWeather(firstWithCoords.latitude, firstWithCoords.longitude,
            (firstWithCoords.district || '') + ', ' + (firstWithCoords.province || 'South Africa'));
        }

        // --- Populate weather history dropdown with real farmers ---
        if (farmerSelect) {
          farmerSelect.innerHTML = '';
          if (farmers.length === 0) {
            farmerSelect.innerHTML = '<option value="">No farmers registered yet</option>';
          } else {
            farmers.forEach(function(f) {
              var opt = document.createElement('option');
              opt.value = f.id;
              opt.dataset.lat = f.latitude != null ? String(f.latitude) : '';
              opt.dataset.lng = f.longitude != null ? String(f.longitude) : '';
              opt.dataset.name = f.name || 'Farmer';
              opt.dataset.district = f.district || '';
              opt.dataset.province = f.province || '';
              opt.textContent = (f.name || 'Farmer') + (f.district ? ' — ' + f.district + ', ' + (f.province || '') : '');
              farmerSelect.appendChild(opt);
            });
          }
        }

        // --- Recent farmers table ---
        var tbody = document.getElementById('govRecentFarmersTbody');
        if (tbody) {
          var recent = farmers.slice(0, 5);
          if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);">No farmers registered yet.</td></tr>';
          } else {
            tbody.innerHTML = recent.map(function(f) {
              var isActive = f.updated_at && f.updated_at > thirtyDaysAgo;
              var statusClass = f.verified ? 'badge-success' : (isActive ? 'badge-warning' : 'badge-danger');
              var statusLabel = f.verified ? 'Verified' : (isActive ? 'Active' : 'Inactive');
              return '<tr>' +
                '<td><strong>' + escape(f.name || 'Farmer') + '</strong>' +
                (f.district ? '<br><small style="color:var(--gray-500)">' + escape(f.district) + '</small>' : '') + '</td>' +
                '<td>' + escape((f.province || '--')) + '</td>' +
                '<td><span class="badge ' + statusClass + '">' + statusLabel + '</span></td>' +
                '<td><button class="btn btn-ghost btn-sm view-farmer-btn" data-id="' + escape(f.id) + '">View</button></td>' +
                '</tr>';
            }).join('');
            tbody.querySelectorAll('.view-farmer-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                if (window.viewFarmerProfile) window.viewFarmerProfile(btn.dataset.id);
              });
            });
          }
        }

        // --- District cards (computed from real farmer list) ---
        var distContainer = document.getElementById('govDistrictCards');
        if (distContainer) {
          if (farmers.length === 0) {
            distContainer.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No district data available.</p>';
          } else {
            var districtMap = {};
            farmers.forEach(function(f) {
              var key = (f.district || 'Unknown') + '||' + (f.province || '');
              if (!districtMap[key]) {
                districtMap[key] = { district: f.district || 'Unknown', province: f.province || '', count: 0, active: 0, verified: 0 };
              }
              districtMap[key].count++;
              if (f.updated_at && f.updated_at > thirtyDaysAgo) districtMap[key].active++;
              if (f.verified) districtMap[key].verified++;
            });
            var distList = Object.values(districtMap).sort(function(a, b) { return b.count - a.count; });
            distContainer.innerHTML = distList.map(function(d) {
              var pct = d.count > 0 ? Math.round((d.active / d.count) * 100) : 0;
              var fillColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
              return '<div class="district-card">' +
                '<div class="district-card-title">' + escape(d.district) + '</div>' +
                '<div class="district-card-province">' + escape(d.province) + '</div>' +
                '<div class="district-stats">' +
                '<div class="district-stat"><div class="district-stat-value">' + d.count + '</div><div class="district-stat-label">Farmers</div></div>' +
                '<div class="district-stat"><div class="district-stat-value">' + d.active + '</div><div class="district-stat-label">Active</div></div>' +
                '<div class="district-stat"><div class="district-stat-value">' + d.verified + '</div><div class="district-stat-label">Verified</div></div>' +
                '</div>' +
                '<div class="district-score-bar"><span class="district-score-value" style="color:' + fillColor + '">' + pct + '%</span>' +
                '<div class="district-score-track"><div class="district-score-fill" style="width:' + pct + '%;background:' + fillColor + '"></div></div>' +
                '<span style="color:var(--gray-500)">Activity Rate</span></div>' +
                '</div>';
            }).join('');
          }
        }

        // --- Smart alerts (from real data) ---
        var alertContainer = document.getElementById('govSmartAlerts');
        if (alertContainer) {
          var alerts = [];
          if (inactiveFarmers.length > 0) {
            alerts.push({ type: 'warning', icon: 'clock', message: inactiveFarmers.length + ' farmer(s) have not updated their data in 30+ days.' });
          }
          var unverified = farmers.filter(function(f) { return !f.verified; });
          if (unverified.length > 0) {
            alerts.push({ type: 'info', icon: 'shield-alert', message: unverified.length + ' farmer(s) have not been verified yet.' });
          }
          if (farmers.length === 0) {
            alerts.push({ type: 'info', icon: 'info', message: 'No farmers have registered yet. Share your platform link to onboard farmers.' });
          }
          if (alerts.length === 0) {
            alertContainer.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No active alerts. All farmers are up to date.</p>';
          } else {
            alertContainer.innerHTML = alerts.map(function(a) {
              return '<div class="smart-alert ' + escape(a.type) + '">' +
                '<div class="smart-alert-icon"><i data-lucide="' + escape(a.icon) + '"></i></div>' +
                '<div class="smart-alert-text">' + escape(a.message) + '</div>' +
                '</div>';
            }).join('');
          }
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
      })
      .catch(function() {
        // API failed - show 0 counts rather than fake mock numbers
        var ids = ['govTotalFarmersVal', 'govActiveVal', 'govInactiveVal', 'govDistrictsVal', 'attentionCount'];
        ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = '0'; });
        var tbody = document.getElementById('govRecentFarmersTbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--gray-400);">Unable to load farmer data.</td></tr>';
      });
    }
  });
})();
