/* ============================================
   AgriCore — Settings Panel
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'settings',
    panelId: 'panel-settings',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Settings</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Manage your account and preferences.</p>
          </div>
        </div>

        <div class="settings-grid">
          <div class="settings-card">
            <h3 class="settings-card-title">Profile Information</h3>
            <p class="settings-card-desc">Update your personal details.</p>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" id="settingsName" placeholder="Your name">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-input" id="settingsEmail" placeholder="Your email">
            </div>
            <button class="btn btn-primary btn-sm" id="saveSettingsBtn">Save Changes</button>
          </div>

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

          <div class="settings-card" style="grid-column:1/-1;">
            <h3 class="settings-card-title">Security</h3>
            <p class="settings-card-desc">Update your password.</p>
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" class="form-input" placeholder="Enter current password">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" class="form-input" placeholder="New password">
              </div>
              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <input type="password" class="form-input" placeholder="Confirm new password">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="updatePasswordBtn">Update Password</button>
          </div>
        </div>
      `;
    },

    init: function(ctx) {
      var user = ctx.user;
      var settingsName = document.getElementById('settingsName');
      var settingsEmail = document.getElementById('settingsEmail');

      if (settingsName) settingsName.value = user.name;
      if (settingsEmail) settingsEmail.value = user.email;

      var saveBtn = document.getElementById('saveSettingsBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          var name = settingsName ? settingsName.value.trim() : '';
          var email = settingsEmail ? settingsEmail.value.trim() : '';
          if (name) user.name = name;
          if (email) user.email = email;
          AgriCore.setCurrentUser(user);
          var sidebarUserName = document.getElementById('sidebarUserName');
          if (sidebarUserName) sidebarUserName.textContent = user.name;
          var newInitials = AgriCore.getInitials(user.name);
          var sidebarAvatar = document.getElementById('sidebarAvatar');
          if (sidebarAvatar) sidebarAvatar.textContent = newInitials;
          var topbarAvatar = document.getElementById('topbarAvatar');
          if (topbarAvatar) topbarAvatar.textContent = newInitials;
          AgriCore.showToast('Settings saved!', 'success');
        });
      }

      var updatePwdBtn = document.getElementById('updatePasswordBtn');
      if (updatePwdBtn) {
        updatePwdBtn.addEventListener('click', function() {
          AgriCore.showToast('Password updated successfully!', 'success');
        });
      }
    }
  });
})();
