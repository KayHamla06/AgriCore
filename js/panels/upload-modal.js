/* ============================================
   AgriCore — Upload Data Modal
   ============================================ */
(function() {
  'use strict';
  window.AgriModals = window.AgriModals || [];

  window.AgriModals.push({
    key: 'uploadData',
    modalId: 'uploadDataModal',

    getHTML: function() {
      return `
        <div class="modal modal-lg">
          <div class="modal-header">
            <h3 class="modal-title"><i data-lucide="clipboard-list"></i> Submit Farm Data</h3>
            <button class="modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-tabs" id="formTabs">
              <button class="form-tab active" data-tab="tab-soil"><i data-lucide="mountain"></i> Soil &amp; Farm</button>
              <button class="form-tab" data-tab="tab-livestock"><i data-lucide="beef"></i> Livestock</button>
              <button class="form-tab" data-tab="tab-crops"><i data-lucide="wheat"></i> Crops</button>
              <button class="form-tab" data-tab="tab-weather"><i data-lucide="cloud-sun"></i> Weather</button>
            </div>

            <!-- TAB 1: Soil & Farm Info -->
            <div class="form-tab-content active" id="tab-soil">
              <h4 class="form-section-title"><i data-lucide="mountain"></i> Soil &amp; Farm Information</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Period Start Date</label>
                  <input type="date" class="form-input" id="uploadPeriodStart">
                </div>
                <div class="form-group">
                  <label class="form-label">Period End Date</label>
                  <input type="date" class="form-input" id="uploadPeriodEnd">
                </div>
              </div>
                <div class="form-group">
                  <label class="form-label">Soil Type</label>
                  <select class="form-select" id="uploadSoilType">
                    <option value="">Select soil type</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Alluvial">Alluvial</option>
                    <option value="Silty">Silty</option>
                    <option value="Peat">Peat</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Irrigation</label>
                  <select class="form-select" id="uploadIrrigation">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Irrigation Type</label>
                  <select class="form-select" id="uploadIrrigationType" disabled>
                    <option value="None">None</option>
                    <option value="Drip">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Centre Pivot">Centre Pivot</option>
                    <option value="Flood">Flood</option>
                    <option value="Furrow">Furrow</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Water Source</label>
                  <select class="form-select" id="uploadWaterSource">
                    <option value="">Select source</option>
                    <option value="Rain-fed">Rain-fed</option>
                    <option value="Borehole">Borehole</option>
                    <option value="River">River</option>
                    <option value="Dam">Dam</option>
                    <option value="Municipal">Municipal</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Land Gradient</label>
                  <select class="form-select" id="uploadGradient">
                    <option value="">Select gradient</option>
                    <option value="Flat">Flat</option>
                    <option value="Gently Sloping">Gently Sloping</option>
                    <option value="Hilly">Hilly</option>
                    <option value="Steep">Steep</option>
                    <option value="Rocky">Rocky</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Fencing Type</label>
                <select class="form-select" id="uploadFencing">
                  <option value="">Select fencing</option>
                  <option value="None">None</option>
                  <option value="Wire">Wire</option>
                  <option value="Electric">Electric</option>
                  <option value="Partial Wire">Partial Wire</option>
                  <option value="Wood">Wood</option>
                </select>
              </div>
            </div>

            <!-- TAB 2: Dynamic Livestock System -->
            <div class="form-tab-content" id="tab-livestock">
              <div class="form-section-header">
                <h4 class="form-section-title"><i data-lucide="beef"></i> Livestock Records</h4>
                <button class="btn btn-secondary btn-sm" id="addAnimalBtn" type="button"><i data-lucide="plus"></i> Add Animal</button>
              </div>
              <div id="livestockEntries"></div>
              <div class="empty-state" id="noLivestockMsg">
                <i data-lucide="paw-print"></i>
                <p>No livestock entries yet. Click "Add Animal" to begin.</p>
              </div>
            </div>

            <!-- TAB 3: Crops -->
            <div class="form-tab-content" id="tab-crops">
              <div class="form-section-header">
                <h4 class="form-section-title"><i data-lucide="wheat"></i> Crop Records</h4>
                <button class="btn btn-secondary btn-sm" id="addCropBtn" type="button"><i data-lucide="plus"></i> Add Crop</button>
              </div>
              <div id="cropEntries"></div>
              <div class="empty-state" id="noCropMsg">
                <i data-lucide="sprout"></i>
                <p>No crop entries yet. Click "Add Crop" to begin.</p>
              </div>
            </div>

            <!-- TAB 4: Weather (Auto-filled) -->
            <div class="form-tab-content" id="tab-weather">
              <h4 class="form-section-title"><i data-lucide="cloud-sun"></i> Weather Data <span class="auto-badge">Auto-filled</span></h4>
              <p class="form-help-text">Weather data is automatically retrieved for your farm location.</p>
              <div class="weather-display" id="weatherDisplay">
                <div class="weather-card">
                  <div class="weather-icon rain"><i data-lucide="cloud-rain"></i></div>
                  <div class="weather-value" id="weatherRainfall">--</div>
                  <div class="weather-label">Rainfall (mm)</div>
                </div>
                <div class="weather-card">
                  <div class="weather-icon temp"><i data-lucide="thermometer"></i></div>
                  <div class="weather-value" id="weatherTemp">--</div>
                  <div class="weather-label">Avg Temperature</div>
                </div>
                <div class="weather-card">
                  <div class="weather-icon humidity"><i data-lucide="droplets"></i></div>
                  <div class="weather-value" id="weatherHumidity">--</div>
                  <div class="weather-label">Humidity (%)</div>
                </div>
                <div class="weather-card">
                  <div class="weather-icon drought"><i data-lucide="sun"></i></div>
                  <div class="weather-value" id="weatherDrought">--</div>
                  <div class="weather-label">Drought Risk</div>
                </div>
              </div>
              <div class="form-row" style="margin-top:16px;">
                <div class="form-group">
                  <label class="form-label">Last Rainfall Date</label>
                  <input type="text" class="form-input" id="weatherLastRain" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Season</label>
                  <input type="text" class="form-input" id="weatherSeason" readonly>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost modal-cancel">Cancel</button>
            <button class="btn btn-secondary" id="prevTabBtn" style="display:none;"><i data-lucide="arrow-left"></i> Previous</button>
            <button class="btn btn-primary" id="nextTabBtn">Next <i data-lucide="arrow-right"></i></button>
            <button class="btn btn-primary" id="submitDataBtn" style="display:none;"><i data-lucide="check"></i> Submit All Data</button>
          </div>
        </div>
      `;
    },

    init: function(ctx) {
      var user = ctx.user;

      // === Default date range: first and last day of current month ===
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth(); // 0-based
      var firstDay = new Date(y, m, 1).toISOString().split('T')[0];
      var lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
      var periodStart = document.getElementById('uploadPeriodStart');
      var periodEnd = document.getElementById('uploadPeriodEnd');
      if (periodStart) { periodStart.value = firstDay; periodStart.max = new Date().toISOString().split('T')[0]; }
      if (periodEnd) { periodEnd.value = lastDay; periodEnd.max = new Date().toISOString().split('T')[0]; }

      // === Tab Navigation ===
      var formTabs = document.querySelectorAll('.form-tab');
      var formTabContents = document.querySelectorAll('.form-tab-content');
      var nextTabBtn = document.getElementById('nextTabBtn');
      var prevTabBtn = document.getElementById('prevTabBtn');
      var submitDataBtn = document.getElementById('submitDataBtn');
      var tabOrder = ['tab-soil', 'tab-livestock', 'tab-crops', 'tab-weather'];
      var currentTabIndex = 0;

      function switchFormTab(tabId) {
        formTabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tabId); });
        formTabContents.forEach(function(c) { c.classList.toggle('active', c.id === tabId); });
        currentTabIndex = tabOrder.indexOf(tabId);
        if (prevTabBtn) prevTabBtn.style.display = currentTabIndex > 0 ? '' : 'none';
        if (nextTabBtn) nextTabBtn.style.display = currentTabIndex < tabOrder.length - 1 ? '' : 'none';
        if (submitDataBtn) submitDataBtn.style.display = currentTabIndex === tabOrder.length - 1 ? '' : 'none';
        if (tabId === 'tab-weather') fillWeatherData();
        lucide.createIcons();
      }

      formTabs.forEach(function(tab) {
        tab.addEventListener('click', function() { switchFormTab(tab.dataset.tab); });
      });
      if (nextTabBtn) nextTabBtn.addEventListener('click', function() {
        if (currentTabIndex < tabOrder.length - 1) switchFormTab(tabOrder[currentTabIndex + 1]);
      });
      if (prevTabBtn) prevTabBtn.addEventListener('click', function() {
        if (currentTabIndex > 0) switchFormTab(tabOrder[currentTabIndex - 1]);
      });

      // Irrigation toggle
      var irrigationSelect = document.getElementById('uploadIrrigation');
      var irrigationTypeSelect = document.getElementById('uploadIrrigationType');
      if (irrigationSelect && irrigationTypeSelect) {
        irrigationSelect.addEventListener('change', function() {
          irrigationTypeSelect.disabled = irrigationSelect.value !== 'yes';
          if (irrigationSelect.value !== 'yes') irrigationTypeSelect.value = 'None';
        });
      }

      // Submit — POST data to backend
      if (submitDataBtn) {
        submitDataBtn.addEventListener('click', function() {
          submitDataBtn.disabled = true;
          submitDataBtn.innerHTML = '<i data-lucide="loader"></i> Submitting...';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          var API_BASE = window.AGRICORE_API_BASE || '/api';
          var token = user.token || '';
          var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

          // 1. Resolve farmer profile ID
          fetch(API_BASE + '/farmers/me', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function(r) { return r.json(); })
            .then(function(profileRes) {
              if (!profileRes.success || !profileRes.data || !profileRes.data.id) {
                throw new Error('Could not resolve farmer profile');
              }
              var farmerId = profileRes.data.id;

              // 2. Collect livestock entries
              var livestockEntries = [];
              var lsNodes = document.querySelectorAll('.livestock-entry');
              lsNodes.forEach(function(entry) {
                var animalType = entry.querySelector('.ls-animal-type');
                if (animalType && animalType.value) {
                  var diseaseSelect = entry.querySelector('.ls-disease-select');
                  var diseases = diseaseSelect && diseaseSelect.value ? [diseaseSelect.value] : [];
                  livestockEntries.push({
                    animal_type: animalType.value,
                    total: parseInt(entry.querySelector('.ls-total').value) || 0,
                    born: parseInt(entry.querySelector('.ls-born').value) || 0,
                    twins: parseInt(entry.querySelector('.ls-twins').value) || 0,
                    triplets: parseInt(entry.querySelector('.ls-triplets').value) || 0,
                    sold: parseInt(entry.querySelector('.ls-sold').value) || 0,
                    consumed: parseInt(entry.querySelector('.ls-consumed').value) || 0,
                    young: parseInt(entry.querySelector('.ls-young').value) || 0,
                    last_dosed: entry.querySelector('.ls-dosed').value || null,
                    diseases: diseases,
                    treatment: entry.querySelector('.ls-treatment').value || ''
                  });
                }
              });

              // 3. Collect crop entries
              var cropEntries = [];
              var crNodes = document.querySelectorAll('.crop-entry');
              crNodes.forEach(function(entry) {
                var cropType = entry.querySelector('.cr-type');
                if (cropType && cropType.value) {
                  var plantingDate = entry.querySelector('.cr-planting').value || '';
                  var harvestDate = entry.querySelector('.cr-harvest').value || '';
                  var season = '';
                  if (plantingDate) {
                    var m = parseInt(plantingDate.split('-')[1]);
                    season = m >= 10 || m <= 3 ? 'Summer' : m >= 4 && m <= 6 ? 'Autumn' : m >= 7 && m <= 9 ? 'Winter' : '';
                  }
                  cropEntries.push({
                    crop_name: cropType.value,
                    hectares_planted: parseFloat(entry.querySelector('.cr-area').value) || 0,
                    yield_tonnes: parseFloat(entry.querySelector('.cr-yield').value) || 0,
                    season: season,
                    irrigation_type: document.getElementById('uploadIrrigationType').value || 'None'
                  });
                }
              });

              // 4. Collect soil/farm info
              var soilType = document.getElementById('uploadSoilType').value;
              var waterSource = document.getElementById('uploadWaterSource').value;
              var gradient = document.getElementById('uploadGradient').value;
              var fencing = document.getElementById('uploadFencing').value;
              var hasSoilInfo = soilType || waterSource || gradient || fencing;

              // 5. Build period dates from date inputs
              var startDate = document.getElementById('uploadPeriodStart').value;
              var endDate = document.getElementById('uploadPeriodEnd').value;
              if (!startDate || !endDate) {
                throw new Error('Please select both a start and end date for the data period.');
              }
              if (endDate < startDate) {
                throw new Error('End date must be on or after start date.');
              }

              // 6. POST all data in parallel
              var promises = [];

              livestockEntries.forEach(function(ls) {
                promises.push(
                  fetch(API_BASE + '/farmers/' + farmerId + '/livestock', {
                    method: 'POST', headers: headers, body: JSON.stringify(ls)
                  }).then(function(r) { return r.json(); })
                );
              });

              cropEntries.forEach(function(cr) {
                promises.push(
                  fetch(API_BASE + '/farmers/' + farmerId + '/crops', {
                    method: 'POST', headers: headers, body: JSON.stringify(cr)
                  }).then(function(r) { return r.json(); })
                );
              });

              // Soil data
              if (hasSoilInfo) {
                promises.push(
                  fetch(API_BASE + '/farmers/' + farmerId + '/soil', {
                    method: 'POST', headers: headers,
                    body: JSON.stringify({ soil_type: soilType, water_source: waterSource, gradient: gradient, fencing: fencing })
                  }).then(function(r) { return r.json(); })
                );
              }

              // Farm record for period tracking + analytics
              var totalYield = cropEntries.reduce(function(s, c) { return s + c.yield_tonnes; }, 0);
              var totalLivestock = livestockEntries.reduce(function(s, l) { return s + l.total; }, 0);

              promises.push(
                fetch(API_BASE + '/farmers/me/records', {
                  method: 'POST', headers: headers,
                  body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                    crop_yield: totalYield,
                    livestock_count: totalLivestock,
                    has_crop_data: cropEntries.length > 0,
                    has_livestock_data: livestockEntries.length > 0
                  })
                }).then(function(r) { return r.json(); })
              );

              return Promise.all(promises);
            })
            .then(function(results) {
              var anyFailed = results.some(function(r) { return r && r.success === false; });
              if (anyFailed) {
                AgriCore.showToast('Some data could not be saved. Please check and retry.', 'warning');
              } else {
                AgriCore.showToast('Farm data submitted successfully!', 'success');
              }
              // Notify dashboard to reload data
              window.dispatchEvent(new CustomEvent('agricore:data-uploaded'));
              ctx.closeModal('uploadDataModal');
            })
            .catch(function(err) {
              AgriCore.showToast('Failed to submit data: ' + (err.message || 'Unknown error'), 'error');
            })
            .finally(function() {
              submitDataBtn.disabled = false;
              submitDataBtn.innerHTML = '<i data-lucide="check"></i> Submit All Data';
              if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        });
      }

      // === Dynamic Livestock Entries ===
      var livestockEntryCount = 0;
      var livestockContainer = document.getElementById('livestockEntries');
      var noLivestockMsg = document.getElementById('noLivestockMsg');
      var addAnimalBtn = document.getElementById('addAnimalBtn');

      var animalTypes = ['Cattle', 'Goats', 'Sheep', 'Pigs', 'Chickens', 'Ducks', 'Horses', 'Donkeys', 'Other'];
      var diseaseOptions = ['Tick Fever', 'Heartwater', 'Foot-and-Mouth', 'Lumpy Skin Disease', 'Blue Tongue', 'Newcastle Disease', 'Anthrax', 'Brucellosis', 'Blackleg', 'Rift Valley Fever', 'Other'];

      function addLivestockEntry() {
        livestockEntryCount++;
        var id = livestockEntryCount;
        if (noLivestockMsg) noLivestockMsg.style.display = 'none';

        var entry = document.createElement('div');
        entry.className = 'livestock-entry';
        entry.id = 'livestock-entry-' + id;
        entry.innerHTML =
          '<div class="livestock-entry-header"><span class="entry-label"><i data-lucide="beef"></i> Animal Entry #' + id + '</span>' +
          '<button class="remove-entry-btn" type="button" data-entry="' + id + '"><i data-lucide="x"></i></button></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Animal Type</label>' +
          '<select class="form-select ls-animal-type"><option value="">Select type</option>' +
          animalTypes.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
          '</select></div><div class="form-group"><label class="form-label">Total Count</label>' +
          '<input type="number" class="form-input ls-total" min="0" placeholder="0"></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Born</label>' +
          '<input type="number" class="form-input ls-born" min="0" placeholder="0"></div>' +
          '<div class="form-group"><label class="form-label">Twins</label>' +
          '<input type="number" class="form-input ls-twins" min="0" placeholder="0"></div>' +
          '<div class="form-group"><label class="form-label">Triplets</label>' +
          '<input type="number" class="form-input ls-triplets" min="0" placeholder="0"></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Sold</label>' +
          '<input type="number" class="form-input ls-sold" min="0" placeholder="0"></div>' +
          '<div class="form-group"><label class="form-label">Consumed</label>' +
          '<input type="number" class="form-input ls-consumed" min="0" placeholder="0"></div>' +
          '<div class="form-group"><label class="form-label">Young Animals</label>' +
          '<input type="number" class="form-input ls-young" min="0" placeholder="0"></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Last Dosed Date</label>' +
          '<input type="date" class="form-input ls-dosed"></div>' +
          '<div class="form-group"><label class="form-label">Disease</label>' +
          '<select class="form-select ls-disease-select"><option value="">No disease</option>' +
          diseaseOptions.map(function(d) { return '<option value="' + d + '">' + d + '</option>'; }).join('') +
          '</select></div></div>' +
          '<div class="form-group"><label class="form-label">Treatment Notes</label>' +
          '<input type="text" class="form-input ls-treatment" placeholder="e.g. Dip treatment applied"></div>';

        if (livestockContainer) livestockContainer.appendChild(entry);
        entry.querySelector('.remove-entry-btn').addEventListener('click', function() {
          entry.remove();
          if (livestockContainer && livestockContainer.children.length === 0 && noLivestockMsg) noLivestockMsg.style.display = '';
        });
        lucide.createIcons();
      }

      if (addAnimalBtn) addAnimalBtn.addEventListener('click', addLivestockEntry);

      // === Dynamic Crop Entries ===
      var cropEntryCount = 0;
      var cropContainer = document.getElementById('cropEntries');
      var noCropMsg = document.getElementById('noCropMsg');
      var addCropBtn = document.getElementById('addCropBtn');
      var cropTypes = ['Maize', 'Wheat', 'Sunflower', 'Soya Beans', 'Beans', 'Sugarcane', 'Groundnuts', 'Sweet Potato', 'Cabbage', 'Tomatoes', 'Grapes', 'Citrus', 'Cotton', 'Sorghum', 'Other'];

      function addCropEntry() {
        cropEntryCount++;
        var id = cropEntryCount;
        if (noCropMsg) noCropMsg.style.display = 'none';

        var entry = document.createElement('div');
        entry.className = 'crop-entry';
        entry.id = 'crop-entry-' + id;
        entry.innerHTML =
          '<div class="crop-entry-header"><span class="entry-label"><i data-lucide="wheat"></i> Crop Entry #' + id + '</span>' +
          '<button class="remove-entry-btn" type="button"><i data-lucide="x"></i></button></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Crop Type</label>' +
          '<select class="form-select cr-type"><option value="">Select crop</option>' +
          cropTypes.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('') +
          '</select></div><div class="form-group"><label class="form-label">Area Planted (ha)</label>' +
          '<input type="number" class="form-input cr-area" min="0" step="0.1" placeholder="0"></div></div>' +
          '<div class="form-row"><div class="form-group"><label class="form-label">Yield (tons)</label>' +
          '<input type="number" class="form-input cr-yield" min="0" step="0.1" placeholder="0"></div>' +
          '<div class="form-group"><label class="form-label">Planting Date</label>' +
          '<input type="date" class="form-input cr-planting"></div>' +
          '<div class="form-group"><label class="form-label">Harvest Date</label>' +
          '<input type="date" class="form-input cr-harvest"></div></div>';

        if (cropContainer) cropContainer.appendChild(entry);
        entry.querySelector('.remove-entry-btn').addEventListener('click', function() {
          entry.remove();
          if (cropContainer && cropContainer.children.length === 0 && noCropMsg) noCropMsg.style.display = '';
        });
        lucide.createIcons();
      }

      if (addCropBtn) addCropBtn.addEventListener('click', addCropEntry);

      // === Weather Auto-fill from real API ===
      function fillWeatherData() {
        var rainfall = document.getElementById('weatherRainfall');
        var temp = document.getElementById('weatherTemp');
        var humidity = document.getElementById('weatherHumidity');
        var drought = document.getElementById('weatherDrought');
        var lastRain = document.getElementById('weatherLastRain');
        var season = document.getElementById('weatherSeason');

        // Use period start/end dates from the soil tab
        var periodStartEl = document.getElementById('uploadPeriodStart');
        var periodEndEl = document.getElementById('uploadPeriodEnd');
        var startDate = periodStartEl ? periodStartEl.value : '';
        var endDate = periodEndEl ? periodEndEl.value : '';

        // Fallback to last 7 days if no dates set
        if (!startDate || !endDate) {
          var today = new Date();
          endDate = today.toISOString().split('T')[0];
          var weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
        }

        // Determine season from the period start month
        var periodMonth = parseInt(startDate.split('-')[1]) || (new Date().getMonth() + 1);
        var seasonName = (periodMonth >= 10 || periodMonth <= 3) ? 'Summer' :
                         (periodMonth >= 4 && periodMonth <= 6) ? 'Autumn' : 'Winter';
        if (season) season.value = seasonName;

        // Fetch farmer profile for coordinates
        var API_BASE = window.AGRICORE_API_BASE || '/api';
        var token = user.token || '';
        fetch(API_BASE + '/farmers/me', { headers: { 'Authorization': 'Bearer ' + token } })
          .then(function(r) { return r.json(); })
          .then(function(res) {
            if (!res.success || !res.data) return;
            var profile = res.data;
            if (!profile.latitude || !profile.longitude) {
              if (rainfall) rainfall.textContent = '--';
              if (temp) temp.textContent = '--';
              if (humidity) humidity.textContent = '--';
              if (drought) drought.textContent = 'N/A';
              if (lastRain) lastRain.value = 'Set farm location in Settings';
              return;
            }
            var lat = parseFloat(profile.latitude);
            var lng = parseFloat(profile.longitude);
            var url = 'https://archive-api.open-meteo.com/v1/archive?latitude=' + lat +
              '&longitude=' + lng +
              '&start_date=' + startDate + '&end_date=' + endDate +
              '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum' +
              '&hourly=relative_humidity_2m&timezone=auto';
            return fetch(url).then(function(r) { return r.json(); });
          })
          .then(function(data) {
            if (!data || !data.daily) return;
            var d = data.daily;
            var totalRain = d.precipitation_sum ? d.precipitation_sum.reduce(function(s, v) { return s + (v || 0); }, 0) : 0;
            var maxTemps = d.temperature_2m_max || [];
            var avgTemp = maxTemps.length > 0 ? (maxTemps.reduce(function(s, v) { return s + v; }, 0) / maxTemps.length).toFixed(1) : '--';
            var humArr = data.hourly && data.hourly.relative_humidity_2m ? data.hourly.relative_humidity_2m : [];
            var avgHum = humArr.length > 0 ? Math.round(humArr.reduce(function(s, v) { return s + v; }, 0) / humArr.length) : '--';

            if (rainfall) rainfall.textContent = totalRain.toFixed(1);
            if (temp) temp.textContent = avgTemp + '\u00B0C';
            if (humidity) humidity.textContent = avgHum + '%';

            // Simple drought risk based on rainfall
            var droughtRisk = totalRain < 5 ? 'High' : totalRain < 15 ? 'Moderate' : 'Low';
            if (drought) {
              drought.textContent = droughtRisk;
              drought.style.color = droughtRisk === 'High' ? 'var(--danger)' : droughtRisk === 'Moderate' ? 'var(--warning)' : 'var(--success)';
            }

            // Find last rain date
            if (lastRain && d.precipitation_sum) {
              var lastRainDate = '--';
              for (var i = d.precipitation_sum.length - 1; i >= 0; i--) {
                if (d.precipitation_sum[i] > 0 && d.time && d.time[i]) {
                  lastRainDate = d.time[i];
                  break;
                }
              }
              lastRain.value = lastRainDate;
            }
          })
          .catch(function() {
            if (rainfall) rainfall.textContent = '--';
            if (temp) temp.textContent = '--';
            if (humidity) humidity.textContent = '--';
            if (drought) drought.textContent = 'N/A';
          });
      }
    }
  });
})();
