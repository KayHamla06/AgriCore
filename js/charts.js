/* ============================================
   AgriCore — Chart Configurations (Chart.js)
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  if (typeof Chart === 'undefined') return;

  const user = AgriCore.getCurrentUser();
  if (!user) return;

  const months = AgriCore.months;

  // ===== Chart.js Defaults =====
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.color = '#757575';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.elements.line.tension = 0.4;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;

  const chartColors = {
    green: 'rgba(46, 125, 50, 1)',
    greenLight: 'rgba(46, 125, 50, 0.1)',
    blue: 'rgba(25, 118, 210, 1)',
    blueLight: 'rgba(25, 118, 210, 0.1)',
    orange: 'rgba(255, 152, 0, 1)',
    orangeLight: 'rgba(255, 152, 0, 0.1)',
    red: 'rgba(229, 57, 53, 1)',
    redLight: 'rgba(229, 57, 53, 0.1)',
    purple: 'rgba(156, 39, 176, 1)',
    gray: 'rgba(158, 158, 158, 1)',
  };

  // ===== FARMER CHARTS (real data from API) =====
  if (user.role === 'farmer') {
    var API_BASE_F = window.AGRICORE_API_BASE || '/api';
    var tokenF = user.token || '';

    function showEmptyFarmerChart(id, msg) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'none';
      var wrapper = el.closest('.chart-canvas-wrapper') || el.parentNode;
      if (wrapper && !wrapper.querySelector('.chart-empty-state')) {
        var div = document.createElement('div');
        div.className = 'chart-empty-state';
        div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:120px;color:var(--gray-400);font-size:.875rem;gap:10px;';
        div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg><span>' + (msg || 'No data yet &mdash; add your first crop record.') + '</span>';
        wrapper.appendChild(div);
      }
    }

    fetch(API_BASE_F + '/farmers/me', { headers: { 'Authorization': 'Bearer ' + tokenF } })
      .then(function(r) { return r.json(); })
      .then(function(profileRes) {
        if (!profileRes || !profileRes.success || !profileRes.data) {
          showEmptyFarmerChart('farmerYieldChart', 'Could not load farm data.');
          showEmptyFarmerChart('farmerProductionChart', 'Could not load farm data.');
          return;
        }
        return fetch(API_BASE_F + '/farmers/me/crops', { headers: { 'Authorization': 'Bearer ' + tokenF } })
          .then(function(r) { return r.json(); })
          .then(function(cropsRes) {
            var crops = (cropsRes && cropsRes.success && cropsRes.data) ? cropsRes.data : [];
            if (crops.length === 0) {
              showEmptyFarmerChart('farmerYieldChart', 'No crop records yet &mdash; upload data to see charts.');
              showEmptyFarmerChart('farmerProductionChart', 'No production data yet.');
              return;
            }

            var sorted = crops.slice().sort(function(a, b) {
              return new Date(a.recorded_at || 0) - new Date(b.recorded_at || 0);
            });
            var labels = sorted.map(function(c) {
              var d = new Date(c.recorded_at || c.created_at || 0);
              return isNaN(d.getTime()) ? '--' : d.toLocaleString('default', { month: 'short', year: '2-digit' });
            });
            var yieldData = sorted.map(function(c) { return parseFloat(c.yield_tonnes) || 0; });
            var yieldPerHaData = sorted.map(function(c) {
              var ha = parseFloat(c.hectares_planted) || 1;
              return Math.round((parseFloat(c.yield_tonnes) || 0) / ha * 100) / 100;
            });

            var yieldCtx = document.getElementById('farmerYieldChart');
            if (yieldCtx) {
              new Chart(yieldCtx, {
                type: 'line',
                data: {
                  labels: labels,
                  datasets: [{
                    label: 'Yield (tonnes)',
                    data: yieldData,
                    borderColor: chartColors.green,
                    backgroundColor: chartColors.greenLight,
                    fill: true,
                    pointBackgroundColor: chartColors.green,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                  }]
                },
                options: {
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, title: { display: true, text: 'Tonnes' } },
                    x: { grid: { display: false } }
                  }
                }
              });
            }

            var prodCtx = document.getElementById('farmerProductionChart');
            if (prodCtx) {
              new Chart(prodCtx, {
                type: 'bar',
                data: {
                  labels: labels,
                  datasets: [{
                    label: 'Yield (t/ha)',
                    data: yieldPerHaData,
                    backgroundColor: yieldPerHaData.map(function(v, i, arr) {
                      return i > 0 && v >= arr[i - 1] ? 'rgba(76,175,80,0.7)' : 'rgba(229,57,53,0.7)';
                    }),
                    borderRadius: 6,
                    borderSkipped: false,
                  }]
                },
                options: {
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } },
                    x: { grid: { display: false } }
                  }
                }
              });
            }
          });
      })
      .catch(function() {
        showEmptyFarmerChart('farmerYieldChart', 'Unable to load chart data.');
        showEmptyFarmerChart('farmerProductionChart', 'Unable to load chart data.');
      });
  }

  // ===== GOVERNMENT CHARTS (real data from API) =====
  if (user.role === 'government') {
    var API_BASE_G = window.AGRICORE_API_BASE || '/api';
    var tokenG = user.token || '';

    function showEmptyGovChart(id, msg) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'none';
      var wrapper = el.closest('.chart-canvas-wrapper') || el.parentNode;
      if (wrapper && !wrapper.querySelector('.chart-empty-state')) {
        var div = document.createElement('div');
        div.className = 'chart-empty-state';
        div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:120px;color:var(--gray-400);font-size:.875rem;gap:10px;';
        div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.4"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg><span>' + (msg || 'No data yet.') + '</span>';
        wrapper.appendChild(div);
      }
    }

    fetch(API_BASE_G + '/farmers?limit=200', { headers: { 'Authorization': 'Bearer ' + tokenG } })
      .then(function(r) { return r.json(); })
      .then(function(res) {
        var farmers = (res && res.success && res.data) ? (res.data.data || []) : [];
        if (farmers.length === 0) {
          showEmptyGovChart('govPerformanceChart', 'No farmers registered yet.');
          showEmptyGovChart('govPlansChart', 'No plans created yet.');
          return;
        }

        var thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        var now = Date.now();

        // Group by province for farmer status distribution
        var provinces = {};
        farmers.forEach(function(f) {
          var prov = f.province || 'Unknown';
          if (!provinces[prov]) provinces[prov] = { active: 0, inactive: 0 };
          if (f.updated_at && (now - new Date(f.updated_at).getTime()) < thirtyDaysMs) {
            provinces[prov].active++;
          } else {
            provinces[prov].inactive++;
          }
        });
        var provLabels = Object.keys(provinces).sort();
        var activeData = provLabels.map(function(p) { return provinces[p].active; });
        var inactiveData = provLabels.map(function(p) { return provinces[p].inactive; });

        var perfCtx = document.getElementById('govPerformanceChart');
        if (perfCtx) {
          new Chart(perfCtx, {
            type: 'bar',
            data: {
              labels: provLabels,
              datasets: [
                { label: 'Active (≤30 days)', data: activeData, backgroundColor: chartColors.green, borderRadius: 4, borderSkipped: false },
                { label: 'Inactive', data: inactiveData, backgroundColor: chartColors.red, borderRadius: 4, borderSkipped: false }
              ]
            },
            options: {
              plugins: { legend: { position: 'bottom' } },
              scales: {
                y: { beginAtZero: true, stacked: true, grid: { color: 'rgba(0,0,0,.04)' } },
                x: { stacked: true, grid: { display: false } }
              }
            }
          });
        }

        // Plans per month
        fetch(API_BASE_G + '/plans', { headers: { 'Authorization': 'Bearer ' + tokenG } })
          .then(function(r) { return r.json(); }).catch(function() { return { success: false }; })
          .then(function(plansRes) {
            var planCtx = document.getElementById('govPlansChart');
            if (!planCtx) return;
            if (!plansRes || !plansRes.success || !plansRes.data || plansRes.data.length === 0) {
              showEmptyGovChart('govPlansChart', 'No support plans created yet.');
              return;
            }
            var plansByMonth = {};
            var months12 = [];
            var nowD = new Date();
            for (var i = 11; i >= 0; i--) {
              var d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
              var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
              var lbl = d.toLocaleString('default', { month: 'short', year: '2-digit' });
              months12.push({ key: key, lbl: lbl });
              plansByMonth[key] = 0;
            }
            plansRes.data.forEach(function(p) {
              var pd = new Date(p.created_at || 0);
              var pkey = pd.getFullYear() + '-' + String(pd.getMonth() + 1).padStart(2, '0');
              if (Object.prototype.hasOwnProperty.call(plansByMonth, pkey)) plansByMonth[pkey]++;
            });
            new Chart(planCtx, {
              type: 'bar',
              data: {
                labels: months12.map(function(m) { return m.lbl; }),
                datasets: [{ label: 'Plans Created', data: months12.map(function(m) { return plansByMonth[m.key]; }), backgroundColor: chartColors.blue, borderRadius: 6, borderSkipped: false }]
              },
              options: {
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } },
                  x: { grid: { display: false } }
                }
              }
            });
          });
      })
      .catch(function() {
        showEmptyGovChart('govPerformanceChart', 'Unable to load chart data.');
        showEmptyGovChart('govPlansChart', 'Unable to load chart data.');
      });
  }

  // ===== PROFILE CHARTS (rendered on demand) =====
  let profilePerfChart = null;
  let profileYieldChart = null;
  let profileCropChart = null;

  window.renderProfileCharts = function(farmer) {
    // Destroy existing charts
    if (profilePerfChart) { profilePerfChart.destroy(); profilePerfChart = null; }
    if (profileYieldChart) { profileYieldChart.destroy(); profileYieldChart = null; }
    if (profileCropChart) { profileCropChart.destroy(); profileCropChart = null; }

    const perfCtx = document.getElementById('profilePerformanceChart');
    if (perfCtx) {
      profilePerfChart = new Chart(perfCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Performance Score',
            data: farmer.yieldHistory.map((y, i) => Math.round(y * 20 + (Math.random() * 5 - 2.5))),
            borderColor: farmer.status === 'improving' ? chartColors.green : chartColors.red,
            backgroundColor: farmer.status === 'improving' ? chartColors.greenLight : chartColors.redLight,
            fill: true,
            pointRadius: 4,
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,.04)' }, max: 100 },
            x: { grid: { display: false } }
          }
        }
      });
    }

    const yieldCtx = document.getElementById('profileYieldChart');
    if (yieldCtx) {
      profileYieldChart = new Chart(yieldCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Yield (t/ha)',
            data: farmer.yieldHistory,
            backgroundColor: farmer.yieldHistory.map((v, i, arr) =>
              i > 0 && v >= arr[i - 1] ? 'rgba(76, 175, 80, 0.7)' : 'rgba(229, 57, 53, 0.7)'
            ),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Crop productivity bar chart
    const cropCtx = document.getElementById('profileCropChart');
    const cropRecords = farmer.cropRecords || [];
    if (cropCtx && cropRecords.length > 0) {
      const cropProd = AgriCore.calculateCropProductivity(farmer);
      profileCropChart = new Chart(cropCtx, {
        type: 'bar',
        data: {
          labels: cropProd.crops.map(c => c.name),
          datasets: [
            {
              label: 'Yield (tons)',
              data: cropProd.crops.map(c => c.yield),
              backgroundColor: chartColors.green,
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: 'Area (ha)',
              data: cropProd.crops.map(c => c.area),
              backgroundColor: chartColors.blue,
              borderRadius: 6,
              borderSkipped: false,
            }
          ]
        },
        options: {
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  };

  // ===== ANALYTICS CHARTS (rendered on demand) =====
  let analyticsCharts = {};

  window.renderAnalyticsCharts = function() {
    // Destroy existing analytics charts if re-rendering
    Object.keys(analyticsCharts).forEach(key => {
      if (analyticsCharts[key]) { analyticsCharts[key].destroy(); }
    });
    analyticsCharts = {};
    window._analyticsWeatherAPI = null;

    const user = AgriCore.getCurrentUser();
    const isFarmer = user && user.role === 'farmer';
    const realData = window._analyticsRealData || null;

    function toMonthlyYield(crops) {
      const now = new Date();
      const buckets = Array(12).fill(0);
      (crops || []).forEach(c => {
        const d = new Date(c.recorded_at || c.created_at || 0);
        if (isNaN(d.getTime())) return;
        const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthDiff >= 0 && monthDiff < 12) {
          const idx = 11 - monthDiff;
          buckets[idx] += (parseFloat(c.yield_tonnes) || 0);
        }
      });
      return buckets;
    }

    function buildFarmerFromRealData(rd) {
      const crops = rd && Array.isArray(rd.crops) ? rd.crops : [];
      const livestock = rd && Array.isArray(rd.livestock) ? rd.livestock : [];
      const monthlyYield = toMonthlyYield(crops);
      const fallbackYield = (rd && Array.isArray(rd.yieldHistory) && rd.yieldHistory.length)
        ? rd.yieldHistory.slice(-12)
        : monthlyYield;
      const paddedYield = Array(12 - Math.min(12, fallbackYield.length)).fill(0).concat(fallbackYield).slice(-12);

      return {
        id: rd && rd.profile ? rd.profile.id : 'me',
        name: rd && rd.profile ? rd.profile.name : 'My Farm',
        province: rd && rd.profile ? (rd.profile.province || '') : '',
        district: rd && rd.profile ? (rd.profile.district || '') : '',
        coordinates: {
          lat: rd && rd.profile && rd.profile.latitude ? Math.max(-90, Math.min(90, parseFloat(rd.profile.latitude))) : -25.75,
          lng: rd && rd.profile && rd.profile.longitude ? ((parseFloat(rd.profile.longitude) + 180) % 360 + 360) % 360 - 180 : 28.19
        },
        yieldHistory: paddedYield,
        productionHistory: paddedYield,
        cropRecords: crops.map(c => ({
          cropType: c.crop_name || 'Crop',
          areaPlanted: parseFloat(c.hectares_planted) || 0,
          yieldTons: parseFloat(c.yield_tonnes) || 0,
          plantingDate: c.season || '--',
          harvestDate: c.recorded_at ? String(c.recorded_at).split('T')[0] : '--'
        })),
        livestockRecords: livestock.map(l => ({
          animalType: l.animal_type || 'Animal',
          total: parseInt(l.total || 0, 10) || 0,
          born: parseInt(l.born || 0, 10) || 0,
          twins: 0,
          triplets: 0,
          sold: parseInt(l.sold || 0, 10) || 0,
          consumed: parseInt(l.consumed || 0, 10) || 0,
          young: parseInt(l.young || 0, 10) || 0,
          diseases: Array.isArray(l.diseases) ? l.diseases : []
        }))
      };
    }

    const primaryFarmer = (isFarmer && realData && realData.profile)
      ? buildFarmerFromRealData(realData)
      : (isFarmer
        ? (AgriCore.mockFarmers.find(f => f.id === user.id) || AgriCore.mockFarmers[0])
        : {
            ...AgriCore.mockFarmers[0],
            coordinates: (realData && Array.isArray(realData.farmers) && realData.farmers.length && realData.farmers[0].latitude && realData.farmers[0].longitude)
              ? { lat: parseFloat(realData.farmers[0].latitude), lng: parseFloat(realData.farmers[0].longitude) }
              : AgriCore.mockFarmers[0].coordinates
          });

    // ---- Yield Trends (12-month line chart) ----
    const yieldCtx = document.getElementById('analyticsYieldChart');
    if (yieldCtx) {
      const yieldData = primaryFarmer.yieldHistory;
      const prodData = primaryFarmer.productionHistory;
      const avgYield = yieldData.reduce((a, b) => a + b, 0) / yieldData.length;
      analyticsCharts.yield = new Chart(yieldCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Yield (t/ha)',
              data: yieldData,
              borderColor: chartColors.green,
              backgroundColor: chartColors.greenLight,
              fill: true,
              pointRadius: 4,
              tension: 0.3,
            },
            {
              label: 'Avg Target',
              data: Array(12).fill(Math.round(avgYield * 10) / 10),
              borderColor: chartColors.orange,
              borderDash: [8, 4],
              pointRadius: 0,
              fill: false,
            }
          ]
        },
        options: {
          plugins: { legend: { position: 'bottom' } },
          scales: {
            y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,.04)' }, title: { display: true, text: 't/ha' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // ---- Crop Breakdown (horizontal bar) ----
    const cropCtx = document.getElementById('analyticsCropBreakdownChart');
    if (cropCtx) {
      const cropProd = AgriCore.calculateCropProductivity(primaryFarmer);
      if (cropProd.crops.length > 0) {
        analyticsCharts.crop = new Chart(cropCtx, {
          type: 'bar',
          data: {
            labels: cropProd.crops.map(c => c.name),
            datasets: [
              {
                label: 'Yield (tons)',
                data: cropProd.crops.map(c => c.yield),
                backgroundColor: chartColors.green,
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Area (ha)',
                data: cropProd.crops.map(c => c.area),
                backgroundColor: chartColors.blue,
                borderRadius: 6,
                borderSkipped: false,
              }
            ]
          },
          options: {
            indexAxis: 'y',
            plugins: { legend: { position: 'bottom' } },
            scales: {
              x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' } },
              y: { grid: { display: false } }
            }
          }
        });
      }
    }

    // ---- Livestock Activity (grouped bar: born / sold / consumed per animal type) ----
    const livestockCtx = document.getElementById('analyticsLivestockChart');
    if (livestockCtx) {
      const lrecs = primaryFarmer.livestockRecords || [];
      if (lrecs.length > 0) {
        analyticsCharts.livestock = new Chart(livestockCtx, {
          type: 'bar',
          data: {
            labels: lrecs.map(r => r.animalType),
            datasets: [
              {
                label: 'Born',
                data: lrecs.map(r => r.born + r.twins * 2 + r.triplets * 3),
                backgroundColor: chartColors.green,
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Sold',
                data: lrecs.map(r => r.sold),
                backgroundColor: chartColors.blue,
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Consumed / Died',
                data: lrecs.map(r => r.consumed),
                backgroundColor: chartColors.red,
                borderRadius: 6,
                borderSkipped: false,
              }
            ]
          },
          options: {
            plugins: { legend: { position: 'bottom' } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, title: { display: true, text: 'Head count' } },
              x: { grid: { display: false } }
            }
          }
        });
      }
    }

    // ---- Herd Composition (doughnut) ----
    const herdCtx = document.getElementById('analyticsHerdChart');
    if (herdCtx) {
      const lrecs = primaryFarmer.livestockRecords || [];
      if (lrecs.length > 0) {
        const herdColors = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#795548', '#607d8b'];
        analyticsCharts.herd = new Chart(herdCtx, {
          type: 'doughnut',
          data: {
            labels: lrecs.map(r => r.animalType),
            datasets: [{
              data: lrecs.map(r => r.total),
              backgroundColor: herdColors.slice(0, lrecs.length),
              borderWidth: 0,
              hoverOffset: 8,
            }]
          },
          options: {
            cutout: '60%',
            plugins: {
              legend: { position: 'bottom' },
            }
          }
        });
      }
    }

    // ---- Weather Chart (temperature + rainfall from Open-Meteo Archive API) ----
    const weatherCtx = document.getElementById('analyticsWeatherChart');
    if (weatherCtx) {
      // Show loading state
      weatherCtx.parentElement.insertAdjacentHTML('beforeend', '<div id="weatherChartLoader" class="chart-loader"><div class="chart-loader-spinner"></div><span>Loading weather data…</span></div>');

      const coords = primaryFarmer.coordinates || { lat: -25.75, lng: 28.19 };
      const now = new Date();
      // Build last 12 months date range
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // last day of previous month
      const startDate = new Date(endDate.getFullYear() - 1, endDate.getMonth() + 1, 1); // 12 months back
      const fmt = d => d.toISOString().slice(0, 10);

      const archiveUrl = 'https://archive-api.open-meteo.com/v1/archive'
        + '?latitude=' + coords.lat
        + '&longitude=' + coords.lng
        + '&start_date=' + fmt(startDate)
        + '&end_date=' + fmt(endDate)
        + '&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean,et0_fao_evapotranspiration'
        + '&timezone=auto';

      fetch(archiveUrl)
        .then(r => r.json())
        .then(data => {
          const loader = document.getElementById('weatherChartLoader');
          if (loader) loader.remove();

          if (!data.daily || !data.daily.time) throw new Error('No data');

          const daily = data.daily;
          // Aggregate to monthly averages/totals
          const monthBuckets = {};
          daily.time.forEach((dateStr, i) => {
            const key = dateStr.slice(0, 7); // YYYY-MM
            if (!monthBuckets[key]) monthBuckets[key] = { temps: [], rains: [], humidity: [], et0: [] };
            if (daily.temperature_2m_mean[i] != null) monthBuckets[key].temps.push(daily.temperature_2m_mean[i]);
            if (daily.precipitation_sum[i] != null) monthBuckets[key].rains.push(daily.precipitation_sum[i]);
            if (daily.relative_humidity_2m_mean && daily.relative_humidity_2m_mean[i] != null) monthBuckets[key].humidity.push(daily.relative_humidity_2m_mean[i]);
            if (daily.et0_fao_evapotranspiration && daily.et0_fao_evapotranspiration[i] != null) monthBuckets[key].et0.push(daily.et0_fao_evapotranspiration[i]);
          });

          const sortedKeys = Object.keys(monthBuckets).sort();
          const monthLabels = sortedKeys.map(k => {
            const d = new Date(k + '-01');
            return d.toLocaleString('default', { month: 'short', year: '2-digit' });
          });
          const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;
          const sum = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) * 10) / 10 : 0;

          const monthlyTemp = sortedKeys.map(k => avg(monthBuckets[k].temps));
          const monthlyRain = sortedKeys.map(k => sum(monthBuckets[k].rains));

          // Store aggregated data for the weather summary panel
          window._analyticsWeatherAPI = {
            monthBuckets: monthBuckets,
            sortedKeys: sortedKeys,
            dailyData: daily,
            totalRainfall: sum(Object.values(monthBuckets).map(b => sum(b.rains))),
            avgTemp: avg(Object.values(monthBuckets).flatMap(b => b.temps)),
            minTemp: Math.round(Math.min.apply(null, daily.temperature_2m_min.filter(v => v != null)) * 10) / 10,
            maxTemp: Math.round(Math.max.apply(null, daily.temperature_2m_max.filter(v => v != null)) * 10) / 10,
            avgHumidity: avg(Object.values(monthBuckets).flatMap(b => b.humidity)),
            totalET0: sum(Object.values(monthBuckets).map(b => sum(b.et0))),
          };

          // Dispatch event so the summary panel can update
          window.dispatchEvent(new CustomEvent('analyticsWeatherReady'));

          analyticsCharts.weather = new Chart(weatherCtx, {
            type: 'bar',
            data: {
              labels: monthLabels,
              datasets: [
                {
                  type: 'line',
                  label: 'Avg Temperature (°C)',
                  data: monthlyTemp,
                  borderColor: chartColors.orange,
                  backgroundColor: 'rgba(255,152,0,0.1)',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  yAxisID: 'yTemp',
                },
                {
                  type: 'bar',
                  label: 'Rainfall (mm)',
                  data: monthlyRain,
                  backgroundColor: 'rgba(33, 150, 243, 0.6)',
                  borderRadius: 4,
                  borderSkipped: false,
                  yAxisID: 'yRain',
                }
              ]
            },
            options: {
              plugins: { legend: { position: 'bottom' } },
              scales: {
                yTemp: {
                  position: 'left',
                  title: { display: true, text: '°C' },
                  grid: { color: 'rgba(0,0,0,.04)' },
                },
                yRain: {
                  position: 'right',
                  title: { display: true, text: 'mm' },
                  grid: { display: false },
                  beginAtZero: true,
                },
                x: { grid: { display: false } }
              }
            }
          });
        })
        .catch(() => {
          const loader = document.getElementById('weatherChartLoader');
          if (loader) loader.remove();
          weatherCtx.parentElement.insertAdjacentHTML('beforeend',
            '<p style="text-align:center;color:var(--gray-400);padding:20px;">Unable to load weather data. Please try again later.</p>');
        });
    }

    // ---- Regional Performance (horizontal bar — all provinces) ----
    const regCtx = document.getElementById('analyticsRegionChart');
    if (regCtx) {
      const provinceScores = {};
      const regionFarmers = (realData && Array.isArray(realData.farmers) && realData.farmers.length)
        ? realData.farmers
        : AgriCore.mockFarmers;
      const thirtyDaysAgoTs = Date.now() - (30 * 24 * 60 * 60 * 1000);
      regionFarmers.forEach(f => {
        const province = f.province || 'Unknown';
        if (!provinceScores[province]) provinceScores[province] = [];
        if (f.yieldHistory || f.productionHistory || f.livestockRecords) {
          provinceScores[province].push(AgriCore.calculatePerformanceScore(f));
        } else {
          const updatedAt = f.updated_at ? new Date(f.updated_at).getTime() : 0;
          let score = 45;
          if (f.verified) score += 25;
          if (updatedAt > thirtyDaysAgoTs) score += 20;
          if (f.farm_size_hectares && Number(f.farm_size_hectares) > 0) score += 5;
          provinceScores[province].push(Math.max(10, Math.min(95, score)));
        }
      });
      const provinces = Object.keys(provinceScores);
      const avgScores = provinces.map(p => Math.round(provinceScores[p].reduce((a, b) => a + b, 0) / provinceScores[p].length));

      analyticsCharts.region = new Chart(regCtx, {
        type: 'bar',
        data: {
          labels: provinces,
          datasets: [{
            label: 'Avg Performance Score',
            data: avgScores,
            backgroundColor: avgScores.map(v =>
              v >= 70 ? 'rgba(76, 175, 80, 0.7)' : v >= 50 ? 'rgba(255, 152, 0, 0.7)' : 'rgba(229, 57, 53, 0.7)'
            ),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,.04)' } },
            y: { grid: { display: false } }
          }
        }
      });
    }

    // ---- Risk Distribution (doughnut — all farmers) ----
    const riskCtx = document.getElementById('analyticsRiskChart');
    if (riskCtx) {
      let riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
      const riskFarmers = (realData && Array.isArray(realData.farmers) && realData.farmers.length)
        ? realData.farmers
        : AgriCore.mockFarmers;
      const thirtyDaysAgoTs = Date.now() - (30 * 24 * 60 * 60 * 1000);
      riskFarmers.forEach(f => {
        if (f.yieldHistory || f.productionHistory || f.livestockRecords) {
          const r = AgriCore.calculateRiskScore(f);
          riskCounts[r.level] = (riskCounts[r.level] || 0) + 1;
          return;
        }
        const updatedAt = f.updated_at ? new Date(f.updated_at).getTime() : 0;
        const isRecent = updatedAt > thirtyDaysAgoTs;
        let bucket = 'High';
        if (f.verified && isRecent) bucket = 'Low';
        else if (f.verified || isRecent) bucket = 'Medium';
        else if (!f.verified && !isRecent) bucket = 'Critical';
        riskCounts[bucket] = (riskCounts[bucket] || 0) + 1;
      });
      analyticsCharts.risk = new Chart(riskCtx, {
        type: 'doughnut',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical'],
          datasets: [{
            data: [riskCounts.Low, riskCounts.Medium, riskCounts.High, riskCounts.Critical],
            backgroundColor: [chartColors.green, chartColors.orange, chartColors.red, '#b71c1c'],
            borderWidth: 0,
            hoverOffset: 8,
          }]
        },
        options: {
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  };

});
