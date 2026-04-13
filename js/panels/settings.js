/* ============================================
   AgriCore — Settings Panel
   Profile image, address, account settings
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  var SA_PROVINCES = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'
  ];

  window.AgriPanels.push({
    key: 'settings',
    panelId: 'panel-settings',

    getHTML: function() {
      var provinceOptions = SA_PROVINCES.map(function(p) {
        return '<option value="' + p + '">' + p + '</option>';
      }).join('');

      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Settings</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Manage your account, profile picture, and address.</p>
          </div>
        </div>

        <div class="settings-grid">

          <!-- Profile Picture -->
          <div class="settings-card">
            <h3 class="settings-card-title">Profile Picture</h3>
            <p class="settings-card-desc">Upload a JPG or PNG image (max 5 MB).</p>
            <div class="profile-pic-section">
              <div class="profile-pic-preview" id="profilePicPreview">
                <span class="profile-pic-initials" id="profilePicInitials">--</span>
                <img class="profile-pic-img" id="profilePicImg" style="display:none;" alt="Profile">
              </div>
              <div class="profile-pic-actions">
                <label class="btn btn-secondary btn-sm" for="profilePicInput" style="cursor:pointer;">
                  <i data-lucide="upload" style="width:14px;height:14px;"></i> Choose Image
                </label>
                <input type="file" id="profilePicInput" accept="image/jpeg,image/png" style="display:none;">
                <button class="btn btn-primary btn-sm" id="uploadProfilePicBtn" disabled>Upload</button>
                <span class="profile-pic-status" id="profilePicStatus"></span>
              </div>
            </div>
          </div>

          <!-- Profile Information -->
          <div class="settings-card">
            <h3 class="settings-card-title">Profile Information</h3>
            <p class="settings-card-desc">Update your personal details.</p>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="settingsName" placeholder="Your name">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="settingsEmail" placeholder="Your email" disabled>
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="tel" class="form-input" id="settingsPhone" placeholder="Your phone number">
            </div>
            <button class="btn btn-primary btn-sm" id="saveSettingsBtn">Save Changes</button>
          </div>

          <!-- Home Address -->
          <div class="settings-card" style="grid-column:1/-1;">
            <h3 class="settings-card-title">Home Address</h3>
            <p class="settings-card-desc">Your structured home address for reports and records.</p>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Address Number</label>
                <input type="text" class="form-input" id="settingsAddrNumber" placeholder="e.g. 42">
              </div>
              <div class="form-group">
                <label class="form-label">Street Name</label>
                <input type="text" class="form-input" id="settingsStreet" placeholder="e.g. Main Road">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Suburb</label>
                <input type="text" class="form-input" id="settingsSuburb" placeholder="e.g. Rosebank">
              </div>
              <div class="form-group">
                <label class="form-label">Town / City</label>
                <input type="text" class="form-input" id="settingsTown" placeholder="e.g. Cape Town">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Province</label>
                <select class="form-select" id="settingsProvince">
                  <option value="">Select province</option>
                  ${provinceOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Postal Code</label>
                <input type="text" class="form-input" id="settingsPostalCode" placeholder="e.g. 7700" maxlength="10">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="saveAddressBtn">Save Address</button>
          </div>

          <!-- Farm Location (Map Picker) -->
          <div class="settings-card" style="grid-column:1/-1;">
            <h3 class="settings-card-title">Farm Location</h3>
            <p class="settings-card-desc">Pin your farm on the map for accurate weather and regional data. Click the map to set your location.</p>
            <div id="settingsMapContainer" class="settings-map-container"></div>
            <div class="farm-location-coords">
              <span id="settingsLocationStatus" class="location-status">No location set</span>
              <span id="settingsCoordDisplay" class="coord-display"></span>
            </div>
            <button class="btn btn-primary btn-sm" id="saveLocationBtn" disabled>Save Location</button>
          </div>

          <!-- Notifications -->
          <div class="settings-card">
            <h3 class="settings-card-title">Notifications</h3>
            <p class="settings-card-desc">Choose what you get notified about.</p>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">Performance Updates</div>
                <div class="settings-row-desc">Email notifications for changes</div>
              </div>
              <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">SMS Alerts</div>
                <div class="settings-row-desc">Critical change notifications</div>
              </div>
              <label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-row-label">Weekly Summary</div>
                <div class="settings-row-desc">Weekly report digest</div>
              </div>
              <label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label>
            </div>
          </div>

          <!-- Security -->
          <div class="settings-card">
            <h3 class="settings-card-title">Security</h3>
            <p class="settings-card-desc">Update your password.</p>
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" class="form-input" id="currentPassword" placeholder="Enter current password">
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" class="form-input" id="newPassword" placeholder="New password (min 8 chars)">
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input type="password" class="form-input" id="confirmPassword" placeholder="Confirm new password">
            </div>
            <button class="btn btn-primary btn-sm" id="updatePasswordBtn">Update Password</button>
          </div>

          <!-- Delete Account -->
          <div class="settings-card" style="grid-column:1/-1;border:2px solid var(--danger);border-radius:var(--radius-md);">
            <h3 class="settings-card-title" style="color:var(--danger);">Delete My Account</h3>
            <p class="settings-card-desc">Once your deletion request is approved by an admin, your account and all associated data will be permanently removed.</p>

            <div id="deletionFormArea">
              <div class="form-group">
                <label class="form-label">Why are you leaving?</label>
                <div style="display:flex;flex-direction:column;gap:.5rem;margin-top:.25rem;">
                  <label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;cursor:pointer;">
                    <input type="radio" name="deleteReason" value="Not useful"> Not useful for my needs
                  </label>
                  <label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;cursor:pointer;">
                    <input type="radio" name="deleteReason" value="Found alternative"> Found an alternative platform
                  </label>
                  <label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;cursor:pointer;">
                    <input type="radio" name="deleteReason" value="Too complex"> Platform is too complex
                  </label>
                  <label style="display:flex;align-items:center;gap:.5rem;font-size:.875rem;cursor:pointer;">
                    <input type="radio" name="deleteReason" value="Other"> Other
                  </label>
                </div>
                <input type="text" class="form-input" id="deleteReasonOther" placeholder="Please specify..." style="margin-top:.5rem;display:none;" maxlength="200">
              </div>

              <div class="form-group">
                <label class="form-label">Confirm your password</label>
                <input type="password" class="form-input" id="deleteConfirmPassword" placeholder="Enter your current password" autocomplete="current-password">
              </div>

              <button class="btn btn-sm" id="requestDeletionBtn" style="background:var(--danger);color:white;border:none;">
                <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Request Account Deletion
              </button>
            </div>

            <div id="deletionSuccessArea" style="display:none;">
              <div style="padding:1rem;background:var(--success-light);border-radius:var(--radius-sm);color:var(--success);font-size:.875rem;">
                <strong>Request submitted.</strong> Your deletion request has been sent to the admin. You will be notified once your account is deleted.
              </div>
            </div>
          </div>

        </div>
      `;
    },

    init: function(ctx) {
      var user = ctx.user;

      // --- Profile Info ---
      var settingsName = document.getElementById('settingsName');
      var settingsEmail = document.getElementById('settingsEmail');
      var settingsPhone = document.getElementById('settingsPhone');

      if (settingsName) settingsName.value = user.name || '';
      if (settingsEmail) settingsEmail.value = user.email || '';
      if (settingsPhone) settingsPhone.value = user.phone || '';

      // --- Profile Picture ---
      var profilePicPreview = document.getElementById('profilePicPreview');
      var profilePicInitials = document.getElementById('profilePicInitials');
      var profilePicImg = document.getElementById('profilePicImg');
      var profilePicInput = document.getElementById('profilePicInput');
      var uploadBtn = document.getElementById('uploadProfilePicBtn');
      var profilePicStatus = document.getElementById('profilePicStatus');
      var selectedFile = null;

      if (profilePicInitials) {
        profilePicInitials.textContent = AgriCore.getInitials(user.name);
      }

      // Show existing profile image if available
      if (user.profile_image_url && profilePicImg && profilePicInitials) {
        profilePicImg.src = user.profile_image_url;
        profilePicImg.style.display = 'block';
        profilePicInitials.style.display = 'none';
      }

      if (profilePicInput) {
        profilePicInput.addEventListener('change', function(e) {
          var file = e.target.files[0];
          if (!file) return;

          // Validate client-side
          if (!['image/jpeg', 'image/png'].includes(file.type)) {
            AgriCore.showToast('Only JPG and PNG images are allowed.', 'error');
            profilePicInput.value = '';
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            AgriCore.showToast('Image must be under 5 MB.', 'error');
            profilePicInput.value = '';
            return;
          }

          selectedFile = file;
          if (uploadBtn) uploadBtn.disabled = false;

          // Preview
          var reader = new FileReader();
          reader.onload = function(ev) {
            if (profilePicImg) {
              profilePicImg.src = ev.target.result;
              profilePicImg.style.display = 'block';
            }
            if (profilePicInitials) profilePicInitials.style.display = 'none';
          };
          reader.readAsDataURL(file);
        });
      }

      if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
          if (!selectedFile) return;

          uploadBtn.disabled = true;
          uploadBtn.textContent = 'Uploading...';
          if (profilePicStatus) profilePicStatus.textContent = '';

          var formData = new FormData();
          formData.append('file', selectedFile);

          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || '/api';

          fetch(API_BASE + '/user/profile-image', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData,
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.success) {
              user.profile_image_url = data.data.url;
              AgriCore.setCurrentUser(user);
              AgriCore.showToast('Profile picture updated!', 'success');
              if (profilePicStatus) profilePicStatus.textContent = 'Uploaded successfully';
              // Update avatars in sidebar/topbar
              updateAvatarsWithImage(data.data.url);
            } else {
              AgriCore.showToast(data.error || 'Upload failed', 'error');
            }
          })
          .catch(function() {
            AgriCore.showToast('Network error. Please try again.', 'error');
          })
          .finally(function() {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload';
            selectedFile = null;
            if (profilePicInput) profilePicInput.value = '';
          });
        });
      }

      // --- Save Profile Info ---
      var saveBtn = document.getElementById('saveSettingsBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var name = settingsName ? settingsName.value.trim() : '';
          var phone = settingsPhone ? settingsPhone.value.trim() : '';

          if (!name) {
            AgriCore.showToast('Name is required.', 'error');
            return;
          }

          saveBtn.disabled = true;
          saveBtn.textContent = 'Saving...';

          AgriCore.apiPut('/user/settings', { name: name, phone: phone })
            .then(function(res) {
              if (res.success) {
                user.name = name;
                user.phone = phone;
                AgriCore.setCurrentUser(user);
                var sidebarUserName = document.getElementById('sidebarUserName');
                if (sidebarUserName) sidebarUserName.textContent = user.name;
                var newInitials = AgriCore.getInitials(user.name);
                // Update initials if no profile image
                if (!user.profile_image_url) {
                  var sidebarAvatar = document.getElementById('sidebarAvatar');
                  if (sidebarAvatar) sidebarAvatar.textContent = newInitials;
                  var topbarAvatar = document.getElementById('topbarAvatar');
                  if (topbarAvatar) topbarAvatar.textContent = newInitials;
                }
                AgriCore.showToast('Settings saved!', 'success');
              } else {
                AgriCore.showToast(res.error || 'Failed to save settings.', 'error');
              }
            })
            .finally(function() {
              saveBtn.disabled = false;
              saveBtn.textContent = 'Save Changes';
            });
        });
      }

      // --- Address ---
      loadAddress(user);

      var saveAddrBtn = document.getElementById('saveAddressBtn');
      if (saveAddrBtn) {
        saveAddrBtn.addEventListener('click', function() {
          var addr = {
            address_number: getVal('settingsAddrNumber'),
            street_name: getVal('settingsStreet'),
            suburb: getVal('settingsSuburb'),
            town: getVal('settingsTown'),
            province: getVal('settingsProvince'),
            postal_code: getVal('settingsPostalCode'),
          };

          // Validate all fields
          if (!addr.address_number || !addr.street_name || !addr.suburb ||
              !addr.town || !addr.province || !addr.postal_code) {
            AgriCore.showToast('All address fields are required.', 'error');
            return;
          }

          if (!/^\d+$/.test(addr.postal_code)) {
            AgriCore.showToast('Postal code must be numeric.', 'error');
            return;
          }

          saveAddrBtn.disabled = true;
          saveAddrBtn.textContent = 'Saving...';

          AgriCore.apiPut('/user/address', addr)
            .then(function(res) {
              if (res.success) {
                AgriCore.showToast('Address saved!', 'success');
              } else {
                AgriCore.showToast(res.error || 'Failed to save address.', 'error');
              }
            })
            .finally(function() {
              saveAddrBtn.disabled = false;
              saveAddrBtn.textContent = 'Save Address';
            });
        });
      }

      // --- Farm Location Map Picker (farmers only) ---
      var mapContainer = document.getElementById('settingsMapContainer');
      if (mapContainer && typeof L !== 'undefined' && ctx.isFarmer) {
        var locationMap = L.map('settingsMapContainer').setView([-28.5, 25.5], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(locationMap);

        var locationMarker = null;
        var selectedLat = null;
        var selectedLng = null;
        var statusEl = document.getElementById('settingsLocationStatus');
        var coordEl = document.getElementById('settingsCoordDisplay');
        var saveLocBtn = document.getElementById('saveLocationBtn');

        // Load existing coordinates from farmer profile
        AgriCore.apiGet('/farmers/me').then(function(res) {
          if (res.success && res.data && res.data.latitude && res.data.longitude) {
            selectedLat = res.data.latitude;
            selectedLng = res.data.longitude;
            locationMarker = L.marker([selectedLat, selectedLng]).addTo(locationMap);
            locationMap.setView([selectedLat, selectedLng], 13);
            if (statusEl) { statusEl.textContent = 'Location set'; statusEl.className = 'location-status active'; }
            if (coordEl) coordEl.textContent = selectedLat.toFixed(5) + ', ' + selectedLng.toFixed(5);
            if (saveLocBtn) saveLocBtn.disabled = false;
          }
        });

        // Click-to-pin
        locationMap.on('click', function(e) {
          selectedLat = e.latlng.lat;
          selectedLng = e.latlng.lng;

          if (locationMarker) {
            locationMap.removeLayer(locationMarker);
          }
          locationMarker = L.marker([selectedLat, selectedLng]).addTo(locationMap);

          if (statusEl) { statusEl.textContent = 'Location selected — click Save'; statusEl.className = 'location-status active'; }
          if (coordEl) coordEl.textContent = selectedLat.toFixed(5) + ', ' + selectedLng.toFixed(5);
          if (saveLocBtn) saveLocBtn.disabled = false;
        });

        // Save location
        if (saveLocBtn) {
          saveLocBtn.addEventListener('click', function() {
            if (selectedLat === null || selectedLng === null) {
              AgriCore.showToast('Click the map to select your farm location first.', 'error');
              return;
            }

            saveLocBtn.disabled = true;
            saveLocBtn.textContent = 'Saving...';

            AgriCore.apiPut('/farmers/me', { latitude: selectedLat, longitude: selectedLng })
              .then(function(res) {
                if (res.success) {
                  AgriCore.showToast('Farm location saved!', 'success');
                  if (statusEl) { statusEl.textContent = 'Location saved'; statusEl.className = 'location-status active'; }
                } else {
                  AgriCore.showToast(res.error || 'Failed to save location.', 'error');
                }
              })
              .finally(function() {
                saveLocBtn.disabled = false;
                saveLocBtn.textContent = 'Save Location';
              });
          });
        }

        // Fix map rendering after tab switch
        setTimeout(function() { locationMap.invalidateSize(); }, 300);
      }

      // --- Password ---
      var updatePwdBtn = document.getElementById('updatePasswordBtn');
      if (updatePwdBtn) {
        updatePwdBtn.addEventListener('click', function() {
          var newPwd = getVal('newPassword');
          var confirmPwd = getVal('confirmPassword');

          if (!newPwd || newPwd.length < 8) {
            AgriCore.showToast('Password must be at least 8 characters.', 'error');
            return;
          }
          if (newPwd !== confirmPwd) {
            AgriCore.showToast('Passwords do not match.', 'error');
            return;
          }

          updatePwdBtn.disabled = true;
          updatePwdBtn.textContent = 'Updating...';

          AgriCore.apiPut('/user/password', { newPassword: newPwd })
            .then(function(res) {
              if (res.success) {
                AgriCore.showToast('Password updated successfully!', 'success');
                setVal('currentPassword', '');
                setVal('newPassword', '');
                setVal('confirmPassword', '');
              } else {
                AgriCore.showToast(res.error || 'Failed to update password.', 'error');
              }
            })
            .finally(function() {
              updatePwdBtn.disabled = false;
              updatePwdBtn.textContent = 'Update Password';
            });
        });
      }

      // --- Delete Account ---
      var deleteReasonOther = document.getElementById('deleteReasonOther');
      var reasonRadios = document.querySelectorAll('input[name="deleteReason"]');
      reasonRadios.forEach(function(r) {
        r.addEventListener('change', function() {
          if (deleteReasonOther) {
            deleteReasonOther.style.display = r.value === 'Other' ? '' : 'none';
          }
        });
      });

      var requestDeletionBtn = document.getElementById('requestDeletionBtn');
      if (requestDeletionBtn) {
        requestDeletionBtn.addEventListener('click', function() {
          var selectedReason = document.querySelector('input[name="deleteReason"]:checked');
          if (!selectedReason) {
            AgriCore.showToast('Please select a reason for leaving.', 'error');
            return;
          }
          var reason = selectedReason.value;
          if (reason === 'Other') {
            var otherText = getVal('deleteReasonOther');
            if (!otherText) {
              AgriCore.showToast('Please specify your reason.', 'error');
              return;
            }
            reason = 'Other: ' + otherText;
          }

          var password = getVal('deleteConfirmPassword');
          if (!password) {
            AgriCore.showToast('Please confirm your password.', 'error');
            return;
          }

          requestDeletionBtn.disabled = true;
          requestDeletionBtn.textContent = 'Submitting...';

          AgriCore.apiPost('/user/delete-request', {
            reason: reason,
            deletion_reason: reason,
            password: password,
          })
            .then(function(res) {
              if (res.success) {
                var formArea = document.getElementById('deletionFormArea');
                var successArea = document.getElementById('deletionSuccessArea');
                if (formArea) formArea.style.display = 'none';
                if (successArea) successArea.style.display = '';
              } else {
                AgriCore.showToast(res.error || 'Failed to submit deletion request.', 'error');
              }
            })
            .finally(function() {
              requestDeletionBtn.disabled = false;
              requestDeletionBtn.textContent = 'Request Account Deletion';
            });
        });
      }

      // Refresh icons
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  // --- Helper functions ---
  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, val) {
    var el = document.getElementById(id);
    if (el) el.value = val;
  }

  function loadAddress(user) {
    // Load existing address from user profile via API
    AgriCore.apiGet('/user/profile').then(function(res) {
      if (res.success && res.data) {
        var d = res.data;
        setVal('settingsAddrNumber', d.address_number || '');
        setVal('settingsStreet', d.street_name || '');
        setVal('settingsSuburb', d.suburb || '');
        setVal('settingsTown', d.town || '');
        setVal('settingsPostalCode', d.postal_code || '');
        var prov = document.getElementById('settingsProvince');
        if (prov && d.province) prov.value = d.province;

        // Also update profile image if returned from API
        if (d.profile_image_url && !user.profile_image_url) {
          user.profile_image_url = d.profile_image_url;
          AgriCore.setCurrentUser(user);
          var img = document.getElementById('profilePicImg');
          var initials = document.getElementById('profilePicInitials');
          if (img) { img.src = d.profile_image_url; img.style.display = 'block'; }
          if (initials) initials.style.display = 'none';
          updateAvatarsWithImage(d.profile_image_url);
        }
      }
    });
  }

  function updateAvatarsWithImage(url) {
    var sidebarAvatar = document.getElementById('sidebarAvatar');
    var topbarAvatar = document.getElementById('topbarAvatar');
    if (sidebarAvatar) {
      sidebarAvatar.textContent = '';
      sidebarAvatar.style.backgroundImage = 'url(' + url + ')';
      sidebarAvatar.style.backgroundSize = 'cover';
      sidebarAvatar.style.backgroundPosition = 'center';
    }
    if (topbarAvatar) {
      topbarAvatar.textContent = '';
      topbarAvatar.style.backgroundImage = 'url(' + url + ')';
      topbarAvatar.style.backgroundSize = 'cover';
      topbarAvatar.style.backgroundPosition = 'center';
    }
  }
})();
