/* ============================================
   AgriCore — Shared Utilities
   ============================================ */

const AgriCore = (() => {
  'use strict';

  // ===== Utility Constants =====
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ===== Backward Compatibility: empty arrays (real data comes from API) =====
  const mockFarmers = [];
  const mockPlans = [];

  // ===== Utility Functions =====
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatCurrency(amount) {
    return 'R ' + Number(amount).toLocaleString('en-ZA');
  }

  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  function getPerformanceStatus(currentYield, previousYield) {
    if (currentYield > previousYield) {
      return { status: 'improving', label: 'Improving', class: 'badge-success' };
    } else {
      return { status: 'declining', label: 'Declining', class: 'badge-danger' };
    }
  }

  // ===== Session Management =====
  const USER_STORAGE_KEY = 'agricore_user';

  function setCurrentUser(user) {
    const serialized = JSON.stringify(user);
    // Persist across normal refreshes/restarts; keep sessionStorage for legacy reads.
    localStorage.setItem(USER_STORAGE_KEY, serialized);
    sessionStorage.setItem(USER_STORAGE_KEY, serialized);
  }

  function getCurrentUser() {
    const fromLocal = localStorage.getItem(USER_STORAGE_KEY);
    const fromSession = sessionStorage.getItem(USER_STORAGE_KEY);
    const data = fromLocal || fromSession;
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      // Backfill sessionStorage when user came from localStorage only.
      if (!fromSession) sessionStorage.setItem(USER_STORAGE_KEY, data);
      return parsed;
    } catch (_err) {
      clearCurrentUser();
      return null;
    }
  }

  function clearCurrentUser() {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }

  // ===== Toast Notifications =====
  function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span class="toast-message">' + escapeHtml(message) + '</span>';
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all .3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ===== Performance Engine =====
  function calculatePerformanceScore(farmer) {
    const yields = farmer.yieldHistory;
    const prod = farmer.productionHistory;

    // If no real data at all, return 0 (no data)
    const hasYieldData = yields && yields.length >= 2 && yields.some(function(v) { return v > 0; });
    const hasLivestockData = farmer.livestock && farmer.livestock > 0;
    if (!hasYieldData && !hasLivestockData) return 0;

    let score = 50;
    const len = yields.length;
    const lastYield = yields[len - 1];
    const prevYield = yields[len - 2];

    // Yield trend (+20 / -15)
    if (lastYield > prevYield) score += 20;
    else if (lastYield < prevYield) score -= 15;

    // Production trend (+15 / -10)
    if (prod && prod.length >= 2) {
      if (prod[prod.length - 1] > prod[prod.length - 2]) score += 15;
      else if (prod[prod.length - 1] < prod[prod.length - 2]) score -= 10;
    }

    // 3-month yield trajectory (+10 / -10)
    const recent3 = yields.slice(-3);
    if (recent3.length >= 3 && recent3[2] >= recent3[0]) score += 10;
    else if (recent3.length >= 3) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  function getScoreLevel(score) {
    if (score === 0) return { level: 'no-data', label: 'No Data', color: '#94a3b8', cssClass: 'no-data' };
    if (score >= 70) return { level: 'good', label: 'Performing Well', color: 'var(--success)', cssClass: 'good' };
    if (score >= 40) return { level: 'stable', label: 'Stable', color: 'var(--warning)', cssClass: 'stable' };
    return { level: 'declining', label: 'Declining', color: 'var(--danger)', cssClass: 'declining' };
  }

  // ===== Early Warning System =====
  function detectWarnings(farmer) {
    const warnings = [];
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];
    const prevYield = yields[yields.length - 2];

    // Yield drop percentage
    if (prevYield > 0) {
      const dropPct = ((prevYield - lastYield) / prevYield) * 100;
      if (dropPct >= 20) {
        warnings.push({ type: 'critical', message: 'Yield dropped ' + Math.round(dropPct) + '%', icon: 'trending-down' });
      } else if (dropPct >= 10) {
        warnings.push({ type: 'warning', message: 'Yield declining (' + Math.round(dropPct) + '% drop)', icon: 'trending-down' });
      }
    }

    // No update in 30+ days
    if (farmer.lastUpdated) {
      const daysSince = Math.floor((new Date('2026-03-24') - new Date(farmer.lastUpdated)) / 86400000);
      if (daysSince > 30) {
        warnings.push({ type: 'warning', message: 'No updates in ' + daysSince + ' days', icon: 'clock' });
      }
    }

    // Production decrease
    const prod = farmer.productionHistory;
    if (prod[prod.length - 1] < prod[prod.length - 2]) {
      warnings.push({ type: 'info', message: 'Production decreased', icon: 'arrow-down' });
    }

    // Critical performance
    const score = calculatePerformanceScore(farmer);
    if (score < 30) {
      warnings.push({ type: 'critical', message: 'Critical performance level (' + score + ')', icon: 'alert-triangle' });
    }

    // Livestock decrease
    if (farmer.livestock < 20 && farmer.mainActivity !== 'Crops') {
      warnings.push({ type: 'warning', message: 'Low livestock count (' + farmer.livestock + ')', icon: 'alert-circle' });
    }

    return warnings;
  }

  // ===== Smart Plan Suggestions =====
  function generatePlanSuggestions(farmer) {
    const suggestions = [];
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];
    const score = calculatePerformanceScore(farmer);
    const warnings = detectWarnings(farmer);

    if (lastYield < 2.5 && farmer.mainActivity !== 'Livestock') {
      suggestions.push({ plan: 'Irrigation Upgrade', reason: 'Low crop yield in dry region' });
    }
    if (lastYield < 3.0 && farmer.mainActivity === 'Crops') {
      suggestions.push({ plan: 'Soil Testing & Analysis', reason: 'Below-average yield' });
    }
    if (score < 40) {
      suggestions.push({ plan: 'Comprehensive Support Package', reason: 'Critical performance score' });
    }
    if (farmer.livestock < 30 && farmer.mainActivity !== 'Crops') {
      suggestions.push({ plan: 'Livestock Recovery Program', reason: 'Low livestock count' });
    }
    if (farmer.farmerType === 'Subsistence') {
      suggestions.push({ plan: 'Training Program', reason: 'Skill development for subsistence farmer' });
    }
    if (score < 60) {
      suggestions.push({ plan: 'Subsidy Application', reason: 'Below-target performance' });
    }
    if (farmer.mainActivity === 'Crops' && lastYield < 3.5) {
      suggestions.push({ plan: 'Seed Quality Assessment', reason: 'Yield below regional average' });
    }
    if (warnings.some(w => w.type === 'critical')) {
      suggestions.push({ plan: 'Emergency Intervention', reason: 'Critical warnings detected' });
    }

    return suggestions;
  }

  // ===== Notifications Generator =====
  function generateNotifications(farmers) {
    farmers = farmers || [];
    const notifications = [];
    farmers.forEach(f => {
      const score = calculatePerformanceScore(f);
      const level = getScoreLevel(score);
      const warnings = detectWarnings(f);

      warnings.forEach(w => {
        notifications.push({
          id: 'n-' + f.id + '-' + w.icon,
          farmerId: f.id,
          farmerName: f.name,
          type: w.type,
          message: w.message,
          icon: w.icon,
          time: f.lastUpdated || '2026-03-24'
        });
      });

      if (level.level === 'declining') {
        notifications.push({
          id: 'n-' + f.id + '-score',
          farmerId: f.id,
          farmerName: f.name,
          type: 'critical',
          message: 'Performance score: ' + score + ' — needs attention',
          icon: 'alert-circle',
          time: f.lastUpdated || '2026-03-24'
        });
      }
    });

    const severity = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => (severity[a.type] || 2) - (severity[b.type] || 2));
    return notifications;
  }

  function getFarmersNeedingAttention(farmers) {
    farmers = farmers || [];
    return farmers.filter(f => {
      const score = calculatePerformanceScore(f);
      return score < 50 || detectWarnings(f).some(w => w.type === 'critical' || w.type === 'warning');
    });
  }

  // ===== Livestock Growth Rate =====
  function calculateLivestockGrowthRate(farmer) {
    const records = farmer.livestockRecords || [];
    if (records.length === 0) return { rate: 0, totalBorn: 0, totalLost: 0, netChange: 0 };
    let totalBorn = 0, totalSold = 0, totalConsumed = 0, totalAnimals = 0;
    records.forEach(r => {
      totalBorn += r.born + (r.twins * 2) + (r.triplets * 3);
      totalSold += r.sold;
      totalConsumed += r.consumed;
      totalAnimals += r.total;
    });
    const totalLost = totalSold + totalConsumed;
    const netChange = totalBorn - totalLost;
    const rate = totalAnimals > 0 ? ((netChange / totalAnimals) * 100) : 0;
    return { rate: Math.round(rate * 10) / 10, totalBorn, totalLost, netChange, totalAnimals };
  }

  // ===== Crop Productivity =====
  function calculateCropProductivity(farmer) {
    const records = farmer.cropRecords || [];
    if (records.length === 0) return { avgYieldPerHa: 0, totalArea: 0, totalYield: 0, crops: [] };
    let totalArea = 0, totalYield = 0;
    const crops = records.map(c => {
      const yieldPerHa = c.areaPlanted > 0 ? Math.round((c.yieldTons / c.areaPlanted) * 10) / 10 : 0;
      totalArea += c.areaPlanted;
      totalYield += c.yieldTons;
      return { name: c.cropType, area: c.areaPlanted, yield: c.yieldTons, yieldPerHa };
    });
    const avgYieldPerHa = totalArea > 0 ? Math.round((totalYield / totalArea) * 10) / 10 : 0;
    return { avgYieldPerHa, totalArea, totalYield, crops };
  }

  // ===== Risk Score =====
  function calculateRiskScore(farmer) {
    let risk = 0;
    const reasons = [];

    // Disease factor
    const records = farmer.livestockRecords || [];
    const totalDiseases = records.reduce((sum, r) => sum + r.diseases.length, 0);
    if (totalDiseases >= 3) { risk += 25; reasons.push('Multiple disease outbreaks (' + totalDiseases + ')'); }
    else if (totalDiseases >= 1) { risk += 12; reasons.push('Disease detected (' + totalDiseases + ' type' + (totalDiseases > 1 ? 's' : '') + ')'); }

    // Livestock deaths / losses
    const growth = calculateLivestockGrowthRate(farmer);
    if (growth.netChange < 0) { risk += 15; reasons.push('Livestock numbers declining'); }

    // Yield decline
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];
    const avg3 = (yields[yields.length - 1] + yields[yields.length - 2] + yields[yields.length - 3]) / 3;
    const avg6 = yields.slice(-6).reduce((a, b) => a + b, 0) / 6;
    if (lastYield < avg6 * 0.8) { risk += 20; reasons.push('Yield significantly below 6-month average'); }
    else if (lastYield < avg6 * 0.9) { risk += 10; reasons.push('Yield below 6-month average'); }

    // Drought risk from weather
    const weather = farmer.weatherData || {};
    if (weather.droughtRisk === 'Very High') { risk += 20; reasons.push('Very high drought risk'); }
    else if (weather.droughtRisk === 'High') { risk += 15; reasons.push('High drought risk'); }
    else if (weather.droughtRisk === 'Moderate') { risk += 8; reasons.push('Moderate drought risk'); }

    // No irrigation in dry area
    const soil = farmer.soilData || {};
    if (!soil.irrigation && (weather.droughtRisk === 'High' || weather.droughtRisk === 'Very High')) {
      risk += 10; reasons.push('No irrigation in drought-prone area');
    }

    // Stale dosing dates
    records.forEach(r => {
      if (r.lastDosed) {
        const daysSince = Math.floor((new Date('2026-03-24') - new Date(r.lastDosed)) / 86400000);
        if (daysSince > 90) { risk += 5; reasons.push(r.animalType + ' not dosed in ' + daysSince + ' days'); }
      }
    });

    // Performance score factor
    const score = calculatePerformanceScore(farmer);
    if (score < 30) { risk += 15; reasons.push('Critical performance score (' + score + ')'); }
    else if (score < 50) { risk += 8; reasons.push('Low performance score (' + score + ')'); }

    return { score: Math.min(100, risk), level: risk >= 60 ? 'Critical' : risk >= 40 ? 'High' : risk >= 20 ? 'Medium' : 'Low', reasons };
  }

  // ===== System Insights Generator =====
  function generateSystemInsights(farmer) {
    const insights = [];
    const escape = escapeHtml;
    const growth = calculateLivestockGrowthRate(farmer);
    const cropProd = calculateCropProductivity(farmer);
    const risk = calculateRiskScore(farmer);
    const weather = farmer.weatherData || {};
    const soil = farmer.soilData || {};
    const score = calculatePerformanceScore(farmer);
    const yields = farmer.yieldHistory;
    const lastYield = yields[yields.length - 1];

    // Livestock insights
    if (growth.totalAnimals > 0) {
      if (growth.rate > 5) {
        insights.push({ type: 'success', icon: 'trending-up', text: 'Livestock herd growing at ' + growth.rate + '%. Good breeding performance.' });
      } else if (growth.rate < -5) {
        insights.push({ type: 'danger', icon: 'trending-down', text: 'Livestock herd declining at ' + growth.rate + '%. Review animal health and feed quality.' });
      }
    }

    // Disease insights
    const records = farmer.livestockRecords || [];
    const diseasedAnimals = records.filter(r => r.diseases.length > 0);
    if (diseasedAnimals.length > 0) {
      const diseaseNames = [...new Set(diseasedAnimals.flatMap(r => r.diseases))];
      insights.push({ type: 'warning', icon: 'shield-alert', text: 'Active diseases: ' + diseaseNames.join(', ') + '. Ensure treatment protocols are followed.' });
    }

    // Crop insights
    if (cropProd.crops.length > 0) {
      const bestCrop = cropProd.crops.reduce((a, b) => a.yieldPerHa > b.yieldPerHa ? a : b);
      insights.push({ type: 'info', icon: 'sprout', text: 'Best performing crop: ' + bestCrop.name + ' at ' + bestCrop.yieldPerHa + ' t/ha.' });
      if (cropProd.avgYieldPerHa < 2.5) {
        insights.push({ type: 'warning', icon: 'alert-triangle', text: 'Overall crop productivity is below average (' + cropProd.avgYieldPerHa + ' t/ha). Consider soil testing.' });
      }
    }

    // Weather insights
    if (weather.droughtRisk === 'Very High' || weather.droughtRisk === 'High') {
      insights.push({ type: 'danger', icon: 'cloud-off', text: 'Drought risk is ' + weather.droughtRisk + '. Rainfall only ' + weather.rainfall + 'mm this season.' });
      if (!soil.irrigation) {
        insights.push({ type: 'danger', icon: 'droplets', text: 'No irrigation system detected. Recommend installing water harvesting or drip irrigation.' });
      }
    }

    // Performance trajectory
    if (score >= 80) {
      insights.push({ type: 'success', icon: 'award', text: 'Excellent performance score (' + score + '). This farmer could mentor others in the district.' });
    } else if (score < 40) {
      insights.push({ type: 'danger', icon: 'alert-circle', text: 'Critical performance (' + score + '). Recommend comprehensive support package and regular follow-ups.' });
    }

    // Dosing reminder
    records.forEach(r => {
      if (r.lastDosed) {
        const daysSince = Math.floor((new Date('2026-03-24') - new Date(r.lastDosed)) / 86400000);
        if (daysSince > 60) {
          insights.push({ type: 'warning', icon: 'syringe', text: r.animalType + ' last dosed ' + daysSince + ' days ago. Schedule dosing immediately.' });
        }
      }
    });

    return insights;
  }

  // ===== District Summary (Government) =====
  function getDistrictSummary(farmers) {
    farmers = farmers || [];
    const districts = {};
    farmers.forEach(f => {
      const key = f.district;
      if (!districts[key]) {
        districts[key] = { district: key, province: f.province, farmers: [], totalLivestock: 0, totalCrops: 0, totalArea: 0, diseases: [], scores: [], riskScores: [] };
      }
      const d = districts[key];
      d.farmers.push(f);
      d.totalLivestock += (f.livestockRecords || []).reduce((sum, r) => sum + r.total, 0);
      d.totalCrops += (f.cropRecords || []).reduce((sum, r) => sum + r.yieldTons, 0);
      d.totalArea += f.farmSize;
      (f.livestockRecords || []).forEach(r => {
        r.diseases.forEach(dis => { if (!d.diseases.includes(dis)) d.diseases.push(dis); });
      });
      d.scores.push(calculatePerformanceScore(f));
      d.riskScores.push(calculateRiskScore(f).score);
    });

    return Object.values(districts).map(d => {
      const avgScore = Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length);
      const avgRisk = Math.round(d.riskScores.reduce((a, b) => a + b, 0) / d.riskScores.length);
      const declining = d.farmers.filter(f => calculatePerformanceScore(f) < 50).length;
      return {
        ...d,
        avgScore,
        avgRisk,
        farmerCount: d.farmers.length,
        decliningCount: declining
      };
    });
  }

  // ===== Smart Alerts Generator =====
  function generateSmartAlerts(farmers) {
    farmers = farmers || [];
    const alerts = [];
    const districtSummaries = getDistrictSummary(farmers);

    // District-level alerts
    districtSummaries.forEach(d => {
      if (d.diseases.length >= 2) {
        alerts.push({ type: 'critical', icon: 'shield-alert', message: 'Multiple diseases in ' + d.district + ': ' + d.diseases.join(', '), district: d.district });
      }
      if (d.avgRisk >= 50) {
        alerts.push({ type: 'critical', icon: 'alert-triangle', message: 'High average risk score in ' + d.district + ' (' + d.avgRisk + ')', district: d.district });
      }
      if (d.decliningCount > 0) {
        alerts.push({ type: 'warning', icon: 'users', message: d.decliningCount + ' farmer(s) declining in ' + d.district, district: d.district });
      }
    });

    // Individual farmer alerts
    farmers.forEach(f => {
      const risk = calculateRiskScore(f);
      if (risk.score >= 60) {
        alerts.push({ type: 'critical', icon: 'alert-circle', message: f.name + ': Critical risk (' + risk.score + ') — ' + risk.reasons[0], district: f.district });
      }
      const records = f.livestockRecords || [];
      records.forEach(r => {
        if (r.diseases.includes('Anthrax') || r.diseases.includes('Foot-and-Mouth')) {
          alerts.push({ type: 'critical', icon: 'bug', message: 'Reportable disease (' + r.diseases.join(', ') + ') at ' + f.farmName + ', ' + f.district, district: f.district });
        }
      });
    });

    const severity = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => (severity[a.type] || 2) - (severity[b.type] || 2));
    return alerts;
  }

  // ===== Secure API Fetch Utility =====
  // Wraps fetch with auth headers, error handling, and friendly user messages.
  // Never exposes raw errors to the user.
  var API_BASE = window.AGRICORE_API_BASE || '/api';

  function apiFetch(path, options) {
    options = options || {};
    var user = getCurrentUser();
    var isPublicAuthPath = /^\/auth\/(login|signup|forgot-password|reset-password|refresh|check-email|resend-verification|callback)$/.test(path);
    var headers = Object.assign({
      'Content-Type': 'application/json',
    }, options.headers || {});

    if (user && user.token && !isPublicAuthPath) {
      headers['Authorization'] = 'Bearer ' + user.token;
    }

    return fetch(API_BASE + path, Object.assign({}, options, { headers: headers }))
      .then(function (res) {
        if (res.status === 401 && user && user.token && !isPublicAuthPath) {
          clearCurrentUser();
          window.location.href = '/auth/login';
          return { success: false, error: 'Session expired. Please log in again.' };
        }
        return res.json();
      })
      .catch(function () {
        return { success: false, error: 'Network error. Please check your connection.' };
      });
  }

  function apiGet(path) {
    return apiFetch(path, { method: 'GET' });
  }

  function apiPost(path, body) {
    return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  }

  function apiPut(path, body) {
    return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  function apiDelete(path) {
    return apiFetch(path, { method: 'DELETE' });
  }

  function apiPatch(path, body) {
    return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  // ===== UI State Helpers (Loading / Error / Empty) =====
  function showLoading(container) {
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>';
  }

  function showError(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="error-state"><p>' + escapeHtml(message || 'Something went wrong. Please try again.') + '</p></div>';
  }

  function showEmpty(container, message) {
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><p>' + escapeHtml(message || 'No data available.') + '</p></div>';
  }

  // ===== Public API =====
  return {
    API_URL: API_BASE,
    mockFarmers,
    mockPlans,
    months,
    isValidEmail,
    escapeHtml,
    formatCurrency,
    getInitials,
    getPerformanceStatus,
    setCurrentUser,
    getCurrentUser,
    clearCurrentUser,
    showToast,
    apiGet,
    apiPost,
    apiPut,
    apiPatch,
    apiDelete,
    showLoading,
    showError,
    showEmpty,
    calculatePerformanceScore,
    getScoreLevel,
    detectWarnings,
    generatePlanSuggestions,
    generateNotifications,
    getFarmersNeedingAttention,
    calculateLivestockGrowthRate,
    calculateCropProductivity,
    calculateRiskScore,
    generateSystemInsights,
    getDistrictSummary,
    generateSmartAlerts
  };
})();
