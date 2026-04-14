/* ============================================
   AgriCore — Tasks & Calendar Panel (Advisor)
   Task management with calendar-style view.
   Uses real API: /api/tasks
   ============================================ */
(function() {
  'use strict';
  window.AgriPanels = window.AgriPanels || [];

  window.AgriPanels.push({
    key: 'tasksCalendar',
    panelId: 'panel-tasks',

    getHTML: function() {
      return `
        <div class="section-header">
          <div>
            <h2 class="section-title">Tasks & Calendar</h2>
            <p style="color:var(--gray-500);font-size:.875rem;">Schedule visits, track workload, and manage tasks.</p>
          </div>
          <button class="btn btn-primary" id="newTaskBtn"><i data-lucide="plus"></i> Add Task</button>
        </div>

        <div class="overview-cards">
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon yellow"><i data-lucide="clock"></i></div></div>
            <div class="overview-card-value" id="taskPendingVal">--</div>
            <div class="overview-card-label">Pending</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon blue"><i data-lucide="loader"></i></div></div>
            <div class="overview-card-value" id="taskProgressVal">--</div>
            <div class="overview-card-label">In Progress</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon green"><i data-lucide="check-circle"></i></div></div>
            <div class="overview-card-value" id="taskCompletedVal">--</div>
            <div class="overview-card-label">Completed</div>
          </div>
          <div class="overview-card">
            <div class="overview-card-header"><div class="overview-card-icon red"><i data-lucide="alert-circle"></i></div></div>
            <div class="overview-card-value" id="taskOverdueVal">--</div>
            <div class="overview-card-label">Overdue</div>
          </div>
        </div>

        <!-- New Task Form (hidden) -->
        <div class="card" id="newTaskForm" style="display:none;">
          <h3 style="margin-bottom:12px;"><i data-lucide="clipboard-plus" style="width:18px;height:18px;"></i> New Task</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Title</label>
              <input type="text" id="taskTitle" class="form-input" placeholder="Task title" maxlength="200">
            </div>
            <div class="form-group">
              <label>Assign To</label>
              <select id="taskAssignee" class="form-input"><option value="">-- Select user --</option></select>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select id="taskPriority" class="form-input">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div class="form-group">
              <label>Deadline</label>
              <input type="datetime-local" id="taskDeadline" class="form-input">
            </div>
            <div class="form-group" style="grid-column:1/-1;">
              <label>Description</label>
              <textarea id="taskDescription" class="form-input" rows="3" placeholder="Task details..." maxlength="2000"></textarea>
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn btn-primary" id="submitTaskBtn"><i data-lucide="check"></i> Create Task</button>
            <button class="btn btn-ghost" id="cancelTaskBtn">Cancel</button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="farmers-toolbar" style="margin-top:16px;">
          <div class="filter-group">
            <button class="filter-btn active" data-task-filter="assigned">Assigned to Me</button>
            <button class="filter-btn" data-task-filter="created">Created by Me</button>
          </div>
        </div>

        <!-- Task List -->
        <div id="taskListLoader"></div>
        <div id="taskList"></div>
      `;
    },

    init: function(ctx) {
      var escape = AgriCore.escapeHtml;
      var tasks = [];
      var currentView = 'assigned';

      // Load users for assignee dropdown
      function loadAssigneeOptions() {
        // Use the user endpoint or farmers list
        AgriCore.apiGet('/farmers?page=1&limit=200').then(function(res) {
          if (!res.success || !res.data) return;
          var farmers = res.data.data || res.data;
          var sel = document.getElementById('taskAssignee');
          if (!sel) return;

          // Add self first
          var selfOpt = document.createElement('option');
          selfOpt.value = ctx.user.id;
          selfOpt.textContent = ctx.user.name + ' (Me)';
          sel.appendChild(selfOpt);

          farmers.forEach(function(f) {
            if (f.user_id && f.user_id !== ctx.user.id) {
              var opt = document.createElement('option');
              opt.value = f.user_id;
              opt.textContent = f.name;
              sel.appendChild(opt);
            }
          });
        });
      }

      function loadTasks(view) {
        var loader = document.getElementById('taskListLoader');
        if (loader) AgriCore.showLoading(loader);

        var endpoint = view === 'created' ? '/tasks/created' : '/tasks/assigned';

        AgriCore.apiGet(endpoint).then(function(res) {
          if (loader) loader.innerHTML = '';

          if (!res.success || !res.data) {
            tasks = [];
          } else {
            tasks = Array.isArray(res.data) ? res.data : (res.data.data || []);
          }

          renderStats();
          renderTaskList();
        });
      }

      function renderStats() {
        var now = new Date();
        var pending = 0, progress = 0, completed = 0, overdue = 0;

        tasks.forEach(function(t) {
          if (t.status === 'pending') pending++;
          else if (t.status === 'in_progress') progress++;
          else if (t.status === 'completed') completed++;

          if (t.deadline && t.status !== 'completed' && t.status !== 'cancelled') {
            if (new Date(t.deadline) < now) overdue++;
          }
        });

        var el1 = document.getElementById('taskPendingVal');
        var el2 = document.getElementById('taskProgressVal');
        var el3 = document.getElementById('taskCompletedVal');
        var el4 = document.getElementById('taskOverdueVal');
        if (el1) el1.textContent = pending;
        if (el2) el2.textContent = progress;
        if (el3) el3.textContent = completed;
        if (el4) el4.textContent = overdue;
      }

      function renderTaskList() {
        var list = document.getElementById('taskList');
        if (!list) return;

        if (tasks.length === 0) {
          list.innerHTML = '<div class="card"><p style="color:var(--gray-500);text-align:center;padding:24px;">No tasks found.</p></div>';
          return;
        }

        var now = new Date();

        list.innerHTML = tasks.map(function(t) {
          var deadlineStr = '';
          var isOverdue = false;
          if (t.deadline) {
            var dl = new Date(t.deadline);
            deadlineStr = dl.toLocaleDateString('en-ZA', { month:'short', day:'numeric', year:'numeric' });
            if (dl < now && t.status !== 'completed' && t.status !== 'cancelled') isOverdue = true;
          }

          var priorityColors = { low: 'badge-success', medium: 'badge-warning', high: 'badge-danger', urgent: 'badge-danger' };
          var statusColors = { pending: 'badge-warning', in_progress: 'badge-info', completed: 'badge-success', cancelled: 'badge-secondary' };
          var statusLabels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };

          return '<div class="card task-card' + (isOverdue ? ' task-overdue' : '') + '" data-task-id="' + escape(t.id) + '">' +
            '<div class="task-card-header">' +
              '<div>' +
                '<strong>' + escape(t.title) + '</strong>' +
                (t.description ? '<p class="task-desc">' + escape(t.description.substring(0, 120)) + (t.description.length > 120 ? '...' : '') + '</p>' : '') +
              '</div>' +
              '<div class="task-badges">' +
                '<span class="badge ' + (priorityColors[t.priority] || 'badge-warning') + '">' + escape(t.priority || 'medium') + '</span>' +
                '<span class="badge ' + (statusColors[t.status] || 'badge-warning') + '">' + (statusLabels[t.status] || t.status) + '</span>' +
              '</div>' +
            '</div>' +
            '<div class="task-card-footer">' +
              (deadlineStr ? '<span class="task-deadline' + (isOverdue ? ' overdue' : '') + '"><i data-lucide="calendar" style="width:12px;height:12px;"></i> ' + deadlineStr + (isOverdue ? ' (overdue)' : '') + '</span>' : '') +
              '<div class="task-actions">' +
                (t.status === 'pending' ? '<button class="btn btn-ghost btn-sm task-status-btn" data-id="' + escape(t.id) + '" data-status="in_progress">Start</button>' : '') +
                (t.status === 'in_progress' ? '<button class="btn btn-primary btn-sm task-status-btn" data-id="' + escape(t.id) + '" data-status="completed">Complete</button>' : '') +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        // Status change handlers
        list.querySelectorAll('.task-status-btn').forEach(function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var taskId = btn.dataset.id;
            var newStatus = btn.dataset.status;
            btn.disabled = true;
            btn.textContent = 'Updating...';

            AgriCore.apiPatch('/tasks/' + taskId + '/status', { status: newStatus }).then(function(res) {
              if (res.success) {
                AgriCore.showToast('Task updated!', 'success');
                loadTasks(currentView);
              } else {
                AgriCore.showToast(res.error || 'Failed to update task.', 'error');
                btn.disabled = false;
              }
            });
          });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
      }

      // Toggle form
      var newTaskBtn = document.getElementById('newTaskBtn');
      var newTaskForm = document.getElementById('newTaskForm');
      var cancelTaskBtn = document.getElementById('cancelTaskBtn');

      if (newTaskBtn) {
        newTaskBtn.addEventListener('click', function() {
          if (newTaskForm) newTaskForm.style.display = newTaskForm.style.display === 'none' ? 'block' : 'none';
          if (typeof lucide !== 'undefined') lucide.createIcons();
        });
      }
      if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', function() {
          if (newTaskForm) newTaskForm.style.display = 'none';
        });
      }

      // Submit task
      var submitTaskBtn = document.getElementById('submitTaskBtn');
      if (submitTaskBtn) {
        submitTaskBtn.addEventListener('click', function() {
          var title = document.getElementById('taskTitle').value.trim();
          var assignee = document.getElementById('taskAssignee').value;
          var priority = document.getElementById('taskPriority').value;
          var deadline = document.getElementById('taskDeadline').value;
          var description = document.getElementById('taskDescription').value.trim();

          if (!title) { AgriCore.showToast('Task title is required.', 'error'); return; }
          if (!assignee) { AgriCore.showToast('Please select an assignee.', 'error'); return; }

          submitTaskBtn.disabled = true;
          submitTaskBtn.textContent = 'Creating...';

          var body = {
            title: title,
            assigned_to: assignee,
            priority: priority
          };
          if (deadline) body.deadline = new Date(deadline).toISOString();
          if (description) body.description = description;

          AgriCore.apiPost('/tasks', body).then(function(res) {
            submitTaskBtn.disabled = false;
            submitTaskBtn.textContent = 'Create Task';

            if (res.success) {
              AgriCore.showToast('Task created!', 'success');
              if (newTaskForm) newTaskForm.style.display = 'none';
              document.getElementById('taskTitle').value = '';
              document.getElementById('taskDescription').value = '';
              loadTasks(currentView);
            } else {
              AgriCore.showToast(res.error || 'Failed to create task.', 'error');
            }
          });
        });
      }

      // Filter tabs
      document.querySelectorAll('[data-task-filter]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('[data-task-filter]').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          currentView = btn.dataset.taskFilter;
          loadTasks(currentView);
        });
      });

      // Initial load
      loadAssigneeOptions();
      loadTasks('assigned');
    }
  });
})();
