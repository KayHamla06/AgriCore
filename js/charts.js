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

  // ===== FARMER CHARTS =====
  if (user.role === 'farmer') {
    // Find farmer data (use first farmer as default mock)
    const farmerData = AgriCore.mockFarmers[0];

    // Yield Over Time (Line Chart)
    const yieldCtx = document.getElementById('farmerYieldChart');
    if (yieldCtx) {
      new Chart(yieldCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Yield (t/ha)',
            data: farmerData.yieldHistory,
            borderColor: chartColors.green,
            backgroundColor: chartColors.greenLight,
            fill: true,
            pointBackgroundColor: chartColors.green,
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: 'rgba(0,0,0,.04)' },
              title: { display: true, text: 'Tons / Hectare' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // Monthly Production (Bar Chart)
    const prodCtx = document.getElementById('farmerProductionChart');
    if (prodCtx) {
      new Chart(prodCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Production (tons)',
            data: farmerData.productionHistory,
            backgroundColor: farmerData.productionHistory.map((v, i) =>
              i >= farmerData.productionHistory.length - 1 ? chartColors.green : 'rgba(76, 175, 80, 0.5)'
            ),
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,.04)' },
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }

  // ===== GOVERNMENT CHARTS =====
  if (user.role === 'government') {
    // Farmer Performance Distribution (Line chart)
    const perfCtx = document.getElementById('govPerformanceChart');
    if (perfCtx) {
      new Chart(perfCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Improving Farmers',
              data: [1520, 1560, 1600, 1640, 1680, 1720, 1750, 1780, 1810, 1840, 1870, 1892],
              borderColor: chartColors.green,
              backgroundColor: chartColors.greenLight,
              fill: true,
            },
            {
              label: 'Declining Farmers',
              data: [780, 760, 720, 700, 680, 670, 660, 650, 640, 660, 655, 655],
              borderColor: chartColors.red,
              backgroundColor: chartColors.redLight,
              fill: true,
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: 'rgba(0,0,0,.04)' },
            },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Plans by Month (Bar Chart)
    const planCtx = document.getElementById('govPlansChart');
    if (planCtx) {
      new Chart(planCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Plans Created',
            data: [8, 12, 10, 15, 9, 11, 14, 13, 16, 12, 14, 14],
            backgroundColor: chartColors.blue,
            borderRadius: 6,
            borderSkipped: false,
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,.04)' },
            },
            x: { grid: { display: false } }
          }
        }
      });
    }
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
    const primaryFarmer = isFarmer
      ? (AgriCore.mockFarmers.find(f => f.id === user.id) || AgriCore.mockFarmers[0])
      : AgriCore.mockFarmers[0];

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
      AgriCore.mockFarmers.forEach(f => {
        if (!provinceScores[f.province]) provinceScores[f.province] = [];
        provinceScores[f.province].push(AgriCore.calculatePerformanceScore(f));
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
      AgriCore.mockFarmers.forEach(f => {
        const r = AgriCore.calculateRiskScore(f);
        riskCounts[r.level] = (riskCounts[r.level] || 0) + 1;
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
