/* ============================================
   AgriCore — Plans Panel (Farmer + Gov views)
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'plans',
    panelId: 'panel-plans',

    getHTML: function() {
      return '<div id="plansContent"></div>';
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;
      var container = document.getElementById('plansContent');
      if (!container) return;

      var user = ctx.user;
      var token = user.token || '';
      var API_BASE = window.AGRICORE_API_BASE || '/api';
      var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

      if (ctx.isFarmer) {
        initFarmerPlans();
      } else {
        initGovPlans();
      }

      // === FARMER PLANS VIEW ===
      function initFarmerPlans() {
        container.innerHTML =
          '<div class="plans-header">' +
            '<div>' +
              '<h2 class="section-title">My Farm Plans</h2>' +
              '<p style="color:var(--gray-500);font-size:.875rem;">Plan and track your farming activities.</p>' +
            '</div>' +
            '<button class="btn btn-primary" id="createFarmerPlanBtn"><i data-lucide="plus"></i> Create New Plan</button>' +
          '</div>' +

          '<div class="plans-section" style="margin-top:20px;">' +
            '<h3 class="chart-card-title" style="margin-bottom:12px;"><i data-lucide="notebook-pen" style="width:18px;height:18px;display:inline;"></i> My Plans</h3>' +
            '<div id="farmerOwnPlans"><div style="text-align:center;padding:24px;color:var(--gray-400)">Loading plans...</div></div>' +
          '</div>' +

          '<div class="plans-section" style="margin-top:28px;">' +
            '<h3 class="chart-card-title" style="margin-bottom:12px;"><i data-lucide="building-2" style="width:18px;height:18px;display:inline;"></i> Government Support Plans</h3>' +
            '<p style="color:var(--gray-500);font-size:.8rem;margin-bottom:12px;">Plans created for you by government representatives.</p>' +
            '<div id="farmerGovPlans"><div style="text-align:center;padding:24px;color:var(--gray-400)">Loading plans...</div></div>' +
          '</div>';

        renderFarmerPlans();

        var createBtn = document.getElementById('createFarmerPlanBtn');
        if (createBtn) {
          createBtn.addEventListener('click', function() {
            showFarmerPlanForm();
          });
        }

        lucide.createIcons();
      }

      function renderFarmerPlans() {
        AgriCore.apiGet('/plans/mine').then(function(res) {
          var plans = (res.success && res.data) ? res.data : [];

          var myPlans = plans.filter(function(p) { return p.created_by_role === 'farmer'; });
          var govPlans = plans.filter(function(p) { return p.created_by_role === 'government'; });

          var ownContainer = document.getElementById('farmerOwnPlans');
          if (ownContainer) {
            if (myPlans.length === 0) {
              ownContainer.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--gray-400);"><i data-lucide="clipboard-list" style="width:32px;height:32px;display:block;margin:0 auto 8px;opacity:.5;"></i>You haven\'t created any plans yet.<br>Click "Create New Plan" to start planning.</div>';
            } else {
              ownContainer.innerHTML = '<div class="plans-cards">' + myPlans.map(function(p) {
                var statusClass = p.status === 'Active' ? 'warning' : p.status === 'Completed' ? 'success' : p.status === 'Draft' ? 'secondary' : 'info';
                var created = p.created_at ? new Date(p.created_at).toLocaleDateString('en-ZA') : '';
                return '<div class="card plan-card" style="padding:20px;margin-bottom:12px;">' +
                  '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
                    '<div>' +
                      '<h4 style="margin:0 0 4px;">' + escape(p.type) + '</h4>' +
                      '<p style="color:var(--gray-500);font-size:.8rem;margin:0;">Created ' + created + '</p>' +
                    '</div>' +
                    '<span class="badge badge-' + statusClass + '">' + escape(p.status) + '</span>' +
                  '</div>' +
                  (p.objectives ? '<p style="margin:10px 0 0;font-size:.875rem;">' + escape(p.objectives) + '</p>' : '') +
                  '<div style="display:flex;gap:16px;margin-top:10px;font-size:.8rem;color:var(--gray-500);">' +
                    (p.budget ? '<span><strong>Budget:</strong> R' + Number(p.budget).toLocaleString() + '</span>' : '') +
                    (p.timeline ? '<span><strong>Timeline:</strong> ' + escape(p.timeline) + '</span>' : '') +
                  '</div>' +
                '</div>';
              }).join('') + '</div>';
            }
          }

          var govContainer = document.getElementById('farmerGovPlans');
          if (govContainer) {
            if (govPlans.length === 0) {
              govContainer.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--gray-400);"><i data-lucide="building-2" style="width:32px;height:32px;display:block;margin:0 auto 8px;opacity:.5;"></i>No government support plans assigned to you.</div>';
            } else {
              govContainer.innerHTML = '<div class="plans-cards">' + govPlans.map(function(p) {
                var approvalClass = p.approval_status === 'Approved' ? 'success' : p.approval_status === 'Rejected' ? 'danger' : 'warning';
                var created = p.created_at ? new Date(p.created_at).toLocaleDateString('en-ZA') : '';
                return '<div class="card plan-card gov-plan-card" style="padding:20px;margin-bottom:12px;border-left:4px solid var(--primary);">' +
                  '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
                    '<div>' +
                      '<h4 style="margin:0 0 4px;">' + escape(p.type) + '</h4>' +
                      '<p style="color:var(--gray-500);font-size:.8rem;margin:0;">Created ' + created + '</p>' +
                    '</div>' +
                    '<span class="badge badge-' + approvalClass + '">' + escape(p.approval_status || 'Pending') + '</span>' +
                  '</div>' +
                  (p.objectives ? '<p style="margin:8px 0 0;font-size:.875rem;">' + escape(p.objectives) + '</p>' : '') +
                  '<div style="display:flex;gap:16px;margin-top:10px;font-size:.8rem;color:var(--gray-500);">' +
                    (p.budget ? '<span><strong>Budget:</strong> R' + Number(p.budget).toLocaleString() + '</span>' : '') +
                    (p.timeline ? '<span><strong>Timeline:</strong> ' + escape(p.timeline) + '</span>' : '') +
                  '</div>' +
                '</div>';
              }).join('') + '</div>';
            }
          }

          lucide.createIcons();
        });
      }

      // Simple inline form for farmer to create their own plan
      function showFarmerPlanForm() {
        var formContainer = document.getElementById('farmerOwnPlans');
        if (!formContainer) return;

        var formHtml =
          '<div class="card" style="padding:20px;margin-bottom:16px;border:2px solid var(--primary-light);" id="farmerPlanForm">' +
            '<h4 style="margin:0 0 12px;"><i data-lucide="plus-circle" style="width:16px;height:16px;display:inline;"></i> New Farm Plan</h4>' +
            '<div class="form-group">' +
              '<label class="form-label">Plan Type</label>' +
              '<select class="form-select" id="farmerPlanType">' +
                '<option value="">Select type</option>' +
                '<option value="Crop Rotation">Crop Rotation</option>' +
                '<option value="Livestock Expansion">Livestock Expansion</option>' +
                '<option value="Soil Improvement">Soil Improvement</option>' +
                '<option value="Market Strategy">Market Strategy</option>' +
                '<option value="Infrastructure">Infrastructure</option>' +
                '<option value="Water Management">Water Management</option>' +
                '<option value="Other">Other</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">What are you planning to do?</label>' +
              '<textarea class="form-textarea" id="farmerPlanObjectives" placeholder="Describe your farming plan..."></textarea>' +
            '</div>' +
            '<div class="form-row">' +
              '<div class="form-group">' +
                '<label class="form-label">Estimated Budget (ZAR)</label>' +
                '<input type="number" class="form-input" id="farmerPlanBudget" placeholder="e.g. 10000" min="0">' +
              '</div>' +
              '<div class="form-group">' +
                '<label class="form-label">Timeline</label>' +
                '<select class="form-select" id="farmerPlanTimeline">' +
                  '<option value="1 month">1 Month</option>' +
                  '<option value="3 months">3 Months</option>' +
                  '<option value="6 months" selected>6 Months</option>' +
                  '<option value="12 months">12 Months</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<button class="btn btn-primary btn-sm" id="saveFarmerPlan"><i data-lucide="check"></i> Save Plan</button>' +
              '<button class="btn btn-ghost btn-sm" id="cancelFarmerPlan">Cancel</button>' +
            '</div>' +
          '</div>';

        formContainer.insertAdjacentHTML('afterbegin', formHtml);
        lucide.createIcons();

        document.getElementById('cancelFarmerPlan').addEventListener('click', function() {
          var form = document.getElementById('farmerPlanForm');
          if (form) form.remove();
        });

        document.getElementById('saveFarmerPlan').addEventListener('click', function() {
          var type = document.getElementById('farmerPlanType').value;
          var objectives = document.getElementById('farmerPlanObjectives').value.trim();
          if (!type) {
            AgriCore.showToast('Please select a plan type.', 'error');
            return;
          }
          if (!objectives) {
            AgriCore.showToast('Please describe your plan objectives.', 'error');
            return;
          }

          // Resolve farmer_id from /farmers/me
          fetch(API_BASE + '/farmers/me', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(function(r) { return r.json(); })
            .then(function(res) {
              if (!res.success || !res.data) throw new Error('Could not resolve farmer profile');
              return fetch(API_BASE + '/plans', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  farmer_id: res.data.id,
                  type: type,
                  objectives: objectives,
                  budget: parseFloat(document.getElementById('farmerPlanBudget').value) || 0,
                  timeline: document.getElementById('farmerPlanTimeline').value,
                  status: 'Draft'
                })
              });
            })
            .then(function(r) { return r.json(); })
            .then(function(res) {
              if (res.success) {
                AgriCore.showToast('Farm plan created successfully!', 'success');
                renderFarmerPlans();
              } else {
                AgriCore.showToast(res.error || 'Failed to create plan.', 'error');
              }
            })
            .catch(function(err) {
              AgriCore.showToast('Failed to create plan: ' + (err.message || 'Unknown error'), 'error');
            });
        });
      }

      // === GOVERNMENT PLANS VIEW ===
      function initGovPlans() {
        container.innerHTML =
          '<div class="plans-header">' +
            '<div>' +
              '<h2 class="section-title">Support Plans</h2>' +
              '<p style="color:var(--gray-500);font-size:.875rem;">View and manage farmer support plans.</p>' +
            '</div>' +
            '<button class="btn btn-primary" id="createPlanBtn"><i data-lucide="plus"></i> Create New Plan</button>' +
          '</div>' +
          '<div class="card" style="margin-top:16px;">' +
            '<table class="table">' +
              '<thead><tr>' +
                '<th>Farmer</th><th>Type</th><th>Created</th><th>Budget</th><th>Status</th><th>Approval</th><th>Actions</th>' +
              '</tr></thead>' +
              '<tbody id="plansTableBody"><tr><td colspan="7" style="text-align:center;color:var(--gray-400)">Loading plans...</td></tr></tbody>' +
            '</table>' +
          '</div>';

        populateGovPlansTable();

        var createBtn = document.getElementById('createPlanBtn');
        if (createBtn) createBtn.addEventListener('click', function() { ctx.openModal('createPlanModal'); });

        lucide.createIcons();
      }

      function populateGovPlansTable() {
        AgriCore.apiGet('/plans').then(function(res) {
          var plans = (res.success && res.data) ? res.data : [];
          var tbody = document.getElementById('plansTableBody');
          if (!tbody) return;

          if (plans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-400)">No plans found.</td></tr>';
            return;
          }

          tbody.innerHTML = plans.map(function(p) {
            var statusClass = p.status === 'Active' ? 'success' : p.status === 'Pending' ? 'warning' : p.status === 'Completed' ? 'info' : 'secondary';
            var approvalClass = p.approval_status === 'Approved' ? 'success' : p.approval_status === 'Rejected' ? 'danger' : 'warning';
            var created = p.created_at ? new Date(p.created_at).toLocaleDateString('en-ZA') : '';
            var canApprove = p.approval_status !== 'Approved' && p.approval_status !== 'Rejected';
            var actionsHtml = canApprove
              ? '<button class="btn btn-sm btn-primary plan-approve-btn" data-id="' + escape(p.id) + '"><i data-lucide="check"></i></button> ' +
                '<button class="btn btn-sm btn-danger plan-reject-btn" data-id="' + escape(p.id) + '"><i data-lucide="x"></i></button>'
              : '<span style="color:var(--gray-400);font-size:.8rem;">—</span>';
            return '<tr>' +
              '<td>' + escape(p.farmer_name || 'Unknown') + '</td>' +
              '<td>' + escape(p.type) + '</td>' +
              '<td>' + created + '</td>' +
              '<td>R' + Number(p.budget || 0).toLocaleString() + '</td>' +
              '<td><span class="badge badge-' + statusClass + '">' + escape(p.status) + '</span></td>' +
              '<td><span class="badge badge-' + approvalClass + '">' + escape(p.approval_status || 'Pending') + '</span></td>' +
              '<td>' + actionsHtml + '</td>' +
              '</tr>';
          }).join('');

          // Wire approve/reject buttons
          tbody.querySelectorAll('.plan-approve-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var planId = btn.dataset.id;
              fetch(API_BASE + '/plans/' + planId + '/approve', {
                method: 'POST', headers: headers
              }).then(function(r) { return r.json(); })
                .then(function(res) {
                  if (res.success) {
                    AgriCore.showToast('Plan approved!', 'success');
                    populateGovPlansTable();
                  } else {
                    AgriCore.showToast(res.error || 'Failed to approve', 'error');
                  }
                });
            });
          });

          tbody.querySelectorAll('.plan-reject-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var planId = btn.dataset.id;
              fetch(API_BASE + '/plans/' + planId + '/reject', {
                method: 'POST', headers: headers
              }).then(function(r) { return r.json(); })
                .then(function(res) {
                  if (res.success) {
                    AgriCore.showToast('Plan rejected.', 'warning');
                    populateGovPlansTable();
                  } else {
                    AgriCore.showToast(res.error || 'Failed to reject', 'error');
                  }
                });
            });
          });

          lucide.createIcons();
        });
      }

      // Expose for use by create-plan-modal
      window.populatePlansTable = function() {
        if (ctx.isFarmer) {
          renderFarmerPlans();
        } else {
          populateGovPlansTable();
        }
      };
    }
  });
})();
