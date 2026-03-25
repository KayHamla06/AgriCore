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
            '<div id="farmerOwnPlans"></div>' +
          '</div>' +

          '<div class="plans-section" style="margin-top:28px;">' +
            '<h3 class="chart-card-title" style="margin-bottom:12px;"><i data-lucide="building-2" style="width:18px;height:18px;display:inline;"></i> Government Support Plans</h3>' +
            '<p style="color:var(--gray-500);font-size:.8rem;margin-bottom:12px;">Plans created for you by government representatives.</p>' +
            '<div id="farmerGovPlans"></div>' +
          '</div>';

        renderFarmerPlans();

        // Create plan button — opens a simplified form for the farmer
        var createBtn = document.getElementById('createFarmerPlanBtn');
        if (createBtn) {
          createBtn.addEventListener('click', function() {
            showFarmerPlanForm();
          });
        }

        lucide.createIcons();
      }

      function renderFarmerPlans() {
        var user = ctx.user;
        var myPlans = AgriCore.mockPlans.filter(function(p) {
          return p.farmerId === user.id && p.createdByRole === 'farmer';
        });
        var govPlans = AgriCore.mockPlans.filter(function(p) {
          return p.farmerId === user.id && p.createdByRole === 'government';
        });

        // --- My Plans ---
        var ownContainer = document.getElementById('farmerOwnPlans');
        if (ownContainer) {
          if (myPlans.length === 0) {
            ownContainer.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--gray-400);"><i data-lucide="clipboard-list" style="width:32px;height:32px;display:block;margin:0 auto 8px;opacity:.5;"></i>You haven\'t created any plans yet.<br>Click "Create New Plan" to start planning.</div>';
          } else {
            ownContainer.innerHTML = '<div class="plans-cards">' + myPlans.map(function(p) {
              var statusClass = p.status === 'In Progress' ? 'warning' : p.status === 'Completed' ? 'success' : p.status === 'Draft' ? 'secondary' : 'info';
              return '<div class="card plan-card" style="padding:20px;margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
                  '<div>' +
                    '<h4 style="margin:0 0 4px;">' + escape(p.type) + '</h4>' +
                    '<p style="color:var(--gray-500);font-size:.8rem;margin:0;">' + escape(p.id) + ' &bull; Created ' + escape(p.created) + '</p>' +
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

        // --- Government Plans ---
        var govContainer = document.getElementById('farmerGovPlans');
        if (govContainer) {
          if (govPlans.length === 0) {
            govContainer.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--gray-400);"><i data-lucide="building-2" style="width:32px;height:32px;display:block;margin:0 auto 8px;opacity:.5;"></i>No government support plans assigned to you.</div>';
          } else {
            govContainer.innerHTML = '<div class="plans-cards">' + govPlans.map(function(p) {
              var approvalClass = p.approvalStatus === 'Approved' ? 'success' : p.approvalStatus === 'Rejected' ? 'danger' : 'warning';
              return '<div class="card plan-card gov-plan-card" style="padding:20px;margin-bottom:12px;border-left:4px solid var(--primary);">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
                  '<div>' +
                    '<h4 style="margin:0 0 4px;">' + escape(p.type) + '</h4>' +
                    '<p style="color:var(--gray-500);font-size:.8rem;margin:0;">' + escape(p.id) + ' &bull; Created ' + escape(p.created) + '</p>' +
                  '</div>' +
                  '<span class="badge badge-' + approvalClass + '">' + escape(p.approvalStatus || 'Pending') + '</span>' +
                '</div>' +
                '<div style="margin-top:10px;font-size:.875rem;">' +
                  '<div style="display:flex;align-items:center;gap:6px;color:var(--gray-600);"><i data-lucide="user-check" style="width:14px;height:14px;"></i> Created by: <strong>' + escape(p.createdBy) + '</strong></div>' +
                '</div>' +
                (p.objectives ? '<p style="margin:8px 0 0;font-size:.875rem;">' + escape(p.objectives) + '</p>' : '') +
                '<div style="display:flex;gap:16px;margin-top:10px;font-size:.8rem;color:var(--gray-500);">' +
                  (p.budget ? '<span><strong>Budget:</strong> R' + Number(p.budget).toLocaleString() + '</span>' : '') +
                  (p.timeline ? '<span><strong>Timeline:</strong> ' + escape(p.timeline) + '</span>' : '') +
                  (p.approvedDate ? '<span><strong>Approved:</strong> ' + escape(p.approvedDate) + '</span>' : '') +
                '</div>' +
                '<div style="margin-top:8px;font-size:.8rem;"><span class="badge badge-' + (p.status === 'Active' ? 'success' : p.status === 'Completed' ? 'info' : 'warning') + '">' + escape(p.status) + '</span></div>' +
              '</div>';
            }).join('') + '</div>';
          }
        }

        lucide.createIcons();
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

          var newPlan = {
            id: 'PLN-' + String(AgriCore.mockPlans.length + 1).padStart(3, '0'),
            farmerId: ctx.user.id,
            farmerName: ctx.user.name,
            type: type,
            createdBy: ctx.user.name,
            createdByRole: 'farmer',
            created: new Date().toISOString().split('T')[0],
            budget: document.getElementById('farmerPlanBudget').value || 0,
            status: 'Draft',
            objectives: objectives,
            timeline: document.getElementById('farmerPlanTimeline').value,
            approvalStatus: null,
            approvedDate: null
          };

          AgriCore.mockPlans.push(newPlan);
          AgriCore.showToast('Farm plan created successfully!', 'success');
          renderFarmerPlans();
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
                '<th>Plan ID</th><th>Farmer</th><th>Type</th><th>Created By</th><th>Created</th><th>Budget</th><th>Status</th>' +
              '</tr></thead>' +
              '<tbody id="plansTableBody"></tbody>' +
            '</table>' +
          '</div>';

        populateGovPlansTable();

        var createBtn = document.getElementById('createPlanBtn');
        if (createBtn) createBtn.addEventListener('click', function() { ctx.openModal('createPlanModal'); });

        lucide.createIcons();
      }

      function populateGovPlansTable() {
        var tbody = document.getElementById('plansTableBody');
        if (!tbody) return;

        tbody.innerHTML = AgriCore.mockPlans.map(function(p) {
          var statusClass = p.status === 'Active' ? 'success' : p.status === 'Pending' ? 'warning' : p.status === 'Completed' ? 'info' : 'secondary';
          return '<tr>' +
            '<td>' + escape(p.id) + '</td>' +
            '<td>' + escape(p.farmerName) + '</td>' +
            '<td>' + escape(p.type) + '</td>' +
            '<td>' + escape(p.createdBy || 'Government') + '</td>' +
            '<td>' + escape(p.created) + '</td>' +
            '<td>R' + Number(p.budget).toLocaleString() + '</td>' +
            '<td><span class="badge badge-' + statusClass + '">' + escape(p.status) + '</span></td>' +
            '</tr>';
        }).join('');
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
