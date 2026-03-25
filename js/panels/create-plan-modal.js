/* ============================================
   AgriCore — Create Plan Modal + Smart Generator
   ============================================ */
(function() {
  'use strict';
  window.AgriModals = window.AgriModals || [];

  window.AgriModals.push({
    key: 'createPlan',
    modalId: 'createPlanModal',

    getHTML: function() {
      return `
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">Create Support Plan</h3>
            <button class="modal-close" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="plan-suggestions" id="planSuggestions" style="display:none;">
              <div class="plan-suggestions-title"><i data-lucide="sparkles"></i> Recommended Based on Data</div>
              <div class="suggestion-list" id="suggestionList"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Farmer</label>
              <select class="form-select" id="planFarmer">
                <option value="">Select farmer</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Plan Type</label>
              <select class="form-select" id="planType">
                <option value="">Select type</option>
                <option value="Financial Aid">Financial Aid</option>
                <option value="Training Program">Training Program</option>
                <option value="Equipment Support">Equipment Support</option>
                <option value="Market Access">Market Access</option>
                <option value="Irrigation Support">Irrigation Support</option>
                <option value="Comprehensive">Comprehensive Support</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Objectives</label>
              <textarea class="form-textarea" id="planObjectives" placeholder="Describe the plan objectives..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Budget (ZAR)</label>
                <input type="number" class="form-input" id="planBudget" placeholder="e.g. 50000" min="0">
              </div>
              <div class="form-group">
                <label class="form-label">Timeline</label>
                <select class="form-select" id="planTimeline">
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="12 months">12 Months</option>
                  <option value="24 months">24 Months</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" id="planNotes" placeholder="Additional notes or instructions..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost modal-cancel">Cancel</button>
            <button class="btn btn-primary" id="generatePlanBtn">Generate Plan</button>
          </div>
        </div>
      `;
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;

      // Populate farmer select
      var planFarmerSelect = document.getElementById('planFarmer');
      if (planFarmerSelect) {
        AgriCore.mockFarmers.forEach(function(f) {
          var opt = document.createElement('option');
          opt.value = f.id;
          opt.textContent = f.name + ' — ' + f.farmName;
          planFarmerSelect.appendChild(opt);
        });
      }

      // Smart plan generator — suggestions on farmer select
      var planSuggestions = document.getElementById('planSuggestions');
      var suggestionList = document.getElementById('suggestionList');
      var planTypeSelect = document.getElementById('planType');

      if (planFarmerSelect && planSuggestions && suggestionList) {
        planFarmerSelect.addEventListener('change', function() {
          var farmerId = planFarmerSelect.value;
          if (!farmerId) { planSuggestions.style.display = 'none'; return; }

          var farmer = AgriCore.mockFarmers.find(function(f) { return f.id === farmerId; });
          if (!farmer) return;

          var suggestions = AgriCore.generatePlanSuggestions(farmer);
          if (suggestions.length === 0) { planSuggestions.style.display = 'none'; return; }

          planSuggestions.style.display = 'block';
          suggestionList.innerHTML = suggestions.map(function(s) {
            return '<div class="suggestion-item" data-plan="' + escape(s.plan) + '">' +
              '<span class="suggestion-check">\u2714</span> ' +
              '<span class="suggestion-plan">' + escape(s.plan) + '</span>' +
              '<span class="suggestion-reason">' + escape(s.reason) + '</span></div>';
          }).join('');

          suggestionList.querySelectorAll('.suggestion-item').forEach(function(item) {
            item.addEventListener('click', function() {
              var plan = item.dataset.plan;
              if (planTypeSelect) {
                var options = Array.from(planTypeSelect.options);
                var match = options.find(function(o) { return o.value && plan.toLowerCase().includes(o.value.toLowerCase().split(' ')[0]); });
                if (match) planTypeSelect.value = match.value;
              }
            });
          });

          lucide.createIcons();
        });
      }

      // Generate plan button
      var generatePlanBtn = document.getElementById('generatePlanBtn');
      if (generatePlanBtn) {
        generatePlanBtn.addEventListener('click', function() {
          var farmerId = document.getElementById('planFarmer').value;
          var type = document.getElementById('planType').value;
          var budget = document.getElementById('planBudget').value;
          var objectives = document.getElementById('planObjectives').value.trim();
          var timeline = document.getElementById('planTimeline').value;

          if (!farmerId || !type) {
            AgriCore.showToast('Please select a farmer and plan type.', 'error');
            return;
          }

          var farmer = AgriCore.mockFarmers.find(function(f) { return f.id === farmerId; });
          var newPlan = {
            id: 'PLN-' + String(AgriCore.mockPlans.length + 1).padStart(3, '0'),
            farmerId: farmerId,
            farmerName: farmer ? farmer.name : 'Unknown',
            type: type,
            createdBy: ctx.user.name,
            createdByRole: 'government',
            created: new Date().toISOString().split('T')[0],
            budget: budget || 0,
            status: 'Pending',
            objectives: objectives,
            timeline: timeline,
            approvalStatus: 'Pending',
            approvedDate: null
          };

          AgriCore.mockPlans.push(newPlan);
          if (window.populatePlansTable) window.populatePlansTable();
          AgriCore.showToast('Support plan generated successfully!', 'success');
          ctx.closeModal('createPlanModal');

          // Reset form
          document.getElementById('planFarmer').value = '';
          document.getElementById('planType').value = '';
          document.getElementById('planObjectives').value = '';
          document.getElementById('planBudget').value = '';
          document.getElementById('planNotes').value = '';
        });
      }
    }
  });
})();
