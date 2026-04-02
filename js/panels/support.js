/* ============================================
   AgriCore — Support / Ticket Panel
   Submit and view support tickets
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  var TICKET_TYPES = [
    { value: 'bug', label: 'Bug Report', icon: 'bug', color: 'var(--danger)' },
    { value: 'feature_request', label: 'Feature Request', icon: 'lightbulb', color: 'var(--warning)' },
    { value: 'general_inquiry', label: 'General Enquiry', icon: 'message-circle', color: 'var(--info)' },
  ];
  var URGENCY_LEVELS = [
    { value: 'low', label: 'Low', color: 'var(--success)' },
    { value: 'medium', label: 'Medium', color: 'var(--warning)' },
    { value: 'high', label: 'High', color: 'var(--danger)' },
  ];

  window.AgriPanels.push({
    key: 'support',
    panelId: 'panel-support',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Support</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Submit a ticket or check on your existing requests.</p>
          </div>
        </div>

        <!-- Tab Toggle -->
        <div class="filter-tabs" id="supportTabs">
          <button class="filter-tab active" data-tab="new">New Ticket</button>
          <button class="filter-tab" data-tab="my">My Tickets</button>
        </div>

        <!-- NEW TICKET TAB -->
        <div class="support-tab-content" id="supportTabNew" style="margin-top:1.25rem;">
          <div class="settings-grid" style="max-width:720px;">

            <!-- Type Selection -->
            <div class="settings-card" style="grid-column:1/-1;">
              <h3 class="settings-card-title">What do you need help with?</h3>
              <div class="ticket-type-grid" id="ticketTypeGrid">
                ${TICKET_TYPES.map(function(t) {
                  return '<button class="ticket-type-btn" data-type="' + t.value + '" style="--type-color:' + t.color + ';">' +
                    '<i data-lucide="' + t.icon + '" style="width:24px;height:24px;color:' + t.color + ';"></i>' +
                    '<span>' + t.label + '</span>' +
                    '</button>';
                }).join('')}
              </div>
            </div>

            <!-- Urgency -->
            <div class="settings-card" style="grid-column:1/-1;">
              <h3 class="settings-card-title">Urgency Level</h3>
              <div class="urgency-grid" id="urgencyGrid">
                ${URGENCY_LEVELS.map(function(u) {
                  return '<button class="urgency-btn" data-urgency="' + u.value + '" style="--urgency-color:' + u.color + ';">' +
                    '<span class="urgency-dot" style="background:' + u.color + ';"></span>' +
                    u.label +
                    '</button>';
                }).join('')}
              </div>
            </div>

            <!-- Title & Description -->
            <div class="settings-card" style="grid-column:1/-1;">
              <h3 class="settings-card-title">Details</h3>
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" class="form-input" id="ticketTitle" placeholder="Brief summary of your issue" maxlength="200">
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-input" id="ticketDescription" rows="5" placeholder="Describe your issue or request in detail..." maxlength="5000" style="resize:vertical;"></textarea>
              </div>
            </div>

            <!-- Attachment -->
            <div class="settings-card" style="grid-column:1/-1;">
              <h3 class="settings-card-title">Attachment (optional)</h3>
              <p class="settings-card-desc">Add a screenshot or document (JPG, PNG, PDF, TXT — max 10 MB).</p>
              <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
                <label class="btn btn-secondary btn-sm" for="ticketFileInput" style="cursor:pointer;">
                  <i data-lucide="paperclip" style="width:14px;height:14px;"></i> Choose File
                </label>
                <input type="file" id="ticketFileInput" accept=".jpg,.jpeg,.png,.pdf,.txt" style="display:none;">
                <span class="profile-pic-status" id="ticketFileName">No file selected</span>
              </div>
            </div>

            <!-- Submit -->
            <div style="grid-column:1/-1;">
              <button class="btn btn-primary" id="submitTicketBtn" disabled style="min-width:200px;">
                <i data-lucide="send" style="width:16px;height:16px;"></i> Submit Ticket
              </button>
            </div>
          </div>
        </div>

        <!-- MY TICKETS TAB -->
        <div class="support-tab-content" id="supportTabMy" style="margin-top:1.25rem;display:none;">
          <div class="request-list" id="myTicketList">
            <div class="empty-state"><i data-lucide="inbox"></i><p>Loading tickets...</p></div>
          </div>
        </div>

        <style>
          .ticket-type-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: .75rem;
          }
          .ticket-type-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: .5rem;
            padding: 1.25rem 1rem;
            background: var(--white);
            border: 2px solid var(--gray-200);
            border-radius: var(--radius-md);
            cursor: pointer;
            font-family: inherit;
            font-size: .875rem;
            font-weight: 500;
            color: var(--gray-700);
            transition: var(--transition-fast);
          }
          .ticket-type-btn:hover { border-color: var(--type-color); }
          .ticket-type-btn.selected {
            border-color: var(--type-color);
            background: color-mix(in srgb, var(--type-color) 6%, white);
          }
          .urgency-grid {
            display: flex;
            gap: .75rem;
            flex-wrap: wrap;
          }
          .urgency-btn {
            display: flex;
            align-items: center;
            gap: .5rem;
            padding: .625rem 1.25rem;
            background: var(--white);
            border: 2px solid var(--gray-200);
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-family: inherit;
            font-size: .875rem;
            font-weight: 500;
            color: var(--gray-700);
            transition: var(--transition-fast);
          }
          .urgency-btn:hover { border-color: var(--urgency-color); }
          .urgency-btn.selected {
            border-color: var(--urgency-color);
            background: color-mix(in srgb, var(--urgency-color) 8%, white);
          }
          .urgency-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            display: inline-block;
          }
          .ticket-card {
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-md);
            padding: 1rem 1.25rem;
            margin-bottom: .75rem;
            transition: var(--transition-fast);
          }
          .ticket-card:hover { border-color: var(--primary-200); }
          .ticket-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: .75rem;
            margin-bottom: .5rem;
          }
          .ticket-card-title {
            font-weight: 600;
            font-size: .9375rem;
            color: var(--gray-900);
          }
          .ticket-card-badges { display: flex; gap: .375rem; flex-wrap: wrap; }
          .ticket-badge {
            padding: 2px 8px;
            border-radius: 20px;
            font-size: .6875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .03em;
          }
          .ticket-badge.type-bug { background: var(--danger-light); color: var(--danger); }
          .ticket-badge.type-feature_request { background: var(--warning-light); color: #e65100; }
          .ticket-badge.type-general_inquiry { background: var(--info-light); color: var(--info); }
          .ticket-badge.urgency-low { background: var(--success-light); color: var(--success); }
          .ticket-badge.urgency-medium { background: var(--warning-light); color: #e65100; }
          .ticket-badge.urgency-high { background: var(--danger-light); color: var(--danger); }
          .ticket-badge.status-open { background: var(--info-light); color: var(--info); }
          .ticket-badge.status-in_progress { background: var(--warning-light); color: #e65100; }
          .ticket-badge.status-resolved { background: var(--success-light); color: var(--success); }
          .ticket-card-desc {
            font-size: .8125rem;
            color: var(--gray-600);
            line-height: 1.5;
            margin-bottom: .5rem;
          }
          .ticket-card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: .75rem;
            color: var(--gray-500);
          }
        </style>
      `;
    },

    init: function(ctx) {
      var user = ctx.user;
      var selectedType = null;
      var selectedUrgency = null;
      var selectedFile = null;

      // --- Tab switching ---
      var supportTabs = document.getElementById('supportTabs');
      var tabNew = document.getElementById('supportTabNew');
      var tabMy = document.getElementById('supportTabMy');

      if (supportTabs) {
        supportTabs.addEventListener('click', function(e) {
          var tab = e.target.closest('.filter-tab');
          if (!tab) return;
          supportTabs.querySelectorAll('.filter-tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          var which = tab.getAttribute('data-tab');
          if (tabNew) tabNew.style.display = which === 'new' ? '' : 'none';
          if (tabMy) tabMy.style.display = which === 'my' ? '' : 'none';
          if (which === 'my') loadMyTickets();
        });
      }

      // --- Type selection ---
      var typeGrid = document.getElementById('ticketTypeGrid');
      if (typeGrid) {
        typeGrid.addEventListener('click', function(e) {
          var btn = e.target.closest('.ticket-type-btn');
          if (!btn) return;
          typeGrid.querySelectorAll('.ticket-type-btn').forEach(function(b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          selectedType = btn.getAttribute('data-type');
          validateForm();
        });
      }

      // --- Urgency selection ---
      var urgencyGrid = document.getElementById('urgencyGrid');
      if (urgencyGrid) {
        urgencyGrid.addEventListener('click', function(e) {
          var btn = e.target.closest('.urgency-btn');
          if (!btn) return;
          urgencyGrid.querySelectorAll('.urgency-btn').forEach(function(b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          selectedUrgency = btn.getAttribute('data-urgency');
          validateForm();
        });
      }

      // --- File input ---
      var fileInput = document.getElementById('ticketFileInput');
      var fileNameEl = document.getElementById('ticketFileName');
      if (fileInput) {
        fileInput.addEventListener('change', function(e) {
          var file = e.target.files[0];
          if (!file) { selectedFile = null; if (fileNameEl) fileNameEl.textContent = 'No file selected'; return; }
          var allowed = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
          if (!allowed.includes(file.type)) {
            AgriCore.showToast('Only JPG, PNG, PDF, and TXT files are allowed.', 'error');
            fileInput.value = '';
            selectedFile = null;
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            AgriCore.showToast('File must be under 10 MB.', 'error');
            fileInput.value = '';
            selectedFile = null;
            return;
          }
          selectedFile = file;
          if (fileNameEl) fileNameEl.textContent = file.name;
        });
      }

      // --- Validate form ---
      var titleInput = document.getElementById('ticketTitle');
      var descInput = document.getElementById('ticketDescription');
      var submitBtn = document.getElementById('submitTicketBtn');

      function validateForm() {
        var valid = selectedType && selectedUrgency &&
          titleInput && titleInput.value.trim().length >= 5 &&
          descInput && descInput.value.trim().length >= 10;
        if (submitBtn) submitBtn.disabled = !valid;
      }

      if (titleInput) titleInput.addEventListener('input', validateForm);
      if (descInput) descInput.addEventListener('input', validateForm);

      // --- Submit ticket ---
      if (submitBtn) {
        submitBtn.addEventListener('click', function() {
          if (!selectedType || !selectedUrgency) return;
          var title = titleInput ? titleInput.value.trim() : '';
          var description = descInput ? descInput.value.trim() : '';
          if (title.length < 5 || description.length < 10) return;

          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting...';

          var formData = new FormData();
          formData.append('type', selectedType);
          formData.append('urgency', selectedUrgency);
          formData.append('title', title);
          formData.append('description', description);
          if (selectedFile) formData.append('file', selectedFile);

          var token = user.token || '';
          var API_BASE = window.AGRICORE_API_BASE || '/api';

          fetch(API_BASE + '/tickets', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData,
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.success) {
              AgriCore.showToast('Ticket submitted successfully!', 'success');
              // Reset form
              if (titleInput) titleInput.value = '';
              if (descInput) descInput.value = '';
              if (fileInput) fileInput.value = '';
              if (fileNameEl) fileNameEl.textContent = 'No file selected';
              selectedFile = null;
              selectedType = null;
              selectedUrgency = null;
              if (typeGrid) typeGrid.querySelectorAll('.ticket-type-btn').forEach(function(b) { b.classList.remove('selected'); });
              if (urgencyGrid) urgencyGrid.querySelectorAll('.urgency-btn').forEach(function(b) { b.classList.remove('selected'); });
              validateForm();
            } else {
              AgriCore.showToast(data.error || 'Failed to submit ticket.', 'error');
            }
          })
          .catch(function() {
            AgriCore.showToast('Network error. Please try again.', 'error');
          })
          .finally(function() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="send" style="width:16px;height:16px;"></i> Submit Ticket';
            if (typeof lucide !== 'undefined') lucide.createIcons();
          });
        });
      }

      // --- Load My Tickets ---
      function loadMyTickets() {
        var container = document.getElementById('myTicketList');
        if (!container) return;
        AgriCore.showLoading(container);

        AgriCore.apiGet('/tickets/my').then(function(res) {
          if (!res.success || !res.data || res.data.length === 0) {
            AgriCore.showEmpty(container, 'No tickets submitted yet.');
            return;
          }
          renderMyTickets(container, res.data);
        });
      }

      function renderMyTickets(container, tickets) {
        container.innerHTML = tickets.map(function(t) {
          var date = new Date(t.created_at).toLocaleDateString('en-ZA', {
            year: 'numeric', month: 'short', day: 'numeric',
          });
          var typeLbl = (t.type || '').replace('_', ' ');
          var hasAttachment = t.attachment_url ? ' · 📎' : '';

          return '<div class="ticket-card">' +
            '<div class="ticket-card-header">' +
            '<div class="ticket-card-title">' + AgriCore.escapeHtml(t.title) + '</div>' +
            '<div class="ticket-card-badges">' +
            '<span class="ticket-badge type-' + t.type + '">' + typeLbl + '</span>' +
            '<span class="ticket-badge urgency-' + t.urgency + '">' + t.urgency + '</span>' +
            '<span class="ticket-badge status-' + t.status + '">' + (t.status || '').replace('_', ' ') + '</span>' +
            '</div>' +
            '</div>' +
            '<div class="ticket-card-desc">' + AgriCore.escapeHtml(t.description || '').substring(0, 200) + '</div>' +
            (t.admin_notes ? '<div class="ticket-card-desc" style="color:var(--primary);"><strong>Admin:</strong> ' + AgriCore.escapeHtml(t.admin_notes) + '</div>' : '') +
            '<div class="ticket-card-footer">' +
            '<span>' + date + hasAttachment + '</span>' +
            (t.resolved_at ? '<span>Resolved: ' + new Date(t.resolved_at).toLocaleDateString('en-ZA') + '</span>' : '') +
            '</div>' +
            '</div>';
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
      }

      // Refresh icons
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
})();
