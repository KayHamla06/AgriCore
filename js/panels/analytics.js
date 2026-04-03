/* ============================================
   AgriCore — Analytics Panel
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'analytics',
    panelId: 'panel-analytics',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Analytics</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Comprehensive farm performance analysis.</p>
          </div>
        </div>

        <div class="analytics-kpi-row" id="analyticsKpiRow"></div>

        <div class="analytics-section">
          <div class="analytics-section-header">
            <i data-lucide="wheat"></i>
            <h3>Yield &amp; Harvest Performance</h3>
          </div>
          <div class="charts-row" style="margin-bottom:20px;">
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Monthly Yield (t/ha) — 12 Months</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsYieldChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Crop Breakdown</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsCropBreakdownChart"></canvas>
              </div>
            </div>
          </div>
          <div id="analyticsCropTable" class="analytics-data-table"></div>
        </div>

        <div class="analytics-section">
          <div class="analytics-section-header">
            <i data-lucide="beef"></i>
            <h3>Livestock Performance</h3>
          </div>
          <div class="charts-row" style="margin-bottom:20px;">
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Livestock Activity (Born / Sold / Consumed)</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsLivestockChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Herd Composition</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsHerdChart"></canvas>
              </div>
            </div>
          </div>
          <div id="analyticsLivestockTable" class="analytics-data-table"></div>
        </div>

        <div class="analytics-section">
          <div class="analytics-section-header">
            <i data-lucide="cloud-sun"></i>
            <h3>Weather Conditions</h3>
          </div>
          <div class="charts-row" style="margin-bottom:20px;">
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Temperature &amp; Rainfall</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsWeatherChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Environmental Summary</h3>
              </div>
              <div id="analyticsWeatherSummary" class="analytics-weather-summary"></div>
            </div>
          </div>
        </div>

        <div class="analytics-section">
          <div class="analytics-section-header">
            <i data-lucide="trophy"></i>
            <h3>Farm Ranking &amp; Position</h3>
          </div>
          <div id="analyticsRankingCards" class="analytics-ranking-row"></div>
          <div class="charts-row">
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Regional Performance Comparison</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsRegionChart"></canvas>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-card-header">
                <h3 class="chart-card-title">Risk Distribution</h3>
              </div>
              <div class="chart-canvas-wrapper">
                <canvas id="analyticsRiskChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    init: function(ctx) {
      // renderAnalyticsData is called on-demand when switching to the analytics panel
      window.renderAnalyticsData = function() {
        var user = ctx.user;
        var isFarmer = ctx.isFarmer;
        var escape = AgriCore.escapeHtml;
        var API_BASE = window.AGRICORE_API_BASE || '/api';
        var token = (user && user.token) || '';

        // --- Show loading state ---
        var kpiRow = document.getElementById('analyticsKpiRow');
        var cropTable = document.getElementById('analyticsCropTable');
        var lstTable = document.getElementById('analyticsLivestockTable');
        var rankingCards = document.getElementById('analyticsRankingCards');
        var loadingHtml = '<div class="chart-loader"><div class="chart-loader-spinner"></div><span>Loading data&hellip;</span></div>';
        if (kpiRow) kpiRow.innerHTML = loadingHtml;
        if (cropTable) cropTable.innerHTML = loadingHtml;
        if (lstTable) lstTable.innerHTML = loadingHtml;

        if (isFarmer) {
          // ── Farmer: fetch own profile → crops + livestock ──
          fetch(API_BASE + '/farmers/me', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function(r) { return r.json(); })
            .then(function(profileRes) {
              if (!profileRes || !profileRes.success || !profileRes.data) throw new Error('no profile');
              var profile = profileRes.data;
              return Promise.all([
                fetch(API_BASE + '/farmers/me/crops', { headers: { 'Authorization': 'Bearer ' + token } })
                  .then(function(r) { return r.json(); }).catch(function() { return { success: false }; }),
                fetch(API_BASE + '/farmers/me/livestock', { headers: { 'Authorization': 'Bearer ' + token } })
                  .then(function(r) { return r.json(); }).catch(function() { return { success: false }; })
              ]).then(function(results) {
                return { profile: profile, crops: results[0].success ? (results[0].data || []) : [], livestock: results[1].success ? (results[1].data || []) : [] };
              });
            })
            .then(function(d) {
              var profile = d.profile;
              var crops = d.crops;
              var livestock = d.livestock;

              // ── Synthesize farmerData for AgriCore helper functions ──
              var yieldHistory = crops.slice().sort(function(a, b) { return new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0); }).map(function(c) { return parseFloat(c.yield_tonnes) || 0; });
              if (yieldHistory.length === 0) yieldHistory = [0, 0];
              var totalLivestock = livestock.reduce(function(sum, l) { return sum + (parseInt(l.total) || 0); }, 0);
              var lastYield = yieldHistory[yieldHistory.length - 1];
              var prevYield = yieldHistory.length >= 2 ? yieldHistory[yieldHistory.length - 2] : lastYield;
              var status = lastYield >= prevYield ? 'improving' : 'declining';

              var synth = { id: profile.id, name: profile.name, province: profile.province || '', district: profile.district || '', yieldHistory: yieldHistory, productionHistory: yieldHistory, livestock: totalLivestock, status: status, cropRecords: [], livestockRecords: [] };
              var score = AgriCore.calculatePerformanceScore ? AgriCore.calculatePerformanceScore(synth) : 50;
              var scoreLevel = AgriCore.getScoreLevel ? AgriCore.getScoreLevel(score) : { level: 'stable', label: 'Stable', cssClass: 'warning' };

              // ── KPI row ──
              if (kpiRow) {
                var latestCrop = crops.length > 0 ? crops[crops.length - 1] : null;
                var totalHa = latestCrop && latestCrop.hectares_planted ? parseFloat(latestCrop.hectares_planted) : 0;
                var yieldPerHa = totalHa > 0 ? (lastYield / totalHa).toFixed(1) : lastYield.toFixed(1);
                var totalYield = crops.reduce(function(s, c) { return s + (parseFloat(c.yield_tonnes) || 0); }, 0);
                kpiRow.innerHTML =
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value ' + (scoreLevel.cssClass || '') + '">' + score + '</div><div class="analytics-kpi-label">Performance Score</div><div class="analytics-kpi-sub">' + scoreLevel.label + '</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + yieldPerHa + 't</div><div class="analytics-kpi-label">Latest Yield / Ha</div><div class="analytics-kpi-sub">Last record</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + totalYield.toFixed(1) + 't</div><div class="analytics-kpi-label">Total Harvest</div><div class="analytics-kpi-sub">' + crops.length + ' crop record(s)</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + totalLivestock.toLocaleString() + '</div><div class="analytics-kpi-label">Total Livestock</div><div class="analytics-kpi-sub">' + livestock.length + ' record(s)</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + escape(profile.province || '--') + '</div><div class="analytics-kpi-label">Province</div><div class="analytics-kpi-sub">' + escape(profile.district || '--') + '</div></div>';
              }

              // ── Crop table ──
              if (cropTable) {
                if (crops.length === 0) {
                  cropTable.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">No crop data submitted yet.</p>';
                } else {
                  var sortedCrops = crops.slice().sort(function(a, b) { return new Date(b.recorded_at || 0) - new Date(a.recorded_at || 0); });
                  var maxYield = Math.max.apply(null, sortedCrops.map(function(c) { return parseFloat(c.yield_tonnes) || 0; }));
                  var rows = sortedCrops.map(function(c) {
                    var y = parseFloat(c.yield_tonnes) || 0;
                    var ha = parseFloat(c.hectares_planted) || 0;
                    var yph = ha > 0 ? (y / ha).toFixed(2) : '--';
                    var pct = maxYield > 0 ? Math.round((y / maxYield) * 100) : 0;
                    var barClass = pct >= 70 ? '' : pct >= 40 ? 'warning' : 'danger';
                    var dateStr = c.recorded_at ? c.recorded_at.split('T')[0] : '--';
                    return '<tr><td><strong>' + escape(c.crop_name || '--') + '</strong></td><td>' + (ha || '--') + ' ha</td><td>' + y + ' t</td><td>' + yph + ' t/ha</td>' +
                      '<td class="yield-bar-cell"><div class="analytics-yield-bar"><div class="analytics-yield-bar-fill ' + barClass + '" style="width:' + pct + '%"></div></div></td>' +
                      '<td>' + escape(c.season || '--') + '</td><td>' + escape(c.irrigation_type || '--') + '</td><td>' + dateStr + '</td></tr>';
                  }).join('');
                  cropTable.innerHTML = '<table><thead><tr><th>Crop</th><th>Area</th><th>Yield</th><th>t/ha</th><th>Relative</th><th>Season</th><th>Irrigation</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody></table>';
                }
              }

              // ── Livestock table ──
              if (lstTable) {
                if (livestock.length === 0) {
                  lstTable.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">No livestock data submitted yet.</p>';
                } else {
                  var lrows = livestock.map(function(r) {
                    var diseases = r.diseases && r.diseases.length > 0
                      ? r.diseases.map(function(d) { return '<span class="analytics-disease-tag">' + escape(d) + '</span>'; }).join('')
                      : '<span class="analytics-disease-tag healthy">Healthy</span>';
                    var dateStr = r.last_dosed ? r.last_dosed.split('T')[0] : '--';
                    return '<tr><td><strong>' + escape(r.animal_type || '--') + '</strong></td><td>' + (r.total || 0) + '</td><td>' + (r.born || 0) + '</td><td>' + (r.sold || 0) + '</td><td>' + (r.consumed || 0) + '</td><td>' + (r.young || 0) + '</td><td>' + diseases + '</td><td>' + dateStr + '</td></tr>';
                  }).join('');
                  lstTable.innerHTML = '<table><thead><tr><th>Animal</th><th>Total</th><th>Born</th><th>Sold</th><th>Consumed</th><th>Young</th><th>Health</th><th>Last Dosed</th></tr></thead><tbody>' + lrows + '</tbody></table>';
                }
              }

              // Store real data for charts
              window._analyticsRealData = { profile: profile, crops: crops, livestock: livestock, yieldHistory: yieldHistory };
              if (typeof window.renderAnalyticsCharts === 'function') window.renderAnalyticsCharts();

              // Ranking: farmers can't see others' data, show province/district info
              if (rankingCards) {
                rankingCards.innerHTML =
                  '<div class="analytics-rank-card blue"><div class="rank-scope">Province</div><div class="rank-position">' + escape(profile.province || '--') + '</div><div class="rank-total">Your region</div></div>' +
                  '<div class="analytics-rank-card blue"><div class="rank-scope">District</div><div class="rank-position">' + escape(profile.district || '--') + '</div><div class="rank-total">Your district</div></div>' +
                  '<div class="analytics-rank-card ' + (score >= 70 ? 'gold' : score >= 40 ? 'silver' : 'blue') + '"><div class="rank-scope">Your Score</div><div class="rank-position">' + score + '</div><div class="rank-total">' + scoreLevel.label + '</div></div>';
              }
              if (typeof lucide !== 'undefined') lucide.createIcons();
            })
            .catch(function() {
              if (kpiRow) kpiRow.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">Could not load analytics data. Please try again.</p>';
              if (cropTable) cropTable.innerHTML = '';
              if (lstTable) lstTable.innerHTML = '';
            });

        } else {
          // ── Gov: fetch all farmers, compute aggregate KPIs ──
          fetch(API_BASE + '/farmers?limit=200', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function(r) { return r.json(); })
            .then(function(res) {
              if (!res || !res.success || !res.data) throw new Error('no data');
              var farmers = res.data.data || [];
              var total = res.data.total || farmers.length;
              var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
              var activeFarmers = farmers.filter(function(f) { return f.updated_at && f.updated_at > thirtyDaysAgo; });
              var verifiedFarmers = farmers.filter(function(f) { return f.verified; });

              // District breakdown
              var distMap = {};
              farmers.forEach(function(f) {
                var key = f.district || 'Unknown';
                if (!distMap[key]) distMap[key] = { district: key, province: f.province || '', count: 0, active: 0 };
                distMap[key].count++;
                if (f.updated_at && f.updated_at > thirtyDaysAgo) distMap[key].active++;
              });
              var districts = Object.values(distMap).sort(function(a, b) { return b.count - a.count; });

              if (kpiRow) {
                kpiRow.innerHTML =
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + total.toLocaleString() + '</div><div class="analytics-kpi-label">Total Farmers</div><div class="analytics-kpi-sub">Registered</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value good">' + activeFarmers.length + '</div><div class="analytics-kpi-label">Active Farmers</div><div class="analytics-kpi-sub">Updated \u2264 30 days</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value ' + (farmers.length - activeFarmers.length > 0 ? 'danger' : 'good') + '">' + (farmers.length - activeFarmers.length) + '</div><div class="analytics-kpi-label">Inactive Farmers</div><div class="analytics-kpi-sub">No recent updates</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + verifiedFarmers.length + '</div><div class="analytics-kpi-label">Verified</div><div class="analytics-kpi-sub">of ' + total + ' registered</div></div>' +
                  '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + districts.length + '</div><div class="analytics-kpi-label">Districts</div><div class="analytics-kpi-sub">Covered</div></div>';
              }

              // Farmer list table in cropTable slot
              if (cropTable) {
                if (farmers.length === 0) {
                  cropTable.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">No farmers registered yet.</p>';
                } else {
                  var frows = farmers.slice(0, 50).map(function(f) {
                    var isActive = f.updated_at && f.updated_at > thirtyDaysAgo;
                    var sCls = f.verified ? 'badge-success' : (isActive ? 'badge-warning' : 'badge-danger');
                    var sLbl = f.verified ? 'Verified' : (isActive ? 'Active' : 'Inactive');
                    return '<tr><td><strong>' + escape(f.name || '--') + '</strong></td><td>' + escape(f.province || '--') + '</td><td>' + escape(f.district || '--') + '</td>' +
                      '<td>' + (f.farm_size_hectares ? f.farm_size_hectares + ' ha' : '--') + '</td>' +
                      '<td><span class="badge ' + sCls + '">' + sLbl + '</span></td></tr>';
                  }).join('');
                  cropTable.innerHTML = '<h4 style="margin:0 0 12px;font-size:.9rem;color:var(--gray-600);">Farmer Directory (showing first 50)</h4><table><thead><tr><th>Name</th><th>Province</th><th>District</th><th>Farm Size</th><th>Status</th></tr></thead><tbody>' + frows + '</tbody></table>';
                }
              }

              if (lstTable) {
                // District summary table
                var drows = districts.map(function(d) {
                  var pct = d.count > 0 ? Math.round((d.active / d.count) * 100) : 0;
                  return '<tr><td><strong>' + escape(d.district) + '</strong></td><td>' + escape(d.province) + '</td><td>' + d.count + '</td><td>' + d.active + '</td><td>' + pct + '%</td></tr>';
                }).join('');
                lstTable.innerHTML = '<h4 style="margin:0 0 12px;font-size:.9rem;color:var(--gray-600);">District Summary</h4><table><thead><tr><th>District</th><th>Province</th><th>Total</th><th>Active</th><th>Activity Rate</th></tr></thead><tbody>' + drows + '</tbody></table>';
              }

              if (rankingCards) {
                var topDistrict = districts.length > 0 ? districts[0] : null;
                rankingCards.innerHTML =
                  '<div class="analytics-rank-card gold"><div class="rank-scope">Most Farmers</div><div class="rank-position">' + escape(topDistrict ? topDistrict.district : '--') + '</div><div class="rank-total">' + (topDistrict ? topDistrict.count + ' farmers' : '') + '</div></div>' +
                  '<div class="analytics-rank-card silver"><div class="rank-scope">Active Rate</div><div class="rank-position">' + (total > 0 ? Math.round((activeFarmers.length / total) * 100) : 0) + '%</div><div class="rank-total">Platform activity</div></div>' +
                  '<div class="analytics-rank-card blue"><div class="rank-scope">Verified</div><div class="rank-position">' + (total > 0 ? Math.round((verifiedFarmers.length / total) * 100) : 0) + '%</div><div class="rank-total">of all farmers</div></div>';
              }

              window._analyticsRealData = { farmers: farmers };
              if (typeof window.renderAnalyticsCharts === 'function') window.renderAnalyticsCharts();
              if (typeof lucide !== 'undefined') lucide.createIcons();
            })
            .catch(function() {
              if (kpiRow) kpiRow.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">Could not load analytics data.</p>';
            });
        }

        // --- Weather Summary (Open-Meteo — separate from farmer data) ---
        var weatherSummary = document.getElementById('analyticsWeatherSummary');
        if (weatherSummary) {
          function renderWeatherSummaryFromAPI() {
            var api = window._analyticsWeatherAPI;
            if (!api) return;

            var droughtRisk = 'Low', droughtColor = 'good';
            if (api.totalET0 > 0 && api.totalRainfall > 0) {
              var bal = api.totalRainfall / api.totalET0;
              if (bal < 0.3) { droughtRisk = 'Very High'; droughtColor = 'danger'; }
              else if (bal < 0.5) { droughtRisk = 'High'; droughtColor = 'danger'; }
              else if (bal < 0.75) { droughtRisk = 'Moderate'; droughtColor = 'warning'; }
            }
            var rainyDays = 0;
            if (api.dailyData && api.dailyData.precipitation_sum) {
              rainyDays = api.dailyData.precipitation_sum.filter(function(v) { return v != null && v > 1; }).length;
            }
            var wettestMonth = '\u2014', maxRain = 0;
            if (api.sortedKeys) {
              api.sortedKeys.forEach(function(k) {
                var mTotal = api.monthBuckets[k].rains.reduce(function(a, b) { return a + b; }, 0);
                if (mTotal > maxRain) { maxRain = mTotal; wettestMonth = new Date(k + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }); }
              });
            }
            weatherSummary.innerHTML =
              '<div class="weather-summary-item"><div class="weather-summary-icon rain"><i data-lucide="cloud-rain"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + api.totalRainfall.toFixed(1) + ' mm</div><div class="weather-summary-label">Total Rainfall (12 months)</div></div></div>' +
              '<div class="weather-summary-item"><div class="weather-summary-icon temp"><i data-lucide="thermometer"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + api.avgTemp + '\u00B0C</div><div class="weather-summary-label">Avg Temperature (' + api.minTemp + '\u2013' + api.maxTemp + '\u00B0C)</div></div></div>' +
              '<div class="weather-summary-item"><div class="weather-summary-icon humidity"><i data-lucide="droplets"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + api.avgHumidity + '%</div><div class="weather-summary-label">Avg Relative Humidity</div></div></div>' +
              '<div class="weather-summary-item"><div class="weather-summary-icon drought"><i data-lucide="sun"></i></div><div class="weather-summary-text"><div class="weather-summary-value ' + droughtColor + '">' + droughtRisk + '</div><div class="weather-summary-label">Drought Risk</div></div></div>' +
              '<div class="weather-summary-item"><div class="weather-summary-icon rain"><i data-lucide="cloud-drizzle"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + rainyDays + ' days</div><div class="weather-summary-label">Rainy Days &gt;1mm &mdash; Wettest: ' + escape(wettestMonth) + '</div></div></div>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
          weatherSummary.innerHTML = '<div class="chart-loader"><div class="chart-loader-spinner"></div><span>Loading weather data&hellip;</span></div>';
          if (window._analyticsWeatherAPI) {
            renderWeatherSummaryFromAPI();
          } else {
            window.addEventListener('analyticsWeatherReady', function handler() {
              renderWeatherSummaryFromAPI();
              window.removeEventListener('analyticsWeatherReady', handler);
            });
          }
        }
      };
    }
  });
})();
