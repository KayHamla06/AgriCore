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
            <div class="overview-card-value">2,547</div>
            <div class="overview-card-label">Total Farmers</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon green"><i data-lucide="trending-up"></i></div>
            </div>
            <div class="overview-card-value">1,892</div>
            <div class="overview-card-label">Farmers Improving</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon red"><i data-lucide="trending-down"></i></div>
            </div>
            <div class="overview-card-value">655</div>
            <div class="overview-card-label">Farmers Declining</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon amber"><i data-lucide="clipboard-list"></i></div>
            </div>
            <div class="overview-card-value">148</div>
            <div class="overview-card-label">Plans Created</div>
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

      // === Real-Time Regional Weather (using first farmer's coords) ===
      var firstFarmer = AgriCore.mockFarmers[0];
      var coords = firstFarmer && firstFarmer.coordinates;
      if (coords && coords.lat && coords.lng) {
        var weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat +
          '&longitude=' + coords.lng +
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
              if (locEl) locEl.textContent = (firstFarmer.district || '') + ', ' + (firstFarmer.province || '');
            }
          })
          .catch(function() {
            var loading = document.getElementById('govWeatherLoading');
            if (loading) loading.innerHTML = '<i data-lucide="cloud-off"></i> Weather unavailable';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
      }

      // === Weather History Lookup (Gov) ===
      var farmerSelect = document.getElementById('govWeatherFarmerSelect');
      if (farmerSelect) {
        AgriCore.mockFarmers.forEach(function(f) {
          var opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = f.name + ' — ' + f.district + ', ' + f.province;
          farmerSelect.appendChild(opt);
        });
      }
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
          var farmer = AgriCore.mockFarmers.find(function(f) { return f.id === farmerId; });
          if (!farmer || !farmer.coordinates) return;
          var resultDiv = document.getElementById('govWeatherHistoryResult');
          if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="weather-history-loading"><i data-lucide="loader"></i> Fetching weather for ' + escape(dateVal) + '...</div>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
          // Use Open-Meteo Archive API for historical weather
          var archiveUrl = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + farmer.coordinates.lat +
            '&longitude=' + farmer.coordinates.lng +
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
                    '<div class="weather-history-result-title"><i data-lucide="map-pin"></i> ' + escape(farmer.name) + ' — ' + escape(farmer.district) + ', ' + escape(farmer.province) + ' <span class="weather-history-date-badge">' + escape(dateVal) + '</span></div>' +
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
      var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';
      var token = ctx.user.token || '';
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
      var needAttention = AgriCore.getFarmersNeedingAttention();
      var countEl = document.getElementById('attentionCount');
      if (countEl) countEl.textContent = needAttention.length;

      var viewAttentionBtn = document.getElementById('viewAttentionBtn');
      if (viewAttentionBtn) viewAttentionBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      // === Recent Farmers ===
      var tbody = document.getElementById('govRecentFarmersTbody');
      if (tbody) {
        var recent = AgriCore.mockFarmers.slice(0, 5);
        tbody.innerHTML = recent.map(function(f) {
          var score = AgriCore.calculatePerformanceScore(f);
          var level = AgriCore.getScoreLevel(score);
          return '<tr>' +
            '<td><strong>' + escape(f.name) + '</strong><br><small style="color:var(--gray-500)">' + escape(f.farmName) + '</small></td>' +
            '<td>' + escape(f.province) + '</td>' +
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

      // === View All Farmers Button ===
      var viewAllBtn = document.getElementById('viewAllFarmersBtn');
      if (viewAllBtn) viewAllBtn.addEventListener('click', function() { ctx.switchPanel('farmers'); });

      // === District Cards ===
      var distContainer = document.getElementById('govDistrictCards');
      if (distContainer) {
        var districts = AgriCore.getDistrictSummary();
        distContainer.innerHTML = districts.map(function(d) {
          var scoreLevel = AgriCore.getScoreLevel(d.avgScore);
          var fillColor = d.avgScore >= 70 ? 'var(--success)' : d.avgScore >= 40 ? 'var(--warning)' : 'var(--danger)';
          var diseaseTags = d.diseases.length > 0
            ? '<div class="district-diseases">' + d.diseases.map(function(dis) { return '<span class="disease-tag">' + escape(dis) + '</span>'; }).join('') + '</div>'
            : '';
          return '<div class="district-card">' +
            '<div class="district-card-title">' + escape(d.district) + '</div>' +
            '<div class="district-card-province">' + escape(d.province) + '</div>' +
            '<div class="district-stats">' +
            '<div class="district-stat"><div class="district-stat-value">' + d.farmerCount + '</div><div class="district-stat-label">Farmers</div></div>' +
            '<div class="district-stat"><div class="district-stat-value">' + d.totalLivestock.toLocaleString() + '</div><div class="district-stat-label">Livestock</div></div>' +
            '<div class="district-stat"><div class="district-stat-value">' + d.totalCrops.toLocaleString() + 't</div><div class="district-stat-label">Crop Yield</div></div>' +
            '<div class="district-stat"><div class="district-stat-value">' + d.decliningCount + '</div><div class="district-stat-label">At Risk</div></div>' +
            '</div>' +
            '<div class="district-score-bar"><span class="district-score-value" style="color:' + fillColor + '">' + d.avgScore + '</span>' +
            '<div class="district-score-track"><div class="district-score-fill" style="width:' + d.avgScore + '%;background:' + fillColor + '"></div></div>' +
            '<span style="color:var(--gray-500)">' + escape(scoreLevel.label) + '</span></div>' +
            diseaseTags + '</div>';
        }).join('');
      }

      // === Smart Alerts ===
      var alertContainer = document.getElementById('govSmartAlerts');
      if (alertContainer) {
        var alerts = AgriCore.generateSmartAlerts();
        if (alerts.length === 0) {
          alertContainer.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No active alerts.</p>';
        } else {
          alertContainer.innerHTML = alerts.slice(0, 12).map(function(a) {
            return '<div class="smart-alert ' + escape(a.type) + '">' +
              '<div class="smart-alert-icon"><i data-lucide="' + escape(a.icon) + '"></i></div>' +
              '<div class="smart-alert-text">' + escape(a.message) + '</div>' +
              '<span class="smart-alert-district">' + escape(a.district) + '</span></div>';
          }).join('');
        }
      }

      lucide.createIcons();
    }
  });
})();
