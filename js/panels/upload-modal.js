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
                  <label class="form-label">Data Period</label>
                  <select class="form-select" id="uploadPeriod">
                    <option value="2026-03">March 2026</option>
                    <option value="2026-02">February 2026</option>
                    <option value="2026-01">January 2026</option>
                    <option value="2025-12">December 2025</option>
                  </select>
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

      // Submit
      if (submitDataBtn) {
        submitDataBtn.addEventListener('click', function() {
          AgriCore.showToast('Farm data submitted successfully!', 'success');
          ctx.closeModal('uploadDataModal');
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

      // === Weather Auto-fill ===
      function fillWeatherData() {
        var farmerData = AgriCore.mockFarmers.find(function(f) { return f.id === user.id; }) || AgriCore.mockFarmers[0];
        var weather = farmerData.weatherData || {};

        var rainfall = document.getElementById('weatherRainfall');
        var temp = document.getElementById('weatherTemp');
        var humidity = document.getElementById('weatherHumidity');
        var drought = document.getElementById('weatherDrought');
        var lastRain = document.getElementById('weatherLastRain');
        var season = document.getElementById('weatherSeason');

        if (rainfall) rainfall.textContent = weather.rainfall || '--';
        if (temp) temp.textContent = (weather.avgTemp || '--') + '\u00B0C';
        if (humidity) humidity.textContent = (weather.humidity || '--') + '%';
        if (drought) {
          drought.textContent = weather.droughtRisk || '--';
          if (weather.droughtRisk === 'Very High' || weather.droughtRisk === 'High') {
            drought.style.color = 'var(--danger)';
          } else if (weather.droughtRisk === 'Moderate') {
            drought.style.color = 'var(--warning)';
          } else {
            drought.style.color = 'var(--success)';
          }
        }
        if (lastRain) lastRain.value = weather.lastRain || '--';
        if (season) season.value = weather.season || '--';
      }
    }
  });
})();
