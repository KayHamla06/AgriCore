/* ============================================
   AgriCore — Farmer Dashboard Panel
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'farmerDashboard',
    panelId: 'panel-dashboard-farmer',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Welcome back, <span id="farmerWelcomeName">Farmer</span></h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Here's an overview of your farm performance.</p>
          </div>
          <span class="verified-badge" id="farmerVerifiedBadge" style="display:none;"><i data-lucide="badge-check"></i> Verified Farmer</span>
        </div>

        <!-- Date/Time & Weather Strip -->
        <div class="datetime-weather-strip">
          <div class="datetime-widget">
            <div class="datetime-icon"><i data-lucide="calendar-clock"></i></div>
            <div class="datetime-info">
              <div class="datetime-date" id="farmerLiveDate">--</div>
              <div class="datetime-time" id="farmerLiveTime">--:--:--</div>
            </div>
          </div>
          <div class="weather-widget" id="farmerWeatherWidget">
            <div class="weather-widget-loading" id="farmerWeatherLoading">
              <i data-lucide="loader"></i> Loading weather...
            </div>
            <div class="weather-widget-content" id="farmerWeatherContent" style="display:none;">
              <div class="weather-main">
                <span class="weather-icon" id="farmerWeatherIcon"></span>
                <span class="weather-temp" id="farmerWeatherTemp">--°C</span>
                <span class="weather-desc" id="farmerWeatherDesc">--</span>
              </div>
              <div class="weather-details">
                <div class="weather-detail"><i data-lucide="droplets"></i> <span id="farmerWeatherHumidity">--%</span></div>
                <div class="weather-detail"><i data-lucide="wind"></i> <span id="farmerWeatherWind">-- km/h</span></div>
                <div class="weather-detail"><i data-lucide="cloud-rain"></i> <span id="farmerWeatherRain">-- mm</span></div>
              </div>
              <div class="weather-location" id="farmerWeatherLocation"></div>
            </div>
          </div>
        </div>

        <div class="unverified-warning" id="farmerUnverifiedWarning" style="display:none;">
          <i data-lucide="alert-triangle"></i>
          <span>Your account is not verified. <a href="#" id="startVerificationBtn">Upload verification documents</a> to get your verified badge ✓</span>
        </div>

        <div class="attention-banner farmer-banner" id="farmerAttentionBanner" style="display:none;">
          <i data-lucide="info"></i>
          <span id="farmerAttentionText">Your data is up to date.</span>
        </div>

        <div class="overview-cards">
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon green" id="farmerScoreIcon"><i data-lucide="trending-up"></i></div>
              <span class="overview-card-trend up" id="farmerScoreTrend"><i data-lucide="arrow-up-right"></i> --</span>
            </div>
            <div class="overview-card-value" id="farmerScoreValue">--</div>
            <div class="overview-card-label">Performance Score</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon blue"><i data-lucide="wheat"></i></div>
              <span class="overview-card-trend up"><i data-lucide="arrow-up-right"></i> +12%</span>
            </div>
            <div class="overview-card-value" id="farmerYieldValue">--</div>
            <div class="overview-card-label">Crop Yield / Hectare</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon amber"><i data-lucide="beef"></i></div>
              <span class="overview-card-trend up"><i data-lucide="arrow-up-right"></i> +8%</span>
            </div>
            <div class="overview-card-value" id="farmerLivestockValue">--</div>
            <div class="overview-card-label">Livestock Count</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header">
              <div class="overview-card-icon green"><i data-lucide="shield-check"></i></div>
              <span class="overview-card-trend up" id="farmerStatusBadge">Improving</span>
            </div>
            <div class="overview-card-value" id="farmerRisk">Low</div>
            <div class="overview-card-label">Risk Indicator</div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">Yield Over Time</h3>
              <span class="badge badge-success">Improving</span>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="farmerYieldChart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <h3 class="chart-card-title">Monthly Production</h3>
            </div>
            <div class="chart-canvas-wrapper">
              <canvas id="farmerProductionChart"></canvas>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-top:20px;">
          <button class="btn btn-primary" id="uploadDataBtn"><i data-lucide="upload"></i> Upload New Data</button>
          <button class="btn btn-secondary" id="viewHistoryBtn"><i data-lucide="bar-chart-3"></i> View History</button>
          <button class="btn btn-secondary" id="downloadFarmerPdfBtn"><i data-lucide="file-down"></i> Download My Farm Report</button>
          <button class="btn btn-secondary" id="downloadPlanPdfBtn"><i data-lucide="file-down"></i> Download Plan Report</button>
        </div>

        <div class="card" style="margin-top:24px;padding:24px;">
          <h3 class="chart-card-title" style="margin-bottom:16px;"><i data-lucide="history" style="width:18px;height:18px;display:inline;"></i> Data Upload History</h3>
          <div class="upload-history" id="farmerUploadHistory"></div>
        </div>

        <!-- Weather History Lookup -->
        <div class="card weather-history-card" style="margin-top:24px;padding:24px;">
          <div class="weather-history-header">
            <h3 class="chart-card-title"><i data-lucide="cloud-sun" style="width:18px;height:18px;display:inline;"></i> Weather History Lookup</h3>
            <p style="color:var(--gray-500);font-size:.813rem;margin-top:4px;">Select a date to view weather conditions at your farm location on that day.</p>
          </div>
          <div class="weather-history-controls">
            <div class="weather-history-field">
              <label for="farmerWeatherDateInput">Date</label>
              <input type="date" id="farmerWeatherDateInput" class="form-input">
            </div>
            <button class="btn btn-primary btn-sm" id="farmerWeatherLookupBtn"><i data-lucide="search"></i> Lookup</button>
          </div>
          <div class="weather-history-result" id="farmerWeatherHistoryResult" style="display:none;"></div>
        </div>
      `;
    },

    init: function(ctx) {
      if (!ctx.isFarmer) return;

      var user = ctx.user;
      var farmerData = AgriCore.mockFarmers.find(function(f) { return f.id === user.id; }) || AgriCore.mockFarmers[0];

      // Welcome name
      var welcomeName = document.getElementById('farmerWelcomeName');
      if (welcomeName) welcomeName.textContent = user.name.split(' ')[0];

      // === Real-Time Date & Time ===
      function updateDateTime() {
        var now = new Date();
        var dateEl = document.getElementById('farmerLiveDate');
        var timeEl = document.getElementById('farmerLiveTime');
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
      updateDateTime();
      setInterval(updateDateTime, 1000);

      // === Real-Time Weather from Open-Meteo ===
      var coords = farmerData.coordinates;
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
              var loading = document.getElementById('farmerWeatherLoading');
              var content = document.getElementById('farmerWeatherContent');
              if (loading) loading.style.display = 'none';
              if (content) content.style.display = 'flex';

              var weatherCodes = {
                0: { icon: '☀️', desc: 'Clear sky' },
                1: { icon: '🌤️', desc: 'Mainly clear' },
                2: { icon: '⛅', desc: 'Partly cloudy' },
                3: { icon: '☁️', desc: 'Overcast' },
                45: { icon: '🌫️', desc: 'Foggy' },
                48: { icon: '🌫️', desc: 'Rime fog' },
                51: { icon: '🌦️', desc: 'Light drizzle' },
                53: { icon: '🌦️', desc: 'Moderate drizzle' },
                55: { icon: '🌧️', desc: 'Dense drizzle' },
                61: { icon: '🌧️', desc: 'Slight rain' },
                63: { icon: '🌧️', desc: 'Moderate rain' },
                65: { icon: '🌧️', desc: 'Heavy rain' },
                71: { icon: '🌨️', desc: 'Slight snow' },
                73: { icon: '🌨️', desc: 'Moderate snow' },
                75: { icon: '❄️', desc: 'Heavy snow' },
                80: { icon: '🌦️', desc: 'Rain showers' },
                81: { icon: '🌧️', desc: 'Moderate showers' },
                82: { icon: '⛈️', desc: 'Violent showers' },
                95: { icon: '⛈️', desc: 'Thunderstorm' },
                96: { icon: '⛈️', desc: 'Thunderstorm + hail' },
                99: { icon: '⛈️', desc: 'Severe thunderstorm' }
              };
              var wmo = weatherCodes[c.weather_code] || { icon: '🌡️', desc: 'Unknown' };

              var iconEl = document.getElementById('farmerWeatherIcon');
              var tempEl = document.getElementById('farmerWeatherTemp');
              var descEl = document.getElementById('farmerWeatherDesc');
              var humidEl = document.getElementById('farmerWeatherHumidity');
              var windEl = document.getElementById('farmerWeatherWind');
              var rainEl = document.getElementById('farmerWeatherRain');
              var locEl = document.getElementById('farmerWeatherLocation');

              if (iconEl) iconEl.textContent = wmo.icon;
              if (tempEl) tempEl.textContent = Math.round(c.temperature_2m) + '°C';
              if (descEl) descEl.textContent = wmo.desc;
              if (humidEl) humidEl.textContent = c.relative_humidity_2m + '%';
              if (windEl) windEl.textContent = Math.round(c.wind_speed_10m) + ' km/h';
              if (rainEl) rainEl.textContent = c.precipitation + ' mm';
              if (locEl) locEl.textContent = (farmerData.district || '') + ', ' + (farmerData.province || '');
            }
          })
          .catch(function() {
            var loading = document.getElementById('farmerWeatherLoading');
            if (loading) loading.innerHTML = '<i data-lucide="cloud-off"></i> Weather unavailable';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
      }

      // === Verification Badge & Warning ===
      var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';
      var token = user.token || '';
      fetch(API_BASE + '/verification/status', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(function(res) { return res.json(); })
      .then(function(res) {
        if (res.success && res.data) {
          var badge = document.getElementById('farmerVerifiedBadge');
          var warning = document.getElementById('farmerUnverifiedWarning');
          if (res.data.status === 'verified') {
            if (badge) { badge.style.display = 'inline-flex'; badge.innerHTML = '<span style="color:#2563eb;">✓</span> Verified Farmer'; }
            if (warning) warning.style.display = 'none';
          } else {
            if (badge) badge.style.display = 'none';
            if (warning) warning.style.display = 'flex';
          }
        }
      })
      .catch(function() {});

      // === Performance Scores ===
      var score = AgriCore.calculatePerformanceScore(farmerData);
      var level = AgriCore.getScoreLevel(score);
      var yields = farmerData.yieldHistory;
      var lastYield = yields[yields.length - 1];
      var prevYield = yields[yields.length - 2];
      var yieldChange = prevYield > 0 ? (((lastYield - prevYield) / prevYield) * 100).toFixed(1) : 0;

      var scoreVal = document.getElementById('farmerScoreValue');
      if (scoreVal) { scoreVal.textContent = score; scoreVal.style.color = level.color; }

      var scoreTrend = document.getElementById('farmerScoreTrend');
      if (scoreTrend) {
        var icon = yieldChange >= 0 ? 'arrow-up-right' : 'arrow-down-right';
        var cls = yieldChange >= 0 ? 'up' : 'down';
        scoreTrend.className = 'overview-card-trend ' + cls;
        scoreTrend.innerHTML = '<i data-lucide="' + icon + '"></i> ' + (yieldChange >= 0 ? '+' : '') + yieldChange + '%';
      }

      var scoreIcon = document.getElementById('farmerScoreIcon');
      if (scoreIcon) {
        scoreIcon.className = 'overview-card-icon';
        if (level.level === 'good') scoreIcon.classList.add('green');
        else if (level.level === 'stable') scoreIcon.classList.add('amber');
        else scoreIcon.classList.add('red');
      }

      var yieldVal = document.getElementById('farmerYieldValue');
      if (yieldVal) yieldVal.textContent = lastYield + 't';

      var livestockVal = document.getElementById('farmerLivestockValue');
      if (livestockVal) livestockVal.textContent = farmerData.livestock;

      var riskEl = document.getElementById('farmerRisk');
      if (riskEl) { riskEl.textContent = level.label; riskEl.style.color = level.color; }

      var statusBadge = document.getElementById('farmerStatusBadge');
      if (statusBadge) {
        statusBadge.textContent = farmerData.status === 'improving' ? 'Improving' : 'At Risk';
        statusBadge.className = 'overview-card-trend ' + (farmerData.status === 'improving' ? 'up' : 'down');
      }

      // === Warning Banner ===
      var warnings = AgriCore.detectWarnings(farmerData);
      var banner = document.getElementById('farmerAttentionBanner');
      var text = document.getElementById('farmerAttentionText');
      if (warnings.length > 0) {
        if (banner) { banner.style.display = 'flex'; banner.classList.add('warning'); }
        if (text) text.textContent = warnings[0].message + (warnings.length > 1 ? ' (+' + (warnings.length - 1) + ' more)' : '');
      } else {
        if (score >= 70 && banner) {
          banner.style.display = 'flex';
          if (text) text.textContent = 'Great work! Your performance score is ' + score + ' \u2014 keep it up.';
        }
      }

      // === Upload History ===
      var container = document.getElementById('farmerUploadHistory');
      if (container) {
        if (!farmerData.uploadHistory || farmerData.uploadHistory.length === 0) {
          container.innerHTML = '<p style="color:var(--gray-400);font-size:.875rem;">No upload history yet.</p>';
        } else {
          var escape = AgriCore.escapeHtml;
          var history = farmerData.uploadHistory.slice().reverse();
          container.innerHTML = history.map(function(entry, i) {
            var prev = i < history.length - 1 ? history[i + 1] : null;
            var yieldDrop = prev && prev.yield > 0 ? ((prev.yield - entry.yield) / prev.yield) * 100 : 0;
            var isDrop = yieldDrop > 5;
            var dotClass = isDrop ? 'danger' : (yieldDrop > 0 ? 'warning' : '');
            var monthNames = { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
              '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };
            var parts = entry.date.split('-');
            var lbl = (monthNames[parts[1]] || parts[1]) + ' ' + parts[0];
            var warnHtml = isDrop ? ' <span class="upload-history-warning"><i data-lucide="alert-triangle"></i> -' + Math.round(yieldDrop) + '%</span>' : '';
            return '<div class="upload-history-item">' +
              '<div class="upload-history-dot ' + dotClass + '"></div>' +
              '<div class="upload-history-date">' + escape(lbl) + '</div>' +
              '<div class="upload-history-values">Yield: <strong>' + entry.yield + 't/ha</strong> &nbsp;|&nbsp; Livestock: <strong>' + entry.livestock + '</strong>' + warnHtml +
              (entry.notes ? '<div class="upload-history-note">' + escape(entry.notes) + '</div>' : '') +
              '</div></div>';
          }).join('');
          lucide.createIcons();
        }
      }

      // === Weather History Lookup (Farmer) ===
      var farmerDateInput = document.getElementById('farmerWeatherDateInput');
      if (farmerDateInput) {
        farmerDateInput.value = new Date().toISOString().split('T')[0];
        farmerDateInput.max = new Date().toISOString().split('T')[0];
      }
      var farmerLookupBtn = document.getElementById('farmerWeatherLookupBtn');
      if (farmerLookupBtn) {
        farmerLookupBtn.addEventListener('click', function() {
          var dateVal = farmerDateInput ? farmerDateInput.value : '';
          if (!dateVal || !farmerData.coordinates) return;
          var resultDiv = document.getElementById('farmerWeatherHistoryResult');
          if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="weather-history-loading"><i data-lucide="loader"></i> Fetching weather for ' + AgriCore.escapeHtml(dateVal) + '...</div>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
          var archiveUrl = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + farmerData.coordinates.lat +
            '&longitude=' + farmerData.coordinates.lng +
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
                    '<div class="weather-history-result-title"><i data-lucide="map-pin"></i> ' + AgriCore.escapeHtml(farmerData.district || '') + ', ' + AgriCore.escapeHtml(farmerData.province || '') + ' <span class="weather-history-date-badge">' + AgriCore.escapeHtml(dateVal) + '</span></div>' +
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

      // === Button Listeners ===
      var uploadBtn = document.getElementById('uploadDataBtn');
      if (uploadBtn) uploadBtn.addEventListener('click', function() { ctx.openModal('uploadDataModal'); });

      var historyBtn = document.getElementById('viewHistoryBtn');
      if (historyBtn) historyBtn.addEventListener('click', function() { ctx.switchPanel('analytics'); });

      // === PDF Download ===
      var pdfBtn = document.getElementById('downloadFarmerPdfBtn');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', function() {
          // Use the farmer's own farmer ID (from mock data for now, or user.farmerId)
          var farmerId = farmerData.id || user.id;
          pdfBtn.disabled = true;
          pdfBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';

          fetch(API_BASE + '/pdf/farmer/' + farmerId, {
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
            pdfBtn.disabled = false;
            pdfBtn.innerHTML = '<i data-lucide="file-down"></i> Download My Farm Report';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        });
      }

      // === Plan PDF Download ===
      var planPdfBtn = document.getElementById('downloadPlanPdfBtn');
      if (planPdfBtn) {
        planPdfBtn.addEventListener('click', function() {
          var farmerId = farmerData.id || user.id;
          planPdfBtn.disabled = true;
          planPdfBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || 'http://localhost:3000/api';

          fetch(API_BASE + '/pdf/plans/' + farmerId, {
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
            a.download = 'AgriCore_Plan_Report.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            AgriCore.showToast('Plan report downloaded!', 'success');
          })
          .catch(function() {
            AgriCore.showToast('Failed to download plan report.', 'error');
          })
          .finally(function() {
            planPdfBtn.disabled = false;
            planPdfBtn.innerHTML = '<i data-lucide="file-down"></i> Download Plan Report';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        });
      }
    }
  });
})();
