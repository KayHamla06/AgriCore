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
          <span>You are not verified. <a href="#" id="startVerificationBtn">Upload your ID</a> to get verified ✓</span>
        </div>

        <!-- ID Upload Modal -->
        <div class="admin-modal-overlay" id="idUploadModal" style="display:none;">
          <div class="admin-modal" style="max-width:480px;">
            <div class="admin-modal-header">
              <h3>Upload Verification Document</h3>
              <button class="modal-close-btn" id="idUploadCloseBtn">&times;</button>
            </div>
            <div class="admin-modal-body" style="padding:20px;">
              <p style="margin-bottom:16px;font-size:.875rem;color:var(--gray-600);">Upload a clear photo of your ID document (South African ID, passport, or drivers license).</p>
              <div id="idUploadDropzone" style="border:2px dashed var(--gray-300);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:border-color .2s;">
                <i data-lucide="upload-cloud" style="width:40px;height:40px;color:var(--gray-400);margin-bottom:8px;"></i>
                <p style="font-weight:600;color:var(--gray-700);margin-bottom:4px;">Click to select or take a photo</p>
                <p style="font-size:.75rem;color:var(--gray-400);">JPG, PNG or PDF — max 10MB</p>
                <input type="file" id="idUploadInput" accept="image/*,application/pdf" capture="environment" style="display:none;">
              </div>
              <div id="idUploadPreview" style="display:none;margin-top:16px;text-align:center;">
                <img id="idPreviewImg" style="max-width:100%;max-height:240px;border-radius:8px;border:1px solid var(--gray-200);" alt="Preview">
                <p id="idPreviewName" style="font-size:.8125rem;color:var(--gray-500);margin-top:8px;"></p>
              </div>
              <button class="btn btn-primary" id="idUploadSendBtn" disabled style="width:100%;margin-top:16px;">Send for Verification</button>
            </div>
          </div>
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
      // Start with a placeholder — real data loaded asynchronously below
      var farmerData = {
        id: user.id,
        name: user.name,
        farmName: 'My Farm',
        province: '',
        district: '',
        coordinates: null,
        yieldHistory: [0, 0],
        productionHistory: [0, 0],
        livestock: 0,
        status: 'stable',
        uploadHistory: [],
      };

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

      // === Weather helper — shared by real-time widget & history lookup ===
      var weatherCodes = {
        0:{icon:'☀️',desc:'Clear sky'}, 1:{icon:'🌤️',desc:'Mainly clear'}, 2:{icon:'⛅',desc:'Partly cloudy'},
        3:{icon:'☁️',desc:'Overcast'}, 45:{icon:'🌫️',desc:'Foggy'}, 48:{icon:'🌫️',desc:'Rime fog'},
        51:{icon:'🌦️',desc:'Light drizzle'}, 53:{icon:'🌦️',desc:'Moderate drizzle'}, 55:{icon:'🌧️',desc:'Dense drizzle'},
        61:{icon:'🌧️',desc:'Slight rain'}, 63:{icon:'🌧️',desc:'Moderate rain'}, 65:{icon:'🌧️',desc:'Heavy rain'},
        71:{icon:'🌨️',desc:'Slight snow'}, 73:{icon:'🌨️',desc:'Moderate snow'}, 75:{icon:'❄️',desc:'Heavy snow'},
        80:{icon:'🌦️',desc:'Rain showers'}, 81:{icon:'🌧️',desc:'Moderate showers'}, 82:{icon:'⛈️',desc:'Violent showers'},
        95:{icon:'⛈️',desc:'Thunderstorm'}, 96:{icon:'⛈️',desc:'Thunderstorm + hail'}, 99:{icon:'⛈️',desc:'Severe thunderstorm'}
      };

      function showWeatherData(c, locationLabel) {
        var wmo = weatherCodes[c.weather_code] || { icon: '🌡️', desc: 'Unknown' };
        var setEl = function(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
        setEl('farmerWeatherIcon', wmo.icon);
        setEl('farmerWeatherTemp', Math.round(c.temperature_2m) + '°C');
        setEl('farmerWeatherDesc', wmo.desc);
        setEl('farmerWeatherHumidity', c.relative_humidity_2m + '%');
        setEl('farmerWeatherWind', Math.round(c.wind_speed_10m) + ' km/h');
        setEl('farmerWeatherRain', c.precipitation + ' mm');
        setEl('farmerWeatherLocation', locationLabel);
        var loading = document.getElementById('farmerWeatherLoading');
        var content = document.getElementById('farmerWeatherContent');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'flex';
      }

      function showWeatherError(msg) {
        var loading = document.getElementById('farmerWeatherLoading');
        var content = document.getElementById('farmerWeatherContent');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'flex';
        var descEl = document.getElementById('farmerWeatherDesc');
        if (descEl) descEl.textContent = msg || 'Weather unavailable';
      }

      function fetchWeatherForCoords(lat, lng, locationLabel) {
        var weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
          '&longitude=' + lng +
          '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=auto';
        return fetch(weatherUrl)
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.current) {
              showWeatherData(data.current, locationLabel);
            } else {
              showWeatherError('Weather data unavailable');
            }
          })
          .catch(function() {
            showWeatherError('Failed to load weather');
          });
      }

      function geocodeAndFetchWeather(town, province, district) {
        var locationQuery = (town || '') + ', ' + (province || '') + ', South Africa';
        var locationLabel = (district || town || '') + ', ' + (province || '');
        return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(locationQuery))
          .then(function(res) { return res.json(); })
          .then(function(geoData) {
            if (geoData && geoData.length > 0) {
              var lat = parseFloat(geoData[0].lat);
              var lng = parseFloat(geoData[0].lon);
              farmerData.coordinates = { lat: lat, lng: lng };
              return fetchWeatherForCoords(lat, lng, locationLabel);
            } else {
              showWeatherError('Location not found — pin your farm in Settings');
            }
          })
          .catch(function() {
            showWeatherError('Location lookup failed — pin your farm in Settings');
          });
      }

      // === Verification Badge & Warning ===
      var API_BASE = window.AGRICORE_API_BASE || '/api';
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

      // === ID Upload Modal ===
      var idModal = document.getElementById('idUploadModal');
      var idInput = document.getElementById('idUploadInput');
      var idDropzone = document.getElementById('idUploadDropzone');
      var idPreview = document.getElementById('idUploadPreview');
      var idPreviewImg = document.getElementById('idPreviewImg');
      var idPreviewName = document.getElementById('idPreviewName');
      var idSendBtn = document.getElementById('idUploadSendBtn');
      var idCloseBtn = document.getElementById('idUploadCloseBtn');
      var startVerBtn = document.getElementById('startVerificationBtn');
      var selectedFile = null;

      if (startVerBtn) {
        startVerBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (idModal) { idModal.style.display = 'flex'; }
          if (typeof lucide !== 'undefined') lucide.createIcons();
        });
      }

      if (idDropzone && idInput) {
        idDropzone.addEventListener('click', function() { idInput.click(); });
        idInput.addEventListener('change', function() {
          if (idInput.files && idInput.files[0]) {
            selectedFile = idInput.files[0];
            if (selectedFile.size > 10 * 1024 * 1024) {
              AgriCore.showToast('File too large. Maximum 10MB.', 'error');
              selectedFile = null;
              return;
            }
            if (idPreviewName) idPreviewName.textContent = selectedFile.name;
            if (selectedFile.type.startsWith('image/') && idPreviewImg) {
              var reader = new FileReader();
              reader.onload = function(e) { idPreviewImg.src = e.target.result; };
              reader.readAsDataURL(selectedFile);
              if (idPreviewImg) idPreviewImg.style.display = 'block';
            } else {
              if (idPreviewImg) idPreviewImg.style.display = 'none';
              if (idPreviewName) idPreviewName.textContent = '📄 ' + selectedFile.name;
            }
            if (idPreview) idPreview.style.display = 'block';
            if (idSendBtn) idSendBtn.disabled = false;
          }
        });
      }

      if (idSendBtn) {
        idSendBtn.addEventListener('click', function() {
          if (!selectedFile) return;
          idSendBtn.disabled = true;
          idSendBtn.textContent = 'Sending...';

          var formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('documentType', 'id_document');

          fetch((window.AGRICORE_API_BASE || '/api') + '/verification/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + (user.token || '') },
            body: formData
          })
          .then(function(res) { return res.json(); })
          .then(function(res) {
            if (res.success) {
              if (idModal) idModal.style.display = 'none';
              selectedFile = null;
              if (idPreview) idPreview.style.display = 'none';
              if (idSendBtn) { idSendBtn.disabled = true; idSendBtn.textContent = 'Send for Verification'; }
              AgriCore.showToast('Your document has been sent for verification. You will receive a notification when the admin has verified your account.', 'success');
              // Update the warning text
              var warning = document.getElementById('farmerUnverifiedWarning');
              if (warning) {
                warning.querySelector('span').innerHTML = 'Verification pending — your ID is being reviewed.';
                warning.style.background = 'var(--amber-50, #fffde7)';
              }
            } else {
              AgriCore.showToast(res.error || 'Upload failed. Please try again.', 'error');
              idSendBtn.disabled = false;
              idSendBtn.textContent = 'Send for Verification';
            }
          })
          .catch(function() {
            AgriCore.showToast('Network error. Please try again.', 'error');
            idSendBtn.disabled = false;
            idSendBtn.textContent = 'Send for Verification';
          });
        });
      }

      if (idCloseBtn) {
        idCloseBtn.addEventListener('click', function() { if (idModal) idModal.style.display = 'none'; });
      }
      if (idModal) {
        idModal.addEventListener('click', function(e) { if (e.target === idModal) idModal.style.display = 'none'; });
      }

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

      // === Load Real Farmer Data from API ===
      // Fetches profile + crops + livestock, then updates KPIs and upload history in-place.
      (function loadRealData() {
        var API_BASE_R = window.AGRICORE_API_BASE || '/api';
        var tokenR = user.token || '';

        fetch(API_BASE_R + '/farmers/me', { headers: { 'Authorization': 'Bearer ' + tokenR } })
          .then(function(r) { return r.json(); })
          .then(function(profileRes) {
            if (!profileRes || !profileRes.success || !profileRes.data) return;
            var profile = profileRes.data;

            // Sync profile fields into farmerData
            farmerData.province = profile.province || '';
            farmerData.district = profile.district || '';
            farmerData.farmName = profile.farm_size_hectares ? profile.farm_size_hectares + ' ha Farm' : 'My Farm';

            // === Weather: resolve coordinates → fetch weather ===
            var locationLabel = (profile.district || profile.town || '') + ', ' + (profile.province || '');
            if (profile.latitude && profile.longitude) {
              // Best case: DB has lat/lng
              farmerData.coordinates = { lat: profile.latitude, lng: profile.longitude };
              fetchWeatherForCoords(profile.latitude, profile.longitude, locationLabel);
            } else if (profile.town || profile.province || profile.district) {
              // Fallback: geocode from town/province via Nominatim
              geocodeAndFetchWeather(profile.town || profile.district, profile.province, profile.district);
            } else {
              // No location at all — prompt user
              showWeatherError('Pin your farm location in Settings to see weather');
            }

            return Promise.all([
              fetch(API_BASE_R + '/farmers/me/crops', { headers: { 'Authorization': 'Bearer ' + tokenR } })
                .then(function(r) { return r.json(); }).catch(function() { return { success: false }; }),
              fetch(API_BASE_R + '/farmers/me/livestock', { headers: { 'Authorization': 'Bearer ' + tokenR } })
                .then(function(r) { return r.json(); }).catch(function() { return { success: false }; })
            ]);
          })
          .then(function(results) {
            if (!results) return;
            var cropsRes = results[0];
            var livestockRes = results[1];

            var crops = (cropsRes && cropsRes.success && cropsRes.data) ? cropsRes.data : [];
            var livestock = (livestockRes && livestockRes.success && livestockRes.data) ? livestockRes.data : [];

            // ── Livestock total ──
            var totalLivestock = livestock.reduce(function(sum, l) { return sum + (parseInt(l.total) || 0); }, 0);
            farmerData.livestock = totalLivestock;
            var livestockVal = document.getElementById('farmerLivestockValue');
            if (livestockVal) livestockVal.textContent = totalLivestock.toLocaleString();

            // ── Crop yield history (sorted oldest → newest) ──
            var sortedCrops = crops.slice().sort(function(a, b) {
              return new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0);
            });
            var yieldHistory = sortedCrops.map(function(c) { return parseFloat(c.yield_tonnes) || 0; });
            if (yieldHistory.length === 0) yieldHistory = [0, 0];
            farmerData.yieldHistory = yieldHistory;
            farmerData.productionHistory = yieldHistory;

            var latestYield = yieldHistory[yieldHistory.length - 1];
            var prevYield = yieldHistory.length >= 2 ? yieldHistory[yieldHistory.length - 2] : latestYield;
            var latestCrop = sortedCrops.length > 0 ? sortedCrops[sortedCrops.length - 1] : null;
            var totalHa = latestCrop && latestCrop.hectares_planted ? parseFloat(latestCrop.hectares_planted) : 0;
            var yieldPerHa = totalHa > 0 ? (latestYield / totalHa).toFixed(1) : latestYield.toFixed(1);

            var yieldVal = document.getElementById('farmerYieldValue');
            if (yieldVal) yieldVal.textContent = yieldPerHa + 't';

            farmerData.status = (latestYield >= prevYield) ? 'improving' : 'declining';

            // ── Performance score from real data ──
            var score = AgriCore.calculatePerformanceScore ? AgriCore.calculatePerformanceScore(farmerData) : 50;
            var level = AgriCore.getScoreLevel ? AgriCore.getScoreLevel(score) : { level: 'stable', label: 'Stable', color: '#f59e0b' };
            var yieldChange = prevYield > 0 ? (((latestYield - prevYield) / prevYield) * 100).toFixed(1) : 0;

            var scoreVal = document.getElementById('farmerScoreValue');
            if (scoreVal) { scoreVal.textContent = score; scoreVal.style.color = level.color; }

            var scoreTrend = document.getElementById('farmerScoreTrend');
            if (scoreTrend) {
              var tIcon = yieldChange >= 0 ? 'arrow-up-right' : 'arrow-down-right';
              scoreTrend.className = 'overview-card-trend ' + (yieldChange >= 0 ? 'up' : 'down');
              scoreTrend.innerHTML = '<i data-lucide="' + tIcon + '"></i> ' + (yieldChange >= 0 ? '+' : '') + yieldChange + '%';
            }

            var scoreIcon = document.getElementById('farmerScoreIcon');
            if (scoreIcon) {
              scoreIcon.className = 'overview-card-icon ' + (level.level === 'good' ? 'green' : level.level === 'stable' ? 'amber' : 'red');
            }

            var riskEl = document.getElementById('farmerRisk');
            if (riskEl) { riskEl.textContent = level.label; riskEl.style.color = level.color; }

            var statusBadge = document.getElementById('farmerStatusBadge');
            if (statusBadge) {
              statusBadge.textContent = farmerData.status === 'improving' ? 'Improving' : 'At Risk';
              statusBadge.className = 'overview-card-trend ' + (farmerData.status === 'improving' ? 'up' : 'down');
            }

            // ── Warning banner from real data ──
            var warnings = AgriCore.detectWarnings ? AgriCore.detectWarnings(farmerData) : [];
            var banner = document.getElementById('farmerAttentionBanner');
            var bannerText = document.getElementById('farmerAttentionText');
            if (warnings.length > 0) {
              if (banner) { banner.style.display = 'flex'; banner.classList.add('warning'); }
              if (bannerText) bannerText.textContent = warnings[0].message + (warnings.length > 1 ? ' (+' + (warnings.length - 1) + ' more)' : '');
            } else if (score >= 70 && banner) {
              banner.style.display = 'flex';
              if (bannerText) bannerText.textContent = 'Great work! Your performance score is ' + score + ' \u2014 keep it up.';
            }

            // ── Upload history from real crop data ──
            var histContainer = document.getElementById('farmerUploadHistory');
            if (histContainer && sortedCrops.length > 0) {
              var monthNames = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
                '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
              var escFn = AgriCore.escapeHtml;
              var histDisplay = sortedCrops.slice().reverse();
              histContainer.innerHTML = histDisplay.map(function(c, i) {
                var prevC = i < histDisplay.length - 1 ? histDisplay[i + 1] : null;
                var prevYld = prevC ? (parseFloat(prevC.yield_tonnes) || 0) : 0;
                var thisYld = parseFloat(c.yield_tonnes) || 0;
                var drop = prevYld > 0 ? ((prevYld - thisYld) / prevYld) * 100 : 0;
                var isDrop = drop > 5;
                var dotCls = isDrop ? 'danger' : (drop > 0 ? 'warning' : '');
                var dateStr = c.recorded_at ? c.recorded_at.split('T')[0] : '';
                var parts = dateStr.split('-');
                var lbl = parts.length >= 2 ? ((monthNames[parts[1]] || parts[1]) + ' ' + parts[0]) : dateStr;
                var warnHtml = isDrop ? ' <span class="upload-history-warning"><i data-lucide="alert-triangle"></i> -' + Math.round(drop) + '%</span>' : '';
                return '<div class="upload-history-item">' +
                  '<div class="upload-history-dot ' + dotCls + '"></div>' +
                  '<div class="upload-history-date">' + lbl + '</div>' +
                  '<div class="upload-history-values">Yield: <strong>' + thisYld + 't</strong>' +
                  (c.hectares_planted ? ' &nbsp;|&nbsp; <strong>' + c.hectares_planted + ' ha</strong>' : '') +
                  (c.crop_name ? ' &nbsp;|&nbsp; ' + escFn(c.crop_name) : '') +
                  warnHtml + '</div></div>';
              }).join('');
              if (typeof lucide !== 'undefined') lucide.createIcons();
            }
          })
          .catch(function() { /* Keep placeholder data visible */ });
      })();

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

      var cachedFarmerProfileId = null;
      function getFarmerProfileId() {
        if (cachedFarmerProfileId) {
          return Promise.resolve(cachedFarmerProfileId);
        }

        var token = user.token || '';
        var API_BASE = window.AGRICORE_API_BASE || '/api';
        return fetch(API_BASE + '/farmers/me', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(function(res) { return res.json(); })
          .then(function(res) {
            if (res.success && res.data && res.data.id) {
              cachedFarmerProfileId = res.data.id;
              return cachedFarmerProfileId;
            }
            return null;
          })
          .catch(function() { return null; });
      }

      // === PDF Download ===
      var pdfBtn = document.getElementById('downloadFarmerPdfBtn');
      if (pdfBtn) {
        pdfBtn.addEventListener('click', function() {
          pdfBtn.disabled = true;
          pdfBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || '/api';

          getFarmerProfileId()
          .then(function(farmerId) {
            if (!farmerId) throw new Error('Farmer profile not found');
            return fetch(API_BASE + '/pdf/farmer/' + farmerId, {
              method: 'GET',
              headers: { 'Authorization': 'Bearer ' + token },
            });
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
          planPdfBtn.disabled = true;
          planPdfBtn.innerHTML = '<i data-lucide="loader"></i> Generating...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || '/api';

          getFarmerProfileId()
          .then(function(farmerId) {
            if (!farmerId) throw new Error('Farmer profile not found');
            return fetch(API_BASE + '/pdf/plans/' + farmerId, {
              method: 'GET',
              headers: { 'Authorization': 'Bearer ' + token },
            });
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
