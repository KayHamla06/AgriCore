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
        var farmerData = isFarmer
          ? (AgriCore.mockFarmers.find(function(f) { return f.id === user.id; }) || AgriCore.mockFarmers[0])
          : null;
        var primaryFarmer = farmerData || AgriCore.mockFarmers[0];
        var escape = AgriCore.escapeHtml;

        // --- KPI row ---
        var kpiRow = document.getElementById('analyticsKpiRow');
        if (kpiRow) {
          var cropProd = AgriCore.calculateCropProductivity(primaryFarmer);
          var growth = AgriCore.calculateLivestockGrowthRate(primaryFarmer);
          var riskData = AgriCore.calculateRiskScore(primaryFarmer);
          var score = AgriCore.calculatePerformanceScore(primaryFarmer);
          var scoreLevel = AgriCore.getScoreLevel(score);

          if (isFarmer) {
            kpiRow.innerHTML =
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value ' + scoreLevel.cssClass + '">' + score + '</div><div class="analytics-kpi-label">Performance Score</div><div class="analytics-kpi-sub">' + scoreLevel.label + '</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + primaryFarmer.yieldHistory[primaryFarmer.yieldHistory.length - 1] + '</div><div class="analytics-kpi-label">Latest Yield (t/ha)</div><div class="analytics-kpi-sub">Last reported</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + cropProd.totalYield + '</div><div class="analytics-kpi-label">Total Harvest (tons)</div><div class="analytics-kpi-sub">' + cropProd.crops.length + ' crop(s)</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + growth.totalAnimals + '</div><div class="analytics-kpi-label">Total Livestock</div><div class="analytics-kpi-sub">Growth: ' + (growth.rate > 0 ? '+' : '') + growth.rate + '%</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value ' + (riskData.score >= 40 ? 'danger' : riskData.score >= 20 ? 'warning' : 'good') + '">' + riskData.level + '</div><div class="analytics-kpi-label">Risk Level</div><div class="analytics-kpi-sub">Score: ' + riskData.score + '/100</div></div>';
          } else {
            var totalFarmers = AgriCore.mockFarmers.length;
            var avgScore = Math.round(AgriCore.mockFarmers.reduce(function(s, f) { return s + AgriCore.calculatePerformanceScore(f); }, 0) / totalFarmers);
            var declining = AgriCore.mockFarmers.filter(function(f) { return AgriCore.calculatePerformanceScore(f) < 50; }).length;
            var totalLivestock = AgriCore.mockFarmers.reduce(function(s, f) { return s + (f.livestockRecords || []).reduce(function(sum, r) { return sum + r.total; }, 0); }, 0);
            var totalCropYield = AgriCore.mockFarmers.reduce(function(s, f) { return s + AgriCore.calculateCropProductivity(f).totalYield; }, 0);
            kpiRow.innerHTML =
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + totalFarmers + '</div><div class="analytics-kpi-label">Total Farmers</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + avgScore + '</div><div class="analytics-kpi-label">Avg Performance</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value danger">' + declining + '</div><div class="analytics-kpi-label">Declining Farmers</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + totalLivestock.toLocaleString() + '</div><div class="analytics-kpi-label">Total Livestock</div></div>' +
              '<div class="analytics-kpi-card"><div class="analytics-kpi-value">' + totalCropYield.toLocaleString() + 't</div><div class="analytics-kpi-label">Total Crop Yield</div></div>';
          }
        }

        // --- Crop Table ---
        var cropTable = document.getElementById('analyticsCropTable');
        if (cropTable) {
          var cropRecords = primaryFarmer.cropRecords || [];
          if (cropRecords.length > 0) {
            var maxYield = Math.max.apply(null, cropRecords.map(function(c) { return c.areaPlanted > 0 ? c.yieldTons / c.areaPlanted : 0; }));
            var rows = '';
            cropRecords.forEach(function(c) {
              var yph = c.areaPlanted > 0 ? (c.yieldTons / c.areaPlanted).toFixed(1) : '0';
              var pct = maxYield > 0 ? Math.round((parseFloat(yph) / maxYield) * 100) : 0;
              var barClass = pct >= 70 ? '' : pct >= 40 ? 'warning' : 'danger';
              rows += '<tr><td><strong>' + escape(c.cropType) + '</strong></td><td>' + c.areaPlanted + ' ha</td><td>' + c.yieldTons + ' t</td><td>' + yph + ' t/ha</td>' +
                '<td class="yield-bar-cell"><div class="analytics-yield-bar"><div class="analytics-yield-bar-fill ' + barClass + '" style="width:' + pct + '%"></div></div></td>' +
                '<td>' + escape(c.plantingDate) + '</td><td>' + escape(c.harvestDate) + '</td></tr>';
            });
            cropTable.innerHTML = '<table><thead><tr><th>Crop</th><th>Area</th><th>Yield</th><th>t/ha</th><th>Relative</th><th>Planted</th><th>Harvested</th></tr></thead><tbody>' + rows + '</tbody></table>';
          } else {
            cropTable.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">No crop data available.</p>';
          }
        }

        // --- Livestock Table ---
        var livestockTable = document.getElementById('analyticsLivestockTable');
        if (livestockTable) {
          var lrecs = primaryFarmer.livestockRecords || [];
          if (lrecs.length > 0) {
            var lrows = '';
            lrecs.forEach(function(r) {
              var diseaseTags = r.diseases.length > 0
                ? r.diseases.map(function(d) { return '<span class="analytics-disease-tag">' + escape(d) + '</span>'; }).join('')
                : '<span class="analytics-disease-tag healthy">Healthy</span>';
              lrows += '<tr><td><strong>' + escape(r.animalType) + '</strong></td><td>' + r.total + '</td><td>' + (r.born + r.twins * 2 + r.triplets * 3) + '</td><td>' + r.sold + '</td><td>' + r.consumed + '</td><td>' + r.young + '</td><td>' + diseaseTags + '</td><td>' + escape(r.lastDosed) + '</td></tr>';
            });
            livestockTable.innerHTML = '<table><thead><tr><th>Animal</th><th>Total</th><th>Born</th><th>Sold</th><th>Consumed</th><th>Young</th><th>Health</th><th>Last Dosed</th></tr></thead><tbody>' + lrows + '</tbody></table>';
          } else {
            livestockTable.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">No livestock data available.</p>';
          }
        }

        // --- Weather Summary ---
        var weatherSummary = document.getElementById('analyticsWeatherSummary');
        if (weatherSummary) {
          var w = primaryFarmer.weatherData || {};
          var s = primaryFarmer.soilData || {};
          var droughtColor = w.droughtRisk === 'Very High' || w.droughtRisk === 'High' ? 'danger' : w.droughtRisk === 'Moderate' ? 'warning' : 'good';
          weatherSummary.innerHTML =
            '<div class="weather-summary-item"><div class="weather-summary-icon rain"><i data-lucide="cloud-rain"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + (w.rainfall || 0) + ' mm</div><div class="weather-summary-label">Seasonal Rainfall</div></div></div>' +
            '<div class="weather-summary-item"><div class="weather-summary-icon temp"><i data-lucide="thermometer"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + (w.avgTemp || 0) + '\u00B0C</div><div class="weather-summary-label">Avg Temperature (' + (w.minTemp || 0) + '\u2013' + (w.maxTemp || 0) + '\u00B0C)</div></div></div>' +
            '<div class="weather-summary-item"><div class="weather-summary-icon humidity"><i data-lucide="droplets"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + (w.humidity || 0) + '%</div><div class="weather-summary-label">Humidity</div></div></div>' +
            '<div class="weather-summary-item"><div class="weather-summary-icon drought"><i data-lucide="sun"></i></div><div class="weather-summary-text"><div class="weather-summary-value ' + droughtColor + '">' + (w.droughtRisk || 'N/A') + '</div><div class="weather-summary-label">Drought Risk</div></div></div>' +
            '<div class="weather-summary-item"><div class="weather-summary-icon soil"><i data-lucide="mountain"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + (s.soilType || 'N/A') + '</div><div class="weather-summary-label">Soil Type \u2014 ' + (s.landGradient || 'N/A') + '</div></div></div>' +
            '<div class="weather-summary-item"><div class="weather-summary-icon water"><i data-lucide="waves"></i></div><div class="weather-summary-text"><div class="weather-summary-value">' + (s.irrigation ? s.irrigationType : 'None') + '</div><div class="weather-summary-label">Irrigation \u2014 ' + (s.waterSource || 'N/A') + '</div></div></div>';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // --- Ranking Cards ---
        var rankingCards = document.getElementById('analyticsRankingCards');
        if (rankingCards) {
          var allFarmers = AgriCore.mockFarmers;
          var scored = allFarmers.map(function(f) {
            return { id: f.id, name: f.name, district: f.district, province: f.province, score: AgriCore.calculatePerformanceScore(f) };
          }).sort(function(a, b) { return b.score - a.score; });

          var me = scored.find(function(s) { return s.id === primaryFarmer.id; }) || scored[0];
          var nationalRank = scored.findIndex(function(s) { return s.id === me.id; }) + 1;
          var nationalTotal = scored.length;

          var provinceFarmers = scored.filter(function(s) {
            var fm = allFarmers.find(function(f) { return f.id === s.id; });
            return fm && fm.province === primaryFarmer.province;
          });
          var provRank = provinceFarmers.findIndex(function(s) { return s.id === me.id; }) + 1;
          var provTotal = provinceFarmers.length;

          var districtFarmers = scored.filter(function(s) {
            var fm = allFarmers.find(function(f) { return f.id === s.id; });
            return fm && fm.district === primaryFarmer.district;
          });
          var distRank = districtFarmers.findIndex(function(s) { return s.id === me.id; }) + 1;
          var distTotal = districtFarmers.length;
          var localRank = distRank;
          var localTotal = distTotal;

          function rankClass(rank, total) {
            var pct = total > 0 ? (rank / total) * 100 : 100;
            if (pct <= 30) return 'top3';
            if (pct <= 60) return 'top10';
            if (pct <= 80) return 'mid';
            return 'low';
          }
          function percentileLabel(rank, total) {
            var pct = total > 0 ? Math.round(((total - rank + 1) / total) * 100) : 0;
            var cls = pct >= 70 ? 'top' : pct >= 40 ? 'mid' : 'low';
            return '<span class="rank-percentile ' + cls + '">Top ' + (100 - pct + 1) + '%</span>';
          }
          function badgeColor(rank, total) {
            var pct = total > 0 ? (rank / total) : 1;
            if (pct <= 0.25) return 'gold';
            if (pct <= 0.5) return 'silver';
            if (pct <= 0.75) return 'bronze';
            return 'blue';
          }

          rankingCards.innerHTML =
            '<div class="analytics-rank-card ' + badgeColor(localRank, localTotal) + '"><div class="rank-scope">Local (District)</div><div class="rank-position ' + rankClass(localRank, localTotal) + '">#' + localRank + '</div><div class="rank-total">of ' + localTotal + ' farmer' + (localTotal !== 1 ? 's' : '') + '</div>' + percentileLabel(localRank, localTotal) + '</div>' +
            '<div class="analytics-rank-card ' + badgeColor(distRank, distTotal) + '"><div class="rank-scope">District</div><div class="rank-position ' + rankClass(distRank, distTotal) + '">#' + distRank + '</div><div class="rank-total">of ' + distTotal + ' in ' + escape(primaryFarmer.district) + '</div>' + percentileLabel(distRank, distTotal) + '</div>' +
            '<div class="analytics-rank-card ' + badgeColor(provRank, provTotal) + '"><div class="rank-scope">Provincial</div><div class="rank-position ' + rankClass(provRank, provTotal) + '">#' + provRank + '</div><div class="rank-total">of ' + provTotal + ' in ' + escape(primaryFarmer.province) + '</div>' + percentileLabel(provRank, provTotal) + '</div>' +
            '<div class="analytics-rank-card ' + badgeColor(nationalRank, nationalTotal) + '"><div class="rank-scope">National</div><div class="rank-position ' + rankClass(nationalRank, nationalTotal) + '">#' + nationalRank + '</div><div class="rank-total">of ' + nationalTotal + ' farmers</div>' + percentileLabel(nationalRank, nationalTotal) + '</div>';
        }
      };
    }
  });
})();
